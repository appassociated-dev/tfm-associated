#!/bin/bash
#
# Mueve los bloques de sesión de [Unreleased] en CHANGELOG.md a changelog-sessions.md
# y limpia la sección [Unreleased].
#
# Uso:
#   ./scripts/move_unreleased.sh <version>
#
# Ejemplo:
#   ./scripts/move_unreleased.sh 1.2.0

set -e

if [ $# -ne 1 ]; then
    echo "Uso: $0 <version>"
    echo "Ejemplo: $0 1.2.0"
    exit 1
fi

VERSION="$1"
CHANGELOG="CHANGELOG.md"
SESSIONS="doc/agents-sessions/changelog-sessions.md"
TODAY=$(date +%Y-%m-%d)
CONTENT_FILE=$(mktemp)
TMPFILE=$(mktemp)

cleanup() { rm -f "$CONTENT_FILE" "$TMPFILE"; }
trap cleanup EXIT

if [ ! -f "$CHANGELOG" ]; then
    echo "❌ No se encontró $CHANGELOG"
    exit 1
fi

# Extraer el contenido de [Unreleased] (entre ## [Unreleased] y el siguiente ## [)
# Omitir líneas en blanco iniciales antes del primer bloque de sesión
awk '/^## \[Unreleased\]/{f=1; next} /^## \[/{if(f) exit} f && /[^ \t]/{started=1} started{print}' "$CHANGELOG" > "$CONTENT_FILE"

# Verificar si ya está vacía
if grep -q "Vacío pendiente" "$CONTENT_FILE" || [ ! -s "$CONTENT_FILE" ]; then
    echo "⚠️  La sección [Unreleased] ya está vacía. Nada que mover."
    exit 0
fi

# Eliminar el --- final del contenido (solo los separadores de cierre del bloque)
# Buscar la última línea no vacía; si es ---, eliminarla
LAST_NONEMPTY=$(grep -v '^[[:space:]]*$' "$CONTENT_FILE" | tail -1)
if [ "$LAST_NONEMPTY" = "---" ]; then
    # Eliminar trailing --- y líneas en blanco finales
    awk 'NF{last=NR; lastline=$0} {lines[NR]=$0} END{
        for(i=1;i<=NR;i++){
            if(i==last && lastline=="---") continue
            print lines[i]
        }
    }' "$CONTENT_FILE" | sed -e 's/[[:space:]]*$//' | awk 'BEGIN{n=0} /^$/{n++; next} {for(i=0;i<n;i++) print ""; n=0; print}' > "${CONTENT_FILE}.tmp"
    mv "${CONTENT_FILE}.tmp" "$CONTENT_FILE"
fi

# Asegurar que existe el directorio de sesiones
mkdir -p "$(dirname "$SESSIONS")"

# Crear changelog-sessions.md si no existe
if [ ! -f "$SESSIONS" ]; then
    cat > "$SESSIONS" << 'EOF'
# Changelog de Sesiones

Histórico detallado de sesiones de trabajo trasladado desde [Unreleased] al cerrar cada versión.

---
EOF
fi

# Insertar el bloque después del primer --- en changelog-sessions.md
{
    awk '/^---$/{print; exit} {print}' "$SESSIONS"
    echo ""
    echo "## Sesiones del release [$VERSION] - $TODAY"
    echo ""
    cat "$CONTENT_FILE"
    echo ""
    echo "---"
    echo ""
    awk 'found{print} /^---$/ && !found{found=1}' "$SESSIONS"
} > "$TMPFILE"
mv "$TMPFILE" "$SESSIONS"
echo "✅ Bloques de sesión movidos a $SESSIONS"

# Limpiar [Unreleased] en CHANGELOG.md
awk '
    /^## \[Unreleased\]/{
        print
        print ""
        print "[Vacío pendiente de iniciar nuevas sesiones]"
        print ""
        print "---"
        print ""
        in_unreleased=1
        next
    }
    in_unreleased && /^## \[/{ in_unreleased=0 }
    in_unreleased{ next }
    { print }
' "$CHANGELOG" > "$TMPFILE"
mv "$TMPFILE" "$CHANGELOG"
echo "✅ Sección [Unreleased] limpiada en $CHANGELOG"
echo ""
echo "✅ Proceso completado para release [$VERSION]"
