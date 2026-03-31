#!/bin/bash
#
# Genera un borrador de sección versionada en CHANGELOG.md extrayendo
# las entradas en bruto de los bloques de sesión de [Unreleased].
#
# El agente debe revisar y refinar el borrador generado (deduplicar entradas,
# mejorar redacción y completar los campos marcados con [COMPLETAR]).
#
# Uso:
#   ./scripts/create_release_draft.sh <version> [--type TIPO]
#
# Ejemplo:
#   ./scripts/create_release_draft.sh 1.2.0 --type Minor

set -e

# Parsear argumentos
VERSION=""
RELEASE_TYPE="Patch"
while [ $# -gt 0 ]; do
    case $1 in
        --type) RELEASE_TYPE="$2"; shift 2 ;;
        *) VERSION="$1"; shift ;;
    esac
done

if [ -z "$VERSION" ]; then
    echo "Uso: $0 <version> [--type TIPO]"
    echo "Ejemplo: $0 1.2.0 --type Minor"
    exit 1
fi

CHANGELOG="CHANGELOG.md"
CONTENT_FILE=$(mktemp)
DRAFT_FILE=$(mktemp)
ADDED_FILE=$(mktemp)
CHANGED_FILE=$(mktemp)
FIXED_FILE=$(mktemp)
REMOVED_FILE=$(mktemp)
TMPFILE=$(mktemp)

cleanup() { rm -f "$CONTENT_FILE" "$DRAFT_FILE" "$ADDED_FILE" "$CHANGED_FILE" "$FIXED_FILE" "$REMOVED_FILE" "$TMPFILE"; }
trap cleanup EXIT

if [ ! -f "$CHANGELOG" ]; then
    echo "❌ No se encontró $CHANGELOG"
    exit 1
fi

# Verificar que no existe ya la sección versionada
if grep -q "^## \[$VERSION\]" "$CHANGELOG"; then
    echo "⚠️  La sección [$VERSION] ya existe en CHANGELOG.md."
    exit 0
fi

# Extraer contenido de [Unreleased] (omitir líneas en blanco iniciales)
awk '/^## \[Unreleased\]/{f=1; next} /^## \[/{if(f) exit} f && /[^ \t]/{started=1} started{print}' "$CHANGELOG" > "$CONTENT_FILE"

# Verificar si está vacía
if grep -q "Vacío pendiente" "$CONTENT_FILE" || [ ! -s "$CONTENT_FILE" ]; then
    echo "⚠️  La sección [Unreleased] está vacía. Nada que procesar."
    exit 0
fi

# Extraer entradas por categoría a archivos temporales
awk -v added="$ADDED_FILE" -v changed="$CHANGED_FILE" -v fixed="$FIXED_FILE" -v removed="$REMOVED_FILE" '
    /^#### Added/{cat="added"; next}
    /^#### Changed/{cat="changed"; next}
    /^#### Fixed/{cat="fixed"; next}
    /^#### Removed/{cat="removed"; next}
    /^#### |^### |^---/{cat=""; next}
    cat=="added"   && /^- /{print >> added}
    cat=="changed" && /^- /{print >> changed}
    cat=="fixed"   && /^- /{print >> fixed}
    cat=="removed" && /^- /{print >> removed}
' "$CONTENT_FILE"

# Extraer enlaces a archivos de sesión
SESSION_LINKS=$(grep '\*\*Documento de sesión' "$CONTENT_FILE" | \
    sed 's/.*\[.*\](\(.*\))/    - [\1](\1)/')

# Periodo de desarrollo: fecha de la sesión más antigua → hoy
OLDEST_DATE=$(grep '^### [0-9]' "$CONTENT_FILE" | tail -1 | sed 's/^### \([0-9]\{8\}\).*/\1/')
if [ -n "$OLDEST_DATE" ]; then
    PERIOD_START="${OLDEST_DATE:6:2}/${OLDEST_DATE:4:2}/${OLDEST_DATE:0:4}"
else
    PERIOD_START="[COMPLETAR]"
fi
PERIOD_END=$(date +%d/%m/%Y)

# Información de git
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -n "$LAST_TAG" ]; then
    COMMIT_LOG=$(git log --oneline "$LAST_TAG..HEAD" 2>/dev/null || echo "")
else
    COMMIT_LOG=$(git log --oneline 2>/dev/null || echo "")
fi

if [ -n "$COMMIT_LOG" ]; then
    COMMIT_COUNT=$(echo "$COMMIT_LOG" | wc -l | tr -d ' ')
    FIRST_HASH=$(echo "$COMMIT_LOG" | tail -1 | awk '{print $1}')
    LAST_HASH=$(echo "$COMMIT_LOG" | head -1 | awk '{print $1}')
else
    COMMIT_COUNT="?"; FIRST_HASH="?"; LAST_HASH="?"
fi

# Formatear fecha en español
TODAY_SHORT=$(date +%Y-%m-%d)
DAY=$(date +%d | sed 's/^0//')
MONTH_NUM=$(date +%m | sed 's/^0//')
YEAR=$(date +%Y)
case "$MONTH_NUM" in
    1)  MONTH_NAME="enero" ;;     2)  MONTH_NAME="febrero" ;;
    3)  MONTH_NAME="marzo" ;;     4)  MONTH_NAME="abril" ;;
    5)  MONTH_NAME="mayo" ;;      6)  MONTH_NAME="junio" ;;
    7)  MONTH_NAME="julio" ;;     8)  MONTH_NAME="agosto" ;;
    9)  MONTH_NAME="septiembre" ;; 10) MONTH_NAME="octubre" ;;
    11) MONTH_NAME="noviembre" ;; 12) MONTH_NAME="diciembre" ;;
esac
TODAY_LONG="$DAY de $MONTH_NAME de $YEAR"

# Función para formatear una categoría
format_category() {
    local name="$1"
    local file="$2"
    echo "### $name"
    echo ""
    if [ -s "$file" ]; then
        cat "$file"
    else
        echo "[Sin cambios]"
    fi
}

# Construir el borrador
{
    echo "## [$VERSION] - $TODAY_SHORT"
    echo ""
    echo "* **Fecha de release:** $TODAY_LONG"
    echo "* **Tipo:** $RELEASE_TYPE"
    echo "* **Periodo de desarrollo:** $PERIOD_START – $PERIOD_END"
    echo "* **Commits:** $COMMIT_COUNT commits desde \`$FIRST_HASH\` hasta \`$LAST_HASH\`"
    echo "* **Cobertura de tests:** [COMPLETAR]"
    echo "* **Tests:** [COMPLETAR]"
    echo "* **Sesiones de trabajo:**"
    echo "$SESSION_LINKS"
    echo ""
    echo "> ⚠️ BORRADOR: Revisar entradas duplicadas, mejorar redacción y reemplazar los [COMPLETAR]."
    echo ""
    format_category "Added" "$ADDED_FILE"
    echo ""
    format_category "Changed" "$CHANGED_FILE"
    echo ""
    format_category "Fixed" "$FIXED_FILE"
    echo ""
    format_category "Removed" "$REMOVED_FILE"
    echo ""
    echo "---"
} > "$DRAFT_FILE"

# Insertar el borrador antes de la primera sección versionada
awk -v draftfile="$DRAFT_FILE" '
    /^## \[[0-9]/ && !done {
        print ""
        while ((getline line < draftfile) > 0) print line
        close(draftfile)
        print ""
        done=1
    }
    { print }
' "$CHANGELOG" > "$TMPFILE"
mv "$TMPFILE" "$CHANGELOG"

echo "✅ Borrador [$VERSION] generado en $CHANGELOG"
echo ""
echo "⚠️  Pendiente para el agente:"
echo "   1. Revisar y deduplicar entradas"
echo "   2. Completar los campos [COMPLETAR] (tests, cobertura)"
echo "   3. Ejecutar move_unreleased.sh $VERSION"
