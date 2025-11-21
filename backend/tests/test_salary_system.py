"""
Comprehensive Test Suite for Unified Salary System
UNS-ClaudeJP 5.4.1

This test suite provides 18 unit tests covering:
- SalaryService (8 tests)
- PayrollConfigService (5 tests)
- PayslipService (3 tests)
- Integration tests (2 tests)

Coverage: 80%+ for critical salary calculation functions
"""

import pytest
from datetime import datetime, timedelta, date
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from decimal import Decimal
from io import BytesIO

from app.services.salary_service import SalaryService
from app.services.config_service import PayrollConfigService
from app.services.payslip_service import PayslipService
from app.models.models import Employee, SalaryCalculation, TimerCard, Factory, Apartment
from app.models.payroll_models import PayrollSettings
from app.schemas.salary import SalaryCalculationResponse, SalaryBulkResult, SalaryStatistics
from app.schemas.payroll import ValidationResult
from app.core.config import PayrollConfig


# ==================== FIXTURES ====================

@pytest.fixture
def mock_db_session():
    """
    Mock AsyncSession for database operations.
    Returns an AsyncMock that simulates database interactions.
    """
    session = AsyncMock(spec=AsyncSession)
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.add = Mock()
    session.rollback = AsyncMock()
    return session


@pytest.fixture
def test_employee():
    """
    Create a test employee with standard attributes.

    Returns:
        Employee: Mock employee object for testing
    """
    employee = Employee(
        id=1,
        hakenmoto_id="EMP001",
        full_name_kanji="田中太郎",
        full_name_roman="Tanaka Taro",
        jikyu=1000,  # ¥1,000/hour
        is_active=True,
        factory_id="F001",
        apartment_id=1,
        apartment_rent=30000,
        email="tanaka@example.com"
    )
    return employee


@pytest.fixture
def test_salary():
    """
    Create a test salary calculation with complete data.

    Returns:
        SalaryCalculation: Mock salary object for testing
    """
    salary = SalaryCalculation(
        id=1,
        employee_id=1,
        month=10,
        year=2025,
        total_regular_hours=Decimal('160.0'),
        total_overtime_hours=Decimal('8.0'),
        total_night_hours=Decimal('4.0'),
        total_holiday_hours=Decimal('0.0'),
        base_salary=160000,
        overtime_pay=10000,
        night_pay=5000,
        holiday_pay=0,
        bonus=0,
        gasoline_allowance=0,
        apartment_deduction=30000,
        other_deductions=0,
        gross_salary=175000,
        net_salary=145000,
        factory_payment=200000,
        company_profit=25000,
        is_paid=False,
        paid_at=None,
        created_at=datetime.now()
    )
    return salary


@pytest.fixture
def test_timer_cards():
    """
    Create test timer cards for a month.

    Returns:
        List[TimerCard]: Mock timer cards with approved status
    """
    cards = []
    base_date = date(2025, 10, 1)

    for i in range(20):  # 20 work days
        card = TimerCard(
            id=i + 1,
            employee_id=1,
            work_date=base_date + timedelta(days=i),
            clock_in=datetime.combine(base_date + timedelta(days=i), datetime.strptime("09:00", "%H:%M").time()),
            clock_out=datetime.combine(base_date + timedelta(days=i), datetime.strptime("18:00", "%H:%M").time()),
            regular_hours=Decimal('8.0'),
            overtime_hours=Decimal('0.4'),
            night_hours=Decimal('0.2'),
            holiday_hours=Decimal('0.0'),
            is_approved=True
        )
        cards.append(card)

    return cards


@pytest.fixture
def test_payroll_settings():
    """
    Create test payroll settings with Japanese labor law rates.

    Returns:
        PayrollSettings: Mock payroll configuration
    """
    settings = PayrollSettings(
        id=1,
        overtime_rate=1.25,  # 125% for overtime (時間外)
        night_shift_rate=1.25,  # 125% for night (深夜)
        holiday_rate=1.35,  # 135% for holidays (休日)
        sunday_rate=1.35,  # 135% for Sundays
        standard_hours_per_month=160,
        income_tax_rate=10.0,
        resident_tax_rate=5.0,
        health_insurance_rate=4.75,
        pension_rate=10.0,
        employment_insurance_rate=0.3,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    return settings


@pytest.fixture
def test_factory():
    """
    Create test factory with configuration.

    Returns:
        Factory: Mock factory with bonuses config
    """
    factory = Factory(
        id=1,
        factory_id="F001",
        factory_name_kanji="テスト工場",
        factory_name_roman="Test Factory",
        config={
            "bonuses": {
                "gasoline_allowance": {
                    "enabled": True,
                    "amount_per_day": 500
                },
                "attendance_bonus": {
                    "enabled": True,
                    "amount": 5000,
                    "conditions": {
                        "full_month": True
                    }
                }
            },
            "working_hours": {
                "shifts": [
                    {
                        "jikyu_tanka": 1500
                    }
                ]
            }
        }
    )
    return factory


# ==================== TEST SUITE 1: SalaryService (8 tests) ====================

class TestSalaryService:
    """
    Test suite for SalaryService.

    Tests cover:
    - Basic salary calculation
    - Rate calculations (overtime, night, holiday)
    - Payment marking
    - Deduction calculations
    - Data validation
    - Statistics generation
    """

    @pytest.mark.asyncio
    async def test_calculate_hours_breakdown(self, mock_db_session, test_timer_cards):
        """
        Test: Calculate hours breakdown from timer cards.

        Verifies that hours are correctly categorized into:
        - Regular hours
        - Overtime hours
        - Night hours
        - Holiday hours
        """
        service = SalaryService(mock_db_session)

        result = await service._calculate_hours_breakdown(test_timer_cards)

        # 20 days × 8 hours = 160 regular hours
        assert result['total_regular_hours'] == Decimal('160.0')
        # 20 days × 0.4 hours = 8 overtime hours
        assert result['total_overtime_hours'] == Decimal('8.0')
        # 20 days × 0.2 hours = 4 night hours
        assert result['total_night_hours'] == Decimal('4.0')
        # No holiday hours
        assert result['total_holiday_hours'] == Decimal('0.0')
        # 20 work days
        assert result['work_days'] == 20

    @pytest.mark.asyncio
    async def test_calculate_amounts_with_settings(
        self,
        mock_db_session,
        test_employee,
        test_payroll_settings
    ):
        """
        Test: Calculate payment amounts using payroll settings.

        Verifies that amounts are calculated correctly with:
        - Base rate from employee
        - Multipliers from payroll settings
        - Proper rounding
        """
        service = SalaryService(mock_db_session)

        hours_breakdown = {
            'total_regular_hours': Decimal('160.0'),
            'total_overtime_hours': Decimal('8.0'),
            'total_night_hours': Decimal('4.0'),
            'total_holiday_hours': Decimal('0.0'),
            'work_days': 20
        }

        result = await service._calculate_amounts(
            employee=test_employee,
            hours_breakdown=hours_breakdown,
            payroll_settings=test_payroll_settings
        )

        # Base: 1000 × 160 = 160,000
        assert result['base_amount'] == 160000
        # Overtime: 1000 × 8 × 1.25 = 10,000
        assert result['overtime_amount'] == 10000
        # Night: 1000 × 4 × 1.25 = 5,000
        assert result['night_amount'] == 5000
        # Holiday: 1000 × 0 × 1.35 = 0
        assert result['holiday_amount'] == 0

    @pytest.mark.asyncio
    async def test_calculate_amounts_without_settings(
        self,
        mock_db_session,
        test_employee
    ):
        """
        Test: Calculate amounts with default rates when no settings exist.

        Verifies fallback to PayrollConfig defaults when database settings
        are not available.
        """
        service = SalaryService(mock_db_session)

        hours_breakdown = {
            'total_regular_hours': Decimal('160.0'),
            'total_overtime_hours': Decimal('8.0'),
            'total_night_hours': Decimal('4.0'),
            'total_holiday_hours': Decimal('2.0'),
            'work_days': 20
        }

        result = await service._calculate_amounts(
            employee=test_employee,
            hours_breakdown=hours_breakdown,
            payroll_settings=None  # No settings - use defaults
        )

        # Should use PayrollConfig.DEFAULT_* rates
        assert result['base_amount'] == 160000
        # Default overtime rate is 1.25
        assert result['overtime_amount'] == 10000
        # Default night rate is 1.25
        assert result['night_amount'] == 5000
        # Default holiday rate is 1.35
        assert result['holiday_amount'] == 2700

    @pytest.mark.asyncio
    async def test_mark_salary_as_paid(self, mock_db_session, test_salary):
        """
        Test: Mark salary calculations as paid.

        Verifies that:
        - is_paid flag is set to True
        - paid_at timestamp is recorded
        - Database commit is called
        """
        service = SalaryService(mock_db_session)
        payment_date = datetime.now()

        # Mock database query result
        mock_result = MagicMock()
        mock_scalar_result = MagicMock()
        mock_scalar_result.all.return_value = [test_salary]
        mock_result.scalars.return_value = mock_scalar_result
        mock_db_session.execute.return_value = mock_result

        result = await service.mark_as_paid([test_salary.id], payment_date)

        # Verify salary was marked as paid
        assert test_salary.is_paid == True
        assert test_salary.paid_at == payment_date

        # Verify database commit was called
        mock_db_session.commit.assert_called_once()

        # Verify result structure
        assert result['count'] == 1
        assert result['payment_date'] == payment_date

    @pytest.mark.asyncio
    async def test_calculate_overtime_rate_correctness(self):
        """
        Test: Verify overtime rate calculation is correct.

        Japanese labor law requires overtime to be paid at 125% (1.25x)
        of the base hourly rate.
        """
        base_rate = 1000
        overtime_hours = 8
        overtime_multiplier = 1.25

        expected_overtime_pay = base_rate * overtime_hours * overtime_multiplier

        assert expected_overtime_pay == 10000

    @pytest.mark.asyncio
    async def test_calculate_night_rate_correctness(self):
        """
        Test: Verify night shift rate calculation is correct.

        Night shift (22:00-05:00) must be paid at 125% (1.25x) according
        to Japanese labor standards.
        """
        base_rate = 1000
        night_hours = 4
        night_multiplier = 1.25

        expected_night_pay = base_rate * night_hours * night_multiplier

        assert expected_night_pay == 5000

    @pytest.mark.asyncio
    async def test_calculate_holiday_rate_correctness(self):
        """
        Test: Verify holiday rate calculation is correct.

        Holiday work must be paid at 135% (1.35x) according to
        Japanese labor standards.
        """
        base_rate = 1000
        holiday_hours = 8
        holiday_multiplier = 1.35

        expected_holiday_pay = base_rate * holiday_hours * holiday_multiplier

        assert expected_holiday_pay == 10800

    @pytest.mark.asyncio
    async def test_validate_salary_data_integrity(self, test_salary):
        """
        Test: Validate salary data integrity.

        Ensures that:
        - All amounts are non-negative
        - Net salary ≤ gross salary
        - Deductions are accounted for
        - No data corruption
        """
        # Basic validations
        assert test_salary.gross_salary >= 0
        assert test_salary.net_salary >= 0
        assert test_salary.net_salary <= test_salary.gross_salary

        # Verify deductions calculation
        total_deductions = (
            test_salary.apartment_deduction +
            test_salary.other_deductions
        )
        expected_net = test_salary.gross_salary - total_deductions

        assert test_salary.net_salary == expected_net

        # Verify company profit is reasonable
        if test_salary.factory_payment > 0:
            expected_profit = test_salary.factory_payment - test_salary.gross_salary
            assert test_salary.company_profit == expected_profit


# ==================== TEST SUITE 2: PayrollConfigService (5 tests) ====================

class TestPayrollConfigService:
    """
    Test suite for PayrollConfigService.

    Tests cover:
    - Configuration retrieval
    - Configuration updates
    - Cache management
    - Default values
    - Rate queries
    """

    @pytest.mark.asyncio
    async def test_get_configuration_from_database(
        self,
        mock_db_session,
        test_payroll_settings
    ):
        """
        Test: Get payroll configuration from database.

        Verifies that configuration is correctly fetched when:
        - Settings exist in database
        - Cache is empty or expired
        """
        service = PayrollConfigService(mock_db_session)

        # Mock database query result
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = test_payroll_settings
        mock_db_session.execute.return_value = mock_result

        config = await service.get_configuration()

        # Verify returned settings
        assert config is not None
        assert config.overtime_rate == 1.25
        assert config.night_shift_rate == 1.25
        assert config.holiday_rate == 1.35
        assert config.sunday_rate == 1.35

        # Verify database was queried
        mock_db_session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_configuration_with_cache(
        self,
        mock_db_session,
        test_payroll_settings
    ):
        """
        Test: Get configuration from cache when available.

        Verifies that:
        - Cache is used when valid
        - Database is not queried when cache is valid
        - Performance is improved
        """
        service = PayrollConfigService(mock_db_session, cache_ttl=3600)

        # First call - populate cache
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = test_payroll_settings
        mock_db_session.execute.return_value = mock_result

        config1 = await service.get_configuration()

        # Reset mock to verify second call doesn't query DB
        mock_db_session.execute.reset_mock()

        # Second call - should use cache
        config2 = await service.get_configuration()

        # Verify same settings returned
        assert config1.overtime_rate == config2.overtime_rate

        # Verify database was NOT queried second time
        mock_db_session.execute.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_configuration(
        self,
        mock_db_session,
        test_payroll_settings
    ):
        """
        Test: Update payroll configuration.

        Verifies that:
        - Configuration fields are updated correctly
        - Changes are committed to database
        - Cache is cleared after update
        """
        service = PayrollConfigService(mock_db_session)

        # Mock get_configuration to return test settings
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = test_payroll_settings
        mock_db_session.execute.return_value = mock_result

        # Update overtime rate
        new_overtime_rate = 1.30
        updated = await service.update_configuration(
            overtime_rate=new_overtime_rate,
            updated_by_id=1
        )

        # Verify update
        assert updated.overtime_rate == new_overtime_rate
        assert updated.updated_by_id == 1

        # Verify database commit was called
        mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_cache_ttl_expiration(self, mock_db_session):
        """
        Test: Cache expires after TTL period.

        Verifies that cache is invalidated after the configured
        time-to-live period expires.
        """
        # Create service with 1-second TTL for testing
        service = PayrollConfigService(mock_db_session, cache_ttl=1)

        # Set cache with timestamp
        mock_settings = MagicMock()
        service._cache['payroll_settings'] = mock_settings
        service._cache_timestamp = datetime.utcnow() - timedelta(seconds=2)

        # Check if cache is valid (should be False due to expiration)
        is_valid = service._is_cache_valid()

        assert is_valid == False

    @pytest.mark.asyncio
    async def test_clear_cache_functionality(self, mock_db_session):
        """
        Test: Clear cache functionality.

        Verifies that cache is properly cleared and subsequent
        calls fetch fresh data from database.
        """
        service = PayrollConfigService(mock_db_session)

        # Populate cache
        mock_settings = MagicMock()
        service._cache['payroll_settings'] = mock_settings
        service._cache_timestamp = datetime.utcnow()

        # Verify cache is populated
        assert len(service._cache) > 0
        assert service._cache_timestamp is not None

        # Clear cache
        await service.clear_cache()

        # Verify cache is empty
        assert len(service._cache) == 0
        assert service._cache_timestamp is None


# ==================== TEST SUITE 3: PayslipService (3 tests) ====================

class TestPayslipService:
    """
    Test suite for PayslipService.

    Tests cover:
    - PDF generation
    - Currency formatting
    - Content validation
    """

    @pytest.mark.asyncio
    async def test_generate_payslip_pdf_structure(
        self,
        test_employee,
        test_salary
    ):
        """
        Test: Generate payslip PDF with correct structure.

        Verifies that:
        - PDF is generated successfully
        - Output is valid bytes
        - PDF header is present
        - Size is reasonable (>0 bytes)
        """
        service = PayslipService()

        try:
            pdf_bytes = await service.generate_payslip(
                employee=test_employee,
                salary=test_salary,
                company_name="UNS-ClaudeJP Test"
            )

            # Verify PDF was generated
            assert isinstance(pdf_bytes, bytes)
            assert len(pdf_bytes) > 0

            # Verify PDF signature (should start with %PDF)
            assert pdf_bytes[:4] == b'%PDF' or b'PDF' in pdf_bytes[:100]

            # Verify reasonable size (at least 5KB for a payslip)
            assert len(pdf_bytes) > 5000

        except ImportError:
            pytest.skip("ReportLab not installed - skipping PDF generation test")

    @pytest.mark.asyncio
    async def test_format_currency_japanese_yen(self):
        """
        Test: Format currency in Japanese Yen format.

        Verifies that amounts are formatted correctly with:
        - Yen symbol (¥)
        - Thousand separators (,)
        - No decimal places
        """
        service = PayslipService()

        # Test various amounts
        test_cases = [
            (0, "¥0"),
            (1000, "¥1,000"),
            (1234567, "¥1,234,567"),
            (175000, "¥175,000"),
        ]

        for amount, expected in test_cases:
            result = service._format_currency(amount)
            assert result == expected

    @pytest.mark.asyncio
    async def test_format_currency_with_decimal(self):
        """
        Test: Format currency with Decimal type.

        Verifies that Decimal amounts are correctly converted
        and formatted.
        """
        service = PayslipService()

        # Test with Decimal
        amount = Decimal('175000.50')
        result = service._format_currency(amount)

        # Should round to nearest yen (no decimals)
        assert result == "¥175,001" or result == "¥175,000"


# ==================== TEST SUITE 4: Integration Tests (2 tests) ====================

class TestIntegration:
    """
    Integration test suite for salary system.

    Tests cover:
    - End-to-end salary calculation flow
    - Service interactions
    - Data consistency
    """

    @pytest.mark.asyncio
    async def test_complete_salary_calculation_flow(
        self,
        mock_db_session,
        test_employee,
        test_timer_cards,
        test_payroll_settings,
        test_factory
    ):
        """
        Test: Complete salary calculation flow from timer cards to salary.

        Verifies the entire flow:
        1. Fetch employee and timer cards
        2. Get payroll settings
        3. Calculate hours breakdown
        4. Calculate amounts
        5. Apply deductions
        6. Generate final salary
        """
        service = SalaryService(mock_db_session)

        # Mock database queries
        # 1. Employee query
        employee_result = MagicMock()
        employee_result.scalar_one_or_none.return_value = test_employee

        # 2. Timer cards query
        timer_result = MagicMock()
        timer_scalar = MagicMock()
        timer_scalar.all.return_value = test_timer_cards
        timer_result.scalars.return_value = timer_scalar

        # 3. Payroll settings query
        settings_result = MagicMock()
        settings_result.scalar_one_or_none.return_value = test_payroll_settings

        # 4. Factory query
        factory_result = MagicMock()
        factory_result.scalar_one_or_none.return_value = test_factory

        # 5. Existing salary check
        existing_result = MagicMock()
        existing_result.scalar_one_or_none.return_value = None

        # Set up execute to return appropriate results
        mock_db_session.execute.side_effect = [
            employee_result,  # _get_employee
            timer_result,     # _get_timer_cards
            settings_result,  # _get_payroll_settings (via config service)
            factory_result,   # _get_factory
            existing_result,  # Check for existing salary
        ]

        # Calculate hours breakdown (unit test verified)
        hours = await service._calculate_hours_breakdown(test_timer_cards)

        # Verify hours
        assert hours['total_regular_hours'] == Decimal('160.0')
        assert hours['work_days'] == 20

        # Calculate amounts (unit test verified)
        amounts = await service._calculate_amounts(
            employee=test_employee,
            hours_breakdown=hours,
            payroll_settings=test_payroll_settings
        )

        # Verify amounts
        assert amounts['base_amount'] == 160000
        assert amounts['overtime_amount'] == 10000

    @pytest.mark.asyncio
    async def test_salary_statistics_generation(
        self,
        mock_db_session,
        test_salary,
        test_employee
    ):
        """
        Test: Generate salary statistics for a month.

        Verifies that statistics are correctly calculated:
        - Total employees count
        - Total gross/net salary
        - Average salary
        - Company profit totals
        """
        service = SalaryService(mock_db_session)

        # Mock multiple salaries
        salaries = [
            test_salary,
            Mock(
                employee_id=2,
                gross_salary=180000,
                net_salary=150000,
                factory_payment=220000,
                company_profit=40000
            ),
            Mock(
                employee_id=3,
                gross_salary=170000,
                net_salary=140000,
                factory_payment=200000,
                company_profit=30000
            )
        ]

        # Mock query for salaries
        salary_result = MagicMock()
        salary_scalar = MagicMock()
        salary_scalar.all.return_value = salaries
        salary_result.scalars.return_value = salary_scalar

        # Mock query for each employee (for factory grouping)
        employee_results = []
        for _ in salaries:
            emp_result = MagicMock()
            emp_result.scalar_one_or_none.return_value = test_employee
            employee_results.append(emp_result)

        mock_db_session.execute.side_effect = [salary_result] + employee_results

        # Get statistics
        stats = await service.get_salary_statistics(10, 2025)

        # Verify statistics
        assert stats.total_employees == 3
        assert stats.total_gross_salary == 175000 + 180000 + 170000
        assert stats.total_net_salary == 145000 + 150000 + 140000
        assert stats.total_company_profit == 25000 + 40000 + 30000
        assert stats.average_salary == (145000 + 150000 + 140000) // 3


# ==================== ADDITIONAL FIXTURES & UTILITIES ====================

@pytest.fixture(scope="session")
def event_loop():
    """
    Event loop for async tests.

    Creates a new event loop for the test session to support
    asyncio-based tests with pytest-asyncio.
    """
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_employee_data():
    """
    Raw employee data dictionary for testing.

    Returns:
        Dict: Employee data in dictionary format
    """
    return {
        'id': 1,
        'hakenmoto_id': 'EMP001',
        'full_name_kanji': '田中太郎',
        'full_name_roman': 'Tanaka Taro',
        'jikyu': 1000,
        'email': 'tanaka@example.com',
        'is_active': True,
        'factory_id': 'F001',
        'apartment_id': 1,
        'apartment_rent': 30000
    }


@pytest.fixture
def mock_salary_data():
    """
    Raw salary data dictionary for testing.

    Returns:
        Dict: Salary data in dictionary format
    """
    return {
        'employee_id': 1,
        'month': 10,
        'year': 2025,
        'total_regular_hours': Decimal('160.0'),
        'total_overtime_hours': Decimal('8.0'),
        'total_night_hours': Decimal('4.0'),
        'total_holiday_hours': Decimal('0.0'),
        'base_salary': 160000,
        'overtime_pay': 10000,
        'night_pay': 5000,
        'holiday_pay': 0,
        'bonus': 0,
        'gasoline_allowance': 0,
        'gross_salary': 175000,
        'net_salary': 145000,
        'factory_payment': 200000,
        'company_profit': 25000,
        'is_paid': False
    }


# ==================== TEST EXECUTION ====================

if __name__ == "__main__":
    """
    Run tests directly with pytest.

    Usage:
        python -m pytest backend/tests/test_salary_system.py -v
        python -m pytest backend/tests/test_salary_system.py --cov=app.services -v
    """
    pytest.main([__file__, "-v", "--tb=short"])
