-- ACC BAU TOOLS • POJAZDY v1
-- ONLY new acc_fleet_* objects + one new PRIVATE storage bucket.
-- Does NOT write to tools, history, settings or existing Storage objects.
-- Run only in the SAME confirmed Supabase project as Tools, after a backup.
begin;

create table if not exists public.acc_fleet_schema (
  singleton boolean primary key default true check (singleton), version integer not null
);
insert into public.acc_fleet_schema(singleton, version) values (true, 1) on conflict do nothing;
do $$ begin
  if (select version from public.acc_fleet_schema where singleton) <> 1 then
    raise exception 'ACC_FLEET_SCHEMA_VERSION_MISMATCH';
  end if;
end $$;

create table if not exists public.acc_fleet_members (
  id uuid primary key default gen_random_uuid(), name text not null,
  name_key text generated always as (lower(btrim(name))) stored unique,
  pin_hash text not null, role text not null check (role in ('admin','worker')),
  active boolean not null default true, auth_version integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (length(name) between 1 and 160), check (length(pin_hash) > 30)
);
create table if not exists public.acc_fleet_vehicles (
  id uuid primary key, data jsonb not null check (jsonb_typeof(data) = 'object'),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists acc_fleet_active_plate_unique
  on public.acc_fleet_vehicles ((regexp_replace(upper(data->>'plate'), '[^A-Z0-9]', '', 'g')))
  where coalesce((data->>'archived')::boolean, false) = false;
create unique index if not exists acc_fleet_vin_unique
  on public.acc_fleet_vehicles ((upper(data->>'vin'))) where coalesce(data->>'vin','') <> '';
create table if not exists public.acc_fleet_events (
  id uuid primary key, vehicle_id uuid not null references public.acc_fleet_vehicles(id) on delete restrict,
  kind text not null, happened_on date not null, data jsonb not null,
  command_hash text not null, created_by text not null, created_at timestamptz not null default now()
);
create index if not exists acc_fleet_events_vehicle_idx on public.acc_fleet_events(vehicle_id, created_at, id);
create table if not exists public.acc_fleet_files (
  id uuid primary key, vehicle_id uuid not null references public.acc_fleet_vehicles(id) on delete restrict,
  event_id uuid references public.acc_fleet_events(id) on delete restrict,
  path text not null unique, name text not null, mime text not null,
  size bigint not null check (size > 0 and size <= 20971520),
  category text not null check (category in ('photo','invoice','document')),
  state text not null default 'pending' check (state in ('pending','ready')),
  sha256 text, created_by text not null, created_at timestamptz not null default now(),
  check (mime in ('image/jpeg','image/png','image/webp','application/pdf'))
);
create index if not exists acc_fleet_files_vehicle_idx on public.acc_fleet_files(vehicle_id, created_at);
create table if not exists public.acc_fleet_member_events (
  id uuid primary key default gen_random_uuid(), member_id uuid not null references public.acc_fleet_members(id) on delete restrict,
  actor text not null, action text not null, created_at timestamptz not null default now()
);
create table if not exists public.acc_fleet_login_attempts (
  key_hash text primary key, window_start timestamptz not null, attempts integer not null
);

-- Nothing in the new module is accessible with the browser's anon key.
-- Private backend routes explicitly authenticate every request.
alter table public.acc_fleet_schema enable row level security;
alter table public.acc_fleet_members enable row level security;
alter table public.acc_fleet_vehicles enable row level security;
alter table public.acc_fleet_events enable row level security;
alter table public.acc_fleet_files enable row level security;
alter table public.acc_fleet_member_events enable row level security;
alter table public.acc_fleet_login_attempts enable row level security;
revoke all on public.acc_fleet_schema, public.acc_fleet_members, public.acc_fleet_vehicles,
  public.acc_fleet_events, public.acc_fleet_files, public.acc_fleet_member_events,
  public.acc_fleet_login_attempts from anon, authenticated;
grant select, insert, update on public.acc_fleet_schema, public.acc_fleet_members,
  public.acc_fleet_vehicles, public.acc_fleet_files, public.acc_fleet_login_attempts to service_role;
grant select, insert on public.acc_fleet_events, public.acc_fleet_member_events to service_role;

-- Defence in depth: no hard deletion through this application, even with its server key.
create or replace function public.acc_fleet_keep_records() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin raise exception 'ACC_FLEET_RECORDS_ARE_RETAINED'; end $$;
do $$ declare n text; begin
  foreach n in array array['acc_fleet_vehicles','acc_fleet_files','acc_fleet_members'] loop
    if not exists (select 1 from pg_trigger where tgname = n || '_retain' and tgrelid = ('public.' || n)::regclass) then
      execute format('create trigger %I before delete on public.%I for each row execute function public.acc_fleet_keep_records()', n || '_retain', n);
    end if;
  end loop;
  foreach n in array array['acc_fleet_events','acc_fleet_member_events'] loop
    if not exists (select 1 from pg_trigger where tgname = n || '_immutable' and tgrelid = ('public.' || n)::regclass) then
      execute format('create trigger %I before update or delete on public.%I for each row execute function public.acc_fleet_keep_records()', n || '_immutable', n);
    end if;
  end loop;
end $$;

create or replace function public.acc_fleet_take_login_attempt(p_key text, p_limit integer)
returns boolean language plpgsql set search_path = public, pg_temp as $$
declare n integer;
begin
  insert into public.acc_fleet_login_attempts(key_hash, window_start, attempts)
  values (p_key, now(), 1)
  on conflict (key_hash) do update set
    window_start = case when acc_fleet_login_attempts.window_start < now() - interval '15 minutes' then now() else acc_fleet_login_attempts.window_start end,
    attempts = case when acc_fleet_login_attempts.window_start < now() - interval '15 minutes' then 1 else acc_fleet_login_attempts.attempts + 1 end
  returning attempts into n;
  return n <= p_limit;
end $$;

create or replace function public.acc_fleet_bootstrap_member(p_name text, p_hash text)
returns public.acc_fleet_members language plpgsql set search_path = public, pg_temp as $$
declare m public.acc_fleet_members;
begin
  perform pg_advisory_xact_lock(831972601);
  if exists(select 1 from public.acc_fleet_members) then raise exception 'ACC_FLEET_ALREADY_INITIALIZED'; end if;
  insert into public.acc_fleet_members(name, pin_hash, role) values (p_name, p_hash, 'admin') returning * into m;
  insert into public.acc_fleet_member_events(member_id, actor, action) values (m.id, m.name, 'bootstrap');
  return m;
end $$;

create or replace function public.acc_fleet_save_member(p_id uuid, p_name text, p_hash text, p_role text, p_active boolean, p_actor text)
returns public.acc_fleet_members language plpgsql set search_path = public, pg_temp as $$
declare m public.acc_fleet_members;
begin
  perform pg_advisory_xact_lock(831972601);
  if p_id is null then
    if p_hash is null then raise exception 'ACC_FLEET_PIN_REQUIRED'; end if;
    insert into public.acc_fleet_members(name, pin_hash, role, active) values (p_name, p_hash, p_role, p_active) returning * into m;
  else
    select * into m from public.acc_fleet_members where id = p_id for update;
    if not found then raise exception 'ACC_FLEET_NOT_FOUND'; end if;
    if m.role = 'admin' and m.active and (p_role <> 'admin' or not p_active)
       and (select count(*) from public.acc_fleet_members where role = 'admin' and active) <= 1
    then raise exception 'ACC_FLEET_LAST_ADMIN'; end if;
    -- Renaming would make old driver assignments ambiguous; names are immutable.
    if m.name <> p_name then raise exception 'ACC_FLEET_NAME_IMMUTABLE'; end if;
    update public.acc_fleet_members set pin_hash = coalesce(p_hash, pin_hash), role = p_role, active = p_active,
      auth_version = auth_version + 1, updated_at = now() where id = p_id returning * into m;
  end if;
  insert into public.acc_fleet_member_events(member_id, actor, action)
    values (m.id, p_actor, 'role=' || p_role || ';active=' || p_active || ';pin_changed=' || (p_hash is not null));
  return m;
end $$;

-- One transaction: compare version, update ONE vehicle, append ONE event, link files.
-- Idempotency protects against double clicks and retry after a network timeout.
create or replace function public.acc_fleet_apply_command(
  p_vehicle_id uuid, p_expected_version integer, p_command_id uuid, p_kind text,
  p_happened_on date, p_event_data jsonb, p_vehicle_data jsonb, p_actor text,
  p_command_hash text, p_file_ids uuid[] default '{}'
) returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare v public.acc_fleet_vehicles; e public.acc_fleet_events; file_count integer;
begin
  -- Serialize creates for the same UUID too (no existing row to lock).
  perform pg_advisory_xact_lock(hashtextextended(p_vehicle_id::text, 831972602));
  select * into e from public.acc_fleet_events where id = p_command_id;
  if found then
    if e.vehicle_id <> p_vehicle_id or e.command_hash <> p_command_hash or e.created_by <> p_actor
    then raise exception 'ACC_FLEET_IDEMPOTENCY_MISMATCH'; end if;
    select * into v from public.acc_fleet_vehicles where id = p_vehicle_id;
    return to_jsonb(v);
  end if;
  select * into v from public.acc_fleet_vehicles where id = p_vehicle_id for update;
  if not found then
    if p_expected_version <> 0 or p_kind <> 'created' then raise exception 'ACC_FLEET_CONFLICT'; end if;
    insert into public.acc_fleet_vehicles(id, data) values (p_vehicle_id, p_vehicle_data) returning * into v;
  else
    if v.version <> p_expected_version or p_kind = 'created' then raise exception 'ACC_FLEET_CONFLICT'; end if;
    update public.acc_fleet_vehicles set data = p_vehicle_data, version = version + 1, updated_at = now()
      where id = p_vehicle_id returning * into v;
  end if;
  if cardinality(p_file_ids) > 20 then raise exception 'ACC_FLEET_TOO_MANY_FILES'; end if;
  select count(*) into file_count from public.acc_fleet_files
    where id = any(p_file_ids) and vehicle_id = p_vehicle_id and state = 'ready' and event_id is null;
  if file_count <> cardinality(p_file_ids) then raise exception 'ACC_FLEET_INVALID_FILES'; end if;
  insert into public.acc_fleet_events(id, vehicle_id, kind, happened_on, data, created_by, command_hash)
    values (p_command_id, p_vehicle_id, p_kind, p_happened_on,
      p_event_data || jsonb_build_object('fileIds', to_jsonb(p_file_ids)), p_actor, p_command_hash);
  update public.acc_fleet_files set event_id = p_command_id where id = any(p_file_ids);
  return to_jsonb(v);
end $$;

revoke all on function public.acc_fleet_keep_records() from public, anon, authenticated;
revoke all on function public.acc_fleet_take_login_attempt(text, integer) from public, anon, authenticated;
revoke all on function public.acc_fleet_bootstrap_member(text, text) from public, anon, authenticated;
revoke all on function public.acc_fleet_save_member(uuid, text, text, text, boolean, text) from public, anon, authenticated;
revoke all on function public.acc_fleet_apply_command(uuid, integer, uuid, text, date, jsonb, jsonb, text, text, uuid[]) from public, anon, authenticated;
grant execute on function public.acc_fleet_take_login_attempt(text, integer) to service_role;
grant execute on function public.acc_fleet_bootstrap_member(text, text) to service_role;
grant execute on function public.acc_fleet_save_member(uuid, text, text, text, boolean, text) to service_role;
grant execute on function public.acc_fleet_apply_command(uuid, integer, uuid, text, date, jsonb, jsonb, text, text, uuid[]) to service_role;

-- Never makes any existing bucket public or changes its policies.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
  values ('acc-fleet-private-v1', 'acc-fleet-private-v1', false, 20971520,
          array['image/jpeg','image/png','image/webp','application/pdf']) on conflict (id) do nothing;
do $$ begin
  if exists(select 1 from storage.buckets where id = 'acc-fleet-private-v1' and public) then
    raise exception 'ACC_FLEET_BUCKET_MUST_BE_PRIVATE';
  end if;
end $$;
-- RESTRICTIVE policies protect this new bucket even if an old broad permissive
-- Storage policy exists. They do not change access to other buckets.
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='acc_fleet_private_guard_v1') then
    create policy acc_fleet_private_guard_v1 on storage.objects as restrictive for all to anon, authenticated
      using (bucket_id <> 'acc-fleet-private-v1') with check (bucket_id <> 'acc-fleet-private-v1');
  end if;
end $$;
commit;
