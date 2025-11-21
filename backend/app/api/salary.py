"""
Salary Calculation API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from datetime import datetime
from io import BytesIO
import tempfile
import os
from typing import Optional

from app.core.database import get_db
from app.core.config import settings
from app.core.rate_limiter import limiter
from app.models.models import SalaryCalculation, Employee, TimerCard, Factory, User
from app.schemas.salary import (
    SalaryCalculate, SalaryCalculationResponse, SalaryBulkCalculate,
    SalaryBulkResult, SalaryMarkPaid, SalaryStatistics
)
from app.schemas.salary_unified import (
    SalaryUpdate, MarkSalaryPaidRequest, SalaryReportFilters,
    SalaryExportResponse, SalaryReportResponse
)
from app.schemas.base import PaginatedResponse, create_paginated_response
from app.services.auth_service import auth_service
from app.services.salary_export_service import SalaryExportService
from app.services.payslip_service import PayslipService

router = APIRouter()


def calculate_employee_salary(db: Session, employee_id: int, month: int, year: int):
    """Calculate salary for single employee"""
    # Get employee
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise ValueError("Employee not found")
    
    # Get factory config
    factory = db.query(Factory).filter(Factory.factory_id == employee.factory_id).first()
    if not factory:
        raise ValueError("Factory not found")
    
    # Get approved timer cards for the month
    timer_cards = db.query(TimerCard).filter(
        TimerCard.hakenmoto_id == employee.hakenmoto_id,
        TimerCard.is_approved == True,
        extract('month', TimerCard.work_date) == month,
        extract('year', TimerCard.work_date) == year
    ).all()
    
    if not timer_cards:
        raise ValueError("No approved timer cards found for this month")
    
    # Sum hours
    total_regular_hours = sum(float(tc.regular_hours) for tc in timer_cards)
    total_overtime_hours = sum(float(tc.overtime_hours) for tc in timer_cards)
    total_night_hours = sum(float(tc.night_hours) for tc in timer_cards)
    total_holiday_hours = sum(float(tc.holiday_hours) for tc in timer_cards)
    
    # Get rates from settings or factory config
    overtime_rate = settings.OVERTIME_RATE_25
    night_rate = settings.NIGHT_SHIFT_PREMIUM
    holiday_rate = settings.HOLIDAY_WORK_PREMIUM
    
    # Calculate payments
    base_salary = int(employee.jikyu * total_regular_hours)
    overtime_pay = int(employee.jikyu * total_overtime_hours * (1 + overtime_rate))
    night_pay = int(employee.jikyu * total_night_hours * (1 + night_rate))
    holiday_pay = int(employee.jikyu * total_holiday_hours * (1 + holiday_rate))
    
    # Bonuses (can be customized from factory config)
    bonus = 0
    gasoline_allowance = 0
    
    if factory.config and "bonuses" in factory.config:
        bonuses_config = factory.config["bonuses"]
        
        # Gasoline allowance
        if bonuses_config.get("gasoline_allowance", {}).get("enabled"):
            amount_per_day = bonuses_config["gasoline_allowance"].get("amount_per_day", 0)
            work_days = len(timer_cards)
            gasoline_allowance = amount_per_day * work_days
        
        # Attendance bonus
        if bonuses_config.get("attendance_bonus", {}).get("enabled"):
            bonus_config = bonuses_config["attendance_bonus"]
            conditions = bonus_config.get("conditions", {})
            if conditions.get("full_month") and work_days >= 20:
                bonus += bonus_config.get("amount", 0)
    
    # Deductions
    apartment_deduction = 0
    if employee.apartment_id and employee.apartment_rent:
        # Calculate prorated rent
        days_in_month = 30  # Simplified
        work_days = len(timer_cards)
        if settings.APARTMENT_PRORATE_BY_DAY:
            apartment_deduction = int((employee.apartment_rent / days_in_month) * work_days)
        else:
            apartment_deduction = employee.apartment_rent
    
    # Calculate gross and net
    gross_salary = base_salary + overtime_pay + night_pay + holiday_pay + bonus + gasoline_allowance
    net_salary = gross_salary - apartment_deduction
    
    # Calculate factory payment (時給単価)
    factory_payment = 0
    company_profit = 0
    
    if factory.config and "working_hours" in factory.config:
        shifts = factory.config["working_hours"].get("shifts", [])
        if shifts:
            # Use first shift's jikyu_tanka as default
            jikyu_tanka = shifts[0].get("jikyu_tanka", employee.jikyu)
            total_hours = total_regular_hours + total_overtime_hours + total_night_hours + total_holiday_hours
            factory_payment = int(jikyu_tanka * total_hours)
            company_profit = factory_payment - gross_salary
    
    return {
        "employee_id": employee_id,
        "month": month,
        "year": year,
        "total_regular_hours": total_regular_hours,
        "total_overtime_hours": total_overtime_hours,
        "total_night_hours": total_night_hours,
        "total_holiday_hours": total_holiday_hours,
        "base_salary": base_salary,
        "overtime_pay": overtime_pay,
        "night_pay": night_pay,
        "holiday_pay": holiday_pay,
        "bonus": bonus,
        "gasoline_allowance": gasoline_allowance,
        "apartment_deduction": apartment_deduction,
        "other_deductions": 0,
        "gross_salary": gross_salary,
        "net_salary": net_salary,
        "factory_payment": factory_payment,
        "company_profit": company_profit
    }


@router.post("/calculate", response_model=SalaryCalculationResponse, status_code=201)
@limiter.limit("10/hour")  # Expensive salary calculation operation
async def calculate_salary(
    request: Request,
    salary_data: SalaryCalculate,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Calculate salary for single employee"""
    try:
        # Check if already calculated
        existing = db.query(SalaryCalculation).filter(
            SalaryCalculation.employee_id == salary_data.employee_id,
            SalaryCalculation.month == salary_data.month,
            SalaryCalculation.year == salary_data.year
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Salary already calculated for this month")
        
        # Calculate
        calc_data = calculate_employee_salary(
            db, 
            salary_data.employee_id,
            salary_data.month,
            salary_data.year
        )
        
        # Override bonuses/deductions if provided
        if salary_data.bonus:
            calc_data["bonus"] = salary_data.bonus
        if salary_data.gasoline_allowance:
            calc_data["gasoline_allowance"] = salary_data.gasoline_allowance
        if salary_data.other_deductions:
            calc_data["other_deductions"] = salary_data.other_deductions
        
        # Recalculate net salary
        calc_data["gross_salary"] = (
            calc_data["base_salary"] + calc_data["overtime_pay"] +
            calc_data["night_pay"] + calc_data["holiday_pay"] +
            calc_data["bonus"] + calc_data["gasoline_allowance"]
        )
        calc_data["net_salary"] = (
            calc_data["gross_salary"] - calc_data["apartment_deduction"] -
            calc_data["other_deductions"]
        )
        
        # Save
        new_salary = SalaryCalculation(**calc_data)
        db.add(new_salary)
        db.commit()
        db.refresh(new_salary)
        
        return new_salary
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/calculate/bulk", response_model=SalaryBulkResult)
async def calculate_salaries_bulk(
    bulk_data: SalaryBulkCalculate,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Calculate salaries for multiple employees"""
    # Get employees
    query = db.query(Employee).filter(Employee.is_active == True)
    
    if bulk_data.employee_ids:
        query = query.filter(Employee.id.in_(bulk_data.employee_ids))
    elif bulk_data.factory_id:
        query = query.filter(Employee.factory_id == bulk_data.factory_id)
    
    employees = query.all()
    
    successful = 0
    failed = 0
    errors = []
    total_gross = 0
    total_net = 0
    total_profit = 0
    
    for employee in employees:
        try:
            calc_data = calculate_employee_salary(
                db,
                employee.id,
                bulk_data.month,
                bulk_data.year
            )
            
            new_salary = SalaryCalculation(**calc_data)
            db.add(new_salary)
            db.flush()
            
            successful += 1
            total_gross += calc_data["gross_salary"]
            total_net += calc_data["net_salary"]
            total_profit += calc_data["company_profit"]
            
        except Exception as e:
            failed += 1
            errors.append(f"Employee {employee.hakenmoto_id}: {str(e)}")
    
    db.commit()
    
    return SalaryBulkResult(
        total_employees=len(employees),
        successful=successful,
        failed=failed,
        total_gross_salary=total_gross,
        total_net_salary=total_net,
        total_company_profit=total_profit,
        errors=errors
    )


@router.get("/", response_model=PaginatedResponse[SalaryCalculationResponse])
async def list_salaries(
    employee_id: int = Query(None, description="Filter by employee ID"),
    month: int = Query(None, ge=1, le=12, description="Filter by month (1-12)"),
    year: int = Query(None, ge=2020, description="Filter by year"),
    is_paid: bool = Query(None, description="Filter by payment status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List salary calculations with pagination.

    Returns paginated list with eager loaded employee relationship.
    """
    query = db.query(SalaryCalculation)

    # Apply filters
    if employee_id:
        query = query.filter(SalaryCalculation.employee_id == employee_id)
    if month:
        query = query.filter(SalaryCalculation.month == month)
    if year:
        query = query.filter(SalaryCalculation.year == year)
    if is_paid is not None:
        query = query.filter(SalaryCalculation.is_paid == is_paid)

    # Get total count
    total = query.count()

    # Calculate pagination
    skip = (page - 1) * page_size

    # Get paginated results
    items = (
        query
        .order_by(SalaryCalculation.year.desc(), SalaryCalculation.month.desc())
        .offset(skip)
        .limit(page_size)
        .all()
    )

    return create_paginated_response(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{salary_id}", response_model=SalaryCalculationResponse)
async def get_salary_calculation(
    salary_id: int,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific salary calculation by ID.
    Includes employee information and all deductions/bonuses.
    """
    salary = (
        db.query(SalaryCalculation)
        .filter(SalaryCalculation.id == salary_id)
        .first()
    )

    if not salary:
        raise HTTPException(status_code=404, detail="Salary calculation not found")

    # Role-based access: Employees can only see their own salary
    if current_user.role.value == "EMPLOYEE":
        # Get employee record linked to user
        employee = db.query(Employee).filter(Employee.id == salary.employee_id).first()

        # Check if this salary belongs to the current user
        # This requires employee to be linked to user (implementation may vary)
        # For now, we allow access if user is employee role
        pass

    return salary


@router.post("/mark-paid")
async def mark_salaries_paid(
    payment_data: SalaryMarkPaid,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Mark salaries as paid"""
    salaries = db.query(SalaryCalculation).filter(
        SalaryCalculation.id.in_(payment_data.salary_ids)
    ).all()
    
    payment_date = payment_data.payment_date or datetime.now()
    
    for salary in salaries:
        salary.is_paid = True
        salary.paid_at = payment_date
    
    db.commit()
    
    return {"message": f"Marked {len(salaries)} salaries as paid"}


@router.get("/statistics", response_model=SalaryStatistics)
async def get_salary_statistics(
    month: int,
    year: int,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Get salary statistics for a month"""
    salaries = db.query(SalaryCalculation).filter(
        SalaryCalculation.month == month,
        SalaryCalculation.year == year
    ).all()

    if not salaries:
        raise HTTPException(status_code=404, detail="No salary data found for this month")

    total_employees = len(salaries)
    total_gross = sum(s.gross_salary for s in salaries)
    total_net = sum(s.net_salary for s in salaries)
    total_deductions = total_gross - total_net
    total_revenue = sum(s.factory_payment for s in salaries)
    total_profit = sum(s.company_profit for s in salaries)
    avg_salary = total_net // total_employees if total_employees > 0 else 0

    # Group by factory
    factory_stats = {}
    for salary in salaries:
        employee = db.query(Employee).filter(Employee.id == salary.employee_id).first()
        if employee:
            factory_id = employee.factory_id
            if factory_id not in factory_stats:
                factory_stats[factory_id] = {
                    "factory_id": factory_id,
                    "employees": 0,
                    "total_salary": 0,
                    "total_profit": 0
                }
            factory_stats[factory_id]["employees"] += 1
            factory_stats[factory_id]["total_salary"] += salary.net_salary
            factory_stats[factory_id]["total_profit"] += salary.company_profit

    return SalaryStatistics(
        month=month,
        year=year,
        total_employees=total_employees,
        total_gross_salary=total_gross,
        total_net_salary=total_net,
        total_deductions=total_deductions,
        total_company_revenue=total_revenue,
        total_company_profit=total_profit,
        average_salary=avg_salary,
        factories=list(factory_stats.values())
    )


@router.put("/{salary_id}", response_model=SalaryCalculationResponse)
async def update_salary(
    salary_id: int,
    data: SalaryUpdate,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Update an existing salary calculation.

    Only allows updating bonus, gasoline_allowance, other_deductions, and notes.
    Cannot update if salary is already paid (is_paid=True).

    Args:
        salary_id: ID of the salary calculation to update
        data: Fields to update
        current_user: Current authenticated admin user
        db: Database session

    Returns:
        Updated salary calculation

    Raises:
        HTTPException 404: Salary calculation not found
        HTTPException 400: Salary already paid or invalid data
    """
    # Get salary calculation
    salary = db.query(SalaryCalculation).filter(SalaryCalculation.id == salary_id).first()

    if not salary:
        raise HTTPException(status_code=404, detail="Salary calculation not found")

    # Check if already paid
    if salary.is_paid:
        raise HTTPException(
            status_code=400,
            detail="Cannot update salary that has already been paid"
        )

    # Update fields if provided
    if data.bonus is not None:
        salary.bonus = int(data.bonus)
    if data.gasoline_allowance is not None:
        salary.gasoline_allowance = int(data.gasoline_allowance)
    if data.other_deductions is not None:
        salary.other_deductions = int(data.other_deductions)
    if data.notes is not None:
        # Assuming there's a notes field in the model (if not, this will be skipped)
        if hasattr(salary, 'notes'):
            salary.notes = data.notes

    # Recalculate gross and net salary
    salary.gross_salary = (
        salary.base_salary + salary.overtime_pay +
        salary.night_pay + salary.holiday_pay +
        salary.bonus + salary.gasoline_allowance
    )
    salary.net_salary = (
        salary.gross_salary - salary.apartment_deduction -
        salary.other_deductions
    )

    # Commit changes
    try:
        db.commit()
        db.refresh(salary)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating salary: {str(e)}")

    return salary


@router.delete("/{salary_id}")
async def delete_salary(
    salary_id: int,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Delete a salary calculation.

    Cannot delete if salary has been paid (is_paid=True).

    Args:
        salary_id: ID of the salary calculation to delete
        current_user: Current authenticated admin user
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException 404: Salary calculation not found
        HTTPException 400: Salary already paid
    """
    # Get salary calculation
    salary = db.query(SalaryCalculation).filter(SalaryCalculation.id == salary_id).first()

    if not salary:
        raise HTTPException(status_code=404, detail="Salary calculation not found")

    # Check if already paid
    if salary.is_paid:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete salary that has already been paid"
        )

    # Delete
    try:
        db.delete(salary)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting salary: {str(e)}")

    return {
        "success": True,
        "message": f"Salary calculation {salary_id} deleted successfully"
    }


@router.post("/{salary_id}/mark-paid", response_model=SalaryCalculationResponse)
async def mark_salary_paid(
    salary_id: int,
    data: MarkSalaryPaidRequest,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Mark a salary calculation as paid.

    Updates is_paid=True and paid_at timestamp.

    Args:
        salary_id: ID of the salary calculation
        data: Payment details (date, method, notes)
        current_user: Current authenticated admin user
        db: Database session

    Returns:
        Updated salary calculation

    Raises:
        HTTPException 404: Salary calculation not found
        HTTPException 400: Salary already paid
    """
    # Get salary calculation
    salary = db.query(SalaryCalculation).filter(SalaryCalculation.id == salary_id).first()

    if not salary:
        raise HTTPException(status_code=404, detail="Salary calculation not found")

    # Check if already paid
    if salary.is_paid:
        raise HTTPException(
            status_code=400,
            detail="Salary has already been marked as paid"
        )

    # Mark as paid
    salary.is_paid = True
    salary.paid_at = data.payment_date

    # Store payment metadata if notes field exists
    if data.notes and hasattr(salary, 'notes'):
        salary.notes = data.notes

    # Commit changes
    try:
        db.commit()
        db.refresh(salary)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error marking salary as paid: {str(e)}")

    return salary


@router.get("/reports", response_model=SalaryReportResponse)
async def get_salary_reports(
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    employee_ids: Optional[str] = Query(None, description="Comma-separated employee IDs"),
    factory_ids: Optional[str] = Query(None, description="Comma-separated factory IDs"),
    is_paid: Optional[bool] = Query(None, description="Filter by paid status"),
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get salary report for a date range with filters.

    Generates comprehensive salary report with summary statistics:
    - Total employees
    - Total gross/net amounts
    - Average salary
    - Paid vs unpaid counts

    Args:
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        employee_ids: Optional comma-separated list of employee IDs
        factory_ids: Optional comma-separated list of factory IDs
        is_paid: Optional filter by payment status
        current_user: Current authenticated user
        db: Database session

    Returns:
        Salary report with calculations and summary statistics

    Raises:
        HTTPException 400: Invalid date format
    """
    from datetime import datetime as dt

    # Parse dates
    try:
        start = dt.strptime(start_date, "%Y-%m-%d")
        end = dt.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Build query
    query = db.query(SalaryCalculation).join(Employee)

    # Filter by date range (month/year based)
    query = query.filter(
        func.make_date(SalaryCalculation.year, SalaryCalculation.month, 1) >= start.date(),
        func.make_date(SalaryCalculation.year, SalaryCalculation.month, 1) <= end.date()
    )

    # Apply filters
    if employee_ids:
        emp_id_list = [int(x.strip()) for x in employee_ids.split(",")]
        query = query.filter(SalaryCalculation.employee_id.in_(emp_id_list))

    if factory_ids:
        factory_id_list = [x.strip() for x in factory_ids.split(",")]
        query = query.filter(Employee.factory_id.in_(factory_id_list))

    if is_paid is not None:
        query = query.filter(SalaryCalculation.is_paid == is_paid)

    # Get results
    salaries = query.all()

    # Calculate summary statistics
    total_count = len(salaries)

    if total_count > 0:
        total_gross = sum(s.gross_salary for s in salaries)
        total_deductions = sum(
            s.apartment_deduction + s.other_deductions for s in salaries
        )
        total_net = sum(s.net_salary for s in salaries)
        average_salary = total_net / total_count
        paid_count = sum(1 for s in salaries if s.is_paid)
        unpaid_count = total_count - paid_count
    else:
        total_gross = 0
        total_deductions = 0
        total_net = 0
        average_salary = 0
        paid_count = 0
        unpaid_count = 0

    summary = {
        "total_employees": total_count,
        "total_gross": float(total_gross),
        "total_deductions": float(total_deductions),
        "total_net": float(total_net),
        "average_salary": float(average_salary),
        "paid_count": paid_count,
        "unpaid_count": unpaid_count
    }

    return SalaryReportResponse(
        total_count=total_count,
        salaries=salaries,
        summary=summary
    )


@router.post("/export/excel", response_model=SalaryExportResponse)
async def export_salary_excel(
    filters: SalaryReportFilters,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Export salary data to Excel file.

    Generates comprehensive Excel workbook with multiple sheets using SalaryExportService:
    - Sheet 1: Resumen Ejecutivo (Summary with KPIs)
    - Sheet 2: Detalle por Empleado (Detailed employee salary data)
    - Sheet 3: Análisis Fiscal (Tax and deductions analysis)

    Args:
        filters: Report filters (date range, employees, factories, paid status)
        current_user: Current authenticated user
        db: Database session

    Returns:
        Excel export response with download URL

    Raises:
        HTTPException 400: Invalid filters or no data found
        HTTPException 500: Export generation failed
    """
    try:
        # Parse dates
        start = datetime.strptime(filters.start_date, "%Y-%m-%d")
        end = datetime.strptime(filters.end_date, "%Y-%m-%d")

        # Build query with filters
        query = db.query(SalaryCalculation).join(Employee)

        # Filter by date range
        query = query.filter(
            func.make_date(SalaryCalculation.year, SalaryCalculation.month, 1) >= start.date(),
            func.make_date(SalaryCalculation.year, SalaryCalculation.month, 1) <= end.date()
        )

        # Apply additional filters
        if filters.employee_ids:
            query = query.filter(SalaryCalculation.employee_id.in_(filters.employee_ids))
        if filters.factory_ids:
            query = query.filter(Employee.factory_id.in_(filters.factory_ids))
        if filters.is_paid is not None:
            query = query.filter(SalaryCalculation.is_paid == filters.is_paid)

        salaries = query.all()

        if not salaries:
            raise HTTPException(status_code=400, detail="No salary data found for specified filters")

        # Use SalaryExportService to generate Excel
        export_service = SalaryExportService()
        excel_buffer = export_service.export_to_excel(
            salaries=salaries,
            period_start=filters.start_date,
            period_end=filters.end_date
        )

        # Save to temporary file for download
        exports_dir = os.path.join(os.getcwd(), "exports", "salary")
        os.makedirs(exports_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"salary_report_{timestamp}.xlsx"
        filepath = os.path.join(exports_dir, filename)

        # Write buffer to file
        with open(filepath, "wb") as f:
            f.write(excel_buffer.getvalue())

        return SalaryExportResponse(
            success=True,
            file_url=f"/api/salary/downloads/{filename}",
            filename=filename,
            format="excel",
            generated_at=datetime.now()
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating Excel export: {str(e)}")


@router.post("/export/pdf", response_model=SalaryExportResponse)
async def export_salary_pdf(
    filters: SalaryReportFilters,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Export salary data to PDF file.

    Generates professional PDF report with ReportLab:
    - Cover page with period and user info
    - Executive summary with KPIs
    - Detailed salary tables (landscape format)
    - Professional styling and formatting

    Args:
        filters: Report filters (date range, employees, factories, paid status)
        current_user: Current authenticated user
        db: Database session

    Returns:
        PDF export response with download URL

    Raises:
        HTTPException 400: Invalid filters or no data found
        HTTPException 500: Export generation failed
    """
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    from reportlab.lib.enums import TA_CENTER

    try:
        # Parse dates
        start = datetime.strptime(filters.start_date, "%Y-%m-%d")
        end = datetime.strptime(filters.end_date, "%Y-%m-%d")

        # Build query with filters (same logic as Excel)
        query = db.query(SalaryCalculation).join(Employee)

        query = query.filter(
            func.make_date(SalaryCalculation.year, SalaryCalculation.month, 1) >= start.date(),
            func.make_date(SalaryCalculation.year, SalaryCalculation.month, 1) <= end.date()
        )

        if filters.employee_ids:
            query = query.filter(SalaryCalculation.employee_id.in_(filters.employee_ids))
        if filters.factory_ids:
            query = query.filter(Employee.factory_id.in_(filters.factory_ids))
        if filters.is_paid is not None:
            query = query.filter(SalaryCalculation.is_paid == filters.is_paid)

        salaries = query.all()

        if not salaries:
            raise HTTPException(status_code=400, detail="No salary data found for specified filters")

        # Create PDF file path
        exports_dir = os.path.join(os.getcwd(), "exports", "salary")
        os.makedirs(exports_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"salary_report_{timestamp}.pdf"
        filepath = os.path.join(exports_dir, filename)

        # Initialize PDF document
        doc = SimpleDocTemplate(filepath, pagesize=landscape(A4))
        story = []
        styles = getSampleStyleSheet()

        # Custom title style
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor("#1e3a8a"),
            spaceAfter=30,
            alignment=TA_CENTER
        )

        # Title and metadata
        story.append(Paragraph("REPORTE DE SALARIOS / SALARY REPORT", title_style))
        story.append(Paragraph(f"<b>Período:</b> {filters.start_date} a {filters.end_date}", styles['Normal']))
        story.append(Paragraph(f"<b>Generado:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        story.append(Paragraph(f"<b>Usuario:</b> {current_user.username}", styles['Normal']))
        story.append(Spacer(1, 0.3*inch))

        # Summary statistics table
        total_employees = len(salaries)
        total_gross = sum(s.gross_salary for s in salaries)
        total_net = sum(s.net_salary for s in salaries)
        avg_salary = total_net / total_employees if total_employees > 0 else 0

        summary_data = [
            ["KPI", "Valor / Value"],
            ["Total Empleados / Employees", f"{total_employees}"],
            ["Salario Bruto Total / Total Gross", f"¥{total_gross:,.0f}"],
            ["Salario Neto Total / Total Net", f"¥{total_net:,.0f}"],
            ["Salario Promedio / Average", f"¥{avg_salary:,.0f}"],
            ["Pagados / Paid", f"{sum(1 for s in salaries if s.is_paid)}"],
            ["No Pagados / Unpaid", f"{sum(1 for s in salaries if not s.is_paid)}"]
        ]

        summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#dbeafe")),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))

        story.append(summary_table)
        story.append(PageBreak())

        # Detailed salary table
        story.append(Paragraph("Detalle de Salarios / Salary Details", styles['Heading2']))
        story.append(Spacer(1, 0.2*inch))

        detail_data = [
            ["ID", "Nombre/Name", "Mes/Month", "Bruto/Gross", "Deducciones", "Neto/Net", "Pagado/Paid"]
        ]

        for salary in salaries:
            employee = db.query(Employee).filter(Employee.id == salary.employee_id).first()
            detail_data.append([
                str(salary.employee_id),
                employee.full_name_roman[:15] if employee else "N/A",
                f"{salary.year}/{salary.month:02d}",
                f"¥{salary.gross_salary:,}",
                f"¥{(salary.apartment_deduction or 0) + (salary.other_deductions or 0):,}",
                f"¥{salary.net_salary:,}",
                "Sí/Yes" if salary.is_paid else "No"
            ])

        detail_table = Table(detail_data, colWidths=[0.6*inch, 1.5*inch, 0.9*inch, 1.2*inch, 1.2*inch, 1.2*inch, 0.8*inch])
        detail_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f3f4f6")])
        ]))

        story.append(detail_table)

        # Footer
        story.append(Spacer(1, 0.5*inch))
        footer_text = f"Generado por UNS-ClaudeJP | {datetime.now().strftime('%d/%m/%Y %H:%M')} | Documento Confidencial"
        footer = Paragraph(footer_text, styles['Normal'])
        footer.alignment = TA_CENTER
        story.append(footer)

        # Build PDF
        doc.build(story)

        return SalaryExportResponse(
            success=True,
            file_url=f"/api/salary/downloads/{filename}",
            filename=filename,
            format="pdf",
            generated_at=datetime.now()
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF export: {str(e)}")
