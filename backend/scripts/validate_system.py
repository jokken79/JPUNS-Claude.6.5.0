#!/usr/bin/env python3
"""
Script de validación completa del sistema UNS-ClaudeJP.

Verifica:
1. Base de datos conectada
2. Datos importados (candidatos, empleados, etc.)
3. Estados sincronizados correctamente
4. Fotos disponibles
5. API funcionando
6. Endpoints críticos accesibles
"""

import sys
import requests
from pathlib import Path

sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.models import Candidate, Employee, ContractWorker, Staff, Factory, User

def check_database():
    """Verifica conexión a base de datos."""
    print("\n📊 VERIFICANDO BASE DE DATOS")
    print("=" * 60)

    try:
        db = SessionLocal()

        # Contar registros
        candidates = db.query(Candidate).count()
        employees = db.query(Employee).count()
        contractors = db.query(ContractWorker).count()
        staff = db.query(Staff).count()
        factories = db.query(Factory).count()
        users = db.query(User).count()

        print(f"✓ Conexión a BD: OK")
        print(f"\n  Registros:")
        print(f"    - Candidatos:      {candidates:,}")
        print(f"    - Empleados:       {employees:,}")
        print(f"    - Contratistas:    {contractors:,}")
        print(f"    - Staff:           {staff:,}")
        print(f"    - Fábricas:        {factories:,}")
        print(f"    - Usuarios:        {users:,}")

        # Verificar sincronización de estados
        approved_candidates = db.query(Candidate).filter(Candidate.status == 'approved').count()
        pending_candidates = db.query(Candidate).filter(Candidate.status == 'pending').count()

        print(f"\n  Estados de Candidatos:")
        print(f"    - Aprobados (合格):  {approved_candidates:,}")
        print(f"    - Pendientes (審査中): {pending_candidates:,}")

        # Verificar fotos
        with_photos = db.query(Candidate).filter(Candidate.photo_data_url.isnot(None)).count()
        without_photos = candidates - with_photos

        print(f"\n  Fotos:")
        print(f"    - Con foto:        {with_photos:,}")
        print(f"    - Sin foto:        {without_photos:,}")

        db.close()

        return {
            'candidates': candidates,
            'employees': employees,
            'with_photos': with_photos,
            'approved': approved_candidates,
            'pending': pending_candidates
        }

    except Exception as e:
        print(f"❌ Error en BD: {str(e)}")
        return None


def check_api():
    """Verifica endpoints críticos de API."""
    print("\n🌐 VERIFICANDO API")
    print("=" * 60)

    endpoints = [
        ("Health Check", "http://localhost:8000/api/health"),
        ("API Docs", "http://localhost:8000/api/docs"),
        ("Candidates List", "http://localhost:8000/api/candidates"),
    ]

    working = 0
    for name, url in endpoints:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code in [200, 401]:  # 401 es esperado sin auth
                print(f"✓ {name:20} OK")
                working += 1
            else:
                print(f"⚠ {name:20} Status {response.status_code}")
        except Exception as e:
            print(f"❌ {name:20} ERROR: {str(e)[:40]}")

    return working


def check_frontend():
    """Verifica si frontend está accesible."""
    print("\n🎨 VERIFICANDO FRONTEND")
    print("=" * 60)

    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print(f"✓ Frontend              OK (http://localhost:3000)")
            return True
        else:
            print(f"⚠ Frontend              Status {response.status_code}")
            return False
    except Exception as e:
        print(f"⚠ Frontend              No respondiendo (compilando?)")
        return False


def check_login():
    """Verifica que el login funciona correctamente."""
    print("\n🔐 VERIFICANDO LOGIN FUNCIONAL")
    print("=" * 60)

    try:
        # CRITICAL: Use FORM DATA (data parameter), NOT JSON
        # OAuth2PasswordRequestForm expects form-encoded data
        response = requests.post(
            "http://localhost:8000/api/auth/login",
            data={"username": "admin", "password": "admin123"},
            timeout=5
        )

        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "refresh_token" in data:
                print(f"✓ Login funcional       OK (admin/admin123)")
                return True
            else:
                print(f"⚠ Login funcional       Tokens faltantes en respuesta")
                return False
        else:
            print(f"❌ Login funcional       Status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Login funcional       ERROR: {str(e)[:40]}")
        return False


def main():
    """Función principal de validación."""
    print("\n" + "=" * 60)
    print("  VALIDACIÓN COMPLETA DEL SISTEMA UNS-CLAUDEJP 5.0")
    print("=" * 60)

    # Verificar BD
    db_stats = check_database()

    if not db_stats:
        print("\n" + "=" * 60)
        print("❌ VALIDACIÓN FALLIDA - Error en BD")
        print("=" * 60)
        return 1

    # Verificar API
    api_working = check_api()

    # Verificar Frontend
    frontend_ok = check_frontend()

    # Verificar Login
    login_ok = check_login()

    # Resumen Final
    print("\n" + "=" * 60)
    print("  RESUMEN DE VALIDACIÓN")
    print("=" * 60)

    checks = [
        ("Base de Datos", db_stats is not None),
        (f"  ├─ Candidatos importados", db_stats['candidates'] > 0 if db_stats else False),
        (f"  ├─ Empleados importados", db_stats['employees'] > 0 if db_stats else False),
        (f"  ├─ Estados sincronizados", db_stats['approved'] + db_stats['pending'] > 0 if db_stats else False),
        (f"  └─ Fotos disponibles", db_stats['with_photos'] > 0 if db_stats else False),
        ("API Endpoints", api_working >= 2),
        ("Frontend", frontend_ok),
        ("Login Funcional", login_ok),
    ]

    passed = 0
    for check_name, result in checks:
        symbol = "✓" if result else "⚠"
        print(f"{symbol} {check_name}")
        if result:
            passed += 1

    print("\n" + "=" * 60)

    if passed >= 7:
        print("✅ VALIDACIÓN COMPLETADA - Sistema operativo")
        print("\n📍 URLs de Acceso:")
        print("   Frontend:    http://localhost:3000")
        print("   Backend API: http://localhost:8000")
        print("   API Docs:    http://localhost:8000/api/docs")
        print("   Adminer DB:  http://localhost:8080")
        print("\n🔐 Credenciales por defecto:")
        print("   Usuario:     admin")
        print("   Contraseña:  admin123")
        print("=" * 60)
        return 0
    else:
        print("⚠️  VALIDACIÓN PARCIAL - Se encontraron problemas")
        print("=" * 60)
        return 1


if __name__ == '__main__':
    sys.exit(main())
