#!/usr/bin/env python3

"""
JPUNS Capacity Planning Calculator

Propósito: Predecir requisitos de recursos basado en crecimiento
Calcula:
  - Storage requirements projection
  - Memory requirements
  - CPU requirements
  - Network bandwidth
  - Scaling timeline

Uso: python3 capacity-planner.py [--months N] [--growth-rate RATE]
"""

import json
import argparse
from datetime import datetime, timedelta
import statistics

class CapacityPlanner:
    def __init__(self, months=12, growth_rate=0.15):
        """
        growth_rate: monthly growth rate (default 15%)
        months: projection period (default 12 months)
        """
        self.months = months
        self.growth_rate = growth_rate

        # Current metrics (baseline)
        self.baseline = {
            'users': 100,
            'daily_requests': 50000,
            'storage_gb': 150,
            'peak_cpu_percent': 45,
            'peak_memory_mb': 2048,
            'avg_request_time_ms': 150,
        }

        # Thresholds
        self.thresholds = {
            'cpu': 80,
            'memory': 85,
            'disk': 80,
            'response_time': 1000,  # ms
        }

        # Resource costs (example pricing)
        self.costs = {
            'cpu': 0.05,  # $ per CPU-hour
            'memory': 0.01,  # $ per GB-month
            'storage': 0.023,  # $ per GB-month (AWS S3)
        }

    def project_metric(self, baseline, growth_rate, months):
        """Project metric value over time"""
        projections = [baseline]
        for _ in range(months):
            projections.append(projections[-1] * (1 + growth_rate))
        return projections

    def calculate_storage_requirements(self):
        """Calculate projected storage needs"""
        projections = self.project_metric(
            self.baseline['storage_gb'],
            self.growth_rate,
            self.months
        )

        return {
            'metric': 'Storage (GB)',
            'current': projections[0],
            'projected_3mo': projections[3],
            'projected_6mo': projections[6],
            'projected_12mo': projections[12] if len(projections) > 12 else projections[-1],
            'retention_days': 30,
            'monthly_cost_current': projections[0] * self.costs['storage'],
            'monthly_cost_projected': projections[-1] * self.costs['storage'],
        }

    def calculate_memory_requirements(self):
        """Calculate projected memory needs"""
        projections = self.project_metric(
            self.baseline['peak_memory_mb'],
            self.growth_rate,
            self.months
        )

        memory_gb = [m / 1024 for m in projections]

        return {
            'metric': 'Peak Memory (GB)',
            'current': memory_gb[0],
            'projected_3mo': memory_gb[3],
            'projected_6mo': memory_gb[6],
            'projected_12mo': memory_gb[12] if len(memory_gb) > 12 else memory_gb[-1],
            'threshold': self.thresholds['memory'],
            'scaling_needed_at_month': self.find_threshold_month(memory_gb, 4.0),  # 4GB limit
        }

    def calculate_cpu_requirements(self):
        """Calculate projected CPU needs"""
        request_projections = self.project_metric(
            self.baseline['daily_requests'],
            self.growth_rate,
            self.months
        )

        # Estimate CPU based on requests (simplified)
        # Assume 10k requests per second requires 1 CPU at 50% utilization
        cpu_usage = [r / 10000 * 50 for r in request_projections]

        return {
            'metric': 'CPU Usage (%)',
            'current': cpu_usage[0],
            'projected_3mo': cpu_usage[3],
            'projected_6mo': cpu_usage[6],
            'projected_12mo': cpu_usage[12] if len(cpu_usage) > 12 else cpu_usage[-1],
            'threshold': self.thresholds['cpu'],
            'scaling_needed_at_month': self.find_threshold_month(cpu_usage, 80),
        }

    def calculate_request_scaling(self):
        """Calculate request volume projections"""
        projections = self.project_metric(
            self.baseline['daily_requests'],
            self.growth_rate,
            self.months
        )

        return {
            'metric': 'Daily Requests',
            'current': int(projections[0]),
            'projected_3mo': int(projections[3]),
            'projected_6mo': int(projections[6]),
            'projected_12mo': int(projections[12] if len(projections) > 12 else projections[-1]),
            'avg_requests_per_second': int(projections[0] / 86400),
        }

    def calculate_response_time_impact(self):
        """Calculate impact on response time"""
        request_projections = self.project_metric(
            self.baseline['daily_requests'],
            self.growth_rate,
            self.months
        )

        # Assume response time increases with load (non-linear)
        response_times = [self.baseline['avg_request_time_ms'] * (1 + (r / self.baseline['daily_requests'] - 1) * 2)
                         for r in request_projections]

        return {
            'metric': 'Response Time Impact (ms)',
            'current': response_times[0],
            'projected_3mo': response_times[3],
            'projected_6mo': response_times[6],
            'projected_12mo': response_times[12] if len(response_times) > 12 else response_times[-1],
            'threshold': self.thresholds['response_time'],
            'scaling_needed_at_month': self.find_threshold_month(response_times, 1000),
        }

    def find_threshold_month(self, projections, threshold):
        """Find when metric reaches threshold"""
        for i, value in enumerate(projections):
            if value >= threshold:
                return i
        return None

    def calculate_scaling_roadmap(self):
        """Generate scaling roadmap"""
        storage = self.calculate_storage_requirements()
        memory = self.calculate_memory_requirements()
        cpu = self.calculate_cpu_requirements()
        requests = self.calculate_request_scaling()

        scaling_events = []

        if memory['scaling_needed_at_month']:
            scaling_events.append({
                'month': memory['scaling_needed_at_month'],
                'action': 'Increase memory allocation',
                'reason': f"Memory reaching {self.thresholds['memory']}%",
                'estimate': f"Increase from {memory['current']:.1f}GB to {memory['current'] * 1.5:.1f}GB"
            })

        if cpu['scaling_needed_at_month']:
            scaling_events.append({
                'month': cpu['scaling_needed_at_month'],
                'action': 'Add CPU resources or optimize code',
                'reason': f"CPU reaching {self.thresholds['cpu']}%",
                'estimate': f"Scale horizontally or optimize hotspots"
            })

        if requests['projected_12mo'] > self.baseline['daily_requests'] * 5:
            scaling_events.append({
                'month': 12,
                'action': 'Plan for sharding/multi-instance',
                'reason': f"Request volume growing {5}x",
                'estimate': f"Implement database sharding or API gateway"
            })

        return sorted(scaling_events, key=lambda x: x['month'])

    def generate_report(self, output_format='text'):
        """Generate capacity planning report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'projection_period_months': self.months,
            'monthly_growth_rate': f"{self.growth_rate*100:.1f}%",
            'baseline': self.baseline,
            'calculations': {
                'storage': self.calculate_storage_requirements(),
                'memory': self.calculate_memory_requirements(),
                'cpu': self.calculate_cpu_requirements(),
                'requests': self.calculate_request_scaling(),
                'response_time': self.calculate_response_time_impact(),
            },
            'scaling_roadmap': self.calculate_scaling_roadmap(),
        }

        if output_format == 'json':
            return json.dumps(report, indent=2, default=str)
        else:
            return self.format_text_report(report)

    def format_text_report(self, report):
        """Format as readable text"""
        lines = []
        lines.append("\n" + "="*80)
        lines.append("  JPUNS CAPACITY PLANNING REPORT")
        lines.append("="*80)
        lines.append(f"Generated: {report['timestamp']}")
        lines.append(f"Projection Period: {report['projection_period_months']} months")
        lines.append(f"Monthly Growth Rate: {report['monthly_growth_rate']}")
        lines.append("")

        # Current baseline
        lines.append("\n📊 CURRENT BASELINE")
        lines.append("-"*80)
        for key, value in report['baseline'].items():
            lines.append(f"  {key:.<40} {value}")

        # Projections
        lines.append("\n\n📈 CAPACITY PROJECTIONS")
        lines.append("-"*80)

        for metric_name, metric_data in report['calculations'].items():
            lines.append(f"\n{metric_name.upper()}")
            for key, value in metric_data.items():
                if isinstance(value, float):
                    lines.append(f"  {key:.<40} {value:.2f}")
                else:
                    lines.append(f"  {key:.<40} {value}")

        # Scaling roadmap
        lines.append("\n\n🗓️ SCALING ROADMAP")
        lines.append("-"*80)
        if report['scaling_roadmap']:
            for i, event in enumerate(report['scaling_roadmap'], 1):
                lines.append(f"\n{i}. Month {event['month']}: {event['action']}")
                lines.append(f"   Reason: {event['reason']}")
                lines.append(f"   Estimate: {event['estimate']}")
        else:
            lines.append("\n  No scaling needed within projection period")

        # Recommendations
        lines.append("\n\n💡 RECOMMENDATIONS")
        lines.append("-"*80)
        lines.append("1. Monitor metrics monthly to validate projections")
        lines.append("2. Implement alerts for threshold approaching (85% of limit)")
        lines.append("3. Test scaling procedures before they're needed")
        lines.append("4. Consider over-provisioning by 50% for peak loads")
        lines.append("5. Review and adjust growth rate assumptions quarterly")

        lines.append("\n" + "="*80 + "\n")
        return '\n'.join(lines)

# CLI
def main():
    parser = argparse.ArgumentParser(description='JPUNS Capacity Planning Calculator')
    parser.add_argument('--months', type=int, default=12, help='Projection period in months (default: 12)')
    parser.add_argument('--growth-rate', type=float, default=0.15, help='Monthly growth rate (default: 0.15 = 15%)')
    parser.add_argument('--output', choices=['text', 'json'], default='text', help='Output format')
    args = parser.parse_args()

    planner = CapacityPlanner(months=args.months, growth_rate=args.growth_rate)
    print(planner.generate_report(output_format=args.output))

if __name__ == '__main__':
    main()
