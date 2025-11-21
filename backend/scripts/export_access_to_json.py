"""
Export Access Database to JSON for Container Import
===================================================

This script runs on Windows host and exports all candidate data
from Access database to JSON file that can be imported in Docker container.

Usage:
    python export_access_to_json.py
"""

import pyodbc
import json
import logging
from datetime import datetime, date
from decimal import Decimal

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Access Database Configuration
ACCESS_DB_PATH = r"C:\Users\JPUNS\Desktop\ユニバーサル企画㈱データベースv25.3.24.accdb"
ACCESS_TABLE = "T_履歴書"
OUTPUT_FILE = "access_candidates_data.json"


class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder for datetime and date objects"""
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def export_to_json():
    """Export all Access data to JSON"""
    try:
        # Build connection string
        conn_str = (
            r'DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};'
            f'DBQ={ACCESS_DB_PATH};'
        )

        logger.info(f"Connecting to Access database...")
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()

        # Get all records
        query = f"SELECT * FROM [{ACCESS_TABLE}]"
        logger.info(f"Executing query: {query}")
        cursor.execute(query)

        # Get column names
        columns = [column[0] for column in cursor.description]
        logger.info(f"Found {len(columns)} columns")

        # Fetch all rows
        rows = cursor.fetchall()
        logger.info(f"Found {len(rows)} records")

        # Convert to list of dicts
        data = []
        for row in rows:
            record = {}
            for i, column in enumerate(columns):
                value = row[i]
                # Convert to JSON-serializable types
                if value is not None:
                    record[column] = value
                else:
                    record[column] = None
            data.append(record)

        # Save to JSON
        logger.info(f"Saving to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2, cls=DateTimeEncoder)

        logger.info(f"[OK] Successfully exported {len(data)} records to {OUTPUT_FILE}")

        conn.close()
        return True

    except Exception as e:
        logger.error(f"[ERROR] Export failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    export_to_json()
