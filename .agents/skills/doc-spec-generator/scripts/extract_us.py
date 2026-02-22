#!/usr/bin/env python3
"""
Extrae las User Stories de 009_user-stories.md
en archivos individuales: references/us/us-{xxx}.md
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_parser import read_spec_file, split_by_heading, sanitize_filename, write_fragment

SPEC_FILE = '009_user-stories.md'
HEADING_PATTERN = r'#### (?P<code>US-\d+):\s*(?P<title>.+)'
HEADING_LEVEL = 4
OUTPUT_SUBDIR = 'us'


def extract(spec_dir: Path, output_dir: Path) -> list[str]:
    text = read_spec_file(spec_dir / SPEC_FILE)
    sections = split_by_heading(text, HEADING_PATTERN, HEADING_LEVEL)

    out = output_dir / OUTPUT_SUBDIR
    generated = []

    for section in sections:
        # contexto H2 = BC/sección, H3 = subsección
        bc = section.context.get(2, '')
        subsection = section.context.get(3, '')
        ctx_parts = [p for p in [bc, subsection] if p]
        header = f'> **Contexto:** {" → ".join(ctx_parts)}\n\n' if ctx_parts else ''

        filename = sanitize_filename(section.code) + '.md'
        write_fragment(out / filename, header + section.content)
        generated.append(filename)

    return generated


if __name__ == '__main__':
    spec_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / 'spec'
    output_dir = Path(__file__).resolve().parent.parent.parent / 'doc-spec-manager' / 'references'
    files = extract(spec_dir, output_dir)
    print(f"US: {len(files)} archivos generados en {OUTPUT_SUBDIR}/")
