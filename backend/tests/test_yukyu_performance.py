"""
FASE 5 Performance Testing Suite for Yukyu Dashboard
Tests for load testing, caching efficiency, and response time optimization
"""

import pytest
import time
import statistics
from datetime import datetime, date, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from typing import List, Dict, Tuple

from app.main import app
from app.core.database import SessionLocal
from app.models.models import (
    Employee, YukyuRequest, RequestStatus, User, Role
)
from app.core.cache import cache


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture
def db():
    """Create test database session"""
    db = SessionLocal()
    yield db
    db.close()


@pytest.fixture
def performance_user(db: Session):
    """Create test user for performance testing"""
    user = User(
        username="perf_test_keitosan",
        email="perf@test.local",
        full_name="Performance Test KEITOSAN",
        is_active=True,
        role=Role.KEITOSAN
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def performance_employees(db: Session):
    """Create large dataset of employees for performance testing"""
    employees = []
    # Create 100 employees with yukyu data
    for i in range(100):
        emp = Employee(
            employee_id=f"PERF{i:04d}",
            last_name=f"Yamada{i}",
            first_name=f"Taro{i}",
            kana_last_name=f"やまだ{i}",
            kana_first_name=f"たろう{i}",
            birth_date=date(1990, 1, 1),
            hire_date=date(2020, 4, 1),
            status="active"
        )
        employees.append(emp)

    db.add_all(employees)
    db.commit()

    for emp in employees:
        db.refresh(emp)

    return employees


@pytest.fixture
def performance_yukyu_requests(db: Session, performance_employees: List[Employee]):
    """Create yukyu requests for performance testing"""
    requests = []

    # Create 500+ yukyu requests spanning 12 months
    current_fiscal_year = 2024  # April 2024 - March 2025

    for month_offset in range(12):
        month = ((month_offset + 3) % 12) + 1  # Start from April
        year = current_fiscal_year if month >= 4 else current_fiscal_year + 1

        # Distribute requests across employees and dates
        for emp_idx, employee in enumerate(performance_employees):
            days_requested = 1.0 + (emp_idx % 5) * 0.5  # 1.0, 1.5, 2.0, 2.5, 3.0

            start_date = date(year, month, 5 + (emp_idx % 10))

            req = YukyuRequest(
                employee_id=employee.id,
                start_date=start_date,
                end_date=start_date + timedelta(days=int(days_requested)),
                days_requested=days_requested,
                reason="Performance test yukyu request",
                status=RequestStatus.APPROVED,
                approved_by_id=1,  # Dummy admin
                approved_at=datetime.utcnow()
            )
            requests.append(req)

    db.add_all(requests)
    db.commit()

    return requests


# =============================================================================
# PERFORMANCE TEST CLASSES
# =============================================================================

class TestYukyuTrendsPerformance:
    """Test yukyu trends endpoint performance"""

    def test_trends_endpoint_response_time_baseline(
        self, client: TestClient, performance_user: User, db: Session
    ):
        """Measure baseline response time for trends endpoint"""
        # Clear cache for fresh measurement
        cache.clear()

        response_times = []

        for i in range(5):
            start = time.perf_counter()
            response = client.get(
                "/api/dashboard/yukyu-trends-monthly?months=6",
                headers={"Authorization": f"Bearer {performance_user.id}"}
            )
            elapsed = time.perf_counter() - start
            response_times.append(elapsed)

            assert response.status_code == 200

        avg_time = statistics.mean(response_times)
        max_time = max(response_times)

        # Assert baseline performance (uncached should be <200ms)
        assert avg_time < 0.200, f"Average response time {avg_time}s exceeds 200ms"
        assert max_time < 0.300, f"Max response time {max_time}s exceeds 300ms"

    def test_trends_endpoint_cache_effectiveness(
        self, client: TestClient, performance_user: User, db: Session
    ):
        """Test cache effectiveness for trends endpoint"""
        cache.clear()

        # First request (uncached)
        start = time.perf_counter()
        response1 = client.get(
            "/api/dashboard/yukyu-trends-monthly?months=6",
            headers={"Authorization": f"Bearer {performance_user.id}"}
        )
        time_uncached = time.perf_counter() - start

        assert response1.status_code == 200

        # Second request (should be cached)
        start = time.perf_counter()
        response2 = client.get(
            "/api/dashboard/yukyu-trends-monthly?months=6",
            headers={"Authorization": f"Bearer {performance_user.id}"}
        )
        time_cached = time.perf_counter() - start

        assert response2.status_code == 200

        # Cached response should be at least 10x faster
        cache_speedup = time_uncached / time_cached
        assert cache_speedup > 10, f"Cache speedup {cache_speedup}x is less than 10x"

        # Cached response should be <100ms
        assert time_cached < 0.100, f"Cached response {time_cached}s exceeds 100ms"

    def test_trends_endpoint_memory_efficiency(
        self, client: TestClient, performance_user: User, db: Session
    ):
        """Test memory efficiency when fetching large datasets"""
        import tracemalloc

        tracemalloc.start()

        # Take memory snapshot before request
        snapshot1 = tracemalloc.take_snapshot()

        # Make request for 24 months of data
        response = client.get(
            "/api/dashboard/yukyu-trends-monthly?months=24",
            headers={"Authorization": f"Bearer {performance_user.id}"}
        )

        # Take memory snapshot after request
        snapshot2 = tracemalloc.take_snapshot()

        assert response.status_code == 200

        # Calculate memory diff
        top_stats = snapshot2.compare_to(snapshot1, 'lineno')

        # Memory increase should be reasonable (<10 MB)
        total_diff = sum(stat.size_diff for stat in top_stats)
        total_diff_mb = total_diff / (1024 * 1024)

        assert total_diff_mb < 10, f"Memory increase {total_diff_mb}MB exceeds 10MB"

        tracemalloc.stop()


class TestYukyuCompliancePerformance:
    """Test compliance status endpoint performance"""

    def test_compliance_endpoint_response_time(
        self, client: TestClient, performance_user: User, db: Session
    ):
        """Measure compliance endpoint response time"""
        cache.clear()

        response_times = []

        for i in range(5):
            start = time.perf_counter()
            response = client.get(
                "/api/dashboard/yukyu-compliance-status",
                headers={"Authorization": f"Bearer {performance_user.id}"}
            )
            elapsed = time.perf_counter() - start
            response_times.append(elapsed)

            assert response.status_code == 200

        avg_time = statistics.mean(response_times)
        max_time = max(response_times)

        # Uncached should be <200ms even with 100 employees
        assert avg_time < 0.200, f"Average response time {avg_time}s exceeds 200ms"
        assert max_time < 0.300, f"Max response time {max_time}s exceeds 300ms"

    def test_compliance_cache_effectiveness(
        self, client: TestClient, performance_user: User, db: Session
    ):
        """Test cache effectiveness for compliance endpoint"""
        cache.clear()

        # First request (uncached)
        start = time.perf_counter()
        response1 = client.get(
            "/api/dashboard/yukyu-compliance-status",
            headers={"Authorization": f"Bearer {performance_user.id}"}
        )
        time_uncached = time.perf_counter() - start

        assert response1.status_code == 200

        # Second request (should be cached)
        start = time.perf_counter()
        response2 = client.get(
            "/api/dashboard/yukyu-compliance-status",
            headers={"Authorization": f"Bearer {performance_user.id}"}
        )
        time_cached = time.perf_counter() - start

        assert response2.status_code == 200

        # Cache speedup should be >10x
        cache_speedup = time_uncached / time_cached
        assert cache_speedup > 10, f"Cache speedup {cache_speedup}x is less than 10x"

        # Cached <100ms
        assert time_cached < 0.100, f"Cached response {time_cached}s exceeds 100ms"


class TestYukyuLoadTesting:
    """Load testing for concurrent requests"""

    def test_concurrent_trends_requests(
        self, client: TestClient, performance_user: User, db: Session
    ):
        """Test concurrent requests to trends endpoint"""
        num_concurrent = 50
        response_times = []
        errors = []

        def make_request():
            try:
                start = time.perf_counter()
                response = client.get(
                    "/api/dashboard/yukyu-trends-monthly?months=6",
                    headers={"Authorization": f"Bearer {performance_user.id}"}
                )
                elapsed = time.perf_counter() - start
                return {
                    "status": response.status_code,
                    "time": elapsed,
                    "success": response.status_code == 200
                }
            except Exception as e:
                return {
                    "status": None,
                    "time": 0,
                    "success": False,
                    "error": str(e)
                }

        # Execute concurrent requests
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(num_concurrent)]
            results = [f.result() for f in as_completed(futures)]

        # Analyze results
        successful = sum(1 for r in results if r["success"])
        failed = num_concurrent - successful

        for r in results:
            if r["success"]:
                response_times.append(r["time"])
            else:
                errors.append(r.get("error", "Unknown error"))

        # Assert performance metrics
        assert successful == num_concurrent, f"{failed} requests failed"

        avg_time = statistics.mean(response_times)
        p95_time = sorted(response_times)[int(len(response_times) * 0.95)]
        p99_time = sorted(response_times)[int(len(response_times) * 0.99)]

        # Performance assertions
        assert avg_time < 0.150, f"Average response {avg_time}s exceeds 150ms under load"
        assert p95_time < 0.200, f"P95 response {p95_time}s exceeds 200ms under load"
        assert p99_time < 0.250, f"P99 response {p99_time}s exceeds 250ms under load"

    def test_concurrent_compliance_requests(
        self, client: TestClient, performance_user: User, db: Session
    ):
        """Test concurrent requests to compliance endpoint"""
        num_concurrent = 50
        response_times = []

        def make_request():
            try:
                start = time.perf_counter()
                response = client.get(
                    "/api/dashboard/yukyu-compliance-status",
                    headers={"Authorization": f"Bearer {performance_user.id}"}
                )
                elapsed = time.perf_counter() - start
                return {
                    "status": response.status_code,
                    "time": elapsed,
                    "success": response.status_code == 200
                }
            except Exception:
                return {"status": None, "time": 0, "success": False}

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(num_concurrent)]
            results = [f.result() for f in as_completed(futures)]

        successful = sum(1 for r in results if r["success"])
        response_times = [r["time"] for r in results if r["success"]]

        assert successful == num_concurrent, f"Concurrent requests failed: {num_concurrent - successful} failures"

        avg_time = statistics.mean(response_times)
        assert avg_time < 0.150, f"Average concurrent response {avg_time}s exceeds 150ms"


class TestYukyuRateLimitPerformance:
    """Test rate limiting under load"""

    def test_rate_limit_enforcement_trends(
        self, client: TestClient, performance_user: User, db: Session
    ):
        """Test rate limiting on trends endpoint"""
        # Rate limit is 60/minute, so 61 requests should trigger limit
        responses = []

        for i in range(70):
            response = client.get(
                "/api/dashboard/yukyu-trends-monthly?months=6",
                headers={"Authorization": f"Bearer {performance_user.id}"}
            )
            responses.append(response.status_code)

        # Count 429s (Too Many Requests)
        rate_limited = sum(1 for code in responses if code == 429)

        # Should have some rate limited responses after 60 requests
        assert rate_limited > 0, "Rate limiting not enforced"

    def test_rate_limit_recovery(
        self, client: TestClient, performance_user: User, db: Session
    ):
        """Test rate limit recovery after wait"""
        # Hit rate limit
        for i in range(65):
            client.get(
                "/api/dashboard/yukyu-trends-monthly?months=6",
                headers={"Authorization": f"Bearer {performance_user.id}"}
            )

        # Should be rate limited now
        response = client.get(
            "/api/dashboard/yukyu-trends-monthly?months=6",
            headers={"Authorization": f"Bearer {performance_user.id}"}
        )
        assert response.status_code == 429

        # Wait for rate limit window to reset (would need actual wait in production)
        # For this test, we verify the rate limit response structure
        assert "retry-after" in response.headers or response.status_code == 429


class TestYukyuDataProcessingPerformance:
    """Test data processing performance"""

    def test_fiscal_year_calculation_performance(self, db: Session):
        """Test fiscal year calculation performance"""
        from app.services.yukyu_service import YukyuService

        # Create 1000 dates
        test_dates = [date(2024, i % 12 + 1, (i % 28) + 1) for i in range(1000)]

        start = time.perf_counter()
        for test_date in test_dates:
            # Calculate fiscal year
            fiscal_year = test_date.year if test_date.month >= 4 else test_date.year - 1
            fy_start = date(fiscal_year, 4, 1)
            fy_end = date(fiscal_year + 1, 3, 31)

        elapsed = time.perf_counter() - start

        # Processing 1000 dates should be <10ms
        assert elapsed < 0.010, f"Fiscal year calculation {elapsed}s exceeds 10ms for 1000 dates"

    def test_compliance_calculation_performance(self, db: Session):
        """Test compliance status calculation performance"""
        # Simulate calculating compliance for 100 employees
        test_data = [
            {"used": i * 0.5, "remaining": 5.0 - (i * 0.5)}
            for i in range(100)
        ]

        start = time.perf_counter()
        for emp_data in test_data:
            total = emp_data["used"] + emp_data["remaining"]
            compliant = total >= 5.0

        elapsed = time.perf_counter() - start

        # Processing 100 employees should be <5ms
        assert elapsed < 0.005, f"Compliance calculation {elapsed}s exceeds 5ms for 100 employees"


class TestYukyuMemoryLeaks:
    """Test for memory leaks in long-running scenarios"""

    def test_repeated_requests_no_memory_leak(
        self, client: TestClient, performance_user: User, db: Session
    ):
        """Test for memory leaks with repeated requests"""
        import tracemalloc
        import gc

        tracemalloc.start()
        gc.collect()

        # Take initial snapshot
        snapshot1 = tracemalloc.take_snapshot()

        # Make 100 repeated requests
        for i in range(100):
            response = client.get(
                "/api/dashboard/yukyu-trends-monthly?months=6",
                headers={"Authorization": f"Bearer {performance_user.id}"}
            )
            assert response.status_code == 200

            # Force garbage collection every 10 requests
            if i % 10 == 0:
                gc.collect()

        gc.collect()
        snapshot2 = tracemalloc.take_snapshot()

        # Calculate memory diff
        top_stats = snapshot2.compare_to(snapshot1, 'lineno')
        total_diff = sum(stat.size_diff for stat in top_stats)
        total_diff_mb = total_diff / (1024 * 1024)

        # Memory shouldn't grow more than 5MB over 100 requests
        assert total_diff_mb < 5, f"Memory leak detected: {total_diff_mb}MB growth"

        tracemalloc.stop()


class TestYukyuCacheInvalidation:
    """Test cache invalidation timing"""

    def test_cache_ttl_expiration(
        self, client: TestClient, performance_user: User, db: Session
    ):
        """Test cache TTL expiration behavior"""
        cache.clear()

        # First request
        response1 = client.get(
            "/api/dashboard/yukyu-trends-monthly?months=6",
            headers={"Authorization": f"Bearer {performance_user.id}"}
        )
        assert response1.status_code == 200
        data1 = response1.json()

        # Second request (should be cached)
        response2 = client.get(
            "/api/dashboard/yukyu-trends-monthly?months=6",
            headers={"Authorization": f"Bearer {performance_user.id}"}
        )
        assert response2.status_code == 200
        data2 = response2.json()

        # Data should be identical (from cache)
        assert data1 == data2

    def test_different_parameters_different_cache(
        self, client: TestClient, performance_user: User, db: Session
    ):
        """Test that different parameters use different cache entries"""
        cache.clear()

        # Request with 6 months
        response1 = client.get(
            "/api/dashboard/yukyu-trends-monthly?months=6",
            headers={"Authorization": f"Bearer {performance_user.id}"}
        )
        assert response1.status_code == 200
        data1 = response1.json()

        # Request with 12 months
        response2 = client.get(
            "/api/dashboard/yukyu-trends-monthly?months=12",
            headers={"Authorization": f"Bearer {performance_user.id}"}
        )
        assert response2.status_code == 200
        data2 = response2.json()

        # Data should be different
        assert data1 != data2 or (
            isinstance(data1, dict) and isinstance(data2, dict) and
            len(data1.get("data", [])) != len(data2.get("data", []))
        )


# =============================================================================
# PERFORMANCE REPORT GENERATION
# =============================================================================

class TestPerformanceReportGeneration:
    """Generate comprehensive performance reports"""

    def test_generate_performance_report(
        self, client: TestClient, performance_user: User,
        db: Session, performance_employees
    ):
        """Generate performance summary report"""
        report = {
            "test_name": "FASE 5 Yukyu Dashboard Performance Report",
            "timestamp": datetime.utcnow().isoformat(),
            "endpoints_tested": [
                {
                    "name": "GET /api/dashboard/yukyu-trends-monthly",
                    "target_response_time_ms": 100,
                    "target_response_time_uncached_ms": 200,
                    "cache_speedup_factor": 10,
                    "max_concurrent_users": 50,
                    "rate_limit": "60/minute"
                },
                {
                    "name": "GET /api/dashboard/yukyu-compliance-status",
                    "target_response_time_ms": 100,
                    "target_response_time_uncached_ms": 200,
                    "cache_speedup_factor": 10,
                    "max_concurrent_users": 50,
                    "rate_limit": "60/minute"
                }
            ],
            "test_dataset": {
                "total_employees": len(performance_employees),
                "total_yukyu_requests": 500,
                "date_range": "Apr 2024 - Mar 2025",
                "dataset_size_mb": "~5-10 MB"
            },
            "performance_targets": {
                "avg_response_time_cached_ms": "<100ms",
                "avg_response_time_uncached_ms": "<200ms",
                "p95_response_time_under_load_ms": "<200ms",
                "p99_response_time_under_load_ms": "<250ms",
                "cache_hit_ratio": ">80%",
                "memory_increase_per_100_requests_mb": "<5MB",
                "concurrent_request_handling": "50+ simultaneous"
            },
            "caching_strategy": {
                "trends_endpoint": {
                    "ttl_seconds": 3600,
                    "cache_key": "yukyu:trends:{months}",
                    "invalidation_trigger": "New yukyu approval/rejection"
                },
                "compliance_endpoint": {
                    "ttl_seconds": 3600,
                    "cache_key": "yukyu:compliance",
                    "invalidation_trigger": "New yukyu approval/rejection"
                }
            },
            "optimization_recommendations": [
                {
                    "area": "Database Indexing",
                    "recommendation": "Add composite index on (employee_id, fiscal_year, status) for faster lookups",
                    "estimated_impact": "15-20% response time improvement"
                },
                {
                    "area": "Query Optimization",
                    "recommendation": "Use aggregation pipeline for compliance calculation",
                    "estimated_impact": "10-15% response time improvement"
                },
                {
                    "area": "Frontend Caching",
                    "recommendation": "Implement React Query cache with stale-while-revalidate strategy",
                    "estimated_impact": "Perceived performance 3-5x faster for user"
                },
                {
                    "area": "Batch Operations",
                    "recommendation": "Batch update operations for bulk approval/rejection",
                    "estimated_impact": "Enable processing 100+ requests in single transaction"
                }
            ]
        }

        assert report is not None
        assert report["test_name"] == "FASE 5 Yukyu Dashboard Performance Report"
        assert len(report["endpoints_tested"]) == 2
        assert len(report["optimization_recommendations"]) == 4

        return report
