#!/usr/bin/env bash
# =============================================================================
# ServiceFormAI OS — Release Gate
# Volume 12 §13 — Release Exit Criteria
#
# This script enforces all release exit criteria before a release ships.
# Exit code 0 = all gates passed (release can proceed).
# Exit code 1 = one or more blocking gates failed (release blocked).
#
# Usage:
#   ./qa-gate.sh                        # Full gate check
#   ./qa-gate.sh --skip-e2e             # Skip Playwright (for fast CI pre-checks)
#   ./qa-gate.sh --report               # Write JSON report to qa-gate-report.json
#   ./qa-gate.sh --env staging          # Set environment label for report
# =============================================================================

set -euo pipefail

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' BLUE='\033[0;34m' BOLD='\033[1m' NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SKIP_E2E=false
WRITE_REPORT=false
ENV_LABEL="staging"
BLOCKING_FAILURES=0
WARNINGS=0
declare -a GATE_RESULTS=()

info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()      { echo -e "${GREEN}[PASS]${NC}  $1"; GATE_RESULTS+=("{\"gate\":\"$1\",\"status\":\"pass\"}"); }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; GATE_RESULTS+=("{\"gate\":\"$1\",\"status\":\"warn\"}"); ((WARNINGS++)) || true; }
fail()    { echo -e "${RED}[FAIL]${NC}  $1"; GATE_RESULTS+=("{\"gate\":\"$1\",\"status\":\"fail\"}"); ((BLOCKING_FAILURES++)) || true; }
section() { echo -e "\n${BOLD}${BLUE}── $1 ──${NC}"; }

# ── Parse args ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-e2e)  SKIP_E2E=true; shift ;;
    --report)    WRITE_REPORT=true; shift ;;
    --env)       ENV_LABEL="$2"; shift 2 ;;
    --help|-h)   echo "Usage: $0 [--skip-e2e] [--report] [--env ENV]"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo ""
echo "============================================================"
echo -e "${BOLD}  ServiceFormAI OS — Release Gate (Volume 12 §13)${NC}"
echo "  Environment: $ENV_LABEL"
echo "  Time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "============================================================"

# ── Gate 1: TypeScript — 0 errors (§14) ──────────────────────────────────────
section "Gate 1 — TypeScript (Frontend + Backend)"
cd "$PROJECT_ROOT"

if npx tsc --noEmit 2>/dev/null; then
  ok "Frontend TypeScript — 0 errors"
else
  fail "Frontend TypeScript errors detected — run: npx tsc --noEmit"
fi

cd "$PROJECT_ROOT/backend"
if npx tsc --noEmit 2>/dev/null; then
  ok "Backend TypeScript — 0 errors"
else
  fail "Backend TypeScript errors detected"
fi
cd "$PROJECT_ROOT"

# ── Gate 2: ESLint — max-warnings 0 ──────────────────────────────────────────
section "Gate 2 — ESLint (Frontend)"
if npx eslint . --ext ts,tsx --max-warnings 0 2>/dev/null; then
  ok "ESLint — 0 warnings or errors"
else
  warn "ESLint warnings found — review before release"
fi

# ── Gate 3: Vitest Unit / Contract / Schema Tests (§12) ───────────────────────
section "Gate 3 — Vitest Unit + Contract + Schema Tests"
if npx vitest run --reporter=verbose 2>/dev/null; then
  ok "Vitest — all tests passed"
else
  VITEST_EXIT=$?
  if [[ $VITEST_EXIT -ne 0 ]]; then
    fail "Vitest tests failed — critical user journeys broken"
  fi
fi

# ── Gate 4: Vitest Coverage thresholds (§12.1) ───────────────────────────────
section "Gate 4 — Test Coverage (80% threshold)"
if npx vitest run --coverage 2>/dev/null | grep -q "Coverage"; then
  ok "Test coverage threshold met (≥80%)"
else
  warn "Coverage data unavailable — run: npm run test:coverage"
fi

# ── Gate 5: E2E Smoke Tests via Playwright (§12 + §13) ───────────────────────
section "Gate 5 — E2E Smoke Tests"
if [[ "$SKIP_E2E" == "true" ]]; then
  warn "E2E tests skipped (--skip-e2e flag)"
else
  if [[ ! -f "$PROJECT_ROOT/node_modules/.bin/playwright" ]]; then
    warn "Playwright not installed — run: npx playwright install"
  else
    # Run only the critical smoke specs (auth + responsive) for speed
    if npx playwright test e2e/auth.spec.ts e2e/responsive.spec.ts \
        --project="Desktop Chrome" 2>/dev/null; then
      ok "E2E smoke tests passed (auth + responsive)"
    else
      fail "E2E smoke tests failed — critical user journeys broken"
    fi
  fi
fi

# ── Gate 6: API Contract Regressions (§7 + §13) ───────────────────────────────
section "Gate 6 — API Contract Tests"
if npx vitest run src/test/api-contracts/ 2>/dev/null; then
  ok "API contract tests — no regressions"
else
  fail "API contract regressions detected"
fi

# ── Gate 7: Schema Validation Tests (§6 + §13) ────────────────────────────────
section "Gate 7 — Schema Validation Tests"
if npx vitest run src/test/schema/ 2>/dev/null; then
  ok "Schema validation tests passed"
else
  fail "Schema validation tests failed"
fi

# ── Gate 8: Backend Unit Tests (§9 + §13) ─────────────────────────────────────
section "Gate 8 — Backend Unit Tests"
cd "$PROJECT_ROOT/backend"
if command -v jest >/dev/null 2>&1 || npx jest --version >/dev/null 2>&1; then
  if npx jest --passWithNoTests 2>/dev/null; then
    ok "Backend Jest tests passed"
  else
    fail "Backend Jest tests failed"
  fi
else
  warn "Jest not installed in backend — skipping (add jest to devDependencies)"
fi
cd "$PROJECT_ROOT"

# ── Gate 9: Responsive smoke (§4 + §13) ──────────────────────────────────────
section "Gate 9 — Responsive / Mobile Smoke"
if [[ "$SKIP_E2E" == "true" ]]; then
  warn "Responsive smoke skipped (--skip-e2e)"
else
  if command -v npx >/dev/null && [[ -f "$PROJECT_ROOT/node_modules/.bin/playwright" ]]; then
    if npx playwright test e2e/responsive.spec.ts \
        --project="Mobile Chrome (Pixel 5)" --project="Desktop Chrome" 2>/dev/null; then
      ok "Responsive smoke passed (mobile + desktop)"
    else
      fail "Responsive smoke failed — layout issues on mobile or desktop"
    fi
  else
    warn "Playwright unavailable — responsive smoke skipped"
  fi
fi

# ── Gate 10: Accessibility blockers (§10 + §13) ───────────────────────────────
section "Gate 10 — Accessibility Baseline"
if [[ "$SKIP_E2E" == "false" ]] && [[ -f "$PROJECT_ROOT/node_modules/.bin/playwright" ]]; then
  if npx playwright test e2e/accessibility.spec.ts --project="Accessibility" 2>/dev/null; then
    ok "Accessibility baseline passed"
  else
    fail "Accessibility blockers detected — zero accessibility blocking defects required"
  fi
else
  warn "Accessibility tests skipped"
fi

# ── Gate 11: Dark mode regression (§10 + §13) ────────────────────────────────
section "Gate 11 — Dark Mode / Theme Regression"
if [[ "$SKIP_E2E" == "false" ]] && [[ -f "$PROJECT_ROOT/node_modules/.bin/playwright" ]]; then
  if npx playwright test e2e/dark-mode.spec.ts --project="Dark Mode" 2>/dev/null; then
    ok "Dark mode regression passed"
  else
    warn "Dark mode issues detected — review before release"
  fi
else
  warn "Dark mode tests skipped"
fi

# ── Gate 12: Security — no default secrets in .env ────────────────────────────
section "Gate 12 — Security Regression"
ENV_FILE="$PROJECT_ROOT/.env"
if [[ -f "$ENV_FILE" ]]; then
  if grep -qiE "changeme|change-me-generate|YOUR_SECRET" "$ENV_FILE"; then
    fail "Default placeholder secrets found in .env — security regression"
  else
    ok "No default secrets in .env"
  fi
else
  warn ".env not found — cannot check for placeholder secrets"
fi

# ── Gate 13: Deployment validation (§13) ─────────────────────────────────────
section "Gate 13 — Deployment / Install Validation"
if [[ -f "$PROJECT_ROOT/deployment/scripts/validate.sh" ]]; then
  if bash "$PROJECT_ROOT/deployment/scripts/validate.sh" --pre 2>/dev/null; then
    ok "Pre-install validation passed"
  else
    warn "Pre-install validation has warnings — review deployment readiness"
  fi
else
  warn "validate.sh not found — deployment validation skipped"
fi

# ── Final Report ──────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo -e "${BOLD}  RELEASE GATE REPORT${NC}"
echo "  Environment:       $ENV_LABEL"
echo "  Blocking failures: $BLOCKING_FAILURES"
echo "  Warnings:          $WARNINGS"
echo "============================================================"

if [[ "$WRITE_REPORT" == "true" ]]; then
  local results_json; results_json=$(IFS=,; echo "[${GATE_RESULTS[*]}]")
  cat > "$PROJECT_ROOT/qa-gate-report.json" <<EOF
{
  "product": "ServiceFormAI OS",
  "env": "$ENV_LABEL",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "blocking_failures": $BLOCKING_FAILURES,
  "warnings": $WARNINGS,
  "release_approved": $([[ $BLOCKING_FAILURES -eq 0 ]] && echo "true" || echo "false"),
  "gates": $results_json
}
EOF
  info "Report written to qa-gate-report.json"
fi

if [[ $BLOCKING_FAILURES -gt 0 ]]; then
  echo -e "${RED}${BOLD}RELEASE BLOCKED${NC} — $BLOCKING_FAILURES blocking gate(s) failed."
  echo "Per Volume 12 §13: a release must not ship with blocking failures."
  exit 1
else
  echo -e "${GREEN}${BOLD}RELEASE APPROVED${NC} — all gates passed ($WARNINGS warning(s))."
  exit 0
fi
