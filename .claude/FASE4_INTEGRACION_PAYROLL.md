# FASE 4: INTEGRACIÓN PAYROLL-YUKYUS
## Plan de Implementación Detallado

**Objetivo:** Vincular yukyus aprobados con cálculo de nómina para descontar correctamente

**BUG IDENTIFICADO:** Sistema paga completo ignorando días de yukyu aprobados

---

## CAMBIOS NECESARIOS

### 1. MODIFICAR SCHEMAS (backend/app/schemas/payroll.py)

#### 1.1 Actualizar `EmployeeData` (línea ~68)
```python
# ANTES:
class EmployeeData(BaseModel):
    employee_id: int
    name: str
    base_hourly_rate: float
    factory_id: str
    prefecture: str
    apartment_rent: float
    dependents: int

# DESPUÉS:
class EmployeeData(BaseModel):
    employee_id: int
    name: str
    base_hourly_rate: float
    factory_id: str
    prefecture: str
    apartment_rent: float
    dependents: int
    yukyu_days_approved: float = Field(default=0, description="Días de yukyu aprobados en período")  # ← NUEVO
```

#### 1.2 Actualizar `EmployeePayrollCreate` (línea ~79)
```python
# ANTES:
class EmployeePayrollCreate(BaseModel):
    employee_data: EmployeeData
    timer_records: List[TimerRecord]
    payroll_run_id: Optional[int] = None

# DESPUÉS:
class EmployeePayrollCreate(BaseModel):
    employee_data: EmployeeData
    timer_records: List[TimerRecord]
    payroll_run_id: Optional[int] = None
    yukyu_days_approved: float = Field(default=0, description="Días aprobados")  # ← NUEVO (alternativa a employee_data)
```

#### 1.3 Actualizar `DeductionsDetail` (línea ~118)
```python
# ANTES:
class DeductionsDetail(BaseModel):
    income_tax: float
    resident_tax: float
    health_insurance: float
    pension: float
    employment_insurance: float
    apartment: float
    other: float

# DESPUÉS:
class DeductionsDetail(BaseModel):
    income_tax: float
    resident_tax: float
    health_insurance: float
    pension: float
    employment_insurance: float
    apartment: float
    other: float
    yukyu_deduction: float = Field(default=0, description="Deducción por días de yukyu")  # ← NUEVO
```

---

### 2. MODIFICAR PAYROLL SERVICE (backend/app/services/payroll_service.py)

#### 2.1 Método `calculate_employee_payroll()`

**BUSCAR:** Firma del método (línea ~114)
```python
# ANTES:
def calculate_employee_payroll(
    self,
    employee_data: dict,
    timer_records: list,
    payroll_run_id: Optional[int] = None
) -> dict:

# DESPUÉS:
def calculate_employee_payroll(
    self,
    employee_data: dict,
    timer_records: list,
    payroll_run_id: Optional[int] = None,
    yukyu_days_approved: float = 0  # ← NUEVO PARÁMETRO
) -> dict:
```

#### 2.2 Calcular horas reducidas (después de línea ~167)

```python
# NUEVO CÓDIGO A AGREGAR (después de calcular horas):
# Reducir horas por días de yukyu aprobados
if yukyu_days_approved > 0:
    yukyu_reduction_hours = yukyu_days_approved * 8  # 8 horas/día
    total_worked_hours = sum([
        hours_breakdown.get('regular_hours', 0),
        hours_breakdown.get('overtime_hours', 0),
        hours_breakdown.get('night_shift_hours', 0),
        hours_breakdown.get('holiday_hours', 0)
    ])

    # Reducir de horas regulares primero
    if hours_breakdown.get('regular_hours', 0) >= yukyu_reduction_hours:
        hours_breakdown['regular_hours'] -= yukyu_reduction_hours
        yukyu_reduction_hours = 0
    else:
        yukyu_reduction_hours -= hours_breakdown.get('regular_hours', 0)
        hours_breakdown['regular_hours'] = 0

    # Luego de overtime si queda
    if yukyu_reduction_hours > 0 and hours_breakdown.get('overtime_hours', 0) > 0:
        if hours_breakdown.get('overtime_hours', 0) >= yukyu_reduction_hours:
            hours_breakdown['overtime_hours'] -= yukyu_reduction_hours
        else:
            yukyu_reduction_hours -= hours_breakdown['overtime_hours']
            hours_breakdown['overtime_hours'] = 0
```

#### 2.3 Calcular deducción por yukyu (línea ~180)

```python
# ANTES (línea ~180):
# 7. Calculate deductions
self.deduction_calculator.update_employee_data(employee_data)
deductions = self.deduction_calculator.calculate_all_deductions(gross_amount)

# DESPUÉS:
# 7. Calculate deductions
self.deduction_calculator.update_employee_data(employee_data)
deductions = self.deduction_calculator.calculate_all_deductions(gross_amount)

# Calcular deducción por yukyu
yukyu_deduction = 0
if yukyu_days_approved > 0:
    base_rate = Decimal(str(employee_data.get('base_hourly_rate', 0)))
    yukyu_deduction = float(yukyu_days_approved * 8 * base_rate)  # 8 horas/día
    deductions['yukyu_deduction'] = yukyu_deduction
    deductions['total'] += yukyu_deduction
```

#### 2.4 Actualizar resultado (línea ~250)

```python
# ANTES:
'deductions_detail': {
    'income_tax': float(...),
    ...
    'other': float(...)
}

# DESPUÉS:
'deductions_detail': {
    'income_tax': float(...),
    ...
    'other': float(...),
    'yukyu_deduction': float(deductions.get('yukyu_deduction', 0))  # ← NUEVO
}
```

---

### 3. INTEGRACIÓN SERVICE (backend/app/services/payroll_integration_service.py)

#### 3.1 En método `calculate_payroll_from_timer_cards()` (línea ~155)

```python
# NUEVO CÓDIGO A AGREGAR (después de obtener timer_records):

# Obtener yukyus aprobados para el período
from app.models.models import YukyuRequest, RequestStatus
from datetime import datetime

start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()

yukyu_requests = self.db.query(YukyuRequest).filter(
    YukyuRequest.employee_id == employee_id,
    YukyuRequest.status == RequestStatus.APPROVED,
    YukyuRequest.start_date <= end_date_obj,
    YukyuRequest.end_date >= start_date_obj
).all()

yukyu_days_approved = sum(float(r.days_requested) for r in yukyu_requests) if yukyu_requests else 0

# Log para auditoría
if yukyu_days_approved > 0:
    logger.info(f"Employee {employee_id} has {yukyu_days_approved} approved yukyu days in period {start_date}-{end_date}")
```

#### 3.2 Pasar yukyu_days al servicio (línea ~180)

```python
# ANTES:
result = self.payroll_service.calculate_employee_payroll(
    employee_data=employee_data,
    timer_records=timer_records,
    payroll_run_id=payroll_run_id
)

# DESPUÉS:
result = self.payroll_service.calculate_employee_payroll(
    employee_data=employee_data,
    timer_records=timer_records,
    payroll_run_id=payroll_run_id,
    yukyu_days_approved=yukyu_days_approved  # ← NUEVO
)
```

---

### 4. API ENDPOINT (backend/app/api/payroll.py)

#### 4.1 Actualizar POST `/api/payroll/calculate` (línea ~473)

```python
# ANTES:
result = service.calculate_employee_payroll(
    employee_data=request.employee_data.dict(),
    timer_records=[r.dict() for r in request.timer_records],
    payroll_run_id=request.payroll_run_id
)

# DESPUÉS:
result = service.calculate_employee_payroll(
    employee_data=request.employee_data.dict(),
    timer_records=[r.dict() for r in request.timer_records],
    payroll_run_id=request.payroll_run_id,
    yukyu_days_approved=request.yukyu_days_approved  # ← NUEVO
)
```

---

### 5. MODELO PAYROLL (backend/app/models/payroll_models.py)

#### 5.1 Agregar columnas a `EmployeePayroll` (línea ~31)

```python
# ANTES:
class EmployeePayroll(Base):
    # ... existing fields ...
    net_amount = Column(Numeric(12, 2), nullable=True)
    timer_card_period_id = Column(Integer, nullable=True)

# DESPUÉS:
class EmployeePayroll(Base):
    # ... existing fields ...
    net_amount = Column(Numeric(12, 2), nullable=True)

    # Nuevo: Información de yukyus
    yukyu_days_approved = Column(Numeric(4, 1), default=0)  # Días aprobados en período
    yukyu_deduction_jpy = Column(Numeric(10, 2), default=0)  # Monto deducido (¥)
    yukyu_request_ids = Column(Text, nullable=True)  # JSON: [1, 2, 3] para referencia

    timer_card_period_id = Column(Integer, nullable=True)
```

---

### 6. NUEVO ENDPOINT: `/api/payroll/yukyu-summary` (backend/app/api/payroll.py)

```python
@router.get("/yukyu-summary")
async def get_payroll_yukyu_summary(
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD"),
    current_user = Depends(require_role("admin")),
    db: Session = Depends(get_db)
) -> dict:
    """
    Resumen de impacto de yukyus en nómina para el período.

    Retorna:
    {
        "period": "2025-01",
        "total_employees": 42,
        "employees_with_yukyu": 28,
        "total_yukyu_days": 45.5,
        "total_yukyu_deduction_jpy": 562500,
        "average_deduction_per_employee": 13437,
        "details": [
            {
                "employee_id": 1,
                "employee_name": "Yamada Taro",
                "yukyu_days": 2.0,
                "yukyu_deduction_jpy": 24000,
                "gross_without_yukyu": 240000,
                "gross_with_yukyu": 216000,
                "net_difference": -12000
            }
        ]
    }
    """
    # Implementación en servicio...
```

---

## EJEMPLO NUMÉRICO ESPERADO

### Antes de FASE 4 (INCORRECTO):
```
Yamada Taro - Octubre 2025
Timer Cards: 160 horas
Yukyu Aprobada: 1 día (Oct 19)

gross = 160h × ¥1,500 = ¥240,000
deductions = ¥65,000
net = ¥175,000  ❌ INCORRECTO: No descuenta yukyu
```

### Después de FASE 4 (CORRECTO):
```
Yamada Taro - Octubre 2025
Timer Cards: 160 horas
Yukyu Aprobada: 1 día (Oct 19) = 8 horas

Horas efectivas = 160 - 8 = 152h
gross = 152h × ¥1,500 = ¥228,000
deductions = ¥63,360
yukyu_deduction = 8h × ¥1,500 = ¥12,000
net = ¥164,640  ✅ CORRECTO: Descuenta ¥12,000
```

---

## TESTING REQUERIDO

```bash
# 1. Unit test: Reducción de horas
pytest backend/tests/test_payroll_yukyu_integration.py::test_yukyu_hours_reduction

# 2. Unit test: Cálculo de deducción
pytest backend/tests/test_payroll_yukyu_integration.py::test_yukyu_deduction_calculation

# 3. Integration test: Flujo completo
pytest backend/tests/test_payroll_yukyu_integration.py::test_payroll_with_approved_yukyu

# 4. API test: Endpoint summary
pytest backend/tests/test_api_payroll.py::test_yukyu_summary_endpoint
```

---

## ARCHIVOS A MODIFICAR (Orden)

1. `backend/app/schemas/payroll.py` - Agregar campos de yukyu
2. `backend/app/models/payroll_models.py` - Agregar columnas
3. `backend/app/services/payroll_service.py` - Lógica de reducción
4. `backend/app/services/payroll_integration_service.py` - Obtener yukyus
5. `backend/app/api/payroll.py` - Pasar parámetros + nuevo endpoint
6. `backend/tests/test_payroll_yukyu_integration.py` - Tests (crear)

---

## RIESGOS Y MITIGACIONES

| Riesgo | Mitigación |
|--------|-----------|
| Romper cálculos existentes | Parámetro `yukyu_days_approved=0` por defecto |
| Datos inconsistentes | Validar que `yukyu_request.status == APPROVED` |
| Deducción negativa | Usar `max(0, horas_reducidas)` |
| Overlaps de yukyu | Validación hecha en FASE 3 |

---

**TIEMPO ESTIMADO:** 1.5 horas
**RIESGO:** BAJO (parámetros opcionales, cambios no-breaking)
