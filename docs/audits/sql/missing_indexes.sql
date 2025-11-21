-- ============================================================================
-- Performance Optimization: Missing Composite Indexes
-- ============================================================================
-- Purpose: Add critical composite indexes identified in performance audit
-- Audit Date: 2025-11-21
-- Auditor: @database-admin
-- Expected Impact: 40-50% faster filtering and join queries
-- ============================================================================

BEGIN;

-- 1. Salary calculations optimization
-- Used by: /api/salary/*, /api/payroll/*, /api/dashboard/*
-- Improves: Employee salary lookup by payment status and period
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salary_employee_paid 
ON salary_calculations(employee_id, is_paid, calculation_year, calculation_month);

COMMENT ON INDEX idx_salary_employee_paid IS 
'Optimizes salary queries filtering by employee, payment status, and calculation period';

-- 2. Apartment assignment lookup
-- Used by: /api/apartments/*, /api/employees/*/apartment
-- Improves: Active apartment assignment lookup by employee
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apartment_assignment_employee_active 
ON apartment_assignments(employee_id, status) 
WHERE status = 'active';

COMMENT ON INDEX idx_apartment_assignment_employee_active IS 
'Partial index for active apartment assignments by employee (excludes ended/cancelled)';

-- 3. Request approval workflow
-- Used by: /api/requests/*, /api/dashboard/admin
-- Improves: Request listing and filtering by status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_status_created 
ON requests(status, created_at DESC);

COMMENT ON INDEX idx_requests_status_created IS 
'Optimizes request queries sorted by creation date, grouped by status';

-- 4. Timer card approval queue
-- Used by: /api/timer-cards/pending, /api/dashboard/factory
-- Improves: Pending timer card approval queue by factory
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timer_cards_approval_queue 
ON timer_cards(factory_id, is_approved, work_date DESC) 
WHERE is_approved = false;

COMMENT ON INDEX idx_timer_cards_approval_queue IS 
'Partial index for unapproved timer cards by factory, sorted by work date';

-- 5. Employee factory lookup with status
-- Used by: /api/employees?factory_id=*, /api/dashboard/factory
-- Improves: Active employee listing by factory
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_factory_active_hire 
ON employees(factory_id, is_active, hire_date DESC);

COMMENT ON INDEX idx_employees_factory_active_hire IS 
'Composite index for employee factory queries with active status filter';

-- 6. Yukyu request filtering
-- Used by: /api/yukyu/requests, /api/dashboard/*
-- Improves: Yukyu request filtering by employee and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_yukyu_requests_employee_status 
ON yukyu_requests(employee_id, status, request_date DESC);

COMMENT ON INDEX idx_yukyu_requests_employee_status IS 
'Optimizes yukyu request queries by employee and approval status';

-- 7. Audit log queries
-- Used by: /api/audit/*, admin log viewer
-- Improves: Audit log pagination and filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_table_action_created 
ON audit_log(table_name, action, created_at DESC);

COMMENT ON INDEX idx_audit_log_table_action_created IS 
'Optimizes audit log queries filtered by table and action type';

-- 8. Document lookup optimization
-- Used by: /api/employees/*/documents, /api/candidates/*/documents
-- Improves: Document retrieval by entity type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_employee_type 
ON documents(employee_id, document_type, uploaded_at DESC)
WHERE employee_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_candidate_type 
ON documents(candidate_id, document_type, uploaded_at DESC)
WHERE candidate_id IS NOT NULL;

COMMENT ON INDEX idx_documents_employee_type IS 
'Partial index for employee documents by type, sorted by upload date';

COMMENT ON INDEX idx_documents_candidate_type IS 
'Partial index for candidate documents by type, sorted by upload date';

COMMIT;

-- ============================================================================
-- Post-Migration: Analyze tables to update query planner statistics
-- ============================================================================

VACUUM ANALYZE salary_calculations;
VACUUM ANALYZE apartment_assignments;
VACUUM ANALYZE requests;
VACUUM ANALYZE timer_cards;
VACUUM ANALYZE employees;
VACUUM ANALYZE yukyu_requests;
VACUUM ANALYZE audit_log;
VACUUM ANALYZE documents;

-- ============================================================================
-- Verification: Check index creation
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================================================
-- Monitoring: Query to check index usage after deployment
-- ============================================================================

-- Run this after 24-48 hours to verify indexes are being used
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_salary_employee_paid',
    'idx_apartment_assignment_employee_active',
    'idx_requests_status_created',
    'idx_timer_cards_approval_queue',
    'idx_employees_factory_active_hire',
    'idx_yukyu_requests_employee_status',
    'idx_audit_log_table_action_created',
    'idx_documents_employee_type',
    'idx_documents_candidate_type'
  )
ORDER BY idx_scan DESC;

-- ============================================================================
-- Notes:
-- ============================================================================
-- - All indexes use CREATE INDEX CONCURRENTLY to avoid locking tables
-- - Partial indexes (WHERE clauses) reduce index size and improve performance
-- - VACUUM ANALYZE updates statistics for query planner optimization
-- - Monitor index usage after deployment to verify effectiveness
-- - Expected index size increase: ~50-100MB total
-- - Expected query performance improvement: 40-50% for filtered queries
-- ============================================================================
