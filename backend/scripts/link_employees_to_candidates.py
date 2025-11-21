"""
Link Employees to Candidates (Rirekisho)
=========================================

This script links employees to their corresponding candidates by matching
full_name_kanji and date_of_birth, then copies the rirekisho_id.

After linking, employees will have access to candidate photos via rirekisho_id.

Author: Claude Code
Date: 2025-11-12
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.models import Employee, Candidate
from sqlalchemy import and_

def main():
    """Main execution function"""
    db = SessionLocal()

    try:
        print("=" * 80)
        print("VINCULANDO EMPLEADOS CON CANDIDATOS (RIREKISHO)")
        print("=" * 80)

        # Step 1: Count employees without rirekisho_id
        employees_without_rirekisho = db.query(Employee).filter(
            Employee.rirekisho_id.is_(None)
        ).count()

        print(f"\n📊 ESTADÍSTICAS INICIALES:")
        print(f"   Total empleados: {db.query(Employee).count()}")
        print(f"   Sin rirekisho_id: {employees_without_rirekisho}")
        print(f"   Total candidatos: {db.query(Candidate).count()}")

        # Step 2: Link employees to candidates by name and DOB
        print(f"\n🔗 VINCULANDO POR NOMBRE + FECHA DE NACIMIENTO...")

        employees = db.query(Employee).filter(
            Employee.rirekisho_id.is_(None),
            Employee.full_name_kanji.isnot(None),
            Employee.date_of_birth.isnot(None)
        ).all()

        matched_count = 0
        photo_count = 0

        for emp in employees:
            # Try to find matching candidate
            candidate = db.query(Candidate).filter(
                and_(
                    Candidate.full_name_kanji == emp.full_name_kanji,
                    Candidate.date_of_birth == emp.date_of_birth
                )
            ).first()

            if candidate:
                # Link employee to candidate
                emp.rirekisho_id = candidate.rirekisho_id

                # Copy photo if candidate has one
                if candidate.photo_data_url:
                    emp.photo_data_url = candidate.photo_data_url
                    photo_count += 1

                matched_count += 1

                if matched_count % 50 == 0:
                    db.commit()
                    print(f"   ✓ Vinculados: {matched_count} (con fotos: {photo_count})")

        # Final commit
        db.commit()

        print(f"\n✅ VINCULACIÓN COMPLETADA:")
        print(f"   ✓ Empleados vinculados: {matched_count}")
        print(f"   ✓ Con fotos: {photo_count}")
        print(f"   ⚠ Sin coincidencia: {employees_without_rirekisho - matched_count}")

        # Step 3: Try to link remaining by name only (less strict)
        remaining = db.query(Employee).filter(
            Employee.rirekisho_id.is_(None),
            Employee.full_name_kanji.isnot(None)
        ).count()

        if remaining > 0:
            print(f"\n🔍 VINCULANDO RESTANTES SOLO POR NOMBRE (menos estricto)...")

            employees_remaining = db.query(Employee).filter(
                Employee.rirekisho_id.is_(None),
                Employee.full_name_kanji.isnot(None)
            ).all()

            matched_name_only = 0
            photo_name_only = 0

            for emp in employees_remaining:
                # Find candidate by name only
                candidate = db.query(Candidate).filter(
                    Candidate.full_name_kanji == emp.full_name_kanji
                ).first()

                if candidate:
                    emp.rirekisho_id = candidate.rirekisho_id

                    if candidate.photo_data_url:
                        emp.photo_data_url = candidate.photo_data_url
                        photo_name_only += 1

                    matched_name_only += 1

                    if matched_name_only % 50 == 0:
                        db.commit()
                        print(f"   ✓ Vinculados: {matched_name_only} (con fotos: {photo_name_only})")

            db.commit()

            print(f"\n✅ SEGUNDA PASADA COMPLETADA:")
            print(f"   ✓ Empleados vinculados: {matched_name_only}")
            print(f"   ✓ Con fotos: {photo_name_only}")

        # Final statistics
        print(f"\n" + "=" * 80)
        print("📊 ESTADÍSTICAS FINALES:")
        print("=" * 80)

        total_employees = db.query(Employee).count()
        with_rirekisho = db.query(Employee).filter(
            Employee.rirekisho_id.isnot(None)
        ).count()
        with_photos = db.query(Employee).filter(
            Employee.photo_data_url.isnot(None)
        ).count()

        print(f"   Total empleados: {total_employees}")
        print(f"   Con rirekisho_id: {with_rirekisho} ({with_rirekisho * 100 / total_employees:.1f}%)")
        print(f"   Con fotos: {with_photos} ({with_photos * 100 / total_employees:.1f}%)")
        print(f"   Sin vincular: {total_employees - with_rirekisho}")

        print("\n" + "=" * 80)
        print("✅ PROCESO COMPLETADO")
        print("=" * 80)

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
