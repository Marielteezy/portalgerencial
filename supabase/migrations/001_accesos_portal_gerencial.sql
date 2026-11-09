-- Portal Gerencial · accesos por correo (mismo modelo que Portal Comercial) sobre la base DDP-Analytics.
-- Es aditivo: las políticas de DDP Analytics (app_users / dashboard_permissions) siguen funcionando
-- mientras Lovable siga activo. El corte definitivo está en 002_corte_lovable.sql.
create schema if not exists private;

create table public.accesos (
  email text primary key check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nombre text,
  admin boolean not null default false,
  secciones text[] not null default '{}' check (secciones <@ array[
    'ejecutivo','alertas','ventas','lista','precios','metas','simulador','ejecutivos',
    'funnel','leads','gastos-mkt','financiamiento','cobranzas','devoluciones',
    'perfil-cliente','atencion','contact-center','postventa']),
  activo boolean not null default true,
  invitado_por text,
  creado_at timestamptz not null default now()
);
alter table public.accesos enable row level security;
revoke all on public.accesos from anon;

-- ---------- Funciones de permisos ----------
create or replace function private.mi_email() returns text
language sql stable security definer set search_path = '' as $$
  select lower(u.email) from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null
$$;
create or replace function private.es_activo() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.accesos a where a.email = private.mi_email() and a.activo)
$$;
create or replace function private.es_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.accesos a where a.email = private.mi_email() and a.activo and a.admin)
$$;
create or replace function private.puede(sec text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.accesos a where a.email = private.mi_email() and a.activo and (a.admin or sec = any (a.secciones)))
$$;
revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke execute on function private.mi_email(), private.es_activo(), private.es_admin(), private.puede(text) from public, anon;
grant execute on function private.mi_email(), private.es_activo(), private.es_admin(), private.puede(text) to authenticated;

create or replace function public.mi_acceso() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce((select jsonb_build_object('activo', a.activo, 'admin', a.admin and a.activo, 'nombre', a.nombre, 'secciones', to_jsonb(a.secciones))
    from public.accesos a where a.email = private.mi_email()), '{"activo":false,"admin":false,"secciones":[]}'::jsonb)
$$;

create or replace function public.accesos_admin() returns table (email text, nombre text, admin boolean, secciones text[], activo boolean,
  cuenta text, ultimo_ingreso timestamptz, creado_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select a.email, a.nombre, a.admin, a.secciones, a.activo,
    case when u.id is null then null when u.encrypted_password is null or u.encrypted_password = '' then 'pendiente' else 'activo' end,
    u.last_sign_in_at, a.creado_at
  from public.accesos a left join auth.users u on lower(u.email) = a.email
  where private.es_admin() order by a.admin desc, a.nombre nulls last, a.email
$$;
revoke execute on function public.mi_acceso(), public.accesos_admin() from public, anon;
grant execute on function public.mi_acceso(), public.accesos_admin() to authenticated;

-- ---------- Políticas de la tabla de accesos ----------
create policy accesos_admin_leer on public.accesos for select to authenticated using (private.es_admin());
create policy accesos_admin_editar on public.accesos for update to authenticated using (private.es_admin()) with check (private.es_admin());

create or replace function private.chk_accesos() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and old.email = private.mi_email() and (new.admin is distinct from old.admin or new.activo is distinct from old.activo) then
    raise exception 'No puedes cambiar tu propio rol ni desactivarte' using errcode = '42501';
  end if;
  if new.email <> old.email then raise exception 'El correo no se puede cambiar' using errcode = '42501'; end if;
  return new;
end $$;
create trigger accesos_chk before update on public.accesos for each row execute function private.chk_accesos();

-- ---------- Lectura de datos según módulo (se suman a las políticas actuales de DDP Analytics) ----------
create policy pg_leer on public.stock_detalle      for select to authenticated using (private.puede('ventas') or private.puede('lista') or private.puede('precios') or private.puede('ejecutivo'));
create policy pg_leer on public.exec_stage_stats   for select to authenticated using (private.puede('ejecutivo') or private.puede('metas'));
create policy pg_leer on public.exec_project_monto for select to authenticated using (private.puede('ejecutivo'));
create policy pg_leer on public.exec_monthly_sales for select to authenticated using (private.puede('ejecutivo') or private.puede('ventas'));
create policy pg_leer on public.exec_etapa_config  for select to authenticated using (private.puede('ejecutivo'));
create policy pg_leer on public.commercial_targets for select to authenticated using (private.puede('metas') or private.puede('ventas') or private.puede('ejecutivo'));
create policy pg_admin on public.commercial_targets for all to authenticated using (private.es_admin()) with check (private.es_admin());
create policy pg_leer on public.snapshot_meta      for select to authenticated using (private.es_activo());
create policy pg_leer on public.sync_runs          for select to authenticated using (private.es_admin());

-- ---------- Usuarios iniciales: los administradores actuales de DDP Analytics ----------
insert into public.accesos (email, nombre, admin, secciones, invitado_por)
select lower(email), name, true, '{}', 'migración DDP Analytics' from public.app_users
where status = 'active' and is_admin
on conflict (email) do nothing;
