-- Ejecuta este script en el SQL Editor de Supabase.

create extension if not exists "pgcrypto";

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age integer not null default 0,
  symptom text not null,
  temp numeric(4, 1) not null,
  fc integer not null,
  triage text not null check (triage in ('I', 'II', 'III', 'IV', 'V')),
  status text not null default 'En espera',
  created_at timestamptz not null default now()
);

create table if not exists public.patient_events (
  id bigint generated always as identity primary key,
  patient_id uuid references public.patients(id) on delete set null,
  patient_name text not null,
  action text not null,
  triage text,
  actor_email text,
  request_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'medico' check (role in ('admin', 'medico', 'recepcion', 'enfermeria')),
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  display_name text,
  phone text,
  department text,
  job_title text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  requested_name text;
begin
  requested_role := coalesce(nullif(trim(new.raw_user_meta_data->>'role'), ''), 'medico');
  if requested_role not in ('admin', 'medico', 'recepcion', 'enfermeria') then
    requested_role := 'medico';
  end if;

  requested_name := nullif(trim(new.raw_user_meta_data->>'display_name'), '');

  insert into public.profiles (id, email, role, display_name, status)
  values (new.id, new.email, requested_role, requested_name, 'pending')
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(excluded.display_name, public.profiles.display_name),
        role = excluded.role,
        status = coalesce(public.profiles.status, 'pending');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.patients enable row level security;
alter table public.patient_events enable row level security;
alter table public.profiles enable row level security;

-- Helpers RLS (SECURITY DEFINER evita recursión en políticas de profiles)
create or replace function public.is_approved_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$;

create or replace function public.is_profile_approved()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select status = 'approved' from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.current_user_has_role(allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select role = any (allowed_roles)
      from public.profiles
      where id = auth.uid() and status = 'approved'
    ),
    false
  );
$$;

grant execute on function public.is_approved_admin() to authenticated;
grant execute on function public.is_profile_approved() to authenticated;
grant execute on function public.current_user_has_role(text[]) to authenticated;

-- Endurecimiento de validaciones en capa de datos (A2-S1).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'patients_status_check'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_status_check
      check (status in ('En espera', 'En atención', 'Finalizado'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'patients_age_range_check'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_age_range_check
      check (age between 0 and 130);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'patients_temp_range_check'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_temp_range_check
      check (temp between 30 and 45);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'patients_fc_range_check'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_fc_range_check
      check (fc between 25 and 250);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'patients_name_not_blank_check'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_name_not_blank_check
      check (length(btrim(name)) > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'patients_symptom_not_blank_check'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_symptom_not_blank_check
      check (length(btrim(symptom)) > 0);
  end if;
end
$$;

create index if not exists patients_created_at_idx on public.patients (created_at desc);
create index if not exists patient_events_created_at_idx on public.patient_events (created_at desc);

drop policy if exists "Allow authenticated full access patients" on public.patients;
drop policy if exists "Patients read for authenticated users" on public.patients;
create policy "Patients read for authenticated users"
on public.patients
for select
to authenticated
using (public.is_profile_approved());

drop policy if exists "Patients insert by intake roles" on public.patients;
create policy "Patients insert by intake roles"
on public.patients
for insert
to authenticated
with check (
  public.current_user_has_role(array['admin', 'recepcion', 'enfermeria'])
);

drop policy if exists "Patients update by clinical roles" on public.patients;
create policy "Patients update by clinical roles"
on public.patients
for update
to authenticated
using (
  public.current_user_has_role(array['admin', 'medico', 'enfermeria'])
)
with check (
  public.current_user_has_role(array['admin', 'medico'])
  or (
    public.current_user_has_role(array['enfermeria'])
    and status <> 'Finalizado'
  )
);

drop policy if exists "Allow authenticated full access patient events" on public.patient_events;
drop policy if exists "Patient events read for authenticated users" on public.patient_events;
drop policy if exists "Patient events read for admin" on public.patient_events;
-- A3-S2: historial de auditoría solo consultable por administradores (alineado con ruta /audit).
create policy "Patient events read for admin"
on public.patient_events
for select
to authenticated
using (public.is_approved_admin());

drop policy if exists "Patient events insert for authenticated users" on public.patient_events;
drop policy if exists "Patient events insert by operational roles" on public.patient_events;
-- Inserción solo para roles que pueden generar eventos operativos (no invitados anónimos).
create policy "Patient events insert by operational roles"
on public.patient_events
for insert
to authenticated
with check (
  public.current_user_has_role(array['admin', 'medico', 'enfermeria', 'recepcion'])
);

drop policy if exists "Admin can read all profiles" on public.profiles;
drop policy if exists "User can read own profile" on public.profiles;
create policy "Profiles read own or admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_approved_admin());

drop policy if exists "Admin can update profiles for approval" on public.profiles;
create policy "Admin can update profiles for approval"
on public.profiles
for update
to authenticated
using (public.is_approved_admin())
with check (public.is_approved_admin());

drop policy if exists "User can update own profile" on public.profiles;
create policy "User can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Perfil de cuenta (nombre visible, contacto, área).
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists department text;
alter table public.profiles add column if not exists job_title text;

-- Proyectos ya creados: añade columna de actor si falta.
alter table public.patient_events add column if not exists actor_email text;
alter table public.patient_events add column if not exists request_id text;
-- PostgREST no admite upsert con índice único parcial; usar constraint UNIQUE (varios NULL permitidos).
drop index if exists public.patient_events_request_id_unique;
alter table public.patient_events drop constraint if exists patient_events_request_id_key;
alter table public.patient_events
  add constraint patient_events_request_id_key unique (request_id);

-- A5: triage ampliado, identificación, tiempos (llegada / primera atención), ingreso mínimo.
alter table public.patients add column if not exists arrived_at timestamptz;
alter table public.patients add column if not exists first_attention_at timestamptz;
alter table public.patients add column if not exists document_id text;
alter table public.patients add column if not exists sex text;
alter table public.patients add column if not exists phone text;
alter table public.patients add column if not exists companion text;
alter table public.patients add column if not exists allergies text;
alter table public.patients add column if not exists spo2 integer;
alter table public.patients add column if not exists pain integer;
alter table public.patients add column if not exists altered_consciousness boolean default false;
alter table public.patients add column if not exists respiratory_distress boolean default false;
alter table public.patients add column if not exists fast_track boolean default false;

alter table public.patients add column if not exists respiratory_rate integer;
alter table public.patients add column if not exists bp_systolic integer;
alter table public.patients add column if not exists bp_diastolic integer;
alter table public.patients add column if not exists religion text;
alter table public.patients add column if not exists blood_type text;

update public.patients
set arrived_at = coalesce(arrived_at, created_at)
where arrived_at is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'patients_spo2_range_check'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_spo2_range_check
      check (spo2 is null or (spo2 between 50 and 100));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'patients_pain_range_check'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_pain_range_check
      check (pain is null or (pain between 0 and 10));
  end if;
end
$$;

-- CTAS: proyectos existentes con solo I–III deben sustituir el check de triage.
alter table public.patients drop constraint if exists patients_triage_check;
alter table public.patients
  add constraint patients_triage_check
  check (triage in ('I', 'II', 'III', 'IV', 'V'));

-- CTAS clínico: sugerencia del sistema vs asignación del profesional (triage = asignado).
alter table public.patients add column if not exists triage_suggested text;
alter table public.patients add column if not exists triage_override_reason text;
alter table public.patients add column if not exists protocol_version text;
alter table public.patients add column if not exists chief_complaint_code text;
alter table public.patients add column if not exists ctas_red_flags text[] default '{}';

update public.patients
set triage_suggested = triage
where triage_suggested is null and triage is not null;

update public.patients
set protocol_version = 'ctas-triageia-2026-01'
where protocol_version is null;

alter table public.patients drop constraint if exists patients_triage_suggested_check;
alter table public.patients
  add constraint patients_triage_suggested_check
  check (triage_suggested is null or triage_suggested in ('I', 'II', 'III', 'IV', 'V'));
