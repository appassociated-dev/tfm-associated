Tengo la lista completa. Cruzo la información con el *scope* root del reporte y reviso los `SKILL.md` de los skills instalados para extraer sus descripciones.

## Skills del scope root según el reporte (verificados contra `.agents/skills/`)

| Skill del reporte               | Instalado                     |
| ------------------------------- | ----------------------------- |
| doc-spec-manager                | ✓ `skills/` (ya en AGENTS.md) |
| doc-spec-generator              | ✓ `skills/` (ya en AGENTS.md) |
| skill-creator                   | ✓ `.agents/skills/`           |
| architecture-patterns           | ✓ `.agents/skills/`           |
| architecture-decision-records   | ✗                             |
| gdpr-data-handling              | ✓ `.agents/skills/`           |
| security-requirement-extraction | ✓ `.agents/skills/`           |
| typescript-advanced-types       | ✓ `.agents/skills/`           |
| error-handling-patterns         | ✓ `.agents/skills/`           |
| code-review-excellence          | ✗                             |
| git-advanced-workflows          | ✗                             |
| eslint-prettier-config          | ✓ `.agents/skills/`           |
| husky-test-coverage             | ✗                             |
| eslint-rules                    | ✗                             |
| test-driven-development         | ✓ `.agents/skills/`           |
| systematic-debugging            | ✗                             |
| verification-before-completion  | ✓ `.agents/skills/`           |
| using-git-worktrees             | ✗                             |
| docker-expert                   | ✗                             |
| github-actions-templates        | ✗                             |
| logging-best-practices          | ✗                             |
| database-schema-designer        | ✗                             |
| dependency-updater              | ✗                             |

---

## Resultado: `AGENTS.md` (root) completado

### Nuevos skills añadidos a `### Generic Skills (Any Project)`

Se han incorporado **9 skills nuevos** (además de los dos transversales ya existentes):

| Skill                           | Instalado en                                      |
| ------------------------------- | ------------------------------------------------- |
| skill-creator                   | `.agents/skills/skill-creator/`                   |
| architecture-patterns           | `.agents/skills/architecture-patterns/`           |
| gdpr-data-handling              | `.agents/skills/gdpr-data-handling/`              |
| security-requirement-extraction | `.agents/skills/security-requirement-extraction/` |
| typescript-advanced-types       | `.agents/skills/typescript-advanced-types/`       |
| error-handling-patterns         | `.agents/skills/error-handling-patterns/`         |
| eslint-prettier-config          | `.agents/skills/eslint-prettier-config/`          |
| test-driven-development         | `.agents/skills/test-driven-development/`         |
| verification-before-completion  | `.agents/skills/verification-before-completion/`  |

---

### Skills omitidos (no instalados)

Se han omitido **13 skills** del reporte al no encontrarse instalados:

* architecture-decision-records
* code-review-excellence
* git-advanced-workflows
* husky-test-coverage
* eslint-rules
* systematic-debugging
* using-git-worktrees
* docker-expert
* github-actions-templates
* logging-best-practices
* database-schema-designer
* dependency-updater
* associated-sentry (pendiente futuro)

---

### Auto-invoke Skills añadidos

Se han añadido **13 entradas de Auto-invoke**:

* 2 por skill en la mayoría de los casos.
* 1 para `security-requirement-extraction`.
* 2 para `architecture-patterns`.

Cubren los siguientes escenarios:

* TDD antes de implementar.
* Verificación obligatoria antes de *commit*.
* Revisión de arquitectura y ADRs.
* Cumplimiento RGPD.
* Extracción y validación de requisitos de seguridad.
* Uso avanzado de tipos en TypeScript.
* Patrones de gestión de errores.
* Configuración y verificación de linting.
* Creación y mantenimiento de nuevos skills.
