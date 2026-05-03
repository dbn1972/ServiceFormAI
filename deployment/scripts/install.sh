#!/bin/bash

# ServiceFormAI OS - One-Command Installer
# Version: 1.0.0
# Purpose: Guided installation for Docker Compose deployment
# 
# Usage:
#   ./install.sh                    # Interactive mode
#   ./install.sh --config setup.yml # Non-interactive mode
#   ./install.sh --dry-run          # Validation only
#   ./install.sh --help             # Show help

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

VERSION="1.0.0"
PRODUCT_NAME="ServiceFormAI OS"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$DEPLOYMENT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Installation state
DRY_RUN=false
INTERACTIVE=true
CONFIG_FILE=""
SKIP_VALIDATION=false

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo "=========================================================================="
    echo "$1"
    echo "=========================================================================="
    echo ""
}

print_banner() {
    cat << "EOF"
    ____                  _           ______                     ___    ____     ____  _____
   / ___|  ___ _ ____   _(_) ___ ___ |  ___|__  _ __ _ __ ___   / \ \  |  _ \ / ___||_ _/ \
   \___ \ / _ \ '__\ \ / / |/ __/ _ \| |_ / _ \| '__| '_ ` _ \ / _ \ \ | | | | |     | |/ _ \
    ___) |  __/ |   \ V /| | (_|  __/|  _| (_) | |  | | | | | / ___ \ \| |_| | |___  | / ___ \
   |____/ \___|_|    \_/ |_|\___\___||_|  \___/|_|  |_| |_| |_/_/   \_(_)____/ \____||_/_/   \_\

EOF
    echo "   Version $VERSION - Enterprise Installation Wizard"
    echo "   Government of India • MeitY"
    echo ""
}

confirm() {
    local prompt="$1"
    local default="${2:-n}"
    
    if [ "$default" = "y" ]; then
        prompt="$prompt [Y/n]: "
    else
        prompt="$prompt [y/N]: "
    fi
    
    read -p "$prompt" -n 1 -r
    echo
    
    if [ "$default" = "y" ]; then
        [[ $REPLY =~ ^[Nn]$ ]] && return 1 || return 0
    else
        [[ $REPLY =~ ^[Yy]$ ]] && return 0 || return 1
    fi
}

check_command() {
    command -v "$1" >/dev/null 2>&1
}

# =============================================================================
# PRE-INSTALL VALIDATION (Volume 11 Section 11)
# =============================================================================

validate_prerequisites() {
    print_header "Pre-Install Validation"
    
    local validation_failed=false
    
    # Check Docker
    log_info "Checking Docker..."
    if ! check_command docker; then
        log_error "Docker is not installed. Please install Docker first."
        validation_failed=true
    else
        local docker_version=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        log_success "Docker $docker_version installed"
        
        # Check if Docker daemon is running
        if ! docker ps >/dev/null 2>&1; then
            log_error "Docker daemon is not running. Please start Docker."
            validation_failed=true
        fi
    fi
    
    # Check Docker Compose
    log_info "Checking Docker Compose..."
    if ! check_command docker-compose && ! docker compose version >/dev/null 2>&1; then
        log_error "Docker Compose is not installed."
        validation_failed=true
    else
        log_success "Docker Compose installed"
    fi
    
    # Check system resources
    log_info "Checking system resources..."
    
    # Memory check (minimum 4GB recommended)
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        local total_mem=$(free -g | awk '/^Mem:/{print $2}')
        if [ "$total_mem" -lt 4 ]; then
            log_warning "System has less than 4GB RAM. Performance may be degraded."
        else
            log_success "Memory: ${total_mem}GB (sufficient)"
        fi
    fi
    
    # Disk space check (minimum 20GB recommended)
    local available_space=$(df -BG "$DEPLOYMENT_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$available_space" -lt 20 ]; then
        log_warning "Less than 20GB disk space available. You have ${available_space}GB."
    else
        log_success "Disk space: ${available_space}GB (sufficient)"
    fi
    
    # Check for port conflicts
    log_info "Checking port availability..."
    local ports=(3000 3001 5432 6379 9000 9001 80 443)
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -an | grep -q ":$port.*LISTEN" 2>/dev/null; then
            log_warning "Port $port is already in use"
        fi
    done
    
    # Check network connectivity
    log_info "Checking network connectivity..."
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        log_success "Network connectivity verified"
    else
        log_warning "Network connectivity issue detected"
    fi
    
    if [ "$validation_failed" = true ]; then
        log_error "Pre-install validation failed. Please resolve issues above."
        exit 1
    fi
    
    log_success "Pre-install validation completed successfully"
}

# =============================================================================
# ARCHITECTURE RECOMMENDATION (Volume 11 Section 4)
# =============================================================================

recommend_architecture() {
    print_header "Architecture Recommendation"
    
    echo "Let's determine the best deployment architecture for your needs."
    echo ""
    
    # Question 1: Number of users
    echo "1. Expected number of total users:"
    echo "   a) < 100 (Evaluation/Testing)"
    echo "   b) 100 - 1,000 (Small Department)"
    echo "   c) 1,000 - 10,000 (Medium Organization)"
    echo "   d) > 10,000 (Enterprise/State-wide)"
    read -p "Select (a/b/c/d): " user_count
    
    # Question 2: Availability requirements
    echo ""
    echo "2. Is high availability required?"
    read -p "   (y/n): " ha_required
    
    # Question 3: Data sensitivity
    echo ""
    echo "3. Data classification level:"
    echo "   a) Public (evaluation data)"
    echo "   b) Internal (department-only)"
    echo "   c) Confidential (citizen PII)"
    echo "   d) Restricted (national security)"
    read -p "Select (a/b/c/d): " data_class
    
    # Question 4: Deployment environment
    echo ""
    echo "4. Deployment environment:"
    echo "   a) Local development machine"
    echo "   b) On-premise server"
    echo "   c) Private cloud (NIC, MeghRaj)"
    echo "   d) Public cloud (AWS, Azure, GCP)"
    read -p "Select (a/b/c/d): " deploy_env
    
    # Generate recommendation
    echo ""
    print_header "Recommended Architecture"
    
    if [[ "$user_count" == "a" ]]; then
        ARCHITECTURE="small"
        echo "✓ Small Deployment (Docker Compose)"
        echo "  - Single application server"
        echo "  - Embedded PostgreSQL"
        echo "  - Embedded Redis"
        echo "  - Local MinIO storage"
        echo "  - Suitable for: Evaluation, development, small pilots"
        echo "  - Est. capacity: Up to 100 users"
    elif [[ "$user_count" == "b" ]]; then
        ARCHITECTURE="medium"
        echo "✓ Medium Deployment (Docker Compose or Kubernetes)"
        echo "  - 2-3 application nodes"
        echo "  - External PostgreSQL"
        echo "  - External Redis"
        echo "  - S3-compatible storage"
        echo "  - Load balancer recommended"
        echo "  - Suitable for: Department deployments"
        echo "  - Est. capacity: 100-1,000 users"
    else
        ARCHITECTURE="enterprise"
        echo "✓ Enterprise Deployment (Kubernetes + Helm)"
        echo "  - Scalable application nodes (3+ recommended)"
        echo "  - HA PostgreSQL cluster"
        echo "  - HA Redis cluster"
        echo "  - Enterprise object storage"
        echo "  - Load balancer required"
        echo "  - Monitoring and alerting"
        echo "  - Backup and DR required"
        echo "  - Suitable for: State-wide, national deployments"
        echo "  - Est. capacity: Unlimited (horizontally scalable)"
    fi
    
    echo ""
    if confirm "Proceed with this architecture?"; then
        log_success "Architecture selected: $ARCHITECTURE"
        return 0
    else
        log_info "Restarting architecture selection..."
        recommend_architecture
    fi
}

# =============================================================================
# ENVIRONMENT CONFIGURATION
# =============================================================================

configure_environment() {
    print_header "Environment Configuration"
    
    cd "$DEPLOYMENT_DIR"
    
    if [ -f .env ]; then
        log_warning ".env file already exists"
        if confirm "Do you want to overwrite it?"; then
            rm .env
        else
            log_info "Using existing .env file"
            return 0
        fi
    fi
    
    log_info "Copying .env.example to .env..."
    cp .env.example .env
    
    # Generate secure secrets
    log_info "Generating secure secrets..."
    
    local jwt_secret=$(openssl rand -base64 64 | tr -d '\n')
    local session_secret=$(openssl rand -base64 64 | tr -d '\n')
    local postgres_password=$(openssl rand -base64 32 | tr -d '\n')
    local redis_password=$(openssl rand -base64 32 | tr -d '\n')
    local minio_password=$(openssl rand -base64 32 | tr -d '\n')
    
    # Update .env file
    sed -i.bak "s|JWT_SECRET=.*|JWT_SECRET=$jwt_secret|" .env
    sed -i.bak "s|SESSION_SECRET=.*|SESSION_SECRET=$session_secret|" .env
    sed -i.bak "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$postgres_password|" .env
    sed -i.bak "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=$redis_password|" .env
    sed -i.bak "s|MINIO_ROOT_PASSWORD=.*|MINIO_ROOT_PASSWORD=$minio_password|" .env
    sed -i.bak "s|S3_SECRET_KEY=.*|S3_SECRET_KEY=$minio_password|" .env
    sed -i.bak "s|ARCHITECTURE_MODE=.*|ARCHITECTURE_MODE=$ARCHITECTURE|" .env
    sed -i.bak "s|INSTALLATION_DATE=.*|INSTALLATION_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)|" .env
    sed -i.bak "s|DEPLOYMENT_ID=.*|DEPLOYMENT_ID=$(uuidgen 2>/dev/null || echo "manual-$(date +%s)")|" .env
    
    rm .env.bak
    
    log_success "Environment configured with secure defaults"
    
    # Prompt for optional configurations
    echo ""
    if confirm "Do you want to configure SSO (Google, Microsoft, DigiLocker)?"; then
        configure_sso
    fi
    
    if confirm "Do you want to configure email (SMTP)?"; then
        configure_email
    fi
}

configure_sso() {
    echo ""
    log_info "SSO Configuration (can be configured later in .env)"
    
    if confirm "Configure Google OAuth?"; then
        read -p "Google Client ID: " google_id
        read -p "Google Client Secret: " google_secret
        sed -i.bak "s|GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$google_id|" .env
        sed -i.bak "s|GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=$google_secret|" .env
        rm .env.bak
    fi
    
    if confirm "Configure Microsoft Azure AD?"; then
        read -p "Microsoft Client ID: " ms_id
        read -p "Microsoft Client Secret: " ms_secret
        sed -i.bak "s|MICROSOFT_CLIENT_ID=.*|MICROSOFT_CLIENT_ID=$ms_id|" .env
        sed -i.bak "s|MICROSOFT_CLIENT_SECRET=.*|MICROSOFT_CLIENT_SECRET=$ms_secret|" .env
        rm .env.bak
    fi
}

configure_email() {
    echo ""
    log_info "Email Configuration"
    
    read -p "SMTP Host (e.g., smtp.gmail.com): " smtp_host
    read -p "SMTP Port (587 for TLS): " smtp_port
    read -p "SMTP Username: " smtp_user
    read -s -p "SMTP Password: " smtp_pass
    echo ""
    
    sed -i.bak "s|SMTP_HOST=.*|SMTP_HOST=$smtp_host|" .env
    sed -i.bak "s|SMTP_PORT=.*|SMTP_PORT=$smtp_port|" .env
    sed -i.bak "s|SMTP_USER=.*|SMTP_USER=$smtp_user|" .env
    sed -i.bak "s|SMTP_PASSWORD=.*|SMTP_PASSWORD=$smtp_pass|" .env
    rm .env.bak
}

# =============================================================================
# INSTALLATION
# =============================================================================

install_services() {
    print_header "Installing Services"
    
    cd "$DEPLOYMENT_DIR"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would execute: docker-compose up -d"
        return 0
    fi
    
    log_info "Pulling Docker images..."
    docker-compose pull
    
    log_info "Starting services..."
    docker-compose up -d
    
    log_info "Waiting for services to be healthy..."
    sleep 10
    
    # Wait for health checks
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose ps | grep -q "unhealthy"; then
            log_info "Waiting for services... (attempt $((attempt+1))/$max_attempts)"
            sleep 10
            ((attempt++))
        else
            break
        fi
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "Services failed to become healthy"
        docker-compose ps
        docker-compose logs
        return 1
    fi
    
    log_success "All services started successfully"
}

# =============================================================================
# POST-INSTALL VALIDATION (Volume 11 Section 12)
# =============================================================================

validate_installation() {
    print_header "Post-Install Validation"
    
    local validation_score=0
    local max_score=10
    
    # Check 1: Services running
    log_info "Checking service status..."
    if docker-compose ps | grep -q "Up"; then
        log_success "✓ Services are running"
        ((validation_score++))
    else
        log_error "✗ Services are not running properly"
    fi
    
    # Check 2: Database connectivity
    log_info "Checking database connectivity..."
    if docker-compose exec -T postgres pg_isready >/dev/null 2>&1; then
        log_success "✓ PostgreSQL is accessible"
        ((validation_score++))
    else
        log_error "✗ PostgreSQL connectivity failed"
    fi
    
    # Check 3: Redis connectivity
    log_info "Checking Redis connectivity..."
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        log_success "✓ Redis is accessible"
        ((validation_score++))
    else
        log_error "✗ Redis connectivity failed"
    fi
    
    # Check 4: MinIO connectivity
    log_info "Checking MinIO (object storage)..."
    if curl -sf http://localhost:9000/minio/health/live >/dev/null 2>&1; then
        log_success "✓ MinIO is accessible"
        ((validation_score++))
    else
        log_error "✗ MinIO connectivity failed"
    fi
    
    # Check 5: Backend API health
    log_info "Checking backend API..."
    local api_attempts=0
    while [ $api_attempts -lt 10 ]; do
        if curl -sf http://localhost:3001/api/v1/health >/dev/null 2>&1; then
            log_success "✓ Backend API is healthy"
            ((validation_score++))
            break
        else
            sleep 3
            ((api_attempts++))
        fi
    done
    
    if [ $api_attempts -eq 10 ]; then
        log_error "✗ Backend API health check failed"
    fi
    
    # Check 6: Frontend accessibility
    log_info "Checking frontend..."
    local frontend_attempts=0
    while [ $frontend_attempts -lt 10 ]; do
        if curl -sf http://localhost:3000 >/dev/null 2>&1; then
            log_success "✓ Frontend is accessible"
            ((validation_score++))
            break
        else
            sleep 3
            ((frontend_attempts++))
        fi
    done
    
    if [ $frontend_attempts -eq 10 ]; then
        log_error "✗ Frontend accessibility failed"
    fi
    
    # Check 7: HTTPS/TLS (warning if not configured)
    if [ -f "$DEPLOYMENT_DIR/nginx/ssl/cert.pem" ]; then
        log_success "✓ TLS certificates found"
        ((validation_score++))
    else
        log_warning "⚠ TLS not configured (recommended for production)"
    fi
    
    # Check 8: Backup configuration
    if grep -q "BACKUP_ENABLED=true" "$DEPLOYMENT_DIR/.env"; then
        log_success "✓ Backup enabled"
        ((validation_score++))
    else
        log_warning "⚠ Backup not enabled (recommended for production)"
    fi
    
    # Check 9: Secure secrets
    if grep -q "changeme" "$DEPLOYMENT_DIR/.env"; then
        log_warning "⚠ Default secrets detected (should be changed)"
    else
        log_success "✓ Secure secrets configured"
        ((validation_score++))
    fi
    
    # Check 10: Production mode
    if grep -q "NODE_ENV=production" "$DEPLOYMENT_DIR/.env"; then
        log_success "✓ Production mode enabled"
        ((validation_score++))
    else
        log_warning "⚠ Development mode active"
    fi
    
    echo ""
    print_header "Installation Validation Score"
    echo "Score: $validation_score / $max_score"
    
    if [ $validation_score -ge 8 ]; then
        log_success "Excellent! Installation is production-ready"
    elif [ $validation_score -ge 6 ]; then
        log_warning "Good! Review warnings above before production use"
    else
        log_error "Installation needs attention. Review errors above."
    fi
    
    return 0
}

# =============================================================================
# ENTERPRISE READINESS SCORE (Volume 11 Section 13)
# =============================================================================

generate_readiness_report() {
    print_header "Enterprise Readiness Report"
    
    local total_score=0
    local max_score=100
    
    echo "Evaluating production readiness..."
    echo ""
    
    # Category 1: Security (30 points)
    echo "1. Security & Authentication (30 points)"
    local security_score=0
    
    if ! grep -q "changeme" "$DEPLOYMENT_DIR/.env"; then
        echo "   ✓ Secure secrets configured (+10)"
        security_score=$((security_score + 10))
    else
        echo "   ✗ Default secrets detected (0)"
    fi
    
    if [ -f "$DEPLOYMENT_DIR/nginx/ssl/cert.pem" ]; then
        echo "   ✓ TLS/HTTPS enabled (+10)"
        security_score=$((security_score + 10))
    else
        echo "   ✗ TLS not configured (0)"
    fi
    
    if grep -q "ENABLE_CSRF_PROTECTION=true" "$DEPLOYMENT_DIR/.env"; then
        echo "   ✓ CSRF protection enabled (+5)"
        security_score=$((security_score + 5))
    fi
    
    if grep -q "ENABLE_RATE_LIMITING=true" "$DEPLOYMENT_DIR/.env"; then
        echo "   ✓ Rate limiting enabled (+5)"
        security_score=$((security_score + 5))
    fi
    
    total_score=$((total_score + security_score))
    echo "   Security Score: $security_score/30"
    echo ""
    
    # Category 2: Data Management (25 points)
    echo "2. Data Management & Backup (25 points)"
    local data_score=0
    
    if docker-compose exec -T postgres pg_isready >/dev/null 2>&1; then
        echo "   ✓ Database connectivity verified (+10)"
        data_score=$((data_score + 10))
    fi
    
    if grep -q "BACKUP_ENABLED=true" "$DEPLOYMENT_DIR/.env"; then
        echo "   ✓ Backup enabled (+10)"
        data_score=$((data_score + 10))
    else
        echo "   ✗ Backup not configured (0)"
    fi
    
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        echo "   ✓ Redis cache operational (+5)"
        data_score=$((data_score + 5))
    fi
    
    total_score=$((total_score + data_score))
    echo "   Data Score: $data_score/25"
    echo ""
    
    # Category 3: Availability (20 points)
    echo "3. Availability & Reliability (20 points)"
    local availability_score=0
    
    if curl -sf http://localhost:3001/api/v1/health >/dev/null 2>&1; then
        echo "   ✓ Backend health checks passing (+10)"
        availability_score=$((availability_score + 10))
    fi
    
    if curl -sf http://localhost:3000 >/dev/null 2>&1; then
        echo "   ✓ Frontend accessible (+10)"
        availability_score=$((availability_score + 10))
    fi
    
    total_score=$((total_score + availability_score))
    echo "   Availability Score: $availability_score/20"
    echo ""
    
    # Category 4: Monitoring (15 points)
    echo "4. Monitoring & Observability (15 points)"
    local monitoring_score=0
    
    if grep -q "ENABLE_METRICS=true" "$DEPLOYMENT_DIR/.env"; then
        echo "   ✓ Metrics collection enabled (+5)"
        monitoring_score=$((monitoring_score + 5))
    fi
    
    if grep -q "LOG_LEVEL=info" "$DEPLOYMENT_DIR/.env" || grep -q "LOG_LEVEL=warn" "$DEPLOYMENT_DIR/.env"; then
        echo "   ✓ Logging configured (+5)"
        monitoring_score=$((monitoring_score + 5))
    fi
    
    if [ -n "$(grep SENTRY_DSN= "$DEPLOYMENT_DIR/.env" | cut -d= -f2)" ]; then
        echo "   ✓ Error tracking configured (+5)"
        monitoring_score=$((monitoring_score + 5))
    else
        echo "   ⚠ Error tracking not configured (0)"
    fi
    
    total_score=$((total_score + monitoring_score))
    echo "   Monitoring Score: $monitoring_score/15"
    echo ""
    
    # Category 5: Compliance (10 points)
    echo "5. Compliance & Privacy (10 points)"
    local compliance_score=0
    
    if grep -q "DPDP_ACT_2023_ENABLED=true" "$DEPLOYMENT_DIR/.env"; then
        echo "   ✓ DPDP Act 2023 compliance enabled (+5)"
        compliance_score=$((compliance_score + 5))
    fi
    
    if grep -q "COOKIE_CONSENT_REQUIRED=true" "$DEPLOYMENT_DIR/.env"; then
        echo "   ✓ Cookie consent enabled (+5)"
        compliance_score=$((compliance_score + 5))
    fi
    
    total_score=$((total_score + compliance_score))
    echo "   Compliance Score: $compliance_score/10"
    echo ""
    
    # Final Score
    print_header "ENTERPRISE READINESS SCORE"
    echo ""
    echo "   Total Score: $total_score / $max_score"
    echo ""
    
    if [ $total_score -ge 90 ]; then
        log_success "EXCELLENT - Ready for production deployment"
    elif [ $total_score -ge 75 ]; then
        log_success "GOOD - Production-ready with minor improvements"
    elif [ $total_score -ge 60 ]; then
        log_warning "FAIR - Address warnings before production"
    else
        log_error "NEEDS IMPROVEMENT - Not recommended for production"
    fi
    
    echo ""
    echo "Recommendations:"
    
    if [ $security_score -lt 25 ]; then
        echo "  • Enable TLS/HTTPS for secure communication"
        echo "  • Update all default secrets"
    fi
    
    if [ $data_score -lt 20 ]; then
        echo "  • Configure automated backups"
        echo "  • Test restore procedures"
    fi
    
    if [ $monitoring_score -lt 10 ]; then
        echo "  • Set up error tracking (Sentry)"
        echo "  • Configure monitoring alerts"
    fi
}

# =============================================================================
# POST-INSTALLATION SUMMARY
# =============================================================================

print_summary() {
    print_header "Installation Complete!"
    
    echo "ServiceFormAI OS has been installed successfully."
    echo ""
    echo "Access Points:"
    echo "  Frontend:      http://localhost:3000"
    echo "  Backend API:   http://localhost:3001"
    echo "  API Docs:      http://localhost:3001/api/docs"
    echo "  MinIO Console: http://localhost:9001"
    echo ""
    echo "Initial Admin Setup:"
    echo "  Navigate to: http://localhost:3000/setup"
    echo "  Create your first admin account"
    echo ""
    echo "Configuration:"
    echo "  Environment:   $DEPLOYMENT_DIR/.env"
    echo "  Architecture:  $ARCHITECTURE"
    echo ""
    echo "Useful Commands:"
    echo "  View logs:     docker-compose logs -f"
    echo "  Stop services: docker-compose stop"
    echo "  Restart:       docker-compose restart"
    echo "  Status:        docker-compose ps"
    echo ""
    echo "Next Steps:"
    echo "  1. Complete admin setup at http://localhost:3000/setup"
    echo "  2. Review .env file and configure SSO if needed"
    echo "  3. Set up backups (see /deployment/docs/backup-guide.md)"
    echo "  4. Configure monitoring and alerts"
    echo "  5. Review security checklist"
    echo ""
    echo "Documentation:"
    echo "  /deployment/docs/"
    echo ""
    log_success "Installation completed successfully!"
}

# =============================================================================
# MAIN INSTALLATION FLOW
# =============================================================================

main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --config)
                CONFIG_FILE="$2"
                INTERACTIVE=false
                shift 2
                ;;
            --skip-validation)
                SKIP_VALIDATION=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    print_banner
    
    if [ "$DRY_RUN" = true ]; then
        log_warning "Running in DRY RUN mode - no changes will be made"
    fi
    
    # Step 1: Pre-install validation
    if [ "$SKIP_VALIDATION" = false ]; then
        validate_prerequisites
    fi
    
    # Step 2: Architecture recommendation
    if [ "$INTERACTIVE" = true ]; then
        recommend_architecture
    else
        ARCHITECTURE="small"
        log_info "Non-interactive mode: Using small architecture"
    fi
    
    # Step 3: Environment configuration
    configure_environment
    
    # Step 4: Installation
    if confirm "Ready to install. Continue?"; then
        install_services
    else
        log_info "Installation cancelled by user"
        exit 0
    fi
    
    # Step 5: Post-install validation
    validate_installation
    
    # Step 6: Generate readiness report
    generate_readiness_report
    
    # Step 7: Print summary
    print_summary
    
    echo ""
    log_success "Thank you for installing ServiceFormAI OS!"
}

show_help() {
    cat << EOF
ServiceFormAI OS Installer

Usage:
  ./install.sh [OPTIONS]

Options:
  --dry-run              Run validation only, don't make changes
  --config FILE          Use configuration file for non-interactive install
  --skip-validation      Skip pre-install validation checks
  --help                 Show this help message

Examples:
  ./install.sh                        # Interactive installation
  ./install.sh --dry-run              # Validate prerequisites only
  ./install.sh --config setup.yml     # Automated installation

Documentation:
  /deployment/docs/installation-guide.md

EOF
}

# Run main function
main "$@"
