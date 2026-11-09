/* ===================== Datos y sesión =====================
   Producción: Supabase "DDP-Analytics". La base se sincroniza sola con el cubo BI de Evolta
   (todos los días, desde dentro de la base). El navegador solo usa la clave publicable;
   cada tabla está protegida con RLS según la tabla de accesos. Nunca se pone aquí una clave secreta. */
const SUPA_URL = 'https://ejcnxvkmnqihyizdafqg.supabase.co';
const SUPA_KEY = 'sb_publishable_KgHBLwBPpmjHHPi17rXKcg__Vo_G-WG';
const DEMO = typeof __DEMO__ !== 'undefined' && __DEMO__ === true; // solo en la vista previa, nunca en producción

if (!DEMO && typeof supabase === 'undefined') {
  document.body.innerHTML = '<p style="font:16px Arial;padding:40px;color:#c00;background:#fff">Falta el archivo supabase.js en el sitio publicado. Vuelve a subir todos los archivos del zip.</p>';
  throw new Error('supabase.js no cargó');
}
const sb = DEMO ? null : supabase.createClient(SUPA_URL, SUPA_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* Secciones del menú agrupadas por área; "perm" es el código que se guarda en accesos.secciones.
   "prep: true" = módulo en preparación (se muestra pero aún no tiene datos). */
const SECCIONES = [
  { grupo: 'Dirección', icon: 'dir', items: [
    { id: 'ejecutivo', label: 'Resumen ejecutivo', perm: 'ejecutivo' },
    { id: 'alertas', label: 'Alertas', perm: 'alertas', prep: true }] },
  { grupo: 'Comercial', icon: 'ventas', items: [
    { id: 'ventas', label: 'Resumen de ventas', perm: 'ventas' },
    { id: 'lista', label: 'Lista de precios', perm: 'lista' },
    { id: 'precios', label: 'Precios', perm: 'precios' },
    { id: 'metas', label: 'Metas comerciales', perm: 'metas' },
    { id: 'simulador', label: 'Simulador de precios', perm: 'simulador', prep: true },
    { id: 'ejecutivos', label: 'Ejecutivos de ventas', perm: 'ejecutivos', prep: true }] },
  { grupo: 'Marketing', icon: 'mkt', items: [
    { id: 'funnel', label: 'Funnel de ventas', perm: 'funnel', prep: true },
    { id: 'leads', label: 'Análisis de leads', perm: 'leads', prep: true },
    { id: 'gastos-mkt', label: 'Gastos de marketing', perm: 'gastos-mkt', prep: true }] },
  { grupo: 'Finanzas', icon: 'fin', items: [
    { id: 'financiamiento', label: 'Financiamiento', perm: 'financiamiento', prep: true },
    { id: 'cobranzas', label: 'Cobranzas', perm: 'cobranzas', prep: true },
    { id: 'devoluciones', label: 'Devoluciones', perm: 'devoluciones', prep: true }] },
  { grupo: 'Clientes', icon: 'ejec', items: [
    { id: 'perfil-cliente', label: 'Perfil de cliente', perm: 'perfil-cliente', prep: true },
    { id: 'atencion', label: 'Atención al cliente', perm: 'atencion', prep: true },
    { id: 'contact-center', label: 'Contact center', perm: 'contact-center', prep: true },
    { id: 'postventa', label: 'Postventa', perm: 'postventa', prep: true }] },
  { grupo: 'Administración', icon: 'admin', items: [
    { id: 'accesos', label: 'Usuarios y accesos', perm: '__admin' },
    { id: 'sincronizaciones', label: 'Sincronizaciones', perm: '__admin' },
    { id: 'integraciones', label: 'Integraciones', perm: '__admin', prep: true }] }
];

const API = {
  async sesion() {
    if (DEMO) return { email: typeof REAL_DATA !== 'undefined' ? 'Vista previa' : 'demo@desarrolladora.com' };
    const { data } = await sb.auth.getSession();
    return data.session ? data.session.user : null;
  },
  async entrar(email, pass) {
    if (DEMO) return null;
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });
    return error;
  },
  async salir() { if (!DEMO) await sb.auth.signOut(); },
  /* Enlace de invitación o de nueva contraseña (#acceso=...&tipo=...) generado por un administrador */
  async usarEnlace(tokenHash, tipo) {
    await sb.auth.signOut({ scope: 'local' }).catch(() => { });
    const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type: tipo === 'recovery' ? 'recovery' : 'invite' });
    return error;
  },
  async primerAcceso(k) {
    const { data, error } = await sb.functions.invoke('primer-acceso', { body: { k } });
    if (error) {
      let msg = 'El enlace venció o ya se usó.';
      try { const j = await error.context.json(); if (j && j.error) msg = j.error; } catch (e) { }
      throw new Error(msg);
    }
    return data;
  },
  async nuevaClave(pass) {
    const { error } = await sb.auth.updateUser({ password: pass });
    return error;
  },
  /* Perfil: ¿usuario activo?, ¿admin?, ¿qué secciones ve? (lo decide la base, no el navegador) */
  async perfil() {
    if (DEMO) return { activo: true, admin: true, permisos: new Set(SECCIONES.flatMap(g => g.items.map(i => i.perm))) };
    const { data, error } = await sb.rpc('mi_acceso');
    if (error) throw error;
    const d = data || {};
    return { activo: !!d.activo, admin: !!d.admin, nombre: d.nombre || '', permisos: new Set(d.secciones || []) };
  },
  async tabla(nombre, cols = '*', filtro) {
    if (DEMO) return DEMO_DATA[nombre] || [];
    const out = [];
    for (let desde = 0; ; desde += 1000) {           // PostgREST entrega máx. 1000 filas por vez
      let q = sb.from(nombre).select(cols).range(desde, desde + 999);
      if (filtro) q = filtro(q);
      const { data, error } = await q;
      if (error) throw error;
      out.push(...data);
      if (data.length < 1000) break;
    }
    return out;
  },
  /* ---- Administración de accesos ---- */
  async accesos() {
    const { data, error } = await sb.rpc('accesos_admin');
    if (error) throw error;
    return data || [];
  },
  async guardarAcceso(email, cambios) {
    const { error } = await sb.from('accesos').update(cambios).eq('email', email);
    if (error) throw error;
  },
  async guardarMeta(fila) {
    if (DEMO) return;
    const u = await API.sesion();
    const { error } = await sb.from('commercial_targets').upsert({ ...fila, updated_by: u && u.email, updated_at: new Date().toISOString() }, { onConflict: 'mes,proyecto,etapa' });
    if (error) throw error;
  },
  async usuarios(body) {   // función del servidor: invitar, generar enlace, quitar
    const { data, error } = await sb.functions.invoke('usuarios', { body: { ...body, origen: location.origin } });
    if (error) {
      let msg = error.message;
      try { const j = await error.context.json(); if (j && j.error) msg = j.error; } catch (e) { }
      throw new Error(msg);
    }
    return data;
  }
};

/* ---------- Datos de ejemplo (solo vista previa) ---------- */
const DEMO_DATA = typeof REAL_DATA !== 'undefined' ? REAL_DATA : DEMO ? (() => {
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const proys = [['COUNTRY SAN ANTONIO', 'Casa', 9800], ['DORUÉ', 'Departamento', 7600], ['LOS ALAMOS', 'Departamento', 6900], ['ROSARIO', 'Departamento', 7200], ['SALAVERRY 571', 'Departamento', 8400]];
  const estados = [['Entregado', 'Vendido'], ['Minuta', 'Vendido'], ['Cancelado', 'Vendido'], ['Pagando sin minuta', 'Separado'], ['Separación', 'Separado'], ['Disponible', 'Disponible'], ['Bloqueado', 'Bloqueado']];
  const stock = [];
  proys.forEach(([p, tipo, m2]) => {
    for (let i = 0; i < 90; i++) {
      const r = rnd(); const e = r < .5 ? estados[Math.floor(rnd() * 3)] : r < .62 ? estados[3 + Math.floor(rnd() * 2)] : r < .95 ? estados[5] : estados[6];
      const dorm = 1 + Math.floor(rnd() * 3), area = 45 + dorm * 18 + Math.round(rnd() * 20), pm2 = Math.round(m2 * (0.9 + rnd() * 0.25));
      const lista = area * pm2;
      stock.push({ proyecto: p, etapa: 'Etapa ' + (1 + (i % 2)), tipoinmueble: tipo, es_principal: true, estado: e[0], estado_grupo: e[1], numdormitorio: dorm, areaventa: area,
        preciolista: lista, precioventa: e[1] === 'Disponible' ? lista : Math.round(lista * (0.94 + rnd() * 0.05)), precio_m2: pm2, nroinmueble: String(100 * (1 + (i % 9)) + i), nropiso: 1 + (i % 9) });
    }
  });
  const meses = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
  const mensual = meses.map((m, i) => ({ mes: m, ocs_vendidas: 14 + Math.round(rnd() * 14), monto_venta_pen: Math.round((5 + rnd() * 4) * 1e6), parcial: i === meses.length - 1 }));
  mensual[mensual.length - 1].ocs_vendidas = 3;
  const metas = meses.flatMap(m => proys.map(([p]) => ({ mes: m, proyecto: p, etapa: 'ETAPA I', meta_unidades: 4 + Math.round(rnd() * 3), meta_monto: 1.6e6 })));
  const eje = ['Ana Torres', 'Luis Paredes', 'Carla Rojas', 'Diego Salas', 'María Vega', 'Jorge Quispe', 'Rosa Medina'].map((n, i) => ({
    ejecutivo: n, ventas: 30 - i * 3 - Math.round(rnd() * 3), monto_venta_pen: Math.round((24 - i * 2.6) * 1e6), separaciones: 8 - (i % 4), cotizaciones: 120 - i * 9, meta_unidades: 24 }));
  return {
    stock_detalle: stock,
    exec_stage_stats: proys.flatMap(([p, tipo], k) => [1, 2].map(e => { const t = 60 + ((k * 37 + e * 11) % 140), v = Math.round(t * (e === 1 ? .9 : .35)), c = 3 + (k % 4); return { proyecto: p, etapa: 'ETAPA ' + (e === 1 ? 'I' : 'II'), tipo, principales: t, vendidas: v, comprometidas: c, disponibles: t - v - c, velocidad_2026: (1 + rnd() * 5).toFixed(1) }; })),
    exec_project_monto: proys.map(([p], k) => ({ proyecto: p, monto_venta_pen: Math.round((40 + k * 23 + rnd() * 30) * 1e6), ocs_venta: 80 + k * 40 })),
    exec_etapa_config: proys.flatMap(([p]) => [{ proyecto: p, etapa: 'ETAPA I', fase: 'Entrega' }, { proyecto: p, etapa: 'ETAPA II', fase: 'Preventa' }]),
    sync_runs: Array.from({ length: 12 }, (_, i) => ({ started_at: new Date(Date.now() - i * 864e5).toISOString(), status: i === 4 ? 'error' : 'ok', rows_processed: 2700 + i, duration_ms: 8000 + i * 300, error: i === 4 ? 'Tiempo de espera agotado' : null })),
    exec_monthly_sales: mensual,
    commercial_targets: metas,
    snapshot_meta: [{ generated_at: new Date().toISOString(), source: 'Datos de ejemplo' }],
    ventas_ejecutivo: eje,
    funnel_comercial: [{ etapa: 'Leads', n: 4120 }, { etapa: 'Contactados', n: 2650 }, { etapa: 'Visitas', n: 980 }, { etapa: 'Cotizaciones', n: 760 }, { etapa: 'Separaciones', n: 210 }, { etapa: 'Ventas (minuta)', n: 168 }]
  };
})() : null;
