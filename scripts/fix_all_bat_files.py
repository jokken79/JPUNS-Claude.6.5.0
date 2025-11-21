#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
════════════════════════════════════════════════════════════════════════════
fix_all_bat_files.py
Corrección masiva de 121 bugs en 46 archivos .bat

Bug: líneas "exit /b 0" o "exit /b 1" que aparecen después de "pause"
Solución: Eliminar esas líneas "exit /b" para que las ventanas no se cierren
════════════════════════════════════════════════════════════════════════════
"""

import os
import re
import shutil
from datetime import datetime
from pathlib import Path

# ANSI color codes para output colorido
class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    WHITE = '\033[97m'
    GRAY = '\033[90m'
    RESET = '\033[0m'

def print_color(text, color):
    print(f"{color}{text}{Colors.RESET}")

def print_header():
    print()
    print_color("╔════════════════════════════════════════════════════════════════════╗", Colors.CYAN)
    print_color("║     fix_all_bat_files.py - CORRECCIÓN MASIVA DE BUGS .BAT         ║", Colors.CYAN)
    print_color("╚════════════════════════════════════════════════════════════════════╝", Colors.CYAN)
    print()

# Lista de 46 archivos con bugs
archivos_con_bugs = [
    "scripts/BACKUP.bat",
    "scripts/BACKUP_DATOS.bat",
    "scripts/BACKUP_DATOS_FUN.bat",
    "scripts/BUILD_BACKEND_FUN.bat",
    "scripts/BUILD_FRONTEND_FUN.bat",
    "scripts/BUSCAR_FOTOS_AUTO.bat",
    "scripts/BUSCAR_FOTOS_AUTO_FINAL.bat",
    "scripts/BUSCAR_FOTOS_AUTO_FIXED.bat",
    "scripts/BUSCAR_FOTOS_AUTO_WORKING.bat",
    "scripts/CREAR_RAMA_FUN.bat",
    "scripts/DIAGNOSTICO.bat",
    "scripts/EXTRAER_FOTOS.bat",
    "scripts/FIX_ADMIN_LOGIN_FUN.bat",
    "scripts/INSTALAR.bat",
    "scripts/INSTALAR_FUN.bat",
    "scripts/INSTALL_007_AGENTS.bat",
    "scripts/LIMPIAR_CACHE_FUN.bat",
    "scripts/LOGS.bat",
    "scripts/LOGS_FUN.bat",
    "scripts/MEMORY_STATS_FUN.bat",
    "scripts/PULL_CAMBIOS_FUN.bat",
    "scripts/PUSH_CAMBIOS_FUN.bat",
    "scripts/REINSTALAR.bat",
    "scripts/REINSTALAR_FUN.bat",
    "scripts/RESET_DOCKER_FUN.bat",
    "scripts/RESTAURAR_DATOS.bat",
    "scripts/RESTAURAR_DATOS_FUN.bat",
    "scripts/SETUP_NEW_PC.bat",
    "scripts/START.bat",
    "scripts/START_FUN.bat",
    "scripts/STOP.bat",
    "scripts/STOP_FUN.bat",
    "scripts/TRANSFERIR_ARCHIVOS_FALTANTES.bat",
    "scripts/VALIDATE.bat",
    "scripts/VALIDATE_DB_FUN.bat",
    "scripts/extraction/EXTRACT_PHOTOS_FROM_ACCESS.bat",
    "scripts/extraction/EXTRACT_PHOTOS_FROM_ACCESS_v2.bat",
    "scripts/git/GIT_BAJAR.bat",
    "scripts/git/GIT_SUBIR.bat",
    "scripts/utilities/CLEAN.bat",
    "scripts/utilities/LIMPIAR_CACHE_MEJORADO.bat",
    "scripts/utilities/LIMPIAR_CACHE_SIN_DOCKER.bat",
    "scripts/utilities/TEST_DOCKER_BUILD.bat",
    "scripts/utilities/UPGRADE_TO_5.0.bat",
    "scripts/utilities/VALIDAR_SISTEMA_FULL.bat",
    "scripts/windows/EXTRAER_FOTOS_ACCESS.bat"
]

def corregir_archivo(ruta_archivo):
    """
    Corrige un archivo .bat eliminando líneas 'exit /b' que aparecen después de 'pause'

    Returns:
        int: Número de bugs corregidos en el archivo
    """
    try:
        # Leer archivo con encoding UTF-8 (con BOM si existe)
        with open(ruta_archivo, 'r', encoding='utf-8-sig') as f:
            lineas = f.readlines()

        lineas_nuevas = []
        bugs_en_archivo = 0
        skip_next_line = False

        for i, linea in enumerate(lineas):
            linea_stripped = linea.strip()

            # Si la línea anterior era pause y esta es exit, saltarla
            if skip_next_line:
                # Patrón: exit /b 0  o  exit /b 1  (con espacios opcionales)
                if re.match(r'^\s*exit\s+/b\s+[01]\s*$', linea_stripped):
                    bugs_en_archivo += 1
                    skip_next_line = False
                    continue  # No agregar esta línea
                else:
                    skip_next_line = False

            # Detectar pause (sin >nul) - marcar para revisar siguiente línea
            if re.match(r'^\s*pause\s*$', linea_stripped):
                skip_next_line = True

            # Agregar línea normal
            lineas_nuevas.append(linea)

        # Guardar archivo corregido con BOM UTF-8
        with open(ruta_archivo, 'w', encoding='utf-8-sig', newline='\r\n') as f:
            f.writelines(lineas_nuevas)

        return bugs_en_archivo

    except Exception as e:
        raise Exception(f"Error procesando {ruta_archivo}: {str(e)}")

def main():
    print_header()

    # Cambiar al directorio raíz del proyecto
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    os.chdir(project_root)

    total_archivos = len(archivos_con_bugs)
    archivos_corregidos = 0
    total_bugs_eliminados = 0
    archivos_con_error = []

    print_color("📊 ANÁLISIS INICIAL:", Colors.YELLOW)
    print_color(f"   • Total de archivos a procesar: {total_archivos}", Colors.WHITE)
    print_color("   • Bugs esperados: 121 ocurrencias", Colors.WHITE)
    print()

    # Crear backup
    print_color("📦 Creando backup de archivos...", Colors.YELLOW)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = project_root / f"scripts/BACKUP_BEFORE_FIX_{timestamp}"
    backup_dir.mkdir(parents=True, exist_ok=True)
    print_color(f"   ✓ Backup creado en: {backup_dir}", Colors.GREEN)
    print()

    # Procesar cada archivo
    print_color("🔧 INICIANDO CORRECCIÓN MASIVA:", Colors.YELLOW)
    print()

    for archivo in archivos_con_bugs:
        ruta_completa = project_root / archivo

        if not ruta_completa.exists():
            print_color(f"   ⚠ SKIP: {archivo} (no existe)", Colors.YELLOW)
            continue

        # Crear backup del archivo
        nombre_archivo = ruta_completa.name
        backup_path = backup_dir / nombre_archivo
        shutil.copy2(ruta_completa, backup_path)

        try:
            bugs_en_archivo = corregir_archivo(ruta_completa)

            if bugs_en_archivo > 0:
                print(f"{Colors.GREEN}   ✓ {archivo}{Colors.RESET} - {Colors.CYAN}{bugs_en_archivo} bugs corregidos{Colors.RESET}")
                archivos_corregidos += 1
                total_bugs_eliminados += bugs_en_archivo
            else:
                print_color(f"   ○ {archivo} - sin cambios", Colors.GRAY)

        except Exception as e:
            print_color(f"   ✗ ERROR: {archivo} - {str(e)}", Colors.RED)
            archivos_con_error.append(archivo)

    print()
    print_color("╔════════════════════════════════════════════════════════════════════╗", Colors.GREEN)
    print_color("║                   ✓ CORRECCIÓN COMPLETADA                         ║", Colors.GREEN)
    print_color("╚════════════════════════════════════════════════════════════════════╝", Colors.GREEN)
    print()

    print_color("📊 RESUMEN FINAL:", Colors.YELLOW)
    print_color(f"   • Archivos procesados:    {total_archivos}", Colors.WHITE)
    print_color(f"   • Archivos corregidos:    {archivos_corregidos}", Colors.GREEN)
    print_color(f"   • Total bugs eliminados:  {total_bugs_eliminados}", Colors.CYAN)

    if archivos_con_error:
        print_color(f"   • Archivos con errores:   {len(archivos_con_error)}", Colors.RED)
    else:
        print_color(f"   • Archivos con errores:   0", Colors.GREEN)
    print()

    if archivos_con_error:
        print_color("⚠ ARCHIVOS CON ERRORES:", Colors.RED)
        for archivo_error in archivos_con_error:
            print_color(f"   • {archivo_error}", Colors.RED)
        print()

    print_color("💾 BACKUP DISPONIBLE EN:", Colors.YELLOW)
    print_color(f"   {backup_dir}", Colors.WHITE)
    print()

    print_color("✅ Ahora todos los archivos .bat cumplirán la regla:", Colors.GREEN)
    print_color("   'MUST ALWAYS stay open to show errors'", Colors.WHITE)
    print()

if __name__ == "__main__":
    main()
