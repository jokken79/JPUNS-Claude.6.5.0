#!/usr/bin/env python3
"""
Sistema de Verificación de Integridad UNS-ClaudeJP 5.2
Verifica que todas las modificaciones del sistema estén aplicadas correctamente
Específicamente verifica la actualización de 100% cobertura de campos de candidatos
"""

import sys
import os
from pathlib import Path
from datetime import datetime

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import engine
from app.models.models import Candidate
import sqlalchemy as sa
from sqlalchemy import inspect


# ANSI color codes for terminal
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


def print_header(text):
    """Print section header"""
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'=' * 80}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{text:^80}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'=' * 80}{Colors.END}\n")


def print_success(text):
    """Print success message"""
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")


def print_warning(text):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")


def print_error(text):
    """Print error message"""
    print(f"{Colors.RED}✗ {text}{Colors.END}")


def print_info(text):
    """Print info message"""
    print(f"  {text}")


def verify_database_schema():
    """Verify database schema has all required columns"""
    print_header("VERIFICACIÓN DE ESQUEMA DE BASE DE DATOS")

    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('candidates')]

    print_info(f"Total de columnas en tabla candidates: {len(columns)}")

    # Expected new columns from migration b6dc75dfbe7c
    expected_new_columns = {
        'family_dependent_1': 'Dependiente familiar 1',
        'family_dependent_2': 'Dependiente familiar 2',
        'family_dependent_3': 'Dependiente familiar 3',
        'family_dependent_4': 'Dependiente familiar 4',
        'family_dependent_5': 'Dependiente familiar 5',
        'height': 'Altura (身長)',
        'weight': 'Peso (体重)',
        'clothing_size': 'Talla de ropa (服のサイズ)',
        'waist': 'Cintura (ウエスト)',
        'shoe_size': 'Talla de zapatos (靴サイズ)',
        'vision_right': 'Visión ojo derecho (視力右)',
        'vision_left': 'Visión ojo izquierdo (視力左)',
    }

    missing_columns = []
    for col_name, description in expected_new_columns.items():
        if col_name in columns:
            print_success(f"{description}: {col_name}")
        else:
            print_error(f"{description}: {col_name} - FALTA")
            missing_columns.append(col_name)

    if len(columns) >= 142:
        print_success(f"Columnas totales: {len(columns)} (esperadas: 142)")
    else:
        print_warning(f"Columnas totales: {len(columns)} (esperadas: 142)")

    return len(missing_columns) == 0 and len(columns) >= 142


def verify_migration_status():
    """Verify Alembic migration status"""
    print_header("VERIFICACIÓN DE MIGRACIONES ALEMBIC")

    try:
        from alembic.config import Config
        from alembic.script import ScriptDirectory
        from alembic.runtime.migration import MigrationContext

        # Get current revision
        with engine.connect() as connection:
            context = MigrationContext.configure(connection)
            current_rev = context.get_current_revision()

        print_info(f"Revisión actual: {current_rev}")

        # Expected latest revision
        expected_rev = 'b6dc75dfbe7c'

        if current_rev == expected_rev:
            print_success(f"Migración más reciente aplicada: {expected_rev}")
            return True
        else:
            print_warning(f"Migración esperada: {expected_rev}, actual: {current_rev}")
            print_info("Ejecuta: docker exec uns-claudejp-backend alembic upgrade head")
            return False

    except Exception as e:
        print_error(f"Error al verificar migraciones: {str(e)}")
        return False


def verify_import_script():
    """Verify import script exists and is the correct version"""
    print_header("VERIFICACIÓN DE SCRIPT DE IMPORTACIÓN")

    script_path = Path(__file__).parent / 'import_candidates_improved.py'

    if not script_path.exists():
        print_error(f"Script no encontrado: {script_path}")
        return False

    print_success(f"Script encontrado: {script_path.name}")

    # Check for key features in the script
    content = script_path.read_text(encoding='utf-8')

    features = {
        'normalize_percentage': 'Función de normalización de porcentajes',
        'parse_float': 'Función de parseo seguro de floats',
        'parse_bool': 'Función de parseo de booleanos japoneses',
        '身長': 'Mapeo de campo altura',
        '体重': 'Mapeo de campo peso',
        'family_dependent': 'Mapeo de dependientes familiares',
        'vision_right': 'Mapeo de visión ojo derecho',
    }

    all_features_found = True
    for feature, description in features.items():
        if feature in content:
            print_success(f"{description}")
        else:
            print_error(f"{description} - NO ENCONTRADO")
            all_features_found = False

    return all_features_found


def verify_docker_compose():
    """Verify docker-compose.yml has correct configuration"""
    print_header("VERIFICACIÓN DE DOCKER-COMPOSE.YML")

    compose_path = Path(__file__).parent.parent.parent / 'docker-compose.yml'

    if not compose_path.exists():
        print_error(f"Archivo no encontrado: {compose_path}")
        return False

    print_success(f"Archivo encontrado: {compose_path.name}")

    content = compose_path.read_text(encoding='utf-8')

    checks = {
        'alembic upgrade head': 'Aplicación automática de migraciones',
        'import_candidates_improved.py': 'Uso del script de importación mejorado',
        '100% Field Mapping': 'Mensaje de cobertura 100%',
    }

    all_checks_passed = True
    for check, description in checks.items():
        if check in content:
            print_success(f"{description}")
        else:
            print_error(f"{description} - NO ENCONTRADO")
            all_checks_passed = False

    return all_checks_passed


def verify_data_import():
    """Verify data has been imported successfully"""
    print_header("VERIFICACIÓN DE DATOS IMPORTADOS")

    try:
        from app.core.database import SessionLocal
        from app.models.models import Candidate, Employee, Factory

        db = SessionLocal()

        candidate_count = db.query(Candidate).count()
        employee_count = db.query(Employee).count()
        factory_count = db.query(Factory).count()

        print_info(f"Candidatos en base de datos: {candidate_count}")
        print_info(f"Empleados en base de datos: {employee_count}")
        print_info(f"Fábricas en base de datos: {factory_count}")

        if candidate_count > 0:
            print_success(f"Candidatos importados: {candidate_count}")
        else:
            print_warning("No hay candidatos importados")

        # Check if new fields have data
        candidates_with_height = db.query(Candidate).filter(Candidate.height.isnot(None)).count()
        candidates_with_weight = db.query(Candidate).filter(Candidate.weight.isnot(None)).count()

        if candidates_with_height > 0:
            print_success(f"Candidatos con altura (新): {candidates_with_height}")
        else:
            print_info("No hay candidatos con datos de altura aún")

        if candidates_with_weight > 0:
            print_success(f"Candidatos con peso (新): {candidates_with_weight}")
        else:
            print_info("No hay candidatos con datos de peso aún")

        db.close()
        return candidate_count > 0

    except Exception as e:
        print_error(f"Error al verificar datos: {str(e)}")
        return False


def generate_report():
    """Generate comprehensive system integrity report"""
    print_header("REPORTE DE INTEGRIDAD DEL SISTEMA")

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print_info(f"Fecha y hora: {timestamp}")
    print_info(f"Sistema: UNS-ClaudeJP 5.2")
    print_info(f"Actualización: Cobertura 100% campos de candidatos")
    print()

    # Run all verifications
    results = {
        'Esquema de Base de Datos': verify_database_schema(),
        'Estado de Migraciones': verify_migration_status(),
        'Script de Importación': verify_import_script(),
        'Configuración Docker': verify_docker_compose(),
        'Datos Importados': verify_data_import(),
    }

    # Summary
    print_header("RESUMEN DE VERIFICACIÓN")

    total_checks = len(results)
    passed_checks = sum(1 for v in results.values() if v)

    for check_name, result in results.items():
        if result:
            print_success(f"{check_name}: PASS")
        else:
            print_error(f"{check_name}: FAIL")

    print()
    print_info(f"Verificaciones pasadas: {passed_checks}/{total_checks}")

    if passed_checks == total_checks:
        print_success("✓ SISTEMA COMPLETAMENTE ÍNTEGRO - TODAS LAS VERIFICACIONES PASARON")
        return 0
    elif passed_checks >= total_checks * 0.8:
        print_warning("⚠ SISTEMA MAYORMENTE ÍNTEGRO - ALGUNAS VERIFICACIONES FALLARON")
        return 1
    else:
        print_error("✗ SISTEMA REQUIERE ATENCIÓN - MÚLTIPLES VERIFICACIONES FALLARON")
        return 2


def main():
    """Main entry point"""
    print()
    print(f"{Colors.BOLD}UNS-ClaudeJP 5.2 - Verificación de Integridad del Sistema{Colors.END}")
    print(f"{Colors.BOLD}Actualización: 100% Cobertura de Campos de Candidatos{Colors.END}")

    exit_code = generate_report()

    print()
    print(f"{Colors.BOLD}Verificación completada.{Colors.END}")
    print()

    sys.exit(exit_code)


if __name__ == '__main__':
    main()
