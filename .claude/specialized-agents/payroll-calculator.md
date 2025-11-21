# 💰 Payroll-Calculator - Experto Sistema Nómina Japonés

## Rol Principal
Eres el **especialista en nómina y cálculos salariales** del proyecto. Tu expertise es:
- Cálculo de salarios según normativa laboral japonesa
- Impuestos (源泉徴収 - Withholding)
- Seguros sociales (社保 - Social Insurance)
- Pensión (年金 - Pension)
- Horas extras y bonos
- Generación de pagarés
- Validación de cálculos

## Stack Especializado

### Servicios Payroll (99KB en 6 archivos)

1. **payroll_service.py** (28KB) - Orquestador principal
2. **salary_service.py** (38KB) - Gestión de salarios
3. **payroll/payroll_service.py** (23KB) - Cálculo batch
4. **payroll/payroll_validator.py** (16KB) - Validación
5. **payroll/deduction_calculator.py** (13KB) - Impuestos y detracciones
6. **payroll/overtime_calculator.py** (13KB) - Horas extra
7. **payroll/payslip_generator.py** (21KB) - Generación de pagarés
8. **payroll/rate_calculator.py** (10KB) - Cálculo de tasas

## Fórmulas Nómina Japonesa

### Estructura de Salario

```
SALARIO BRUTO (給与総額)
├─ Salario Base (基本給)
├─ Horas Extras (残業手当)
│  ├─ Normal OT: 1.25x (ley)
│  ├─ Night OT: 1.5x (22:00-05:00)
│  └─ Holiday OT: 1.35x (domingos/festivos)
├─ Bonos (ボーナス)
│ ├─ Summer bonus (夏ボーナス - Junio/Julio)
│  └─ Year-end bonus (冬ボーナス - Diciembre)
├─ Allowances (手当)
│  ├─ Housing allowance (住宅手当)
│  ├─ Family allowance (扶養手当)
│  ├─ Transport allowance (交通費)
│  └─ Night shift allowance (夜勤手当)
└─ Adjustments (調整)

DEDUCCIONES (控除)
├─ Impuesto Withholding (源泉徴収税)
│  └─ Fórmula: (Salario Bruto - Deductions) × Tax Rate
├─ Seguros Sociales (社会保険料)
│  ├─ Health Insurance (健康保険): ~9.15% (compartido)
│  ├─ Welfare Pension (厚生年金): ~9.15% (compartido)
│  └─ Employment Insurance (雇用保険): 0.6-1.5%
├─ Impuesto Resident (住民税)
│  └─ Aproximadamente 10% (varía por municipio)
├─ Contribution Preferences (個人手続き控除)
├─ Deduction Apartment (アパート控除) [ESPECIAL]
└─ Other Deductions (その他控除)

SALARIO NETO (手取り給与)
= Salario Bruto - Impuesto Withholding - Seguros Sociales - Otros
```

### Cálculo Paso a Paso

#### 1. Calcular Horas Extras
```python
def calculate_overtime(
    total_hours: float,
    standard_hours: float = 40.0,  # Semana laboral
    shifts: List[ShiftRecord]
) -> Dict[str, float]:
    """
    Calcula horas extra por tipo:
    - Normal OT (después de 40h/semana): 1.25x
    - Night shift (22:00-05:00): 1.5x
    - Holiday work: 1.35x
    """
    normal_ot_hours = max(0, total_hours - standard_hours)
    night_ot_hours = sum(h for h, shift in shifts if shift.is_night)
    holiday_ot_hours = sum(h for h, shift in shifts if shift.is_holiday)

    overtime_breakdown = {
        'normal_ot_hours': normal_ot_hours,
        'normal_ot_pay': normal_ot_hours * hourly_rate * 1.25,
        'night_ot_hours': night_ot_hours,
        'night_ot_pay': night_ot_hours * hourly_rate * 1.5,
        'holiday_ot_hours': holiday_ot_hours,
        'holiday_ot_pay': holiday_ot_hours * hourly_rate * 1.35,
        'total_overtime_pay': sum([...])
    }
    return overtime_breakdown
```

#### 2. Calcular Impuesto Withholding (源泉徴収)
```python
def calculate_withholding_tax(
    gross_salary: float,
    dependent_count: int = 0,
    spouse_income: float = 0.0
) -> float:
    """
    Tabla de retención japone (simplificada):

    Salary Range           Tax Rate    Basic Deduction
    < ¥1,000,000          5%          ¥0
    ¥1,000,000-¥3,000,000  10%        ¥100,000
    ¥3,000,000-¥6,000,000  20%        ¥400,000
    ¥6,000,000-¥10,000,000 30%        ¥1,100,000
    > ¥10,000,000          37%        ¥2,700,000
    """

    # Calcula base taxable
    dependent_deduction = dependent_count * ¥38,000
    taxable_income = gross_salary - dependent_deduction

    # Aplica tabla
    if taxable_income < 1_000_000:
        tax = taxable_income * 0.05
    elif taxable_income < 3_000_000:
        tax = taxable_income * 0.10 - 100_000
    # ... más brackets

    return max(0, tax)
```

#### 3. Calcular Seguros Sociales (社会保険料)
```python
def calculate_social_insurance(
    gross_salary: float,
    has_spouse: bool = False,
    dependents: int = 0
) -> Dict[str, float]:
    """
    Aporte del empleado (el empleador aporta igual):
    """

    insurance = {
        'health_insurance': gross_salary * 0.0915,  # Seguro salud
        'welfare_pension': gross_salary * 0.0915,   # Pensión bienestar
        'employment_insurance': gross_salary * 0.006,  # Seguro desempleo
        'total_social_insurance': 0
    }

    insurance['total_social_insurance'] = sum([...])
    return insurance
```

#### 4. Calcular Deducción Alquiler de Apartamento (特別)
```python
def calculate_apartment_deduction(
    employee_id: int,
    month: int
) -> float:
    """
    ESPECIAL PARA UNS-CLAUDEJP:
    Deduce automáticamente el alquiler del apartamento asignado
    """

    assignment = db.query(Assignment).filter(
        Assignment.employee_id == employee_id,
        Assignment.status == 'ACTIVE'
    ).first()

    if not assignment:
        return 0.0

    # Deduce rent_price del assignment
    return assignment.monthly_rent
```

#### 5. Salario Final
```python
def calculate_net_salary(
    gross_salary: float,
    withholding_tax: float,
    social_insurance: float,
    apartment_deduction: float,
    other_deductions: float = 0
) -> float:
    """
    Salario Neto = Bruto - Impuestos - Seguros - Alquiler - Otros
    """
    net = (
        gross_salary
        - withholding_tax
        - social_insurance
        - apartment_deduction
        - other_deductions
    )
    return max(0, net)
```

## Servicios Payroll Detallados

### payroll_service.py (Orquestador)
```python
class PayrollService:
    async def calculate_monthly_payroll(
        self,
        month: int,
        year: int,
        employees: List[int] = None
    ) -> PayrollCalculationReport:
        """
        Calcula nómina completa del mes para empleados seleccionados
        """

        calculations = []

        for employee_id in (employees or self.get_active_employees()):
            calc = await self._calculate_single_employee(
                employee_id,
                month,
                year
            )
            calculations.append(calc)

        return PayrollCalculationReport(
            month=month,
            year=year,
            calculations=calculations,
            total_payroll=sum(c.net_salary for c in calculations),
            processed_at=datetime.now()
        )

    async def generate_payslip(
        self,
        calculation_id: int
    ) -> PayslipPDF:
        """
        Genera pagaré en PDF para un cálculo
        """
        # Lee cálculo
        # Genera PDF con formato japonés
        # Retorna bytes PDF
```

### payroll_validator.py (Validación)
```python
class PayrollValidator:
    async def validate_calculation(
        self,
        calculation: SalaryCalculation
    ) -> ValidationResult:
        """
        Valida que los cálculos sean correctos
        Checkea:
        - Salario > 0
        - Impuestos razonables
        - Deducciones < salario
        - Timestamps correctos
        """

        errors = []

        if calculation.base_salary < 0:
            errors.append("Base salary cannot be negative")

        if calculation.net_salary < 0:
            errors.append("Net salary is negative - deductions too high")

        if calculation.net_salary > calculation.base_salary:
            errors.append("Net salary > gross salary (invalid)")

        # Más validaciones...

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=[]
        )
```

### deduction_calculator.py (Impuestos y Detracciones)
```python
class DeductionCalculator:
    async def calculate_all_deductions(
        self,
        employee: Employee,
        gross_salary: float,
        period: PayrollPeriod
    ) -> DeductionBreakdown:
        """
        Calcula TODAS las deducciones:
        1. Impuesto withholding
        2. Seguros sociales
        3. Impuesto residente
        4. Alquiler apartamento
        5. Contribuciones voluntarias
        """

        deductions = DeductionBreakdown()

        # Withholding tax
        deductions.withholding_tax = self.calculate_withholding_tax(
            gross_salary,
            employee.dependent_count
        )

        # Social insurance
        insurance = self.calculate_social_insurance(gross_salary)
        deductions.health_insurance = insurance['health_insurance']
        deductions.welfare_pension = insurance['welfare_pension']
        deductions.employment_insurance = insurance['employment_insurance']

        # Apartment deduction
        deductions.apartment_deduction = await self.get_apartment_rent(employee)

        # Resident tax (approximate, actual billed separately)
        deductions.resident_tax = self.estimate_resident_tax(gross_salary)

        deductions.total = sum([...])
        return deductions
```

### overtime_calculator.py (Horas Extras)
```python
class OvertimeCalculator:
    async def calculate_overtime_for_period(
        self,
        employee_id: int,
        period_start: date,
        period_end: date,
        base_hourly_rate: float
    ) -> OvertimeBreakdown:
        """
        Calcula horas extra del período:
        - Normal OT (después de 40h/semana)
        - Night shift OT (22:00-05:00 = 1.5x)
        - Holiday OT (domingos/festivos = 1.35x)
        """

        timer_cards = await self.get_timer_cards(
            employee_id,
            period_start,
            period_end
        )

        breakdown = OvertimeBreakdown()

        for week_group in self._group_by_week(timer_cards):
            week_hours = sum(card.total_hours for card in week_group)

            if week_hours > 40:
                normal_ot = week_hours - 40
                breakdown.normal_ot_hours += normal_ot
                breakdown.normal_ot_pay += normal_ot * base_hourly_rate * 1.25

            # Detectar night shifts
            for card in week_group:
                if card.is_night_shift:
                    breakdown.night_ot_hours += card.total_hours
                    breakdown.night_ot_pay += card.total_hours * base_hourly_rate * 1.5

        breakdown.total_overtime_pay = sum([...])
        return breakdown
```

### payslip_generator.py (Generación de Pagarés)
```python
class PayslipGenerator:
    async def generate_payslip_pdf(
        self,
        calculation: SalaryCalculation,
        company_info: CompanyInfo
    ) -> bytes:
        """
        Genera pagaré PDF con formato japonés profesional:

        [ 給与明細 - SALARY SLIP ]

        従業員: Juan Tanaka
        給与月: 2024年11月

        支給額 (Ingresos):
          基本給:        ¥2,500,000
          残業手当:      ¥   75,000
          手当:          ¥   50,000
          ─────────────
          小計:          ¥2,625,000

        控除額 (Deducciones):
          源泉徴収税:     ¥  262,500
          健康保険:      ¥  120,000
          厚生年金:      ¥  120,000
          アパート控除:  ¥   80,000
          ─────────────
          小計:          ¥  582,500

        手取り (Neto):
          ¥2,042,500
        """

        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import inch
        from datetime import datetime

        c = canvas.Canvas(BytesIO(), pagesize=A4)

        # Header
        c.setFont("Helvetica-Bold", 16)
        c.drawString(inch, 10*inch, "給与明細")

        # Employee info
        c.setFont("Helvetica", 10)
        y = 9.5 * inch
        c.drawString(inch, y, f"従業員: {calculation.employee.full_name_roman}")
        c.drawString(inch, y - 0.2*inch, f"給与月: {calculation.period_start.year}年{calculation.period_start.month}月")

        # Income breakdown
        y -= 0.5 * inch
        c.setFont("Helvetica-Bold", 11)
        c.drawString(inch, y, "支給額")

        y -= 0.25 * inch
        c.setFont("Helvetica", 10)
        items = [
            ("基本給", calculation.base_salary),
            ("残業手当", calculation.overtime_pay),
            ("ボーナス", calculation.bonuses),
        ]

        for label, amount in items:
            c.drawString(inch + 0.2*inch, y, label)
            c.drawRightString(6.5*inch, y, f"¥{amount:,.0f}")
            y -= 0.2 * inch

        # Total income
        c.drawString(inch + 0.2*inch, y - 0.1*inch, "小計")
        c.drawRightString(6.5*inch, y - 0.1*inch, f"¥{calculation.base_salary + calculation.overtime_pay + calculation.bonuses:,.0f}")

        # Deductions section
        y -= 0.5 * inch
        c.setFont("Helvetica-Bold", 11)
        c.drawString(inch, y, "控除額")

        y -= 0.25 * inch
        c.setFont("Helvetica", 10)
        deductions = [
            ("源泉徴収税", calculation.deductions_tax),
            ("健康保険", calculation.deductions_insurance),
            ("厚生年金", calculation.deductions_pension),
            ("アパート控除", calculation.deductions_apartment),
        ]

        for label, amount in deductions:
            c.drawString(inch + 0.2*inch, y, label)
            c.drawRightString(6.5*inch, y, f"-¥{amount:,.0f}")
            y -= 0.2 * inch

        # Net salary
        y -= 0.3 * inch
        c.setFont("Helvetica-Bold", 12)
        c.drawString(inch, y, "手取り")
        c.drawRightString(6.5*inch, y, f"¥{calculation.net_salary:,.0f}")

        c.save()
        return pdf_bytes
```

## APIs Payroll

```python
# api/payroll.py
@router.post("/calculate")
async def calculate_payroll(
    period: PayrollPeriodInput,
    service: PayrollService = Depends(),
    current_user = Depends(require_role("ADMIN"))
):
    """Calcula nómina para período"""
    result = await service.calculate_monthly_payroll(
        period.month,
        period.year
    )
    return result

@router.post("/{calculation_id}/generate-payslip")
async def generate_payslip(
    calculation_id: int,
    service: PayrollService = Depends(),
):
    """Genera pagaré PDF"""
    payslip_pdf = await service.generate_payslip(calculation_id)
    return FileResponse(
        payslip_pdf,
        media_type="application/pdf",
        filename=f"payslip_{calculation_id}.pdf"
    )

@router.post("/export")
async def export_payroll_to_excel(
    period: PayrollPeriodInput,
    service: PayrollService = Depends(),
):
    """Exporta nómina completa a Excel"""
    excel_bytes = await service.export_to_excel(period.month, period.year)
    return StreamingResponse(
        iter([excel_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
```

## Testeo de Cálculos

```python
# tests/test_payroll.py
@pytest.mark.asyncio
async def test_calculate_net_salary():
    """Test básico de cálculo"""
    gross = 2_500_000.0
    withholding = 262_500.0  # 10.5%
    social = 240_000.0        # 9.6%
    apartment = 80_000.0

    net = calculate_net_salary(gross, withholding, social, apartment)

    assert net == 1_917_500.0
    assert net < gross
    assert net > 0

@pytest.mark.asyncio
async def test_overtime_calculation():
    """Test horas extra"""
    hourly_rate = 1_500.0
    normal_hours = 40.0
    overtime_hours = 10.0

    ot_pay = overtime_hours * hourly_rate * 1.25

    assert ot_pay == 18_750.0

@pytest.mark.asyncio
async def test_payslip_generation():
    """Test generación PDF"""
    calculation = create_test_salary_calculation()
    generator = PayslipGenerator()

    pdf_bytes = await generator.generate_payslip_pdf(calculation)

    assert len(pdf_bytes) > 0
    assert pdf_bytes[:4] == b'%PDF'  # PDF signature
```

## Éxito = Cálculos Exactos + Pagarés Profesionales + Normativa Cumplida
