#!/usr/bin/env python3
"""
Genera head-requisitos-funcionales.md a partir de 003_requisitos-funcionales.md.

Contenido: metadatos + índice de secciones + resumen final.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_parser import (
    read_spec_file, extract_header_block, extract_index_section,
    extract_trailing_sections, write_fragment, join_head_parts,
)

SPEC_FILE = '003_requisitos-funcionales.md'
OUTPUT_FILE = 'head-requisitos-funcionales.md'

# secciones finales a incluir
TRAILING_MARKERS = [
    r'^## Resumen de Requisitos Funcionales',
]


def generate(spec_dir: Path, output_dir: Path) -> str:
    text = read_spec_file(spec_dir / SPEC_FILE)

    header = extract_header_block(text)
    index = extract_index_section(text)
    trailing = extract_trailing_sections(text, TRAILING_MARKERS)

    parts = [header]
    if index:
        parts.append(index)
    for section_text in trailing.values():
        parts.append(section_text)

    # guía de navegación
    parts.append(
        '## Navegación\n\n'
        'Cada RF se encuentra en `rf/n{x}rf{yy}.md`.\n'
        'Ejemplo: `references/rf/n2rf01.md` para N2RF01.'
    )

    write_fragment(output_dir / OUTPUT_FILE, join_head_parts(parts))
    return OUTPUT_FILE


if __name__ == '__main__':
    spec_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / 'spec'
    output_dir = Path(__file__).resolve().parent.parent.parent / 'doc-spec-manager' / 'references'
    f = generate(spec_dir, output_dir)
    print(f"Generado: {f}")
