#!/bin/bash

# Performance Testing Script
# This script runs comprehensive performance tests on the e-commerce platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-https://localhost}"
API_URL="${API_URL:-https://localhost/api}"
TEST_DURATION="${TEST_DURATION:-60}"
CONCURRENT_USERS="${CONCURRENT_USERS:-100}"
RAMP_UP_TIME="${RAMP_UP_TIME:-30}"
RESULTS_DIR="performance-test-results"

# Tools
K6_CMD="k6"
ARTILLERY_CMD="artillery"

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# Check if performance testing tools are installed
check_tools() {
    log "Checking performance testing tools..."
    
    if ! command -v $K6_CMD > /dev/null 2>&1; then
        log_error "k6 is not installed. Please install k6: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
    
    if ! command -v $ARTILLERY_CMD > /dev/null 2>&1; then
        log_warning "Artillery is not installed. Some tests will be skipped. Install with: npm install -g artillery"
    fi
    
    log_success "Performance testing tools checked"
}

# Create results directory
create_results_dir() {
    if [ ! -d "$RESULTS_DIR" ]; then
        mkdir -p "$RESULTS_DIR"
        log_success "Created results directory: $RESULTS_DIR"
    fi
}

# Generate test data
generate_test_data() {
    log "Generating test data..."
    
    # Create test users
    cat > "$RESULTS_DIR/test-users.json" << EOF
[
    {"username": "testuser1", "email": "test1@example.com", "password": "password123"},
    {"username": "testuser2", "email": "test2@example.com", "password": "password123"},
    {"username": "testuser3", "email": "test3@example.com", "password": "password123"},
    {"username": "testuser4", "email": "test4@example.com", "password": "password123"},
    {"username": "testuser5", "email": "test5@example.com", "password": "password123"}
]
EOF

    # Create test products
    cat > "$RESULTS_DIR/test-products.json" << EOF
[
    {"id": 1, "name": "Test Product 1", "price": 29.99, "category": "electronics"},
    {"id": 2, "name": "Test Product 2", "price": 49.99, "category": "clothing"},
    {"id": 3, "name": "Test Product 3", "price": 19.99, "category": "books"},
    {"id": 4, "name": "Test Product 4", "price": 99.99, "category": "electronics"},
    {"id": 5, "name": "Test Product 5", "price": 39.99, "category": "home"}
]
EOF

    log_success "Test data generated"
}

# Run k6 load test
run_k6_test() {
    local test_name="$1"
    local test_file="$2"
    
    log "Running k6 test: $test_name"
    
    # Generate k6 test script
    cat > "$RESULTS_DIR/${test_name}.js" << EOF
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '${RAMP_UP_TIME}s', target: ${CONCURRENT_USERS} },
    { duration: '${TEST_DURATION}s', target: ${CONCURRENT_USERS} },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be below 10%
    errors: ['rate<0.1'],             // Custom error rate should be below 10%
  },
};

const BASE_URL = '${BASE_URL}';
const API_URL = '${API_URL}';

export default function() {
  $test_file
}

export function handleSummary(data) {
  return {
    '${RESULTS_DIR}/${test_name}-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
EOF

    # Run the test
    $K6_CMD run --out json="$RESULTS_DIR/${test_name}-raw.json" "$RESULTS_DIR/${test_name}.js"
    
    log_success "k6 test completed: $test_name"
}

# Generate k6 test scenarios
generate_k6_tests() {
    log "Generating k6 test scenarios..."
    
    # Homepage load test
    cat > "$RESULTS_DIR/homepage-test.js" << 'EOF'
  let response = http.get(BASE_URL);
  let success = check(response, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage response time < 500ms': (r) => r.timings.duration < 500,
    'homepage contains content': (r) => r.body.includes('Welcome') || r.body.includes('Shop'),
  });
  
  errorRate.add(!success);
  sleep(1);
EOF

    # API load test
    cat > "$RESULTS_DIR/api-test.js" << 'EOF'
  // Test products endpoint
  let productsResponse = http.get(`${API_URL}/products`);
  let productsSuccess = check(productsResponse, {
    'products status is 200': (r) => r.status === 200,
    'products response time < 300ms': (r) => r.timings.duration < 300,
    'products returns array': (r) => JSON.parse(r.body).data instanceof Array,
  });
  
  errorRate.add(!productsSuccess);
  sleep(0.5);
  
  // Test categories endpoint
  let categoriesResponse = http.get(`${API_URL}/categories`);
  let categoriesSuccess = check(categoriesResponse, {
    'categories status is 200': (r) => r.status === 200,
    'categories response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  errorRate.add(!categoriesSuccess);
  sleep(0.5);
EOF

    # Authentication load test
    cat > "$RESULTS_DIR/auth-test.js" << 'EOF'
  // Test login endpoint
  let loginPayload = JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  });
  
  let loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  let loginResponse = http.post(`${API_URL}/auth/login`, loginPayload, loginParams);
  let loginSuccess = check(loginResponse, {
    'login status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'login response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!loginSuccess);
  sleep(1);
EOF

    # Search load test
    cat > "$RESULTS_DIR/search-test.js" << 'EOF'
  let searchTerms = ['laptop', 'phone', 'book', 'shirt', 'shoes'];
  let searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  let searchResponse = http.get(`${API_URL}/products/search?q=${searchTerm}`);
  let searchSuccess = check(searchResponse, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 400ms': (r) => r.timings.duration < 400,
    'search returns results': (r) => JSON.parse(r.body).data.length > 0,
  });
  
  errorRate.add(!searchSuccess);
  sleep(1);
EOF

    log_success "k6 test scenarios generated"
}

# Run Artillery tests (if available)
run_artillery_test() {
    if ! command -v $ARTILLERY_CMD > /dev/null 2>&1; then
        log_warning "Skipping Artillery tests - not installed"
        return
    fi
    
    log "Running Artillery load test..."
    
    # Generate Artillery config
    cat > "$RESULTS_DIR/artillery-config.yml" << EOF
config:
  target: '${API_URL}'
  phases:
    - duration: ${RAMP_UP_TIME}
      arrivalRate: 5
      rampTo: ${CONCURRENT_USERS}
    - duration: ${TEST_DURATION}
      arrivalRate: ${CONCURRENT_USERS}
    - duration: 30
      arrivalRate: 0
  processor: "./test-processor.js"

scenarios:
  - name: "API Load Test"
    weight: 70
    flow:
      - get:
          url: "/products"
          expect:
            - statusCode: 200
            - contentType: application/json
      - think: 1
      - get:
          url: "/categories"
          expect:
            - statusCode: 200
      - think: 0.5
      - get:
          url: "/products/search?q=test"
          expect:
            - statusCode: 200

  - name: "Authentication Test"
    weight: 20
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
          expect:
            - statusCode: 200
            - contentType: application/json
      - think: 2

  - name: "Heavy Load Test"
    weight: 10
    flow:
      - loop:
          - get:
              url: "/products"
              expect:
                - statusCode: 200
          - think: 0.1
        count: 10
EOF

    # Generate test processor
    cat > "$RESULTS_DIR/test-processor.js" << 'EOF'
module.exports = {
  // Custom processor functions for Artillery
  getRandomProductId: function(userContext, events, done) {
    const products = [1, 2, 3, 4, 5];
    userContext.productId = products[Math.floor(Math.random() * products.length)];
    return done();
  }
};
EOF

    # Run Artillery test
    $ARTILLERY_CMD run "$RESULTS_DIR/artillery-config.yml" --output "$RESULTS_DIR/artillery-results.json"
    
    log_success "Artillery test completed"
}

# Stress test
run_stress_test() {
    log "Running stress test..."
    
    # Generate stress test configuration
    cat > "$RESULTS_DIR/stress-test.js" << EOF
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 users
    { duration: '2m', target: 300 },   // Ramp up to 300 users
    { duration: '5m', target: 300 },   // Stay at 300 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // More lenient for stress test
    http_req_failed: ['rate<0.2'],    // Allow higher error rate
    errors: ['rate<0.2'],
  },
};

const BASE_URL = '${BASE_URL}';
const API_URL = '${API_URL}';

export default function() {
  // Mix of different requests
  const requests = [
    () => http.get(BASE_URL),
    () => http.get(`${API_URL}/products`),
    () => http.get(`${API_URL}/categories`),
    () => http.get(`${API_URL}/products/search?q=test`),
  ];
  
  const randomRequest = requests[Math.floor(Math.random() * requests.length)];
  let response = randomRequest();
  
  let success = check(response, {
    'status is not 5xx': (r) => r.status < 500,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!success);
  sleep(Math.random() * 2);
}

export function handleSummary(data) {
  return {
    '${RESULTS_DIR}/stress-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
EOF

    # Run stress test
    $K6_CMD run --out json="$RESULTS_DIR/stress-test-raw.json" "$RESULTS_DIR/stress-test.js"
    
    log_success "Stress test completed"
}

# Spike test
run_spike_test() {
    log "Running spike test..."
    
    cat > "$RESULTS_DIR/spike-test.js" << EOF
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '1m', target: 10 },    // Normal load
    { duration: '1m', target: 10 },    // Stay at normal
    { duration: '30s', target: 500 },  // Spike to 500 users
    { duration: '1m', target: 500 },   // Stay at spike
    { duration: '30s', target: 10 },   // Back to normal
    { duration: '1m', target: 10 },    // Stay at normal
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Very lenient during spike
    http_req_failed: ['rate<0.3'],     // Allow higher errors during spike
    errors: ['rate<0.3'],
  },
};

const BASE_URL = '${BASE_URL}';

export default function() {
  let response = http.get(BASE_URL);
  let success = check(response, {
    'status is not 5xx': (r) => r.status < 500,
    'response time < 5000ms': (r) => r.timings.duration < 5000,
  });
  
  errorRate.add(!success);
  sleep(0.1);
}

export function handleSummary(data) {
  return {
    '${RESULTS_DIR}/spike-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
EOF

    # Run spike test
    $K6_CMD run --out json="$RESULTS_DIR/spike-test-raw.json" "$RESULTS_DIR/spike-test.js"
    
    log_success "Spike test completed"
}

# Generate performance report
generate_report() {
    log "Generating performance report..."
    
    cat > "$RESULTS_DIR/performance-report.md" << EOF
# Performance Test Report

**Date:** $(date)
**Base URL:** $BASE_URL
**API URL:** $API_URL
**Test Duration:** ${TEST_DURATION}s
**Concurrent Users:** $CONCURRENT_USERS
**Ramp-up Time:** ${RAMP_UP_TIME}s

## Test Summary

This report contains the results of comprehensive performance testing conducted on the e-commerce platform.

## Tests Executed

### 1. Homepage Load Test
- **Purpose:** Test the main page loading performance
- **Target:** $CONCURRENT_USERS concurrent users
- **Duration:** ${TEST_DURATION}s

### 2. API Load Test
- **Purpose:** Test API endpoints performance
- **Endpoints Tested:**
  - GET /api/products
  - GET /api/categories
  - GET /api/products/search

### 3. Authentication Load Test
- **Purpose:** Test authentication endpoint performance
- **Endpoint:** POST /api/auth/login

### 4. Search Load Test
- **Purpose:** Test search functionality performance
- **Endpoint:** GET /api/products/search

### 5. Stress Test
- **Purpose:** Test system behavior under extreme load
- **Max Users:** 300
- **Duration:** 18 minutes

### 6. Spike Test
- **Purpose:** Test system response to sudden traffic spikes
- **Spike Users:** 500
- **Duration:** 4.5 minutes

## Performance Metrics

### Key Performance Indicators (KPIs)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| 95th Percentile Response Time | < 500ms | TBD | TBD |
| Error Rate | < 10% | TBD | TBD |
| Throughput | TBD | TBD | TBD |
| CPU Usage | < 80% | TBD | TBD |
| Memory Usage | < 80% | TBD | TBD |

### Detailed Results

#### Homepage Performance
- Average Response Time: TBD
- 95th Percentile: TBD
- 99th Percentile: TBD
- Error Rate: TBD

#### API Performance
- Average Response Time: TBD
- 95th Percentile: TBD
- 99th Percentile: TBD
- Error Rate: TBD

#### Authentication Performance
- Average Response Time: TBD
- 95th Percentile: TBD
- 99th Percentile: TBD
- Error Rate: TBD

## Recommendations

Based on the test results, the following recommendations are made:

1. **Performance Optimizations**
   - TBD

2. **Infrastructure Improvements**
   - TBD

3. **Code Optimizations**
   - TBD

4. **Monitoring Enhancements**
   - TBD

## Files Generated

The following files were generated during testing:

- Raw test data files (*.json)
- Summary reports (*-summary.json)
- Test configurations (*.js, *.yml)
- This report (performance-report.md)

## Next Steps

1. Review detailed test results in the JSON files
2. Analyze performance bottlenecks
3. Implement recommended optimizations
4. Re-run tests to validate improvements
5. Set up continuous performance monitoring

---

**Note:** This is an auto-generated report. Please review the detailed JSON files for comprehensive analysis.
EOF

    log_success "Performance report generated: $RESULTS_DIR/performance-report.md"
}

# Display results summary
display_results() {
    log "Performance test completed!"
    echo ""
    echo "Results Summary:"
    echo "================"
    echo "Results Directory: $RESULTS_DIR"
    echo "Report: $RESULTS_DIR/performance-report.md"
    echo ""
    echo "Generated Files:"
    ls -la "$RESULTS_DIR/"
    echo ""
    echo "Next Steps:"
    echo "1. Review the performance report: $RESULTS_DIR/performance-report.md"
    echo "2. Analyze detailed results in JSON files"
    echo "3. Implement optimizations based on findings"
    echo "4. Re-run tests to validate improvements"
}

# Main execution
main() {
    log "Starting Performance Testing"
    echo ""
    
    # Setup
    check_tools
    create_results_dir
    generate_test_data
    generate_k6_tests
    
    # Run tests
    log "Starting performance tests..."
    echo ""
    
    run_k6_test "homepage" "$(cat "$RESULTS_DIR/homepage-test.js")"
    run_k6_test "api" "$(cat "$RESULTS_DIR/api-test.js")"
    run_k6_test "auth" "$(cat "$RESULTS_DIR/auth-test.js")"
    run_k6_test "search" "$(cat "$RESULTS_DIR/search-test.js")"
    
    run_artillery_test
    run_stress_test
    run_spike_test
    
    # Generate report
    generate_report
    display_results
    
    echo ""
    log_success "All performance tests completed successfully!"
}

# Script options
case "${1:-}" in
    "quick")
        TEST_DURATION=30
        CONCURRENT_USERS=50
        RAMP_UP_TIME=15
        main
        ;;
    "full")
        TEST_DURATION=120
        CONCURRENT_USERS=200
        RAMP_UP_TIME=60
        main
        ;;
    "stress")
        run_stress_test
        ;;
    "spike")
        run_spike_test
        ;;
    "report")
        generate_report
        ;;
    "clean")
        rm -rf "$RESULTS_DIR"
        log_success "Results directory cleaned"
        ;;
    *)
        main
        ;;
esac
