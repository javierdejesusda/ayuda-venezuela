/**
 * Reverse the ayudaparavenezuela.com import, scoped to that source only.
 * Deletes locations whose source_ref starts with "ayudapara:" and the needs
 * that were cascade-deleted by the FK constraint.
 *
 * Organic rows and other imports (terremotovenezuela.com, recolectavzla.com,
 * ayudaencamino.com) are never touched.
 *
 * Credentials: SUPABASE_URL, SUPABASE_SECRET_KEY (preferred, falls back to SUPABASE_SERVICE_ROLE_KEY)
 *
 * Usage:
 *   node --env-file=.env.local scripts/rollback-ayudapara.mjs         # dry run
 *   node --env-file=.env.local scripts/rollback-ayudapara.mjs --yes   # delete
 */
import { createClient } from '@supabase/supabase-js';
import { requireEnv, requireServiceKey } from './lib/env.mjs';

import { SOURCE_PREFIX } from './ayudapara-transform.mjs';

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
    .like('source_ref', SOURCE_MATCH);
  if (locErr) throw locErr;

  const { count: needCount, error: needErr } = await supabase
    .from('needs')
    .select('*', { count: 'exact', head: true })
    .like('source_ref', SOURCE_MATCH);
  if (needErr) throw needErr;

  console.error(
    `ayudaparavenezuela locations to delete: ${locs.length} ` +
      `(needs ~${needCount}, cascade)`,
  );

  if (!confirm) {
    console.error('Dry run. Re-run with --yes to delete.');
    console.log(
      JSON.stringify({ locations: locs.length, needs: needCount, deleted: false }),
    );
    return;
  }

  const { error: delErr } = await supabase
    .from('locations')
    .delete()
    .like('source_ref', SOURCE_MATCH);
  if (delErr) throw delErr;

  console.error(`Deleted ${locs.length} locations, ~${needCount} needs (cascade).`);
  console.log(
    JSON.stringify({ locations: locs.length, needs: needCount, deleted: true }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
