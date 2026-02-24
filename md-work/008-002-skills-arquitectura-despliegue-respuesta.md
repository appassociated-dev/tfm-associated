Correcto, es una separación entre **fuente de distribución** y **destino de instalación**.

## Cómo funciona el flujo

```
GitHub (skills repo)              Tu proyecto
─────────────────────             ──────────────────────────
owner/repo/
  └── skills/                ──► .claude/skills/
        ├── my-skill/            ├── my-skill/
        │     └── SKILL.md       │     └── SKILL.md
        └── other-skill/         └── other-skill/
              └── SKILL.md             └── SKILL.md
```

El comando `npx skillsadd owner/repo` actúa como **instalador**:
lee las *skills* desde `skills/` en el repositorio fuente y coloca los archivos en el directorio correspondiente a cada agente dentro del proyecto.

## Por qué el repositorio fuente usa `skills/` en la raíz

* **Agnóstico de agente**: el mismo repositorio sirve para Claude (`.claude/skills/`), Gemini (`.gemini/skills/`), Cursor, etc. El repositorio no depende de quién lo consuma.
* **Convención de `skills.sh`**: el instalador espera encontrar las *skills* en `skills/` para poder indexarlas y distribuirlas correctamente.
* **Separación de responsabilidades**: el repositorio puede incluir otros elementos (README, scripts, configuración, etc.) sin mezclarlos con las *skills*.

## Por qué el proyecto usa `.agents/skills/`

Se trata de una convención propia del proyecto (definida en `CLAUDE.md`). El instalador admite varios destinos; en este caso se eligió `.agents/skills/` como directorio base para centralizar los recursos de agentes bajo un único prefijo.

En proyectos que utilizan únicamente Claude Code, las *skills* se instalarían directamente en `.claude/skills/`. Aquí, al tratarse de una convención **multi-agente**, se utiliza `.agents/skills/` como directorio neutro.
