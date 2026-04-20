# Go-Live Checklist - TriageIA V1

## Antes del deploy
- [ ] Historias P0 cerradas y validadas.
- [ ] CI en verde (`lint`, `test`, `build`).
- [ ] Variables de entorno de produccion configuradas.
- [ ] `docs/supabase-schema.sql` aplicado en proyecto objetivo (incl. políticas RLS de `patient_events`: lectura admin, inserción por roles operativos).
- [ ] Usuario admin creado y rol asignado en `profiles`.
- [ ] Acceso de prueba para recepcion, enfermeria y medico.

## Durante el deploy
- [ ] Deploy ejecutado en plataforma seleccionada.
- [ ] Build sin errores.
- [ ] URL publica accesible.
- [ ] Rewrite SPA funcionando (`/patients`, `/triage`, `/audit`).

## Despues del deploy
- [ ] Login funcional con usuario valido.
- [ ] Registro de paciente funcional.
- [ ] Cambio de estado funcional segun rol.
- [ ] Restriccion de permisos confirmada (403/logica de UI).
- [ ] Historial de auditoria visible para admin.
- [ ] Dashboard refleja datos persistidos.
- [ ] No hay errores bloqueantes en consola.

## Cierre de release
- [ ] Registro de version/tag.
- [ ] Evidencia de pruebas post-deploy.
- [ ] Documento de incidencias (si aplica).
- [ ] Comunicacion de salida enviada al equipo.

## Criterio D1-S3 (BMAD)
- **Entrega tecnica en repo:** CI en verde incluye `npm run deploy:check` (documentacion, env de ejemplo, SPA, pipeline).
- **Salida a produccion:** URL publica con variables configuradas, esquema Supabase aplicado y casillas de este checklist marcadas para el piloto.
