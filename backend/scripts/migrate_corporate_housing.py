#!/usr/bin/env python3
"""
Script para poblar campo is_corporate_housing en empleados existentes
Basado en residence_type = '寮' (Company Dormitory)

Uso:
    docker exec uns-claudejp-backend python /app/backend/scripts/migrate_corporate_housing.py
"""
import sys
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.models import Employee, ContractWorker, Staff, ResidenceType
from sqlalchemy import func

def migrate_corporate_housing():
    """Migrar datos existentes para poblar is_corporate_housing"""
    db = SessionLocal()
    try:
        print("\n" + "="*70)
        print("MIGRANDO CAMPO is_corporate_housing A EMPLEADOS EXISTENTES")
        print("="*70)

        updated_count = 0

        # Método 1: Si residence_type es '寮' → is_corporate_housing = True
        ryou_type = db.query(ResidenceType).filter(
            ResidenceType.name == '寮'
        ).first()

        if ryou_type:
            print(f"\n📌 Encontrado residence_type '寮' (ID: {ryou_type.id})")

            # Employees
            employees_with_ryou = db.query(Employee).filter(
                Employee.residence_type_id == ryou_type.id,
                Employee.is_active == True
            ).all()

            print(f"\n👥 EMPLOYEES con residence_type='寮': {len(employees_with_ryou)}")
            for emp in employees_with_ryou:
                if not emp.is_corporate_housing:
                    emp.is_corporate_housing = True
                    print(f"  ✅ {emp.full_name_kanji} → is_corporate_housing = True")
                    updated_count += 1

            # Contract Workers (no tienen residence_type, saltamos)
            print(f"\n👷 CONTRACT_WORKERS: No tienen residence_type, saltando")

        else:
            print("\n⚠️  No se encontró residence_type='寮'")
            print("   Crear manualmente usando: populate_reference_tables.py")

        # Método 2: Sugerencias para revisión manual
        print(f"\n" + "="*70)
        print("EMPLEADOS CON APARTMENT_RENT > 0 (REVISAR MANUALMENTE)")
        print("="*70)

        # Todos con apartment_rent
        all_personnel = (
            db.query(Employee).filter(
                Employee.apartment_rent.isnot(None),
                Employee.apartment_rent > 0,
                Employee.is_corporate_housing == False
            ).all() +
            db.query(ContractWorker).filter(
                ContractWorker.apartment_rent.isnot(None),
                ContractWorker.apartment_rent > 0,
                ContractWorker.is_corporate_housing == False
            ).all()
        )

        if all_personnel:
            print(f"\n🏠 {len(all_personnel)} empleados con apartment_rent > 0:")
            for person in all_personnel[:10]:  # Mostrar solo los primeros 10
                print(f"  ⏸️  {person.full_name_kanji}: apartment_rent={person.apartment_rent}, "
                      f"is_corporate_housing={person.is_corporate_housing}")
            if len(all_personnel) > 10:
                print(f"  ... y {len(all_personnel) - 10} más")
            print(f"\n💡 Revisar manualmente y marcar is_corporate_housing=True si viven en 社宅")
        else:
            print("\n✅ Todos los empleados ya tienen is_corporate_housing configurado")

        # Guardar cambios
        if updated_count > 0:
            db.commit()
            print(f"\n✅ Migración completada!")
            print(f"   Total actualizados: {updated_count}")
        else:
            print(f"\n✅ No se requirieron actualizaciones")

        print(f"\n{'='*70}")
        print("SIGUIENTE PASO: Actualizar payroll calculation logic")
        print("Ver: backend/app/services/payroll_integration_service.py")
        print("="*70)

    except Exception as e:
        print(f"\n❌ Error durante la migración: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_corporate_housing()
