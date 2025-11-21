"""
Script para listar fábricas y cuántos empleados tienen
Ejecutar: docker exec uns-claudejp-backend python /app/scripts/list_factories_with_employees.py
"""

from app.core.database import SessionLocal
from app.models.models import Factory, Employee
from sqlalchemy import func

def list_factories_with_employees():
    """Lista todas las fábricas con su conteo de empleados"""
    db = SessionLocal()

    try:
        # Query con JOIN para contar empleados por fábrica
        results = db.query(
            Factory.factory_id,
            Factory.name,
            func.count(Employee.id).label('employee_count')
        ).outerjoin(
            Employee, Factory.factory_id == Employee.factory_id
        ).group_by(
            Factory.factory_id, Factory.name
        ).order_by(
            Factory.factory_id
        ).all()

        print('=' * 100)
        print('FÁBRICAS Y EMPLEADOS')
        print('=' * 100)
        print(f'{"ID":<15} | {"Empleados":<10} | {"Nombre"}')
        print('-' * 100)

        total_factories = 0
        factories_with_employees = 0
        factories_without_name = 0

        for factory_id, name, employee_count in results:
            total_factories += 1

            if employee_count > 0:
                factories_with_employees += 1

            # Marcar fábricas sin nombre
            if not name or name == '-':
                factories_without_name += 1
                name_display = '❌ [SIN NOMBRE]'
            else:
                name_display = name

            # Destacar fábricas con empleados
            if employee_count > 0:
                print(f'{factory_id:<15} | {employee_count:<10} | {name_display}')

        print('-' * 100)
        print(f'\n📊 RESUMEN:')
        print(f'  Total de fábricas: {total_factories}')
        print(f'  Fábricas con empleados: {factories_with_employees}')
        print(f'  Fábricas sin nombre: {factories_without_name}')

        # Listar solo las fábricas SIN NOMBRE que tienen empleados
        print(f'\n⚠️  FÁBRICAS SIN NOMBRE CON EMPLEADOS:')
        print('-' * 100)

        for factory_id, name, employee_count in results:
            if (not name or name == '-') and employee_count > 0:
                print(f'  {factory_id}: {employee_count} empleados')

    except Exception as e:
        print(f'❌ Error: {str(e)}')
        raise
    finally:
        db.close()


if __name__ == '__main__':
    list_factories_with_employees()
