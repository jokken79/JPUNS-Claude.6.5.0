#!/usr/bin/env python3
"""
Valida factories_index.json para detectar problemas comunes:
- TABs al inicio de factory_id
- Espacios al inicio/fin
- Entradas duplicadas
- Formato de factory_id incorrecto
"""
import json
import sys
import re
from pathlib import Path

def validate_factories_json():
    """Valida factories_index.json para detectar problemas"""

    json_path = Path('/app/config/factories_index.json')

    if not json_path.exists():
        print(f"❌ Archivo no encontrado: {json_path}")
        return False

    print("=" * 70)
    print("  VALIDACIÓN DE FACTORIES_INDEX.JSON")
    print("=" * 70)
    print()

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            content = f.read()
            data = json.loads(content)
    except json.JSONDecodeError as e:
        print(f"❌ Error de formato JSON: {e}")
        return False

    issues = []
    warnings = []

    total_factories = len(data.get('factories', []))
    print(f"📊 Total de fábricas en JSON: {total_factories}\n")

    # Validaciones
    for idx, factory in enumerate(data['factories']):
        factory_id = factory.get('factory_id', '')
        client_company = factory.get('client_company', '')
        plant_name = factory.get('plant_name', '')

        # 1. Verificar TABs
        if '\t' in factory_id:
            issues.append({
                'index': idx,
                'type': 'TAB_IN_FACTORY_ID',
                'message': f"TAB encontrado en factory_id",
                'value': repr(factory_id)
            })

        if '\t' in client_company:
            issues.append({
                'index': idx,
                'type': 'TAB_IN_COMPANY',
                'message': f"TAB encontrado en client_company",
                'value': repr(client_company)
            })

        # 2. Verificar espacios al inicio/fin
        if factory_id != factory_id.strip():
            issues.append({
                'index': idx,
                'type': 'WHITESPACE',
                'message': f"Espacios al inicio/fin en factory_id",
                'value': repr(factory_id)
            })

        # 3. Verificar formato de factory_id (debe ser Company__Plant)
        if factory_id and '__' not in factory_id:
            warnings.append({
                'index': idx,
                'type': 'FORMAT',
                'message': f"factory_id no tiene formato Company__Plant",
                'value': factory_id
            })

        # 4. Verificar campos vacíos
        if not factory_id:
            issues.append({
                'index': idx,
                'type': 'EMPTY_FIELD',
                'message': "factory_id está vacío"
            })

    # 5. Detectar duplicados
    seen = {}
    for idx, factory in enumerate(data['factories']):
        key = factory.get('factory_id', '')
        if key in seen:
            issues.append({
                'index': idx,
                'type': 'DUPLICATE',
                'message': f"DUPLICADO de fábrica #{seen[key]}",
                'value': key
            })
        else:
            seen[key] = idx

    # Mostrar resultados
    print("─" * 70)
    print("  RESULTADOS DE VALIDACIÓN")
    print("─" * 70)
    print()

    if issues:
        print(f"❌ PROBLEMAS CRÍTICOS ENCONTRADOS: {len(issues)}\n")
        for issue in issues:
            idx = issue['index']
            print(f"  [{idx:3d}] {issue['type']}")
            print(f"        {issue['message']}")
            if 'value' in issue:
                print(f"        Valor: {issue['value']}")
            print()
    else:
        print("✅ Sin problemas críticos\n")

    if warnings:
        print(f"⚠️  ADVERTENCIAS: {len(warnings)}\n")
        for warning in warnings:
            idx = warning['index']
            print(f"  [{idx:3d}] {warning['type']}")
            print(f"        {warning['message']}")
            if 'value' in warning:
                print(f"        Valor: {warning['value']}")
            print()
    else:
        print("✅ Sin advertencias\n")

    print("=" * 70)

    if issues:
        print("\n🔧 ACCIÓN REQUERIDA:")
        print("   Corrige los problemas en config/factories_index.json")
        print()
        return False
    else:
        print("\n✅ factories_index.json VÁLIDO - sin problemas críticos")
        print()
        return True


if __name__ == '__main__':
    success = validate_factories_json()
    sys.exit(0 if success else 1)
