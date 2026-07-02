/**
 * Shared environment helpers for the data-import/rollback scripts. Every
 * importer and rollback reads Supabase credentials the same way, so this
 * lives in one place instead of being copy-pasted per script.
 */

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

/**
 * Resolves the write-target Supabase key: prefers the modern secret-key
 * naming (mirrors SUPABASE_SECRET_KEY used by the app server), falling back
 * to the legacy service_role env var. Uses a truthy check, not `??`, so an
 * empty SUPABASE_SECRET_KEY= does not shadow a valid fallback.
 */
export function requireServiceKey() {
  return process.env.SUPABASE_SECRET_KEY || requireEnv('SUPABASE_SERVICE_ROLE_KEY');
}
