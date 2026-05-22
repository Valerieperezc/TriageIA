# Informe: Arquitectura y pruebas de la app TriageIA

## Introduccion

TriageIA es una aplicacion desarrollada para apoyar el proceso de triage en servicios de urgencias. Su objetivo principal es registrar pacientes, sugerir una prioridad clinica segun signos vitales y criterios CTAS, controlar el estado de atencion y ofrecer trazabilidad de las acciones realizadas por el personal autorizado.

La app esta construida con React, Vite y Supabase. Aunque se ejecuta como aplicacion web, su arquitectura esta preparada para una experiencia responsive, con navegacion movil, barra inferior, menu lateral adaptable y flujos pensados para uso operativo en pantallas de escritorio o dispositivos moviles.

Este informe explica como la arquitectura y las pruebas impactan directamente en TriageIA, tomando como base los modulos reales del proyecto, sus flujos principales y sus mecanismos de calidad.

## Objetivo de la aplicacion

TriageIA busca mejorar la atencion inicial de urgencias mediante:

- Registro rapido de pacientes.
- Sugerencia de nivel CTAS segun motivo de consulta, signos vitales y banderas rojas.
- Seguimiento del estado del paciente: en espera, en atencion y finalizado.
- Dashboard operativo para visualizar la carga del servicio.
- Historial de eventos para auditoria.
- Control de acceso por roles: recepcion, enfermeria, medico y admin.

El problema que atiende la app es la necesidad de priorizar pacientes de forma clara y trazable. En un entorno de urgencias, un error de clasificacion o la falta de seguimiento puede afectar la seguridad del paciente y la coordinacion entre areas.

## Arquitectura general de TriageIA

La arquitectura de TriageIA separa responsabilidades en carpetas y modulos especificos. Esta organizacion facilita el mantenimiento, las pruebas y la evolucion del sistema.

### Capa de presentacion

La capa de presentacion esta formada por las paginas, componentes y layouts de React. Entre los modulos principales se encuentran:

- `src/pages/Login.jsx`: ingreso al sistema.
- `src/pages/RoleHome.jsx`: pantalla inicial segun el rol del usuario.
- `src/pages/Dashboard.jsx`: monitoreo general del estado de pacientes.
- `src/pages/Patients.jsx`: listado y filtros de pacientes.
- `src/pages/Triage.jsx`: registro y clasificacion inicial.
- `src/pages/PatientDetail.jsx`: detalle del paciente y cambio de estado.
- `src/pages/Audit.jsx`: historial de eventos restringido a admin.
- `src/pages/Settings.jsx`: preferencias de uso.

La navegacion se controla desde `src/App.jsx` con rutas privadas, rutas publicas y validacion de roles. Esto evita que usuarios sin permisos entren a pantallas sensibles como el historial de auditoria o el registro de triage.

### Capa de componentes reutilizables

La app cuenta con componentes reutilizables para mantener consistencia visual y funcional:

- `AppShell`, `Sidebar`, `MobileNav` y `MobileMenuDrawer` organizan la estructura de navegacion.
- `StatCard`, `DashboardTriageChart` y `DashboardQuickActions` apoyan el tablero operativo.
- `DataState`, `AppLoadingScreen` y `AppToaster` manejan estados de carga, errores y notificaciones.
- `TriageCtasAssignment` y `CtasLevelDisplay` muestran y validan informacion relacionada con CTAS.

Esta separacion permite que las pantallas no concentren toda la logica visual y que los elementos comunes se puedan corregir o mejorar en un solo lugar.

### Capa de logica de negocio

La logica de negocio vive principalmente en `src/utils` y `src/constants`. Alli se definen reglas que no dependen directamente de la interfaz.

Algunos ejemplos importantes son:

- `src/utils/ctasTriage.js`: sugiere el nivel CTAS a partir de motivo de consulta, signos vitales, banderas rojas y via rapida.
- `src/utils/triage.js`: calcula prioridad segun parametros clinicos.
- `src/utils/triageFormValidation.js`: valida los datos del formulario de triage.
- `src/utils/permissions.js`: centraliza permisos por rol.
- `src/utils/dashboardMetrics.js`: calcula metricas para el dashboard.
- `src/utils/patientFilters.js`, `patientSort.js` y `pagination.js`: organizan busqueda, orden y paginacion.

Esta separacion es importante porque las reglas criticas se pueden probar sin depender de toda la interfaz. Por ejemplo, la validacion de subclasificacion CTAS puede comprobarse con pruebas unitarias sin abrir la app en el navegador.

### Capa de servicios y datos

La persistencia y comunicacion con datos esta centralizada en servicios:

- `src/services/authService.js`: autenticacion, sesion y perfil del usuario.
- `src/services/triageService.js`: lectura, creacion y actualizacion de pacientes y eventos.
- `src/lib/supabase.js`: configuracion del cliente de Supabase.

TriageIA usa Supabase como backend para autenticacion y base de datos. Cuando no existe configuracion de Supabase en el entorno local, la app puede trabajar con almacenamiento local como fallback. Esto facilita pruebas, desarrollo y demostraciones sin depender siempre de una conexion externa.

## Flujo principal de la app

El flujo operativo de TriageIA inicia con el login. Una vez autenticado, el usuario entra a una experiencia segun su rol:

- Recepcion puede registrar pacientes.
- Enfermeria puede registrar pacientes y pasarlos a en atencion.
- Medico puede actualizar la atencion y finalizar pacientes.
- Admin tiene acceso total, incluyendo historial.

Durante el registro de triage, el sistema recibe datos como edad, sintomas, temperatura, frecuencia cardiaca, saturacion, dolor, presion arterial, frecuencia respiratoria, banderas rojas y motivo de consulta. Con esta informacion se sugiere un nivel CTAS.

Si el usuario asigna una prioridad menos urgente que la sugerida, la aplicacion exige justificacion. Esta regla reduce el riesgo de subclasificacion y mejora la trazabilidad clinica.

## Impacto de la arquitectura en TriageIA

La arquitectura actual beneficia directamente a la app en cuatro aspectos:

### Mantenibilidad

El codigo esta dividido por responsabilidades. Las rutas estan en `App.jsx`, la navegacion en `appNavigation.js`, los permisos en `permissions.js`, la logica CTAS en `ctasTriage.js` y la persistencia en `triageService.js`. Esto facilita encontrar donde hacer cambios sin afectar partes no relacionadas.

Por ejemplo, si cambia una regla de clasificacion CTAS, se modifica la logica de triage y sus pruebas, sin tener que reescribir todas las pantallas.

### Escalabilidad funcional

TriageIA puede crecer agregando nuevos modulos, roles o reportes porque ya existe una base organizada. El uso de rutas privadas, layouts reutilizables y servicios centralizados permite incorporar nuevas pantallas sin duplicar demasiada logica.

Tambien permite extender el backend. Actualmente se usan tablas como `patients`, `patient_events` y `profiles`; en el futuro se podrian agregar reportes, integraciones externas o indicadores clinicos sin romper el flujo principal.

### Seguridad operativa

El control de acceso por rol ayuda a que cada usuario vea solo lo que necesita. La pantalla de auditoria esta restringida a admin y el registro de triage esta limitado a roles autorizados. Esto protege informacion sensible y reduce acciones indebidas.

Ademas, la persistencia de eventos permite reconstruir acciones relevantes, lo cual es importante en un contexto clinico.

### Experiencia de usuario

Una arquitectura ordenada tambien mejora la experiencia. Los componentes de carga, notificaciones, navegacion movil y estados de datos permiten que el usuario reciba informacion clara durante el uso. En urgencias, esto es importante porque el flujo debe ser rapido, directo y confiable.

## Estrategia de pruebas

TriageIA incluye pruebas automatizadas con Vitest y Playwright. La estrategia combina pruebas unitarias para reglas internas y pruebas end to end para validar que la app cargue y responda como producto.

Los scripts principales son:

- `npm run lint`: revision estatica de calidad.
- `npm run test:run`: ejecucion de pruebas unitarias.
- `npm run test:coverage`: cobertura de modulos criticos.
- `npm run test:e2e`: pruebas end to end con Playwright.
- `npm run deploy:check`: verificacion previa a despliegue.

## Pruebas unitarias relevantes

El proyecto tiene pruebas para utilidades importantes:

- `ctasTriage.test.js`: valida sugerencias CTAS, subclasificacion y justificaciones.
- `triage.test.js`: verifica reglas de prioridad.
- `triageFormValidation.test.js`: valida campos del formulario.
- `permissions.test.js`: comprueba permisos por rol.
- `dashboardMetrics.test.js`: revisa calculos del tablero.
- `patientFilters.test.js`, `patientSort.test.js` y `pagination.test.js`: validan busqueda, orden y paginacion.
- `authService.test.js` y `triageService.test.js`: revisan servicios principales.
- `supabaseErrors.test.js`: valida manejo de errores de permisos y base de datos.

Estas pruebas son importantes porque la app maneja decisiones sensibles. Si una regla de prioridad cambia por accidente, las pruebas pueden detectarlo antes de publicar.

## Pruebas end to end

La carpeta `e2e` incluye pruebas de humo con Playwright. Estas pruebas validan que la aplicacion pueda levantarse, cargar sus rutas principales y comportarse correctamente en un entorno cercano al uso real.

Las pruebas end to end complementan las unitarias porque verifican la integracion entre rutas, componentes, autenticacion y renderizado general. En una app de triage, esto ayuda a detectar errores visibles para el usuario antes de una entrega.

## Relacion entre arquitectura y pruebas en TriageIA

La arquitectura modular hace que TriageIA sea mas facil de probar. Como la logica clinica esta separada de la interfaz, se pueden escribir pruebas directas sobre funciones como `suggestCtasLevel`, `validateTriageAssignment` o `calculateTriage`.

Del mismo modo, los servicios de datos se pueden probar sin mezclar toda la UI. Esto reduce el acoplamiento y permite detectar fallos en areas concretas: permisos, persistencia, calculos, filtros o navegacion.

Si la logica estuviera mezclada dentro de las pantallas, cada cambio obligaria a probar manualmente muchos flujos. En cambio, la estructura actual permite automatizar validaciones y aumentar la confianza antes de desplegar.

## Riesgos que las pruebas ayudan a controlar

Las pruebas de TriageIA reducen riesgos como:

- Asignar una prioridad CTAS incorrecta.
- Permitir subclasificacion sin justificacion.
- Mostrar modulos a usuarios sin permisos.
- Perder consistencia entre dashboard, listado y detalle.
- Romper filtros, paginacion u ordenamiento de pacientes.
- Publicar una version que no construye correctamente.
- Introducir errores en el flujo de autenticacion.

Estos riesgos son especialmente importantes porque la aplicacion se relaciona con procesos clinicos y operativos, no solo con una experiencia informativa.

## Despliegue y calidad

El proyecto incluye configuracion para despliegue como SPA:

- `vercel.json` para Vercel.
- `public/_redirects` para Netlify.
- `docs/Deployment-V1.md` y `docs/Go-Live-Checklist.md` como guias operativas.

Tambien cuenta con documentos de apoyo como PRD, brief, notas de version y cierre tecnico. Esto ayuda a que la app no dependa solo del codigo, sino tambien de una documentacion que explique el alcance, los requisitos y los pasos de salida a produccion.

## Conclusiones

TriageIA no es una aplicacion generica: es una herramienta orientada al registro, priorizacion y seguimiento de pacientes en urgencias. Por eso, su arquitectura y sus pruebas son esenciales para sostener la calidad del producto.

La arquitectura separa interfaz, logica de negocio, servicios, permisos y persistencia. Esta organizacion facilita mantenimiento, escalabilidad y seguridad. Las pruebas validan reglas criticas como CTAS, permisos, formularios, metricas y servicios, reduciendo el riesgo de errores antes del despliegue.

En conjunto, arquitectura y pruebas permiten que TriageIA sea mas confiable, mantenible y preparada para evolucionar como una app clinico-operativa.
