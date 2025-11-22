#!/usr/bin/env python3

"""
JPUNS Advanced Metrics Exporter

Propósito: Exportar métricas avanzadas de Yukyu a Prometheus
Incluye: Métricas de performance, compliance, cache efectividad

Uso: python3 advanced-metrics-exporter.py [--port PORT] [--debug]
"""

import time
import json
import psycopg2
import redis
from prometheus_client import start_http_server, Gauge, Counter, Histogram
import logging
import argparse

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database config
DB_CONFIG = {
    'host': 'jpuns-postgres-monitoring',
    'port': 5432,
    'database': 'jpuns_production',
    'user': 'postgres',
    'password': 'postgres'
}

# Redis config
REDIS_HOST = 'jpuns-redis-monitoring'
REDIS_PORT = 6379

# Prometheus metrics
yukyu_requests_total = Counter(
    'yukyu_requests_total',
    'Total Yukyu requests processed',
    ['status', 'fiscal_year']
)

yukyu_compliance_percentage = Gauge(
    'yukyu_compliance_percentage',
    'Yukyu compliance percentage by employee',
    ['employee_id', 'fiscal_year']
)

yukyu_balance_days = Gauge(
    'yukyu_balance_days',
    'Current Yukyu balance in days',
    ['employee_id', 'fiscal_year']
)

yukyu_deduction_total = Gauge(
    'yukyu_deduction_total',
    'Total deduction in yen for Yukyu',
    ['employee_id', 'fiscal_year']
)

yukyu_approval_rate = Gauge(
    'yukyu_approval_rate',
    'Yukyu approval rate percentage',
    ['fiscal_year']
)

yukyu_average_response_time = Histogram(
    'yukyu_api_response_time_seconds',
    'Yukyu API response time',
    ['endpoint'],
    buckets=(0.1, 0.25, 0.5, 1.0, 2.5, 5.0)
)

yukyu_cache_hit_rate = Gauge(
    'yukyu_cache_hit_rate',
    'Yukyu cache hit rate percentage',
    ['endpoint']
)

fiscal_year_days_remaining = Gauge(
    'fiscal_year_days_remaining',
    'Days remaining in fiscal year',
    ['fiscal_year']
)

# Database connection
def get_db_connection():
    """Get PostgreSQL connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return None

# Redis connection
def get_redis_connection():
    """Get Redis connection"""
    try:
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        r.ping()
        return r
    except Exception as e:
        logger.error(f"Redis connection error: {e}")
        return None

# Collect Yukyu metrics
def collect_yukyu_metrics():
    """Collect Yukyu-specific metrics from database"""
    conn = get_db_connection()
    if not conn:
        logger.warning("Skipping Yukyu metrics - database unavailable")
        return

    try:
        cur = conn.cursor()

        # Get total requests by status and fiscal year
        cur.execute("""
            SELECT
                CASE WHEN approval_date IS NOT NULL THEN 'approved' ELSE 'pending' END as status,
                EXTRACT(YEAR FROM request_date)::int as fiscal_year,
                COUNT(*) as total
            FROM yukyu_requests
            GROUP BY status, fiscal_year
        """)

        for status, fiscal_year, count in cur.fetchall():
            yukyu_requests_total.labels(status=status, fiscal_year=str(fiscal_year)).inc(count)

        # Get compliance percentage
        cur.execute("""
            SELECT
                employee_id,
                fiscal_year,
                ROUND((days_used::FLOAT / entitlement_days) * 100, 2) as compliance
            FROM yukyu_compliance_view
            WHERE fiscal_year = EXTRACT(YEAR FROM CURRENT_DATE)::int
        """)

        for emp_id, fy, compliance in cur.fetchall():
            yukyu_compliance_percentage.labels(
                employee_id=str(emp_id),
                fiscal_year=str(fy)
            ).set(compliance)

        # Get balance
        cur.execute("""
            SELECT
                employee_id,
                fiscal_year,
                ROUND((entitlement_days - days_used)::NUMERIC, 2) as balance
            FROM yukyu_compliance_view
            WHERE fiscal_year = EXTRACT(YEAR FROM CURRENT_DATE)::int
        """)

        for emp_id, fy, balance in cur.fetchall():
            yukyu_balance_days.labels(
                employee_id=str(emp_id),
                fiscal_year=str(fy)
            ).set(balance)

        # Get total deductions
        cur.execute("""
            SELECT
                employee_id,
                fiscal_year,
                SUM(days_used * teiji_hours * hourly_rate) as total_deduction
            FROM yukyu_requests
            WHERE approval_date IS NOT NULL
            GROUP BY employee_id, fiscal_year
        """)

        for emp_id, fy, deduction in cur.fetchall():
            if deduction:  # Handle NULL
                yukyu_deduction_total.labels(
                    employee_id=str(emp_id),
                    fiscal_year=str(fy)
                ).set(float(deduction))

        # Get approval rate
        cur.execute("""
            SELECT
                EXTRACT(YEAR FROM request_date)::int as fiscal_year,
                ROUND((COUNT(CASE WHEN approval_date IS NOT NULL THEN 1 END)::FLOAT / COUNT(*)) * 100, 2) as approval_rate
            FROM yukyu_requests
            GROUP BY fiscal_year
        """)

        for fy, rate in cur.fetchall():
            yukyu_approval_rate.labels(fiscal_year=str(fy)).set(rate)

        # Get days remaining in fiscal year
        cur.execute("""
            SELECT
                EXTRACT(YEAR FROM CURRENT_DATE)::int as fiscal_year,
                CASE
                    WHEN EXTRACT(MONTH FROM CURRENT_DATE) < 4 THEN
                        EXTRACT(DAY FROM ('2024-03-31'::date - CURRENT_DATE))
                    ELSE
                        EXTRACT(DAY FROM ('2025-03-31'::date - CURRENT_DATE))
                END as days_remaining
        """)

        for fy, days in cur.fetchall():
            fiscal_year_days_remaining.labels(fiscal_year=str(fy)).set(int(days))

        logger.info("Yukyu metrics collected successfully")

    except Exception as e:
        logger.error(f"Error collecting Yukyu metrics: {e}")
    finally:
        cur.close()
        conn.close()

# Collect cache metrics
def collect_cache_metrics():
    """Collect cache effectiveness metrics"""
    r = get_redis_connection()
    if not r:
        logger.warning("Skipping cache metrics - Redis unavailable")
        return

    try:
        # Calculate cache hit rate for different endpoints
        endpoints = [
            '/api/dashboard/yukyu-trends-monthly',
            '/api/dashboard/yukyu-compliance-status',
            '/api/dashboard/yukyu-pending-requests',
            '/api/dashboard/yukyu-metrics'
        ]

        for endpoint in endpoints:
            hits_key = f"cache:hits:{endpoint}"
            misses_key = f"cache:misses:{endpoint}"

            hits = int(r.get(hits_key) or 0)
            misses = int(r.get(misses_key) or 0)

            total = hits + misses
            if total > 0:
                hit_rate = (hits / total) * 100
                yukyu_cache_hit_rate.labels(endpoint=endpoint).set(hit_rate)
                logger.info(f"Cache hit rate for {endpoint}: {hit_rate:.2f}%")

    except Exception as e:
        logger.error(f"Error collecting cache metrics: {e}")

# Main metrics collection loop
def collect_all_metrics():
    """Main metrics collection"""
    logger.info("Starting metrics collection...")

    while True:
        try:
            collect_yukyu_metrics()
            collect_cache_metrics()
            logger.info("Metrics updated successfully")
        except Exception as e:
            logger.error(f"Error in metrics collection loop: {e}")

        # Collect every 30 seconds
        time.sleep(30)

# CLI
def main():
    parser = argparse.ArgumentParser(description='JPUNS Advanced Metrics Exporter')
    parser.add_argument('--port', type=int, default=8001, help='Port for metrics server (default: 8001)')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    logger.info(f"Starting metrics server on port {args.port}")

    # Start metrics server
    start_http_server(args.port)

    # Collect metrics in background
    try:
        collect_all_metrics()
    except KeyboardInterrupt:
        logger.info("Shutting down...")

if __name__ == '__main__':
    main()
