"""
Comprehensive Test Suite for Apartment Services
================================================

Tests for all apartment-related services:
1. ApartmentService (15 tests)
2. AdditionalChargeService (12 tests)
3. DeductionService (10 tests)
4. ReportService (5 tests)
5. ReportEndpoints (4 tests)

Total: 46+ tests covering service layer business logic and API endpoints

Author: UNS-ClaudeJP System
"""

import pytest
from datetime import date, datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.services.apartment_service import ApartmentService
from app.services.additional_charge_service import AdditionalChargeService
from app.services.deduction_service import DeductionService
from app.models.models import (
    Apartment,
    ApartmentAssignment,
    Employee,
    User,
    AdditionalCharge,
    RentDeduction,
    AssignmentStatus,
    DeductionStatus,
    ApartmentStatus,
)
from app.schemas.apartment_v2 import (
    ApartmentCreate,
    ApartmentUpdate,
    ProratedCalculationRequest,
    AdditionalChargeCreate,
    AdditionalChargeUpdate,
    DeductionStatusUpdate,
)


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def db_session(client):
    """Get database session for tests."""
    from app.core.database import SessionLocal
    db = SessionLocal()
    yield db
    # Cleanup
    db.query(RentDeduction).delete()
    db.query(AdditionalCharge).delete()
    db.query(ApartmentAssignment).delete()
    db.query(Apartment).delete()
    db.query(Employee).delete()
    db.query(User).delete()
    db.commit()
    db.close()


@pytest.fixture
def admin_user(db_session):
    """Create admin user for tests."""
    from app.services.auth_service import auth_service

    user = User(
        username="admin_test",
        email="admin@test.com",
        password_hash=auth_service.get_password_hash("password123"),
        full_name="Admin Test",
        role="ADMIN",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sample_apartment(db_session, admin_user):
    """Create a sample apartment for testing."""
    apartment = Apartment(
        name="テスト社宅 A-301",
        building_name="テストビル",
        room_number="A-301",
        floor_number=3,
        postal_code="100-0001",
        prefecture="東京都",
        city="千代田区",
        address_line1="千代田1-1-1",
        room_type="1K",
        size_sqm=Decimal("25.5"),
        base_rent=50000,
        management_fee=5000,
        deposit=100000,
        key_money=50000,
        default_cleaning_fee=20000,
        status=ApartmentStatus.ACTIVE,
        created_at=datetime.now()
    )
    db_session.add(apartment)
    db_session.commit()
    db_session.refresh(apartment)
    return apartment


@pytest.fixture
def second_apartment(db_session, admin_user):
    """Create second apartment for testing."""
    apartment = Apartment(
        name="テスト社宅 B-201",
        building_name="テストビル2",
        room_number="B-201",
        floor_number=2,
        postal_code="100-0002",
        prefecture="東京都",
        city="千代田区",
        address_line1="千代田2-2-2",
        room_type="1DK",
        size_sqm=Decimal("30.0"),
        base_rent=60000,
        management_fee=6000,
        default_cleaning_fee=25000,
        status=ApartmentStatus.ACTIVE,
        created_at=datetime.now()
    )
    db_session.add(apartment)
    db_session.commit()
    db_session.refresh(apartment)
    return apartment


@pytest.fixture
def sample_employee(db_session):
    """Create a sample employee for testing."""
    employee = Employee(
        hakenmoto_id=10001,
        full_name_kanji="山田太郎",
        full_name_kana="やまだたろう",
        date_of_birth=date(1990, 1, 15),
        gender="male",
        email="yamada@test.com",
        phone="09012345678",
        current_status="active",
        is_active=True
    )
    db_session.add(employee)
    db_session.commit()
    db_session.refresh(employee)
    return employee


@pytest.fixture
def second_employee(db_session):
    """Create second employee for testing."""
    employee = Employee(
        hakenmoto_id=10002,
        full_name_kanji="田中花子",
        full_name_kana="たなかはなこ",
        date_of_birth=date(1995, 5, 20),
        gender="female",
        email="tanaka@test.com",
        phone="09087654321",
        current_status="active",
        is_active=True
    )
    db_session.add(employee)
    db_session.commit()
    db_session.refresh(employee)
    return employee


@pytest.fixture
def active_assignment(db_session, sample_apartment, sample_employee, admin_user):
    """Create an active assignment for testing."""
    assignment = ApartmentAssignment(
        apartment_id=sample_apartment.id,
        employee_id=sample_employee.id,
        start_date=date(2025, 11, 1),
        end_date=None,
        monthly_rent=50000,
        days_in_month=30,
        days_occupied=30,
        prorated_rent=50000,
        is_prorated=False,
        total_deduction=50000,
        status=AssignmentStatus.ACTIVE,
        created_by=admin_user.id,
        created_at=datetime.now()
    )
    db_session.add(assignment)
    db_session.commit()
    db_session.refresh(assignment)
    return assignment


# =============================================================================
# 1. APARTMENT SERVICE TESTS (15 tests)
# =============================================================================

class TestApartmentService:
    """Tests for ApartmentService business logic."""

    @pytest.mark.asyncio
    async def test_create_apartment_success(self, db_session, admin_user):
        """Test successful apartment creation."""
        service = ApartmentService(db_session)

        apartment_data = ApartmentCreate(
            name="新規社宅 C-101",
            building_name="新規ビル",
            room_number="C-101",
            floor_number=1,
            postal_code="100-0003",
            prefecture="東京都",
            city="千代田区",
            address_line1="千代田3-3-3",
            room_type="1LDK",
            size_sqm=35.5,
            base_rent=70000,
            management_fee=7000,
            deposit=140000,
            key_money=70000,
            default_cleaning_fee=25000,
            status="active"
        )

        result = await service.create_apartment(apartment_data, admin_user.id)

        assert result is not None
        assert result.name == "新規社宅 C-101"
        assert result.base_rent == 70000
        assert result.status == "active"

    @pytest.mark.asyncio
    async def test_create_apartment_duplicate_name(self, db_session, sample_apartment, admin_user):
        """Test apartment creation fails with duplicate name."""
        service = ApartmentService(db_session)

        apartment_data = ApartmentCreate(
            name=sample_apartment.name,  # Duplicate
            base_rent=50000,
            status="active"
        )

        with pytest.raises(HTTPException) as exc_info:
            await service.create_apartment(apartment_data, admin_user.id)

        assert exc_info.value.status_code == 400
        assert "Ya existe un apartamento" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_list_apartments_no_filters(self, db_session, sample_apartment, second_apartment):
        """Test listing all apartments without filters."""
        service = ApartmentService(db_session)

        results = await service.list_apartments(skip=0, limit=100)

        assert len(results) >= 2
        assert any(a.id == sample_apartment.id for a in results)
        assert any(a.id == second_apartment.id for a in results)

    @pytest.mark.asyncio
    async def test_list_apartments_with_prefecture_filter(self, db_session, sample_apartment):
        """Test listing apartments filtered by prefecture."""
        service = ApartmentService(db_session)

        results = await service.list_apartments(
            prefecture="東京都",
            skip=0,
            limit=100
        )

        assert len(results) > 0
        assert all(a.prefecture == "東京都" for a in results)

    @pytest.mark.asyncio
    async def test_list_apartments_with_rent_range(self, db_session, sample_apartment):
        """Test listing apartments with rent range filter."""
        service = ApartmentService(db_session)

        results = await service.list_apartments(
            min_rent=40000,
            max_rent=55000,
            skip=0,
            limit=100
        )

        assert len(results) > 0
        assert all(40000 <= a.base_rent <= 55000 for a in results)

    @pytest.mark.asyncio
    async def test_list_apartments_with_search(self, db_session, sample_apartment):
        """Test listing apartments with search query."""
        service = ApartmentService(db_session)

        results = await service.list_apartments(
            search="テスト社宅",
            skip=0,
            limit=100
        )

        assert len(results) > 0
        assert any("テスト社宅" in a.name for a in results)

    @pytest.mark.asyncio
    async def test_get_apartment_with_stats_success(self, db_session, sample_apartment):
        """Test getting apartment with statistics."""
        service = ApartmentService(db_session)

        result = await service.get_apartment_with_stats(sample_apartment.id)

        assert result is not None
        assert result.id == sample_apartment.id
        assert result.name == sample_apartment.name
        assert hasattr(result, 'current_occupancy')
        assert hasattr(result, 'occupancy_rate')

    @pytest.mark.asyncio
    async def test_get_apartment_not_found(self, db_session):
        """Test getting non-existent apartment raises 404."""
        service = ApartmentService(db_session)

        with pytest.raises(HTTPException) as exc_info:
            await service.get_apartment_with_stats(999999)

        assert exc_info.value.status_code == 404
        assert "no encontrado" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_update_apartment_success(self, db_session, sample_apartment, admin_user):
        """Test successful apartment update."""
        service = ApartmentService(db_session)

        update_data = ApartmentUpdate(
            name="Updated Apartment Name",
            base_rent=55000
        )

        result = await service.update_apartment(
            sample_apartment.id,
            update_data,
            admin_user.id
        )

        assert result.name == "Updated Apartment Name"
        assert result.base_rent == 55000

    @pytest.mark.asyncio
    async def test_update_apartment_partial(self, db_session, sample_apartment, admin_user):
        """Test partial apartment update."""
        service = ApartmentService(db_session)

        update_data = ApartmentUpdate(
            default_cleaning_fee=30000
        )

        result = await service.update_apartment(
            sample_apartment.id,
            update_data,
            admin_user.id
        )

        assert result.default_cleaning_fee == 30000
        assert result.name == sample_apartment.name  # Unchanged

    @pytest.mark.asyncio
    async def test_delete_apartment_success(self, db_session, admin_user):
        """Test successful apartment deletion (no active assignments)."""
        service = ApartmentService(db_session)

        # Create apartment without assignments
        apartment = Apartment(
            name="Delete Test Apt",
            base_rent=50000,
            status=ApartmentStatus.ACTIVE,
            created_at=datetime.now()
        )
        db_session.add(apartment)
        db_session.commit()
        db_session.refresh(apartment)

        # Delete should succeed
        await service.delete_apartment(apartment.id, admin_user.id)

        # Verify soft delete
        deleted_apt = db_session.query(Apartment).filter(
            Apartment.id == apartment.id
        ).first()
        assert deleted_apt.deleted_at is not None

    @pytest.mark.asyncio
    async def test_delete_apartment_with_active_assignment_fails(
        self, db_session, sample_apartment, active_assignment, admin_user
    ):
        """Test apartment deletion fails with active assignments."""
        service = ApartmentService(db_session)

        with pytest.raises(HTTPException) as exc_info:
            await service.delete_apartment(sample_apartment.id, admin_user.id)

        assert exc_info.value.status_code == 400
        assert "asignación" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_calculate_prorated_rent_full_month(self, db_session):
        """Test prorated rent calculation for full month."""
        service = ApartmentService(db_session)

        calc_request = ProratedCalculationRequest(
            monthly_rent=50000,
            start_date=date(2025, 11, 1),
            end_date=date(2025, 11, 30),
            year=2025,
            month=11
        )

        result = await service.calculate_prorated_rent(calc_request)

        assert result.monthly_rent == 50000
        assert result.days_in_month == 30
        assert result.days_occupied == 30
        assert result.prorated_rent == 50000
        assert result.is_prorated is False

    @pytest.mark.asyncio
    async def test_calculate_prorated_rent_partial_month(self, db_session):
        """Test prorated rent calculation for partial month."""
        service = ApartmentService(db_session)

        # Move in on Nov 16 (15 days left in month)
        calc_request = ProratedCalculationRequest(
            monthly_rent=50000,
            start_date=date(2025, 11, 16),
            end_date=date(2025, 11, 30),
            year=2025,
            month=11
        )

        result = await service.calculate_prorated_rent(calc_request)

        assert result.days_in_month == 30
        assert result.days_occupied == 15
        assert result.is_prorated is True
        assert 24000 <= result.prorated_rent <= 26000  # Approximately half

    @pytest.mark.asyncio
    async def test_get_cleaning_fee_default(self, db_session, sample_apartment):
        """Test getting default cleaning fee."""
        service = ApartmentService(db_session)

        result = await service.get_cleaning_fee(sample_apartment.id)

        assert result.apartment_id == sample_apartment.id
        assert result.default_amount == sample_apartment.default_cleaning_fee
        assert result.final_amount == sample_apartment.default_cleaning_fee
        assert result.is_custom is False

    @pytest.mark.asyncio
    async def test_get_cleaning_fee_custom(self, db_session, sample_apartment):
        """Test getting custom cleaning fee."""
        service = ApartmentService(db_session)

        result = await service.get_cleaning_fee(
            sample_apartment.id,
            custom_amount=30000
        )

        assert result.default_amount == sample_apartment.default_cleaning_fee
        assert result.custom_amount == 30000
        assert result.final_amount == 30000
        assert result.is_custom is True


# =============================================================================
# 2. ADDITIONAL CHARGE SERVICE TESTS (12 tests)
# =============================================================================

class TestAdditionalChargeService:
    """Tests for AdditionalChargeService business logic."""

    @pytest.mark.asyncio
    async def test_create_charge_success(
        self, db_session, active_assignment, sample_apartment, sample_employee, admin_user
    ):
        """Test successful charge creation."""
        service = AdditionalChargeService(db_session)

        charge_data = AdditionalChargeCreate(
            assignment_id=active_assignment.id,
            employee_id=sample_employee.id,
            apartment_id=sample_apartment.id,
            charge_type="cleaning",
            description="Limpieza al salir",
            amount=20000,
            charge_date=date.today()
        )

        result = await service.create_additional_charge(charge_data, admin_user.id)

        assert result is not None
        assert result.charge_type == "cleaning"
        assert result.amount == 20000
        assert result.status == DeductionStatus.PENDING

    @pytest.mark.asyncio
    async def test_create_charge_invalid_assignment(
        self, db_session, sample_apartment, sample_employee, admin_user
    ):
        """Test charge creation fails with invalid assignment."""
        service = AdditionalChargeService(db_session)

        charge_data = AdditionalChargeCreate(
            assignment_id=999999,  # Non-existent
            employee_id=sample_employee.id,
            apartment_id=sample_apartment.id,
            charge_type="cleaning",
            amount=20000,
            charge_date=date.today()
        )

        with pytest.raises(HTTPException) as exc_info:
            await service.create_additional_charge(charge_data, admin_user.id)

        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_create_charge_different_types(
        self, db_session, active_assignment, sample_apartment, sample_employee, admin_user
    ):
        """Test creating charges with different types."""
        service = AdditionalChargeService(db_session)

        charge_types = ["cleaning", "repair", "damage", "other"]

        for charge_type in charge_types:
            charge_data = AdditionalChargeCreate(
                assignment_id=active_assignment.id,
                employee_id=sample_employee.id,
                apartment_id=sample_apartment.id,
                charge_type=charge_type,
                description=f"Test {charge_type}",
                amount=10000,
                charge_date=date.today()
            )

            result = await service.create_additional_charge(charge_data, admin_user.id)
            assert result.charge_type == charge_type

    @pytest.mark.asyncio
    async def test_list_charges_no_filters(self, db_session, active_assignment, admin_user):
        """Test listing all charges without filters."""
        service = AdditionalChargeService(db_session)

        # Create test charge
        charge = AdditionalCharge(
            assignment_id=active_assignment.id,
            employee_id=active_assignment.employee_id,
            apartment_id=active_assignment.apartment_id,
            charge_type="cleaning",
            description="Test",
            amount=20000,
            charge_date=date.today(),
            status=DeductionStatus.PENDING,
            created_at=datetime.now()
        )
        db_session.add(charge)
        db_session.commit()

        results = await service.list_additional_charges()

        assert len(results) > 0

    @pytest.mark.asyncio
    async def test_list_charges_with_assignment_filter(
        self, db_session, active_assignment, admin_user
    ):
        """Test listing charges filtered by assignment."""
        service = AdditionalChargeService(db_session)

        # Create test charge
        charge = AdditionalCharge(
            assignment_id=active_assignment.id,
            employee_id=active_assignment.employee_id,
            apartment_id=active_assignment.apartment_id,
            charge_type="cleaning",
            amount=20000,
            charge_date=date.today(),
            status=DeductionStatus.PENDING,
            created_at=datetime.now()
        )
        db_session.add(charge)
        db_session.commit()

        results = await service.list_additional_charges(
            assignment_id=active_assignment.id
        )

        assert len(results) > 0
        assert all(c.assignment_id == active_assignment.id for c in results)

    @pytest.mark.asyncio
    async def test_list_charges_with_status_filter(self, db_session, active_assignment):
        """Test listing charges filtered by status."""
        service = AdditionalChargeService(db_session)

        # Create charges with different statuses
        charge_pending = AdditionalCharge(
            assignment_id=active_assignment.id,
            employee_id=active_assignment.employee_id,
            apartment_id=active_assignment.apartment_id,
            charge_type="cleaning",
            amount=20000,
            charge_date=date.today(),
            status=DeductionStatus.PENDING,
            created_at=datetime.now()
        )
        db_session.add(charge_pending)
        db_session.commit()

        results = await service.list_additional_charges(
            status=DeductionStatus.PENDING
        )

        assert len(results) > 0
        assert all(c.status == DeductionStatus.PENDING for c in results)

    @pytest.mark.asyncio
    async def test_get_charge_success(self, db_session, active_assignment):
        """Test getting charge by ID."""
        service = AdditionalChargeService(db_session)

        # Create test charge
        charge = AdditionalCharge(
            assignment_id=active_assignment.id,
            employee_id=active_assignment.employee_id,
            apartment_id=active_assignment.apartment_id,
            charge_type="cleaning",
            amount=20000,
            charge_date=date.today(),
            status=DeductionStatus.PENDING,
            created_at=datetime.now()
        )
        db_session.add(charge)
        db_session.commit()
        db_session.refresh(charge)

        result = await service.get_additional_charge(charge.id)

        assert result.id == charge.id
        assert result.amount == 20000

    @pytest.mark.asyncio
    async def test_get_charge_not_found(self, db_session):
        """Test getting non-existent charge raises 404."""
        service = AdditionalChargeService(db_session)

        with pytest.raises(HTTPException) as exc_info:
            await service.get_additional_charge(999999)

        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_approve_charge_success(self, db_session, active_assignment, admin_user):
        """Test approving a charge."""
        service = AdditionalChargeService(db_session)

        # Create pending charge
        charge = AdditionalCharge(
            assignment_id=active_assignment.id,
            employee_id=active_assignment.employee_id,
            apartment_id=active_assignment.apartment_id,
            charge_type="cleaning",
            amount=20000,
            charge_date=date.today(),
            status=DeductionStatus.PENDING,
            created_at=datetime.now()
        )
        db_session.add(charge)
        db_session.commit()
        db_session.refresh(charge)

        update_data = AdditionalChargeUpdate(
            notes="Aprobado - daño verificado"
        )

        result = await service.approve_additional_charge(
            charge.id,
            update_data,
            admin_user
        )

        assert result.approved_by == admin_user.id
        assert result.approved_at is not None

    @pytest.mark.asyncio
    async def test_cancel_charge_success(self, db_session, active_assignment, admin_user):
        """Test canceling a charge."""
        service = AdditionalChargeService(db_session)

        # Create pending charge
        charge = AdditionalCharge(
            assignment_id=active_assignment.id,
            employee_id=active_assignment.employee_id,
            apartment_id=active_assignment.apartment_id,
            charge_type="repair",
            amount=15000,
            charge_date=date.today(),
            status=DeductionStatus.PENDING,
            created_at=datetime.now()
        )
        db_session.add(charge)
        db_session.commit()
        db_session.refresh(charge)

        update_data = AdditionalChargeUpdate(
            notes="Cancelado - no requerido"
        )

        result = await service.cancel_additional_charge(
            charge.id,
            update_data,
            admin_user.id
        )

        assert result.status == DeductionStatus.CANCELLED
        assert result.notes == "Cancelado - no requerido"

    @pytest.mark.asyncio
    async def test_delete_charge_pending_only(self, db_session, active_assignment, admin_user):
        """Test deleting charge only works for pending charges."""
        service = AdditionalChargeService(db_session)

        # Create pending charge
        charge = AdditionalCharge(
            assignment_id=active_assignment.id,
            employee_id=active_assignment.employee_id,
            apartment_id=active_assignment.apartment_id,
            charge_type="other",
            amount=5000,
            charge_date=date.today(),
            status=DeductionStatus.PENDING,
            created_at=datetime.now()
        )
        db_session.add(charge)
        db_session.commit()
        charge_id = charge.id

        # Delete should succeed
        await service.delete_additional_charge(charge_id, admin_user.id)

        # Verify soft delete
        deleted_charge = db_session.query(AdditionalCharge).filter(
            AdditionalCharge.id == charge_id
        ).first()
        assert deleted_charge.deleted_at is not None

    @pytest.mark.asyncio
    async def test_delete_approved_charge_fails(self, db_session, active_assignment, admin_user):
        """Test deleting approved charge fails."""
        service = AdditionalChargeService(db_session)

        # Create approved charge
        charge = AdditionalCharge(
            assignment_id=active_assignment.id,
            employee_id=active_assignment.employee_id,
            apartment_id=active_assignment.apartment_id,
            charge_type="cleaning",
            amount=20000,
            charge_date=date.today(),
            status="approved",  # Already approved
            created_at=datetime.now()
        )
        db_session.add(charge)
        db_session.commit()
        db_session.refresh(charge)

        with pytest.raises(HTTPException) as exc_info:
            await service.delete_additional_charge(charge.id, admin_user.id)

        assert exc_info.value.status_code == 400


# =============================================================================
# 3. DEDUCTION SERVICE TESTS (10 tests)
# =============================================================================

class TestDeductionService:
    """Tests for DeductionService business logic."""

    @pytest.mark.asyncio
    async def test_get_monthly_deductions_empty(self, db_session):
        """Test getting deductions for empty month."""
        service = DeductionService(db_session)

        results = await service.get_monthly_deductions(2025, 11)

        assert isinstance(results, list)
        assert len(results) == 0

    @pytest.mark.asyncio
    async def test_get_monthly_deductions_invalid_month(self, db_session):
        """Test getting deductions with invalid month."""
        service = DeductionService(db_session)

        with pytest.raises(HTTPException) as exc_info:
            await service.get_monthly_deductions(2025, 13)  # Invalid month

        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_get_monthly_deductions_invalid_year(self, db_session):
        """Test getting deductions with invalid year."""
        service = DeductionService(db_session)

        with pytest.raises(HTTPException) as exc_info:
            await service.get_monthly_deductions(2050, 11)  # Out of range

        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_generate_monthly_deductions_success(
        self, db_session, active_assignment, admin_user
    ):
        """Test successful monthly deduction generation."""
        service = DeductionService(db_session)

        results = await service.generate_monthly_deductions(2025, 11, admin_user.id)

        assert len(results) > 0
        assert all(d.year == 2025 for d in results)
        assert all(d.month == 11 for d in results)
        assert all(d.status == DeductionStatus.PENDING for d in results)

    @pytest.mark.asyncio
    async def test_generate_monthly_deductions_duplicate_fails(
        self, db_session, active_assignment, admin_user
    ):
        """Test generating deductions twice for same month fails."""
        service = DeductionService(db_session)

        # First generation should succeed
        await service.generate_monthly_deductions(2025, 11, admin_user.id)

        # Second generation should fail
        with pytest.raises(HTTPException) as exc_info:
            await service.generate_monthly_deductions(2025, 11, admin_user.id)

        assert exc_info.value.status_code == 409

    @pytest.mark.asyncio
    async def test_generate_deductions_includes_additional_charges(
        self, db_session, active_assignment, admin_user
    ):
        """Test deduction generation includes approved charges."""
        service = DeductionService(db_session)

        # Create approved charge
        charge = AdditionalCharge(
            assignment_id=active_assignment.id,
            employee_id=active_assignment.employee_id,
            apartment_id=active_assignment.apartment_id,
            charge_type="cleaning",
            amount=20000,
            charge_date=date(2025, 11, 15),
            status="approved",
            created_at=datetime.now()
        )
        db_session.add(charge)
        db_session.commit()

        # Generate deductions
        results = await service.generate_monthly_deductions(2025, 11, admin_user.id)

        assert len(results) > 0
        # Should have base rent + cleaning charge
        assert any(d.additional_charges == 20000 for d in results)

    @pytest.mark.asyncio
    async def test_get_deduction_success(self, db_session, active_assignment):
        """Test getting deduction by ID."""
        service = DeductionService(db_session)

        # Create test deduction
        deduction = RentDeduction(
            assignment_id=active_assignment.id,
            employee_id=active_assignment.employee_id,
            apartment_id=active_assignment.apartment_id,
            year=2025,
            month=11,
            base_rent=50000,
            additional_charges=0,
            total_deduction=50000,
            status=DeductionStatus.PENDING,
            created_at=datetime.now()
        )
        db_session.add(deduction)
        db_session.commit()
        db_session.refresh(deduction)

        result = await service.get_deduction(deduction.id)

        assert result.id == deduction.id
        assert result.total_deduction == 50000

    @pytest.mark.asyncio
    async def test_get_deduction_not_found(self, db_session):
        """Test getting non-existent deduction raises 404."""
        service = DeductionService(db_session)

        with pytest.raises(HTTPException) as exc_info:
            await service.get_deduction(999999)

        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_update_deduction_status_pending_to_processed(
        self, db_session, active_assignment, admin_user
    ):
        """Test updating deduction status from pending to processed."""
        service = DeductionService(db_session)

        # Create pending deduction
        deduction = RentDeduction(
            assignment_id=active_assignment.id,
            employee_id=active_assignment.employee_id,
            apartment_id=active_assignment.apartment_id,
            year=2025,
            month=11,
            base_rent=50000,
            additional_charges=0,
            total_deduction=50000,
            status=DeductionStatus.PENDING,
            created_at=datetime.now()
        )
        db_session.add(deduction)
        db_session.commit()
        db_session.refresh(deduction)

        update_data = DeductionStatusUpdate(
            new_status=DeductionStatus.PROCESSED,
            notes="Procesado correctamente"
        )

        result = await service.update_deduction_status(
            deduction.id,
            update_data,
            admin_user
        )

        assert result.status == DeductionStatus.PROCESSED
        assert result.processed_date is not None

    @pytest.mark.asyncio
    async def test_update_deduction_status_processed_to_paid(
        self, db_session, active_assignment, admin_user
    ):
        """Test updating deduction status from processed to paid."""
        service = DeductionService(db_session)

        # Create processed deduction
        deduction = RentDeduction(
            assignment_id=active_assignment.id,
            employee_id=active_assignment.employee_id,
            apartment_id=active_assignment.apartment_id,
            year=2025,
            month=11,
            base_rent=50000,
            additional_charges=0,
            total_deduction=50000,
            status=DeductionStatus.PROCESSED,
            processed_date=date.today(),
            created_at=datetime.now()
        )
        db_session.add(deduction)
        db_session.commit()
        db_session.refresh(deduction)

        update_data = DeductionStatusUpdate(
            new_status=DeductionStatus.PAID,
            notes="Pago confirmado"
        )

        result = await service.update_deduction_status(
            deduction.id,
            update_data,
            admin_user
        )

        assert result.status == DeductionStatus.PAID
        assert result.paid_date is not None


# =============================================================================
# 4. REPORT SERVICE TESTS (5 tests)
# =============================================================================

class TestReportService:
    """Tests para ReportService business logic."""

    def test_get_occupancy_report_complete(self, db_session, sample_apartment, second_apartment, active_assignment):
        """Test getting complete occupancy report."""
        from app.services.report_service import ReportService

        service = ReportService()
        report = service.get_occupancy_report()

        # Verificar estructura del reporte
        assert report is not None
        assert 'total_apartments' in report
        assert 'occupied_apartments' in report
        assert 'vacant_apartments' in report
        assert 'occupancy_rate' in report
        assert 'total_capacity' in report
        assert 'current_occupancy' in report

        # Verificar métricas básicas
        assert report['total_apartments'] >= 2  # Al menos sample_apartment y second_apartment
        assert report['occupied_apartments'] >= 1  # active_assignment
        assert report['occupancy_rate'] >= 0.0
        assert report['occupancy_rate'] <= 100.0

        # Verificar desgloses
        assert 'by_prefecture' in report
        assert isinstance(report['by_prefecture'], list)
        assert 'by_room_type' in report
        assert isinstance(report['by_room_type'], list)

    def test_get_occupancy_report_with_filters(self, db_session, sample_apartment):
        """Test occupancy report with prefecture filter."""
        from app.services.report_service import ReportService

        service = ReportService()
        report = service.get_occupancy_report(prefecture="東京都")

        assert report is not None
        assert report['total_apartments'] >= 1

        # Verificar que solo incluye apartamentos de Tokio
        if report['by_prefecture']:
            tokyo_data = [p for p in report['by_prefecture'] if p['prefecture'] == '東京都']
            assert len(tokyo_data) > 0

    def test_get_arrears_report(self, db_session, active_assignment, admin_user):
        """Test arrears report with deductions."""
        from app.services.report_service import ReportService
        from app.models.models import RentDeduction, DeductionStatus

        # Crear deducción PENDING
        deduction_pending = RentDeduction(
            assignment_id=active_assignment.id,
            employee_id=active_assignment.employee_id,
            apartment_id=active_assignment.apartment_id,
            year=2025,
            month=11,
            base_rent=50000,
            additional_charges=0,
            total_deduction=50000,
            status=DeductionStatus.PENDING,
            created_at=datetime.now()
        )
        db_session.add(deduction_pending)

        # Crear deducción PAID
        deduction_paid = RentDeduction(
            assignment_id=active_assignment.id,
            employee_id=active_assignment.employee_id,
            apartment_id=active_assignment.apartment_id,
            year=2025,
            month=11,
            base_rent=30000,
            additional_charges=0,
            total_deduction=30000,
            status=DeductionStatus.PAID,
            created_at=datetime.now()
        )
        db_session.add(deduction_paid)
        db_session.commit()

        service = ReportService()
        report = service.get_arrears_report(year=2025, month=11)

        # Verificar estructura
        assert report is not None
        assert 'total_to_collect' in report
        assert 'total_paid' in report
        assert 'total_pending' in report
        assert 'collection_rate' in report
        assert 'employees_with_debt' in report
        assert 'top_debtors' in report

        # Verificar cálculos
        assert report['total_to_collect'] == 80000  # 50000 + 30000
        assert report['total_paid'] == 30000
        assert report['total_pending'] == 50000
        assert report['collection_rate'] == 37.5  # (30000 / 80000) * 100

    def test_get_maintenance_report(self, db_session, active_assignment, admin_user):
        """Test maintenance report with different charge types."""
        from app.services.report_service import ReportService
        from app.models.models import AdditionalCharge, DeductionStatus

        # Crear 5 cargos de diferentes tipos
        charge_types = ["cleaning", "repair", "damage", "other", "cleaning"]
        amounts = [20000, 15000, 30000, 5000, 20000]

        for charge_type, amount in zip(charge_types, amounts):
            charge = AdditionalCharge(
                assignment_id=active_assignment.id,
                employee_id=active_assignment.employee_id,
                apartment_id=active_assignment.apartment_id,
                charge_type=charge_type,
                description=f"Test {charge_type}",
                amount=amount,
                charge_date=date.today(),
                status=DeductionStatus.PENDING,
                created_at=datetime.now()
            )
            db_session.add(charge)

        db_session.commit()

        service = ReportService()
        report = service.get_maintenance_report()

        # Verificar estructura
        assert report is not None
        assert 'total_charges' in report
        assert 'by_charge_type' in report
        assert 'monthly_trends' in report
        assert 'apartments_with_most_incidents' in report

        # Verificar conteo
        assert report['total_charges'] >= 5

        # Verificar agrupación por tipo
        assert isinstance(report['by_charge_type'], dict)
        assert 'cleaning' in report['by_charge_type']
        assert report['by_charge_type']['cleaning']['count'] == 2
        assert report['by_charge_type']['cleaning']['total_amount'] == 40000

    def test_get_cost_analysis_report(self, db_session, sample_apartment, active_assignment, admin_user):
        """Test cost analysis report."""
        from app.services.report_service import ReportService
        from app.models.models import RentDeduction, DeductionStatus

        # Crear deducciones para el análisis
        deduction = RentDeduction(
            assignment_id=active_assignment.id,
            employee_id=active_assignment.employee_id,
            apartment_id=active_assignment.apartment_id,
            year=2025,
            month=11,
            base_rent=50000,
            additional_charges=5000,
            total_deduction=55000,
            status=DeductionStatus.PAID,
            created_at=datetime.now()
        )
        db_session.add(deduction)
        db_session.commit()

        service = ReportService()
        report = service.get_cost_analysis_report(year=2025, month=11)

        # Verificar estructura
        assert report is not None
        assert 'total_costs' in report
        assert 'total_deductions' in report
        assert 'profit_margin' in report
        assert 'average_per_apartment' in report
        assert 'cost_trends' in report

        # Verificar que calcula deducciones correctamente
        assert report['total_deductions'] >= 55000

        # Verificar que profit_margin es un número
        assert isinstance(report['profit_margin'], (int, float))

        # Verificar cost_trends (últimos 6 meses)
        assert isinstance(report['cost_trends'], list)
        assert len(report['cost_trends']) == 6


# =============================================================================
# 5. REPORT ENDPOINTS TESTS (3 tests)
# =============================================================================

class TestReportEndpoints:
    """Tests para endpoints de reportes con autenticación."""

    @pytest.fixture
    def employee_user(self, db_session):
        """Create employee user for testing role restrictions."""
        from app.services.auth_service import auth_service

        user = User(
            username="employee_test",
            email="employee@test.com",
            password_hash=auth_service.get_password_hash("password123"),
            full_name="Employee Test",
            role="EMPLOYEE",
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    @pytest.fixture
    def admin_token(self, client, admin_user):
        """Get JWT token for admin user."""
        response = client.post(
            "/api/auth/login",
            json={
                "username": "admin_test",
                "password": "password123"
            }
        )
        assert response.status_code == 200
        return response.json()["access_token"]

    @pytest.fixture
    def employee_token(self, client, employee_user):
        """Get JWT token for employee user."""
        response = client.post(
            "/api/auth/login",
            json={
                "username": "employee_test",
                "password": "password123"
            }
        )
        assert response.status_code == 200
        return response.json()["access_token"]

    def test_get_occupancy_report_endpoint(self, client, admin_token, sample_apartment):
        """Test occupancy report endpoint with admin token."""
        response = client.get(
            '/api/apartments-v2/reports/occupancy',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        data = response.json()
        assert 'total_apartments' in data
        assert 'occupancy_rate' in data

    def test_arrears_endpoint_requires_admin(self, client, employee_token):
        """Test arrears endpoint requires ADMIN/COORDINATOR role."""
        response = client.get(
            '/api/apartments-v2/reports/arrears?year=2025&month=11',
            headers={'Authorization': f'Bearer {employee_token}'}
        )

        # Should return 403 Forbidden for EMPLOYEE role
        assert response.status_code == 403
        assert 'Access denied' in response.json()['detail']

    def test_maintenance_endpoint_requires_admin(self, client, employee_token):
        """Test maintenance endpoint requires ADMIN/COORDINATOR role."""
        response = client.get(
            '/api/apartments-v2/reports/maintenance',
            headers={'Authorization': f'Bearer {employee_token}'}
        )

        # Should return 403 Forbidden for EMPLOYEE role
        assert response.status_code == 403

    def test_endpoints_with_invalid_params(self, client, admin_token):
        """Test report endpoints with invalid parameters."""
        # Test arrears with invalid year
        response = client.get(
            '/api/apartments-v2/reports/arrears?year=2050&month=13',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 400

        # Test arrears with missing month
        response = client.get(
            '/api/apartments-v2/reports/arrears?year=2025',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 422  # Unprocessable Entity (missing required param)

        # Test maintenance with invalid period
        response = client.get(
            '/api/apartments-v2/reports/maintenance?period=invalid',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 400

        # Test maintenance with invalid charge_type
        response = client.get(
            '/api/apartments-v2/reports/maintenance?charge_type=invalid_type',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 400


# =============================================================================
# RUN TESTS
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
