#!/usr/bin/env python3
"""
Genera head-user-stories.md a partir de 009_user-stories.md.

Contenido: metadatos + índice + Leyenda + Resumen General.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_parser import (
    read_spec_file, extract_header_block, extract_index_section,
    extract_trailing_sections, write_fragment, join_head_parts,
)

SPEC_FILE = '009_user-stories.md'
OUTPUT_FILE = 'head-user-stories.md'

# secciones previas a los items (Leyenda y Resumen General son H2 antes de los BCs)
TRAILING_MARKERS = [
    r'^## Leyenda',
    r'^## Resumen General',
]


def generate(spec_dir: Path, output_dir: Path) -> str:
    text = read_spec_file(spec_dir / SPEC_FILE)

    header = extract_header_block(text)
    index = extract_index_section(text)
    # "trailing" son en realidad secciones previas, pero misma mecánica de extracción
    special = extract_trailing_sections(text, TRAILING_MARKERS)

    parts = [header]
    if index:
        parts.append(index)

    for section_text in special.values():
        parts.append(section_text)

    parts.append(
        '## Navegación\n\n'
        'Cada US se encuentra en `us/us-{xxx}.md`.\n'
        'Ejemplo: `references/us/us-001.md` para US-001.'
    )

    write_fragment(output_dir / OUTPUT_FILE, join_head_parts(parts))
    return OUTPUT_FILE


if __name__ == '__main__':
    spec_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / 'spec'
    output_dir = Path(__file__).resolve().parent.parent.parent / 'doc-spec-manager' / 'references'
    f = generate(spec_dir, output_dir)
    print(f"Generado: {f}")
