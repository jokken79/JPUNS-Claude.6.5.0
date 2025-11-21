"""Tests for import endpoints."""
from __future__ import annotations

from io import BytesIO

import pandas as pd


def _build_employee_excel() -> BytesIO:
    df = pd.DataFrame(
        [
            {
                "派遣元ID": "HK-001",
                "氏名": "山田太郎",
                "フリガナ": "ヤマダタロウ",
                "ローマ字": "YAMADA TARO",
                "生年月日": "1990-01-01",
                "性別": "男性",
                "国籍": "日本",
            }
        ]
    )
    buffer = BytesIO()
    df.to_excel(buffer, index=False)
    buffer.seek(0)
    return buffer


def test_import_employees_endpoint_success(client):
    excel_file = _build_employee_excel()

    response = client.post(
        "/api/import/employees",
        files={
            "file": (
                "employees.xlsx",
                excel_file,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["imported"] == 1
    assert data["failed"] == 0
    assert data["total_rows"] == 1
    assert data["success"][0]["name"] == "山田太郎"
