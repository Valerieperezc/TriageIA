-- =============================================================================
-- TRIAGEIA — PEGA Y EJECUTA TODO ESTE ARCHIVO EN SUPABASE → SQL EDITOR → RUN
-- Corrige: "infinite recursion detected in policy for relation profiles"
-- =============================================================================

-- 1) Columna status (si falta)
alter table public.profiles
  add column if not exists status text not null default 'approved'
  check (status in ('pending', 'approved', 'rejected'));

update public.profiles set status = 'approved' where status is null;

-- Registros nuevos: pending hasta que el admin apruebe
alter table public.profiles alter column status set default 'pending';

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
        status = 'pending';

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();

-- 2) ELIMINAR TODAS las políticas RLS (incluidas las viejas que causan recursión)
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

-- 3) Funciones helper (SECURITY DEFINER = sin recursión al leer profiles)
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

-- 4) Políticas nuevas (sin subconsultas a profiles dentro de policies de profiles)
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

-- 5) Aprobar desde el panel habilita el login (confirma correo al aprobar)
create or replace function public.set_user_account_status(
  target_user_id uuid,
  new_status text
)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  result public.profiles;
begin
  if not public.is_approved_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if new_status not in ('pending', 'approved', 'rejected') then
    raise exception 'invalid status';
  end if;

  update public.profiles
  set status = new_status
  where id = target_user_id
  returning * into result;

  if result.id is null then
    raise exception 'user not found';
  end if;

  if new_status = 'approved' then
    update auth.users
    set
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = target_user_id;
  end if;

  return result;
end;
$$;

grant execute on function public.set_user_account_status(uuid, text) to authenticated;

create or replace function public.sync_own_profile_pending(
  p_display_name text,
  p_role text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
  safe_role text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  safe_role := coalesce(nullif(trim(p_role), ''), 'medico');
  if safe_role not in ('admin', 'medico', 'recepcion', 'enfermeria') then
    safe_role := 'medico';
  end if;

  update public.profiles
  set
    display_name = nullif(trim(p_display_name), ''),
    role = safe_role,
    status = 'pending'
  where id = auth.uid()
  returning * into result;

  if result.id is null then
    raise exception 'profile not found';
  end if;

  return result;
end;
$$;

grant execute on function public.sync_own_profile_pending(text, text) to authenticated;

create or replace function public.delete_user_account(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_approved_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'cannot delete yourself';
  end if;

  delete from auth.users where id = target_user_id;

  if not found then
    raise exception 'user not found';
  end if;
end;
$$;

grant execute on function public.delete_user_account(uuid) to authenticated;

-- 6) Recargar caché de PostgREST
notify pgrst, 'reload schema';

-- Listo. Recarga la app (F5). Nuevos usuarios → pendientes; admin aprueba en Usuarios → ya pueden entrar.

