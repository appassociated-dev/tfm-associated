El proyecto se encuentra actualmente en **fase de definición**. No existe ninguna línea de código desarrollada, por lo que los cambios de versión no implican la actualización de código fuente implementado.

Sin embargo, es imprescindible revisar **toda la documentación generada** con versiones desactualizadas del stack. Esto no afecta únicamente a las `spec/`, sino también a:

* `md-work/001-003-analisis_plan_mvp.md`
* `doc/design/mvp/*` (planificación y diseño de todas las tareas de cada fase)

Toda esta planificación debe revisarse para garantizar que no se vea afectada por la actualización de versiones.

Adicionalmente:

* Siguiendo las instrucciones de `md-work/003-001-prompt-skills-recomendados.md`, se generó el análisis de skills recomendados en `md-work/003-002-reporte-skills-recomendados.md`, el cual deberá rehacerse para alinearlo con las nuevas versiones.
* Siguiendo el prompt `md-work/004-001-prompt-scopes.md`, cuyo objetivo era:

  * Proponer los **scopes** del proyecto.
  * Definir qué aspectos deben abordar las **instrucciones** de los distintos scopes.
  * Distribuir los *skills* recomendados dentro de cada uno de los **scopes**.

  Se generó el documento `md-work/004-002-reporte-scopes-instrucciones-skills.md`, que también deberá revisarse para alinearlo con los nuevos *skills* recomendados, en caso de que hayan cambiado.

---

## Trabajo a realizar

### 1. Actualización del stack en `spec/`

* Modificar las versiones del stack en `spec/` conforme a lo definido en `md-work/005-002-reporte-auditoria-versiones-stack.md`.
* Utilizar el *skill* **doc-spec-generator** para actualizar correctamente los documentos en `spec/`.

---

### 2. Revisión y corrección de toda la documentación

Una vez actualizado el stack:

* Revisar toda la documentación del proyecto.
* Identificar cualquier apartado afectado por el cambio de versiones.
* Utilizar el *skill* **doc-spec-manager** para navegar eficientemente por la documentación y localizar los puntos que requieren corrección.
* Aplicar las modificaciones necesarias mediante el *skill* **doc-spec-generator**.

---

### 3. Regeneración de referencias atómicas

* Utilizar **doc-spec-generator** y sus scripts para transformar los documentos de `spec/` en fragmentos atómicos optimizados para agentes dentro de `doc-spec-manager/references/`

---

### 4. Revisión de planificación y diseño del MVP

* Revisar toda la planificación y diseño de tareas en `doc/design/mvp/*`.
* Verificar que no se vean afectados por los cambios de versión.
* En caso necesario, realizar ajustes para mantener la coherencia con el nuevo stack definido.

---

### 5. Revisión de skills y scopes

* Revisar el análisis de skills en `md-work/003-002-reporte-skills-recomendados.md`.
* Revisar el reporte de scopes, instrucciones y skills en `md-work/004-002-reporte-scopes-instrucciones-skills.md`.
* Asegurar que ambos documentos estén alineados con las nuevas versiones del stack.
* Realizar los ajustes necesarios para mantener la coherencia técnica y estratégica.

---

## Entregable requerido

Generar un plan de trabajo detallado en un nuevo archivo:

`md-work/006-002-plan-trabajo-derivado-audit-veriones.md`

El plan debe:

* Incluir pasos específicos y ordenados.
* Definir dependencias entre tareas.
* Identificar puntos críticos y riesgos potenciales.
* Establecer criterios de validación en cada fase.
* Ser claro, estructurado y fácil de seguir.
