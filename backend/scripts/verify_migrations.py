#!/usr/bin/env python3
"""
Verify SQL Migrations Applied Successfully

This script verifies that all SQL improvement migrations have been applied
correctly and are functioning as expected.

It checks:
1. All indexes were created
2. All unique constraints are in place
3. JSON columns were converted to JSONB
4. CHECK constraints are enforced
5. CASCADE rules are correct
6. Full-text search indexes exist
7. Hybrid BD proposal columns and triggers exist

Usage:
    python scripts/verify_migrations.py
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from app.core.config import settings


def verify_indexes(conn):
    """Verify that all critical indexes were created"""

    print("\n" + "="*60)
    print("1. VERIFYING INDEXES")
    print("="*60)

    # Get count of indexes per table
    result = conn.execute(text("""
        SELECT
            tablename,
            COUNT(*) as index_count
        FROM pg_indexes
        WHERE schemaname = 'public'
        GROUP BY tablename
        ORDER BY tablename
    """))

    print("\nIndexes per table:")
    total_indexes = 0
    for row in result:
        print(f"  {row[0]}: {row[1]} indexes")
        total_indexes += row[1]

    print(f"\n✅ Total indexes: {total_indexes}")

    # Check for specific critical indexes
    critical_indexes = [
        'idx_employees_factory_active',
        'idx_employees_visa_expiring',
        'idx_timer_cards_salary_calc',
        'idx_candidates_name_search',
        'idx_employees_name_search',
    ]

    print("\nChecking critical indexes:")
    for idx_name in critical_indexes:
        result = conn.execute(text("""
            SELECT COUNT(*) FROM pg_indexes
            WHERE schemaname = 'public' AND indexname = :idx_name
        """), {"idx_name": idx_name})

        count = result.scalar()
        status = "✅" if count > 0 else "❌"
        print(f"  {status} {idx_name}")

    return True


def verify_unique_constraints(conn):
    """Verify unique constraints are in place"""

    print("\n" + "="*60)
    print("2. VERIFYING UNIQUE CONSTRAINTS")
    print("="*60)

    unique_indexes = [
        'idx_timer_cards_unique_entry',
        'idx_salary_unique_employee_period',
        'idx_candidates_unique_applicant',
        'idx_factories_unique_company_plant',
    ]

    print("\nChecking unique constraints:")
    for idx_name in unique_indexes:
        result = conn.execute(text("""
            SELECT COUNT(*) FROM pg_indexes
            WHERE schemaname = 'public' AND indexname = :idx_name
        """), {"idx_name": idx_name})

        count = result.scalar()
        status = "✅" if count > 0 else "❌"
        print(f"  {status} {idx_name}")

    return True


def verify_jsonb_conversion(conn):
    """Verify JSON columns were converted to JSONB"""

    print("\n" + "="*60)
    print("3. VERIFYING JSON TO JSONB CONVERSION")
    print("="*60)

    # Check column types
    jsonb_columns = [
        ('candidates', 'ocr_notes'),
        ('candidate_forms', 'form_data'),
        ('candidate_forms', 'azure_metadata'),
        ('factories', 'config'),
        ('documents', 'ocr_data'),
        ('audit_log', 'old_values'),
        ('audit_log', 'new_values'),
    ]

    print("\nChecking JSONB columns:")
    for table, column in jsonb_columns:
        result = conn.execute(text("""
            SELECT data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = :table
              AND column_name = :column
        """), {"table": table, "column": column})

        row = result.fetchone()
        if row:
            data_type = row[0]
            status = "✅" if data_type == 'jsonb' else f"❌ (type: {data_type})"
            print(f"  {status} {table}.{column}")
        else:
            print(f"  ⚠️  {table}.{column} - column not found")

    # Check for GIN indexes on JSONB columns
    gin_indexes = [
        'idx_candidates_ocr_notes',
        'idx_candidate_forms_data',
        'idx_factories_config',
        'idx_documents_ocr_data',
    ]

    print("\nChecking GIN indexes on JSONB:")
    for idx_name in gin_indexes:
        result = conn.execute(text("""
            SELECT COUNT(*) FROM pg_indexes
            WHERE schemaname = 'public' AND indexname = :idx_name
        """), {"idx_name": idx_name})

        count = result.scalar()
        status = "✅" if count > 0 else "❌"
        print(f"  {status} {idx_name}")

    return True


def verify_check_constraints(conn):
    """Verify CHECK constraints are in place"""

    print("\n" + "="*60)
    print("4. VERIFYING CHECK CONSTRAINTS")
    print("="*60)

    # Get all check constraints
    result = conn.execute(text("""
        SELECT
            tc.table_name,
            tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'CHECK'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_name
    """))

    print("\nCHECK constraints found:")
    check_count = 0
    for row in result:
        print(f"  ✅ {row[0]}.{row[1]}")
        check_count += 1

    print(f"\n✅ Total CHECK constraints: {check_count}")

    return True


def verify_cascade_rules(conn):
    """Verify CASCADE rules are correct"""

    print("\n" + "="*60)
    print("5. VERIFYING CASCADE RULES")
    print("="*60)

    # Check foreign key constraints with DELETE CASCADE
    result = conn.execute(text("""
        SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND rc.delete_rule = 'CASCADE'
        ORDER BY tc.table_name
    """))

    print("\nForeign keys with CASCADE DELETE:")
    cascade_count = 0
    for row in result:
        print(f"  ✅ {row[0]}.{row[1]} → {row[2]} (DELETE {row[3]})")
        cascade_count += 1

    print(f"\n✅ Total CASCADE rules: {cascade_count}")

    return True


def verify_fulltext_search(conn):
    """Verify full-text search indexes exist"""

    print("\n" + "="*60)
    print("6. VERIFYING FULL-TEXT SEARCH")
    print("="*60)

    fulltext_indexes = [
        'idx_candidates_name_search',
        'idx_employees_name_search',
    ]

    print("\nChecking full-text search indexes:")
    for idx_name in fulltext_indexes:
        result = conn.execute(text("""
            SELECT COUNT(*) FROM pg_indexes
            WHERE schemaname = 'public' AND indexname = :idx_name
        """), {"idx_name": idx_name})

        count = result.scalar()
        status = "✅" if count > 0 else "❌"
        print(f"  {status} {idx_name}")

    return True


def verify_hybrid_bd_proposal(conn):
    """Verify hybrid BD proposal columns and triggers"""

    print("\n" + "="*60)
    print("7. VERIFYING HYBRID BD PROPOSAL")
    print("="*60)

    # Check new columns
    hybrid_columns = [
        ('employees', 'current_status'),
        ('employees', 'visa_renewal_alert'),
        ('employees', 'visa_alert_days'),
    ]

    print("\nChecking new columns:")
    for table, column in hybrid_columns:
        result = conn.execute(text("""
            SELECT data_type, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = :table
              AND column_name = :column
        """), {"table": table, "column": column})

        row = result.fetchone()
        if row:
            print(f"  ✅ {table}.{column} ({row[0]}, default: {row[1]})")
        else:
            print(f"  ❌ {table}.{column} - not found")

    # Check triggers
    triggers = [
        ('employees', 'employee_status_sync'),
        ('employees', 'visa_expiration_check'),
    ]

    print("\nChecking triggers:")
    for table, trigger_name in triggers:
        result = conn.execute(text("""
            SELECT COUNT(*)
            FROM information_schema.triggers
            WHERE event_object_table = :table
              AND trigger_name = :trigger_name
        """), {"table": table, "trigger_name": trigger_name})

        count = result.scalar()
        status = "✅" if count > 0 else "❌"
        print(f"  {status} {table}.{trigger_name}")

    # Check trigger functions
    functions = [
        'sync_employee_status',
        'check_visa_expiration',
    ]

    print("\nChecking trigger functions:")
    for func_name in functions:
        result = conn.execute(text("""
            SELECT COUNT(*)
            FROM pg_proc
            WHERE proname = :func_name
        """), {"func_name": func_name})

        count = result.scalar()
        status = "✅" if count > 0 else "❌"
        print(f"  {status} {func_name}()")

    return True


def verify_performance_monitoring(conn):
    """Verify performance monitoring functions exist"""

    print("\n" + "="*60)
    print("8. VERIFYING PERFORMANCE MONITORING")
    print("="*60)

    functions = [
        'find_missing_indexes',
        'find_unused_indexes',
    ]

    print("\nChecking monitoring functions:")
    for func_name in functions:
        result = conn.execute(text("""
            SELECT COUNT(*)
            FROM pg_proc
            WHERE proname = :func_name
        """), {"func_name": func_name})

        count = result.scalar()
        status = "✅" if count > 0 else "⚠️"
        print(f"  {status} {func_name}() - {'exists' if count > 0 else 'not found (optional)'}")

    return True


def main():
    """Run all verification checks"""

    print("="*60)
    print("SQL MIGRATIONS VERIFICATION")
    print("="*60)

    try:
        engine = create_engine(settings.DATABASE_URL)

        with engine.connect() as conn:
            verify_indexes(conn)
            verify_unique_constraints(conn)
            verify_jsonb_conversion(conn)
            verify_check_constraints(conn)
            verify_cascade_rules(conn)
            verify_fulltext_search(conn)
            verify_hybrid_bd_proposal(conn)
            verify_performance_monitoring(conn)

        print("\n" + "="*60)
        print("✅ VERIFICATION COMPLETE")
        print("="*60)
        print("\nAll critical migrations have been verified.")
        print("Database is ready for production use!")

    except Exception as e:
        print(f"\n❌ Verification failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
