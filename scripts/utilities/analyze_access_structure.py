"""
Analyze complete Access database structure to find photo storage
"""
import pyodbc
from pathlib import Path

db_path = Path("D:/UNS-ClaudeJP-5.4.1/BASEDATEJP/ユニバーサル企画㈱データベースv25.3.24_be.accdb")

conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={db_path};'
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

print("\n=== ANALYZING ACCESS DATABASE FOR PHOTO STORAGE ===\n")

# Check if there's a hidden attachment table with IDs matching the photo column
print("Hypothesis: The INT values (673, 682, 88, etc.) might be IDs in a hidden table")
print("\nLet's check if there's any table with IDs in that range...\n")

# Get all tables
tables = cursor.tables(tableType='TABLE').fetchall()

for table_info in tables:
    table_name = table_info[2]

    # Skip system tables
    if table_name.startswith('MSys'):
        continue

    try:
        # Get columns
        cols = cursor.columns(table=table_name).fetchall()

        # Look for ID column
        id_cols = [col for col in cols if 'id' in col[3].lower() or col[3].lower() in ['id', 'no', '番号']]

        if id_cols:
            # Check if this table has IDs in the range we see (88-1108)
            id_col_name = id_cols[0][3]

            cursor.execute(f"SELECT MIN([{id_col_name}]), MAX([{id_col_name}]), COUNT(*) FROM [{table_name}]")
            min_id, max_id, count = cursor.fetchone()

            print(f"Table: {table_name}")
            print(f"  ID column: {id_col_name}")
            print(f"  ID range: {min_id} to {max_id}")
            print(f"  Total rows: {count}")

            # Check if range overlaps with our photo IDs (88-1108)
            if min_id and max_id and min_id <= 1108 and max_id >= 88:
                print(f"  *** POSSIBLE MATCH! IDs overlap with photo field values ***")

                # Check for binary columns in this table
                binary_cols = [col for col in cols if col[5] in [-4, -3, -2]]  # Binary types
                if binary_cols:
                    print(f"  *** HAS BINARY COLUMNS: {[col[3] for col in binary_cols]} ***")

                    # Get sample data
                    cursor.execute(f"SELECT TOP 3 * FROM [{table_name}]")
                    sample = cursor.fetchall()
                    if sample:
                        print(f"  Sample row 1:")
                        for col, val in zip(cols, sample[0]):
                            if isinstance(val, bytes):
                                print(f"    {col[3]}: <binary {len(val)} bytes>")
                                # Check if it's an image
                                if val.startswith(b'\xff\xd8\xff'):
                                    print(f"      -> JPEG IMAGE FOUND!")
                                elif val.startswith(b'\x89PNG'):
                                    print(f"      -> PNG IMAGE FOUND!")
                            else:
                                print(f"    {col[3]}: {val}")

            print()

    except Exception as e:
        print(f"Error with {table_name}: {e}\n")

print("=== CHECKING IF PHOTOS ARE IN FILESYSTEM ===\n")

# Maybe the INT is a reference to external files?
cursor.execute("""
    SELECT TOP 5
        履歴書ID,
        写真,
        氏名
    FROM T_履歴書
    WHERE 写真 IS NOT NULL
    ORDER BY 履歴書ID
""")

print("Sample photo field values:")
for row in cursor.fetchall():
    print(f"  ID {row[0]} ({row[2]}): photo field = {row[1]}")

conn.close()
print("\nDone!")
