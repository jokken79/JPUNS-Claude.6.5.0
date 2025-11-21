"""
Script para calcular yukyus de todos los empleados
Workaround para el bug del endpoint /api/yukyu/balances/calculate
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.core.database import engine
from app.models.models import Employee, YukyuBalance, YukyuStatus
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta

def calculate_yukyu_entitlement(hire_date: date, calculation_date: date):
    """
    Calcular días de yukyu según la ley japonesa

    Reglas:
    - 6 meses: 10 días
    - 1.5 años: 11 días
    - 2.5 años: 12 días
    - 3.5 años: 14 días
    - 4.5 años: 16 días
    - 5.5 años: 18 días
    - 6.5+ años: 20 días
    """
    delta = relativedelta(calculation_date, hire_date)
    months = delta.years * 12 + delta.months

    if months < 6:
        return 0, 0
    elif months < 18:
        return 6, 10
    elif months < 30:
        return 18, 11
    elif months < 42:
        return 30, 12
    elif months < 54:
        return 42, 14
    elif months < 66:
        return 54, 16
    elif months < 78:
        return 66, 18
    else:
        return 78, 20

def get_assignment_date(hire_date: date, months: int) -> date:
    """Calcular fecha de asignación basada en meses trabajados"""
    return hire_date + relativedelta(months=months)

def calculate_employee_yukyus(db: Session, employee_id: int, calculation_date: date = None):
    """Calcular yukyus para un empleado específico"""
    if calculation_date is None:
        calculation_date = date.today()

    # Get employee
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        print(f"❌ Empleado {employee_id} no encontrado")
        return False

    if not employee.hire_date:
        print(f"❌ Empleado {employee_id} ({employee.full_name_kanji}) no tiene hire_date")
        return False

    # Calculate months worked
    delta = relativedelta(calculation_date, employee.hire_date)
    months_worked = delta.years * 12 + delta.months

    if months_worked < 6:
        print(f"⏳ Empleado {employee_id} ({employee.full_name_kanji}) - Solo {months_worked} meses, necesita 6 meses")
        return False

    # Get existing balances
    existing_balances = db.query(YukyuBalance).filter(
        YukyuBalance.employee_id == employee_id
    ).all()
    existing_months = {b.months_worked for b in existing_balances}

    # Milestones
    milestones = [6, 18, 30, 42, 54, 66, 78, 90, 102, 114, 126]
    balances_created = 0

    for milestone in milestones:
        if milestone > months_worked:
            break

        if milestone in existing_months:
            continue

        # Calculate days for this milestone
        _, days = calculate_yukyu_entitlement(employee.hire_date,
                                             get_assignment_date(employee.hire_date, milestone))

        # Get carryover from previous balance
        carryover = 0
        if milestone > 6:
            prev_balance = db.query(YukyuBalance).filter(
                YukyuBalance.employee_id == employee_id,
                YukyuBalance.months_worked == milestone - 12
            ).first()

            if prev_balance:
                carryover = prev_balance.days_remaining

        # Create balance
        assigned_date = get_assignment_date(employee.hire_date, milestone)
        expires_on = assigned_date + relativedelta(years=2)
        fiscal_year = assigned_date.year

        balance = YukyuBalance(
            employee_id=employee_id,
            fiscal_year=fiscal_year,
            assigned_date=assigned_date,
            months_worked=milestone,
            days_assigned=days,
            days_carried_over=carryover,
            days_total=days + carryover,
            days_used=0,
            days_remaining=days + carryover,
            days_expired=0,
            days_available=days + carryover,
            expires_on=expires_on,
            status=YukyuStatus.ACTIVE,
        )

        db.add(balance)
        balances_created += 1

    db.commit()

    # Calculate total available
    total_available = db.query(YukyuBalance).filter(
        YukyuBalance.employee_id == employee_id,
        YukyuBalance.status == YukyuStatus.ACTIVE
    ).count()

    print(f"✅ Empleado {employee_id} ({employee.full_name_kanji}): {balances_created} balances creados, {total_available} días disponibles")
    return True

def calculate_all_employees(limit: int = None):
    """Calcular yukyus para todos los empleados activos"""
    db = Session(engine)

    try:
        query = db.query(Employee).filter(
            Employee.deleted_at.is_(None),
            Employee.hire_date.isnot(None)
        )

        if limit:
            query = query.limit(limit)

        employees = query.all()

        print(f"\n📊 Calculando yukyus para {len(employees)} empleados...")
        print("=" * 80)

        success_count = 0
        skip_count = 0
        error_count = 0

        for emp in employees:
            try:
                if calculate_employee_yukyus(db, emp.id):
                    success_count += 1
                else:
                    skip_count += 1
            except Exception as e:
                print(f"❌ Error en empleado {emp.id}: {str(e)}")
                error_count += 1
                db.rollback()

        print("=" * 80)
        print(f"\n📈 Resumen:")
        print(f"   ✅ Exitosos: {success_count}")
        print(f"   ⏭️  Omitidos: {skip_count}")
        print(f"   ❌ Errores: {error_count}")
        print(f"   📊 Total: {len(employees)}")

    finally:
        db.close()

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Calcular yukyus para empleados')
    parser.add_argument('--employee-id', type=int, help='ID del empleado específico')
    parser.add_argument('--limit', type=int, help='Limitar número de empleados')
    parser.add_argument('--all', action='store_true', help='Calcular para todos los empleados')

    args = parser.parse_args()

    if args.employee_id:
        # Calcular para un empleado específico
        db = Session(engine)
        try:
            calculate_employee_yukyus(db, args.employee_id)
        finally:
            db.close()
    elif args.all or args.limit:
        # Calcular para todos (o con límite)
        calculate_all_employees(limit=args.limit)
    else:
        print("Uso:")
        print("  python calculate_all_yukyus.py --employee-id 15")
        print("  python calculate_all_yukyus.py --limit 10")
        print("  python calculate_all_yukyus.py --all")
