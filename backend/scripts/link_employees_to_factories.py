"""
Link Employees to Factories from Excel
=======================================
This script:
1. Imports missing factories from employee_master.xlsm
2. Links employees to factories based on Excel "派遣先" column
3. Populates apartment_factory relationships
"""
import sys
from pathlib import Path
sys.path.insert(0, '/app')

import pandas as pd
from app.core.database import SessionLocal
from app.models.models import Employee, Factory, Apartment
from sqlalchemy import text

def main():
    db = SessionLocal()
    try:
        print("=" * 80)
        print("VINCULANDO EMPLEADOS CON FÁBRICAS DESDE EXCEL")
        print("=" * 80)

        # Read Excel
        df = pd.read_excel('/app/config/employee_master.xlsm', sheet_name='派遣社員', header=1)
        print(f"\n📊 Leído {len(df)} empleados del Excel")

        # Get unique factories from Excel
        unique_factories = df[['派遣先ID', '派遣先']].dropna(subset=['派遣先']).drop_duplicates()
        print(f"📍 Encontradas {len(unique_factories)} fábricas únicas en Excel")

        # Step 1: Import missing factories
        print("\n" + "=" * 80)
        print("PASO 1: IMPORTAR FÁBRICAS FALTANTES")
        print("=" * 80)

        factories_created = 0
        for _, row in unique_factories.iterrows():
            factory_name = str(row['派遣先']).strip()
            factory_id_excel = row['派遣先ID']

            # Check if factory exists by plant_name
            existing = db.query(Factory).filter(Factory.plant_name == factory_name).first()

            if not existing:
                # Create new factory
                new_factory = Factory(
                    factory_id=f"AUTO_{factories_created + 1:03d}",
                    name=factory_name,  # Required field
                    company_name=factory_name.split()[0] if ' ' in factory_name else factory_name,
                    plant_name=factory_name,
                    address='(Pendiente - actualizar dirección)',
                    is_active=True
                )
                db.add(new_factory)
                factories_created += 1

                if factories_created % 5 == 0:
                    db.commit()
                    print(f"  ✅ Creadas {factories_created} fábricas...")

        db.commit()
        print(f"\n✅ Total fábricas creadas: {factories_created}")

        # Step 2: Link employees to factories
        print("\n" + "=" * 80)
        print("PASO 2: VINCULAR EMPLEADOS CON FÁBRICAS")
        print("=" * 80)

        # Get all factories as a dict for faster lookup
        all_factories = {f.plant_name: f for f in db.query(Factory).all()}
        print(f"📍 {len(all_factories)} fábricas en base de datos")

        employees_linked = 0
        employees_notfound = 0

        # Get all employees
        employees = {e.employee_id if hasattr(e, 'employee_id') else e.id: e
                    for e in db.query(Employee).filter(Employee.deleted_at.is_(None)).all()}
        print(f"👥 {len(employees)} empleados activos en base de datos")

        # Link based on Excel data
        for idx, row in df.iterrows():
            factory_name = row.get('派遣先')
            employee_id_excel = row.get('社員№')  # Employee number from Excel
            employee_name = row.get('氏名')  # Name from Excel

            if pd.isna(factory_name) or not factory_name:
                continue

            factory_name = str(factory_name).strip()

            # Find factory
            factory = all_factories.get(factory_name)
            if not factory:
                employees_notfound += 1
                continue

            # Find employee by name (fallback since employee_id might not match)
            employee = None
            for emp_id, emp in employees.items():
                if emp.full_name_kanji == employee_name:
                    employee = emp
                    break

            if not employee:
                continue

            # Update employee with factory reference
            if not employee.current_factory_id:
                employee.current_factory_id = factory.id
                employee.company_name = factory.company_name
                employee.plant_name = factory.plant_name
                employees_linked += 1

                if employees_linked % 50 == 0:
                    db.commit()
                    print(f"  ✅ Vinculados {employees_linked} empleados...")

        db.commit()
        print(f"\n✅ Total empleados vinculados: {employees_linked}")
        if employees_notfound > 0:
            print(f"⚠️  Empleados sin fábrica encontrada: {employees_notfound}")

        # Step 3: Populate apartment_factory relationships
        print("\n" + "=" * 80)
        print("PASO 3: CREAR RELACIONES APARTAMENTO-FÁBRICA")
        print("=" * 80)

        # Call the SQL function
        result = db.execute(text("SELECT * FROM populate_apartment_factory_from_employees();")).fetchone()
        apartments_linked = result[0] if result else 0
        total_relationships = result[1] if result else 0

        print(f"✅ Apartamentos vinculados: {apartments_linked}")
        print(f"✅ Total relaciones creadas: {total_relationships}")

        # Final statistics
        print("\n" + "=" * 80)
        print("ESTADÍSTICAS FINALES")
        print("=" * 80)

        total_factories = db.query(Factory).count()
        total_employees = db.query(Employee).filter(Employee.deleted_at.is_(None)).count()
        employees_with_factory = db.query(Employee).filter(
            Employee.deleted_at.is_(None),
            Employee.current_factory_id.isnot(None)
        ).count()
        total_apartments = db.query(Apartment).count()

        print(f"\n📊 Fábricas totales: {total_factories}")
        print(f"👥 Empleados totales: {total_employees}")
        print(f"🏭 Empleados con fábrica asignada: {employees_with_factory} ({employees_with_factory * 100 / total_employees:.1f}%)")
        print(f"🏘️  Apartamentos totales: {total_apartments}")
        print(f"🔗 Relaciones apartamento-fábrica: {total_relationships}")
        print(f"🏘️  Apartamentos vinculados a fábricas: {apartments_linked}")

        # Sample query
        print("\n" + "=" * 80)
        print("EJEMPLO: Apartamentos para fábrica 高雄工業 岡山")
        print("=" * 80)

        sample_factory = db.query(Factory).filter(Factory.plant_name.like('%高雄工業%岡山%')).first()
        if sample_factory:
            result = db.execute(text(f"SELECT * FROM get_factory_apartments({sample_factory.id}, true);")).fetchall()
            print(f"\n🏭 Fábrica: {sample_factory.plant_name} (ID: {sample_factory.id})")
            print(f"📊 Apartamentos disponibles: {len(result)}")
            for i, row in enumerate(result[:5], 1):
                print(f"  {i}. {row[1]} - Ocupación: {row[3]}/{row[4]} (Disponibles: {row[5]})")
            if len(result) > 5:
                print(f"  ... y {len(result) - 5} más")
        else:
            print("⚠️  Fábrica de ejemplo no encontrada")

        print("\n" + "=" * 80)
        print("✅ PROCESO COMPLETADO EXITOSAMENTE")
        print("=" * 80)

        return 0

    except Exception as e:
        db.rollback()
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        db.close()

if __name__ == "__main__":
    sys.exit(main())
