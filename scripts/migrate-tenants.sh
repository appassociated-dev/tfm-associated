#!/usr/bin/env bash
# =============================================================
# migrate-tenants.sh — Ejecuta migraciones Prisma en todas las
# bases de datos de tenant registradas en la BD principal.
#
# Uso: ./scripts/migrate-tenants.sh
#
# Requisitos:
#   - postgresql-client (psql) instalado
#   - Variables de entorno: DATABASE_MAIN_URL, DATABASE_TENANT_URL
#   - npx prisma disponible en PATH
#
# El script NO interrumpe el despliegue si un tenant falla.
# Registra errores detallados y sale con codigo 1 si hubo fallos.
# =============================================================

set -euo pipefail

# --- Validacion de variables de entorno ---
if [[ -z "${DATABASE_MAIN_URL:-}" ]]; then
  echo "[ERROR] DATABASE_MAIN_URL no esta definida" >&2
  exit 1
fi

if [[ -z "${DATABASE_TENANT_URL:-}" ]]; then
  echo "[ERROR] DATABASE_TENANT_URL no esta definida" >&2
  exit 1
fi

# --- Consultar todas las bases de datos de tenant ---
echo "[INFO] Consultando tenants desde la base de datos principal..."

TENANT_DBS=$(psql "${DATABASE_MAIN_URL}" \
  --tuples-only \
  --no-align \
  --command="SELECT database_name FROM tenants" 2>&1) || {
  echo "[ERROR] No se pudo consultar la tabla tenants: ${TENANT_DBS}" >&2
  exit 1
}

# Filtrar lineas vacias
TENANT_DBS=$(echo "${TENANT_DBS}" | sed '/^$/d')

if [[ -z "${TENANT_DBS}" ]]; then
  echo "[INFO] No se encontraron tenants. Nada que migrar."
  exit 0
fi

TENANT_COUNT=$(echo "${TENANT_DBS}" | wc -l | tr -d ' ')
echo "[INFO] Encontrados ${TENANT_COUNT} tenant(s) para migrar."

# --- Extraer host, puerto y credenciales de DATABASE_MAIN_URL ---
# Formato: postgresql://user:pass@host:port/dbname?params
MAIN_URL_BASE=$(echo "${DATABASE_MAIN_URL}" | sed 's|/[^/]*\?.*$||; s|/[^/]*$||')

# --- Migrar cada tenant ---
FAILED_COUNT=0
FAILED_TENANTS=""

while IFS= read -r DB_NAME; do
  # Saltar lineas vacias
  [[ -z "${DB_NAME}" ]] && continue

  echo "[INFO] Migrando tenant: ${DB_NAME}..."

  # Construir URL de conexion para este tenant usando las credenciales admin
  TENANT_URL="${MAIN_URL_BASE}/${DB_NAME}?schema=public"

  # Ejecutar migraciones Prisma
  MIGRATION_OUTPUT=$(DATABASE_TENANT_URL="${TENANT_URL}" \
    npx prisma migrate deploy \
    --config=api/prisma/tenant/prisma.config.ts 2>&1) || {
    FAILED_COUNT=$((FAILED_COUNT + 1))
    FAILED_TENANTS="${FAILED_TENANTS}\n  - ${DB_NAME}"

    echo "[ERROR] Fallo en migracion del tenant: ${DB_NAME}" >&2
    echo "[ERROR] Salida de Prisma:" >&2
    echo "${MIGRATION_OUTPUT}" >&2
    echo "---" >&2

    # Continuar con el siguiente tenant (no interrumpir el despliegue)
    continue
  }

  echo "[OK] Tenant migrado: ${DB_NAME}"
done <<< "${TENANT_DBS}"

# --- Resumen final ---
echo ""
echo "========================================="
echo " Migracion de tenants completada"
echo " Total: ${TENANT_COUNT} | Exitosos: $((TENANT_COUNT - FAILED_COUNT)) | Fallidos: ${FAILED_COUNT}"
echo "========================================="

if [[ ${FAILED_COUNT} -gt 0 ]]; then
  echo ""
  echo "[WARN] Tenants con errores:${FAILED_TENANTS}" >&2
  echo ""
  echo "[WARN] Revise los errores anteriores para detalles de cada fallo." >&2
  exit 1
fi

exit 0
