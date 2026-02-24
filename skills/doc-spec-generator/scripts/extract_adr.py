#!/usr/bin/env python3
"""
Extrae los Architectural Decision Records de 006_adrs.md
en archivos individuales: references/adr/adr-{xxx}.md
"""

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_parser import read_spec_file, split_h2_sections, sanitize_filename, write_fragment

SPEC_FILE = '006_adrs.md'
OUTPUT_SUBDIR = 'adr'


def adr_filter(line: str):
    m = re.match(r'## (?P<code>ADR-\d+):\s*(?P<title>.+)', line)
    if m:
        return m.group('code'), m.group('title').strip()
    return None


def extract(spec_dir: Path, output_dir: Path) -> list[str]:
    text = read_spec_file(spec_dir / SPEC_FILE)
    sections = split_h2_sections(text, section_filter=adr_filter)

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
    print(f"ADR: {len(files)} archivos generados en {OUTPUT_SUBDIR}/")
