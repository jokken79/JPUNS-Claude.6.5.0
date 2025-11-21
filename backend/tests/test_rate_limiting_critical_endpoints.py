"""
Test Rate Limiting for Critical Endpoints

Tests the rate limiting implementation for:
- /api/auth/login (5/minute)
- /api/salary/calculate (10/hour)
- /api/timer-cards/upload (20/hour)
"""

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import time


class TestLoginRateLimit:
    """Test /api/auth/login rate limit (5/minute)"""

    def test_login_allows_5_attempts_per_minute(self, client):
        """Test that login allows exactly 5 attempts per minute"""
        # Attempt 5 logins - all should succeed or fail with auth error (not rate limit)
        for i in range(5):
            response = client.post(
                "/api/auth/login",
                data={"username": f"test{i}", "password": "test"}
            )
            # Should not be rate limited
            assert response.status_code != 429, f"Request {i+1} was rate limited"

    def test_login_blocks_6th_attempt(self, client):
        """Test that login blocks 6th attempt within a minute"""
        # First 5 attempts
        for i in range(5):
            client.post(
                "/api/auth/login",
                data={"username": f"test{i}", "password": "test"}
            )

        # 6th attempt should be rate limited
        response = client.post(
            "/api/auth/login",
            data={"username": "test6", "password": "test"}
        )

        assert response.status_code == 429
        data = response.json()
        assert "error" in data
        assert "Rate limit exceeded" in data["error"]

    def test_login_rate_limit_includes_retry_after(self, client):
        """Test that rate limit response includes Retry-After header"""
        # Trigger rate limit
        for i in range(6):
            response = client.post(
                "/api/auth/login",
                data={"username": f"test{i}", "password": "test"}
            )

        # Check 6th response
        assert response.status_code == 429
        assert "Retry-After" in response.headers
        assert int(response.headers["Retry-After"]) == 60  # 1 minute

    def test_login_rate_limit_response_format(self, client):
        """Test that rate limit error response has correct format"""
        # Trigger rate limit
        for i in range(6):
            response = client.post(
                "/api/auth/login",
                data={"username": f"test{i}", "password": "test"}
            )

        data = response.json()
        assert "error" in data
        assert "message" in data
        assert "retry_after" in data
        assert "retry_after_human" in data
        assert "endpoint" in data
        assert data["retry_after"] == 60
        assert data["retry_after_human"] == "1 minute"
        assert data["endpoint"] == "/api/auth/login"


class TestSalaryCalculateRateLimit:
    """Test /api/salary/calculate rate limit (10/hour)"""

    @pytest.fixture
    def admin_token(self, client, test_admin_user):
        """Get admin authentication token"""
        response = client.post(
            "/api/auth/login",
            data={"username": test_admin_user.email, "password": "adminpass123"}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        return None

    def test_salary_calculate_allows_10_per_hour(self, client, admin_token):
        """Test that salary calculate allows 10 requests per hour"""
        if not admin_token:
            pytest.skip("Could not authenticate admin user")

        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First 10 requests should succeed
        for i in range(10):
            response = client.post(
                "/api/salary/calculate",
                headers=headers,
                json={
                    "employee_id": i + 1,
                    "month": 11,
                    "year": 2025,
                    "base_salary": 250000,
                    "worked_days": 22
                }
            )
            # Should not be rate limited (may fail for other reasons)
            assert response.status_code != 429, f"Request {i+1} was rate limited"

    def test_salary_calculate_blocks_11th_request(self, client, admin_token):
        """Test that salary calculate blocks 11th request"""
        if not admin_token:
            pytest.skip("Could not authenticate admin user")

        headers = {"Authorization": f"Bearer {admin_token}"}

        # Make 10 requests
        for i in range(10):
            client.post(
                "/api/salary/calculate",
                headers=headers,
                json={
                    "employee_id": i + 1,
                    "month": 11,
                    "year": 2025,
                    "base_salary": 250000,
                    "worked_days": 22
                }
            )

        # 11th request should be rate limited
        response = client.post(
            "/api/salary/calculate",
            headers=headers,
            json={
                "employee_id": 99,
                "month": 11,
                "year": 2025,
                "base_salary": 250000,
                "worked_days": 22
            }
        )

        assert response.status_code == 429
        data = response.json()
        assert data["retry_after"] == 3600  # 1 hour
        assert data["retry_after_human"] == "1 hour"

    def test_salary_calculate_retry_after_header(self, client, admin_token):
        """Test that salary calculate rate limit includes correct Retry-After"""
        if not admin_token:
            pytest.skip("Could not authenticate admin user")

        headers = {"Authorization": f"Bearer {admin_token}"}

        # Trigger rate limit
        for i in range(11):
            response = client.post(
                "/api/salary/calculate",
                headers=headers,
                json={
                    "employee_id": i + 1,
                    "month": 11,
                    "year": 2025,
                    "base_salary": 250000,
                    "worked_days": 22
                }
            )

        # Check headers
        assert "Retry-After" in response.headers
        assert int(response.headers["Retry-After"]) == 3600  # 1 hour in seconds


class TestTimerCardUploadRateLimit:
    """Test /api/timer-cards/upload rate limit (20/hour)"""

    @pytest.fixture
    def admin_token(self, client, test_admin_user):
        """Get admin authentication token"""
        response = client.post(
            "/api/auth/login",
            data={"username": test_admin_user.email, "password": "adminpass123"}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        return None

    @pytest.fixture
    def mock_pdf_file(self, tmp_path):
        """Create a mock PDF file for upload testing"""
        pdf_file = tmp_path / "test-timer-card.pdf"
        pdf_file.write_bytes(b"%PDF-1.4\ntest content")
        return pdf_file

    def test_timer_card_upload_allows_20_per_hour(self, client, admin_token, mock_pdf_file):
        """Test that timer card upload allows 20 uploads per hour"""
        if not admin_token:
            pytest.skip("Could not authenticate admin user")

        headers = {"Authorization": f"Bearer {admin_token}"}

        # Mock OCR service
        with patch("app.services.timer_card_ocr_service.process_timer_card") as mock_ocr:
            mock_ocr.return_value = {"success": True, "data": {}}

            # First 20 uploads should succeed
            for i in range(20):
                with open(mock_pdf_file, "rb") as f:
                    response = client.post(
                        "/api/timer-cards/upload",
                        headers=headers,
                        files={"file": ("test.pdf", f, "application/pdf")},
                        data={"factory_id": "1"}
                    )
                # Should not be rate limited
                assert response.status_code != 429, f"Upload {i+1} was rate limited"

    def test_timer_card_upload_blocks_21st_upload(self, client, admin_token, mock_pdf_file):
        """Test that timer card upload blocks 21st upload"""
        if not admin_token:
            pytest.skip("Could not authenticate admin user")

        headers = {"Authorization": f"Bearer {admin_token}"}

        with patch("app.services.timer_card_ocr_service.process_timer_card") as mock_ocr:
            mock_ocr.return_value = {"success": True, "data": {}}

            # Make 20 uploads
            for i in range(20):
                with open(mock_pdf_file, "rb") as f:
                    client.post(
                        "/api/timer-cards/upload",
                        headers=headers,
                        files={"file": ("test.pdf", f, "application/pdf")},
                        data={"factory_id": "1"}
                    )

            # 21st upload should be rate limited
            with open(mock_pdf_file, "rb") as f:
                response = client.post(
                    "/api/timer-cards/upload",
                    headers=headers,
                    files={"file": ("test.pdf", f, "application/pdf")},
                    data={"factory_id": "1"}
                )

            assert response.status_code == 429
            data = response.json()
            assert data["retry_after"] == 3600  # 1 hour
            assert data["retry_after_human"] == "1 hour"


class TestRateLimitHelperFunctions:
    """Test helper functions for rate limiting"""

    def test_calculate_retry_after_minute(self):
        """Test retry_after calculation for minute limits"""
        from app.core.rate_limiter import calculate_retry_after

        result = calculate_retry_after("5 per 1 minute")
        assert result == 60

    def test_calculate_retry_after_hour(self):
        """Test retry_after calculation for hour limits"""
        from app.core.rate_limiter import calculate_retry_after

        result = calculate_retry_after("10 per 1 hour")
        assert result == 3600

    def test_calculate_retry_after_day(self):
        """Test retry_after calculation for day limits"""
        from app.core.rate_limiter import calculate_retry_after

        result = calculate_retry_after("100 per 1 day")
        assert result == 86400

    def test_format_retry_time_seconds(self):
        """Test formatting seconds"""
        from app.core.rate_limiter import format_retry_time

        assert format_retry_time(30) == "30 seconds"
        assert format_retry_time(1) == "1 second"

    def test_format_retry_time_minutes(self):
        """Test formatting minutes"""
        from app.core.rate_limiter import format_retry_time

        assert format_retry_time(60) == "1 minute"
        assert format_retry_time(120) == "2 minutes"

    def test_format_retry_time_hours(self):
        """Test formatting hours"""
        from app.core.rate_limiter import format_retry_time

        assert format_retry_time(3600) == "1 hour"
        assert format_retry_time(7200) == "2 hours"

    def test_format_retry_time_days(self):
        """Test formatting days"""
        from app.core.rate_limiter import format_retry_time

        assert format_retry_time(86400) == "1 day"
        assert format_retry_time(172800) == "2 days"


class TestRedisBackend:
    """Test Redis backend integration"""

    def test_rate_limiter_uses_redis(self):
        """Test that rate limiter is configured to use Redis"""
        from app.core.rate_limiter import limiter, storage_uri

        assert "redis://" in storage_uri
        assert limiter is not None

    def test_storage_uri_priority(self):
        """Test storage URI selection priority"""
        from app.core.rate_limiter import get_storage_uri
        from app.core.config import settings

        uri = get_storage_uri()
        
        # Should use REDIS_URL if available
        if hasattr(settings, 'REDIS_URL'):
            assert "redis://" in uri
        else:
            # Fallback to memory:// if Redis not configured
            assert uri == "memory://"


class TestRateLimitLogging:
    """Test rate limit violation logging"""

    @patch("app.core.rate_limiter.logger")
    def test_rate_limit_logs_violation(self, mock_logger, client):
        """Test that rate limit violations are logged"""
        # Trigger rate limit
        for i in range(6):
            client.post(
                "/api/auth/login",
                data={"username": f"test{i}", "password": "test"}
            )

        # Verify logging was called
        assert mock_logger.warning.called
        call_args = mock_logger.warning.call_args
        assert "Rate limit exceeded" in str(call_args)


class TestConcurrentRequests:
    """Test rate limiting with concurrent requests"""

    def test_concurrent_login_attempts(self, client):
        """Test rate limiting with concurrent login attempts"""
        import concurrent.futures
        
        def make_login_request(i):
            return client.post(
                "/api/auth/login",
                data={"username": f"concurrent{i}", "password": "test"}
            )

        # Make 10 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_login_request, i) for i in range(10)]
            results = [f.result() for f in futures]

        # At least some should be rate limited (more than 5 total)
        rate_limited = sum(1 for r in results if r.status_code == 429)
        assert rate_limited >= 5, "Expected some requests to be rate limited"


# Integration test markers
pytestmark = [
    pytest.mark.integration,
    pytest.mark.rate_limiting
]
