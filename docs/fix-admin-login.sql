-- Si no puedes iniciar sesión como administrador tras las migraciones,
-- ejecuta esto en Supabase → SQL Editor → Run

-- 1) Cuentas admin siempre habilitadas
update public.profiles
set status = 'approved'
where role = 'admin';

-- 2) Columnas de perfil usadas por la app (evita error 400 al leer profiles)
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists department text;
alter table public.profiles add column if not exists job_title text;
alter table public.profiles add column if not exists status text not null default 'pending'
  check (status in ('pending', 'approved', 'rejected'));

-- 3) Confirmar correo de admins existentes (por si Auth bloquea el login)
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where id in (select id from public.profiles where role = 'admin');

notify pgrst, 'reload schema';
