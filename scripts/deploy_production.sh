#!/bin/bash
# Production Deployment Script
# UNS-CLAUDEJP 5.4 - Production Security Hardening
#
# This script automates the deployment of the UNS-CLAUDEJP system
# to production with security hardening, monitoring, and rollback capabilities.
#
# Usage:
#   ./deploy_production.sh [options]
#
# Options:
#   -e, --env FILE         Environment file (default: .env.production)
#   -t, --tag TAG         Docker image tag (default: latest)
#   -b, --backup           Create backup before deployment
#   -r, --rollback TAG     Rollback to specified tag
#   -d, --dry-run          Show what would be done without executing
#   -f, --force            Force deployment without confirmation
#   -h, --help             Show this help message

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/deploy_production.log"
BACKUP_DIR="$PROJECT_ROOT/backups/deployments"
CONFIG_FILE="$PROJECT_ROOT/config/production_config.json"

# Default values
ENV_FILE=".env.production"
DOCKER_TAG="latest"
CREATE_BACKUP=false
DRY_RUN=false
FORCE_DEPLOY=false
ROLLBACK_TAG=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# FUNCTIONS
# =============================================================================

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Write to log file
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    # Output to console with colors
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} $message"
            ;;
        *)
            echo "[$level] $message"
            ;;
    esac
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Success message
success() {
    log "INFO" "$1"
    echo -e "${GREEN}✓ $1${NC}"
}

# Warning message
warning() {
    log "WARN" "$1"
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Error message
error() {
    log "ERROR" "$1"
    echo -e "${RED}✗ $1${NC}"
}

# Debug message
debug() {
    if [[ "$DEBUG" == "true" ]]; then
        log "DEBUG" "$1"
        echo -e "${BLUE}→ $1${NC}"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        error_exit "This script should not be run as root for security reasons"
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error_exit "Docker is not installed or not in PATH"
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error_exit "Docker Compose is not installed or not in PATH"
    fi
    
    # Check if environment file exists
    if [[ ! -f "$ENV_FILE" ]]; then
        error_exit "Environment file $ENV_FILE does not exist"
    fi
    
    # Check if Docker Compose file exists
    if [[ ! -f "$PROJECT_ROOT/docker-compose.prod.yml" ]]; then
        error_exit "Docker Compose file $PROJECT_ROOT/docker-compose.prod.yml does not exist"
    fi
    
    # Check if we can connect to Docker
    if ! docker info &> /dev/null; then
        error_exit "Cannot connect to Docker daemon"
    fi
    
    success "All prerequisites satisfied"
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -e|--env)
                ENV_FILE="$2"
                shift 2
                ;;
            -t|--tag)
                DOCKER_TAG="$2"
                shift 2
                ;;
            -b|--backup)
                CREATE_BACKUP=true
                shift
                ;;
            -r|--rollback)
                ROLLBACK_TAG="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE_DEPLOY=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                error_exit "Unknown option: $1"
                ;;
        esac
    done
}

# Show help message
show_help() {
    cat << EOF
Production Deployment Script for UNS-CLAUDEJP 5.4

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -e, --env FILE         Environment file (default: .env.production)
    -t, --tag TAG         Docker image tag (default: latest)
    -b, --backup           Create backup before deployment
    -r, --rollback TAG     Rollback to specified tag
    -d, --dry-run          Show what would be done without executing
    -f, --force            Force deployment without confirmation
    -h, --help             Show this help message

EXAMPLES:
    $0                                    # Deploy with default settings
    $0 -t v5.4.1 -b                    # Deploy version 5.4.1 with backup
    $0 -r v5.4.0                        # Rollback to version 5.4.0
    $0 -d                                 # Dry run to see what would be done

EOF
}

# Validate environment
validate_environment() {
    log "INFO" "Validating environment..."
    
    # Check if we're in production environment
    if [[ ! -f "$ENV_FILE" ]]; then
        error_exit "Environment file $ENV_FILE not found"
    fi
    
    # Source environment file
    source "$ENV_FILE"
    
    # Validate required environment variables
    local required_vars=(
        "UNS_ENVIRONMENT"
        "DATABASE_URL"
        "SECRET_KEY"
        "UNS_CLAUDEJP_MASTER_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error_exit "Required environment variable $var is not set"
        fi
    done
    
    # Validate environment-specific settings
    if [[ "$UNS_ENVIRONMENT" != "production" ]]; then
        error_exit "UNS_ENVIRONMENT must be set to 'production'"
    fi
    
    if [[ "$UNS_DEBUG" == "true" ]]; then
        error_exit "UNS_DEBUG must be set to 'false' in production"
    fi
    
    success "Environment validation passed"
}

# Create backup
create_backup() {
    if [[ "$CREATE_BACKUP" != "true" ]]; then
        return 0
    fi
    
    log "INFO" "Creating backup before deployment..."
    
    local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    # Backup current running containers
    log "INFO" "Backing up current containers..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps --format json > "$backup_path/containers.json"
    
    # Backup volumes
    log "INFO" "Backing up volumes..."
    docker run --rm -v "$PROJECT_ROOT:/source:ro" -v "$backup_path:/backup" \
        alpine tar czf /backup/volumes.tar.gz -C /source \
        app_data app_uploads app_cache db_data redis_data
    
    # Backup configuration
    log "INFO" "Backing up configuration..."
    cp "$ENV_FILE" "$backup_path/.env.production"
    cp "$PROJECT_ROOT/docker-compose.prod.yml" "$backup_path/"
    
    # Create backup metadata
    cat > "$backup_path/metadata.json" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "docker_tag": "$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" images -q)",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "deployed_by": "$(whoami)",
    "deployment_type": "backup"
}
EOF
    
    # Compress backup
    log "INFO" "Compressing backup..."
    cd "$BACKUP_DIR"
    tar czf "$backup_name.tar.gz" "$backup_name"
    rm -rf "$backup_name"
    
    success "Backup created: $backup_name.tar.gz"
    
    # Clean up old backups (keep last 10)
    log "INFO" "Cleaning up old backups..."
    ls -t "$BACKUP_DIR"/*.tar.gz | tail -n +11 | xargs -r rm -f
}

# Build Docker images
build_images() {
    log "INFO" "Building Docker images..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        debug "Would build: docker-compose -f $PROJECT_ROOT/docker-compose.prod.yml build"
        return 0
    fi
    
    # Build images
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    success "Docker images built successfully"
}

# Run security scans
run_security_scans() {
    log "INFO" "Running security scans..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        debug "Would run security scans on built images"
        return 0
    fi
    
    # Scan for vulnerabilities
    log "INFO" "Scanning for security vulnerabilities..."
    
    # Get list of images
    local images=$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" images -q)
    
    for image in $images; do
        log "INFO" "Scanning image: $image"
        
        # Run Trivy scan if available
        if command -v trivy &> /dev/null; then
            trivy image --format json --output "$PROJECT_ROOT/logs/trivy_$image.json" "$image" || \
                warning "Trivy scan failed for $image"
        else
            warning "Trivy not available, skipping vulnerability scan for $image"
        fi
    done
    
    success "Security scans completed"
}

# Deploy application
deploy_application() {
    log "INFO" "Deploying application..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        debug "Would deploy: docker-compose -f $PROJECT_ROOT/docker-compose.prod.yml up -d"
        return 0
    fi
    
    # Stop existing containers
    log "INFO" "Stopping existing containers..."
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.prod.yml down
    
    # Pull latest images
    log "INFO" "Pulling latest images..."
    docker-compose -f docker-compose.prod.yml pull
    
    # Start new containers
    log "INFO" "Starting new containers..."
    docker-compose -f docker-compose.prod.yml up -d
    
    success "Application deployed successfully"
}

# Wait for application to be healthy
wait_for_health() {
    log "INFO" "Waiting for application to be healthy..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        debug "Would wait for health checks"
        return 0
    fi
    
    # Wait for containers to be healthy
    local max_wait=300  # 5 minutes
    local wait_interval=10
    local elapsed=0
    
    while [[ $elapsed -lt $max_wait ]]; do
        # Check if all containers are healthy
        local unhealthy_containers=$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps --filter "status=running" --filter "health=unhealthy" -q)
        
        if [[ -z "$unhealthy_containers" ]]; then
            success "All containers are healthy"
            return 0
        fi
        
        log "INFO" "Waiting for containers to be healthy... (${elapsed}s/${max_wait}s)"
        sleep $wait_interval
        elapsed=$((elapsed + wait_interval))
    done
    
    error "Application did not become healthy within $max_wait seconds"
    
    # Show container status
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps
}

# Run post-deployment tests
run_post_deployment_tests() {
    log "INFO" "Running post-deployment tests..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        debug "Would run post-deployment tests"
        return 0
    fi
    
    # Test application endpoints
    local app_url="https://uns-kikaku.com"
    
    # Test health endpoint
    log "INFO" "Testing health endpoint..."
    if curl -f -s "$app_url/health" > /dev/null; then
        success "Health endpoint is responding"
    else
        error "Health endpoint is not responding"
        return 1
    fi
    
    # Test main application
    log "INFO" "Testing main application..."
    if curl -f -s "$app_url/" > /dev/null; then
        success "Main application is responding"
    else
        error "Main application is not responding"
        return 1
    fi
    
    success "Post-deployment tests passed"
}

# Rollback to previous version
rollback() {
    if [[ -z "$ROLLBACK_TAG" ]]; then
        error_exit "Rollback tag not specified"
    fi
    
    log "INFO" "Rolling back to version: $ROLLBACK_TAG"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        debug "Would rollback to: $ROLLBACK_TAG"
        return 0
    fi
    
    # Find backup for rollback tag
    local backup_file=$(find "$BACKUP_DIR" -name "backup_*.tar.gz" -exec grep -l "$ROLLBACK_TAG" {} \; 2>/dev/null | head -1)
    
    if [[ -z "$backup_file" ]]; then
        error_exit "No backup found for tag: $ROLLBACK_TAG"
    fi
    
    log "INFO" "Using backup: $backup_file"
    
    # Extract backup
    local temp_backup_dir="/tmp/rollback_$(date +%s)"
    mkdir -p "$temp_backup_dir"
    tar xzf "$backup_file" -C "$temp_backup_dir"
    
    # Stop current containers
    log "INFO" "Stopping current containers..."
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.prod.yml down
    
    # Restore volumes
    log "INFO" "Restoring volumes..."
    docker run --rm -v "$temp_backup_dir/backup:/backup:ro" -v "$PROJECT_ROOT:/target" \
        alpine tar xzf /backup/volumes.tar.gz -C /target
    
    # Restore configuration
    log "INFO" "Restoring configuration..."
    cp "$temp_backup_dir/backup/.env.production" "$PROJECT_ROOT/"
    cp "$temp_backup_dir/backup/docker-compose.prod.yml" "$PROJECT_ROOT/"
    
    # Start containers with rollback tag
    log "INFO" "Starting containers with rollback tag..."
    DOCKER_TAG="$ROLLBACK_TAG" docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for health
    wait_for_health
    
    # Cleanup
    rm -rf "$temp_backup_dir"
    
    success "Rollback to $ROLLBACK_TAG completed successfully"
}

# Cleanup function
cleanup() {
    log "INFO" "Performing cleanup..."
    
    # Remove unused Docker images
    log "INFO" "Removing unused Docker images..."
    docker image prune -f
    
    # Remove unused Docker volumes
    log "INFO" "Removing unused Docker volumes..."
    docker volume prune -f
    
    success "Cleanup completed"
}

# Send deployment notification
send_notification() {
    local status=$1
    local message=$2
    
    log "INFO" "Sending deployment notification: $status"
    
    # Send email notification if configured
    if [[ -n "${UNS_ALERT_EMAIL_RECIPIENTS:-}" ]]; then
        echo "$message" | mail -s "UNS-CLAUDEJP Deployment $status" "$UNS_ALERT_EMAIL_RECIPIENTS"
    fi
    
    # Send webhook notification if configured
    if [[ -n "${UNS_ALERT_WEBHOOK_URLS:-}" ]]; then
        local payload=$(cat << EOF
{
    "text": "$message",
    "username": "Deployment Bot",
    "icon_emoji": ":rocket:"
}
EOF
)
        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$UNS_ALERT_WEBHOOK_URLS" || \
            warning "Failed to send webhook notification"
    fi
}

# Main deployment function
main() {
    log "INFO" "Starting UNS-CLAUDEJP production deployment..."
    log "INFO" "Deployment started at: $(date)"
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$BACKUP_DIR"
    
    # Check if this is a rollback
    if [[ -n "$ROLLBACK_TAG" ]]; then
        rollback
        send_notification "SUCCESS" "Rollback to $ROLLBACK_TAG completed successfully"
        exit 0
    fi
    
    # Normal deployment flow
    check_prerequisites
    validate_environment
    
    # Ask for confirmation unless forced or dry run
    if [[ "$FORCE_DEPLOY" != "true" && "$DRY_RUN" != "true" ]]; then
        echo -e "${YELLOW}This will deploy UNS-CLAUDEJP to production.${NC}"
        echo -e "${YELLOW}Environment: $ENV_FILE${NC}"
        echo -e "${YELLOW}Docker tag: $DOCKER_TAG${NC}"
        echo -e "${YELLOW}Create backup: $CREATE_BACKUP${NC}"
        echo ""
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Deployment cancelled by user"
            exit 0
        fi
    fi
    
    # Deployment steps
    create_backup
    build_images
    run_security_scans
    deploy_application
    wait_for_health
    run_post_deployment_tests
    cleanup
    
    # Success notification
    local success_message="UNS-CLAUDEJP deployed successfully to production at $(date)"
    success "$success_message"
    send_notification "SUCCESS" "$success_message"
    
    log "INFO" "Deployment completed successfully"
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Set up error handling
trap 'error_exit "Script interrupted"' INT TERM

# Parse arguments
parse_arguments "$@"

# Enable debug mode if requested
if [[ "$DRY_RUN" == "true" ]]; then
    DEBUG=true
fi

# Run main function
main

exit 0