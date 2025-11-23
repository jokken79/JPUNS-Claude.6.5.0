"""
Dashboard API Endpoints
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

from app.core.database import get_db
from app.models.models import (
    AuditLog,
    User,
    Candidate,
    Employee,
    Factory,
    Request,
    TimerCard,
    SalaryCalculation,
    CandidateStatus,
    RequestStatus,
    YukyuRequest,
)
from app.schemas.dashboard import (
    DashboardStats,
    FactoryDashboard,
    EmployeeAlert,
    MonthlyTrend,
    RecentActivity,
    AdminDashboard,
    EmployeeDashboard,
    CoordinatorDashboard,
    YukyuTrendMonth,
    YukyuComplianceStatus,
    YukyuComplianceDetail,
)
from app.services.auth_service import auth_service

router = APIRouter()


SUMMARY_IGNORED_FIELDS = {"created_at", "updated_at", "password_hash"}


def _field_names(values: Optional[Dict[str, Any]]) -> List[str]:
    if not values:
        return []
    return [key for key in values.keys() if key not in SUMMARY_IGNORED_FIELDS]


def _format_field_suffix(fields: List[str]) -> str:
    if not fields:
        return ""
    preview = ", ".join(fields[:3])
    if len(fields) > 3:
        preview += ", …"
    return f" (fields: {preview})"


def _describe_audit_entry(entry: AuditLog) -> str:
    table_label = (entry.table_name or "record").replace("_", " ").title()
    record_label = f" #{entry.record_id}" if entry.record_id is not None else ""
    action = (entry.action or "event").upper()

    if action == "CREATE":
        return f"Created {table_label}{record_label}{_format_field_suffix(_field_names(entry.new_values))}"
    if action == "UPDATE":
        return f"Updated {table_label}{record_label}{_format_field_suffix(_field_names(entry.new_values))}"
    if action == "DELETE":
        return f"Deleted {table_label}{record_label}{_format_field_suffix(_field_names(entry.old_values))}"
    return f"{action.title()} {table_label}{record_label}"


def _fetch_recent_audit_activity(db: Session, limit: int) -> List[RecentActivity]:
    entries = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
    if not entries:
        return []

    user_cache: Dict[int, Optional[str]] = {}
    activities: List[RecentActivity] = []

    for entry in entries:
        username: Optional[str] = None
        if entry.user_id:
            cached = user_cache.get(entry.user_id)
            if cached is None and entry.user_id not in user_cache:
                user = db.query(User).filter(User.id == entry.user_id).first()
                cached = user.username if user else None
                user_cache[entry.user_id] = cached
            username = cached

        timestamp = entry.created_at.isoformat() if entry.created_at else datetime.now().isoformat()
        if entry.table_name and entry.action:
            activity_type = f"{entry.table_name}_{entry.action.lower()}"
        else:
            activity_type = (entry.action or "event").lower()

        activities.append(
            RecentActivity(
                activity_type=activity_type,
                description=_describe_audit_entry(entry),
                timestamp=timestamp,
                user=username,
            )
        )

    return activities


def _fallback_recent_activity(db: Session, limit: int) -> List[RecentActivity]:
    activities: List[RecentActivity] = []

    recent_candidates = db.query(Candidate).order_by(Candidate.created_at.desc()).limit(limit).all()
    for candidate in recent_candidates:
        activities.append(RecentActivity(
            activity_type="candidate_created",
            description=f"New candidate registered: {candidate.full_name_kanji or candidate.rirekisho_id}",
            timestamp=candidate.created_at.isoformat(),
            user=None,
        ))

    recent_employees = db.query(Employee).order_by(Employee.created_at.desc()).limit(limit).all()
    for employee in recent_employees:
        activities.append(RecentActivity(
            activity_type="employee_hired",
            description=f"Employee hired: {employee.full_name_kanji}",
            timestamp=employee.created_at.isoformat(),
            user=None,
        ))

    recent_requests = db.query(Request).order_by(Request.created_at.desc()).limit(limit).all()
    for request in recent_requests:
        employee = db.query(Employee).filter(Employee.hakenmoto_id == request.hakenmoto_id).first()
        employee_name = employee.full_name_kanji if employee else f"Employee #{request.hakenmoto_id}"
        status_text = (
            "approved"
            if request.status == RequestStatus.APPROVED
            else "rejected"
            if request.status == RequestStatus.REJECTED
            else "submitted"
        )
        activities.append(RecentActivity(
            activity_type=f"request_{status_text}",
            description=f"{employee_name} {status_text} {request.request_type.value} request",
            timestamp=request.created_at.isoformat(),
            user=None,
        ))

    recent_salaries = db.query(SalaryCalculation).order_by(SalaryCalculation.created_at.desc()).limit(limit).all()
    for salary in recent_salaries:
        employee = db.query(Employee).filter(Employee.id == salary.employee_id).first()
        employee_name = employee.full_name_kanji if employee else f"Employee #{salary.employee_id}"
        activities.append(RecentActivity(
            activity_type="salary_calculated",
            description=f"Salary calculated for {employee_name} ({salary.year}-{salary.month:02d})",
            timestamp=salary.created_at.isoformat(),
            user=None,
        ))

    activities.sort(key=lambda x: x.timestamp, reverse=True)
    return activities[:limit]


def _build_recent_activities(db: Session, limit: int) -> List[RecentActivity]:
    activities = _fetch_recent_audit_activity(db, limit)
    if activities:
        return activities[:limit]
    return _fallback_recent_activity(db, limit)


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Get main dashboard statistics"""
    # Get current month
    now = datetime.now()
    current_month = now.month
    current_year = now.year
    
    # Candidates
    total_candidates = db.query(Candidate).count()
    pending_candidates = db.query(Candidate).filter(
        Candidate.status == CandidateStatus.PENDING
    ).count()
    
    # Employees
    total_employees = db.query(Employee).count()
    active_employees = db.query(Employee).filter(Employee.is_active == True).count()
    
    # Factories
    total_factories = db.query(Factory).filter(Factory.is_active == True).count()
    
    # Pending requests
    pending_requests = db.query(Request).filter(
        Request.status == RequestStatus.PENDING
    ).count()
    
    # Pending timer cards
    pending_timer_cards = db.query(TimerCard).filter(
        TimerCard.is_approved == False
    ).count()
    
    # Current month salary
    current_salaries = db.query(SalaryCalculation).filter(
        SalaryCalculation.month == current_month,
        SalaryCalculation.year == current_year
    ).all()
    
    total_salary = sum(s.net_salary for s in current_salaries)
    total_profit = sum(s.company_profit for s in current_salaries)
    
    return DashboardStats(
        total_candidates=total_candidates,
        pending_candidates=pending_candidates,
        total_employees=total_employees,
        active_employees=active_employees,
        total_factories=total_factories,
        pending_requests=pending_requests,
        pending_timer_cards=pending_timer_cards,
        total_salary_current_month=total_salary,
        total_profit_current_month=total_profit
    )


@router.get("/factories", response_model=list[FactoryDashboard])
async def get_factories_dashboard(
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Get dashboard for all factories"""
    now = datetime.now()
    current_month = now.month
    current_year = now.year
    
    factories = db.query(Factory).filter(Factory.is_active == True).all()
    
    result = []
    for factory in factories:
        # Employees
        employees = db.query(Employee).filter(
            Employee.factory_id == factory.factory_id
        ).all()
        active_employees = [e for e in employees if e.is_active]
        
        # Current month data
        employee_ids = [e.id for e in employees]
        hakenmoto_ids = [e.hakenmoto_id for e in employees]

        timer_cards = db.query(TimerCard).filter(
            TimerCard.hakenmoto_id.in_(hakenmoto_ids),
            TimerCard.is_approved == True,
            extract('month', TimerCard.work_date) == current_month,
            extract('year', TimerCard.work_date) == current_year
        ).all()
        
        total_hours = sum(
            float(tc.regular_hours + tc.overtime_hours + tc.night_hours + tc.holiday_hours)
            for tc in timer_cards
        )
        
        salaries = db.query(SalaryCalculation).filter(
            SalaryCalculation.employee_id.in_(employee_ids),
            SalaryCalculation.month == current_month,
            SalaryCalculation.year == current_year
        ).all()
        
        total_salary = sum(s.net_salary for s in salaries)
        total_revenue = sum(s.factory_payment for s in salaries)
        total_profit = sum(s.company_profit for s in salaries)
        profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        result.append(FactoryDashboard(
            factory_id=factory.factory_id,
            factory_name=factory.name,
            total_employees=len(employees),
            active_employees=len(active_employees),
            current_month_hours=total_hours,
            current_month_salary=total_salary,
            current_month_revenue=total_revenue,
            current_month_profit=total_profit,
            profit_margin=round(profit_margin, 2)
        ))
    
    return result


@router.get("/alerts", response_model=list[EmployeeAlert])
async def get_alerts(
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Get employee alerts (expiring zairyu, low yukyu, etc.)"""
    alerts = []
    today = date.today()
    
    # Zairyu card expiring in 60 days
    employees = db.query(Employee).filter(
        Employee.is_active == True,
        Employee.zairyu_expire_date != None
    ).all()
    
    for employee in employees:
        if employee.zairyu_expire_date:
            days_until = (employee.zairyu_expire_date - today).days
            if 0 < days_until <= 60:
                alerts.append(EmployeeAlert(
                    employee_id=employee.id,
                    employee_name=employee.full_name_kanji,
                    alert_type="zairyu_expiring",
                    alert_date=employee.zairyu_expire_date,
                    days_until=days_until,
                    message=f"在留カード expires in {days_until} days"
                ))
    
    # Low yukyu balance (< 3 days)
    for employee in employees:
        if employee.yukyu_remaining < 3:
            alerts.append(EmployeeAlert(
                employee_id=employee.id,
                employee_name=employee.full_name_kanji,
                alert_type="yukyu_low",
                alert_date=today,
                days_until=0,
                message=f"Low yukyu balance: {employee.yukyu_remaining} days remaining"
            ))
    
    return sorted(alerts, key=lambda x: x.days_until)


@router.get("/trends", response_model=list[MonthlyTrend])
async def get_monthly_trends(
    months: int = 6,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Get monthly trend data (last N months)"""
    trends = []
    now = datetime.now()
    
    for i in range(months):
        target_date = now - relativedelta(months=i)
        month = target_date.month
        year = target_date.year
        
        # Active employees that month
        total_employees = db.query(Employee).filter(
            Employee.is_active == True
        ).count()
        
        # Timer cards
        timer_cards = db.query(TimerCard).filter(
            TimerCard.is_approved == True,
            extract('month', TimerCard.work_date) == month,
            extract('year', TimerCard.work_date) == year
        ).all()
        
        total_hours = sum(
            float(tc.regular_hours + tc.overtime_hours + tc.night_hours + tc.holiday_hours)
            for tc in timer_cards
        )
        
        # Salaries
        salaries = db.query(SalaryCalculation).filter(
            SalaryCalculation.month == month,
            SalaryCalculation.year == year
        ).all()
        
        total_salary = sum(s.net_salary for s in salaries)
        total_revenue = sum(s.factory_payment for s in salaries)
        total_profit = sum(s.company_profit for s in salaries)
        
        trends.append(MonthlyTrend(
            month=f"{year}-{month:02d}",
            total_employees=total_employees,
            total_hours=total_hours,
            total_salary=total_salary,
            total_revenue=total_revenue,
            total_profit=total_profit
        ))
    
    return list(reversed(trends))


@router.get("/admin", response_model=AdminDashboard)
async def get_admin_dashboard(
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """Get complete admin dashboard"""
    stats = await get_dashboard_stats(current_user, db)
    factories = await get_factories_dashboard(current_user, db)
    alerts = await get_alerts(current_user, db)
    trends = await get_monthly_trends(6, current_user, db)
    
    recent_activities = _build_recent_activities(db, 20)

    return AdminDashboard(
        stats=stats,
        factories=factories,
        alerts=alerts,
        monthly_trends=trends,
        recent_activities=recent_activities
    )


@router.get("/recent-activity", response_model=list[RecentActivity])
async def get_recent_activity(
    limit: int = Query(default=20, le=100),
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get recent system activity from audit logs and recent changes.
    Returns last N activities across all entities.
    """
    return _build_recent_activities(db, limit)


@router.get("/employee/{employee_id}", response_model=EmployeeDashboard)
async def get_employee_dashboard(
    employee_id: int,
    current_user: User = Depends(auth_service.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get employee's personal dashboard"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Get factory name
    factory = db.query(Factory).filter(Factory.factory_id == employee.factory_id).first()
    factory_name = factory.name if factory else employee.factory_id

    # Last payment
    last_salary = db.query(SalaryCalculation).filter(
        SalaryCalculation.employee_id == employee_id,
        SalaryCalculation.is_paid == True
    ).order_by(SalaryCalculation.created_at.desc()).first()

    # Current month hours
    now = datetime.now()
    timer_cards = db.query(TimerCard).filter(
        TimerCard.hakenmoto_id == employee.hakenmoto_id,
        extract('month', TimerCard.work_date) == now.month,
        extract('year', TimerCard.work_date) == now.year
    ).all()

    current_hours = sum(
        float(tc.regular_hours + tc.overtime_hours + tc.night_hours + tc.holiday_hours)
        for tc in timer_cards
    )

    # Pending requests
    pending_requests = db.query(Request).filter(
        Request.hakenmoto_id == employee.hakenmoto_id,
        Request.status == RequestStatus.PENDING
    ).count()

    return EmployeeDashboard(
        employee_id=employee.id,
        employee_name=employee.full_name_kanji,
        factory_name=factory_name,
        position=employee.position or "N/A",
        hire_date=employee.hire_date,
        current_salary=employee.jikyu,
        yukyu_remaining=employee.yukyu_remaining,
        last_payment=last_salary.net_salary if last_salary else None,
        last_payment_date=last_salary.paid_at.date() if last_salary and last_salary.paid_at else None,
        current_month_hours=current_hours,
        pending_requests=pending_requests
    )


# ============================================================================
# FASE 5: Yukyu Dashboard Endpoints (KEITOSAN - Finance Manager)
# ============================================================================


@router.get("/yukyu-trends-monthly", response_model=list[YukyuTrendMonth])
async def get_yukyu_trends_monthly(
    months: int = Query(default=6, ge=1, le=24, description="Number of months to retrieve"),
    current_user: User = Depends(auth_service.require_yukyu_access()),
    db: Session = Depends(get_db)
):
    """
    Get monthly yukyu trend data for yukyu dashboard.
    Shows approved yukyu days and deduction amounts by month.

    Access: All roles EXCEPT EMPLOYEE and CONTRACT_WORKER
    (SUPER_ADMIN, ADMIN, COORDINATOR, KANRININSHA, KEITOSAN, TANTOSHA)

    Args:
        months: Number of previous months to retrieve (1-24)
        current_user: Current authenticated user (with yukyu access)
        db: Database session

    Returns:
        List of monthly trend data sorted chronologically
    """
    trends = []
    now = datetime.now()

    for i in range(months):
        target_date = now - relativedelta(months=i)
        month = target_date.month
        year = target_date.year
        month_str = f"{year}-{month:02d}"

        # Query approved yukyu requests for this month
        yukyu_requests = db.query(YukyuRequest).filter(
            YukyuRequest.status == RequestStatus.APPROVED,
            extract('month', YukyuRequest.start_date) == month,
            extract('year', YukyuRequest.start_date) == year
        ).all()

        if not yukyu_requests:
            trends.append(YukyuTrendMonth(
                month=month_str,
                total_approved_days=0.0,
                employees_with_yukyu=0,
                total_deduction_jpy=0.0,
                avg_deduction_per_employee=0.0
            ))
            continue

        # Calculate metrics
        total_days = sum(float(r.days_requested) for r in yukyu_requests)
        unique_employees = len(set(r.employee_id for r in yukyu_requests))

        # Get employee payroll data to calculate deductions
        total_deduction = 0.0
        for yukyu_request in yukyu_requests:
            employee = db.query(Employee).filter(Employee.id == yukyu_request.employee_id).first()
            if employee:
                # Calculate deduction: days * teiji_hours_per_day * base_hourly_rate
                standard_hours_per_month = getattr(employee, 'standard_hours_per_month', 160)
                teiji_hours_per_day = standard_hours_per_month / 20.0
                deduction = yukyu_request.days_requested * teiji_hours_per_day * float(employee.jikyu or 0)
                total_deduction += deduction

        avg_deduction = total_deduction / unique_employees if unique_employees > 0 else 0.0

        trends.append(YukyuTrendMonth(
            month=month_str,
            total_approved_days=total_days,
            employees_with_yukyu=unique_employees,
            total_deduction_jpy=round(total_deduction, 2),
            avg_deduction_per_employee=round(avg_deduction, 2)
        ))

    # Sort chronologically (oldest first)
    return list(reversed(trends))


@router.get("/yukyu-compliance-status", response_model=YukyuComplianceStatus)
async def get_yukyu_compliance_status(
    period: str = Query(default="current", description="Period: 'current' for current fiscal year or YYYY-MM"),
    current_user: User = Depends(auth_service.require_yukyu_access()),
    db: Session = Depends(get_db)
):
    """
    Get yukyu compliance status for all employees.
    Checks compliance with Japanese labor law (Article 39).
    Minimum requirement: 5 days yukyu per year.

    Access: All roles EXCEPT EMPLOYEE and CONTRACT_WORKER
    (SUPER_ADMIN, ADMIN, COORDINATOR, KANRININSHA, KEITOSAN, TANTOSHA)

    Args:
        period: Period to check ('current' for FY 2024-2025, or specific month 'YYYY-MM')
        current_user: Current authenticated user (with yukyu access)
        db: Database session

    Returns:
        Compliance status with detailed employee information
    """
    today = date.today()

    # Determine fiscal year (April 1 - March 31 in Japan)
    if today.month >= 4:
        fy_start = date(today.year, 4, 1)
        fy_end = date(today.year + 1, 3, 31)
        period_str = f"{today.year}-FY"
    else:
        fy_start = date(today.year - 1, 4, 1)
        fy_end = date(today.year, 3, 31)
        period_str = f"{today.year - 1}-FY"

    # Get all active employees
    employees = db.query(Employee).filter(Employee.is_active == True).all()

    compliant = 0
    non_compliant = 0
    employee_details = []

    for employee in employees:
        # Get approved yukyu requests for fiscal year
        yukyu_requests = db.query(YukyuRequest).filter(
            YukyuRequest.employee_id == employee.id,
            YukyuRequest.status == RequestStatus.APPROVED,
            YukyuRequest.start_date >= fy_start,
            YukyuRequest.start_date <= fy_end
        ).all()

        total_used = sum(float(r.days_requested) for r in yukyu_requests)
        total_remaining = float(employee.yukyu_remaining or 0)
        legal_minimum = 5.0

        is_compliant = (total_used + total_remaining) >= legal_minimum
        warning = None

        if not is_compliant:
            non_compliant += 1
            days_short = legal_minimum - (total_used + total_remaining)
            warning = f"Not compliant with Japanese labor law. Short by {days_short:.1f} days"
        else:
            compliant += 1

        employee_details.append(YukyuComplianceDetail(
            employee_id=employee.id,
            employee_name=employee.full_name_kanji or employee.full_name_roman,
            total_used_this_year=round(total_used, 1),
            total_remaining=round(total_remaining, 1),
            legal_minimum=legal_minimum,
            is_compliant=is_compliant,
            warning=warning
        ))

    # Sort by compliance status (non-compliant first)
    employee_details.sort(key=lambda x: (x.is_compliant, x.employee_name))

    return YukyuComplianceStatus(
        period=period_str,
        total_employees=len(employees),
        compliant_employees=compliant,
        non_compliant_employees=non_compliant,
        employees_details=employee_details
    )
