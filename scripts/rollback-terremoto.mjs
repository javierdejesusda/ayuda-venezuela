/**
 * Reverse the terremotovenezuela.com import, SCOPED to that source only: delete
 * every location whose `source_ref` points at terremotovenezuela.com and remove
 * the photos it re-hosted under `fotos/terremoto/`. Organic (user-submitted)
 * rows and other imports (e.g. ayudaencamino.com) are never touched.
 *
 * Credentials from the environment: SUPABASE_URL, SUPABASE_SECRET_KEY (preferred, falls back to SUPABASE_SERVICE_ROLE_KEY).
 *
 * Usage:
 *   node scripts/rollback-terremoto.mjs           # dry run (counts only)
 *   node scripts/rollback-terremoto.mjs --yes      # actually delete
 */
import { createClient } from '@supabase/supabase-js';
import { requireEnv, requireServiceKey } from './lib/env.mjs';

const BUCKET = 'fotos';
const PREFIX = 'terremoto';
const SOURCE_MATCH = '%terremotovenezuela.com%';

async function main() {
  const confirm = process.argv.includes('--yes');
  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireServiceKey(),
    { auth: { persistSession: false } },
  );

  const { data: rows, error: selErr } = await supabase
    .from('locations')
    .select('id')
    .ilike('source_ref', SOURCE_MATCH);
  if (selErr) throw selErr;
  console.error(`Imported locations to delete: ${rows.length}`);

  const { data: objects, error: listErr } = await supabase.storage.from(BUCKET).list(PREFIX, {
    limit: 100000,
  });
  if (listErr) throw listErr;
  console.error(`Re-hosted photos under ${BUCKET}/${PREFIX}/: ${objects.length}`);

  if (!confirm) {
    console.error('Dry run. Re-run with --yes to delete.');
    console.log(JSON.stringify({ locations: rows.length, photos: objects.length, deleted: false }));
    return;
  }

  // Delete DB rows first: a failed delete leaves both sides intact (retryable).
  // Removing storage first would orphan rows whose photos are already gone.
  const { error: delErr } = await supabase.from('locations').delete().ilike('source_ref', SOURCE_MATCH);
  if (delErr) throw delErr;

  if (objects.length > 0) {
    const paths = objects.map((o) => `${PREFIX}/${o.name}`);
    const { error: rmErr } = await supabase.storage.from(BUCKET).remove(paths);
    if (rmErr) throw rmErr;
  }

  console.error(`Deleted ${rows.length} locations and ${objects.length} photos.`);
  console.log(JSON.stringify({ locations: rows.length, photos: objects.length, deleted: true }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
