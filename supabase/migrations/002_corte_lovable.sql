-- Portal Gerencial · corte definitivo de Lovable. Ejecutar SOLO cuando la app de Lovable ya no se use.
-- 1) Solo correos invitados pueden tener cuenta.
create or replace function private.solo_invitados() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.accesos where email = lower(new.email)) then return new; end if;
  raise exception 'Este correo no tiene invitación' using errcode = '42501';
end $$;
create trigger solo_invitados before insert on auth.users for each row execute function private.solo_invitados();

-- 2) Se quitan las políticas de lectura amplias de DDP Analytics (cualquier usuario activo veía todo)
--    para que cada módulo quede protegido por su permiso.
do $$ declare r record; begin
  for r in select tablename, policyname from pg_policies where schemaname = 'public'
    and tablename in ('stock_detalle','exec_stage_stats','exec_project_monto','exec_monthly_sales','exec_etapa_config','commercial_targets','snapshot_meta','sync_runs','exec_financing_mix','ventas_etapa','ventas_dormitorio','ventas_mensual')
    and policyname not like 'pg\_%'
  loop execute format('drop policy %I on public.%I', r.policyname, r.tablename); end loop;
end $$;
-- app_users y dashboard_permissions se conservan como respaldo; se pueden borrar más adelante.
