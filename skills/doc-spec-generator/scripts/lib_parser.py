#!/usr/bin/env python3
"""
lib_parser.py - Funciones comunes de parsing para fragmentación de spec/.

Utilidades para:
- Extraer metadatos del header de cada documento
- Dividir documentos en secciones por patrones de heading
- Sanitizar nombres de archivo (lowercase kebab-case)
- Escribir fragmentos de forma segura
"""

import re
from pathlib import Path
from dataclasses import dataclass, field


# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------

@dataclass
class DocumentMetadata:
    """Metadatos extraídos del header de un documento spec/."""
    title: str = ""
    version: str = ""
    date: str = ""
    inputs: str = ""
    state: str = ""
    extras: dict = field(default_factory=dict)


@dataclass
class Section:
    """Una sección extraída de un documento."""
    code: str
    title: str
    heading_line: str
    content: str
    context: dict = field(default_factory=dict)
    line_start: int = 0
    line_end: int = 0


# ---------------------------------------------------------------------------
# Heading helpers
# ---------------------------------------------------------------------------

def _is_heading_exact(line: str, level: int) -> bool:
    """Comprueba si una línea es un heading markdown de nivel exacto."""
    prefix = '#' * level + ' '
    next_prefix = '#' * (level + 1)
    return line.startswith(prefix) and not line.startswith(next_prefix)


def _is_heading_at_or_above(line: str, level: int) -> bool:
    """Comprueba si una línea es un heading de nivel <= level (igual o superior)."""
    for lvl in range(1, level + 1):
        if _is_heading_exact(line, lvl):
            return True
    return False


def _build_code_fence_mask(lines: list[str]) -> list[bool]:
    """
    Genera una máscara booleana: True si la línea está dentro de un code fence.

    Detecta bloques ``` (con o sin lenguaje) y marca las líneas interiores
    para que el parser no confunda comentarios (#) con headings markdown.
    """
    mask = [False] * len(lines)
    inside = False
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('```'):
            if inside:
                # cierre de bloque: esta línea también es parte del bloque
                mask[i] = True
                inside = False
            else:
                # apertura de bloque
                mask[i] = True
                inside = True
        elif inside:
            mask[i] = True
    return mask


# ---------------------------------------------------------------------------
# Parsing de metadatos
# ---------------------------------------------------------------------------

def parse_document_metadata(text: str) -> DocumentMetadata:
    """
    Extrae metadatos del header de un documento spec/.

    Busca el título H1 y campos con formato **Key:** Value
    en el bloque anterior al primer H2.
    """
    header = extract_header_block(text)
    meta = DocumentMetadata()

    title_match = re.search(r'^# (.+)$', header, re.MULTILINE)
    if title_match:
        meta.title = title_match.group(1).strip()

    field_patterns = {
        'version': r'\*\*Versi[oó]n:\*\*\s*(.+)',
        'date': r'\*\*Fecha:\*\*\s*(.+)',
        'inputs': r'\*\*Inputs?:\*\*\s*(.+)',
        'state': r'\*\*Estado:\*\*\s*(.+)',
    }
    for attr, pattern in field_patterns.items():
        match = re.search(pattern, header)
        if match:
            setattr(meta, attr, match.group(1).strip())

    for match in re.finditer(r'\*\*Total\s+(.+?):\*\*\s*(.+)', header):
        meta.extras[match.group(1).strip()] = match.group(2).strip()

    return meta


# ---------------------------------------------------------------------------
# Extracción de bloques
# ---------------------------------------------------------------------------

def extract_header_block(text: str) -> str:
    """Extrae todo el contenido anterior al primer heading H2."""
    match = re.search(r'^## ', text, re.MULTILINE)
    if match:
        return text[:match.start()].rstrip()
    return text


def extract_index_section(text: str) -> str:
    """Extrae la sección de índice (## Índice... hasta el siguiente ##)."""
    match = re.search(
        r'^(## [ÍI]ndice[^\n]*\n)(.*?)(?=^## (?![ÍI]ndice))',
        text, re.MULTILINE | re.DOTALL,
    )
    if match:
        return (match.group(1) + match.group(2)).rstrip()
    return ""


def extract_trailing_sections(text: str, markers: list[str]) -> dict[str, str]:
    """
    Extrae secciones finales del documento por patrones regex.

    Args:
        markers: regex de cada sección (ej. r'^## Trazabilidad').

    Returns:
        {heading_text: content} para cada marker encontrado.
    """
    result = {}
    lines = text.split('\n')
    in_fence = _build_code_fence_mask(lines)

    for pattern in markers:
        compiled = re.compile(pattern)
        for i, line in enumerate(lines):
            if in_fence[i]:
                continue
            if compiled.match(line):
                j = i + 1
                while j < len(lines):
                    if not in_fence[j] and _is_heading_at_or_above(lines[j], 2):
                        break
                    j += 1
                content = '\n'.join(lines[i:j]).rstrip()
                key = line.lstrip('#').strip()
                result[key] = content
                break

    return result


# ---------------------------------------------------------------------------
# División en secciones
# ---------------------------------------------------------------------------

def _trim_trailing(lines: list[str]) -> list[str]:
    """Elimina líneas vacías y separadores --- del final."""
    trimmed = list(lines)
    while trimmed and trimmed[-1].strip() in ('', '---'):
        trimmed.pop()
    return trimmed


def split_by_heading(
    text: str,
    heading_pattern: str,
    heading_level: int = 3,
) -> list[Section]:
    """
    Divide un documento en secciones atómicas según un patrón de heading.

    Cada sección abarca desde su heading hasta justo antes del siguiente
    heading de nivel igual o superior.

    El patrón debe contener un grupo con nombre ``code`` y opcionalmente
    un grupo ``title``.  Se recopila automáticamente el contexto de todos
    los headings de niveles superiores (ej. H2 para items H3).

    Args:
        text:            Contenido completo del documento.
        heading_pattern: Regex con grupos ``code`` y ``title``.
        heading_level:   Nivel markdown del heading de item (3 = ###).

    Returns:
        Lista de Section.
    """
    lines = text.split('\n')
    in_fence = _build_code_fence_mask(lines)
    sections: list[Section] = []
    context: dict[int, str] = {}
    item_re = re.compile(heading_pattern)

    i = 0
    while i < len(lines):
        line = lines[i]

        # ignorar líneas dentro de code fences
        if in_fence[i]:
            i += 1
            continue

        # --- actualizar contexto de headings superiores ---
        for lvl in range(1, heading_level):
            if _is_heading_exact(line, lvl):
                context[lvl] = line.lstrip('#').strip()
                # limpiar niveles más profundos que ya no aplican
                for deeper in range(lvl + 1, heading_level):
                    context.pop(deeper, None)

        # --- detectar heading de item ---
        if _is_heading_exact(line, heading_level):
            match = item_re.match(line)
            if match:
                code = match.group('code')
                groups = match.groupdict()
                title = groups.get('title', '').strip()
                section_start = i

                j = i + 1
                while j < len(lines):
                    if not in_fence[j] and _is_heading_at_or_above(lines[j], heading_level):
                        break
                    j += 1

                content_lines = _trim_trailing(lines[section_start:j])

                sections.append(Section(
                    code=code,
                    title=title,
                    heading_line=line,
                    content='\n'.join(content_lines),
                    context=dict(context),
                    line_start=section_start + 1,
                    line_end=section_start + len(content_lines),
                ))

                i = j
                continue

        i += 1

    return sections


def split_h2_sections(
    text: str,
    section_filter=None,
) -> list[Section]:
    """
    Divide un documento en secciones H2.

    Útil para documentos donde los items son secciones de nivel 2
    (ADR, Stack, BC).

    Args:
        section_filter: Callable(heading_line) -> (code, title) | None.
                        Retorna None para saltar la sección.
    """
    lines = text.split('\n')
    in_fence = _build_code_fence_mask(lines)
    sections: list[Section] = []

    i = 0
    while i < len(lines):
        line = lines[i]

        if in_fence[i]:
            i += 1
            continue

        if _is_heading_exact(line, 2):
            if section_filter:
                result = section_filter(line)
                if result is None:
                    i += 1
                    continue
                code, title = result
            else:
                code = line[3:].strip()
                title = code

            section_start = i
            j = i + 1
            while j < len(lines):
                if not in_fence[j] and _is_heading_at_or_above(lines[j], 2):
                    break
                j += 1

            content_lines = _trim_trailing(lines[section_start:j])

            sections.append(Section(
                code=code,
                title=title,
                heading_line=line,
                content='\n'.join(content_lines),
                line_start=section_start + 1,
                line_end=section_start + len(content_lines),
            ))

            i = j
            continue

        i += 1

    return sections


# ---------------------------------------------------------------------------
# Sanitización y escritura
# ---------------------------------------------------------------------------

def sanitize_filename(code: str) -> str:
    """
    Convierte un código de negocio a nombre de archivo lowercase kebab-case.

    N2RF01     → n2rf01
    RNF-001    → rnf-001
    BC-Identity → bc-identity
    ADR-001    → adr-001
    RNFT-001   → rnft-001
    US-001     → us-001
    UC-001     → uc-001
    """
    return code.lower()


def write_fragment(output_path: Path, content: str) -> None:
    """Escribe un fragmento a disco, creando directorios padre si es necesario."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(content.rstrip('\n') + '\n', encoding='utf-8')


def read_spec_file(path: Path) -> str:
    """Lee un archivo spec/ con encoding UTF-8."""
    return path.read_text(encoding='utf-8')


# ---------------------------------------------------------------------------
# Conteo y validación
# ---------------------------------------------------------------------------

def join_head_parts(parts: list[str]) -> str:
    """
    Une partes de un head-*.md con separadores ---, limpiando
    separadores duplicados que puedan existir al final de cada parte.
    """
    cleaned = []
    for part in parts:
        # eliminar --- y líneas vacías del final de cada parte
        lines = part.rstrip().split('\n')
        while lines and lines[-1].strip() in ('', '---'):
            lines.pop()
        if lines:
            cleaned.append('\n'.join(lines))
    return '\n\n---\n\n'.join(cleaned) + '\n'


def count_items_by_pattern(text: str, pattern: str) -> int:
    """Cuenta las ocurrencias de un patrón (flags MULTILINE)."""
    return len(re.findall(pattern, text, re.MULTILINE))
