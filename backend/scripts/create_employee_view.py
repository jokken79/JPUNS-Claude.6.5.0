#!/usr/bin/env python3
"""
Create SQL View: vw_employees_with_age

This script creates a database view that provides enhanced employee data including:
- Calculated age based on date_of_birth
- Visa expiration alerts
- Days until visa expiration
- Factory name (joined from factories table)

Usage:
    python scripts/create_employee_view.py

This view can be queried like a regular table for reporting and analytics.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from app.core.config import settings


def create_view():
    """Create the vw_employees_with_age view"""

    print("Creating vw_employees_with_age view...")

    try:
        engine = create_engine(settings.DATABASE_URL)

        with engine.connect() as conn:
            # Create or replace the view
            conn.execute(text("""
                CREATE OR REPLACE VIEW vw_employees_with_age AS
                SELECT
                    e.*,
                    EXTRACT(YEAR FROM AGE(e.date_of_birth)) AS calculated_age,
                    CASE
                        WHEN e.zairyu_expire_date IS NOT NULL AND
                             e.zairyu_expire_date - CURRENT_DATE <= COALESCE(e.visa_alert_days, 30)
                        THEN TRUE
                        ELSE FALSE
                    END AS visa_expiring_soon,
                    CASE
                        WHEN e.zairyu_expire_date IS NOT NULL
                        THEN e.zairyu_expire_date - CURRENT_DATE
                        ELSE NULL
                    END AS days_until_visa_expiration,
                    f.name AS factory_name,
                    f.company_name AS factory_company_name,
                    f.plant_name AS factory_plant_name
                FROM employees e
                LEFT JOIN factories f ON e.factory_id = f.factory_id
            """))
            conn.commit()

        print("✅ View vw_employees_with_age created successfully")
        print("\nYou can now query this view:")
        print("  SELECT * FROM vw_employees_with_age WHERE visa_expiring_soon = TRUE;")
        print("  SELECT * FROM vw_employees_with_age WHERE calculated_age > 30;")

    except Exception as e:
        print(f"❌ Error creating view: {e}")
        sys.exit(1)


def drop_view():
    """Drop the view if it exists"""

    print("Dropping vw_employees_with_age view...")

    try:
        engine = create_engine(settings.DATABASE_URL)

        with engine.connect() as conn:
            conn.execute(text("DROP VIEW IF EXISTS vw_employees_with_age CASCADE"))
            conn.commit()

        print("✅ View dropped successfully")

    except Exception as e:
        print(f"❌ Error dropping view: {e}")
        sys.exit(1)


def verify_view():
    """Verify the view was created and can be queried"""

    print("\nVerifying view...")

    try:
        engine = create_engine(settings.DATABASE_URL)

        with engine.connect() as conn:
            # Check if view exists
            result = conn.execute(text("""
                SELECT COUNT(*) as count
                FROM information_schema.views
                WHERE table_schema = 'public'
                  AND table_name = 'vw_employees_with_age'
            """))
            count = result.scalar()

            if count == 0:
                print("❌ View does not exist")
                return False

            # Try to query the view
            result = conn.execute(text("""
                SELECT COUNT(*) as count FROM vw_employees_with_age
            """))
            row_count = result.scalar()

            print(f"✅ View exists and contains {row_count} employees")

            # Show sample of employees with expiring visas
            result = conn.execute(text("""
                SELECT
                    full_name_kanji,
                    zairyu_expire_date,
                    days_until_visa_expiration,
                    visa_expiring_soon
                FROM vw_employees_with_age
                WHERE visa_expiring_soon = TRUE
                LIMIT 5
            """))

            rows = result.fetchall()
            if rows:
                print(f"\n📋 Found {len(rows)} employees with expiring visas (showing max 5):")
                for row in rows:
                    print(f"  - {row[0]}: expires in {row[2]} days (expires: {row[1]})")
            else:
                print("✅ No employees with expiring visas found")

            return True

    except Exception as e:
        print(f"❌ Error verifying view: {e}")
        return False


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Manage vw_employees_with_age view')
    parser.add_argument('--drop', action='store_true', help='Drop the view instead of creating it')
    parser.add_argument('--verify', action='store_true', help='Verify the view exists and works')

    args = parser.parse_args()

    if args.drop:
        drop_view()
    elif args.verify:
        verify_view()
    else:
        create_view()
        verify_view()
