"""
Yukyu (有給休暇 - Paid Vacation) API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
import logging

logger = logging.getLogger(__name__)

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, UserRole, YukyuRequest, RequestStatus
from app.schemas.yukyu import (
    YukyuBalanceResponse,
    YukyuBalanceSummary,
    YukyuRequestCreate,
    YukyuRequestResponse,
    YukyuRequestApprove,
    YukyuRequestReject,
    YukyuCalculationRequest,
    YukyuCalculationResponse,
    EmployeeByFactoryResponse,
    YukyuUsageHistoryResponse,
)
from app.services.auth_service import auth_service
from app.services.yukyu_service import YukyuService

router = APIRouter()


# ============================================================================
# YUKYU BALANCE ENDPOINTS
# ============================================================================

@router.post("/balances/calculate", response_model=YukyuCalculationResponse)
async def calculate_employee_yukyus(
    calc_request: YukyuCalculationRequest,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Calculate and create yukyu balances for an employee.

    **Permissions:** ADMIN, KEITOSAN

    **What it does:**
    - Calculates yukyus based on employee hire date and Japanese labor law
    - Creates missing balance records for all milestones (6mo, 18mo, 30mo, etc.)
    - Returns total available yukyu days

    **When to use:**
    - After creating a new employee
    - Monthly cron job to assign new yukyus
    - Manual recalculation by admin
    """
    service = YukyuService(db)
    return await service.calculate_and_create_balances(
        employee_id=calc_request.employee_id,
        calculation_date=calc_request.calculation_date
    )


@router.get("/balances", response_model=YukyuBalanceSummary)
async def get_current_user_yukyu_summary(
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get yukyu summary for the currently authenticated user.

    **Permissions:** Any authenticated user

    **Role-based behavior:**
    - **ADMIN/SUPER_ADMIN/KEITOSAN**: Returns summary of all employees' yukyu balances
    - **Regular users**: Returns their personal yukyu balance (matched by email)

    **Returns:**
    - All active yukyu balances for current user's employee record (or all if admin)
    - Total available, used, and expired days
    """
    from app.models.models import Employee

    # Check if user is admin/keitosan - they see all employees' summary
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.KEITOSAN]:
        logger.info(f"Admin user {current_user.username} requesting all yukyu balances summary")

        # Get all employees
        all_employees = db.query(Employee).filter(Employee.is_active == True).all()

        if not all_employees:
            raise HTTPException(
                status_code=404,
                detail="No active employees found"
            )

        # Calculate aggregate summary
        total_available = 0
        total_used = 0
        total_expired = 0
        employee_count = len(all_employees)

        service = YukyuService(db)
        for emp in all_employees:
            try:
                summary = await service.get_employee_yukyu_summary(emp.id)
                total_available += summary.total_available
                total_used += summary.total_used
                total_expired += summary.total_expired
            except Exception as e:
                logger.warning(f"Could not get yukyu summary for employee {emp.id}: {e}")
                continue

        # Return aggregate summary (reusing YukyuBalanceSummary schema)
        return YukyuBalanceSummary(
            employee_id=None,  # Multiple employees
            employee_name=f"全従業員 ({employee_count}名)",
            total_available=total_available,
            total_used=total_used,
            total_expired=total_expired,
            balances=[],  # Empty for aggregate
            oldest_expiration_date=None,
            needs_to_use_minimum_5_days=False
        )

    # Regular users: Find employee record by matching email
    # Employee model does NOT have user_id, so we match by email
    employee = db.query(Employee).filter(
        Employee.email == current_user.email
    ).first()

    # If no match by email, try matching by username as email
    if not employee and "@" in current_user.username:
        employee = db.query(Employee).filter(
            Employee.email == current_user.username
        ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail=f"No employee record found for user {current_user.username}. Please contact HR to link your account."
        )

    logger.info(f"Found employee record for user {current_user.username}: {employee.full_name_kanji} (ID: {employee.id})")

    service = YukyuService(db)
    return await service.get_employee_yukyu_summary(employee.id)


@router.get("/balances/{employee_id}", response_model=YukyuBalanceSummary)
async def get_employee_yukyu_summary(
    employee_id: int,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete yukyu summary for an employee.

    **Permissions:** Any authenticated user

    **Returns:**
    - All active yukyu balances
    - Total available, used, and expired days
    - Oldest expiration date
    - Alert if needs to use 5 days minimum
    """
    service = YukyuService(db)
    return await service.get_employee_yukyu_summary(employee_id)


# ============================================================================
# YUKYU REQUEST ENDPOINTS
# ============================================================================

@router.post("/requests/", response_model=YukyuRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_yukyu_request(
    request_data: YukyuRequestCreate,
    current_user: User = Depends(auth_service.require_role("employee")),
    db: Session = Depends(get_db)
):
    """
    Create yukyu request (by TANTOSHA).

    **Permissions:** TANTOSHA, ADMIN, KEITOSAN

    **Workflow:**
    1. TANTOSHA selects employee from their factory
    2. Requests yukyu days (can be 0.5 for hannichi - half day)
    3. System validates employee has enough yukyus available
    4. Request created with status=PENDING
    5. KEITOSAN receives notification to approve/reject

    **Request Types:**
    - `yukyu`: Full paid vacation day
    - `hankyu`: Half day (半休)
    - `ikkikokoku`: Temporary return to home country (一時帰国)
    - `taisha`: Resignation (退社)
    """
    service = YukyuService(db)
    return await service.create_request(request_data, current_user.id)


@router.get("/requests/", response_model=List[YukyuRequestResponse])
async def list_yukyu_requests(
    factory_id: Optional[str] = Query(None, description="Filter by factory ID"),
    status: Optional[str] = Query(None, description="Filter by status (pending, approved, rejected)"),
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """
    List yukyu requests with role-based filtering.

    **Permissions:**
    - **TANTOSHA:** Can only see requests for their factory (factory_id required)
    - **KEITOSAN/ADMIN:** Can see all requests (factory_id optional)

    **Filters:**
    - `factory_id`: Filter by factory
    - `status`: Filter by status (pending, approved, rejected)
    - `employee_id`: Filter by specific employee
    - `limit`: Max results (default 100, max 500)
    - `offset`: Pagination offset
    """
    service = YukyuService(db)
    return await service.list_requests(
        user=current_user,
        factory_id=factory_id,
        status=status,
        employee_id=employee_id,
        limit=limit,
        offset=offset
    )


@router.put("/requests/{request_id}/approve", response_model=YukyuRequestResponse)
async def approve_yukyu_request(
    request_id: int,
    approval_data: YukyuRequestApprove,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Approve yukyu request (by KEITOSAN).

    **Permissions:** KEITOSAN, ADMIN

    **What happens when approved:**
    1. Validates request is in PENDING status
    2. Deducts yukyu days using LIFO (newest first)
    3. Creates usage_details records linking to specific balances
    4. Updates request status to APPROVED
    5. Records approval date and approving user

    **LIFO Deduction:**
    Newest yukyus are used first to maximize usage before expiration.

    Example:
    - Employee has: 8 days from 2023 + 11 days from 2024 = 19 days total
    - Request: 5 days
    - Deduction: 5 days from 2024 (newest)
    - Remaining: 8 days from 2023 + 6 days from 2024 = 14 days total
    """
    service = YukyuService(db)
    return await service.approve_request(request_id, approval_data, current_user.id)


@router.put("/requests/{request_id}/reject", response_model=YukyuRequestResponse)
async def reject_yukyu_request(
    request_id: int,
    rejection_data: YukyuRequestReject,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Reject yukyu request (by KEITOSAN).

    **Permissions:** KEITOSAN, ADMIN

    **Required:**
    - `rejection_reason`: Reason for rejection (shown to employee)

    **What happens:**
    1. Validates request is in PENDING status
    2. Updates status to REJECTED
    3. Records rejection reason, date, and rejecting user
    4. No yukyus are deducted
    """
    service = YukyuService(db)
    return await service.reject_request(request_id, rejection_data, current_user.id)


# ============================================================================
# EMPLOYEE LOOKUP FOR TANTOSHA
# ============================================================================

@router.get("/employees/by-factory/{factory_id}", response_model=List[EmployeeByFactoryResponse])
async def get_employees_by_factory(
    factory_id: str,
    current_user: User = Depends(auth_service.require_role("employee")),
    db: Session = Depends(get_db)
):
    """
    Get all employees in a factory with their yukyu availability.

    **Permissions:** TANTOSHA, ADMIN, KEITOSAN

    **Use case:**
    TANTOSHA uses this to see which employees they can request yukyus for.

    **Returns:**
    - Employee ID, name, hire date
    - Current yukyu days available
    - Factory info
    """
    service = YukyuService(db)
    return await service.get_employees_by_factory(factory_id)


# ============================================================================
# MAINTENANCE ENDPOINTS
# ============================================================================

@router.post("/maintenance/expire-old-yukyus", response_model=dict)
async def expire_old_yukyus(
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Expire yukyus that are older than 2 years (時効 - jikou).

    **Permissions:** ADMIN only

    **When to call:**
    - Daily cron job
    - Manual trigger by admin

    **What it does:**
    - Finds all active balances with expires_on <= today
    - Marks them as EXPIRED
    - Moves days_remaining to days_expired
    - Sets days_available to 0

    **Returns:**
    - Number of balances expired
    """
    service = YukyuService(db)
    count = await service.expire_old_yukyus()
    return {
        "message": f"Expired {count} yukyu balance(s)",
        "count": count
    }


@router.get("/maintenance/scheduler-status", tags=["Maintenance"])
async def get_scheduler_status(
    current_user: dict = Depends(get_current_user)
):
    """
    **Get Scheduler Status**

    Endpoint para ver el estado del scheduler de cron jobs.

    **Requiere:**
    - Usuario autenticado (ADMIN o SUPER_ADMIN recomendado)

    **Returns:**
    - Estado del scheduler (running/stopped)
    - Lista de jobs configurados con próximas ejecuciones
    """
    from app.core.scheduler import get_scheduler_status
    return get_scheduler_status()


@router.get("/reports/export-excel", tags=["Reports"])
async def export_yukyu_to_excel(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    **Export Yukyu Data to Excel**

    Exporta todos los datos de yukyu a un archivo Excel con 4 hojas:

    1. **概要 (Summary)**: Estadísticas globales
       - Total empleados
       - Total días disponibles/usados/expirados
       - Promedio por empleado

    2. **従業員別有給 (Employee Balances)**: Balances por empleado
       - Número de empleado, nombre, fábrica
       - Días disponibles, usados, expirados
       - Fecha de expiración más antigua

    3. **申請履歴 (Request History)**: Últimas 500 solicitudes
       - Detalles de la solicitud
       - Estado (pendiente/aprobado/rechazado)
       - Fechas y responsables

    4. **アラート (Alerts)**: Empleados con problemas
       - Sin yukyu (0 días)
       - Bajo yukyu (≤3 días)
       - Alto yukyu (≥15 días)

    **Requiere:**
    - Usuario autenticado

    **Returns:**
    - Excel file (.xlsx) para descargar
    """
    from fastapi.responses import StreamingResponse
    from datetime import datetime
    from io import BytesIO

    service = YukyuService(db)
    excel_bytes = await service.export_to_excel()

    # Create filename with current date
    filename = f"yukyu_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/requests/{request_id}/pdf", tags=["Reports"])
async def generate_request_pdf(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    **Generate PDF for Yukyu Request**

    Genera un documento PDF profesional para una solicitud de yukyu con:

    - **申請番号 (Request Number)**: ID único de la solicitud
    - **従業員情報 (Employee Info)**: Datos del empleado solicitante
    - **申請内容 (Request Details)**: Fechas, días solicitados, tipo
    - **承認情報 (Approval Info)**: Estado de aprobación, responsables

    **Formato:** Documento A4 profesional en japonés con tablas estructuradas

    **Casos de uso:**
    - Imprimir solicitud para archivos físicos
    - Enviar por email al empleado
    - Adjuntar a expediente laboral

    **Requiere:**
    - Usuario autenticado
    - `request_id`: ID de la solicitud

    **Returns:**
    - PDF file (.pdf) para descargar o imprimir
    """
    from fastapi.responses import StreamingResponse
    from io import BytesIO

    service = YukyuService(db)

    try:
        pdf_bytes = await service.generate_request_pdf(request_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    filename = f"yukyu_request_{request_id}.pdf"

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/payroll/summary", tags=["Payroll Integration"])
async def get_payroll_yukyu_summary(
    year: int,
    month: int,
    factory_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    **Get Yukyu Summary for Payroll Integration**

    Retorna el resumen de yukyus usados por empleado en un período específico
    para integración con el sistema de nómina (payroll).

    **Casos de Uso:**
    - Calcular deducciones por yukyus no pagados
    - Reportar días de ausencia justificada (有給欠勤)
    - Generar estadísticas de uso de vacaciones
    - Exportar datos para sistemas externos de nómina

    **Query Parameters:**
    - `year`: Año del período (ej: 2025)
    - `month`: Mes del período (1-12)
    - `factory_id` (opcional): Filtrar por fábrica específica

    **Response Structure:**
    ```json
    {
      "period": {
        "year": 2025,
        "month": 1,
        "start_date": "2025-01-01",
        "end_date": "2025-01-31"
      },
      "employees": [
        {
          "employee_id": "E001",
          "employee_name": "山田太郎",
          "factory_name": "トヨタ自動車",
          "days_used_in_period": 2.0,
          "total_available": 15,
          "requests_count": 2
        }
      ],
      "summary": {
        "total_employees": 50,
        "total_days_used": 75.5,
        "average_days_per_employee": 1.5
      }
    }
    ```

    **Requiere:**
    - Usuario autenticado (ADMIN, KEITOSAN, o SUPER_ADMIN recomendado)
    """
    from calendar import monthrange
    from app.models.models import Employee, Factory

    # Calculate period dates
    _, last_day = monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)

    # Query approved requests in period
    query = db.query(YukyuRequest).filter(
        YukyuRequest.status == RequestStatus.APPROVED,
        YukyuRequest.start_date >= start_date,
        YukyuRequest.end_date <= end_date
    )

    if factory_id:
        query = query.filter(YukyuRequest.factory_id == factory_id)

    requests = query.all()

    # Group by employee
    employee_data = {}
    for req in requests:
        emp_id = req.employee_id
        if emp_id not in employee_data:
            employee = db.query(Employee).filter(Employee.id == emp_id).first()
            factory = None
            if employee and employee.factory_id:
                factory = db.query(Factory).filter(Factory.id == employee.factory_id).first()

            # Get total available yukyus
            service = YukyuService(db)
            try:
                summary = await service.get_employee_yukyu_summary(emp_id)
                total_available = summary.total_available
            except Exception as e:
                # Use 0 as default if yukyu calculation fails (employee may not have balance record)
                logger.debug(f"Could not get yukyu summary for employee {emp_id}: {e}")
                total_available = 0

            employee_data[emp_id] = {
                "employee_id": employee.employee_id if employee else str(emp_id),
                "employee_name": employee.full_name_kanji if employee else "Unknown",
                "factory_name": factory.name if factory else "N/A",
                "days_used_in_period": 0,
                "total_available": total_available,
                "requests_count": 0
            }

        employee_data[emp_id]["days_used_in_period"] += float(req.days_requested)
        employee_data[emp_id]["requests_count"] += 1

    employees_list = list(employee_data.values())
    total_days = sum(e["days_used_in_period"] for e in employees_list)
    total_employees = len(employees_list)

    return {
        "period": {
            "year": year,
            "month": month,
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d")
        },
        "employees": employees_list,
        "summary": {
            "total_employees": total_employees,
            "total_days_used": round(total_days, 2),
            "average_days_per_employee": round(total_days / total_employees, 2) if total_employees > 0 else 0
        }
    }


# ============================================================================
# YUKYU USAGE HISTORY ENDPOINT
# ============================================================================

@router.get("/usage-history/{employee_id}", response_model=List[YukyuUsageHistoryResponse])
async def get_yukyu_usage_history(
    employee_id: int,
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    fiscal_year: Optional[int] = Query(None, description="Filter by fiscal year"),
    include_expired: bool = Query(True, description="Include expired balances in results"),
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete yukyu usage history for an employee.

    **Permissions:** Any authenticated user (own data) or ADMIN/KEITOSAN (all data)

    **What it does:**
    - Returns ALL yukyu usage details including those from expired balances
    - Shows which fiscal year each yukyu day was deducted from (LIFO logic)
    - Allows filtering by date range and fiscal year
    - Perfect for viewing historical usage from 4+ years ago

    **Use cases:**
    - Employee wants to see their complete yukyu history
    - Admin needs to audit yukyu usage from previous years
    - Compliance reporting for expired yukyus

    **Example:**
    - GET /api/yukyu/usage-history/123?start_date=2020-01-01&end_date=2024-12-31
    - Returns all yukyu usage for employee 123 from 2020-2024, including expired balances
    """
    from app.models.models import Employee, YukyuUsageDetail, YukyuBalance, YukyuRequest
    from sqlalchemy.orm import joinedload

    # Permission check: users can only see their own data, admins see all
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.KEITOSAN]:
        # Regular user - verify they're requesting their own data
        employee = db.query(Employee).filter(
            Employee.id == employee_id,
            Employee.email == current_user.email
        ).first()

        if not employee:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own yukyu history"
            )

    # Verify employee exists
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee {employee_id} not found"
        )

    # Build query with joins to get all related data
    query = db.query(
        YukyuUsageDetail,
        YukyuRequest,
        YukyuBalance
    ).join(
        YukyuRequest, YukyuUsageDetail.request_id == YukyuRequest.id
    ).join(
        YukyuBalance, YukyuUsageDetail.balance_id == YukyuBalance.id
    ).filter(
        YukyuRequest.employee_id == employee_id
    )

    # Apply filters
    if start_date:
        query = query.filter(YukyuUsageDetail.usage_date >= start_date)

    if end_date:
        query = query.filter(YukyuUsageDetail.usage_date <= end_date)

    if fiscal_year:
        query = query.filter(YukyuBalance.fiscal_year == fiscal_year)

    if not include_expired:
        # Only show usage from balances that are still ACTIVE
        from app.models.models import YukyuStatus
        query = query.filter(YukyuBalance.status == YukyuStatus.ACTIVE)

    # Order by usage date descending (most recent first)
    query = query.order_by(YukyuUsageDetail.usage_date.desc())

    results = query.all()

    # Transform to response schema
    history = []
    for usage_detail, request, balance in results:
        history.append(YukyuUsageHistoryResponse(
            id=usage_detail.id,
            request_id=usage_detail.request_id,
            balance_id=usage_detail.balance_id,
            usage_date=usage_detail.usage_date,
            days_deducted=usage_detail.days_deducted,

            # Request info
            request_type=request.request_type,
            request_status=request.status.value if hasattr(request.status, 'value') else str(request.status),
            request_start_date=request.start_date,
            request_end_date=request.end_date,

            # Balance info
            fiscal_year=balance.fiscal_year,
            balance_status=balance.status.value if hasattr(balance.status, 'value') else str(balance.status),

            # Notes
            notes=request.notes
        ))

    logger.info(f"Retrieved {len(history)} yukyu usage records for employee {employee_id}")
    return history
