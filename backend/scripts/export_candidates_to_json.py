"""
🔄 Exportador de Candidatos desde Access a JSON
================================================

Este script exporta la tabla T_履歴書 (candidatos) desde la base de datos Access
a archivos JSON que pueden ser importados por Docker.

Características:
- 📂 Busca automáticamente el archivo .accdb en base-datos/
- 📊 Muestra progreso con barra bonita
- 💾 Exporta a JSON optimizado para Docker
- 🖼️ Extrae fotos como Base64
- ✅ Validación de datos

Requisitos:
- Windows con Python 3.11+
- pyodbc instalado: pip install pyodbc
- Microsoft Access Database Engine instalado

Usage:
    python export_candidates_to_json.py
"""

import sys
import os
import json
from pathlib import Path
from datetime import datetime, date
import time

try:
    import pyodbc
    PYODBC_AVAILABLE = True
except ImportError:
    PYODBC_AVAILABLE = False

# ANSI color codes para Windows
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_banner():
    """Imprime banner bonito"""
    print(f"\n{Colors.CYAN}{'=' * 80}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.HEADER}>>> EXPORTADOR DE CANDIDATOS - Access -> JSON{Colors.ENDC}")
    print(f"{Colors.CYAN}{'=' * 80}{Colors.ENDC}\n")

def print_step(step_num, total_steps, message):
    """Imprime paso con formato bonito"""
    print(f"{Colors.BOLD}[Paso {step_num}/{total_steps}]{Colors.ENDC} {message}")

def print_success(message):
    """Imprime mensaje de éxito"""
    print(f"{Colors.GREEN}[OK] {message}{Colors.ENDC}")

def print_error(message):
    """Imprime mensaje de error"""
    print(f"{Colors.RED}[ERROR] {message}{Colors.ENDC}")

def print_warning(message):
    """Imprime advertencia"""
    print(f"{Colors.YELLOW}[AVISO] {message}{Colors.ENDC}")

def print_info(message):
    """Imprime información"""
    print(f"{Colors.BLUE}[INFO] {message}{Colors.ENDC}")

def find_access_database():
    """Busca el archivo .accdb en base-datos"""
    print_step(1, 5, "Buscando base de datos Access...")

    # Ruta base del proyecto
    project_root = Path(__file__).parent.parent.parent
    basedatejp = project_root / "base-datos"

    if not basedatejp.exists():
        print_error(f"Carpeta base-datos no encontrada: {basedatejp}")
        return None

    # Buscar archivos .accdb
    accdb_files = list(basedatejp.glob("*.accdb"))

    if not accdb_files:
        print_error("No se encontraron archivos .accdb en base-datos/")
        return None

    # Preferir el archivo específico
    target_name = "ユニバーサル企画㈱データベースv25.3.24.accdb"
    for file in accdb_files:
        if file.name == target_name:
            size_mb = file.stat().st_size / (1024 * 1024)
            print_success(f"Base de datos encontrada: {file.name}")
            print_info(f"Tamano: {size_mb:.1f} MB")
            return file

    # Si no se encuentra el específico, usar el primero
    file = accdb_files[0]
    size_mb = file.stat().st_size / (1024 * 1024)
    print_warning(f"Usando: {file.name}")
    print_info(f"Tamano: {size_mb:.1f} MB")
    return file

def connect_to_access(db_path):
    """Conecta a la base de datos Access"""
    print_step(2, 5, "Conectando a Access...")

    if not PYODBC_AVAILABLE:
        print_error("pyodbc no esta instalado")
        print_info("Instalar con: pip install pyodbc")
        return None

    try:
        conn_str = (
            r'DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};'
            f'DBQ={db_path};'
        )
        conn = pyodbc.connect(conn_str)
        print_success("Conexion establecida")
        return conn
    except Exception as e:
        print_error(f"Error al conectar: {e}")
        print_info("Asegurate de tener instalado Microsoft Access Database Engine")
        print_info("Descarga: https://www.microsoft.com/en-us/download/details.aspx?id=54920")
        return None

def export_candidates(conn, output_file):
    """Exporta candidatos a JSON"""
    print_step(3, 5, "Exportando candidatos...")

    cursor = conn.cursor()

    # Obtener total de registros
    cursor.execute("SELECT COUNT(*) FROM T_履歴書")
    total = cursor.fetchone()[0]
    print_info(f"Total de candidatos: {total}")

    # Obtener datos
    cursor.execute("SELECT * FROM T_履歴書")
    columns = [column[0] for column in cursor.description]

    candidates = []
    print_info("Exportando registros...")

    for i, row in enumerate(cursor.fetchall(), 1):
        # Convertir row a dict
        candidate = {}
        for col_name, value in zip(columns, row):
            # Convertir tipos especiales a string/serializable
            if isinstance(value, (datetime, date)):
                candidate[col_name] = value.isoformat()
            elif isinstance(value, bytes):
                # Fotos como base64
                import base64
                candidate[col_name] = base64.b64encode(value).decode('utf-8')
            elif value is None:
                candidate[col_name] = None
            else:
                candidate[col_name] = str(value)

        candidates.append(candidate)

        # Mostrar progreso cada 100 registros
        if i % 100 == 0 or i == total:
            progress = (i / total) * 100
            bar_length = 40
            filled = int(bar_length * i / total)
            bar = '#' * filled + '-' * (bar_length - filled)
            print(f"\r{Colors.CYAN}[{bar}]{Colors.ENDC} {progress:.1f}% ({i}/{total})", end='', flush=True)

    print()  # Nueva línea después de la barra de progreso
    print_success(f"Exportados {len(candidates)} candidatos")

    return candidates, columns

def save_to_json(candidates, columns, output_file):
    """Guarda datos a JSON"""
    print_step(4, 5, "Guardando a JSON...")

    output_data = {
        'metadata': {
            'exported_at': datetime.now().isoformat(),
            'total_records': len(candidates),
            'columns': columns,
            'source_table': 'T_履歴書'
        },
        'candidates': candidates
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    size_mb = Path(output_file).stat().st_size / (1024 * 1024)
    print_success(f"Archivo guardado: {output_file}")
    print_info(f"Tamano: {size_mb:.1f} MB")

def generate_summary(candidates, output_file):
    """Genera resumen de la exportación"""
    print_step(5, 5, "Generando resumen...")

    print(f"\n{Colors.CYAN}{'=' * 80}{Colors.ENDC}")
    print(f"{Colors.BOLD}=== RESUMEN DE EXPORTACION ==={Colors.ENDC}")
    print(f"{Colors.CYAN}{'=' * 80}{Colors.ENDC}\n")

    print(f"{Colors.BOLD}Total candidatos exportados:{Colors.ENDC} {len(candidates)}")
    print(f"{Colors.BOLD}Archivo generado:{Colors.ENDC} {output_file}")
    print(f"{Colors.BOLD}Fecha/Hora:{Colors.ENDC} {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Contar candidatos con foto
    with_photo = sum(1 for c in candidates if c.get('写真'))
    print(f"{Colors.BOLD}Con foto:{Colors.ENDC} {with_photo} ({with_photo/len(candidates)*100:.1f}%)")

    print(f"\n{Colors.GREEN}[OK] Exportacion completada exitosamente{Colors.ENDC}\n")
    print(f"{Colors.CYAN}{'=' * 80}{Colors.ENDC}\n")

def main():
    """Función principal"""
    print_banner()

    # Buscar base de datos
    db_path = find_access_database()
    if not db_path:
        return 1

    # Conectar
    conn = connect_to_access(db_path)
    if not conn:
        return 1

    try:
        # Definir archivo de salida
        project_root = Path(__file__).parent.parent.parent
        output_file = project_root / "config" / "access_candidates_data.json"
        output_file.parent.mkdir(exist_ok=True)

        # Exportar
        candidates, columns = export_candidates(conn, output_file)

        # Guardar
        save_to_json(candidates, columns, output_file)

        # Resumen
        generate_summary(candidates, output_file)

        return 0

    except Exception as e:
        print_error(f"Error durante la exportacion: {e}")
        import traceback
        traceback.print_exc()
        return 1

    finally:
        conn.close()
        print_info("Conexion cerrada")

if __name__ == "__main__":
    start_time = time.time()
    exit_code = main()
    elapsed = time.time() - start_time
    print(f"{Colors.BLUE}[TIEMPO] Tiempo total: {elapsed:.1f} segundos{Colors.ENDC}\n")
    sys.exit(exit_code)
