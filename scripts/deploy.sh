#!/bin/bash

# ITOSM Platform Deployment Script
# This script helps deploy the ITOSM Platform to Docker Hub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_HUB_USERNAME=""
IMAGE_NAME="itosm-platform"
VERSION="1.0"

# Functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    print_info "Checking Docker status..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    print_success "Docker is running"
}

# Get Docker Hub username
get_username() {
    if [ -z "$DOCKER_HUB_USERNAME" ]; then
        echo -n "Enter your Docker Hub username: "
        read DOCKER_HUB_USERNAME
        if [ -z "$DOCKER_HUB_USERNAME" ]; then
            print_error "Docker Hub username is required"
            exit 1
        fi
    fi
}

# Login to Docker Hub
docker_login() {
    print_info "Logging into Docker Hub..."
    if ! docker login; then
        print_error "Failed to login to Docker Hub"
        exit 1
    fi
    print_success "Successfully logged into Docker Hub"
}

# Build Docker image
build_image() {
    print_info "Building Docker image..."
    local image_tag="${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION}"
    local latest_tag="${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:latest"
    
    if docker build -t "$image_tag" -t "$latest_tag" .; then
        print_success "Successfully built image: $image_tag"
        print_success "Successfully built image: $latest_tag"
    else
        print_error "Failed to build Docker image"
        exit 1
    fi
}

# Push to Docker Hub
push_image() {
    print_info "Pushing image to Docker Hub..."
    local image_tag="${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:${VERSION}"
    local latest_tag="${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:latest"
    
    if docker push "$image_tag" && docker push "$latest_tag"; then
        print_success "Successfully pushed images to Docker Hub"
        print_info "Image available at: docker pull $latest_tag"
    else
        print_error "Failed to push image to Docker Hub"
        exit 1
    fi
}

# Test local deployment
test_deployment() {
    print_info "Testing local deployment..."
    
    # Stop existing containers
    docker-compose down > /dev/null 2>&1 || true
    
    # Start services
    if docker-compose up -d; then
        print_info "Waiting for services to start..."
        sleep 30
        
        # Check health
        if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
            print_success "Local deployment test passed"
            print_info "Application available at: http://localhost:5000"
        else
            print_warning "Services started but health check failed"
        fi
        
        # Show logs
        print_info "Recent logs:"
        docker-compose logs --tail=10
    else
        print_error "Failed to start services for testing"
    fi
}

# Create deployment package
create_package() {
    print_info "Creating deployment package..."
    
    local package_name="itosm-platform-deployment-$(date +%Y%m%d).zip"
    
    # Create temporary directory
    local temp_dir=$(mktemp -d)
    local package_dir="$temp_dir/itosm-platform"
    
    mkdir -p "$package_dir"
    
    # Copy necessary files
    cp docker-compose.yml "$package_dir/"
    cp .env.example "$package_dir/"
    cp nginx.conf "$package_dir/"
    cp init-db.sql "$package_dir/"
    cp README.md "$package_dir/"
    cp DEPLOYMENT_GUIDE.md "$package_dir/"
    cp API_DOCUMENTATION.md "$package_dir/"
    cp FEATURES_DOCUMENTATION.md "$package_dir/"
    
    # Create modified docker-compose.yml for deployment
    sed "s/yourusername/${DOCKER_HUB_USERNAME}/g" docker-compose.yml > "$package_dir/docker-compose-hub.yml"
    
    # Create deployment instructions
    cat > "$package_dir/DEPLOY_FROM_HUB.md" << EOF
# Deploy ITOSM Platform from Docker Hub

## Quick Start

1. Copy .env.example to .env and configure:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your settings
   \`\`\`

2. Deploy using Docker Hub image:
   \`\`\`bash
   docker-compose -f docker-compose-hub.yml up -d
   \`\`\`

3. Access the application:
   - URL: http://localhost:5000
   - Admin login: admin/password (change immediately)

## Your Docker Hub Image
- Image: ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:latest
- Pull command: docker pull ${DOCKER_HUB_USERNAME}/${IMAGE_NAME}:latest

For detailed instructions, see DEPLOYMENT_GUIDE.md
EOF
    
    # Create zip package
    (cd "$temp_dir" && zip -r "$package_name" itosm-platform/)
    mv "$temp_dir/$package_name" .
    
    # Cleanup
    rm -rf "$temp_dir"
    
    print_success "Deployment package created: $package_name"
}

# Main execution
main() {
    print_info "ITOSM Platform Deployment Script"
    print_info "=================================="
    
    check_docker
    get_username
    
    echo ""
    print_info "Deployment options:"
    echo "1. Full deployment (build + push + test)"
    echo "2. Build only"
    echo "3. Push only (requires existing build)"
    echo "4. Test local deployment only"
    echo "5. Create deployment package"
    echo ""
    
    echo -n "Select option (1-5): "
    read option
    
    case $option in
        1)
            docker_login
            build_image
            push_image
            test_deployment
            create_package
            ;;
        2)
            build_image
            ;;
        3)
            docker_login
            push_image
            ;;
        4)
            test_deployment
            ;;
        5)
            create_package
            ;;
        *)
            print_error "Invalid option selected"
            exit 1
            ;;
    esac
    
    echo ""
    print_success "Deployment script completed successfully!"
    print_info "Your ITOSM Platform is ready for production deployment"
}

# Run main function
main "$@"