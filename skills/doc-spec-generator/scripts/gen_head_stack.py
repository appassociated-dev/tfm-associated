#!/usr/bin/env python3
"""
Genera head-stack.md a partir de 007_stack.md.

Contenido: metadatos + índice + sección 1 (Resumen Ejecutivo) +
sección 10 (Matriz de Decisiones) + Trazabilidad.
"""

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_parser import (
    read_spec_file, extract_header_block, extract_index_section,
    extract_trailing_sections, split_h2_sections, write_fragment,
    join_head_parts,
)

SPEC_FILE = '007_stack.md'
OUTPUT_FILE = 'head-stack.md'

# secciones transversales que van al head (no a fragmentos individuales)
HEAD_SECTION_NUMBERS = {1, 10}

TRAILING_MARKERS = [
    r'^## Trazabilidad',
]


def generate(spec_dir: Path, output_dir: Path) -> str:
    text = read_spec_file(spec_dir / SPEC_FILE)

    header = extract_header_block(text)
    index = extract_index_section(text)

    def head_filter(line):
        m = re.match(r'## (\d+)\.\s*(.+)', line)
        if m and int(m.group(1)) in HEAD_SECTION_NUMBERS:
            return f'section-{m.group(1)}', m.group(2).strip()
        return None

    head_sections = split_h2_sections(text, section_filter=head_filter)
    trailing = extract_trailing_sections(text, TRAILING_MARKERS)

    parts = [header]
    if index:
        parts.append(index)

    for section in head_sections:
        parts.append(section.content)

    for section_text in trailing.values():
        parts.append(section_text)

    parts.append(
        '## Navegación\n\n'
        'Cada sección del stack se encuentra en `stack/{seccion}.md`.\n'
        'Secciones: backend, frontend, base-de-datos, infraestructura, '
        'testing, devops-ci-cd, herramientas, servicios.'
    )

    write_fragment(output_dir / OUTPUT_FILE, join_head_parts(parts))
    return OUTPUT_FILE


if __name__ == '__main__':
    spec_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / 'spec'
    output_dir = Path(__file__).resolve().parent.parent.parent / 'doc-spec-manager' / 'references'
    f = generate(spec_dir, output_dir)
    print(f"Generado: {f}")
