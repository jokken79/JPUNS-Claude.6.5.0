#!/usr/bin/env python3
"""
Script to synchronize candidate approval status based on employee assignments.

Rules:
- If a candidate has a corresponding employee (rirekisho_id match), status = "approved" (合格)
- If a candidate has no employee assignment, status = "pending" (審査中)
- This script runs AFTER import_data.py to ensure employee data is present
"""
import sys
from pathlib import Path

sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.models import Candidate, Employee, ContractWorker, Staff
from sqlalchemy import func

def sync_candidate_employee_status():
    """
    Synchronize candidate status based on employee existence
    AND synchronize photos from candidates to employees
    """

    db = SessionLocal()
    try:
        # Get all candidates
        candidates = db.query(Candidate).all()

        updated_status = 0
        updated_photos = 0
        unchanged = 0

        print(f"""
╔════════════════════════════════════════════════════════════╗
║     SINCRONIZANDO ESTADOS Y FOTOS CANDIDATO-EMPLEADO       ║
╚════════════════════════════════════════════════════════════╝
Total de candidatos a procesar: {len(candidates)}
        """)

        for candidate in candidates:
            # Check if this candidate has a corresponding employee in ANY of the 3 tables
            # 1. Try Employee table
            employees = db.query(Employee).filter(
                Employee.rirekisho_id == candidate.rirekisho_id
            ).all()

            # 2. Try ContractWorker table
            contract_workers = db.query(ContractWorker).filter(
                ContractWorker.rirekisho_id == candidate.rirekisho_id
            ).all()

            # 3. Try Staff table
            staff_members = db.query(Staff).filter(
                Staff.rirekisho_id == candidate.rirekisho_id
            ).all()

            all_workers = employees + contract_workers + staff_members

            if all_workers:
                # Candidate has employee assignment(s) → status should be "hired" (採用)
                if candidate.status != "hired":
                    candidate.status = "hired"
                    db.commit()
                    updated_status += 1
                else:
                    unchanged += 1

                # SINCRONIZAR FOTOS: Copy candidate's photo to all linked employees
                if candidate.photo_data_url or candidate.photo_url:
                    for worker in all_workers:
                        photo_updated = False

                        # Update photo_data_url (primary field)
                        if candidate.photo_data_url:
                            if not worker.photo_data_url or worker.photo_data_url != candidate.photo_data_url:
                                worker.photo_data_url = candidate.photo_data_url
                                photo_updated = True

                        # Update photo_url (legacy field)
                        if candidate.photo_url:
                            if not worker.photo_url or worker.photo_url != candidate.photo_url:
                                worker.photo_url = candidate.photo_url
                                photo_updated = True

                        if photo_updated:
                            db.add(worker)
                            updated_photos += 1

                    # Commit photo updates
                    if updated_photos > 0:
                        db.commit()

            else:
                # No employee assignment → keep "pending" (審査中)
                if candidate.status != "pending":
                    candidate.status = "pending"
                    db.commit()
                    updated_status += 1
                else:
                    unchanged += 1

        print(f"""
╔════════════════════════════════════════════════════════════╗
║      SINCRONIZACIÓN COMPLETADA (ESTADO Y FOTOS)             ║
╚════════════════════════════════════════════════════════════╝
✓ Estados actualizados: {updated_status}
✓ Fotos sincronizadas: {updated_photos}
━ Sin cambios:         {unchanged}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        """)

        # Show summary of status distribution
        status_counts = db.query(
            Candidate.status,
            func.count(Candidate.id).label('count')
        ).group_by(Candidate.status).all()

        print("\n📊 Distribución de estados:")
        for status, count in status_counts:
            status_label = {
                "pending": "审查中 (Pendientes)",
                "approved": "合格 (Aprobados)",
                "rejected": "不合格 (Rechazados)",
                "hired": "採用 (Contratados)"
            }.get(status, status)
            print(f"   {status_label}: {count}")

        # Show photo synchronization summary
        employees_with_photo = db.query(Employee).filter(
            Employee.photo_data_url.isnot(None)
        ).count()
        employees_total = db.query(Employee).count()

        print(f"\n📸 Fotos en empleados: {employees_with_photo}/{employees_total}")

        return True

    except Exception as e:
        print(f"❌ Error al sincronizar: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == '__main__':
    success = sync_candidate_employee_status()
    sys.exit(0 if success else 1)
