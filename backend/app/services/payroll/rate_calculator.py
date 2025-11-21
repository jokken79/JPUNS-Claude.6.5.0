"""
Rate Calculator - Payroll System
Calculadora de tarifas por hora para empleados
"""
from decimal import Decimal
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class RateCalculator:
    """Calculadora de tarifas por hora para empleados.

    Maneja diferentes tipos de tarifas:
    - Tarifa base (base_rate)
    - Tarifa de horas extras (overtime_rate)
    - Tarifa nocturna (night_shift_rate)
    - Tarifa de días festivos (holiday_rate)
    - Tarifa de domingos (sunday_rate)

    Aplica los multiplicadores definidos en payroll_settings
    """

    def __init__(self, payroll_settings: Optional[Dict] = None):
        """Inicializa el calculador de tarifas.

        Args:
            payroll_settings (Dict): Configuración de payroll con tasas:
                - overtime_rate (Decimal): Factor para horas extras (default 1.25)
                - night_shift_rate (Decimal): Factor para turnos nocturnos (default 1.25)
                - holiday_rate (Decimal): Factor para festivos (default 1.35)
                - sunday_rate (Decimal): Factor para domingos (default 1.35)
        """
        self.settings = payroll_settings or {
            'overtime_rate': Decimal('1.25'),
            'night_shift_rate': Decimal('1.25'),
            'holiday_rate': Decimal('1.35'),
            'sunday_rate': Decimal('1.35'),
        }
        logger.info(f"RateCalculator initialized with settings: {self.settings}")

    def calculate_base_rate(self, employee_data: Dict) -> Decimal:
        """Calcula la tarifa base del empleado.

        Args:
            employee_data (Dict): Datos del empleado con tarifa configurada

        Returns:
            Decimal: Tarifa base por hora en JPY

        Examples:
            >>> employee = {'base_hourly_rate': 1200}
            >>> rate = calculator.calculate_base_rate(employee)
            >>> print(rate)
            1200
        """
        base_rate = Decimal(str(employee_data.get('base_hourly_rate', 1200)))
        logger.debug(f"Base rate calculated: {base_rate} JPY/hour")
        return base_rate

    def calculate_overtime_rate(self, base_rate: Decimal) -> Decimal:
        """Calcula la tarifa de horas extras.

        Args:
            base_rate (Decimal): Tarifa base por hora

        Returns:
            Decimal: Tarifa de horas extras (base * overtime_rate)

        Examples:
            >>> base_rate = Decimal('1200')
            >>> overtime_rate = calculator.calculate_overtime_rate(base_rate)
            >>> print(overtime_rate)
            1500  # 1200 * 1.25
        """
        overtime_rate = base_rate * Decimal(str(self.settings['overtime_rate']))
        logger.debug(f"Overtime rate calculated: {overtime_rate} JPY/hour")
        return overtime_rate

    def calculate_night_shift_rate(self, base_rate: Decimal) -> Decimal:
        """Calcula la tarifa de turno nocturno.

        Args:
            base_rate (Decimal): Tarifa base por hora

        Returns:
            Decimal: Tarifa de turno nocturno

        Examples:
            >>> base_rate = Decimal('1200')
            >>> night_rate = calculator.calculate_night_shift_rate(base_rate)
            >>> print(night_rate)
            1500  # 1200 * 1.25
        """
        night_rate = base_rate * Decimal(str(self.settings['night_shift_rate']))
        logger.debug(f"Night shift rate calculated: {night_rate} JPY/hour")
        return night_rate

    def calculate_holiday_rate(self, base_rate: Decimal) -> Decimal:
        """Calcula la tarifa de días festivos.

        Args:
            base_rate (Decimal): Tarifa base por hora

        Returns:
            Decimal: Tarifa de días festivos

        Examples:
            >>> base_rate = Decimal('1200')
            >>> holiday_rate = calculator.calculate_holiday_rate(base_rate)
            >>> print(holiday_rate)
            1620  # 1200 * 1.35
        """
        holiday_rate = base_rate * Decimal(str(self.settings['holiday_rate']))
        logger.debug(f"Holiday rate calculated: {holiday_rate} JPY/hour")
        return holiday_rate

    def calculate_sunday_rate(self, base_rate: Decimal) -> Decimal:
        """Calcula la tarifa de domingos.

        Args:
            base_rate (Decimal): Tarifa base por hora

        Returns:
            Decimal: Tarifa de domingos

        Examples:
            >>> base_rate = Decimal('1200')
            >>> sunday_rate = calculator.calculate_sunday_rate(base_rate)
            >>> print(sunday_rate)
            1620  # 1200 * 1.35
        """
        sunday_rate = base_rate * Decimal(str(self.settings['sunday_rate']))
        logger.debug(f"Sunday rate calculated: {sunday_rate} JPY/hour")
        return sunday_rate

    def calculate_all_rates(self, employee_data: Dict) -> Dict[str, Decimal]:
        """Calcula todas las tarifas para un empleado.

        Args:
            employee_data (Dict): Datos del empleado

        Returns:
            Dict[str, Decimal]: Diccionario con todas las tarifas:
                - base_rate
                - overtime_rate
                - night_shift_rate
                - holiday_rate
                - sunday_rate

        Examples:
            >>> employee = {'base_hourly_rate': 1200}
            >>> rates = calculator.calculate_all_rates(employee)
            >>> print(rates)
            {
                'base_rate': Decimal('1200'),
                'overtime_rate': Decimal('1500'),
                'night_shift_rate': Decimal('1500'),
                'holiday_rate': Decimal('1620'),
                'sunday_rate': Decimal('1620')
            }
        """
        base_rate = self.calculate_base_rate(employee_data)
        return {
            'base_rate': base_rate,
            'overtime_rate': self.calculate_overtime_rate(base_rate),
            'night_shift_rate': self.calculate_night_shift_rate(base_rate),
            'holiday_rate': self.calculate_holiday_rate(base_rate),
            'sunday_rate': self.calculate_sunday_rate(base_rate),
        }

    def update_settings(self, new_settings: Dict):
        """Actualiza la configuración de tasas.

        Args:
            new_settings (Dict): Nuevas configuraciones
        """
        self.settings.update(new_settings)
        logger.info(f"Updated RateCalculator settings: {self.settings}")
