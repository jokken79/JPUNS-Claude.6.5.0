"""
Rent Calculation Service
Fórmulas japonesas para cálculo de renta prorrateada
"""
from datetime import date, datetime
from typing import Dict, Optional
import calendar

class RentCalculationService:
    """
    Servicio para cálculos de renta en corporate housing japonés
    """
    
    def calculate_prorated_rent(
        self,
        move_in_date: date,
        move_out_date: Optional[date],
        monthly_rent: int,
        deposit_months: int = 2,
        key_money_months: int = 0,  # 0 para corporate housing
        cleaning_fee: int = 15000
    ) -> Dict:
        """
        Calcular renta prorrateada para move-in/move-out
        
        Fórmulas japonesas estándar:
        - Daily Rate = Monthly Rent / Days in Month
        - Prorated Amount = Daily Rate × Occupied Days
        """
        # Calcular prorrateo
        if move_out_date:
            total_prorated = self._calculate_multi_month_prorated(
                move_in_date, move_out_date, monthly_rent
            )
        else:
            total_prorated = self._calculate_single_month_prorated(
                move_in_date, monthly_rent
            )
        
        # Calcular depósitos y fees
        deposit_amount = monthly_rent * deposit_months
        key_money_amount = monthly_rent * key_money_months
        advance_rent = monthly_rent
        
        return {
            "period": {
                "move_in_date": move_in_date.isoformat(),
                "move_out_date": move_out_date.isoformat() if move_out_date else None
            },
            "base_rent": {
                "monthly_rent": monthly_rent,
                "prorated_amount": total_prorated,
                "daily_rate": round(monthly_rent / 30.42, 2)  # 30.42 = días promedio
            },
            "upfront_costs": {
                "deposit": deposit_amount,
                "key_money": key_money_amount,
                "advance_rent": advance_rent,
                "cleaning_fee": cleaning_fee,
                "total_upfront": deposit_amount + key_money_amount + advance_rent + cleaning_fee
            },
            "company_contribution": {
                "deposit": deposit_amount,
                "key_money": key_money_amount
            },
            "employee_cost": {
                "prorated_rent": total_prorated,
                "advance_rent": advance_rent,
                "total_first_month": total_prorated + advance_rent
            }
        }
    
    def _calculate_single_month_prorated(self, move_in_date: date, monthly_rent: int) -> int:
        """Calcular prorrateo para un mes"""
        days_in_month = calendar.monthrange(move_in_date.year, move_in_date.month)[1]
        daily_rate = monthly_rent / days_in_month
        
        if move_in_date.day == 1:
            return 0
        
        occupied_days = days_in_month - move_in_date.day + 1
        prorated_amount = int(daily_rate * occupied_days)
        
        return prorated_amount
    
    def _calculate_multi_month_prorated(
        self,
        move_in_date: date,
        move_out_date: date,
        monthly_rent: int
    ) -> int:
        """Calcular prorrateo para período multi-mes"""
        total = 0
        
        # Primer mes (prorrateado)
        if move_in_date.day != 1:
            first_month = self._calculate_single_month_prorated(move_in_date, monthly_rent)
            total += first_month
        
        # Último mes (prorrateado)
        if move_out_date.day != calendar.monthrange(
            move_out_date.year, move_out_date.month
        )[1]:
            last_month_days = move_out_date.day
            last_month_rate = monthly_rent / 30.42
            last_month = int(last_month_rate * last_month_days)
            total += last_month
        
        # Meses completos en el medio
        current = move_in_date.replace(
            day=1,
            month=move_in_date.month + 1
        ) if move_in_date.day == 1 else move_in_date.replace(
            day=1,
            month=move_in_date.month + 1
        )
        
        while current < move_out_date.replace(day=1):
            if current.month != move_out_date.month or current.year != move_out_date.year:
                total += monthly_rent
            current = current.replace(month=current.month + 1)
        
        return total
    
    def calculate_employee_deduction(
        self,
        employee_id: int,
        pay_period_start: date,
        pay_period_end: date,
        apartment_rent: int
    ) -> Dict:
        """
        Calcular deducción de renta para payroll
        """
        is_partial = self._is_partial_period(pay_period_start, pay_period_end)
        
        if is_partial:
            deduction = self._calculate_prorated_deduction(
                pay_period_start, pay_period_end, apartment_rent
            )
        else:
            deduction = apartment_rent
        
        return {
            "employee_id": employee_id,
            "pay_period": {
                "start": pay_period_start.isoformat(),
                "end": pay_period_end.isoformat()
            },
            "deduction_amount": deduction,
            "deduction_type": "prorated" if is_partial else "full",
            "is_partial_period": is_partial
        }
    
    def _is_partial_period(self, start: date, end: date) -> bool:
        """Verificar si período es parcial"""
        first_day = start.replace(day=1)
        last_day = start.replace(day=calendar.monthrange(start.year, start.month)[1])
        
        return start > first_day or end < last_day
    
    def _calculate_prorated_deduction(
        self,
        start: date,
        end: date,
        monthly_rent: int
    ) -> int:
        """Calcular deducción prorrateada"""
        days_in_month = calendar.monthrange(start.year, start.month)[1]
        daily_rate = monthly_rent / days_in_month
        days_in_period = (end - start).days + 1
        
        return int(daily_rate * days_in_period)
    
    def calculate_housing_allowance(
        self,
        employee_salary: int,
        apartment_rent: int,
        subsidy_percentage: float = 0.5
    ) -> Dict:
        """
        Calcular allowance de housing de la empresa
        """
        max_subsidy = apartment_rent * subsidy_percentage
        employee_share = apartment_rent - max_subsidy
        
        return {
            "monthly_rent": apartment_rent,
            "employee_share": max(0, employee_share),
            "company_subsidy": max_subsidy,
            "subsidy_percentage": subsidy_percentage,
            "employee_monthly_cost": max(0, employee_share)
        }

# Ejemplo de uso
if __name__ == "__main__":
    service = RentCalculationService()
    
    # Ejemplo 1: Move-in 15 del mes
    result = service.calculate_prorated_rent(
        move_in_date=date(2025, 11, 15),
        move_out_date=None,
        monthly_rent=85000
    )
    
    print("Ejemplo 1: Move-in Mid-Month")
    print(f"Renta Prorrateada: ¥{result['base_rent']['prorated_amount']:,}")
    print(f"Daily Rate: ¥{result['base_rent']['daily_rate']}")
    print(f"Total Primer Mes: ¥{result['employee_cost']['total_first_month']:,}")
    print()
    
    # Ejemplo 2: Payroll deduction
    payroll = service.calculate_employee_deduction(
        employee_id=1,
        pay_period_start=date(2025, 11, 1),
        pay_period_end=date(2025, 11, 30),
        apartment_rent=85000
    )
    
    print("Ejemplo 2: Payroll Deduction")
    print(f"Monto Deducción: ¥{payroll['deduction_amount']:,}")
    print(f"Tipo: {payroll['deduction_type']}")
