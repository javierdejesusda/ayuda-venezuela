-- Public report-removal requests (private moderation queue).
-- Anyone can REQUEST that a specific zone report be taken down (resolved,
-- duplicate, or wrong). This is a private queue the maintainer reviews out of
-- band; it never deletes anything by itself. Actual deletion stays manual via
-- `npm run delete-report`.
--
-- DEPLOY NOTE: run `supabase db push --linked` at deploy time to apply this
-- migration to the production database.
--
-- SECURITY MODEL: anon/public may INSERT a request only. There is NO select,
-- update, or delete policy, so RLS denies those operations for anon and
-- authenticated; only service_role (which bypasses RLS) can read the queue.
-- The table is intentionally NOT added to the supabase_realtime publication:
-- Realtime broadcasts every column of subscribed tables to all connected
-- clients, and these requests (which can carry an optional contact) must stay
-- private. Mirrors the report_throttle and zone_clusters patterns.

create extension if not exists "pgcrypto";

create table public.removal_requests (
  id          uuid        primary key default gen_random_uuid(),
  location_id uuid        not null references public.locations(id) on delete cascade,
  motivo      text        not null,
  contacto    text,
  created_at  timestamptz not null default now(),
  constraint removal_requests_motivo_len
    check (char_length(motivo) between 5 and 500),
  constraint removal_requests_contacto_len
    check (contacto is null or char_length(contacto) <= 120)
);

create index idx_removal_requests_location on public.removal_requests (location_id);

-- RLS: insert-only for anon/authenticated. The absence of select/update/delete
-- policies denies those operations under RLS. Data shape is enforced once, by
-- the table CHECK constraints above (which apply to every role); the policy only
-- grants the INSERT, so there is no duplicated length rule to keep in sync.
alter table public.removal_requests enable row level security;

create policy "removal_requests_insert_public"
  on public.removal_requests for insert
  with check (true);

-- Belt-and-suspenders on top of RLS: strip the default SELECT/UPDATE/DELETE
-- grants so the queue stays private even if a SELECT policy is ever added by
-- mistake. INSERT stays granted (anon must still submit; the app inserts WITHOUT
-- a representation, so no SELECT privilege is needed). Mirrors the private-table
-- convention used by report_throttle / zone_clusters.
revoke select, update, delete on public.removal_requests from anon, authenticated;

-- Intentionally NOT added to the supabase_realtime publication. Realtime
-- broadcasts every column of subscribed tables to all connected clients; the
-- removal queue must stay private. (Mirrors report_throttle / zone_clusters.)
