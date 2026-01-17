#!/bin/bash

# ASCA E-commerce Platform Deployment Script
# This script automates the deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
REGISTRY="ghcr.io/burnatec/asca_ecom"

echo -e "${GREEN}🚀 Starting deployment of ASCA E-commerce Platform${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Version: $VERSION${NC}"

# Check if required tools are installed
check_requirements() {
    echo -e "${YELLOW}🔍 Checking requirements...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}❌ kubectl is not installed${NC}"
        exit 1
    fi
    
    if ! command -v helm &> /dev/null; then
        echo -e "${RED}❌ Helm is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements met${NC}"
}

# Build and push Docker images
build_and_push() {
    echo -e "${YELLOW}🏗️  Building and pushing Docker images...${NC}"
    
    services=("frontend" "backend" "api")
    
    for service in "${services[@]}"; do
        echo -e "${YELLOW}Building $service...${NC}"
        docker build -t $REGISTRY/$service:$VERSION ./ecommerce-platform/$service/
        
        echo -e "${YELLOW}Pushing $service...${NC}"
        docker push $REGISTRY/$service:$VERSION
        
        echo -e "${GREEN}✅ $service built and pushed${NC}"
    done
}

# Deploy to Kubernetes
deploy_kubernetes() {
    echo -e "${YELLOW}☸️  Deploying to Kubernetes...${NC}"
    
    # Create namespace if it doesn't exist
    kubectl create namespace asca-ecom --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply secrets
    echo -e "${YELLOW}Applying secrets...${NC}"
    kubectl apply -f kubernetes/secrets/ -n asca-ecom
    
    # Deploy with Helm
    echo -e "${YELLOW}Deploying with Helm...${NC}"
    helm upgrade --install asca-ecom ./helm-chart \
        --namespace asca-ecom \
        --set global.imageTag=$VERSION \
        --set env.nodeEnv=$ENVIRONMENT \
        --values helm-chart/values-$ENVIRONMENT.yaml \
        --wait \
        --timeout=10m
    
    echo -e "${GREEN}✅ Deployment completed${NC}"
}

# Deploy with Docker Compose
deploy_docker_compose() {
    echo -e "${YELLOW}🐳 Deploying with Docker Compose...${NC}"
    
    # Load environment variables
    if [ -f ".env.$ENVIRONMENT" ]; then
        export $(cat .env.$ENVIRONMENT | xargs)
    else
        echo -e "${RED}❌ Environment file .env.$ENVIRONMENT not found${NC}"
        exit 1
    fi
    
    # Stop existing services
    docker-compose -f docker-compose.prod.yml down
    
    # Pull latest images
    docker-compose -f docker-compose.prod.yml pull
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
    sleep 30
    
    # Check service health
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up (healthy)"; then
        echo -e "${GREEN}✅ All services are healthy${NC}"
    else
        echo -e "${RED}❌ Some services are not healthy${NC}"
        docker-compose -f docker-compose.prod.yml ps
        exit 1
    fi
}

# Run health checks
health_checks() {
    echo -e "${YELLOW}🏥 Running health checks...${NC}"
    
    if command -v kubectl &> /dev/null && kubectl cluster-info &> /dev/null; then
        # Kubernetes health checks
        kubectl get pods -n asca-ecom
        kubectl get services -n asca-ecom
        kubectl get ingress -n asca-ecom
    else
        # Docker Compose health checks
        docker-compose -f docker-compose.prod.yml ps
    fi
    
    echo -e "${GREEN}✅ Health checks completed${NC}"
}

# Cleanup old images
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up old images...${NC}"
    
    # Remove old Docker images
    docker image prune -f
    
    # Remove old Helm releases
    if command -v helm &> /dev/null; then
        helm list --all-namespaces | grep asca-ecom | tail -n +2 | awk '{print $1}' | xargs -I {} helm uninstall {} -n asca-ecom || true
    fi
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Rollback function
rollback() {
    echo -e "${RED}🔄 Rolling back deployment...${NC}"
    
    if command -v helm &> /dev/null; then
        helm rollback asca-ecom 1 -n asca-ecom
    else
        echo -e "${YELLOW}Please manually rollback using git revert or previous Docker image${NC}"
    fi
}

# Main deployment flow
main() {
    case $ENVIRONMENT in
        "production"|"staging")
            check_requirements
            build_and_push
            deploy_kubernetes
            health_checks
            ;;
        "local")
            deploy_docker_compose
            health_checks
            ;;
        "cleanup")
            cleanup
            ;;
        "rollback")
            rollback
            ;;
        *)
            echo -e "${RED}❌ Invalid environment. Use: production, staging, local, cleanup, or rollback${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
}

# Handle script interruption
trap 'echo -e "${RED}❌ Deployment interrupted${NC}"; exit 1' INT

# Run main function
main

echo -e "${GREEN}✨ All done! Your ASCA E-commerce Platform is deployed.${NC}"
