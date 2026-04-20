# PRD - TriageIA

## 1) Resumen del producto
TriageIA es una aplicacion web para apoyar el flujo de clasificacion inicial de pacientes en un servicio de urgencias. El sistema permite registrar pacientes, calcular prioridad de atencion (Triage I/II/III), visualizar el estado operativo en un dashboard y mantener un historial de acciones.

Estado actual: existe un MVP funcional en frontend (React + Vite) con datos en memoria y autenticacion basica por lista de correos.

## 2) Problema a resolver
En un entorno de triage, la priorizacion y seguimiento manual pueden generar:
- tiempos de espera mal gestionados para casos criticos;
- baja visibilidad del estado operativo del turno;
- trazabilidad incompleta de las decisiones de atencion.

## 3) Objetivos del producto
- Reducir el tiempo de identificacion de pacientes criticos.
- Estandarizar la clasificacion inicial bajo reglas claras.
- Mejorar la visibilidad para coordinacion clinica y administrativa.
- Contar con trazabilidad basica de eventos del paciente.

## 4) Metas medibles (MVP -> V1)
- 100% de pacientes registrados con nivel de triage asignado.
- 100% de cambios de estado con evento en historial.
- < 30 segundos para registrar y clasificar un paciente promedio.
- 0 bloqueos criticos en flujo: login -> registro -> lista -> detalle -> auditoria.

## 5) Usuarios y roles
- Recepcion: crea registro inicial del paciente.
- Enfermeria: valida signos basicos y triage.
- Medico: toma pacientes en atencion y finaliza casos.
- Admin: monitorea dashboard y auditoria.

## 6) Alcance funcional
### Incluido en MVP actual
- Login simple por correo autorizado.
- Dashboard con conteos por nivel de triage y grafica.
- Registro de paciente con calculo de triage (I/II/III).
- Lista priorizada de pacientes por nivel.
- Vista detalle de paciente y cambio de estado.
- Historial de eventos (creacion/cambio de estado).
- Alerta sonora para casos Triage I.

### Fuera de alcance (por ahora)
- Persistencia en base de datos real.
- Integracion con HIS/EMR.
- Notificaciones multicanal (SMS, correo, push).
- Control de permisos avanzado por rol.
- Auditoria legal avanzada y firma digital.

## 7) Requisitos funcionales (RF)
- RF-01: El sistema debe autenticar usuario por correo autorizado.
- RF-02: El sistema debe permitir registrar nombre, edad, sintoma, temperatura y frecuencia cardiaca.
- RF-03: El sistema debe calcular triage:
  - I si temperatura > 39 o frecuencia cardiaca > 130.
  - II si temperatura > 38.
  - III en los demas casos.
- RF-04: El sistema debe mostrar lista de pacientes ordenada por prioridad (I, II, III).
- RF-05: El sistema debe mostrar tiempo transcurrido desde registro.
- RF-06: El sistema debe permitir cambiar estado a "En atencion" o "Finalizado".
- RF-07: El sistema debe registrar en historial los eventos de creacion y cambio de estado.
- RF-08: El sistema debe mostrar indicadores agregados en dashboard.

## 8) Requisitos no funcionales (RNF)
- RNF-01: Interfaz responsive minima para desktop/tablet.
- RNF-02: Tiempo de respuesta de UI < 200 ms en operaciones locales.
- RNF-03: Manejo de errores de formulario y validaciones basicas.
- RNF-04: Accesibilidad basica: contraste, foco y navegacion por teclado.
- RNF-05: Base de codigo mantenible y modular.

## 9) Riesgos y mitigaciones
- Regla de triage simplificada puede no cubrir casos reales.
  - Mitigacion: versionar protocolo clinico con validacion de expertos.
- Datos en memoria se pierden al refrescar.
  - Mitigacion: migrar a backend + BD en Fase 2.
- Login sin password ni tokens.
  - Mitigacion: autenticacion real (JWT/OAuth) en Fase 2.

## 10) Plan de ejecucion paso a paso
## Fase 0 - Alineacion (1-2 dias)
- Definir alcance de MVP final y criterios de exito.
- Validar reglas de triage con stakeholder clinico.
- Cerrar checklist funcional minimo.

Entregable: alcance firmado + backlog inicial priorizado.

## Fase 1 - Estabilizacion MVP frontend (3-5 dias)
- Mejorar validaciones de formulario (rangos, campos obligatorios).
- Corregir navegacion/filtros por query params.
- Añadir estados vacios y feedback de errores.
- Estandarizar componentes UI.

Entregable: MVP frontend estable, usable y demostrable.

## Fase 2 - Persistencia y backend (1-2 semanas)
- Diseñar modelo de datos (usuarios, pacientes, eventos).
- Crear API REST (auth, pacientes, estados, auditoria).
- Conectar frontend a API y reemplazar estado en memoria.
- Añadir seeds para entorno de pruebas.

Entregable: aplicacion funcional con datos persistentes.

## Fase 3 - Seguridad y roles (1 semana)
- Implementar autenticacion real (password + token).
- Implementar autorizacion por rol y vistas protegidas.
- Registrar auditoria con usuario y timestamp confiables.

Entregable: control de acceso por perfil operativo.

## Fase 4 - Calidad y despliegue (1 semana)
- Pruebas unitarias y de integracion en flujos criticos.
- Pipeline CI (lint, tests, build).
- Deploy de frontend y backend en entorno productivo inicial.

Entregable: version V1 desplegada con control de calidad.

## 11) Criterios de aceptacion globales
- Flujo completo de paciente operando sin errores bloqueantes.
- Dashboard y auditoria reflejan datos reales persistidos.
- Roles no autorizados no pueden ejecutar acciones restringidas.
- Pruebas de regresion pasan en CI antes de cada release.

## 12) Backlog priorizado inicial
- P0: Validaciones robustas de triage y formulario.
- P0: Persistencia de pacientes/historial.
- P0: Autenticacion/autorizacion real.
- P1: Filtros avanzados y busqueda.
- P1: Exportacion de historial (CSV/PDF).
- P2: Integraciones externas y notificaciones.
