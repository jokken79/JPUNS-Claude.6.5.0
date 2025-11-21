#!/usr/bin/env python3
"""
Auto-corrector de factories_index.json

Detecta y corrige automáticamente:
- TABs al inicio de factory_id o client_company
- Espacios al inicio/fin de strings
- Entradas duplicadas
- total_factories desactualizado
"""
import json
import sys
from pathlib import Path
from datetime import datetime

def fix_factories_json(dry_run=False):
    """
    Corrige automáticamente factories_index.json

    Args:
        dry_run: Si es True, solo muestra los cambios sin aplicarlos
    """
    json_path = Path('/app/config/factories_index.json')

    if not json_path.exists():
        print(f"❌ Archivo no encontrado: {json_path}")
        return False

    print("=" * 70)
    print("  AUTO-FIX: FACTORIES_INDEX.JSON")
    print("=" * 70)
    print()

    # Leer archivo
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ Error de formato JSON: {e}")
        return False

    original_count = len(data.get('factories', []))
    fixes_applied = []

    # 1. Limpiar TABs y espacios
    for idx, factory in enumerate(data['factories']):
        factory_id = factory.get('factory_id', '')
        client_company = factory.get('client_company', '')

        # Limpiar factory_id
        if factory_id != factory_id.strip():
            old_val = repr(factory_id)
            factory['factory_id'] = factory_id.strip()
            fixes_applied.append(f"[{idx:3d}] Limpiado factory_id: {old_val}")

        # Limpiar client_company
        if client_company != client_company.strip():
            old_val = repr(client_company)
            factory['client_company'] = client_company.strip()
            fixes_applied.append(f"[{idx:3d}] Limpiado client_company: {old_val}")

    # 2. Eliminar duplicados (mantener primera ocurrencia)
    seen = {}
    unique_factories = []
    duplicates_removed = []

    for idx, factory in enumerate(data['factories']):
        key = factory.get('factory_id', '')

        if key in seen:
            duplicates_removed.append(f"[{idx:3d}] Duplicado eliminado: {key} (original en [{seen[key]}])")
        else:
            seen[key] = idx
            unique_factories.append(factory)

    data['factories'] = unique_factories

    # 3. Actualizar total_factories
    new_count = len(unique_factories)
    old_total = data.get('total_factories', 0)

    if old_total != new_count:
        data['total_factories'] = new_count
        fixes_applied.append(f"total_factories actualizado: {old_total} -> {new_count}")

    # 4. Actualizar fecha
    data['last_updated'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # Mostrar resumen
    print(f"📊 Fábricas originales: {original_count}")
    print(f"📊 Fábricas finales:    {new_count}")
    print()

    if fixes_applied or duplicates_removed:
        print("🔧 CORRECCIONES APLICADAS:\n")

        if fixes_applied:
            print("  Limpieza de TABs/espacios:")
            for fix in fixes_applied[:10]:  # Mostrar máximo 10
                print(f"    {fix}")
            if len(fixes_applied) > 10:
                print(f"    ... y {len(fixes_applied) - 10} más")
            print()

        if duplicates_removed:
            print("  Duplicados eliminados:")
            for dup in duplicates_removed:
                print(f"    {dup}")
            print()

        if dry_run:
            print("⚠️  MODO DRY-RUN - Cambios NO guardados")
            print("   Ejecuta sin --dry-run para aplicar los cambios")
        else:
            # Guardar archivo corregido
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            print("✅ Cambios guardados en factories_index.json")

        print()
        return True
    else:
        print("✅ No se encontraron problemas - archivo correcto")
        print()
        return True


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Auto-corrector de factories_index.json')
    parser.add_argument('--dry-run', action='store_true',
                        help='Solo muestra los cambios sin aplicarlos')

    args = parser.parse_args()

    success = fix_factories_json(dry_run=args.dry_run)
    sys.exit(0 if success else 1)
