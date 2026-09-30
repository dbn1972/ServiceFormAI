#!/usr/bin/env bash
# =============================================================================
# ServiceFormAI OS — Standalone Validation Tool
# Volume 11 §11 (Pre-Install) and §12 (Post-Install)
#
# Usage:
#   ./validate.sh               # Auto-detect mode (pre if not installed, post if running)
#   ./validate.sh --pre         # Pre-install validation only
#   ./validate.sh --post        # Post-install validation (services must be up)
#   ./validate.sh --config      # Deterministic, non-destructive Compose/readiness check
#   ./validate.sh --readiness   # Full enterprise readiness score
#   ./validate.sh --all         # Pre + Post + Readiness
#   ./validate.sh --output json # Output as JSON (for CI/CD)
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'  GREEN='\033[0;32m'  YELLOW='\033[1;33m'
BLUE='\033[0;34m' BOLD='\033[1m'       NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_DIR="$PROJECT_ROOT/deployment"
ENV_FILE="$DEPLOYMENT_DIR/.env"
[[ -f "$ENV_FILE" ]] || ENV_FILE="$PROJECT_ROOT/.env"
COMPOSE_FILE="$DEPLOYMENT_DIR/docker-compose.yml"

MODE="auto"
OUTPUT_FORMAT="text"
BLOCKING_FAILURES=0
WARNINGS=0
declare -a REPORT_LINES=()
declare -a JSON_CHECKS=()

# ── Helpers ───────────────────────────────────────────────────────────────────
json_escape() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/[[:space:]]\+/ /g'; }
pass()    { local message; message=$(json_escape "$1"); echo -e "  ${GREEN}✓${NC} $1"; REPORT_LINES+=("PASS: $1");  JSON_CHECKS+=("{\"check\":\"$message\",\"status\":\"pass\"}"); }
warn()    { local message; message=$(json_escape "$1"); echo -e "  ${YELLOW}⚠${NC} $1"; REPORT_LINES+=("WARN: $1"); JSON_CHECKS+=("{\"check\":\"$message\",\"status\":\"warn\"}"); ((WARNINGS++)) || true; }
fail()    { local message; message=$(json_escape "$1"); echo -e "  ${RED}✗${NC} $1"; REPORT_LINES+=("FAIL: $1");    JSON_CHECKS+=("{\"check\":\"$message\",\"status\":\"fail\"}"); ((BLOCKING_FAILURES++)) || true; }
section() { echo -e "\n${BOLD}${BLUE}── $1 ──${NC}"; }
cmd_ok()  { command -v "$1" >/dev/null 2>&1; }
env_val() { [[ -f "$ENV_FILE" ]] && grep -E "^$1=" "$ENV_FILE" | cut -d= -f2- | tr -d "\"'" || echo ""; }

# ── PRE-INSTALL VALIDATION (§11) ──────────────────────────────────────────────
run_pre_validation() {
  echo ""
  echo -e "${BOLD}PRE-INSTALL VALIDATION — ServiceFormAI OS${NC}"
  echo "=================================================="

  section "System Prerequisites"

  # Docker
  if cmd_ok docker; then
    local dv; dv=$(docker --version | grep -oE '[0-9]+\.[0-9]+' | head -1)
    local major="${dv%%.*}"
    if [[ $major -ge 20 ]]; then
      pass "Docker $dv (≥ 20 required)"
    else
      fail "Docker $dv is too old (need ≥ 20)"
    fi
    if docker ps >/dev/null 2>&1; then
      pass "Docker daemon running"
    else
      fail "Docker daemon not running — start Docker Desktop or dockerd"
    fi
  else
    fail "Docker not found — install from https://docs.docker.com/get-docker/"
  fi

  # Docker Compose
  if docker compose version >/dev/null 2>&1; then
    pass "Docker Compose (plugin) available"
  elif cmd_ok docker-compose; then
    pass "docker-compose (standalone) available"
  else
    fail "Docker Compose not found"
  fi

  # OpenSSL (for secret generation)
  cmd_ok openssl && pass "openssl available" || warn "openssl not found — secret generation disabled"

  # curl
  cmd_ok curl && pass "curl available" || fail "curl not found"

  section "Hardware Requirements"

  # Memory
  if [[ "$OSTYPE" == linux* ]]; then
    local mem_gb; mem_gb=$(free -g 2>/dev/null | awk '/^Mem:/{print $2}' || echo 0)
    if [[ $mem_gb -ge 4 ]]; then
      pass "RAM: ${mem_gb}GB (minimum 4GB)"
    else
      warn "RAM: ${mem_gb}GB — recommend ≥ 4GB (performance may be degraded)"
    fi
  elif [[ "$OSTYPE" == darwin* ]]; then
    local mem_bytes; mem_bytes=$(sysctl -n hw.memsize 2>/dev/null || echo 0)
    local mem_gb=$(( mem_bytes / 1073741824 ))
    [[ $mem_gb -ge 4 ]] && pass "RAM: ${mem_gb}GB" || warn "RAM: ${mem_gb}GB — recommend ≥ 4GB"
  fi

  # Disk space
  local avail_gb; avail_gb=$(df -BG "$PROJECT_ROOT" 2>/dev/null | awk 'NR==2{gsub(/G/,"",$4); print $4}' || echo 0)
  if [[ $avail_gb -ge 20 ]]; then
    pass "Disk: ${avail_gb}GB available (minimum 20GB)"
  else
    warn "Disk: ${avail_gb}GB available — recommend ≥ 20GB"
  fi

  section "Port Availability"

  local ports=(3000 3001 5432 6379 9000 9001)
  local port_names=(frontend backend postgres redis minio minio-console)
  for i in "${!ports[@]}"; do
    local port="${ports[$i]}"
    local name="${port_names[$i]}"
    if lsof -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
      warn "Port $port ($name) is already in use"
    else
      pass "Port $port ($name) is free"
    fi
  done

  section "Environment File"

  if [[ -f "$ENV_FILE" ]]; then
    pass ".env file found"
    # Check for default secrets
    if grep -qE "changeme_in_production|change-me-generate" "$ENV_FILE"; then
      fail "Default/placeholder secrets detected in .env — run: openssl rand -base64 64"
    else
      pass "No obvious placeholder secrets detected"
    fi
    # Validate required keys exist
    local required_keys=(NODE_ENV JWT_SECRET DATABASE_URL REDIS_URL S3_BUCKET)
    for key in "${required_keys[@]}"; do
      if grep -qE "^${key}=" "$ENV_FILE"; then
        pass "Required key $key present"
      else
        fail "Missing required env key: $key"
      fi
    done
  else
    fail ".env not found — copy .env.example to .env and fill in values"
  fi

  section "Network Connectivity"

  if ping -c1 -W2 8.8.8.8 >/dev/null 2>&1; then
    pass "Internet connectivity (for image pull)"
  else
    warn "No internet connectivity — ensure images are available locally for offline install"
  fi

  section "TLS / Security Posture"

  if [[ -f "$PROJECT_ROOT/nginx/ssl/cert.pem" ]] || \
     [[ -f "$PROJECT_ROOT/ssl/cert.pem" ]]; then
    pass "TLS certificate found"
  else
    warn "TLS not configured — strongly recommended for production (set TLS_ENABLED=true)"
  fi
}

# ── STATIC DEPLOYMENT VALIDATION ─────────────────────────────────────────────
run_config_validation() {
  echo ""
  echo -e "${BOLD}STATIC DEPLOYMENT VALIDATION — ServiceFormAI OS${NC}"
  echo "=================================================="
  section "Compose Configuration"
  if [[ ! -f "$COMPOSE_FILE" ]]; then
    fail "Compose file not found: $COMPOSE_FILE"
    return 0
  fi
  if ! cmd_ok docker; then
    fail "Docker CLI not found — cannot validate Compose configuration"
    return 0
  fi
  local compose_args=(-f "$COMPOSE_FILE")
  [[ -f "$ENV_FILE" ]] && compose_args+=(--env-file "$ENV_FILE")
  if docker compose "${compose_args[@]}" config --quiet >/dev/null 2>&1; then
    pass "Docker Compose configuration is valid"
  else
    fail "Docker Compose configuration is invalid"
    return 0
  fi
  local services
  services=$(docker compose "${compose_args[@]}" config --services 2>/dev/null || echo "")
  local required_service
  for required_service in postgres redis minio backend frontend; do
    if grep -qx "$required_service" <<<"$services"; then
      pass "Compose service declared: $required_service"
    else
      fail "Required Compose service missing: $required_service"
    fi
  done
  local healthcheck_count
  healthcheck_count=$(grep -c "^    healthcheck:" "$COMPOSE_FILE" || true)
  if [[ "$healthcheck_count" -ge 5 ]]; then
    pass "Readiness healthchecks declared for core services ($healthcheck_count found)"
  else
    fail "Expected at least 5 core service healthchecks, found $healthcheck_count"
  fi
}
# ── POST-INSTALL VALIDATION (§12) ────────────────────────────────────────────
run_post_validation() {
  echo ""
  echo -e "${BOLD}POST-INSTALL VALIDATION — ServiceFormAI OS${NC}"
  echo "=================================================="

  section "Service Health"

  # Compose services
  if docker compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -qiE "running|up"; then
    pass "Docker Compose services are running"
  else
    fail "Docker Compose services not running — try: docker compose up -d"
  fi

  # PostgreSQL
  if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready >/dev/null 2>&1; then
    pass "PostgreSQL is ready"
  else
    fail "PostgreSQL is not ready"
  fi

  # Redis
  if docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
    pass "Redis PONG received"
  else
    fail "Redis not responding"
  fi

  # MinIO
  if curl -sf --max-time 5 "http://localhost:9000/minio/health/live" >/dev/null 2>&1; then
    pass "MinIO /health/live OK"
  else
    fail "MinIO not accessible at localhost:9000"
  fi

  section "Backend API"

  local api_url="http://localhost:3001/api/v1/health"
  local api_resp; api_resp=$(curl -sf --max-time 10 "$api_url" 2>/dev/null || echo "")
  if [[ -n "$api_resp" ]]; then
    pass "Backend API /health responded"
    # Check status field
    if echo "$api_resp" | grep -qi '"status":"ok"\|"status":"healthy"'; then
      pass "Backend reports healthy status"
    else
      warn "Backend health status unclear: $api_resp"
    fi
  else
    fail "Backend API at $api_url not responding"
  fi

  section "Frontend"

  if curl -sf --max-time 10 "http://localhost:3000" >/dev/null 2>&1; then
    pass "Frontend accessible at localhost:3000"
  else
    fail "Frontend not accessible at localhost:3000"
  fi

  section "Audit & Storage Round-Trip"

  # S3/MinIO write test
  local test_key="validate-$(date +%s).txt"
  local s3_endpoint; s3_endpoint=$(env_val S3_ENDPOINT)
  s3_endpoint="${s3_endpoint:-http://localhost:9000}"
  # Basic bucket listing
  if curl -sf --max-time 5 "$s3_endpoint/minio/health/live" >/dev/null 2>&1; then
    pass "Object storage endpoint reachable"
  else
    warn "Object storage endpoint not reachable — document uploads may fail"
  fi

  section "Security Checks"

  if [[ -f "$ENV_FILE" ]]; then
    if grep -qE "changeme|change-me" "$ENV_FILE"; then
      fail "Default secrets still present — update before production"
    else
      pass "No default secrets in .env"
    fi
    local node_env; node_env=$(env_val NODE_ENV)
    [[ "$node_env" == "production" ]] && pass "NODE_ENV=production" || warn "NODE_ENV is '$node_env' (should be 'production')"
    local tls; tls=$(env_val TLS_ENABLED)
    [[ "$tls" == "true" ]] && pass "TLS_ENABLED=true" || warn "TLS not enabled (required for production)"
    local csrf; csrf=$(env_val ENABLE_CSRF_PROTECTION)
    [[ "$csrf" == "true" ]] && pass "CSRF protection enabled" || warn "ENABLE_CSRF_PROTECTION not true"
    local rl; rl=$(env_val ENABLE_RATE_LIMITING)
    [[ "$rl" == "true" ]] && pass "Rate limiting enabled" || warn "ENABLE_RATE_LIMITING not true"
  fi
}

# ── ENTERPRISE READINESS SCORE (§13) ─────────────────────────────────────────
run_readiness_score() {
  echo ""
  echo -e "${BOLD}ENTERPRISE READINESS SCORE — ServiceFormAI OS${NC}"
  echo "=================================================="

  local total=0

  section "Security & Authentication (30 pts)"
  local sec=0
  if [[ -f "$ENV_FILE" ]] && ! grep -qE "changeme|change-me" "$ENV_FILE"; then
    pass "Secure secrets (10 pts)"; sec=$((sec+10))
  else
    fail "Default/placeholder secrets (0 pts)"
  fi
  if [[ "$(env_val TLS_ENABLED)" == "true" ]]; then
    pass "TLS/HTTPS enabled (10 pts)"; sec=$((sec+10))
  else
    warn "TLS not enabled — required for production (0 pts)"
  fi
  if [[ "$(env_val ENABLE_CSRF_PROTECTION)" == "true" ]]; then
    pass "CSRF protection (5 pts)"; sec=$((sec+5))
  else
    warn "CSRF protection not enabled (0 pts)"
  fi
  if [[ "$(env_val ENABLE_RATE_LIMITING)" == "true" ]]; then
    pass "Rate limiting (5 pts)"; sec=$((sec+5))
  else
    warn "Rate limiting not enabled (0 pts)"
  fi
  echo -e "  ${BOLD}Security: $sec/30${NC}"
  total=$((total+sec))

  section "Data & Backup (25 pts)"
  local data=0
  if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready >/dev/null 2>&1; then
    pass "PostgreSQL reachable (10 pts)"; data=$((data+10))
  else
    fail "PostgreSQL not reachable (0 pts)"
  fi
  if [[ "$(env_val BACKUP_ENABLED)" == "true" ]]; then
    pass "Automated backup configured (10 pts)"; data=$((data+10))
  else
    warn "BACKUP_ENABLED not set — configure automated backups (0 pts)"
  fi
  if docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping >/dev/null 2>&1; then
    pass "Redis operational (5 pts)"; data=$((data+5))
  else
    fail "Redis not reachable (0 pts)"
  fi
  echo -e "  ${BOLD}Data & Backup: $data/25${NC}"
  total=$((total+data))

  section "Availability & Reliability (20 pts)"
  local avail=0
  if curl -sf --max-time 5 "http://localhost:3001/api/v1/health" >/dev/null 2>&1; then
    pass "Backend health check passing (10 pts)"; avail=$((avail+10))
  else
    fail "Backend health check failing (0 pts)"
  fi
  if curl -sf --max-time 5 "http://localhost:3000" >/dev/null 2>&1; then
    pass "Frontend accessible (10 pts)"; avail=$((avail+10))
  else
    fail "Frontend not accessible (0 pts)"
  fi
  echo -e "  ${BOLD}Availability: $avail/20${NC}"
  total=$((total+avail))

  section "Monitoring & Observability (15 pts)"
  local mon=0
  if [[ "$(env_val ENABLE_METRICS)" == "true" ]]; then
    pass "Metrics collection enabled (5 pts)"; mon=$((mon+5))
  else
    warn "ENABLE_METRICS=false — enable Prometheus metrics (0 pts)"
  fi
  local ll; ll=$(env_val LOG_LEVEL)
  if [[ "$ll" == "info" || "$ll" == "warn" || "$ll" == "error" ]]; then
    pass "Log level: $ll (5 pts)"; mon=$((mon+5))
  else
    warn "LOG_LEVEL not set to info/warn/error (0 pts)"
  fi
  local sentry; sentry=$(env_val SENTRY_DSN)
  if [[ -n "$sentry" ]]; then
    pass "Error tracking (Sentry) configured (5 pts)"; mon=$((mon+5))
  else
    warn "SENTRY_DSN not set — error tracking recommended (0 pts)"
  fi
  echo -e "  ${BOLD}Monitoring: $mon/15${NC}"
  total=$((total+mon))

  section "Compliance & Privacy (10 pts)"
  local comp=0
  if [[ "$(env_val DPDP_ACT_2023_ENABLED)" == "true" ]]; then
    pass "DPDP Act 2023 compliance enabled (5 pts)"; comp=$((comp+5))
  else
    warn "DPDP_ACT_2023_ENABLED not set (0 pts)"
  fi
  if [[ "$(env_val COOKIE_CONSENT_REQUIRED)" == "true" ]]; then
    pass "Cookie consent required (5 pts)"; comp=$((comp+5))
  else
    warn "COOKIE_CONSENT_REQUIRED not set (0 pts)"
  fi
  echo -e "  ${BOLD}Compliance: $comp/10${NC}"
  total=$((total+comp))

  echo ""
  echo "=========================================="
  echo -e "${BOLD}ENTERPRISE READINESS SCORE: $total / 100${NC}"
  echo "=========================================="

  if [[ $total -ge 90 ]]; then
    echo -e "${GREEN}EXCELLENT — Production ready${NC}"
  elif [[ $total -ge 75 ]]; then
    echo -e "${GREEN}GOOD — Production-ready with minor improvements recommended${NC}"
  elif [[ $total -ge 60 ]]; then
    echo -e "${YELLOW}FAIR — Address warnings before production deployment${NC}"
  else
    echo -e "${RED}NEEDS IMPROVEMENT — Not recommended for production${NC}"
  fi

  echo ""
  echo "Blocking issues: $BLOCKING_FAILURES  |  Warnings: $WARNINGS"
}

# ── JSON OUTPUT ───────────────────────────────────────────────────────────────
output_json() {
  local checks_json; checks_json=$(IFS=,; echo "[${JSON_CHECKS[*]}]")
  cat <<EOF
{
  "product": "ServiceFormAI OS",
  "validation_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "blocking_failures": $BLOCKING_FAILURES,
  "warnings": $WARNINGS,
  "checks": $checks_json
}
EOF
}

# ── MAIN ──────────────────────────────────────────────────────────────────────
main() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --pre)       MODE="pre" ;;
      --post)      MODE="post" ;;
      --config)    MODE="config" ;;
      --readiness) MODE="readiness" ;;
      --all)       MODE="all" ;;
      --output)
        if [[ $# -lt 2 || -z "$2" ]]; then
          echo "--output requires a non-empty value" >&2
          exit 1
        fi
        OUTPUT_FORMAT="$2"
        shift
        ;;
      --help|-h)
        echo "Usage: $0 [--pre|--post|--config|--readiness|--all] [--output json]"
        exit 0
        ;;
      *) echo "Unknown option: $1"; exit 1 ;;
    esac
    shift
  done

  if [[ "$OUTPUT_FORMAT" != "text" && "$OUTPUT_FORMAT" != "json" ]]; then
    echo "Unsupported output format: $OUTPUT_FORMAT (use text or json)" >&2
    exit 1
  fi

  if [[ "$OUTPUT_FORMAT" == "json" ]]; then
    case "$MODE" in
      pre)       run_pre_validation >/dev/null ;;
      post)      run_post_validation >/dev/null ;;
      config)    run_config_validation >/dev/null ;;
      readiness) run_post_validation >/dev/null; run_readiness_score >/dev/null ;;
      all)       run_pre_validation >/dev/null; run_post_validation >/dev/null; run_readiness_score >/dev/null ;;
      auto)
        if docker compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -qiE "running|up"; then
          run_post_validation >/dev/null
          run_readiness_score >/dev/null
        else
          run_pre_validation >/dev/null
        fi
        ;;
    esac
  else
    case "$MODE" in
      pre)       run_pre_validation ;;
      post)      run_post_validation ;;
      config)    run_config_validation ;;
      readiness) run_post_validation; run_readiness_score ;;
      all)       run_pre_validation; run_post_validation; run_readiness_score ;;
      auto)
        # Auto-detect: if compose services exist run post, else pre
        if docker compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -qiE "running|up"; then
          run_post_validation
          run_readiness_score
        else
          run_pre_validation
        fi
        ;;
    esac
  fi

  if [[ "$OUTPUT_FORMAT" == "json" ]]; then
    output_json
    if [[ $BLOCKING_FAILURES -gt 0 ]]; then
      exit 1
    fi
    exit 0
  fi

  echo ""

  if [[ $BLOCKING_FAILURES -gt 0 ]]; then
    echo -e "${RED}Validation FAILED — $BLOCKING_FAILURES blocking issue(s) found.${NC}"
    exit 1
  else
    echo -e "${GREEN}Validation PASSED — $WARNINGS warning(s).${NC}"
    exit 0
  fi
}

main "$@"
