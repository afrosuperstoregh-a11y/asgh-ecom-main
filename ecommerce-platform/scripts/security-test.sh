#!/bin/bash

# Security Testing and Validation Script
# This script runs comprehensive security tests on the e-commerce platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
TARGET_URL="${TARGET_URL:-http://localhost:3000}"
ZAP_API_KEY="${ZAP_API_KEY:-}"
TRIVY_CACHE_DIR="${TRIVY_CACHE_DIR:-/tmp/trivy-cache}"
REPORT_DIR="./security-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create reports directory
mkdir -p "$REPORT_DIR"

echo -e "${BLUE}🔒 Starting Security Testing - $TIMESTAMP${NC}"
echo -e "${BLUE}=====================================${NC}"

# Function to print section headers
print_section() {
    echo -e "\n${YELLOW}📋 $1${NC}"
    echo -e "${YELLOW}----------------------------------------${NC}"
}

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        echo -e "${RED}   Error: $3${NC}"
    fi
}

# Function to check if tool is installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed. Please install it first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ $1 is available${NC}"
}

# Function to run OWASP ZAP scan
run_zap_scan() {
    print_section "OWASP ZAP Security Scan"
    
    check_tool "docker"
    
    # Start ZAP container
    echo "Starting OWASP ZAP..."
    docker run -d --name zap-scan \
        -p 8090:8090 \
        -v "$REPORT_DIR:/zap/wrk" \
        owasp/zap2docker-stable \
        zap.sh -daemon -host 0.0.0.0 -port 8090 -config api.addrs.addr.name=.* -config api.addrs.addr.regex=true
    
    # Wait for ZAP to start
    echo "Waiting for ZAP to start..."
    sleep 30
    
    # Run passive scan
    echo "Running passive scan on $TARGET_URL..."
    docker exec zap-scan \
        zap-cli -t "$TARGET_URL" -p 8090 \
        -c "context.import url($TARGET_URL)" \
        -c "spider scan" \
        -c "passive scan" \
        -c "htmlreport"
    
    # Run active scan
    echo "Running active scan..."
    docker exec zap-scan \
        zap-cli -t "$TARGET_URL" -p 8090 \
        -c "active scan"
    
    # Generate report
    echo "Generating ZAP report..."
    docker exec zap-scan \
        zap-cli -t "$TARGET_URL" -p 8090 \
        -c "htmlreport -o /zap/wrk/zap-report-$TIMESTAMP.html"
    
    # Cleanup
    docker stop zap-scan
    docker rm zap-scan
    
    print_result 0 "ZAP scan completed" "Report saved to $REPORT_DIR/zap-report-$TIMESTAMP.html"
}

# Function to run Trivy vulnerability scan
run_trivy_scan() {
    print_section "Trivy Vulnerability Scan"
    
    check_tool "docker"
    
    # Scan Docker images
    echo "Scanning Docker images..."
    docker run --rm \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v "$REPORT_DIR:/reports" \
        aquasec/trivy:latest \
        image --format json --output "/reports/trivy-images-$TIMESTAMP.json" \
        ecommerce-platform_api:latest \
        ecommerce-platform_client:latest
    
    # Scan file system
    echo "Scanning file system..."
    docker run --rm \
        -v "$PWD:/app" \
        -v "$REPORT_DIR:/reports" \
        aquasec/trivy:latest \
        fs --format json --output "/reports/trivy-fs-$TIMESTAMP.json" \
        /app/api
    
    print_result 0 "Trivy scan completed" "Reports saved to $REPORT_DIR/trivy-*-$TIMESTAMP.json"
}

# Function to run Nikto web scanner
run_nikto_scan() {
    print_section "Nikto Web Server Scan"
    
    check_tool "nikto"
    
    echo "Running Nikto scan on $TARGET_URL..."
    nikto -h "$TARGET_URL" \
        -o "$REPORT_DIR/nikto-$TIMESTAMP.html" \
        -Format htm \
        -Tuning 9 \
        -max-time 300
    
    print_result 0 "Nikto scan completed" "Report saved to $REPORT_DIR/nikto-$TIMESTAMP.html"
}

# Function to run SSL/TLS test
run_ssl_test() {
    print_section "SSL/TLS Security Test"
    
    check_tool "testssl.sh"
    
    echo "Running SSL/TLS test on $TARGET_URL..."
    testssl.sh --htmlfile "$REPORT_DIR/testssl-$TIMESTAMP.html" \
        --logfile "$REPORT_DIR/testssl-$TIMESTAMP.log" \
        "$TARGET_URL"
    
    print_result 0 "SSL/TLS test completed" "Report saved to $REPORT_DIR/testssl-$TIMESTAMP.html"
}

# Function to run security headers check
run_headers_test() {
    print_section "Security Headers Check"
    
    check_tool "curl"
    
    echo "Checking security headers..."
    curl -s -I "$TARGET_URL" > "$REPORT_DIR/headers-$TIMESTAMP.txt"
    
    # Check for important security headers
    local headers_file="$REPORT_DIR/headers-$TIMESTAMP.txt"
    local missing_headers=()
    
    if ! grep -q "X-Frame-Options" "$headers_file"; then
        missing_headers+=("X-Frame-Options")
    fi
    
    if ! grep -q "X-Content-Type-Options" "$headers_file"; then
        missing_headers+=("X-Content-Type-Options")
    fi
    
    if ! grep -q "X-XSS-Protection" "$headers_file"; then
        missing_headers+=("X-XSS-Protection")
    fi
    
    if ! grep -q "Strict-Transport-Security" "$headers_file"; then
        missing_headers+=("Strict-Transport-Security")
    fi
    
    if [ ${#missing_headers[@]} -eq 0 ]; then
        print_result 0 "All security headers present"
    else
        print_result 1 "Missing security headers" "${missing_headers[*]}"
    fi
}

# Function to run API security tests
run_api_security_tests() {
    print_section "API Security Tests"
    
    check_tool "curl"
    
    # Test for SQL injection
    echo "Testing for SQL injection..."
    curl -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": "admin@test.com", "password": "' OR '1'='1"}' \
        -o "$REPORT_DIR/sqli-test-$TIMESTAMP.json" \
        -w "%{http_code}"
    
    # Test for XSS
    echo "Testing for XSS..."
    curl -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": "<script>alert(1)</script>", "password": "test"}' \
        -o "$REPORT_DIR/xss-test-$TIMESTAMP.json" \
        -w "%{http_code}"
    
    # Test for rate limiting
    echo "Testing rate limiting..."
    for i in {1..10}; do
        curl -X POST "$API_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"email": "test@test.com", "password": "test"}' \
            -w "%{http_code}" \
            -o /dev/null \
            -s
    done
    
    print_result 0 "API security tests completed" "Results saved to $REPORT_DIR/"
}

# Function to run authentication bypass tests
run_auth_tests() {
    print_section "Authentication Bypass Tests"
    
    check_tool "curl"
    
    # Test weak passwords
    local weak_passwords=("password" "123456" "admin" "root" "qwerty")
    
    for password in "${weak_passwords[@]}"; do
        echo "Testing weak password: $password"
        response=$(curl -X POST "$API_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"email\": \"admin@test.com\", \"password\": \"$password\"}" \
            -w "%{http_code}" \
            -o /dev/null \
            -s)
        
        if [ "$response" != "401" ]; then
            echo -e "${RED}⚠️  Weak password '$password' accepted!${NC}"
        fi
    done
    
    # Test session fixation
    echo "Testing session fixation..."
    curl -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": "test@test.com", "password": "test", "sessionId": "fixed-session-id"}' \
        -o "$REPORT_DIR/session-fixation-$TIMESTAMP.json" \
        -w "%{http_code}"
    
    print_result 0 "Authentication tests completed"
}

# Function to run authorization tests
run_authorization_tests() {
    print_section "Authorization Tests"
    
    check_tool "curl"
    
    # Test access without authentication
    echo "Testing unauthorized access..."
    curl -X GET "$API_URL/api/admin/users" \
        -H "Content-Type: application/json" \
        -o "$REPORT_DIR/unauthorized-$TIMESTAMP.json" \
        -w "%{http_code}"
    
    # Test privilege escalation
    echo "Testing privilege escalation..."
    curl -X GET "$API_URL/api/admin/settings" \
        -H "Authorization: Bearer fake-token" \
        -H "Content-Type: application/json" \
        -o "$REPORT_DIR/privilege-escalation-$TIMESTAMP.json" \
        -w "%{http_code}"
    
    print_result 0 "Authorization tests completed"
}

# Function to run data validation tests
run_data_validation_tests() {
    print_section "Data Validation Tests"
    
    check_tool "curl"
    
    # Test malformed JSON
    echo "Testing malformed JSON..."
    curl -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": "test@test.com", "password":}' \
        -o "$REPORT_DIR/malformed-json-$TIMESTAMP.json" \
        -w "%{http_code}"
    
    # Test oversized payload
    echo "Testing oversized payload..."
    large_payload=$(printf 'A'%.0s' {1..10000})
    curl -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"data\": \"$large_payload\"}" \
        -o "$REPORT_DIR/oversized-payload-$TIMESTAMP.json" \
        -w "%{http_code}"
    
    print_result 0 "Data validation tests completed"
}

# Function to generate security report
generate_report() {
    print_section "Generating Security Report"
    
    local report_file="$REPORT_DIR/security-summary-$TIMESTAMP.md"
    
    cat > "$report_file" << EOF
# Security Test Report
**Generated:** $(date)
**Target:** $TARGET_URL
**API:** $API_URL

## Test Results

### OWASP ZAP Scan
- Status: Completed
- Report: \`zap-report-$TIMESTAMP.html\`

### Trivy Vulnerability Scan
- Status: Completed
- Reports: 
  - Docker Images: \`trivy-images-$TIMESTAMP.json\`
  - File System: \`trivy-fs-$TIMESTAMP.json\`

### Nikto Web Server Scan
- Status: Completed
- Report: \`nikto-$TIMESTAMP.html\`

### SSL/TLS Security Test
- Status: Completed
- Report: \`testssl-$TIMESTAMP.html\`

### Security Headers Check
- Status: Completed
- Raw Headers: \`headers-$TIMESTAMP.txt\`

### API Security Tests
- Status: Completed
- Results: \`api-tests-$TIMESTAMP/\`

### Authentication Tests
- Status: Completed
- Results: \`auth-tests-$TIMESTAMP/\`

### Authorization Tests
- Status: Completed
- Results: \`authz-tests-$TIMESTAMP/\`

### Data Validation Tests
- Status: Completed
- Results: \`validation-tests-$TIMESTAMP/\`

## Recommendations

1. Review and fix any high-severity vulnerabilities found by ZAP
2. Address missing security headers
3. Implement proper input validation
4. Ensure strong authentication mechanisms
5. Regularly update dependencies

## Next Steps

1. Schedule regular security scans
2. Implement continuous security monitoring
3. Conduct penetration testing
4. Review and update security policies
EOF

    print_result 0 "Security report generated" "Report saved to $report_file"
}

# Main execution
main() {
    echo "Starting comprehensive security testing..."
    
    # Run all security tests
    run_zap_scan
    run_trivy_scan
    run_nikto_scan
    run_ssl_test
    run_headers_test
    run_api_security_tests
    run_auth_tests
    run_authorization_tests
    run_data_validation_tests
    
    # Generate summary report
    generate_report
    
    echo -e "\n${GREEN}🎉 Security testing completed successfully!${NC}"
    echo -e "${BLUE}📁 Reports are available in: $REPORT_DIR${NC}"
    echo -e "${YELLOW}⚠️  Review all reports and address any security issues found.${NC}"
}

# Check if running in CI/CD environment
if [ "$CI" = "true" ]; then
    echo "Running in CI/CD mode - skipping interactive prompts"
    main
else
    echo "Running in interactive mode"
    read -p "Do you want to proceed with security testing? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        main
    else
        echo "Security testing cancelled."
        exit 0
    fi
fi
