#!/usr/bin/env python3
"""
Extrae los Casos de Uso de 010_casos-uso.md
en archivos individuales: references/uc/uc-{xxx}.md
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_parser import read_spec_file, split_by_heading, sanitize_filename, write_fragment

SPEC_FILE = '010_casos-uso.md'
HEADING_PATTERN = r'### (?P<code>UC-\d+):\s*(?P<title>.+)'
HEADING_LEVEL = 3
OUTPUT_SUBDIR = 'uc'


def extract(spec_dir: Path, output_dir: Path) -> list[str]:
    text = read_spec_file(spec_dir / SPEC_FILE)
    sections = split_by_heading(text, HEADING_PATTERN, HEADING_LEVEL)

    out = output_dir / OUTPUT_SUBDIR
    generated = []

    for section in sections:
        parent = section.context.get(2, '')
        header = f'> **Bounded Context:** {parent}\n\n' if parent else ''

        filename = sanitize_filename(section.code) + '.md'
        write_fragment(out / filename, header + section.content)
        generated.append(filename)

    return generated


if __name__ == '__main__':
    spec_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / 'spec'
    output_dir = Path(__file__).resolve().parent.parent.parent / 'doc-spec-manager' / 'references'
    files = extract(spec_dir, output_dir)
    print(f"UC: {len(files)} archivos generados en {OUTPUT_SUBDIR}/")
