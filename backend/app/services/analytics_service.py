"""
Analytics Dashboard Service

Comprehensive analytics for AI usage, costs, performance metrics, and optimization impact.
Aggregates data from all components (caching, optimization, streaming, budget, etc).
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class AnalyticsMetrics:
    """Core analytics metrics"""
    total_api_calls: int
    total_tokens_used: int
    total_cost: Decimal
    average_cost_per_call: Decimal
    cache_hit_rate: float
    optimization_reduction_percentage: float
    streaming_adoption_rate: float


@dataclass
class ProviderMetrics:
    """Metrics for a specific provider"""
    provider_name: str
    total_calls: int
    total_tokens: int
    total_cost: Decimal
    avg_response_time_ms: float
    success_rate: float
    error_count: int


@dataclass
class PerformanceMetrics:
    """Performance tracking"""
    cache_hits: int
    cache_misses: int
    optimized_requests: int
    batch_optimized_requests: int
    streaming_requests: int
    avg_optimization_reduction: float
    avg_response_time: float


class AnalyticsService:
    """Service for collecting and reporting analytics"""

    def __init__(self):
        """Initialize analytics service"""
        self.metrics_store = {}
        logger.info("AnalyticsService initialized")

    def record_api_call(
        self,
        provider: str,
        model: str,
        tokens_used: int,
        cost: Decimal,
        response_time_ms: float,
        success: bool = True,
        from_cache: bool = False,
        optimized: bool = False,
    ) -> None:
        """
        Record an API call.

        Args:
            provider: AI provider
            model: Model used
            tokens_used: Tokens consumed
            cost: Cost incurred
            response_time_ms: Response time in milliseconds
            success: Whether call succeeded
            from_cache: Whether response came from cache
            optimized: Whether prompt was optimized

        Example:
            analytics.record_api_call(
                "gemini",
                "gemini-2.0-flash",
                1250,
                Decimal("0.0001"),
                45.2,
                success=True,
                from_cache=True,
                optimized=True
            )
        """
        call_data = {
            "provider": provider,
            "model": model,
            "tokens": tokens_used,
            "cost": cost,
            "response_time": response_time_ms,
            "success": success,
            "cached": from_cache,
            "optimized": optimized,
            "timestamp": datetime.utcnow().isoformat(),
        }

        if provider not in self.metrics_store:
            self.metrics_store[provider] = []

        self.metrics_store[provider].append(call_data)
        logger.debug(f"Recorded API call: {provider}/{model} - {tokens_used} tokens")

    def get_overall_metrics(self) -> AnalyticsMetrics:
        """
        Get overall analytics metrics.

        Returns:
            AnalyticsMetrics with aggregated data

        Example:
            metrics = analytics.get_overall_metrics()
            print(f"Total cost: ${metrics.total_cost}")
        """
        total_calls = 0
        total_tokens = 0
        total_cost = Decimal("0")
        cache_hits = 0
        total_cached_eligible = 0
        total_optimized = 0
        total_streaming = 0
        optimization_reductions = []

        for provider_calls in self.metrics_store.values():
            for call in provider_calls:
                total_calls += 1
                total_tokens += call["tokens"]
                total_cost += call["cost"]

                if call["cached"]:
                    cache_hits += 1
                total_cached_eligible += 1

                if call["optimized"]:
                    total_optimized += 1

                # Estimated streaming adoption
                if call["response_time"] < 1000:  # Sub-second response
                    total_streaming += 1

        avg_cost_per_call = (
            total_cost / total_calls if total_calls > 0 else Decimal("0")
        )
        cache_hit_rate = (
            (cache_hits / total_cached_eligible * 100)
            if total_cached_eligible > 0
            else 0.0
        )
        optimization_rate = (
            (total_optimized / total_calls * 100) if total_calls > 0 else 0.0
        )
        streaming_rate = (
            (total_streaming / total_calls * 100) if total_calls > 0 else 0.0
        )

        return AnalyticsMetrics(
            total_api_calls=total_calls,
            total_tokens_used=total_tokens,
            total_cost=total_cost,
            average_cost_per_call=avg_cost_per_call,
            cache_hit_rate=cache_hit_rate,
            optimization_reduction_percentage=optimization_rate,
            streaming_adoption_rate=streaming_rate,
        )

    def get_provider_metrics(self, provider: str) -> ProviderMetrics:
        """
        Get metrics for specific provider.

        Args:
            provider: Provider name

        Returns:
            ProviderMetrics for the provider

        Example:
            metrics = analytics.get_provider_metrics("gemini")
        """
        if provider not in self.metrics_store:
            return ProviderMetrics(
                provider_name=provider,
                total_calls=0,
                total_tokens=0,
                total_cost=Decimal("0"),
                avg_response_time_ms=0.0,
                success_rate=100.0,
                error_count=0,
            )

        calls = self.metrics_store[provider]
        total_calls = len(calls)
        total_tokens = sum(call["tokens"] for call in calls)
        total_cost = sum(call["cost"] for call in calls)
        avg_response_time = (
            sum(call["response_time"] for call in calls) / total_calls
            if total_calls > 0
            else 0.0
        )
        successful = sum(1 for call in calls if call["success"])
        success_rate = (successful / total_calls * 100) if total_calls > 0 else 0.0
        error_count = total_calls - successful

        return ProviderMetrics(
            provider_name=provider,
            total_calls=total_calls,
            total_tokens=total_tokens,
            total_cost=total_cost,
            avg_response_time_ms=avg_response_time,
            success_rate=success_rate,
            error_count=error_count,
        )

    def get_provider_breakdown(self) -> Dict[str, Dict[str, Any]]:
        """
        Get breakdown by provider.

        Returns:
            Dict with metrics for each provider

        Example:
            breakdown = analytics.get_provider_breakdown()
            for provider, metrics in breakdown.items():
                print(f"{provider}: ${metrics['total_cost']}")
        """
        breakdown = {}
        for provider in self.metrics_store.keys():
            metrics = self.get_provider_metrics(provider)
            breakdown[provider] = {
                "total_calls": metrics.total_calls,
                "total_tokens": metrics.total_tokens,
                "total_cost": float(metrics.total_cost),
                "avg_response_time_ms": round(metrics.avg_response_time_ms, 2),
                "success_rate": round(metrics.success_rate, 2),
                "error_count": metrics.error_count,
            }

        return breakdown

    def get_cost_trends(self, days: int = 7) -> Dict[str, Any]:
        """
        Get cost trends over time.

        Args:
            days: Number of days to analyze

        Returns:
            Dict with cost trend data

        Example:
            trends = analytics.get_cost_trends(days=30)
        """
        today = datetime.utcnow().date()
        start_date = today - timedelta(days=days)

        daily_costs = {}
        for provider_calls in self.metrics_store.values():
            for call in provider_calls:
                timestamp = datetime.fromisoformat(call["timestamp"])
                call_date = timestamp.date()

                if call_date >= start_date:
                    date_key = call_date.isoformat()
                    if date_key not in daily_costs:
                        daily_costs[date_key] = Decimal("0")
                    daily_costs[date_key] += call["cost"]

        total_trend_cost = sum(daily_costs.values())
        avg_daily_cost = (
            total_trend_cost / len(daily_costs) if daily_costs else Decimal("0")
        )

        return {
            "period_days": days,
            "daily_breakdown": {
                date: float(cost) for date, cost in sorted(daily_costs.items())
            },
            "total_period_cost": float(total_trend_cost),
            "average_daily_cost": float(avg_daily_cost),
            "cost_trend": "increasing" if len(daily_costs) > 1 and
            list(daily_costs.values())[-1] > list(daily_costs.values())[0]
            else "stable",
        }

    def get_optimization_impact(self) -> Dict[str, Any]:
        """
        Get impact of optimization features.

        Returns:
            Dict with optimization statistics

        Example:
            impact = analytics.get_optimization_impact()
        """
        total_calls = 0
        optimized_calls = 0
        cached_calls = 0
        estimated_savings = Decimal("0")

        for provider_calls in self.metrics_store.values():
            for call in provider_calls:
                total_calls += 1
                if call["optimized"]:
                    optimized_calls += 1
                    # Estimate 20% token reduction per optimization
                    estimated_savings += call["cost"] * Decimal("0.20")

                if call["cached"]:
                    cached_calls += 1
                    # Estimate 100% savings for cached responses
                    estimated_savings += call["cost"]

        optimization_rate = (
            optimized_calls / total_calls * 100 if total_calls > 0 else 0.0
        )
        cache_rate = cached_calls / total_calls * 100 if total_calls > 0 else 0.0

        return {
            "total_requests": total_calls,
            "optimized_requests": optimized_calls,
            "optimization_rate_percent": round(optimization_rate, 2),
            "cached_requests": cached_calls,
            "cache_hit_rate_percent": round(cache_rate, 2),
            "estimated_savings": float(estimated_savings),
            "combined_impact": round(
                (optimized_calls + cached_calls) / total_calls * 100
                if total_calls > 0
                else 0.0,
                2,
            ),
        }

    def get_dashboard_summary(self) -> Dict[str, Any]:
        """
        Get comprehensive dashboard summary.

        Returns:
            Dict with all key metrics for dashboard

        Example:
            summary = analytics.get_dashboard_summary()
        """
        overall = self.get_overall_metrics()
        breakdown = self.get_provider_breakdown()
        trends = self.get_cost_trends(7)
        optimization = self.get_optimization_impact()

        return {
            "summary": {
                "total_api_calls": overall.total_api_calls,
                "total_tokens_used": overall.total_tokens_used,
                "total_cost_usd": float(overall.total_cost),
                "average_cost_per_call": float(overall.average_cost_per_call),
            },
            "performance": {
                "cache_hit_rate_percent": round(overall.cache_hit_rate, 2),
                "optimization_adoption_percent": round(
                    overall.optimization_reduction_percentage, 2
                ),
                "streaming_adoption_percent": round(
                    overall.streaming_adoption_rate, 2
                ),
            },
            "provider_breakdown": breakdown,
            "cost_trends": trends,
            "optimization_impact": optimization,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def get_performance_report(self) -> Dict[str, Any]:
        """
        Get detailed performance report.

        Returns:
            Dict with detailed performance metrics

        Example:
            report = analytics.get_performance_report()
        """
        overall = self.get_overall_metrics()
        providers = list(self.metrics_store.keys())

        return {
            "report_type": "Performance Report",
            "generated_at": datetime.utcnow().isoformat(),
            "summary": {
                "total_requests": overall.total_api_calls,
                "total_tokens": overall.total_tokens_used,
                "total_cost": float(overall.total_cost),
                "providers": len(providers),
            },
            "metrics": {
                "cache_efficiency": overall.cache_hit_rate,
                "optimization_impact": overall.optimization_reduction_percentage,
                "streaming_adoption": overall.streaming_adoption_rate,
            },
            "providers": providers,
        }

    def clear_metrics(self) -> None:
        """Clear all collected metrics"""
        self.metrics_store.clear()
        logger.warning("All metrics cleared")

    def export_metrics_json(self) -> str:
        """
        Export metrics as JSON.

        Returns:
            JSON string representation of metrics

        Example:
            json_str = analytics.export_metrics_json()
        """
        import json

        dashboard = self.get_dashboard_summary()
        return json.dumps(dashboard, indent=2, default=str)

    def get_metrics_summary_text(self) -> str:
        """
        Get human-readable metrics summary.

        Returns:
            Formatted text summary

        Example:
            summary = analytics.get_metrics_summary_text()
            print(summary)
        """
        overall = self.get_overall_metrics()
        optimization = self.get_optimization_impact()

        summary = f"""
╔════════════════════════════════════════════════════════════╗
║           AI GATEWAY ANALYTICS SUMMARY                     ║
╚════════════════════════════════════════════════════════════╝

📊 OVERALL METRICS
  • Total API Calls: {overall.total_api_calls:,}
  • Total Tokens Used: {overall.total_tokens_used:,}
  • Total Cost: ${float(overall.total_cost):.4f}
  • Average Cost per Call: ${float(overall.average_cost_per_call):.6f}

⚡ PERFORMANCE
  • Cache Hit Rate: {overall.cache_hit_rate:.2f}%
  • Optimization Adoption: {overall.optimization_reduction_percentage:.2f}%
  • Streaming Adoption: {overall.streaming_adoption_rate:.2f}%

💰 OPTIMIZATION IMPACT
  • Optimized Requests: {optimization['optimized_requests']:,}
  • Cached Requests: {optimization['cached_requests']:,}
  • Estimated Savings: ${optimization['estimated_savings']:.4f}
  • Combined Impact: {optimization['combined_impact']:.2f}%

════════════════════════════════════════════════════════════
Generated: {datetime.utcnow().isoformat()}
"""
        return summary
