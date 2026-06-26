-- Severity enum expansion and personas_atrapadas column.
-- Replaces the coarse 2-bucket damage model with a 5-value ordered enum
-- and adds a trapped-persons flag.
--
-- DEPLOY NOTE: run `supabase db push --linked` at deploy time to apply this
-- migration to the production database.

-- Drop old constraint so we can backfill and re-add with 5 values.
ALTER TABLE public.locations DROP CONSTRAINT locations_status_check;

-- Backfill: legacy 'danado' maps to 'dano_parcial' (the less severe bucket).
-- Never backfill to dano_grave or derrumbe - those require explicit reporting.
UPDATE public.locations SET status = 'dano_parcial' WHERE status = 'danado';

-- Re-add the check with the 5-value enum (ordered most-to-least critical).
ALTER TABLE public.locations
  ADD CONSTRAINT locations_status_check
  CHECK (status IN ('derrumbe', 'dano_grave', 'dano_parcial', 'desconocido', 'estable'));

-- Add the trapped-persons flag. NOT NULL with default so existing rows get a
-- safe value without a costly full-table update.
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS personas_atrapadas text NOT NULL DEFAULT 'no_se'
  CHECK (personas_atrapadas IN ('si', 'no', 'no_se'));

-- Re-create the set_location_status RPC with the updated IN-list so it
-- accepts the 5 new values and rejects the old 'danado' value.
CREATE OR REPLACE FUNCTION public.set_location_status(loc_id uuid, new_status text)
RETURNS public.locations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated public.locations;
BEGIN
  IF new_status NOT IN ('derrumbe', 'dano_grave', 'dano_parcial', 'desconocido', 'estable') THEN
    RAISE EXCEPTION 'estado de zona invalido: %', new_status;
  END IF;
  UPDATE public.locations
    SET status = new_status, updated_at = now()
    WHERE id = loc_id
    RETURNING * INTO updated;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  RETURN updated;
END;
$$;
