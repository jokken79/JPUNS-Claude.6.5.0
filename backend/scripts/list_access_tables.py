"""
List all tables in Access database to find photo-related tables
"""
import pyodbc
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

project_root = Path(__file__).parent.parent.parent
db_path = project_root / "BASEDATEJP" / "ユニバーサル企画㈱データベースv25.3.24_be.accdb"

conn_str = r'DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};' + f'DBQ={db_path};'

logger.info("Connecting to Access database...")
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

# List all tables
logger.info("\nAll tables in database:")
logger.info("=" * 80)

tables = []
for table_info in cursor.tables(tableType='TABLE'):
    table_name = table_info.table_name
    if not table_name.startswith('MSys'):  # Skip system tables
        tables.append(table_name)
        logger.info(f"  - {table_name}")

logger.info(f"\nTotal: {len(tables)} tables")

# Look for tables with 'photo', 'image', '写真', or 'attachment' in name
photo_tables = [t for t in tables if any(x in t.lower() for x in ['photo', 'image', '写真', 'attach', 'picture', 'file'])]

if photo_tables:
    logger.info("\nPotential photo-related tables:")
    logger.info("=" * 80)
    for table in photo_tables:
        logger.info(f"  - {table}")

        # Get column info
        cursor.execute(f"SELECT TOP 1 * FROM [{table}]")
        columns = [desc[0] for desc in cursor.description]
        logger.info(f"    Columns: {', '.join(columns)}")

conn.close()
logger.info("\n" + "=" * 80)
