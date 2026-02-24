En macOS y Linux, los *symlinks* son ciudadanos de primera clase del filesystem, por lo que no existe un problema de soporte.

Además, Git los gestiona de forma nativa: al hacer `git add` de un *symlink*, Git almacena la ruta de destino como contenido del *blob*. Al clonar el repositorio en otra máquina macOS/Linux, Git recrea automáticamente el *symlink*.

## Implicaciones para el *setup script*

### Lo que puede commitearse directamente (sin script)

En la raíz y en cada *scope*:

```bash
ln -s AGENTS.md CLAUDE.md
ln -s AGENTS.md GEMINI.md
git add CLAUDE.md GEMINI.md
```

Git los versiona como *symlinks*, por lo que cualquier desarrollador que clone el repositorio en macOS/Linux tendrá `CLAUDE.md` y `GEMINI.md` funcionando sin necesidad de ejecutar ningún script adicional.

---

### Lo que sigue requiriendo script (o exclusión en `.gitignore`)

Las carpetas de agentes (`.agents/skills/`, `.claude/skills/`, `.gemini/skills/`) son un caso distinto. Actúan como directorios de dependencias instaladas (propias + comunidad), análogas a `node_modules/`, por lo que no deberían versionarse.

El *setup script* podría crear los *symlinks* correspondientes:

```bash
ln -s ../../skills .agents/skills
ln -s ../../skills .claude/skills
ln -s ../../skills .gemini/skills

npx skillsadd wshobson/agents
npx skillsadd ...
```

---

## Resumen

| Artefacto                           | macOS/Linux sin personalización por agente | Con Windows en el equipo |
| ----------------------------------- | ------------------------------------------ | ------------------------ |
| `AGENTS.md → CLAUDE.md / GEMINI.md` | Symlink versionado en Git ✅                | Copia vía script         |
| `skills/ → .claude/skills/`, etc.   | Symlink vía *setup script* ✅               | Copia vía script         |
| Skills de comunidad                 | `npx skillsadd` siempre                    | `npx skillsadd` siempre  |
