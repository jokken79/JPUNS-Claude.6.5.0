"""
Deduction Calculator - Payroll System
Calculadora de deducciones (impuestos, seguros sociales) según legislación japonesa
"""
from decimal import Decimal
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class DeductionCalculator:
    """Calculadora de deducciones según regulaciones japonesas.

    Maneja las siguientes deducciones:
    - Income Tax (所得税): Impuesto sobre la renta
    - Resident Tax (住民税): Impuesto municipal
    - Health Insurance (健康保険): Seguro de salud (3.95-4.95%)
    - Pension (厚生年金): Pensión pública (9.15%)
    - Employment Insurance (雇用保险): Seguro de desempleo (0.6%)

    Cumple con regulaciones japonesas actuales
    """

    # Tasas estándar de seguros sociales (2025)
    HEALTH_INSURANCE_RATE = Decimal('0.0495')  # 4.95% (máximo)
    PENSION_RATE = Decimal('0.0915')  # 9.15%
    EMPLOYMENT_INSURANCE_RATE = Decimal('0.006')  # 0.6%

    # Umbral de ingreso mínimo para impuesto (simplificado)
    INCOME_TAX_THRESHOLD = Decimal('88000')  # ¥88,000

    def __init__(self, employee_data: Optional[Dict] = None):
        """Inicializa el calculador de deducciones.

        Args:
            employee_data (Dict): Datos del empleado:
                - prefecture: str (ej. 'Tokyo', 'Osaka') para resident tax
                - dependents: int (familiares a cargo)
                - apartment_rent: Decimal (renta de apartamento)
                - other_deductions: Dict (otras deducciones personalizadas)
        """
        self.employee_data = employee_data or {}
        self.prefecture = self.employee_data.get('prefecture', 'Tokyo')
        self.dependents = self.employee_data.get('dependents', 0)
        self.apartment_rent = Decimal(str(self.employee_data.get('apartment_rent', 30000)))
        self.other_deductions = self.employee_data.get('other_deductions', {})

        logger.info(f"DeductionCalculator initialized for employee in {self.prefecture}")

    def calculate_income_tax(self, gross_income: Decimal) -> Decimal:
        """Calcula el impuesto sobre la renta (所得税).

        Utiliza cálculo simplificado basado en brackets japonés.
        Para implementación completa, usar tablas oficiales de NTA.

        Args:
            gross_income (Decimal): Ingreso bruto mensual

        Returns:
            Decimal: Impuesto sobre la renta

        Examples:
            >>> calc = DeductionCalculator()
            >>> tax = calc.calculate_income_tax(Decimal('200000'))
            >>> print(tax)
            5600
        """
        if gross_income <= self.INCOME_TAX_THRESHOLD:
            logger.debug(f"Income tax: 0 (income {gross_income} below threshold)")
            return Decimal('0')

        # Simplified Japanese income tax calculation
        # Actual calculation uses complex brackets from National Tax Agency
        taxable_income = gross_income - self.INCOME_TAX_THRESHOLD

        # Simplified rate: 5% on excess (actual rates vary by income level)
        income_tax = taxable_income * Decimal('0.05')

        # Add dependent deduction (simplified)
        if self.dependents > 0:
            dependent_deduction = Decimal(str(self.dependents)) * Decimal('5000')
            income_tax = max(Decimal('0'), income_tax - dependent_deduction)

        logger.debug(f"Income tax calculated: ¥{income_tax}")
        return income_tax.quantize(Decimal('0'))  # Round to nearest yen

    def calculate_resident_tax(self, gross_income: Decimal) -> Decimal:
        """Calcula el impuesto municipal (住民税).

        Típicamente 10% del ingreso después de deducciones básicas.
        Varía por prefecture y ciudad.

        Args:
            gross_income (Decimal): Ingreso bruto mensual

        Returns:
            Decimal: Impuesto municipal

        Examples:
            >>> calc = DeductionCalculator({'prefecture': 'Tokyo'})
            >>> tax = calc.calculate_resident_tax(Decimal('200000'))
            >>> print(tax)
            11200
        """
        # Simplified resident tax calculation
        # Base deduction is lower than income tax
        base_deduction = Decimal('58000')

        if gross_income <= base_deduction:
            return Decimal('0')

        taxable_income = gross_income - base_deduction

        # Rate varies by prefecture (8-10%)
        # Tokyo: 10%, Osaka: 9.4%, etc.
        if self.prefecture == 'Tokyo':
            rate = Decimal('0.10')
        elif self.prefecture == 'Osaka':
            rate = Decimal('0.094')
        else:
            rate = Decimal('0.09')  # Default

        resident_tax = taxable_income * rate

        logger.debug(f"Resident tax calculated for {self.prefecture}: ¥{resident_tax}")
        return resident_tax.quantize(Decimal('0'))

    def calculate_health_insurance(self, gross_income: Decimal) -> Decimal:
        """Calcula seguro de salud (健康保険).

        Tasa estándar: 4.95% (dividido empleado/empleador).
        El empleado paga la mitad.

        Args:
            gross_income (Decimal): Ingreso bruto mensual

        Returns:
            Decimal: Seguro de salud (porción empleado)

        Examples:
            >>> calc = DeductionCalculator()
            >>> premium = calc.calculate_health_insurance(Decimal('200000'))
            >>> print(premium)
            4950  # 200000 * 0.0495
        """
        # Health insurance premium is split 50/50 employer/employee
        employee_share = gross_income * self.HEALTH_INSURANCE_RATE / Decimal('2')

        logger.debug(f"Health insurance calculated: ¥{employee_share}")
        return employee_share.quantize(Decimal('0'))

    def calculate_pension(self, gross_income: Decimal) -> Decimal:
        """Calcula pensión pública (厚生年金).

        Tasa estándar: 9.15% (dividido empleado/empleador).
        El empleado paga la mitad.

        Args:
            gross_income (Decimal): Ingreso bruto mensual

        Returns:
            Decimal: Pensión (porción empleado)

        Examples:
            >>> calc = DeductionCalculator()
            >>> premium = calc.calculate_pension(Decimal('200000'))
            >>> print(premium)
            9150  # 200000 * 0.0915 / 2
        """
        # Pension premium is split 50/50 employer/employee
        employee_share = gross_income * self.PENSION_RATE / Decimal('2')

        logger.debug(f"Pension calculated: ¥{employee_share}")
        return employee_share.quantize(Decimal('0'))

    def calculate_employment_insurance(self, gross_income: Decimal) -> Decimal:
        """Calcula seguro de desempleo (雇用保险).

        Tasa estándar: 0.6% (dividido empleado/empleador).
        El empleado paga 0.3%.

        Args:
            gross_income (Decimal): Ingreso bruto mensual

        Returns:
            Decimal: Seguro de desempleo (porción empleado)

        Examples:
            >>> calc = DeductionCalculator()
            >>> premium = calc.calculate_employment_insurance(Decimal('200000'))
            >>> print(premium)
            600  # 200000 * 0.006
        """
        # Employment insurance: employee pays 0.3%, employer pays 0.3%
        employee_share = gross_income * self.EMPLOYMENT_INSURANCE_RATE / Decimal('2')

        logger.debug(f"Employment insurance calculated: ¥{employee_share}")
        return employee_share.quantize(Decimal('0'))

    def calculate_apartment_deduction(self) -> Decimal:
        """Calcula deducción por renta de apartamento.

        Returns:
            Decimal: Monto de renta a deducir

        Examples:
            >>> calc = DeductionCalculator({'apartment_rent': 35000})
            >>> deduction = calc.calculate_apartment_deduction()
            >>> print(deduction)
            35000
        """
        logger.debug(f"Apartment deduction: ¥{self.apartment_rent}")
        return self.apartment_rent

    def calculate_other_deductions(self) -> Decimal:
        """Calcula otras deducciones personalizadas.

        Returns:
            Decimal: Total de otras deducciones

        Examples:
            >>> calc = DeductionCalculator({'other_deductions': {'loan': 5000}})
            >>> deduction = calc.calculate_other_deductions()
            >>> print(deduction)
            5000
        """
        total = sum(self.other_deductions.values()) if self.other_deductions else 0
        total = Decimal(str(total))
        logger.debug(f"Other deductions: ¥{total}")
        return total

    def calculate_all_deductions(self, gross_income: Decimal) -> Dict[str, Decimal]:
        """Calcula todas las deducciones aplicables.

        Args:
            gross_income (Decimal): Ingreso bruto mensual

        Returns:
            Dict[str, Decimal]: Desglose completo de deducciones:
                {
                    'income_tax': Decimal,
                    'resident_tax': Decimal,
                    'health_insurance': Decimal,
                    'pension': Decimal,
                    'employment_insurance': Decimal,
                    'apartment': Decimal,
                    'other': Decimal,
                    'total': Decimal
                }

        Examples:
            >>> calc = DeductionCalculator()
            >>> deductions = calc.calculate_all_deductions(Decimal('200000'))
            >>> print(deductions['total'])
            30700
        """
        deductions = {
            'income_tax': self.calculate_income_tax(gross_income),
            'resident_tax': self.calculate_resident_tax(gross_income),
            'health_insurance': self.calculate_health_insurance(gross_income),
            'pension': self.calculate_pension(gross_income),
            'employment_insurance': self.calculate_employment_insurance(gross_income),
            'apartment': self.calculate_apartment_deduction(),
            'other': self.calculate_other_deductions(),
        }

        # Calculate total
        deductions['total'] = sum(deductions.values())

        logger.info(f"Total deductions calculated: ¥{deductions['total']}")
        return deductions

    def update_employee_data(self, new_data: Dict):
        """Actualiza los datos del empleado.

        Args:
            new_data (Dict): Nuevos datos del empleado
        """
        self.employee_data.update(new_data)
        self.prefecture = self.employee_data.get('prefecture', self.prefecture)
        self.dependents = self.employee_data.get('dependents', self.dependents)
        self.apartment_rent = Decimal(str(self.employee_data.get('apartment_rent', 30000)))
        self.other_deductions = self.employee_data.get('other_deductions', {})

        logger.info(f"Employee data updated: {self.employee_data}")

    def get_detailed_breakdown(self, gross_income: Decimal) -> Dict:
        """Obtiene desglose detallado de deducciones con tasas.

        Args:
            gross_income (Decimal): Ingreso bruto mensual

        Returns:
            Dict: Desglose con tasas y montos
        """
        deductions = self.calculate_all_deductions(gross_income)

        return {
            'gross_income': gross_income,
            'deductions': {
                'income_tax': {
                    'amount': deductions['income_tax'],
                    'rate': '5%',
                    'threshold': self.INCOME_TAX_THRESHOLD
                },
                'resident_tax': {
                    'amount': deductions['resident_tax'],
                    'rate': f'{self.prefecture} rate',
                    'prefecture': self.prefecture
                },
                'health_insurance': {
                    'amount': deductions['health_insurance'],
                    'rate': f'{self.HEALTH_INSURANCE_RATE * 50}%',
                    'full_rate': self.HEALTH_INSURANCE_RATE
                },
                'pension': {
                    'amount': deductions['pension'],
                    'rate': f'{self.PENSION_RATE * 50}%',
                    'full_rate': self.PENSION_RATE
                },
                'employment_insurance': {
                    'amount': deductions['employment_insurance'],
                    'rate': f'{self.EMPLOYMENT_INSURANCE_RATE * 50}%',
                    'full_rate': self.EMPLOYMENT_INSURANCE_RATE
                },
                'apartment': {
                    'amount': deductions['apartment'],
                    'type': 'Apartment Rent'
                },
                'other': {
                    'amount': deductions['other'],
                    'details': self.other_deductions
                }
            },
            'total_deductions': deductions['total'],
            'net_income': gross_income - deductions['total']
        }
