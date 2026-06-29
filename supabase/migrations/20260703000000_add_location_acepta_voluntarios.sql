-- Structured "accepts volunteers" flag for locations. Previously this only
-- existed as free text inside descripcion for imported collection centers, so
-- it was not filterable. NOT NULL DEFAULT false keeps every existing row well
-- defined and lets the map/list filter rely on a real boolean.
--
-- DEPLOY NOTE: run `supabase db push --linked` at deploy time to apply this to
-- the production database (prod does not auto-apply migrations).
alter table public.locations
  add column if not exists acepta_voluntarios boolean not null default false;
