#!/usr/bin/env python3
"""
Genera head-use-cases.md a partir de 010_casos-uso.md.

Contenido: metadatos + índice + Leyenda + Resumen Ejecutivo +
Notación y Convenciones + Resumen Final + Notas de Trazabilidad.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_parser import (
    read_spec_file, extract_header_block, extract_index_section,
    extract_trailing_sections, write_fragment, join_head_parts,
)

SPEC_FILE = '010_casos-uso.md'
OUTPUT_FILE = 'head-use-cases.md'

# secciones especiales (antes y después de los UCs individuales)
SPECIAL_MARKERS = [
    r'^## Leyenda',
    r'^## Resumen Ejecutivo',
    r'^## Notación y Convenciones',
    r'^## Resumen Final',
    r'^## Notas de Trazabilidad',
]


def generate(spec_dir: Path, output_dir: Path) -> str:
    text = read_spec_file(spec_dir / SPEC_FILE)

    header = extract_header_block(text)
    index = extract_index_section(text)
    special = extract_trailing_sections(text, SPECIAL_MARKERS)

    parts = [header]
    if index:
        parts.append(index)

    for section_text in special.values():
        parts.append(section_text)

    parts.append(
        '## Navegación\n\n'
        'Cada UC se encuentra en `uc/uc-{xxx}.md`.\n'
        'Ejemplo: `references/uc/uc-001.md` para UC-001.'
    )

    write_fragment(output_dir / OUTPUT_FILE, join_head_parts(parts))
    return OUTPUT_FILE


if __name__ == '__main__':
    spec_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / 'spec'
    output_dir = Path(__file__).resolve().parent.parent.parent / 'doc-spec-manager' / 'references'
    f = generate(spec_dir, output_dir)
    print(f"Generado: {f}")
