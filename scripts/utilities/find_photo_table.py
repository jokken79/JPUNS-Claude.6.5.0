"""
Find which table contains the actual photo binary data
"""
import pyodbc
from pathlib import Path

db_path = Path("D:/UNS-ClaudeJP-5.4.1/BASEDATEJP/ユニバーサル企画㈱データベースv25.3.24_be.accdb")

conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={db_path};'
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

print("\n=== SEARCHING FOR PHOTO DATA ===\n")

tables = cursor.tables(tableType='TABLE').fetchall()

for table_info in tables:
    table_name = table_info[2]

    # Skip system tables
    if table_name.startswith('MSys'):
        continue

    try:
        # Get columns for this table
        cols = cursor.columns(table=table_name).fetchall()

        # Look for binary or large text columns
        for col_info in cols:
            col_name = col_info[3]
            col_type = col_info[5]  # SQL type
            col_type_name = col_info[6]  # Type name

            # Check if this could be a photo column (LONGVARBINARY, VARBINARY, or IMAGE)
            if col_type in [-4, -3, -2]:  # Binary types
                print(f"Found binary column: {table_name}.{col_name}")
                print(f"  Type: {col_type_name} (SQL type: {col_type})")

                # Try to get a sample
                try:
                    cursor.execute(f"SELECT TOP 1 [{col_name}] FROM [{table_name}] WHERE [{col_name}] IS NOT NULL")
                    row = cursor.fetchone()

                    if row and row[0]:
                        data = row[0]
                        if isinstance(data, bytes):
                            print(f"  Sample size: {len(data)} bytes")

                            # Check image format
                            if data.startswith(b'\xff\xd8\xff'):
                                print(f"  Format: JPEG ✓")
                            elif data.startswith(b'\x89PNG'):
                                print(f"  Format: PNG ✓")
                            elif data.startswith(b'GIF'):
                                print(f"  Format: GIF ✓")
                            else:
                                print(f"  Format: Unknown binary")
                        else:
                            print(f"  Data type: {type(data).__name__}")

                except Exception as e:
                    print(f"  Error reading sample: {e}")

                print()

    except Exception as e:
        print(f"Error accessing table {table_name}: {e}")

conn.close()
print("\nSearch complete!")
