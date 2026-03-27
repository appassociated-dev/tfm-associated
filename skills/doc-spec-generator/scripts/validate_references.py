#!/usr/bin/env python3
"""
validate_references.py - Validación post-generación de references/.

Comprueba:
1. Todos los códigos de spec/ tienen su fragmento en references/.
2. No hay archivos huérfanos (fragmentos sin correspondencia en spec/).
3. Existen los 10 head-*.md esperados.
4. Cada subdirectorio tiene al menos 1 archivo.
5. No hay archivos con nombres que violen lowercase kebab-case.
"""

import re
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPTS_DIR.parent.parent.parent
SPEC_DIR = PROJECT_ROOT / 'spec'
REFERENCES_DIR = SCRIPTS_DIR.parent.parent / 'doc-spec-manager' / 'references'

sys.path.insert(0, str(SCRIPTS_DIR))
from lib_parser import read_spec_file, _build_code_fence_mask, ExclusionConfig

# --- definición de validaciones por tipo ---
# Cada entrada: (spec_file, subdir, regex_para_encontrar_códigos_en_spec, código->filename)
ENTITY_TYPES = [
    {
        'name': 'RF',
        'spec_file': '003_requisitos-funcionales.md',
        'subdir': 'rf',
        'code_pattern': r'^### (N\d+RF\d+):',
        'code_to_filename': lambda c: c.lower() + '.md',
    },
    {
        'name': 'RNF',
        'spec_file': '004_rnf-base.md',
        'subdir': 'rnf',
        'code_pattern': r'^### (RNF-\d+):',
        'code_to_filename': lambda c: c.lower() + '.md',
    },
    {
        'name': 'BC',
        'spec_file': '005_modelo-dominio.md',
        'subdir': 'bc',
        # los BC tienen lógica especial de filtrado (7 bis = Transversal),
        # así que validamos por lista fija alineada con extract_bc.py
        'code_pattern': None,
        'code_to_filename': None,
        'expected_files': [
            'bc-membership.md', 'bc-treasury.md', 'bc-events.md',
            'bc-communication.md', 'bc-documents.md', 'bc-transversal.md',
            'bc-identity.md',
        ],
    },
    {
        'name': 'ADR',
        'spec_file': '006_adrs.md',
        'subdir': 'adr',
        'code_pattern': r'^## (ADR-\d+):',
        'code_to_filename': lambda c: c.lower() + '.md',
    },
    {
        'name': 'Stack',
        'spec_file': '007_stack.md',
        'subdir': 'stack',
        # stack no tiene códigos individuales; validamos por conteo de archivos
        'code_pattern': None,
        'code_to_filename': None,
        'expected_files': [
            'backend.md', 'frontend.md', 'base-de-datos.md',
            'infraestructura.md', 'testing.md', 'devops-ci-cd.md',
            'herramientas.md', 'servicios.md',
        ],
    },
    {
        'name': 'RNFT',
        'spec_file': '008_rnf-tecnicos.md',
        'subdir': 'rnft',
        'code_pattern': r'^### \d+\.\d+\s+(RNFT-\d+):',
        'code_to_filename': lambda c: c.lower() + '.md',
    },
    {
        'name': 'US',
        'spec_file': '009_user-stories.md',
        'subdir': 'us',
        'code_pattern': r'^#### (US-\d+):',
        'code_to_filename': lambda c: c.lower() + '.md',
    },
    {
        'name': 'UC',
        'spec_file': '010_casos-uso.md',
        'subdir': 'uc',
        'code_pattern': r'^### (UC-\d+):',
        'code_to_filename': lambda c: c.lower() + '.md',
    },
    {
        'name': 'ENT',
        'spec_file': '012_modelo-de-datos.md',
        'subdir': 'ent',
        'code_pattern': r'^### (ENT-\d+):',
        'code_to_filename': lambda c: c.lower() + '.md',
    },
    {
        'name': 'EP',
        'spec_file': '013_inventario-de-endpoints.md',
        'subdir': 'ep',
        'code_pattern': r'^### (EP-\d+):',
        'code_to_filename': lambda c: c.lower() + '.md',
    },
]

# mapeo: spec_file → head-*.md correspondiente (para filtrado por exclusiones)
SPEC_TO_HEAD = {
    '003_requisitos-funcionales.md': 'head-requisitos-funcionales.md',
    '004_rnf-base.md':               'head-requisitos-no-funcionales.md',
    '005_modelo-dominio.md':         'head-modelo-dominio.md',
    '006_adrs.md':                   'head-adrs.md',
    '007_stack.md':                  'head-stack.md',
    '008_rnf-tecnicos.md':           'head-requisitos-no-funcionales-tech.md',
    '009_user-stories.md':           'head-user-stories.md',
    '010_casos-uso.md':              'head-use-cases.md',
    '012_modelo-de-datos.md':        'head-modelo-de-datos.md',
    '013_inventario-de-endpoints.md': 'head-inventario-de-endpoints.md',
}

EXPECTED_HEAD_FILES = [
    'head-requisitos-funcionales.md',
    'head-requisitos-no-funcionales.md',
    'head-modelo-dominio.md',
    'head-adrs.md',
    'head-stack.md',
    'head-requisitos-no-funcionales-tech.md',
    'head-user-stories.md',
    'head-use-cases.md',
    'head-modelo-de-datos.md',
    'head-inventario-de-endpoints.md',
]


def _find_codes_in_spec(spec_path: Path, pattern: str) -> list[str]:
    """Busca códigos en el documento spec, ignorando code fences."""
    text = read_spec_file(spec_path)
    lines = text.split('\n')
    mask = _build_code_fence_mask(lines)
    compiled = re.compile(pattern)

    codes = []
    for i, line in enumerate(lines):
        if mask[i]:
            continue
        m = compiled.match(line)
        if m:
            codes.append(m.group(1))
    return codes


def validate(exclusion_config: ExclusionConfig | None = None) -> tuple[int, int]:
    """Ejecuta todas las validaciones. Retorna (errores, warnings).

    exclusion_config: configuración de exclusiones cargada por generate_all.py.
    Si es None (ejecución standalone), se asume sin exclusiones (backward compatible).
    """
    errors = 0
    warnings = 0

    # conjuntos de archivos excluidos (vacíos si no hay config)
    excluded_copy_specs = exclusion_config.copy_files if exclusion_config else frozenset()
    excluded_atom_specs = exclusion_config.atom_files if exclusion_config else frozenset()

    # head files a verificar: omitir los mapeados a spec files en copy_files
    excluded_heads = {
        head
        for spec_file, head in SPEC_TO_HEAD.items()
        if spec_file in excluded_copy_specs
    }
    active_head_files = [hf for hf in EXPECTED_HEAD_FILES if hf not in excluded_heads]

    # entity types a verificar: omitir los mapeados a spec files en atom_files
    active_entity_types = [
        entity for entity in ENTITY_TYPES
        if entity['spec_file'] not in excluded_atom_specs
    ]

    # 1. Validar head-*.md
    print("\n[1] Verificando head-*.md...")
    if excluded_heads:
        print(f"  (omitidos por exclusión: {', '.join(sorted(excluded_heads))})")
    for hf in active_head_files:
        path = REFERENCES_DIR / hf
        if not path.exists():
            print(f"  ERROR: falta {hf}")
            errors += 1
        elif path.stat().st_size == 0:
            print(f"  ERROR: {hf} está vacío")
            errors += 1
        else:
            print(f"  OK  {hf} ({path.stat().st_size:,} bytes)")

    # 2. Validar fragmentos por tipo
    print("\n[2] Verificando fragmentos por tipo...")
    if len(active_entity_types) < len(ENTITY_TYPES):
        skipped = [e['name'] for e in ENTITY_TYPES if e not in active_entity_types]
        print(f"  (omitidos por exclusión: {', '.join(skipped)})")
    total_fragments = 0

    for entity in active_entity_types:
        name = entity['name']
        subdir = REFERENCES_DIR / entity['subdir']
        actual_files = set(f.name for f in subdir.glob('*.md')) if subdir.exists() else set()

        if entity.get('expected_files'):
            # validación por lista fija (stack)
            expected = set(entity['expected_files'])
            missing = expected - actual_files
            orphans = actual_files - expected
        elif entity['code_pattern']:
            # validación por códigos del spec
            codes = _find_codes_in_spec(SPEC_DIR / entity['spec_file'], entity['code_pattern'])
            expected = set(entity['code_to_filename'](c) for c in codes)
            missing = expected - actual_files
            orphans = actual_files - expected
        else:
            missing = set()
            orphans = set()

        total_fragments += len(actual_files)

        if missing:
            print(f"  ERROR {name}: {len(missing)} fragmentos faltantes:")
            for f in sorted(missing)[:5]:
                print(f"    - {f}")
            if len(missing) > 5:
                print(f"    ... y {len(missing) - 5} más")
            errors += len(missing)
        if orphans:
            print(f"  WARN  {name}: {len(orphans)} archivos huérfanos:")
            for f in sorted(orphans)[:5]:
                print(f"    - {f}")
            if len(orphans) > 5:
                print(f"    ... y {len(orphans) - 5} más")
            warnings += len(orphans)
        if not missing and not orphans:
            print(f"  OK  {name}: {len(actual_files)} fragmentos")

    # 3. Validar nombres lowercase
    print("\n[3] Verificando convención de nombres...")
    bad_names = []
    for f in REFERENCES_DIR.rglob('*.md'):
        name = f.name
        if name != name.lower() or ' ' in name:
            bad_names.append(str(f.relative_to(REFERENCES_DIR)))

    if bad_names:
        print(f"  ERROR: {len(bad_names)} archivos con nombres inválidos:")
        for n in bad_names[:5]:
            print(f"    - {n}")
        errors += len(bad_names)
    else:
        print(f"  OK  Todos los nombres son lowercase kebab-case")

    # 4. Validar contenido no vacío
    print("\n[4] Verificando contenido no trivial...")
    empty_files = []
    for f in REFERENCES_DIR.rglob('*.md'):
        if f.stat().st_size < 10:
            empty_files.append(str(f.relative_to(REFERENCES_DIR)))

    if empty_files:
        print(f"  ERROR: {len(empty_files)} archivos vacíos o triviales:")
        for n in empty_files[:5]:
            print(f"    - {n}")
        errors += len(empty_files)
    else:
        total_files = len(list(REFERENCES_DIR.rglob('*.md')))
        print(f"  OK  {total_files} archivos con contenido válido")

    return errors, warnings


def main():
    print("=" * 60)
    print("  validate_references.py: Validación de integridad")
    print("=" * 60)

    if not REFERENCES_DIR.exists():
        print("\nERROR: references/ no existe. Ejecuta generate_all.py primero.")
        sys.exit(1)

    errors, warnings = validate()

    print("\n" + "=" * 60)
    if errors == 0 and warnings == 0:
        print("  RESULTADO: OK — Sin errores ni warnings")
    elif errors == 0:
        print(f"  RESULTADO: OK con {warnings} warning(s)")
    else:
        print(f"  RESULTADO: FALLO — {errors} error(es), {warnings} warning(s)")
    print("=" * 60)

    sys.exit(1 if errors > 0 else 0)


if __name__ == '__main__':
    main()
