#!/usr/bin/env python3
"""
Genera head-inventario-de-endpoints.md a partir de 013_inventario-de-endpoints.md.

Contenido: metadatos + índice + sección de Trazabilidad.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_parser import (
    read_spec_file, extract_header_block, extract_index_section,
    extract_trailing_sections, write_fragment, join_head_parts,
)

SPEC_FILE = '013_inventario-de-endpoints.md'
OUTPUT_FILE = 'head-inventario-de-endpoints.md'

# secciones finales a incluir en el head
TRAILING_MARKERS = [
    r'^## 9\. Trazabilidad',
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

    # guía de navegación hacia los fragmentos EP
    parts.append(
        '## Navegación\n\n'
        'Cada endpoint se encuentra en `ep/ep-{nnn}.md`.\n'
        'Ejemplo: `references/ep/ep-001.md` para EP-001.'
    )

    write_fragment(output_dir / OUTPUT_FILE, join_head_parts(parts))
    return OUTPUT_FILE


if __name__ == '__main__':
    spec_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / 'spec'
    output_dir = Path(__file__).resolve().parent.parent.parent / 'doc-spec-manager' / 'references'
    f = generate(spec_dir, output_dir)
    print(f"Generado: {f}")
