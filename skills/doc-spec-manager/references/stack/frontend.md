## 3. Frontend

### 3.1 Framework: React 19.x + TypeScript

**Seleccionado:** React

| Criterio          | React        | Vue 3     | Angular   | Svelte       |
| ----------------- | ------------ | --------- | --------- | ------------ |
| Ecosistema        | ✅ Masivo    | ✅ Grande | ✅ Grande | ⚠️ Creciendo |
| TypeScript        | ✅ Excelente | ✅ Bueno  | ✅ Nativo | ✅ Bueno     |
| Componentes UI    | ✅ Muchos    | ✅ Varios | ⚠️ Menos  | ⚠️ Pocos     |
| PWA support       | ✅ Maduro    | ✅ Bueno  | ✅ Bueno  | ⚠️ Manual    |
| Learning curve    | ⚠️ Media     | ✅ Baja   | ❌ Alta   | ✅ Baja      |
| Server Components | ✅ Sí        | ❌ No     | ❌ No     | ❌ No        |

**Justificación:**

- Ecosistema más grande = más soluciones probadas
- Excelente integración con TypeScript (mismo lenguaje que backend)
- Librerías de componentes maduras (MUI, Ant Design, shadcn/ui)
- React Query para gestión de estado servidor
- Soporte PWA maduro (RNF-056)

### 3.2 Build Tool y Routing: Vite + React Router

**Seleccionado:** Vite + React Router (sin meta-framework)

> **Nota:** Un _meta-framework_ es un framework construido sobre otro que añade convenciones y funcionalidades (ej: Next.js sobre React, Nuxt sobre Vue). Incluyen routing, SSR/SSG, data fetching patterns y optimizaciones integradas.

| Criterio         | Vite + RR     | Next.js      | Remix        |
| ---------------- | ------------- | ------------ | ------------ |
| Complejidad      | ✅ Baja       | ⚠️ Media     | ⚠️ Media     |
| SPA puro         | ✅ Ideal      | ⚠️ Posible   | ⚠️ Posible   |
| Build speed      | ✅ Muy rápido | ✅ Rápido    | ✅ Rápido    |
| Bundle size      | ✅ Óptimo     | ⚠️ Mayor     | ⚠️ Mayor     |
| Backend separado | ✅ Natural    | ⚠️ Conflicto | ⚠️ Conflicto |

**Justificación:**

- El backend es NestJS separado → no necesitamos SSR framework ni API routes integradas
- Vite ofrece HMR instantáneo y builds optimizados con ESBuild
- React Router v7 (paquete unificado `react-router`) para routing client-side
- Menor complejidad = menor mantenimiento
- Evitamos duplicidad de responsabilidades entre Next.js API routes y NestJS

### 3.3 Librerías Frontend

| Librería                | Propósito          | Versión | ADR/RNF     |
| ----------------------- | ------------------ | ------- | ----------- |
| `@tanstack/react-query` | Estado servidor    | 5.x     | RNF-015-016 |
| `react-router`          | Routing            | 7.x     | -           |
| `@mantine/core`         | Componentes UI     | 8.x     | RNF-045-047 |
| `@mantine/hooks`        | Hooks utilidad     | 8.x     | -           |
| `react-hook-form`       | Forms avanzados    | 7.x     | -           |
| `zod`                   | Validación schemas | 4.x     | RNF-008     |
| `axios`                 | HTTP client        | 1.x     | -           |
| `date-fns`              | Fechas             | 4.x     | -           |
| `react-i18next`         | i18n               | 16.x    | RNF-047     |
| `vite-plugin-pwa`       | PWA/Service Worker | 1.x     | RNF-056     |

### 3.4 UI Kit: Mantine

**Seleccionado:** Mantine

| Criterio        | Mantine     | MUI         | Ant Design  | shadcn/ui  |
| --------------- | ----------- | ----------- | ----------- | ---------- |
| Bundle size     | ✅ Ligero   | ❌ Pesado   | ❌ Pesado   | ✅ Ligero  |
| Customización   | ✅ Fácil    | ⚠️ Theme    | ⚠️ Theme    | ✅ Total   |
| Accesibilidad   | ✅ WCAG AA  | ✅ WCAG AA  | ✅ Buena    | ✅ WCAG AA |
| Componentes     | ✅ Completo | ✅ Completo | ✅ Completo | ⚠️ Básicos |
| Hooks incluidos | ✅ Sí       | ❌ No       | ❌ No       | ❌ No      |
| Dark mode       | ✅ Nativo   | ✅ Nativo   | ✅ Nativo   | ✅ Manual  |

**Justificación:**

- Bundle size ligero (importante para PWA)
- Accesibilidad WCAG AA incluida (RNF-046)
- Hooks de utilidad (@mantine/hooks) muy útiles
- Sistema de temas flexible
- Componentes para skeleton screens nativos (RNF-050)
