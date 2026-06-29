/**
 * Import Red H (AVAPRE) public relief data into our schema.
 *
 * Two resource types are fetched from https://api-redh.avapre.com/api/v1:
 *   - institutions (hospitals, clinics) -> `locations` rows
 *   - shelters (refugios) -> `locations` rows + `refugio` needs
 *
 * Persons are intentionally excluded: the /persons endpoint exposes living-
 * crisis PII (searchable by cedula) and must never be fetched or imported.
 * Emergency hotlines are also excluded as out of scope for the relief map.
 *
 * Idempotent: every row carries a source_ref (unique partial index) so
 * re-running or overlapping slices never duplicate records.
 *
 * Credentials from the environment (never committed):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node --env-file=.env.local scripts/import-redh.mjs --dry-run
 *   node --env-file=.env.local scripts/import-redh.mjs --limit 5 --dry-run
 *   node --env-file=.env.local scripts/import-redh.mjs
 */
import { createClient } from '@supabase/supabase-js';

import { mapInstitution, mapShelter } from './redh-transform.mjs';

const API_BASE = 'https://api-redh.avapre.com/api/v1';
const PAGE_SIZE = 200;
const PAGE_DELAY_MS = 500;

function parseArgs(argv) {
  const args = { limit: null, offset: 0, dryRun: false, concurrency: 4 };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--limit') args.limit = Number(argv[(i += 1)]);
    else if (a === '--offset') args.offset = Number(argv[(i += 1)]);
    else if (a === '--concurrency') args.concurrency = Number(argv[(i += 1)]);
  }
  return args;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`fetch ${path} ${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * Page through a paginated endpoint and return all rows.
 * The API wraps each response in { data: { <key>: [...] }, meta: { pagination } }.
 * When meta.pagination is absent or has_more is falsy, we stop paging.
 */
async function fetchAll(resource, key) {
  const rows = [];
  let offset = 0;
  while (true) {
    const body = await fetchJson(`/${resource}?limit=${PAGE_SIZE}&offset=${offset}`);
    const page = body?.data?.[key] ?? [];
    rows.push(...page);
    const hasMore = body?.meta?.pagination?.has_more;
    if (!hasMore || page.length === 0) break;
    offset += page.length;
    await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
  }
  return rows;
}

async function upsertLocation(supabase, location, sourceRef, { dryRun }) {
  if (dryRun) return { status: 'dry-run', id: null };

  const { data: existing, error: selErr } = await supabase
    .from('locations')
    .select('id')
    .eq('source_ref', sourceRef)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return { status: 'skipped', id: existing.id };

  const { data, error } = await supabase
    .from('locations')
    .insert({
      nombre: location.nombre,
      estado: location.estado,
      ciudad: location.ciudad,
      zona: location.zona ?? null,
      lat: location.lat,
      lng: location.lng,
      accuracy_m: null,
      status: location.status,
      descripcion: location.descripcion ?? null,
      contacto_nombre: location.contactoNombre ?? null,
      contacto_telefono: location.contactoTelefono ?? null,
      fotos: location.fotos,
      source_ref: sourceRef,
    })
    .select('id')
    .single();
  if (error) {
    if (error.code === '23505') {
      const { data: again } = await supabase
        .from('locations')
        .select('id')
        .eq('source_ref', sourceRef)
        .maybeSingle();
      if (again) return { status: 'skipped', id: again.id };
    }
    throw error;
  }
  return { status: 'inserted', id: data.id };
}

async function insertNeed(supabase, need, needSourceRef, locationId, { dryRun }) {
  if (dryRun) return { status: 'dry-run' };

  const { data: existing, error: selErr } = await supabase
    .from('needs')
    .select('id')
    .eq('source_ref', needSourceRef)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return { status: 'skipped' };

  const { error } = await supabase.from('needs').insert({
    location_id: locationId,
    categoria: need.categoria,
    descripcion: need.descripcion,
    cantidad: need.cantidad ?? null,
    urgencia: need.urgencia,
    status: need.status,
    source_ref: needSourceRef,
  });
  if (error) {
    if (error.code === '23505') return { status: 'skipped' };
    throw error;
  }
  return { status: 'inserted' };
}

async function pool(items, concurrency, mapper) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await mapper(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let supabase;
  if (!args.dryRun) {
    supabase = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );
  }

  console.error('Fetching institutions...');
  const allInstitutions = await fetchAll('institutions', 'institutions');
  console.error('Fetching shelters...');
  const allShelters = await fetchAll('shelters', 'shelters');

  const sliceByArgs = (rows) =>
    args.limit != null ? rows.slice(args.offset, args.offset + args.limit) : rows.slice(args.offset);
  const institutions = sliceByArgs(allInstitutions);
  const shelters = sliceByArgs(allShelters);

  console.error(
    `Institutions: ${institutions.length}; Shelters: ${shelters.length} ` +
      `(offset ${args.offset}, limit ${args.limit ?? 'all'})${args.dryRun ? ' [DRY RUN]' : ''}`,
  );

  const summary = {
    institutionsInserted: 0,
    institutionsSkipped: 0,
    sheltersInserted: 0,
    sheltersSkipped: 0,
    needsInserted: 0,
    needsSkipped: 0,
    skippedNonVE: 0,
    failed: 0,
  };

  await pool(institutions, args.concurrency, async (row) => {
    const mapped = mapInstitution(row);
    if (!mapped) {
      summary.skippedNonVE += 1;
      return;
    }
    try {
      const r = await upsertLocation(supabase, mapped.location, mapped.sourceRef, {
        dryRun: args.dryRun,
      });
      if (r.status === 'inserted') {
        summary.institutionsInserted += 1;
        console.error(`  + institution ${r.id}  ${row.official_name}`);
      } else if (r.status === 'skipped') {
        summary.institutionsSkipped += 1;
      } else if (r.status === 'dry-run') {
        console.error(
          `  ~ institution ${row.official_name} -> ${mapped.location.estado} / ${mapped.location.status}`,
        );
        summary.institutionsInserted += 1;
      }
    } catch (err) {
      summary.failed += 1;
      console.error(`  ! INSTITUTION FAILED ${row?.official_name} (${row?.uuid}): ${err.message}`);
    }
  });

  await pool(shelters, args.concurrency, async (row) => {
    const mapped = mapShelter(row);
    if (!mapped) {
      summary.skippedNonVE += 1;
      return;
    }
    try {
      const locResult = await upsertLocation(supabase, mapped.location, mapped.sourceRef, {
        dryRun: args.dryRun,
      });
      if (locResult.status === 'inserted') {
        summary.sheltersInserted += 1;
        console.error(`  + shelter ${locResult.id}  ${row.name}`);
      } else if (locResult.status === 'skipped') {
        summary.sheltersSkipped += 1;
      } else if (locResult.status === 'dry-run') {
        console.error(
          `  ~ shelter ${row.name} -> ${mapped.location.estado} / ${mapped.location.status}`,
        );
        summary.sheltersInserted += 1;
      }

      const locationId = locResult.id;
      if (locationId || args.dryRun) {
        const needResult = await insertNeed(
          supabase,
          mapped.need,
          mapped.needSourceRef,
          locationId,
          { dryRun: args.dryRun },
        );
        if (needResult.status === 'inserted' || needResult.status === 'dry-run') {
          summary.needsInserted += 1;
        } else if (needResult.status === 'skipped') {
          summary.needsSkipped += 1;
        }
      }
    } catch (err) {
      summary.failed += 1;
      console.error(`  ! SHELTER FAILED ${row?.name} (${row?.uuid}): ${err.message}`);
    }
  });

  console.log(JSON.stringify(summary));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
