# Post-Migration Monitoring Guide
**AfroSuperStore Database Remediation**
**Date:** June 2, 2026

---

## Overview

This guide provides detailed monitoring procedures for the first 7 days after the database remediation migration to ensure stability and detect any issues early.

---

## Immediate Monitoring (First 24 Hours)

### Database Metrics

#### Connection Pool

```sql
-- Monitor connection pool usage
SELECT 
    state,
    COUNT(*) as connections
FROM pg_stat_activity 
WHERE datname = 'afrosuperstore'
GROUP BY state;
```

**Alert Thresholds:**
- WARNING: > 80% of max connections
- CRITICAL: > 90% of max connections

#### Query Performance

```sql
-- Monitor slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
WHERE mean_time > 100 -- queries slower than 100ms
ORDER BY mean_time DESC
LIMIT 20;
```

**Alert Thresholds:**
- WARNING: Mean time > 500ms
- CRITICAL: Mean time > 1000ms

#### Lock Activity

```sql
-- Monitor locks
SELECT 
    locktype,
    mode,
    COUNT(*) as count
FROM pg_locks
WHERE pid != pg_backend_pid()
GROUP BY locktype, mode
ORDER BY count DESC;
```

**Alert Thresholds:**
- WARNING: > 10 locks waiting
- CRITICAL: > 50 locks waiting

### Application Metrics

#### Error Rates

Monitor application error rates:
- HTTP 500 errors
- Database connection errors
- Timeout errors
- RLS policy errors

**Alert Thresholds:**
- WARNING: Error rate > 1%
- CRITICAL: Error rate > 5%

#### Response Times

Monitor API response times:
- Average response time
- P95 response time
- P99 response time

**Alert Thresholds:**
- WARNING: P95 > 500ms
- CRITICAL: P95 > 1000ms

#### Throughput

Monitor request throughput:
- Requests per second
- Database queries per second
- Active users

**Alert Thresholds:**
- WARNING: Throughput drop > 20%
- CRITICAL: Throughput drop > 50%

---

## Daily Monitoring (Days 1-7)

### Data Integrity Checks

#### Record Count Validation

```sql
-- Compare with baseline
SELECT 
    'profiles' as table_name, 
    COUNT(*) as count,
    COUNT(*) - baseline_count as difference
FROM profiles
CROSS JOIN (SELECT COUNT(*) as baseline_count FROM profiles) baseline
UNION ALL
SELECT 'orders', COUNT(*), COUNT(*) - baseline_count
FROM orders
CROSS JOIN (SELECT COUNT(*) as baseline_count FROM orders) baseline
UNION ALL
SELECT 'products', COUNT(*), COUNT(*) - baseline_count
FROM products
CROSS JOIN (SELECT COUNT(*) as baseline_count FROM products) baseline;
```

**Alert Thresholds:**
- WARNING: Count difference > 5%
- CRITICAL: Count difference > 10%

#### Orphaned Records Check

```sql
-- Check for orphaned records
SELECT 'orders without user' as issue, COUNT(*) 
FROM orders o LEFT JOIN profiles p ON o.user_id = p.id WHERE p.id IS NULL
UNION ALL
SELECT 'order_items without order', COUNT(*) 
FROM order_items oi LEFT JOIN orders o ON oi.order_id = o.id WHERE o.id IS NULL
UNION ALL
SELECT 'cart without user', COUNT(*) 
FROM cart c LEFT JOIN profiles p ON c.user_id = p.id WHERE p.id IS NULL;
```

**Alert Thresholds:**
- WARNING: Any orphaned records
- CRITICAL: > 10 orphaned records

#### Constraint Violations

```sql
-- Check for constraint violations
SELECT COUNT(*) FROM products WHERE price < 0;
SELECT COUNT(*) FROM order_items WHERE quantity <= 0;
SELECT COUNT(*) FROM reviews WHERE rating < 1 OR rating > 5;
```

**Alert Thresholds:**
- CRITICAL: Any constraint violations

### Performance Monitoring

#### Index Usage

```sql
-- Monitor index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

**Alert Thresholds:**
- WARNING: Index with 0 scans (unused)
- INFO: Index with < 10 scans (low usage)

#### Table Size Growth

```sql
-- Monitor table size growth
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
```

**Alert Thresholds:**
- WARNING: Table size growth > 20% per day
- CRITICAL: Table size growth > 50% per day

### Security Monitoring

#### RLS Policy Violations

```sql
-- Monitor for RLS policy violations
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public';
```

**Alert Thresholds:**
- CRITICAL: Any policy changes
- WARNING: Policy execution failures

#### Admin Activity

```sql
-- Monitor admin activity
SELECT 
    admin_user_id,
    action,
    table_name,
    created_at
FROM admin_audit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

**Alert Thresholds:**
- WARNING: Unusual admin activity patterns
- CRITICAL: Suspicious admin actions

---

## Weekly Monitoring (Weeks 2-4)

### Trend Analysis

#### Query Performance Trends

```sql
-- Compare query performance week over week
SELECT 
    query,
    AVG(mean_time) as avg_time,
    MAX(mean_time) as max_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
GROUP BY query
ORDER BY avg_time DESC
LIMIT 20;
```

#### Database Size Trends

```sql
-- Monitor database size growth
SELECT 
    pg_size_pretty(pg_database_size('afrosuperstore')) as database_size,
    pg_database_size('afrosuperstore') as size_bytes;
```

**Alert Thresholds:**
- WARNING: Growth > 10% per week
- CRITICAL: Growth > 20% per week

### Index Optimization

#### Unused Indexes

```sql
-- Identify unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Action:** Consider removing unused indexes after 30 days

#### Missing Indexes

```sql
-- Identify potential missing indexes based on query patterns
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND correlation < 0.1
ORDER BY n_distinct DESC;
```

---

## Automated Monitoring Setup

### Prometheus Metrics

Configure Prometheus to collect database metrics:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
```

### Grafana Dashboards

Create Grafana dashboards for:
- Database connection pool
- Query performance
- Table sizes
- Index usage
- Lock activity
- Transaction rates

### Alert Rules

Configure alert rules in Prometheus:

```yaml
groups:
  - name: database_alerts
    rules:
      - alert: HighConnectionUsage
        expr: pg_stat_activity_count{datname="afrosuperstore"} > 80
        for: 5m
        annotations:
          summary: "High database connection usage"
      
      - alert: SlowQueries
        expr: pg_stat_statements_mean_time > 500
        for: 10m
        annotations:
          summary: "Slow queries detected"
      
      - alert: HighErrorRate
        expr: http_requests_total{status=~"5.."} > 0.05
        for: 5m
        annotations:
          summary: "High error rate"
```

---

## Health Check Script

Create automated health check script:

```bash
#!/bin/bash
# health-check.sh

echo "=== Database Health Check ==="
echo "Date: $(date)"
echo ""

# Connection check
echo "1. Connection Status:"
psql $DATABASE_URL -c "SELECT 1;" && echo "✅ Connected" || echo "❌ Failed"

# Record count check
echo ""
echo "2. Record Counts:"
psql $DATABASE_URL -c "
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'products', COUNT(*) FROM products;"

# Orphaned records check
echo ""
echo "3. Orphaned Records:"
ORPHANED=$(psql $DATABASE_URL -t -c "
SELECT COUNT(*) FROM orders o LEFT JOIN profiles p ON o.user_id = p.id WHERE p.id IS NULL
UNION ALL
SELECT COUNT(*) FROM order_items oi LEFT JOIN orders o ON oi.order_id = o.id WHERE o.id IS NULL;")
if [ "$ORPHANED" -eq "0" ]; then
    echo "✅ No orphaned records"
else
    echo "❌ Found $ORPHANED orphaned records"
fi

# Validation check
echo ""
echo "4. Schema Validation:"
psql $DATABASE_URL -c "SELECT * FROM validate_all();" && echo "✅ Validation passed" || echo "❌ Validation failed"

echo ""
echo "=== Health Check Complete ==="
```

Schedule to run daily via cron:

```bash
# Run health check daily at 6 AM
0 6 * * * /path/to/health-check.sh >> /var/log/db-health.log 2>&1
```

---

## Incident Response

### Severity Levels

**P1 - Critical:**
- Database down
- Data loss
- Security breach
- Immediate response required (< 15 min)

**P2 - High:**
- Performance degradation > 50%
- Critical functionality broken
- Response within 1 hour

**P3 - Medium:**
- Performance degradation < 50%
- Non-critical functionality broken
- Response within 4 hours

**P4 - Low:**
- Minor issues
- No user impact
- Response within 24 hours

### Escalation Matrix

| Severity | Notify | Response Time | Escalation |
|----------|--------|---------------|------------|
| P1 | All | 15 min | CTO, CEO |
| P2 | Engineering Lead, DBA | 1 hour | VP Engineering |
| P3 | Engineering Team | 4 hours | Engineering Lead |
| P4 | Engineering Team | 24 hours | None |

### Rollback Decision Tree

```
Is data loss detected?
├─ YES → Immediate rollback
└─ NO → Continue

Is security vulnerability detected?
├─ YES → Immediate rollback
└─ NO → Continue

Is performance degradation > 50%?
├─ YES → Evaluate impact
│   ├─ Critical functionality affected? → Rollback
│   └─ Non-critical affected? → Monitor 1 hour
└─ NO → Continue

Is error rate > 5%?
├─ YES → Evaluate impact
│   ├─ Critical functionality affected? → Rollback
│   └─ Non-critical affected? → Monitor 1 hour
└─ NO → Continue
```

---

## Reporting

### Daily Report (First 7 Days)

Send daily report to engineering team:

```
Database Migration Daily Report - Day X

Environment: Production
Date: YYYY-MM-DD

Summary:
- Database Status: Healthy/Degraded
- Error Rate: X%
- Average Response Time: Xms
- P95 Response Time: Xms
- Throughput: X req/s

Issues:
- [List any issues detected]

Metrics:
- Connection Pool: X%
- Slow Queries: X
- Orphaned Records: X
- Database Size: X GB

Recommendations:
- [Any recommendations]
```

### Weekly Report (Weeks 2-4)

Send weekly report to stakeholders:

```
Database Migration Weekly Report - Week X

Environment: Production
Date Range: YYYY-MM-DD to YYYY-MM-DD

Summary:
- Overall Status: Healthy/Degraded
- Uptime: X%
- Average Response Time: Xms
- Error Rate: X%

Performance Trends:
- Response time trend: [improving/stable/degrading]
- Database size growth: X%
- Query performance: [improving/stable/degrading]

Issues Resolved:
- [List issues resolved]

Open Issues:
- [List open issues]

Recommendations:
- [Any recommendations]
```

---

## Success Criteria

### 7-Day Success Criteria

- [ ] Zero critical incidents
- [ ] Error rate < 1%
- [ ] Average response time < 200ms
- [ ] P95 response time < 500ms
- [ ] Zero data loss
- [ ] Zero orphaned records
- [ ] All validations passing
- [ ] No security incidents

### 30-Day Success Criteria

- [ ] Performance stable or improved
- [ ] No performance degradation
- [ ] Database size growth < 20%
- [ ] All indexes utilized
- [ ] No unused indexes
- [ ] Zero security incidents
- [ ] User satisfaction maintained

---

## Contact Information

### Primary Contacts

- **Database Administrator:** _________________________
- **Engineering Lead:** _________________________
- **On-Call Engineer:** _________________________

### Emergency Contacts

- **CTO:** _________________________
- **VP Engineering:** _________________________
- **CEO:** _________________________

---

**Last Updated:** June 2, 2026
