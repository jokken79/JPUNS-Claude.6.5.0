"""Reports API Endpoints for UNS-ClaudeJP 2.0."""

import logging
from decimal import Decimal
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.database import get_db
from app.models.models import Employee, Factory, SalaryCalculation
from app.services.auth_service import AuthService
from app.services.report_service import report_service

router = APIRouter()
logger = logging.getLogger(__name__)

STRICT_SECURITY_ENVS = {"production", "staging"}

if settings.ENVIRONMENT.lower() in STRICT_SECURITY_ENVS and not settings.DEBUG:
    _reports_guard_dependency = AuthService.require_role("admin")
else:

    async def _reports_guard_dependency():  # pragma: no cover - trivial helper
        return None


def _allow_fallback() -> bool:
    """Determine if sample data can be used when the database is empty."""

    return settings.ENVIRONMENT.lower() not in STRICT_SECURITY_ENVS or settings.DEBUG


def _to_float(value: Optional[Decimal | float | int]) -> float:
    """Convert database numeric types to float for report rendering."""

    if value is None:
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):  # pragma: no cover - defensive fallback
        return 0.0


def _to_int(value: Optional[Decimal | float | int]) -> int:
    """Convert database numeric types to int, defaulting to zero."""

    if value is None:
        return 0
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):  # pragma: no cover - defensive fallback
        return 0


def _resolve_employee_name(employee: Optional[Employee]) -> str:
    """Return the best available employee name for reports."""

    if not employee:
        return "N/A"

    for attr in ("full_name_kanji", "full_name_kana", "full_name_roman"):
        value = getattr(employee, attr, None)
        if value:
            return value

    return "N/A"


def _build_sample_monthly_payload(factory_id: str, factory: Optional[Factory] = None):
    """Provide placeholder monthly data when the database has no records."""

    payrolls = [
        {
            "employee_id": "SAMPLE-EMP",
            "employee_name": "山田太郎",
            "hours": {
                "normal_hours": 160.0,
                "overtime_hours": 20.0,
                "night_hours": 10.0,
                "holiday_hours": 0.0,
                "total_hours": 190.0,
            },
            "payments": {
                "base_pay": 240000,
                "overtime_pay": 37500,
                "night_pay": 15000,
                "holiday_pay": 0,
            },
            "bonuses": {"total": 5000},
            "gross_pay": 297500,
            "factory_payment": None,
        }
    ]

    factory_config = {
        "name": factory.name if factory else f"Factory {factory_id}",
        "jikyu_tanka": 1500,
        "gasoline_allowance": True,
        "gasoline_amount": 5000,
    }

    return payrolls, factory_config


def _build_sample_payslip(employee_id: int, year: int, month: int):
    """Return placeholder payslip data when calculations are unavailable."""

    return {
        "employee_id": employee_id,
        "employee_name": "山田太郎",
        "year": year,
        "month": month,
        "hours": {
            "normal_hours": 160.0,
            "overtime_hours": 20.0,
            "night_hours": 10.0,
            "holiday_hours": 0.0,
        },
        "payments": {
            "base_pay": 240000,
            "overtime_pay": 37500,
            "night_pay": 15000,
            "holiday_pay": 0,
        },
        "bonuses": {"total": 5000},
        "deductions": {
            "insurance": 35000,
            "tax": 10000,
            "apartment": 30000,
        },
        "gross_pay": 297500,
        "net_pay": 222500,
    }


def _build_sample_annual_data():
    """Provide placeholder annual data when no salary history exists."""

    return [
        {
            "month": i,
            "total_hours": 1800 + (i * 50),
            "total_cost": 2700000 + (i * 50000),
            "total_revenue": 3240000 + (i * 60000),
            "profit": 540000 + (i * 10000),
        }
        for i in range(1, 13)
    ]


@router.post("/monthly-factory")
async def generate_monthly_factory_report(
    factory_id: str = Query(...),
    year: int = Query(...),
    month: int = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(_reports_guard_dependency),
):
    """Generate a monthly payroll report for a specific factory."""

    try:
        fallback_allowed = _allow_fallback()

        factory = (
            db.query(Factory)
            .filter(Factory.factory_id == factory_id)
            .first()
        )
        if not factory:
            if not fallback_allowed:
                raise HTTPException(status_code=404, detail="Factory not found")
            logger.warning(
                "Factory %s not found. Using sample data for monthly report.", factory_id
            )
            payrolls, factory_config = _build_sample_monthly_payload(factory_id)
            return report_service.generate_monthly_factory_report(
                factory_id,
                year,
                month,
                payrolls,
                factory_config,
            )

        salaries = (
            db.query(SalaryCalculation)
            
            .join(Employee, SalaryCalculation.employee_id == Employee.id)
            .filter(
                Employee.factory_id == factory_id,
                SalaryCalculation.year == year,
                SalaryCalculation.month == month,
            )
            .all()
        )

        if not salaries:
            if not fallback_allowed:
                raise HTTPException(
                    status_code=404,
                    detail="No salary calculations found for the selected period.",
                )
            logger.warning(
                "No salary calculations found for %s %s-%s. Using sample data.",
                factory_id,
                year,
                month,
            )
            payrolls, factory_config = _build_sample_monthly_payload(factory_id, factory)
            return report_service.generate_monthly_factory_report(
                factory_id,
                year,
                month,
                payrolls,
                factory_config,
            )

        payrolls = []
        hourly_rates: list[int] = []

        for salary in salaries:
            employee = salary.employee
            if employee and employee.hourly_rate_charged:
                hourly_rates.append(employee.hourly_rate_charged)

            hours = {
                "normal_hours": _to_float(salary.total_regular_hours),
                "overtime_hours": _to_float(salary.total_overtime_hours),
                "night_hours": _to_float(salary.total_night_hours),
                "holiday_hours": _to_float(salary.total_holiday_hours),
            }
            hours["total_hours"] = sum(hours.values())

            factory_payment = (
                _to_int(salary.factory_payment)
                if salary.factory_payment is not None
                else None
            )

            payrolls.append(
                {
                    "employee_id": employee.hakenmoto_id if employee else salary.employee_id,
                    "employee_name": _resolve_employee_name(employee),
                    "hours": hours,
                    "payments": {
                        "base_pay": _to_int(salary.base_salary),
                        "overtime_pay": _to_int(salary.overtime_pay),
                        "night_pay": _to_int(salary.night_pay),
                        "holiday_pay": _to_int(salary.holiday_pay),
                    },
                    "bonuses": {"total": _to_int(salary.bonus)},
                    "gross_pay": _to_int(salary.gross_salary),
                    "factory_payment": factory_payment,
                }
            )

        factory_config = {
            "name": factory.name,
            "jikyu_tanka": None,
            "gasoline_allowance": False,
            "gasoline_amount": 0,
        }

        config_payload = factory.config if isinstance(factory.config, dict) else {}
        if config_payload:
            jikyu_value = config_payload.get("jikyu_tanka")
            if jikyu_value is not None:
                try:
                    factory_config["jikyu_tanka"] = float(jikyu_value)
                except (TypeError, ValueError):  # pragma: no cover - defensive fallback
                    factory_config["jikyu_tanka"] = None
            factory_config["gasoline_allowance"] = bool(
                config_payload.get("gasoline_allowance", False)
            )
            factory_config["gasoline_amount"] = _to_int(
                config_payload.get("gasoline_amount", 0)
            )

        if not factory_config["jikyu_tanka"] and hourly_rates:
            factory_config["jikyu_tanka"] = sum(hourly_rates) / len(hourly_rates)

        if not factory_config["jikyu_tanka"]:
            factory_config["jikyu_tanka"] = 1500

        result = report_service.generate_monthly_factory_report(
            factory_id,
            year,
            month,
            payrolls,
            factory_config,
        )

        return result

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error generating monthly report", exc_info=exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/payslip")
async def generate_payslip_pdf(
    employee_id: int = Query(...),
    year: int = Query(...),
    month: int = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(_reports_guard_dependency),
):
    """Generate individual payslip PDF from salary calculations."""

    try:
        salary = (
            db.query(SalaryCalculation)
            
            .filter(
                SalaryCalculation.employee_id == employee_id,
                SalaryCalculation.year == year,
                SalaryCalculation.month == month,
            )
            .order_by(SalaryCalculation.created_at.desc())
            .first()
        )

        if not salary:
            if not _allow_fallback():
                raise HTTPException(
                    status_code=404,
                    detail="Salary calculation not found for the specified employee and period.",
                )
            logger.warning(
                "Salary calculation missing for employee %s %s-%s. Using sample payslip.",
                employee_id,
                year,
                month,
            )
            payroll_data = _build_sample_payslip(employee_id, year, month)
            pdf_path = report_service.generate_employee_payslip_pdf(payroll_data)

            if not pdf_path or not Path(pdf_path).exists():
                raise HTTPException(status_code=500, detail="Failed to generate payslip")

            return {"success": True, "pdf_path": pdf_path}

        employee = salary.employee

        insurance_components = []
        if employee:
            for field in ("health_insurance", "nursing_insurance", "pension_insurance"):
                value = getattr(employee, field, None)
                if value:
                    insurance_components.append(value)

        payroll_data = {
            "employee_id": employee_id,
            "employee_name": _resolve_employee_name(employee),
            "year": year,
            "month": month,
            "hours": {
                "normal_hours": _to_float(salary.total_regular_hours),
                "overtime_hours": _to_float(salary.total_overtime_hours),
                "night_hours": _to_float(salary.total_night_hours),
                "holiday_hours": _to_float(salary.total_holiday_hours),
            },
            "payments": {
                "base_pay": _to_int(salary.base_salary),
                "overtime_pay": _to_int(salary.overtime_pay),
                "night_pay": _to_int(salary.night_pay),
                "holiday_pay": _to_int(salary.holiday_pay),
            },
            "bonuses": {"total": _to_int(salary.bonus)},
            "deductions": {
                "insurance": sum(_to_int(value) for value in insurance_components),
                "tax": _to_int(salary.other_deductions),
                "apartment": _to_int(salary.apartment_deduction),
            },
            "gross_pay": _to_int(salary.gross_salary),
            "net_pay": _to_int(salary.net_salary),
        }

        pdf_path = report_service.generate_employee_payslip_pdf(payroll_data)

        if not pdf_path or not Path(pdf_path).exists():
            raise HTTPException(status_code=500, detail="Failed to generate payslip")

        return {"success": True, "pdf_path": pdf_path}

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error generating payslip", exc_info=exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/download/{filename}")
async def download_report(
    filename: str,
    current_user=Depends(_reports_guard_dependency),
):
    """Download generated report files."""

    try:
        file_path = Path("reports") / filename

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Report not found")

        return FileResponse(
            path=file_path,
            media_type="application/octet-stream",
            filename=filename,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error downloading report", exc_info=exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/annual-summary")
async def generate_annual_summary(
    factory_id: str = Query(...),
    year: int = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(_reports_guard_dependency),
):
    """Generate an annual summary report for the requested factory."""

    try:
        fallback_allowed = _allow_fallback()

        factory_exists = (
            db.query(Factory.id)
            .filter(Factory.factory_id == factory_id)
            .first()
        )
        if not factory_exists:
            if not fallback_allowed:
                raise HTTPException(status_code=404, detail="Factory not found")
            logger.warning(
                "Factory %s not found. Using sample annual summary data.", factory_id
            )
            monthly_data = _build_sample_annual_data()
            return report_service.generate_annual_summary_report(
                factory_id,
                year,
                monthly_data,
            )

        aggregated = (
            db.query(
                SalaryCalculation.month,
                func.sum(SalaryCalculation.total_regular_hours).label("regular_hours"),
                func.sum(SalaryCalculation.total_overtime_hours).label("overtime_hours"),
                func.sum(SalaryCalculation.total_night_hours).label("night_hours"),
                func.sum(SalaryCalculation.total_holiday_hours).label("holiday_hours"),
                func.sum(SalaryCalculation.gross_salary).label("total_cost"),
                func.sum(SalaryCalculation.factory_payment).label("total_revenue"),
                func.sum(SalaryCalculation.company_profit).label("total_profit"),
            )
            .join(Employee, SalaryCalculation.employee_id == Employee.id)
            .filter(
                Employee.factory_id == factory_id,
                SalaryCalculation.year == year,
            )
            .group_by(SalaryCalculation.month)
            .order_by(SalaryCalculation.month)
            .all()
        )

        if not aggregated:
            if not fallback_allowed:
                raise HTTPException(
                    status_code=404,
                    detail="No salary calculations found for the selected year.",
                )
            logger.warning(
                "No annual salary data for %s %s. Using sample summary.",
                factory_id,
                year,
            )
            monthly_data = _build_sample_annual_data()
            return report_service.generate_annual_summary_report(
                factory_id,
                year,
                monthly_data,
            )

        monthly_data = []
        for row in aggregated:
            total_hours = (
                _to_float(row.regular_hours)
                + _to_float(row.overtime_hours)
                + _to_float(row.night_hours)
                + _to_float(row.holiday_hours)
            )

            total_cost = _to_int(row.total_cost)

            if row.total_revenue is not None:
                total_revenue = _to_int(row.total_revenue)
            else:
                total_revenue = total_cost + _to_int(row.total_profit)

            profit = total_revenue - total_cost

            monthly_data.append(
                {
                    "month": row.month,
                    "total_hours": total_hours,
                    "total_cost": total_cost,
                    "total_revenue": total_revenue,
                    "profit": profit,
                }
            )

        result = report_service.generate_annual_summary_report(
            factory_id,
            year,
            monthly_data,
        )

        return result

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error generating annual summary", exc_info=exc)
        raise HTTPException(status_code=500, detail=str(exc))
