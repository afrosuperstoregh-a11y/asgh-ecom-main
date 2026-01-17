#!/bin/bash

# Auto-scaling Script for E-commerce Platform
# Monitors metrics and automatically scales services based on load

set -e

# Configuration
SCALE_UP_THRESHOLD=80
SCALE_DOWN_THRESHOLD=30
CHECK_INTERVAL=60
MAX_REPLICAS=10
MIN_REPLICAS=2

# Services to monitor
SERVICES=("client" "api")

# Metrics endpoints
METRICS_ENDPOINT="http://localhost:9090/api/v1/query"
PROMETHEUS_QUERY_CPU='100 - (avg by (container_label_com_docker_compose_service) (rate(container_cpu_usage_seconds_total[5m])) * 100)'
PROMETHEUS_QUERY_MEMORY='(container_memory_usage_bytes / container_spec_memory_limit_bytes) * 100'

# Logging
LOG_FILE="/var/log/auto-scaling.log"
exec > >(tee -a $LOG_FILE)
exec 2>&1

echo "🚀 Starting auto-scaling service..."
echo "📊 Check interval: ${CHECK_INTERVAL}s"
echo "📈 Scale up threshold: ${SCALE_UP_THRESHOLD}%"
echo "📉 Scale down threshold: ${SCALE_DOWN_THRESHOLD}%"

# Function to get metric value
get_metric() {
    local query=$1
    local response=$(curl -s "${METRICS_ENDPOINT}?query=${query}")
    echo "$response" | jq -r '.data.result[0].value[1]' 2>/dev/null || echo "0"
}

# Function to get current replicas
get_replicas() {
    local service=$1
    docker-compose ps -q $service | wc -l
}

# Function to scale service
scale_service() {
    local service=$1
    local replicas=$2
    echo "🔧 Scaling $service to $replicas replicas..."
    docker-compose up -d --scale $service=$replicas
    echo "✅ $service scaled to $replicas replicas"
}

# Function to check service health
check_health() {
    local service=$1
    local health_url="http://localhost:300${service: -1}/api/health"
    
    if [ "$service" = "client" ]; then
        health_url="http://localhost:3000/api/health"
    elif [ "$service" = "api" ]; then
        health_url="http://localhost:3001/api/health"
    fi
    
    curl -f -s "$health_url" > /dev/null 2>&1
    return $?
}

# Function to get load average
get_load_average() {
    uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//'
}

# Function to get active connections
get_active_connections() {
    netstat -an | grep :80 | grep ESTABLISHED | wc -l
}

# Main scaling loop
while true; do
    echo "🔍 Checking metrics at $(date)"
    
    # Get system metrics
    load_avg=$(get_load_average)
    active_connections=$(get_active_connections)
    echo "📊 System load: ${load_avg}, Active connections: ${active_connections}"
    
    for service in "${SERVICES[@]}"; do
        echo "🔍 Checking $service..."
        
        # Get current replicas
        current_replicas=$(get_replicas $service)
        echo "📊 Current replicas: $current_replicas"
        
        # Get service metrics
        cpu_usage=$(get_metric "${PROMETHEUS_QUERY_CPU}{container_label_com_docker_compose_service=\"$service\"}")
        memory_usage=$(get_metric "${PROMETHEUS_QUERY_MEMORY}{container_label_com_docker_compose_service=\"$service\"}")
        
        # Convert to integers
        cpu_usage=${cpu_usage%.*}
        memory_usage=${memory_usage%.*}
        
        echo "📊 CPU: ${cpu_usage}%, Memory: ${memory_usage}%"
        
        # Check service health
        if check_health $service; then
            health_status="healthy"
        else
            health_status="unhealthy"
            echo "⚠️ Service $service is unhealthy"
        fi
        
        # Scaling logic
        if [ "$health_status" = "healthy" ]; then
            # Scale up conditions
            if [ "$cpu_usage" -gt "$SCALE_UP_THRESHOLD" ] || [ "$memory_usage" -gt "$SCALE_UP_THRESHOLD" ]; then
                if [ "$current_replicas" -lt "$MAX_REPLICAS" ]; then
                    new_replicas=$((current_replicas + 1))
                    scale_service $service $new_replicas
                else
                    echo "⚠️ $service already at maximum replicas ($MAX_REPLICAS)"
                fi
            # Scale down conditions
            elif [ "$cpu_usage" -lt "$SCALE_DOWN_THRESHOLD" ] && [ "$memory_usage" -lt "$SCALE_DOWN_THRESHOLD" ]; then
                if [ "$current_replicas" -gt "$MIN_REPLICAS" ]; then
                    new_replicas=$((current_replicas - 1))
                    scale_service $service $new_replicas
                else
                    echo "⚠️ $service already at minimum replicas ($MIN_REPLICAS)"
                fi
            else
                echo "✅ $service scaling optimal"
            fi
        else
            echo "⚠️ Skipping scaling for unhealthy service $service"
        fi
        
        echo "---"
    done
    
    echo "💤 Sleeping for ${CHECK_INTERVAL} seconds..."
    sleep $CHECK_INTERVAL
done
