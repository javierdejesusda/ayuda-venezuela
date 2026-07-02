/**
 * Reverse the recolectavzla.com import, SCOPED to that source only. Deletes
 * every location whose `source_ref` starts with "recolecta:" and removes the
 * photos re-hosted under `fotos/recolecta/`. Needs attached to those locations
 * are removed by the on-delete-cascade FK. Organic rows and other imports
 * (terremotovenezuela.com, ayudaencamino.com) are never touched.
 *
 * Credentials from the environment: SUPABASE_URL, SUPABASE_SECRET_KEY (preferred, falls back to SUPABASE_SERVICE_ROLE_KEY).
 *
 * Usage:
 *   node --env-file=.env.local scripts/rollback-recolectavzla.mjs        # dry run
 *   node --env-file=.env.local scripts/rollback-recolectavzla.mjs --yes  # delete
 */
import { createClient } from '@supabase/supabase-js';
import { requireEnv, requireServiceKey } from './lib/env.mjs';

const BUCKET = 'fotos';
const PREFIX = 'recolecta';
const SOURCE_MATCH = 'recolecta:%';

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

  const { data: objects, error: listErr } = await supabase.storage
    .from(BUCKET)
    .list(PREFIX, { limit: 100000 });
  if (listErr) throw listErr;

  console.error(
    `recolectavzla locations to delete: ${locs.length} ` +
      `(needs ~${needCount}, cascade) / photos: ${objects.length}`,
  );

  if (!confirm) {
    console.error('Dry run. Re-run with --yes to delete.');
    console.log(
      JSON.stringify({ locations: locs.length, needs: needCount, photos: objects.length, deleted: false }),
    );
    return;
  }

  // Delete DB rows first: if this fails, photos are still intact and the run
  // is retryable. Removing storage first would orphan rows with missing photos.
  const { error: delErr } = await supabase
    .from('locations')
    .delete()
    .like('source_ref', SOURCE_MATCH);
  if (delErr) throw delErr;

  if (objects.length > 0) {
    const paths = objects.map((o) => `${PREFIX}/${o.name}`);
    const { error: rmErr } = await supabase.storage.from(BUCKET).remove(paths);
    if (rmErr) throw rmErr;
  }

  console.error(`Deleted ${locs.length} locations, ${needCount} needs (cascade), ${objects.length} photos.`);
  console.log(
    JSON.stringify({ locations: locs.length, needs: needCount, photos: objects.length, deleted: true }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
