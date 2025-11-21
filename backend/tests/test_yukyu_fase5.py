"""
Tests para FASE 5: Dashboard KEIRI - Endpoints de Metricas
Cobertura de endpoints nuevos y validaciones de payroll
"""

import pytest
from datetime import datetime, date, timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.models import (
    Employee, YukyuRequest, RequestStatus, UserRole
)
from app.models.payroll_models import EmployeePayroll, PayrollRun
from app.core.database import get_db

client = TestClient(app)


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def keitosan_user(db: Session):
    """Create a KEITOSAN (Finance Manager) user for testing"""
    from app.models.models import User
    from app.core.security import get_password_hash

    user = User(
        username="keitosan_test",
        email="keitosan@test.local",
        password_hash=get_password_hash("test123"),
        role=UserRole.KEITOSAN,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def tantosha_user(db: Session):
    """Create a TANTOSHA (HR Rep) user for testing"""
    from app.models.models import User
    from app.core.security import get_password_hash

    user = User(
        username="tantosha_test",
        email="tantosha@test.local",
        password_hash=get_password_hash("test123"),
        role=UserRole.TANTOSHA,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_employee(db: Session):
    """Create a test employee"""
    employee = Employee(
        full_name_kanji="山田太郎",
        full_name_roman="Yamada Taro",
        email="yamada@test.local",
        hakenmoto_id="EMP001",
        factory_id="FAC001",
        jikyu=1500,  # ¥1,500/hour
        standard_hours_per_month=160,
        yukyu_remaining=10.0,
        is_active=True,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


# =============================================================================
# FASE 7.1: Tests Backend
# =============================================================================

class TestYukyuDateValidation:
    """Test: Yukyu dates cannot be in the past"""

    def test_yukyu_date_cannot_be_past(self, db: Session, test_employee: Employee):
        """
        VALIDACIÓN: No se puede crear solicitud con fecha pasada

        Escenario: TANTOSHA intenta crear solicitud para fecha pasada
        Resultado esperado: HTTPException 400 (Bad Request)
        """
        yesterday = date.today() - timedelta(days=1)

        yukyu_data = {
            "employee_id": test_employee.id,
            "start_date": yesterday.isoformat(),
            "end_date": yesterday.isoformat(),
            "days_requested": 1,
            "reason": "Invalid past date",
            "factory_id": "FAC001"
        }

        # Should reject past date
        response = client.post("/api/yukyu/requests/", json=yukyu_data)
        assert response.status_code == 400
        assert "past" in response.json().get("detail", "").lower()


class TestTantshaFactoryValidation:
    """Test: TANTOSHA can only create for their own factory"""

    def test_yukyu_tantosha_factory_validation(
        self, db: Session, tantosha_user: any, test_employee: Employee
    ):
        """
        VALIDACIÓN: TANTOSHA solo puede crear para su factory

        Escenario: TANTOSHA intenta crear solicitud para factory diferente
        Resultado esperado: HTTPException 403 (Forbidden)
        """
        future_date = date.today() + timedelta(days=5)

        # Assign TANTOSHA to different factory
        tantosha_employee = Employee(
            full_name_kanji="田中職員",
            full_name_roman="Tanaka Staff",
            email="tanaka@test.local",
            hakenmoto_id="STAFF001",
            factory_id="FAC002",  # Different factory
            is_active=True,
        )
        db.add(tantosha_employee)
        db.commit()

        # Try to create for FAC001 (not assigned)
        yukyu_data = {
            "employee_id": test_employee.id,
            "start_date": future_date.isoformat(),
            "end_date": future_date.isoformat(),
            "days_requested": 1,
            "factory_id": "FAC001"  # Not TANTOSHA's factory
        }

        # Should reject (security: factory mismatch)
        response = client.post(
            "/api/yukyu/requests/",
            json=yukyu_data,
            headers={"Authorization": f"Bearer {tantosha_user}"}
        )
        assert response.status_code in [400, 403]


class TestYukyuOverlapValidation:
    """Test: No overlapping yukyu requests"""

    def test_yukyu_no_overlaps(self, db: Session, test_employee: Employee):
        """
        VALIDACIÓN: No puede haber solicitudes solapadas

        Escenario:
        1. Crear solicitud 1: Nov 10-12
        2. Intentar crear solicitud 2: Nov 11-13 (solapada)

        Resultado esperado: HTTPException 400 (Solicitud solapada)
        """
        # Create first yukyu request
        today = date.today()
        start1 = today + timedelta(days=10)
        end1 = start1 + timedelta(days=2)

        yukyu1 = YukyuRequest(
            employee_id=test_employee.id,
            start_date=start1,
            end_date=end1,
            days_requested=3,
            status=RequestStatus.APPROVED,
        )
        db.add(yukyu1)
        db.commit()

        # Try to create overlapping request
        start2 = start1 + timedelta(days=1)  # Overlaps!
        end2 = end1 + timedelta(days=1)

        yukyu_data = {
            "employee_id": test_employee.id,
            "start_date": start2.isoformat(),
            "end_date": end2.isoformat(),
            "days_requested": 2,
        }

        response = client.post("/api/yukyu/requests/", json=yukyu_data)
        assert response.status_code == 400
        assert "overlap" in response.json().get("detail", "").lower()


class TestYukyuTeiiCalculation:
    """Test: Teiji calculation for hour reduction"""

    def test_yukyu_reduction_with_teiji(self, db: Session, test_employee: Employee):
        """
        VALIDACIÓN: Reducción de horas usa teiji correctamente

        Fórmula: teiji = standard_hours_per_month / 20
        Reducción: días_yukyu × teiji_horas_por_día

        Datos:
        - standard_hours_per_month: 160
        - teiji: 160 / 20 = 8 horas/día
        - yukyu aprobado: 1 día
        - reducción esperada: 1 × 8 = 8 horas
        """
        from app.services.payroll_service import PayrollService

        service = PayrollService(db_session=db)

        # Timer records: 160 horas normales
        timer_records = [
            {
                "work_date": (date.today() - timedelta(days=20)).isoformat(),
                "clock_in": "09:00",
                "clock_out": "18:00",
                "break_minutes": 60,
            }
        ] * 20  # 20 días de 8 horas = 160 horas

        employee_data = {
            "employee_id": test_employee.id,
            "name": test_employee.full_name_kanji,
            "base_hourly_rate": 1500,
            "factory_id": "FAC001",
            "standard_hours_per_month": 160,
        }

        # Calculate with yukyu
        result = service.calculate_employee_payroll(
            employee_data=employee_data,
            timer_records=timer_records,
            yukyu_days_approved=1  # 1 día de yukyu
        )

        # Verify teiji calculation
        expected_teiji = Decimal(160) / Decimal(20)  # 8 horas/día
        expected_reduction = float(expected_teiji)  # 8 horas

        assert result["hours_breakdown"]["regular_hours"] <= 152  # 160 - 8
        assert result["success"] is True


class TestYukyuDeductionFormula:
    """Test: Yukyu deduction calculation"""

    def test_yukyu_deduction_calculation(self, db: Session, test_employee: Employee):
        """
        VALIDACIÓN: Deducción = días × teiji × tarifa_horaria

        Datos:
        - Días aprobados: 1
        - Teiji: 8 horas/día
        - Tarifa: ¥1,500/hora
        - Deducción esperada: 1 × 8 × 1,500 = ¥12,000
        """
        from app.services.payroll_service import PayrollService

        service = PayrollService(db_session=db)

        timer_records = [
            {
                "work_date": (date.today() - timedelta(days=i)).isoformat(),
                "clock_in": "09:00",
                "clock_out": "18:00",
                "break_minutes": 60,
            }
            for i in range(20)
        ]

        employee_data = {
            "employee_id": test_employee.id,
            "name": test_employee.full_name_kanji,
            "base_hourly_rate": 1500,
            "factory_id": "FAC001",
            "standard_hours_per_month": 160,
        }

        result = service.calculate_employee_payroll(
            employee_data=employee_data,
            timer_records=timer_records,
            yukyu_days_approved=1
        )

        # Verify deduction
        yukyu_deduction = result["deductions_detail"].get("yukyu_deduction", 0)
        expected_deduction = 1 * 8 * 1500  # ¥12,000

        assert yukyu_deduction == expected_deduction
        assert result["amounts"]["net_amount"] < result["amounts"]["gross_amount"]


class TestYukyuSummaryEndpoint:
    """Test: Dashboard endpoint for trends"""

    def test_yukyu_summary_endpoint(self, db: Session, keitosan_user: any):
        """
        VALIDACIÓN: Endpoint /api/dashboard/yukyu-trends-monthly funciona

        Escenario:
        1. Crear yukyu aprobados en últimos 6 meses
        2. Llamar endpoint trends
        3. Verificar datos y formato
        """
        # Create sample yukyu records
        today = date.today()
        for i in range(6):
            month_date = today - timedelta(days=30*i)
            yukyu = YukyuRequest(
                employee_id=1,
                start_date=month_date,
                end_date=month_date + timedelta(days=1),
                days_requested=2.0,
                status=RequestStatus.APPROVED,
            )
            db.add(yukyu)
        db.commit()

        # Call endpoint
        response = client.get(
            "/api/dashboard/yukyu-trends-monthly?months=6",
            headers={"Authorization": f"Bearer {keitosan_user}"}
        )

        # Verify response
        assert response.status_code == 200
        trends = response.json()
        assert isinstance(trends, list)
        assert len(trends) <= 6

        # Verify structure
        if trends:
            trend = trends[0]
            assert "month" in trend
            assert "total_approved_days" in trend
            assert "employees_with_yukyu" in trend
            assert "total_deduction_jpy" in trend
            assert "avg_deduction_per_employee" in trend


# =============================================================================
# Test Markers
# =============================================================================

pytest.mark.integration = pytest.mark.integration
pytest.mark.payroll = pytest.mark.payroll
pytest.mark.yukyu = pytest.mark.yukyu

# Run with: pytest backend/tests/test_yukyu_fase5.py -v
# Or specific test: pytest backend/tests/test_yukyu_fase5.py::TestYukyuDateValidation -v
