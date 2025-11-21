"""
Analyze Table Structure to Find Photo Column

This script analyzes the T_履歴書 table structure to identify the photo column.
"""

import sys
import os
import logging
from datetime import datetime
from pathlib import Path

# Configure logging
log_file = f'analyze_table_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def main():
    """Analyze table structure"""
    
    logger.info("=" * 80)
    logger.info("ANALYZING TABLE STRUCTURE")
    logger.info("=" * 80)
    
    try:
        import pyodbc
    except ImportError:
        logger.error("pyodbc not installed!")
        return 1
    
    # Database path
    db_path = Path("BASEDATEJP/ユニバーサル企画㈱データベースv25.3.24_be.accdb")
    if not db_path.exists():
        logger.error(f"Database not found: {db_path}")
        return 1
    
    # Connect
    conn_str = f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={db_path};"
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    # Get table info
    table_name = "T_履歴書"
    logger.info(f"Analyzing table: {table_name}")
    
    # Get all columns with detailed info
    columns = cursor.columns(table=table_name).fetchall()
    logger.info(f"Found {len(columns)} columns")
    
    # Analyze each column
    for i, col_info in enumerate(columns, 1):
        col_name = col_info[2]
        col_type = col_info[3]  # Data type
        col_size = col_info[6]  # Column size
        nullable = col_info[10]  # Nullable
        
        logger.info(f"{i:3d}. Column: {col_name}")
        logger.info(f"     Type: {col_type} (Size: {col_size}, Nullable: {nullable})")
        
        # Check for photo-related keywords
        photo_keywords = ["写真", "Photo", "photo", "IMAGE", "Image", "画像", "OLE", "OBJECT"]
        for keyword in photo_keywords:
            if keyword.lower() in col_name.lower():
                logger.info(f"     *** POTENTIAL PHOTO COLUMN (contains '{keyword}') ***")
        
        # Check for binary/OLE types
        binary_types = [-155, -4, -3, -2, -1, -11, -10]  # Various binary/blob types
        if col_type in binary_types:
            logger.info(f"     *** BINARY/OLE TYPE (type: {col_type}) ***")
        
        logger.info("")
    
    # Sample some data to see what's in each column
    logger.info("Sampling data from first few records...")
    
    query = f"SELECT TOP 3 * FROM [{table_name}]"
    cursor.execute(query)
    
    rows = cursor.fetchall()
    column_names = [desc[0] for desc in cursor.description]
    
    for row_idx, row in enumerate(rows, 1):
        logger.info(f"\n--- Record {row_idx} ---")
        for col_idx, (col_name, value) in enumerate(zip(column_names, row)):
            if value is not None:
                # Check if it's binary data
                if isinstance(value, bytes):
                    logger.info(f"{col_name}: <BINARY DATA {len(value)} bytes>")
                    # Check if it looks like image data
                    if len(value) > 100:
                        # Check for common image signatures
                        if value.startswith(b'\xFF\xD8\xFF'):  # JPEG
                            logger.info(f"  *** LIKELY JPEG IMAGE ***")
                        elif value.startswith(b'\x89PNG\r\n\x1a\n'):  # PNG
                            logger.info(f"  *** LIKELY PNG IMAGE ***")
                        elif value.startswith(b'BM'):  # BMP
                            logger.info(f"  *** LIKELY BMP IMAGE ***")
                        else:
                            # Show first few bytes
                            preview = value[:20].hex()
                            logger.info(f"  First bytes: {preview}")
                elif isinstance(value, str) and len(value) > 100:
                    logger.info(f"{col_name}: <LONG TEXT {len(value)} chars>")
                    # Show first few characters
                    preview = value[:50].replace('\n', '\\n').replace('\r', '\\r')
                    logger.info(f"  Preview: {preview}...")
                else:
                    logger.info(f"{col_name}: {value}")
            else:
                logger.info(f"{col_name}: <NULL>")
    
    conn.close()
    
    logger.info("\n" + "=" * 80)
    logger.info("ANALYSIS COMPLETE")
    logger.info("=" * 80)
    
    return 0

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)