# Brief de Proyecto - TriageIA

## 1) Nombre del proyecto
TriageIA

## 2) Objetivo del brief
Documentar de forma ejecutiva que se construye, para quien, con que enfoque y en que orden de trabajo, de manera que el equipo pueda ejecutar sin ambiguedad.

## 3) Contexto
Existe un prototipo funcional en React que cubre el flujo base de triage: login simple, registro de paciente, clasificacion por prioridad, seguimiento de estado y dashboard de monitoreo. El siguiente paso es convertirlo en un producto estable, seguro y desplegable.

## 4) Problema central
La atencion inicial de urgencias necesita priorizacion clara y trazabilidad de acciones para disminuir riesgo operativo y mejorar coordinacion entre roles.

## 5) Propuesta de valor
- Priorizacion inmediata de pacientes por severidad.
- Visibilidad operativa en tiempo real del estado del servicio.
- Historial de acciones para seguimiento y control.
- Flujo simple y rapido para equipos clinicos.

## 6) Publico objetivo
- Primario: personal de recepcion, enfermeria y medico de urgencias.
- Secundario: coordinadores y responsables operativos (admin).

## 7) Alcance de la iniciativa
### Incluido
- Evolucion del MVP actual a una V1 estable.
- Definicion funcional y tecnica por fases.
- Plan de ejecucion y control de calidad.

### Excluido (corto plazo)
- Integraciones complejas con sistemas hospitalarios externos.
- Analitica avanzada predictiva.

## 8) Entregables principales
- Documento PRD (`docs/PRD.md`).
- Backlog inicial priorizado (P0/P1/P2).
- MVP estabilizado (frontend).
- Backend con persistencia y auth real.
- Version V1 desplegada con pruebas base.

## 9) Criterios de exito
- Flujo operativo completo sin bloqueos.
- Datos persistentes y consistentes en dashboard/lista/historial.
- Tiempos de registro agiles para personal de triage.
- Control de acceso por rol funcionando.

## 10) Plan paso a paso (ejecucion)
## Paso 1 - Definir y cerrar alcance
- Confirmar objetivos y metricas del MVP final.
- Validar reglas clinicas de clasificacion.

## Paso 2 - Estabilizar frontend actual
- Validaciones, UX de errores, filtros, consistencia visual.

## Paso 3 - Implementar backend y base de datos
- API, modelo de datos, persistencia de pacientes/eventos/usuarios.

## Paso 4 - Seguridad y roles
- Login robusto, permisos por rol, auditoria confiable.

## Paso 5 - Calidad y despliegue
- Tests, CI/CD, release V1, monitoreo inicial.

## 11) Stack actual y direccion tecnica
- Frontend actual: React + Vite + Tailwind.
- Estado actual: en memoria (sin persistencia real).
- Direccion recomendada: API REST + base de datos relacional + JWT.

## 12) Riesgos clave
- Cambios en criterios clinicos de triage durante ejecucion.
- Retraso en definiciones de seguridad/roles.
- Alcance excesivo para primera version.

## 13) Gobernanza recomendada
- Reunion semanal de seguimiento (producto + tecnico).
- Demo quincenal del avance funcional.
- Gestion de cambios por backlog priorizado.
