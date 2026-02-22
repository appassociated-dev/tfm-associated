#!/usr/bin/env python3
"""
Extrae las secciones temáticas de 007_stack.md
en archivos individuales: references/stack/{seccion}.md

Secciones 2-9 (excluye 1=Resumen Ejecutivo y 10=Matriz de Decisiones,
que van en head-stack.md).
"""

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_parser import read_spec_file, split_h2_sections, write_fragment

SPEC_FILE = '007_stack.md'
OUTPUT_SUBDIR = 'stack'

# Mapeo de número de sección → nombre de archivo
SECTION_FILENAMES = {
    2: 'backend',
    3: 'frontend',
    4: 'base-de-datos',
    5: 'infraestructura',
    6: 'testing',
    7: 'devops-ci-cd',
    8: 'herramientas',
    9: 'servicios',
}


def stack_filter(line: str):
    m = re.match(r'## (\d+)\.\s*(.+)', line)
    if m:
        num = int(m.group(1))
        if num in SECTION_FILENAMES:
            return SECTION_FILENAMES[num], m.group(2).strip()
    return None


def extract(spec_dir: Path, output_dir: Path) -> list[str]:
    text = read_spec_file(spec_dir / SPEC_FILE)
    sections = split_h2_sections(text, section_filter=stack_filter)

    out = output_dir / OUTPUT_SUBDIR
    generated = []

    for section in sections:
        filename = section.code + '.md'
        write_fragment(out / filename, section.content)
        generated.append(filename)

    return generated


if __name__ == '__main__':
    spec_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / 'spec'
    output_dir = Path(__file__).resolve().parent.parent.parent / 'doc-spec-manager' / 'references'
    files = extract(spec_dir, output_dir)
    print(f"Stack: {len(files)} archivos generados en {OUTPUT_SUBDIR}/")
