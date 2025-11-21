"""
Test Employee-Payroll Integration
Tests the integration between employee data and payroll calculation
"""
import pytest
from datetime import date, time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import (
    Base, Employee, Factory, Apartment, TimerCard
)
from app.services.payroll_service import PayrollService


@pytest.fixture
def test_db():
    """Create in-memory SQLite database for testing"""
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def sample_data(test_db):
    """Create sample employee, factory, and apartment data"""
    # Create factory
    factory = Factory(
        factory_id="TOKYO_001",
        company_name="Toyota Manufacturing",
        plant_name="Motomachi Plant",
        name="Motomachi Plant",
        address="1-1 Toyota City, Aichi",
        phone="0123-45-6789",
        contact_person="Mr. Suzuki",
        config={
            "jikyu_tanka": 1500,
            "gasoline_allowance": True,
            "gasoline_amount": 5000,
            "attendance_bonus": 10000
        },
        is_active=True
    )
    test_db.add(factory)

    # Create apartment
    apartment = Apartment(
        apartment_code="APT001",
        address="1-2-3 Shibuya, Tokyo",
        monthly_rent=45000,
        capacity=2,
        is_available=True,
        notes="Near station"
    )
    test_db.add(apartment)

    # Create employee
    employee = Employee(
        hakenmoto_id=1001,
        rirekisho_id="RK2024001",
        factory_id="TOKYO_001",
        company_name="Toyota Manufacturing",
        plant_name="Motomachi Plant",
        full_name_kanji="山田太郎",
        full_name_kana="ヤマダタロウ",
        jikyu=1500,
        position="Operador de Línea",
        contract_type="Tiempo Completo",
        hire_date=date(2024, 1, 15),
        current_hire_date=date(2024, 1, 15),
        apartment_id=1,
        apartment_rent=30000,
        is_active=True,
        current_status="active"
    )
    test_db.add(employee)

    # Create timer cards
    timer_cards = [
        TimerCard(
            employee_id=1,
            work_date=date(2025, 10, 1),
            clock_in=time(9, 0),
            clock_out=time(18, 0),
            break_minutes=60,
            regular_hours=8.0,
            overtime_hours=0.0,
            night_hours=0.0,
            holiday_hours=0.0,
            is_approved=True
        ),
        TimerCard(
            employee_id=1,
            work_date=date(2025, 10, 2),
            clock_in=time(9, 0),
            clock_out=time(19, 0),
            break_minutes=60,
            regular_hours=8.0,
            overtime_hours=1.0,
            night_hours=0.0,
            holiday_hours=0.0,
            is_approved=True
        ),
        TimerCard(
            employee_id=1,
            work_date=date(2025, 10, 3),
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=60,
            regular_hours=7.0,
            overtime_hours=0.0,
            night_hours=0.0,
            holiday_hours=0.0,
            is_approved=True
        )
    ]

    for card in timer_cards:
        test_db.add(card)

    test_db.commit()
    test_db.refresh(employee)
    return employee


def test_get_employee_data_for_payroll(test_db, sample_data):
    """Test fetching employee data from database"""
    service = PayrollService(db_session=test_db)

    # Fetch employee data
    employee_data = service.get_employee_data_for_payroll(employee_id=1)

    # Assertions
    assert employee_data['employee_id'] == 1
    assert employee_data['name'] == "山田太郎"
    assert employee_data['base_hourly_rate'] == 1500.0
    assert employee_data['factory_id'] == "TOKYO_001"
    # Note: Factory doesn't have prefecture field - we set it to None
    assert employee_data['apartment_rent'] == 30000.0
    assert employee_data['contract_type'] == "Tiempo Completo"
    assert 'factory' in employee_data
    assert 'apartment' in employee_data
    assert employee_data['factory']['company_name'] == "Toyota Manufacturing"
    assert employee_data['apartment']['address'] == "1-2-3 Shibuya, Tokyo"


def test_calculate_payroll_by_employee_id(test_db, sample_data):
    """Test payroll calculation using employee ID (database mode)"""
    service = PayrollService(db_session=test_db)

    # Prepare timer records
    timer_records = [
        {
            'work_date': '2025-10-01',
            'clock_in': '09:00',
            'clock_out': '18:00',
            'break_minutes': 60
        },
        {
            'work_date': '2025-10-02',
            'clock_in': '09:00',
            'clock_out': '19:00',
            'break_minutes': 60
        }
    ]

    # Calculate payroll using employee ID
    result = service.calculate_employee_payroll(
        employee_id=1,
        timer_records=timer_records
    )

    # Assertions
    assert result['success'] is True
    assert result['employee_id'] == 1
    assert result['hours_breakdown']['regular_hours'] > 0
    assert result['amounts']['gross_amount'] > 0
    assert result['amounts']['net_amount'] > 0
    assert 'employee_info' in result
    assert result['employee_info']['name'] == "山田太郎"

    # Verify deductions include apartment rent
    assert result['deductions_detail']['apartment'] == 30000


def test_calculate_payroll_traditional_mode(test_db, sample_data):
    """Test payroll calculation using traditional mode (passing employee_data dict)"""
    service = PayrollService(db_session=test_db)

    # Traditional employee data
    employee_data = {
        'employee_id': 1,
        'name': 'Test Employee',
        'base_hourly_rate': 1500,
        'apartment_rent': 30000,
        'dependents': 0
    }

    timer_records = [
        {
            'work_date': '2025-10-01',
            'clock_in': '09:00',
            'clock_out': '18:00',
            'break_minutes': 60
        }
    ]

    # Calculate payroll using traditional mode
    result = service.calculate_employee_payroll(
        employee_data=employee_data,
        timer_records=timer_records
    )

    # Assertions
    assert result['success'] is True
    assert result['employee_id'] == 1
    assert result['amounts']['gross_amount'] > 0


def test_payroll_integration_complete_flow(test_db, sample_data):
    """Test complete integration flow: employee search → data fetch → payroll calc"""
    service = PayrollService(db_session=test_db)

    # Step 1: Fetch employee from database
    employee_data = service.get_employee_data_for_payroll(employee_id=1)

    # Verify employee data structure
    assert 'employee_id' in employee_data
    assert 'name' in employee_data
    assert 'base_hourly_rate' in employee_data
    assert 'factory' in employee_data
    assert 'apartment' in employee_data

    # Step 2: Calculate payroll using fetched data
    timer_records = [
        {
            'work_date': '2025-10-01',
            'clock_in': '09:00',
            'clock_out': '18:00',
            'break_minutes': 60
        }
    ]

    result = service.calculate_employee_payroll(
        employee_data=employee_data,
        timer_records=timer_records
    )

    # Verify payroll calculation
    assert result['success'] is True
    assert result['employee_info']['name'] == employee_data['name']
    assert result['employee_info']['factory']['company_name'] == employee_data['factory']['company_name']

    # Verify all required fields are used
    assert 'hours_breakdown' in result
    assert 'rates' in result
    assert 'amounts' in result
    assert 'deductions_detail' in result


def test_employee_not_found(test_db):
    """Test error handling when employee not found"""
    service = PayrollService(db_session=test_db)

    with pytest.raises(ValueError, match="Employee with ID 999 not found"):
        service.get_employee_data_for_payroll(employee_id=999)


def test_payroll_without_db_session():
    """Test error when database session not provided"""
    service = PayrollService(db_session=None)

    with pytest.raises(ValueError, match="Database session is required"):
        service.get_employee_data_for_payroll(employee_id=1)


def test_payroll_integration_with_real_timer_cards(test_db, sample_data):
    """Test integration using actual timer card records from database"""
    service = PayrollService(db_session=test_db)

    # Calculate payroll using timer cards from database
    result = service.calculate_employee_payroll(
        employee_id=1,
        timer_records=[
            {
                'work_date': '2025-10-01',
                'clock_in': '09:00',
                'clock_out': '18:00',
                'break_minutes': 60
            }
        ]
    )

    assert result['success'] is True
    assert result['employee_id'] == 1
    assert result['employee_info'] is not None
    assert result['employee_info']['name'] == "山田太郎"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
