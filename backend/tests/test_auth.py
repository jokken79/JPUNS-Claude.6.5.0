"""Tests for authentication flows."""
from __future__ import annotations


def test_login_success_and_failure(client):
    from app.core.database import SessionLocal
    from app.models.models import User, UserRole
    from app.services.auth_service import auth_service

    session = SessionLocal()
    try:
        password = "secure-password"
        user = User(
            username="testuser",
            email="testuser@example.com",
            password_hash=auth_service.get_password_hash(password),
            full_name="Test User",
            role=UserRole.ADMIN,
            is_active=True,
        )
        session.add(user)
        session.commit()

        response = client.post(
            "/api/auth/login",
            data={"username": "testuser", "password": password},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["token_type"] == "bearer"
        assert "access_token" in data

        failed_response = client.post(
            "/api/auth/login",
            data={"username": "testuser", "password": "wrong"},
        )
        assert failed_response.status_code == 401
        assert failed_response.json()["detail"] == "Incorrect username or password"
    finally:
        session.close()
