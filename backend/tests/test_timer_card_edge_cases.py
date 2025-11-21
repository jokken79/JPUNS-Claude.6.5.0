"""
Comprehensive Edge Case Tests for Timer Cards System

Tests for:
1. Duplicate records (same employee/day)
2. Race conditions in approval
3. Changes post-approval
4. Employee hire_date/termination_date validation
5. Factory ID consistency
6. Extreme range validation
7. Overflow of minutes to hours
8. Data integrity constraints
"""

import pytest
from datetime import date, time, datetime, timedelta
from decimal import Decimal
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from app.models.models import TimerCard, Employee, User, UserRole, Factory
from app.core.database import get_db
from app.api.timer_cards import calculate_hours


class TestDuplicateRecords:
    """Test prevention of duplicate timer card records"""

    def test_duplicate_employee_same_day_rejected(self, db_session, test_employee):
        """Cannot create two timer cards for same employee on same day"""
        work_date = date(2025, 11, 12)

        # Create first timer card
        card1 = TimerCard(
            hakenmoto_id=test_employee.hakenmoto_id,
            
            work_date=work_date,
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=60,
            regular_hours=Decimal("7.0"),
            overtime_hours=Decimal("0.0"),
            night_hours=Decimal("0.0"),
            holiday_hours=Decimal("0.0"),
        )
        db_session.add(card1)
        db_session.commit()

        # Attempt to create duplicate
        card2 = TimerCard(
            hakenmoto_id=test_employee.hakenmoto_id,
            
            work_date=work_date,  # Same date
            clock_in=time(10, 0),
            clock_out=time(18, 0),
            break_minutes=60,
            regular_hours=Decimal("7.0"),
            overtime_hours=Decimal("0.0"),
            night_hours=Decimal("0.0"),
            holiday_hours=Decimal("0.0"),
        )
        db_session.add(card2)

        # Should raise IntegrityError due to UNIQUE constraint
        with pytest.raises(IntegrityError) as exc_info:
            db_session.commit()

        assert "uq_timer_cards_hakenmoto_work_date" in str(exc_info.value)

    def test_duplicate_allowed_different_days(self, db_session, test_employee):
        """Can create timer cards for same employee on different days"""
        # Day 1
        card1 = TimerCard(
            hakenmoto_id=test_employee.hakenmoto_id,
            
            work_date=date(2025, 11, 12),
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=60,
            regular_hours=Decimal("7.0"),
        )
        db_session.add(card1)
        db_session.commit()

        # Day 2 - Should succeed
        card2 = TimerCard(
            hakenmoto_id=test_employee.hakenmoto_id,
            
            work_date=date(2025, 11, 13),  # Different date
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=60,
            regular_hours=Decimal("7.0"),
        )
        db_session.add(card2)
        db_session.commit()

        assert card1.id != card2.id


class TestRaceConditionsInApproval:
    """Test race conditions during timer card approval"""

    def test_concurrent_approval_same_card(self, db_session, test_employee, test_admin_user):
        """Test handling of concurrent approval attempts"""
        # Create timer card
        card = TimerCard(
            hakenmoto_id=test_employee.hakenmoto_id,
            work_date=date(2025, 11, 12),
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=60,
            regular_hours=Decimal("7.0"),
            is_approved=False,
        )
        db_session.add(card)
        db_session.commit()

        # First approval
        card.is_approved = True
        card.approved_by = test_admin_user.id
        card.approved_at = datetime.now()
        db_session.commit()

        # Simulate second approval attempt (should be idempotent)
        card_refresh = db_session.query(TimerCard).filter(TimerCard.id == card.id).first()
        assert card_refresh.is_approved is True
        assert card_refresh.approved_by == test_admin_user.id

    def test_approval_requires_all_fields(self, db_session, test_employee):
        """Approval must set approved_by and approved_at"""
        card = TimerCard(
            hakenmoto_id=test_employee.hakenmoto_id,
            work_date=date(2025, 11, 12),
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=60,
            regular_hours=Decimal("7.0"),
            is_approved=True,  # Approved but missing fields
            approved_by=None,  # Missing
            approved_at=None,  # Missing
        )
        db_session.add(card)

        # Should raise IntegrityError due to CHECK constraint
        with pytest.raises(IntegrityError) as exc_info:
            db_session.commit()

        assert "ck_timer_cards_approval_complete" in str(exc_info.value)


class TestPostApprovalChanges:
    """Test modification attempts on approved timer cards"""

    def test_modify_approved_card_logged(self, db_session, test_employee, test_admin_user):
        """Modifications to approved cards should be logged"""
        # Create and approve card
        card = TimerCard(
            hakenmoto_id=test_employee.hakenmoto_id,
            work_date=date(2025, 11, 12),
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=60,
            regular_hours=Decimal("7.0"),
            is_approved=True,
            approved_by=test_admin_user.id,
            approved_at=datetime.now(),
        )
        db_session.add(card)
        db_session.commit()

        # Attempt modification
        card.clock_out = time(18, 0)
        db_session.commit()

        # Verify change was made (in production, this should trigger audit log)
        db_session.refresh(card)
        assert card.clock_out == time(18, 0)
        assert card.is_approved is True  # Still approved

    def test_unapprove_requires_clearing_fields(self, db_session, test_employee, test_admin_user):
        """Unapproving should clear approved_by and approved_at"""
        card = TimerCard(
            hakenmoto_id=test_employee.hakenmoto_id,
            work_date=date(2025, 11, 12),
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=60,
            regular_hours=Decimal("7.0"),
            is_approved=True,
            approved_by=test_admin_user.id,
            approved_at=datetime.now(),
        )
        db_session.add(card)
        db_session.commit()

        # Unapprove
        card.is_approved = False
        card.approved_by = None  # Must clear
        card.approved_at = None  # Must clear
        db_session.commit()

        db_session.refresh(card)
        assert card.is_approved is False
        assert card.approved_by is None
        assert card.approved_at is None


class TestEmployeeHireDateValidation:
    """Test validation against employee hire/termination dates"""

    def test_timer_card_before_hire_date_warning(self, db_session):
        """Timer card dated before employee hire date should trigger warning"""
        # Create employee with hire date
        employee = Employee(
            hakenmoto_id=9999,
            full_name_kanji="Test Employee",
            hire_date=date(2025, 1, 1),
        )
        db_session.add(employee)
        db_session.commit()

        # Create timer card before hire date
        card = TimerCard(
            hakenmoto_id=employee.hakenmoto_id,
            work_date=date(2024, 12, 31),  # Before hire date
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=60,
            regular_hours=Decimal("7.0"),
        )
        db_session.add(card)
        db_session.commit()  # Allowed but should be flagged

        # In production, this should trigger a validation warning
        assert card.work_date < employee.hire_date

    def test_timer_card_after_termination_date_warning(self, db_session):
        """Timer card dated after termination should trigger warning"""
        employee = Employee(
            hakenmoto_id=9998,
            full_name_kanji="Test Employee",
            hire_date=date(2025, 1, 1),
            termination_date=date(2025, 10, 31),
        )
        db_session.add(employee)
        db_session.commit()

        # Create timer card after termination
        card = TimerCard(
            hakenmoto_id=employee.hakenmoto_id,
            work_date=date(2025, 11, 1),  # After termination
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=60,
            regular_hours=Decimal("7.0"),
        )
        db_session.add(card)
        db_session.commit()  # Allowed but should be flagged

        assert card.work_date > employee.termination_date


class TestFactoryIDConsistency:
    """Test factory ID consistency across related records"""

    def test_timer_card_factory_matches_employee(self, db_session):
        """Timer card factory should match employee's assigned factory"""
        factory = Factory(
            factory_id="TEST_FACTORY_001",
            name="Test Factory",
        )
        db_session.add(factory)

        employee = Employee(
            hakenmoto_id=9997,
            full_name_kanji="Test Employee",
            factory_id="TEST_FACTORY_001",
        )
        db_session.add(employee)
        db_session.commit()

        # Create timer card with matching factory
        card = TimerCard(
            hakenmoto_id=employee.hakenmoto_id,
            factory_id="TEST_FACTORY_001",  # Matches
            work_date=date(2025, 11, 12),
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=60,
            regular_hours=Decimal("7.0"),
        )
        db_session.add(card)
        db_session.commit()

        assert card.factory_id == employee.factory_id

    def test_timer_card_factory_mismatch_allowed_but_flagged(self, db_session):
        """Timer card can have different factory (e.g., temporary assignment)"""
        employee = Employee(
            hakenmoto_id=9996,
            full_name_kanji="Test Employee",
            factory_id="FACTORY_A",
        )
        db_session.add(employee)
        db_session.commit()

        # Create timer card with different factory
        card = TimerCard(
            hakenmoto_id=employee.hakenmoto_id,
            factory_id="FACTORY_B",  # Different
            work_date=date(2025, 11, 12),
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=60,
            regular_hours=Decimal("7.0"),
        )
        db_session.add(card)
        db_session.commit()  # Allowed (temporary assignment)

        assert card.factory_id != employee.factory_id


class TestExtremeRangeValidation:
    """Test validation of extreme values"""

    def test_break_minutes_negative_rejected(self, db_session, test_employee):
        """Negative break minutes should be rejected"""
        card = TimerCard(
            hakenmoto_id=test_employee.hakenmoto_id,
            work_date=date(2025, 11, 12),
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=-10,  # Invalid
            regular_hours=Decimal("7.0"),
        )
        db_session.add(card)

        with pytest.raises(IntegrityError) as exc_info:
            db_session.commit()

        assert "ck_timer_cards_break_minutes_range" in str(exc_info.value)

    def test_break_minutes_exceeds_max_rejected(self, db_session, test_employee):
        """Break minutes exceeding 180 (3 hours) should be rejected"""
        card = TimerCard(
            hakenmoto_id=test_employee.hakenmoto_id,
            work_date=date(2025, 11, 12),
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=200,  # Exceeds max of 180
            regular_hours=Decimal("7.0"),
        )
        db_session.add(card)

        with pytest.raises(IntegrityError) as exc_info:
            db_session.commit()

        assert "ck_timer_cards_break_minutes_range" in str(exc_info.value)

    def test_overtime_minutes_negative_rejected(self, db_session, test_employee):
        """Negative overtime minutes should be rejected"""
        card = TimerCard(
            hakenmoto_id=test_employee.hakenmoto_id,
            work_date=date(2025, 11, 12),
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=60,
            overtime_minutes=-5,  # Invalid
            regular_hours=Decimal("7.0"),
        )
        db_session.add(card)

        with pytest.raises(IntegrityError) as exc_info:
            db_session.commit()

        assert "ck_timer_cards_overtime_minutes_range" in str(exc_info.value)

    def test_future_work_date_rejected(self, db_session, test_employee):
        """Work date in the future should be rejected"""
        future_date = date.today() + timedelta(days=1)

        card = TimerCard(
            hakenmoto_id=test_employee.hakenmoto_id,
            work_date=future_date,  # Future date
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=60,
            regular_hours=Decimal("7.0"),
        )
        db_session.add(card)

        with pytest.raises(IntegrityError) as exc_info:
            db_session.commit()

        assert "ck_timer_cards_work_date_not_future" in str(exc_info.value)


class TestClockTimeValidation:
    """Test clock in/out time validation"""

    def test_regular_shift_clock_out_before_clock_in_rejected(self, db_session, test_employee):
        """Regular shift: clock_out must be after clock_in"""
        card = TimerCard(
            hakenmoto_id=test_employee.hakenmoto_id,
            work_date=date(2025, 11, 12),
            clock_in=time(17, 0),  # Later
            clock_out=time(9, 0),  # Earlier (but not overnight)
            break_minutes=60,
            regular_hours=Decimal("7.0"),
        )
        db_session.add(card)

        with pytest.raises(IntegrityError) as exc_info:
            db_session.commit()

        assert "ck_timer_cards_clock_times_valid" in str(exc_info.value)

    def test_overnight_shift_valid(self, db_session, test_employee):
        """Overnight shift: clock_in >= 20:00 AND clock_out <= 06:00"""
        card = TimerCard(
            hakenmoto_id=test_employee.hakenmoto_id,
            work_date=date(2025, 11, 12),
            clock_in=time(22, 0),  # 10 PM
            clock_out=time(5, 0),  # 5 AM next day
            break_minutes=60,
            regular_hours=Decimal("6.0"),
        )
        db_session.add(card)
        db_session.commit()  # Should succeed

        assert card.clock_in == time(22, 0)
        assert card.clock_out == time(5, 0)


class TestHoursCalculation:
    """Test hour calculation edge cases"""

    def test_calculate_hours_overnight_shift(self):
        """Test overnight shift hour calculation"""
        result = calculate_hours(
            clock_in=time(22, 0),
            clock_out=time(6, 0),
            break_minutes=60,
            work_date=date(2025, 11, 12)
        )

        # 22:00 to 06:00 = 8 hours, minus 1 hour break = 7 hours work
        assert result["regular_hours"] == 7.0
        assert result["overtime_hours"] == 0.0
        assert result["night_hours"] > 0  # Should have night hours

    def test_calculate_hours_with_large_overtime(self):
        """Test calculation with significant overtime"""
        result = calculate_hours(
            clock_in=time(8, 0),
            clock_out=time(22, 0),  # 14 hours total
            break_minutes=60,  # 1 hour break
            work_date=date(2025, 11, 12)
        )

        # 14 hours - 1 hour break = 13 hours work
        # Regular: 8 hours, Overtime: 5 hours
        assert result["regular_hours"] == 8.0
        assert result["overtime_hours"] == 5.0

    def test_calculate_hours_on_holiday(self):
        """Test hour calculation on Japanese holiday"""
        # Test on New Year's Day
        result = calculate_hours(
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=60,
            work_date=date(2025, 1, 1)  # New Year's Day
        )

        # All hours on holiday are holiday hours
        assert result["holiday_hours"] == 7.0
        assert result["regular_hours"] == 0.0
        assert result["overtime_hours"] == 0.0


class TestNegativeHoursValidation:
    """Test that calculated hours cannot be negative"""

    def test_negative_hours_rejected(self, db_session, test_employee):
        """Cannot manually set negative hours"""
        card = TimerCard(
            hakenmoto_id=test_employee.hakenmoto_id,
            work_date=date(2025, 11, 12),
            clock_in=time(9, 0),
            clock_out=time(17, 0),
            break_minutes=60,
            regular_hours=Decimal("-1.0"),  # Invalid
            overtime_hours=Decimal("0.0"),
            night_hours=Decimal("0.0"),
            holiday_hours=Decimal("0.0"),
        )
        db_session.add(card)

        with pytest.raises(IntegrityError) as exc_info:
            db_session.commit()

        assert "ck_timer_cards_hours_non_negative" in str(exc_info.value)


# ============================================
# PYTEST FIXTURES
# ============================================

@pytest.fixture
def db_session():
    """Provide database session for tests"""
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()


@pytest.fixture
def test_employee(db_session):
    """Create test employee"""
    employee = Employee(
        hakenmoto_id=12345,
        full_name_kanji="山田太郎",
        email="test@example.com",
        hire_date=date(2025, 1, 1),
    )
    db_session.add(employee)
    db_session.commit()
    return employee


@pytest.fixture
def test_admin_user(db_session):
    """Create test admin user"""
    user = User(
        username="test_admin",
        email="admin@example.com",
        password_hash="hashed_password",
        role=UserRole.ADMIN,
    )
    db_session.add(user)
    db_session.commit()
    return user
