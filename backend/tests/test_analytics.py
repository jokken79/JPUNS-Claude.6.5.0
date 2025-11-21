"""
Comprehensive test suite for analytics service
Tests cover metrics tracking, reporting, and data analysis
"""

import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from app.services.analytics_service import AnalyticsService, AnalyticsMetrics, ProviderMetrics


class TestAnalyticsServiceInitialization:
    """Test AnalyticsService initialization"""

    def test_analytics_service_creates(self):
        """Test AnalyticsService initializes"""
        service = AnalyticsService()
        assert service is not None
        assert service.metrics_store == {}

    def test_analytics_has_empty_store(self):
        """Test analytics starts with empty metrics"""
        service = AnalyticsService()
        assert len(service.metrics_store) == 0


class TestRecordingAPICall:
    """Test recording API calls"""

    def test_record_single_call(self):
        """Test recording a single API call"""
        service = AnalyticsService()
        service.record_api_call(
            "gemini",
            "gemini-2.0-flash",
            1250,
            Decimal("0.0001"),
            45.2,
        )
        assert "gemini" in service.metrics_store
        assert len(service.metrics_store["gemini"]) == 1

    def test_record_multiple_calls_same_provider(self):
        """Test recording multiple calls from same provider"""
        service = AnalyticsService()
        for i in range(5):
            service.record_api_call(
                "gemini",
                "gemini-2.0-flash",
                1000 * (i + 1),
                Decimal("0.0001") * (i + 1),
                50.0,
            )
        assert len(service.metrics_store["gemini"]) == 5

    def test_record_calls_different_providers(self):
        """Test recording calls from different providers"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1250, Decimal("0.0001"), 45.2)
        service.record_api_call("openai", "gpt-4", 1000, Decimal("0.0003"), 100.0)

        assert len(service.metrics_store) == 2
        assert "gemini" in service.metrics_store
        assert "openai" in service.metrics_store

    def test_record_call_with_cache(self):
        """Test recording cached API call"""
        service = AnalyticsService()
        service.record_api_call(
            "gemini",
            "gemini-2.0-flash",
            1250,
            Decimal("0.0001"),
            1.2,  # Very fast response
            from_cache=True,
        )
        call = service.metrics_store["gemini"][0]
        assert call["cached"] is True

    def test_record_call_with_optimization(self):
        """Test recording optimized API call"""
        service = AnalyticsService()
        service.record_api_call(
            "gemini",
            "gemini-2.0-flash",
            1000,  # Reduced from optimization
            Decimal("0.00008"),
            45.2,
            optimized=True,
        )
        call = service.metrics_store["gemini"][0]
        assert call["optimized"] is True

    def test_record_call_with_error(self):
        """Test recording failed API call"""
        service = AnalyticsService()
        service.record_api_call(
            "gemini",
            "gemini-2.0-flash",
            0,
            Decimal("0"),
            500.0,
            success=False,
        )
        call = service.metrics_store["gemini"][0]
        assert call["success"] is False


class TestOverallMetrics:
    """Test overall metrics calculation"""

    def test_overall_metrics_empty(self):
        """Test overall metrics with no data"""
        service = AnalyticsService()
        metrics = service.get_overall_metrics()
        assert metrics.total_api_calls == 0
        assert metrics.total_tokens_used == 0
        assert metrics.total_cost == Decimal("0")

    def test_overall_metrics_single_call(self):
        """Test overall metrics with single call"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1250, Decimal("0.0001"), 45.2)

        metrics = service.get_overall_metrics()
        assert metrics.total_api_calls == 1
        assert metrics.total_tokens_used == 1250
        assert metrics.total_cost == Decimal("0.0001")

    def test_overall_metrics_aggregation(self):
        """Test overall metrics aggregates correctly"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 45.0)
        service.record_api_call("openai", "gpt-4", 500, Decimal("0.0002"), 100.0)

        metrics = service.get_overall_metrics()
        assert metrics.total_api_calls == 2
        assert metrics.total_tokens_used == 1500
        assert metrics.total_cost == Decimal("0.0003")

    def test_overall_metrics_cache_hit_rate(self):
        """Test cache hit rate calculation"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 45.0, from_cache=True)
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 100.0, from_cache=False)

        metrics = service.get_overall_metrics()
        assert metrics.cache_hit_rate == 50.0  # 1 out of 2

    def test_overall_metrics_avg_cost_per_call(self):
        """Test average cost per call"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 45.0)
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0002"), 45.0)

        metrics = service.get_overall_metrics()
        assert metrics.average_cost_per_call == Decimal("0.00015")


class TestProviderMetrics:
    """Test provider-specific metrics"""

    def test_provider_metrics_empty(self):
        """Test provider metrics with no data"""
        service = AnalyticsService()
        metrics = service.get_provider_metrics("nonexistent")

        assert metrics.provider_name == "nonexistent"
        assert metrics.total_calls == 0
        assert metrics.total_tokens == 0
        assert metrics.total_cost == Decimal("0")

    def test_provider_metrics_single_provider(self):
        """Test metrics for single provider"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 50.0)
        service.record_api_call("gemini", "gemini-pro", 500, Decimal("0.00005"), 30.0)

        metrics = service.get_provider_metrics("gemini")
        assert metrics.total_calls == 2
        assert metrics.total_tokens == 1500
        assert metrics.total_cost == Decimal("0.00015")

    def test_provider_metrics_success_rate(self):
        """Test provider success rate calculation"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 45.0, success=True)
        service.record_api_call("gemini", "gemini-2.0-flash", 0, Decimal("0"), 500.0, success=False)

        metrics = service.get_provider_metrics("gemini")
        assert metrics.success_rate == 50.0  # 1 out of 2
        assert metrics.error_count == 1

    def test_provider_metrics_avg_response_time(self):
        """Test average response time calculation"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 100.0)
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 200.0)

        metrics = service.get_provider_metrics("gemini")
        assert metrics.avg_response_time_ms == 150.0  # (100 + 200) / 2


class TestProviderBreakdown:
    """Test provider breakdown"""

    def test_provider_breakdown_empty(self):
        """Test breakdown with no data"""
        service = AnalyticsService()
        breakdown = service.get_provider_breakdown()
        assert len(breakdown) == 0

    def test_provider_breakdown_multiple_providers(self):
        """Test breakdown with multiple providers"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 45.0)
        service.record_api_call("openai", "gpt-4", 500, Decimal("0.0002"), 100.0)

        breakdown = service.get_provider_breakdown()
        assert len(breakdown) == 2
        assert "gemini" in breakdown
        assert "openai" in breakdown
        assert breakdown["gemini"]["total_calls"] == 1
        assert breakdown["openai"]["total_calls"] == 1


class TestCostTrends:
    """Test cost trend analysis"""

    def test_cost_trends_empty(self):
        """Test trends with no data"""
        service = AnalyticsService()
        trends = service.get_cost_trends(days=7)

        assert trends["period_days"] == 7
        assert len(trends["daily_breakdown"]) == 0

    def test_cost_trends_single_day(self):
        """Test trends with single day"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 45.0)

        trends = service.get_cost_trends(days=7)
        assert len(trends["daily_breakdown"]) >= 1


class TestOptimizationImpact:
    """Test optimization impact analysis"""

    def test_optimization_impact_no_data(self):
        """Test optimization impact with no data"""
        service = AnalyticsService()
        impact = service.get_optimization_impact()

        assert impact["total_requests"] == 0
        assert impact["optimized_requests"] == 0
        assert impact["cached_requests"] == 0

    def test_optimization_impact_with_optimization(self):
        """Test optimization impact with optimized requests"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 45.0, optimized=True)
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 45.0, optimized=False)

        impact = service.get_optimization_impact()
        assert impact["total_requests"] == 2
        assert impact["optimized_requests"] == 1
        assert impact["optimization_rate_percent"] == 50.0

    def test_optimization_impact_with_caching(self):
        """Test optimization impact with cached requests"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 45.0, from_cache=True)
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 100.0, from_cache=False)

        impact = service.get_optimization_impact()
        assert impact["cached_requests"] == 1
        assert impact["cache_hit_rate_percent"] == 50.0


class TestDashboardSummary:
    """Test dashboard summary generation"""

    def test_dashboard_summary_empty(self):
        """Test dashboard summary with no data"""
        service = AnalyticsService()
        dashboard = service.get_dashboard_summary()

        assert dashboard["summary"]["total_api_calls"] == 0
        assert dashboard["summary"]["total_cost_usd"] == 0.0

    def test_dashboard_summary_complete(self):
        """Test complete dashboard summary"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 45.0)

        dashboard = service.get_dashboard_summary()
        assert "summary" in dashboard
        assert "performance" in dashboard
        assert "provider_breakdown" in dashboard
        assert "cost_trends" in dashboard
        assert "optimization_impact" in dashboard
        assert "timestamp" in dashboard


class TestDataExport:
    """Test data export functionality"""

    def test_export_metrics_json(self):
        """Test exporting metrics as JSON"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 45.0)

        json_str = service.export_metrics_json()
        assert json_str is not None
        assert isinstance(json_str, str)
        assert "summary" in json_str

    def test_metrics_summary_text(self):
        """Test human-readable metrics summary"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 45.0)

        summary = service.get_metrics_summary_text()
        assert "ANALYTICS SUMMARY" in summary
        assert "Total API Calls" in summary
        assert "Total Cost" in summary


class TestClearMetrics:
    """Test clearing metrics"""

    def test_clear_metrics(self):
        """Test clearing all metrics"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 45.0)

        assert len(service.metrics_store) > 0
        service.clear_metrics()
        assert len(service.metrics_store) == 0


class TestAnalyticsMetrics:
    """Test AnalyticsMetrics dataclass"""

    def test_analytics_metrics_creation(self):
        """Test AnalyticsMetrics dataclass"""
        metrics = AnalyticsMetrics(
            total_api_calls=100,
            total_tokens_used=125000,
            total_cost=Decimal("10.00"),
            average_cost_per_call=Decimal("0.10"),
            cache_hit_rate=50.0,
            optimization_reduction_percentage=20.0,
            streaming_adoption_rate=30.0,
        )
        assert metrics.total_api_calls == 100
        assert metrics.total_cost == Decimal("10.00")


class TestProviderMetricsDataclass:
    """Test ProviderMetrics dataclass"""

    def test_provider_metrics_creation(self):
        """Test ProviderMetrics dataclass"""
        metrics = ProviderMetrics(
            provider_name="gemini",
            total_calls=50,
            total_tokens=62500,
            total_cost=Decimal("5.00"),
            avg_response_time_ms=45.0,
            success_rate=95.0,
            error_count=5,
        )
        assert metrics.provider_name == "gemini"
        assert metrics.success_rate == 95.0


class TestAnalyticsDataTypes:
    """Test data type handling in analytics"""

    def test_decimal_cost_precision(self):
        """Test Decimal maintains cost precision"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.000123"), 45.0)

        metrics = service.get_overall_metrics()
        assert metrics.total_cost == Decimal("0.000123")

    def test_timestamp_recording(self):
        """Test timestamp is recorded"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 45.0)

        call = service.metrics_store["gemini"][0]
        assert "timestamp" in call
        assert call["timestamp"] is not None


class TestAnalyticsConsistency:
    """Test consistency of analytics calculations"""

    def test_consistent_metrics_calculation(self):
        """Test metrics calculation is consistent"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 45.0)

        metrics1 = service.get_overall_metrics()
        metrics2 = service.get_overall_metrics()

        assert metrics1.total_api_calls == metrics2.total_api_calls
        assert metrics1.total_cost == metrics2.total_cost

    def test_provider_metrics_consistency(self):
        """Test provider metrics are consistent"""
        service = AnalyticsService()
        service.record_api_call("gemini", "gemini-2.0-flash", 1000, Decimal("0.0001"), 45.0)

        metrics1 = service.get_provider_metrics("gemini")
        metrics2 = service.get_provider_metrics("gemini")

        assert metrics1.total_calls == metrics2.total_calls
        assert metrics1.total_cost == metrics2.total_cost
