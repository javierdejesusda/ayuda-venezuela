-- Issue #54: close anon bulk-read of PII/exact coords and anon direct writes.
-- The server now uses SUPABASE_SECRET_KEY (service_role-equivalent) for ALL DB
-- access; anon loses direct table access. Realtime moves to a PII-free signal
-- table so we stop broadcasting every column of locations/needs to every browser.
--
-- DEPLOY ORDER (critical): set SUPABASE_SECRET_KEY in the server env AND deploy
-- the app code that uses it BEFORE applying this migration. Applying it while the
-- live app still reads with the anon key would take the site down.
--   supabase db push --linked   (or paste into the SQL editor)

-- 1) PII-free realtime signal: a singleton row bumped by triggers on writes.
CREATE TABLE IF NOT EXISTS public.realtime_signal (
  id smallint PRIMARY KEY DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT realtime_signal_singleton CHECK (id = 1)
);
INSERT INTO public.realtime_signal (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.realtime_signal ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "realtime_signal_select_public" ON public.realtime_signal;
CREATE POLICY "realtime_signal_select_public" ON public.realtime_signal FOR SELECT USING (true);
-- No INSERT/UPDATE policy: only the SECURITY DEFINER trigger below writes it.

CREATE OR REPLACE FUNCTION public.bump_realtime_signal() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.realtime_signal SET updated_at = now() WHERE id = 1;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS locations_bump_signal ON public.locations;
CREATE TRIGGER locations_bump_signal
  AFTER INSERT OR UPDATE OR DELETE ON public.locations
  FOR EACH STATEMENT EXECUTE FUNCTION public.bump_realtime_signal();
DROP TRIGGER IF EXISTS needs_bump_signal ON public.needs;
CREATE TRIGGER needs_bump_signal
  AFTER INSERT OR UPDATE OR DELETE ON public.needs
  FOR EACH STATEMENT EXECUTE FUNCTION public.bump_realtime_signal();

-- ALTER PUBLICATION ... ADD/DROP TABLE errors if the table is already/not a
-- member, which would abort the script here (each statement below auto-commits
-- individually) and skip the REVOKEs in step 3, leaving the vulnerability open.
-- Guard each one so a partial re-run (SQL editor retry, interrupted CLI push)
-- can still reach step 3.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'realtime_signal'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.realtime_signal;
  END IF;
END $$;

-- 2) Stop broadcasting locations/needs (every column) over realtime.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.locations;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'needs'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.needs;
  END IF;
END $$;

-- 3) Revoke anon direct read/write. RLS enabled + no SELECT/INSERT policy => anon
-- and authenticated get nothing; the secret (service_role) key bypasses RLS.
-- UPDATE was already locked to SECURITY DEFINER RPCs in 20260627000000.
DROP POLICY IF EXISTS "locations_select_public" ON public.locations;
DROP POLICY IF EXISTS "locations_insert_public" ON public.locations;
DROP POLICY IF EXISTS "needs_select_public" ON public.needs;
DROP POLICY IF EXISTS "needs_insert_public" ON public.needs;
REVOKE INSERT, SELECT ON public.locations FROM anon, authenticated;
REVOKE INSERT, SELECT ON public.needs FROM anon, authenticated;
