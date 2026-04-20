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
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'medico')
  on conflict (id) do update set email = excluded.email;
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
using (true)

drop policy if exists "Patients insert by intake roles" on public.patients;
create policy "Patients insert by intake roles"
on public.patients
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'recepcion', 'enfermeria')
  )
);

drop policy if exists "Patients update by clinical roles" on public.patients;
create policy "Patients update by clinical roles"
on public.patients
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'medico', 'enfermeria')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or p.role = 'medico'
        or (p.role = 'enfermeria' and status <> 'Finalizado')
      )
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
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Patient events insert for authenticated users" on public.patient_events;
drop policy if exists "Patient events insert by operational roles" on public.patient_events;
-- Inserción solo para roles que pueden generar eventos operativos (no invitados anónimos).
create policy "Patient events insert by operational roles"
on public.patient_events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'medico', 'enfermeria', 'recepcion')
  )
);

drop policy if exists "User can read own profile" on public.profiles;
create policy "User can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "User can update own profile" on public.profiles;
create policy "User can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Proyectos ya creados: añade columna de actor si falta.
alter table public.patient_events add column if not exists actor_email text;
alter table public.patient_events add column if not exists request_id text;
create unique index if not exists patient_events_request_id_unique
on public.patient_events (request_id)
where request_id is not null;

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
