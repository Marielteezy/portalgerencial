// Administración de accesos del Portal Gerencial: invitar, generar enlace de acceso y quitar.
// Solo administradores activos (se verifica con la sesión de quien llama, vía mi_acceso()).
import { createClient } from "jsr:@supabase/supabase-js@2.49.4";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ORIGEN_PRINCIPAL = Deno.env.get("PORTAL_ORIGEN") || "https://portal-gerencial.netlify.app";
const SECCIONES = ["ejecutivo", "alertas", "ventas", "lista", "precios", "metas", "simulador", "ejecutivos",
  "funnel", "leads", "gastos-mkt", "financiamiento", "cobranzas", "devoluciones",
  "perfil-cliente", "atencion", "contact-center", "postventa"];
const HOST_PRINCIPAL = new URL(ORIGEN_PRINCIPAL).host;

function origenValido(o: string) {
  try {
    const u = new URL(o);
    const sitio = HOST_PRINCIPAL.replace(/\.netlify\.app$/, "");
    if (u.protocol === "https:" && (u.host === HOST_PRINCIPAL || new RegExp(`^[a-z0-9-]+--${sitio}\\.netlify\\.app$`).test(u.host))) return `${u.protocol}//${u.host}`;
  } catch (_) { /* nada */ }
  return ORIGEN_PRINCIPAL;
}
const cors = (o: string) => ({
  "Access-Control-Allow-Origin": origenValido(o),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin") || "";
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors(origin), "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const yo = createClient(URL_, ANON, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } }, auth: { persistSession: false } });
  const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
  const { data: perfil, error: e0 } = await yo.rpc("mi_acceso");
  if (e0 || !perfil?.admin) return json({ error: "Solo un administrador puede gestionar accesos." }, 403);
  const { data: me } = await yo.auth.getUser();
  const miEmail = (me?.user?.email || "").toLowerCase();

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch (_) { /* vacío */ }
  const accion = String(body.accion || "");
  const email = String(body.email || "").trim().toLowerCase();
  const origen = origenValido(String(body.origen || ""));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Escribe un correo válido." }, 400);

  async function enlace(nombre = "") {
    let r = await admin.auth.admin.generateLink({ type: "invite", email, options: { data: nombre ? { nombre } : undefined } });
    let tipo = "invite";
    if (r.error) { r = await admin.auth.admin.generateLink({ type: "recovery", email }); tipo = "recovery"; }
    if (r.error || !r.data?.properties?.hashed_token) throw new Error(r.error?.message || "No se pudo generar el enlace");
    return `${origen}/#acceso=${encodeURIComponent(r.data.properties.hashed_token)}&tipo=${tipo}`;
  }

  try {
    if (accion === "invitar") {
      const nombre = String(body.nombre || "").trim().slice(0, 120);
      const secciones = (Array.isArray(body.secciones) ? body.secciones : []).map(String).filter((s) => SECCIONES.includes(s));
      const { error } = await admin.from("accesos").upsert({ email, nombre: nombre || null, admin: !!body.admin, secciones, activo: true, invitado_por: miEmail });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, link: await enlace(nombre), enviado: false });
    }
    if (accion === "enlace") {
      const { data: a } = await admin.from("accesos").select("email,nombre,activo").eq("email", email).maybeSingle();
      if (!a) return json({ error: "Ese correo no está invitado." }, 404);
      if (!a.activo) return json({ error: "Primero marca “Puede entrar” para esta persona." }, 400);
      return json({ ok: true, link: await enlace(a.nombre || ""), enviado: false });
    }
    if (accion === "quitar") {
      if (email === miEmail) return json({ error: "No puedes quitarte a ti mismo." }, 400);
      const { data: lista } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const u = lista?.users.find((x) => (x.email || "").toLowerCase() === email);
      if (u) { const { error } = await admin.auth.admin.deleteUser(u.id); if (error) throw error; }
      await admin.from("accesos").delete().eq("email", email);
      return json({ ok: true });
    }
    return json({ error: "Acción desconocida" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message || "Error" }, 500);
  }
});
