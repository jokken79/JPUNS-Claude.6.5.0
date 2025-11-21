#!/usr/bin/env python3
"""
Script para sincronizar retroactivamente rirekisho_id y fotos desde candidates
hacia contract_workers y staff.

Este script corrige datos importados con versiones antiguas del import_data.py
que no establecían la relación con candidates ni sincronizaban fotos.

Uso:
    python backend/scripts/sync_photos_retroactive.py
"""

import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.models import Candidate, ContractWorker, Staff


def sync_contract_workers(db: Session) -> dict:
    """
    Sincroniza contract_workers con candidates.

    Busca todos los contract_workers sin rirekisho_id y:
    - Busca candidate por nombre (kanji o kana)
    - Actualiza rirekisho_id, photo_url, photo_data_url

    Returns:
        dict con estadísticas de sincronización
    """
    stats = {
        'total': 0,
        'synced': 0,
        'not_found': 0,
        'already_synced': 0
    }

    print("\n" + "="*70)
    print("SINCRONIZANDO CONTRACT WORKERS (請負社員)")
    print("="*70)

    # Obtener todos los contract_workers
    workers = db.query(ContractWorker).all()
    stats['total'] = len(workers)

    for worker in workers:
        # Si ya tiene rirekisho_id, saltarlo
        if worker.rirekisho_id is not None:
            stats['already_synced'] += 1
            continue

        # Buscar candidate por nombre
        candidate = None
        if worker.full_name_kanji:
            search_name = worker.full_name_kanji.strip()
            candidate = db.query(Candidate).filter(
                or_(
                    Candidate.full_name_kanji == search_name,
                    Candidate.full_name_kana == search_name
                )
            ).first()

        if candidate:
            # Actualizar campos
            worker.rirekisho_id = candidate.rirekisho_id
            worker.photo_url = candidate.photo_url
            worker.photo_data_url = candidate.photo_data_url

            stats['synced'] += 1
            has_photo = "✓" if candidate.photo_data_url else "✗"
            print(f"  ✓ [{worker.hakenmoto_id}] {worker.full_name_kanji} → {candidate.rirekisho_id} [Foto: {has_photo}]")
        else:
            stats['not_found'] += 1
            print(f"  ⚠ [{worker.hakenmoto_id}] {worker.full_name_kanji} → No se encontró candidate")

    # Commit cambios
    db.commit()

    return stats


def sync_staff(db: Session) -> dict:
    """
    Sincroniza staff con candidates.

    Busca todos los staff sin rirekisho_id y:
    - Busca candidate por nombre (kanji o kana)
    - Actualiza rirekisho_id, photo_url, photo_data_url

    Returns:
        dict con estadísticas de sincronización
    """
    stats = {
        'total': 0,
        'synced': 0,
        'not_found': 0,
        'already_synced': 0
    }

    print("\n" + "="*70)
    print("SINCRONIZANDO STAFF (スタッフ)")
    print("="*70)

    # Obtener todos los staff
    staff_members = db.query(Staff).all()
    stats['total'] = len(staff_members)

    for member in staff_members:
        # Si ya tiene rirekisho_id, saltarlo
        if member.rirekisho_id is not None:
            stats['already_synced'] += 1
            continue

        # Buscar candidate por nombre
        candidate = None
        if member.full_name_kanji:
            search_name = member.full_name_kanji.strip()
            candidate = db.query(Candidate).filter(
                or_(
                    Candidate.full_name_kanji == search_name,
                    Candidate.full_name_kana == search_name
                )
            ).first()

        if candidate:
            # Actualizar campos
            member.rirekisho_id = candidate.rirekisho_id
            member.photo_url = candidate.photo_url
            member.photo_data_url = candidate.photo_data_url

            stats['synced'] += 1
            has_photo = "✓" if candidate.photo_data_url else "✗"
            print(f"  ✓ [{member.staff_id}] {member.full_name_kanji} → {candidate.rirekisho_id} [Foto: {has_photo}]")
        else:
            stats['not_found'] += 1
            print(f"  ⚠ [{member.staff_id}] {member.full_name_kanji} → No se encontró candidate")

    # Commit cambios
    db.commit()

    return stats


def main():
    """Función principal."""
    print("\n" + "="*70)
    print("SCRIPT DE SINCRONIZACIÓN RETROACTIVA")
    print("Sincroniza rirekisho_id y fotos desde candidates hacia")
    print("contract_workers y staff")
    print("="*70)

    db = SessionLocal()

    try:
        # Sincronizar contract_workers
        cw_stats = sync_contract_workers(db)

        # Sincronizar staff
        staff_stats = sync_staff(db)

        # Reporte final
        print("\n" + "="*70)
        print("REPORTE FINAL")
        print("="*70)

        print("\nCONTRACT WORKERS (請負社員):")
        print(f"  Total registros:        {cw_stats['total']}")
        print(f"  ✓ Sincronizados:        {cw_stats['synced']}")
        print(f"  ⚠ No encontrados:       {cw_stats['not_found']}")
        print(f"  → Ya sincronizados:     {cw_stats['already_synced']}")

        print("\nSTAFF (スタッフ):")
        print(f"  Total registros:        {staff_stats['total']}")
        print(f"  ✓ Sincronizados:        {staff_stats['synced']}")
        print(f"  ⚠ No encontrados:       {staff_stats['not_found']}")
        print(f"  → Ya sincronizados:     {staff_stats['already_synced']}")

        print("\nTOTAL GENERAL:")
        total_synced = cw_stats['synced'] + staff_stats['synced']
        total_not_found = cw_stats['not_found'] + staff_stats['not_found']
        print(f"  ✓ Total sincronizados:  {total_synced}")
        print(f"  ⚠ Total no encontrados: {total_not_found}")

        if total_synced > 0:
            print(f"\n✅ Sincronización completada exitosamente!")
        else:
            print(f"\n⚠️  No se encontraron registros para sincronizar.")

    except Exception as e:
        print(f"\n❌ Error durante la sincronización: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
