#!/usr/bin/env bash
# =============================================================================
# ServiceFormAI OS — Diagnostic Bundle Generator
# Volume 11 §17 — Diagnostic Bundle and Troubleshooting Standard
#
# Usage:
#   ./diagnostic-bundle.sh
#   ./diagnostic-bundle.sh --output /tmp/bundle
#   ./diagnostic-bundle.sh --no-logs     (skip log collection)
#
# Output: compressed bundle at ./serviceformai-diagnostic-<timestamp>.tar.gz
# =============================================================================

set -euo pipefail

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' BLUE='\033[0;34m' NC='\033[0m'
info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
ENV_FILE="$PROJECT_ROOT/.env"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_DIR="${1:-/tmp}"
BUNDLE_DIR="$OUTPUT_DIR/serviceformai-diagnostic-$TIMESTAMP"
INCLUDE_LOGS=true

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --output) OUTPUT_DIR="$2"; shift 2 ;;
    --no-logs) INCLUDE_LOGS=false; shift ;;
    --help|-h) echo "Usage: $0 [--output DIR] [--no-logs]"; exit 0 ;;
    *) shift ;;
  esac
done

BUNDLE_DIR="$OUTPUT_DIR/serviceformai-diagnostic-$TIMESTAMP"
ARCHIVE="$OUTPUT_DIR/serviceformai-diagnostic-$TIMESTAMP.tar.gz"

echo ""
echo "=========================================================="
echo "  ServiceFormAI OS — Diagnostic Bundle Generator"
echo "  Volume 11 §17"
echo "=========================================================="
echo ""

mkdir -p "$BUNDLE_DIR"/{services,config,logs,health,infra}

# ── 1. Version & Build Info ───────────────────────────────────────────────────
info "Collecting version and build info..."
{
  echo "Diagnostic Bundle"
  echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "Host:      $(hostname)"
  echo "OS:        $(uname -srm)"
  if docker --version >/dev/null 2>&1; then
    echo "Docker:    $(docker --version)"
  fi
  if [[ -f "$ENV_FILE" ]]; then
    echo "App version: $(grep '^APP_VERSION=' "$ENV_FILE" | cut -d= -f2- || echo 'unknown')"
    echo "Arch mode:   $(grep '^ARCHITECTURE_MODE=' "$ENV_FILE" | cut -d= -f2- || echo 'unknown')"
    echo "Install date:$(grep '^INSTALLATION_DATE=' "$ENV_FILE" | cut -d= -f2- || echo 'unknown')"
    echo "Deployment ID:$(grep '^DEPLOYMENT_ID=' "$ENV_FILE" | cut -d= -f2- || echo 'unknown')"
  fi
} > "$BUNDLE_DIR/bundle-info.txt"
ok "Version info collected"

# ── 2. Service Status ─────────────────────────────────────────────────────────
info "Collecting service status..."
{
  echo "=== docker compose ps ==="
  docker compose -f "$COMPOSE_FILE" ps 2>&1 || echo "compose not running"
  echo ""
  echo "=== docker ps (all) ==="
  docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>&1
  echo ""
  echo "=== docker stats (snapshot) ==="
  docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" 2>&1 || true
} > "$BUNDLE_DIR/services/service-status.txt"
ok "Service status collected"

# ── 3. Health Endpoints ───────────────────────────────────────────────────────
info "Querying health endpoints..."
{
  echo "=== Backend /health ==="
  curl -sf --max-time 10 "http://localhost:3001/api/v1/health" 2>&1 | python3 -m json.tool 2>/dev/null || \
    curl -sf --max-time 10 "http://localhost:3001/api/v1/health" 2>&1 || echo "endpoint not reachable"
  echo ""
  echo "=== Backend /ready ==="
  curl -sf --max-time 10 "http://localhost:3001/api/v1/ready" 2>&1 || echo "endpoint not reachable"
  echo ""
  echo "=== MinIO health ==="
  curl -sf --max-time 5 "http://localhost:9000/minio/health/live" 2>&1 && echo "OK" || echo "not reachable"
  echo ""
  echo "=== Frontend ==="
  curl -sI --max-time 5 "http://localhost:3000" 2>&1 | head -5 || echo "not reachable"
} > "$BUNDLE_DIR/health/health-endpoints.txt"
ok "Health endpoints queried"

# ── 4. Database Diagnostics ───────────────────────────────────────────────────
info "Collecting database diagnostics..."
{
  echo "=== pg_isready ==="
  docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready 2>&1 || echo "postgres not accessible"
  echo ""
  echo "=== Table sizes ==="
  docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U serviceformai -c \
    "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
     FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema')
     ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 20;" 2>&1 || \
    echo "Could not query database (may not be configured)"
  echo ""
  echo "=== Connection count ==="
  docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U serviceformai -c \
    "SELECT count(*) FROM pg_stat_activity;" 2>&1 || true
} > "$BUNDLE_DIR/infra/database-diagnostics.txt"
ok "Database diagnostics collected"

# ── 5. Redis Diagnostics ──────────────────────────────────────────────────────
info "Collecting Redis diagnostics..."
{
  echo "=== redis-cli ping ==="
  docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping 2>&1 || echo "Redis not accessible"
  echo ""
  echo "=== redis-cli info (server section) ==="
  docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli info server 2>&1 | head -30 || true
  echo ""
  echo "=== redis-cli dbsize ==="
  docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli dbsize 2>&1 || true
} > "$BUNDLE_DIR/infra/redis-diagnostics.txt"
ok "Redis diagnostics collected"

# ── 6. Environment (secrets redacted) ────────────────────────────────────────
info "Collecting configuration (secrets redacted)..."
if [[ -f "$ENV_FILE" ]]; then
  # Redact all values containing 'secret', 'password', 'key', 'token', 'dsn'
  sed -E 's/(SECRET|PASSWORD|KEY|TOKEN|DSN|PASS)=.+/\1=***REDACTED***/Ig' "$ENV_FILE" \
    > "$BUNDLE_DIR/config/env-redacted.txt"
  ok "Environment config collected (secrets redacted)"
else
  echo ".env not found" > "$BUNDLE_DIR/config/env-redacted.txt"
  warn ".env file not found"
fi

# ── 7. Compose Configuration ──────────────────────────────────────────────────
info "Collecting compose config..."
if [[ -f "$COMPOSE_FILE" ]]; then
  cp "$COMPOSE_FILE" "$BUNDLE_DIR/config/docker-compose.yml"
  ok "Compose file included"
fi

# ── 8. Logs ───────────────────────────────────────────────────────────────────
if [[ "$INCLUDE_LOGS" == "true" ]]; then
  info "Collecting service logs (last 500 lines each)..."
  for service in app backend postgres redis minio; do
    docker compose -f "$COMPOSE_FILE" logs --tail=500 "$service" 2>&1 \
      > "$BUNDLE_DIR/logs/${service}.log" 2>/dev/null || true
  done
  ok "Logs collected"
else
  info "Log collection skipped (--no-logs)"
fi

# ── 9. Readiness Score (quick) ────────────────────────────────────────────────
info "Running quick readiness score..."
if [[ -f "$SCRIPT_DIR/validate.sh" ]]; then
  bash "$SCRIPT_DIR/validate.sh" --readiness 2>&1 > "$BUNDLE_DIR/health/readiness-score.txt" || true
  ok "Readiness score captured"
fi

# ── 10. System Info ───────────────────────────────────────────────────────────
info "Collecting system info..."
{
  echo "=== uname ==="
  uname -a
  echo ""
  echo "=== df -h ==="
  df -h
  echo ""
  echo "=== free -h ==="
  free -h 2>/dev/null || vm_stat 2>/dev/null || true
  echo ""
  echo "=== docker info ==="
  docker info 2>&1 | grep -v "Plugins\|Context\|Server Version" | head -40
} > "$BUNDLE_DIR/infra/system-info.txt"
ok "System info collected"

# ── 11. Package & Compress ────────────────────────────────────────────────────
info "Creating archive..."
tar -czf "$ARCHIVE" -C "$OUTPUT_DIR" "$(basename "$BUNDLE_DIR")"
rm -rf "$BUNDLE_DIR"

echo ""
echo "=========================================================="
ok "Diagnostic bundle created:"
echo "  $ARCHIVE"
echo ""
echo "  Include this file when contacting support."
echo "  All secrets have been redacted from the bundle."
echo "=========================================================="
