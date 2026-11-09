/* ===================== Portal Gerencial ===================== */
const $ = s => document.querySelector(s);
const ST = { perfil: null, vista: null, cache: {}, modoLogin: 'login' };
const fmtN = n => (n == null || isNaN(n)) ? '–' : Math.round(n).toLocaleString('es-PE');
const fmtS = n => (n == null || isNaN(n)) ? '–' : 'S/ ' + Math.round(n).toLocaleString('es-PE');
const fmtM = n => (n == null || isNaN(n)) ? '–' : 'S/ ' + (n / 1e6).toLocaleString('es-PE', { maximumFractionDigits: 1 }) + ' M';
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fmtMes = m => { const [y, mm] = m.split('-'); return MES[+mm - 1] + ' ' + y.slice(2); };
const ICON = {
  dir: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/></svg>',
  fin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>',
  ventas: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  mkt: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M3 4h18l-7 8v6l-4 2v-8z"/></svg>',
  admin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/></svg>',
  ejec: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M17 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/></svg>'
};

/* ---------------- Login ---------------- */
function renderLogin(msg, info) {
  $('#app').hidden = true; const L = $('#login'); L.hidden = false;
  const m = ST.modoLogin;
  let box;
  if (m === 'login') box = `<h2>Ingresar</h2>
    <form class="lg-form" id="lgForm" novalidate>
      <div class="lg-f"><label for="lgEmail">Correo electrónico</label>
        <input class="lg-in" id="lgEmail" type="email" autocomplete="username" placeholder="nombre@desarrolladora.com" required></div>
      <div class="lg-f"><div class="lg-row"><label for="lgPass">Contraseña</label><button type="button" class="lg-link" data-act="olvide">Olvidé mi contraseña</button></div>
        <input class="lg-in" id="lgPass" type="password" autocomplete="current-password" placeholder="••••••••••••" required></div>
      <div id="lgMsg" role="alert" hidden></div>
      <button class="lg-go" id="lgGo" type="submit">Ingresar</button>
    </form>`;
  else if (m === 'olvide') box = `<h2>Recuperar acceso</h2><p class="lg-sub">Te enviaremos un enlace para crear una contraseña nueva.</p>
    <form class="lg-form" id="lgForm" novalidate>
      <div class="lg-f"><label for="lgEmail">Correo electrónico</label>
        <input class="lg-in" id="lgEmail" type="email" autocomplete="username" required></div>
      <div id="lgMsg" role="alert" hidden></div>
      <button class="lg-go" id="lgGo" type="submit">Enviar enlace</button>
      <button type="button" class="lg-link" data-act="volver">Volver</button>
    </form>`;
  else if (m === 'nueva') box = `<h2>Crea tu contraseña</h2><p class="lg-sub">Mínimo 10 caracteres.</p>
    <form class="lg-form" id="lgForm" novalidate>
      <div class="lg-f"><label for="lgPass">Contraseña nueva</label><input class="lg-in" id="lgPass" type="password" autocomplete="new-password" required></div>
      <div class="lg-f"><label for="lgPass2">Confirmar</label><input class="lg-in" id="lgPass2" type="password" autocomplete="new-password" required></div>
      <div id="lgMsg" role="alert" hidden></div>
      <button class="lg-go" id="lgGo" type="submit">Guardar e ingresar</button>
    </form>`;
  else if (m === 'sinacceso') box = `<h2>Sin acceso</h2><p class="lg-sub">Tu cuenta no está activa en el Portal Gerencial. Pide acceso al administrador.</p>
    <button class="lg-go" type="button" data-act="salir">Salir</button>`;
  else box = `<h2>Ingresando…</h2><p class="lg-sub">Un momento.</p>`;
  L.innerHTML = `
    <section class="lg-l">
      <img class="lg-bg" src="${IMG_FONDO}" alt="">
      <div class="lg-top"><img src="${IMG_LOGO}" alt="desarrolladora"><span class="lg-mono">Información por área</span></div>
      <h1>Portal Gerencial</h1>
    </section>
    <section class="lg-r"><div class="lg-box">${box}</div></section>`;
  if (msg) lgMsg(msg, info);
  const f = $('#lgEmail') || $('#lgPass'); if (f) setTimeout(() => f.focus(), 30);
}
function lgMsg(t, info) { const m = $('#lgMsg'); if (!m) return; m.hidden = !t; m.className = 'lg-err' + (info ? ' info' : ''); m.textContent = t || ''; }

document.addEventListener('submit', async e => {
  if (e.target.id !== 'lgForm') return;
  e.preventDefault();
  const go = $('#lgGo'); if (go.disabled) return;
  const busy = (b, t) => { go.disabled = b; if (t) go.textContent = t; };
  if (ST.modoLogin === 'login') {
    const email = ($('#lgEmail').value || '').trim().toLowerCase(), pass = $('#lgPass').value || '';
    if (!email || !pass) return lgMsg('Ingresa tu correo y tu contraseña.');
    busy(true, 'Ingresando…');
    const err = await API.entrar(email, pass);
    busy(false, 'Ingresar');
    if (err) return lgMsg(/invalid/i.test(err.message) ? 'Correo o contraseña incorrectos.' : /rate|many/i.test(err.message) ? 'Demasiados intentos. Espera unos minutos.' : 'No se pudo ingresar. Inténtalo de nuevo.');
    entrar();
  } else if (ST.modoLogin === 'nueva') {
    const p1 = $('#lgPass').value || '', p2 = $('#lgPass2').value || '';
    if (p1.length < 10) return lgMsg('La contraseña debe tener 10 caracteres o más.');
    if (p1 !== p2) return lgMsg('Las contraseñas no coinciden.');
    busy(true, 'Guardando…'); const err = await API.nuevaClave(p1); busy(false, 'Guardar e ingresar');
    if (err) return lgMsg(/weak|pwned|short/i.test(err.message) ? 'Elige una contraseña más segura.' : 'No se pudo guardar. Pide un enlace nuevo.');
    entrar();
  }
});

/* ---------------- Sesión ---------------- */
async function entrar() {
  ST.modoLogin = 'cargando'; renderLogin();
  try { ST.perfil = await API.perfil(); } catch (e) { await API.salir(); ST.modoLogin = 'login'; return renderLogin('No se pudo cargar tu cuenta. Inténtalo de nuevo.'); }
  if (!ST.perfil.activo) { ST.modoLogin = 'sinacceso'; return renderLogin(); }
  $('#login').hidden = true; $('#app').hidden = false;
  const u = await API.sesion();
  $('#who').innerHTML = `${esc(u && u.email)}<small>${ST.perfil.admin ? 'Administrador' : 'Usuario'}</small>`;
  renderNav();
  const primera = visibles().find(i => !i.prep) || visibles()[0];
  ir(visibles().some(i => i.id === location.hash.slice(1)) ? location.hash.slice(1) : primera ? primera.id : null);
  vigilarInactividad();
}
const puede = it => it.perm === '__admin' ? ST.perfil.admin : (ST.perfil.admin || ST.perfil.permisos.has(it.perm));
const visibles = () => SECCIONES.flatMap(g => g.items).filter(puede);

/* Cierre automático tras 30 min sin actividad */
function vigilarInactividad() {
  let t; const reset = () => { clearTimeout(t); t = setTimeout(async () => { await API.salir(); ST.modoLogin = 'login'; renderLogin('Tu sesión se cerró por inactividad.', true); }, 30 * 60 * 1000); };
  ['click', 'keydown', 'mousemove', 'touchstart'].forEach(ev => document.addEventListener(ev, reset, { passive: true })); reset();
}

function renderNav() {
  $('#nav').innerHTML = SECCIONES.map(g => {
    const its = g.items.filter(puede); if (!its.length) return '';
    return `<div class="grp">${ICON[g.icon]}${esc(g.grupo)}</div>` + its.map(i => `<button type="button" data-ir="${i.id}">${esc(i.label)}${i.prep ? '<span class="soon">pronto</span>' : ''}</button>`).join('');
  }).join('');
}

function ir(id) {
  ST.vista = id;
  if (id) history.replaceState(null, '', '#' + id);
  document.querySelectorAll('[data-ir]').forEach(b => { if (b.dataset.ir === id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  const V = $('#view');
  if (!id) { V.innerHTML = `<div class="empty"><b>Sin secciones asignadas</b>Pide al administrador acceso a los módulos que necesitas.</div>`; return; }
  V.innerHTML = `<div class="empty"><b>Cargando…</b></div>`;
  const it = SECCIONES.flatMap(g => g.items).find(i => i.id === id);
  (it && it.prep ? VISTAS.prep(it) : VISTAS[id]()).catch(e => { console.error(e); V.innerHTML = `<div class="empty"><b>No se pudieron cargar los datos</b>${esc(e.message || '')}</div>`; });
}

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-ir],[data-act],[data-theme-set]'); if (!b) return;
  if (b.dataset.ir) return ir(b.dataset.ir);
  if (b.dataset.themeSet) return setTheme(b.dataset.themeSet);
  const a = b.dataset.act;
  if (a === 'olvide') { lgMsg('Pide al administrador un enlace de acceso nuevo (Administración → Accesos). Con ese enlace creas tu contraseña.', true); }
  else if (a === 'volver') { ST.modoLogin = 'login'; renderLogin(); }
  else if (a === 'salir') { await API.salir(); ST.cache = {}; ST.modoLogin = 'login'; history.replaceState(null, '', location.pathname); renderLogin(); }
});

function setTheme(t) {
  try { localStorage.setItem('pg-theme', t); } catch (_) { }
  document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('[data-theme-set]').forEach(b => b.setAttribute('aria-pressed', b.dataset.themeSet === t));
}

/* ---------------- Utilidades de gráficos ---------------- */
async function datos(nombre, cols, filtro) {
  const k = nombre + '|' + cols;
  if (!ST.cache[k]) ST.cache[k] = API.tabla(nombre, cols, filtro);
  return ST.cache[k];
}
async function existe(nombre, cols) { try { return await datos(nombre, cols); } catch (e) { delete ST.cache[nombre + '|' + cols]; return null; } }
/* Country San Antonio Etapa II aún no se comercializa: se excluye de los tableros (igual que en DDP Analytics) */
const excluido = r => /^COUNTRY/i.test(r.proyecto || '') && /ETAPA II$/i.test((r.etapa || '').trim());
const stockPrincipal = () => datos('stock_detalle', 'proyecto,etapa,tipoinmueble,es_principal,estado,estado_grupo,numdormitorio,areaventa,precioventa,preciolista,precio_m2,nroinmueble,nropiso,fechaventa,tipofinanciamiento,col,modelo', q => q.eq('es_principal', true)).then(rs => rs.filter(r => !excluido(r)));

function tip() { let t = $('.tip'); if (!t) { t = document.createElement('div'); t.className = 'tip'; t.hidden = true; document.body.appendChild(t); } return t; }
document.addEventListener('mousemove', e => {
  const h = e.target.closest('[data-tip]'); const t = tip();
  if (!h) { t.hidden = true; return; }
  t.textContent = h.dataset.tip; t.hidden = false;
  t.style.left = Math.min(e.clientX + 14, innerWidth - t.offsetWidth - 8) + 'px'; t.style.top = (e.clientY + 14) + 'px';
});

/* Columnas: una sola serie + línea de meta (misma unidad, un solo eje) */
function columnas(rows, { val, lbl, meta, tipFn }) {
  const W = 640, H = 220, pl = 34, pb = 26, pt = 10, n = rows.length;
  const max = Math.max(1, ...rows.map(r => Math.max(val(r), meta ? meta(r) || 0 : 0))) * 1.1;
  const step = (W - pl) / n, bw = Math.min(34, step * 0.6), y = v => pt + (H - pt - pb) * (1 - v / max);
  const ticks = [0, .5, 1].map(f => Math.round(max / 1.1 * f));
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  ticks.forEach(v => { s += `<line class="grid-l" x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`; });
  rows.forEach((r, i) => {
    const x = pl + step * i + (step - bw) / 2, v = val(r), yy = y(v), h = Math.max(0, H - pb - yy);
    s += `<g data-tip="${esc(tipFn(r))}"><rect class="hit" x="${pl + step * i}" y="${pt}" width="${step}" height="${H - pt - pb}"/>`;
    s += `<path class="c${r.parcial ? ' p' : ''}" d="M${x},${H - pb} v${-Math.max(0, h - 4)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 v${Math.max(0, h - 4)} z" fill="${r.parcial ? 'var(--bar-2)' : 'var(--bar)'}"/>`;
    if (meta && meta(r)) s += `<line x1="${x - 4}" x2="${x + bw + 4}" y1="${y(meta(r))}" y2="${y(meta(r))}" stroke="var(--ink)" stroke-width="2" stroke-dasharray="3 2"/>`;
    s += `<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(lbl(r))}</text></g>`;
  });
  return `<div class="cols">${s}</svg></div>`;
}
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

/* ---------------- Vistas ---------------- */
const VISTAS = {
  async ventas() {
    const [stock, mens, metas, meta] = await Promise.all([stockPrincipal(), datos('exec_monthly_sales', 'mes,ocs_vendidas,monto_venta_pen,parcial'),
      existe('commercial_targets', 'mes,proyecto,etapa,meta_unidades,meta_monto'), existe('snapshot_meta', 'generated_at,source')]);
    const c = g => stock.filter(r => r.estado_grupo === g).length;
    const tot = stock.length, ven = c('Vendido'), sep = c('Separado'), dis = c('Disponible');
    const anio = String(new Date().getFullYear());
    const m = mens.filter(r => r.mes.startsWith(anio)).sort((a, b) => a.mes.localeCompare(b.mes));
    const metaMes = {}; (metas || []).forEach(r => { metaMes[r.mes] = (metaMes[r.mes] || 0) + (+r.meta_unidades || 0); });
    const montoAnio = m.reduce((a, r) => a + (+r.monto_venta_pen || 0), 0), udsAnio = m.reduce((a, r) => a + (+r.ocs_vendidas || 0), 0);
    const proys = [...new Set(stock.map(r => r.proyecto))].sort();
    const G = [['Vendido', 'var(--s1)'], ['Separado', 'var(--s2)'], ['Disponible', 'var(--s3)'], ['Bloqueado', 'var(--s-neutral)']];
    $('#view').innerHTML = `
      <div class="head"><div><div class="eyebrow">Ventas</div><h1>Resumen de ventas</h1></div>${stamp(meta)}</div>
      <div class="grid g4">
        ${kpi('Unidades vendidas', fmtN(ven), pct(ven, tot) + '% del inventario')}
        ${kpi('Separadas', fmtN(sep), 'En proceso de minuta')}
        ${kpi('Disponibles', fmtN(dis), pct(dis, tot) + '% del inventario')}
        ${kpi('Venta ' + anio, fmtM(montoAnio), fmtN(udsAnio) + ' unidades')}
      </div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card"><h3>Unidades vendidas por mes</h3><div class="sub">${anio} · la línea punteada es la meta${m.some(r => r.parcial) ? ' · el último mes va en curso' : ''}</div>
          ${m.length ? columnas(m, { val: r => +r.ocs_vendidas, lbl: r => fmtMes(r.mes).split(' ')[0], meta: r => metaMes[r.mes], tipFn: r => `${fmtMes(r.mes)}: ${r.ocs_vendidas} uds · ${fmtM(r.monto_venta_pen)}${metaMes[r.mes] ? ' · meta ' + metaMes[r.mes] : ''}` }) : '<div class="empty">Sin ventas este año</div>'}</div>
        <div class="card"><h3>Avance por proyecto</h3><div class="sub">Unidades principales (departamentos y casas)</div>
          <div class="legend">${G.map(([g, col]) => `<span><i style="background:${col}"></i>${g}</span>`).join('')}</div>
          <div class="hbars">${proys.map(p => {
            const rs = stock.filter(r => r.proyecto === p), t = rs.length;
            return `<div class="hb"><span class="n" title="${esc(p)}">${esc(p)}</span><div class="t">${G.map(([g, col]) => { const k = rs.filter(r => r.estado_grupo === g).length; return k ? `<span style="width:${k / t * 100}%;background:${col}" data-tip="${esc(p)} · ${g}: ${k} (${pct(k, t)}%)"></span>` : ''; }).join('')}</div><span class="v">${pct(rs.filter(r => r.estado_grupo === 'Vendido').length, t)}% vendido</span></div>`;
          }).join('')}</div></div>
      </div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card"><h3>Ventas ${anio} por proyecto</h3><div class="sub">Unidades con fecha de venta en ${anio}</div>
          <div class="hbars">${(() => { const v = {}; stock.filter(r => r.estado_grupo === 'Vendido' && String(r.fechaventa || '').startsWith(anio)).forEach(r => { v[r.proyecto] = v[r.proyecto] || { n: 0, m: 0 }; v[r.proyecto].n++; v[r.proyecto].m += +r.precioventa || 0; });
            const e = Object.entries(v).sort((a, b) => b[1].n - a[1].n), mx = Math.max(1, ...e.map(x => x[1].n));
            return e.length ? e.map(([p, x]) => `<div class="hb"><span class="n" title="${esc(p)}">${esc(p)}</span><div class="t"><span style="width:${x.n / mx * 100}%;background:var(--bar)" data-tip="${esc(p)}: ${x.n} uds · ${fmtM(x.m)}"></span></div><span class="v">${x.n} uds</span></div>`).join('') : '<div class="empty">Sin ventas este año</div>'; })()}</div></div>
        <div class="card"><h3>Cómo pagan los clientes</h3><div class="sub">Tipo de financiamiento de las unidades vendidas</div>
          <div class="hbars">${(() => { const v = {}, vs = stock.filter(r => r.estado_grupo === 'Vendido'); vs.forEach(r => { const k = r.tipofinanciamiento || 'Sin dato'; v[k] = (v[k] || 0) + 1; });
            const e = Object.entries(v).sort((a, b) => b[1] - a[1]), mx = Math.max(1, ...e.map(x => x[1]));
            return e.map(([k, n]) => `<div class="hb"><span class="n">${esc(k)}</span><div class="t"><span style="width:${n / mx * 100}%;background:${k === 'Sin dato' ? 'var(--s-neutral)' : 'var(--bar)'}" data-tip="${esc(k)}: ${n} (${pct(n, vs.length)}%)"></span></div><span class="v">${pct(n, vs.length)}%</span></div>`).join(''); })()}</div></div>
      </div>`;
  },

  async lista() {
    const [stock, meta] = await Promise.all([stockPrincipal(), existe('snapshot_meta', 'generated_at,source')]);
    const proys = [...new Set(stock.map(r => r.proyecto))].sort();
    const f = ST.fLista || (ST.fLista = { proy: proys.includes('DORUÉ') ? 'DORUÉ' : proys[0], etapa: '', ver: 'todos', valor: 'precio', nums: true, dscOn: false, dsc: 10 });
    if (f.nums == null) Object.assign(f, { nums: true, dscOn: false, dsc: 10 });
    // Precio de lista, con el descuento elegido si está activado
    const DMAX = 15; // descuento máximo permitido en esta hoja
    if (+f.dsc > DMAX) f.dsc = DMAX;
    const dscF = () => f.dscOn ? 1 - Math.min(DMAX, Math.max(0, +f.dsc || 0)) / 100 : 1;
    const lista = r => (+r.preciolista || 0) * dscF();
    const dLbl = n => (+n ? String(+n).replace('.', ',') + 'D' : '');
    const VENDIDO = ['Minuta', 'Entregado', 'Cancelado'];
    // En esta hoja todo lo no vendido (disponible, separado o bloqueado) cuenta como disponible, con su precio de lista
    const grupo = r => VENDIDO.includes(r.estado) ? 'vendido' : r.estado_grupo === 'Separado' ? 'separado' : 'disponible';
    // Precio que se muestra: vendido = venta; separado = precio pactado (o lista si no tiene); disponible = lista (con descuento si aplica)
    const precioDe = r => { const g = grupo(r); return g === 'vendido' ? +r.precioventa || 0 : g === 'separado' ? (+r.precioventa || +r.preciolista || 0) : lista(r); };
    const valorDe = r => { const p = precioDe(r); return f.valor === 'm2' ? (area(r) && p ? p / area(r) : 0) : p; };
    // Heatmap rojo (más bajo) → amarillo → verde (más alto)
    const heat = (v, lo, hi) => { const t = hi > lo ? (v - lo) / (hi - lo) : 0.5; return `hsl(${Math.round(t * 125)}, 68%, ${t > .3 && t < .7 ? 40 : 42}%)`; };
    const area = r => +r.areaventa || 0;
    const fmtK = n => n >= 1e6 ? (n / 1e6).toFixed(2) + ' M' : Math.round(n / 1000) + ' k';
    const etapasDe = () => [...new Set(stock.filter(r => r.proyecto === f.proy).map(r => r.etapa))].sort();
    // Por defecto, la etapa con más unidades en venta
    const etapaDef = () => { const es = etapasDe(), n = e => stock.filter(r => r.proyecto === f.proy && r.etapa === e && !VENDIDO.includes(r.estado)).length; return es.slice().sort((a, b) => n(b) - n(a))[0]; };
    if (!etapasDe().includes(f.etapa)) f.etapa = etapaDef();
    const rowsSel = () => stock.filter(r => r.proyecto === f.proy && r.etapa === f.etapa);
    const seg = (id, val, opts) => `<div class="seg" role="group" id="${id}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${val === v}">${l}</button>`).join('')}</div>`;

    const plano = () => {
      const rs = rowsSel(), etapas = [...new Set(rs.map(r => r.etapa))].sort();
      const sum = (a, fn) => a.reduce((x, r) => x + fn(r), 0);
      $('#lMap').innerHTML = etapas.map(et => {
        const u = rs.filter(r => r.etapa === et);
        const v = u.filter(r => grupo(r) === 'vendido'), sp = u.filter(r => grupo(r) === 'separado'), d = u.filter(r => grupo(r) === 'disponible');
        const hv = f.ver === 'todos' ? [] : u.filter(r => grupo(r) === f.ver).map(valorDe).filter(x => x > 0);
        hv.sort((a, b) => a - b); // escala por posición (percentil), así un valor atípico no aplana los colores
        const pos = x => { if (hv.length < 2) return 0.5; let i = 0; while (i < hv.length && hv[i] < x) i++; let j = i; while (j < hv.length && hv[j] === x) j++; return ((i + j - 1) / 2) / (hv.length - 1); };
        const pisos = [...new Set(u.map(r => +r.nropiso || 0))].sort((a, b) => b - a);
        const unPiso = pisos.length === 1;
        let filas, cols = [];
        if (unPiso) {
          const ord = u.slice().sort((a, b) => String(a.nroinmueble).localeCompare(String(b.nroinmueble), 'es', { numeric: true }));
          filas = []; for (let i = 0; i < ord.length; i += 12) filas.push(['', ord.slice(i, i + 12)]);
        } else {
          cols = [...new Set(u.map(r => r.col))].sort((a, b) => String(a).localeCompare(String(b), 'es', { numeric: true }));
          filas = pisos.map(p => [p, cols.map(c => u.find(r => +r.nropiso === p && r.col === c) || null)]);
        }
        const nCols = unPiso ? 12 : cols.length;
        // Dormitorios de cada columna, tomando como guía el piso del medio
        const medio = pisos[Math.floor(pisos.length / 2)];
        const dormCol = c => { const g = u.find(r => +r.nropiso === medio && r.col === c); if (g && +g.numdormitorio) return g.numdormitorio;
          const cnt = {}; u.filter(r => r.col === c && +r.numdormitorio).forEach(r => cnt[r.numdormitorio] = (cnt[r.numdormitorio] || 0) + 1);
          return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]; };
        const celda = r => {
          if (!r) return '<div class="u u-vacio"></div>';
          const g = grupo(r), oculto = f.ver !== 'todos' && f.ver !== g;
          const precio = precioDe(r);
          const m2 = area(r) && precio ? precio / area(r) : null;
          const val = f.valor === 'm2' ? (m2 ? fmtN(m2) : '–') : (precio ? fmtK(precio) : '–');
          const tip = `${r.nroinmueble} · ${r.modelo || ''} · ${+r.numdormitorio || '–'} dorm. · ${fmtN(area(r))} m² · ${r.estado}` +
            (g === 'vendido' ? ` · venta ${fmtS(r.precioventa)} (lista ${fmtS(r.preciolista)})` : g === 'separado' ? ` · separado en ${fmtS(precio)} (lista ${fmtS(r.preciolista)})` : ` · lista ${fmtS(r.preciolista)}` + (f.dscOn ? ` → con ${f.dsc}% dscto ${fmtS(lista(r))}` : '')) + (m2 ? ` · ${fmtS(m2)}/m²` : '');
          const hs = !oculto && f.ver !== 'todos' && valorDe(r) > 0 ? ` style="background:${heat(pos(valorDe(r)), 0, 1)};color:#fff"` : '';
          return `<div class="u u-${g}${oculto ? ' u-off' : ''}"${hs} data-tip="${esc(tip)}">${f.nums ? `<b>${esc(r.nroinmueble)}</b>` : ''}<span>${oculto ? '' : val}</span></div>`;
        };
        return `<div class="card lista-card colores-lista"><h3>${esc(f.proy)} — ${esc(et)}</h3>
          <div class="sub">${u.length} unidades · <b>${v.length}</b> vendidas (${fmtM(sum(v, r => +r.precioventa || 0))}) · <b>${sp.length}</b> separadas (${fmtM(sum(sp, precioDe))}) · <b>${d.length}</b> disponibles (${fmtM(sum(d, lista))}${f.dscOn ? ` con ${f.dsc}% dscto` : ''})${unPiso ? ' · un solo nivel, ordenadas por número' : ''}</div>
          <div class="plano mini" style="grid-template-columns:26px repeat(${nCols}, minmax(0,1fr))">
            <div class="ph">${unPiso ? '' : 'Piso'}</div>${unPiso ? '<div class="ph"></div>'.repeat(nCols) : cols.map(c => `<div class="ph ph-col"><span>${esc(String(+c || c))}</span><b>${dLbl(dormCol(c))}</b></div>`).join('')}
            ${filas.map(([p, us]) => `<div class="ph">${p}</div>${us.map(celda).join('')}${unPiso ? '<div class="u u-vacio"></div>'.repeat(nCols - us.length) : ''}`).join('')}
          </div></div>`;
      }).join('') || '<div class="empty">Sin unidades con estos filtros</div>';
    };

    const tabla = () => {
      const rs = rowsSel();
      const dk = r => +r.numdormitorio || 0;
      const keys = [...new Set(rs.map(dk))].sort((a, b) => a - b);
      const agg = a => { const v = a.filter(r => grupo(r) === 'vendido'), sp = a.filter(r => grupo(r) === 'separado'), d = a.filter(r => grupo(r) === 'disponible');
        const sv = v.reduce((x, r) => x + precioDe(r), 0), ss = sp.reduce((x, r) => x + precioDe(r), 0), sd = d.reduce((x, r) => x + lista(r), 0);
        return `<td class="r g1">${fmtN(v.length)}</td><td class="r">${fmtS(sv)}</td><td class="r g1">${fmtN(sp.length)}</td><td class="r">${fmtS(ss)}</td><td class="r g1">${fmtN(d.length)}</td><td class="r">${fmtS(sd)}</td><td class="r g1 tt">${fmtN(a.length)}</td><td class="r tt">${fmtS(sv + ss + sd)}</td>`; };
      $('#lTabla').innerHTML = `<table class="tbl tbl-res"><thead><tr><th rowspan="2">Dormitorios</th><th class="c g1" colspan="2">Vendido</th><th class="c g1" colspan="2">Separado</th><th class="c g1" colspan="2">Disponible</th><th class="c g1" colspan="2">Total</th></tr>
        <tr><th class="r g1">Uds.</th><th class="r">Precio venta</th><th class="r g1">Uds.</th><th class="r">Precio separación</th><th class="r g1">Uds.</th><th class="r">Precio lista${f.dscOn ? ` (−${f.dsc}%)` : ''}</th><th class="r g1">Uds.</th><th class="r">Monto</th></tr></thead>
        <tbody>${keys.map(k => `<tr><td>${k ? dLbl(k) : 'Sin dato'}</td>${agg(rs.filter(r => dk(r) === k))}</tr>`).join('')}</tbody>
        <tfoot><tr class="tot"><td>Total</td>${agg(rs)}</tr></tfoot></table>`;
    };

    const leyenda = () => {
      const nom = { vendido: 'vendidos', separado: 'separados', disponible: 'disponibles' };
      $('#lLeg').innerHTML = f.ver === 'todos'
        ? '<span><i style="background:var(--u-disp)"></i>Vendido (precio de venta)</span><span><i style="background:var(--u-separado)"></i>Separado (precio pactado)</span><span><i style="background:var(--u-vendido)"></i>Disponible, incluye bloqueadas (precio de lista)</span>'
        : `<span class="heat-leg">Más bajo <i></i> Más alto</span><span>Escala de ${f.valor === 'm2' ? 'precio m²' : 'precio'} entre los ${nom[f.ver]}</span>`;
    };

    const render = () => {
      $('#view').innerHTML = `
        <div class="head"><div><div class="eyebrow">Ventas</div><h1>Lista de precios</h1></div>${stamp(meta)}</div>
        <div class="filters">
          <select id="lProy" aria-label="Proyecto">${proys.map(p => `<option ${f.proy === p ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select>
          <select id="lEtapa" aria-label="Etapa">${etapasDe().map(e => `<option ${f.etapa === e ? 'selected' : ''}>${esc(e)}</option>`).join('')}</select>
          ${seg('lVer', f.ver, [['todos', 'Todos'], ['vendido', 'Vendidos'], ['separado', 'Separados'], ['disponible', 'Disponibles']])}
          ${seg('lValor', f.valor, [['precio', 'Precio (S/)'], ['m2', 'Precio m² (S/)']])}
          <label class="sw"><input type="checkbox" id="lNums" ${f.nums ? 'checked' : ''}><i></i>Nº de dpto</label>
          <label class="sw"><input type="checkbox" id="lDscOn" ${f.dscOn ? 'checked' : ''}><i></i>Descuento a la lista</label>
          <label class="sim-desc" id="lDscBox" ${f.dscOn ? '' : 'hidden'}><input id="lDscR" type="range" min="0" max="15" step="0.5" value="${f.dsc}" aria-label="Descuento en porcentaje"><input id="lDscN" class="sim-in" type="number" min="0" max="15" step="0.5" value="${f.dsc}"> %</label>
          <div class="legend" id="lLeg" style="margin:0"></div>
        </div>
        <div id="lMap"></div>
        <div class="card" style="margin-top:14px"><h3>Resumen por dormitorios</h3><div class="sub">Vendido a precio de venta; separado al precio pactado; disponible (incluye bloqueadas) a precio de lista</div><div class="tbl-wrap" id="lTabla"></div></div>`;
      leyenda(); plano(); tabla();
      $('#lProy').onchange = e => { f.proy = e.target.value; f.etapa = etapaDef(); render(); };
      $('#lEtapa').onchange = e => { f.etapa = e.target.value; render(); };
      const segOn = (id, fn) => $('#' + id).onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; $('#' + id).querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); fn(b.dataset.v); };
      segOn('lVer', v => { f.ver = v; leyenda(); plano(); });
      segOn('lValor', v => { f.valor = v; leyenda(); plano(); });
      const upd = () => { plano(); tabla(); };
      $('#lNums').onchange = e => { f.nums = e.target.checked; plano(); };
      $('#lDscOn').onchange = e => { f.dscOn = e.target.checked; $('#lDscBox').hidden = !f.dscOn; upd(); };
      $('#lDscR').oninput = e => { f.dsc = +e.target.value; $('#lDscN').value = f.dsc; upd(); };
      $('#lDscN').oninput = e => { let v = e.target.value === '' ? 0 : +e.target.value; if (v > DMAX) { v = DMAX; e.target.value = DMAX; } f.dsc = v; $('#lDscR').value = f.dsc; upd(); };
    };
    render();
  },

  async precios() {
    const [stock, meta] = await Promise.all([stockPrincipal(), existe('snapshot_meta', 'generated_at,source')]);
    const proys = [...new Set(stock.map(r => r.proyecto))].sort();
    const f = ST.fPrecios || (ST.fPrecios = { proy: proys.includes('DORUÉ') ? 'DORUÉ' : proys[0], etapa: '', ver: 'todos', valor: 'precio', tip: '', modo: 'pct', general: 0, ajustes: {}, desc: 0 });
    if (f.desc == null) f.desc = 0;
    const VENDIDO = ['Minuta', 'Entregado', 'Cancelado'];
    const grupo = r => VENDIDO.includes(r.estado) ? 'vendido' : r.estado_grupo === 'Disponible' ? 'disponible' : r.estado_grupo === 'Separado' ? 'separado' : 'bloqueado';
    const area = r => +r.areaventa || 0;
    const m2Lista = r => area(r) ? (+r.preciolista || 0) / area(r) : 0;
    const fmtK = n => n >= 1e6 ? 'S/ ' + (n / 1e6).toFixed(2) + ' M' : 'S/ ' + Math.round(n / 1000) + ' k';
    const rowsSel = () => stock.filter(r => r.proyecto === f.proy && (!f.etapa || r.etapa === f.etapa));
    const tipDe = (r, modo) => modo === 'dorm' ? ((+r.numdormitorio || 0) ? (+r.numdormitorio) + ' dorm.' : 'Sin dato') : modo === 'col' ? 'Columna ' + (r.col || '–') : (r.modelo || 'Sin modelo');
    const tipAuto = rs => new Set(rs.map(r => r.modelo).filter(Boolean)).size <= 15 && rs.some(r => r.modelo) ? 'modelo' : 'dorm';
    /* Precio de lista simulado de una unidad disponible */
    const ajuste = r => (+f.general || 0) + (+f.ajustes[tipDe(r, f.tipModo)] || 0);
    const m2Sim = r => { const b = m2Lista(r), a = ajuste(r); return f.modo === 'pct' ? b * (1 + a / 100) : b + a; };
    const listaSim = r => area(r) ? m2Sim(r) * area(r) : (+r.preciolista || 0) * (f.modo === 'pct' ? 1 + ajuste(r) / 100 : 1);
    const hayAjuste = () => (+f.general || 0) !== 0 || Object.values(f.ajustes).some(v => +v);
    const dsc = () => Math.min(100, Math.max(0, +f.desc || 0)) / 100;
    const neto = r => listaSim(r) * (1 - dsc());
    const hayAlgo = () => hayAjuste() || dsc() > 0;
    /* Descuento real promedio en lo vendido (lista vs venta), como referencia */
    const descHist = () => { const v = rowsSel().filter(r => grupo(r) === 'vendido' && +r.preciolista > 0 && +r.precioventa > 0); const l = v.reduce((x, r) => x + +r.preciolista, 0); return l ? (1 - v.reduce((x, r) => x + +r.precioventa, 0) / l) * 100 : null; };

    const cards = () => {
      const rs = rowsSel(), v = rs.filter(r => grupo(r) === 'vendido'), d = rs.filter(r => grupo(r) === 'disponible'), s = rs.filter(r => grupo(r) === 'separado');
      const sum = (a, fn) => a.reduce((x, r) => x + fn(r), 0);
      const mv = sum(v, r => +r.precioventa || 0), av = sum(v, area), ml = sum(d, r => +r.preciolista || 0), mls = sum(d, listaSim), ad = sum(d, area);
      const mn = sum(d, neto), delta = mn - ml;
      $('#pCards').innerHTML = `
        ${kpi('Total proyectado', fmtM(mv + mn), `Vendido a precio de venta + disponible a precio de lista${dsc() ? ` con ${(dsc() * 100).toFixed(1)}% de descuento` : ''}${s.length ? ` · no incluye ${s.length} separadas` : ''}`)}
        ${kpi('Vendidos', fmtM(mv), `${fmtN(v.length)} uds · ${fmtN(av)} m² vendidos · ${fmtS(av ? mv / av : null)}/m²`)}
        ${kpi('Disponibles (lista)', fmtM(mls), `${fmtN(d.length)} uds · ${fmtN(ad)} m² · ${fmtS(ad ? mls / ad : null)}/m²${dsc() ? ` · con descuento: ${fmtM(mn)} (${fmtS(ad ? mn / ad : null)}/m²)` : ''}`)}
        ${kpi('Efecto de la simulación', hayAlgo() ? (delta >= 0 ? '+' : '−') + fmtM(Math.abs(delta)) : 'Sin cambios', hayAlgo() ? `${(ml ? delta / ml * 100 : 0).toFixed(1)}% frente a la lista actual de ${fmtM(ml)}` : 'Mueve el precio m² o el descuento para simular')}`;
    };

    const simTabla = () => {
      const d = rowsSel().filter(r => grupo(r) === 'disponible');
      const tips = {}; d.forEach(r => { const k = tipDe(r, f.tipModo); (tips[k] = tips[k] || []).push(r); });
      ST.simTips = Object.keys(tips).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
      const u = f.modo === 'pct' ? '%' : 'S/ m²';
      $('#simBody').innerHTML = ST.simTips.length ? ST.simTips.map((k, i) => {
        const a = tips[k], ar = a.reduce((x, r) => x + area(r), 0), l = a.reduce((x, r) => x + (+r.preciolista || 0), 0);
        return `<tr><td>${esc(k)}</td><td class="r">${a.length}</td><td class="r">${fmtN(ar / a.length)} m²</td><td class="r">${fmtS(ar ? l / ar : null)}</td>
          <td class="r"><input class="sim-in" type="number" step="${f.modo === 'pct' ? 0.5 : 50}" data-tip-k="${esc(k)}" value="${f.ajustes[k] || ''}" placeholder="0" aria-label="Ajuste ${esc(k)} en ${u}"></td>
          <td class="r" id="simM2-${i}"></td><td class="r" id="simTot-${i}"></td><td class="r" id="simNet-${i}"></td></tr>`;
      }).join('') : '<tr><td colspan="8" class="empty">No hay unidades disponibles con estos filtros</td></tr>';
      $('#simUnit').textContent = u; $('#simUnit2').textContent = u;
    };
    const simResultados = () => {
      const d = rowsSel().filter(r => grupo(r) === 'disponible');
      (ST.simTips || []).forEach((k, i) => {
        const a = d.filter(r => tipDe(r, f.tipModo) === k), ar = a.reduce((x, r) => x + area(r), 0), t = a.reduce((x, r) => x + listaSim(r), 0), n = a.reduce((x, r) => x + neto(r), 0);
        const e1 = $('#simM2-' + i), e2 = $('#simTot-' + i); if (e1) e1.textContent = fmtS(ar ? t / ar : null); if (e2) e2.textContent = fmtM(t); const e3 = $('#simNet-' + i); if (e3) e3.textContent = fmtM(n);
      });
    };
    const todo = () => { cards(); simResultados(); };

    const etapasDe = () => [...new Set(stock.filter(r => r.proyecto === f.proy).map(r => r.etapa))].sort();
    const seg = (id, val, opts) => `<div class="seg" role="group" id="${id}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${val === v}">${l}</button>`).join('')}</div>`;
    const render = () => {
      if (!f.tipModo) f.tipModo = tipAuto(rowsSel());
      $('#view').innerHTML = `
        <div class="head"><div><div class="eyebrow">Ventas</div><h1>Precios</h1></div>${stamp(meta)}</div>
        <div class="filters">
          <select id="fProy" aria-label="Proyecto">${proys.map(p => `<option ${f.proy === p ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select>
          <select id="fEtapa" aria-label="Etapa"><option value="">Todas las etapas</option>${etapasDe().map(e => `<option ${f.etapa === e ? 'selected' : ''}>${esc(e)}</option>`).join('')}</select>
        </div>
        <div class="grid g4" id="pCards"></div>
        <div class="card" style="margin-top:16px"><h3>Simulador de precio de lista</h3><div class="sub">Solo cambia las unidades disponibles. El ajuste general se suma al de cada tipología, y el descuento se aplica sobre la lista simulada.</div>
          <div class="sim-bar">
            ${seg('fModo', f.modo, [['pct', 'En %'], ['soles', 'En S/ por m²']])}
            <label class="sim-gen">Ajuste general <input id="simGen" class="sim-in" type="number" step="${f.modo === 'pct' ? 0.5 : 50}" value="${f.general || ''}" placeholder="0"> <span id="simUnit"></span></label>
            <label class="sim-desc">Descuento <input id="descRange" type="range" min="0" max="30" step="0.5" value="${f.desc || 0}" aria-label="Descuento en porcentaje"><input id="descNum" class="sim-in" type="number" min="0" max="100" step="0.5" value="${f.desc || ''}" placeholder="0"> %</label>
            ${descHist() != null ? `<button type="button" class="lg-link" id="descUsar" style="color:var(--ink-2)">Usar descuento real de lo vendido: ${descHist().toFixed(1)}%</button>` : ''}
            <label>Tipología por <select id="fTip"><option value="modelo" ${f.tipModo === 'modelo' ? 'selected' : ''}>Modelo</option><option value="dorm" ${f.tipModo === 'dorm' ? 'selected' : ''}>Dormitorios</option><option value="col" ${f.tipModo === 'col' ? 'selected' : ''}>Columna (01–10)</option></select></label>
            <button class="btn" type="button" id="simReset">Volver a la lista actual</button>
          </div>
          <div class="tbl-wrap scroll"><table class="tbl"><thead><tr><th>Tipología</th><th class="r">Disp.</th><th class="r">Área prom.</th><th class="r">m² lista hoy</th><th class="r">Ajuste (<span id="simUnit2"></span>)</th><th class="r">m² simulado</th><th class="r">Lista simulada</th><th class="r">Venta neta (con dscto)</th></tr></thead><tbody id="simBody"></tbody></table></div>
        </div>
`;
      simTabla(); todo();
      $('#fProy').onchange = e => { f.proy = e.target.value; f.etapa = ''; f.tipModo = ''; f.general = 0; f.ajustes = {}; render(); };
      $('#fEtapa').onchange = e => { f.etapa = e.target.value; f.tipModo = ''; f.ajustes = {}; render(); };
      $('#fTip').onchange = e => { f.tipModo = e.target.value; f.ajustes = {}; simTabla(); todo(); };
      $('#simGen').oninput = e => { f.general = e.target.value; todo(); };
      $('#simBody').oninput = e => { const k = e.target.dataset.tipK; if (k != null) { f.ajustes[k] = e.target.value; todo(); } };
      $('#simReset').onclick = () => { f.general = 0; f.ajustes = {}; f.desc = 0; render(); };
      const setDesc = (v, src) => { f.desc = v; if (src !== 'r') $('#descRange').value = v || 0; if (src !== 'n') $('#descNum').value = v || ''; todo(); };
      $('#descRange').oninput = e => setDesc(+e.target.value, 'r');
      $('#descNum').oninput = e => setDesc(e.target.value === '' ? 0 : +e.target.value, 'n');
      if ($('#descUsar')) $('#descUsar').onclick = () => setDesc(Math.round(descHist() * 10) / 10);
      const segOn = (id, fn) => $('#' + id).onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; $('#' + id).querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); fn(b.dataset.v); };
      segOn('fModo', v => { f.modo = v; f.general = 0; f.ajustes = {}; render(); });
    };
    render();
  },

  async accesos() {
    if (!ST.perfil.admin) { $('#view').innerHTML = '<div class="empty"><b>Solo administradores</b></div>'; return; }
    const SEC = SECCIONES.flatMap(g => g.items).filter(i => i.perm !== '__admin');
    const yo = (await API.sesion() || {}).email;
    const draw = async () => {
      const rows = await API.accesos();
      $('#aBody').innerHTML = rows.length ? rows.map(r => {
        const sec = new Set(r.secciones || []), propio = (r.email || '').toLowerCase() === (yo || '').toLowerCase();
        const est = !r.cuenta ? '<span class="pill">Sin cuenta</span>' : r.cuenta === 'pendiente' ? '<span class="pill warn">Invitado</span>' : '<span class="pill good">Activo</span>';
        return `<tr data-email="${esc(r.email)}">
          <td><b>${esc(r.nombre || r.email.split('@')[0])}</b><br><small style="color:var(--ink-3)">${esc(r.email)}</small></td>
          <td>${est}${r.ultimo_ingreso ? `<br><small style="color:var(--ink-3)">Últ. ingreso ${new Date(r.ultimo_ingreso).toLocaleDateString('es-PE')}</small>` : ''}</td>
          <td><label class="chk"><input type="checkbox" data-campo="admin" ${r.admin ? 'checked' : ''} ${propio ? 'disabled' : ''}> Admin</label></td>
          <td class="secs">${SEC.map(i => `<label class="chk"><input type="checkbox" data-sec="${i.perm}" ${sec.has(i.perm) || r.admin ? 'checked' : ''} ${r.admin ? 'disabled' : ''}> ${esc(i.label)}</label>`).join('')}</td>
          <td><label class="chk"><input type="checkbox" data-campo="activo" ${r.activo ? 'checked' : ''} ${propio ? 'disabled' : ''}> Puede entrar</label></td>
          <td class="r" style="white-space:nowrap"><button class="btn sm" data-a="enlace">Enlace de acceso</button> ${propio ? '' : '<button class="btn sm danger" data-a="quitar">Quitar</button>'}</td></tr>`;
      }).join('') : '<tr><td colspan="6" class="empty">Aún no hay usuarios</td></tr>';
    };
    $('#view').innerHTML = `
      <div class="head"><div><div class="eyebrow">Administración</div><h1>Accesos</h1></div></div>
      <div class="card"><h3>Invitar a una persona</h3><div class="sub">Solo pueden entrar los correos invitados aquí. Al invitar se genera un enlace para que la persona cree su contraseña.</div>
        <form id="invForm" class="inv" novalidate>
          <input id="invEmail" type="email" placeholder="correo@desarrolladora.com" required>
          <input id="invNombre" type="text" placeholder="Nombre y apellido">
          <div class="secs">${SEC.map(i => `<label class="chk"><input type="checkbox" name="sec" value="${i.perm}" checked> ${esc(i.label)}</label>`).join('')}<label class="chk"><input type="checkbox" id="invAdmin"> Administrador</label></div>
          <button class="btn primary" type="submit">Invitar</button>
        </form>
        <div id="invOut"></div></div>
      <div class="card" style="margin-top:16px"><h3>Usuarios</h3><div class="sub">Los cambios se guardan al marcar. "Puede entrar" apagado bloquea el acceso sin borrar la cuenta.</div>
        <div class="tbl-wrap"><table class="tbl acc"><thead><tr><th>Persona</th><th>Cuenta</th><th>Rol</th><th>Secciones</th><th>Estado</th><th></th></tr></thead><tbody id="aBody"></tbody></table></div></div>`;
    const linkBox = (titulo, r) => { $('#invOut').innerHTML = `<div class="notice" style="margin:14px 0 0"><div><b>${esc(titulo)}</b>${r.enviado ? 'También se envió por correo. ' : ''}Copia este enlace y envíaselo (sirve una vez y vence en 24 horas):
      <div class="link-row"><input readonly value="${esc(r.link)}" id="lnk"><button class="btn sm" type="button" id="cpy">Copiar</button></div></div></div>`;
      $('#cpy').onclick = () => { $('#lnk').select(); navigator.clipboard && navigator.clipboard.writeText($('#lnk').value); $('#cpy').textContent = 'Copiado'; }; };
    $('#invForm').onsubmit = async e => {
      e.preventDefault(); const btn = e.target.querySelector('button[type=submit]');
      const email = $('#invEmail').value.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $('#invOut').innerHTML = '<div class="notice" style="margin-top:14px">Escribe un correo válido.</div>'; return; }
      btn.disabled = true; btn.textContent = 'Invitando…';
      try {
        const r = await API.usuarios({ accion: 'invitar', email, nombre: $('#invNombre').value.trim(), admin: $('#invAdmin').checked,
          secciones: [...document.querySelectorAll('#invForm input[name=sec]:checked')].map(x => x.value) });
        linkBox('Invitación creada para ' + email, r); e.target.reset(); document.querySelectorAll('#invForm input[name=sec]').forEach(x => x.checked = true); await draw();
      } catch (err) { $('#invOut').innerHTML = `<div class="notice" style="margin-top:14px">${esc(err.message)}</div>`; }
      btn.disabled = false; btn.textContent = 'Invitar';
    };
    $('#aBody').onchange = async e => {
      const tr = e.target.closest('tr[data-email]'); if (!tr) return;
      const email = tr.dataset.email, c = e.target.dataset.campo;
      const cambios = c ? { [c]: e.target.checked } : { secciones: [...tr.querySelectorAll('input[data-sec]:checked')].map(x => x.dataset.sec) };
      try { await API.guardarAcceso(email, cambios); if (c === 'admin') await draw(); }
      catch (err) { e.target.checked = !e.target.checked; alert('No se pudo guardar: ' + err.message); }
    };
    $('#aBody').onclick = async e => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const email = b.closest('tr').dataset.email;
      if (b.dataset.a === 'quitar' && !confirm(`¿Quitar el acceso de ${email}? Se borra su cuenta del portal.`)) return;
      b.disabled = true;
      try {
        const r = await API.usuarios({ accion: b.dataset.a, email });
        if (b.dataset.a === 'enlace') { linkBox('Enlace de acceso para ' + email, r); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        await draw();
      } catch (err) { alert(err.message); b.disabled = false; }
    };
    await draw();
  },

  async ejecutivo() {
    const [st, monto, mens, metas, fases, meta] = await Promise.all([
      datos('exec_stage_stats', 'proyecto,etapa,tipo,principales,vendidas,comprometidas,disponibles,velocidad_2026'),
      datos('exec_project_monto', 'proyecto,monto_venta_pen,ocs_venta'),
      datos('exec_monthly_sales', 'mes,ocs_vendidas,monto_venta_pen,parcial'),
      existe('commercial_targets', 'mes,proyecto,etapa,meta_unidades,meta_monto'),
      existe('exec_etapa_config', 'proyecto,etapa,fase'),
      existe('snapshot_meta', 'generated_at,source')]);
    const rows = st.filter(r => !excluido(r)).sort((a, b) => a.proyecto.localeCompare(b.proyecto) || a.etapa.localeCompare(b.etapa));
    const sum = k => rows.reduce((a, r) => a + (+r[k] || 0), 0);
    const tot = sum('principales'), ven = sum('vendidas'), comp = sum('comprometidas'), dis = sum('disponibles');
    const fase = {}; (fases || []).forEach(f => { fase[f.proyecto + '|' + f.etapa] = f.fase; });
    const anio = String(new Date().getFullYear());
    const m = mens.filter(r => r.mes.startsWith(anio)).sort((a, b) => a.mes.localeCompare(b.mes));
    const metaMes = {}, metaMonto = {}; (metas || []).forEach(r => { metaMes[r.mes] = (metaMes[r.mes] || 0) + (+r.meta_unidades || 0); metaMonto[r.mes] = (metaMonto[r.mes] || 0) + (+r.meta_monto || 0); });
    const udsAnio = m.reduce((a, r) => a + (+r.ocs_vendidas || 0), 0), montoAnio = m.reduce((a, r) => a + (+r.monto_venta_pen || 0), 0);
    const metaAnio = m.reduce((a, r) => a + (metaMes[r.mes] || 0), 0);
    const tipos = [...new Set(rows.map(r => r.tipo).filter(Boolean))];
    const mp = monto.filter(r => !excluido(r)).sort((a, b) => b.monto_venta_pen - a.monto_venta_pen), mx = Math.max(1, ...mp.map(r => +r.monto_venta_pen || 0));
    $('#view').innerHTML = `
      <div class="head"><div><div class="eyebrow">Dirección</div><h1>Resumen ejecutivo</h1></div>${stamp(meta)}</div>
      <div class="grid g4">
        ${kpi('Unidades vendidas', fmtN(ven), pct(ven, tot) + '% de ' + fmtN(tot) + ' unidades')}
        ${kpi('Comprometidas', fmtN(comp), 'Separadas, aún sin minuta')}
        ${kpi('Disponibles', fmtN(dis), pct(dis, tot) + '% del inventario')}
        ${kpi('Venta ' + anio, fmtM(montoAnio), fmtN(udsAnio) + ' uds' + (metaAnio ? ' · ' + pct(udsAnio, metaAnio) + '% de la meta' : ''))}
      </div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card"><h3>Ventas por mes</h3><div class="sub">${anio} · unidades; la línea punteada es la meta${m.some(r => r.parcial) ? ' · el último mes va en curso' : ''}</div>
          ${m.length ? columnas(m, { val: r => +r.ocs_vendidas, lbl: r => fmtMes(r.mes).split(' ')[0], meta: r => metaMes[r.mes], tipFn: r => `${fmtMes(r.mes)}: ${r.ocs_vendidas} uds · ${fmtM(r.monto_venta_pen)}${metaMes[r.mes] ? ' · meta ' + metaMes[r.mes] + ' uds / ' + fmtM(metaMonto[r.mes]) : ''}` }) : '<div class="empty">Sin ventas este año</div>'}</div>
        <div class="card"><h3>Monto vendido por proyecto</h3><div class="sub">Acumulado histórico</div>
          <div class="hbars">${mp.map(r => `<div class="hb"><span class="n" title="${esc(r.proyecto)}">${esc(r.proyecto)}</span><div class="t"><span style="width:${(+r.monto_venta_pen || 0) / mx * 100}%;background:var(--bar)" data-tip="${esc(r.proyecto)}: ${fmtS(r.monto_venta_pen)} · ${fmtN(r.ocs_venta)} uds"></span></div><span class="v">${fmtM(r.monto_venta_pen)}</span></div>`).join('')}</div></div>
      </div>
      <div class="card" style="margin-top:16px"><h3>Avance por proyecto y etapa</h3><div class="sub">Unidades principales${tipos.length ? ' (' + tipos.map(esc).join(' y ').toLowerCase() + ')' : ''} · velocidad = unidades vendidas por mes en ${anio}</div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Proyecto</th><th>Etapa</th><th>Fase</th><th>Tipo</th><th class="r">Total</th><th class="r">Vendidas</th><th class="r">Comprometidas</th><th class="r">Disponibles</th><th class="r">% vendido</th><th class="r">Velocidad</th><th class="r">Meses de stock</th></tr></thead>
        <tbody>${rows.map(r => { const v = +r.velocidad_2026 || 0, d = +r.disponibles || 0;
          return `<tr><td><b>${esc(r.proyecto)}</b></td><td>${esc(r.etapa)}</td><td>${fase[r.proyecto + '|' + r.etapa] ? `<span class="pill">${esc(fase[r.proyecto + '|' + r.etapa])}</span>` : '–'}</td><td>${esc(r.tipo || '–')}</td>
            <td class="r">${fmtN(r.principales)}</td><td class="r">${fmtN(r.vendidas)}</td><td class="r">${fmtN(r.comprometidas)}</td><td class="r">${fmtN(d)}</td>
            <td class="r">${pct(r.vendidas, r.principales)}%</td><td class="r">${v ? v.toLocaleString('es-PE', { maximumFractionDigits: 1 }) : '–'}</td><td class="r">${d && v ? Math.round(d / v) : '–'}</td></tr>`; }).join('')}
          <tr><td><b>Total</b></td><td></td><td></td><td></td><td class="r"><b>${fmtN(tot)}</b></td><td class="r"><b>${fmtN(ven)}</b></td><td class="r"><b>${fmtN(comp)}</b></td><td class="r"><b>${fmtN(dis)}</b></td><td class="r"><b>${pct(ven, tot)}%</b></td><td></td><td></td></tr></tbody></table></div></div>`;
  },

  async metas() {
    const [metas, st, meta] = await Promise.all([
      API.tabla('commercial_targets', 'mes,proyecto,etapa,meta_unidades,meta_monto,updated_by,updated_at'),
      datos('exec_stage_stats', 'proyecto,etapa'), existe('snapshot_meta', 'generated_at,source')]);
    const edita = ST.perfil.admin;
    const anios = [...new Set(metas.map(r => r.mes.slice(0, 4)).concat(String(new Date().getFullYear())))].sort();
    const f = { anio: String(new Date().getFullYear()), campo: 'meta_unidades' };
    const pe = [...new Set(st.filter(r => !excluido(r)).map(r => r.proyecto + '|' + r.etapa).concat(metas.map(r => r.proyecto + '|' + r.etapa)))].filter(k => !excluido({ proyecto: k.split('|')[0], etapa: k.split('|')[1] })).sort();
    const idx = {}; metas.forEach(r => { idx[r.mes + '|' + r.proyecto + '|' + r.etapa] = r; });
    $('#view').innerHTML = `
      <div class="head"><div><div class="eyebrow">Comercial</div><h1>Metas comerciales</h1></div>${stamp(meta)}</div>
      <div class="card"><div class="filters">
        <label>Año <select id="mAnio">${anios.map(a => `<option ${a === f.anio ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
        <label>Ver <select id="mCampo"><option value="meta_unidades">Unidades</option><option value="meta_monto">Monto (S/)</option></select></label>
        ${edita ? '<span class="sub" style="margin:0">Edita una celda y sal de ella para guardar.</span>' : '<span class="sub" style="margin:0">Solo lectura. Los administradores pueden editar.</span>'}
        <span id="mMsg" class="sub" style="margin:0"></span></div>
        <div class="tbl-wrap" style="margin-top:12px"><table class="tbl metas"><thead id="mHead"></thead><tbody id="mBody"></tbody></table></div></div>`;
    const draw = () => {
      const meses = Array.from({ length: 12 }, (_, i) => f.anio + '-' + String(i + 1).padStart(2, '0'));
      const fmt = v => v == null ? '' : f.campo === 'meta_monto' ? Math.round(v) : v;
      $('#mHead').innerHTML = `<tr><th>Proyecto · etapa</th>${meses.map(m => `<th class="r">${fmtMes(m).split(' ')[0]}</th>`).join('')}<th class="r">Total</th></tr>`;
      const totMes = {};
      $('#mBody').innerHTML = pe.map(k => {
        const [p, e] = k.split('|'); let t = 0;
        const cells = meses.map(m => { const r = idx[m + '|' + k], v = r ? +r[f.campo] : null; if (v) { t += v; totMes[m] = (totMes[m] || 0) + v; }
          return `<td class="r">${edita ? `<input class="cell" inputmode="numeric" data-k="${esc(m + '|' + k)}" value="${fmt(v)}" title="${r && r.updated_by ? 'Últ. cambio: ' + esc(r.updated_by) : ''}">` : (v == null ? '–' : f.campo === 'meta_monto' ? fmtM(v) : fmtN(v))}</td>`; }).join('');
        return `<tr><td><b>${esc(p)}</b> · ${esc(e)}</td>${cells}<td class="r"><b>${f.campo === 'meta_monto' ? fmtM(t) : fmtN(t)}</b></td></tr>`;
      }).join('') + `<tr><td><b>Total</b></td>${meses.map(m => `<td class="r"><b>${totMes[m] ? (f.campo === 'meta_monto' ? fmtM(totMes[m]) : fmtN(totMes[m])) : '–'}</b></td>`).join('')}<td class="r"><b>${(() => { const t = Object.values(totMes).reduce((a, b) => a + b, 0); return f.campo === 'meta_monto' ? fmtM(t) : fmtN(t); })()}</b></td></tr>`;
    };
    $('#mAnio').onchange = e => { f.anio = e.target.value; draw(); };
    $('#mCampo').onchange = e => { f.campo = e.target.value; draw(); };
    if (edita) $('#mBody').addEventListener('change', async e => {
      const inp = e.target.closest('input[data-k]'); if (!inp) return;
      const [mes, proyecto, etapa] = inp.dataset.k.split('|');
      const raw = inp.value.replace(/[^\d]/g, ''), v = raw === '' ? 0 : +raw;
      const prev = idx[inp.dataset.k] || { mes, proyecto, etapa, meta_unidades: 0, meta_monto: 0 };
      const fila = { mes, proyecto, etapa, meta_unidades: +prev.meta_unidades || 0, meta_monto: +prev.meta_monto || 0, [f.campo]: v };
      inp.disabled = true; $('#mMsg').textContent = 'Guardando…';
      try {
        await API.guardarMeta(fila);
        idx[inp.dataset.k] = { ...prev, ...fila }; delete ST.cache['commercial_targets|mes,proyecto,etapa,meta_unidades,meta_monto'];
        $('#mMsg').textContent = 'Guardado'; draw();
      } catch (err) { $('#mMsg').textContent = 'No se pudo guardar: ' + err.message; inp.disabled = false; }
    });
    draw();
  },

  async sincronizaciones() {
    if (!ST.perfil.admin) { $('#view').innerHTML = '<div class="empty"><b>Solo administradores</b></div>'; return; }
    const rows = (await API.tabla('sync_runs', 'started_at,finished_at,duration_ms,status,rows_processed,error', q => q.order('started_at', { ascending: false }).limit(60))).slice(0, 60);
    const ok = rows.filter(r => r.status === 'ok').length, ult = rows[0];
    $('#view').innerHTML = `
      <div class="head"><div><div class="eyebrow">Administración</div><h1>Sincronizaciones</h1></div></div>
      <div class="grid g4">
        ${kpi('Última sincronización', ult ? new Date(ult.started_at).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' }) : '–', ult ? (ult.status === 'ok' ? 'Correcta' : 'Con error') : '')}
        ${kpi('Filas en la última', ult ? fmtN(ult.rows_processed) : '–', ult && ult.duration_ms ? (ult.duration_ms / 1000).toLocaleString('es-PE', { maximumFractionDigits: 1 }) + ' s' : '')}
        ${kpi('Correctas', ok + ' de ' + rows.length, 'Últimas ' + rows.length + ' corridas')}
        ${kpi('Fuente', 'Evolta', 'Sincronización automática')}
      </div>
      <div class="card" style="margin-top:16px"><h3>Historial</h3>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Inicio</th><th>Estado</th><th class="r">Filas</th><th class="r">Duración</th><th>Detalle</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td>${new Date(r.started_at).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}</td>
          <td>${r.status === 'ok' ? '<span class="pill good">Correcta</span>' : `<span class="pill warn">${esc(r.status)}</span>`}</td>
          <td class="r">${fmtN(r.rows_processed)}</td><td class="r">${r.duration_ms ? (r.duration_ms / 1000).toLocaleString('es-PE', { maximumFractionDigits: 1 }) + ' s' : '–'}</td>
          <td><small>${esc(r.error || '')}</small></td></tr>`).join('') || '<tr><td colspan="5" class="empty">Sin registros</td></tr>'}</tbody></table></div></div>`;
  },

  async prep(it) {
    const g = SECCIONES.find(g => g.items.includes(it));
    $('#view').innerHTML = `
      <div class="head"><div><div class="eyebrow">${esc(g ? g.grupo : '')}</div><h1>${esc(it.label)}</h1></div></div>
      <div class="card"><div class="empty"><b>Módulo en preparación</b>Este tablero se activa cuando su fuente de datos esté conectada al portal.</div></div>`;
  }
};
const kpi = (l, v, f) => `<div class="card kpi"><div class="lbl">${l}</div><div class="val">${v}</div><div class="foot">${f || ''}</div></div>`;
function stamp(meta) {
  const m = meta && meta[0]; if (!m) return '';
  return `<div class="stamp">Actualizado ${new Date(m.generated_at).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })} · ${esc(m.source || '')}</div>`;
}

/* ---------------- Arranque ---------------- */
(async function start() {
  try { const t = localStorage.getItem('pg-theme'); if (t) setTheme(t); } catch (_) { }
  if (DEMO) {
    const real = typeof REAL_DATA !== 'undefined';
    document.body.insertAdjacentHTML('beforeend', `<div class="demo-flag">${real ? 'VISTA PREVIA · DATOS REALES DE EVOLTA · SIN LOGIN' : 'VISTA PREVIA · DATOS DE EJEMPLO'}</div>`);
    if (real) { $('[data-act="salir"]').hidden = true; return entrar(); }
    ST.modoLogin = 'login'; renderLogin(); return;
  }
  // Enlace de invitación / nueva contraseña: #acceso=<token>&tipo=invite|recovery
  const h = new URLSearchParams(location.hash.slice(1));
  // Primer acceso de la dueña: la clave va en el # (nunca llega a servidores ni a previsualizadores de enlaces)
  if (h.get('primer')) {
    history.replaceState(null, '', location.pathname);
    ST.modoLogin = 'cargando'; renderLogin();
    try {
      const r = await API.primerAcceso(h.get('primer'));
      h.set('acceso', r.token_hash); h.set('tipo', r.tipo);
    } catch (e) { ST.modoLogin = 'login'; return renderLogin(e.message || 'El enlace venció o ya se usó.'); }
  }
  if (h.get('acceso')) {
    history.replaceState(null, '', location.pathname);
    ST.modoLogin = 'cargando'; renderLogin();
    const err = await API.usarEnlace(h.get('acceso'), h.get('tipo'));
    ST.modoLogin = err ? 'login' : 'nueva';
    return renderLogin(err ? 'El enlace venció o ya se usó. Pide al administrador uno nuevo.' : '');
  }
  const u = await API.sesion();
  if (u) entrar(); else { ST.modoLogin = 'login'; renderLogin(); }
})();
window.addEventListener('hashchange', () => { if (/(acceso|primer)=/.test(location.hash)) location.reload(); });
