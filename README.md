# TriageIA

**Versión actual:** 1.59.0 (ver `CHANGELOG.md`). Entrega técnica MVP cerrada: `docs/Program-Closure.md`. Estado de épicas/stories: `docs/BMAD-Stories.md`.

Aplicacion de triage desarrollada con React + Vite y persistencia en Supabase.

## Requisitos
- Node.js 18+
- Proyecto de Supabase

## Configuracion
1. Instala dependencias:
   - `npm install`
2. Crea tu archivo de entorno:
   - copia `.env.example` a `.env`
3. Completa en `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. En Supabase SQL Editor, ejecuta:
   - `docs/supabase-schema.sql`

## Ejecutar en desarrollo
- `npm run dev`

## Build de produccion
- `npm run build`

## Calidad y pruebas
- `npm run lint`
- `npm run test` (modo interactivo)
- `npm run test:run` (modo CI)
- `npm run test:coverage` (umbral minimo en modulos criticos)
- `npm run deploy:check` (preflight de salida a produccion)

Se incluye pipeline en `.github/workflows/ci.yml` con `lint + test:coverage + build + test:e2e` (Playwright Chromium) y artefacto de cobertura.

- E2E local: `npm run test:e2e` (construye y sirve preview; requiere navegadores: `npx playwright install chromium`).

En la app, el botón **Oscuro / Claro** (barra superior o pantalla de login) y **Sonido / Silencio** guardan preferencias en el navegador (`localStorage`: `triageia:theme`, `triageia:sound-enabled`).

## Despliegue V1
- Cierre programa (entrega técnica): `docs/Program-Closure.md`
- Guia operativa: `docs/Deployment-V1.md`
- Checklist de salida: `docs/Go-Live-Checklist.md`
- SPA rewrite para Vercel: `vercel.json`
- SPA redirect para Netlify: `public/_redirects`

## Flujo actual
- Login real con Supabase Auth (email/password) cuando hay `.env`.
- Fallback local si Supabase no esta configurado (`admin@triage.com / 123456`).
- Registro de paciente con calculo de triage (I/II/III).
- Persistencia de pacientes en tabla `patients`.
- Persistencia de eventos en tabla `patient_events`.
- Dashboard, listado, detalle y auditoria con datos de Supabase.

## Setup de autenticacion y roles en Supabase
1. Activa Email/Password en `Authentication > Providers`.
2. Crea usuarios desde `Authentication > Users`.
3. Ejecuta `docs/supabase-schema.sql` para crear `profiles` y trigger.
4. Asigna rol en SQL (ejemplo admin):
   - `update public.profiles set role = 'admin' where email = 'tu-correo@dominio.com';`

Nota: la vista `Historial` (`/audit`) esta restringida a rol `admin`.

## Reglas de permisos implementadas
- `recepcion`: puede registrar pacientes.
- `enfermeria`: puede registrar pacientes y pasar a `En atencion`.
- `medico`: puede pasar a `En atencion` y `Finalizado`.
- `admin`: acceso total operativo + historial.
