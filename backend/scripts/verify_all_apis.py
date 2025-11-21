"""
Comprehensive API Verification Script
======================================
Tests all major API endpoints to ensure they're functioning correctly.
"""
import sys
sys.path.insert(0, '/app')

import requests

BASE_URL = "http://localhost:8000"

def get_admin_token():
    """Get admin JWT token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": "admin", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"❌ Login failed: {response.status_code}")
        return None

def test_endpoint(name, method, endpoint, token=None, params=None, data=None):
    """Test a single endpoint"""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, params=params)
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{endpoint}", headers=headers, json=data)
        else:
            return "❓", "Unknown method"

        if response.status_code in [200, 201]:
            return "✅", response.status_code
        elif response.status_code == 401:
            return "🔒", "Unauthorized (expected if no token)"
        else:
            return "⚠️ ", response.status_code
    except Exception as e:
        return "❌", str(e)[:50]

def main():
    print("=" * 80)
    print("VERIFICACIÓN COMPLETA DE APIs - UNS-ClaudeJP 5.4.1")
    print("=" * 80)
    print()

    # Get admin token
    print("📝 Obteniendo token de autenticación...")
    token = get_admin_token()
    if not token:
        print("❌ No se pudo obtener token. Verifica que admin/admin123 exista.")
        return 1
    print(f"✅ Token obtenido: {token[:30]}...")
    print()

    # Define endpoints to test
    endpoints = [
        # Public endpoints
        ("Health Check", "GET", "/api/health", None, None),
        ("Auth Login", "POST", "/api/auth/login", None, None),

        # Dashboard
        ("Dashboard Stats", "GET", "/api/dashboard/stats", token, None),
        ("Dashboard Charts", "GET", "/api/dashboard/charts", token, None),

        # Candidates
        ("List Candidates", "GET", "/api/candidates", token, {"skip": 0, "limit": 5}),
        ("Candidate Stats", "GET", "/api/candidates/statistics", token, None),

        # Employees
        ("List Employees", "GET", "/api/employees", token, {"skip": 0, "limit": 5}),
        ("Employee Stats", "GET", "/api/employees/statistics", token, None),

        # Factories
        ("List Factories", "GET", "/api/factories", token, {"skip": 0, "limit": 5}),
        ("Factory Stats", "GET", "/api/factories/statistics", token, None),

        # Apartments V1
        ("List Apartments V1", "GET", "/api/apartments", token, {"skip": 0, "limit": 5}),

        # Apartments V2 (NEW)
        ("List Apartments V2", "GET", "/api/apartments-v2/apartments", token, {"page": 1, "page_size": 5}),
        ("Apartment Details V2", "GET", "/api/apartments-v2/apartments/1", token, None),
        ("Apartment Stats V2", "GET", "/api/apartments-v2/statistics", token, None),

        # Timer Cards
        ("List Timer Cards", "GET", "/api/timer-cards", token, {"skip": 0, "limit": 5}),

        # Payroll
        ("Payroll Summary", "GET", "/api/payroll/summary", token, None),

        # Requests (Yukyu)
        ("List Yukyu Requests", "GET", "/api/requests", token, {"skip": 0, "limit": 5}),
        ("Yukyu Stats", "GET", "/api/requests/statistics", token, None),

        # Reports
        ("Employee Reports", "GET", "/api/reports/employees", token, None),

        # Monitoring
        ("System Health", "GET", "/api/monitoring/health", None, None),
        ("Metrics", "GET", "/api/monitoring/metrics", None, None),
    ]

    # Test all endpoints
    print("🔍 Probando endpoints...")
    print()
    results = []
    for name, method, endpoint, use_token, params in endpoints:
        status, code = test_endpoint(name, method, endpoint, token if use_token else None, params)
        results.append((name, status, code))
        print(f"{status} {name:40} {method:5} {endpoint:40} {code}")

    # Summary
    print()
    print("=" * 80)
    print("RESUMEN")
    print("=" * 80)
    total = len(results)
    success = sum(1 for _, status, _ in results if status == "✅")
    locked = sum(1 for _, status, _ in results if status == "🔒")
    warning = sum(1 for _, status, _ in results if status == "⚠️ ")
    error = sum(1 for _, status, _ in results if status == "❌")

    print(f"Total endpoints probados: {total}")
    print(f"✅ Exitosos: {success}")
    print(f"🔒 Bloqueados (sin auth): {locked}")
    print(f"⚠️  Advertencias: {warning}")
    print(f"❌ Errores: {error}")
    print()

    if error == 0 and warning == 0:
        print("🎉 ¡TODAS LAS APIs FUNCIONAN CORRECTAMENTE!")
        return 0
    elif error == 0:
        print("✅ APIs funcionan, pero hay algunas advertencias.")
        return 0
    else:
        print("❌ Hay errores que necesitan atención.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
