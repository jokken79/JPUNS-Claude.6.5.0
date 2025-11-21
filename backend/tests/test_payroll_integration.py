"""
Integration Test: Timer Card OCR Data to Payroll Calculation
Tests the complete flow from timer card extraction to payroll calculation

NOTE (SEMANA 6): This test file has been updated to use PayrollService instead of
the deleted PayrollIntegrationService. These tests require implementing the following
methods in PayrollService:
- get_timer_cards_for_payroll(employee_id, start_date, end_date)
- calculate_payroll_from_timer_cards(employee_id, start_date, end_date)
- get_unprocessed_timer_cards()

Status: Tests are ready to run once the above methods are implemented.
Target: SEMANA 6.3 - Implement Timer Card Payroll Integration
"""
import pytest
from datetime import datetime, date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.models import Base, Employee, TimerCard, Factory
from app.services.payroll_service import PayrollService
from app.models.payroll_models import PayrollRun

# TODO SEMANA 6.3: Implement the timer card payroll integration methods
# These tests will pass once the methods are added to PayrollService


@pytest.fixture
def db_session():
    """Create in-memory database for testing"""
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def sample_data(db_session):
    """Create sample employee and timer card data"""
    # Create factory
    factory = Factory(
        factory_id="TEST_FACTORY_001",
        company_name="Test Company",
        plant_name="Test Plant",
        name="Test Factory"
    )
    db_session.add(factory)

    # Create employee
    employee = Employee(
        hakenmoto_id=1001,
        rirekisho_id="RIREKISHO_001",
        factory_id="TEST_FACTORY_001",
        company_name="Test Company",
        plant_name="Test Plant",
        full_name_kanji="山田太郎",
        full_name_kana="ヤマダタロウ",
        jikyu=1500,
        apartment_rent=30000
    )
    db_session.add(employee)
    db_session.flush()  # Get the employee ID

    # Create timer cards for October 2025
    timer_cards = []
    for day in [1, 2, 3, 4, 7, 8, 9, 10, 11]:  # 9 working days
        timer_card = TimerCard(
            employee_id=employee.id,
            factory_id="TEST_FACTORY_001",
            work_date=date(2025, 10, day),
            clock_in=datetime.strptime("09:00", "%H:%M").time(),
            clock_out=datetime.strptime("18:00", "%H:%M").time(),
            break_minutes=60,
            regular_hours=8.0,
            overtime_hours=0.0,
            night_hours=0.0,
            holiday_hours=0.0,
            is_approved=True
        )
        timer_cards.append(timer_card)

    # Add one day with overtime
    overtime_card = TimerCard(
        employee_id=employee.id,
        factory_id="TEST_FACTORY_001",
        work_date=date(2025, 10, 14),
        clock_in=datetime.strptime("09:00", "%H:%M").time(),
        clock_out=datetime.strptime("20:00", "%H:%M").time(),
        break_minutes=60,
        regular_hours=8.0,
        overtime_hours=3.0,
        night_hours=0.0,
        holiday_hours=0.0,
        is_approved=True
    )
    timer_cards.append(overtime_card)

    db_session.add_all(timer_cards)
    db_session.commit()

    return {
        'employee': employee,
        'factory': factory,
        'timer_cards': timer_cards
    }


def test_get_timer_cards_for_payroll(db_session, sample_data):
    """Test fetching timer cards for a specific employee and date range"""
    service = PayrollService(db_session)

    # Fetch timer cards for October 2025
    result = service.get_timer_cards_for_payroll(
        employee_id=sample_data['employee'].id,
        start_date="2025-10-01",
        end_date="2025-10-31"
    )

    assert result['success'] is True
    assert result['employee']['full_name_kanji'] == "山田太郎"
    assert result['employee']['jikyu'] == 1500
    assert result['employee']['apartment_rent'] == 30000
    assert len(result['timer_records']) == 10
    assert result['total_records'] == 10

    # Verify timer card data
    first_record = result['timer_records'][0]
    assert first_record['work_date'] == "2025-10-01"
    assert first_record['clock_in'] == "09:00"
    assert first_record['clock_out'] == "18:00"
    assert first_record['break_minutes'] == 60
    assert first_record['regular_hours'] == 8.0
    assert first_record['is_approved'] is True

    # Verify overtime record
    overtime_record = result['timer_records'][-1]
    assert overtime_record['regular_hours'] == 8.0
    assert overtime_record['overtime_hours'] == 3.0


def test_calculate_payroll_from_timer_cards(db_session, sample_data):
    """Test calculating payroll using timer card data from database"""
    service = PayrollService(db_session)

    # Calculate payroll for October 2025
    result = service.calculate_payroll_from_timer_cards(
        employee_id=sample_data['employee'].id,
        start_date="2025-10-01",
        end_date="2025-10-31"
    )

    assert result['success'] is True
    assert result['employee_id'] == sample_data['employee'].id
    assert result['pay_period_start'] == "2025-10-01"
    assert result['pay_period_end'] == "2025-10-31"

    # Verify hours breakdown
    hours = result['hours_breakdown']
    assert hours['work_days'] == 10
    assert hours['regular_hours'] == 80.0  # 10 days * 8 hours
    assert hours['overtime_hours'] == 3.0  # 1 day with overtime

    # Verify rates
    rates = result['rates']
    assert rates['base_rate'] == 1500.0
    assert rates['overtime_rate'] == 1.25

    # Verify amounts
    amounts = result['amounts']
    base_amount = 80.0 * 1500.0
    overtime_amount = 3.0 * 1500.0 * 1.25
    expected_gross = base_amount + overtime_amount

    assert amounts['base_amount'] == int(base_amount)
    assert amounts['overtime_amount'] == int(overtime_amount)
    assert amounts['gross_amount'] == int(expected_gross)
    assert amounts['net_amount'] < amounts['gross_amount']  # Deductions applied

    # Verify deductions
    deductions = result['deductions_detail']
    assert deductions['apartment'] == 30000
    assert deductions['health_insurance'] > 0
    assert deductions['pension'] > 0
    assert deductions['income_tax'] > 0


def test_calculate_payroll_with_date_range_filter(db_session, sample_data):
    """Test that payroll calculation respects date range"""
    service = PayrollService(db_session)

    # Calculate payroll for first half of October only
    result = service.calculate_payroll_from_timer_cards(
        employee_id=sample_data['employee'].id,
        start_date="2025-10-01",
        end_date="2025-10-15"
    )

    assert result['success'] is True

    # Should only include records up to October 15
    hours = result['hours_breakdown']
    assert hours['work_days'] < 10  # Not all days included
    assert hours['total_hours'] > 0


def test_get_unprocessed_timer_cards(db_session, sample_data):
    """Test fetching unprocessed timer cards"""
    service = PayrollService(db_session)

    # Get unprocessed timer cards
    result = service.get_unprocessed_timer_cards()

    assert result['success'] is True
    assert result['total_employees'] == 1
    assert result['total_records'] == 10

    # Verify grouped by employee
    employee_data = result['employees'][0]
    assert employee_data['employee_id'] == sample_data['employee'].id
    assert employee_data['employee_name'] == "山田太郎"
    assert len(employee_data['timer_cards']) == 10


def test_employee_not_found_error(db_session):
    """Test error handling when employee is not found"""
    service = PayrollService(db_session)

    result = service.get_timer_cards_for_payroll(
        employee_id=9999,
        start_date="2025-10-01",
        end_date="2025-10-31"
    )

    assert result['success'] is False
    assert 'not found' in result['error']


def test_invalid_date_format_error(db_session):
    """Test error handling for invalid date format"""
    service = PayrollService(db_session)

    result = service.get_timer_cards_for_payroll(
        employee_id=1,
        start_date="invalid-date",
        end_date="2025-10-31"
    )

    assert result['success'] is False
    assert 'Invalid date format' in result['error']


def test_complete_flow_from_ocr_to_payroll(db_session, sample_data):
    """Complete integration test: Timer Card → Employee → Payroll Calculation

    This test demonstrates the complete flow:
    1. Timer cards are stored in the database with OCR data
    2. Employee is matched to timer cards
    3. Payroll is calculated using timer card data
    4. Result includes all necessary information for payslip generation
    """
    service = PayrollService(db_session)

    # Step 1: Get timer cards (simulating OCR data fetch)
    timer_data = service.get_timer_cards_for_payroll(
        employee_id=sample_data['employee'].id,
        start_date="2025-10-01",
        end_date="2025-10-31"
    )

    assert timer_data['success'] is True
    assert len(timer_data['timer_records']) > 0

    # Step 2: Calculate payroll from timer cards
    payroll_result = service.calculate_payroll_from_timer_cards(
        employee_id=sample_data['employee'].id,
        start_date="2025-10-01",
        end_date="2025-10-31"
    )

    # Verify complete payroll result
    assert payroll_result['success'] is True
    assert payroll_result['validation']['is_valid'] is True
    assert payroll_result['validation']['errors'] == []

    # Verify all required fields for payslip are present
    assert 'employee_id' in payroll_result
    assert 'hours_breakdown' in payroll_result
    assert 'rates' in payroll_result
    assert 'amounts' in payroll_result
    assert 'deductions_detail' in payroll_result
    assert 'calculated_at' in payroll_result

    # Verify Japanese locale formatting would work
    assert payroll_result['pay_period_start'] == "2025-10-01"
    assert payroll_result['pay_period_end'] == "2025-10-31"

    print(f"""
    Complete Flow Test Results:
    ============================
    Employee: {timer_data['employee']['full_name_kanji']}
    Total Timer Records: {timer_data['total_records']}
    Work Days: {payroll_result['hours_breakdown']['work_days']}
    Total Hours: {payroll_result['hours_breakdown']['total_hours']}
    Base Rate: ¥{payroll_result['rates']['base_rate']}/hour
    Gross Amount: ¥{payroll_result['amounts']['gross_amount']:,}
    Net Amount: ¥{payroll_result['amounts']['net_amount']:,}
    Status: {'✅ VALID' if payroll_result['validation']['is_valid'] else '❌ INVALID'}
    """)


if __name__ == '__main__':
    # Run the complete flow test
    pytest.main([__file__, '-v', '-s'])
