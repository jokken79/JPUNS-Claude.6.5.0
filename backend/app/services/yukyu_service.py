"""
Yukyu Service (有給休暇サービス)
================================

Service for managing paid vacation (yukyu) following Japanese labor law.

Features:
- Automatic calculation based on employment duration (6mo=10d, 18mo=11d, etc.)
- LIFO deduction (newest yukyus used first)
- Automatic expiration after 2 years (時効 - jikou)
- Request workflow: TANTOSHA creates → KEITOSAN approves
- Support for hannichi (半休 - half day = 0.5)
- Alerts for 5-day minimum usage requirement

Author: UNS-ClaudeJP System
"""

from sqlalchemy.orm import Session
from sqlalchemy import or_, func, desc
from typing import Dict, List, Optional, Tuple
from datetime import datetime, date, timedelta
from decimal import Decimal
from dateutil.relativedelta import relativedelta

from app.services.notification_service import notification_service
from app.models.models import (
    YukyuBalance,
    YukyuRequest,
    YukyuUsageDetail,
    Employee,
    User,
    Factory,
    YukyuStatus,
    RequestStatus,
    RequestType,
    UserRole,
)
from app.schemas.yukyu import (
    YukyuBalanceCreate,
    YukyuBalanceUpdate,
    YukyuBalanceResponse,
    YukyuBalanceSummary,
    YukyuRequestCreate,
    YukyuRequestUpdate,
    YukyuRequestApprove,
    YukyuRequestReject,
    YukyuRequestResponse,
    YukyuCalculationRequest,
    YukyuCalculationResponse,
    YukyuReport,
    YukyuAlert,
    EmployeeByFactoryResponse,
)


class YukyuService:
    """Service for yukyu (paid vacation) operations"""

    def __init__(self, db: Session):
        self.db = db

    # -------------------------------------------------------------------------
    # YUKYU CALCULATION (Japanese Labor Law)
    # -------------------------------------------------------------------------

    def calculate_yukyu_entitlement(self, hire_date: date, current_date: date = None) -> Tuple[int, int]:
        """
        Calculate yukyu entitlement based on Japanese labor law.

        Law reference:
        - 6 months:   10 days
        - 1.5 years:  11 days
        - 2.5 years:  12 days
        - 3.5 years:  14 days
        - 4.5 years:  16 days
        - 5.5 years:  18 days
        - 6.5+ years: 20 days (maximum)

        Args:
            hire_date: Employee hire date (入社日)
            current_date: Date to calculate from (defaults to today)

        Returns:
            Tuple[months_worked, days_entitled]
        """
        if current_date is None:
            current_date = date.today()

        # Calculate months since hire
        delta = relativedelta(current_date, hire_date)
        months_worked = delta.years * 12 + delta.months

        # Determine yukyu days based on months
        if months_worked < 6:
            return months_worked, 0
        elif months_worked < 18:
            return months_worked, 10
        elif months_worked < 30:
            return months_worked, 11
        elif months_worked < 42:
            return months_worked, 12
        elif months_worked < 54:
            return months_worked, 14
        elif months_worked < 66:
            return months_worked, 16
        elif months_worked < 78:
            return months_worked, 18
        else:
            return months_worked, 20

    def get_assignment_date(self, hire_date: date, months: int) -> date:
        """
        Get the date when yukyu should be assigned.

        Args:
            hire_date: Employee hire date
            months: Months since hire (6, 18, 30, 42, etc.)

        Returns:
            Assignment date
        """
        return hire_date + relativedelta(months=months)

    async def calculate_and_create_balances(
        self,
        employee_id: int,
        calculation_date: date = None
    ) -> YukyuCalculationResponse:
        """
        Calculate and create yukyu balances for an employee.

        This creates all missing balance records from hire date to current date.
        Called when:
        - Employee is first created
        - Monthly cron job to assign new yukyus
        - Manual recalculation by admin

        Args:
            employee_id: Employee ID
            calculation_date: Date to calculate up to (defaults to today)

        Returns:
            Calculation result with number of balances created

        Raises:
            HTTPException: If employee not found
        """
        from fastapi import HTTPException

        if calculation_date is None:
            calculation_date = date.today()

        # Get employee
        employee = self.db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        if not employee.hire_date:
            raise HTTPException(status_code=400, detail="Employee has no hire date")

        # Calculate entitlement
        months_worked, _ = self.calculate_yukyu_entitlement(employee.hire_date, calculation_date)

        # Get existing balances
        existing_balances = self.db.query(YukyuBalance).filter(
            YukyuBalance.employee_id == employee_id
        ).all()
        existing_months = {b.months_worked for b in existing_balances}

        # Create missing balances
        milestones = [6, 18, 30, 42, 54, 66, 78, 90, 102, 114, 126]  # Up to ~10 years
        balances_created = 0

        for milestone in milestones:
            if milestone > months_worked:
                break

            if milestone in existing_months:
                continue

            # Calculate days for this milestone
            _, days = self.calculate_yukyu_entitlement(employee.hire_date,
                                                        self.get_assignment_date(employee.hire_date, milestone))

            # Get carryover from previous balance
            carryover = 0
            if milestone > 6:
                prev_balance = self.db.query(YukyuBalance).filter(
                    YukyuBalance.employee_id == employee_id,
                    YukyuBalance.months_worked == milestone - 12
                ).first()

                if prev_balance:
                    carryover = prev_balance.days_remaining

            # Create balance
            assigned_date = self.get_assignment_date(employee.hire_date, milestone)
            expires_on = assigned_date + relativedelta(years=2)
            fiscal_year = assigned_date.year

            balance = YukyuBalance(
                employee_id=employee_id,
                fiscal_year=fiscal_year,
                assigned_date=assigned_date,
                months_worked=milestone,
                days_assigned=days,
                days_carried_over=carryover,
                days_total=days + carryover,
                days_used=0,
                days_remaining=days + carryover,
                days_expired=0,
                days_available=days + carryover,
                expires_on=expires_on,
                status=YukyuStatus.ACTIVE,
            )

            self.db.add(balance)
            balances_created += 1

        self.db.commit()

        # Get total available
        total_available = self.db.query(
            func.sum(YukyuBalance.days_available)
        ).filter(
            YukyuBalance.employee_id == employee_id,
            YukyuBalance.status == YukyuStatus.ACTIVE
        ).scalar() or 0

        return YukyuCalculationResponse(
            employee_id=employee_id,
            employee_name=employee.full_name_kanji,
            hire_date=employee.hire_date,
            months_since_hire=months_worked,
            yukyus_created=balances_created,
            total_available_days=total_available,
            message=f"Created {balances_created} yukyu balance(s). Total available: {total_available} days."
        )

    # -------------------------------------------------------------------------
    # YUKYU BALANCE QUERIES
    # -------------------------------------------------------------------------

    async def get_employee_yukyu_summary(self, employee_id: int) -> YukyuBalanceSummary:
        """
        Get complete yukyu summary for an employee.

        Args:
            employee_id: Employee ID

        Returns:
            Complete summary with all balances and alerts

        Raises:
            HTTPException: If employee not found
        """
        from fastapi import HTTPException

        employee = self.db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        # Get all active balances
        balances = self.db.query(YukyuBalance).filter(
            YukyuBalance.employee_id == employee_id,
            YukyuBalance.status == YukyuStatus.ACTIVE
        ).order_by(YukyuBalance.assigned_date.desc()).all()

        # Calculate totals
        total_available = sum(b.days_available for b in balances)
        total_used = sum(b.days_used for b in balances)
        total_expired = sum(b.days_expired for b in balances)

        # Find oldest expiration date
        oldest_expiration = None
        if balances:
            oldest_expiration = min(b.expires_on for b in balances)

        # Check if needs to use 5 days minimum (current fiscal year)
        current_fiscal_year = date.today().year
        if date.today().month < 4:
            # If we're in Jan-Mar, we're in previous fiscal year
            current_fiscal_year -= 1

        compliance_check = self.check_minimum_5_days(employee_id, current_fiscal_year)
        needs_5_days = not compliance_check['is_compliant']

        return YukyuBalanceSummary(
            employee_id=employee_id,
            employee_name=employee.full_name_kanji,
            total_available=total_available,
            total_used=total_used,
            total_expired=total_expired,
            balances=[YukyuBalanceResponse.model_validate(b) for b in balances],
            oldest_expiration_date=oldest_expiration,
            needs_to_use_minimum_5_days=needs_5_days
        )

    async def get_employees_by_factory(self, factory_id: str) -> List[EmployeeByFactoryResponse]:
        """
        Get all employees in a factory with their yukyu availability.

        Used by TANTOSHA to see employees they can request yukyus for.

        Args:
            factory_id: Factory ID (派遣先ID)

        Returns:
            List of employees with yukyu info
        """
        employees = self.db.query(Employee).filter(
            Employee.factory_id == factory_id
        ).all()

        result = []
        for emp in employees:
            # Calculate total available yukyus
            total_available = self.db.query(
                func.sum(YukyuBalance.days_available)
            ).filter(
                YukyuBalance.employee_id == emp.id,
                YukyuBalance.status == YukyuStatus.ACTIVE
            ).scalar() or 0

            result.append(EmployeeByFactoryResponse(
                id=emp.id,
                rirekisho_id=emp.rirekisho_id,
                full_name_kanji=emp.full_name_kanji,
                full_name_kana=emp.full_name_kana,
                factory_id=emp.factory_id,
                factory_name=emp.factory.name if emp.factory else None,
                hire_date=emp.hire_date,
                yukyu_available=total_available
            ))

        return result

    def check_minimum_5_days(self, employee_id: int, fiscal_year: int) -> Dict:
        """
        Verifica cumplimiento de mínimo 5 días de yukyu por año fiscal.

        Japanese labor law requires employees to take minimum 5 days of paid leave
        per year (年5日の年次有給休暇の取得義務).

        Args:
            employee_id: ID del empleado
            fiscal_year: Año fiscal (e.g., 2025 = April 2025 - March 2026)

        Returns:
            Dict con compliance status y detalles:
            {
                'employee_id': int,
                'fiscal_year': int,
                'fiscal_start': str,
                'fiscal_end': str,
                'total_days_used': float,
                'minimum_required': int,
                'is_compliant': bool,
                'compliance_percentage': float,
                'days_remaining': float,
                'warning': Optional[str]
            }

        Example:
            >>> yukyu_service = YukyuService(db)
            >>> result = yukyu_service.check_minimum_5_days(employee_id=123, fiscal_year=2025)
            >>> print(result['is_compliant'])  # True/False
            >>> print(result['warning'])  # Warning message if not compliant
        """
        from app.models.models import Request

        # Calculate fiscal year dates (April 1 - March 31)
        fiscal_start = date(fiscal_year, 4, 1)
        fiscal_end = date(fiscal_year + 1, 3, 31)

        # Query approved yukyu requests in fiscal year
        yukyu_requests = self.db.query(Request).filter(
            Request.employee_id == employee_id,
            Request.request_type == RequestType.YUKYU,
            Request.status == RequestStatus.APPROVED,
            Request.start_date >= fiscal_start,
            Request.end_date <= fiscal_end,
            Request.deleted_at.is_(None)
        ).all()

        # Sum days used
        total_days_used = sum(float(req.days_requested or 0) for req in yukyu_requests)

        # Check compliance
        minimum_required = 5
        is_compliant = total_days_used >= minimum_required
        compliance_percentage = min((total_days_used / minimum_required) * 100, 100) if minimum_required > 0 else 100

        # Generate warning message if not compliant
        warning = None
        if not is_compliant:
            days_short = minimum_required - total_days_used
            warning = f"警告: 最低{minimum_required}日の有給休暇取得が必要です。現在{total_days_used}日のみ使用。あと{days_short}日必要です。"

        return {
            'employee_id': employee_id,
            'fiscal_year': fiscal_year,
            'fiscal_start': fiscal_start.strftime('%Y-%m-%d'),
            'fiscal_end': fiscal_end.strftime('%Y-%m-%d'),
            'total_days_used': total_days_used,
            'minimum_required': minimum_required,
            'is_compliant': is_compliant,
            'compliance_percentage': round(compliance_percentage, 2),
            'days_remaining': max(minimum_required - total_days_used, 0),
            'warning': warning
        }

    # -------------------------------------------------------------------------
    # YUKYU REQUESTS (TANTOSHA (HR) → KEITOSAN (Finance Manager) workflow)
    # -------------------------------------------------------------------------

    async def create_request(
        self,
        request_data: YukyuRequestCreate,
        user_id: int
    ) -> YukyuRequestResponse:
        """
        Create yukyu request (by TANTOSHA).

        Workflow:
        1. Validate employee exists
        2. Calculate days requested (can be 0.5 for hannichi)
        3. Check employee has enough yukyus available
        4. Create request with status=PENDING
        5. Return request details

        Args:
            request_data: Request data
            user_id: ID of user creating request (TANTOSHA)

        Returns:
            Created request

        Raises:
            HTTPException: If validations fail
        """
        from fastapi import HTTPException

        # Validate employee
        employee = self.db.query(Employee).filter(
            Employee.id == request_data.employee_id
        ).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        # VALIDACIÓN 1: Validar fechas
        # =============================
        today = date.today()
        if request_data.start_date < today:
            raise HTTPException(
                status_code=400,
                detail=f"start_date no puede ser en el pasado (hoy es {today})"
            )
        if request_data.start_date > request_data.end_date:
            raise HTTPException(
                status_code=400,
                detail="start_date debe ser menor o igual a end_date"
            )

        # VALIDACIÓN 2: Validar relación TANTOSHA-Factory
        # ===============================================
        if user_id:  # Obtener el usuario creador
            user = self.db.query(User).filter(User.id == user_id).first()
            if user and user.role == UserRole.TANTOSHA:
                # TANTOSHA debe especificar factory_id
                if not request_data.factory_id:
                    raise HTTPException(
                        status_code=400,
                        detail="TANTOSHA debe especificar factory_id"
                    )
                # TANTOSHA debe pertenecer a la factory especificada
                tantosha_employee = self.db.query(Employee).filter(
                    Employee.user_id == user_id,
                    Employee.factory_id == request_data.factory_id
                ).first()
                if not tantosha_employee:
                    raise HTTPException(
                        status_code=403,
                        detail="No tienes permisos para crear solicitudes en esa factory"
                    )

        # VALIDACIÓN 3: Validar overlap de solicitudes
        # ============================================
        overlapping = self.db.query(YukyuRequest).filter(
            YukyuRequest.employee_id == request_data.employee_id,
            YukyuRequest.status.in_([RequestStatus.PENDING, RequestStatus.APPROVED]),
            YukyuRequest.start_date <= request_data.end_date,
            YukyuRequest.end_date >= request_data.start_date
        ).first()
        if overlapping:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe una solicitud para este empleado en el período {request_data.start_date} a {request_data.end_date}"
            )

        # Calculate total available yukyus
        total_available = self.db.query(
            func.sum(YukyuBalance.days_available)
        ).filter(
            YukyuBalance.employee_id == request_data.employee_id,
            YukyuBalance.status == YukyuStatus.ACTIVE
        ).scalar() or 0

        # Validate enough yukyus
        if request_data.days_requested > total_available:
            raise HTTPException(
                status_code=400,
                detail=f"Employee only has {total_available} yukyu days available, but {request_data.days_requested} were requested"
            )

        # Create request
        yukyu_request = YukyuRequest(
            employee_id=request_data.employee_id,
            requested_by_user_id=user_id,
            factory_id=request_data.factory_id,
            request_type=RequestType(request_data.request_type),
            start_date=request_data.start_date,
            end_date=request_data.end_date,
            days_requested=request_data.days_requested,
            yukyu_available_at_request=total_available,
            status=RequestStatus.PENDING,
            notes=request_data.notes
        )

        self.db.add(yukyu_request)
        self.db.commit()
        self.db.refresh(yukyu_request)

        return await self._build_request_response(yukyu_request)

    async def approve_request(
        self,
        request_id: int,
        approval_data: YukyuRequestApprove,
        user_id: int
    ) -> YukyuRequestResponse:
        """
        Approve yukyu request (by KEITOSAN).

        Workflow:
        1. Get request and validate status is PENDING
        2. Deduct yukyus using LIFO (newest first)
        3. Create usage_details records
        4. Update request status to APPROVED
        5. Return updated request

        Args:
            request_id: Request ID
            approval_data: Approval data
            user_id: ID of user approving (KEITOSAN)

        Returns:
            Approved request

        Raises:
            HTTPException: If request not found or already processed
        """
        from fastapi import HTTPException

        # Get request
        request = self.db.query(YukyuRequest).filter(
            YukyuRequest.id == request_id
        ).first()
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")

        if request.status != RequestStatus.PENDING:
            raise HTTPException(
                status_code=400,
                detail=f"Request is already {request.status.value}"
            )

        # Deduct yukyus using LIFO
        await self._deduct_yukyus_lifo(
            employee_id=request.employee_id,
            days_to_deduct=float(request.days_requested),
            request_id=request.id,
            start_date=request.start_date,
            end_date=request.end_date
        )

        # Update request
        request.status = RequestStatus.APPROVED
        request.approved_by_user_id = user_id
        request.approval_date = datetime.now()
        if approval_data.notes:
            request.notes = (request.notes or "") + f"\n[Approved] {approval_data.notes}"

        self.db.commit()
        self.db.refresh(request)

        # Send notification (async, don't block on failure)
        try:
            employee = self.db.query(Employee).filter(Employee.id == request.employee_id).first()
            approver = self.db.query(User).filter(User.id == user_id).first()

            if employee and employee.email:
                notification_service.notify_yukyu_approval(
                    employee_email=employee.email,
                    employee_name=employee.full_name_kanji or employee.full_name_roman,
                    status="承認",
                    yukyu_date=f"{request.start_date.strftime('%Y年%m月%d日')} - {request.end_date.strftime('%Y年%m月%d日')}",
                    line_user_id=getattr(employee, 'line_user_id', None)
                )
        except Exception as e:
            # Don't fail the request if notification fails
            from loguru import logger
            logger.warning(f"Failed to send approval notification: {str(e)}")

        return await self._build_request_response(request)

    async def reject_request(
        self,
        request_id: int,
        rejection_data: YukyuRequestReject,
        user_id: int
    ) -> YukyuRequestResponse:
        """
        Reject yukyu request (by KEITOSAN).

        Args:
            request_id: Request ID
            rejection_data: Rejection data with reason
            user_id: ID of user rejecting (KEITOSAN)

        Returns:
            Rejected request

        Raises:
            HTTPException: If request not found or already processed
        """
        from fastapi import HTTPException

        # Get request
        request = self.db.query(YukyuRequest).filter(
            YukyuRequest.id == request_id
        ).first()
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")

        if request.status != RequestStatus.PENDING:
            raise HTTPException(
                status_code=400,
                detail=f"Request is already {request.status.value}"
            )

        # Update request
        request.status = RequestStatus.REJECTED
        request.approved_by_user_id = user_id
        request.approval_date = datetime.now()
        request.rejection_reason = rejection_data.rejection_reason

        self.db.commit()
        self.db.refresh(request)

        # Send notification (async, don't block on failure)
        try:
            employee = self.db.query(Employee).filter(Employee.id == request.employee_id).first()
            rejector = self.db.query(User).filter(User.id == user_id).first()

            if employee and employee.email:
                notification_service.notify_yukyu_approval(
                    employee_email=employee.email,
                    employee_name=employee.full_name_kanji or employee.full_name_roman,
                    status="却下",
                    yukyu_date=f"{request.start_date.strftime('%Y年%m月%d日')} - {request.end_date.strftime('%Y年%m月%d日')}",
                    line_user_id=getattr(employee, 'line_user_id', None)
                )
        except Exception as e:
            # Don't fail the request if notification fails
            from loguru import logger
            logger.warning(f"Failed to send rejection notification: {str(e)}")

        return await self._build_request_response(request)

    async def list_requests(
        self,
        user: User,
        factory_id: Optional[str] = None,
        status: Optional[str] = None,
        employee_id: Optional[int] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[YukyuRequestResponse]:
        """
        List yukyu requests with filtering based on user role.

        TANTOSHA: Can only see requests for their factory
        KEITOSAN/ADMIN: Can see all requests

        Args:
            user: Current user
            factory_id: Filter by factory
            status: Filter by status (pending, approved, rejected)
            employee_id: Filter by employee
            limit: Max results
            offset: Pagination offset

        Returns:
            List of requests
        """
        query = self.db.query(YukyuRequest)

        # Role-based filtering
        if user.role == UserRole.TANTOSHA:
            # TANTOSHA can only see their factory's requests
            if not factory_id:
                # Get user's factory from their employee record or config
                # For now, require factory_id
                from fastapi import HTTPException
                raise HTTPException(
                    status_code=400,
                    detail="TANTOSHA must specify factory_id"
                )
            query = query.filter(YukyuRequest.factory_id == factory_id)
        elif factory_id:
            # KEITOSAN/ADMIN can optionally filter by factory
            query = query.filter(YukyuRequest.factory_id == factory_id)

        # Additional filters
        if status:
            query = query.filter(YukyuRequest.status == RequestStatus(status))
        if employee_id:
            query = query.filter(YukyuRequest.employee_id == employee_id)

        # Order and paginate
        requests = query.order_by(
            YukyuRequest.request_date.desc()
        ).limit(limit).offset(offset).all()

        return [await self._build_request_response(r) for r in requests]

    # -------------------------------------------------------------------------
    # LIFO DEDUCTION LOGIC
    # -------------------------------------------------------------------------

    async def _deduct_yukyus_lifo(
        self,
        employee_id: int,
        days_to_deduct: float,
        request_id: int,
        start_date: date,
        end_date: date
    ) -> None:
        """
        Deduct yukyus using LIFO (Last In, First Out).

        Newest yukyus are used first. This is the user's requirement.

        Args:
            employee_id: Employee ID
            days_to_deduct: Days to deduct (can be 0.5 for hannichi)
            request_id: Request ID for tracking
            start_date: Start date of yukyu
            end_date: End date of yukyu

        Raises:
            HTTPException: If not enough yukyus available or transaction fails
        """
        from fastapi import HTTPException

        try:
            # Get active balances, newest first (LIFO)
            balances = self.db.query(YukyuBalance).filter(
                YukyuBalance.employee_id == employee_id,
                YukyuBalance.status == YukyuStatus.ACTIVE,
                YukyuBalance.days_available > 0
            ).order_by(YukyuBalance.assigned_date.desc()).all()

            if not balances:
                raise HTTPException(
                    status_code=400,
                    detail="No yukyu balances available"
                )

            remaining_to_deduct = Decimal(str(days_to_deduct))

            # Generate dates for usage tracking
            usage_dates = []
            current = start_date
            while current <= end_date:
                usage_dates.append(current)
                current += timedelta(days=1)

            # Deduct from newest balances first
            for balance in balances:
                if remaining_to_deduct <= 0:
                    break

                available = Decimal(str(balance.days_available))
                to_deduct_from_this = min(remaining_to_deduct, available)

                # Update balance
                balance.days_used += int(to_deduct_from_this) if to_deduct_from_this == int(to_deduct_from_this) else float(to_deduct_from_this)
                balance.days_remaining = balance.days_total - balance.days_used
                balance.days_available = balance.days_remaining - balance.days_expired

                # Create usage details
                days_per_date = to_deduct_from_this / len(usage_dates) if usage_dates else to_deduct_from_this
                for usage_date in usage_dates:
                    detail = YukyuUsageDetail(
                        request_id=request_id,
                        balance_id=balance.id,
                        usage_date=usage_date,
                        days_deducted=days_per_date
                    )
                    self.db.add(detail)

                remaining_to_deduct -= to_deduct_from_this

            if remaining_to_deduct > 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Not enough yukyus available. Missing {remaining_to_deduct} days."
                )

            # Transacción atómica: commit solo si todo es éxito
            self.db.commit()

        except HTTPException:
            # Rollback en caso de error de validación HTTP
            self.db.rollback()
            raise
        except Exception as e:
            # Rollback en caso de cualquier otra excepción
            self.db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Error deduciendo días de yukyu: {str(e)}"
            )

    # -------------------------------------------------------------------------
    # EXPIRATION & MAINTENANCE
    # -------------------------------------------------------------------------

    async def expire_old_yukyus(self) -> int:
        """
        Expire yukyus that are older than 2 years.

        Called by cron job daily.

        Returns:
            Number of balances expired
        """
        today = date.today()

        # Find balances that should be expired
        balances_to_expire = self.db.query(YukyuBalance).filter(
            YukyuBalance.status == YukyuStatus.ACTIVE,
            YukyuBalance.expires_on <= today
        ).all()

        for balance in balances_to_expire:
            balance.status = YukyuStatus.EXPIRED
            balance.days_expired = balance.days_remaining
            balance.days_available = 0

        self.db.commit()
        return len(balances_to_expire)

    # -------------------------------------------------------------------------
    # HELPERS
    # -------------------------------------------------------------------------

    async def _build_request_response(self, request: YukyuRequest) -> YukyuRequestResponse:
        """Build full request response with related data."""
        employee = self.db.query(Employee).filter(Employee.id == request.employee_id).first()
        requested_by = self.db.query(User).filter(User.id == request.requested_by_user_id).first()
        approved_by = None
        if request.approved_by_user_id:
            approved_by = self.db.query(User).filter(User.id == request.approved_by_user_id).first()
        factory = None
        if request.factory_id:
            factory = self.db.query(Factory).filter(Factory.id == request.factory_id).first()

        return YukyuRequestResponse(
            id=request.id,
            employee_id=request.employee_id,
            requested_by_user_id=request.requested_by_user_id,
            factory_id=request.factory_id,
            request_type=request.request_type.value,
            start_date=request.start_date,
            end_date=request.end_date,
            days_requested=request.days_requested,
            yukyu_available_at_request=request.yukyu_available_at_request,
            request_date=request.request_date,
            status=request.status.value,
            approved_by_user_id=request.approved_by_user_id,
            approval_date=request.approval_date,
            rejection_reason=request.rejection_reason,
            notes=request.notes,
            created_at=request.created_at,
            updated_at=request.updated_at,
            employee_name=employee.full_name_kanji if employee else None,
            factory_name=factory.name if factory else None,
            requested_by_name=requested_by.full_name if requested_by else None,
            approved_by_name=approved_by.full_name if approved_by else None,
        )

    async def export_to_excel(self) -> bytes:
        """
        Export yukyu data to Excel file.

        Creates Excel with multiple sheets:
        - Summary: Overall statistics
        - Balances: All employee balances
        - Requests: All requests history
        - Alerts: Employees with issues

        Returns:
            bytes: Excel file as bytes
        """
        import pandas as pd
        from io import BytesIO
        from datetime import date

        # Create BytesIO buffer
        output = BytesIO()

        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # Sheet 1: Summary
            summary_data = []
            employees = self.db.query(Employee).all()

            total_employees = len(employees)
            total_available = 0
            total_used = 0
            total_expired = 0

            for emp in employees:
                balances = self.db.query(YukyuBalance).filter(
                    YukyuBalance.employee_id == emp.id,
                    YukyuBalance.status == YukyuStatus.ACTIVE
                ).all()

                available = sum(b.days_available for b in balances)
                used = sum(b.days_used for b in balances)
                expired = sum(b.days_expired for b in balances)

                total_available += available
                total_used += used
                total_expired += expired

            summary_data.append({
                "指標": "従業員総数",
                "値": total_employees
            })
            summary_data.append({
                "指標": "有給残日数合計",
                "値": total_available
            })
            summary_data.append({
                "指標": "消化日数合計",
                "値": total_used
            })
            summary_data.append({
                "指標": "時効日数合計",
                "値": total_expired
            })
            summary_data.append({
                "指標": "平均有給日数",
                "値": round(total_available / total_employees, 2) if total_employees > 0 else 0
            })

            df_summary = pd.DataFrame(summary_data)
            df_summary.to_excel(writer, sheet_name='概要', index=False)

            # Sheet 2: Employee Balances
            balance_data = []
            for emp in employees:
                balances = self.db.query(YukyuBalance).filter(
                    YukyuBalance.employee_id == emp.id,
                    YukyuBalance.status == YukyuStatus.ACTIVE
                ).all()

                if balances:
                    available = sum(b.days_available for b in balances)
                    used = sum(b.days_used for b in balances)
                    expired = sum(b.days_expired for b in balances)
                    oldest_expiry = min(b.expires_on for b in balances)

                    balance_data.append({
                        "社員番号": emp.employee_id,
                        "氏名": emp.full_name_kanji,
                        "派遣先": emp.factory.name if emp.factory else "",
                        "有給残": available,
                        "消化済": used,
                        "時効": expired,
                        "最も古い期限": oldest_expiry.strftime("%Y-%m-%d"),
                        "入社日": emp.hire_date.strftime("%Y-%m-%d") if emp.hire_date else "",
                    })

            df_balances = pd.DataFrame(balance_data)
            df_balances.to_excel(writer, sheet_name='従業員別有給', index=False)

            # Sheet 3: Requests
            requests = self.db.query(YukyuRequest).order_by(YukyuRequest.created_at.desc()).limit(500).all()
            request_data = []

            for req in requests:
                emp = self.db.query(Employee).filter(Employee.id == req.employee_id).first()
                requested_by = self.db.query(User).filter(User.id == req.requested_by_user_id).first()
                approved_by = None
                if req.approved_by_user_id:
                    approved_by = self.db.query(User).filter(User.id == req.approved_by_user_id).first()

                request_data.append({
                    "申請ID": req.id,
                    "社員番号": emp.employee_id if emp else "",
                    "氏名": emp.full_name_kanji if emp else "",
                    "種類": "有給" if req.request_type == "yukyu" else "半休",
                    "開始日": req.start_date.strftime("%Y-%m-%d"),
                    "終了日": req.end_date.strftime("%Y-%m-%d"),
                    "日数": float(req.days_requested),
                    "状態": req.status.value,
                    "申請者": requested_by.full_name if requested_by else "",
                    "承認者": approved_by.full_name if approved_by else "",
                    "承認日": req.approval_date.strftime("%Y-%m-%d %H:%M") if req.approval_date else "",
                    "申請日": req.created_at.strftime("%Y-%m-%d %H:%M"),
                })

            df_requests = pd.DataFrame(request_data)
            df_requests.to_excel(writer, sheet_name='申請履歴', index=False)

            # Sheet 4: Alerts
            alert_data = []
            for emp in employees:
                balances = self.db.query(YukyuBalance).filter(
                    YukyuBalance.employee_id == emp.id,
                    YukyuBalance.status == YukyuStatus.ACTIVE
                ).all()

                if not balances:
                    alert_data.append({
                        "社員番号": emp.employee_id,
                        "氏名": emp.full_name_kanji,
                        "派遣先": emp.factory.name if emp.factory else "",
                        "アラート種類": "有給なし",
                        "残日数": 0,
                        "入社日": emp.hire_date.strftime("%Y-%m-%d") if emp.hire_date else "",
                    })
                else:
                    available = sum(b.days_available for b in balances)

                    if available <= 3:
                        alert_data.append({
                            "社員番号": emp.employee_id,
                            "氏名": emp.full_name_kanji,
                            "派遣先": emp.factory.name if emp.factory else "",
                            "アラート種類": "有給が少ない (≤3日)",
                            "残日数": available,
                            "入社日": emp.hire_date.strftime("%Y-%m-%d") if emp.hire_date else "",
                        })
                    elif available >= 15:
                        alert_data.append({
                            "社員番号": emp.employee_id,
                            "氏名": emp.full_name_kanji,
                            "派遣先": emp.factory.name if emp.factory else "",
                            "アラート種類": "有給が多い (≥15日)",
                            "残日数": available,
                            "入社日": emp.hire_date.strftime("%Y-%m-%d") if emp.hire_date else "",
                        })

            df_alerts = pd.DataFrame(alert_data)
            df_alerts.to_excel(writer, sheet_name='アラート', index=False)

        # Get the value from buffer
        output.seek(0)
        return output.getvalue()

    async def generate_request_pdf(self, request_id: int) -> bytes:
        """
        Generate PDF document for yukyu request.

        Creates a professional Japanese PDF with:
        - Company header
        - Request details
        - Employee information
        - Approval section

        Args:
            request_id: ID of the yukyu request

        Returns:
            bytes: PDF file as bytes
        """
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import mm
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
        from io import BytesIO
        from datetime import datetime

        # Get request
        request = self.db.query(YukyuRequest).filter(YukyuRequest.id == request_id).first()
        if not request:
            raise ValueError(f"Request {request_id} not found")

        # Get related data
        employee = self.db.query(Employee).filter(Employee.id == request.employee_id).first()
        factory = None
        if request.factory_id:
            factory = self.db.query(Factory).filter(Factory.id == request.factory_id).first()
        requested_by = None
        if request.requested_by_user_id:
            requested_by = self.db.query(User).filter(User.id == request.requested_by_user_id).first()
        approved_by = None
        if request.approved_by_user_id:
            approved_by = self.db.query(User).filter(User.id == request.approved_by_user_id).first()

        # Create PDF buffer
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=20*mm,
            leftMargin=20*mm,
            topMargin=15*mm,
            bottomMargin=15*mm,
        )

        # Container for PDF elements
        elements = []
        styles = getSampleStyleSheet()

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
        )
        elements.append(Paragraph('有給休暇申請書', title_style))
        elements.append(Spacer(1, 10*mm))

        # Request Information Table
        request_data = [
            ['申請番号', f'#{request.id}'],
            ['申請日', request.created_at.strftime('%Y年%m月%d日')],
            ['申請状態', {
                'pending': '承認待ち',
                'approved': '承認済み',
                'rejected': '却下',
            }.get(request.status.value, request.status.value)],
        ]

        if request.approval_date:
            request_data.append(['承認日', request.approval_date.strftime('%Y年%m月%d日')])

        request_table = Table(request_data, colWidths=[50*mm, 120*mm])
        request_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1a1a1a')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(request_table)
        elements.append(Spacer(1, 10*mm))

        # Employee Information
        elements.append(Paragraph('<b>従業員情報</b>', styles['Heading2']))
        elements.append(Spacer(1, 5*mm))

        employee_data = [
            ['社員番号', employee.employee_id if employee else 'N/A'],
            ['氏名', employee.full_name_kanji if employee else 'N/A'],
            ['派遣先', factory.name if factory else 'N/A'],
            ['入社日', employee.hire_date.strftime('%Y年%m月%d日') if employee and employee.hire_date else 'N/A'],
        ]

        employee_table = Table(employee_data, colWidths=[50*mm, 120*mm])
        employee_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1a1a1a')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(employee_table)
        elements.append(Spacer(1, 10*mm))

        # Yukyu Request Details
        elements.append(Paragraph('<b>有給休暇申請内容</b>', styles['Heading2']))
        elements.append(Spacer(1, 5*mm))

        request_type_display = '有給休暇（全日）' if request.request_type == 'yukyu' else '半日休暇'

        yukyu_data = [
            ['種類', request_type_display],
            ['開始日', request.start_date.strftime('%Y年%m月%d日')],
            ['終了日', request.end_date.strftime('%Y年%m月%d日')],
            ['申請日数', f'{float(request.days_requested)}日'],
            ['申請時有給残日数', f'{request.yukyu_available_at_request}日' if request.yukyu_available_at_request else 'N/A'],
        ]

        if request.notes:
            yukyu_data.append(['備考', request.notes])

        yukyu_table = Table(yukyu_data, colWidths=[50*mm, 120*mm])
        yukyu_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1a1a1a')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(yukyu_table)
        elements.append(Spacer(1, 10*mm))

        # Approval Section
        elements.append(Paragraph('<b>承認情報</b>', styles['Heading2']))
        elements.append(Spacer(1, 5*mm))

        approval_data = [
            ['申請者', requested_by.full_name if requested_by else 'N/A'],
        ]

        if request.status.value == 'approved':
            approval_data.append(['承認者', approved_by.full_name if approved_by else 'N/A'])
            approval_data.append(['承認日', request.approval_date.strftime('%Y年%m月%d日 %H:%M') if request.approval_date else 'N/A'])
        elif request.status.value == 'rejected':
            approval_data.append(['承認者', approved_by.full_name if approved_by else 'N/A'])
            approval_data.append(['却下日', request.approval_date.strftime('%Y年%m月%d日 %H:%M') if request.approval_date else 'N/A'])
            if request.rejection_reason:
                approval_data.append(['却下理由', request.rejection_reason])
        else:
            approval_data.append(['承認状態', '承認待ち'])

        approval_table = Table(approval_data, colWidths=[50*mm, 120*mm])
        approval_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1a1a1a')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(approval_table)
        elements.append(Spacer(1, 15*mm))

        # Footer
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER,
        )
        elements.append(Spacer(1, 10*mm))
        elements.append(Paragraph(
            f'このドキュメントは {datetime.now().strftime("%Y年%m月%d日 %H:%M")} に生成されました。',
            footer_style
        ))
        elements.append(Paragraph('UNS-ClaudeJP 有給休暇管理システム', footer_style))

        # Build PDF
        doc.build(elements)

        # Get PDF bytes
        buffer.seek(0)
        return buffer.getvalue()
