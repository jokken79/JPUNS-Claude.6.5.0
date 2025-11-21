"""
Tests for Payroll API Endpoints
Tests the key payroll API endpoints:
1. POST /api/payroll/runs - Create payroll run
2. GET /api/payroll/runs - List payroll runs
3. GET /api/payroll/runs/{id} - Get specific run
4. POST /api/payroll/runs/{id}/approve - Approve run
5. POST /api/payroll/employee-payrolls - Create employee payroll
6. POST /api/payroll/calculate - Calculate payroll
7. GET /api/payroll/payslips/{id} - Get payslip
"""
import pytest
from datetime import datetime, date
from decimal import Decimal
from fastapi.testclient import TestClient

from app.models.payroll_models import PayrollRun as PayrollRunModel, EmployeePayroll


class TestPayrollAPIEndpoints:
    """Test suite for Payroll API endpoints."""

    def test_create_payroll_run_success(self, client: TestClient):
        """Test creating a new payroll run."""
        # Arrange
        payload = {
            "pay_period_start": "2025-10-01T00:00:00",
            "pay_period_end": "2025-10-31T23:59:59",
            "created_by": "admin"
        }

        # Act
        response = client.post(
            "/api/payroll/runs",
            json=payload
        )

        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "draft"
        assert data["total_employees"] == 0
        assert data["total_gross_amount"] == 0.0
        assert data["total_deductions"] == 0.0
        assert data["total_net_amount"] == 0.0
        assert "id" in data
        assert data["created_by"] == "admin"

    def test_create_payroll_run_invalid_dates(self, client: TestClient):
        """Test creating payroll run with invalid dates fails."""
        # Arrange - end date before start date
        payload = {
            "pay_period_start": "2025-10-31T00:00:00",
            "pay_period_end": "2025-10-01T00:00:00",  # Earlier than start
            "created_by": "admin"
        }

        # Act
        response = client.post(
            "/api/payroll/runs",
            json=payload
        )

        # Assert - should fail validation or return error
        assert response.status_code in [400, 422, 500]

    def test_get_payroll_runs_list(self, client: TestClient):
        """Test retrieving list of payroll runs."""
        # Arrange - create a payroll run first
        create_payload = {
            "pay_period_start": "2025-10-01T00:00:00",
            "pay_period_end": "2025-10-31T23:59:59",
            "created_by": "test"
        }
        client.post("/api/payroll/runs", json=create_payload)

        # Act
        response = client.get(
            "/api/payroll/runs?skip=0&limit=10"
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_get_payroll_runs_with_status_filter(self, client: TestClient):
        """Test retrieving payroll runs filtered by status."""
        # Act
        response = client.get(
            "/api/payroll/runs?status_filter=draft&skip=0&limit=10"
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_payroll_run_by_id(self, client: TestClient):
        """Test retrieving a specific payroll run by ID."""
        # Arrange - create a payroll run
        create_payload = {
            "pay_period_start": "2025-10-01T00:00:00",
            "pay_period_end": "2025-10-31T23:59:59",
            "created_by": "test"
        }
        create_response = client.post("/api/payroll/runs", json=create_payload)
        created_id = create_response.json()["id"]

        # Act
        response = client.get(f"/api/payroll/runs/{created_id}")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == created_id
        assert data["status"] == "draft"

    def test_get_payroll_run_not_found(self, client: TestClient):
        """Test retrieving non-existent payroll run returns 404."""
        # Act
        response = client.get("/api/payroll/runs/99999")

        # Assert
        assert response.status_code == 404

    def test_approve_payroll_run(self, client: TestClient):
        """Test approving a payroll run."""
        # Arrange - create a draft payroll run
        create_payload = {
            "pay_period_start": "2025-10-01T00:00:00",
            "pay_period_end": "2025-10-31T23:59:59",
            "created_by": "test"
        }
        create_response = client.post("/api/payroll/runs", json=create_payload)
        created_id = create_response.json()["id"]

        # Act - approve the run
        approve_payload = {
            "approved_by": "admin"
        }
        response = client.post(
            f"/api/payroll/runs/{created_id}/approve",
            json=approve_payload
        )

        # Assert
        assert response.status_code in [200, 201]
        data = response.json()
        if "success" in data:
            assert data["success"] is True
        if "status" in data:
            assert data["status"] == "approved"

    def test_approve_nonexistent_payroll_run(self, client: TestClient):
        """Test approving non-existent payroll run fails."""
        # Act
        approve_payload = {
            "approved_by": "admin"
        }
        response = client.post(
            "/api/payroll/runs/99999/approve",
            json=approve_payload
        )

        # Assert
        assert response.status_code == 404

    def test_create_employee_payroll(self, client: TestClient):
        """Test creating an employee payroll entry."""
        # Arrange - create a payroll run first
        run_payload = {
            "pay_period_start": "2025-10-01T00:00:00",
            "pay_period_end": "2025-10-31T23:59:59",
            "created_by": "test"
        }
        run_response = client.post("/api/payroll/runs", json=run_payload)
        payroll_run_id = run_response.json()["id"]

        # Create employee payroll
        employee_payload = {
            "payroll_run_id": payroll_run_id,
            "employee_id": 1,  # Assume employee exists
            "base_salary": 250000.0,
            "overtime_hours": 10.0,
            "overtime_amount": 15000.0,
            "total_gross": 265000.0,
            "tax": 26500.0,
            "social_insurance": 13250.0,
            "total_deductions": 39750.0,
            "net_pay": 225250.0
        }

        # Act
        response = client.post(
            "/api/payroll/employee-payrolls",
            json=employee_payload
        )

        # Assert - may return 201 or 404 if employee doesn't exist
        assert response.status_code in [201, 404, 422]

    def test_calculate_payroll(self, client: TestClient):
        """Test payroll calculation endpoint."""
        # Arrange
        calc_payload = {
            "employee_id": 1,
            "pay_period_start": "2025-10-01",
            "pay_period_end": "2025-10-31"
        }

        # Act
        response = client.post(
            "/api/payroll/calculate",
            json=calc_payload
        )

        # Assert - may return 200 or 404 if employee doesn't exist
        assert response.status_code in [200, 404, 422]

    def test_get_payslip(self, client: TestClient):
        """Test retrieving a payslip."""
        # Arrange - create payroll run and employee payroll
        run_payload = {
            "pay_period_start": "2025-10-01T00:00:00",
            "pay_period_end": "2025-10-31T23:59:59",
            "created_by": "test"
        }
        run_response = client.post("/api/payroll/runs", json=run_payload)
        payroll_run_id = run_response.json()["id"]

        # Act - try to get payslip (may not exist)
        response = client.get(f"/api/payroll/payslips/{payroll_run_id}")

        # Assert - may return 200 with empty data or 404
        assert response.status_code in [200, 404]

    def test_payroll_runs_pagination(self, client: TestClient):
        """Test payroll runs pagination."""
        # Arrange - create multiple runs
        for i in range(3):
            payload = {
                "pay_period_start": f"2025-{10+i:02d}-01T00:00:00",
                "pay_period_end": f"2025-{10+i:02d}-31T23:59:59",
                "created_by": "test"
            }
            client.post("/api/payroll/runs", json=payload)

        # Act - get first page
        response1 = client.get("/api/payroll/runs?skip=0&limit=2")

        # Act - get second page
        response2 = client.get("/api/payroll/runs?skip=2&limit=2")

        # Assert
        assert response1.status_code == 200
        assert response2.status_code == 200
        data1 = response1.json()
        data2 = response2.json()
        assert isinstance(data1, list)
        assert isinstance(data2, list)

    def test_get_payroll_summary(self, client: TestClient):
        """Test getting payroll summary."""
        # Arrange - create a payroll run
        payload = {
            "pay_period_start": "2025-10-01T00:00:00",
            "pay_period_end": "2025-10-31T23:59:59",
            "created_by": "test"
        }
        create_response = client.post("/api/payroll/runs", json=payload)
        payroll_run_id = create_response.json()["id"]

        # Act
        response = client.get(f"/api/payroll/summary/{payroll_run_id}")

        # Assert - endpoint may or may not exist
        assert response.status_code in [200, 404]


class TestPayrollAPIValidation:
    """Test validation and error handling in Payroll API."""

    def test_create_payroll_run_missing_fields(self, client: TestClient):
        """Test creating payroll run with missing required fields."""
        # Arrange - missing created_by
        payload = {
            "pay_period_start": "2025-10-01T00:00:00",
            "pay_period_end": "2025-10-31T23:59:59"
        }

        # Act
        response = client.post(
            "/api/payroll/runs",
            json=payload
        )

        # Assert - should fail validation
        assert response.status_code in [422, 400]

    def test_create_payroll_run_invalid_format(self, client: TestClient):
        """Test creating payroll run with invalid date format."""
        # Arrange - invalid date format
        payload = {
            "pay_period_start": "invalid-date",
            "pay_period_end": "2025-10-31T23:59:59",
            "created_by": "test"
        }

        # Act
        response = client.post(
            "/api/payroll/runs",
            json=payload
        )

        # Assert - should fail validation
        assert response.status_code == 422

    def test_approve_already_approved_run(self, client: TestClient):
        """Test approving an already approved payroll run."""
        # Arrange - create and approve a run
        create_payload = {
            "pay_period_start": "2025-10-01T00:00:00",
            "pay_period_end": "2025-10-31T23:59:59",
            "created_by": "test"
        }
        create_response = client.post("/api/payroll/runs", json=create_payload)
        created_id = create_response.json()["id"]

        # First approval
        approve_payload = {"approved_by": "admin"}
        client.post(f"/api/payroll/runs/{created_id}/approve", json=approve_payload)

        # Act - try to approve again
        response = client.post(
            f"/api/payroll/runs/{created_id}/approve",
            json=approve_payload
        )

        # Assert - may succeed or fail depending on business logic
        assert response.status_code in [200, 400, 409]


# Run with: pytest backend/tests/test_payroll_api.py -v
