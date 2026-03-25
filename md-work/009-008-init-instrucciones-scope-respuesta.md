## Verificación de instalación - Scope `web`

### Instalados (7)

- `vite`
- `mantine-dev`
- `zod-4`
- `react-hook-form-zod`
- `sentry-react-setup`
- `openapi-to-typescript`
- `vitest`

### No instalados (omitidos)

- `vercel-react-best-practices`
- `tanstack-query`
- `accessibility-compliance`
- `accessibility`
- `wcag-audit-patterns`
- `responsive-design`
- `pwa-development`
- `design-system-patterns`
- `react-state-management`
- `email-best-practices`
- `associated-i18n`

---

# Resultado: `web/AGENTS.md` actualizado

Se han añadido los 7 skills instalados en una nueva sección:

## `### Web Skills (Frontend scope)`

| Skill                   | Propósito en el proyecto               |
| ----------------------- | -------------------------------------- |
| `vite`                  | Build tool y dev server (Vite 7)       |
| `mantine-dev`           | UI kit exclusivo (Mantine 8)           |
| `zod-4`                 | Validación de schemas en formularios   |
| `react-hook-form-zod`   | Formularios type-safe (RHF 7 + Zod 4)  |
| `sentry-react-setup`    | Observabilidad frontend (RNF-042)      |
| `openapi-to-typescript` | Sincronización de tipos API → frontend |
| `vitest`                | Testing unitario y de componentes      |

---

## Skills omitidos

Se omiten 11 skills del reporte por no estar instalados:

- `vercel-react-best-practices`
- `tanstack-query`
- `accessibility-compliance`
- `accessibility`
- `wcag-audit-patterns`
- `responsive-design`
- `pwa-development`
- `design-system-patterns`
- `react-state-management`
- `email-best-practices`
- `associated-i18n`

---

## Auto-invoke Skills

Total: **19 entradas**

- 6 preexistentes (`doc-spec-*`)
- 13 nuevas específicas del _scope_ `web`

### Distribución

- `vite` - 2 entradas
  - Configuración inicial
  - Debug / optimización de build

- `mantine-dev` - 3 entradas
  - Uso de componentes UI

  - Theming y estilos

  - Inputs y formularios

  > Justificación: Mantine es el único UI kit del proyecto y presenta tres patrones de uso claramente diferenciados.

- `zod-4` - 2 entradas
  - Creación de schemas
  - Migración v3 → v4

- `react-hook-form-zod` - 2 entradas
  - Formularios básicos
  - Patrones avanzados

- `sentry-react-setup` - 2 entradas
  - Setup inicial
  - Replay / tracing

- `openapi-to-typescript` - 1 entrada
  - Generación y sincronización de tipos

- `vitest` - 2 entradas
  - Escritura de tests
  - Configuración de cobertura
