#!/usr/bin/env python3
"""
Extrae candidatos REALES desde la base de datos Access
y los importa a PostgreSQL con fotos
"""

import sys
import os
import json
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Find Access database
def find_access_database():
    """Busca el archivo .accdb en varias ubicaciones"""
    search_paths = [
        Path("D:/UNS-ClaudeJP-6.0.0/BASEDATEJP"),
        Path("./BASEDATEJP"),
        Path("../BASEDATEJP"),
        Path("D:/BASEDATEJP"),
    ]

    for base_path in search_paths:
        if base_path.exists():
            for accdb_file in base_path.glob("*.accdb"):
                logger.info(f"Found Access database: {accdb_file}")
                return str(accdb_file)

    logger.error("No Access database found!")
    return None

def extract_from_access():
    """Extrae candidatos desde Access database"""
    try:
        import pyodbc
    except ImportError:
        logger.error("pyodbc no está instalado. Install with: pip install pyodbc")
        logger.info("Attempting alternative approach with pandas...")
        return extract_with_pandas()

    db_path = find_access_database()
    if not db_path:
        return None

    logger.info(f"Connecting to: {db_path}")

    try:
        conn_str = f'Driver={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={db_path};'
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()

        # Obtener tabla de candidatos (T_履歴書)
        cursor.execute("SELECT * FROM T_履歴書")

        columns = [description[0] for description in cursor.description]
        candidates = []

        for row in cursor.fetchall():
            candidate_dict = dict(zip(columns, row))
            candidates.append(candidate_dict)

        conn.close()

        logger.info(f"Extracted {len(candidates)} candidates")
        return candidates

    except Exception as e:
        logger.error(f"Error: {e}")
        return None

def extract_with_pandas():
    """Alternativa usando pandas + openpyxl para Excel si es necesario"""
    try:
        import pandas as pd

        db_path = find_access_database()
        if not db_path:
            return None

        logger.info("Using pandas to read Access database...")

        # Intenta con pandas
        table_name = 'T_履歴書'
        df = pd.read_table(db_path, table_name=table_name)

        candidates = df.to_dict('records')
        logger.info(f"Extracted {len(candidates)} candidates")
        return candidates

    except Exception as e:
        logger.error(f"Error with pandas: {e}")
        return None

def save_candidates_json(candidates):
    """Guarda candidatos en JSON para importación posterior"""
    if not candidates:
        logger.warning("No candidates to save")
        return None

    output_file = Path("D:/UNS-ClaudeJP-6.0.0/config/access_candidates_data.json")
    output_file.parent.mkdir(parents=True, exist_ok=True)

    try:
        # Convertir a serializable
        for candidate in candidates:
            for key, value in candidate.items():
                if hasattr(value, 'isoformat'):  # datetime
                    candidate[key] = value.isoformat()

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(candidates, f, ensure_ascii=False, indent=2)

        logger.info(f"Saved candidates to: {output_file}")
        logger.info(f"Total: {len(candidates)} candidates")
        return str(output_file)

    except Exception as e:
        logger.error(f"Error saving JSON: {e}")
        return None

if __name__ == "__main__":
    logger.info("="*80)
    logger.info("EXTRAYENDO CANDIDATOS REALES DESDE ACCESS")
    logger.info("="*80)

    candidates = extract_from_access()
    if candidates:
        output = save_candidates_json(candidates)
        if output:
            logger.info(f"\n✓ SUCCESS: Saved {len(candidates)} candidates")
            logger.info(f"File: {output}")
    else:
        logger.error("Failed to extract candidates")
        sys.exit(1)
