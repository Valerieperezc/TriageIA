# Deployment V1 - TriageIA

Esta guia cubre despliegue de frontend React/Vite con Supabase como backend administrado.

## 1) Requisitos previos
- Proyecto en GitHub con rama principal estable.
- Proyecto Supabase creado y esquema aplicado (`docs/supabase-schema.sql`).
- Usuario admin creado en Supabase Auth.
- Pipeline CI en verde (`lint`, `test`, `build`).

## 2) Variables de entorno requeridas
Configura estas variables en la plataforma de deploy:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Referencia local: `.env.example`.

## 3) Opcion A: Deploy en Vercel
1. Importa el repositorio en Vercel.
2. Framework: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Agrega variables de entorno del paso 2.
6. Deploy.

Nota: el archivo `vercel.json` ya incluye rewrite para SPA (rutas de React Router).

## 4) Opcion B: Deploy en Netlify
1. Conecta el repositorio en Netlify.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Agrega variables de entorno del paso 2.
5. Deploy.

Nota: `public/_redirects` ya incluye redirect SPA para rutas cliente.

## 5) Verificacion post-deploy (smoke test)
Ejecutar en entorno desplegado:
1. Abrir `/login`.
2. Iniciar sesion con usuario valido.
3. Registrar paciente y verificar triage.
4. Cambiar estado a `En atencion`.
5. Si rol medico/admin, cambiar a `Finalizado`.
6. Verificar listado y dashboard actualizados.
7. Verificar historial (`/audit`) con rol admin.
8. Recargar navegador y comprobar persistencia de sesion/datos.

## 6) Seguridad minima de salida
- No subir `.env` al repositorio.
- RLS activa en tablas de negocio.
- Politicas por rol aplicadas en `patients`, `patient_events` y `profiles`.
- Solo usuarios autorizados en Supabase Auth.

## 7) Rollback rapido
Si hay error critico en produccion:
1. Revertir al deployment previo en la plataforma (Vercel/Netlify).
2. Validar smoke test basico.
3. Congelar merges a rama principal.
4. Corregir en rama hotfix + validar CI.
5. Volver a desplegar.

## 8) Evidencias recomendadas de release
- URL de produccion.
- Commit/tag desplegado.
- Capturas de smoke test.
- Estado de pipeline CI.

## 9) Entrega D1-S3: repositorio vs operacion
- **En repositorio (listo con CI verde):** variables documentadas (`.env.example`), guias `Deployment-V1.md` y `Go-Live-Checklist.md`, artefactos SPA (`vercel.json`, `public/_redirects`), y gate `npm run deploy:check` en pipeline (`.github/workflows/ci.yml`).
- **En operacion (fuera del repo):** crear proyecto Supabase/hosting, configurar env en la plataforma, aplicar `docs/supabase-schema.sql`, desplegar y completar el checklist de go-live en la URL real.

El script `deploy:check` valida que no falten esos archivos y que CI incluya el chequeo de preparacion de release.
