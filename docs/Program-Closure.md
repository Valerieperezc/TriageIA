# Cierre del programa MVP — TriageIA

**Fecha de cierre de entrega técnica:** 2026-04-14  
**Versión de referencia:** ver `package.json` y `CHANGELOG.md` (v1.59.0: épica D1 cerrada en repo — D1-S3 `deploy:check` + doc; matriz BMAD en `docs/BMAD-Stories.md`).

Este documento declara **qué queda cerrado en código y calidad** y **qué sigue siendo responsabilidad operativa o de negocio** fuera del repositorio.

## 1. Criterios de cierre técnico (cumplidos en repo)

| Área | Evidencia |
|------|-----------|
| Funcionalidad MVP | Pantallas, triage I/II/III, estados, dashboard, pacientes, detalle, auditoría (admin), modo local + Supabase |
| Capa de servicios y errores | `authService`, `triageService`, feedback de red/auth en UI |
| Calidad automatizada | `lint`, Vitest, cobertura en CI, E2E Playwright, `deploy:check` |
| Rendimiento frontend | Code splitting, lazy routes, telemetría UX post-login documentada |
| Despliegue | `Deployment-V1.md`, `vercel.json`, `public/_redirects`, `.env.example`, `deploy:check` en CI |
| Esquema datos | `docs/supabase-schema.sql` |

## 2. Épica BMAD — estado al cierre

Detalle historia por historia (criterios, evidencia, parciales): **`docs/BMAD-Stories.md`** (resumen ejecutivo y bloques *Estado al v1.x.x* por story).

| Épica | Estado en código | Pendiente fuera de repo (si aplica) |
|-------|------------------|-------------------------------------|
| **B1** Business | B1-S1, B1-S2 cerradas en doc + producto | Actas / priorización institucional opcional |
| **M1** Modelo | M1-S1 … M1-S3 cerradas en implementación | Validación clínica formal opcional |
| **A1** Frontend | A1-S1 … A1-S4 cerradas | UX según piloto |
| **A2** Persistencia | A2-S1 … A2-S3 cerradas (Supabase + servicios) | Instancia prod + operación |
| **A3** Seguridad | A3-S1, **A3-S2 cerradas en repo** (RLS + UI + E2E) | Políticas finas por centro / pentest en prod (opcional) |
| **D1** Delivery | **D1-S1, D1-S2, D1-S3 cerradas en repo** (`deploy:check`, docs deploy) | URL de piloto + checklist go-live en hosting real |

## 3. Checklist operativo (no automatizable aquí)

Seguir `docs/Go-Live-Checklist.md` para: variables de entorno en hosting, usuarios y roles en Supabase, smoke en URL pública, comunicación de salida.

## 4. Definición: “programa terminado” (este proyecto)

- **Entrega de software:** considerada **completa** cuando la rama principal cumple CI, la documentación de cierre está actualizada y la versión en `package.json` refleja el último cierre documentado en `CHANGELOG.md`.
- **Producto en operación:** requiere además completar el checklist de go-live y la validación de negocio/clínica en el entorno real.

## 5. Referencias

- `docs/BMAD-Stories.md` — historial Post-V1, **matriz de avance v1.59.0** y estado por story.
- `docs/Deployment-V1.md` — despliegue.
- `docs/Go-Live-Checklist.md` — salida a producción.
- `CHANGELOG.md` — registro de versiones.
