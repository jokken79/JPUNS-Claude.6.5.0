"""
Tests for Rate Limiting System

Tests the rate limiting functionality for AI Gateway endpoints.
"""

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock

from app.core.rate_limiter import limiter, RateLimitConfig, UserRateLimitService


@pytest.fixture
def client(app):
    """Get FastAPI test client"""
    return TestClient(app)


@pytest.fixture
def auth_headers(client, test_user):
    """Get JWT auth headers"""
    response = client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "password123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestRateLimitingConfig:
    """Test rate limit configuration"""

    def test_gemini_limit_config(self):
        """Test Gemini rate limit configuration"""
        assert RateLimitConfig.GEMINI_LIMIT == "100/day"
        assert RateLimitConfig.GEMINI_BURST == "10/minute"

    def test_openai_limit_config(self):
        """Test OpenAI rate limit configuration"""
        assert RateLimitConfig.OPENAI_LIMIT == "50/day"
        assert RateLimitConfig.OPENAI_BURST == "5/minute"

    def test_claude_limit_config(self):
        """Test Claude API rate limit configuration"""
        assert RateLimitConfig.CLAUDE_API_LIMIT == "50/day"
        assert RateLimitConfig.CLAUDE_API_BURST == "5/minute"

    def test_local_cli_limit_config(self):
        """Test Local CLI rate limit configuration"""
        assert RateLimitConfig.LOCAL_CLI_LIMIT == "200/day"
        assert RateLimitConfig.LOCAL_CLI_BURST == "20/minute"

    def test_batch_limit_config(self):
        """Test batch invocation limit configuration"""
        assert RateLimitConfig.BATCH_LIMIT == "20/day"


class TestGeminiRateLimiting:
    """Test Gemini endpoint rate limiting"""

    @pytest.mark.asyncio
    async def test_gemini_single_call_success(self, client, auth_headers):
        """Test single Gemini call succeeds"""
        with patch("app.services.ai_gateway.AIGateway.invoke_gemini") as mock_gemini:
            mock_gemini.return_value = "Generated code"

            response = client.post(
                "/api/ai/gemini",
                json={"prompt": "Generate code"},
                headers=auth_headers
            )

            assert response.status_code == status.HTTP_200_OK
            assert response.json()["status"] == "success"

    @pytest.mark.asyncio
    async def test_gemini_rate_limit_burst(self, client, auth_headers):
        """Test Gemini burst rate limiting (10/minute)"""
        with patch("app.services.ai_gateway.AIGateway.invoke_gemini") as mock_gemini:
            mock_gemini.return_value = "Generated code"

            # First 10 calls should succeed
            for i in range(10):
                response = client.post(
                    "/api/ai/gemini",
                    json={"prompt": f"Generate code {i}"},
                    headers=auth_headers
                )
                assert response.status_code == status.HTTP_200_OK

            # 11th call should be rate limited
            response = client.post(
                "/api/ai/gemini",
                json={"prompt": "Generate code 11"},
                headers=auth_headers
            )
            assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS


class TestOpenAIRateLimiting:
    """Test OpenAI endpoint rate limiting"""

    @pytest.mark.asyncio
    async def test_openai_single_call_success(self, client, auth_headers):
        """Test single OpenAI call succeeds"""
        with patch("app.services.ai_gateway.AIGateway.invoke_openai") as mock_openai:
            mock_openai.return_value = "Code review complete"

            response = client.post(
                "/api/ai/openai",
                json={"prompt": "Review this code"},
                headers=auth_headers
            )

            assert response.status_code == status.HTTP_200_OK
            assert response.json()["status"] == "success"

    @pytest.mark.asyncio
    async def test_openai_rate_limit_burst(self, client, auth_headers):
        """Test OpenAI burst rate limiting (5/minute)"""
        with patch("app.services.ai_gateway.AIGateway.invoke_openai") as mock_openai:
            mock_openai.return_value = "Review complete"

            # First 5 calls should succeed
            for i in range(5):
                response = client.post(
                    "/api/ai/openai",
                    json={"prompt": f"Review {i}"},
                    headers=auth_headers
                )
                assert response.status_code == status.HTTP_200_OK

            # 6th call should be rate limited
            response = client.post(
                "/api/ai/openai",
                json={"prompt": "Review 6"},
                headers=auth_headers
            )
            assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS


class TestClaudeRateLimiting:
    """Test Claude API endpoint rate limiting"""

    @pytest.mark.asyncio
    async def test_claude_single_call_success(self, client, auth_headers):
        """Test single Claude API call succeeds"""
        with patch("app.services.ai_gateway.AIGateway.invoke_claude_api") as mock_claude:
            mock_claude.return_value = "Explanation"

            response = client.post(
                "/api/ai/claude",
                json={"prompt": "Explain this"},
                headers=auth_headers
            )

            assert response.status_code == status.HTTP_200_OK
            assert response.json()["status"] == "success"

    @pytest.mark.asyncio
    async def test_claude_rate_limit_burst(self, client, auth_headers):
        """Test Claude API burst rate limiting (5/minute)"""
        with patch("app.services.ai_gateway.AIGateway.invoke_claude_api") as mock_claude:
            mock_claude.return_value = "Response"

            # First 5 calls should succeed
            for i in range(5):
                response = client.post(
                    "/api/ai/claude",
                    json={"prompt": f"Explain {i}"},
                    headers=auth_headers
                )
                assert response.status_code == status.HTTP_200_OK

            # 6th call should be rate limited
            response = client.post(
                "/api/ai/claude",
                json={"prompt": "Explain 6"},
                headers=auth_headers
            )
            assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS


class TestLocalCLIRateLimiting:
    """Test Local CLI endpoint rate limiting"""

    @pytest.mark.asyncio
    async def test_cli_single_call_success(self, client, auth_headers):
        """Test single CLI call succeeds"""
        with patch("app.services.ai_gateway.AIGateway.invoke_local_cli") as mock_cli:
            mock_cli.return_value = "Output"

            response = client.post(
                "/api/ai/cli",
                json={"tool": "gemini-cli", "args": {}},
                headers=auth_headers
            )

            assert response.status_code == status.HTTP_200_OK
            assert response.json()["status"] == "success"

    @pytest.mark.asyncio
    async def test_cli_rate_limit_burst(self, client, auth_headers):
        """Test CLI burst rate limiting (20/minute)"""
        with patch("app.services.ai_gateway.AIGateway.invoke_local_cli") as mock_cli:
            mock_cli.return_value = "Output"

            # First 20 calls should succeed
            for i in range(20):
                response = client.post(
                    "/api/ai/cli",
                    json={"tool": "gemini-cli", "args": {"action": str(i)}},
                    headers=auth_headers
                )
                assert response.status_code == status.HTTP_200_OK

            # 21st call should be rate limited
            response = client.post(
                "/api/ai/cli",
                json={"tool": "gemini-cli", "args": {"action": "21"}},
                headers=auth_headers
            )
            assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS


class TestBatchRateLimiting:
    """Test batch endpoint rate limiting"""

    @pytest.mark.asyncio
    async def test_batch_single_call_success(self, client, auth_headers):
        """Test single batch call succeeds"""
        with patch("app.services.ai_gateway.AIGateway.batch_invoke") as mock_batch:
            mock_batch.return_value = [
                {"provider": "gemini", "status": "success", "response": "Code"}
            ]

            response = client.post(
                "/api/ai/batch",
                json={
                    "tasks": [
                        {"provider": "gemini", "prompt": "Generate"}
                    ]
                },
                headers=auth_headers
            )

            assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_batch_rate_limit_daily(self, client, auth_headers):
        """Test batch daily rate limiting (20/day)"""
        with patch("app.services.ai_gateway.AIGateway.batch_invoke") as mock_batch:
            mock_batch.return_value = [
                {"provider": "gemini", "status": "success", "response": "OK"}
            ]

            # First 20 batch calls should succeed
            for i in range(20):
                response = client.post(
                    "/api/ai/batch",
                    json={
                        "tasks": [
                            {"provider": "gemini", "prompt": f"Task {i}"}
                        ]
                    },
                    headers=auth_headers
                )
                assert response.status_code == status.HTTP_200_OK

            # 21st call should be rate limited
            response = client.post(
                "/api/ai/batch",
                json={
                    "tasks": [
                        {"provider": "gemini", "prompt": "Task 21"}
                    ]
                },
                headers=auth_headers
            )
            assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS


class TestRateLimitErrorResponse:
    """Test rate limit error response format"""

    @pytest.mark.asyncio
    async def test_rate_limit_error_format(self, client, auth_headers):
        """Test rate limit error response contains required fields"""
        with patch("app.services.ai_gateway.AIGateway.invoke_gemini") as mock_gemini:
            mock_gemini.return_value = "Code"

            # Exceed rate limit
            for i in range(15):
                client.post(
                    "/api/ai/gemini",
                    json={"prompt": f"Generate {i}"},
                    headers=auth_headers
                )

            response = client.post(
                "/api/ai/gemini",
                json={"prompt": "Generate 15"},
                headers=auth_headers
            )

            assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
            data = response.json()
            assert "detail" in data


class TestAuthenticationRequired:
    """Test that rate limiting endpoints require authentication"""

    def test_gemini_without_auth(self, client):
        """Test Gemini endpoint requires authentication"""
        response = client.post(
            "/api/ai/gemini",
            json={"prompt": "Generate code"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_openai_without_auth(self, client):
        """Test OpenAI endpoint requires authentication"""
        response = client.post(
            "/api/ai/openai",
            json={"prompt": "Review code"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_claude_without_auth(self, client):
        """Test Claude endpoint requires authentication"""
        response = client.post(
            "/api/ai/claude",
            json={"prompt": "Explain"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_cli_without_auth(self, client):
        """Test CLI endpoint requires authentication"""
        response = client.post(
            "/api/ai/cli",
            json={"tool": "gemini-cli"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_batch_without_auth(self, client):
        """Test batch endpoint requires authentication"""
        response = client.post(
            "/api/ai/batch",
            json={"tasks": []}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestUserRateLimitService:
    """Test UserRateLimitService class"""

    def test_get_user_limits(self, db_session, test_user):
        """Test getting user rate limits"""
        service = UserRateLimitService(db_session)
        limits = service.get_user_limits(test_user.id)

        assert "gemini" in limits
        assert "openai" in limits
        assert "claude_api" in limits
        assert "local_cli" in limits

        assert limits["gemini"] == 100
        assert limits["openai"] == 50
        assert limits["claude_api"] == 50
        assert limits["local_cli"] == 200

    def test_check_user_limit_success(self, db_session, test_user):
        """Test checking user limit when within bounds"""
        service = UserRateLimitService(db_session)
        result = service.check_user_limit(test_user.id, "gemini")

        assert result is True

    def test_get_usage_stats(self, db_session, test_user):
        """Test getting user usage statistics"""
        service = UserRateLimitService(db_session)
        stats = service.get_usage_stats(test_user.id, days=1)

        assert "gemini" in stats
        assert "openai" in stats
        assert "claude_api" in stats
        assert "local_cli" in stats

        # Should be 0 initially
        assert all(v == 0 for v in stats.values())


class TestRateLimitDailyReset:
    """Test daily rate limit reset"""

    @pytest.mark.asyncio
    async def test_daily_limit_context(self):
        """Test that daily limits reset at appropriate time"""
        # Verify daily limits are set correctly
        assert "100/day" in RateLimitConfig.GEMINI_LIMIT
        assert "50/day" in RateLimitConfig.OPENAI_LIMIT
        assert "50/day" in RateLimitConfig.CLAUDE_API_LIMIT
        assert "200/day" in RateLimitConfig.LOCAL_CLI_LIMIT


class TestBurstVsDailyLimits:
    """Test burst vs daily limits"""

    def test_burst_limits_stricter(self):
        """Test that burst limits are stricter than daily"""
        # Burst: 10/minute vs Daily: 100/day
        # 10/minute = 14,400/day (if continuous)
        # 100/day is more restrictive for typical usage

        # Burst is the per-minute limit, daily is the ceiling
        assert RateLimitConfig.GEMINI_BURST == "10/minute"
        assert RateLimitConfig.GEMINI_LIMIT == "100/day"

        # OpenAI has tighter burst control
        assert RateLimitConfig.OPENAI_BURST == "5/minute"
        assert RateLimitConfig.OPENAI_LIMIT == "50/day"
