-- Registro + aprobación desde el panel (sin pasos manuales en Supabase Dashboard).
-- Ejecuta en Supabase → SQL Editor (después de EJECUTAR-EN-SUPABASE.sql)

-- Nuevos registros: siempre pending (no "habilitado" por defecto)
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

-- Tras signUp (con sesión): marca el propio perfil como pendiente
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

revoke all on function public.set_user_account_status(uuid, text) from public;
grant execute on function public.set_user_account_status(uuid, text) to authenticated;

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

notify pgrst, 'reload schema';
