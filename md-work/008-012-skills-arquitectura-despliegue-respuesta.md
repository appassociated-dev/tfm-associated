Exacto. Versionar (*commitear*) los *symlinks* no aporta valor, ya que los archivos destino ya están en Git. El *symlink* únicamente introduce ruido y un posible punto de fallo para usuarios de Windows que clonen el repositorio sin el soporte adecuado.

La solución más limpia es un **script de setup con elección interactiva**:

```bash
#!/usr/bin/env bash

echo "Setup mode:"
echo "  1) Symbolic links (Mac/Linux recomendado)"
echo "  2) Copy (Windows / cualquier entorno)"
read -p "Choose [1/2]: " mode

deploy() {
  src=$1
  dst=$2

  if [ "$mode" = "1" ]; then
    ln -sf "$src" "$dst"
  else
    cp -r "$src" "$dst"
  fi
}

deploy skills/ .agents/skills/
deploy skills/ .claude/skills/
deploy skills/ .gemini/skills/

deploy AGENTS.md CLAUDE.md
deploy AGENTS.md GEMINI.md
# ... scopes

npx skillsadd wshobson/agents
# ...
```

El `.gitignore` debe excluir los destinos generados, independientemente del modo elegido:

```gitignore
.agents/skills/
.claude/skills/
.gemini/skills/
CLAUDE.md
GEMINI.md
[scope-1]/CLAUDE.md
[scope-1]/GEMINI.md
```

La **fuente de verdad** continúa siendo exclusivamente:

* `skills/`
* `AGENTS.md`

El resto se considera **artefacto local generado por el setup**.
