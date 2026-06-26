-- Anonymous report rate limiting.
-- Creates a throttle table and a SECURITY DEFINER function that enforces a
-- sliding-window quota: at most 20 reports per hashed IP key per 10 minutes.
-- Anon clients have ZERO direct table access; the only entry point is the
-- function, which is fail-open (returns true on internal error so a legitimate
-- emergency report is never blocked by a DB outage).
--
-- DEPLOY NOTE: run `supabase db push --linked` at deploy time to apply this
-- migration to the production database.
-- Consider also scheduling a global pg_cron cleanup job at deploy time:
--   SELECT cron.schedule('throttle-cleanup', '*/10 * * * *',
--     $$DELETE FROM report_throttle WHERE created_at < now() - interval '10 minutes'$$);
-- This reclaims storage for abandoned keys between periodic requests.

-- Throttle key store. Rows are hashed-key + timestamp only; no raw IP is ever
-- stored. TTL is enforced by the function's window filter, not by row deletion.
CREATE TABLE public.report_throttle (
  key_hash   text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.report_throttle (key_hash, created_at);

-- Lock the table down completely. Anon and authenticated roles get no direct
-- access. All reads/writes go through check_report_quota (SECURITY DEFINER).
ALTER TABLE public.report_throttle ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.report_throttle FROM anon, authenticated, public;

-- Intentionally NOT added to the supabase_realtime publication. Realtime
-- broadcasts every column of subscribed tables to all connected clients;
-- throttle keys must stay private. (Same reasoning as the report-undo table
-- pattern described in the project memory.)

CREATE OR REPLACE FUNCTION public.check_report_quota(p_key_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hit_count integer;
BEGIN
  SELECT COUNT(*)
    INTO hit_count
    FROM public.report_throttle
   WHERE key_hash   = p_key_hash
     AND created_at > now() - interval '10 minutes'; -- mirrors REPORT_QUOTA_WINDOW_MS in lib/data/types.ts

  IF hit_count >= 20 THEN  -- mirrors REPORT_QUOTA_LIMIT in lib/data/types.ts; update both if changed
    RETURN false;
  END IF;

  -- Opportunistic per-key cleanup before inserting: bound row growth to the
  -- active window without a separate maintenance job.
  DELETE FROM public.report_throttle
   WHERE key_hash   = p_key_hash
     AND created_at <= now() - interval '10 minutes';

  INSERT INTO public.report_throttle (key_hash) VALUES (p_key_hash);
  RETURN true;

EXCEPTION WHEN others THEN
  -- Fail-open: never block a legitimate emergency report on an internal error.
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_report_quota(text) FROM public;
GRANT  EXECUTE ON FUNCTION public.check_report_quota(text) TO anon, authenticated;
