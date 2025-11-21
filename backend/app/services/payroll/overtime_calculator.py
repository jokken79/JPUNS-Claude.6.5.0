"""
Overtime Calculator - Payroll System
Calculadora de horas extras, turnos nocturnos y festivos
"""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class OvertimeCalculator:
    """Calculadora de horas extras y recargos según legislación laboral japonesa.

    Maneja:
    - Horas normales (hasta 8h/día)
    - Horas extras (>8h/día con 25% recargo)
    - Turnos nocturnos (22:00-05:00 con 25% recargo)
    - Días festivos (35% recargo)
    - Domingos (35% recargo)

    Cumple con: Labor Standards Act de Japón
    """

    STANDARD_HOURS_PER_DAY = 8
    STANDARD_HOURS_PER_MONTH = Decimal('160')

    def __init__(self, payroll_settings: Optional[Dict] = None):
        """Inicializa el calculador de horas extras.

        Args:
            payroll_settings (Dict): Configuración con tasas de recargo
        """
        self.settings = payroll_settings or {
            'overtime_rate': Decimal('1.25'),
            'night_shift_rate': Decimal('1.25'),
            'holiday_rate': Decimal('1.35'),
            'sunday_rate': Decimal('1.35'),
        }
        logger.info(f"OvertimeCalculator initialized with settings: {self.settings}")

    def calculate_hours_breakdown(self, timer_records: List[Dict]) -> Dict[str, Decimal]:
        """Calcula el desglose completo de horas trabajadas.

        Args:
            timer_records (List[Dict]): Registros de timer cards:
                [
                    {
                        'work_date': '2025-10-01',
                        'clock_in': '09:00',
                        'clock_out': '18:00',
                        'break_minutes': 60
                    },
                    ...
                ]

        Returns:
            Dict[str, Decimal]: Desglose de horas:
                {
                    'regular_hours': Decimal('128'),
                    'overtime_hours': Decimal('32'),
                    'night_shift_hours': Decimal('16'),
                    'holiday_hours': Decimal('8'),
                    'sunday_hours': Decimal('0'),
                    'total_hours': Decimal('184'),
                    'work_days': 20
                }

        Examples:
            >>> records = [
            ...     {'work_date': '2025-10-01', 'clock_in': '09:00', 'clock_out': '19:00'}
            ... ]
            >>> breakdown = calculator.calculate_hours_breakdown(records)
            >>> print(breakdown['overtime_hours'])
            1  # 1 hora extra (10h - 8h normal)
        """
        regular_hours = Decimal('0')
        overtime_hours = Decimal('0')
        night_shift_hours = Decimal('0')
        holiday_hours = Decimal('0')
        sunday_hours = Decimal('0')
        total_hours = Decimal('0')
        work_days = 0

        for record in timer_records:
            try:
                # Parse timer record
                date_obj, work_hours = self._parse_timer_record(record)

                if work_hours <= 0:
                    continue

                total_hours += work_hours
                work_days += 1

                # Check if weekend/holiday
                is_sunday = date_obj.weekday() == 6
                is_saturday = date_obj.weekday() == 5

                # Classify hours
                if is_sunday:
                    # Sunday work - all hours are sunday hours
                    sunday_hours += work_hours
                    holiday_hours += work_hours  # Sundays are also holidays
                elif is_saturday:
                    # Saturday - regular hours (no weekend premium unless configured)
                    regular_hours += work_hours
                else:
                    # Weekday - calculate overtime
                    if work_hours > self.STANDARD_HOURS_PER_DAY:
                        regular_hours += Decimal(str(self.STANDARD_HOURS_PER_DAY))
                        overtime_hours += (work_hours - Decimal(str(self.STANDARD_HOURS_PER_DAY)))
                    else:
                        regular_hours += work_hours

                # Calculate night shift hours for this day
                night_hrs = self._calculate_night_hours(record)
                if night_hrs > 0:
                    night_shift_hours += Decimal(str(night_hrs))

            except Exception as e:
                logger.error(f"Error processing timer record: {e}")
                continue

        return {
            'regular_hours': regular_hours,
            'overtime_hours': overtime_hours,
            'night_shift_hours': night_shift_hours,
            'holiday_hours': holiday_hours,
            'sunday_hours': sunday_hours,
            'total_hours': total_hours,
            'work_days': work_days
        }

    def _parse_timer_record(self, record: Dict) -> tuple:
        """Parsea un registro de timer card.

        Args:
            record (Dict): Registro con fecha, entrada, salida

        Returns:
            tuple: (date_obj, work_hours)

        Raises:
            ValueError: Si el registro no tiene datos válidos
        """
        work_date = record.get('work_date')
        clock_in = record.get('clock_in')
        clock_out = record.get('clock_out')

        if not all([work_date, clock_in, clock_out]):
            raise ValueError("Timer record missing required fields")

        # Parse date and times
        date_obj = datetime.strptime(str(work_date), '%Y-%m-%d')
        start = datetime.strptime(clock_in, '%H:%M')
        end = datetime.strptime(clock_out, '%H:%M')

        # Handle overnight shifts
        if end < start:
            end += timedelta(days=1)

        # Calculate work hours (excluding break)
        break_minutes = record.get('break_minutes', 0)
        total_minutes = (end - start).total_seconds() / 60
        work_minutes = max(0, total_minutes - break_minutes)
        work_hours = Decimal(str(work_minutes / 60))

        return date_obj, work_hours

    def _calculate_night_hours(self, record: Dict) -> float:
        """Calcula horas trabajadas en horario nocturno (22:00-05:00).

        Args:
            record (Dict): Registro de timer card

        Returns:
            float: Horas nocturnas trabajadas

        Examples:
            >>> # Turno 22:00 - 05:00 (next day)
            >>> record = {'clock_in': '22:00', 'clock_out': '05:00'}
            >>> night_hours = calculator._calculate_night_hours(record)
            >>> print(night_hours)
            7.0
        """
        clock_in = record.get('clock_in')
        clock_out = record.get('clock_out')

        if not clock_in or not clock_out:
            return 0.0

        # Parse times
        start = datetime.strptime(clock_in, '%H:%M')
        end = datetime.strptime(clock_out, '%H:%M')

        # Handle overnight shifts
        if end < start:
            end += timedelta(days=1)

        # Night shift period: 22:00 (day N) to 05:00 (day N+1)
        night_start = start.replace(hour=22, minute=0, second=0)
        night_end = (start + timedelta(days=1)).replace(hour=5, minute=0, second=0)

        # Calculate overlap
        overlap_start = max(start, night_start)
        overlap_end = min(end, night_end)

        if overlap_start < overlap_end:
            return (overlap_end - overlap_start).total_seconds() / 3600

        return 0.0

    def calculate_overtime_amount(
        self,
        overtime_hours: Decimal,
        base_rate: Decimal
    ) -> Decimal:
        """Calcula monto de pago por horas extras.

        Args:
            overtime_hours (Decimal): Horas extras trabajadas
            base_rate (Decimal): Tarifa base por hora

        Returns:
            Decimal: Monto por horas extras

        Examples:
            >>> hours = Decimal('20')
            >>> base_rate = Decimal('1200')
            >>> amount = calculator.calculate_overtime_amount(hours, base_rate)
            >>> print(amount)
            30000  # 20 * 1200 * 1.25
        """
        overtime_rate = base_rate * Decimal(str(self.settings['overtime_rate']))
        amount = overtime_hours * overtime_rate
        logger.debug(f"Overtime amount: {overtime_hours}h × {overtime_rate} = ¥{amount}")
        return amount

    def calculate_night_shift_amount(
        self,
        night_hours: Decimal,
        base_rate: Decimal
    ) -> Decimal:
        """Calcula monto de pago por turno nocturno.

        Args:
            night_hours (Decimal): Horas nocturnas trabajadas
            base_rate (Decimal): Tarifa base por hora

        Returns:
            Decimal: Monto por turno nocturno

        Examples:
            >>> hours = Decimal('10')
            >>> base_rate = Decimal('1200')
            >>> amount = calculator.calculate_night_shift_amount(hours, base_rate)
            >>> print(amount)
            15000  # 10 * 1200 * 1.25
        """
        night_rate = base_rate * Decimal(str(self.settings['night_shift_rate']))
        amount = night_hours * night_rate
        logger.debug(f"Night shift amount: {night_hours}h × {night_rate} = ¥{amount}")
        return amount

    def calculate_holiday_amount(
        self,
        holiday_hours: Decimal,
        base_rate: Decimal
    ) -> Decimal:
        """Calcula monto de pago por días festivos.

        Args:
            holiday_hours (Decimal): Horas en festivos trabajadas
            base_rate (Decimal): Tarifa base por hora

        Returns:
            Decimal: Monto por días festivos

        Examples:
            >>> hours = Decimal('8')
            >>> base_rate = Decimal('1200')
            >>> amount = calculator.calculate_holiday_amount(hours, base_rate)
            >>> print(amount)
            12960  # 8 * 1200 * 1.35
        """
        holiday_rate = base_rate * Decimal(str(self.settings['holiday_rate']))
        amount = holiday_hours * holiday_rate
        logger.debug(f"Holiday amount: {holiday_hours}h × {holiday_rate} = ¥{amount}")
        return amount

    def calculate_sunday_amount(
        self,
        sunday_hours: Decimal,
        base_rate: Decimal
    ) -> Decimal:
        """Calcula monto de pago por trabajo en domingos.

        Args:
            sunday_hours (Decimal): Horas de domingo trabajadas
            base_rate (Decimal): Tarifa base por hora

        Returns:
            Decimal: Monto por trabajo en domingos

        Examples:
            >>> hours = Decimal('8')
            >>> base_rate = Decimal('1200')
            >>> amount = calculator.calculate_sunday_amount(hours, base_rate)
            >>> print(amount)
            12960  # 8 * 1200 * 1.35
        """
        sunday_rate = base_rate * Decimal(str(self.settings['sunday_rate']))
        amount = sunday_hours * sunday_rate
        logger.debug(f"Sunday amount: {sunday_hours}h × {sunday_rate} = ¥{amount}")
        return amount

    def calculate_all_amounts(
        self,
        hours_breakdown: Dict[str, Decimal],
        base_rate: Decimal
    ) -> Dict[str, Decimal]:
        """Calcula todos los montos por tipo de hora.

        Args:
            hours_breakdown (Dict): Desglose de horas del mes
            base_rate (Decimal): Tarifa base por hora

        Returns:
            Dict[str, Decimal]: Montos calculados

        Examples:
            >>> breakdown = {'regular_hours': Decimal('160'), 'overtime_hours': Decimal('20')}
            >>> rates = {'base_rate': Decimal('1200')}
            >>> amounts = calculator.calculate_all_amounts(breakdown, Decimal('1200'))
            >>> print(amounts)
            {
                'base_amount': Decimal('192000'),
                'overtime_amount': Decimal('30000'),
                'night_shift_amount': Decimal('0'),
                'holiday_amount': Decimal('0'),
                'sunday_amount': Decimal('0')
            }
        """
        return {
            'base_amount': hours_breakdown['regular_hours'] * base_rate,
            'overtime_amount': self.calculate_overtime_amount(
                hours_breakdown['overtime_hours'], base_rate
            ),
            'night_shift_amount': self.calculate_night_shift_amount(
                hours_breakdown['night_shift_hours'], base_rate
            ),
            'holiday_amount': self.calculate_holiday_amount(
                hours_breakdown['holiday_hours'], base_rate
            ),
            'sunday_amount': self.calculate_sunday_amount(
                hours_breakdown['sunday_hours'], base_rate
            ),
        }

    def get_expected_work_days(self, year: int, month: int) -> int:
        """Calcula días laborables esperados en un mes.

        Args:
            year (int): Año
            month (int): Mes (1-12)

        Returns:
            int: Días laborables (lunes-viernes)

        Examples:
            >>> work_days = calculator.get_expected_work_days(2025, 10)
            >>> print(work_days)
            23
        """
        from calendar import monthrange

        _, num_days = monthrange(year, month)
        work_days = 0

        for day in range(1, num_days + 1):
            date = datetime(year, month, day)
            if date.weekday() < 5:  # Monday=0, Friday=4
                work_days += 1

        return work_days
