"""Arma el sitio.
  dist/     → producción (Netlify). Sin scripts de terceros: supabase-js va copiado en /vendor,
              el código del portal en /app.js; así la política CSP permite solo scripts propios.
  preview/  → vista previa en un solo archivo con datos de ejemplo (sin conexión a la base).
Uso: python3 build.py"""
import os, base64, shutil
R = os.path.dirname(os.path.abspath(__file__)); os.chdir(R)
rd = lambda p: open(p, encoding='utf-8').read()
logo = rd('src/img_logo.txt').strip()
fondo = 'data:image/jpeg;base64,' + base64.b64encode(open('src/fondo-login.jpg', 'rb').read()).decode()

def head():
    return f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="same-origin">
<title>Portal Gerencial</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23EC2833'/%3E%3Cpath d='M9 22V14M16 22V9M23 22v-6' stroke='white' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&display=swap">
<style>
{rd('src/style.css')}
</style>
</head>
<body>
{rd('src/body.html').replace('%%LOGO%%', logo)}
'''

def js(demo):
    return f'''const __DEMO__ = {'true' if demo else 'false'};
const IMG_LOGO = "{logo}", IMG_FONDO = "{fondo}";
{rd('src/data.js')}
{rd('src/app.js')}'''

# Producción
if os.path.isdir('dist'): shutil.rmtree('dist')
os.makedirs('dist', exist_ok=True)
for f in os.listdir('src/vendor'): shutil.copy(f'src/vendor/{f}', f'dist/{f}')
open('dist/app.js', 'w', encoding='utf-8').write(js(False))
open('dist/index.html', 'w', encoding='utf-8').write(head() + '<script src="/supabase.js"></script>\n<script src="/app.js"></script>\n</body>\n</html>\n')
open('dist/_headers', 'w').write('''/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://ejcnxvkmnqihyizdafqg.supabase.co wss://ejcnxvkmnqihyizdafqg.supabase.co; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: same-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  X-Robots-Tag: noindex, nofollow
/index.html
  Cache-Control: no-cache
''')
# Vista previa
os.makedirs('preview', exist_ok=True)
open('preview/index.html', 'w', encoding='utf-8').write(head() + '<script>\n' + js(True) + '\n</script>\n</body>\n</html>\n')
for d in ('dist', 'preview'):
    print(d, sum(os.path.getsize(os.path.join(a, f)) for a, _, fs in os.walk(d) for f in fs))
