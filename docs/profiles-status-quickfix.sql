-- Corrección rápida: columna status + políticas sin recursión RLS
-- Ejecuta TODO este archivo en Supabase → SQL Editor → Run

alter table public.profiles
  add column if not exists status text not null default 'approved'
  check (status in ('pending', 'approved', 'rejected'));

update public.profiles set status = 'approved' where status is null;

-- El resto evita "infinite recursion detected in policy for relation profiles"
-- (mismo contenido que profiles-rls-recursion-fix.sql)

create or replace function public.is_approved_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'approved'
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
    (
      select status = 'approved'
      from public.profiles
      where id = auth.uid()
    ),
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
      where id = auth.uid()
        and status = 'approved'
    ),
    false
  );
$$;

revoke all on function public.is_approved_admin() from public;
revoke all on function public.is_profile_approved() from public;
revoke all on function public.current_user_has_role(text[]) from public;
grant execute on function public.is_approved_admin() to authenticated;
grant execute on function public.is_profile_approved() to authenticated;
grant execute on function public.current_user_has_role(text[]) to authenticated;

drop policy if exists "Admin can read all profiles" on public.profiles;
drop policy if exists "Admin can update profiles for approval" on public.profiles;
drop policy if exists "User can read own profile" on public.profiles;

create policy "Profiles read own or admin"
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_approved_admin());

create policy "Admin can update profiles for approval"
on public.profiles for update to authenticated
using (public.is_approved_admin())
with check (public.is_approved_admin());

drop policy if exists "Patients read for authenticated users" on public.patients;
create policy "Patients read for authenticated users"
on public.patients for select to authenticated
using (public.is_profile_approved());

drop policy if exists "Patients insert by intake roles" on public.patients;
create policy "Patients insert by intake roles"
on public.patients for insert to authenticated
with check (
  public.current_user_has_role(array['admin', 'recepcion', 'enfermeria'])
);

drop policy if exists "Patients update by clinical roles" on public.patients;
create policy "Patients update by clinical roles"
on public.patients for update to authenticated
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

drop policy if exists "Patient events read for admin" on public.patient_events;
create policy "Patient events read for admin"
on public.patient_events for select to authenticated
using (public.is_approved_admin());

drop policy if exists "Patient events insert by operational roles" on public.patient_events;
create policy "Patient events insert by operational roles"
on public.patient_events for insert to authenticated
with check (
  public.current_user_has_role(array['admin', 'medico', 'enfermeria', 'recepcion'])
);
