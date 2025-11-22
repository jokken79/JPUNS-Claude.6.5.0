#!/usr/bin/env python3

"""
JPUNS Log Analyzer

Propósito: Analizar logs y extraer insights de performance y errores
Genera reportes de:
  - Errores más frecuentes
  - Endpoints lentos
  - Patrones de uso
  - Anomalías

Uso: python3 log-analyzer.py [--service SERVICE] [--last-hours N] [--output FORMAT]
"""

import re
import json
import argparse
import subprocess
from collections import defaultdict, Counter
from datetime import datetime, timedelta
import statistics

class LogAnalyzer:
    def __init__(self, service='jpuns-backend', last_hours=24):
        self.service = service
        self.last_hours = last_hours
        self.logs = []
        self.errors = defaultdict(int)
        self.slow_endpoints = defaultdict(list)
        self.status_codes = Counter()
        self.response_times = defaultdict(list)

    def fetch_logs(self):
        """Fetch logs from Docker container"""
        try:
            cmd = [
                'docker', 'logs',
                '--since', f'{self.last_hours}h',
                self.service
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            self.logs = result.stdout.split('\n')
            print(f"✅ Fetched {len(self.logs)} log lines from {self.service}")
        except Exception as e:
            print(f"❌ Error fetching logs: {e}")
            return False
        return True

    def parse_http_logs(self):
        """Parse HTTP request/response logs"""
        # Pattern for typical HTTP log: METHOD PATH STATUS RESPONSE_TIME
        http_pattern = r'(\w+)\s+(/[^\s]*)\s+(\d{3})\s+(\d+)ms'

        for line in self.logs:
            match = re.search(http_pattern, line)
            if match:
                method, path, status, response_time = match.groups()
                status = int(status)
                response_time = int(response_time)

                # Track status codes
                self.status_codes[status] += 1

                # Track response times
                self.response_times[path].append(response_time)

                # Track slow endpoints (> 500ms)
                if response_time > 500:
                    self.slow_endpoints[path].append(response_time)

    def parse_error_logs(self):
        """Parse error messages"""
        error_patterns = [
            (r'ERROR:\s*(.+)', 'error'),
            (r'CRITICAL:\s*(.+)', 'critical'),
            (r'Exception:\s*(.+)', 'exception'),
            (r'ConnectionError:\s*(.+)', 'connection'),
            (r'TimeoutError:\s*(.+)', 'timeout'),
        ]

        for line in self.logs:
            for pattern, error_type in error_patterns:
                match = re.search(pattern, line)
                if match:
                    error_msg = match.group(1)[:100]  # First 100 chars
                    self.errors[f"{error_type}: {error_msg}"] += 1

    def generate_report(self, output_format='text'):
        """Generate analysis report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'service': self.service,
            'period_hours': self.last_hours,
            'total_logs': len(self.logs),
            'http_summary': self.get_http_summary(),
            'slowest_endpoints': self.get_slowest_endpoints(),
            'errors': dict(sorted(self.errors.items(), key=lambda x: x[1], reverse=True)[:10]),
            'status_distribution': dict(self.status_codes)
        }

        if output_format == 'json':
            return json.dumps(report, indent=2)
        else:
            return self.format_text_report(report)

    def get_http_summary(self):
        """Get HTTP status summary"""
        total = sum(self.status_codes.values())
        errors = sum(count for status, count in self.status_codes.items() if status >= 400)
        success = sum(count for status, count in self.status_codes.items() if status < 400)

        return {
            'total_requests': total,
            'success_rate': f"{(success/total*100):.2f}%" if total > 0 else "N/A",
            'error_rate': f"{(errors/total*100):.2f}%" if total > 0 else "N/A",
            'avg_response_time_ms': int(statistics.mean([t for times in self.response_times.values() for t in times])) if self.response_times else 0
        }

    def get_slowest_endpoints(self, top_n=5):
        """Get slowest endpoints"""
        endpoint_stats = []

        for endpoint, times in self.response_times.items():
            if times:
                endpoint_stats.append({
                    'endpoint': endpoint,
                    'avg_time_ms': int(statistics.mean(times)),
                    'max_time_ms': max(times),
                    'min_time_ms': min(times),
                    'samples': len(times)
                })

        return sorted(endpoint_stats, key=lambda x: x['avg_time_ms'], reverse=True)[:top_n]

    def format_text_report(self, report):
        """Format report as readable text"""
        output = []
        output.append("\n" + "="*70)
        output.append("  JPUNS LOG ANALYSIS REPORT")
        output.append("="*70)
        output.append(f"Service: {report['service']}")
        output.append(f"Period: Last {report['period_hours']} hours")
        output.append(f"Timestamp: {report['timestamp']}")
        output.append(f"Total log lines: {report['total_logs']}")
        output.append("")

        # HTTP Summary
        output.append("\n📊 HTTP SUMMARY")
        output.append("-" * 70)
        for key, value in report['http_summary'].items():
            output.append(f"  {key:.<40} {value}")

        # Status Distribution
        output.append("\n📈 STATUS CODE DISTRIBUTION")
        output.append("-" * 70)
        for status, count in sorted(report['status_distribution'].items()):
            percentage = (count / report['http_summary']['total_requests'] * 100) if report['http_summary']['total_requests'] > 0 else 0
            output.append(f"  {status}:.<40} {count:>5} ({percentage:>6.2f}%)")

        # Slowest Endpoints
        output.append("\n🐢 SLOWEST ENDPOINTS (Top 5)")
        output.append("-" * 70)
        for i, endpoint in enumerate(report['slowest_endpoints'], 1):
            output.append(f"  {i}. {endpoint['endpoint']}")
            output.append(f"     Avg: {endpoint['avg_time_ms']}ms | "
                        f"Max: {endpoint['max_time_ms']}ms | "
                        f"Min: {endpoint['min_time_ms']}ms | "
                        f"Samples: {endpoint['samples']}")

        # Top Errors
        output.append("\n❌ TOP ERRORS (Top 10)")
        output.append("-" * 70)
        for i, (error, count) in enumerate(list(report['errors'].items())[:10], 1):
            output.append(f"  {i}. {error[:60]}")
            output.append(f"     Occurrences: {count}")

        output.append("\n" + "="*70 + "\n")
        return '\n'.join(output)

    def analyze(self):
        """Run full analysis"""
        if not self.fetch_logs():
            return False

        print("📖 Parsing HTTP logs...")
        self.parse_http_logs()

        print("❌ Parsing error logs...")
        self.parse_error_logs()

        return True

# CLI
def main():
    parser = argparse.ArgumentParser(description='JPUNS Log Analyzer')
    parser.add_argument('--service', default='jpuns-backend', help='Docker service to analyze')
    parser.add_argument('--last-hours', type=int, default=24, help='Hours of logs to analyze (default: 24)')
    parser.add_argument('--output', choices=['text', 'json'], default='text', help='Output format')
    args = parser.parse_args()

    analyzer = LogAnalyzer(service=args.service, last_hours=args.last_hours)

    print(f"🔍 Analyzing logs for {args.service} (last {args.last_hours} hours)...")
    if analyzer.analyze():
        print(analyzer.generate_report(output_format=args.output))
    else:
        print("❌ Analysis failed")

if __name__ == '__main__':
    main()
