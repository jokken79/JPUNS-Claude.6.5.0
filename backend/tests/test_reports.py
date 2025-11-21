"""Tests for report generation endpoints."""
from __future__ import annotations

from pathlib import Path


def test_monthly_factory_report_endpoint(client, tmp_path):
    from app.services import report_service as report_service_module

    report_service_module.report_service.reports_dir = tmp_path

    response = client.post(
        "/api/reports/monthly-factory",
        params={"factory_id": "F001", "year": 2024, "month": 3},
    )

    assert response.status_code == 200
    data = response.json()
    report_path = Path(data["report_path"])
    assert data["success"] is True
    assert report_path.exists()
    assert report_path.suffix == ".xlsx"


def test_payslip_report_endpoint(client, tmp_path):
    from app.services import report_service as report_service_module

    report_service_module.report_service.reports_dir = tmp_path

    response = client.post(
        "/api/reports/payslip",
        params={"employee_id": 321, "year": 2024, "month": 2},
    )

    assert response.status_code == 200
    data = response.json()
    pdf_path = Path(data["pdf_path"])
    assert data["success"] is True
    assert pdf_path.exists()
    assert pdf_path.suffix == ".pdf"
