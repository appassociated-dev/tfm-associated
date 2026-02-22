Perfecto.

Ahora vamos a preparar los documentos de planificación y diseño de implementación para cada una de las tareas.

Quiero que, siguiendo el análisis del plan MVP (`analisis_plan_mvp.md`), generes un documento de diseño y planificación de implementación por cada tarea, con la siguiente estructura:

raiz-repositorio
  └── design
       └── doc  
            ├── fase-0-scaffold.md  
            ├── fase-1
            │    ├── back
            │    │    ├── task-1-UC-001.md
            │    │    ├── task-2-UC-002.md
            │    │    ├── task-3-UC-008.md
            │    │    └── ...
            │    └── front
            │         ├── task-1-UC-002.md
            │         ├── task-2-UC-017.md
            │         ├── task-2-UC-018.md
            │         └── ...
            ├── fase-2
            │    ├── back
            │    │    ├── task-1-UC-004.md
            │    │    ├── task-2-UC-020.md
            │    │    ├── task-3-UC-056.md
            │    │    └── ...
            │    └── front
            │         ├── task-1-UC-006.md
            │         ├── task-2-UC-008.md
            │         ├── task-2-UC-019.md
            │         └── ...
            └── fase-3
                 ├── back
                 │    ├── task-1-UC-064.md
                 │    ├── task-2-UC-065.md
                 └── front
                      ├── task-1-UC-001.md
                      ├── task-2-UC-010.md
                      ├── task-2-UC-064.md
                      └── task-2-UC-065.md

Estos documentos deben definir claramente:

* El **alcance de la tarea**.
* Los **puntos críticos** que deben tenerse en cuenta.
* Los **riesgos** que pueden surgir.
* Las **dependencias** con otras tareas.
* Un **plan de implementación detallado**, con los pasos a seguir para completar la tarea.

Todo ello debe estar perfectamente alineado con las especificaciones documentadas.

Para ello, tienes disponible el *skill* `doc-spec-manager`, que te ayudará a navegar de forma eficiente por las especificaciones y extraer toda la información relevante para cada tarea.

Es importante que cada documento incluya de forma explícita las **tareas previas que deben estar completamente implementadas**, con el objetivo de evitar refactorizaciones posteriores.

Para ello, incorporaré mecanismos que permitan verificar que las dependencias están completamente finalizadas antes de iniciar la implementación.

Empieza generando los siguientes documentos:

* `doc/design/mvp/fase-0-scaffold.md`
* `doc/design/mvp/fase-1/back/task-1-UC-001.md`
* `doc/design/mvp/fase-1/back/task-2-UC-002.md`
* `doc/design/mvp/fase-1/front/task-1-UC-002.md`

Una vez los hayas elaborado, los revisaré. Iteraremos sobre ellos hasta que queden definidos exactamente en el formato y nivel de detalle que necesito.

Cuando estos documentos estén cerrados y validados como referencia, generas el resto siguiendo el mismo patrón y nivel de calidad.
