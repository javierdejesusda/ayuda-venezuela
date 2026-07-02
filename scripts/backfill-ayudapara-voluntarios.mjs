/**
 * One-time backfill of the acepta_voluntarios flag for already-imported
 * ayudaparavenezuela.com collection centers.
 *
 * The acepta_voluntarios column was added after the centers were imported, so
 * every existing ayudapara row defaults to false. A plain importer re-run SKIPS
 * existing rows (matched by source_ref) and never updates them, so this script
 * issues a targeted UPDATE keyed on source_ref to flip the centers whose source
 * accepts_volunteers is true.
 *
 * Only centers that should become true are updated. Centers that stay false are
 * left untouched on purpose: Realtime broadcasts every locations UPDATE to all
 * connected clients, so writing false -> false would spam every client with
 * hundreds of no-op updates.
 *
 * Help points are never updated: they carry no volunteer flag and stay false.
 *
 * Source is the same read-only public Supabase project the importer reads.
 * Idempotent: re-running sets the same true rows to true again (a no-op write
 * for already-true rows, but the set is small).
 *
 * Credentials:
 *   SUPABASE_URL, SUPABASE_SECRET_KEY (preferred, falls back to SUPABASE_SERVICE_ROLE_KEY) - our project (write target, skip in --dry-run)
 *   AYUDAPARA_URL  (default: https://yqcwttcbweqicdyfwseb.supabase.co/rest/v1)
 *   AYUDAPARA_KEY  (default: publishable anon key for ayudaparavenezuela.com)
 *
 * Usage:
 *   node --env-file=.env.local scripts/backfill-ayudapara-voluntarios.mjs --dry-run
 *   node --env-file=.env.local scripts/backfill-ayudapara-voluntarios.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { requireEnv, requireServiceKey } from './lib/env.mjs';

import { mapCenter } from './ayudapara-transform.mjs';

const DEFAULT_AYUDAPARA_URL = 'https://yqcwttcbweqicdyfwseb.supabase.co/rest/v1';
const DEFAULT_AYUDAPARA_KEY = 'sb_publishable_AtK5TeQlbB7N4M2o_YcaaQ_3ly_BeAQ';

function parseArgs(argv) {
  const args = { dryRun: false, concurrency: 4 };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--concurrency') args.concurrency = Number(argv[(i += 1)]);
  }
  return args;
}

async function fetchCenters() {
  const baseUrl = process.env.AYUDAPARA_URL ?? DEFAULT_AYUDAPARA_URL;
  const key = process.env.AYUDAPARA_KEY ?? DEFAULT_AYUDAPARA_KEY;
  const url = `${baseUrl}/collection_centers?select=*`;
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`source fetch collection_centers ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function pool(items, concurrency, mapper) {
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next;
      next += 1;
      await mapper(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let supabase = null;
  if (!args.dryRun) {
    supabase = createClient(
      requireEnv('SUPABASE_URL'),
      requireServiceKey(),
      { auth: { persistSession: false } },
    );
  }

  console.error(
    `Fetching collection_centers from ayudaparavenezuela.com${args.dryRun ? ' [DRY RUN]' : ''}...`,
  );
  const centers = await fetchCenters();
  console.error(`centers: ${centers.length}`);

  const summary = {
    updated: 0,
    wouldUpdate: 0,
    notFound: 0,
    skippedFalse: 0,
    skippedNonVE: 0,
    failed: 0,
  };

  await pool(centers, args.concurrency, async (row) => {
    const mapped = mapCenter(row);
    if (!mapped) {
      summary.skippedNonVE += 1;
      return;
    }
    if (mapped.location.acepta_voluntarios !== true) {
      summary.skippedFalse += 1;
      return;
    }

    if (args.dryRun) {
      summary.wouldUpdate += 1;
      console.error(`  ~ would set acepta_voluntarios=true: "${row.name}" (${mapped.sourceRef})`);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('locations')
        .update({ acepta_voluntarios: true })
        .eq('source_ref', mapped.sourceRef)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        summary.notFound += 1;
        console.error(`  ? not imported yet, skipped: "${row.name}" (${mapped.sourceRef})`);
        return;
      }
      summary.updated += 1;
      console.error(`  + set true ${data[0].id}  "${row.name}"`);
    } catch (err) {
      summary.failed += 1;
      console.error(`  ! FAILED "${row?.name}" (${row?.id}): ${err.message}`);
    }
  });

  console.log(JSON.stringify(summary));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
