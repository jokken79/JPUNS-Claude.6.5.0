"""
Calcular yukyus directamente sin pasar por el API
(workaround para el error 'unhashable type: list')
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from datetime import date
from app.services.yukyu_service import YukyuService
from app.core.config import settings

def calculate_yukyu_for_employee(employee_id: int):
    """Calcular yukyu para un empleado específico"""

    # Create engine and session
    engine = create_engine(settings.DATABASE_URL)
    db = Session(engine)

    try:
        # Create service
        service = YukyuService(db)

        # Calculate
        print(f"\n🔄 Calculando yukyus para empleado ID: {employee_id}...")

        # Use asyncio to run the async function
        import asyncio
        result = asyncio.run(service.calculate_and_create_balances(
            employee_id=employee_id,
            calculation_date=date.today()
        ))

        print(f"\n✅ RESULTADO:")
        print(f"   Employee ID: {result.employee_id}")
        print(f"   Employee Name: {result.employee_name}")
        print(f"   Hire Date: {result.hire_date}")
        print(f"   Months Since Hire: {result.months_since_hire}")
        print(f"   Yukyus Created: {result.yukyus_created}")
        print(f"   Total Available Days: {result.total_available_days}")
        print(f"   Message: {result.message}")

        db.commit()

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()
        engine.dispose()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python calculate_yukyu_direct.py <employee_id>")
        print("Ejemplo: python calculate_yukyu_direct.py 19")
        sys.exit(1)

    employee_id = int(sys.argv[1])
    calculate_yukyu_for_employee(employee_id)
