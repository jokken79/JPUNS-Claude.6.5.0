"""
Test de validación de imports
Este test verifica que todos los módulos se pueden importar correctamente
PREVIENE: ModuleNotFoundError en producción
"""

import pytest
import importlib
import sys
from pathlib import Path

# Agregar el directorio app al path para imports absolutos
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))


def test_all_api_routers_import():
    """
    Verifica que todos los routers API se pueden importar sin errores
    Este test FALLARÍA si hay imports incorrectos como el de pages.py
    """
    api_modules = [
        "app.api.auth",
        "app.api.candidates",
        "app.api.employees",
        "app.api.factories",
        "app.api.timer_cards",
        "app.api.salary",
        "app.api.requests",
        "app.api.dashboard",
        "app.api.database",
        "app.api.azure_ocr",
        "app.api.import_export",
        "app.api.monitoring",
        "app.api.notifications",
        "app.api.reports",
        "app.api.settings",
        "app.api.pages",  # ← Este es el que falló
    ]

    errors = []

    for module_name in api_modules:
        try:
            module = importlib.import_module(module_name)
            # Verificar que el router existe
            assert hasattr(module, 'router'), f"{module_name} no tiene 'router'"
        except Exception as e:
            errors.append(f"{module_name}: {str(e)}")

    if errors:
        pytest.fail(f"Errores al importar módulos:\n" + "\n".join(errors))


def test_core_modules_import():
    """
    Verifica que todos los módulos core se pueden importar
    """
    core_modules = [
        "app.core.config",
        "app.core.database",
        "app.core.logging",
        "app.core.middleware",
        "app.core.observability",
    ]

    errors = []

    for module_name in core_modules:
        try:
            importlib.import_module(module_name)
        except Exception as e:
            errors.append(f"{module_name}: {str(e)}")

    if errors:
        pytest.fail(f"Errores al importar módulos core:\n" + "\n".join(errors))


def test_main_app_imports():
    """
    Verifica que app.main se puede importar (esto valida TODOS los imports)
    """
    try:
        import app.main
        assert app.main.app is not None
    except Exception as e:
        pytest.fail(f"Error al importar app.main: {str(e)}")


def test_get_current_user_location():
    """
    Verifica que get_current_user está en la ubicación correcta
    PREVIENE: Futuros errores de import de get_current_user
    """
    from app.api.auth import get_current_user

    # Verificar que la función existe y es callable
    assert callable(get_current_user)


if __name__ == "__main__":
    # Permite ejecutar directamente: python tests/test_imports.py
    pytest.main([__file__, "-v"])
