#!/usr/bin/env python3
"""
generate_all.py - Orquestador de generación de references/.

Ejecuta la pipeline completa:
1. Verifica que spec/ contiene los documentos esperados.
2. Limpia references/ de archivos huérfanos.
3. Ejecuta los 8 scripts de extracción.
4. Ejecuta los 8 scripts de generación de head-*.md.
5. Reporta resultados.
"""

import shutil
import sys
import time
from pathlib import Path

# --- rutas ---
SCRIPTS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPTS_DIR.parent.parent.parent.parent
SPEC_DIR = PROJECT_ROOT / 'spec'
REFERENCES_DIR = SCRIPTS_DIR.parent.parent / 'doc-spec-manager' / 'references'

# insertar scripts/ en el path para imports
sys.path.insert(0, str(SCRIPTS_DIR))

# --- archivos spec esperados ---
EXPECTED_SPEC_FILES = [
    '003_requisitos-funcionales.md',
    '004_rnf-base.md',
    '005_modelo-dominio.md',
    '006_adrs.md',
    '007_stack.md',
    '008_rnf-tecnicos.md',
    '009_user-stories.md',
    '010_casos-uso.md',
]

# --- subdirectorios de fragmentos ---
FRAGMENT_SUBDIRS = ['rf', 'rnf', 'bc', 'adr', 'stack', 'rnft', 'us', 'uc']


def verify_spec_files() -> bool:
    """Verifica que todos los archivos spec esperados existen."""
    missing = []
    for f in EXPECTED_SPEC_FILES:
        if not (SPEC_DIR / f).exists():
            missing.append(f)

    if missing:
        print(f"ERROR: Archivos spec/ no encontrados:")
        for f in missing:
            print(f"  - {f}")
        return False

    print(f"  spec/: {len(EXPECTED_SPEC_FILES)} archivos verificados")
    return True


def clean_references():
    """Limpia los subdirectorios de fragmentos y head-*.md existentes."""
    # limpiar subdirectorios de fragmentos
    for subdir in FRAGMENT_SUBDIRS:
        target = REFERENCES_DIR / subdir
        if target.exists():
            shutil.rmtree(target)
        target.mkdir(parents=True, exist_ok=True)

    # limpiar head-*.md existentes
    for head_file in REFERENCES_DIR.glob('head-*.md'):
        head_file.unlink()

    print(f"  references/: limpiado ({len(FRAGMENT_SUBDIRS)} subdirs + head-*.md)")


def run_extractions() -> dict[str, int]:
    """Ejecuta los 8 scripts de extracción y retorna conteos."""
    import extract_rf
    import extract_rnf
    import extract_bc
    import extract_adr
    import extract_stack
    import extract_rnft
    import extract_us
    import extract_uc

    extractors = [
        ('RF', extract_rf),
        ('RNF', extract_rnf),
        ('BC', extract_bc),
        ('ADR', extract_adr),
        ('Stack', extract_stack),
        ('RNFT', extract_rnft),
        ('US', extract_us),
        ('UC', extract_uc),
    ]

    counts = {}
    for name, module in extractors:
        files = module.extract(SPEC_DIR, REFERENCES_DIR)
        counts[name] = len(files)
        print(f"  {name}: {len(files)} fragmentos")

    return counts


def run_head_generators() -> list[str]:
    """Ejecuta los 8 scripts de generación de head-*.md."""
    import gen_head_rf
    import gen_head_rnf
    import gen_head_bc
    import gen_head_adr
    import gen_head_stack
    import gen_head_rnft
    import gen_head_us
    import gen_head_uc

    generators = [
        gen_head_rf,
        gen_head_rnf,
        gen_head_bc,
        gen_head_adr,
        gen_head_stack,
        gen_head_rnft,
        gen_head_us,
        gen_head_uc,
    ]

    head_files = []
    for module in generators:
        f = module.generate(SPEC_DIR, REFERENCES_DIR)
        head_files.append(f)
        print(f"  {f}")

    return head_files


def count_total_files() -> int:
    """Cuenta el total de archivos .md generados en references/."""
    return len(list(REFERENCES_DIR.rglob('*.md')))


def main():
    start = time.time()
    print("=" * 60)
    print("  doc-spec-generator: Generación completa de references/")
    print("=" * 60)

    # 1. Verificar spec/
    print("\n[1/5] Verificando spec/...")
    if not verify_spec_files():
        sys.exit(1)

    # 2. Limpiar references/
    print("\n[2/5] Limpiando references/...")
    clean_references()

    # 3. Extracciones
    print("\n[3/5] Ejecutando extracciones...")
    counts = run_extractions()

    # 4. Head files
    print("\n[4/5] Generando head-*.md...")
    head_files = run_head_generators()

    # 5. Validación
    print("\n[5/5] Validando integridad...")
    import validate_references
    errors, warnings = validate_references.validate()

    # Resumen
    elapsed = time.time() - start
    total = count_total_files()
    total_fragments = sum(counts.values())

    print("\n" + "=" * 60)
    print(f"  Completado en {elapsed:.2f}s")
    print(f"  Fragmentos: {total_fragments}")
    print(f"  Head files: {len(head_files)}")
    print(f"  Total archivos: {total}")
    if errors > 0:
        print(f"  VALIDACIÓN: FALLO ({errors} errores, {warnings} warnings)")
    elif warnings > 0:
        print(f"  VALIDACIÓN: OK ({warnings} warnings)")
    else:
        print(f"  VALIDACIÓN: OK")
    print("=" * 60)

    if errors > 0:
        sys.exit(1)


if __name__ == '__main__':
    main()
