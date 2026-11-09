# Portal Gerencial · desarrolladora

Reemplazo de DDP Analytics (Lovable). Mismo login y diseño que Portal Comercial, datos en el Supabase **DDP-Analytics**
(`ejcnxvkmnqihyizdafqg`). Sitio estático publicado en Netlify (carpeta `dist/`).

- `src/` código fuente (app.js, data.js, style.css, vendor/supabase.js)
- `python3 build.py` genera `dist/` (producción) y `preview/` (datos de ejemplo, sin conexión)
- `supabase/migrations/001_accesos_portal_gerencial.sql` tabla `accesos`, permisos por módulo (aditivo, Lovable sigue funcionando)
- `supabase/migrations/002_corte_lovable.sql` corte definitivo, solo cuando Lovable se deje de usar
- `supabase/functions/usuarios` invitar, generar enlace de acceso y quitar usuarios (variable `PORTAL_ORIGEN` = URL del sitio)

Módulos activos: Resumen ejecutivo, Resumen de ventas, Lista de precios, Precios, Metas comerciales,
Usuarios y accesos, Sincronizaciones. El resto aparece como "pronto" hasta conectar su fuente de datos.

La sincronización con Evolta sigue en la función `evolta-sync` de Supabase (no depende del frontend).
Ninguna clave secreta va en este repositorio.
