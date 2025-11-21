"""
Create Apartments Table from Employee Excel Data
=================================================

Extracts unique apartment names from employee_master.xlsm and creates
records in the apartments table for linking employees to their housing.

Usage:
    python scripts/create_apartments_from_employees.py

Author: Claude Code
Date: 2025-11-03
"""
import sys
from pathlib import Path
import pandas as pd

# Add parent directory to path
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.models import Apartment

def main():
    """Main execution function"""
    db = SessionLocal()

    try:
        print("=" * 60)
        print("CREANDO APARTAMENTOS DESDE EXCEL")
        print("=" * 60)

        # Read employee Excel
        print("\n1️⃣ Leyendo employee_master.xlsm...")
        df = pd.read_excel('/app/config/employee_master.xlsm',
                          sheet_name='派遣社員',
                          header=1)

        # Extract unique apartments
        print("2️⃣ Extrayendo apartamentos únicos...")
        unique_apartments = df['ｱﾊﾟｰﾄ'].dropna().unique()
        print(f"   Encontrados: {len(unique_apartments)} apartamentos únicos")

        # Count employees per apartment
        apartment_counts = {}
        for apt in unique_apartments:
            count = len(df[df['ｱﾊﾟｰﾄ'] == apt])
            apartment_counts[apt] = count

        # Create apartment records
        print(f"\n3️⃣ Creando registros de apartamentos...")
        created = 0
        skipped = 0

        for apt_name in sorted(unique_apartments):
            # Check if already exists
            existing = db.query(Apartment).filter(
                Apartment.apartment_code == apt_name
            ).first()

            if existing:
                skipped += 1
                continue

            # Determine default capacity based on employee count
            num_employees = apartment_counts.get(apt_name, 0)
            # Default capacity is max of employees + 2 (for growth), with minimum of 2
            default_capacity = max(num_employees + 2, 2)

            # Create new apartment
            apartment = Apartment(
                apartment_code=apt_name,
                name=apt_name,  # Required field - use apartment_code as name
                address='(Pendiente - actualizar dirección)',
                monthly_rent=45000,  # Default rent (¥45,000)
                base_rent=45000,  # Required field - same as monthly_rent
                capacity=default_capacity,
                is_available=True,
                notes=f'Auto-creado desde importación. {num_employees} empleado(s) actual.'
            )
            db.add(apartment)
            created += 1

            # Commit in batches of 50 for performance
            if created % 50 == 0:
                db.commit()
                print(f"   Procesados {created}...")

        # Final commit
        db.commit()

        print(f"\n✅ RESULTADO:")
        print(f"   ✓ Creados: {created} apartamentos")
        if skipped > 0:
            print(f"   ⚠ Omitidos: {skipped} (ya existían)")

        # Show summary stats
        print(f"\n📊 ESTADÍSTICAS:")
        print(f"   Total apartamentos en DB: {db.query(Apartment).count()}")

        # Show top 10 apartments by employee count
        print(f"\n🏢 TOP 10 APARTAMENTOS (por número de empleados):")
        top_apartments = sorted(apartment_counts.items(),
                               key=lambda x: x[1],
                               reverse=True)[:10]
        for apt_name, count in top_apartments:
            print(f"   {apt_name}: {count} empleados")

        print("\n" + "=" * 60)
        print("✅ PROCESO COMPLETADO")
        print("=" * 60)
        print("\n💡 SIGUIENTE PASO:")
        print("   Ejecutar: python scripts/import_data.py")
        print("   Para re-importar empleados con apartment_id asignado\n")

    except Exception as e:
        db.rollback()
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

    finally:
        db.close()

    return 0


if __name__ == '__main__':
    sys.exit(main())
