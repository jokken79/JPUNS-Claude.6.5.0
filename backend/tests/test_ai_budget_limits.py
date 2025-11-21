"""
Tests for AI Budget Limits System (FASE 2.3)

Tests budget management, spending validation, and cost enforcement.
"""

import pytest
from datetime import date, timedelta
from decimal import Decimal
from fastapi import status
from fastapi.testclient import TestClient

from app.models.models import AIBudget
from app.services.ai_budget_service import AIBudgetService, BudgetExceededException


class TestAIBudgetModel:
    """Test AIBudget database model"""

    def test_create_budget(self, db_session, test_user):
        """Test creating a budget"""
        budget = AIBudget(
            user_id=test_user.id,
            monthly_budget_usd=Decimal("500.00"),
            daily_budget_usd=Decimal("50.00"),
            spent_this_month=Decimal("0"),
            spent_today=Decimal("0"),
            month_reset_date=date.today() + timedelta(days=30),
            day_reset_date=date.today() + timedelta(days=1),
            alert_threshold=80,
            is_active=True,
        )
        db_session.add(budget)
        db_session.commit()
        db_session.refresh(budget)

        assert budget.id is not None
        assert budget.user_id == test_user.id
        assert float(budget.monthly_budget_usd) == 500.0
        assert float(budget.daily_budget_usd) == 50.0

    def test_budget_remaining_calculation(self, db_session, test_user):
        """Test remaining budget calculations"""
        budget = AIBudget(
            user_id=test_user.id,
            monthly_budget_usd=Decimal("1000.00"),
            spent_this_month=Decimal("300.00"),
            spent_today=Decimal("25.00"),
            daily_budget_usd=Decimal("100.00"),
            month_reset_date=date.today() + timedelta(days=30),
            day_reset_date=date.today() + timedelta(days=1),
        )
        db_session.add(budget)
        db_session.commit()
        db_session.refresh(budget)

        assert float(budget.monthly_remaining) == 700.0  # 1000 - 300
        assert float(budget.daily_remaining) == 75.0  # 100 - 25

    def test_budget_percentage_used(self, db_session, test_user):
        """Test percentage used calculations"""
        budget = AIBudget(
            user_id=test_user.id,
            monthly_budget_usd=Decimal("1000.00"),
            spent_this_month=Decimal("500.00"),
            spent_today=Decimal("50.00"),
            daily_budget_usd=Decimal("100.00"),
            month_reset_date=date.today() + timedelta(days=30),
            day_reset_date=date.today() + timedelta(days=1),
        )
        db_session.add(budget)
        db_session.commit()
        db_session.refresh(budget)

        assert budget.monthly_percentage_used == 50.0  # 500/1000 = 50%
        assert budget.daily_percentage_used == 50.0  # 50/100 = 50%

    def test_budget_alert_threshold(self, db_session, test_user):
        """Test alert threshold checking"""
        budget = AIBudget(
            user_id=test_user.id,
            monthly_budget_usd=Decimal("1000.00"),
            spent_this_month=Decimal("850.00"),
            alert_threshold=80,
            month_reset_date=date.today() + timedelta(days=30),
            day_reset_date=date.today() + timedelta(days=1),
        )
        db_session.add(budget)
        db_session.commit()
        db_session.refresh(budget)

        # 850/1000 = 85% > 80% threshold
        assert budget.should_alert_monthly is True

    def test_budget_can_afford(self, db_session, test_user):
        """Test can_afford method"""
        budget = AIBudget(
            user_id=test_user.id,
            monthly_budget_usd=Decimal("1000.00"),
            daily_budget_usd=Decimal("100.00"),
            spent_this_month=Decimal("900.00"),
            spent_today=Decimal("80.00"),
            month_reset_date=date.today() + timedelta(days=30),
            day_reset_date=date.today() + timedelta(days=1),
        )
        db_session.add(budget)
        db_session.commit()
        db_session.refresh(budget)

        # Can afford small call
        assert budget.can_afford(Decimal("10.00")) is True

        # Cannot afford call that exceeds monthly
        assert budget.can_afford(Decimal("150.00")) is False

        # Cannot afford call that exceeds daily
        assert budget.can_afford(Decimal("30.00")) is False


class TestAIBudgetService:
    """Test AIBudgetService functionality"""

    def test_get_or_create_budget(self, db_session, test_user):
        """Test budget creation"""
        service = AIBudgetService(db_session)

        budget = service.get_or_create_budget(
            test_user.id,
            monthly_budget_usd=Decimal("500.00"),
        )

        assert budget.id is not None
        assert budget.user_id == test_user.id
        assert float(budget.monthly_budget_usd) == 500.0
        assert budget.is_active is True

    def test_get_existing_budget(self, db_session, test_user):
        """Test retrieving existing budget"""
        service = AIBudgetService(db_session)

        # Create first time
        budget1 = service.get_or_create_budget(
            test_user.id,
            monthly_budget_usd=Decimal("500.00"),
        )

        # Get second time should return same
        budget2 = service.get_or_create_budget(
            test_user.id,
            monthly_budget_usd=Decimal("500.00"),
        )

        assert budget1.id == budget2.id

    def test_validate_spending_allowed(self, db_session, test_user):
        """Test spending validation when allowed"""
        service = AIBudgetService(db_session)
        service.get_or_create_budget(test_user.id, monthly_budget_usd=Decimal("1000.00"))

        result = service.validate_spending(test_user.id, Decimal("100.00"))

        assert result["allowed"] is True
        assert result["monthly_remaining"] == 900.0

    def test_validate_spending_exceeds_monthly(self, db_session, test_user):
        """Test spending validation when exceeds monthly"""
        service = AIBudgetService(db_session)
        budget = service.get_or_create_budget(test_user.id, monthly_budget_usd=Decimal("100.00"))
        budget.spent_this_month = Decimal("90.00")
        db_session.commit()

        with pytest.raises(BudgetExceededException):
            service.validate_spending(test_user.id, Decimal("50.00"))

    def test_validate_spending_exceeds_daily(self, db_session, test_user):
        """Test spending validation when exceeds daily"""
        service = AIBudgetService(db_session)
        budget = service.get_or_create_budget(
            test_user.id,
            monthly_budget_usd=Decimal("1000.00"),
            daily_budget_usd=Decimal("100.00"),
        )
        budget.spent_today = Decimal("90.00")
        db_session.commit()

        with pytest.raises(BudgetExceededException):
            service.validate_spending(test_user.id, Decimal("50.00"))

    def test_validate_spending_inactive_budget(self, db_session, test_user):
        """Test that inactive budgets don't block calls"""
        service = AIBudgetService(db_session)
        budget = service.get_or_create_budget(test_user.id, monthly_budget_usd=Decimal("10.00"))
        budget.is_active = False
        budget.spent_this_month = Decimal("50.00")
        db_session.commit()

        # Should be allowed even though over budget
        result = service.validate_spending(test_user.id, Decimal("100.00"))
        assert result["allowed"] is True

    def test_record_spending(self, db_session, test_user):
        """Test recording spending against budget"""
        service = AIBudgetService(db_session)
        service.get_or_create_budget(test_user.id, monthly_budget_usd=Decimal("1000.00"))

        service.record_spending(test_user.id, Decimal("150.00"))
        budget = db_session.query(AIBudget).filter(AIBudget.user_id == test_user.id).first()

        assert float(budget.spent_this_month) == 150.0

    def test_get_budget_status(self, db_session, test_user):
        """Test getting budget status"""
        service = AIBudgetService(db_session)
        service.get_or_create_budget(test_user.id, monthly_budget_usd=Decimal("1000.00"))

        status = service.get_budget_status(test_user.id)

        assert status["user_id"] == test_user.id
        assert status["monthly_budget"] == 1000.0
        assert "monthly_remaining" in status
        assert "monthly_percentage_used" in status

    def test_update_budget(self, db_session, test_user):
        """Test updating budget settings"""
        service = AIBudgetService(db_session)
        service.get_or_create_budget(test_user.id, monthly_budget_usd=Decimal("500.00"))

        updated = service.update_budget(
            test_user.id,
            monthly_budget_usd=Decimal("2000.00"),
            alert_threshold=90,
        )

        assert float(updated.monthly_budget_usd) == 2000.0
        assert updated.alert_threshold == 90

    def test_reset_monthly_spending(self, db_session, test_user):
        """Test resetting monthly spending"""
        service = AIBudgetService(db_session)
        budget = service.get_or_create_budget(test_user.id, monthly_budget_usd=Decimal("1000.00"))
        budget.spent_this_month = Decimal("500.00")
        db_session.commit()

        service.reset_monthly_spending(test_user.id)
        budget = db_session.query(AIBudget).filter(AIBudget.user_id == test_user.id).first()

        assert float(budget.spent_this_month) == 0.0

    def test_reset_daily_spending(self, db_session, test_user):
        """Test resetting daily spending"""
        service = AIBudgetService(db_session)
        budget = service.get_or_create_budget(test_user.id, monthly_budget_usd=Decimal("1000.00"))
        budget.spent_today = Decimal("50.00")
        db_session.commit()

        service.reset_daily_spending(test_user.id)
        budget = db_session.query(AIBudget).filter(AIBudget.user_id == test_user.id).first()

        assert float(budget.spent_today) == 0.0

    def test_auto_reset_monthly(self, db_session, test_user):
        """Test automatic monthly reset when date passed"""
        service = AIBudgetService(db_session)
        budget = service.get_or_create_budget(test_user.id, monthly_budget_usd=Decimal("1000.00"))
        budget.spent_this_month = Decimal("500.00")
        budget.month_reset_date = date.today() - timedelta(days=1)  # Past date
        db_session.commit()

        status = service.get_budget_status(test_user.id)

        # Should be reset
        assert float(status["monthly_spent"]) == 0.0

    def test_auto_reset_daily(self, db_session, test_user):
        """Test automatic daily reset when date passed"""
        service = AIBudgetService(db_session)
        budget = service.get_or_create_budget(test_user.id, monthly_budget_usd=Decimal("1000.00"))
        budget.spent_today = Decimal("50.00")
        budget.day_reset_date = date.today() - timedelta(days=1)  # Past date
        db_session.commit()

        status = service.get_budget_status(test_user.id)

        # Should be reset
        assert float(status["daily_spent"]) == 0.0


class TestBudgetEndpoints:
    """Test budget management API endpoints"""

    def test_get_budget_endpoint(self, client: TestClient, auth_headers):
        """Test GET /api/ai/budget endpoint"""
        response = client.get("/api/ai/budget", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "user_id" in data
        assert "monthly_budget" in data
        assert "monthly_spent" in data

    def test_create_budget_endpoint(self, client: TestClient, auth_headers):
        """Test POST /api/ai/budget endpoint"""
        payload = {
            "monthly_budget_usd": "500.00",
            "daily_budget_usd": "50.00",
            "alert_threshold": 75,
        }
        response = client.post("/api/ai/budget", json=payload, headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["monthly_budget"] == 500.0
        assert data["daily_budget"] == 50.0

    def test_update_budget_endpoint(self, client: TestClient, auth_headers):
        """Test PUT /api/ai/budget endpoint"""
        # Create first
        create_payload = {
            "monthly_budget_usd": "500.00",
            "daily_budget_usd": "50.00",
        }
        client.post("/api/ai/budget", json=create_payload, headers=auth_headers)

        # Update
        update_payload = {
            "monthly_budget_usd": "1000.00",
        }
        response = client.put("/api/ai/budget", json=update_payload, headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["monthly_budget"] == 1000.0

    def test_validate_budget_endpoint(self, client: TestClient, auth_headers):
        """Test GET /api/ai/budget/validate endpoint"""
        # Create budget first
        payload = {"monthly_budget_usd": "500.00"}
        client.post("/api/ai/budget", json=payload, headers=auth_headers)

        response = client.get("/api/ai/budget/validate?cost=100.0", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["allowed"] is True
        assert data["monthly_remaining"] == 400.0

    def test_validate_budget_exceeded(self, client: TestClient, auth_headers):
        """Test budget validation when exceeded"""
        # Create budget
        payload = {"monthly_budget_usd": "50.00"}
        client.post("/api/ai/budget", json=payload, headers=auth_headers)

        response = client.get("/api/ai/budget/validate?cost=100.0", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["allowed"] is False

    def test_budget_endpoints_require_auth(self, client: TestClient):
        """Test that budget endpoints require authentication"""
        endpoints = [
            ("/api/ai/budget", "GET"),
            ("/api/ai/budget", "POST"),
            ("/api/ai/budget", "PUT"),
            ("/api/ai/budget/validate", "GET"),
        ]

        for endpoint, method in endpoints:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "POST":
                response = client.post(endpoint, json={})
            elif method == "PUT":
                response = client.put(endpoint, json={})

            assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_invalid_alert_threshold(self, client: TestClient, auth_headers):
        """Test validation of alert threshold"""
        payload = {
            "monthly_budget_usd": "500.00",
            "alert_threshold": 150,  # Invalid: > 100
        }
        response = client.post("/api/ai/budget", json=payload, headers=auth_headers)

        # Should fail validation
        assert response.status_code in [status.HTTP_422_UNPROCESSABLE_ENTITY, status.HTTP_400_BAD_REQUEST]

    def test_negative_budget(self, client: TestClient, auth_headers):
        """Test that negative budgets are rejected"""
        payload = {
            "monthly_budget_usd": "-100.00",  # Invalid: negative
        }
        response = client.post("/api/ai/budget", json=payload, headers=auth_headers)

        assert response.status_code in [status.HTTP_422_UNPROCESSABLE_ENTITY, status.HTTP_400_BAD_REQUEST]


class TestBudgetIntegration:
    """Integration tests for budget system"""

    def test_full_budget_workflow(self, db_session, test_user):
        """Test complete budget workflow"""
        from decimal import Decimal
        service = AIBudgetService(db_session)

        # 1. Create budget
        budget = service.get_or_create_budget(
            test_user.id,
            monthly_budget_usd=Decimal("1000.00"),
            daily_budget_usd=Decimal("100.00"),
        )
        assert budget.monthly_budget_usd == Decimal("1000.00")

        # 2. Validate spending - should pass
        result = service.validate_spending(test_user.id, Decimal("50.00"))
        assert result["allowed"] is True

        # 3. Record spending
        service.record_spending(test_user.id, Decimal("50.00"))

        # 4. Check status
        status = service.get_budget_status(test_user.id)
        assert status["monthly_spent"] == 50.0
        assert status["monthly_remaining"] == 950.0

        # 5. Update budget
        service.update_budget(test_user.id, alert_threshold=90)
        budget = service.get_or_create_budget(test_user.id)
        assert budget.alert_threshold == 90

    def test_budget_alert_trigger(self, db_session, test_user):
        """Test that alerts trigger at threshold"""
        service = AIBudgetService(db_session)
        budget = service.get_or_create_budget(
            test_user.id,
            monthly_budget_usd=Decimal("1000.00"),
        )
        budget.alert_threshold = 80
        budget.spent_this_month = Decimal("750.00")
        db_session.commit()

        # Record spending that pushes over threshold
        service.record_spending(test_user.id, Decimal("100.00"))

        budget = db_session.query(AIBudget).filter(AIBudget.user_id == test_user.id).first()
        # 850/1000 = 85% > 80%
        assert budget.should_alert_monthly is True
