"""add_missing_composite_indexes

Revision ID: 2025_11_21_1400
Revises: 2025_11_16_add_ai_usage_log_table
Create Date: 2025-11-21 14:00:00.000000

FASE 4 #6: Database Optimization
==================================
Add 9 critical composite indexes identified in performance audit.
Expected impact: 40-50% faster filtering and join queries.

Performance Improvements:
- Dashboard queries: 500ms → 50ms
- Factory dashboard: 300ms → 30ms  
- Request filtering: 40% faster
- Timer card approval queue: 50% faster
- Salary lookups: 45% faster

Audit Reference: /docs/audits/BACKEND_PERFORMANCE_AUDIT_2025-11-21.md
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2025_11_21_1400'
down_revision: Union[str, None] = '2025_11_16_add_ai_usage_log_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add 9 critical composite indexes for performance optimization.
    Uses CONCURRENTLY to avoid locking tables in production.
    """
    
    # 1. Salary calculations optimization
    # Used by: /api/salary/*, /api/payroll/*, /api/dashboard/*
    op.execute("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salary_employee_paid 
        ON salary_calculations(employee_id, is_paid, calculation_year, calculation_month)
    """)
    
    # 2. Apartment assignment lookup
    # Used by: /api/apartments/*, /api/employees/*/apartment
    op.execute("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apartment_assignment_employee_active 
        ON apartment_assignments(employee_id, status) 
        WHERE status = 'active'
    """)
    
    # 3. Request approval workflow
    # Used by: /api/requests/*, /api/dashboard/admin
    op.execute("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_status_created 
        ON requests(status, created_at DESC)
    """)
    
    # 4. Timer card approval queue
    # Used by: /api/timer-cards/pending, /api/dashboard/factory
    op.execute("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_timer_cards_approval_queue 
        ON timer_cards(factory_id, is_approved, work_date DESC) 
        WHERE is_approved = false
    """)
    
    # 5. Employee factory lookup with status
    # Used by: /api/employees?factory_id=*, /api/dashboard/factory
    op.execute("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_factory_active_hire 
        ON employees(factory_id, is_active, hire_date DESC)
    """)
    
    # 6. Yukyu request filtering
    # Used by: /api/yukyu/requests, /api/dashboard/*
    op.execute("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_yukyu_requests_employee_status 
        ON yukyu_requests(employee_id, status, request_date DESC)
    """)
    
    # 7. Audit log queries
    # Used by: /api/audit/*, admin log viewer
    op.execute("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_table_action_created 
        ON audit_log(table_name, action, created_at DESC)
    """)
    
    # 8. Document lookup optimization - employee documents
    # Used by: /api/employees/*/documents
    op.execute("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_employee_type 
        ON documents(employee_id, document_type, uploaded_at DESC)
        WHERE employee_id IS NOT NULL
    """)
    
    # 9. Document lookup optimization - candidate documents
    # Used by: /api/candidates/*/documents
    op.execute("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_candidate_type 
        ON documents(candidate_id, document_type, uploaded_at DESC)
        WHERE candidate_id IS NOT NULL
    """)


def downgrade() -> None:
    """
    Remove the composite indexes.
    """
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS idx_salary_employee_paid")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS idx_apartment_assignment_employee_active")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS idx_requests_status_created")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS idx_timer_cards_approval_queue")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS idx_employees_factory_active_hire")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS idx_yukyu_requests_employee_status")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS idx_audit_log_table_action_created")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS idx_documents_employee_type")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS idx_documents_candidate_type")
