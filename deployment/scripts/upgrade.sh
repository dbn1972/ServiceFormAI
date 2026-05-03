#!/usr/bin/env bash
# =============================================================================
# ServiceFormAI OS — Upgrade & Rollback Assistant
# Volume 11 §16 — Upgrade and Rollback Excellence
#
# Usage:
#   ./upgrade.sh                        # Interactive upgrade
#   ./upgrade.sh --to 1.2.0             # Upgrade to specific version
#   ./upgrade.sh --rollback             # Roll back to previous version
#   ./upgrade.sh --dry-run              # Simulate upgrade without changes
#   ./upgrade.sh --skip-backup          # Skip pre-upgrade backup (not recommended)
# =============================================================================

set -euo pipefail

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' BLUE='\033[0;34m' BOLD='\033[1m' NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()      { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()     { echo -e "${RED}[ERROR]${NC} $1"; }
section() { echo -e "\n${BOLD}${BLUE}── $1 ──${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
ENV_FILE="$PROJECT_ROOT/.env"
BACKUP_DIR="$PROJECT_ROOT/.upgrade-backups"

TARGET_VERSION=""
DO_ROLLBACK=false
DRY_RUN=false
SKIP_BACKUP=false
CURRENT_VERSION=""
PREVIOUS_VERSION_FILE="$BACKUP_DIR/.previous_version"

# ── Parse Args ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --to)           TARGET_VERSION="$2"; shift 2 ;;
    --rollback)     DO_ROLLBACK=true; shift ;;
    --dry-run)      DRY_RUN=true; shift ;;
    --skip-backup)  SKIP_BACKUP=true; shift ;;
    --help|-h)
      echo "Usage: $0 [--to VERSION] [--rollback] [--dry-run] [--skip-backup]"
      exit 0
      ;;
    *) err "Unknown option: $1"; exit 1 ;;
  esac
done

print_banner() {
  echo ""
  echo "=========================================================="
  echo -e "${BOLD}  ServiceFormAI OS — Upgrade Assistant${NC}"
  echo "  Volume 11 §16 Upgrade and Rollback Excellence"
  echo "=========================================================="
  echo ""
}

get_current_version() {
  if [[ -f "$ENV_FILE" ]]; then
    CURRENT_VERSION=$(grep '^APP_VERSION=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' || echo "unknown")
  else
    CURRENT_VERSION="unknown"
  fi
  info "Current version: $CURRENT_VERSION"
}

# ── Pre-Upgrade Checks ────────────────────────────────────────────────────────
pre_upgrade_checks() {
  section "Pre-Upgrade Validation (§16.1)"

  local failed=false

  # 1. Services must be running (or at least db accessible)
  if docker compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -qiE "running|up"; then
    ok "Services are currently running"
  else
    warn "Services do not appear to be running — upgrade may be interrupted"
  fi

  # 2. DB reachable
  if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready >/dev/null 2>&1; then
    ok "Database reachable before upgrade"
  else
    err "Database not reachable — cannot proceed safely"
    failed=true
  fi

  # 3. Disk space
  local avail; avail=$(df -BG "$PROJECT_ROOT" 2>/dev/null | awk 'NR==2{gsub(/G/,"",$4); print $4}' || echo 0)
  if [[ $avail -ge 5 ]]; then
    ok "Sufficient disk space (${avail}GB available)"
  else
    warn "Low disk space (${avail}GB) — backup may fail"
  fi

  # 4. Check for target version
  if [[ -n "$TARGET_VERSION" ]]; then
    info "Target version: $TARGET_VERSION"
    ok "Upgrade target specified"
  else
    warn "No --to version specified — will pull :latest tags"
  fi

  if [[ "$failed" == "true" ]]; then
    err "Pre-upgrade checks failed. Resolve issues before upgrading."
    exit 1
  fi
}

# ── Backup Before Upgrade (§16.2) ────────────────────────────────────────────
backup_before_upgrade() {
  if [[ "$SKIP_BACKUP" == "true" ]]; then
    warn "SKIP_BACKUP set — skipping pre-upgrade backup (not recommended for production)"
    return 0
  fi

  section "Pre-Upgrade Backup (§16.2 — required)"

  mkdir -p "$BACKUP_DIR"
  local backup_ts; backup_ts=$(date +%Y%m%d-%H%M%S)
  local backup_path="$BACKUP_DIR/pre-upgrade-$backup_ts"
  mkdir -p "$backup_path"

  if [[ "$DRY_RUN" == "true" ]]; then
    info "DRY RUN: Would dump PostgreSQL to $backup_path/postgres.sql.gz"
    info "DRY RUN: Would save .env to $backup_path/.env.bak"
    ok "Backup simulation complete"
    return 0
  fi

  # PostgreSQL dump
  info "Dumping PostgreSQL..."
  docker compose -f "$COMPOSE_FILE" exec -T postgres \
    pg_dump -U serviceformai serviceformai 2>/dev/null | gzip > "$backup_path/postgres.sql.gz"
  ok "PostgreSQL dump saved to $backup_path/postgres.sql.gz"

  # .env backup
  [[ -f "$ENV_FILE" ]] && cp "$ENV_FILE" "$backup_path/.env.bak" && ok ".env backed up"

  # Compose file
  [[ -f "$COMPOSE_FILE" ]] && cp "$COMPOSE_FILE" "$backup_path/docker-compose.yml.bak"

  # Save current version for rollback
  echo "$CURRENT_VERSION" > "$PREVIOUS_VERSION_FILE"
  echo "$backup_path" >> "$PREVIOUS_VERSION_FILE"

  ok "Pre-upgrade backup complete: $backup_path"
}

# ── Pull New Images ───────────────────────────────────────────────────────────
pull_new_images() {
  section "Pulling New Images"

  if [[ "$DRY_RUN" == "true" ]]; then
    info "DRY RUN: Would pull images for version ${TARGET_VERSION:-latest}"
    return 0
  fi

  if [[ -n "$TARGET_VERSION" ]]; then
    # Update image tags in compose
    info "Updating image tags to $TARGET_VERSION..."
    sed -i.bak "s|serviceformai/.*:.*|serviceformai/app:$TARGET_VERSION|g" "$COMPOSE_FILE" || true
    sed -i.bak "s|APP_VERSION=.*|APP_VERSION=$TARGET_VERSION|" "$ENV_FILE" || true
    rm -f "$COMPOSE_FILE.bak" "$ENV_FILE.bak"
  fi

  docker compose -f "$COMPOSE_FILE" pull
  ok "Images pulled"
}

# ── Run Database Migrations ───────────────────────────────────────────────────
run_migrations() {
  section "Database Migrations"

  if [[ "$DRY_RUN" == "true" ]]; then
    info "DRY RUN: Would run: docker compose exec backend npm run migration:run"
    return 0
  fi

  info "Running database migrations..."
  docker compose -f "$COMPOSE_FILE" exec -T backend \
    npm run migration:run 2>&1 || {
      err "Migration failed — initiating rollback"
      rollback
      exit 1
    }
  ok "Migrations complete"
}

# ── Restart Services ──────────────────────────────────────────────────────────
restart_services() {
  section "Restarting Services"

  if [[ "$DRY_RUN" == "true" ]]; then
    info "DRY RUN: Would restart services"
    return 0
  fi

  info "Performing rolling restart..."
  docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
  sleep 10

  # Wait for healthy
  local attempts=0
  while [[ $attempts -lt 20 ]]; do
    if ! docker compose -f "$COMPOSE_FILE" ps | grep -qi "unhealthy"; then
      ok "All services healthy after restart"
      return 0
    fi
    info "Waiting for healthy state... ($((attempts+1))/20)"
    sleep 10
    ((attempts++))
  done

  err "Services not healthy after restart"
  return 1
}

# ── Post-Upgrade Validation ───────────────────────────────────────────────────
post_upgrade_validation() {
  section "Post-Upgrade Validation"

  local failures=0

  # Backend health
  local resp; resp=$(curl -sf --max-time 15 "http://localhost:3001/api/v1/health" 2>/dev/null || echo "")
  if [[ -n "$resp" ]]; then
    ok "Backend API healthy post-upgrade"
  else
    err "Backend API not responding post-upgrade"
    ((failures++))
  fi

  # Frontend
  if curl -sf --max-time 10 "http://localhost:3000" >/dev/null 2>&1; then
    ok "Frontend accessible post-upgrade"
  else
    err "Frontend not accessible post-upgrade"
    ((failures++))
  fi

  # DB
  if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready >/dev/null 2>&1; then
    ok "Database reachable post-upgrade"
  else
    err "Database not reachable post-upgrade"
    ((failures++))
  fi

  if [[ $failures -gt 0 ]]; then
    err "$failures post-upgrade check(s) failed"
    echo ""
    warn "Consider running rollback: ./upgrade.sh --rollback"
    return 1
  fi

  ok "All post-upgrade validations passed"
}

# ── Rollback (§16.3) ─────────────────────────────────────────────────────────
rollback() {
  section "Rollback (§16.3)"

  if [[ ! -f "$PREVIOUS_VERSION_FILE" ]]; then
    err "No previous version record found at $PREVIOUS_VERSION_FILE"
    err "Cannot auto-rollback. Restore manually from $BACKUP_DIR"
    exit 1
  fi

  local prev_version; prev_version=$(head -1 "$PREVIOUS_VERSION_FILE")
  local backup_path; backup_path=$(tail -1 "$PREVIOUS_VERSION_FILE")

  info "Rolling back from $CURRENT_VERSION to $prev_version"
  info "Using backup: $backup_path"

  if [[ "$DRY_RUN" == "true" ]]; then
    info "DRY RUN: Would restore from $backup_path"
    return 0
  fi

  if [[ ! -d "$backup_path" ]]; then
    err "Backup directory not found: $backup_path"
    exit 1
  fi

  # Stop services
  info "Stopping current services..."
  docker compose -f "$COMPOSE_FILE" down

  # Restore .env
  if [[ -f "$backup_path/.env.bak" ]]; then
    cp "$backup_path/.env.bak" "$ENV_FILE"
    ok ".env restored"
  fi

  # Restore compose
  if [[ -f "$backup_path/docker-compose.yml.bak" ]]; then
    cp "$backup_path/docker-compose.yml.bak" "$COMPOSE_FILE"
    ok "docker-compose.yml restored"
  fi

  # Restore database
  if [[ -f "$backup_path/postgres.sql.gz" ]]; then
    info "Restoring database..."
    docker compose -f "$COMPOSE_FILE" up -d postgres
    sleep 10
    gunzip -c "$backup_path/postgres.sql.gz" | \
      docker compose -f "$COMPOSE_FILE" exec -T postgres \
        psql -U serviceformai serviceformai 2>&1
    ok "Database restored"
  fi

  # Pull previous images
  info "Pulling previous images ($prev_version)..."
  [[ -n "$prev_version" && "$prev_version" != "unknown" ]] && \
    sed -i.bak "s|serviceformai/.*:.*|serviceformai/app:$prev_version|g" "$COMPOSE_FILE" && \
    rm -f "$COMPOSE_FILE.bak"

  docker compose -f "$COMPOSE_FILE" pull
  docker compose -f "$COMPOSE_FILE" up -d

  ok "Rollback to $prev_version complete"
  warn "Run post-rollback validation: ./validate.sh --post"
}

# ── Upgrade Report ────────────────────────────────────────────────────────────
print_upgrade_report() {
  echo ""
  echo "=========================================================="
  echo -e "${BOLD}  UPGRADE REPORT${NC}"
  echo "=========================================================="
  echo "  From:       $CURRENT_VERSION"
  echo "  To:         ${TARGET_VERSION:-latest}"
  echo "  Date:       $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "  Dry run:    $DRY_RUN"
  echo "  Backup:     $([[ "$SKIP_BACKUP" == "false" ]] && echo "yes" || echo "skipped")"
  echo ""
  echo "  Next steps:"
  echo "    1. Verify application at http://localhost:3000"
  echo "    2. Check logs: docker compose logs -f"
  echo "    3. Run: ./validate.sh --post"
  echo "    4. If issues: ./upgrade.sh --rollback"
  echo "=========================================================="
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  print_banner
  get_current_version

  if [[ "$DO_ROLLBACK" == "true" ]]; then
    rollback
    exit 0
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    warn "DRY RUN mode — no changes will be made"
  fi

  pre_upgrade_checks
  backup_before_upgrade
  pull_new_images
  restart_services
  run_migrations || true   # Continue to validation even if migration fails (rollback is triggered inside)
  post_upgrade_validation || {
    warn "Post-upgrade validation failed — consider: ./upgrade.sh --rollback"
    exit 1
  }
  print_upgrade_report
  ok "Upgrade complete!"
}

main "$@"
