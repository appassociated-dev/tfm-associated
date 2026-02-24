Ahora vamos a completar las tablas de **Available Skills** y **Auto-invoke Skills** del scope api.

**RECUERDA**

Dado que los skills `doc-spec-generator` y `doc-spec-manager` son transversales, ya los he completado en todos los archivos `AGENTS.md`.

He realizado una primera fase de instalación de los skills propuestos en `md-work/003-002-reporte-skills-recomendados.md`.
**Importante:** no están todos instalados; ese documento debe utilizarse únicamente si necesitas entender la justificación de porqué se selecciono ese skill.

La **fuente de verdad** para esta tarea es exclusivamente el contenido del directorio:

```
.agents/skills/
```

En el archivo `md-work/004-002-reporte-scopes-instrucciones-skills.md` se encuentra la asignación de skills a los distintos *scopes*.

---

## Scope: api

Se debe iterar uno a uno los skills asignados al *scope* api y, para cada uno:

1. Verificar si está instalado en `.agents/skills/`.
2. Si **no está instalado** → pasar al siguiente skill.
3. Si **sí está instalado**:

   1. Crear una fila en la tabla **Available Skills**.
      La ruta debe ser:

      ```
      [SKILL.md](skills/{skill-procesado}/SKILL.md)
      ```
   2. Analizar si corresponde definir entradas en **Auto-invoke Skills**:

      * Generar **2 o 3 entradas** por skill.
      * Si fueran necesarias más de 3, justificar previamente el motivo.
   3. Continuar con el siguiente skill.
