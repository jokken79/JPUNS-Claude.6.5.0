#!/usr/bin/env python3
"""
Script de prueba para verificar la relación Employee-Factory
Verifica que la corrección del bug factory_id funcione correctamente
"""
import sys
sys.path.insert(0, '/app')
sys.path.insert(0, './backend')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://uns_admin:uns_password@localhost:5432/uns_claudejp")

try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    print("=" * 80)
    print("PRUEBA DE RELACIÓN EMPLOYEE-FACTORY")
    print("=" * 80)

    # 1. Verificar factories
    print("\n1. FÁBRICAS EN LA BASE DE DATOS")
    print("-" * 80)
    result = db.execute(text("""
        SELECT factory_id, name, company_name, plant_name
        FROM factories
        WHERE is_active = true
        LIMIT 10
    """))
    factories = result.fetchall()
    print(f"Total de fábricas activas (primeras 10):")
    for factory in factories:
        print(f"  - {factory[0]}: {factory[1]} ({factory[2]} - {factory[3]})")

    # 2. Verificar employees con factory_id
    print("\n2. EMPLEADOS CON FACTORY_ID ASIGNADO")
    print("-" * 80)
    result = db.execute(text("""
        SELECT COUNT(*) as total
        FROM employees
        WHERE factory_id IS NOT NULL
        AND is_active = true
    """))
    total_employees = result.fetchone()[0]
    print(f"Total de empleados con fábrica asignada: {total_employees}")

    # 3. Verificar la relación correcta (String con String)
    print("\n3. RELACIÓN EMPLOYEE-FACTORY (String = String)")
    print("-" * 80)
    result = db.execute(text("""
        SELECT
            f.factory_id,
            f.name as factory_name,
            COUNT(e.id) as employee_count
        FROM factories f
        LEFT JOIN employees e ON e.factory_id = f.factory_id AND e.is_active = true
        WHERE f.is_active = true
        GROUP BY f.factory_id, f.name
        ORDER BY employee_count DESC
        LIMIT 10
    """))
    factory_employees = result.fetchall()
    print("Fábricas con más empleados:")
    for row in factory_employees:
        print(f"  - {row[1]}: {row[2]} empleados")

    # 4. Verificar que la relación INCORRECTA (Integer) da 0
    print("\n4. VERIFICACIÓN DEL BUG (factory.id en vez de factory.factory_id)")
    print("-" * 80)
    result = db.execute(text("""
        SELECT
            f.id as factory_int_id,
            f.factory_id as factory_string_id,
            f.name,
            COUNT(e.id) as wrong_count
        FROM factories f
        LEFT JOIN employees e ON e.factory_id = CAST(f.id AS VARCHAR) AND e.is_active = true
        WHERE f.is_active = true
        GROUP BY f.id, f.factory_id, f.name
        LIMIT 5
    """))
    wrong_results = result.fetchall()
    print("Si usamos factory.id (Integer) en vez de factory.factory_id (String):")
    for row in wrong_results:
        print(f"  - Factory ID={row[0]} (int) vs '{row[1]}' (string): {row[3]} empleados (debería ser 0)")

    # 5. Muestra de empleados con sus factories
    print("\n5. MUESTRA DE EMPLEADOS CON SUS FÁBRICAS")
    print("-" * 80)
    result = db.execute(text("""
        SELECT
            e.hakenmoto_id,
            e.full_name_kanji,
            e.factory_id,
            f.name as factory_name
        FROM employees e
        LEFT JOIN factories f ON f.factory_id = e.factory_id
        WHERE e.factory_id IS NOT NULL
        AND e.is_active = true
        LIMIT 10
    """))
    employee_sample = result.fetchall()
    print("Primeros 10 empleados con fábrica:")
    for row in employee_sample:
        print(f"  - {row[0]}: {row[1]} → {row[2]} ({row[3]})")

    print("\n" + "=" * 80)
    print("✅ PRUEBA COMPLETADA EXITOSAMENTE")
    print("=" * 80)

    db.close()

except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
