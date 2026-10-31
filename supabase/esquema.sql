-- Pianito: cuentas y pase completo.
-- Copia TODO este archivo en Supabase → SQL Editor → New query → Run (una sola vez).
-- Todo lleva el prefijo "pianito_" para poder convivir con otras apps en el mismo proyecto:
-- solo las cuentas creadas desde Pianito reciben un perfil de Pianito.

-- 1) Un perfil por cada cuenta de Pianito
create table if not exists public.pianito_perfiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  correo     text,
  nombre     text,                          -- nombre del niño o niña
  premium    boolean not null default false, -- true = pagó: todos los niveles abiertos
  es_admin   boolean not null default false, -- true = puede entrar al panel de administrador
  pagado_en  timestamptz,
  nota       text,                          -- ej. código de la operación de Culqi
  creado     timestamptz not null default now()
);

-- 2) Seguridad: cada familia solo ve su propio perfil y NO puede cambiarlo;
--    solo un administrador ve y cambia todos.
alter table public.pianito_perfiles enable row level security;

create or replace function public.pianito_soy_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select es_admin from public.pianito_perfiles where id = auth.uid()), false);
$$;

drop policy if exists "pianito: ver mi perfil o todos si soy admin" on public.pianito_perfiles;
create policy "pianito: ver mi perfil o todos si soy admin" on public.pianito_perfiles
  for select using (id = auth.uid() or public.pianito_soy_admin());

drop policy if exists "pianito: solo el admin cambia perfiles" on public.pianito_perfiles;
create policy "pianito: solo el admin cambia perfiles" on public.pianito_perfiles
  for update using (public.pianito_soy_admin()) with check (public.pianito_soy_admin());

-- 3) Al registrarse desde Pianito, se crea el perfil automáticamente
create or replace function public.pianito_nuevo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'app', '') = 'pianito' then
    insert into public.pianito_perfiles (id, correo, nombre)
    values (new.id, new.email, new.raw_user_meta_data ->> 'nombre')
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists pianito_al_registrarse on auth.users;
create trigger pianito_al_registrarse after insert on auth.users
  for each row execute function public.pianito_nuevo_usuario();

-- 4) Convertirte en administrador: primero regístrate en Pianito con tu correo,
--    luego cambia el correo de abajo y ejecuta SOLO esta línea:
-- update public.pianito_perfiles set es_admin = true where correo = 'tu-correo@gmail.com';
