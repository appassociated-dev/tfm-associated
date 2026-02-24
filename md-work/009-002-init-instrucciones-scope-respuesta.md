Todo correcto.

## Resumen de lo implementado

### 1. `AGENTS.md` (root)

Se han añadido 6 secciones nuevas:

* **Project Overview**: ERP para colectividades españolas, arquitectura DDD, 6 *Bounded Contexts* con tabla descriptiva.
* **Tech Stack Overview**: Tabla con versiones (NestJS 11, React 19, PostgreSQL 18, Prisma 7, etc.).
* **Project Structure**: Árbol completo de directorios.
* **Architecture Decisions**: Tabla con ADR-001 a ADR-012.
* **Infrastructure Rules**: Reglas sobre Docker, CI/CD y gestión de secretos (con criterios **ALWAYS/NEVER**).
* **Common Commands**: `docker compose`, linting, workspaces, etc.
* Corrección de referencia `ui/AGENTS.md` → `web/AGENTS.md`.
* Secciones de **Skills** y **Auto-invoke** intactas.

---

### 2. `api/AGENTS.md` (171 líneas)

Incluye:

* **Critical Rules**: DDD, CQRS, multi-tenant.
* **Tech Stack**.
* Estructura por *Bounded Context* con tabla de *Aggregates*.
* **Decision Trees**:

  * Creación de endpoint.
  * Emisión de *Domain Event*.
  * Consideraciones multi-tenant.
* **Naming Conventions**.
* **Testing Guidelines**.
* **Commands**.
* **QA Checklist**.
* Tablas de *skills* vacías.

---

### 3. `web/AGENTS.md` (151 líneas)

Incluye:

* **Critical Rules**: React, Mantine, accesibilidad (a11y).
* **Tech Stack**.
* Estructura `features/`.
* **Decision Trees**:

  * Creación de formulario.
  * *Data fetching*.
  * Nuevo *feature*.
* **Naming Conventions**.
* **Testing Guidelines**.
* **Commands**.
* **QA Checklist**.
* Tablas de *skills* vacías.

---

### 4. `e2e/AGENTS.md` (118 líneas)

Incluye:

* **Critical Rules**: Playwright, POM, multi-tenant.
* **Tech Stack**.
* Estructura `tests/fixtures/page-objects`.
* **Naming Conventions**.
* **Testing Patterns**.
* **Commands**.
* **QA Checklist**.
* Tablas de *skills* vacías.
