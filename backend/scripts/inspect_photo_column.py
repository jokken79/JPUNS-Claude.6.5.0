"""
Inspect the photo column in Access database to understand its format
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

# Get sample photo data
cursor.execute("SELECT TOP 5 履歴書ID, 氏名, 写真 FROM T_履歴書 WHERE 写真 IS NOT NULL")

rows = cursor.fetchall()

logger.info(f"\nFound {len(rows)} sample records with photos")
logger.info("=" * 80)

for idx, row in enumerate(rows, 1):
    rirekisho_id = row[0]
    name = row[1]
    photo_data = row[2]

    logger.info(f"\nRecord {idx}:")
    logger.info(f"  ID: {rirekisho_id}")
    logger.info(f"  Name: {name}")
    logger.info(f"  Photo data type: {type(photo_data)}")
    logger.info(f"  Photo data length: {len(photo_data) if photo_data else 0}")

    if isinstance(photo_data, str):
        logger.info(f"  Photo value (string): {photo_data[:200]}")
    elif isinstance(photo_data, bytes):
        logger.info(f"  Photo first 50 bytes (hex): {photo_data[:50].hex()}")
        logger.info(f"  Photo first 50 bytes (repr): {repr(photo_data[:50])}")
    else:
        logger.info(f"  Photo value: {photo_data}")

conn.close()
logger.info("\n" + "=" * 80)
