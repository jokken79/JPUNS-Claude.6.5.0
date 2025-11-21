#!/usr/bin/env python3
"""
Script para crear candidatos a partir de empleados existentes
Facilita la demostración del sistema con datos realistas
"""

import os
import sys
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

# Agregar ruta del app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import settings
from app.models.models import Employee, Candidate

def create_candidates_from_employees():
    """Crear candidatos a partir de los primeros 100 empleados"""

    engine = create_engine(settings.DATABASE_URL)

    with Session(engine) as db:
        # Obtener empleados sin candidatos asociados
        employees = db.query(Employee).filter(
            Employee.rirekisho_id == None
        ).limit(100).all()

        created_count = 0

        print("\n" + "="*80)
        print("CREAR CANDIDATOS DESDE EMPLEADOS")
        print("="*80)

        for i, emp in enumerate(employees, 1):
            try:
                # Crear candidato basado en empleado
                candidate = Candidate(
                    full_name_kanji=emp.full_name_kanji or "候補者" + str(i),
                    full_name_kana=emp.full_name_kana or "コウホシャ" + str(i),
                    full_name_roman=emp.full_name_roman or f"Candidate{i}",
                    date_of_birth=emp.date_of_birth,
                    gender=emp.gender,
                    nationality=emp.nationality,
                    email=emp.email,
                    phone=emp.phone,
                    address=emp.address,
                    postal_code=emp.postal_code,
                    highest_education="高卒",
                    applicant_status="応募済み",
                    application_date=datetime.now().date(),
                    interview_scheduled_date=datetime.now().date() + timedelta(days=7),
                    interview_completed=False,
                    interview_result="未実施",
                    health_check_date=None,
                    is_available_for_work=True,
                    emergency_contact_name=emp.full_name_kanji or "緊急連絡先",
                    emergency_contact_phone=emp.phone,
                    emergency_contact_relationship="本人",
                )

                db.add(candidate)
                db.flush()
                created_count += 1

                if i % 10 == 0:
                    print(f"  [{i}/100] Procesando...")

            except Exception as e:
                print(f"  ✗ Error en fila {i}: {str(e)}")
                continue

        # Commit de todos los cambios
        db.commit()

        print("\n" + "="*80)
        print(f"✓ CANDIDATOS CREADOS: {created_count}")
        print("="*80 + "\n")

if __name__ == "__main__":
    create_candidates_from_employees()
