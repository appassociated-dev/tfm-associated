#!/bin/bash
# ============================================
# Seed de datos de produccion - Associated ERP
# ============================================
#
# Script de seed para entornos de produccion.
# A diferencia de doc/manual-testing/front-1/seed-data.sh (desarrollo),
# este script:
#   - Lee TODA la configuracion sensible desde variables de entorno
#   - No hardcodea credenciales ni URLs
#   - Es idempotente: puede re-ejecutarse sin errores (maneja conflictos 409)
#   - No imprime passwords en el resumen final
#
# Variables de entorno REQUERIDAS:
#   API_URL            - URL base de la API (ej: https://tudominio.com/api)
#   SUPERADMIN_API_KEY - Clave de API del superadmin para provisionar tenants
#   ADMIN_EMAIL        - Email del usuario administrador del tenant
#   ADMIN_PASSWORD     - Password del usuario administrador del tenant
#
# Variables de entorno OPCIONALES (con valores por defecto):
#   TENANT_NAME          - Nombre del tenant (default: "Pena El Tio Pepe")
#   TENANT_CIF           - CIF del tenant (default: "B44021814")
#   TENANT_TYPE          - Tipo de colectividad (default: "PENA")
#   TENANT_CONTACT_EMAIL - Email de contacto del tenant (default: "contacto@eltiopepe.es")
#   ADMIN_NAME           - Nombre del administrador (default: "Administrador")
#
# Datos que crea:
#   1. Tenant con los datos configurados
#   2. Usuario admin con las credenciales proporcionadas
#   3. 3 tipos de socio: Adulto, Juvenil, Infantil
#   4. 4 planes de cuota: Mensual, Trimestral, Anual, Inscripcion
#   5. Ejercicio fiscal 2026
#   6. Vinculacion de planes a tipos de socio
#
# Uso:
#   API_URL=https://tudominio.com/api \
#   SUPERADMIN_API_KEY=your-key \
#   ADMIN_EMAIL=admin@example.com \
#   ADMIN_PASSWORD=SecurePass123! \
#   bash scripts/seed-production.sh
#
# ============================================

set -euo pipefail

# ─── Colores para output ─────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1" >&2; }
fail()  { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }
title() { echo -e "\n${CYAN}${BOLD}=== $1 ===${NC}"; }

# ─── Verificar variables de entorno requeridas ─────────────────────
title "Verificando variables de entorno"

MISSING_VARS=()

if [ -z "${API_URL:-}" ]; then
  MISSING_VARS+=("API_URL")
fi
if [ -z "${SUPERADMIN_API_KEY:-}" ]; then
  MISSING_VARS+=("SUPERADMIN_API_KEY")
fi
if [ -z "${ADMIN_EMAIL:-}" ]; then
  MISSING_VARS+=("ADMIN_EMAIL")
fi
if [ -z "${ADMIN_PASSWORD:-}" ]; then
  MISSING_VARS+=("ADMIN_PASSWORD")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo -e "${RED}Las siguientes variables de entorno son obligatorias y no estan definidas:${NC}"
  for var in "${MISSING_VARS[@]}"; do
    echo -e "  ${RED}-${NC} ${var}"
  done
  echo ""
  echo "Ejemplo de uso:"
  echo "  API_URL=https://tudominio.com/api \\"
  echo "  SUPERADMIN_API_KEY=your-key \\"
  echo "  ADMIN_EMAIL=admin@example.com \\"
  echo "  ADMIN_PASSWORD=SecurePass123! \\"
  echo "  bash scripts/seed-production.sh"
  exit 1
fi

info "Todas las variables requeridas estan definidas"

# ─── Variables opcionales con valores por defecto ──────────────────
TENANT_NAME="${TENANT_NAME:-Pena El Tio Pepe}"
TENANT_CIF="${TENANT_CIF:-B44021814}"
TENANT_TYPE="${TENANT_TYPE:-PENA}"
TENANT_CONTACT_EMAIL="${TENANT_CONTACT_EMAIL:-contacto@eltiopepe.es}"
ADMIN_NAME="${ADMIN_NAME:-Administrador}"

info "API_URL: ${API_URL}"
info "ADMIN_EMAIL: ${ADMIN_EMAIL}"
info "TENANT_NAME: ${TENANT_NAME}"
info "TENANT_CIF: ${TENANT_CIF}"

# ─── Verificar dependencias ──────────────────────────────────────
command -v curl >/dev/null 2>&1 || fail "curl no esta instalado"
command -v jq >/dev/null 2>&1   || fail "jq no esta instalado (apt install jq / brew install jq)"

# ─── Variables globales de estado HTTP ──
LAST_HTTP_STATUS=""
LAST_WAS_CONFLICT=false

# ─── Funcion auxiliar para manejar respuestas HTTP con idempotencia ──
# Ejecuta un curl POST y maneja conflictos (409) de forma graceful.
# Argumentos:
#   $1 - Nombre descriptivo del recurso
#   $2 - URL del endpoint
#   $3 - JSON body
#   $4+ - Headers adicionales (opcionales)
# Retorna el body de la respuesta via stdout.
# Setea LAST_HTTP_STATUS como variable global.
# Setea LAST_WAS_CONFLICT=true si fue 409.
api_post() {
  local resource_name="$1"
  local url="$2"
  local body="$3"
  shift 3

  local headers=("-H" "Content-Type: application/json")
  while [ $# -gt 0 ]; do
    headers+=("-H" "$1")
    shift
  done

  local response
  response=$(curl -s -w "\n%{http_code}" -X POST "${url}" \
    "${headers[@]}" \
    -d "${body}")

  LAST_HTTP_STATUS=$(echo "$response" | tail -1)
  local response_body
  response_body=$(echo "$response" | sed '$d')

  LAST_WAS_CONFLICT=false

  if [ "$LAST_HTTP_STATUS" = "409" ]; then
    LAST_WAS_CONFLICT=true
    warn "${resource_name}: ya existe (HTTP 409) — continuando"
    echo "$response_body"
    return 0
  fi

  if [ "$LAST_HTTP_STATUS" != "201" ] && [ "$LAST_HTTP_STATUS" != "200" ] && [ "$LAST_HTTP_STATUS" != "204" ]; then
    echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
    fail "Error creando ${resource_name} (HTTP ${LAST_HTTP_STATUS})"
  fi

  echo "$response_body"
}

# ─── Verificar que la API esta corriendo ─────────────────────────
title "Verificando conexion con la API"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/v1/auth/me" 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "000" ]; then
  fail "No se puede conectar con la API en ${API_URL}. Verificar que el servicio esta levantado."
fi
info "API accesible en ${API_URL} (status: ${HTTP_STATUS})"

# ═══════════════════════════════════════════════════════════════════
# PASO 1: Provisionar tenant
# ═══════════════════════════════════════════════════════════════════
title "Paso 1: Provisionando tenant"

PROVISION_BODY=$(api_post "Tenant ${TENANT_NAME}" \
  "${API_URL}/v1/tenants" \
  "{
    \"name\": \"${TENANT_NAME}\",
    \"cif\": \"${TENANT_CIF}\",
    \"collectivityType\": \"${TENANT_TYPE}\",
    \"contactEmail\": \"${TENANT_CONTACT_EMAIL}\",
    \"adminName\": \"${ADMIN_NAME}\",
    \"adminEmail\": \"${ADMIN_EMAIL}\",
    \"adminPassword\": \"${ADMIN_PASSWORD}\"
  }" \
  "X-Api-Key: ${SUPERADMIN_API_KEY}")

if [ "$LAST_WAS_CONFLICT" = "true" ]; then
  warn "El tenant ya existia. Se intentara login para continuar con el seed."
  # En caso de conflicto, no tenemos el tenant ID del response.
  # Continuamos con login que nos dara el tenant ID.
  TENANT_ID="(ya existente)"
  TENANT_SLUG="(ya existente)"
  ADMIN_USER_ID="(ya existente)"
else
  TENANT_ID=$(echo "$PROVISION_BODY" | jq -r '.tenantId')
  TENANT_SLUG=$(echo "$PROVISION_BODY" | jq -r '.slug')
  ADMIN_USER_ID=$(echo "$PROVISION_BODY" | jq -r '.adminUserId')
  info "Tenant creado: ${TENANT_ID} (slug: ${TENANT_SLUG})"
  info "Admin user: ${ADMIN_USER_ID}"
fi

# ═══════════════════════════════════════════════════════════════════
# PASO 2: Login como admin
# ═══════════════════════════════════════════════════════════════════
title "Paso 2: Login como admin"

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${ADMIN_EMAIL}\",
    \"password\": \"${ADMIN_PASSWORD}\"
  }")

LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$LOGIN_STATUS" != "200" ]; then
  echo "$LOGIN_BODY" | jq . 2>/dev/null || echo "$LOGIN_BODY"
  fail "Error en login (HTTP ${LOGIN_STATUS})"
fi

ACCESS_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.accessToken')
REFRESH_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.refreshToken')
LOGIN_TENANT_ID=$(echo "$LOGIN_BODY" | jq -r '.tenant.id')
USER_ROLE=$(echo "$LOGIN_BODY" | jq -r '.role')

# Actualizar TENANT_ID con el valor real del login si fue conflicto
if [ "$TENANT_ID" = "(ya existente)" ]; then
  TENANT_ID="$LOGIN_TENANT_ID"
fi

info "Login exitoso — rol: ${USER_ROLE}, tenant: ${LOGIN_TENANT_ID}"

# Cabeceras comunes para endpoints autenticados
AUTH_HEADER="Authorization: Bearer ${ACCESS_TOKEN}"
TENANT_HEADER="X-Tenant-Id: ${LOGIN_TENANT_ID}"

# ═══════════════════════════════════════════════════════════════════
# PASO 3: Crear tipos de socio
# ═══════════════════════════════════════════════════════════════════
title "Paso 3: Creando tipos de socio"

# --- Adulto ---
MT_ADULTO_BODY=$(api_post "Tipo de socio ADULTO" \
  "${API_URL}/v1/member-types" \
  '{
    "code": "ADULTO",
    "name": "Socio Adulto",
    "description": "Socio mayor de edad con plenos derechos",
    "ageRangeMin": 18,
    "ageRangeMax": null,
    "votingRight": true,
    "eligibleForOffice": true,
    "minimumSeniorityForVoting": 0,
    "minimumSeniorityForOffice": 12,
    "rulesConfig": {}
  }' \
  "${AUTH_HEADER}" "${TENANT_HEADER}")

if [ "$LAST_WAS_CONFLICT" = "true" ]; then
  MT_ADULTO_ID="(ya existente)"
else
  MT_ADULTO_ID=$(echo "$MT_ADULTO_BODY" | jq -r '.id')
  info "Tipo ADULTO creado: ${MT_ADULTO_ID}"
fi

# --- Juvenil ---
MT_JUVENIL_BODY=$(api_post "Tipo de socio JUVENIL" \
  "${API_URL}/v1/member-types" \
  '{
    "code": "JUVENIL",
    "name": "Socio Juvenil",
    "description": "Socio entre 14 y 17 anios",
    "ageRangeMin": 14,
    "ageRangeMax": 17,
    "votingRight": false,
    "eligibleForOffice": false,
    "minimumSeniorityForVoting": 0,
    "minimumSeniorityForOffice": 0,
    "rulesConfig": {}
  }' \
  "${AUTH_HEADER}" "${TENANT_HEADER}")

if [ "$LAST_WAS_CONFLICT" = "true" ]; then
  MT_JUVENIL_ID="(ya existente)"
else
  MT_JUVENIL_ID=$(echo "$MT_JUVENIL_BODY" | jq -r '.id')
  info "Tipo JUVENIL creado: ${MT_JUVENIL_ID}"
fi

# --- Infantil ---
MT_INFANTIL_BODY=$(api_post "Tipo de socio INFANTIL" \
  "${API_URL}/v1/member-types" \
  '{
    "code": "INFANTIL",
    "name": "Socio Infantil",
    "description": "Socio menor de 14 anios",
    "ageRangeMin": 0,
    "ageRangeMax": 13,
    "votingRight": false,
    "eligibleForOffice": false,
    "minimumSeniorityForVoting": 0,
    "minimumSeniorityForOffice": 0,
    "rulesConfig": {}
  }' \
  "${AUTH_HEADER}" "${TENANT_HEADER}")

if [ "$LAST_WAS_CONFLICT" = "true" ]; then
  MT_INFANTIL_ID="(ya existente)"
else
  MT_INFANTIL_ID=$(echo "$MT_INFANTIL_BODY" | jq -r '.id')
  info "Tipo INFANTIL creado: ${MT_INFANTIL_ID}"
fi

# ═══════════════════════════════════════════════════════════════════
# PASO 4: Crear planes de cuota
# ═══════════════════════════════════════════════════════════════════
title "Paso 4: Creando planes de cuota"

# --- Cuota Mensual (15 EUR) ---
FP_MENSUAL_BODY=$(api_post "Plan CUOTA-MENSUAL" \
  "${API_URL}/v1/treasury/fee-plans" \
  '{
    "code": "CUOTA-MENSUAL",
    "name": "Cuota Mensual",
    "description": "Cuota mensual de 15 EUR",
    "type": "RECURRING",
    "frequency": "MONTHLY",
    "amount": 1500,
    "billingMonths": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  }' \
  "${AUTH_HEADER}" "${TENANT_HEADER}")

if [ "$LAST_WAS_CONFLICT" = "true" ]; then
  FP_MENSUAL_ID="(ya existente)"
else
  FP_MENSUAL_ID=$(echo "$FP_MENSUAL_BODY" | jq -r '.id')
  info "Plan CUOTA-MENSUAL creado: ${FP_MENSUAL_ID} (15.00 EUR)"
fi

# --- Cuota Trimestral (40 EUR) ---
FP_TRIMESTRAL_BODY=$(api_post "Plan CUOTA-TRIMESTRAL" \
  "${API_URL}/v1/treasury/fee-plans" \
  '{
    "code": "CUOTA-TRIMESTRAL",
    "name": "Cuota Trimestral",
    "description": "Cuota trimestral de 40 EUR",
    "type": "RECURRING",
    "frequency": "QUARTERLY",
    "amount": 4000,
    "billingMonths": [1, 4, 7, 10]
  }' \
  "${AUTH_HEADER}" "${TENANT_HEADER}")

if [ "$LAST_WAS_CONFLICT" = "true" ]; then
  FP_TRIMESTRAL_ID="(ya existente)"
else
  FP_TRIMESTRAL_ID=$(echo "$FP_TRIMESTRAL_BODY" | jq -r '.id')
  info "Plan CUOTA-TRIMESTRAL creado: ${FP_TRIMESTRAL_ID} (40.00 EUR)"
fi

# --- Cuota Anual (120 EUR) ---
FP_ANUAL_BODY=$(api_post "Plan CUOTA-ANUAL" \
  "${API_URL}/v1/treasury/fee-plans" \
  '{
    "code": "CUOTA-ANUAL",
    "name": "Cuota Anual",
    "description": "Cuota anual de 120 EUR",
    "type": "RECURRING",
    "frequency": "ANNUAL",
    "amount": 12000,
    "billingMonths": [1]
  }' \
  "${AUTH_HEADER}" "${TENANT_HEADER}")

if [ "$LAST_WAS_CONFLICT" = "true" ]; then
  FP_ANUAL_ID="(ya existente)"
else
  FP_ANUAL_ID=$(echo "$FP_ANUAL_BODY" | jq -r '.id')
  info "Plan CUOTA-ANUAL creado: ${FP_ANUAL_ID} (120.00 EUR)"
fi

# --- Inscripcion (50 EUR, unica vez) ---
FP_INSCRIPCION_BODY=$(api_post "Plan INSCRIPCION" \
  "${API_URL}/v1/treasury/fee-plans" \
  '{
    "code": "INSCRIPCION",
    "name": "Cuota de Inscripcion",
    "description": "Cuota unica de inscripcion (50 EUR)",
    "type": "ONE_TIME",
    "frequency": "ANNUAL",
    "amount": 5000,
    "billingMonths": []
  }' \
  "${AUTH_HEADER}" "${TENANT_HEADER}")

if [ "$LAST_WAS_CONFLICT" = "true" ]; then
  FP_INSCRIPCION_ID="(ya existente)"
else
  FP_INSCRIPCION_ID=$(echo "$FP_INSCRIPCION_BODY" | jq -r '.id')
  info "Plan INSCRIPCION creado: ${FP_INSCRIPCION_ID} (50.00 EUR)"
fi

# ═══════════════════════════════════════════════════════════════════
# PASO 5: Abrir ejercicio fiscal 2026
# ═══════════════════════════════════════════════════════════════════
title "Paso 5: Abriendo ejercicio fiscal 2026"

FY_BODY=$(api_post "Ejercicio fiscal 2026" \
  "${API_URL}/v1/fiscal-years" \
  '{
    "name": "Ejercicio 2026",
    "type": "NATURAL_YEAR",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "carryOverMembers": false,
    "applyAutomaticTransitions": false
  }' \
  "${AUTH_HEADER}" "${TENANT_HEADER}")

if [ "$LAST_WAS_CONFLICT" = "true" ]; then
  FY_ID="(ya existente)"
elif [ "$LAST_HTTP_STATUS" = "201" ]; then
  FY_ID=$(echo "$FY_BODY" | jq -r '.fiscalYear.id')
  info "Ejercicio fiscal 2026 creado: ${FY_ID}"
else
  FY_ID="N/A"
  warn "No se pudo determinar el ID del ejercicio fiscal"
fi

# ═══════════════════════════════════════════════════════════════════
# PASO 6: Vincular planes de cuota a tipos de socio
# ═══════════════════════════════════════════════════════════════════
title "Paso 6: Vinculando planes de cuota a tipos de socio"

# Nota: las vinculaciones solo se pueden hacer si los recursos fueron creados
# (no conflictos) porque necesitamos los IDs reales.
LINK_SKIPPED=false

if [ "$FP_MENSUAL_ID" = "(ya existente)" ] || [ "$MT_ADULTO_ID" = "(ya existente)" ] || [ "$MT_JUVENIL_ID" = "(ya existente)" ]; then
  warn "Saltando vinculaciones: se necesitan IDs reales de recursos recien creados."
  warn "Si los recursos ya existian, las vinculaciones probablemente ya estan configuradas."
  LINK_SKIPPED=true
fi

if [ "$LINK_SKIPPED" = "false" ]; then
  # --- Cuota Mensual -> Adulto (no default) + Juvenil (default) ---
  LINK_MENSUAL_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/v1/treasury/fee-plans/${FP_MENSUAL_ID}/link-member-types" \
    -H "Content-Type: application/json" \
    -H "${AUTH_HEADER}" \
    -H "${TENANT_HEADER}" \
    -d "{
      \"links\": [
        { \"memberTypeId\": \"${MT_ADULTO_ID}\", \"isDefault\": false, \"order\": 1 },
        { \"memberTypeId\": \"${MT_JUVENIL_ID}\", \"isDefault\": true, \"order\": 1 }
      ]
    }")

  LINK_MENSUAL_STATUS=$(echo "$LINK_MENSUAL_RESPONSE" | tail -1)

  if [ "$LINK_MENSUAL_STATUS" = "409" ]; then
    warn "Vinculacion CUOTA-MENSUAL ya existia (HTTP 409) — continuando"
  elif [ "$LINK_MENSUAL_STATUS" != "204" ]; then
    LINK_MENSUAL_BODY=$(echo "$LINK_MENSUAL_RESPONSE" | sed '$d')
    echo "$LINK_MENSUAL_BODY" | jq . 2>/dev/null || echo "$LINK_MENSUAL_BODY"
    warn "Error vinculando CUOTA-MENSUAL (HTTP ${LINK_MENSUAL_STATUS})"
  else
    info "CUOTA-MENSUAL vinculado a: Adulto, Juvenil (default)"
  fi

  # --- Cuota Trimestral -> Adulto (no default) ---
  LINK_TRIMESTRAL_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/v1/treasury/fee-plans/${FP_TRIMESTRAL_ID}/link-member-types" \
    -H "Content-Type: application/json" \
    -H "${AUTH_HEADER}" \
    -H "${TENANT_HEADER}" \
    -d "{
      \"links\": [
        { \"memberTypeId\": \"${MT_ADULTO_ID}\", \"isDefault\": false, \"order\": 2 }
      ]
    }")

  LINK_TRIMESTRAL_STATUS=$(echo "$LINK_TRIMESTRAL_RESPONSE" | tail -1)

  if [ "$LINK_TRIMESTRAL_STATUS" = "409" ]; then
    warn "Vinculacion CUOTA-TRIMESTRAL ya existia (HTTP 409) — continuando"
  elif [ "$LINK_TRIMESTRAL_STATUS" != "204" ]; then
    LINK_TRIMESTRAL_BODY=$(echo "$LINK_TRIMESTRAL_RESPONSE" | sed '$d')
    echo "$LINK_TRIMESTRAL_BODY" | jq . 2>/dev/null || echo "$LINK_TRIMESTRAL_BODY"
    warn "Error vinculando CUOTA-TRIMESTRAL (HTTP ${LINK_TRIMESTRAL_STATUS})"
  else
    info "CUOTA-TRIMESTRAL vinculado a: Adulto"
  fi

  # --- Cuota Anual -> Adulto (default) ---
  LINK_ANUAL_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/v1/treasury/fee-plans/${FP_ANUAL_ID}/link-member-types" \
    -H "Content-Type: application/json" \
    -H "${AUTH_HEADER}" \
    -H "${TENANT_HEADER}" \
    -d "{
      \"links\": [
        { \"memberTypeId\": \"${MT_ADULTO_ID}\", \"isDefault\": true, \"order\": 3 }
      ]
    }")

  LINK_ANUAL_STATUS=$(echo "$LINK_ANUAL_RESPONSE" | tail -1)

  if [ "$LINK_ANUAL_STATUS" = "409" ]; then
    warn "Vinculacion CUOTA-ANUAL ya existia (HTTP 409) — continuando"
  elif [ "$LINK_ANUAL_STATUS" != "204" ]; then
    LINK_ANUAL_BODY=$(echo "$LINK_ANUAL_RESPONSE" | sed '$d')
    echo "$LINK_ANUAL_BODY" | jq . 2>/dev/null || echo "$LINK_ANUAL_BODY"
    warn "Error vinculando CUOTA-ANUAL (HTTP ${LINK_ANUAL_STATUS})"
  else
    info "CUOTA-ANUAL vinculado a: Adulto (default)"
  fi
fi

# ═══════════════════════════════════════════════════════════════════
# RESUMEN
# ═══════════════════════════════════════════════════════════════════
title "Resumen de datos creados"

echo -e "
${BOLD}Tenant${NC}
  Nombre:       ${TENANT_NAME}
  CIF:          ${TENANT_CIF}
  ID:           ${TENANT_ID}

${BOLD}Admin${NC}
  Email:        ${ADMIN_EMAIL}
  Password:     (valor de la variable ADMIN_PASSWORD)
  Rol:          ${USER_ROLE}

${BOLD}Tipos de socio${NC}
  ADULTO:       ${MT_ADULTO_ID}
  JUVENIL:      ${MT_JUVENIL_ID}
  INFANTIL:     ${MT_INFANTIL_ID}

${BOLD}Planes de cuota${NC}
  CUOTA-MENSUAL:      ${FP_MENSUAL_ID}  (15.00 EUR, mensual)
  CUOTA-TRIMESTRAL:   ${FP_TRIMESTRAL_ID}  (40.00 EUR, trimestral)
  CUOTA-ANUAL:        ${FP_ANUAL_ID}  (120.00 EUR, anual)
  INSCRIPCION:        ${FP_INSCRIPCION_ID}  (50.00 EUR, unica vez)

${BOLD}Ejercicio fiscal${NC}
  2026:         ${FY_ID}

${BOLD}Vinculaciones plan-tipo${NC}
  CUOTA-MENSUAL    -> Adulto, Juvenil (default)
  CUOTA-TRIMESTRAL -> Adulto
  CUOTA-ANUAL      -> Adulto (default)

${GREEN}${BOLD}Seed de produccion completado exitosamente.${NC}
"
