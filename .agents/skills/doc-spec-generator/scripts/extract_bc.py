#!/usr/bin/env python3
"""
Extrae los Bounded Contexts de 005_modelo-dominio.md
en archivos individuales: references/bc/bc-{name}.md
"""

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_parser import read_spec_file, split_h2_sections, sanitize_filename, write_fragment

SPEC_FILE = '005_modelo-dominio.md'
OUTPUT_SUBDIR = 'bc'


def bc_filter(line: str):
    """Filtra secciones BC-* y 7 bis (transversal)."""
    m = re.match(r'## \d+\.\s*(BC-\w+):\s*(.+)', line)
    if m:
        return m.group(1), m.group(2).strip()
    m = re.match(r'## \d+ bis\.\s*(.+)', line)
    if m:
        return 'BC-Transversal', m.group(1).strip()
    return None


def extract(spec_dir: Path, output_dir: Path) -> list[str]:
    text = read_spec_file(spec_dir / SPEC_FILE)
    sections = split_h2_sections(text, section_filter=bc_filter)

    out = output_dir / OUTPUT_SUBDIR
    generated = []

    for section in sections:
        filename = sanitize_filename(section.code) + '.md'
        write_fragment(out / filename, section.content)
        generated.append(filename)

    return generated


if __name__ == '__main__':
    spec_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / 'spec'
    output_dir = Path(__file__).resolve().parent.parent.parent / 'doc-spec-manager' / 'references'
    files = extract(spec_dir, output_dir)
    print(f"BC: {len(files)} archivos generados en {OUTPUT_SUBDIR}/")
