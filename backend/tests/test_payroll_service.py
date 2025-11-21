"""Tests for payroll calculations."""
from __future__ import annotations

import pytest


def test_calculate_monthly_payroll_totals(app):
    from app.services.payroll_service import payroll_service

    timer_cards = [
        {"work_date": "2024-01-08", "clock_in": "09:00", "clock_out": "18:00"},
        {"work_date": "2024-01-09", "clock_in": "09:00", "clock_out": "21:00"},
        {"work_date": "2024-01-13", "clock_in": "10:00", "clock_out": "18:00"},
    ]

    factory_config = {
        "jikyu_tanka": 1500,
        "gasoline_allowance": True,
        "gasoline_amount": 3000,
    }

    payroll = payroll_service.calculate_monthly_payroll(
        employee_id=101,
        year=2024,
        month=1,
        timer_cards=timer_cards,
        factory_config=factory_config,
    )

    assert payroll["hours"]["total_hours"] == pytest.approx(29.0)
    assert payroll["hours"]["overtime_hours"] == pytest.approx(5.0)
    assert payroll["hours"]["holiday_hours"] == pytest.approx(8.0)

    assert payroll["payments"]["base_pay"] == pytest.approx(24000)
    assert payroll["payments"]["overtime_pay"] == pytest.approx(9375)
    assert payroll["payments"]["holiday_pay"] == pytest.approx(16200)

    assert payroll["bonuses"]["gasoline"] == pytest.approx(3000)
    assert payroll["deductions"]["insurance"] == pytest.approx(7436.25, rel=1e-4)
    assert payroll["deductions"]["tax"] == 0.0

    expected_net = 52575 - 37436.25
    assert payroll["net_pay"] == pytest.approx(expected_net)
