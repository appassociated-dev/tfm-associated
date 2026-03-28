#!/usr/bin/env python3
"""
generate_all.py - Orquestador de generación de references/.

Ejecuta la pipeline completa:
1. Verifica que spec/ contiene los documentos esperados.
2. Limpia references/ de archivos huérfanos.
3. Ejecuta los 10 scripts de extracción.
4. Copia archivos passthrough (exclude-atom, exclude-copy:false) a references/.
5. Ejecuta los 10 scripts de generación de head-*.md.
6. Reporta resultados.
"""

import shutil
import sys
import time
from pathlib import Path

# --- rutas ---
SCRIPTS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPTS_DIR.parent.parent.parent
SPEC_DIR = PROJECT_ROOT / 'spec'
REFERENCES_DIR = SCRIPTS_DIR.parent.parent / 'doc-spec-manager' / 'references'

# insertar scripts/ en el path para imports
sys.path.insert(0, str(SCRIPTS_DIR))

from lib_parser import ExclusionConfig, load_exclusion_config

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
    '012_modelo-de-datos.md',
    '013_inventario-de-endpoints.md',
]

# --- subdirectorios de fragmentos ---
FRAGMENT_SUBDIRS = ['rf', 'rnf', 'bc', 'adr', 'stack', 'rnft', 'us', 'uc', 'ent', 'ep']

# --- mapeo: spec_file → (module_key, subdir) para filtrado por exclusiones ---
SPEC_FILE_MAP = {
    '003_requisitos-funcionales.md': ('RF',   'rf'),
    '004_rnf-base.md':               ('RNF',  'rnf'),
    '005_modelo-dominio.md':          ('BC',   'bc'),
    '006_adrs.md':                    ('ADR',  'adr'),
    '007_stack.md':                   ('Stack','stack'),
    '008_rnf-tecnicos.md':            ('RNFT', 'rnft'),
    '009_user-stories.md':            ('US',   'us'),
    '010_casos-uso.md':               ('UC',   'uc'),
    '012_modelo-de-datos.md':         ('ENT',  'ent'),
    '013_inventario-de-endpoints.md': ('EP',   'ep'),
}


def verify_spec_files(exclusion_config: ExclusionConfig | None = None) -> bool:
    """Verifica que todos los archivos spec esperados existen.

    Los archivos marcados como exclude-copy se omiten de la verificación
    (ya que no forman parte del procesamiento activo).
    """
    config = exclusion_config or ExclusionConfig()
    # filtrar archivos completamente excluidos de la verificación
    files_to_check = [f for f in EXPECTED_SPEC_FILES if f not in config.copy_files]

    missing = []
    for f in files_to_check:
        if not (SPEC_DIR / f).exists():
            missing.append(f)

    if missing:
        print(f"ERROR: Archivos spec/ no encontrados:")
        for f in missing:
            print(f"  - {f}")
        return False

    skipped = len(EXPECTED_SPEC_FILES) - len(files_to_check)
    suffix = f" ({skipped} excluidos)" if skipped else ""
    print(f"  spec/: {len(files_to_check)} archivos verificados{suffix}")
    return True


def clean_references(exclusion_config: ExclusionConfig | None = None):
    """Limpia los subdirectorios de fragmentos y head-*.md existentes.

    Los subdirectorios mapeados a archivos en copy_files se omiten:
    no se borran ni se recrean, evitando dejar directorios vacíos.
    """
    config = exclusion_config or ExclusionConfig()

    # construir set de subdirs a omitir según copy_files
    excluded_subdirs = {
        subdir
        for spec_file, (_key, subdir) in SPEC_FILE_MAP.items()
        if spec_file in config.copy_files
    }

    cleaned = 0
    for subdir in FRAGMENT_SUBDIRS:
        if subdir in excluded_subdirs:
            # no tocar este subdir: está completamente excluido
            continue
        target = REFERENCES_DIR / subdir
        if target.exists():
            shutil.rmtree(target)
        target.mkdir(parents=True, exist_ok=True)
        cleaned += 1

    # limpiar head-*.md existentes (siempre, incluidos los excluidos que quedaron de antes)
    for head_file in REFERENCES_DIR.glob('head-*.md'):
        head_file.unlink()

    skipped = len(excluded_subdirs)
    suffix = f" ({skipped} subdirs excluidos)" if skipped else ""
    print(f"  references/: limpiado ({cleaned} subdirs + head-*.md){suffix}")


def run_extractions(exclusion_config: ExclusionConfig | None = None) -> dict[str, int]:
    """Ejecuta los scripts de extracción y retorna conteos.

    Omite los módulos cuyo spec_file está en atom_files (incluye copy_files
    por normalización: exclude-copy:true → también en atom_files).
    """
    import extract_rf
    import extract_rnf
    import extract_bc
    import extract_adr
    import extract_stack
    import extract_rnft
    import extract_us
    import extract_uc
    import extract_modelo_datos
    import extract_inventario_endpoints

    config = exclusion_config or ExclusionConfig()

    # mapeo inverso: module_key → spec_file para verificar exclusiones
    key_to_spec = {key: spec for spec, (key, _subdir) in SPEC_FILE_MAP.items()}

    extractors = [
        ('RF',    extract_rf),
        ('RNF',   extract_rnf),
        ('BC',    extract_bc),
        ('ADR',   extract_adr),
        ('Stack', extract_stack),
        ('RNFT',  extract_rnft),
        ('US',    extract_us),
        ('UC',    extract_uc),
        ('ENT',   extract_modelo_datos),
        ('EP',    extract_inventario_endpoints),
    ]

    counts = {}
    for name, module in extractors:
        spec_file = key_to_spec.get(name, '')
        if spec_file in config.atom_files:
            # omitir extracción para este módulo
            print(f"  {name}: excluido (exclude-atom)")
            counts[name] = 0
            continue
        files = module.extract(SPEC_DIR, REFERENCES_DIR)
        counts[name] = len(files)
        print(f"  {name}: {len(files)} fragmentos")

    return counts


def run_head_generators(exclusion_config: ExclusionConfig | None = None) -> list[str]:
    """Ejecuta los scripts de generación de head-*.md.

    Omite los módulos cuyo spec_file está en copy_files
    (exclude-copy:true → ni fragmentos ni head file).
    Los módulos con exclude-atom:true pero exclude-copy:false SÍ generan head.
    """
    import gen_head_rf
    import gen_head_rnf
    import gen_head_bc
    import gen_head_adr
    import gen_head_stack
    import gen_head_rnft
    import gen_head_us
    import gen_head_uc
    import gen_head_modelo_datos
    import gen_head_inventario_endpoints

    config = exclusion_config or ExclusionConfig()

    # mapeo: module → spec_file para verificar exclusiones
    generators_with_spec = [
        (gen_head_rf,                    '003_requisitos-funcionales.md'),
        (gen_head_rnf,                   '004_rnf-base.md'),
        (gen_head_bc,                    '005_modelo-dominio.md'),
        (gen_head_adr,                   '006_adrs.md'),
        (gen_head_stack,                 '007_stack.md'),
        (gen_head_rnft,                  '008_rnf-tecnicos.md'),
        (gen_head_us,                    '009_user-stories.md'),
        (gen_head_uc,                    '010_casos-uso.md'),
        (gen_head_modelo_datos,          '012_modelo-de-datos.md'),
        (gen_head_inventario_endpoints,  '013_inventario-de-endpoints.md'),
    ]

    head_files = []
    for module, spec_file in generators_with_spec:
        if spec_file in config.copy_files:
            # omitir generación de head para archivos completamente excluidos
            print(f"  [excluido] {spec_file} (exclude-copy)")
            continue
        f = module.generate(SPEC_DIR, REFERENCES_DIR)
        head_files.append(f)
        print(f"  {f}")

    return head_files


def copy_passthrough_files(exclusion_config: ExclusionConfig | None = None) -> list[str]:
    """Copia archivos passthrough (exclude-atom pero no exclude-copy) a references/.

    Los archivos en atom_files pero no en copy_files se copian tal cual desde spec/
    a references/, sin ningún procesamiento adicional.
    """
    config = exclusion_config or ExclusionConfig()

    # passthrough = archivos que omiten atomización pero deben copiarse a references/
    passthrough = config.atom_files - config.copy_files

    copied = []
    for filename in sorted(passthrough):
        src = SPEC_DIR / filename
        dst = REFERENCES_DIR / filename
        shutil.copy2(src, dst)
        copied.append(filename)
        print(f"  {filename}")

    return copied


def count_total_files() -> int:
    """Cuenta el total de archivos .md generados en references/."""
    return len(list(REFERENCES_DIR.rglob('*.md')))


def main():
    start = time.time()
    print("=" * 60)
    print("  doc-spec-generator: Generación completa de references/")
    print("=" * 60)

    # cargar configuración de exclusiones (backward compatible: ausente = sin exclusiones)
    ASSETS_DIR = SCRIPTS_DIR.parent / 'assets'
    exclusion_config = load_exclusion_config(ASSETS_DIR)

    if exclusion_config.copy_files or exclusion_config.atom_files:
        print(f"\n  Exclusiones activas: {len(exclusion_config.copy_files)} copy, "
              f"{len(exclusion_config.atom_files)} atom")

    # 1. Verificar spec/
    print("\n[1/6] Verificando spec/...")
    if not verify_spec_files(exclusion_config):
        sys.exit(1)

    # 2. Limpiar references/
    print("\n[2/6] Limpiando references/...")
    clean_references(exclusion_config)

    # 3. Extracciones
    print("\n[3/6] Ejecutando extracciones...")
    counts = run_extractions(exclusion_config)

    # 4. Copia passthrough
    print("\n[4/6] Copiando archivos passthrough...")
    passthrough_files = copy_passthrough_files(exclusion_config)

    # 5. Head files
    print("\n[5/6] Generando head-*.md...")
    head_files = run_head_generators(exclusion_config)

    # 6. Validación
    print("\n[6/6] Validando integridad...")
    import validate_references
    errors, warnings = validate_references.validate(exclusion_config)

    # Resumen
    elapsed = time.time() - start
    total = count_total_files()
    total_fragments = sum(counts.values())

    print("\n" + "=" * 60)
    print(f"  Completado en {elapsed:.2f}s")
    print(f"  Fragmentos: {total_fragments}")
    print(f"  Passthrough: {len(passthrough_files)}")
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
