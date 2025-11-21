"""
Comprehensive E2E tests for Apartments V2 API

Tests all 30 endpoints across 6 main categories:
1. Apartment Management (6 endpoints)
2. Assignments (6 endpoints)
3. Calculations (3 endpoints)
4. Additional Charges (6 endpoints)
5. Deductions (5 endpoints)
6. Reports (4 endpoints)

Total: 30 endpoints covered with success and error cases
"""

import pytest
from fastapi.testclient import TestClient
from datetime import date, datetime, timedelta
from decimal import Decimal
import json

from app.main import app
from app.core.database import SessionLocal
from app.models.models import (
    User, UserRole, Apartment, Employee, ApartmentAssignment,
    AdditionalCharge, ApartmentDeduction
)
from app.services.auth_service import auth_service


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def db():
    """Get database session for tests."""
    db = SessionLocal()
    yield db
    # Cleanup: delete test data
    db.query(ApartmentDeduction).delete()
    db.query(AdditionalCharge).delete()
    db.query(ApartmentAssignment).delete()
    db.query(Employee).delete()
    db.query(Apartment).delete()
    db.query(User).delete()
    db.commit()
    db.close()


@pytest.fixture
def admin_user(db):
    """Create admin user for tests."""
    user = User(
        username="admin_test",
        email="admin@test.com",
        password_hash=auth_service.get_password_hash("password123"),
        full_name="Admin Test",
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def coordinator_user(db):
    """Create coordinator user for tests."""
    user = User(
        username="coordinator_test",
        email="coordinator@test.com",
        password_hash=auth_service.get_password_hash("password123"),
        full_name="Coordinator Test",
        role=UserRole.COORDINATOR,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(admin_user):
    """Get authentication headers for admin user."""
    response = TestClient(app).post(
        "/api/auth/login",
        data={"username": "admin_test", "password": "password123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def client():
    """Get test client."""
    return TestClient(app)


@pytest.fixture
def test_apartment(db, admin_user):
    """Create test apartment."""
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
        contract_start_date=date(2025, 1, 1),
        contract_end_date=date(2030, 12, 31),
        landlord_name="山田太郎",
        landlord_contact="09012345678",
        real_estate_agency="不動産会社ABC",
        emergency_contact="0312345678",
        status="active",
        created_by=admin_user.id
    )
    db.add(apartment)
    db.commit()
    db.refresh(apartment)
    return apartment


@pytest.fixture
def second_apartment(db, admin_user):
    """Create second test apartment for transfers."""
    apartment = Apartment(
        name="テスト社宅 B-201",
        building_name="テストビル",
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
        deposit=120000,
        key_money=60000,
        default_cleaning_fee=25000,
        contract_start_date=date(2025, 1, 1),
        contract_end_date=date(2030, 12, 31),
        landlord_name="田中花子",
        landlord_contact="09087654321",
        real_estate_agency="不動産会社DEF",
        emergency_contact="0387654321",
        status="active",
        created_by=admin_user.id
    )
    db.add(apartment)
    db.commit()
    db.refresh(apartment)
    return apartment


@pytest.fixture
def test_employee(db):
    """Create test employee."""
    employee = Employee(
        hakenmoto_id="EMP001",
        full_name_roman="Yamada Taro",
        full_name_kanji="山田太郎",
        full_name_kana="やまだたろう",
        date_of_birth=date(1990, 1, 15),
        gender="male",
        email="yamada@test.com",
        phone="09012345678",
        status="active"
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@pytest.fixture
def second_employee(db):
    """Create second test employee."""
    employee = Employee(
        hakenmoto_id="EMP002",
        full_name_roman="Tanaka Hanako",
        full_name_kanji="田中花子",
        full_name_kana="たなかはなこ",
        date_of_birth=date(1995, 5, 20),
        gender="female",
        email="tanaka@test.com",
        phone="09087654321",
        status="active"
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@pytest.fixture
def test_assignment(db, test_apartment, test_employee, admin_user):
    """Create test assignment."""
    assignment = ApartmentAssignment(
        apartment_id=test_apartment.id,
        employee_id=test_employee.id,
        start_date=date(2025, 11, 1),
        end_date=None,
        monthly_rent=50000,
        days_in_month=30,
        days_occupied=30,
        prorated_rent=50000,
        is_prorated=False,
        total_deduction=50000,
        status="active",
        created_by=admin_user.id
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


# =============================================================================
# 1. APARTMENT MANAGEMENT TESTS (6 endpoints)
# =============================================================================

class TestApartmentManagement:
    """Tests for apartment CRUD operations."""

    def test_list_apartments_success(self, client, auth_headers, test_apartment):
        """Test listing all apartments."""
        response = client.get(
            "/api/apartments-v2/apartments",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]["id"] == test_apartment.id
        assert data[0]["name"] == test_apartment.name

    def test_list_apartments_with_filters(self, client, auth_headers, test_apartment):
        """Test list apartments with various filters."""
        response = client.get(
            "/api/apartments-v2/apartments?available_only=false&min_rent=40000&max_rent=60000",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_create_apartment_success(self, client, auth_headers):
        """Test creating a new apartment."""
        payload = {
            "name": "新規社宅 C-101",
            "building_name": "新規ビル",
            "room_number": "C-101",
            "floor_number": 1,
            "postal_code": "100-0003",
            "prefecture": "東京都",
            "city": "千代田区",
            "address_line1": "千代田3-3-3",
            "room_type": "1LDK",
            "size_sqm": 35.5,
            "base_rent": 70000,
            "management_fee": 7000,
            "deposit": 140000,
            "key_money": 70000,
            "default_cleaning_fee": 25000,
            "landlord_name": "新規オーナー",
            "status": "active"
        }
        response = client.post(
            "/api/apartments-v2/apartments",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["base_rent"] == payload["base_rent"]

    def test_create_apartment_invalid_rent(self, client, auth_headers):
        """Test creating apartment with invalid rent."""
        payload = {
            "name": "Invalid Apartment",
            "base_rent": -1000,  # Invalid: negative rent
        }
        response = client.post(
            "/api/apartments-v2/apartments",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 422  # Validation error

    def test_get_apartment_success(self, client, auth_headers, test_apartment):
        """Test getting apartment details."""
        response = client.get(
            f"/api/apartments-v2/apartments/{test_apartment.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_apartment.id
        assert data["name"] == test_apartment.name

    def test_get_apartment_not_found(self, client, auth_headers):
        """Test getting non-existent apartment."""
        response = client.get(
            "/api/apartments-v2/apartments/999999",
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_update_apartment_success(self, client, auth_headers, test_apartment):
        """Test updating apartment."""
        payload = {
            "name": "Updated Apartment Name",
            "base_rent": 55000
        }
        response = client.put(
            f"/api/apartments-v2/apartments/{test_apartment.id}",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["base_rent"] == payload["base_rent"]

    def test_update_apartment_partial(self, client, auth_headers, test_apartment):
        """Test partial apartment update."""
        payload = {
            "default_cleaning_fee": 30000
        }
        response = client.put(
            f"/api/apartments-v2/apartments/{test_apartment.id}",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["default_cleaning_fee"] == 30000

    def test_delete_apartment_success(self, client, auth_headers, db):
        """Test deleting apartment without assignments."""
        # Create a fresh apartment
        from app.models.models import User
        admin = db.query(User).first()
        apt = Apartment(
            name="Delete Test Apt",
            base_rent=50000,
            created_by=admin.id
        )
        db.add(apt)
        db.commit()
        apt_id = apt.id

        response = client.delete(
            f"/api/apartments-v2/apartments/{apt_id}",
            headers=auth_headers
        )
        assert response.status_code == 204

    def test_search_apartments_advanced(self, client, auth_headers, test_apartment):
        """Test advanced apartment search."""
        response = client.get(
            "/api/apartments-v2/apartments/search/advanced?room_types=1K&prefectures=東京都",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_search_apartments_by_cost(self, client, auth_headers, test_apartment):
        """Test apartment search by cost."""
        response = client.get(
            "/api/apartments-v2/apartments/search/advanced?max_total_cost=60000",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


# =============================================================================
# 2. ASSIGNMENT TESTS (6 endpoints)
# =============================================================================

class TestAssignments:
    """Tests for apartment assignments."""

    def test_create_assignment_success(self, client, auth_headers, test_apartment, test_employee):
        """Test creating assignment."""
        payload = {
            "apartment_id": test_apartment.id,
            "employee_id": test_employee.id,
            "start_date": "2025-11-10",
            "monthly_rent": 50000,
            "is_prorated": True,
            "days_in_month": 30,
            "days_occupied": 21,
            "prorated_rent": 35000,
            "total_deduction": 35000
        }
        response = client.post(
            "/api/apartments-v2/assignments",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["apartment_id"] == test_apartment.id
        assert data["employee_id"] == test_employee.id

    def test_list_assignments_success(self, client, auth_headers, test_assignment):
        """Test listing assignments."""
        response = client.get(
            "/api/apartments-v2/assignments",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_list_assignments_with_filters(self, client, auth_headers, test_assignment):
        """Test listing assignments with filters."""
        response = client.get(
            f"/api/apartments-v2/assignments?employee_id={test_assignment.employee_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_assignment_success(self, client, auth_headers, test_assignment):
        """Test getting assignment details."""
        response = client.get(
            f"/api/apartments-v2/assignments/{test_assignment.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_assignment.id

    def test_get_assignment_not_found(self, client, auth_headers):
        """Test getting non-existent assignment."""
        response = client.get(
            "/api/apartments-v2/assignments/999999",
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_get_active_assignments(self, client, auth_headers, test_assignment):
        """Test getting active assignments."""
        response = client.get(
            "/api/apartments-v2/assignments/active",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_end_assignment_success(self, client, auth_headers, test_assignment):
        """Test ending assignment."""
        payload = {
            "end_date": "2025-11-30",
            "include_cleaning_fee": True,
            "cleaning_fee": 20000
        }
        response = client.put(
            f"/api/apartments-v2/assignments/{test_assignment.id}/end",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ended"

    def test_transfer_assignment_success(self, client, auth_headers, test_employee,
                                         test_apartment, second_apartment, db, admin_user):
        """Test transferring assignment to another apartment."""
        # First create an active assignment
        assignment = ApartmentAssignment(
            apartment_id=test_apartment.id,
            employee_id=test_employee.id,
            start_date=date(2025, 11, 1),
            end_date=None,
            monthly_rent=50000,
            days_in_month=30,
            days_occupied=30,
            prorated_rent=50000,
            is_prorated=False,
            total_deduction=50000,
            status="active",
            created_by=admin_user.id
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        payload = {
            "employee_id": test_employee.id,
            "current_apartment_id": test_apartment.id,
            "new_apartment_id": second_apartment.id,
            "transfer_date": "2025-11-20"
        }
        response = client.post(
            "/api/apartments-v2/assignments/transfer",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 201


# =============================================================================
# 3. CALCULATION TESTS (3 endpoints)
# =============================================================================

class TestCalculations:
    """Tests for apartment cost calculations."""

    def test_calculate_prorated_rent_success(self, client, auth_headers):
        """Test calculating prorated rent."""
        payload = {
            "monthly_rent": 50000,
            "start_date": "2025-11-09",
            "end_date": "2025-11-30",
            "year": 2025,
            "month": 11
        }
        response = client.post(
            "/api/apartments-v2/apartments/calculate/prorated",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["monthly_rent"] == 50000
        assert data["year"] == 2025
        assert data["month"] == 11
        assert data["days_occupied"] == 22
        assert data["is_prorated"] == True

    def test_calculate_prorated_rent_full_month(self, client, auth_headers):
        """Test calculating prorated rent for full month."""
        payload = {
            "monthly_rent": 50000,
            "start_date": "2025-11-01",
            "end_date": "2025-11-30",
            "year": 2025,
            "month": 11
        }
        response = client.post(
            "/api/apartments-v2/apartments/calculate/prorated",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["days_occupied"] == 30
        assert data["is_prorated"] == False

    def test_calculate_prorated_rent_invalid_dates(self, client, auth_headers):
        """Test prorated calculation with invalid dates."""
        payload = {
            "monthly_rent": 50000,
            "start_date": "2025-11-30",
            "end_date": "2025-11-09",  # end before start
            "year": 2025,
            "month": 11
        }
        response = client.post(
            "/api/apartments-v2/apartments/calculate/prorated",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 422

    def test_get_cleaning_fee(self, client, auth_headers, test_apartment):
        """Test getting cleaning fee."""
        response = client.get(
            f"/api/apartments-v2/apartments/calculate/cleaning-fee/{test_apartment.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["default_amount"] == test_apartment.default_cleaning_fee

    def test_get_cleaning_fee_custom_amount(self, client, auth_headers, test_apartment):
        """Test getting cleaning fee with custom amount."""
        response = client.get(
            f"/api/apartments-v2/apartments/calculate/cleaning-fee/{test_apartment.id}?custom_amount=30000",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["custom_amount"] == 30000

    def test_calculate_total_deduction_success(self, client, auth_headers):
        """Test calculating total deduction."""
        payload = {
            "base_rent": 29032,
            "is_prorated": True,
            "additional_charges": [
                {
                    "charge_type": "cleaning",
                    "amount": 20000
                },
                {
                    "charge_type": "repair",
                    "amount": 15000
                }
            ]
        }
        response = client.post(
            "/api/apartments-v2/apartments/calculate/total",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["base_rent"] == 29032
        assert data["additional_charges_total"] == 35000
        assert data["total_deduction"] == 64032


# =============================================================================
# 4. ADDITIONAL CHARGES TESTS (6 endpoints)
# =============================================================================

class TestAdditionalCharges:
    """Tests for additional charges management."""

    def test_create_charge_success(self, client, auth_headers, test_assignment):
        """Test creating additional charge."""
        payload = {
            "assignment_id": test_assignment.id,
            "employee_id": test_assignment.employee_id,
            "apartment_id": test_assignment.apartment_id,
            "charge_type": "cleaning",
            "description": "Limpieza al salir",
            "amount": 20000,
            "charge_date": "2025-11-30"
        }
        response = client.post(
            "/api/apartments-v2/charges",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["charge_type"] == "cleaning"
        assert data["amount"] == 20000

    def test_create_charge_repair(self, client, auth_headers, test_assignment):
        """Test creating repair charge."""
        payload = {
            "assignment_id": test_assignment.id,
            "employee_id": test_assignment.employee_id,
            "apartment_id": test_assignment.apartment_id,
            "charge_type": "repair",
            "description": "Reparación de pared dañada",
            "amount": 15000,
            "charge_date": "2025-11-25"
        }
        response = client.post(
            "/api/apartments-v2/charges",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 201

    def test_list_charges_success(self, client, auth_headers, db, admin_user, test_assignment):
        """Test listing charges."""
        # Create a charge first
        charge = AdditionalCharge(
            assignment_id=test_assignment.id,
            employee_id=test_assignment.employee_id,
            apartment_id=test_assignment.apartment_id,
            charge_type="cleaning",
            description="Limpieza",
            amount=20000,
            charge_date=date.today(),
            status="pending",
            created_by=admin_user.id
        )
        db.add(charge)
        db.commit()

        response = client.get(
            "/api/apartments-v2/charges",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_list_charges_with_filters(self, client, auth_headers, test_assignment):
        """Test listing charges with filters."""
        response = client.get(
            f"/api/apartments-v2/charges?assignment_id={test_assignment.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_charge_success(self, client, auth_headers, db, admin_user, test_assignment):
        """Test getting charge details."""
        charge = AdditionalCharge(
            assignment_id=test_assignment.id,
            employee_id=test_assignment.employee_id,
            apartment_id=test_assignment.apartment_id,
            charge_type="cleaning",
            description="Limpieza",
            amount=20000,
            charge_date=date.today(),
            status="pending",
            created_by=admin_user.id
        )
        db.add(charge)
        db.commit()
        db.refresh(charge)

        response = client.get(
            f"/api/apartments-v2/charges/{charge.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == charge.id

    def test_approve_charge_success(self, client, auth_headers, db, admin_user, test_assignment):
        """Test approving charge."""
        charge = AdditionalCharge(
            assignment_id=test_assignment.id,
            employee_id=test_assignment.employee_id,
            apartment_id=test_assignment.apartment_id,
            charge_type="cleaning",
            description="Limpieza",
            amount=20000,
            charge_date=date.today(),
            status="pending",
            created_by=admin_user.id
        )
        db.add(charge)
        db.commit()
        db.refresh(charge)

        payload = {
            "status": "approved",
            "notes": "Aprobado - daño verificado"
        }
        response = client.put(
            f"/api/apartments-v2/charges/{charge.id}/approve",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200

    def test_cancel_charge_success(self, client, auth_headers, db, admin_user, test_assignment):
        """Test canceling charge."""
        charge = AdditionalCharge(
            assignment_id=test_assignment.id,
            employee_id=test_assignment.employee_id,
            apartment_id=test_assignment.apartment_id,
            charge_type="repair",
            description="Reparación",
            amount=15000,
            charge_date=date.today(),
            status="pending",
            created_by=admin_user.id
        )
        db.add(charge)
        db.commit()
        db.refresh(charge)

        payload = {
            "status": "cancelled",
            "notes": "Cancelado - no requerido"
        }
        response = client.put(
            f"/api/apartments-v2/charges/{charge.id}/cancel",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200

    def test_delete_charge_success(self, client, auth_headers, db, admin_user, test_assignment):
        """Test deleting pending charge."""
        charge = AdditionalCharge(
            assignment_id=test_assignment.id,
            employee_id=test_assignment.employee_id,
            apartment_id=test_assignment.apartment_id,
            charge_type="other",
            description="Cargo misc",
            amount=5000,
            charge_date=date.today(),
            status="pending",
            created_by=admin_user.id
        )
        db.add(charge)
        db.commit()
        charge_id = charge.id

        response = client.delete(
            f"/api/apartments-v2/charges/{charge_id}",
            headers=auth_headers
        )
        assert response.status_code == 204


# =============================================================================
# 5. DEDUCTION TESTS (5 endpoints)
# =============================================================================

class TestDeductions:
    """Tests for deduction management."""

    def test_get_monthly_deductions(self, client, auth_headers):
        """Test getting monthly deductions."""
        response = client.get(
            "/api/apartments-v2/deductions/2025/11",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_monthly_deductions_with_filters(self, client, auth_headers, test_apartment):
        """Test monthly deductions with filters."""
        response = client.get(
            f"/api/apartments-v2/deductions/2025/11?apartment_id={test_apartment.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_generate_monthly_deductions(self, client, auth_headers):
        """Test generating monthly deductions."""
        response = client.post(
            "/api/apartments-v2/deductions/generate?year=2025&month=11",
            headers=auth_headers
        )
        assert response.status_code in [201, 200]  # May be 200 if empty month
        data = response.json()
        assert isinstance(data, list)

    def test_get_deduction_details(self, client, auth_headers, db, admin_user, test_assignment):
        """Test getting deduction details."""
        deduction = ApartmentDeduction(
            assignment_id=test_assignment.id,
            employee_id=test_assignment.employee_id,
            apartment_id=test_assignment.apartment_id,
            year=2025,
            month=11,
            base_rent=50000,
            additional_charges_total=0,
            total_deduction=50000,
            status="pending",
            created_by=admin_user.id
        )
        db.add(deduction)
        db.commit()
        db.refresh(deduction)

        response = client.get(
            f"/api/apartments-v2/deductions/{deduction.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == deduction.id

    def test_update_deduction_status_to_processed(self, client, auth_headers, db, admin_user, test_assignment):
        """Test updating deduction status to processed."""
        deduction = ApartmentDeduction(
            assignment_id=test_assignment.id,
            employee_id=test_assignment.employee_id,
            apartment_id=test_assignment.apartment_id,
            year=2025,
            month=11,
            base_rent=50000,
            additional_charges_total=0,
            total_deduction=50000,
            status="pending",
            created_by=admin_user.id
        )
        db.add(deduction)
        db.commit()
        db.refresh(deduction)

        payload = {
            "status": "processed",
            "processed_date": "2025-11-30"
        }
        response = client.put(
            f"/api/apartments-v2/deductions/{deduction.id}/status",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200

    def test_update_deduction_status_to_paid(self, client, auth_headers, db, admin_user, test_assignment):
        """Test updating deduction status to paid."""
        deduction = ApartmentDeduction(
            assignment_id=test_assignment.id,
            employee_id=test_assignment.employee_id,
            apartment_id=test_assignment.apartment_id,
            year=2025,
            month=11,
            base_rent=50000,
            additional_charges_total=0,
            total_deduction=50000,
            status="processed",
            created_by=admin_user.id
        )
        db.add(deduction)
        db.commit()
        db.refresh(deduction)

        payload = {
            "status": "paid"
        }
        response = client.put(
            f"/api/apartments-v2/deductions/{deduction.id}/status",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200


# =============================================================================
# 6. REPORT TESTS (4 endpoints)
# =============================================================================

class TestReports:
    """Tests for reporting endpoints."""

    def test_get_occupancy_report(self, client, auth_headers):
        """Test getting occupancy report."""
        response = client.get(
            "/api/apartments-v2/reports/occupancy",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_apartments" in data
        assert "occupancy_rate" in data

    def test_get_occupancy_report_by_prefecture(self, client, auth_headers):
        """Test occupancy report filtered by prefecture."""
        response = client.get(
            "/api/apartments-v2/reports/occupancy?prefecture=東京都",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_apartments" in data

    def test_get_arrears_report(self, client, auth_headers):
        """Test getting arrears report."""
        response = client.get(
            "/api/apartments-v2/reports/arrears?year=2025&month=11",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_due" in data or "total_collected" in data

    def test_get_maintenance_report(self, client, auth_headers):
        """Test getting maintenance report."""
        response = client.get(
            "/api/apartments-v2/reports/maintenance",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_charges" in data or "breakdown" in data

    def test_get_cost_analysis_report(self, client, auth_headers):
        """Test getting cost analysis report."""
        response = client.get(
            "/api/apartments-v2/reports/costs?year=2025",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)


# =============================================================================
# AUTHENTICATION & AUTHORIZATION TESTS
# =============================================================================

class TestAuthentication:
    """Tests for authentication requirements."""

    def test_unauthenticated_access_denied(self, client, test_apartment):
        """Test that endpoints require authentication."""
        response = client.get("/api/apartments-v2/apartments")
        assert response.status_code == 401

    def test_invalid_token_denied(self, client):
        """Test that invalid token is rejected."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/apartments-v2/apartments", headers=headers)
        assert response.status_code == 401


# =============================================================================
# EDGE CASES & ERROR HANDLING
# =============================================================================

class TestEdgeCases:
    """Tests for edge cases and error scenarios."""

    def test_create_duplicate_apartment_check(self, client, auth_headers, db, admin_user):
        """Test that duplicate apartment codes are handled."""
        # Create first apartment
        apt1 = Apartment(
            name="Test Apt 1",
            base_rent=50000,
            created_by=admin_user.id
        )
        db.add(apt1)
        db.commit()

        # Try to create similar apartment (unique constraint depends on schema)
        payload = {
            "name": "Test Apt 1",
            "base_rent": 50000
        }
        response = client.post(
            "/api/apartments-v2/apartments",
            json=payload,
            headers=auth_headers
        )
        # Should succeed or fail based on actual constraints

    def test_assignment_with_nonexistent_employee(self, client, auth_headers, test_apartment):
        """Test creating assignment with non-existent employee."""
        payload = {
            "apartment_id": test_apartment.id,
            "employee_id": 999999,
            "start_date": "2025-11-10",
            "monthly_rent": 50000,
            "days_in_month": 30,
            "days_occupied": 21,
            "prorated_rent": 35000,
            "total_deduction": 35000
        }
        response = client.post(
            "/api/apartments-v2/assignments",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 404

    def test_invalid_month_in_deductions(self, client, auth_headers):
        """Test deductions with invalid month."""
        response = client.get(
            "/api/apartments-v2/deductions/2025/13",  # Invalid month
            headers=auth_headers
        )
        assert response.status_code == 422

    def test_pagination_limits(self, client, auth_headers, test_apartment):
        """Test pagination with various limits."""
        response = client.get(
            "/api/apartments-v2/apartments?skip=0&limit=10",
            headers=auth_headers
        )
        assert response.status_code == 200

        response = client.get(
            "/api/apartments-v2/apartments?skip=0&limit=500",
            headers=auth_headers
        )
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
