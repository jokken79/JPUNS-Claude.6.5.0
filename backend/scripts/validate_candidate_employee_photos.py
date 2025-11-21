#!/usr/bin/env python3
"""
Script to validate photo synchronization between candidates and employees.

This script checks:
1. All employees have photos if their candidate has photos
2. Photo content is identical between candidate and employee
3. Reports any mismatches or missing photos
4. Generates a detailed report for troubleshooting
"""
import sys
from pathlib import Path

sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.models import Candidate, Employee, ContractWorker, Staff
from sqlalchemy import func

def validate_candidate_employee_photos():
    """Validate photo synchronization"""

    db = SessionLocal()
    try:
        print(f"""
╔════════════════════════════════════════════════════════════╗
║     VALIDANDO SINCRONIZACIÓN DE FOTOS CANDIDATO-EMPLEADO   ║
╚════════════════════════════════════════════════════════════╝
        """)

        # Get all candidates with photos
        candidates = db.query(Candidate).filter(
            Candidate.photo_data_url.isnot(None)
        ).all()

        print(f"Candidatos con fotos: {len(candidates)}\n")

        mismatches = []
        missing_photos = []
        valid_syncs = 0

        # Check each candidate
        for candidate in candidates:
            # Find all workers linked to this candidate
            employees = db.query(Employee).filter(
                Employee.rirekisho_id == candidate.rirekisho_id
            ).all()

            contract_workers = db.query(ContractWorker).filter(
                ContractWorker.rirekisho_id == candidate.rirekisho_id
            ).all()

            staff_members = db.query(Staff).filter(
                Staff.rirekisho_id == candidate.rirekisho_id
            ).all()

            all_workers = employees + contract_workers + staff_members

            if not all_workers:
                # No employees linked to this candidate
                continue

            # Check each worker
            for worker in all_workers:
                worker_type = type(worker).__name__
                worker_id = getattr(worker, 'hakenmoto_id', None) or getattr(worker, 'id', None)

                if not worker.photo_data_url:
                    # Worker is missing photo
                    missing_photos.append({
                        'candidate_id': candidate.rirekisho_id,
                        'candidate_name': candidate.full_name_kanji or 'Unknown',
                        'worker_type': worker_type,
                        'worker_id': worker_id,
                        'issue': 'MISSING_PHOTO'
                    })
                elif worker.photo_data_url != candidate.photo_data_url:
                    # Photo content doesn't match
                    mismatches.append({
                        'candidate_id': candidate.rirekisho_id,
                        'candidate_name': candidate.full_name_kanji or 'Unknown',
                        'worker_type': worker_type,
                        'worker_id': worker_id,
                        'issue': 'PHOTO_MISMATCH'
                    })
                else:
                    # Photo is properly synced
                    valid_syncs += 1

        # Print results
        print(f"""
╔════════════════════════════════════════════════════════════╗
║                 RESULTADOS DE VALIDACIÓN                   ║
╚════════════════════════════════════════════════════════════╝

✓ FOTOS SINCRONIZADAS CORRECTAMENTE: {valid_syncs}
        """)

        if missing_photos:
            print(f"""
❌ FOTOS FALTANTES: {len(missing_photos)}

   Empleados sin foto (candidato tiene foto):
            """)
            for item in missing_photos[:10]:
                print(f"   • {item['candidate_id']} ({item['candidate_name']}) "
                      f"→ {item['worker_type']} ID:{item['worker_id']}")
            if len(missing_photos) > 10:
                print(f"   ... y {len(missing_photos) - 10} más")

        if mismatches:
            print(f"""
⚠️  FOTOS NO COINCIDEN: {len(mismatches)}

   Empleados con foto diferente de la del candidato:
            """)
            for item in mismatches[:10]:
                print(f"   • {item['candidate_id']} ({item['candidate_name']}) "
                      f"→ {item['worker_type']} ID:{item['worker_id']}")
            if len(mismatches) > 10:
                print(f"   ... y {len(mismatches) - 10} más")

        # Generate recommendations
        print(f"""
╔════════════════════════════════════════════════════════════╗
║                    RECOMENDACIONES                         ║
╚════════════════════════════════════════════════════════════╝
        """)

        if missing_photos or mismatches:
            print("""
⚠️  Se encontraron problemas de sincronización.

Para corregir:
   1. Ejecutar: python scripts/sync_candidate_photos.py
   2. Ejecutar: python scripts/sync_candidate_employee_status.py
   3. Ejecutar nuevamente: python scripts/validate_candidate_employee_photos.py
            """)
        else:
            print("""
✓ TODAS LAS FOTOS ESTÁN CORRECTAMENTE SINCRONIZADAS!

   Relación candidato-empleado: OK
   Sincronización de fotos: OK
   Estado de bases de datos: CONSISTENTE
            """)

        # Statistics
        print(f"""
╔════════════════════════════════════════════════════════════╗
║                    ESTADÍSTICAS                            ║
╚════════════════════════════════════════════════════════════╝

Candidatos procesados: {len(candidates)}
Sincronizaciones válidas: {valid_syncs}
Fotos faltantes: {len(missing_photos)}
Fotos no coinciden: {len(mismatches)}

Total de empleados: {db.query(Employee).count()}
Empleados con foto: {db.query(Employee).filter(Employee.photo_data_url.isnot(None)).count()}

Total de trabajadores por contrato: {db.query(ContractWorker).count()}
Con foto: {db.query(ContractWorker).filter(ContractWorker.photo_data_url.isnot(None)).count()}

Total de personal de oficina: {db.query(Staff).count()}
Con foto: {db.query(Staff).filter(Staff.photo_data_url.isnot(None)).count()}
        """)

        # Return True if validation passed
        return len(missing_photos) == 0 and len(mismatches) == 0

    except Exception as e:
        print(f"❌ Error al validar: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == '__main__':
    success = validate_candidate_employee_photos()
    sys.exit(0 if success else 1)
