#!/usr/bin/env python3
"""
Initialize Payroll Configuration Script

This script ensures that default payroll settings exist in the database.
It can be run:
1. Manually: python scripts/init_payroll_config.py
2. During deployment: As part of initialization scripts
3. After migration: To verify default settings

The script will:
- Check if payroll_settings record exists
- Create default settings if missing
- Verify all required fields have values
- Report status to stdout

Author: UNS-ClaudeJP Development Team
Date: 2025-11-12
Version: 1.0.0
"""

import asyncio
import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.payroll_models import PayrollSettings
from app.core.config import PayrollConfig


async def check_settings_exist() -> bool:
    """
    Check if payroll settings already exist in database.

    Returns:
        bool: True if settings exist, False otherwise
    """
    async with AsyncSessionLocal() as db:
        try:
            stmt = select(PayrollSettings).limit(1)
            result = await db.execute(stmt)
            settings = result.scalar_one_or_none()

            if settings:
                print(f"✓ Payroll settings found (ID: {settings.id})")
                print(f"  - Overtime rate: {settings.overtime_rate}")
                print(f"  - Night shift rate: {settings.night_shift_rate}")
                print(f"  - Holiday rate: {settings.holiday_rate}")
                print(f"  - Sunday rate: {settings.sunday_rate}")

                # Check if new fields exist (migration applied)
                if hasattr(settings, 'income_tax_rate'):
                    print(f"  - Income tax rate: {settings.income_tax_rate}%")
                    print(f"  - Resident tax rate: {settings.resident_tax_rate}%")
                    print(f"  - Health insurance rate: {settings.health_insurance_rate}%")
                    print(f"  - Pension rate: {settings.pension_rate}%")
                    print(f"  - Employment insurance rate: {settings.employment_insurance_rate}%")
                else:
                    print(f"  ⚠ Warning: Tax rate fields not found. Migration may not be applied yet.")

                return True
            else:
                print("✗ No payroll settings found in database")
                return False

        except Exception as e:
            print(f"✗ Error checking settings: {e}")
            return False


async def create_default_settings() -> bool:
    """
    Create default payroll settings in database.

    Returns:
        bool: True if creation successful, False otherwise
    """
    async with AsyncSessionLocal() as db:
        try:
            print("\n📝 Creating default payroll settings...")

            # Create settings with default values from PayrollConfig
            settings = PayrollSettings(
                overtime_rate=PayrollConfig.DEFAULT_OVERTIME_RATE,
                night_shift_rate=PayrollConfig.DEFAULT_NIGHT_RATE,
                holiday_rate=PayrollConfig.DEFAULT_HOLIDAY_RATE,
                sunday_rate=PayrollConfig.DEFAULT_SUNDAY_RATE,
                standard_hours_per_month=PayrollConfig.DEFAULT_STANDARD_HOURS,
                income_tax_rate=PayrollConfig.DEFAULT_INCOME_TAX_RATE,
                resident_tax_rate=PayrollConfig.DEFAULT_RESIDENT_TAX_RATE,
                health_insurance_rate=PayrollConfig.DEFAULT_HEALTH_INSURANCE_RATE,
                pension_rate=PayrollConfig.DEFAULT_PENSION_RATE,
                employment_insurance_rate=PayrollConfig.DEFAULT_EMPLOYMENT_INSURANCE_RATE
            )

            db.add(settings)
            await db.commit()
            await db.refresh(settings)

            print(f"✓ Created default payroll settings (ID: {settings.id})")
            print(f"\n📊 Default Values:")
            print(f"  Hour Rates:")
            print(f"    - Overtime rate: {settings.overtime_rate} (125%)")
            print(f"    - Night shift rate: {settings.night_shift_rate} (125%)")
            print(f"    - Holiday rate: {settings.holiday_rate} (135%)")
            print(f"    - Sunday rate: {settings.sunday_rate} (135%)")
            print(f"    - Standard hours/month: {settings.standard_hours_per_month}")
            print(f"\n  Tax & Insurance Rates:")
            print(f"    - Income tax: {settings.income_tax_rate}%")
            print(f"    - Resident tax: {settings.resident_tax_rate}%")
            print(f"    - Health insurance: {settings.health_insurance_rate}%")
            print(f"    - Pension: {settings.pension_rate}%")
            print(f"    - Employment insurance: {settings.employment_insurance_rate}%")

            return True

        except Exception as e:
            await db.rollback()
            print(f"✗ Error creating default settings: {e}")
            return False


async def verify_settings() -> bool:
    """
    Verify that all required settings fields have valid values.

    Returns:
        bool: True if all fields valid, False otherwise
    """
    async with AsyncSessionLocal() as db:
        try:
            stmt = select(PayrollSettings).limit(1)
            result = await db.execute(stmt)
            settings = result.scalar_one_or_none()

            if not settings:
                print("\n✗ Verification failed: No settings found")
                return False

            print("\n🔍 Verifying settings...")

            # Check hour rates
            issues = []
            if settings.overtime_rate <= 1.0:
                issues.append("Overtime rate should be > 1.0 (e.g., 1.25 for 125%)")
            if settings.night_shift_rate <= 1.0:
                issues.append("Night shift rate should be > 1.0")
            if settings.holiday_rate <= 1.0:
                issues.append("Holiday rate should be > 1.0")
            if settings.sunday_rate <= 1.0:
                issues.append("Sunday rate should be > 1.0")
            if settings.standard_hours_per_month <= 0:
                issues.append("Standard hours must be positive")

            # Check tax rates (if migration applied)
            if hasattr(settings, 'income_tax_rate'):
                if settings.income_tax_rate < 0 or settings.income_tax_rate > 100:
                    issues.append("Income tax rate should be between 0-100%")
                if settings.resident_tax_rate < 0 or settings.resident_tax_rate > 100:
                    issues.append("Resident tax rate should be between 0-100%")
                if settings.health_insurance_rate < 0 or settings.health_insurance_rate > 100:
                    issues.append("Health insurance rate should be between 0-100%")
                if settings.pension_rate < 0 or settings.pension_rate > 100:
                    issues.append("Pension rate should be between 0-100%")
                if settings.employment_insurance_rate < 0 or settings.employment_insurance_rate > 100:
                    issues.append("Employment insurance rate should be between 0-100%")

            if issues:
                print("⚠ Verification warnings:")
                for issue in issues:
                    print(f"  - {issue}")
                return False
            else:
                print("✓ All settings verified successfully")
                return True

        except Exception as e:
            print(f"✗ Error verifying settings: {e}")
            return False


async def main():
    """
    Main initialization script.

    Workflow:
    1. Check if settings exist
    2. Create defaults if missing
    3. Verify settings are valid
    4. Report final status
    """
    print("=" * 60)
    print("Payroll Configuration Initialization Script")
    print("=" * 60)
    print()

    # Step 1: Check if settings exist
    print("Step 1: Checking for existing settings...")
    settings_exist = await check_settings_exist()

    # Step 2: Create defaults if needed
    if not settings_exist:
        print("\nStep 2: Creating default settings...")
        created = await create_default_settings()
        if not created:
            print("\n❌ FAILED: Could not create default settings")
            sys.exit(1)
    else:
        print("\nStep 2: Skipped (settings already exist)")

    # Step 3: Verify settings
    print()
    verified = await verify_settings()

    # Final status
    print("\n" + "=" * 60)
    if verified:
        print("✅ SUCCESS: Payroll configuration initialized and verified")
        print("=" * 60)
        sys.exit(0)
    else:
        print("⚠ WARNING: Settings exist but may need adjustment")
        print("=" * 60)
        sys.exit(0)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠ Script interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
