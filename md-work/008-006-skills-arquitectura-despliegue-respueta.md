Son tres preguntas independientes. Las respondo una a una:

---

## 1. Ruta de salida del `doc-spec-generator`

Se trata de un problema de **configuración interna del skill**, no del agente que lo ejecuta.
Los scripts de fragmentación (`generate_all.py`, etc.) utilizan rutas *hardcodeadas* o relativas a su propia ubicación.

En el nuevo modelo, estos scripts deben generar los artefactos en:

```
skills/doc-spec-manager/references/
```

utilizando una ruta relativa a la **raíz del repositorio**, no a la ubicación física del skill.

La forma más robusta es que el script determine dinámicamente la raíz del repositorio:

```python
import subprocess
import os

REPO_ROOT = subprocess.check_output(
    ["git", "rev-parse", "--show-toplevel"],
    text=True
).strip()

OUTPUT_DIR = os.path.join(
    REPO_ROOT,
    "skills",
    "doc-spec-manager",
    "references"
)
```

De este modo, el script funcionará igual si se ejecuta desde:

* `.agents/skills/doc-spec-generator/`
* `.gemini/skills/doc-spec-generator/`
* o cualquier otro directorio de agente.

---

## 2. Reinstalación con `npx skillsadd`

No existe certeza absoluta sobre el comportamiento exacto.
El patrón habitual en este tipo de herramientas es **sobrescribir sin aviso**, lo cual suele ser deseable cuando se pretende actualizar *skills*.

No obstante, antes de asumir este comportamiento conviene:

* Revisar la documentación oficial de `skills.sh`.
* Probar el comando sobre un *skill* de prueba.
* Verificar que no existan *skills* propios en esas carpetas que puedan sobrescribirse accidentalmente.

---

## 3. Referencia `skills/skill-name` en `AGENTS.md`

No funciona de forma automática.

El agente descubre los *skills* desde sus propios directorios (`.claude/skills/`, `.agents/skills/`, etc.) según su configuración interna. La sección **Available Skills** en `AGENTS.md` es documentación que el agente puede leer, pero no actúa como mecanismo de resolución de rutas.

Si se indica `skills/skill-name` como ruta, el agente podrá leer el archivo únicamente si se le proporciona la ruta explícita en las instrucciones. Sin embargo, el mecanismo de invocación automática (por ejemplo, el *Skill tool* en Claude Code) no lo detectará en esa ubicación.

Por ello, el *deploy script* sigue siendo necesario:

* `skills/` es la **fuente de verdad**.
* El agente necesita encontrar los *skills* en su **directorio específico de instalación**.

En consecuencia, la referencia en `AGENTS.md` debería apuntar a la **ruta instalada**, no a la fuente.
