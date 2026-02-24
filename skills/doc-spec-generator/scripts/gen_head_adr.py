#!/usr/bin/env python3
"""
Genera head-adrs.md a partir de 006_adrs.md.

Contenido: metadatos + índice.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_parser import (
    read_spec_file, extract_header_block, extract_index_section,
    write_fragment, join_head_parts,
)

SPEC_FILE = '006_adrs.md'
OUTPUT_FILE = 'head-adrs.md'


def generate(spec_dir: Path, output_dir: Path) -> str:
    text = read_spec_file(spec_dir / SPEC_FILE)

    header = extract_header_block(text)
    index = extract_index_section(text)

    parts = [header]
    if index:
        parts.append(index)

    parts.append(
        '## Navegación\n\n'
        'Cada ADR se encuentra en `adr/adr-{xxx}.md`.\n'
        'Ejemplo: `references/adr/adr-001.md` para ADR-001.'
    )

    write_fragment(output_dir / OUTPUT_FILE, join_head_parts(parts))
    return OUTPUT_FILE


if __name__ == '__main__':
    spec_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / 'spec'
    output_dir = Path(__file__).resolve().parent.parent.parent / 'doc-spec-manager' / 'references'
    f = generate(spec_dir, output_dir)
    print(f"Generado: {f}")
