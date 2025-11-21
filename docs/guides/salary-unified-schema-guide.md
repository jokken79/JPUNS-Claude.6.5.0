# Unified Salary Schema - Guía de Uso y Migración

**Version:** 5.4.1
**Created:** 2025-11-12
**Status:** Active

---

## 📋 Resumen

El **Unified Salary Schema** (`backend/app/schemas/salary_unified.py`) consolida y mejora los esquemas previos de cálculo de salarios y nómina:

- ✅ **Consolidado**: Unifica `salary.py` (108 líneas) + `payroll.py` (309 líneas)
- ✅ **Mejorado**: 900+ líneas con documentación completa
- ✅ **Type-Safe**: Validación Pydantic con field_validator
- ✅ **Completo**: Request/Response patterns para todas las operaciones
- ✅ **Ejemplos**: Config examples en cada modelo

---

## 🚀 Uso Rápido

### Importación Recomendada

```python
from app.schemas import (
    # Core Response
    UnifiedSalaryCalculationResponse,

    # Requests
    SalaryCalculateRequest,
    SalaryBulkCalculateRequest,
    SalaryMarkPaidRequest,

    # Responses
    SalaryResponse,
    SalaryListResponse,
    BulkCalculateResponse,

    # Helpers
    HoursBreakdown,
    RatesConfiguration,
    SalaryAmounts,
    DeductionsDetail,
    PayrollSummary,

    # Enums
    SalaryStatus,
)
```

### Ejemplo de Cálculo Individual

```python
from app.schemas import SalaryCalculateRequest, SalaryResponse

# 1. Crear request
request = SalaryCalculateRequest(
    employee_id=123,
    month=10,
    year=2025,
    use_timer_cards=True,
    bonus=20000.0,
    gasoline_allowance=15000.0,
    notes="Regular monthly calculation"
)

# 2. Procesar (en tu service)
result = await salary_service.calculate_salary(request)

# 3. Respuesta completa
response = SalaryResponse(
    success=True,
    id=result.id,
    status=SalaryStatus.CALCULATED,
    data=result,
    message="Salary calculated successfully"
)
```

### Ejemplo de Cálculo Masivo

```python
from app.schemas import SalaryBulkCalculateRequest, BulkCalculateResponse

# Calcular para múltiples empleados
request = SalaryBulkCalculateRequest(
    employee_ids=[123, 124, 125],
    month=10,
    year=2025,
    use_timer_cards=True
)

# Respuesta incluye resumen + detalles
response = BulkCalculateResponse(
    successful=45,
    failed=3,
    total=48,
    results=[...],  # Lista de SalaryResponse
    errors={126: "Missing timer card data"},
    total_gross_amount=13743900.0,
    total_net_amount=9820730.0,
    total_company_profit=1897840.0
)
```

---

## 📐 Estructura del Módulo

### 1. Enums (Status Types)

```python
class SalaryStatus(str, Enum):
    """Estado del cálculo de salario"""
    DRAFT = "draft"           # Borrador
    CALCULATED = "calculated" # Calculado
    VALIDATED = "validated"   # Validado
    APPROVED = "approved"     # Aprobado
    PAID = "paid"            # Pagado
    CANCELLED = "cancelled"   # Cancelado

class PayrollRunStatus(str, Enum):
    """Estado de ejecución de nómina"""
    DRAFT = "draft"
    PROCESSING = "processing"
    COMPLETED = "completed"
    APPROVED = "approved"
    FAILED = "failed"
```

### 2. Helper Models (Building Blocks)

#### HoursBreakdown

```python
hours = HoursBreakdown(
    regular_hours=160.0,
    overtime_hours=20.0,
    night_hours=15.0,
    holiday_hours=8.0,
    sunday_hours=8.0,
    total_hours=211.0,  # Auto-validado
    work_days=22
)
```

#### RatesConfiguration

```python
rates = RatesConfiguration(
    base_rate=1200.0,
    regular_rate=1200.0,
    overtime_rate=1.25,   # 労働基準法: 1.25x mínimo
    night_rate=1.25,
    holiday_rate=1.35,
    sunday_rate=1.35
)
```

#### SalaryAmounts

```python
amounts = SalaryAmounts(
    regular_amount=192000.0,
    overtime_amount=30000.0,
    night_amount=22500.0,
    holiday_amount=12960.0,
    sunday_amount=12960.0,
    bonus=20000.0,
    gasoline_allowance=15000.0,
    subtotal=305420.0  # Auto-calculado
)
```

#### DeductionsDetail

```python
deductions = DeductionsDetail(
    income_tax=15271.0,        # 所得税
    resident_tax=8000.0,       # 住民税
    health_insurance=14500.0,  # 健康保険
    pension=18300.0,           # 厚生年金
    employment_insurance=1527.0, # 雇用保険
    apartment_deduction=30000.0, # 寮費
    other_deductions=0.0,
    total_deductions=87598.0   # Auto-calculado
)
```

#### PayrollSummary

```python
summary = PayrollSummary(
    gross_salary=305420.0,
    total_deductions=87598.0,
    net_salary=217822.0,      # Auto-validado
    factory_payment=350000.0,
    company_profit=44580.0
)
```

### 3. Core Response Model

#### SalaryCalculationResponse

**El modelo más importante** - Respuesta completa de cálculo de salario:

```python
response = SalaryCalculationResponse(
    # Identifiers
    id=1,
    employee_id=123,
    employee_name="田中太郎",

    # Period
    month=10,
    year=2025,

    # Hours (expandido)
    regular_hours=160.0,
    overtime_hours=20.0,
    night_hours=15.0,
    holiday_hours=8.0,
    sunday_hours=8.0,
    total_hours=211.0,
    work_days=22,

    # Rates (expandido)
    base_rate=1200.0,
    regular_rate=1200.0,
    overtime_rate=1.25,
    night_rate=1.25,
    holiday_rate=1.35,
    sunday_rate=1.35,

    # Amounts (expandido)
    regular_amount=192000.0,
    overtime_amount=30000.0,
    night_amount=22500.0,
    holiday_amount=12960.0,
    sunday_amount=12960.0,
    bonus=20000.0,
    gasoline_allowance=15000.0,

    # Deductions (expandido)
    apartment_deduction=30000.0,
    income_tax=15271.0,
    resident_tax=8000.0,
    health_insurance=14500.0,
    pension=18300.0,
    employment_insurance=1527.0,
    other_deductions=0.0,

    # Totals
    gross_salary=305420.0,
    total_deductions=87598.0,
    net_salary=217822.0,
    factory_payment=350000.0,
    company_profit=44580.0,

    # Status
    status=SalaryStatus.CALCULATED,

    # Metadata
    payslip_path="/payslips/2025/10/123_payslip.pdf",
    notes=None,
    created_at=datetime.now(),
    updated_at=datetime.now(),
    paid_at=None
)
```

### 4. Request Models

#### SalaryCalculateRequest
```python
request = SalaryCalculateRequest(
    employee_id=123,
    month=10,
    year=2025,
    use_timer_cards=True,
    bonus=20000.0,
    gasoline_allowance=15000.0,
    other_deductions=0.0,
    notes="Regular calculation"
)
```

#### SalaryBulkCalculateRequest
```python
request = SalaryBulkCalculateRequest(
    employee_ids=[123, 124, 125],  # None = todos
    factory_id=None,  # Filtrar por factory
    month=10,
    year=2025,
    use_timer_cards=True
)
```

#### SalaryMarkPaidRequest
```python
request = SalaryMarkPaidRequest(
    salary_ids=[1, 2, 3],
    payment_date=datetime.now(),
    notes="Bank transfer completed"
)
```

#### SalaryValidateRequest
```python
request = SalaryValidateRequest(
    employee_id=123,
    month=10,
    year=2025
)
```

#### SalaryUpdateRequest
```python
request = SalaryUpdateRequest(
    bonus=25000.0,
    gasoline_allowance=18000.0,
    other_deductions=5000.0,
    notes="Bonus increased",
    status=SalaryStatus.APPROVED
)
```

### 5. Response Models

#### SalaryResponse
```python
response = SalaryResponse(
    success=True,
    id=1,
    status=SalaryStatus.CALCULATED,
    data=SalaryCalculationResponse(...),
    message="Salary calculated successfully"
)
```

#### SalaryListResponse
```python
response = SalaryListResponse(
    items=[...],  # List[SalaryCalculationResponse]
    total=150,
    page=1,
    pages=15,
    page_size=10
)
```

#### BulkCalculateResponse
```python
response = BulkCalculateResponse(
    successful=45,
    failed=3,
    total=48,
    results=[...],  # List[SalaryResponse]
    errors={126: "Missing data"},
    total_gross_amount=13743900.0,
    total_net_amount=9820730.0,
    total_company_profit=1897840.0
)
```

#### ValidationResult
```python
result = ValidationResult(
    is_valid=False,
    errors=["No timer card records found"],
    warnings=["High overtime hours detected"],
    validated_at=datetime.now()
)
```

#### SalaryStatistics
```python
stats = SalaryStatistics(
    month=10,
    year=2025,
    total_employees=45,
    total_gross_amount=13743900.0,
    total_deductions=3923170.0,
    total_net_amount=9820730.0,
    company_total_profit=1897840.0,
    average_salary=218238.44,
    highest_salary=387500.0,
    lowest_salary=145800.0,
    by_factory=[{...}]  # Opcional
)
```

### 6. Payslip Models

#### PayslipGenerateRequest
```python
request = PayslipGenerateRequest(
    salary_id=1,
    include_breakdown=True,
    language="ja"  # ja/en
)
```

#### PayslipResponse
```python
response = PayslipResponse(
    success=True,
    salary_id=1,
    pdf_path="/payslips/2025/10/123_payslip.pdf",
    pdf_url="/api/payslips/download/1",
    generated_at=datetime.now()
)
```

### 7. CRUD Operation Models

#### SalaryCreateResponse
```python
response = SalaryCreateResponse(
    id=1,
    status=SalaryStatus.DRAFT,
    created_at=datetime.now(),
    message="Salary calculation created successfully"
)
```

#### SalaryUpdateResponse
```python
response = SalaryUpdateResponse(
    id=1,
    status=SalaryStatus.APPROVED,
    updated_at=datetime.now(),
    message="Salary calculation updated successfully"
)
```

#### SalaryDeleteResponse
```python
response = SalaryDeleteResponse(
    id=1,
    deleted_at=datetime.now(),
    message="Salary calculation deleted successfully"
)
```

### 8. Error Models

#### SalaryError
```python
error = SalaryError(
    error="CALCULATION_FAILED",
    detail="Missing timer card data for specified period",
    employee_id=123,
    timestamp=datetime.now()
)
```

---

## 🔄 Guía de Migración

### Desde `salary.py` (Legacy)

#### Antes:
```python
from app.schemas.salary import (
    SalaryCalculate,
    SalaryCalculationResponse,
    SalaryBulkCalculate,
    SalaryBulkResult
)

# Request básico
request = SalaryCalculate(
    employee_id=123,
    month=10,
    year=2025,
    bonus=20000,
    gasoline_allowance=15000
)
```

#### Después:
```python
from app.schemas import (
    SalaryCalculateRequest,
    UnifiedSalaryCalculationResponse,
    SalaryBulkCalculateRequest,
    BulkCalculateResponse
)

# Request mejorado con validación
request = SalaryCalculateRequest(
    employee_id=123,
    month=10,
    year=2025,
    use_timer_cards=True,  # NUEVO
    bonus=20000.0,
    gasoline_allowance=15000.0,
    notes="Regular calculation"  # NUEVO
)
```

### Desde `payroll.py` (Legacy)

#### Antes:
```python
from app.schemas.payroll import (
    HoursBreakdown,
    DeductionsDetail,
    EmployeePayrollResult
)

# Modelos básicos
hours = HoursBreakdown(
    regular_hours=160.0,
    overtime_hours=20.0,
    # ... etc
)
```

#### Después:
```python
from app.schemas import (
    UnifiedHoursBreakdown,
    UnifiedDeductionsDetail,
    SalaryResponse
)

# Modelos con auto-validación
hours = UnifiedHoursBreakdown(
    regular_hours=160.0,
    overtime_hours=20.0,
    night_hours=15.0,
    holiday_hours=8.0,
    sunday_hours=8.0,
    total_hours=211.0,  # ✅ Auto-validado
    work_days=22
)
```

---

## ✅ Validaciones Automáticas

El esquema unificado incluye validadores automáticos:

### 1. Total Hours Validation

```python
hours = HoursBreakdown(
    regular_hours=160.0,
    overtime_hours=20.0,
    night_hours=15.0,
    holiday_hours=8.0,
    sunday_hours=8.0,
    total_hours=999.0  # ❌ Incorrecto
)
# ✅ Auto-corregido a 211.0 (suma de todos)
```

### 2. Subtotal Validation

```python
amounts = SalaryAmounts(
    regular_amount=192000.0,
    overtime_amount=30000.0,
    # ... otros
    subtotal=999999.0  # ❌ Incorrecto
)
# ✅ Auto-corregido a suma correcta
```

### 3. Total Deductions Validation

```python
deductions = DeductionsDetail(
    income_tax=15271.0,
    resident_tax=8000.0,
    # ... otros
    total_deductions=999999.0  # ❌ Incorrecto
)
# ✅ Auto-corregido a suma correcta
```

### 4. Net Salary Validation

```python
summary = PayrollSummary(
    gross_salary=305420.0,
    total_deductions=87598.0,
    net_salary=999999.0  # ❌ Incorrecto
)
# ✅ Auto-corregido a gross - deductions
```

---

## 📊 Casos de Uso Completos

### Caso 1: Cálculo Individual con Validación

```python
from app.schemas import (
    SalaryValidateRequest,
    SalaryCalculateRequest,
    SalaryResponse,
    ValidationResult
)

# 1. Validar primero
validate_req = SalaryValidateRequest(
    employee_id=123,
    month=10,
    year=2025
)

validation = await salary_service.validate(validate_req)

if not validation.is_valid:
    # Mostrar errores
    for error in validation.errors:
        print(f"❌ {error}")
    return

# 2. Si válido, calcular
calculate_req = SalaryCalculateRequest(
    employee_id=123,
    month=10,
    year=2025,
    use_timer_cards=True
)

result = await salary_service.calculate(calculate_req)
```

### Caso 2: Cálculo Masivo con Manejo de Errores

```python
from app.schemas import SalaryBulkCalculateRequest, BulkCalculateResponse

# Calcular para todos los empleados de una factory
request = SalaryBulkCalculateRequest(
    factory_id="F001",
    month=10,
    year=2025
)

response: BulkCalculateResponse = await salary_service.bulk_calculate(request)

print(f"✅ Successful: {response.successful}")
print(f"❌ Failed: {response.failed}")
print(f"💰 Total Net: ¥{response.total_net_amount:,.0f}")

# Procesar errores
for employee_id, error_msg in response.errors.items():
    print(f"Employee {employee_id}: {error_msg}")
```

### Caso 3: Generar Payslips

```python
from app.schemas import PayslipGenerateRequest, PayslipResponse

# Generar recibo de pago
request = PayslipGenerateRequest(
    salary_id=1,
    include_breakdown=True,
    language="ja"
)

payslip: PayslipResponse = await payslip_service.generate(request)

if payslip.success:
    print(f"📄 PDF: {payslip.pdf_path}")
    print(f"🔗 URL: {payslip.pdf_url}")
```

### Caso 4: Marcar como Pagado

```python
from app.schemas import SalaryMarkPaidRequest

# Marcar múltiples salarios como pagados
request = SalaryMarkPaidRequest(
    salary_ids=[1, 2, 3, 4, 5],
    payment_date=datetime.now(),
    notes="Bank transfer batch #2025-10-31"
)

result = await salary_service.mark_paid(request)
```

### Caso 5: Estadísticas Mensuales

```python
from app.schemas import SalaryStatistics

# Obtener estadísticas del mes
stats: SalaryStatistics = await salary_service.get_statistics(
    month=10,
    year=2025
)

print(f"👥 Employees: {stats.total_employees}")
print(f"💵 Gross: ¥{stats.total_gross_amount:,.0f}")
print(f"💰 Net: ¥{stats.total_net_amount:,.0f}")
print(f"📈 Company Profit: ¥{stats.company_total_profit:,.0f}")
print(f"📊 Average: ¥{stats.average_salary:,.0f}")

# Por factory
if stats.by_factory:
    for factory in stats.by_factory:
        print(f"Factory {factory['factory_name']}: ¥{factory['total_gross']:,.0f}")
```

---

## 🎯 Mejores Prácticas

### 1. Usar Type Hints

```python
from app.schemas import SalaryCalculateRequest, SalaryResponse
from typing import Optional

async def calculate_employee_salary(
    employee_id: int,
    month: int,
    year: int
) -> Optional[SalaryResponse]:
    """Calculate salary with proper type hints"""
    request = SalaryCalculateRequest(
        employee_id=employee_id,
        month=month,
        year=year
    )
    return await salary_service.calculate(request)
```

### 2. Validar Antes de Calcular

```python
# ✅ BUENO: Validar primero
validation = await salary_service.validate(validate_req)
if validation.is_valid:
    result = await salary_service.calculate(calculate_req)

# ❌ MALO: Calcular sin validar
result = await salary_service.calculate(calculate_req)  # Puede fallar
```

### 3. Manejar Errores Apropiadamente

```python
from app.schemas import SalaryError
from fastapi import HTTPException

try:
    result = await salary_service.calculate(request)
except ValueError as e:
    error = SalaryError(
        error="CALCULATION_FAILED",
        detail=str(e),
        employee_id=request.employee_id
    )
    raise HTTPException(status_code=400, detail=error.dict())
```

### 4. Usar Enums para Status

```python
from app.schemas import SalaryStatus

# ✅ BUENO: Usar enum
if salary.status == SalaryStatus.CALCULATED:
    # Proceder a aprobar
    salary.status = SalaryStatus.APPROVED

# ❌ MALO: Usar strings
if salary.status == "calculated":  # Propenso a typos
    salary.status = "approved"
```

---

## 📝 Notas Importantes

### Compatibilidad hacia Atrás

Los esquemas legacy (`salary.py` y `payroll.py`) **se mantienen por ahora** para compatibilidad:

```python
# ✅ Todavía funciona (pero deprecated)
from app.schemas.salary import SalaryCalculate

# ✅ RECOMENDADO para código nuevo
from app.schemas import SalaryCalculateRequest
```

### Migración Gradual

No es necesario migrar todo el código inmediatamente:

1. **Nuevo código**: Usar `salary_unified`
2. **Código existente**: Puede seguir usando legacy schemas
3. **Migrar gradualmente**: Refactorizar cuando sea conveniente

### Deprecation Timeline

- **v5.4.1**: Unified schema introducido, legacy mantenido
- **v5.5.0** (futuro): Legacy schemas marcados como deprecated
- **v6.0.0** (futuro): Legacy schemas removidos

---

## 🔗 Referencias

- **Archivo principal**: `/backend/app/schemas/salary_unified.py`
- **Exportaciones**: `/backend/app/schemas/__init__.py`
- **Legacy schemas**:
  - `/backend/app/schemas/salary.py` (deprecated)
  - `/backend/app/schemas/payroll.py` (deprecated)

---

## 📞 Soporte

Para preguntas o problemas con el unified schema:

1. Ver ejemplos en `salary_unified.py` (json_schema_extra)
2. Consultar esta guía
3. Revisar validadores en el código fuente

---

**Última actualización**: 2025-11-12
**Versión**: 5.4.1
