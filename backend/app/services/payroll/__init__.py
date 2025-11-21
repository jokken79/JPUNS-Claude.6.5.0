"""
Payroll Services Module - UNS-ClaudeJP 5.2
Sistema modular de cálculo de salarios y nómina

Módulos:
- PayrollService: Servicio principal orquestador
- RateCalculator: Cálculo de tarifas por hora
- OvertimeCalculator: Cálculo de horas extras
- DeductionCalculator: Cálculo de deducciones
- PayslipGenerator: Generación de payslips en PDF
- PayrollValidator: Validación de reglas de negocio
"""

from .payroll_service import PayrollService
from .rate_calculator import RateCalculator
from .overtime_calculator import OvertimeCalculator
from .deduction_calculator import DeductionCalculator
from .payslip_generator import PayslipGenerator
from .payroll_validator import PayrollValidator

__all__ = [
    "PayrollService",
    "RateCalculator",
    "OvertimeCalculator",
    "DeductionCalculator",
    "PayslipGenerator",
    "PayrollValidator",
]
