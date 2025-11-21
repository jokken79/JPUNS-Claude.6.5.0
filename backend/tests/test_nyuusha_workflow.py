"""
Unit tests for 入社連絡票 (NYUUSHA - New Hire Notification Form) workflow

This module tests the complete workflow for hiring a candidate:
1. Save employee-specific data for a NYUUSHA request
2. Approve NYUUSHA request and create employee record
3. Update candidate status to HIRED
4. Validate all business rules and error handling
"""
from __future__ import annotations

import pytest
from datetime import date, datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.models import (
    User,
    UserRole,
    Candidate,
    CandidateStatus,
    Request,
    RequestType,
    RequestStatus,
    Employee,
    Factory,
)
from app.services.auth_service import auth_service


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def db_session() -> Session:
    """Provide a database session for tests."""
    session = SessionLocal()
    try:
        yield session
    finally:
        # Cleanup: delete all test data
        session.query(Request).delete()
        session.query(Employee).delete()
        session.query(Candidate).delete()
        session.query(Factory).delete()
        session.query(User).delete()
        session.commit()
        session.close()


@pytest.fixture
def admin_user(db_session: Session) -> tuple[User, str]:
    """Create an admin user and return user + JWT token."""
    password = "admin123"
    user = User(
        username="admin_test",
        email="admin@test.com",
        password_hash=auth_service.get_password_hash(password),
        full_name="Admin Test User",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Create JWT token for authentication
    access_token = auth_service.create_access_token(data={"sub": user.username})

    return user, access_token


@pytest.fixture
def factory(db_session: Session) -> Factory:
    """Create a factory for testing."""
    factory = Factory(
        factory_id="FAC001",
        factory_name="Test Factory",
        factory_name_kana="テストファクトリー",
        address="Tokyo Test Address",
        phone="03-1234-5678",
        email="factory@test.com",
        status="active",
        created_at=datetime.now(),
    )
    db_session.add(factory)
    db_session.commit()
    db_session.refresh(factory)
    return factory


@pytest.fixture
def candidate(db_session: Session) -> Candidate:
    """Create a candidate for testing."""
    candidate = Candidate(
        rirekisho_id="RK-2025-001",
        full_name_roman="John Doe",
        full_name_kanji="田中太郎",
        full_name_kana="タナカタロウ",
        date_of_birth=date(1990, 5, 15),
        gender="male",
        nationality="Japan",
        email="john.doe@test.com",
        phone="090-1234-5678",
        address="Tokyo Test Address 123",
        status=CandidateStatus.APPROVED,
        passport_number="AB1234567",
        residence_card_number="ZC1234567890",
        residence_status="Working",
        residence_expiry=date(2025, 12, 31),
        marital_status="single",
        created_at=datetime.now(),
    )
    db_session.add(candidate)
    db_session.commit()
    db_session.refresh(candidate)
    return candidate


@pytest.fixture
def nyuusha_request(db_session: Session, candidate: Candidate) -> Request:
    """Create a NYUUSHA request without employee_data."""
    request = Request(
        candidate_id=candidate.id,
        request_type=RequestType.NYUUSHA,
        start_date=date(2025, 11, 20),
        end_date=date(2025, 11, 20),
        reason="New hire for Test Factory",
        status=RequestStatus.PENDING,
        employee_data=None,
        created_at=datetime.now(),
    )
    db_session.add(request)
    db_session.commit()
    db_session.refresh(request)
    return request


@pytest.fixture
def nyuusha_request_with_employee_data(
    db_session: Session, candidate: Candidate, factory: Factory
) -> Request:
    """Create a NYUUSHA request with complete employee_data."""
    employee_data = {
        "factory_id": factory.factory_id,
        "hire_date": "2025-11-20",
        "jikyu": 1500,
        "position": "Machine Operator",
        "contract_type": "正社員",
        "is_shatak": True,
        "hakensaki_shain_id": "HS001",
        "apartment_id": "APT001",
        "bank_name": "Test Bank",
        "bank_account": "1234567890",
        "emergency_contact_name": "Jane Doe",
        "emergency_contact_phone": "090-9876-5432",
        "created_by_user": "admin_test",
    }

    request = Request(
        candidate_id=candidate.id,
        request_type=RequestType.NYUUSHA,
        start_date=date(2025, 11, 20),
        end_date=date(2025, 11, 20),
        reason="New hire for Test Factory",
        status=RequestStatus.PENDING,
        employee_data=employee_data,
        created_at=datetime.now(),
    )
    db_session.add(request)
    db_session.commit()
    db_session.refresh(request)
    return request


# ============================================================================
# TESTS: PUT /api/requests/{request_id}/employee-data
# ============================================================================

def test_save_employee_data_success(
    client: TestClient,
    db_session: Session,
    admin_user: tuple[User, str],
    nyuusha_request: Request,
    factory: Factory,
):
    """Test successful employee data save for NYUUSHA request."""
    user, token = admin_user

    employee_data = {
        "factory_id": factory.factory_id,
        "hire_date": "2025-11-20",
        "jikyu": 1500,
        "position": "Machine Operator",
        "contract_type": "正社員",
        "is_shatak": False,
    }

    response = client.put(
        f"/api/requests/{nyuusha_request.id}/employee-data",
        json=employee_data,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Employee data saved successfully"
    assert data["request_id"] == nyuusha_request.id
    assert data["employee_data"] is not None


def test_save_employee_data_invalid_type(
    client: TestClient,
    db_session: Session,
    admin_user: tuple[User, str],
    candidate: Candidate,
    factory: Factory,
):
    """Test saving employee data fails for non-NYUUSHA request types."""
    user, token = admin_user

    yukyu_request = Request(
        candidate_id=candidate.id,
        request_type=RequestType.YUKYU,
        start_date=date(2025, 11, 20),
        end_date=date(2025, 11, 22),
        reason="Vacation",
        status=RequestStatus.PENDING,
        created_at=datetime.now(),
    )
    db_session.add(yukyu_request)
    db_session.commit()
    db_session.refresh(yukyu_request)

    employee_data = {
        "factory_id": factory.factory_id,
        "hire_date": "2025-11-20",
        "jikyu": 1500,
        "position": "Machine Operator",
        "contract_type": "正社員",
        "is_shatak": False,
    }

    response = client.put(
        f"/api/requests/{yukyu_request.id}/employee-data",
        json=employee_data,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400
    assert "only for 入社連絡票 (NYUUSHA) requests" in response.json()["detail"]


def test_save_employee_data_not_pending(
    client: TestClient,
    db_session: Session,
    admin_user: tuple[User, str],
    candidate: Candidate,
    factory: Factory,
):
    """Test saving employee data fails for non-pending requests."""
    user, token = admin_user

    approved_request = Request(
        candidate_id=candidate.id,
        request_type=RequestType.NYUUSHA,
        start_date=date(2025, 11, 20),
        end_date=date(2025, 11, 20),
        reason="Already approved",
        status=RequestStatus.APPROVED,
        approved_by=user.id,
        approved_at=datetime.now(),
        created_at=datetime.now(),
    )
    db_session.add(approved_request)
    db_session.commit()
    db_session.refresh(approved_request)

    employee_data = {
        "factory_id": factory.factory_id,
        "hire_date": "2025-11-20",
        "jikyu": 1500,
        "position": "Machine Operator",
        "contract_type": "正社員",
        "is_shatak": False,
    }

    response = client.put(
        f"/api/requests/{approved_request.id}/employee-data",
        json=employee_data,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400
    assert "Cannot modify request with status:" in response.json()["detail"]


# ============================================================================
# TESTS: POST /api/requests/{request_id}/approve-nyuusha
# ============================================================================

def test_approve_nyuusha_success(
    client: TestClient,
    db_session: Session,
    admin_user: tuple[User, str],
    nyuusha_request_with_employee_data: Request,
    candidate: Candidate,
):
    """Test successful NYUUSHA approval creates employee and updates statuses."""
    user, token = admin_user

    assert candidate.status == CandidateStatus.APPROVED

    response = client.post(
        f"/api/requests/{nyuusha_request_with_employee_data.id}/approve-nyuusha",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "Employee created" in data["message"]
    assert data["hakenmoto_id"] is not None

    # Verify candidate status updated
    db_session.refresh(candidate)
    assert candidate.status == CandidateStatus.HIRED

    # Verify request status updated
    db_session.refresh(nyuusha_request_with_employee_data)
    assert nyuusha_request_with_employee_data.status == RequestStatus.COMPLETED


def test_approve_nyuusha_no_employee_data(
    client: TestClient,
    db_session: Session,
    admin_user: tuple[User, str],
    nyuusha_request: Request,
):
    """Test approval fails if employee_data is not filled."""
    user, token = admin_user

    assert nyuusha_request.employee_data is None

    response = client.post(
        f"/api/requests/{nyuusha_request.id}/approve-nyuusha",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400
    assert "Employee data must be filled before approval" in response.json()["detail"]

    assert db_session.query(Employee).count() == 0


def test_approve_nyuusha_duplicate_employee(
    client: TestClient,
    db_session: Session,
    admin_user: tuple[User, str],
    nyuusha_request_with_employee_data: Request,
    candidate: Candidate,
):
    """Test approval fails if employee already exists for candidate."""
    user, token = admin_user

    existing_employee = Employee(
        hakenmoto_id="E-0001",
        rirekisho_id=candidate.rirekisho_id,
        full_name_roman=candidate.full_name_roman,
        full_name_kanji=candidate.full_name_kanji,
        date_of_birth=candidate.date_of_birth,
        email=candidate.email,
        phone=candidate.phone,
        status="active",
        created_at=datetime.now(),
    )
    db_session.add(existing_employee)
    db_session.commit()

    response = client.post(
        f"/api/requests/{nyuusha_request_with_employee_data.id}/approve-nyuusha",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400
    assert "Employee already exists for this candidate" in response.json()["detail"]


def test_approve_nyuusha_updates_candidate_status(
    client: TestClient,
    db_session: Session,
    admin_user: tuple[User, str],
    nyuusha_request_with_employee_data: Request,
    candidate: Candidate,
):
    """Test that approving NYUUSHA correctly updates candidate status to HIRED."""
    user, token = admin_user

    assert candidate.status == CandidateStatus.APPROVED

    response = client.post(
        f"/api/requests/{nyuusha_request_with_employee_data.id}/approve-nyuusha",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    db_session.refresh(candidate)
    assert candidate.status == CandidateStatus.HIRED

    candidate_from_db = db_session.query(Candidate).filter(Candidate.id == candidate.id).first()
    assert candidate_from_db.status == CandidateStatus.HIRED


def test_approve_nyuusha_request_not_found(
    client: TestClient,
    db_session: Session,
    admin_user: tuple[User, str],
):
    """Test approval fails with 404 if request doesn't exist."""
    user, token = admin_user

    response = client.post(
        "/api/requests/99999/approve-nyuusha",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404
    assert "Request not found" in response.json()["detail"]


def test_save_employee_data_request_not_found(
    client: TestClient,
    db_session: Session,
    admin_user: tuple[User, str],
):
    """Test saving employee data fails with 404 if request doesn't exist."""
    user, token = admin_user

    employee_data = {
        "factory_id": "FAC001",
        "hire_date": "2025-11-20",
        "jikyu": 1500,
        "position": "Operator",
        "contract_type": "正社員",
    }

    response = client.put(
        "/api/requests/99999/employee-data",
        json=employee_data,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404
    assert "Request not found" in response.json()["detail"]
