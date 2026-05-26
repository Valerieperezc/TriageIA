-- Mismo contenido que EJECUTAR-EN-SUPABASE.sql (script completo de reparación RLS)

-- =============================================================================
-- TRIAGEIA — PEGA Y EJECUTA TODO ESTE ARCHIVO EN SUPABASE → SQL EDITOR → RUN
-- Corrige: "infinite recursion detected in policy for relation profiles"
-- =============================================================================

alter table public.profiles
  add column if not exists status text not null default 'approved'
  check (status in ('pending', 'approved', 'rejected'));

update public.profiles set status = 'approved' where status is null;

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();

do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'patients', 'patient_events')
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      r.policyname,
      r.tablename
    );
  end loop;
end $$;

create or replace function public.is_approved_admin()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  ok boolean;
begin
  select (role = 'admin' and status = 'approved')
  into ok
  from public.profiles
  where id = auth.uid();
  return coalesce(ok, false);
end;
$$;

create or replace function public.is_profile_approved()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  ok boolean;
begin
  select (status = 'approved')
  into ok
  from public.profiles
  where id = auth.uid();
  return coalesce(ok, false);
end;
$$;

create or replace function public.current_user_has_role(allowed_roles text[])
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  ok boolean;
begin
  select (role = any (allowed_roles) and status = 'approved')
  into ok
  from public.profiles
  where id = auth.uid();
  return coalesce(ok, false);
end;
$$;

alter function public.is_approved_admin() owner to postgres;
alter function public.is_profile_approved() owner to postgres;
alter function public.current_user_has_role(text[]) owner to postgres;

grant execute on function public.is_approved_admin() to authenticated;
grant execute on function public.is_profile_approved() to authenticated;
grant execute on function public.current_user_has_role(text[]) to authenticated;

create policy "Profiles select own or admin"
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_approved_admin());

create policy "Profiles update own"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Profiles update by admin"
on public.profiles for update to authenticated
using (public.is_approved_admin())
with check (public.is_approved_admin());

create policy "Patients select approved"
on public.patients for select to authenticated
using (public.is_profile_approved());

create policy "Patients insert intake"
on public.patients for insert to authenticated
with check (public.current_user_has_role(array['admin', 'recepcion', 'enfermeria']));

create policy "Patients update clinical"
on public.patients for update to authenticated
using (public.current_user_has_role(array['admin', 'medico', 'enfermeria']))
with check (
  public.current_user_has_role(array['admin', 'medico'])
  or (public.current_user_has_role(array['enfermeria']) and status <> 'Finalizado')
);

create policy "Patient events select admin"
on public.patient_events for select to authenticated
using (public.is_approved_admin());

create policy "Patient events insert roles"
on public.patient_events for insert to authenticated
with check (
  public.current_user_has_role(array['admin', 'medico', 'enfermeria', 'recepcion'])
);

notify pgrst, 'reload schema';
