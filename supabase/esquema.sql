-- Pianito: cuentas y pase completo.
-- Copia TODO este archivo en Supabase → SQL Editor → New query → Run (una sola vez).

-- 1) Un perfil por cada cuenta
create table if not exists public.perfiles (
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
alter table public.perfiles enable row level security;

create or replace function public.soy_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select es_admin from public.perfiles where id = auth.uid()), false);
$$;

drop policy if exists "ver mi perfil o todos si soy admin" on public.perfiles;
create policy "ver mi perfil o todos si soy admin" on public.perfiles
  for select using (id = auth.uid() or public.soy_admin());

drop policy if exists "solo el admin cambia perfiles" on public.perfiles;
create policy "solo el admin cambia perfiles" on public.perfiles
  for update using (public.soy_admin()) with check (public.soy_admin());

-- 3) Al registrarse, se crea el perfil automáticamente
create or replace function public.nuevo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, correo, nombre)
  values (new.id, new.email, new.raw_user_meta_data ->> 'nombre')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists al_registrarse on auth.users;
create trigger al_registrarse after insert on auth.users
  for each row execute function public.nuevo_usuario();

-- 4) Convertirte en administrador: primero regístrate en la app con tu correo,
--    luego cambia el correo de abajo y ejecuta SOLO esta línea:
-- update public.perfiles set es_admin = true where correo = 'tu-correo@gmail.com';
