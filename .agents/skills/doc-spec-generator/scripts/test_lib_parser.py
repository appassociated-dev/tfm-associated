#!/usr/bin/env python3
"""
Tests de lib_parser.py contra los documentos reales de spec/.

Estrategia: validar lógica de parsing, NO cantidades hardcodeadas.
- El parser encuentra items → verificar que no esté vacío.
- Los códigos extraídos coinciden con el patrón regex del documento.
- El conteo del parser == conteo de un grep independiente sobre la fuente.
- Cada sección tiene contenido no trivial.
- El contexto jerárquico se propaga correctamente.
"""

import re
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS_DIR))

from lib_parser import (
    parse_document_metadata,
    extract_header_block,
    extract_index_section,
    extract_trailing_sections,
    split_by_heading,
    split_h2_sections,
    sanitize_filename,
    read_spec_file,
    count_items_by_pattern,
    _is_heading_exact,
    _is_heading_at_or_above,
)

SPEC_DIR = SCRIPTS_DIR.parent.parent.parent.parent / 'spec'

passed = 0
failed = 0


def check(name: str, condition: bool, detail: str = ""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  OK  {name}")
    else:
        failed += 1
        print(f"  FAIL  {name}{': ' + detail if detail else ''}")


def count_headings_in_source(text: str, pattern: str) -> int:
    """Conteo independiente de headings en el texto fuente."""
    return len(re.findall(pattern, text, re.MULTILINE))


# ===================================================================
# Test: heading helpers
# ===================================================================
print("\n--- heading helpers ---")

check("H1 exact",   _is_heading_exact("# Title", 1))
check("H2 exact",   _is_heading_exact("## Title", 2))
check("H3 exact",   _is_heading_exact("### Title", 3))
check("H4 exact",   _is_heading_exact("#### Title", 4))
check("H3 no es H2", not _is_heading_exact("### Title", 2))
check("H2 no es H3", not _is_heading_exact("## Title", 3))
check("H1 no es H2", not _is_heading_exact("# Title", 2))
check("texto no heading", not _is_heading_exact("not a heading", 2))
check("linea vacia no heading", not _is_heading_exact("", 2))

check("H2 at_or_above(3)", _is_heading_at_or_above("## Title", 3))
check("H1 at_or_above(3)", _is_heading_at_or_above("# Title", 3))
check("H3 at_or_above(3)", _is_heading_at_or_above("### Title", 3))
check("H4 NOT at_or_above(3)", not _is_heading_at_or_above("#### Title", 3))
check("H4 at_or_above(4)", _is_heading_at_or_above("#### Title", 4))

# ===================================================================
# Test: parse_document_metadata
# ===================================================================
print("\n--- parse_document_metadata ---")

DOCS_TO_TEST = [
    ('003_requisitos-funcionales.md', 'title_has', 'Requisitos Funcionales'),
    ('004_rnf-base.md', 'title_has', 'Requisitos No Funcionales'),
    ('005_modelo-dominio.md', 'title_has', 'Bounded Context'),
    ('006_adrs.md', 'title_has', 'Architectural Decision'),
    ('007_stack.md', 'title_has', 'Stack'),
    ('008_rnf-tecnicos.md', 'title_has', 'Requisitos No Funcionales'),
    ('009_user-stories.md', 'title_has', 'User Stories'),
    ('010_casos-uso.md', 'title_has', 'Trazabilidad'),
]

for filename, check_type, expected_substr in DOCS_TO_TEST:
    path = SPEC_DIR / filename
    if not path.exists():
        check(f"metadata {filename}", False, "archivo no encontrado")
        continue
    text = read_spec_file(path)
    meta = parse_document_metadata(text)
    check(f"metadata {filename}: título no vacío", len(meta.title) > 0, f"got: {meta.title!r}")
    check(f"metadata {filename}: título contiene '{expected_substr}'",
          expected_substr in meta.title, f"got: {meta.title!r}")
    check(f"metadata {filename}: versión no vacía", len(meta.version) > 0, f"got: {meta.version!r}")

# ===================================================================
# Test: extract_header_block
# ===================================================================
print("\n--- extract_header_block ---")

text_003 = read_spec_file(SPEC_DIR / '003_requisitos-funcionales.md')
header_003 = extract_header_block(text_003)
check("header no contiene H2", not any(
    _is_heading_exact(l, 2) for l in header_003.split('\n')
))
check("header contiene título H1", any(
    _is_heading_exact(l, 1) for l in header_003.split('\n')
))

# ===================================================================
# Test: extract_index_section
# ===================================================================
print("\n--- extract_index_section ---")

index_003 = extract_index_section(text_003)
check("índice no vacío", len(index_003) > 0)
check("índice contiene enlaces o items", "[" in index_003 or "N2" in index_003)

# ===================================================================
# Helper: validar secciones genéricamente
# ===================================================================
def validate_sections(
    label: str,
    sections: list,
    code_regex: str,
    source_heading_regex: str,
    source_text: str,
    expect_context_levels: list[int] | None = None,
):
    """Validación genérica de secciones parseadas."""
    source_count = count_headings_in_source(source_text, source_heading_regex)
    code_re = re.compile(code_regex)

    check(f"{label}: no vacío", len(sections) > 0, f"got: {len(sections)}")
    check(f"{label}: parser == grep ({source_count})",
          len(sections) == source_count,
          f"parser={len(sections)}, grep={source_count}")

    # Todos los códigos coinciden con el patrón esperado
    bad_codes = [s.code for s in sections if not code_re.match(s.code)]
    check(f"{label}: todos los códigos válidos", len(bad_codes) == 0,
          f"inválidos: {bad_codes[:5]}")

    # Sin duplicados
    codes = [s.code for s in sections]
    check(f"{label}: sin duplicados",
          len(codes) == len(set(codes)),
          f"duplicados: {[c for c in codes if codes.count(c) > 1][:5]}")

    # Contenido no trivial (> 20 chars)
    empty_sections = [s.code for s in sections if len(s.content) < 20]
    check(f"{label}: contenido no trivial", len(empty_sections) == 0,
          f"vacíos: {empty_sections[:5]}")

    # Cada sección contiene su propio heading
    missing_heading = [s.code for s in sections if s.heading_line not in s.content]
    check(f"{label}: contenido incluye heading", len(missing_heading) == 0,
          f"sin heading: {missing_heading[:5]}")

    # Contexto jerárquico
    if expect_context_levels:
        for lvl in expect_context_levels:
            missing_ctx = [s.code for s in sections if lvl not in s.context]
            check(f"{label}: contexto nivel {lvl} presente",
                  len(missing_ctx) == 0,
                  f"sin contexto H{lvl}: {missing_ctx[:5]}")

# ===================================================================
# Test: split_by_heading — RF (003)
# ===================================================================
print("\n--- split_by_heading: RF (003) ---")

RF_PATTERN = r'### (?P<code>N\d+RF\d+):\s*(?P<title>.+)'
rf_sections = split_by_heading(text_003, RF_PATTERN, heading_level=3)

validate_sections(
    label="RF",
    sections=rf_sections,
    code_regex=r'^N\d+RF\d+$',
    source_heading_regex=r'^### N\d+RF\d+:',
    source_text=text_003,
    expect_context_levels=[2],
)

# El primer código debe empezar por N2 (primera sección de necesidades)
check("RF: primer item empieza por N2",
      rf_sections[0].code.startswith("N2") if rf_sections else False,
      f"got: {rf_sections[0].code!r}" if rf_sections else "empty")

# ===================================================================
# Test: split_by_heading — RNF (004)
# ===================================================================
print("\n--- split_by_heading: RNF (004) ---")

text_004 = read_spec_file(SPEC_DIR / '004_rnf-base.md')
RNF_PATTERN = r'### (?P<code>RNF-\d+):\s*(?P<title>.+)'
rnf_sections = split_by_heading(text_004, RNF_PATTERN, heading_level=3)

validate_sections(
    label="RNF",
    sections=rnf_sections,
    code_regex=r'^RNF-\d+$',
    source_heading_regex=r'^### RNF-\d+:',
    source_text=text_004,
    expect_context_levels=[2],
)

# ===================================================================
# Test: split_by_heading — RNFT (008)
# ===================================================================
print("\n--- split_by_heading: RNFT (008) ---")

text_008 = read_spec_file(SPEC_DIR / '008_rnf-tecnicos.md')
RNFT_PATTERN = r'### \d+\.\d+\s+(?P<code>RNFT-\d+):\s*(?P<title>.+)'
rnft_sections = split_by_heading(text_008, RNFT_PATTERN, heading_level=3)

validate_sections(
    label="RNFT",
    sections=rnft_sections,
    code_regex=r'^RNFT-\d+$',
    source_heading_regex=r'^### \d+\.\d+\s+RNFT-\d+:',
    source_text=text_008,
    expect_context_levels=[2],
)

# ===================================================================
# Test: split_by_heading — US (009, nivel H4)
# ===================================================================
print("\n--- split_by_heading: US (009) ---")

text_009 = read_spec_file(SPEC_DIR / '009_user-stories.md')
US_PATTERN = r'#### (?P<code>US-\d+):\s*(?P<title>.+)'
us_sections = split_by_heading(text_009, US_PATTERN, heading_level=4)

validate_sections(
    label="US",
    sections=us_sections,
    code_regex=r'^US-\d+$',
    source_heading_regex=r'^#### US-\d+:',
    source_text=text_009,
    expect_context_levels=[2, 3],
)

# ===================================================================
# Test: split_by_heading — UC (010)
# ===================================================================
print("\n--- split_by_heading: UC (010) ---")

text_010 = read_spec_file(SPEC_DIR / '010_casos-uso.md')
UC_PATTERN = r'### (?P<code>UC-\d+):\s*(?P<title>.+)'
uc_sections = split_by_heading(text_010, UC_PATTERN, heading_level=3)

validate_sections(
    label="UC",
    sections=uc_sections,
    code_regex=r'^UC-\d+$',
    source_heading_regex=r'^### UC-\d+:',
    source_text=text_010,
    expect_context_levels=[2],
)

# ===================================================================
# Test: split_h2_sections — ADR (006)
# ===================================================================
print("\n--- split_h2_sections: ADR (006) ---")

text_006 = read_spec_file(SPEC_DIR / '006_adrs.md')

def adr_filter(line: str):
    m = re.match(r'## (?P<code>ADR-\d+):\s*(?P<title>.+)', line)
    if m:
        return m.group('code'), m.group('title')
    return None

adr_sections = split_h2_sections(text_006, section_filter=adr_filter)
adr_source_count = count_headings_in_source(text_006, r'^## ADR-\d+:')

check("ADR: no vacío", len(adr_sections) > 0)
check(f"ADR: parser == grep ({adr_source_count})",
      len(adr_sections) == adr_source_count,
      f"parser={len(adr_sections)}")

bad_adr = [s.code for s in adr_sections if not re.match(r'^ADR-\d+$', s.code)]
check("ADR: todos los códigos válidos", len(bad_adr) == 0, f"inválidos: {bad_adr}")

adr_codes = [s.code for s in adr_sections]
check("ADR: sin duplicados", len(adr_codes) == len(set(adr_codes)))
check("ADR: contenido no trivial",
      all(len(s.content) > 100 for s in adr_sections))

# ===================================================================
# Test: split_h2_sections — Stack (007)
# ===================================================================
print("\n--- split_h2_sections: Stack (007) ---")

text_007 = read_spec_file(SPEC_DIR / '007_stack.md')

def stack_filter(line: str):
    """Secciones 2-9 (excluye 1=Resumen Ejecutivo y 10=Matriz)."""
    m = re.match(r'## (\d+)\.\s*(.+)', line)
    if m:
        num = int(m.group(1))
        if 2 <= num <= 9:
            title = m.group(2).strip()
            code = sanitize_filename(title.split('(')[0].strip())
            code = re.sub(r'[^a-z0-9]+', '-', code).strip('-')
            return code, title
    return None

stack_sections = split_h2_sections(text_007, section_filter=stack_filter)

# Contar secciones ## N. donde 2 <= N <= 9
stack_source_count = len([
    m for m in re.finditer(r'^## (\d+)\.', text_007, re.MULTILINE)
    if 2 <= int(m.group(1)) <= 9
])

check("Stack: no vacío", len(stack_sections) > 0)
check(f"Stack: parser == grep ({stack_source_count})",
      len(stack_sections) == stack_source_count,
      f"parser={len(stack_sections)}")
check("Stack: primera sección es backend",
      "backend" in stack_sections[0].code if stack_sections else False,
      f"got: {stack_sections[0].code!r}" if stack_sections else "empty")
check("Stack: sin duplicados",
      len(stack_sections) == len(set(s.code for s in stack_sections)))

# ===================================================================
# Test: split_h2_sections — BC (005)
# ===================================================================
print("\n--- split_h2_sections: BC (005) ---")

text_005 = read_spec_file(SPEC_DIR / '005_modelo-dominio.md')

def bc_filter(line: str):
    """Secciones BC-* y 7 bis (transversal)."""
    m = re.match(r'## \d+\.\s*(BC-\w+):\s*(.+)', line)
    if m:
        return m.group(1), m.group(2).strip()
    m = re.match(r'## \d+ bis\.\s*(.+)', line)
    if m:
        return "BC-Transversal", m.group(1).strip()
    return None

bc_sections = split_h2_sections(text_005, section_filter=bc_filter)

# Contar BC-* headings + 7 bis en fuente
bc_source_count = count_headings_in_source(text_005, r'^## \d+\.?\s*(?:bis\.)?\s*(?:BC-|Extensión)')

check("BC: no vacío", len(bc_sections) > 0)
check(f"BC: parser == grep ({bc_source_count})",
      len(bc_sections) == bc_source_count,
      f"parser={len(bc_sections)}")

bc_codes = [s.code for s in bc_sections]
check("BC: tiene BC-Membership", "BC-Membership" in bc_codes, f"codes: {bc_codes}")
check("BC: tiene BC-Identity", "BC-Identity" in bc_codes, f"codes: {bc_codes}")
check("BC: tiene BC-Treasury", "BC-Treasury" in bc_codes, f"codes: {bc_codes}")
check("BC: tiene BC-Transversal", "BC-Transversal" in bc_codes, f"codes: {bc_codes}")
check("BC: contenido no trivial",
      all(len(s.content) > 100 for s in bc_sections))

# ===================================================================
# Test: extract_trailing_sections
# ===================================================================
print("\n--- extract_trailing_sections ---")

trailing_004 = extract_trailing_sections(text_004, [
    r'^## Trazabilidad',
    r'^## Priorización',
    r'^## Changelog',
])

check("trailing: encuentra secciones", len(trailing_004) > 0,
      f"keys: {list(trailing_004.keys())}")
check("trailing: Trazabilidad encontrada", "Trazabilidad" in trailing_004,
      f"keys: {list(trailing_004.keys())}")
check("trailing: contenido no vacío",
      all(len(v) > 10 for v in trailing_004.values()))

# ===================================================================
# Test: sanitize_filename
# ===================================================================
print("\n--- sanitize_filename ---")

SANITIZE_CASES = [
    ("N2RF01", "n2rf01"),
    ("RNF-001", "rnf-001"),
    ("BC-Identity", "bc-identity"),
    ("ADR-001", "adr-001"),
    ("RNFT-001", "rnft-001"),
    ("US-001", "us-001"),
    ("UC-001", "uc-001"),
    ("BC-Transversal", "bc-transversal"),
    ("N13RF04", "n13rf04"),
]
for input_code, expected in SANITIZE_CASES:
    result = sanitize_filename(input_code)
    check(f"sanitize '{input_code}' → '{expected}'",
          result == expected, f"got: {result!r}")

# Propiedad: resultado siempre lowercase y sin caracteres prohibidos
check("sanitize: siempre lowercase",
      all(sanitize_filename(c).islower() or '-' in sanitize_filename(c)
          for c, _ in SANITIZE_CASES))

# ===================================================================
# Resumen
# ===================================================================
print(f"\n{'='*50}")
print(f"  TOTAL: {passed + failed}  |  OK: {passed}  |  FAIL: {failed}")
print(f"{'='*50}")

sys.exit(0 if failed == 0 else 1)
