#!/usr/bin/env python3
"""
Mueve los bloques de sesión de [Unreleased] en CHANGELOG.md a changelog-sessions.md
y limpia la sección [Unreleased].

Uso:
    python scripts/move_unreleased.py <version>

Ejemplo:
    python scripts/move_unreleased.py 1.2.0
"""

import sys
import re
from pathlib import Path
from datetime import date

SESSIONS_HEADER = """# Changelog de Sesiones

Histórico detallado de sesiones de trabajo trasladado desde [Unreleased] al cerrar cada versión.

---"""

EMPTY_UNRELEASED = "[Vacío pendiente de iniciar nuevas sesiones]"


def main():
    if len(sys.argv) != 2:
        print("Uso: python scripts/move_unreleased.py <version>")
        print("Ejemplo: python scripts/move_unreleased.py 1.2.0")
        sys.exit(1)

    version = sys.argv[1]
    changelog_path = Path("CHANGELOG.md")
    sessions_path = Path("doc/agents-sessions/changelog-sessions.md")

    if not changelog_path.exists():
        print(f"❌ No se encontró {changelog_path}")
        sys.exit(1)

    content = changelog_path.read_text(encoding="utf-8")

    # Extraer el contenido de [Unreleased] (entre ## [Unreleased] y el siguiente ## [)
    match = re.search(
        r"## \[Unreleased\]\n\n(.*?)(?=\n## \[)",
        content,
        re.DOTALL,
    )

    if not match:
        print("❌ No se encontró la sección [Unreleased] en CHANGELOG.md")
        sys.exit(1)

    # Eliminar el --- final del contenido (se añade uno solo al cerrar el bloque)
    unreleased_content = re.sub(r'\n---\s*$', '', match.group(1)).rstrip()

    # Verificar si ya está vacía
    if EMPTY_UNRELEASED in unreleased_content or not unreleased_content.strip():
        print("⚠️  La sección [Unreleased] ya está vacía. Nada que mover.")
        sys.exit(0)

    # Construir el bloque para changelog-sessions.md
    today = date.today().strftime("%Y-%m-%d")
    block = f"\n## Sesiones del release [{version}] - {today}\n\n{unreleased_content}\n\n---\n"

    # Actualizar changelog-sessions.md
    if sessions_path.exists():
        sessions_content = sessions_path.read_text(encoding="utf-8")
        sep_pos = sessions_content.find("\n---\n")
        if sep_pos != -1:
            new_sessions = sessions_content[: sep_pos + 5] + block + sessions_content[sep_pos + 5 :]
        else:
            new_sessions = sessions_content.rstrip() + "\n" + block
    else:
        sessions_path.parent.mkdir(parents=True, exist_ok=True)
        new_sessions = SESSIONS_HEADER + block

    sessions_path.write_text(new_sessions, encoding="utf-8")
    print(f"✅ Bloques de sesión movidos a {sessions_path}")

    # Limpiar [Unreleased] en CHANGELOG.md
    new_content = re.sub(
        r"(## \[Unreleased\]\n\n).*?(\n## \[)",
        rf"\g<1>{EMPTY_UNRELEASED}\n\n---\n\g<2>",
        content,
        flags=re.DOTALL,
    )

    changelog_path.write_text(new_content, encoding="utf-8")
    print(f"✅ Sección [Unreleased] limpiada en {changelog_path}")
    print(f"\n✅ Proceso completado para release [{version}]")


if __name__ == "__main__":
    main()
