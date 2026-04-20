# Release notes - TriageIA v1.0.0

**Fecha:** 2026-04-13  
**Tipo:** primera versión estable (V1)

## Resumen

TriageIA v1.0.0 es la primera entrega usable del sistema de triage asistencial: registro de pacientes, clasificación I/II/III, seguimiento de estado, auditoría para administradores, persistencia en Supabase y pipeline de calidad automatizado.

## Para usuarios

- Inicio de sesión con correo y contraseña (Supabase) o modo local de desarrollo.
- Registro de pacientes según permisos del rol asignado.
- Dashboard y listas priorizadas por gravedad.
- Cambio de estado del paciente acorde al rol (recepción, enfermería, médico, admin).

## Para operaciones / TI

- Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Esquema SQL: `docs/supabase-schema.sql`.
- Despliegue: `docs/Deployment-V1.md`; checklist: `docs/Go-Live-Checklist.md`.

## Para desarrollo

- Comandos: `npm run dev`, `npm run lint`, `npm run test:run`, `npm run build`.
- CI: `.github/workflows/ci.yml`.

## Próximos pasos sugeridos (post-V1)

- Ampliar cobertura de pruebas (componentes y flujos E2E).
- Optimización de bundle (code splitting).
- Integraciones externas o notificaciones según roadmap de negocio.
