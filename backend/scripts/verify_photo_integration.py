"""
Verificación completa de integración de fotos en el sistema
Verifica que las fotos se copian correctamente de candidatos a empleados
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.models import Candidate, Employee, ContractWorker, Staff
from sqlalchemy import func, text


def verify_photo_integration():
    """Verify complete photo integration"""
    db = SessionLocal()

    try:
        print("=" * 80)
        print("🔍 VERIFICACIÓN COMPLETA DE INTEGRACIÓN DE FOTOS")
        print("=" * 80)
        print()

        # 1. Check candidates with photos
        print("📋 1. CANDIDATOS CON FOTOS")
        print("-" * 80)

        total_candidates = db.query(func.count(Candidate.id)).scalar()
        candidates_with_photo_url = db.query(func.count(Candidate.id)).filter(
            Candidate.photo_url.isnot(None),
            Candidate.photo_url != ''
        ).scalar()
        candidates_with_photo_data = db.query(func.count(Candidate.id)).filter(
            Candidate.photo_data_url.isnot(None),
            Candidate.photo_data_url != ''
        ).scalar()

        print(f"   Total candidatos: {total_candidates}")
        print(f"   Con photo_url: {candidates_with_photo_url}")
        print(f"   Con photo_data_url (base64): {candidates_with_photo_data}")

        if candidates_with_photo_data > 0:
            coverage = (candidates_with_photo_data / total_candidates) * 100 if total_candidates > 0 else 0
            print(f"   Cobertura: {coverage:.1f}%")
            if coverage >= 90:
                print("   ✅ Excelente cobertura de fotos")
            elif coverage >= 70:
                print("   ⚠️  Cobertura aceptable")
            else:
                print("   ❌ Baja cobertura de fotos")
        print()

        # 2. Check employees with photos
        print("👷 2. EMPLEADOS CON FOTOS")
        print("-" * 80)

        total_employees = db.query(func.count(Employee.id)).scalar()
        employees_with_rirekisho = db.query(func.count(Employee.id)).filter(
            Employee.rirekisho_id.isnot(None),
            Employee.rirekisho_id != ''
        ).scalar()
        employees_with_photo_data = db.query(func.count(Employee.id)).filter(
            Employee.photo_data_url.isnot(None),
            Employee.photo_data_url != ''
        ).scalar()

        print(f"   Total empleados: {total_employees}")
        print(f"   Con rirekisho_id (vinculados a candidato): {employees_with_rirekisho}")
        print(f"   Con photo_data_url: {employees_with_photo_data}")

        if employees_with_rirekisho > 0:
            inheritance_rate = (employees_with_photo_data / employees_with_rirekisho) * 100
            print(f"   Tasa de herencia de fotos: {inheritance_rate:.1f}%")
            if inheritance_rate >= 95:
                print("   ✅ Herencia de fotos funcionando correctamente")
            elif inheritance_rate >= 80:
                print("   ⚠️  Herencia parcial - revisar casos")
            else:
                print("   ❌ Problema en herencia de fotos")
        print()

        # 3. Check contract workers with photos
        print("📝 3. TRABAJADORES POR CONTRATO CON FOTOS")
        print("-" * 80)

        total_contract_workers = db.query(func.count(ContractWorker.id)).scalar()
        contract_workers_with_photo = db.query(func.count(ContractWorker.id)).filter(
            ContractWorker.photo_data_url.isnot(None),
            ContractWorker.photo_data_url != ''
        ).scalar()

        print(f"   Total trabajadores por contrato: {total_contract_workers}")
        print(f"   Con photo_data_url: {contract_workers_with_photo}")
        print()

        # 4. Check staff with photos
        print("🏢 4. STAFF CON FOTOS")
        print("-" * 80)

        total_staff = db.query(func.count(Staff.id)).scalar()
        staff_with_photo = db.query(func.count(Staff.id)).filter(
            Staff.photo_data_url.isnot(None),
            Staff.photo_data_url != ''
        ).scalar()

        print(f"   Total staff: {total_staff}")
        print(f"   Con photo_data_url: {staff_with_photo}")
        print()

        # 5. Sample verification - check photo inheritance
        print("🔬 5. VERIFICACIÓN DE MUESTRA (Primeros 5 empleados)")
        print("-" * 80)

        sample_employees = db.query(Employee).filter(
            Employee.rirekisho_id.isnot(None)
        ).limit(5).all()

        if sample_employees:
            for emp in sample_employees:
                print(f"\n   Empleado: {emp.full_name_kanji or emp.hakenmoto_id}")
                print(f"   Rirekisho ID: {emp.rirekisho_id}")
                print(f"   Tiene foto: {'✅ SÍ' if emp.photo_data_url else '❌ NO'}")

                # Check candidate photo
                if emp.rirekisho_id:
                    candidate = db.query(Candidate).filter(
                        Candidate.rirekisho_id == emp.rirekisho_id
                    ).first()

                    if candidate:
                        candidate_has_photo = bool(candidate.photo_data_url)
                        employee_has_photo = bool(emp.photo_data_url)

                        print(f"   Candidato tiene foto: {'✅ SÍ' if candidate_has_photo else '❌ NO'}")

                        if candidate_has_photo and employee_has_photo:
                            # Verify they match
                            if candidate.photo_data_url == emp.photo_data_url:
                                print(f"   Herencia: ✅ CORRECTA (fotos coinciden)")
                            else:
                                print(f"   Herencia: ⚠️  PARCIAL (fotos difieren)")
                        elif candidate_has_photo and not employee_has_photo:
                            print(f"   Herencia: ❌ FALLIDA (candidato tiene foto pero empleado no)")
                        elif not candidate_has_photo and not employee_has_photo:
                            print(f"   Herencia: ⏭️  N/A (candidato sin foto)")
                        else:
                            print(f"   Herencia: ⚠️  INUSUAL (empleado tiene foto pero candidato no)")
                    else:
                        print(f"   ⚠️  Candidato no encontrado")
        else:
            print("   ⚠️  No hay empleados vinculados a candidatos")

        print()
        print("=" * 80)
        print("✅ VERIFICACIÓN COMPLETADA")
        print("=" * 80)

        # Summary
        print("\n📊 RESUMEN:")
        print(f"   • Candidatos con fotos: {candidates_with_photo_data}/{total_candidates}")
        print(f"   • Empleados con fotos: {employees_with_photo_data}/{total_employees}")
        print(f"   • Trabajadores por contrato con fotos: {contract_workers_with_photo}/{total_contract_workers}")
        print(f"   • Staff con fotos: {staff_with_photo}/{total_staff}")

        total_people_with_photos = (
            candidates_with_photo_data +
            employees_with_photo_data +
            contract_workers_with_photo +
            staff_with_photo
        )
        total_people = total_candidates + total_employees + total_contract_workers + total_staff

        if total_people > 0:
            overall_coverage = (total_people_with_photos / total_people) * 100
            print(f"\n   📈 Cobertura total del sistema: {overall_coverage:.1f}%")

    except Exception as e:
        print(f"❌ Error durante verificación: {str(e)}")
        import traceback
        traceback.print_exc()

    finally:
        db.close()


if __name__ == "__main__":
    verify_photo_integration()
