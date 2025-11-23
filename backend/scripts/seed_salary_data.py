#!/usr/bin/env python3
"""
Seed Script for Salary System Testing Data
==========================================

Creates realistic test data for the salary calculation system:
- 5 employees with varied hourly rates
- 2 factories with different configurations
- 5 apartments with varying rents
- 100 timer cards (October 2025, 20 days per employee)
- 5 salary calculations for October 2025
- PayrollSettings with Japanese labor law rates
- Sample PayrollRun with EmployeePayroll records

Usage:
    # From Docker container
    docker exec uns-claudejp-backend python backend/scripts/seed_salary_data.py

    # Locally
    python backend/scripts/seed_salary_data.py

    # With environment variable
    DATABASE_URL=postgresql://... python backend/scripts/seed_salary_data.py
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime, date, time, timedelta
from decimal import Decimal
from typing import List

# Add backend to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.models import (
    Employee, TimerCard, SalaryCalculation,
    Factory, Apartment, ShiftType
)
from app.models.payroll_models import PayrollRun, EmployeePayroll, PayrollSettings


# ============================================
# SEED DATA DEFINITIONS
# ============================================

FACTORIES_SEED = [
    {
        'factory_id': 'TOYOTA__NAGOYA',
        'company_name': 'トヨタ自動車',
        'plant_name': '名古屋工場',
        'name': 'トヨタ自動車 名古屋工場',
        'address': '愛知県名古屋市港区大江町1-1',
        'phone': '052-611-1111',
        'contact_person': '山田太郎',
        'config': {
            'overtime_bonus': 5000,
            'night_shift_bonus': 3000,
            'attendance_bonus': 10000,
        },
        'is_active': True,
    },
    {
        'factory_id': 'HONDA__SUZUKA',
        'company_name': '本田技研工業',
        'plant_name': '鈴鹿工場',
        'name': '本田技研工業 鈴鹿工場',
        'address': '三重県鈴鹿市平田町1907',
        'phone': '059-378-1111',
        'contact_person': '佐藤花子',
        'config': {
            'overtime_bonus': 4000,
            'night_shift_bonus': 2500,
            'attendance_bonus': 8000,
        },
        'is_active': True,
    },
]

APARTMENTS_SEED = [
    {
        'apartment_code': 'APT001',
        'name': 'さくら荘',
        'building_name': 'さくら荘',
        'room_number': '101',
        'floor_number': 1,
        'postal_code': '456-0001',
        'prefecture': '愛知県',
        'city': '名古屋市熱田区',
        'address': '愛知県名古屋市熱田区神宮1-1-1',
        'address_line1': '神宮1-1-1',
        'address_line2': 'さくら荘101号室',
        'room_type': 'ONE_K',
        'size_sqm': Decimal('25.00'),
        'capacity': 1,
        'property_type': 'Apartamento',
        'base_rent': 30000,
        'monthly_rent': 30000,
        'management_fee': 3000,
        'deposit': 30000,
        'key_money': 30000,
        'default_cleaning_fee': 20000,
        'parking_spaces': 0,
        'is_active': True,
    },
    {
        'apartment_code': 'APT002',
        'name': 'グリーンハイツ',
        'building_name': 'グリーンハイツ',
        'room_number': '203',
        'floor_number': 2,
        'postal_code': '456-0002',
        'prefecture': '愛知県',
        'city': '名古屋市港区',
        'address': '愛知県名古屋市港区港明2-2-2',
        'address_line1': '港明2-2-2',
        'address_line2': 'グリーンハイツ203号室',
        'room_type': 'ONE_DK',
        'size_sqm': Decimal('32.50'),
        'capacity': 2,
        'property_type': 'Apartamento',
        'base_rent': 35000,
        'monthly_rent': 35000,
        'management_fee': 4000,
        'deposit': 35000,
        'key_money': 35000,
        'default_cleaning_fee': 25000,
        'parking_spaces': 1,
        'parking_price_per_unit': 5000,
        'is_active': True,
    },
    {
        'apartment_code': 'APT003',
        'name': 'サンシャイン',
        'building_name': 'サンシャインマンション',
        'room_number': '305',
        'floor_number': 3,
        'postal_code': '510-0001',
        'prefecture': '三重県',
        'city': '四日市市',
        'address': '三重県四日市市日永3-3-3',
        'address_line1': '日永3-3-3',
        'address_line2': 'サンシャインマンション305号室',
        'room_type': 'ONE_LDK',
        'size_sqm': Decimal('40.00'),
        'capacity': 2,
        'property_type': 'Apartamento',
        'base_rent': 40000,
        'monthly_rent': 40000,
        'management_fee': 5000,
        'deposit': 40000,
        'key_money': 40000,
        'default_cleaning_fee': 30000,
        'parking_spaces': 1,
        'parking_price_per_unit': 6000,
        'is_active': True,
    },
    {
        'apartment_code': 'APT004',
        'name': 'コーポ山田',
        'building_name': 'コーポ山田',
        'room_number': 'A-12',
        'floor_number': 1,
        'postal_code': '456-0003',
        'prefecture': '愛知県',
        'city': '名古屋市南区',
        'address': '愛知県名古屋市南区本星崎4-4-4',
        'address_line1': '本星崎4-4-4',
        'address_line2': 'コーポ山田A-12号室',
        'room_type': 'ONE_K',
        'size_sqm': Decimal('22.00'),
        'capacity': 1,
        'property_type': 'Casa',
        'base_rent': 25000,
        'monthly_rent': 25000,
        'management_fee': 2000,
        'deposit': 25000,
        'key_money': 25000,
        'default_cleaning_fee': 15000,
        'parking_spaces': 0,
        'is_active': True,
    },
    {
        'apartment_code': 'APT005',
        'name': 'ライオンズマンション',
        'building_name': 'ライオンズマンション鈴鹿',
        'room_number': '501',
        'floor_number': 5,
        'postal_code': '513-0001',
        'prefecture': '三重県',
        'city': '鈴鹿市',
        'address': '三重県鈴鹿市平田町5-5-5',
        'address_line1': '平田町5-5-5',
        'address_line2': 'ライオンズマンション鈴鹿501号室',
        'room_type': 'TWO_DK',
        'size_sqm': Decimal('50.00'),
        'capacity': 3,
        'property_type': 'Apartamento',
        'base_rent': 50000,
        'monthly_rent': 50000,
        'management_fee': 6000,
        'deposit': 100000,
        'key_money': 50000,
        'default_cleaning_fee': 35000,
        'parking_spaces': 1,
        'parking_price_per_unit': 8000,
        'is_active': True,
    },
]

EMPLOYEES_SEED = [
    {
        'hakenmoto_id': 1001,
        'factory_id': 'TOYOTA__NAGOYA',
        'company_name': 'トヨタ自動車',
        'plant_name': '名古屋工場',
        'full_name_kanji': '田中太郎',
        'full_name_kana': 'タナカタロウ',
        'date_of_birth': date(1995, 4, 15),
        'gender': '男性',
        'nationality': '日本',
        'zairyu_card_number': 'AB1234567',
        'zairyu_expire_date': date(2026, 4, 15),
        'address': '愛知県名古屋市熱田区神宮1-1-1 さくら荘101号室',
        'phone': '080-1111-2222',
        'email': 'tanaka.taro@example.com',
        'emergency_contact_name': '田中花子',
        'emergency_contact_phone': '090-1111-3333',
        'emergency_contact_relationship': '妻',
        'hire_date': date(2024, 4, 1),
        'current_hire_date': date(2024, 4, 1),
        'jikyu': 1000,  # ¥1,000/hour
        'jikyu_revision_date': date(2024, 4, 1),
        'position': '組立作業員',
        'contract_type': '派遣社員',
        'assignment_line': 'A-ライン',
        'job_description': '自動車部品の組立作業',
        'hourly_rate_charged': 1500,  # Factory pays ¥1,500/hour
        'billing_revision_date': date(2024, 4, 1),
        'profit_difference': 500,  # ¥500 profit per hour
        'visa_type': '技能実習',
        'commute_method': '自転車',
        'japanese_level': 'N3',
    },
    {
        'hakenmoto_id': 1002,
        'factory_id': 'TOYOTA__NAGOYA',
        'company_name': 'トヨタ自動車',
        'plant_name': '名古屋工場',
        'full_name_kanji': '佐藤花子',
        'full_name_kana': 'サトウハナコ',
        'date_of_birth': date(1992, 8, 22),
        'gender': '女性',
        'nationality': '日本',
        'zairyu_card_number': 'CD2345678',
        'zairyu_expire_date': date(2027, 8, 22),
        'address': '愛知県名古屋市港区港明2-2-2 グリーンハイツ203号室',
        'phone': '080-2222-3333',
        'email': 'sato.hanako@example.com',
        'emergency_contact_name': '佐藤一郎',
        'emergency_contact_phone': '090-2222-4444',
        'emergency_contact_relationship': '夫',
        'hire_date': date(2023, 10, 1),
        'current_hire_date': date(2023, 10, 1),
        'jikyu': 1100,  # ¥1,100/hour
        'jikyu_revision_date': date(2024, 10, 1),
        'position': '検査員',
        'contract_type': '派遣社員',
        'assignment_line': 'B-ライン',
        'job_description': '完成品の品質検査',
        'hourly_rate_charged': 1650,
        'billing_revision_date': date(2024, 10, 1),
        'profit_difference': 550,
        'visa_type': '特定技能',
        'commute_method': '電車',
        'japanese_level': 'N2',
    },
    {
        'hakenmoto_id': 1003,
        'factory_id': 'HONDA__SUZUKA',
        'company_name': '本田技研工業',
        'plant_name': '鈴鹿工場',
        'full_name_kanji': '鈴木次郎',
        'full_name_kana': 'スズキジロウ',
        'date_of_birth': date(1998, 2, 10),
        'gender': '男性',
        'nationality': 'ベトナム',
        'zairyu_card_number': 'EF3456789',
        'zairyu_expire_date': date(2026, 2, 10),
        'address': '三重県四日市市日永3-3-3 サンシャインマンション305号室',
        'phone': '080-3333-4444',
        'email': 'suzuki.jiro@example.com',
        'emergency_contact_name': 'Nguyen Van A',
        'emergency_contact_phone': '+84-90-3333-5555',
        'emergency_contact_relationship': '父',
        'hire_date': date(2024, 1, 15),
        'current_hire_date': date(2024, 1, 15),
        'jikyu': 950,  # ¥950/hour
        'jikyu_revision_date': date(2024, 1, 15),
        'position': 'プレス作業員',
        'contract_type': '派遣社員',
        'assignment_line': 'C-ライン',
        'job_description': '金属プレス加工',
        'hourly_rate_charged': 1400,
        'billing_revision_date': date(2024, 1, 15),
        'profit_difference': 450,
        'visa_type': '技能実習',
        'commute_method': 'バス',
        'japanese_level': 'N4',
    },
    {
        'hakenmoto_id': 1004,
        'factory_id': 'HONDA__SUZUKA',
        'company_name': '本田技研工業',
        'plant_name': '鈴鹿工場',
        'full_name_kanji': '山田美咲',
        'full_name_kana': 'ヤマダミサキ',
        'date_of_birth': date(1990, 12, 5),
        'gender': '女性',
        'nationality': '日本',
        'zairyu_card_number': 'GH4567890',
        'zairyu_expire_date': date(2028, 12, 5),
        'address': '愛知県名古屋市南区本星崎4-4-4 コーポ山田A-12号室',
        'phone': '080-4444-5555',
        'email': 'yamada.misaki@example.com',
        'emergency_contact_name': '山田健太',
        'emergency_contact_phone': '090-4444-6666',
        'emergency_contact_relationship': '兄',
        'hire_date': date(2022, 6, 1),
        'current_hire_date': date(2022, 6, 1),
        'jikyu': 1150,  # ¥1,150/hour
        'jikyu_revision_date': date(2024, 6, 1),
        'position': 'ライン管理者',
        'contract_type': '派遣社員',
        'assignment_line': 'D-ライン',
        'job_description': '生産ラインの管理・監督',
        'hourly_rate_charged': 1750,
        'billing_revision_date': date(2024, 6, 1),
        'profit_difference': 600,
        'visa_type': None,
        'commute_method': '自家用車',
        'japanese_level': 'ネイティブ',
    },
    {
        'hakenmoto_id': 1005,
        'factory_id': 'TOYOTA__NAGOYA',
        'company_name': 'トヨタ自動車',
        'plant_name': '名古屋工場',
        'full_name_kanji': '石川拓也',
        'full_name_kana': 'イシカワタクヤ',
        'date_of_birth': date(1996, 7, 18),
        'gender': '男性',
        'nationality': 'フィリピン',
        'zairyu_card_number': 'IJ5678901',
        'zairyu_expire_date': date(2025, 7, 18),
        'address': '三重県鈴鹿市平田町5-5-5 ライオンズマンション鈴鹿501号室',
        'phone': '080-5555-6666',
        'email': 'ishikawa.takuya@example.com',
        'emergency_contact_name': 'Maria Santos',
        'emergency_contact_phone': '+63-90-5555-7777',
        'emergency_contact_relationship': '母',
        'hire_date': date(2023, 3, 1),
        'current_hire_date': date(2023, 3, 1),
        'jikyu': 1050,  # ¥1,050/hour
        'jikyu_revision_date': date(2024, 3, 1),
        'position': '溶接工',
        'contract_type': '派遣社員',
        'assignment_line': 'E-ライン',
        'job_description': '自動車フレームの溶接作業',
        'hourly_rate_charged': 1550,
        'billing_revision_date': date(2024, 3, 1),
        'profit_difference': 500,
        'visa_type': '特定技能',
        'commute_method': 'バイク',
        'japanese_level': 'N3',
    },
]


def generate_timer_cards_for_employee(
    employee_id: int,
    hakenmoto_id: int,
    factory_id: str,
    hourly_rate: int,
    year: int = 2025,
    month: int = 10
) -> List[dict]:
    """
    Generate realistic timer card data for one employee for one month.

    Creates 20 working days with varied patterns:
    - Regular 8-hour days
    - Some overtime (OT)
    - Some night shift hours
    - Weekend work (Sunday premium)

    Args:
        employee_id: Employee database ID
        hakenmoto_id: Employee hakenmoto_id
        factory_id: Factory ID
        hourly_rate: Employee's hourly rate
        year: Year for timer cards
        month: Month for timer cards

    Returns:
        List of timer card dictionaries
    """
    timer_cards = []

    # October 2025: 20 working days (Mon-Fri)
    # Weekdays: 1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28
    working_days = [1,2,3,6,7,8,9,10,13,14,15,16,17,20,21,22,23,24,27,28]

    for day in working_days:
        work_date = date(year, month, day)
        weekday = work_date.weekday()  # 0=Monday, 6=Sunday

        # Determine shift type and hours
        if day in [3, 10, 17, 24]:  # Some night shifts
            shift_type = ShiftType.YORU
            clock_in = time(22, 0)  # 10:00 PM
            clock_out = time(7, 0)   # 7:00 AM next day
            break_minutes = 60
            # Night shift: 9 hours work, 5 hours in night period (22:00-05:00)
            regular_hours = Decimal('4.00')
            overtime_hours = Decimal('0.00')
            night_hours = Decimal('5.00')
            holiday_hours = Decimal('0.00')
        elif day in [6, 13, 20, 27]:  # Some overtime days
            shift_type = ShiftType.HIRU
            clock_in = time(8, 30)
            clock_out = time(19, 30)  # Extended to 7:30 PM
            break_minutes = 60
            # 11 hours work: 8 regular + 3 OT
            regular_hours = Decimal('8.00')
            overtime_hours = Decimal('3.00')
            night_hours = Decimal('0.00')
            holiday_hours = Decimal('0.00')
        else:  # Normal day
            shift_type = ShiftType.HIRU
            clock_in = time(8, 30)
            clock_out = time(17, 30)
            break_minutes = 60
            # Standard 8 hours
            regular_hours = Decimal('8.00')
            overtime_hours = Decimal('0.00')
            night_hours = Decimal('0.00')
            holiday_hours = Decimal('0.00')

        timer_card = {
            'hakenmoto_id': hakenmoto_id,
            'employee_id': employee_id,
            'factory_id': factory_id,
            'work_date': work_date,
            'shift_type': shift_type,
            'clock_in': clock_in,
            'clock_out': clock_out,
            'break_minutes': break_minutes,
            'regular_hours': regular_hours,
            'overtime_hours': overtime_hours,
            'night_hours': night_hours,
            'holiday_hours': holiday_hours,
            'notes': None,
            'is_approved': True,
        }

        timer_cards.append(timer_card)

    return timer_cards


def calculate_salary_from_timer_cards(
    employee_id: int,
    employee_data: dict,
    timer_cards: List[dict],
    year: int,
    month: int
) -> dict:
    """
    Calculate salary from timer card data.

    Args:
        employee_id: Employee database ID
        employee_data: Employee seed data
        timer_cards: List of timer cards for this employee
        year: Year for salary calculation
        month: Month for salary calculation

    Returns:
        Dictionary with salary calculation data
    """
    hourly_rate = employee_data['jikyu']
    hourly_rate_charged = employee_data['hourly_rate_charged']

    # Sum hours from timer cards
    total_regular = sum(tc['regular_hours'] for tc in timer_cards)
    total_overtime = sum(tc['overtime_hours'] for tc in timer_cards)
    total_night = sum(tc['night_hours'] for tc in timer_cards)
    total_holiday = sum(tc['holiday_hours'] for tc in timer_cards)

    # Calculate payments (using Japanese labor law rates)
    base_salary = int(total_regular * hourly_rate)
    overtime_pay = int(total_overtime * hourly_rate * Decimal('1.25'))  # 125% for OT
    night_pay = int(total_night * hourly_rate * Decimal('1.25'))  # 125% for night
    holiday_pay = int(total_holiday * hourly_rate * Decimal('1.35'))  # 135% for holidays

    # Bonuses (attendance bonus if 20+ days worked)
    bonus = 10000 if len(timer_cards) >= 20 else 0

    # Allowances
    gasoline_allowance = 5000 if employee_data.get('commute_method') == '自家用車' else 0

    # Gross salary
    gross_salary = base_salary + overtime_pay + night_pay + holiday_pay + bonus + gasoline_allowance

    # Deductions
    apartment_deduction = 30000  # Standard apartment rent deduction
    other_deductions = 0

    # Net salary
    net_salary = gross_salary - apartment_deduction - other_deductions

    # Company profit calculation
    total_hours = total_regular + total_overtime + total_night + total_holiday
    factory_payment = int(total_hours * hourly_rate_charged)
    company_profit = factory_payment - gross_salary

    return {
        'employee_id': employee_id,
        'month': month,
        'year': year,
        'total_regular_hours': total_regular,
        'total_overtime_hours': total_overtime,
        'total_night_hours': total_night,
        'total_holiday_hours': total_holiday,
        'base_salary': base_salary,
        'overtime_pay': overtime_pay,
        'night_pay': night_pay,
        'holiday_pay': holiday_pay,
        'bonus': bonus,
        'gasoline_allowance': gasoline_allowance,
        'apartment_deduction': apartment_deduction,
        'other_deductions': other_deductions,
        'gross_salary': gross_salary,
        'net_salary': net_salary,
        'factory_payment': factory_payment,
        'company_profit': company_profit,
        'is_paid': False,  # Not paid yet
    }


PAYROLL_SETTINGS_SEED = {
    'company_id': None,
    'overtime_rate': Decimal('1.25'),       # 125% for overtime
    'night_shift_rate': Decimal('1.25'),    # 125% for night shift
    'holiday_rate': Decimal('1.35'),        # 135% for holidays
    'sunday_rate': Decimal('1.35'),         # 135% for Sundays
    'standard_hours_per_month': Decimal('160.00'),
    'income_tax_rate': Decimal('10.00'),    # 10% income tax
    'resident_tax_rate': Decimal('5.00'),   # 5% resident tax
    'health_insurance_rate': Decimal('4.75'),  # 4.75% health insurance
    'pension_rate': Decimal('10.00'),       # 10% pension
    'employment_insurance_rate': Decimal('0.30'),  # 0.3% employment insurance
}


async def clear_existing_data(session: AsyncSession) -> None:
    """Clear existing salary-related test data."""
    print("\n🗑️  Clearing existing data...")

    # Delete in correct order (respecting foreign keys)
    await session.execute(delete(EmployeePayroll))
    await session.execute(delete(PayrollRun))
    await session.execute(delete(SalaryCalculation))
    await session.execute(delete(TimerCard))

    # Delete employees with hakenmoto_id >= 1001 (our test data)
    await session.execute(
        delete(Employee).where(Employee.hakenmoto_id >= 1001)
    )

    # Don't delete factories and apartments - they might be used by other data
    # Just clear our test factories
    await session.execute(
        delete(Factory).where(Factory.factory_id.in_(['TOYOTA__NAGOYA', 'HONDA__SUZUKA']))
    )

    # Clear our test apartments
    await session.execute(
        delete(Apartment).where(Apartment.apartment_code.in_(['APT001', 'APT002', 'APT003', 'APT004', 'APT005']))
    )

    await session.commit()
    print("✅ Existing data cleared")


async def seed_database():
    """Main seed function - creates all test data."""

    print("\n" + "="*60)
    print("🌱 SEEDING SALARY SYSTEM TEST DATA")
    print("="*60)

    # Create async engine and session
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session_factory = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session_factory() as session:
        # Step 1: Clear existing data
        await clear_existing_data(session)

        # Step 2: Create PayrollSettings
        print("\n📊 Creating PayrollSettings...")
        # Check if settings already exist
        result = await session.execute(select(PayrollSettings))
        existing_settings = result.scalar_one_or_none()

        if existing_settings:
            print("   ⚠️  PayrollSettings already exists, updating...")
            for key, value in PAYROLL_SETTINGS_SEED.items():
                setattr(existing_settings, key, value)
        else:
            settings_obj = PayrollSettings(**PAYROLL_SETTINGS_SEED)
            session.add(settings_obj)

        await session.flush()
        print("   ✅ PayrollSettings created/updated")

        # Step 3: Create Factories
        print("\n🏭 Creating Factories...")
        factories = []
        for factory_data in FACTORIES_SEED:
            factory = Factory(**factory_data)
            session.add(factory)
            factories.append(factory)

        await session.flush()
        print(f"   ✅ {len(factories)} factories created")

        # Step 4: Create Apartments
        print("\n🏠 Creating Apartments...")
        apartments = []
        for apt_data in APARTMENTS_SEED:
            apartment = Apartment(**apt_data)
            session.add(apartment)
            apartments.append(apartment)

        await session.flush()
        print(f"   ✅ {len(apartments)} apartments created")

        # Step 5: Create Employees
        print("\n👥 Creating Employees...")
        employees = []
        for emp_data in EMPLOYEES_SEED:
            employee = Employee(**emp_data)
            session.add(employee)
            employees.append(employee)

        await session.flush()  # Get employee IDs
        print(f"   ✅ {len(employees)} employees created")

        # Step 6: Create Timer Cards
        print("\n⏱️  Creating Timer Cards...")
        all_timer_cards = []
        timer_cards_by_employee = {}

        for i, (employee, emp_data) in enumerate(zip(employees, EMPLOYEES_SEED)):
            timer_cards = generate_timer_cards_for_employee(
                employee_id=employee.id,
                hakenmoto_id=employee.hakenmoto_id,
                factory_id=employee.factory_id,
                hourly_rate=emp_data['jikyu'],
                year=2025,
                month=10
            )

            timer_cards_by_employee[employee.id] = timer_cards

            for tc_data in timer_cards:
                timer_card = TimerCard(**tc_data)
                session.add(timer_card)
                all_timer_cards.append(timer_card)

            print(f"   - {emp_data['full_name_kanji']}: {len(timer_cards)} timer cards")

        await session.flush()
        print(f"   ✅ {len(all_timer_cards)} timer cards created")

        # Step 7: Create Salary Calculations
        print("\n💰 Creating Salary Calculations...")
        salary_calculations = []

        for i, (employee, emp_data) in enumerate(zip(employees, EMPLOYEES_SEED)):
            salary_data = calculate_salary_from_timer_cards(
                employee_id=employee.id,
                employee_data=emp_data,
                timer_cards=timer_cards_by_employee[employee.id],
                year=2025,
                month=10
            )

            salary_calc = SalaryCalculation(**salary_data)
            session.add(salary_calc)
            salary_calculations.append(salary_calc)

            print(f"   - {emp_data['full_name_kanji']}: ¥{salary_data['gross_salary']:,} gross / ¥{salary_data['net_salary']:,} net")

        await session.flush()
        print(f"   ✅ {len(salary_calculations)} salary calculations created")

        # Step 8: Create PayrollRun
        print("\n📋 Creating PayrollRun...")
        payroll_run = PayrollRun(
            pay_period_start=date(2025, 10, 1),
            pay_period_end=date(2025, 10, 31),
            status='draft',
            total_employees=len(employees),
            total_gross_amount=sum(sc.gross_salary for sc in salary_calculations),
            total_deductions=sum(sc.apartment_deduction + sc.other_deductions for sc in salary_calculations),
            total_net_amount=sum(sc.net_salary for sc in salary_calculations),
            created_by='seed_script',
        )
        session.add(payroll_run)
        await session.flush()
        print(f"   ✅ PayrollRun created (ID: {payroll_run.id})")

        # Step 9: Create EmployeePayroll records
        print("\n📝 Creating EmployeePayroll records...")
        employee_payrolls = []

        for i, (employee, emp_data, salary_calc) in enumerate(zip(employees, EMPLOYEES_SEED, salary_calculations)):
            # Get PayrollSettings rates
            payroll_settings = await session.execute(select(PayrollSettings))
            settings_obj = payroll_settings.scalar_one()

            base_rate = Decimal(str(emp_data['jikyu']))

            employee_payroll = EmployeePayroll(
                payroll_run_id=payroll_run.id,
                employee_id=employee.id,
                pay_period_start=date(2025, 10, 1),
                pay_period_end=date(2025, 10, 31),
                regular_hours=salary_calc.total_regular_hours,
                overtime_hours=salary_calc.total_overtime_hours,
                night_shift_hours=salary_calc.total_night_hours,
                holiday_hours=salary_calc.total_holiday_hours,
                sunday_hours=Decimal('0.00'),
                base_rate=base_rate,
                overtime_rate=base_rate * settings_obj.overtime_rate,
                night_shift_rate=base_rate * settings_obj.night_shift_rate,
                holiday_rate=base_rate * settings_obj.holiday_rate,
                base_amount=Decimal(str(salary_calc.base_salary)),
                overtime_amount=Decimal(str(salary_calc.overtime_pay)),
                night_shift_amount=Decimal(str(salary_calc.night_pay)),
                holiday_amount=Decimal(str(salary_calc.holiday_pay)),
                gross_amount=Decimal(str(salary_calc.gross_salary)),
                income_tax=Decimal('0.00'),  # Simplified for seed data
                resident_tax=Decimal('0.00'),
                health_insurance=Decimal('0.00'),
                pension=Decimal('0.00'),
                employment_insurance=Decimal('0.00'),
                total_deductions=Decimal(str(salary_calc.apartment_deduction)),
                net_amount=Decimal(str(salary_calc.net_salary)),
                payslip_generated=False,
            )
            session.add(employee_payroll)
            employee_payrolls.append(employee_payroll)

        await session.flush()
        print(f"   ✅ {len(employee_payrolls)} employee payroll records created")

        # Final commit
        await session.commit()

        # Print summary
        print("\n" + "="*60)
        print("✅ SEED DATA CREATION COMPLETE!")
        print("="*60)
        print(f"\n📊 Summary:")
        print(f"   - Factories: {len(factories)}")
        print(f"   - Apartments: {len(apartments)}")
        print(f"   - Employees: {len(employees)}")
        print(f"   - Timer Cards: {len(all_timer_cards)}")
        print(f"   - Salary Calculations: {len(salary_calculations)}")
        print(f"   - Payroll Runs: 1")
        print(f"   - Employee Payroll Records: {len(employee_payrolls)}")
        print(f"   - PayrollSettings: ✅ Configured")

        print(f"\n💰 Total Payroll:")
        print(f"   - Gross: ¥{sum(sc.gross_salary for sc in salary_calculations):,}")
        print(f"   - Deductions: ¥{sum(sc.apartment_deduction for sc in salary_calculations):,}")
        print(f"   - Net: ¥{sum(sc.net_salary for sc in salary_calculations):,}")
        print(f"   - Company Profit: ¥{sum(sc.company_profit for sc in salary_calculations):,}")

        print("\n🎯 Test Data Ready!")
        print("   You can now test salary calculations, reports, and exports.")
        print("="*60 + "\n")


async def main():
    """Entry point for the seed script."""
    try:
        await seed_database()
        return 0
    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
