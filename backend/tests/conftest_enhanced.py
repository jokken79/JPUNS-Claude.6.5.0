"""Enhanced pytest fixtures for backend tests with comprehensive setup."""
from __future__ import annotations

import importlib
import os
import sys
from collections.abc import Generator
from pathlib import Path
from typing import AsyncGenerator
import asyncio

import pytest
import pytest_asyncio
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Import models and base
from app.core.database import Base
from app.models.models import User, Employee, Candidate
from app.services.auth_service import AuthService
from tests.factories import UserFactory, EmployeeFactory, CandidateFactory


def _reload_app(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> FastAPI:
    """Reload the FastAPI application with test-specific environment variables."""
    monkeypatch.setenv("APP_NAME", os.getenv("APP_NAME", "UNS-ClaudeJP 5.6.0"))
    monkeypatch.setenv("APP_VERSION", os.getenv("APP_VERSION", "5.6.0"))
    monkeypatch.setenv("ENABLE_TELEMETRY", "false")

    db_path = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")

    monkeypatch.setenv(
        "SECRET_KEY",
        os.getenv("SECRET_KEY", "test-secret-key-which-is-definitely-32-bytes-long!"),
    )

    upload_dir = tmp_path / "uploads"
    log_file = tmp_path / "logs" / "app.log"
    reports_dir = tmp_path / "reports"
    monkeypatch.setenv("UPLOAD_DIR", str(upload_dir))
    monkeypatch.setenv("LOG_FILE", str(log_file))
    monkeypatch.setenv("REPORTS_DIR", str(reports_dir))

    for module_name in ["app.core.config", "app.core.database", "app.main"]:
        sys.modules.pop(module_name, None)

    app_module = importlib.import_module("app.main")
    return app_module.app


@pytest.fixture(scope="function")
def db_engine():
    """Create an in-memory SQLite engine for testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    yield engine
    
    # Drop all tables after test
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(db_engine) -> Generator[Session, None, None]:
    """Create a new database session for testing."""
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=db_engine
    )
    
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def app(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> FastAPI:
    """Provide a FastAPI application instance configured for tests."""
    application = _reload_app(monkeypatch, tmp_path)
    return application


@pytest.fixture
def client(app: FastAPI) -> Generator[TestClient, None, None]:
    """Yield a FastAPI test client with startup/shutdown lifecycle management."""
    with TestClient(app, base_url="http://localhost") as test_client:
        yield test_client


# User Fixtures

@pytest.fixture
def test_user_data():
    """Provide test user data."""
    return UserFactory.build()


@pytest.fixture
def admin_user_data():
    """Provide admin user data."""
    return UserFactory.build_admin()


@pytest.fixture
def test_user(db_session: Session, test_user_data: dict) -> User:
    """Create a test user in the database."""
    # Hash the password
    hashed_password = AuthService.get_password_hash(test_user_data["password"])
    
    user = User(
        email=test_user_data["email"],
        username=test_user_data["username"],
        full_name=test_user_data["full_name"],
        hashed_password=hashed_password,
        is_active=test_user_data["is_active"],
        is_superuser=test_user_data["is_superuser"]
    )
    
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    return user


@pytest.fixture
def admin_user(db_session: Session, admin_user_data: dict) -> User:
    """Create an admin user in the database."""
    hashed_password = AuthService.get_password_hash(admin_user_data["password"])
    
    user = User(
        email=admin_user_data["email"],
        username=admin_user_data["username"],
        full_name=admin_user_data["full_name"],
        hashed_password=hashed_password,
        is_active=admin_user_data["is_active"],
        is_superuser=admin_user_data["is_superuser"]
    )
    
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    return user


@pytest.fixture
def auth_token(test_user: User) -> str:
    """Generate a valid JWT token for test user."""
    return AuthService.create_access_token(
        data={"sub": str(test_user.id)}
    )


@pytest.fixture
def admin_auth_token(admin_user: User) -> str:
    """Generate a valid JWT token for admin user."""
    return AuthService.create_access_token(
        data={"sub": str(admin_user.id)}
    )


@pytest.fixture
def auth_headers(auth_token: str) -> dict:
    """Provide authorization headers with test user token."""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def admin_auth_headers(admin_auth_token: str) -> dict:
    """Provide authorization headers with admin token."""
    return {"Authorization": f"Bearer {admin_auth_token}"}


# Employee Fixtures

@pytest.fixture
def test_employee_data():
    """Provide test employee data."""
    return EmployeeFactory.build()


@pytest.fixture
def test_employee(db_session: Session, test_employee_data: dict) -> Employee:
    """Create a test employee in the database."""
    employee = Employee(**test_employee_data)
    db_session.add(employee)
    db_session.commit()
    db_session.refresh(employee)
    return employee


@pytest.fixture
def test_employees(db_session: Session) -> list[Employee]:
    """Create multiple test employees."""
    employees_data = EmployeeFactory.build_batch(count=5)
    employees = [Employee(**data) for data in employees_data]
    
    db_session.add_all(employees)
    db_session.commit()
    
    for employee in employees:
        db_session.refresh(employee)
    
    return employees


# Candidate Fixtures

@pytest.fixture
def test_candidate_data():
    """Provide test candidate data."""
    return CandidateFactory.build()


@pytest.fixture
def test_candidate(db_session: Session, test_candidate_data: dict) -> Candidate:
    """Create a test candidate in the database."""
    candidate = Candidate(**test_candidate_data)
    db_session.add(candidate)
    db_session.commit()
    db_session.refresh(candidate)
    return candidate


@pytest.fixture
def test_candidates(db_session: Session) -> list[Candidate]:
    """Create multiple test candidates."""
    candidates_data = CandidateFactory.build_batch(count=5)
    candidates = [Candidate(**data) for data in candidates_data]
    
    db_session.add_all(candidates)
    db_session.commit()
    
    for candidate in candidates:
        db_session.refresh(candidate)
    
    return candidates


# Async Fixtures (for async tests)

@pytest_asyncio.fixture
async def async_db_session(db_engine) -> AsyncGenerator[Session, None]:
    """Create an async database session for testing."""
    # Note: For true async, you'd use AsyncSession from sqlalchemy.ext.asyncio
    # This is a simplified version for demonstration
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=db_engine
    )
    
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.rollback()
        session.close()


# Utility Fixtures

@pytest.fixture
def mock_logger(monkeypatch):
    """Mock logger for testing."""
    import logging
    mock_logger = logging.getLogger("test")
    mock_logger.setLevel(logging.DEBUG)
    return mock_logger


@pytest.fixture(autouse=True)
def reset_database(db_session: Session):
    """Reset database state before each test."""
    # This runs before each test automatically
    yield
    # Cleanup after test
    db_session.rollback()
