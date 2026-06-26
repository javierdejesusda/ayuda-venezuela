-- Zone clustering schema and trigger.
-- Creates the three secret infrastructure tables (zone_clusters,
-- zone_cluster_members, zone_updates), the haversine helper, and the
-- AFTER INSERT trigger that assigns every new location to a cluster.
--
-- DEPLOY NOTE: run `supabase db push --linked` at deploy time to apply this
-- migration to the production database.
--
-- SECURITY MODEL: all three tables are RLS-enabled with NO policies (deny all
-- direct access) and REVOKE'd from anon/authenticated/public. Cluster data is
-- intentionally NOT added to the supabase_realtime publication because Realtime
-- broadcasts every column of subscribed tables to all connected clients and
-- cluster internals must stay private. See memory note "Realtime broadcasts all
-- columns" for background.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Canonical cluster record; one row per group of co-located zone reports.
-- ON DELETE SET NULL keeps the cluster alive for remaining members when its
-- canonical location is deleted (e.g. via `npm run delete-report`). The PR11
-- loader must tolerate a null canonical_location_id and re-elect a surviving
-- member. Do NOT use ON DELETE CASCADE here - that would nuke the whole
-- cluster when a single duplicate is removed.
CREATE TABLE public.zone_clusters (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_location_id uuid        REFERENCES public.locations(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Many-to-many membership: which locations belong to which cluster.
CREATE TABLE public.zone_cluster_members (
  cluster_id  uuid REFERENCES public.zone_clusters(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id)     ON DELETE CASCADE,
  PRIMARY KEY (cluster_id, location_id)
);

-- Audit log of significant events within a cluster.
CREATE TABLE public.zone_updates (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid        REFERENCES public.zone_clusters(id) ON DELETE CASCADE,
  kind       text        NOT NULL
               CHECK (kind IN ('report_added', 'status_changed', 'merged_duplicate')),
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.zone_cluster_members (location_id);
CREATE INDEX ON public.zone_updates (cluster_id, created_at);

-- RLS lock: no policies = deny all direct access. All reads go through
-- SECURITY DEFINER functions (PR11 adds those loaders).
ALTER TABLE public.zone_clusters       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_cluster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_updates        ENABLE ROW LEVEL SECURITY;

-- Strip every direct-access grant. Anon, authenticated, and public roles
-- have zero access to these tables.
REVOKE ALL ON public.zone_clusters        FROM anon, authenticated, public;
REVOKE ALL ON public.zone_cluster_members FROM anon, authenticated, public;
REVOKE ALL ON public.zone_updates         FROM anon, authenticated, public;

-- Intentionally NOT added to the supabase_realtime publication. Realtime
-- broadcasts every column of subscribed tables to all connected clients;
-- cluster internals must stay private. (Mirrors report_throttle pattern.)

-- Haversine distance in meters between two WGS-84 points.
-- Mirrors lib/data/clustering.ts haversineMeters(); keep thresholds in sync.
CREATE OR REPLACE FUNCTION public.zone_distance_m(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 2 * 6371000 * asin(
    sqrt(
      pow(sin(radians(lat2 - lat1) / 2), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) *
      pow(sin(radians(lng2 - lng1) / 2), 2)
    )
  )
$$;

-- Trigger function: assigns every newly inserted location to an existing
-- matching cluster or creates a new one. Clustering failure is fail-open so a
-- report always saves even if the clustering step errors internally.
--
-- Thresholds mirror lib/data/clustering.ts:
--   PROXIMITY_RADIUS_M        = 150 m
--   NAME_SIMILARITY_THRESHOLD = 0.3
CREATE OR REPLACE FUNCTION public.assign_zone_cluster()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cluster  uuid;
  v_new_clus uuid;
BEGIN
  -- Find the closest already-clustered location that is both within 150 m
  -- and name-similar (pg_trgm similarity >= 0.3).
  -- Null coordinates on either side mean no proximity match is possible.
  SELECT zcm.cluster_id
    INTO v_cluster
    FROM zone_cluster_members zcm
    JOIN locations l ON l.id = zcm.location_id
   WHERE NEW.lat  IS NOT NULL
     AND NEW.lng  IS NOT NULL
     AND l.lat    IS NOT NULL
     AND l.lng    IS NOT NULL
     AND zone_distance_m(NEW.lat, NEW.lng, l.lat, l.lng) <= 150
     AND similarity(NEW.nombre, l.nombre) >= 0.3
   ORDER BY zone_distance_m(NEW.lat, NEW.lng, l.lat, l.lng) ASC
   LIMIT 1;

  IF v_cluster IS NOT NULL THEN
    -- Merge into existing cluster.
    INSERT INTO zone_cluster_members (cluster_id, location_id)
      VALUES (v_cluster, NEW.id);

    INSERT INTO zone_updates (cluster_id, kind, note)
      VALUES (v_cluster, 'merged_duplicate',
              'Reporte agrupado con un grupo existente: ' || v_cluster::text);

    UPDATE zone_clusters
       SET updated_at = now()
     WHERE id = v_cluster;
  ELSE
    -- Start a new cluster for this location.
    INSERT INTO zone_clusters (canonical_location_id)
      VALUES (NEW.id)
      RETURNING id INTO v_new_clus;

    INSERT INTO zone_cluster_members (cluster_id, location_id)
      VALUES (v_new_clus, NEW.id);

    INSERT INTO zone_updates (cluster_id, kind, note)
      VALUES (v_new_clus, 'report_added',
              'Nuevo grupo creado para la ubicación: ' || NEW.id::text);
  END IF;

  RETURN NEW;

EXCEPTION WHEN others THEN
  -- Fail-open: a clustering error must never block the location insert.
  -- The report is saved; clustering can be repaired by a later maintenance job.
  RETURN NEW;
END;
$$;

CREATE TRIGGER assign_zone_cluster_after_insert
  AFTER INSERT ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_zone_cluster();
