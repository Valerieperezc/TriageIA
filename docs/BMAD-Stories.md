# BMAD Stories - TriageIA

## Como estamos aplicando BMAD en este proyecto
Para mantenerlo practico, usamos BMAD como estructura de ejecucion:
- **B (Business):** impacto de negocio y operacion clinica.
- **M (Model):** reglas de triage, datos y flujos.
- **A (Architecture):** decisiones tecnicas e integracion.
- **D (Delivery):** implementacion incremental, pruebas y release.

Cada historia incluye: objetivo, criterio de aceptacion y prioridad.

---

## Resumen ejecutivo — avance de épicas (v1.59.0)

| Epica | Stories cerradas (entrega) | Pendiente fuera de repo |
|-------|-----------------------------|-------------------------|
| **B1** Business | B1-S1, B1-S2 | Firma / priorización institucional (opcional) |
| **M1** Modelo | M1-S1, M1-S2, M1-S3 | Validación clínica formal del protocolo (opcional) |
| **A1** Frontend | A1-S1 … A1-S4 | Mejoras UX según piloto |
| **A2** Persistencia | A2-S1, A2-S2, A2-S3 | Instancia Supabase producción + operación |
| **A3** Seguridad | **A3-S1, A3-S2 cerradas (entrega repo)** | Políticas finas por centro / pentest en prod (opcional) |
| **D1** Delivery | **D1-S1, D1-S2, D1-S3 cerradas (entrega repo)** | URL de piloto + checklist go-live ejecutado en hosting real |

**Leyenda:** *cerrada (entrega)* = criterios satisfechos en código y/o documentación del repositorio. Lo marcado como *fuera de repo* no implica trabajo pendiente obligatorio en código para considerar el MVP entregado.

---

## Estado release v1.0.0 (2026-04-13)

Linea base cerrada para V1. Implementado en codigo y documentacion:

| Epica | Estado |
|-------|--------|
| B1 (Business) | Cubierto en `docs/PRD.md` y `docs/Brief.md` |
| M1 (Model) | Reglas triage + estados + esquema en `docs/supabase-schema.sql` |
| A1 (Frontend MVP) | Pantallas y UX estable |
| A2 (Persistencia) | Supabase + fallback local + `src/services/triageService.js` |
| A3 (Auth y roles) | Supabase Auth + perfil + RLS + permisos UI; **A3-S2 cerrada en repo v1.58.0** (E2E `/audit`) |
| D1 (Calidad y release) | Vitest + CI + `deploy:check` + deploy docs; **D1-S3 cerrada en repo v1.59.0** |

**Post-V1 (v1.1.0):** filtros y búsqueda en lista de pacientes (`/patients`), tests unitarios de filtros.

**Post-V1 (v1.2.0):** exportación CSV del historial de auditoría (`/audit`), utilidades y tests CSV.

**Post-V1 (v1.3.0):** estados de carga/error globales (`DataState`), 404, detalle de paciente robusto, smoke E2E Playwright en CI.

**Post-V1 (v1.4.0):** métricas operativas de cola en dashboard y alerta para críticos en espera.

**Post-V1 (v1.5.0):** badge de críticos en sidebar; export CSV de pacientes según vista filtrada.

**Post-V1 (v1.6.0):** alarma + toast en dashboard cuando crece la cola crítica en espera.

**Post-V1 (v1.7.0):** paginación en lista de pacientes (`?page=`) y utilidad `paginateSlice`.

**Post-V1 (v1.8.0):** preferencia de usuario para silenciar alarmas sonoras (Topbar + `localStorage`).

**Post-V1 (v1.9.0):** ordenación de lista de pacientes (`?sort=`) y reglas documentadas en código.

**Post-V1 (v1.10.0):** modo oscuro/claro (`triageia:theme`, Tailwind `class`).

**Post-V1 (v1.11.0):** validaciones del formulario de triage (obligatorios, rangos, mensajes por campo; `triageFormValidation.js` + tests).

**Post-V1 (v1.12.0):** validación defensiva en `addPatient`, estados de transición acotados, auditoría con **actor** (`actor_email` + UI/CSV).

**Post-V1 (v1.13.0):** E2E del flujo operativo esencial (login -> triage -> estados -> auditoría) y `data-testid` estables.

**Post-V1 (v1.14.0):** resiliencia de carga con reintentos automáticos y backoff en `PatientContext` ante fallos transitorios.

**Post-V1 (v1.15.0):** robustez en acciones críticas con reintentos + idempotencia (ID cliente para paciente, `request_id` en auditoría).

**Post-V1 (v1.16.0):** telemetría operativa básica de resiliencia (conteo de reintentos/recuperaciones/fallos y señal visual en topbar).

**Post-V1 (v1.17.0):** persistencia y reset de métricas de resiliencia (`triageia:retry-stats`) para diagnóstico continuo entre recargas.

**Post-V1 (v1.18.0):** cobertura E2E para telemetría de resiliencia (persistencia + limpieza del indicador en UI).

**Post-V1 (v1.19.0):** utilidades y pruebas unitarias dedicadas para telemetría de resiliencia (`retryStats.js`).

**Post-V1 (v1.20.0):** semáforo de salud operativa (estable/alerta/critico) sobre métricas de reintentos en topbar.

**Post-V1 (v1.21.0):** alerta proactiva (toast) cuando la salud de resiliencia escala a estado crítico.

**Post-V1 (v1.22.0):** cierre D1-S1 con pruebas de servicios (`triageService`) y cobertura mínima automatizada (60%+ en módulos críticos).

**Post-V1 (v1.23.0):** avance D1-S2: CI con `test:coverage` y artefacto de reporte de cobertura en GitHub Actions.

**Post-V1 (v1.24.0):** cierre D1-S3 con `deploy:check` automatizado y gate en CI para readiness de release.

**Post-V1 (v1.25.0):** inicio A2-S1 con validaciones de dominio reforzadas en SQL + índices de consulta.

**Post-V1 (v1.26.0):** avance A2-S2 con auditoría local cronológica robusta (compatibilidad legacy + `createdAt` persistido).

**Post-V1 (v1.27.0):** cierre A2-S3 con capa de servicios consolidada (auth/patients/audit) y feedback explícito de errores de red/autenticación en UI.

**Post-V1 (v1.28.0):** avance D1-S1 con pruebas unitarias de `authService` para login Supabase (credenciales inválidas, error de red y éxito con rol).

**Post-V1 (v1.29.0):** cierre D1-S2 con ejecución integral local de pipeline de calidad (`lint` + `test:coverage` + `build` + `deploy:check`) en verde.

**Post-V1 (v1.30.0):** optimización inicial de entrega frontend con code splitting por rutas (`React.lazy` + `Suspense`) para reducir carga inicial.

**Post-V1 (v1.31.0):** optimización del dashboard separando la gráfica de triage en chunk lazy dedicado (`DashboardTriageChart`) para reducir el peso del módulo `Dashboard`.

**Post-V1 (v1.32.0):** optimización del bundle base con partición manual de vendors en Vite (`react`, `router`, `supabase`, `charts`, `ui`) para reducir drásticamente el chunk `index`.

**Post-V1 (v1.33.0):** limpieza de dependencias y UI liviana en dashboard (eliminación de `framer-motion` en favor de transición CSS) para reducir el chunk `vendor-ui`.

**Post-V1 (v1.34.0):** carga diferida bajo demanda de la gráfica del dashboard (toggle “Mostrar/Ocultar gráfica de triage”) para evitar descarga de `vendor-charts` en la ruta inicial hasta que el usuario lo solicite.

**Post-V1 (v1.35.0):** carga dinámica del cliente Supabase (`import("@supabase/supabase-js")`) para diferir `vendor-supabase` y evitar su precarga en el arranque base.

**Post-V1 (v1.36.0):** ajuste de `modulePreload` en Vite para excluir `vendor-charts` del `index.html` inicial y mantener su descarga estrictamente on-demand desde dashboard.

**Post-V1 (v1.37.0):** desacople de providers operativos del arranque global: `PatientProvider` + `SoundPreferenceProvider` migrados a `PrivateAppLayout` lazy para reducir carga inicial en ruta `/login`.

**Post-V1 (v1.38.0):** arranque aún más liviano en auth: `AuthContext` carga `authService` bajo demanda y usa `appConfig` minimal para evitar arrastrar módulos de servicios/Supabase en bootstrap.

**Post-V1 (v1.39.0):** notificaciones desacopladas del bootstrap: `AppToaster` lazy (`react-hot-toast`) fuera del bundle base, eliminando `vendor-ui` del preload inicial.

**Post-V1 (v1.40.0):** shell principal desacoplado del entrypoint: `AppShell` lazy desde `main.jsx`, reduciendo el tamaño del `index` inicial y quitando chunks de router/app del preload base.

**Post-V1 (v1.41.0):** política de preload más estricta en Vite: exclusión de `vendor-react` en `modulepreload` HTML para minimizar trabajo de red en bootstrap inmediato.

**Post-V1 (v1.42.0):** bootstrap ultra-liviano: exclusión adicional de `auth-context`, `theme-context` y `appConfig` del `modulepreload` HTML, dejando solo runtime mínimo y CSS en carga inicial.

**Post-V1 (v1.43.0):** aceleración de navegación post-login con prefetch del área privada (`App`, `PrivateAppLayout`, `Dashboard`) tras autenticación exitosa.

**Post-V1 (v1.44.0):** prefetch inteligente según red (`saveData` / `effectiveType`) + métrica visible de transición post-login en dashboard (`data-testid="post-login-nav-ms"`).

**Post-V1 (v1.45.0):** cobertura unitaria para utilidades de performance (`performance.js`): medición post-login y decisión de prefetch por calidad de conexión.

**Post-V1 (v1.46.0):** telemetría UX persistente de navegación post-login: historial local (último/promedio) y visualización consolidada en dashboard.

**Post-V1 (v1.47.0):** operatividad de telemetría UX: export CSV y reset de historial post-login desde dashboard para diagnóstico rápido de soporte.

**Post-V1 (v1.48.0):** misma telemetría post-login en `/audit` (export/limpiar sin pasar por dashboard) + smoke E2E (`audit-post-login-*`) con historial sembrado para estabilidad en CI.

**Post-V1 (v1.49.0):** registro post-login movido a `useEffect` en `Dashboard` (consume/record tras montaje, diferido con `setTimeout(0)`) para medición fiable con lazy/Suspense; E2E de auditoría valida telemetría real sin sembrar `localStorage`.

**Post-V1 (v1.50.0):** hook compartido `usePostLoginPerf` (Dashboard + Audit); CSV de muestras post-login centralizado en `formatPostLoginPerfCsv` (`performance.js`) con cobertura unitaria.

**Post-V1 (v1.51.0):** nombre de archivo de exportación post-login unificado (`getPostLoginPerfExportFilename`).

**Post-V1 (v1.52.0):** `usePostLoginPerf` expone `downloadPostLoginPerfFile` (CSV + nombre + descarga); `Dashboard` y `Audit` dejan de importar `performance`/`downloadTextFile` solo para esa exportación.

**Post-V1 (v1.53.0):** clave `localStorage` exportada para telemetría post-login; dashboard y auditoría sincronizan el resumen entre pestañas vía evento `storage`.

**Post-V1 (v1.54.0):** nombre de exportación del CSV de historial de auditoría unificado (`getAuditHistoryExportFilename`).

**Post-V1 (v1.55.0):** cierre formal de la **entrega técnica** del programa MVP: `docs/Program-Closure.md` (qué está cerrado en repo vs qué depende de operación/negocio), README y versión alineados.

**Post-V1 (v1.56.0):** avance explícito de **épicas y stories** en BMAD: tablero resumen, `Estado al v1.56.0` y evidencias por historia; roadmap de implementación marcado como completado en repo.

**Post-V1 (v1.57.0):** cierre operativo de **A3-S2 en repositorio**: RLS de `patient_events` (lectura solo admin, inserción por roles operativos), carga del historial solo para admin en `PatientContext`, utilidad `supabaseErrors.js` y mensaje claro ante denegación RLS en `triageService`. Reaplicar políticas en SQL Editor del proyecto Supabase.

**Post-V1 (v1.58.0):** **Épica A3 cerrada en repositorio:** E2E smoke valida que un usuario con rol `medico` no accede a `/audit` (redirección al dashboard). Criterios de aceptación de A3-S2 cubiertos con prueba automatizada además de RLS + UI.

**Post-V1 (v1.59.0):** **Épica D1 cerrada en repositorio (D1-S3):** `scripts/deploy:check.mjs` valida `package.json`, rewrites SPA y que CI ejecute `deploy:check`; `Deployment-V1.md` §9 y `Go-Live-Checklist.md` (criterio D1-S3) documentan entrega repo vs piloto en URL real.

---

## Cierre entrega programa MVP (2026-04-14)

La **entrega de software** del MVP se considera **cerrada en repositorio** según `docs/Program-Closure.md`: CI, funcionalidad acordada, documentación de deploy y registro de versiones. La **puesta en operación** institucional sigue el `docs/Go-Live-Checklist.md`.

---

## EPICA B1 - Definicion de valor y alcance (Business)

### Story B1-S1 - Alinear objetivos del MVP
**Como** Product Owner  
**quiero** definir objetivos medibles del MVP  
**para** asegurar foco y evitar sobrealcance.

**Criterios de aceptacion**
- Existe una lista de 3-5 objetivos medibles aprobados.
- Quedan definidos KPIs base: tiempo de registro, % trazabilidad, % clasificacion.
- Se documenta alcance dentro/fuera del MVP.

**Prioridad:** P0

**Estado al v1.56.0:** Cerrado (documentación). Objetivos, KPIs y alcance en `docs/PRD.md` (§3–6) y `docs/Brief.md`.  
**Pendiente opcional:** acta de aprobación PO / institución.

### Story B1-S2 - Definir roles operativos y permisos esperados
**Como** lider de operacion  
**quiero** mapear responsabilidades por rol (recepcion, enfermeria, medico, admin)  
**para** traducirlas en permisos tecnicos.

**Criterios de aceptacion**
- Existe matriz de permisos por rol.
- Cada accion del sistema tiene rol responsable.
- Casos no autorizados quedan definidos.

**Prioridad:** P0

**Estado al v1.56.0:** Cerrado (documentación + producto). Matriz operativa en `README.md` (“Reglas de permisos”); implementación en `src/utils/permissions.js`, rutas con `allowedRoles` en `src/App.jsx` (p. ej. `/audit` solo `admin`).  
**Pendiente opcional:** matriz firmada por operaciones.

---

## EPICA M1 - Modelo funcional de triage (Model)

### Story M1-S1 - Validar protocolo de clasificacion inicial
**Como** responsable clinico  
**quiero** validar la regla de triage usada por el sistema  
**para** garantizar coherencia operativa.

**Criterios de aceptacion**
- Regla actual I/II/III queda documentada y aprobada.
- Se registran limites y supuestos clinicos.
- Se define version del protocolo (v1).

**Prioridad:** P0

**Estado al v1.56.0:** Cerrado (implementación + doc). Regla I/II/III en `src/utils/triage.js` y pruebas; descrita en PRD RF-03; protocolo referido como v1 en documentación.  
**Pendiente opcional:** acta de validación clínica en el centro piloto.

### Story M1-S2 - Estandarizar estados de atencion
**Como** equipo asistencial  
**quiero** tener estados unificados del paciente  
**para** evitar ambiguedad en seguimiento.

**Criterios de aceptacion**
- Estados definidos: En espera, En atencion, Finalizado.
- Se define quien puede cambiar cada estado.
- Toda transicion valida queda documentada.

**Prioridad:** P0

**Estado al v1.56.0:** Cerrado. Estados “En espera / En atención / Finalizado” y transiciones acotadas en dominio (`src/utils/patientStatus.js` y uso en UI); quién puede cada transición alineado con `permissions.js` y README.

### Story M1-S3 - Definir modelo de datos base
**Como** desarrollador  
**quiero** un modelo de datos claro de usuario, paciente y evento  
**para** implementar backend sin retrabajo.

**Criterios de aceptacion**
- Existe diagrama/logica de entidades y relaciones.
- Campos obligatorios y tipos definidos.
- Reglas de auditoria y timestamps definidos.

**Prioridad:** P0

**Estado al v1.56.0:** Cerrado. Entidades usuario/paciente/evento en `docs/supabase-schema.sql`; persistencia y consultas vía `src/services/triageService.js` y contexto de pacientes.

---

## EPICA A1 - Estabilizacion Frontend MVP (Architecture + Delivery)

### Story A1-S1 - Mejorar validaciones del formulario de triage
**Como** usuario de recepcion/enfermeria  
**quiero** validaciones claras en los campos de paciente  
**para** evitar registros incompletos o invalidos.

**Criterios de aceptacion**
- `name`, `symptom`, `temp`, `fc` son obligatorios.
- `age`, `temp`, `fc` aceptan solo valores numericos validos.
- Mensajes de error son claros y visibles.

**Prioridad:** P0

**Estado al v1.56.0:** Cerrado. Validaciones en `src/utils/triageFormValidation.js` + formulario `src/pages/Triage.jsx`; mensajes por campo y tests asociados.

### Story A1-S2 - Mantener consistencia de calculo de triage
**Como** equipo tecnico  
**quiero** centralizar la logica de triage  
**para** evitar discrepancias entre pantallas.

**Criterios de aceptacion**
- Existe una sola funcion fuente para calcular triage.
- Dashboard, listado y formulario reflejan el mismo resultado.
- Se cubren casos borde en pruebas.

**Prioridad:** P0

**Estado al v1.56.0:** Cerrado. Cálculo centralizado en `src/utils/triage.js`; mismo criterio en dashboard, listado y triage; casos cubiertos en `triage.test.js`.

### Story A1-S3 - Mejorar UX de listado de pacientes
**Como** medico/enfermeria  
**quiero** visualizar y filtrar rapido por prioridad  
**para** atender primero casos criticos.

**Criterios de aceptacion**
- Lista ordenada por prioridad y tiempo.
- Filtros por triage funcionan por URL/query params.
- Se muestran estados vacios y loading basico.

**Prioridad:** P1

**Estado al v1.56.0:** Cerrado. `src/pages/Patients.jsx` con ordenación y filtros por query (`patientSort`, `patientFilters`, `paginateSlice`); estados vacíos y carga con `DataState`.

### Story A1-S4 - Fortalecer historial/auditoria visual
**Como** admin  
**quiero** ver eventos de forma clara y ordenada  
**para** revisar trazabilidad de la atencion.

**Criterios de aceptacion**
- Historial incluye actor (si aplica), accion y fecha.
- Orden cronologico descendente consistente.
- No hay eventos sin identificacion de paciente.

**Prioridad:** P1

**Estado al v1.56.0:** Cerrado. `src/pages/Audit.jsx`: actor, acción, fecha; export CSV (`getAuditHistoryExportFilename`); telemetría UX post-login para soporte; orden cronológico según datos del contexto/servicio.

---

## EPICA A2 - Backend y persistencia real (Architecture)

### Story A2-S1 - Crear API de pacientes
**Como** frontend  
**quiero** consumir endpoints CRUD de pacientes  
**para** dejar de usar estado en memoria.

**Criterios de aceptacion**
- Endpoints para crear, listar y actualizar paciente.
- Validaciones backend reflejan reglas del dominio.
- Errores se responden con codigos HTTP correctos.

**Prioridad:** P0

**Estado al v1.56.0:** Cerrado (Supabase). CRUD de pacientes vía cliente Supabase y tabla `patients`; restricciones y RLS en `docs/supabase-schema.sql`. *Sin API REST propia:* PostgREST/Supabase.

### Story A2-S2 - Persistir eventos de auditoria
**Como** admin  
**quiero** guardar cambios de estado y creacion en base de datos  
**para** conservar trazabilidad historica.

**Criterios de aceptacion**
- Cada evento se almacena con paciente, accion y timestamp.
- Consulta de auditoria devuelve eventos ordenados.
- Eventos sobreviven recarga/reinicio del sistema.

**Prioridad:** P0

**Estado al v1.56.0:** Cerrado. Eventos en `patient_events`; historial cargado en UI; persistencia tras recarga cuando Supabase está configurado.

### Story A2-S3 - Migrar frontend a capa de servicios API
**Como** desarrollador frontend  
**quiero** abstraer llamadas HTTP en servicios  
**para** mejorar mantenibilidad y pruebas.

**Criterios de aceptacion**
- Contextos ya no contienen datos mock en memoria.
- Existe modulo de servicios para auth/patients/audit.
- Errores de red se gestionan en UI con feedback.

**Prioridad:** P0

**Estado al v1.56.0:** Cerrado. `src/services/triageService.js`, `authService.js`; `PatientContext` sin mock permanente; errores de red/auth en UI (login y vistas).

---

## EPICA A3 - Seguridad y autorizacion (Architecture)

### Story A3-S1 - Implementar autenticacion real
**Como** usuario autorizado  
**quiero** iniciar sesion con credenciales seguras  
**para** proteger acceso al sistema.

**Criterios de aceptacion**
- Login con email + password.
- Emision y renovacion basica de token.
- Logout invalida sesion de forma correcta.

**Prioridad:** P0

**Estado al v1.56.0:** Cerrado. Email/password con Supabase Auth (o demo local); sesión y logout en `AuthContext` / `authService`.

### Story A3-S2 - Implementar permisos por rol
**Como** admin del sistema  
**quiero** restringir acciones segun rol  
**para** evitar operaciones no autorizadas.

**Criterios de aceptacion**
- Rutas protegidas por rol.
- Acciones criticas validan rol tambien en backend.
- Intentos no permitidos retornan 403.

**Prioridad:** P0

**Estado al v1.56.0:** Parcial (suficiente para MVP). Rutas y acciones por rol en frontend y políticas RLS en `docs/supabase-schema.sql`. Los “403” en backend son **rechazos RLS** de Supabase, no un API Gateway HTTP propio.  
**Estado al v1.57.0:** Refuerzo en repo: `patient_events` con SELECT solo **admin** e INSERT acotado a roles operativos; `PatientContext` no consulta auditoría si el rol no es admin; `src/utils/supabaseErrors.js` + mensaje usuario en denegaciones.  
**Estado al v1.58.0:** **Cerrado (entrega repositorio).** E2E `e2e/smoke.spec.js` (rol `medico` no accede a `/audit`); criterios de aceptación cubiertos en código + RLS.  
**Opcional en producción:** revisión periódica de políticas RLS y pentest según política del centro.

---

## EPICA D1 - Calidad, pruebas y release (Delivery)

### Story D1-S1 - Definir suite minima de pruebas
**Como** equipo tecnico  
**quiero** pruebas en flujos criticos  
**para** reducir regresiones.

**Criterios de aceptacion**
- Pruebas para login, registro, clasificacion y cambio de estado.
- Pruebas para servicios API principales.
- Cobertura inicial acordada (ejemplo: 60%+ en modulos criticos).

**Prioridad:** P1

**Estado al v1.56.0:** Cerrado. Vitest en servicios (`triageService`, `authService`) y utilidades críticas; E2E Playwright (`e2e/smoke.spec.js`) para login, triage, estados y auditoría.  
**Estado al v1.58.0:** E2E adicional: rol `medico` no accede a `/audit` (A3).

### Story D1-S2 - Configurar CI para calidad automatica
**Como** equipo de desarrollo  
**quiero** pipeline de lint, test y build  
**para** controlar calidad antes de merge/release.

**Criterios de aceptacion**
- Pipeline ejecuta lint + test + build.
- El merge se bloquea si falla algun check.
- Reporte de estado visible en cada PR.

**Prioridad:** P1

**Estado al v1.56.0:** Cerrado. `.github/workflows/ci.yml`: `lint`, `test:coverage`, `build`, `test:e2e`; artefacto de cobertura en PR.  
**Estado al v1.59.0:** CI incluye explícitamente `npm run deploy:check` como gate (verificado por el propio `deploy:check`).

### Story D1-S3 - Preparar despliegue V1
**Como** sponsor del proyecto  
**quiero** una version desplegada y usable  
**para** realizar piloto controlado.

**Criterios de aceptacion**
- Frontend y backend desplegados en entorno objetivo.
- Variables de entorno documentadas.
- Checklist de salida a produccion completado.

**Prioridad:** P1

**Estado al v1.56.0:** Parcial (entrega). Documentación (`Deployment-V1.md`, `.env.example`), `deploy:check`, `vercel.json` / `public/_redirects`. El despliegue en un host real y el checklist completado son **operación** (`docs/Go-Live-Checklist.md`).  
**Estado al v1.59.0:** **Cerrado (entrega repositorio).** `deploy:check` ampliado (SPA + CI), `Deployment-V1.md` §9 y criterio D1-S3 en `Go-Live-Checklist.md`. **Sigue pendiente en operación:** desplegar en hosting y completar el checklist en la URL real.

---

## Orden recomendado de ejecucion (roadmap de stories)

Estado **v1.56.0:** el roadmap de implementación del MVP en repositorio está **completado**. Las siguientes iteraciones son **prioridad de negocio** (piloto, hardening, integraciones), no secuencia obligatoria del MVP:

1. ~~B1-S1, B1-S2~~ Hecho (doc + producto).  
2. ~~M1-S1, M1-S2, M1-S3~~ Hecho.  
3. ~~A1-S1, A1-S2, A1-S3, A1-S4~~ Hecho.  
4. ~~A2-S1, A2-S2, A2-S3~~ Hecho.  
5. ~~A3-S1, A3-S2~~ Hecho (cerrado en repo v1.58.0; hardening opcional en prod).  
6. ~~D1-S1, D1-S2, D1-S3~~ Hecho (entrega repo v1.59.0); operación: URL + checklist en hosting.

---

## Sprint sugerido (2 semanas por sprint)

**Histórico** (plan original). Para trabajo nuevo, sugerir **backlog post-MVP**: piloto en URL real (checklist go-live), métricas de negocio, integraciones HIS, notificaciones.

---

## Definicion de terminado (DoD) para cada story
- Criterios de aceptacion cumplidos.
- Codigo revisado y mergeado.
- Lint y tests en verde.
- Documentacion minima actualizada.
- Demo funcional validada por negocio.
