/**
 * Import public relief data from ayudaparavenezuela.com into our schema.
 * collection_centers -> locations (centro de acopio) + needs (one per supply).
 * help_points -> locations (punto que necesita ayuda) + needs (one per item).
 *
 * Source is a read-only public Supabase project; only GET requests are issued.
 * Idempotent via source_ref (ayudapara:center:<id> / ayudapara:point:<id>).
 * Non-Venezuela records (7 Colombia + 2 Spain centers) are skipped and counted.
 *
 * Credentials:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   - our project (write target, skip in --dry-run)
 *   AYUDAPARA_URL  (default: https://yqcwttcbweqicdyfwseb.supabase.co/rest/v1)
 *   AYUDAPARA_KEY  (default: publishable anon key for ayudaparavenezuela.com)
 *
 * Usage:
 *   node --env-file=.env.local scripts/import-ayudapara.mjs --dry-run
 *   node --env-file=.env.local scripts/import-ayudapara.mjs --dry-run --limit 5
 *   node --env-file=.env.local scripts/import-ayudapara.mjs
 */
import { createClient } from '@supabase/supabase-js';

import { mapCenter, mapHelpPoint } from './ayudapara-transform.mjs';

const DEFAULT_AYUDAPARA_URL = 'https://yqcwttcbweqicdyfwseb.supabase.co/rest/v1';
const DEFAULT_AYUDAPARA_KEY = 'sb_publishable_AtK5TeQlbB7N4M2o_YcaaQ_3ly_BeAQ';

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

async function fetchSourceTable(tableName) {
  const baseUrl = process.env.AYUDAPARA_URL ?? DEFAULT_AYUDAPARA_URL;
  const key = process.env.AYUDAPARA_KEY ?? DEFAULT_AYUDAPARA_KEY;
  const url = `${baseUrl}/${tableName}?select=*`;
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`source fetch ${tableName} ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function upsertLocation(supabase, location, sourceRef, { dryRun }) {
  if (dryRun) {
    return { status: 'dry-run', id: null };
  }

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
      zona: null,
      lat: location.lat,
      lng: location.lng,
      accuracy_m: null,
      status: location.status,
      acepta_voluntarios: location.acepta_voluntarios ?? false,
      descripcion: location.descripcion ?? null,
      contacto_nombre: location.contactoNombre ?? null,
      contacto_telefono: location.contactoTelefono ?? null,
      fotos: location.fotos ?? [],
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

async function upsertNeed(supabase, need, needSourceRef, locationId, { dryRun }) {
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
    cantidad: null,
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

  let supabase = null;
  if (!args.dryRun) {
    supabase = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );
  }

  console.error(`Fetching source data from ayudaparavenezuela.com${args.dryRun ? ' [DRY RUN]' : ''}...`);

  const [allCenters, allPoints] = await Promise.all([
    fetchSourceTable('collection_centers'),
    fetchSourceTable('help_points'),
  ]);

  const end = (arr) =>
    args.limit != null ? args.offset + args.limit : arr.length;

  const centers = allCenters.slice(args.offset, end(allCenters));
  const points = allPoints.slice(args.offset, end(allPoints));

  console.error(
    `centers: ${centers.length} (of ${allCenters.length}), ` +
      `points: ${points.length} (of ${allPoints.length})`,
  );

  const summary = {
    centersInserted: 0,
    centersSkipped: 0,
    pointsInserted: 0,
    pointsSkipped: 0,
    needsInserted: 0,
    needsSkipped: 0,
    skippedNonVE: 0,
    failed: 0,
  };

  await pool(centers, args.concurrency, async (row) => {
    const mapped = mapCenter(row);
    if (!mapped) {
      summary.skippedNonVE += 1;
      return;
    }

    try {
      const locResult = await upsertLocation(supabase, mapped.location, mapped.sourceRef, args);

      if (locResult.status === 'dry-run') {
        summary.centersInserted += 1;
        console.error(
          `  ~ center "${row.name}" -> ${mapped.location.estado} / ${row.supply_types?.join(', ')}`,
        );
      } else if (locResult.status === 'inserted') {
        summary.centersInserted += 1;
        console.error(`  + center ${locResult.id}  "${row.name}"`);
      } else {
        summary.centersSkipped += 1;
        return;
      }

      const locationId = locResult.id;
      for (let i = 0; i < mapped.needs.length; i += 1) {
        const needResult = await upsertNeed(
          supabase,
          mapped.needs[i],
          mapped.needSourceRefs[i],
          locationId,
          args,
        );
        if (needResult.status === 'inserted' || needResult.status === 'dry-run') {
          summary.needsInserted += 1;
        } else {
          summary.needsSkipped += 1;
        }
      }
    } catch (err) {
      summary.failed += 1;
      console.error(`  ! CENTER FAILED "${row?.name}" (${row?.id}): ${err.message}`);
    }
  });

  await pool(points, args.concurrency, async (row) => {
    const mapped = mapHelpPoint(row);
    if (!mapped) {
      summary.skippedNonVE += 1;
      return;
    }

    try {
      const locResult = await upsertLocation(supabase, mapped.location, mapped.sourceRef, args);

      if (locResult.status === 'dry-run') {
        summary.pointsInserted += 1;
        console.error(`  ~ point "${row.name}" -> ${mapped.location.estado}`);
      } else if (locResult.status === 'inserted') {
        summary.pointsInserted += 1;
        console.error(`  + point ${locResult.id}  "${row.name}"`);
      } else {
        summary.pointsSkipped += 1;
        return;
      }

      const locationId = locResult.id;
      for (let i = 0; i < mapped.needs.length; i += 1) {
        const needResult = await upsertNeed(
          supabase,
          mapped.needs[i],
          mapped.needSourceRefs[i],
          locationId,
          args,
        );
        if (needResult.status === 'inserted' || needResult.status === 'dry-run') {
          summary.needsInserted += 1;
        } else {
          summary.needsSkipped += 1;
        }
      }
    } catch (err) {
      summary.failed += 1;
      console.error(`  ! POINT FAILED "${row?.name}" (${row?.id}): ${err.message}`);
    }
  });

  console.log(JSON.stringify(summary));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
