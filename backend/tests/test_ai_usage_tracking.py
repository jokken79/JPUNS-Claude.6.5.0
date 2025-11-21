"""
Tests for AI Usage Tracking System (FASE 2.2)

Tests the cost tracking, usage statistics, and usage logging functionality.
"""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from fastapi import status
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.models.models import AIUsageLog, AIProvider
from app.services.ai_usage_service import AIUsageService


class TestAIUsageLogModel:
    """Test AIUsageLog database model"""

    def test_create_usage_log(self, db_session, test_user):
        """Test creating a usage log entry"""
        log = AIUsageLog(
            user_id=test_user.id,
            provider=AIProvider.GEMINI,
            model="gemini-pro",
            prompt_tokens=100,
            completion_tokens=50,
            total_tokens=150,
            estimated_cost=Decimal("0.0001"),
            status="success",
        )
        db_session.add(log)
        db_session.commit()
        db_session.refresh(log)

        assert log.id is not None
        assert log.user_id == test_user.id
        assert log.provider == AIProvider.GEMINI
        assert log.model == "gemini-pro"
        assert log.total_tokens == 150
        assert float(log.estimated_cost) == 0.0001

    def test_usage_log_with_error(self, db_session, test_user):
        """Test creating a usage log with error status"""
        log = AIUsageLog(
            user_id=test_user.id,
            provider=AIProvider.OPENAI,
            model="gpt-4",
            status="error",
            error_message="API rate limited",
        )
        db_session.add(log)
        db_session.commit()
        db_session.refresh(log)

        assert log.status == "error"
        assert log.error_message == "API rate limited"

    def test_usage_log_with_metadata(self, db_session, test_user):
        """Test creating a usage log with metadata"""
        metadata = {
            "temperature": 0.7,
            "max_tokens": 500,
            "top_p": 0.9,
        }
        log = AIUsageLog(
            user_id=test_user.id,
            provider=AIProvider.CLAUDE_API,
            model="claude-3-opus",
            prompt_tokens=200,
            completion_tokens=100,
            total_tokens=300,
            estimated_cost=Decimal("0.0050"),
            metadata=metadata,
        )
        db_session.add(log)
        db_session.commit()
        db_session.refresh(log)

        assert log.metadata == metadata
        assert log.metadata["temperature"] == 0.7


class TestAIUsageService:
    """Test AIUsageService functionality"""

    def test_record_usage_success(self, db_session, test_user):
        """Test recording successful API usage"""
        service = AIUsageService(db_session)

        log = service.record_usage(
            user_id=test_user.id,
            provider="gemini",
            model="gemini-pro",
            prompt_tokens=100,
            completion_tokens=50,
        )

        assert log.id is not None
        assert log.status == "success"
        assert log.total_tokens == 150
        assert float(log.estimated_cost) > 0

    def test_record_usage_with_error(self, db_session, test_user):
        """Test recording failed API usage"""
        service = AIUsageService(db_session)

        log = service.record_usage(
            user_id=test_user.id,
            provider="openai",
            model="gpt-4",
            status="error",
            error_message="Rate limit exceeded",
        )

        assert log.status == "error"
        assert log.error_message == "Rate limit exceeded"
        assert log.total_tokens == 0

    def test_cost_calculation_gemini(self, db_session, test_user):
        """Test cost calculation for Gemini"""
        service = AIUsageService(db_session)

        # Gemini pricing: $0.50 per 1M input, $1.50 per 1M output
        log = service.record_usage(
            user_id=test_user.id,
            provider="gemini",
            model="gemini-pro",
            prompt_tokens=1000,  # $0.0005
            completion_tokens=1000,  # $0.0015
        )

        # Expected: 0.0005 + 0.0015 = 0.002
        assert float(log.estimated_cost) == pytest.approx(0.002, abs=0.0001)

    def test_cost_calculation_openai_gpt4(self, db_session, test_user):
        """Test cost calculation for OpenAI GPT-4"""
        service = AIUsageService(db_session)

        # GPT-4 pricing: $0.03 per 1K input, $0.06 per 1K output
        log = service.record_usage(
            user_id=test_user.id,
            provider="openai",
            model="gpt-4",
            prompt_tokens=1000,  # $0.03
            completion_tokens=1000,  # $0.06
        )

        # Expected: 0.03 + 0.06 = 0.09
        assert float(log.estimated_cost) == pytest.approx(0.09, abs=0.001)

    def test_cost_calculation_claude_opus(self, db_session, test_user):
        """Test cost calculation for Claude Opus"""
        service = AIUsageService(db_session)

        # Claude Opus pricing: $0.015 per 1K input, $0.075 per 1K output
        log = service.record_usage(
            user_id=test_user.id,
            provider="claude_api",
            model="claude-3-opus",
            prompt_tokens=1000,  # $0.015
            completion_tokens=1000,  # $0.075
        )

        # Expected: 0.015 + 0.075 = 0.09
        assert float(log.estimated_cost) == pytest.approx(0.09, abs=0.001)

    def test_cost_calculation_local_cli(self, db_session, test_user):
        """Test cost calculation for local CLI (free)"""
        service = AIUsageService(db_session)

        log = service.record_usage(
            user_id=test_user.id,
            provider="local_cli",
            model="ollama",
            prompt_tokens=10000,
            completion_tokens=10000,
        )

        # Should be free
        assert float(log.estimated_cost) == 0.0

    def test_get_usage_stats_single_day(self, db_session, test_user):
        """Test getting usage stats for a single day"""
        service = AIUsageService(db_session)

        # Record multiple API calls
        for i in range(3):
            service.record_usage(
                user_id=test_user.id,
                provider="gemini",
                model="gemini-pro",
                prompt_tokens=100,
                completion_tokens=50,
            )

        stats = service.get_usage_stats(test_user.id, days=1)

        assert stats["user_id"] == test_user.id
        assert stats["total_calls"] == 3
        assert stats["successful_calls"] == 3
        assert stats["failed_calls"] == 0
        assert stats["success_rate"] == 100.0
        assert stats["total_tokens"] == 450  # (100 + 50) * 3

    def test_get_usage_stats_by_provider(self, db_session, test_user):
        """Test getting usage stats grouped by provider"""
        service = AIUsageService(db_session)

        # Record calls to different providers
        service.record_usage(
            user_id=test_user.id,
            provider="gemini",
            model="gemini-pro",
            prompt_tokens=100,
            completion_tokens=50,
        )

        service.record_usage(
            user_id=test_user.id,
            provider="openai",
            model="gpt-4",
            prompt_tokens=200,
            completion_tokens=100,
        )

        stats = service.get_usage_stats(test_user.id, days=1)

        assert "gemini" in stats["by_provider"]
        assert "openai" in stats["by_provider"]
        assert stats["by_provider"]["gemini"]["calls"] == 1
        assert stats["by_provider"]["openai"]["calls"] == 1

    def test_get_usage_stats_with_errors(self, db_session, test_user):
        """Test usage stats include error handling"""
        service = AIUsageService(db_session)

        service.record_usage(
            user_id=test_user.id,
            provider="gemini",
            model="gemini-pro",
            prompt_tokens=100,
            completion_tokens=50,
        )

        service.record_usage(
            user_id=test_user.id,
            provider="openai",
            model="gpt-4",
            status="error",
            error_message="Rate limited",
        )

        stats = service.get_usage_stats(test_user.id, days=1)

        assert stats["total_calls"] == 2
        assert stats["successful_calls"] == 1
        assert stats["failed_calls"] == 1
        assert stats["success_rate"] == 50.0

    def test_get_daily_usage(self, db_session, test_user):
        """Test getting daily usage breakdown"""
        service = AIUsageService(db_session)

        # Record usage for multiple days
        for i in range(3):
            service.record_usage(
                user_id=test_user.id,
                provider="gemini",
                model="gemini-pro",
                prompt_tokens=100,
                completion_tokens=50,
            )

        daily = service.get_daily_usage(test_user.id, days=7)

        assert len(daily) >= 1
        assert daily[0]["calls"] >= 3
        assert "by_provider" in daily[0]

    def test_get_all_logs(self, db_session, test_user):
        """Test paginated logs retrieval"""
        service = AIUsageService(db_session)

        # Record multiple logs
        for i in range(5):
            service.record_usage(
                user_id=test_user.id,
                provider="gemini",
                model="gemini-pro",
                prompt_tokens=100,
                completion_tokens=50,
            )

        logs = service.get_all_logs(test_user.id, limit=2, offset=0)

        assert logs["total"] == 5
        assert len(logs["logs"]) == 2
        assert logs["offset"] == 0
        assert logs["limit"] == 2

    def test_get_all_logs_with_filter(self, db_session, test_user):
        """Test logs retrieval with provider filter"""
        service = AIUsageService(db_session)

        service.record_usage(
            user_id=test_user.id,
            provider="gemini",
            model="gemini-pro",
            prompt_tokens=100,
            completion_tokens=50,
        )

        service.record_usage(
            user_id=test_user.id,
            provider="openai",
            model="gpt-4",
            prompt_tokens=200,
            completion_tokens=100,
        )

        logs = service.get_all_logs(test_user.id, provider="gemini")

        assert logs["total"] == 1
        assert len(logs["logs"]) == 1
        assert logs["logs"][0]["provider"] == "gemini"

    def test_get_user_total_cost(self, db_session, test_user):
        """Test total cost calculation"""
        service = AIUsageService(db_session)

        # Record multiple API calls
        service.record_usage(
            user_id=test_user.id,
            provider="gemini",
            model="gemini-pro",
            prompt_tokens=1000,
            completion_tokens=1000,
        )

        service.record_usage(
            user_id=test_user.id,
            provider="openai",
            model="gpt-4",
            prompt_tokens=1000,
            completion_tokens=1000,
        )

        cost = service.get_user_total_cost(test_user.id, days=30)

        assert cost["user_id"] == test_user.id
        assert cost["total_cost"] > 0
        assert "gemini" in cost["by_provider"]
        assert "openai" in cost["by_provider"]

    def test_delete_old_logs(self, db_session, test_user):
        """Test deleting old usage logs"""
        service = AIUsageService(db_session)

        # Create a log with old timestamp
        old_log = AIUsageLog(
            user_id=test_user.id,
            provider=AIProvider.GEMINI,
            model="gemini-pro",
            prompt_tokens=100,
            completion_tokens=50,
            total_tokens=150,
            estimated_cost=Decimal("0.0001"),
            created_at=datetime.utcnow() - timedelta(days=100),
        )
        db_session.add(old_log)
        db_session.commit()

        deleted = service.delete_old_logs(days=90)

        assert deleted >= 1


class TestUsageTrackingEndpoints:
    """Test usage tracking API endpoints"""

    def test_get_usage_stats_endpoint(self, client: TestClient, test_user, auth_headers):
        """Test GET /api/ai/usage/stats endpoint"""
        response = client.get("/api/ai/usage/stats?days=1", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "user_id" in data
        assert "total_calls" in data
        assert "total_cost" in data

    def test_get_daily_usage_endpoint(self, client: TestClient, auth_headers):
        """Test GET /api/ai/usage/daily endpoint"""
        response = client.get("/api/ai/usage/daily?days=7", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "user_id" in data
        assert "data" in data

    def test_get_usage_logs_endpoint(self, client: TestClient, auth_headers):
        """Test GET /api/ai/usage/logs endpoint"""
        response = client.get("/api/ai/usage/logs?limit=10&offset=0", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total" in data
        assert "logs" in data
        assert "limit" in data
        assert "offset" in data

    def test_get_usage_logs_with_provider_filter(self, client: TestClient, auth_headers):
        """Test GET /api/ai/usage/logs with provider filter"""
        response = client.get(
            "/api/ai/usage/logs?limit=10&offset=0&provider=gemini",
            headers=auth_headers,
        )

        assert response.status_code == status.HTTP_200_OK

    def test_get_total_cost_endpoint(self, client: TestClient, auth_headers):
        """Test GET /api/ai/usage/cost endpoint"""
        response = client.get("/api/ai/usage/cost?days=30", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "user_id" in data
        assert "total_cost" in data
        assert "by_provider" in data

    def test_usage_endpoints_require_auth(self, client: TestClient):
        """Test that usage endpoints require authentication"""
        endpoints = [
            "/api/ai/usage/stats",
            "/api/ai/usage/daily",
            "/api/ai/usage/logs",
            "/api/ai/usage/cost",
        ]

        for endpoint in endpoints:
            response = client.get(endpoint)
            assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_usage_logs_max_limit(self, client: TestClient, auth_headers):
        """Test that usage logs respects max limit of 1000"""
        response = client.get(
            "/api/ai/usage/logs?limit=2000&offset=0",
            headers=auth_headers,
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["limit"] == 1000  # Should be capped


class TestCostCalculationAccuracy:
    """Test cost calculation accuracy for all providers"""

    def test_pricing_matrix(self, db_session, test_user):
        """Test pricing for all known models"""
        service = AIUsageService(db_session)

        test_cases = [
            ("gemini", "gemini-pro", 1000, 1000, 0.002),
            ("openai", "gpt-4", 1000, 1000, 0.09),
            ("openai", "gpt-3.5-turbo", 1000, 1000, 0.002),
            ("claude_api", "claude-3-opus", 1000, 1000, 0.09),
            ("claude_api", "claude-3-haiku", 1000, 1000, 0.00150),
            ("local_cli", "ollama", 10000, 10000, 0.0),
        ]

        for provider, model, prompt_tokens, completion_tokens, expected_cost in test_cases:
            log = service.record_usage(
                user_id=test_user.id,
                provider=provider,
                model=model,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
            )

            assert float(log.estimated_cost) == pytest.approx(expected_cost, rel=0.01), (
                f"Cost mismatch for {provider}/{model}: "
                f"expected {expected_cost}, got {float(log.estimated_cost)}"
            )
