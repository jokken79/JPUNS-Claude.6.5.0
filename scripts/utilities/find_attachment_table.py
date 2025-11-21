"""
Find the actual photo attachment table by ID
"""
import pyodbc
from pathlib import Path

db_path = Path("D:/UNS-ClaudeJP-5.4.1/BASEDATEJP/ユニバーサル企画㈱データベースv25.3.24_be.accdb")

conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={db_path};'
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

print("\n=== SEARCHING FOR PHOTO STORAGE TABLE ===\n")

# List all tables
tables = cursor.tables(tableType='TABLE').fetchall()

print(f"Total tables: {len(tables)}\n")

for table_info in tables:
    table_name = table_info[2]

    # Skip system tables
    if table_name.startswith('MSys'):
        continue

    print(f"\nChecking table: {table_name}")

    try:
        # Get columns
        cols = cursor.columns(table=table_name).fetchall()
        col_names = [col[3] for col in cols]

        print(f"  Columns ({len(col_names)}): {', '.join(col_names[:10])}")  # First 10

        # Check if table has ID field and binary columns
        has_id = any('id' in col.lower() or col.isdigit() for col in col_names)
        binary_cols = [col for col, info in zip(col_names, cols) if info[5] in [-4, -3, -2]]  # Binary types

        if binary_cols:
            print(f"  ✓ Found binary columns: {binary_cols}")

            # Check row count
            cursor.execute(f"SELECT COUNT(*) FROM [{table_name}]")
            count = cursor.fetchone()[0]
            print(f"  Total rows: {count}")

            if count > 0:
                # Get sample
                cursor.execute(f"SELECT TOP 3 * FROM [{table_name}]")
                rows = cursor.fetchall()

                for row_idx, row in enumerate(rows, 1):
                    print(f"\n  Sample row {row_idx}:")
                    for col_idx, (col_name, value) in enumerate(zip(col_names, row)):
                        if isinstance(value, bytes):
                            print(f"    {col_name}: <binary {len(value)} bytes>")
                            # Check if it's an image
                            if value.startswith(b'\xff\xd8\xff'):
                                print(f"      -> JPEG image!")
                            elif value.startswith(b'\x89PNG'):
                                print(f"      -> PNG image!")
                        elif col_idx < 5:  # Only show first 5 non-binary columns
                            print(f"    {col_name}: {value}")

    except Exception as e:
        print(f"  Error: {e}")

conn.close()
print("\nDone!")
