# Changelog

Todas las notas relevantes por versión se documentan aquí.

## [1.59.0] - 2026-04-14

### Delivery — cierre épica **D1** en repositorio (D1-S3)

- **`scripts/deployCheck.mjs`:** valida el script `deploy:check` en `package.json`, rewrites SPA en `vercel.json`, regla SPA en `public/_redirects`, y que CI ejecute `npm run deploy:check`.
- **`docs/Deployment-V1.md`:** sección 9 (entrega repo vs operación).
- **`docs/Go-Live-Checklist.md`:** criterio D1-S3 (repo vs URL real).
- **`docs/BMAD-Stories.md`** y **`docs/Program-Closure.md`:** D1-S3 y épica D1 marcadas como cerradas en entrega de código; piloto en hosting queda como paso operativo.

## [1.58.0] - 2026-04-14

### Seguridad — cierre épica **A3** en repositorio

- **E2E (`e2e/smoke.spec.js`):** usuario con rol `medico` que intenta abrir `/audit` es redirigido al dashboard; no se muestra la vista Historial.
- **Documentación BMAD:** A3-S2 considerada **cerrada (entrega repo)** con evidencia de pruebas; tabla resumen y roadmap actualizados.

## [1.57.0] - 2026-04-14

### Seguridad (épica A3, story A3-S2)

- **`docs/supabase-schema.sql`:** RLS de `patient_events` — lectura solo **admin**; inserción restringida a roles operativos (`admin`, `medico`, `enfermeria`, `recepcion`). Aplicar el script actualizado en el proyecto Supabase.
- **`PatientContext`:** carga del historial de auditoría desde Supabase solo si el rol es **admin** (coherente con `/audit` y con la política RLS).
- **`src/utils/supabaseErrors.js`:** detección de denegación por RLS/permisos; **`triageService`** traduce a mensaje claro para el usuario.

### Pruebas

- **`src/utils/supabaseErrors.test.js`:** casos de código y mensaje RLS.

## [1.56.0] - 2026-04-14

### Documentación

- **`docs/BMAD-Stories.md`:** tabla resumen de épicas; cada story (B1–D1) con **Estado al v1.56.0**, evidencias en repo y notas; roadmap de implementación marcado como completado en código; sprint sugerido sustituido por backlog post-MVP.
- **`docs/Program-Closure.md`:** alineado con la matriz BMAD v1.56.0.

## [1.55.0] - 2026-04-14

### Documentación

- **`docs/Program-Closure.md`:** criterios de cierre técnico, tabla de épicas BMAD vs pendientes operativos, enlaces a go-live y deployment.
- **`docs/BMAD-Stories.md`:** sección de cierre MVP Post-V1 v1.55.0.
- **`README.md`:** versión y puntero al documento de cierre.

## [1.54.0] - 2026-04-14

### Añadido

- **`getAuditHistoryExportFilename`** en `csv.js` para el nombre `triageia-auditoria-YYYY-MM-DD.csv` (usado en `/audit`).

## [1.53.0] - 2026-04-14

### Añadido

- **`POST_LOGIN_PERF_HISTORY_STORAGE_KEY`** exportada desde `performance.js` para alinear listeners con el historial persistido.
- **`usePostLoginPerf({ syncSummaryOnStorageEvents: true })`:** dashboard y auditoría actualizan el resumen si otra pestaña modifica el historial (evento `storage`).

### Pruebas

- Cobertura mínima de la clave exportada en `performance.test.js`.

## [1.52.0] - 2026-04-14

### Cambiado

- **`usePostLoginPerf`:** nueva acción `downloadPostLoginPerfFile()` (devuelve si hubo descarga); encapsula CSV, nombre de archivo y `downloadTextFile`.
- **Dashboard / Audit:** exportación de telemetría post-login solo vía el hook.

## [1.51.0] - 2026-04-14

### Añadido

- **`getPostLoginPerfExportFilename`** para el nombre `triageia-ux-post-login-YYYY-MM-DD.csv` usado en dashboard y auditoría.

## [1.50.0] - 2026-04-14

### Añadido

- **`usePostLoginPerf`:** estado y acciones comunes de telemetría post-login (registro opcional tras navegación desde login, reset, lectura para CSV).
- **`formatPostLoginPerfCsv`** en `performance.js` para generar el CSV de muestras; prueba unitaria asociada.

### Cambiado

- `Dashboard` y `Audit` delegan en el hook y en el formateador compartido (menos duplicación).

## [1.49.0] - 2026-04-14

### Corregido

- **Telemetría post-login:** el `Dashboard` ya no consume `sessionStorage` en el inicializador de `useState`; el marcaje se procesa en un efecto tras el montaje (actualización diferida) para evitar condiciones de carrera con rutas lazy/Suspense.

### Cambiado

- **E2E:** el smoke de telemetría en `/audit` comprueba datos reales tras login + navegación, sin sembrar el historial en CI.

## [1.48.0] - 2026-04-14

### Añadido

- **Auditoría / soporte:** pantalla `/audit` incluye bloque de telemetría UX post-login (resumen, export CSV, limpiar) alineado con el dashboard.
- **E2E:** test de smoke que valida la sección (`audit-post-login-summary` / `audit-post-login-empty`) y el reset; historial sembrado vía `localStorage` para CI estable.

## [1.47.0] - 2026-04-14

### Añadido

- **Operaciones/Soporte UX:** dashboard agrega acciones sobre telemetría post-login:
  - exportación CSV de muestras (`post-login-perf-export`)
  - limpieza de historial (`post-login-perf-reset`)
- `performance.js` incorpora utilidades para leer historial completo y resetearlo.
- Pruebas ampliadas en `performance.test.js` para cubrir limpieza de histórico.

## [1.46.0] - 2026-04-14

### Añadido

- **Telemetría UX post-login:** `performance.js` ahora persiste historial de duraciones (`último`, `promedio`, `muestras`) en `localStorage`.
- `Dashboard` muestra métrica consolidada de transición post-login en lugar de una única lectura efímera.
- Cobertura extendida en `performance.test.js` para validar persistencia y resumen del histórico.

## [1.45.0] - 2026-04-14

### Añadido

- **Calidad D1-S1:** nueva suite `src/utils/performance.test.js` para validar utilidades de rendimiento.
- Casos cubiertos: marcado/consumo de tiempo post-login y política de prefetch por condiciones de red (`saveData`, `effectiveType`, `downlink`).

## [1.44.0] - 2026-04-14

### Añadido

- **Aceleración inteligente:** el prefetch post-login ahora se condiciona por calidad de red (`navigator.connection`), evitando consumo extra en conexiones lentas o con `saveData`.
- **Métrica operativa UX:** se registra y muestra en dashboard la duración de la transición post-login (ms) mediante `consumePostLoginNavigationMs`.
- Nuevo utilitario `src/utils/performance.js` para control de prefetch y medición de navegación.

## [1.43.0] - 2026-04-14

### Añadido

- **UX performance:** `Login` ahora dispara prefetch del área privada (`App`, `PrivateAppLayout`, `Dashboard`) al autenticarse correctamente.
- Mejora esperada: transición más rápida de `/login` a `/` al tener chunks clave en caché al momento de navegar.

## [1.42.0] - 2026-04-14

### Añadido

- **Performance preload policy (fase final):** `vite.config.js` filtra en HTML `auth-context`, `theme-context` y `appConfig` además de `vendor-react`/`vendor-charts`.
- Resultado de build: `dist/index.html` queda con preloads mínimos (`rolldown-runtime` + `preload-helper`), bajando de ~1.09 kB a ~0.84 kB.
- Validación completa posterior al ajuste: `lint`, `test:run` y `build` en verde.

## [1.41.0] - 2026-04-14

### Añadido

- **Performance preload policy:** `vite.config.js` ahora filtra también `vendor-react` en `build.modulePreload.resolveDependencies` para hosts HTML.
- Resultado de build: `dist/index.html` elimina el `modulepreload` de `vendor-react` y reduce su tamaño (~1.17 kB -> ~1.09 kB).
- Verificación completa de esta iteración: `lint`, `test:run` y `build` en verde.

## [1.40.0] - 2026-04-14

### Añadido

- **Performance bootstrap:** se introduce `AppShell` (`src/components/AppShell.jsx`) para cargar `App` de forma lazy desde `main.jsx`.
- Resultado de build: `index-*.js` baja de ~8.09 kB a ~4.53 kB.
- En `dist/index.html` dejan de pre-cargarse chunks de app/router pesado en arranque base (incluyendo `chunk-QFMPRPBF`), manteniendo bootstrap más liviano.

## [1.39.0] - 2026-04-14

### Añadido

- **Performance UI bootstrap:** `react-hot-toast` deja de cargarse en `main.jsx`; se encapsula en `src/components/AppToaster.jsx` con import diferido.
- Resultado de build: `vendor-ui` deja de aparecer en `dist/index.html` como `modulepreload`, quedando fuera del arranque base.
- Validación completa posterior al cambio: `lint`, `test:run` y `build` en verde.

## [1.38.0] - 2026-04-14

### Añadido

- **Performance auth bootstrap:** `AuthContext` deja de importar `authService` de forma estática y lo carga de forma diferida (`import("../services/authService")`) solo cuando se necesita.
- Se añade `src/lib/appConfig.js` para aislar `isSupabaseConfigured` en un módulo mínimo de arranque.
- Resultado de build: `index-*.js` baja de ~9.27 kB a ~7.82 kB y el servicio de auth queda en chunk dedicado (`authService-*.js`).

## [1.37.0] - 2026-04-14

### Añadido

- **Performance de arranque:** `PatientProvider` y `SoundPreferenceProvider` salen de `main.jsx` y pasan a `PrivateAppLayout` cargado de forma diferida en rutas privadas.
- La ruta `/login` evita inicializar contexto operativo de pacientes hasta autenticación.
- Resultado de build: `index-*.js` baja de ~24.54 kB a ~9.27 kB y el shell privado queda en chunk dedicado (`PrivateAppLayout`).

## [1.36.0] - 2026-04-14

### Añadido

- **Performance preload policy:** `vite.config.js` incorpora `build.modulePreload.resolveDependencies` para filtrar `vendor-charts` en hosts HTML.
- Resultado de build: `dist/index.html` deja de incluir `vendor-charts` en `<link rel="modulepreload">`, consolidando carga bajo demanda de la gráfica.

## [1.35.0] - 2026-04-14

### Añadido

- **Performance backend-client loading:** `src/lib/supabase.js` migra a creación diferida de cliente con `getSupabaseClient()` e `import("@supabase/supabase-js")`.
- `authService` y `triageService` ahora obtienen el cliente Supabase bajo demanda.
- Resultado de build: `vendor-supabase` deja de aparecer en los `modulepreload` iniciales de `dist/index.html`, reduciendo trabajo en el arranque.

## [1.34.0] - 2026-04-14

### Añadido

- **Performance runtime:** dashboard incorpora control explícito para cargar la gráfica de triage bajo demanda (`Mostrar/Ocultar gráfica de triage`).
- La app evita solicitar el chunk de gráficas en la primera carga de `/` hasta que el usuario decide visualizarla.

## [1.33.0] - 2026-04-14

### Añadido

- **Performance/UI:** dashboard reemplaza animación de tarjetas de `framer-motion` por transición CSS nativa (`hover:scale`) sin impacto funcional.
- **Mantenibilidad:** dependencia `framer-motion` eliminada del proyecto al quedar sin uso.
- Resultado de build: `vendor-ui` baja de ~141.76 kB a ~16.80 kB.

## [1.32.0] - 2026-04-14

### Añadido

- **Performance build:** configuración de `manualChunks` en `vite.config.js` para separar vendors por dominio (`vendor-react`, `vendor-router`, `vendor-supabase`, `vendor-charts`, `vendor-ui`).
- Resultado de build: `index-*.js` baja de ~390 kB a ~24 kB, mejorando el tiempo de arranque del bundle principal.

## [1.31.0] - 2026-04-14

### Añadido

- **Performance dashboard:** extracción de gráfica de triage a `src/components/DashboardTriageChart.jsx` con carga diferida (`lazy` + `Suspense`).
- Resultado de build: el chunk de `Dashboard` baja de ~442 kB a ~134 kB, moviendo `recharts` a un chunk separado cargado bajo demanda.

## [1.30.0] - 2026-04-14

### Añadido

- **Performance frontend:** se implementa lazy loading por rutas en `src/App.jsx` con `React.lazy` y `Suspense`.
- El build queda dividido en chunks de páginas y reduce el peso del bundle de entrada principal frente a la versión previa.

## [1.29.0] - 2026-04-14

### Añadido

- **D1-S2 (CI/Calidad):** validación integral local del pipeline equivalente a CI en verde (`npm run lint`, `npm run test:coverage`, `npm run build`, `npm run deploy:check`).
- Cobertura total actual reportada por Vitest V8: `Statements 75.77%`, `Branches 68.77%`, `Functions 84.93%`, `Lines 77.62%`.

## [1.28.0] - 2026-04-14

### Añadido

- **D1-S1 (suite mínima):** se amplían pruebas de `authService` para escenarios de login Supabase.
- Casos cubiertos: credenciales inválidas (retorna `null`), fallo de red (error accionable) y login exitoso con rol leído desde `profiles`.
- Se añade cobertura de sesión activa en Supabase (`getCurrentSupabaseUser`) y fallback de rol por defecto (`medico`) cuando falla lectura de `profiles`.

## [1.27.0] - 2026-04-14

### Añadido

- **A2-S3 (servicios API + UX de errores):** se completa la migración operativa a capa de servicios (`authService` / `triageService`) con manejo explícito de fallos de autenticación.
- Login diferencia credenciales inválidas de errores de conectividad y muestra mensajes accionables en UI.
- Registro de paciente reutiliza mensajes de error del contexto para dar feedback más preciso ante fallos de red/permiso.
- **A2-S2 (robustez local):** `createPatient` respeta `payload.id` en fallback local y evita duplicados al reintentar con el mismo identificador.
- Nueva prueba de idempotencia local en `src/services/triageService.test.js`.

## [1.26.0] - 2026-04-14

### Añadido

- **A2-S2 (auditoría):** en modo local, `fetchAuditEvents` normaliza/ordena eventos por recencia incluso con registros legacy.
- `createAuditEvent` en local ahora persiste `createdAt` para orden cronológico consistente entre recargas.
- Prueba de compatibilidad/orden añadida en `src/services/triageService.test.js`.

## [1.25.0] - 2026-04-14

### Añadido

- **A2-S1 (backend validation):** endurecimiento de reglas de dominio en `docs/supabase-schema.sql` con constraints idempotentes para `patients` (estado permitido, rangos edad/temp/fc y texto no vacío).
- Índices en `created_at` para `patients` y `patient_events` para mejorar consultas de listado/auditoría.

## [1.24.0] - 2026-04-14

### Añadido

- **D1-S3 (deploy):** nuevo comando `npm run deploy:check` para validar precondiciones de salida (archivos críticos, variables en `.env.example`, secciones de checklist y pasos de CI).
- CI ejecuta `deploy:check` antes de pruebas/build para detectar faltantes de release temprano.

## [1.23.0] - 2026-04-14

### Añadido

- **D1-S2 (CI):** pipeline actualizado para ejecutar `test:coverage` en lugar de solo `test:run`.
- Publicación de artefacto `coverage-report` en GitHub Actions para visibilidad en PR/checks.

## [1.22.0] - 2026-04-14

### Añadido

- **D1-S1 (suite mínima):** pruebas de servicios principales en `src/services/triageService.test.js`.
- Cobertura automatizada con Vitest V8 (`test:coverage`) y umbral mínimo del 60% para módulos críticos `src/utils` y `src/services`.

## [1.21.0] - 2026-04-14

### Añadido

- **Alerta proactiva de operación:** topbar muestra toast cuando el semáforo de resiliencia cambia a estado **Crítico**, para visibilidad inmediata ante degradación.

## [1.20.0] - 2026-04-14

### Añadido

- **Semáforo de resiliencia:** clasificación `Estable / Alerta / Critico` para telemetría de reintentos con `classifyRetryHealth` en `src/utils/retryStats.js`.
- Topbar muestra el estado de salud operativo junto al contador de reintentos y se cubre en E2E (`smoke.spec.js`).

## [1.19.0] - 2026-04-14

### Añadido

- **Mantenibilidad de resiliencia:** lógica de persistencia/normalización de telemetría extraída a `src/utils/retryStats.js`.
- **Pruebas unitarias nuevas:** `src/utils/retryStats.test.js` cubre normalización, lectura por defecto y persistencia.

## [1.18.0] - 2026-04-14

### Añadido

- **E2E de resiliencia:** nueva prueba smoke que valida telemetría persistida de reintentos y la acción de limpieza desde topbar (`retry-reset`).

## [1.17.0] - 2026-04-14

### Añadido

- **Persistencia de telemetría de resiliencia:** `retryStats` ahora se guarda en `localStorage` (`triageia:retry-stats`) y se restaura al recargar la app.
- **Control operativo en UI:** botón **Limpiar** en topbar para reiniciar métricas acumuladas cuando se requiera un nuevo diagnóstico.

## [1.16.0] - 2026-04-14

### Añadido

- **Telemetría mínima de resiliencia:** `PatientContext` ahora registra métricas de reintentos (`totalRetries`, recuperaciones y fallos en carga/acciones, último reintento).
- `retryAsync` soporta callback `onRetry` para instrumentar intentos sin acoplar la lógica de negocio.
- Indicador visual de reintentos en `Topbar` (`data-testid="retry-indicator"`) para detectar inestabilidad operativa de forma temprana.

## [1.15.0] - 2026-04-14

### Añadido

- **Acciones críticas más robustas:** `addPatient` y `updateStatus` usan reintentos con backoff para errores transitorios (`network/timeout/5xx/429`).
- **Idempotencia práctica:** creación de paciente con `id` generado en cliente (UUID) para tolerar reintentos; auditoría con `request_id` para evitar duplicados en reintentos.
- `createAuditEvent` usa upsert por `request_id` cuando está disponible y fallback compatible para esquemas antiguos.

## [1.14.0] - 2026-04-14

### Añadido

- **Resiliencia de carga:** `PatientContext` ahora reintenta automáticamente la carga inicial de pacientes y auditoría con backoff (`300ms`, `1000ms`) para errores transitorios (network/timeout/5xx/429), antes de mostrar error al usuario.
- Nueva utilidad `retryAsync` en `src/utils/retry.js` con pruebas unitarias en `src/utils/retry.test.js`.

## [1.13.0] - 2026-04-14

### Añadido

- **Calidad E2E (flujo esencial):** smoke test completo en `e2e/smoke.spec.js` que cubre login local, registro de paciente, cambios de estado (En espera -> En atención -> Finalizado) y validación en auditoría.
- **Selectores estables:** `data-testid` en formulario de triage y acciones de `PatientDetail` para reducir flakiness en pruebas funcionales.

## [1.12.0] - 2026-04-14

### Añadido

- **Dominio:** `assertValidTriagePayload` en `addPatient` para validar datos aunque no vengan del formulario; `assertAllowedClientStatus` limita actualizaciones de estado a `En atención` y `Finalizado`.
- **Auditoría:** email del usuario como **actor** en eventos (local y Supabase); columna opcional `actor_email` en `patient_events` (ver `docs/supabase-schema.sql` — ejecutar el `ALTER` en proyectos ya desplegados).
- **Historial / CSV:** columna **Actor** en exportación; línea “Actor: …” en cada tarjeta cuando hay dato.

## [1.11.0] - 2026-04-14

### Añadido

- **Triage:** validación de **formulario de registro** alineada con historia A1-S1: nombre y síntoma obligatorios; edad entera (0–130); temperatura (30–45 °C, coma o punto); FC entera en lpm (25–250); errores **por campo** y toast si falla el envío.
- Utilidad `validateTriageForm` / `parseTempInput` en `src/utils/triageFormValidation.js` con pruebas en `triageFormValidation.test.js`.

## [1.10.0] - 2026-04-14

### Añadido

- **Modo oscuro / claro:** Tailwind `darkMode: 'class'`, clase `dark` en `<html>`, persistencia `localStorage` (`triageia:theme`); script en `index.html` para reducir parpadeo al cargar.
- `ThemePreferenceProvider`, `theme-context.js`, hook `useTheme`; conmutador en **Topbar** y en **Login** (esquina superior derecha).

## [1.9.0] - 2026-04-14

### Añadido

- **Pacientes:** selector **Ordenar por** con modos: prioridad triage (I primero, mayor espera dentro del mismo nivel), tiempo de espera mayor/menor primero, nombre A-Z.
- Parámetro de URL **`sort`** (`triage` | `wait-desc` | `wait-asc` | `name`); al cambiar orden se reinicia a página 1.
- Utilidades `sortPatients` y `parseSortParam` en `src/utils/patientSort.js` con pruebas.

## [1.8.0] - 2026-04-14

### Añadido

- Preferencia **Sonido / Silencio** en la barra superior: desactiva las **alarmas sonoras** (registro triage I y aumento de cola crítica en dashboard). Los **avisos por toast** en dashboard se mantienen.
- Persistencia en `localStorage` (`triageia:sound-enabled`).
- Contexto `SoundPreferenceProvider` y hook `useSoundPreference`.

## [1.7.0] - 2026-04-14

### Añadido

- **Pacientes:** paginación de **15** filas por página, controles Anterior/Siguiente y texto *Mostrando X–Y de Z*.
- Parámetro de URL **`page`** (se sincroniza si la página pedida queda fuera de rango tras filtrar).
- Al cambiar **búsqueda** o **triage**, la página vuelve a **1**.
- Utilidad `paginateSlice` en `src/utils/pagination.js` con pruebas unitarias.

## [1.6.0] - 2026-04-14

### Añadido

- **Dashboard:** si **sube** el número de pacientes **triage I en espera** mientras tienes el panel abierto, suena la misma alarma breve que al registrar un crítico y se muestra un **toast** informativo.
- Constante compartida `CRITICAL_ALARM_URL` en `src/constants/alarm.js` (usada también al crear paciente triage I).

## [1.5.0] - 2026-04-14

### Añadido

- **Sidebar:** badge con número de pacientes **triage I en espera** en el ítem Pacientes (tooltip y `data-testid` para pruebas).
- **Pacientes:** título de página, botón **Exportar CSV (vista actual)** según filtros/búsqueda activos; columnas incluyen minutos de espera.
- Utilidad `buildPatientsCsv` en `src/utils/patientCsv.js` con prueba unitaria.

## [1.4.0] - 2026-04-14

### Añadido

- **Dashboard:** métricas de cola en tiempo casi real (actualización cada minuto): pacientes en espera, tiempo medio de espera, espera máxima en cola, cantidad de triage I aún en cola.
- **Alerta visual** cuando hay pacientes **críticos (I) en espera**, con acceso rápido al listado filtrado.
- Utilidad `computeQueueMetrics` en `src/utils/dashboardMetrics.js` con pruebas unitarias.

## [1.3.0] - 2026-04-14

### Añadido

- Componente `DataState` para **carga** (skeleton), **error** y botón **Reintentar** en Dashboard, Pacientes, Triage y Auditoría.
- Pantalla **404** para rutas desconocidas (usuarios autenticados).
- **Detalle de paciente:** estado de carga, error con reintento, mensaje si el ID no existe con enlace a pacientes.
- **E2E** con Playwright (`e2e/smoke.spec.js`): login modo local y navegación a pacientes; `data-testid` en login y dashboard.
- Script `npm run test:e2e`; CI ejecuta Chromium tras el build.
- `vitest.config.js` excluye la carpeta `e2e/` para que `npm run test` no ejecute pruebas de Playwright.

## [1.2.0] - 2026-04-13

### Añadido

- Pantalla **Historial** (`/audit`): botón **Exportar CSV** del listado de eventos (UTF-8 con BOM para Excel).
- Utilidades `src/utils/csv.js` y pruebas unitarias.

## [1.1.0] - 2026-04-13

### Añadido

- Lista de pacientes: **búsqueda** por nombre o síntoma.
- Filtro por **triage** sincronizado con la URL (`?triage=I|II|III`), alineado con los enlaces del dashboard.
- Utilidad `filterPatients` y pruebas en `src/utils/patientFilters.test.js`.

## [1.0.0] - 2026-04-13

### Primera versión estable (V1)

- **Frontend:** React 19 + Vite + Tailwind; rutas, dashboard, pacientes, triage, detalle y auditoría.
- **Datos:** Supabase (`patients`, `patient_events`, `profiles`); modo local con `localStorage` si faltan variables de entorno.
- **Autenticación:** Supabase Auth (email/contraseña) o sesión local demo; perfiles con rol.
- **Roles y permisos:** registro por recepción/enfermería/admin; atención por médico/enfermería/admin; finalizar por médico/admin; historial solo admin; RLS en SQL según rol.
- **Calidad:** ESLint en verde; Vitest (`triage`, `permissions`); CI GitHub Actions (`lint`, `test:run`, `build`).
- **Despliegue:** guías `docs/Deployment-V1.md`, `docs/Go-Live-Checklist.md`; `vercel.json` y `public/_redirects` para SPA.

### Documentación

- `docs/PRD.md`, `docs/Brief.md`, `docs/BMAD-Stories.md`, `docs/supabase-schema.sql`.
