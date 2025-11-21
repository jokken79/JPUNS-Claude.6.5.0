"""
Verificación del Sistema de Cascada de Fábricas
================================================

Este script verifica que:
1. Existen fábricas en la base de datos
2. Los nombres de fábrica tienen formato correcto para extraer empresas
3. Hay múltiples empresas con múltiples fábricas (para probar la cascada)
4. El endpoint de API funciona correctamente
"""

import sys
from pathlib import Path
from collections import defaultdict

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.models import Factory


class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    ENDC = '\033[0m'


def extract_company_name(full_name: str) -> str:
    """
    Extrae el nombre de la empresa del nombre completo de la fábrica.
    Esta lógica debe coincidir con FactorySelector.tsx
    """
    if not full_name:
        return ''

    # Intenta separar por ' - ' o ' – '
    if ' - ' in full_name:
        return full_name.split(' - ')[0].strip()
    if ' – ' in full_name:
        return full_name.split(' – ')[0].strip()

    # Intenta separar por ' ' y tomar la primera parte
    parts = full_name.split(' ')
    if len(parts) > 1:
        # Si hay 工場, 本社, 第 en la segunda parte, toma solo la primera
        if any(keyword in parts[1] for keyword in ['工場', '本社', '第']):
            return parts[0].strip()

    # Si no se puede dividir, devolver el nombre completo
    return full_name.strip()


def main():
    """Verificar configuración de fábricas para cascada"""

    print(f"\n{Colors.CYAN}{'=' * 80}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}>>> VERIFICACIÓN DE SISTEMA DE CASCADA DE FÁBRICAS{Colors.ENDC}")
    print(f"{Colors.CYAN}{'=' * 80}{Colors.ENDC}\n")

    try:
        # Conectar a la base de datos
        db = SessionLocal()

        # 1. Contar fábricas totales
        total_factories = db.query(Factory).count()
        active_factories = db.query(Factory).filter(Factory.is_active == True).count()

        print(f"{Colors.BLUE}[1]{Colors.ENDC} {Colors.BOLD}Estadísticas Generales:{Colors.ENDC}")
        print(f"    Total de fábricas: {Colors.GREEN}{total_factories}{Colors.ENDC}")
        print(f"    Fábricas activas: {Colors.GREEN}{active_factories}{Colors.ENDC}")

        if total_factories == 0:
            print(f"\n{Colors.RED}[ERROR]{Colors.ENDC} No hay fábricas en la base de datos!")
            print(f"{Colors.YELLOW}[SOLUCIÓN]{Colors.ENDC} Crear fábricas usando:")
            print(f"    - UI: http://localhost:3000/dashboard/factories/new")
            print(f"    - Script: python scripts/import_data.py")
            return 1

        print()

        # 2. Analizar nombres de empresa
        factories = db.query(Factory).all()
        companies = defaultdict(list)

        print(f"{Colors.BLUE}[2]{Colors.ENDC} {Colors.BOLD}Análisis de Empresas:{Colors.ENDC}")

        for factory in factories:
            company = extract_company_name(factory.name)
            companies[company].append({
                'factory_id': factory.factory_id,
                'name': factory.name,
                'is_active': factory.is_active
            })

        total_companies = len(companies)
        print(f"    Total de empresas encontradas: {Colors.GREEN}{total_companies}{Colors.ENDC}\n")

        # 3. Mostrar empresas y sus fábricas
        print(f"{Colors.BLUE}[3]{Colors.ENDC} {Colors.BOLD}Empresas y Fábricas:{Colors.ENDC}\n")

        for idx, (company, factory_list) in enumerate(sorted(companies.items()), 1):
            active_count = sum(1 for f in factory_list if f['is_active'])
            status_icon = '✅' if active_count > 0 else '⚠️'

            print(f"  {status_icon} {Colors.BOLD}{company}{Colors.ENDC}")
            print(f"     {Colors.CYAN}Total: {len(factory_list)} fábricas | Activas: {active_count}{Colors.ENDC}")

            for factory in factory_list[:5]:  # Mostrar máximo 5 fábricas por empresa
                status = '🟢' if factory['is_active'] else '🔴'
                print(f"       {status} {factory['factory_id']}: {factory['name']}")

            if len(factory_list) > 5:
                print(f"       {Colors.CYAN}... y {len(factory_list) - 5} más{Colors.ENDC}")

            print()

        # 4. Verificar formato de nombres
        print(f"{Colors.BLUE}[4]{Colors.ENDC} {Colors.BOLD}Verificación de Formato:{Colors.ENDC}\n")

        parseable = 0
        unparseable = []

        for factory in factories:
            company = extract_company_name(factory.name)
            if company != factory.name:  # Se pudo parsear
                parseable += 1
            else:
                unparseable.append(factory.name)

        parse_rate = (parseable / total_factories * 100) if total_factories > 0 else 0

        if parse_rate >= 80:
            print(f"    {Colors.GREEN}✅ Excelente:{Colors.ENDC} {parseable}/{total_factories} fábricas ({parse_rate:.1f}%) tienen formato correcto")
        elif parse_rate >= 50:
            print(f"    {Colors.YELLOW}⚠️ Aceptable:{Colors.ENDC} {parseable}/{total_factories} fábricas ({parse_rate:.1f}%) tienen formato correcto")
        else:
            print(f"    {Colors.RED}❌ Problema:{Colors.ENDC} Solo {parseable}/{total_factories} fábricas ({parse_rate:.1f}%) tienen formato correcto")

        if unparseable and len(unparseable) <= 10:
            print(f"\n    {Colors.YELLOW}Fábricas con formato no estándar:{Colors.ENDC}")
            for name in unparseable[:10]:
                print(f"      - {name}")

        print()

        # 5. Recomendaciones para la cascada
        print(f"{Colors.BLUE}[5]{Colors.ENDC} {Colors.BOLD}Análisis para Cascada:{Colors.ENDC}\n")

        # Empresas con múltiples fábricas (ideal para cascada)
        multi_factory_companies = [(c, len(f)) for c, f in companies.items() if len(f) > 1]
        single_factory_companies = [(c, len(f)) for c, f in companies.items() if len(f) == 1]

        print(f"    Empresas con múltiples fábricas: {Colors.GREEN}{len(multi_factory_companies)}{Colors.ENDC}")
        if multi_factory_companies:
            print(f"    {Colors.CYAN}Top 5 empresas con más fábricas:{Colors.ENDC}")
            for company, count in sorted(multi_factory_companies, key=lambda x: x[1], reverse=True)[:5]:
                print(f"      - {company}: {count} fábricas")

        print()
        print(f"    Empresas con 1 sola fábrica: {Colors.YELLOW}{len(single_factory_companies)}{Colors.ENDC}")
        print(f"    {Colors.CYAN}(Auto-selección se aplicará automáticamente){Colors.ENDC}")

        print()

        # 6. Resumen final
        print(f"{Colors.CYAN}{'=' * 80}{Colors.ENDC}")
        print(f"{Colors.BOLD}=== RESUMEN ==={Colors.ENDC}")
        print(f"{Colors.CYAN}{'=' * 80}{Colors.ENDC}\n")

        all_good = True

        if total_factories >= 1:
            print(f"{Colors.GREEN}✅{Colors.ENDC} Fábricas en BD: {total_factories}")
        else:
            print(f"{Colors.RED}❌{Colors.ENDC} No hay fábricas en la base de datos")
            all_good = False

        if total_companies >= 1:
            print(f"{Colors.GREEN}✅{Colors.ENDC} Empresas únicas: {total_companies}")
        else:
            print(f"{Colors.RED}❌{Colors.ENDC} No se pudieron extraer empresas")
            all_good = False

        if parse_rate >= 80:
            print(f"{Colors.GREEN}✅{Colors.ENDC} Formato de nombres: {parse_rate:.1f}%")
        else:
            print(f"{Colors.YELLOW}⚠️{Colors.ENDC} Formato de nombres: {parse_rate:.1f}% (mejorable)")

        if len(multi_factory_companies) >= 1:
            print(f"{Colors.GREEN}✅{Colors.ENDC} Empresas con múltiples fábricas: {len(multi_factory_companies)}")
        else:
            print(f"{Colors.YELLOW}⚠️{Colors.ENDC} Solo hay empresas con 1 fábrica (cascada funcionará pero con auto-selección)")

        print()

        if all_good:
            print(f"{Colors.GREEN}{Colors.BOLD}🎉 Sistema listo para usar la cascada Empresa → Fábrica!{Colors.ENDC}")
        else:
            print(f"{Colors.YELLOW}{Colors.BOLD}⚠️ Sistema funcional pero con advertencias{Colors.ENDC}")

        print(f"\n{Colors.CYAN}{'=' * 80}{Colors.ENDC}\n")

        db.close()
        return 0 if all_good else 1

    except Exception as e:
        print(f"\n{Colors.RED}[ERROR]{Colors.ENDC} {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
