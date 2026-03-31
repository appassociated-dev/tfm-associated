#!/usr/bin/env python3
"""
Genera un borrador de sección versionada en CHANGELOG.md extrayendo
las entradas en bruto de los bloques de sesión de [Unreleased].

El agente debe revisar y refinar el borrador generado (deduplicar entradas,
mejorar redacción y completar los campos marcados con [COMPLETAR]) antes
de ejecutar move_unreleased.py.

Uso:
    python scripts/create_release_draft.py <version> [--type TIPO]

Ejemplos:
    python scripts/create_release_draft.py 1.2.0
    python scripts/create_release_draft.py 1.2.0 --type Minor
"""

import sys
import re
import subprocess
from pathlib import Path
from datetime import date


def get_git_info():
    """Obtener número de commits, hash inicial y hash final del periodo."""
    try:
        last_tag = subprocess.run(
            ['git', 'describe', '--tags', '--abbrev=0'],
            capture_output=True, text=True
        ).stdout.strip()

        commit_range = f"{last_tag}..HEAD" if last_tag else "HEAD"
        log = subprocess.run(
            ['git', 'log', '--oneline', commit_range],
            capture_output=True, text=True
        ).stdout.strip().split('\n')
        log = [c for c in log if c]

        if not log:
            return '?', '?', '?'

        return len(log), log[-1].split()[0], log[0].split()[0]
    except Exception:
        return '?', '?', '?'


def parse_session_blocks(unreleased_content):
    """Extraer bloques de sesión del contenido de [Unreleased]."""
    blocks = re.split(r'\n(?=### \d{8}-)', '\n' + unreleased_content)
    sessions = []

    for block in blocks:
        if not block.strip():
            continue

        name_match = re.match(r'\n?### (\S+)', block)
        if not name_match:
            continue
        session_name = name_match.group(1)

        # Enlace al archivo de sesión
        link_match = re.search(r'\*\*Documento de sesión:\*\* \[.*?\]\((.*?)\)', block)
        session_file = link_match.group(1) if link_match else f"doc/agents-sessions/{session_name}.md"

        # Entradas por categoría
        categories = {}
        for cat in ['Added', 'Changed', 'Fixed', 'Removed']:
            cat_match = re.search(
                rf'#### {cat}\n\n(.*?)(?=\n#### |\n---|\Z)',
                block, re.DOTALL
            )
            if cat_match:
                raw = cat_match.group(1).strip()
                if raw and raw != '[Sin cambios]':
                    entries = [l for l in raw.split('\n') if l.startswith('- ')]
                    if entries:
                        categories[cat] = entries

        sessions.append({
            'name': session_name,
            'file': session_file,
            'categories': categories,
        })

    return sessions


def format_date_long(d):
    months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
              'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    return f"{d.day} de {months[d.month - 1]} de {d.year}"


def main():
    if len(sys.argv) < 2:
        print("Uso: python scripts/create_release_draft.py <version> [--type TIPO]")
        print("Ejemplo: python scripts/create_release_draft.py 1.2.0 --type Minor")
        sys.exit(1)

    version = sys.argv[1]
    release_type = "Patch"
    if '--type' in sys.argv:
        idx = sys.argv.index('--type')
        if idx + 1 < len(sys.argv):
            release_type = sys.argv[idx + 1]

    changelog_path = Path("CHANGELOG.md")
    if not changelog_path.exists():
        print(f"❌ No se encontró {changelog_path}")
        sys.exit(1)

    content = changelog_path.read_text(encoding="utf-8")

    # Verificar que no existe ya la sección versionada
    if re.search(rf'## \[{re.escape(version)}\]', content):
        print(f"⚠️  La sección [{version}] ya existe en CHANGELOG.md.")
        sys.exit(0)

    # Extraer [Unreleased]
    match = re.search(r"## \[Unreleased\]\n\n(.*?)(?=\n## \[)", content, re.DOTALL)
    if not match:
        print("❌ No se encontró la sección [Unreleased] en CHANGELOG.md")
        sys.exit(1)

    unreleased_content = match.group(1)
    if '[Vacío pendiente' in unreleased_content or not unreleased_content.strip():
        print("⚠️  La sección [Unreleased] está vacía. Nada que procesar.")
        sys.exit(0)

    # Parsear bloques de sesión
    sessions = parse_session_blocks(unreleased_content)
    if not sessions:
        print("⚠️  No se encontraron bloques de sesión en [Unreleased].")
        sys.exit(0)

    # Fechas
    today = date.today()
    today_short = today.strftime("%Y-%m-%d")
    today_long = format_date_long(today)

    # Periodo de desarrollo: desde la sesión más antigua hasta hoy
    session_dates = []
    for s in sessions:
        dm = re.match(r'(\d{4})(\d{2})(\d{2})', s['name'])
        if dm:
            session_dates.append(f"{dm.group(3)}/{dm.group(2)}/{dm.group(1)}")
    period_start = session_dates[-1] if session_dates else "[COMPLETAR]"
    period_end = today.strftime("%d/%m/%Y")

    # Información de git
    commit_count, first_hash, last_hash = get_git_info()

    # Enlaces a archivos de sesión
    session_links = "\n".join(
        f"    - [{s['file']}]({s['file']})" for s in sessions
    )

    # Agregar entradas en bruto por categoría (todas las sesiones juntas)
    all_entries = {'Added': [], 'Changed': [], 'Fixed': [], 'Removed': []}
    for s in sessions:
        for cat, entries in s['categories'].items():
            all_entries[cat].extend(entries)

    def format_cat(cat):
        entries = all_entries[cat]
        if not entries:
            return f"### {cat}\n\n[Sin cambios]"
        return f"### {cat}\n\n" + "\n".join(entries)

    categories_block = "\n\n".join(format_cat(c) for c in ['Added', 'Changed', 'Fixed', 'Removed'])

    # Construir borrador
    draft = (
        f"## [{version}] - {today_short}\n\n"
        f"* **Fecha de release:** {today_long}\n"
        f"* **Tipo:** {release_type}\n"
        f"* **Periodo de desarrollo:** {period_start} – {period_end}\n"
        f"* **Commits:** {commit_count} commits desde `{first_hash}` hasta `{last_hash}`\n"
        f"* **Cobertura de tests:** [COMPLETAR]\n"
        f"* **Tests:** [COMPLETAR]\n"
        f"* **Sesiones de trabajo:**\n"
        f"{session_links}\n"
        f"\n"
        f"> ⚠️ BORRADOR: Revisar entradas duplicadas, mejorar redacción y reemplazar los [COMPLETAR].\n"
        f"\n"
        f"{categories_block}\n"
        f"\n"
        f"---\n"
    )

    # Insertar el borrador antes de la primera sección versionada
    insert_match = re.search(r'\n(## \[\d)', content)
    if not insert_match:
        print("❌ No se encontró dónde insertar el borrador en CHANGELOG.md.")
        sys.exit(1)

    pos = insert_match.start()
    new_content = content[:pos] + "\n\n" + draft + content[pos:]
    changelog_path.write_text(new_content, encoding="utf-8")

    # Resumen
    print(f"✅ Borrador [{version}] generado en {changelog_path}")
    print(f"\n📋 Sesiones procesadas: {len(sessions)}")
    for s in sessions:
        print(f"   - {s['name']}")
    print(f"\n📋 Entradas extraídas:")
    for cat, entries in all_entries.items():
        if entries:
            print(f"   - {cat}: {len(entries)} entrada(s)")
    print(f"\n⚠️  Pendiente para el agente:")
    print(f"   1. Revisar y deduplicar entradas")
    print(f"   2. Completar los campos [COMPLETAR] (tests, cobertura)")
    print(f"   3. Ejecutar move_unreleased.py {version}")


if __name__ == "__main__":
    main()
