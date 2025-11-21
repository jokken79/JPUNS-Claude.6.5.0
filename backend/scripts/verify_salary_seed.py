#!/usr/bin/env python3
"""
Verification Script for Salary Seed Data
========================================

Verifies that the seed data was created correctly and displays a summary.

Usage:
    docker exec uns-claudejp-backend python backend/scripts/verify_salary_seed.py
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.models import Employee, TimerCard, SalaryCalculation, Factory, Apartment
from app.models.payroll_models import PayrollRun, EmployeePayroll, PayrollSettings


async def verify_seed_data():
    """Verify that all seed data was created correctly."""

    print("\n" + "="*60)
    print("🔍 VERIFYING SALARY SEED DATA")
    print("="*60)

    # Create async engine and session
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session_factory = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session_factory() as session:
        # Check PayrollSettings
        print("\n📊 PayrollSettings:")
        result = await session.execute(select(PayrollSettings))
        settings_obj = result.scalar_one_or_none()
        if settings_obj:
            print(f"   ✅ Configured")
            print(f"   - Overtime rate: {settings_obj.overtime_rate}")
            print(f"   - Night shift rate: {settings_obj.night_shift_rate}")
            print(f"   - Holiday rate: {settings_obj.holiday_rate}")
        else:
            print("   ❌ NOT FOUND")

        # Check Factories
        print("\n🏭 Factories:")
        result = await session.execute(
            select(Factory).where(
                Factory.factory_id.in_(['TOYOTA__NAGOYA', 'HONDA__SUZUKA'])
            )
        )
        factories = result.scalars().all()
        print(f"   ✅ {len(factories)} factories found")
        for factory in factories:
            print(f"   - {factory.name} (ID: {factory.factory_id})")

        # Check Apartments
        print("\n🏠 Apartments:")
        result = await session.execute(
            select(Apartment).where(
                Apartment.apartment_code.like('APT%')
            )
        )
        apartments = result.scalars().all()
        print(f"   ✅ {len(apartments)} apartments found")
        for apt in apartments:
            print(f"   - {apt.name} ({apt.room_type}) - ¥{apt.base_rent:,}/month")

        # Check Employees
        print("\n👥 Employees:")
        result = await session.execute(
            select(Employee).where(Employee.hakenmoto_id >= 1001)
        )
        employees = result.scalars().all()
        print(f"   ✅ {len(employees)} employees found")
        for emp in employees:
            print(f"   - {emp.full_name_kanji} ({emp.hakenmoto_id}) - ¥{emp.jikyu}/hour @ {emp.company_name}")

        # Check Timer Cards
        print("\n⏱️  Timer Cards:")
        result = await session.execute(
            select(func.count(TimerCard.id)).where(
                TimerCard.hakenmoto_id.in_([1001, 1002, 1003, 1004, 1005])
            )
        )
        timer_count = result.scalar()
        print(f"   ✅ {timer_count} timer cards found")

        # Timer cards by employee
        for emp in employees:
            result = await session.execute(
                select(func.count(TimerCard.id)).where(
                    TimerCard.hakenmoto_id == emp.hakenmoto_id
                )
            )
            count = result.scalar()
            print(f"   - {emp.full_name_kanji}: {count} timer cards")

        # Check Salary Calculations
        print("\n💰 Salary Calculations:")
        result = await session.execute(
            select(SalaryCalculation)
            .join(Employee, SalaryCalculation.employee_id == Employee.id)
            .where(Employee.hakenmoto_id >= 1001)
        )
        salary_calcs = result.scalars().all()
        print(f"   ✅ {len(salary_calcs)} salary calculations found")

        total_gross = 0
        total_net = 0
        total_profit = 0

        for salary in salary_calcs:
            emp_result = await session.execute(
                select(Employee).where(Employee.id == salary.employee_id)
            )
            emp = emp_result.scalar_one()
            print(f"   - {emp.full_name_kanji}:")
            print(f"     • Hours: {salary.total_regular_hours}h regular + {salary.total_overtime_hours}h OT + {salary.total_night_hours}h night")
            print(f"     • Gross: ¥{salary.gross_salary:,}")
            print(f"     • Deductions: ¥{salary.apartment_deduction + salary.other_deductions:,}")
            print(f"     • Net: ¥{salary.net_salary:,}")
            print(f"     • Company Profit: ¥{salary.company_profit:,}")

            total_gross += salary.gross_salary
            total_net += salary.net_salary
            total_profit += salary.company_profit

        # Check PayrollRun
        print("\n📋 Payroll Runs:")
        result = await session.execute(
            select(PayrollRun).order_by(PayrollRun.created_at.desc()).limit(1)
        )
        payroll_run = result.scalar_one_or_none()
        if payroll_run:
            print(f"   ✅ Latest payroll run found (ID: {payroll_run.id})")
            print(f"   - Period: {payroll_run.pay_period_start} to {payroll_run.pay_period_end}")
            print(f"   - Status: {payroll_run.status}")
            print(f"   - Employees: {payroll_run.total_employees}")
            print(f"   - Gross: ¥{payroll_run.total_gross_amount:,}")
            print(f"   - Net: ¥{payroll_run.total_net_amount:,}")
        else:
            print("   ❌ No payroll runs found")

        # Check EmployeePayroll
        print("\n📝 Employee Payroll Records:")
        if payroll_run:
            result = await session.execute(
                select(EmployeePayroll).where(
                    EmployeePayroll.payroll_run_id == payroll_run.id
                )
            )
            emp_payrolls = result.scalars().all()
            print(f"   ✅ {len(emp_payrolls)} employee payroll records found")
        else:
            print("   ⚠️  No payroll run to check")

        # Summary
        print("\n" + "="*60)
        print("📊 SUMMARY")
        print("="*60)
        print(f"Factories:          {len(factories)}")
        print(f"Apartments:         {len(apartments)}")
        print(f"Employees:          {len(employees)}")
        print(f"Timer Cards:        {timer_count}")
        print(f"Salary Calcs:       {len(salary_calcs)}")
        print(f"Payroll Runs:       {'1' if payroll_run else '0'}")
        print(f"\n💰 Total Payroll:")
        print(f"Gross:              ¥{total_gross:,}")
        print(f"Net:                ¥{total_net:,}")
        print(f"Company Profit:     ¥{total_profit:,}")
        print("="*60 + "\n")

        # Validation
        errors = []
        if len(factories) != 2:
            errors.append(f"Expected 2 factories, found {len(factories)}")
        if len(apartments) != 5:
            errors.append(f"Expected 5 apartments, found {len(apartments)}")
        if len(employees) != 5:
            errors.append(f"Expected 5 employees, found {len(employees)}")
        if timer_count != 100:
            errors.append(f"Expected 100 timer cards, found {timer_count}")
        if len(salary_calcs) != 5:
            errors.append(f"Expected 5 salary calculations, found {len(salary_calcs)}")
        if not payroll_run:
            errors.append("Expected 1 payroll run, found 0")

        if errors:
            print("❌ VALIDATION FAILED:")
            for error in errors:
                print(f"   - {error}")
            return 1
        else:
            print("✅ ALL VALIDATION CHECKS PASSED!")
            print("\n🎯 Seed data is ready for testing!")
            return 0


async def main():
    """Entry point for the verification script."""
    try:
        return await verify_seed_data()
    except Exception as e:
        print(f"\n❌ Error verifying seed data: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
