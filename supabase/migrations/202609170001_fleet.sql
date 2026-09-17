-- ACC BAU Tools • Pojazdy v1
-- Additive migration: does NOT alter the existing tools/settings/history tables.
-- Run against a backed-up staging copy first. Never create USING (true) policies for these tables.
BEGIN;

CREATE TABLE IF NOT EXISTS public.acc_fleet_members (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (length(trim(display_name)) BETWEEN 2 AND 150),
  role text NOT NULL CHECK (role IN ('admin','worker')) DEFAULT 'worker',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.acc_fleet_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS acc_fleet_registration_unique
  ON public.acc_fleet_vehicles ((regexp_replace(upper(data->>'registration'), '[^A-Z0-9]', '', 'g')))
  WHERE coalesce(data->>'registration','') <> '' AND coalesce(data->>'status','') <> 'archived';
CREATE UNIQUE INDEX IF NOT EXISTS acc_fleet_vin_unique
  ON public.acc_fleet_vehicles ((upper(data->>'vin'))) WHERE coalesce(data->>'vin','') <> '';
CREATE UNIQUE INDEX IF NOT EXISTS acc_fleet_number_unique
  ON public.acc_fleet_vehicles ((upper(data->>'fleetNumber'))) WHERE coalesce(data->>'fleetNumber','') <> '';
CREATE INDEX IF NOT EXISTS acc_fleet_driver ON public.acc_fleet_vehicles ((data->>'driverId'));

CREATE TABLE IF NOT EXISTS public.acc_fleet_events (
  id uuid PRIMARY KEY,
  vehicle_id uuid NOT NULL REFERENCES public.acc_fleet_vehicles(id) ON DELETE RESTRICT,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind text NOT NULL,
  occurred_on date NOT NULL,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS acc_fleet_events_timeline ON public.acc_fleet_events(vehicle_id, occurred_on DESC, created_at DESC);
CREATE TABLE IF NOT EXISTS public.acc_fleet_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.acc_fleet_vehicles(id) ON DELETE RESTRICT,
  storage_path text NOT NULL UNIQUE,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('photo','damage','invoice','document')),
  mime text NOT NULL CHECK (mime IN ('application/pdf','image/jpeg','image/png','image/webp')),
  bytes integer NOT NULL CHECK (bytes BETWEEN 1 AND 12582912),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.acc_fleet_events(id) ON DELETE RESTRICT,
  ready boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS acc_fleet_files_vehicle ON public.acc_fleet_files(vehicle_id, created_at DESC);

ALTER TABLE public.acc_fleet_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acc_fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acc_fleet_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acc_fleet_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.acc_fleet_members, public.acc_fleet_vehicles, public.acc_fleet_events, public.acc_fleet_files FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acc_fleet_members, public.acc_fleet_vehicles, public.acc_fleet_events, public.acc_fleet_files TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('acc-fleet-private', 'acc-fleet-private', false, 12582912, ARRAY['application/pdf','image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;
-- Protect this private bucket even when legacy broad storage policies already exist.
DROP POLICY IF EXISTS acc_fleet_block_direct_storage ON storage.objects;
CREATE POLICY acc_fleet_block_direct_storage ON storage.objects AS RESTRICTIVE
  FOR ALL TO anon, authenticated
  USING (bucket_id <> 'acc-fleet-private') WITH CHECK (bucket_id <> 'acc-fleet-private');

CREATE OR REPLACE FUNCTION public.acc_fleet_commit(
  p_vehicle_id uuid,
  p_expected_version integer,
  p_data jsonb,
  p_event jsonb,
  p_actor_id uuid,
  p_operation_id uuid,
  p_void_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v public.acc_fleet_vehicles%ROWTYPE;
  m public.acc_fleet_members%ROWTYPE;
  prior public.acc_fleet_events%ROWTYPE;
  event_data jsonb;
  file_id uuid;
  affected integer;
  event_kind text := p_event->>'kind';
BEGIN
  SELECT * INTO m FROM public.acc_fleet_members WHERE user_id = p_actor_id AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'FLEET_FORBIDDEN'; END IF;
  IF octet_length(p_data::text) > 500000 OR octet_length(p_event::text) > 100000 THEN RAISE EXCEPTION 'FLEET_PAYLOAD_TOO_LARGE'; END IF;
  -- Includes creation (no existing row), serializes simultaneous updates of this vehicle.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_vehicle_id::text, 0));
  SELECT * INTO prior FROM public.acc_fleet_events WHERE id = p_operation_id;
  IF FOUND THEN
    IF prior.vehicle_id <> p_vehicle_id OR prior.actor_id IS DISTINCT FROM p_actor_id OR prior.data->>'requestHash' IS DISTINCT FROM p_event->>'requestHash' THEN
      RAISE EXCEPTION 'FLEET_OPERATION_CONFLICT';
    END IF;
    SELECT * INTO v FROM public.acc_fleet_vehicles WHERE id = p_vehicle_id;
    RETURN to_jsonb(v);
  END IF;
  SELECT * INTO v FROM public.acc_fleet_vehicles WHERE id = p_vehicle_id FOR UPDATE;
  IF NOT FOUND THEN
    IF p_expected_version <> 0 OR m.role <> 'admin' OR event_kind <> 'created' THEN RAISE EXCEPTION 'FLEET_CONFLICT'; END IF;
    INSERT INTO public.acc_fleet_vehicles(id, data) VALUES (p_vehicle_id, p_data) RETURNING * INTO v;
  ELSE
    IF v.version <> p_expected_version THEN RAISE EXCEPTION 'FLEET_CONFLICT'; END IF;
    IF m.role <> 'admin' THEN
      IF v.data->>'driverId' IS DISTINCT FROM p_actor_id::text OR event_kind NOT IN ('mileage','defect') OR p_void_id IS NOT NULL THEN
        RAISE EXCEPTION 'FLEET_FORBIDDEN';
      END IF;
      IF (p_data - ARRAY['mileage','mileageDate','hours','hoursDate','defects','status']) IS DISTINCT FROM
         (v.data - ARRAY['mileage','mileageDate','hours','hoursDate','defects','status']) THEN
        RAISE EXCEPTION 'FLEET_FORBIDDEN';
      END IF;
    END IF;
    UPDATE public.acc_fleet_vehicles SET data = p_data, version = version + 1, updated_at = now()
      WHERE id = p_vehicle_id RETURNING * INTO v;
  END IF;
  IF p_void_id IS NOT NULL THEN
    IF m.role <> 'admin' THEN RAISE EXCEPTION 'FLEET_FORBIDDEN'; END IF;
    UPDATE public.acc_fleet_events SET data = data || jsonb_build_object('voidedAt', now(), 'voidReason', p_event->>'note')
      WHERE id = p_void_id AND vehicle_id = p_vehicle_id
        AND kind IN ('service','repair','inspection','insurance','fuel','note')
        AND (data->>'voidedAt') IS NULL;
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 1 THEN RAISE EXCEPTION 'FLEET_VOID_CONFLICT'; END IF;
  END IF;
  event_data := p_event || jsonb_build_object('id',p_operation_id,'vehicleId',p_vehicle_id,
    'actorId',p_actor_id,'actorName',m.display_name,'createdAt',now());
  INSERT INTO public.acc_fleet_events(id,vehicle_id,actor_id,kind,occurred_on,data)
    VALUES (p_operation_id,p_vehicle_id,p_actor_id,event_kind,(p_event->>'occurredOn')::date,event_data);
  FOR file_id IN SELECT value::uuid FROM jsonb_array_elements_text(coalesce(p_event->'fileIds','[]'::jsonb)) LOOP
    UPDATE public.acc_fleet_files SET event_id = p_operation_id
      WHERE id = file_id AND vehicle_id = p_vehicle_id AND ready AND event_id IS NULL
        AND (m.role = 'admin' OR (created_by = p_actor_id AND kind IN ('photo','damage')));
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 1 THEN RAISE EXCEPTION 'FLEET_FILE_CONFLICT'; END IF;
  END LOOP;
  RETURN to_jsonb(v);
END;
$$;
REVOKE ALL ON FUNCTION public.acc_fleet_commit(uuid,integer,jsonb,jsonb,uuid,uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acc_fleet_commit(uuid,integer,jsonb,jsonb,uuid,uuid,uuid) TO service_role;
COMMIT;
