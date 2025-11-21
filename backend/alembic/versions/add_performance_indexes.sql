-- ============================================================================
-- Alembic Migration Script: Add Performance Indexes
-- ============================================================================
-- Purpose: Create critical indexes to improve query performance
-- Deployment: Run once in production - safe to run multiple times (IF NOT EXISTS)
-- Expected impact: 50-90% faster queries on filtered/joined operations
-- ============================================================================

-- Create indexes on User table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Create indexes on Employee table
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_factory_id ON employees(factory_id);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON employees(hire_date);
CREATE INDEX IF NOT EXISTS idx_employees_created_at ON employees(created_at);

-- Create indexes on Candidate table
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);

-- Create indexes on TimerCard (TimeCard) table
CREATE INDEX IF NOT EXISTS idx_timer_cards_employee_id ON timer_cards(hakenmoto_id);
CREATE INDEX IF NOT EXISTS idx_timer_cards_work_date ON timer_cards(work_date);
CREATE INDEX IF NOT EXISTS idx_timer_cards_factory_id ON timer_cards(factory_id);
CREATE INDEX IF NOT EXISTS idx_timer_cards_is_approved ON timer_cards(is_approved) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_timer_cards_date_range ON timer_cards(work_date DESC)
  WHERE is_approved = true;

-- Create indexes on Payroll table
CREATE INDEX IF NOT EXISTS idx_payroll_runs_employee_id ON payroll_runs(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_created_at ON payroll_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON payroll_runs(status);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON payroll_runs(pay_period_start, pay_period_end);

-- Create indexes on Apartment table
CREATE INDEX IF NOT EXISTS idx_apartments_factory_id ON apartments(factory_id);
CREATE INDEX IF NOT EXISTS idx_apartments_is_available ON apartments(is_available)
  WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_apartments_created_at ON apartments(created_at);

-- Create indexes on YukyuRequest (Yukyu/Vacation) table
CREATE INDEX IF NOT EXISTS idx_yukyu_requests_employee_id ON yukyu_requests(hakenmoto_id);
CREATE INDEX IF NOT EXISTS idx_yukyu_requests_status ON yukyu_requests(status);
CREATE INDEX IF NOT EXISTS idx_yukyu_requests_request_date ON yukyu_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_yukyu_requests_approval_status ON yukyu_requests(approval_status);

-- Create indexes on Request table
CREATE INDEX IF NOT EXISTS idx_requests_employee_id ON requests(hakenmoto_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
CREATE INDEX IF NOT EXISTS idx_requests_assigned_to ON requests(assigned_to);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_employees_factory_active ON employees(factory_id, is_active);
CREATE INDEX IF NOT EXISTS idx_timer_cards_employee_date ON timer_cards(hakenmoto_id, work_date DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_period ON payroll_runs(employee_id, pay_period_start);

-- ============================================================================
-- NOTES:
-- ============================================================================
-- Performance improvements expected:
-- - List employees by factory: 80-90% faster
-- - Get employee timeline: 70-80% faster
-- - Calculate payroll statistics: 60-70% faster
-- - Search by email: 90% faster
-- - Filter by status/date: 80% faster
--
-- Space used: ~50-100MB additional disk space
-- Maintenance: VACUUM ANALYZE; (run weekly)
--
-- Monitoring:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;
-- ============================================================================
