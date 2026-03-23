#!/bin/bash
# ============================================
# Seed de datos para testing manual - Frontend Fase 1
# ============================================
# Uso: bash doc/manual-testing/seed-data.sh
#
# Prerequisitos:
#   - Docker Compose levantado (docker compose up -d)
#   - API corriendo en localhost:3000
#   - jq instalado (apt install jq / brew install jq)
#
# Datos que crea:
#   1. Tenant "Pena El Tio Pepe" (CIF: B44021814)
#   2. Usuario admin: admin@eltiopepe.es / Admin123!
#   3. 3 tipos de socio: Adulto, Juvenil, Infantil
#   4. 4 planes de cuota: Mensual, Trimestral, Anual, Inscripcion
#   5. Ejercicio fiscal 2026
#   6. Vinculacion de planes a tipos de socio
# ============================================

set -euo pipefail

API_URL="http://localhost:3000/api"
SUPERADMIN_API_KEY="${SUPERADMIN_API_KEY:-dev-superadmin-key}"

# ─── Colores para output ─────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail()  { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }
title() { echo -e "\n${CYAN}${BOLD}═══ $1 ═══${NC}"; }

# ─── Verificar dependencias ──────────────────────────────────────
command -v curl >/dev/null 2>&1 || fail "curl no esta instalado"
command -v jq >/dev/null 2>&1   || fail "jq no esta instalado (apt install jq / brew install jq)"

# ─── Verificar que la API esta corriendo ─────────────────────────
title "Verificando conexion con la API"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/v1/auth/me" 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "000" ]; then
  fail "No se puede conectar con la API en ${API_URL}. Verificar que Docker Compose esta levantado."
fi
info "API accesible en ${API_URL} (status: ${HTTP_STATUS})"

# ═══════════════════════════════════════════════════════════════════
# PASO 1: Provisionar tenant
# ═══════════════════════════════════════════════════════════════════
title "Paso 1: Provisionando tenant"

PROVISION_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/v1/tenants" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: ${SUPERADMIN_API_KEY}" \
  -d '{
    "name": "Pena El Tio Pepe",
    "cif": "B44021814",
    "collectivityType": "PENA",
    "contactEmail": "contacto@eltiopepe.es",
    "adminName": "Administrador",
    "adminEmail": "admin@eltiopepe.es",
    "adminPassword": "Admin123!"
  }')

PROVISION_STATUS=$(echo "$PROVISION_RESPONSE" | tail -1)
PROVISION_BODY=$(echo "$PROVISION_RESPONSE" | sed '$d')

if [ "$PROVISION_STATUS" != "201" ]; then
  echo "$PROVISION_BODY" | jq . 2>/dev/null || echo "$PROVISION_BODY"
  fail "Error provisionando tenant (HTTP ${PROVISION_STATUS})"
fi

TENANT_ID=$(echo "$PROVISION_BODY" | jq -r '.tenantId')
TENANT_SLUG=$(echo "$PROVISION_BODY" | jq -r '.slug')
ADMIN_USER_ID=$(echo "$PROVISION_BODY" | jq -r '.adminUserId')

info "Tenant creado: ${TENANT_ID} (slug: ${TENANT_SLUG})"
info "Admin user: ${ADMIN_USER_ID}"

# ═══════════════════════════════════════════════════════════════════
# PASO 2: Login como admin
# ═══════════════════════════════════════════════════════════════════
title "Paso 2: Login como admin"

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@eltiopepe.es",
    "password": "Admin123!"
  }')

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

info "Login exitoso — rol: ${USER_ROLE}, tenant: ${LOGIN_TENANT_ID}"

# Cabeceras comunes para endpoints autenticados
AUTH_HEADER="Authorization: Bearer ${ACCESS_TOKEN}"
TENANT_HEADER="X-Tenant-Id: ${LOGIN_TENANT_ID}"

# ═══════════════════════════════════════════════════════════════════
# PASO 3: Crear tipos de socio
# ═══════════════════════════════════════════════════════════════════
title "Paso 3: Creando tipos de socio"

# --- Adulto ---
MT_ADULTO_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/v1/member-types" \
  -H "Content-Type: application/json" \
  -H "${AUTH_HEADER}" \
  -H "${TENANT_HEADER}" \
  -d '{
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
  }')

MT_ADULTO_STATUS=$(echo "$MT_ADULTO_RESPONSE" | tail -1)
MT_ADULTO_BODY=$(echo "$MT_ADULTO_RESPONSE" | sed '$d')

if [ "$MT_ADULTO_STATUS" != "201" ]; then
  echo "$MT_ADULTO_BODY" | jq . 2>/dev/null || echo "$MT_ADULTO_BODY"
  fail "Error creando tipo Adulto (HTTP ${MT_ADULTO_STATUS})"
fi

MT_ADULTO_ID=$(echo "$MT_ADULTO_BODY" | jq -r '.id')
info "Tipo ADULTO creado: ${MT_ADULTO_ID}"

# --- Juvenil ---
MT_JUVENIL_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/v1/member-types" \
  -H "Content-Type: application/json" \
  -H "${AUTH_HEADER}" \
  -H "${TENANT_HEADER}" \
  -d '{
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
  }')

MT_JUVENIL_STATUS=$(echo "$MT_JUVENIL_RESPONSE" | tail -1)
MT_JUVENIL_BODY=$(echo "$MT_JUVENIL_RESPONSE" | sed '$d')

if [ "$MT_JUVENIL_STATUS" != "201" ]; then
  echo "$MT_JUVENIL_BODY" | jq . 2>/dev/null || echo "$MT_JUVENIL_BODY"
  fail "Error creando tipo Juvenil (HTTP ${MT_JUVENIL_STATUS})"
fi

MT_JUVENIL_ID=$(echo "$MT_JUVENIL_BODY" | jq -r '.id')
info "Tipo JUVENIL creado: ${MT_JUVENIL_ID}"

# --- Infantil ---
MT_INFANTIL_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/v1/member-types" \
  -H "Content-Type: application/json" \
  -H "${AUTH_HEADER}" \
  -H "${TENANT_HEADER}" \
  -d '{
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
  }')

MT_INFANTIL_STATUS=$(echo "$MT_INFANTIL_RESPONSE" | tail -1)
MT_INFANTIL_BODY=$(echo "$MT_INFANTIL_RESPONSE" | sed '$d')

if [ "$MT_INFANTIL_STATUS" != "201" ]; then
  echo "$MT_INFANTIL_BODY" | jq . 2>/dev/null || echo "$MT_INFANTIL_BODY"
  fail "Error creando tipo Infantil (HTTP ${MT_INFANTIL_STATUS})"
fi

MT_INFANTIL_ID=$(echo "$MT_INFANTIL_BODY" | jq -r '.id')
info "Tipo INFANTIL creado: ${MT_INFANTIL_ID}"

# ═══════════════════════════════════════════════════════════════════
# PASO 4: Crear planes de cuota
# ═══════════════════════════════════════════════════════════════════
title "Paso 4: Creando planes de cuota"

# --- Cuota Mensual (15 EUR) ---
FP_MENSUAL_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/v1/treasury/fee-plans" \
  -H "Content-Type: application/json" \
  -H "${AUTH_HEADER}" \
  -H "${TENANT_HEADER}" \
  -d '{
    "code": "CUOTA-MENSUAL",
    "name": "Cuota Mensual",
    "description": "Cuota mensual de 15 EUR",
    "type": "RECURRING",
    "frequency": "MONTHLY",
    "amount": 1500,
    "billingMonths": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  }')

FP_MENSUAL_STATUS=$(echo "$FP_MENSUAL_RESPONSE" | tail -1)
FP_MENSUAL_BODY=$(echo "$FP_MENSUAL_RESPONSE" | sed '$d')

if [ "$FP_MENSUAL_STATUS" != "201" ]; then
  echo "$FP_MENSUAL_BODY" | jq . 2>/dev/null || echo "$FP_MENSUAL_BODY"
  fail "Error creando plan Mensual (HTTP ${FP_MENSUAL_STATUS})"
fi

FP_MENSUAL_ID=$(echo "$FP_MENSUAL_BODY" | jq -r '.id')
info "Plan CUOTA-MENSUAL creado: ${FP_MENSUAL_ID} (15.00 EUR)"

# --- Cuota Trimestral (40 EUR) ---
FP_TRIMESTRAL_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/v1/treasury/fee-plans" \
  -H "Content-Type: application/json" \
  -H "${AUTH_HEADER}" \
  -H "${TENANT_HEADER}" \
  -d '{
    "code": "CUOTA-TRIMESTRAL",
    "name": "Cuota Trimestral",
    "description": "Cuota trimestral de 40 EUR",
    "type": "RECURRING",
    "frequency": "QUARTERLY",
    "amount": 4000,
    "billingMonths": [1, 4, 7, 10]
  }')

FP_TRIMESTRAL_STATUS=$(echo "$FP_TRIMESTRAL_RESPONSE" | tail -1)
FP_TRIMESTRAL_BODY=$(echo "$FP_TRIMESTRAL_RESPONSE" | sed '$d')

if [ "$FP_TRIMESTRAL_STATUS" != "201" ]; then
  echo "$FP_TRIMESTRAL_BODY" | jq . 2>/dev/null || echo "$FP_TRIMESTRAL_BODY"
  fail "Error creando plan Trimestral (HTTP ${FP_TRIMESTRAL_STATUS})"
fi

FP_TRIMESTRAL_ID=$(echo "$FP_TRIMESTRAL_BODY" | jq -r '.id')
info "Plan CUOTA-TRIMESTRAL creado: ${FP_TRIMESTRAL_ID} (40.00 EUR)"

# --- Cuota Anual (120 EUR) ---
FP_ANUAL_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/v1/treasury/fee-plans" \
  -H "Content-Type: application/json" \
  -H "${AUTH_HEADER}" \
  -H "${TENANT_HEADER}" \
  -d '{
    "code": "CUOTA-ANUAL",
    "name": "Cuota Anual",
    "description": "Cuota anual de 120 EUR",
    "type": "RECURRING",
    "frequency": "ANNUAL",
    "amount": 12000,
    "billingMonths": [1]
  }')

FP_ANUAL_STATUS=$(echo "$FP_ANUAL_RESPONSE" | tail -1)
FP_ANUAL_BODY=$(echo "$FP_ANUAL_RESPONSE" | sed '$d')

if [ "$FP_ANUAL_STATUS" != "201" ]; then
  echo "$FP_ANUAL_BODY" | jq . 2>/dev/null || echo "$FP_ANUAL_BODY"
  fail "Error creando plan Anual (HTTP ${FP_ANUAL_STATUS})"
fi

FP_ANUAL_ID=$(echo "$FP_ANUAL_BODY" | jq -r '.id')
info "Plan CUOTA-ANUAL creado: ${FP_ANUAL_ID} (120.00 EUR)"

# --- Inscripcion (50 EUR, unica vez) ---
FP_INSCRIPCION_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/v1/treasury/fee-plans" \
  -H "Content-Type: application/json" \
  -H "${AUTH_HEADER}" \
  -H "${TENANT_HEADER}" \
  -d '{
    "code": "INSCRIPCION",
    "name": "Cuota de Inscripcion",
    "description": "Cuota unica de inscripcion (50 EUR)",
    "type": "ONE_TIME",
    "frequency": "ANNUAL",
    "amount": 5000,
    "billingMonths": []
  }')

FP_INSCRIPCION_STATUS=$(echo "$FP_INSCRIPCION_RESPONSE" | tail -1)
FP_INSCRIPCION_BODY=$(echo "$FP_INSCRIPCION_RESPONSE" | sed '$d')

if [ "$FP_INSCRIPCION_STATUS" != "201" ]; then
  echo "$FP_INSCRIPCION_BODY" | jq . 2>/dev/null || echo "$FP_INSCRIPCION_BODY"
  fail "Error creando plan Inscripcion (HTTP ${FP_INSCRIPCION_STATUS})"
fi

FP_INSCRIPCION_ID=$(echo "$FP_INSCRIPCION_BODY" | jq -r '.id')
info "Plan INSCRIPCION creado: ${FP_INSCRIPCION_ID} (50.00 EUR)"

# ═══════════════════════════════════════════════════════════════════
# PASO 5: Abrir ejercicio fiscal 2026
# ═══════════════════════════════════════════════════════════════════
title "Paso 5: Abriendo ejercicio fiscal 2026"

FY_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/v1/fiscal-years" \
  -H "Content-Type: application/json" \
  -H "${AUTH_HEADER}" \
  -H "${TENANT_HEADER}" \
  -d '{
    "name": "Ejercicio 2026",
    "type": "NATURAL_YEAR",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "carryOverMembers": false,
    "applyAutomaticTransitions": false
  }')

FY_STATUS=$(echo "$FY_RESPONSE" | tail -1)
FY_BODY=$(echo "$FY_RESPONSE" | sed '$d')

if [ "$FY_STATUS" != "201" ]; then
  echo "$FY_BODY" | jq . 2>/dev/null || echo "$FY_BODY"
  warn "No se pudo crear el ejercicio fiscal (HTTP ${FY_STATUS}). Puede que el endpoint no este implementado o ya exista."
  FY_ID="N/A"
else
  FY_ID=$(echo "$FY_BODY" | jq -r '.fiscalYear.id')
  info "Ejercicio fiscal 2026 creado: ${FY_ID}"
fi

# ═══════════════════════════════════════════════════════════════════
# PASO 6: Vincular planes de cuota a tipos de socio
# ═══════════════════════════════════════════════════════════════════
title "Paso 6: Vinculando planes de cuota a tipos de socio"

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

if [ "$LINK_MENSUAL_STATUS" != "204" ]; then
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

if [ "$LINK_TRIMESTRAL_STATUS" != "204" ]; then
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

if [ "$LINK_ANUAL_STATUS" != "204" ]; then
  LINK_ANUAL_BODY=$(echo "$LINK_ANUAL_RESPONSE" | sed '$d')
  echo "$LINK_ANUAL_BODY" | jq . 2>/dev/null || echo "$LINK_ANUAL_BODY"
  warn "Error vinculando CUOTA-ANUAL (HTTP ${LINK_ANUAL_STATUS})"
else
  info "CUOTA-ANUAL vinculado a: Adulto (default)"
fi

# ═══════════════════════════════════════════════════════════════════
# RESUMEN
# ═══════════════════════════════════════════════════════════════════
title "Resumen de datos creados"

echo -e "
${BOLD}Tenant${NC}
  Nombre:       Pena El Tio Pepe
  ID:           ${TENANT_ID}
  Slug:         ${TENANT_SLUG}

${BOLD}Admin${NC}
  Email:        admin@eltiopepe.es
  Password:     Admin123!
  User ID:      ${ADMIN_USER_ID}
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

${GREEN}${BOLD}Seed completado exitosamente.${NC}
Para usar el frontend, navegar a http://localhost:5173 e iniciar sesion con:
  Email:    admin@eltiopepe.es
  Password: Admin123!
"
