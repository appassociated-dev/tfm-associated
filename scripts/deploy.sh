#!/usr/bin/env bash
# =============================================================
# deploy.sh — Script de despliegue manual para Associated
#
# Construye imagenes Docker, las sube a GHCR y despliega en el VPS.
#
# Uso:
#   ./scripts/deploy.sh                    # Desplegar con tag 'latest'
#   ./scripts/deploy.sh --tag v1.0.0       # Desplegar con tag especifico
#   ./scripts/deploy.sh --build-only       # Solo construir y subir, sin deploy
#
# Requisitos:
#   - Docker y Docker Compose instalados localmente
#   - Autenticacion en GHCR: docker login ghcr.io -u USUARIO -p TOKEN
#   - Acceso SSH al VPS configurado (ssh-key)
#
# Variables de entorno requeridas:
#   VPS_HOST    — Direccion IP o hostname del VPS
#   VPS_USER    — Usuario SSH del VPS (default: root)
# =============================================================

set -euo pipefail

# --- Colores para output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # Sin color

# --- Funciones de utilidad ---
info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }
step()    { echo -e "\n${CYAN}========================================${NC}"; echo -e "${CYAN}  $*${NC}"; echo -e "${CYAN}========================================${NC}\n"; }

# --- Configuracion ---
GHCR_REGISTRY="ghcr.io/appassociated-dev"
API_IMAGE="${GHCR_REGISTRY}/associated-api"
WEB_IMAGE="${GHCR_REGISTRY}/associated-web"
COMPOSE_FILE="docker-compose.prod.yml"
TAG="latest"
BUILD_ONLY=false
VPS_USER="${VPS_USER:-root}"

# --- Parsear argumentos ---
while [[ $# -gt 0 ]]; do
  case $1 in
    --tag)
      TAG="$2"
      shift 2
      ;;
    --tag=*)
      TAG="${1#*=}"
      shift
      ;;
    --build-only)
      BUILD_ONLY=true
      shift
      ;;
    --help|-h)
      echo "Uso: $0 [--tag TAG] [--build-only]"
      echo ""
      echo "Opciones:"
      echo "  --tag TAG       Tag de la imagen Docker (default: latest)"
      echo "  --build-only    Solo construir y subir imagenes, no desplegar"
      echo "  --help, -h      Mostrar esta ayuda"
      echo ""
      echo "Variables de entorno:"
      echo "  VPS_HOST        IP o hostname del VPS (requerida para deploy)"
      echo "  VPS_USER        Usuario SSH (default: root)"
      exit 0
      ;;
    *)
      error "Argumento desconocido: $1"
      echo "Usa --help para ver las opciones disponibles."
      exit 1
      ;;
  esac
done

# --- Validaciones ---
info "Validando requisitos..."

if ! command -v docker &> /dev/null; then
  error "Docker no esta instalado o no esta en el PATH."
  exit 1
fi

if ! docker info &> /dev/null; then
  error "El demonio de Docker no esta corriendo."
  exit 1
fi

# Verificar autenticacion GHCR
if ! docker login ghcr.io --get-login &> /dev/null 2>&1; then
  warn "No estas autenticado en GHCR. Ejecuta primero:"
  warn "  docker login ghcr.io -u TU_USUARIO -p TU_TOKEN"
  error "Autenticacion en GHCR requerida."
  exit 1
fi

if [[ "${BUILD_ONLY}" == "false" ]] && [[ -z "${VPS_HOST:-}" ]]; then
  error "VPS_HOST no esta definida. Establece la variable de entorno:"
  error "  export VPS_HOST=tu-ip-o-hostname"
  exit 1
fi

success "Validaciones completadas."

# --- Resumen ---
echo ""
info "Configuracion del despliegue:"
info "  Tag:         ${TAG}"
info "  API Image:   ${API_IMAGE}:${TAG}"
info "  Web Image:   ${WEB_IMAGE}:${TAG}"
if [[ "${BUILD_ONLY}" == "false" ]]; then
  info "  VPS:         ${VPS_USER}@${VPS_HOST}"
fi
info "  Solo build:  ${BUILD_ONLY}"
echo ""

# --- Confirmacion ---
read -r -p "$(echo -e "${YELLOW}Continuar con el despliegue? [y/N]${NC} ")" CONFIRM
if [[ ! "${CONFIRM}" =~ ^[yYsS]$ ]]; then
  warn "Despliegue cancelado por el usuario."
  exit 0
fi

# =============================================================
# Paso 1: Construir imagenes
# =============================================================
step "Paso 1/4: Construyendo imagenes Docker"

info "Construyendo imagen API..."
docker build \
  -f api/Dockerfile.prod \
  -t "${API_IMAGE}:${TAG}" \
  .
success "Imagen API construida: ${API_IMAGE}:${TAG}"

info "Construyendo imagen Web..."
docker build \
  -f web/Dockerfile.prod \
  -t "${WEB_IMAGE}:${TAG}" \
  .
success "Imagen Web construida: ${WEB_IMAGE}:${TAG}"

# Tambien taggear como latest si se uso un tag especifico
if [[ "${TAG}" != "latest" ]]; then
  docker tag "${API_IMAGE}:${TAG}" "${API_IMAGE}:latest"
  docker tag "${WEB_IMAGE}:${TAG}" "${WEB_IMAGE}:latest"
  info "Imagenes tambien taggeadas como 'latest'."
fi

# =============================================================
# Paso 2: Subir imagenes a GHCR
# =============================================================
step "Paso 2/4: Subiendo imagenes a GHCR"

info "Subiendo imagen API..."
docker push "${API_IMAGE}:${TAG}"
success "API subida: ${API_IMAGE}:${TAG}"

info "Subiendo imagen Web..."
docker push "${WEB_IMAGE}:${TAG}"
success "Web subida: ${WEB_IMAGE}:${TAG}"

if [[ "${TAG}" != "latest" ]]; then
  docker push "${API_IMAGE}:latest"
  docker push "${WEB_IMAGE}:latest"
  info "Imagenes 'latest' tambien subidas."
fi

# Si solo build, terminar aqui
if [[ "${BUILD_ONLY}" == "true" ]]; then
  echo ""
  success "Imagenes construidas y subidas exitosamente."
  info "Para desplegar manualmente en el VPS, ejecuta:"
  info "  ssh ${VPS_USER}@\${VPS_HOST} 'cd /opt/associated && docker compose -f ${COMPOSE_FILE} pull && docker compose -f ${COMPOSE_FILE} up -d'"
  exit 0
fi

# =============================================================
# Paso 3: Desplegar en VPS
# =============================================================
step "Paso 3/4: Desplegando en VPS (${VPS_USER}@${VPS_HOST})"

info "Conectando al VPS y ejecutando despliegue..."

ssh "${VPS_USER}@${VPS_HOST}" bash -s <<REMOTE_SCRIPT
  set -euo pipefail

  cd /opt/associated

  echo "[VPS] Descargando imagenes nuevas..."
  docker compose -f ${COMPOSE_FILE} pull api web

  echo "[VPS] Deteniendo servicios actuales..."
  docker compose -f ${COMPOSE_FILE} down

  echo "[VPS] Iniciando servicios con imagenes nuevas..."
  docker compose -f ${COMPOSE_FILE} --env-file .env up -d

  echo "[VPS] Esperando a que los servicios esten healthy..."
  sleep 5
  docker compose -f ${COMPOSE_FILE} ps

  echo "[VPS] Despliegue completado."
REMOTE_SCRIPT

success "Despliegue en VPS completado."

# =============================================================
# Paso 4: Verificacion post-despliegue
# =============================================================
step "Paso 4/4: Verificacion post-despliegue"

info "Esperando 10 segundos para que los servicios arranquen..."
sleep 10

info "Verificando estado de servicios..."
ssh "${VPS_USER}@${VPS_HOST}" bash -s <<VERIFY_SCRIPT
  set -euo pipefail
  cd /opt/associated

  echo "--- Estado de contenedores ---"
  docker compose -f ${COMPOSE_FILE} ps

  echo ""
  echo "--- Health check API ---"
  if curl -sf http://127.0.0.1:3000/api/v1/health > /dev/null 2>&1; then
    echo "[OK] API health check passed"
  else
    echo "[WARN] API health check failed (puede estar arrancando)"
  fi

  echo ""
  echo "--- Health check Web ---"
  if curl -sf http://127.0.0.1:8080/healthz > /dev/null 2>&1; then
    echo "[OK] Web health check passed"
  else
    echo "[WARN] Web health check failed (puede estar arrancando)"
  fi
VERIFY_SCRIPT

# =============================================================
# Resumen final
# =============================================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Despliegue completado exitosamente${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
info "Tag desplegado: ${TAG}"
info "API Image:      ${API_IMAGE}:${TAG}"
info "Web Image:      ${WEB_IMAGE}:${TAG}"
info "VPS:            ${VPS_USER}@${VPS_HOST}"
echo ""
info "Para ver los logs en el VPS:"
info "  ssh ${VPS_USER}@${VPS_HOST} 'cd /opt/associated && docker compose -f ${COMPOSE_FILE} logs -f'"
echo ""
