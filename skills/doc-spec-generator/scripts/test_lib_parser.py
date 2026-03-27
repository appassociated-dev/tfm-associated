"""
test_lib_parser.py - Tests unitarios para load_exclusion_config() en lib_parser.

Cubre los escenarios definidos en la fase de verify de SDD spec-generator-excludes.
"""

import json
import pytest
from pathlib import Path

from lib_parser import ExclusionConfig, load_exclusion_config


# ---------------------------------------------------------------------------
# Fixtures helpers
# ---------------------------------------------------------------------------

def write_exclusions(tmp_path: Path, data: object) -> Path:
    """Escribe exclusions.json en tmp_path y retorna el directorio."""
    config = tmp_path / 'exclusions.json'
    config.write_text(json.dumps(data), encoding='utf-8')
    return tmp_path


# ---------------------------------------------------------------------------
# Escenario 1: archivo ausente → ExclusionConfig vacío
# ---------------------------------------------------------------------------

def test_missing_config_returns_empty(tmp_path: Path) -> None:
    """Si exclusions.json no existe retorna ExclusionConfig con ambos sets vacíos."""
    result = load_exclusion_config(tmp_path)

    assert result == ExclusionConfig()
    assert len(result.atom_files) == 0
    assert len(result.copy_files) == 0


# ---------------------------------------------------------------------------
# Escenario 2: array vacío [] → ExclusionConfig vacío
# ---------------------------------------------------------------------------

def test_empty_array_returns_empty(tmp_path: Path) -> None:
    """Un JSON con array vacío retorna ExclusionConfig sin exclusiones."""
    write_exclusions(tmp_path, [])
    result = load_exclusion_config(tmp_path)

    assert result == ExclusionConfig()
    assert len(result.atom_files) == 0
    assert len(result.copy_files) == 0


# ---------------------------------------------------------------------------
# Escenario 3: exclude-copy: true → aparece en AMBOS sets (normalización)
# ---------------------------------------------------------------------------

def test_exclude_copy_true_adds_to_both_sets(tmp_path: Path) -> None:
    """exclude-copy:true normaliza el archivo en atom_files y copy_files."""
    write_exclusions(tmp_path, [
        {'file': 'document.md', 'exclude-copy': True, 'exclude-atom': False},
    ])
    result = load_exclusion_config(tmp_path)

    assert 'document.md' in result.atom_files
    assert 'document.md' in result.copy_files


def test_exclude_copy_true_without_atom_flag_still_adds_to_both(tmp_path: Path) -> None:
    """exclude-copy:true agrega a ambos sets independientemente de exclude-atom."""
    write_exclusions(tmp_path, [
        {'file': 'document.md', 'exclude-copy': True},
    ])
    result = load_exclusion_config(tmp_path)

    assert 'document.md' in result.atom_files
    assert 'document.md' in result.copy_files


# ---------------------------------------------------------------------------
# Escenario 4: exclude-atom: true, exclude-copy: false → sólo en atom_files
# ---------------------------------------------------------------------------

def test_exclude_atom_only_adds_to_atom_files(tmp_path: Path) -> None:
    """exclude-atom:true con exclude-copy:false agrega sólo a atom_files."""
    write_exclusions(tmp_path, [
        {'file': 'document.md', 'exclude-atom': True, 'exclude-copy': False},
    ])
    result = load_exclusion_config(tmp_path)

    assert 'document.md' in result.atom_files
    assert 'document.md' not in result.copy_files


# ---------------------------------------------------------------------------
# Escenario 5: ambos false → archivo no aparece en ningún set
# ---------------------------------------------------------------------------

def test_both_false_adds_to_neither_set(tmp_path: Path) -> None:
    """Con exclude-atom y exclude-copy en false el archivo no se excluye."""
    write_exclusions(tmp_path, [
        {'file': 'document.md', 'exclude-atom': False, 'exclude-copy': False},
    ])
    result = load_exclusion_config(tmp_path)

    assert 'document.md' not in result.atom_files
    assert 'document.md' not in result.copy_files


# ---------------------------------------------------------------------------
# Escenario 6: campos _comment en entradas JSON son ignorados (sin crash)
# ---------------------------------------------------------------------------

def test_comment_fields_are_ignored(tmp_path: Path) -> None:
    """Los campos _comment en entradas JSON no provocan error."""
    write_exclusions(tmp_path, [
        {
            '_comment': 'Este archivo se excluye porque es solo referencia',
            'file': 'reference.md',
            'exclude-atom': True,
            'exclude-copy': False,
        },
    ])
    result = load_exclusion_config(tmp_path)

    assert 'reference.md' in result.atom_files
    assert 'reference.md' not in result.copy_files


def test_comment_only_entry_is_skipped(tmp_path: Path) -> None:
    """Una entrada con solo _comment y sin 'file' no provoca error."""
    write_exclusions(tmp_path, [
        {'_comment': 'Entrada de comentario sin archivo'},
    ])
    result = load_exclusion_config(tmp_path)

    assert result == ExclusionConfig()


# ---------------------------------------------------------------------------
# Escenario 7: JSON malformado → retorna ExclusionConfig vacío sin crash
# ---------------------------------------------------------------------------

def test_malformed_json_returns_empty(tmp_path: Path) -> None:
    """JSON invalido retorna ExclusionConfig vacio en lugar de lanzar excepcion."""
    config = tmp_path / 'exclusions.json'
    config.write_text('{esto no es json valido}}', encoding='utf-8')

    result = load_exclusion_config(tmp_path)

    assert result == ExclusionConfig()
    assert len(result.atom_files) == 0
    assert len(result.copy_files) == 0


# ---------------------------------------------------------------------------
# Escenario 8: ExclusionConfig es frozen/inmutable
# ---------------------------------------------------------------------------

def test_exclusion_config_is_frozen(tmp_path: Path) -> None:
    """ExclusionConfig lanza FrozenInstanceError al intentar mutar un campo."""
    write_exclusions(tmp_path, [
        {'file': 'doc.md', 'exclude-atom': True},
    ])
    result = load_exclusion_config(tmp_path)

    with pytest.raises(Exception):
        # dataclass(frozen=True) lanza dataclasses.FrozenInstanceError
        result.atom_files = frozenset()  # type: ignore[misc]


def test_exclusion_config_frozensets_are_immutable(tmp_path: Path) -> None:
    """Los frozenset[str] no tienen metodo add/discard: son inmutables."""
    write_exclusions(tmp_path, [])
    result = load_exclusion_config(tmp_path)

    assert not hasattr(result.atom_files, 'add')
    assert not hasattr(result.copy_files, 'add')


# ---------------------------------------------------------------------------
# Multiples entradas — verificacion de colecciones
# ---------------------------------------------------------------------------

def test_multiple_entries_populate_correctly(tmp_path: Path) -> None:
    """Varios archivos con distintos flags se distribuyen correctamente."""
    write_exclusions(tmp_path, [
        {'file': 'a.md', 'exclude-copy': True},
        {'file': 'b.md', 'exclude-atom': True, 'exclude-copy': False},
        {'file': 'c.md', 'exclude-atom': False, 'exclude-copy': False},
    ])
    result = load_exclusion_config(tmp_path)

    assert result.atom_files == frozenset({'a.md', 'b.md'})
    assert result.copy_files == frozenset({'a.md'})
    assert 'c.md' not in result.atom_files
    assert 'c.md' not in result.copy_files
