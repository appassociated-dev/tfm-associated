Te comento:

* **Cuestión 1**: Aclarada.
* **Cuestión 2**: Aclarada.
* **Cuestión 3**:

Estamos de acuerdo en que, independientemente de que en mis instrucciones indique `skills/skill-name`, el *deploy script* sigue siendo necesario. También tengo claro que el agente descubre los *skills* en sus directorios propios y que las secciones **Available Skills** y **Auto-invoke Skills** son documentación, aunque considero que ayudan al agente.

Mi duda principal radica en definir exactamente qué debe hacer mi script de *setup*.

## Modelo propuesto (fuente de verdad)

Quiero que la fuente de verdad versionada en mi repositorio sea:

```
my-repo/
  ├── [scope-1]
  │      └── AGENTS.md
  ├── [scope-2]
  │      └── AGENTS.md
  ├── skills/
  │     ├── my-skill/
  │     │     └── SKILL.md
  │     └── other-skill/
  │           └── SKILL.md
  └── AGENTS.md
```

Entiendo que, si deseo soportar el estándar, Claude y Gemini, mi script de *setup* deberá:

* `skills/` ──► `.agents/skills/`
* `skills/` ──► `.claude/skills/`
* `skills/` ──► `.gemini/skills/`
* `AGENTS.md` ──► `CLAUDE.md` (en todos los *scopes*)
* `AGENTS.md` ──► `GEMINI.md` (en todos los *scopes*)

Quedando finalmente una estructura como:

```
my-repo/
  ├── [scope-1]
  │      ├── CLAUDE.md
  │      ├── GEMINI.md
  │      └── AGENTS.md
  ├── [scope-2]
  │      ├── CLAUDE.md
  │      ├── GEMINI.md
  │      └── AGENTS.md
  ├── .agents/
  │     └── skills/
  │           ├── my-skill/
  │           │     └── SKILL.md
  │           └── other-skill/
  │                 └── SKILL.md
  ├── .claude/
  │     └── skills/
  │           ├── my-skill/
  │           │     └── SKILL.md
  │           └── other-skill/
  │                 └── SKILL.md
  ├── .gemini/
  │     └── skills/
  │           ├── my-skill/
  │           │     └── SKILL.md
  │           └── other-skill/
  │                 └── SKILL.md
  ├── skills/
  │     ├── my-skill/
  │     │     └── SKILL.md
  │     └── other-skill/
  │           └── SKILL.md
  └── AGENTS.md
```

## Duda sobre las rutas en `AGENTS.md`

Si mi `AGENTS.md` contiene:

```markdown
## Available Skills

Use these skills for detailed patterns on-demand:

### Generic Skills (Any Project)
| Skill | Description | URL |
|-------|-------------|-----|
| `doc-spec-generator` | Create, update, and guided-author specification documents in spec/, and generate/update the fragmented files for doc-spec-manager from the source documents in spec/. | [SKILL.md](skills/doc-spec-generator/SKILL.md) |
| `doc-spec-manager` | Navigation, consultation, and alignment verification with the associated project specification. | [SKILL.md](skills/doc-spec-manager/SKILL.md) |
```

¿Es recomendable que, cuando el script genere `CLAUDE.md`, sustituya las rutas por:

```markdown
## Available Skills

Use these skills for detailed patterns on-demand:

### Generic Skills (Any Project)
| Skill | Description | URL |
|-------|-------------|-----|
| `doc-spec-generator` | Create, update, and guided-author specification documents in spec/, and generate/update the fragmented files for doc-spec-manager from the source documents in spec/. | [SKILL.md](.claude/skills/doc-spec-generator/SKILL.md) |
| `doc-spec-manager` | Navigation, consultation, and alignment verification with the associated project specification. | [SKILL.md](.claude/skills/doc-spec-manager/SKILL.md) |
```

¿O, aunque mantenga en la documentación la ruta `skills/doc-spec-generator/SKILL.md`, el agente no se verá afectado porque ya sabe que debe descubrir los *skills* en su directorio propio?

## Duda adicional: copia vs. *symbolic link*

También me surge una duda relacionada con los agentes y el uso de *symbolic links*.

¿Es más recomendable realizar una copia completa de las instrucciones y los *skills* o utilizar *symbolic links* desde `AGENTS.md` hacia `CLAUDE.md`, `GEMINI.md` y `skills/` hacia `.agents/skills/`, `.claude/skills/`, `.gemini/skills/`?
