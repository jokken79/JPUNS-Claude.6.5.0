#!/usr/bin/env python3
"""
Script to synchronize photos from candidates to employees.

This script ensures that:
1. Every employee linked to a candidate has the candidate's photo
2. When a candidate photo is updated, linked employees are updated too
3. Comprehensive validation and reporting

Rules:
- If employee.rirekisho_id matches candidate.rirekisho_id, sync the photo
- Copy both photo_url and photo_data_url
- Log all changes for audit trail
"""
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.models import Candidate, Employee, ContractWorker, Staff
from sqlalchemy import func

def sync_candidate_photos():
    """Synchronize photos from candidates to employees"""

    db = SessionLocal()
    try:
        # Get all candidates with photos
        candidates_with_photos = db.query(Candidate).filter(
            Candidate.photo_data_url.isnot(None)
        ).all()

        # Get all candidates without photos
        candidates_without_photos = db.query(Candidate).filter(
            Candidate.photo_data_url.is_(None)
        ).all()

        total_candidates = len(candidates_with_photos) + len(candidates_without_photos)

        print(f"""
╔════════════════════════════════════════════════════════════╗
║        SINCRONIZANDO FOTOS: CANDIDATOS → EMPLEADOS         ║
╚════════════════════════════════════════════════════════════╝
📊 Estadísticas iniciales:
   • Total de candidatos: {total_candidates}
   • Candidatos CON foto: {len(candidates_with_photos)}
   • Candidatos SIN foto: {len(candidates_without_photos)}
        """)

        synced_count = 0
        skipped_count = 0
        error_count = 0

        # Process candidates WITH photos
        print("\n🔄 Procesando candidatos CON fotos...\n")

        for candidate in candidates_with_photos:
            try:
                # Find all employees/contract_workers/staff linked to this candidate
                employees = db.query(Employee).filter(
                    Employee.rirekisho_id == candidate.rirekisho_id
                ).all()

                contract_workers = db.query(ContractWorker).filter(
                    ContractWorker.rirekisho_id == candidate.rirekisho_id
                ).all()

                staff = db.query(Staff).filter(
                    Staff.rirekisho_id == candidate.rirekisho_id
                ).all()

                all_workers = employees + contract_workers + staff

                if not all_workers:
                    # Candidate has no linked employees
                    skipped_count += 1
                    continue

                # Sync photo to all linked workers
                for worker in all_workers:
                    # Check if photo needs updating
                    needs_update = False

                    # Update photo_data_url if candidate has one and worker doesn't, or if different
                    if candidate.photo_data_url:
                        if not worker.photo_data_url or worker.photo_data_url != candidate.photo_data_url:
                            worker.photo_data_url = candidate.photo_data_url
                            needs_update = True

                    # Update photo_url if candidate has one and worker doesn't, or if different
                    if candidate.photo_url:
                        if not worker.photo_url or worker.photo_url != candidate.photo_url:
                            worker.photo_url = candidate.photo_url
                            needs_update = True

                    if needs_update:
                        db.add(worker)
                        synced_count += 1

                        # Get worker type for logging
                        worker_type = type(worker).__name__
                        worker_id = getattr(worker, 'hakenmoto_id', None) or getattr(worker, 'id', None)

                        print(f"   ✓ {worker_type} (ID: {worker_id}) ← Foto de {candidate.rirekisho_id}")

            except Exception as e:
                error_count += 1
                print(f"   ❌ Error procesando candidato {candidate.rirekisho_id}: {e}")
                continue

        # Commit all changes
        if synced_count > 0:
            db.commit()
            print(f"\n✓ {synced_count} registros de empleados actualizados con fotos")

        # Summary of candidates without photos
        if candidates_without_photos:
            print(f"""
⚠️  CANDIDATOS SIN FOTOS:
   {len(candidates_without_photos)} candidatos no tienen fotos cargadas
        """)
            # List first 10 candidates without photos
            for candidate in candidates_without_photos[:10]:
                print(f"   • {candidate.rirekisho_id} - {candidate.full_name_kanji or 'Sin nombre'}")
            if len(candidates_without_photos) > 10:
                print(f"   ... y {len(candidates_without_photos) - 10} más")

        # Final report
        print(f"""
╔════════════════════════════════════════════════════════════╗
║            SINCRONIZACIÓN DE FOTOS COMPLETADA               ║
╚════════════════════════════════════════════════════════════╝
✓ Sincronizados: {synced_count}
━ Omitidos: {skipped_count}
❌ Errores: {error_count}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Resumen de empleados por tipo:
        """)

        # Count employees with/without photos
        employees_with_photo = db.query(Employee).filter(
            Employee.photo_data_url.isnot(None)
        ).count()
        employees_total = db.query(Employee).count()

        contract_with_photo = db.query(ContractWorker).filter(
            ContractWorker.photo_data_url.isnot(None)
        ).count()
        contract_total = db.query(ContractWorker).count()

        staff_with_photo = db.query(Staff).filter(
            Staff.photo_data_url.isnot(None)
        ).count()
        staff_total = db.query(Staff).count()

        print(f"   Employee: {employees_with_photo}/{employees_total} con foto")
        print(f"   ContractWorker: {contract_with_photo}/{contract_total} con foto")
        print(f"   Staff: {staff_with_photo}/{staff_total} con foto")
        print(f"\n   TOTAL: {employees_with_photo + contract_with_photo + staff_with_photo}/{employees_total + contract_total + staff_total} con foto")

        return True

    except Exception as e:
        print(f"❌ Error crítico al sincronizar fotos: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == '__main__':
    success = sync_candidate_photos()
    sys.exit(0 if success else 1)
