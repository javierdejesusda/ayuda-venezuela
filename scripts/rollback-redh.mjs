/**
 * Reverse the Red H (AVAPRE) import, scoped to that source only. Deletes
 * every location whose source_ref starts with 'redh:'; the needs attached to
 * those locations are removed by the on-delete-cascade FK. Other imports and
 * organic rows are never touched.
 *
 * Credentials from the environment: SUPABASE_URL, SUPABASE_SECRET_KEY (preferred, falls back to SUPABASE_SERVICE_ROLE_KEY).
 *
 * Usage:
 *   node --env-file=.env.local scripts/rollback-redh.mjs        # dry run
 *   node --env-file=.env.local scripts/rollback-redh.mjs --yes  # delete
 */
import { createClient } from '@supabase/supabase-js';
import { requireEnv, requireServiceKey } from './lib/env.mjs';

import { SOURCE_PREFIX } from './redh-transform.mjs';

const SOURCE_MATCH = `${SOURCE_PREFIX}:%`;

async function main() {
  const confirm = process.argv.includes('--yes');
  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireServiceKey(),
    { auth: { persistSession: false } },
  );

  const { data: locs, error: locErr } = await supabase
    .from('locations')
    .select('id')
    .ilike('source_ref', SOURCE_MATCH);
  if (locErr) throw locErr;

  const { count: needCount, error: needErr } = await supabase
    .from('needs')
    .select('*', { count: 'exact', head: true })
    .ilike('source_ref', SOURCE_MATCH);
  if (needErr) throw needErr;

  console.error(`redh locations to delete: ${locs.length} (needs ~${needCount}, cascade)`);

  if (!confirm) {
    console.error('Dry run. Re-run with --yes to delete.');
    console.log(JSON.stringify({ locations: locs.length, needs: needCount, deleted: false }));
    return;
  }

  const { error: delErr } = await supabase
    .from('locations')
    .delete()
    .ilike('source_ref', SOURCE_MATCH);
  if (delErr) throw delErr;

  console.error(`Deleted ${locs.length} locations (and their needs by cascade).`);
  console.log(JSON.stringify({ locations: locs.length, needs: needCount, deleted: true }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
