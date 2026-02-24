Sí, soy consciente de este matiz y tengo en cuenta que es algo que debo modificar en mi repositorio. Es una tarea que puedo realizar yo mismo; no es necesario planificar una migración.

Tengo algunas cuestiones adicionales que debo resolver:

1. **Skill `doc-spec-generator`**

   La primera está relacionada con el skill `doc-spec-generator` que he desarrollado. Entre sus funcionalidades se encuentra la ejecución del proceso de fragmentación de la documentación de especificaciones ubicada en `spec/`. Cuando esta cambia, se generan todos los archivos atómicos resultantes en el directorio `doc-spec-manager/references/*`.

   Si, por ejemplo, el agente que ejecuta este proceso de fragmentación es Gemini CLI, en realidad está ejecutando el skill ubicado en `.gemini/skills/doc-spec-generator`. Sin embargo, no quiero que la fragmentación de los archivos se genere en `.gemini/skills/doc-spec-manager/references`, sino en `skills/doc-spec-manager/references`.

   Posteriormente, ya ejecutaré el proceso de *setup* local para trasladar esta nueva fragmentación a todos los directorios de los agentes que soporte.

2. **Reinstalación de un skill existente**

   Si ejecuto `npx skillsadd owner/repo` sobre un skill que ya tengo instalado, necesito saber si ocurre algún tipo de conflicto o comportamiento inesperado.

3. **Referencia de skills en `AGENTS.md`**

   En mis instrucciones (`AGENTS.md`), quiero saber si puedo referenciar, dentro de la sección *Available Skills*, la ruta de mis skills como `skills/skill-name` y que el agente sepa automáticamente dónde debe buscarlos.
