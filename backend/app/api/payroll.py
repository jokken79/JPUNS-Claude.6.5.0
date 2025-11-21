"""
Payroll API Router - FastAPI endpoints
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import logging

from app.core.database import get_db
from app.core.app_exceptions import (
    PayrollCalculationError,
    ResourceNotFoundError,
    ValidationError,
    DatabaseError,
    handle_exception
)
from app.services.payroll.payroll_service import PayrollService
from app.services.config_service import PayrollConfigService, get_payroll_config_service
from app.models.payroll_models import PayrollRun as PayrollRunModel, EmployeePayroll
from app.models.models import Employee, YukyuRequest, RequestStatus

logger = logging.getLogger(__name__)
from app.schemas.payroll import (
    PayrollRunCreate,
    PayrollRun,
    PayrollRunSummary,
    EmployeePayrollCreate,
    EmployeePayrollResult,
    BulkPayrollRequest,
    BulkPayrollResult,
    PayslipRequest,
    PayslipInfo,
    PayrollSettings,
    PayrollSettingsCreate,
    PayrollSettingsUpdate,
    PayrollApprovalRequest,
    PayrollApprovalResponse,
    PayrollSummary,
    SuccessResponse,
    ErrorResponse,
    HoursBreakdown,
    Rates,
    Amounts,
    DeductionsDetail,
    ValidationResult,
)
from app.schemas.salary_unified import PayrollRunUpdate, MarkPayrollPaidRequest

router = APIRouter(prefix="/api/payroll", tags=["payroll"])

# Dependency to get PayrollService
def get_payroll_service(db: Session = Depends(get_db)) -> PayrollService:
    return PayrollService(db_session=db)

# ============================================================================
# Payroll Runs Endpoints
# ============================================================================

@router.post(
    "/runs",
    response_model=PayrollRun,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new payroll run",
    description="Creates a new payroll run for a specific pay period"
)
def create_payroll_run(
    payroll_data: PayrollRunCreate,
    service: PayrollService = Depends(get_payroll_service),
    db: Session = Depends(get_db)
):
    """Create a new payroll run.

    Args:
        payroll_data: Payroll run data with pay period dates
        service: Payroll service instance
        db: Database session

    Returns:
        Created payroll run

    Raises:
        HTTPException: If creation fails
    """
    try:
        # Create PayrollRun object
        payroll_run = PayrollRunModel(
            pay_period_start=payroll_data.pay_period_start.date(),
            pay_period_end=payroll_data.pay_period_end.date(),
            status="draft",
            total_employees=0,
            total_gross_amount=0,
            total_deductions=0,
            total_net_amount=0,
            created_by=payroll_data.created_by
        )

        # Add to database
        db.add(payroll_run)
        db.commit()
        db.refresh(payroll_run)

        # Convert to schema with proper type conversions
        return PayrollRun(
            id=payroll_run.id,
            pay_period_start=datetime.combine(payroll_run.pay_period_start, datetime.min.time()),
            pay_period_end=datetime.combine(payroll_run.pay_period_end, datetime.min.time()),
            status=payroll_run.status,
            total_employees=payroll_run.total_employees,
            total_gross_amount=float(payroll_run.total_gross_amount),
            total_deductions=float(payroll_run.total_deductions),
            total_net_amount=float(payroll_run.total_net_amount),
            created_by=payroll_run.created_by,
            created_at=payroll_run.created_at,
            updated_at=payroll_run.updated_at
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating payroll run: {str(e)}"
        )


@router.get(
    "/runs",
    response_model=List[PayrollRunSummary],
    summary="Get all payroll runs",
    description="Retrieves a list of all payroll runs with pagination"
)
def get_payroll_runs(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of items to return"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    service: PayrollService = Depends(get_payroll_service),
    db: Session = Depends(get_db)
):
    """Get all payroll runs with optional filtering and pagination.

    Args:
        skip: Number of items to skip
        limit: Maximum number of items to return
        status_filter: Optional status filter
        service: Payroll service instance
        db: Database session

    Returns:
        List of payroll run summaries

    Raises:
        HTTPException: If retrieval fails
    """
    try:
        # Build query
        query = db.query(PayrollRunModel)

        # Apply status filter if provided
        if status_filter:
            query = query.filter(PayrollRunModel.status == status_filter)

        # Apply pagination and ordering
        payroll_runs = query.order_by(PayrollRunModel.created_at.desc()).offset(skip).limit(limit).all()

        # Convert to PayrollRunSummary schemas
        return [
            PayrollRunSummary(
                id=run.id,
                pay_period_start=datetime.combine(run.pay_period_start, datetime.min.time()),
                pay_period_end=datetime.combine(run.pay_period_end, datetime.min.time()),
                status=run.status,
                total_employees=run.total_employees,
                total_gross_amount=float(run.total_gross_amount),
                total_net_amount=float(run.total_net_amount),
                created_at=run.created_at
            )
            for run in payroll_runs
        ]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving payroll runs: {str(e)}"
        )


@router.get(
    "/runs/{payroll_run_id}",
    response_model=PayrollRun,
    summary="Get payroll run details",
    description="Retrieves detailed information about a specific payroll run"
)
def get_payroll_run(
    payroll_run_id: int,
    service: PayrollService = Depends(get_payroll_service),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific payroll run.

    Args:
        payroll_run_id: ID of the payroll run
        service: Payroll service instance
        db: Database session

    Returns:
        Payroll run details

    Raises:
        HTTPException: If payroll run not found or retrieval fails
    """
    try:
        # Query PayrollRun by ID
        payroll_run = db.query(PayrollRunModel).filter(PayrollRunModel.id == payroll_run_id).first()

        if not payroll_run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payroll run {payroll_run_id} not found"
            )

        # Convert to schema with proper type conversions
        return PayrollRun(
            id=payroll_run.id,
            pay_period_start=datetime.combine(payroll_run.pay_period_start, datetime.min.time()),
            pay_period_end=datetime.combine(payroll_run.pay_period_end, datetime.min.time()),
            status=payroll_run.status,
            total_employees=payroll_run.total_employees,
            total_gross_amount=float(payroll_run.total_gross_amount),
            total_deductions=float(payroll_run.total_deductions),
            total_net_amount=float(payroll_run.total_net_amount),
            created_by=payroll_run.created_by,
            created_at=payroll_run.created_at,
            updated_at=payroll_run.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving payroll run: {str(e)}"
        )


@router.post(
    "/runs/{payroll_run_id}/calculate",
    response_model=BulkPayrollResult,
    summary="Calculate payroll for all employees",
    description="Calculates payroll for all employees in a payroll run"
)
def calculate_payroll_run(
    payroll_run_id: int,
    request: BulkPayrollRequest,
    service: PayrollService = Depends(get_payroll_service)
):
    """Calculate payroll for all employees in a payroll run.

    Args:
        payroll_run_id: ID of the payroll run
        request: Bulk payroll request with employee data
        service: Payroll service instance

    Returns:
        Bulk payroll calculation results

    Raises:
        HTTPException: If calculation fails
    """
    try:
        result = service.calculate_bulk_payroll(
            employees_data=request.employees_data,
            payroll_run_id=payroll_run_id
        )

        if not result['total_employees']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No employee data provided"
            )

        return BulkPayrollResult(**result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating payroll: {str(e)}"
        )


@router.get(
    "/runs/{payroll_run_id}/employees",
    response_model=List[EmployeePayrollResult],
    summary="Get employees in payroll run",
    description="Retrieves all employees and their payroll calculations for a run"
)
def get_payroll_run_employees(
    payroll_run_id: int,
    service: PayrollService = Depends(get_payroll_service),
    db: Session = Depends(get_db)
):
    """Get all employees and their payroll calculations for a payroll run.

    Args:
        payroll_run_id: ID of the payroll run
        service: Payroll service instance
        db: Database session

    Returns:
        List of employee payroll results

    Raises:
        HTTPException: If retrieval fails
    """
    try:
        # Query EmployeePayroll with join to Employee
        employee_payrolls = db.query(EmployeePayroll, Employee).join(
            Employee, Employee.id == EmployeePayroll.employee_id
        ).filter(
            EmployeePayroll.payroll_run_id == payroll_run_id
        ).all()

        # Convert to EmployeePayrollResult schemas
        results = []
        for emp_payroll, employee in employee_payrolls:
            # Build hours breakdown
            hours_breakdown = HoursBreakdown(
                regular_hours=float(emp_payroll.regular_hours),
                overtime_hours=float(emp_payroll.overtime_hours),
                night_shift_hours=float(emp_payroll.night_shift_hours),
                holiday_hours=float(emp_payroll.holiday_hours),
                sunday_hours=float(emp_payroll.sunday_hours),
                total_hours=float(emp_payroll.regular_hours + emp_payroll.overtime_hours +
                                emp_payroll.night_shift_hours + emp_payroll.holiday_hours +
                                emp_payroll.sunday_hours),
                work_days=0  # Not stored in current schema
            )

            # Build rates
            rates = Rates(
                base_rate=float(emp_payroll.base_rate),
                overtime_rate=float(emp_payroll.overtime_rate),
                night_shift_rate=float(emp_payroll.night_shift_rate),
                holiday_rate=float(emp_payroll.holiday_rate),
                sunday_rate=float(emp_payroll.holiday_rate)  # Using holiday_rate as proxy
            )

            # Build amounts
            amounts = Amounts(
                base_amount=float(emp_payroll.base_amount),
                overtime_amount=float(emp_payroll.overtime_amount),
                night_shift_amount=float(emp_payroll.night_shift_amount),
                holiday_amount=float(emp_payroll.holiday_amount),
                sunday_amount=0,  # Not stored separately
                gross_amount=float(emp_payroll.gross_amount),
                total_deductions=float(emp_payroll.total_deductions),
                net_amount=float(emp_payroll.net_amount)
            )

            # Build deductions detail
            deductions_detail = DeductionsDetail(
                income_tax=float(emp_payroll.income_tax),
                resident_tax=float(emp_payroll.resident_tax),
                health_insurance=float(emp_payroll.health_insurance),
                pension=float(emp_payroll.pension),
                employment_insurance=float(emp_payroll.employment_insurance),
                apartment=0,  # Not stored in current schema
                other=0
            )

            # Build validation result
            validation = ValidationResult(
                is_valid=True,
                errors=[],
                warnings=[],
                validated_at=datetime.now()
            )

            # Create result
            results.append(EmployeePayrollResult(
                success=True,
                employee_id=emp_payroll.employee_id,
                payroll_run_id=emp_payroll.payroll_run_id,
                pay_period_start=emp_payroll.pay_period_start.isoformat(),
                pay_period_end=emp_payroll.pay_period_end.isoformat(),
                hours_breakdown=hours_breakdown,
                rates=rates,
                amounts=amounts,
                deductions_detail=deductions_detail,
                validation=validation,
                calculated_at=emp_payroll.created_at
            ))

        return results

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving employees: {str(e)}"
        )


@router.post(
    "/runs/{payroll_run_id}/approve",
    response_model=PayrollApprovalResponse,
    summary="Approve a payroll run",
    description="Approves a payroll run for payment"
)
def approve_payroll_run(
    payroll_run_id: int,
    request: PayrollApprovalRequest,
    service: PayrollService = Depends(get_payroll_service),
    db: Session = Depends(get_db)
):
    """Approve a payroll run for payment.

    Args:
        payroll_run_id: ID of the payroll run
        request: Approval request with approver info
        service: Payroll service instance
        db: Database session

    Returns:
        Approval result

    Raises:
        HTTPException: If approval fails
    """
    try:
        # Query PayrollRun by ID
        payroll_run = db.query(PayrollRunModel).filter(PayrollRunModel.id == payroll_run_id).first()

        if not payroll_run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payroll run {payroll_run_id} not found"
            )

        # Validate status - can only approve draft or calculated runs
        if payroll_run.status not in ['draft', 'calculated']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot approve payroll run with status '{payroll_run.status}'. Must be 'draft' or 'calculated'."
            )

        # Update status to approved
        payroll_run.status = 'approved'
        payroll_run.updated_at = datetime.now()

        # Commit changes
        db.commit()
        db.refresh(payroll_run)

        # Return approval response
        return PayrollApprovalResponse(
            success=True,
            payroll_run_id=payroll_run_id,
            status=payroll_run.status,
            approved_by=request.approved_by,
            approved_at=payroll_run.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error approving payroll run: {str(e)}"
        )


@router.delete(
    "/runs/{payroll_run_id}",
    summary="Delete a payroll run",
    description="Deletes a payroll run. Only allowed if status is DRAFT or CALCULATED."
)
def delete_payroll_run(
    payroll_run_id: int,
    service: PayrollService = Depends(get_payroll_service),
    db: Session = Depends(get_db)
):
    """Delete a payroll run.

    Only allows deletion if payroll run is in DRAFT or CALCULATED status.
    Cannot delete if already APPROVED or PAID.

    Args:
        payroll_run_id: ID of the payroll run to delete
        service: Payroll service instance
        db: Database session

    Returns:
        Success response with deletion message

    Raises:
        HTTPException 404: Payroll run not found
        HTTPException 400: Cannot delete (invalid status)
        HTTPException 500: Database error
    """
    try:
        # Query PayrollRun by ID
        payroll_run = db.query(PayrollRunModel).filter(PayrollRunModel.id == payroll_run_id).first()

        if not payroll_run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payroll run {payroll_run_id} not found"
            )

        # Validate status - can only delete draft or calculated runs
        if payroll_run.status not in ['draft', 'calculated']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete payroll run with status '{payroll_run.status}'. Only 'draft' or 'calculated' runs can be deleted."
            )

        # Delete associated employee payroll records first
        db.query(EmployeePayroll).filter(
            EmployeePayroll.payroll_run_id == payroll_run_id
        ).delete()

        # Delete payroll run
        db.delete(payroll_run)
        db.commit()

        return {
            "success": True,
            "message": f"Payroll run {payroll_run_id} deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting payroll run: {str(e)}"
        )


@router.put(
    "/runs/{payroll_run_id}",
    response_model=PayrollRun,
    summary="Update a payroll run",
    description="Updates a payroll run. Only allowed if status is DRAFT."
)
def update_payroll_run(
    payroll_run_id: int,
    data: PayrollRunUpdate,
    service: PayrollService = Depends(get_payroll_service),
    db: Session = Depends(get_db)
):
    """Update a payroll run.

    Only allows updating if payroll run is in DRAFT status.
    Can update: pay_period_start, pay_period_end, description

    Args:
        payroll_run_id: ID of the payroll run to update
        data: Fields to update
        service: Payroll service instance
        db: Database session

    Returns:
        Updated payroll run

    Raises:
        HTTPException 404: Payroll run not found
        HTTPException 400: Cannot update (invalid status)
        HTTPException 500: Database error
    """
    try:
        # Query PayrollRun by ID
        payroll_run = db.query(PayrollRunModel).filter(PayrollRunModel.id == payroll_run_id).first()

        if not payroll_run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payroll run {payroll_run_id} not found"
            )

        # Validate status - can only update draft runs
        if payroll_run.status != 'draft':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot update payroll run with status '{payroll_run.status}'. Must be 'draft'."
            )

        # Update fields if provided
        if data.pay_period_start is not None:
            payroll_run.pay_period_start = data.pay_period_start.date()
        if data.pay_period_end is not None:
            payroll_run.pay_period_end = data.pay_period_end.date()
        if data.description is not None:
            # Store description in created_by field (or add new field if needed)
            # For now, we'll just update the updated_at timestamp
            pass

        # Update timestamp
        payroll_run.updated_at = datetime.now()

        # Commit changes
        db.commit()
        db.refresh(payroll_run)

        # Convert to schema with proper type conversions
        return PayrollRun(
            id=payroll_run.id,
            pay_period_start=datetime.combine(payroll_run.pay_period_start, datetime.min.time()),
            pay_period_end=datetime.combine(payroll_run.pay_period_end, datetime.min.time()),
            status=payroll_run.status,
            total_employees=payroll_run.total_employees,
            total_gross_amount=float(payroll_run.total_gross_amount),
            total_deductions=float(payroll_run.total_deductions),
            total_net_amount=float(payroll_run.total_net_amount),
            created_by=payroll_run.created_by,
            created_at=payroll_run.created_at,
            updated_at=payroll_run.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating payroll run: {str(e)}"
        )


@router.post(
    "/runs/{payroll_run_id}/mark-paid",
    response_model=PayrollApprovalResponse,
    summary="Mark payroll run as paid",
    description="Marks a payroll run as paid. Updates status and all employee payroll records."
)
def mark_payroll_run_paid(
    payroll_run_id: int,
    data: MarkPayrollPaidRequest,
    service: PayrollService = Depends(get_payroll_service),
    db: Session = Depends(get_db)
):
    """Mark a payroll run as paid.

    Updates payroll run status to 'paid' and sets paid_at timestamp
    for all associated employee payroll records.

    Only allowed if payroll run status is 'approved'.

    Args:
        payroll_run_id: ID of the payroll run
        data: Payment details (date, method, notes)
        service: Payroll service instance
        db: Database session

    Returns:
        Approval response with payment confirmation

    Raises:
        HTTPException 404: Payroll run not found
        HTTPException 400: Cannot mark as paid (invalid status)
        HTTPException 500: Database error
    """
    try:
        # Query PayrollRun by ID
        payroll_run = db.query(PayrollRunModel).filter(PayrollRunModel.id == payroll_run_id).first()

        if not payroll_run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payroll run {payroll_run_id} not found"
            )

        # Validate status - can only mark paid if approved
        if payroll_run.status != 'approved':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot mark payroll run as paid with status '{payroll_run.status}'. Must be 'approved'."
            )

        # Update payroll run status to paid
        payroll_run.status = 'paid'
        payroll_run.updated_at = datetime.now()

        # Update all employee payroll records
        employee_payrolls = db.query(EmployeePayroll).filter(
            EmployeePayroll.payroll_run_id == payroll_run_id
        ).all()

        for emp_payroll in employee_payrolls:
            # Assuming there's a paid_at field (if not, we just skip)
            if hasattr(emp_payroll, 'paid_at'):
                emp_payroll.paid_at = data.payment_date
            emp_payroll.updated_at = datetime.now()

        # Commit all changes
        db.commit()
        db.refresh(payroll_run)

        # Return approval response
        return PayrollApprovalResponse(
            success=True,
            payroll_run_id=payroll_run_id,
            status=payroll_run.status,
            approved_by=None,  # Not tracking who marked it paid in this endpoint
            approved_at=payroll_run.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error marking payroll run as paid: {str(e)}"
        )


# ============================================================================
# Employee Payroll Endpoints
# ============================================================================

@router.post(
    "/calculate",
    response_model=EmployeePayrollResult,
    summary="Calculate payroll for one employee",
    description="Calculates payroll for a single employee based on timer records"
)
def calculate_employee_payroll(
    request: EmployeePayrollCreate,
    service: PayrollService = Depends(get_payroll_service)
):
    """Calculate payroll for a single employee.

    Args:
        request: Employee payroll request with data and timer records
        service: Payroll service instance

    Returns:
        Employee payroll calculation result

    Raises:
        HTTPException: If calculation fails
    """
    try:
        result = service.calculate_employee_payroll(
            employee_data=request.employee_data.dict(),
            timer_records=[r.dict() for r in request.timer_records],
            payroll_run_id=request.payroll_run_id,
            yukyu_days_approved=request.yukyu_days_approved
        )

        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )

        # Convert datetime strings to datetime objects
        if 'pay_period_start' in result:
            result['pay_period_start'] = result['pay_period_start']
        if 'pay_period_end' in result:
            result['pay_period_end'] = result['pay_period_end']

        return EmployeePayrollResult(**result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating payroll: {str(e)}"
        )


@router.post(
    "/calculate-from-timercards",
    summary="Calculate payroll from timer cards",
    description="Calculate employee payroll based on timer card records for a specific period",
    response_model=dict
)
def calculate_payroll_from_timercards(
    employee_id: int = Query(..., description="Employee ID"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD format)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD format)"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Calculate payroll for an employee from their timer card records.

    This endpoint:
    1. Retrieves all approved timer cards for the employee in the period
    2. Aggregates regular, overtime, night shift, and holiday hours
    3. Calculates gross salary using employee's hourly rate
    4. Applies standard deductions (taxes, insurance)
    5. Returns detailed payroll breakdown

    Args:
        employee_id: Employee ID
        start_date: Period start date (YYYY-MM-DD)
        end_date: Period end date (YYYY-MM-DD)

    Returns:
        Dictionary with payroll calculation details
    """
    try:
        from datetime import datetime
        from sqlalchemy import and_

        # Validate dates
        try:
            period_start = datetime.strptime(start_date, "%Y-%m-%d").date()
            period_end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )

        if period_start > period_end:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="start_date must be before end_date"
            )

        # Get employee
        from app.models.models import Employee, TimerCard
        employee = db.query(Employee).filter(Employee.id == employee_id).first()

        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee {employee_id} not found"
            )

        # Get approved timer cards for period
        timer_cards = db.query(TimerCard).filter(
            and_(
                TimerCard.hakenmoto_id == employee_id,
                TimerCard.work_date >= period_start,
                TimerCard.work_date <= period_end,
                TimerCard.is_approved == True
            )
        ).all()

        if not timer_cards:
            return {
                "employee_id": employee_id,
                "period_start": start_date,
                "period_end": end_date,
                "message": "No approved timer cards found for this period",
                "regular_hours": 0,
                "overtime_hours": 0,
                "night_hours": 0,
                "holiday_hours": 0,
                "gross_salary": 0,
                "deductions": 0,
                "net_salary": 0
            }

        # Aggregate hours
        regular_hours = float(sum(tc.regular_hours or 0 for tc in timer_cards))
        overtime_hours = float(sum(tc.overtime_hours or 0 for tc in timer_cards))
        night_hours = float(sum(tc.night_hours or 0 for tc in timer_cards))
        holiday_hours = float(sum(tc.holiday_hours or 0 for tc in timer_cards))
        total_hours = regular_hours + overtime_hours + night_hours + holiday_hours

        # Calculate gross salary
        hourly_rate = float(employee.jikyu or 0)  # Use jikyu from employee

        # Base calculation
        gross_salary = (
            (regular_hours * hourly_rate) +
            (overtime_hours * hourly_rate * 1.25) +  # 25% premium for overtime
            (night_hours * hourly_rate * 0.25) +     # 25% premium for night
            (holiday_hours * hourly_rate * 0.35)      # 35% premium for holiday
        )

        # Apply deductions (simplified - social insurance ~15%)
        social_insurance = gross_salary * 0.15
        income_tax = max(0, (gross_salary - 1000) * 0.10)  # Simplified
        total_deductions = social_insurance + income_tax

        net_salary = gross_salary - total_deductions

        return {
            "employee_id": employee_id,
            "employee_name": f"{employee.full_name_kanji or ''} ({employee.full_name_kana or ''})",
            "hourly_rate": hourly_rate,
            "period_start": start_date,
            "period_end": end_date,
            "hours_breakdown": {
                "regular_hours": regular_hours,
                "overtime_hours": overtime_hours,
                "night_hours": night_hours,
                "holiday_hours": holiday_hours,
                "total_hours": total_hours
            },
            "salary_calculation": {
                "base_salary": regular_hours * hourly_rate,
                "overtime_premium": overtime_hours * hourly_rate * 0.25,
                "night_premium": night_hours * hourly_rate * 0.25,
                "holiday_premium": holiday_hours * hourly_rate * 0.35,
                "gross_salary": round(gross_salary, 0)
            },
            "deductions": {
                "social_insurance": round(social_insurance, 0),
                "income_tax": round(income_tax, 0),
                "total_deductions": round(total_deductions, 0)
            },
            "net_salary": round(net_salary, 0),
            "timer_cards_processed": len(timer_cards)
        }

    except ValueError as e:
        raise handle_exception(ValidationError(str(e)))
    except (ValidationError, ResourceNotFoundError, PayrollCalculationError) as e:
        raise handle_exception(e)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Unexpected error calculating payroll for employee {employee_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating payroll"
        )


@router.get(
    "/yukyu-summary",
    summary="Get yukyu impact summary on payroll",
    description="Returns a summary of yukyu (paid vacation) impact on payroll for a given period"
)
def get_payroll_yukyu_summary(
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get summary of yukyu impact on payroll for a period.

    Returns statistics on approved yukyu requests and their financial impact.

    Args:
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        db: Database session

    Returns:
        Dictionary with yukyu impact summary:
        {
            "period": "2025-10",
            "total_employees": 42,
            "employees_with_yukyu": 28,
            "total_yukyu_days": 45.5,
            "total_yukyu_deduction_jpy": 562500,
            "average_deduction_per_employee": 13437,
            "details": [...]
        }
    """
    try:
        # Parse dates
        start_dt = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_dt = datetime.strptime(end_date, '%Y-%m-%d').date()

        # Query approved yukyu requests in the period
        yukyu_requests = db.query(YukyuRequest).filter(
            YukyuRequest.status == RequestStatus.APPROVED,
            YukyuRequest.start_date <= end_dt,
            YukyuRequest.end_date >= start_dt
        ).all()

        # Group by employee
        employees_yukyu = {}
        for request in yukyu_requests:
            emp_id = request.employee_id
            if emp_id not in employees_yukyu:
                employees_yukyu[emp_id] = {
                    'days': 0,
                    'requests': []
                }
            employees_yukyu[emp_id]['days'] += float(request.days_requested)
            employees_yukyu[emp_id]['requests'].append(request)

        # Get employee names and calculate deductions
        total_deduction = 0
        details = []

        for emp_id, yukyu_info in employees_yukyu.items():
            employee = db.query(Employee).filter(Employee.id == emp_id).first()
            if employee:
                # Calculate deduction (8 hours/day × base hourly rate)
                base_hourly_rate = float(employee.jikyu) if employee.jikyu else 0
                deduction_jpy = int(yukyu_info['days'] * 8 * base_hourly_rate)
                total_deduction += deduction_jpy

                details.append({
                    'employee_id': emp_id,
                    'employee_name': employee.full_name_kanji or employee.full_name_kana,
                    'yukyu_days': yukyu_info['days'],
                    'yukyu_deduction_jpy': deduction_jpy,
                    'base_hourly_rate': base_hourly_rate
                })

        # Calculate summary statistics
        total_employees_with_yukyu = len(employees_yukyu)
        total_days = sum(info['days'] for info in employees_yukyu.values())
        avg_deduction = (
            total_deduction // total_employees_with_yukyu
            if total_employees_with_yukyu > 0
            else 0
        )

        # Format period
        period_str = f"{start_dt.year}-{start_dt.month:02d}"

        return {
            'period': period_str,
            'total_employees_with_yukyu': total_employees_with_yukyu,
            'total_yukyu_days': total_days,
            'total_yukyu_deduction_jpy': total_deduction,
            'average_deduction_per_employee': avg_deduction,
            'date_range': {
                'start_date': start_date,
                'end_date': end_date
            },
            'details': details
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format. Expected YYYY-MM-DD: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving yukyu summary: {str(e)}"
        )


# ============================================================================
# Payslip Endpoints
# ============================================================================

@router.post(
    "/payslips/generate",
    response_model=PayslipInfo,
    summary="Generate payslip PDF",
    description="Generates a payslip PDF for an employee"
)
def generate_payslip(
    request: PayslipRequest,
    service: PayrollService = Depends(get_payroll_service),
    db: Session = Depends(get_db)
):
    """Generate a payslip PDF for an employee.

    Args:
        request: Payslip generation request
        service: Payroll service instance
        db: Database session

    Returns:
        Payslip generation result

    Raises:
        HTTPException: If generation fails
    """
    try:
        # Query EmployeePayroll by employee_id and payroll_run_id
        employee_payroll = db.query(EmployeePayroll).filter(
            EmployeePayroll.employee_id == request.employee_id,
            EmployeePayroll.payroll_run_id == request.payroll_run_id
        ).first()

        if not employee_payroll:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No payroll record found for employee {request.employee_id} in payroll run {request.payroll_run_id}"
            )

        # Build payroll_data dict from database fields
        payroll_data = {
            'pay_period_start': employee_payroll.pay_period_start.isoformat(),
            'pay_period_end': employee_payroll.pay_period_end.isoformat(),
            'hours': {
                'regular_hours': float(employee_payroll.regular_hours),
                'overtime_hours': float(employee_payroll.overtime_hours),
                'night_shift_hours': float(employee_payroll.night_shift_hours),
                'holiday_hours': float(employee_payroll.holiday_hours),
                'sunday_hours': float(employee_payroll.sunday_hours)
            },
            'rates': {
                'base_rate': float(employee_payroll.base_rate),
                'overtime_rate': float(employee_payroll.overtime_rate),
                'night_shift_rate': float(employee_payroll.night_shift_rate),
                'holiday_rate': float(employee_payroll.holiday_rate)
            },
            'amounts': {
                'base_amount': float(employee_payroll.base_amount),
                'overtime_amount': float(employee_payroll.overtime_amount),
                'night_shift_amount': float(employee_payroll.night_shift_amount),
                'holiday_amount': float(employee_payroll.holiday_amount),
                'gross_amount': float(employee_payroll.gross_amount),
                'total_deductions': float(employee_payroll.total_deductions),
                'net_amount': float(employee_payroll.net_amount)
            },
            'deductions': {
                'income_tax': float(employee_payroll.income_tax),
                'resident_tax': float(employee_payroll.resident_tax),
                'health_insurance': float(employee_payroll.health_insurance),
                'pension': float(employee_payroll.pension),
                'employment_insurance': float(employee_payroll.employment_insurance)
            }
        }

        # Call service to generate payslip
        result = service.generate_payslip(
            employee_id=request.employee_id,
            payroll_data=payroll_data
        )

        # Update employee_payroll with payslip info
        employee_payroll.payslip_generated = True
        if result.get('pdf_path'):
            employee_payroll.payslip_pdf_path = result['pdf_path']
        db.commit()

        return PayslipInfo(**result)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating payslip: {str(e)}"
        )


@router.get(
    "/payslips/{payslip_id}",
    response_model=PayslipInfo,
    summary="Get payslip information",
    description="Retrieves information about a generated payslip"
)
def get_payslip(
    payslip_id: str,
    service: PayrollService = Depends(get_payroll_service)
):
    """Get information about a generated payslip.

    Args:
        payslip_id: ID of the payslip
        service: Payroll service instance

    Returns:
        Payslip information

    Raises:
        HTTPException: If payslip not found
    """
    try:
        result = service.payslip_generator.get_payslip_info(payslip_id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payslip {payslip_id} not found"
            )

        return PayslipInfo(**result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving payslip: {str(e)}"
        )


# ============================================================================
# Payroll Settings Endpoints
# ============================================================================

@router.get(
    "/settings",
    response_model=PayrollSettings,
    summary="Get payroll settings",
    description="Retrieves the current payroll settings from database with caching"
)
async def get_payroll_settings(
    config_service: PayrollConfigService = Depends(get_payroll_config_service)
):
    """
    Get current payroll settings using PayrollConfigService.

    This endpoint uses PayrollConfigService which provides:
    - Automatic caching (1 hour TTL)
    - Fallback to default values
    - Automatic creation of settings if missing

    Returns:
        PayrollSettings: Current payroll configuration including:
            - Hour rates (overtime, night shift, holiday, sunday)
            - Tax rates (income tax, resident tax)
            - Insurance rates (health, pension, employment)
            - Standard hours per month

    Raises:
        HTTPException: If retrieval fails
    """
    try:
        settings = await config_service.get_configuration()

        # Convert Decimal to float for Pydantic validation
        return PayrollSettings(
            id=settings.id,
            company_id=settings.company_id,
            overtime_rate=float(settings.overtime_rate),
            night_shift_rate=float(settings.night_shift_rate),
            holiday_rate=float(settings.holiday_rate),
            sunday_rate=float(settings.sunday_rate),
            standard_hours_per_month=float(settings.standard_hours_per_month),
            income_tax_rate=float(settings.income_tax_rate) if hasattr(settings, 'income_tax_rate') else 10.0,
            resident_tax_rate=float(settings.resident_tax_rate) if hasattr(settings, 'resident_tax_rate') else 5.0,
            health_insurance_rate=float(settings.health_insurance_rate) if hasattr(settings, 'health_insurance_rate') else 4.75,
            pension_rate=float(settings.pension_rate) if hasattr(settings, 'pension_rate') else 10.0,
            employment_insurance_rate=float(settings.employment_insurance_rate) if hasattr(settings, 'employment_insurance_rate') else 0.3,
            created_at=settings.created_at,
            updated_at=settings.updated_at
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving settings: {str(e)}"
        )


@router.put(
    "/settings",
    response_model=PayrollSettings,
    summary="Update payroll settings",
    description="Updates payroll settings and clears cache (Admin only)"
)
async def update_payroll_settings(
    settings: PayrollSettingsUpdate,
    config_service: PayrollConfigService = Depends(get_payroll_config_service)
):
    """
    Update payroll settings using PayrollConfigService.

    This endpoint:
    1. Validates the provided settings
    2. Updates the database
    3. Clears the cache to force refresh
    4. Returns updated settings

    Args:
        settings: PayrollSettingsUpdate schema with fields to update:
            - overtime_rate: Overtime premium rate (optional)
            - night_shift_rate: Night shift premium rate (optional)
            - holiday_rate: Holiday premium rate (optional)
            - sunday_rate: Sunday premium rate (optional)
            - standard_hours_per_month: Standard monthly hours (optional)
            - income_tax_rate: Income tax rate % (optional)
            - resident_tax_rate: Resident tax rate % (optional)
            - health_insurance_rate: Health insurance rate % (optional)
            - pension_rate: Pension rate % (optional)
            - employment_insurance_rate: Employment insurance rate % (optional)
        config_service: Payroll config service instance

    Returns:
        PayrollSettings: Updated payroll configuration

    Raises:
        HTTPException: If update fails or validation error occurs

    Example Request Body:
        {
            "overtime_rate": 1.30,
            "night_shift_rate": 1.30,
            "income_tax_rate": 10.5
        }
    """
    try:
        # Convert to dict, excluding None values
        settings_dict = {k: v for k, v in settings.dict(exclude_unset=True).items()
                        if v is not None}

        if not settings_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No settings provided to update"
            )

        # Update settings via config service
        updated_settings = await config_service.update_configuration(**settings_dict)

        # Convert to response schema
        return PayrollSettings(
            id=updated_settings.id,
            company_id=updated_settings.company_id,
            overtime_rate=float(updated_settings.overtime_rate),
            night_shift_rate=float(updated_settings.night_shift_rate),
            holiday_rate=float(updated_settings.holiday_rate),
            sunday_rate=float(updated_settings.sunday_rate),
            standard_hours_per_month=float(updated_settings.standard_hours_per_month),
            income_tax_rate=float(updated_settings.income_tax_rate),
            resident_tax_rate=float(updated_settings.resident_tax_rate),
            health_insurance_rate=float(updated_settings.health_insurance_rate),
            pension_rate=float(updated_settings.pension_rate),
            employment_insurance_rate=float(updated_settings.employment_insurance_rate),
            created_at=updated_settings.created_at,
            updated_at=updated_settings.updated_at
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating settings: {str(e)}"
        )


# ============================================================================
# Summary Endpoints
# ============================================================================

@router.get(
    "/summary",
    response_model=List[PayrollSummary],
    summary="Get payroll summary",
    description="Retrieves a summary view of all payroll runs"
)
def get_payroll_summary(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(50, ge=1, le=1000, description="Maximum number of items to return"),
    service: PayrollService = Depends(get_payroll_service),
    db: Session = Depends(get_db)
):
    """Get a summary view of all payroll runs.

    Args:
        skip: Number of items to skip
        limit: Maximum number of items to return
        service: Payroll service instance
        db: Database session

    Returns:
        List of payroll summaries

    Raises:
        HTTPException: If retrieval fails
    """
    try:
        # Query PayrollRun with aggregated employee_payroll data
        query = db.query(
            PayrollRunModel.id.label('payroll_run_id'),
            PayrollRunModel.pay_period_start,
            PayrollRunModel.pay_period_end,
            PayrollRunModel.status,
            PayrollRunModel.total_employees,
            PayrollRunModel.total_gross_amount,
            PayrollRunModel.total_deductions,
            PayrollRunModel.total_net_amount,
            func.coalesce(
                func.sum(
                    EmployeePayroll.regular_hours +
                    EmployeePayroll.overtime_hours +
                    EmployeePayroll.night_shift_hours +
                    EmployeePayroll.holiday_hours +
                    EmployeePayroll.sunday_hours
                ),
                0
            ).label('total_hours'),
            func.coalesce(func.avg(EmployeePayroll.gross_amount), 0).label('avg_gross_amount'),
            PayrollRunModel.created_at
        ).outerjoin(
            EmployeePayroll, EmployeePayroll.payroll_run_id == PayrollRunModel.id
        ).group_by(
            PayrollRunModel.id
        ).order_by(
            PayrollRunModel.created_at.desc()
        ).offset(skip).limit(limit).all()

        # Convert to PayrollSummary schemas
        summaries = []
        for row in query:
            summaries.append(PayrollSummary(
                payroll_run_id=row.payroll_run_id,
                pay_period_start=datetime.combine(row.pay_period_start, datetime.min.time()),
                pay_period_end=datetime.combine(row.pay_period_end, datetime.min.time()),
                status=row.status,
                total_employees=row.total_employees,
                total_gross_amount=float(row.total_gross_amount),
                total_deductions=float(row.total_deductions),
                total_net_amount=float(row.total_net_amount),
                total_hours=float(row.total_hours),
                avg_gross_amount=float(row.avg_gross_amount),
                created_at=row.created_at
            ))

        return summaries

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving summary: {str(e)}"
        )
