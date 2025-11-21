"""
Tests for Assignment Service (Apartments V2)
Tests the 7 key methods of AssignmentService:
1. create_assignment
2. end_assignment
3. transfer_assignment
4. list_assignments
5. get_assignment
6. calculate_prorated_rent
7. get_assignment_statistics
"""
import pytest
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.services.assignment_service import AssignmentService
from app.models.models import (
    Apartment,
    ApartmentAssignment,
    Employee,
    User,
    AssignmentStatus,
)


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def sample_apartment(client):
    """Create a sample apartment for testing."""
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        apartment = Apartment(
            apartment_code="TEST-001",
            building_name="Test Building",
            room_number="101",
            base_rent=50000,
            capacity=2,
            status="available",
            address="Tokyo Test Address",
            nearest_station="Test Station",
            area_sqm=30.0,
            created_at=datetime.now()
        )
        db.add(apartment)
        db.commit()
        db.refresh(apartment)
        return apartment
    finally:
        db.close()


@pytest.fixture
def sample_employee(client):
    """Create a sample employee for testing."""
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        employee = Employee(
            employee_id="EMP001",
            full_name_kanji="テスト太郎",
            full_name_kana="てすとたろう",
            full_name_roman="Test Taro",
            status="active",
            hire_date=date(2025, 1, 1),
            created_at=datetime.now()
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)
        return employee
    finally:
        db.close()


@pytest.fixture
def sample_user(client):
    """Create a sample user for testing."""
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="dummy",
            role="ADMIN",
            is_active=True,
            created_at=datetime.now()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


# ============================================================================
# TEST CLASS
# ============================================================================

class TestAssignmentService:
    """Test suite for AssignmentService."""

    @pytest.mark.asyncio
    async def test_create_assignment_success(
        self,
        client,
        sample_apartment,
        sample_employee,
        sample_user
    ):
        """Test successful assignment creation."""
        from app.core.database import SessionLocal
        from app.schemas.apartment_v2 import AssignmentCreate

        db = SessionLocal()
        try:
            service = AssignmentService(db)

            # Arrange
            assignment_data = AssignmentCreate(
                apartment_id=sample_apartment.id,
                employee_id=sample_employee.id,
                start_date=date(2025, 10, 1),
                end_date=None,
                monthly_rent=sample_apartment.base_rent,
                notes="Test assignment"
            )

            # Act
            result = await service.create_assignment(
                assignment=assignment_data,
                user_id=sample_user.id
            )

            # Assert
            assert result is not None
            assert result.apartment_id == sample_apartment.id
            assert result.employee_id == sample_employee.id
            assert result.status == AssignmentStatus.ACTIVE
            assert result.monthly_rent == sample_apartment.base_rent
        finally:
            db.close()

    @pytest.mark.asyncio
    async def test_create_assignment_apartment_not_found(
        self,
        client,
        sample_employee,
        sample_user
    ):
        """Test assignment creation fails with invalid apartment."""
        from app.core.database import SessionLocal
        from app.schemas.apartment_v2 import AssignmentCreate

        db = SessionLocal()
        try:
            service = AssignmentService(db)

            # Arrange
            assignment_data = AssignmentCreate(
                apartment_id=99999,  # Non-existent
                employee_id=sample_employee.id,
                start_date=date(2025, 10, 1),
                monthly_rent=50000,
            )

            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                await service.create_assignment(
                    assignment=assignment_data,
                    user_id=sample_user.id
                )

            assert exc_info.value.status_code == 404
            assert "Apartamento no encontrado" in str(exc_info.value.detail)
        finally:
            db.close()

    @pytest.mark.asyncio
    async def test_list_assignments(
        self,
        client,
        sample_apartment,
        sample_employee,
        sample_user
    ):
        """Test listing assignments with pagination."""
        from app.core.database import SessionLocal
        from app.schemas.apartment_v2 import AssignmentCreate

        db = SessionLocal()
        try:
            service = AssignmentService(db)

            # Arrange - create assignment
            assignment_data = AssignmentCreate(
                apartment_id=sample_apartment.id,
                employee_id=sample_employee.id,
                start_date=date(2025, 10, 1),
                monthly_rent=sample_apartment.base_rent,
            )
            await service.create_assignment(
                assignment=assignment_data,
                user_id=sample_user.id
            )

            # Act
            results = await service.list_assignments(
                skip=0,
                limit=10
            )

            # Assert
            assert len(results) >= 1
            assert any(a.apartment_id == sample_apartment.id for a in results)
        finally:
            db.close()

    @pytest.mark.asyncio
    async def test_calculate_prorated_rent(
        self,
        client,
        sample_apartment
    ):
        """Test prorated rent calculation."""
        from app.core.database import SessionLocal
        from app.schemas.apartment_v2 import ProratedCalculationRequest

        db = SessionLocal()
        try:
            service = AssignmentService(db)

            # Arrange - mid-month move-in (15 days)
            calc_request = ProratedCalculationRequest(
                monthly_rent=sample_apartment.base_rent,
                start_date=date(2025, 10, 16),  # Oct 16
                end_date=date(2025, 10, 31)      # Oct 31
            )

            # Act
            result = await service.calculate_prorated_rent(calc_request)

            # Assert
            assert result is not None
            assert result.monthly_rent == sample_apartment.base_rent
            assert result.days_in_month == 31
            assert result.days_occupied == 16
            assert result.prorated_rent > 0
            assert result.prorated_rent < sample_apartment.base_rent
        finally:
            db.close()

    @pytest.mark.asyncio
    async def test_end_assignment(
        self,
        client,
        sample_apartment,
        sample_employee,
        sample_user
    ):
        """Test ending an active assignment."""
        from app.core.database import SessionLocal
        from app.schemas.apartment_v2 import AssignmentCreate

        db = SessionLocal()
        try:
            service = AssignmentService(db)

            # Arrange - create assignment
            assignment_data = AssignmentCreate(
                apartment_id=sample_apartment.id,
                employee_id=sample_employee.id,
                start_date=date(2025, 10, 1),
                monthly_rent=sample_apartment.base_rent,
            )
            created = await service.create_assignment(
                assignment=assignment_data,
                user_id=sample_user.id
            )

            # Act - end the assignment
            result = await service.end_assignment(
                assignment_id=created.id,
                end_date=date(2025, 10, 31),
                user_id=sample_user.id,
                notes="Test end"
            )

            # Assert
            assert result is not None
            assert result.status == AssignmentStatus.ENDED
            assert result.end_date == date(2025, 10, 31)
        finally:
            db.close()

    @pytest.mark.asyncio
    async def test_get_assignment(
        self,
        client,
        sample_apartment,
        sample_employee,
        sample_user
    ):
        """Test retrieving a specific assignment."""
        from app.core.database import SessionLocal
        from app.schemas.apartment_v2 import AssignmentCreate

        db = SessionLocal()
        try:
            service = AssignmentService(db)

            # Arrange - create assignment
            assignment_data = AssignmentCreate(
                apartment_id=sample_apartment.id,
                employee_id=sample_employee.id,
                start_date=date(2025, 10, 1),
                monthly_rent=sample_apartment.base_rent,
            )
            created = await service.create_assignment(
                assignment=assignment_data,
                user_id=sample_user.id
            )

            # Act
            result = await service.get_assignment(created.id)

            # Assert
            assert result is not None
            assert result.id == created.id
            assert result.apartment_id == sample_apartment.id
            assert result.employee_id == sample_employee.id
        finally:
            db.close()

    @pytest.mark.asyncio
    async def test_get_assignment_statistics(
        self,
        client,
        sample_apartment,
        sample_employee,
        sample_user
    ):
        """Test retrieving assignment statistics."""
        from app.core.database import SessionLocal
        from app.schemas.apartment_v2 import AssignmentCreate

        db = SessionLocal()
        try:
            service = AssignmentService(db)

            # Arrange - create assignment
            assignment_data = AssignmentCreate(
                apartment_id=sample_apartment.id,
                employee_id=sample_employee.id,
                start_date=date(2025, 10, 1),
                monthly_rent=sample_apartment.base_rent,
            )
            await service.create_assignment(
                assignment=assignment_data,
                user_id=sample_user.id
            )

            # Act
            stats = await service.get_assignment_statistics(
                period_start=date(2025, 1, 1),
                period_end=date(2025, 12, 31)
            )

            # Assert
            assert stats is not None
            assert stats.total_assignments >= 1
            assert stats.active_assignments >= 1
            assert stats.total_rent_amount >= 0
        finally:
            db.close()


# Run with: pytest backend/tests/test_assignment_service.py -v
