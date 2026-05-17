-- TriageIA: usuarios demo + roles (Supabase SQL Editor)
-- Requiere haber ejecutado antes docs/supabase-schema.sql
--
-- Si el login falla con "Database error querying schema", ejecuta primero
-- la sección "REPARAR" al final de este archivo.

create extension if not exists pgcrypto;

create or replace function public.seed_triage_demo_user(
  p_email text,
  p_password text,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid;
  v_pw text;
begin
  if p_role not in ('admin', 'medico', 'recepcion', 'enfermeria') then
    raise exception 'Rol inválido: %', p_role;
  end if;

  v_pw := crypt(p_password, gen_salt('bf'));

  select id into v_user_id from auth.users where email = p_email;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    -- GoTrue exige cadenas vacías en columnas de token, no NULL (issue supabase/auth#1940).
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      p_email,
      v_pw,
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('role', p_role),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      v_user_id,
      v_user_id::text,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', p_email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    );
  else
    update auth.users
    set
      encrypted_password = v_pw,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      confirmation_token = coalesce(confirmation_token, ''),
      email_change = coalesce(email_change, ''),
      email_change_token_new = coalesce(email_change_token_new, ''),
      recovery_token = coalesce(recovery_token, ''),
      updated_at = now()
    where id = v_user_id;
  end if;

  insert into public.profiles (id, email, role)
  values (v_user_id, p_email, p_role)
  on conflict (id) do update
    set email = excluded.email,
        role = excluded.role;
end;
$$;

select public.seed_triage_demo_user('admin@triage.com', '123456', 'admin');
select public.seed_triage_demo_user('medico@triage.com', '123456', 'medico');
select public.seed_triage_demo_user('recepcion@triage.com', '123456', 'recepcion');
select public.seed_triage_demo_user('enfermeria@triage.com', '123456', 'enfermeria');

select p.email, p.role, u.email_confirmed_at is not null as confirmado
from public.profiles p
join auth.users u on u.id = p.id
where p.email like '%@triage.com'
order by p.email;

-- =============================================================================
-- REPARAR usuarios ya creados (ejecuta esto si el login da "Database error querying schema")
-- =============================================================================
/*
update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_confirmed_at = coalesce(email_confirmed_at, now())
where email in (
  'admin@triage.com',
  'medico@triage.com',
  'recepcion@triage.com',
  'enfermeria@triage.com'
);
*/
