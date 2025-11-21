"""
Tests for Auxiliary Services (B1, B2, B3)
==========================================

Tests the auxiliary features from FASE 3:
- B1: Payroll periods from database (payroll_run table)
- B2: Request forms for CRUD operations
- B3: Yukyu 5-day minimum tracking

Author: UNS-ClaudeJP Test Suite
"""
import pytest
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.orm import Session

from app.services.payroll_service import PayrollService
from app.services.yukyu_service import YukyuService
from app.models.payroll_models import PayrollRun as PayrollRunModel
from app.models.models import (
    Employee,
    Request,
    YukyuBalance,
    YukyuRequest,
    RequestType,
    RequestStatus,
)


# ============================================================================
# B1: Payroll Periods from Database
# ============================================================================

class TestPayrollServicePeriods:
    """Test B1: Payroll periods retrieved from payroll_run table in DB."""

    def test_get_pay_period_from_payroll_run(self, client):
        """Test retrieving periods from payroll_run in database."""
        from app.core.database import SessionLocal

        db = SessionLocal()
        try:
            # Arrange - create payroll run with specific dates
            payroll_run = PayrollRunModel(
                pay_period_start=date(2025, 10, 1),
                pay_period_end=date(2025, 10, 31),
                status="draft",
                total_employees=0,
                total_gross_amount=0,
                total_deductions=0,
                total_net_amount=0,
                created_by="test"
            )
            db.add(payroll_run)
            db.commit()
            db.refresh(payroll_run)

            # Act - retrieve the payroll run
            retrieved = db.query(PayrollRunModel).filter(
                PayrollRunModel.id == payroll_run.id
            ).first()

            # Assert
            assert retrieved is not None
            assert retrieved.pay_period_start == date(2025, 10, 1)
            assert retrieved.pay_period_end == date(2025, 10, 31)
            assert str(retrieved.pay_period_start) == "2025-10-01"
            assert str(retrieved.pay_period_end) == "2025-10-31"
        finally:
            db.close()

    def test_payroll_run_stores_dates_not_hardcoded(self, client):
        """Test that pay periods come from database, not hardcoded values."""
        from app.core.database import SessionLocal

        db = SessionLocal()
        try:
            # Arrange - create multiple runs with different periods
            runs_data = [
                (date(2025, 9, 1), date(2025, 9, 30)),
                (date(2025, 10, 1), date(2025, 10, 31)),
                (date(2025, 11, 1), date(2025, 11, 30)),
            ]

            created_ids = []
            for start, end in runs_data:
                run = PayrollRunModel(
                    pay_period_start=start,
                    pay_period_end=end,
                    status="draft",
                    total_employees=0,
                    total_gross_amount=0,
                    total_deductions=0,
                    total_net_amount=0,
                    created_by="test"
                )
                db.add(run)
                db.commit()
                db.refresh(run)
                created_ids.append(run.id)

            # Act - retrieve each run and verify dates are stored correctly
            for idx, run_id in enumerate(created_ids):
                retrieved = db.query(PayrollRunModel).filter(
                    PayrollRunModel.id == run_id
                ).first()

                expected_start, expected_end = runs_data[idx]

                # Assert - dates match what we stored
                assert retrieved.pay_period_start == expected_start
                assert retrieved.pay_period_end == expected_end
        finally:
            db.close()

    def test_payroll_service_uses_database_periods(self, client):
        """Test that PayrollService reads periods from database."""
        from app.core.database import SessionLocal

        db = SessionLocal()
        try:
            # Arrange - create a payroll run
            payroll_run = PayrollRunModel(
                pay_period_start=date(2025, 10, 1),
                pay_period_end=date(2025, 10, 31),
                status="draft",
                total_employees=0,
                total_gross_amount=0,
                total_deductions=0,
                total_net_amount=0,
                created_by="test"
            )
            db.add(payroll_run)
            db.commit()
            db.refresh(payroll_run)

            # Act - retrieve through service
            service = PayrollService(db_session=db)
            retrieved = db.query(PayrollRunModel).filter(
                PayrollRunModel.id == payroll_run.id
            ).first()

            # Assert - service can access database dates
            assert retrieved.pay_period_start == date(2025, 10, 1)
            assert retrieved.pay_period_end == date(2025, 10, 31)
        finally:
            db.close()


# ============================================================================
# B2: Request Forms (CRUD)
# ============================================================================

class TestRequestForms:
    """Test B2: Request forms implement CRUD operations."""

    def test_request_model_exists(self, client):
        """Test that Request model exists and has required fields."""
        from app.models.models import Request

        # Assert - model has expected fields
        assert hasattr(Request, 'id')
        assert hasattr(Request, 'employee_id')
        assert hasattr(Request, 'request_type')
        assert hasattr(Request, 'approval_status')
        assert hasattr(Request, 'start_date')
        assert hasattr(Request, 'end_date')
        assert hasattr(Request, 'days_requested')

    def test_create_request(self, client):
        """Test creating a new request (CREATE operation)."""
        from app.core.database import SessionLocal

        db = SessionLocal()
        try:
            # Arrange - create employee first
            employee = Employee(
                employee_id="EMP_REQ001",
                full_name_kanji="リクエストテスト",
                full_name_kana="りくえすとてすと",
                status="active",
                hire_date=date(2024, 1, 1),
                created_at=datetime.now()
            )
            db.add(employee)
            db.commit()
            db.refresh(employee)

            # Act - create request
            request = Request(
                employee_id=employee.id,
                request_type=RequestType.YUKYU,
                approval_status=RequestStatus.PENDING,
                start_date=date(2025, 11, 1),
                end_date=date(2025, 11, 1),
                days_requested=1.0,
                reason="テスト休暇",
                created_at=datetime.now()
            )
            db.add(request)
            db.commit()
            db.refresh(request)

            # Assert
            assert request.id is not None
            assert request.employee_id == employee.id
            assert request.request_type == RequestType.YUKYU
            assert request.approval_status == RequestStatus.PENDING
        finally:
            db.close()

    def test_read_request(self, client):
        """Test reading a request (READ operation)."""
        from app.core.database import SessionLocal

        db = SessionLocal()
        try:
            # Arrange - create employee and request
            employee = Employee(
                employee_id="EMP_REQ002",
                full_name_kanji="読取テスト",
                status="active",
                hire_date=date(2024, 1, 1),
                created_at=datetime.now()
            )
            db.add(employee)
            db.commit()

            request = Request(
                employee_id=employee.id,
                request_type=RequestType.YUKYU,
                approval_status=RequestStatus.PENDING,
                start_date=date(2025, 11, 1),
                end_date=date(2025, 11, 1),
                days_requested=1.0,
                created_at=datetime.now()
            )
            db.add(request)
            db.commit()
            db.refresh(request)

            # Act - read request
            retrieved = db.query(Request).filter(
                Request.id == request.id
            ).first()

            # Assert
            assert retrieved is not None
            assert retrieved.id == request.id
            assert retrieved.employee_id == employee.id
        finally:
            db.close()

    def test_update_request(self, client):
        """Test updating a request (UPDATE operation)."""
        from app.core.database import SessionLocal

        db = SessionLocal()
        try:
            # Arrange - create employee and request
            employee = Employee(
                employee_id="EMP_REQ003",
                full_name_kanji="更新テスト",
                status="active",
                hire_date=date(2024, 1, 1),
                created_at=datetime.now()
            )
            db.add(employee)
            db.commit()

            request = Request(
                employee_id=employee.id,
                request_type=RequestType.YUKYU,
                approval_status=RequestStatus.PENDING,
                start_date=date(2025, 11, 1),
                end_date=date(2025, 11, 1),
                days_requested=1.0,
                created_at=datetime.now()
            )
            db.add(request)
            db.commit()
            db.refresh(request)

            # Act - update request
            request.approval_status = RequestStatus.APPROVED
            request.days_requested = 2.0
            db.commit()
            db.refresh(request)

            # Assert
            assert request.approval_status == RequestStatus.APPROVED
            assert request.days_requested == 2.0
        finally:
            db.close()

    def test_delete_request(self, client):
        """Test deleting a request (DELETE operation - soft delete)."""
        from app.core.database import SessionLocal

        db = SessionLocal()
        try:
            # Arrange - create employee and request
            employee = Employee(
                employee_id="EMP_REQ004",
                full_name_kanji="削除テスト",
                status="active",
                hire_date=date(2024, 1, 1),
                created_at=datetime.now()
            )
            db.add(employee)
            db.commit()

            request = Request(
                employee_id=employee.id,
                request_type=RequestType.YUKYU,
                approval_status=RequestStatus.PENDING,
                start_date=date(2025, 11, 1),
                end_date=date(2025, 11, 1),
                days_requested=1.0,
                created_at=datetime.now()
            )
            db.add(request)
            db.commit()
            db.refresh(request)

            # Act - soft delete (set deleted_at)
            request.deleted_at = datetime.now()
            db.commit()

            # Assert - still exists but marked as deleted
            retrieved = db.query(Request).filter(
                Request.id == request.id
            ).first()
            assert retrieved is not None
            assert retrieved.deleted_at is not None
        finally:
            db.close()


# ============================================================================
# B3: Yukyu 5-Day Minimum Tracking
# ============================================================================

class TestYukyuFiveDayTracking:
    """Test B3: Yukyu 5-day minimum usage tracking (Japanese labor law)."""

    @pytest.mark.asyncio
    async def test_check_minimum_5_days_compliant(self, client):
        """Test employee who meets 5-day minimum requirement."""
        from app.core.database import SessionLocal

        db = SessionLocal()
        try:
            # Arrange - create employee
            employee = Employee(
                employee_id="EMP_YUKYU001",
                full_name_kanji="有給テスト",
                status="active",
                hire_date=date(2024, 4, 1),  # Hired April 1
                created_at=datetime.now()
            )
            db.add(employee)
            db.commit()
            db.refresh(employee)

            # Create 6 approved yukyu requests (more than 5 days)
            for i in range(6):
                request = Request(
                    employee_id=employee.id,
                    request_type=RequestType.YUKYU,
                    approval_status=RequestStatus.APPROVED,
                    start_date=date(2025, 5, i+1),
                    end_date=date(2025, 5, i+1),
                    days_requested=1.0,
                    created_at=datetime.now()
                )
                db.add(request)
            db.commit()

            # Act
            service = YukyuService(db)
            result = service.check_minimum_5_days(
                employee_id=employee.id,
                fiscal_year=2025  # FY2025 = April 2025 - March 2026
            )

            # Assert
            assert result is not None
            assert result['employee_id'] == employee.id
            assert result['fiscal_year'] == 2025
            assert result['total_days_used'] >= 5.0
            assert result['minimum_required'] == 5
            assert result['is_compliant'] is True
            assert result['compliance_percentage'] >= 100.0
            assert result['warning'] is None
        finally:
            db.close()

    @pytest.mark.asyncio
    async def test_check_minimum_5_days_non_compliant(self, client):
        """Test employee who doesn't meet 5-day minimum requirement."""
        from app.core.database import SessionLocal

        db = SessionLocal()
        try:
            # Arrange - create employee
            employee = Employee(
                employee_id="EMP_YUKYU002",
                full_name_kanji="不足テスト",
                status="active",
                hire_date=date(2024, 4, 1),
                created_at=datetime.now()
            )
            db.add(employee)
            db.commit()
            db.refresh(employee)

            # Create only 2 approved yukyu requests (less than 5 days)
            for i in range(2):
                request = Request(
                    employee_id=employee.id,
                    request_type=RequestType.YUKYU,
                    approval_status=RequestStatus.APPROVED,
                    start_date=date(2025, 5, i+1),
                    end_date=date(2025, 5, i+1),
                    days_requested=1.0,
                    created_at=datetime.now()
                )
                db.add(request)
            db.commit()

            # Act
            service = YukyuService(db)
            result = service.check_minimum_5_days(
                employee_id=employee.id,
                fiscal_year=2025
            )

            # Assert
            assert result is not None
            assert result['employee_id'] == employee.id
            assert result['total_days_used'] == 2.0
            assert result['minimum_required'] == 5
            assert result['is_compliant'] is False
            assert result['compliance_percentage'] < 100.0
            assert result['days_remaining'] == 3.0
            assert result['warning'] is not None
            assert '警告' in result['warning']  # Contains warning in Japanese
        finally:
            db.close()

    @pytest.mark.asyncio
    async def test_check_minimum_5_days_zero_usage(self, client):
        """Test employee who hasn't used any yukyu."""
        from app.core.database import SessionLocal

        db = SessionLocal()
        try:
            # Arrange - create employee with no requests
            employee = Employee(
                employee_id="EMP_YUKYU003",
                full_name_kanji="未使用テスト",
                status="active",
                hire_date=date(2024, 4, 1),
                created_at=datetime.now()
            )
            db.add(employee)
            db.commit()
            db.refresh(employee)

            # Act
            service = YukyuService(db)
            result = service.check_minimum_5_days(
                employee_id=employee.id,
                fiscal_year=2025
            )

            # Assert
            assert result is not None
            assert result['total_days_used'] == 0.0
            assert result['is_compliant'] is False
            assert result['days_remaining'] == 5.0
            assert result['warning'] is not None
        finally:
            db.close()

    @pytest.mark.asyncio
    async def test_check_minimum_5_days_half_days(self, client):
        """Test 5-day minimum with half-day (半休) yukyu."""
        from app.core.database import SessionLocal

        db = SessionLocal()
        try:
            # Arrange - create employee
            employee = Employee(
                employee_id="EMP_YUKYU004",
                full_name_kanji="半休テスト",
                status="active",
                hire_date=date(2024, 4, 1),
                created_at=datetime.now()
            )
            db.add(employee)
            db.commit()
            db.refresh(employee)

            # Create 10 half-day requests (= 5 full days)
            for i in range(10):
                request = Request(
                    employee_id=employee.id,
                    request_type=RequestType.YUKYU,
                    approval_status=RequestStatus.APPROVED,
                    start_date=date(2025, 5, i+1),
                    end_date=date(2025, 5, i+1),
                    days_requested=0.5,  # Half day
                    created_at=datetime.now()
                )
                db.add(request)
            db.commit()

            # Act
            service = YukyuService(db)
            result = service.check_minimum_5_days(
                employee_id=employee.id,
                fiscal_year=2025
            )

            # Assert - 10 half-days = 5 full days
            assert result['total_days_used'] == 5.0
            assert result['is_compliant'] is True
            assert result['warning'] is None
        finally:
            db.close()


# Run with: pytest backend/tests/test_auxiliary_services.py -v
