"""
List all tables in Access database
"""
import pyodbc
from pathlib import Path

db_path = Path("D:/UNS-ClaudeJP-5.4.1/BASEDATEJP/ユニバーサル企画㈱データベースv25.3.24_be.accdb")

conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={db_path};'
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

print("\n=== ALL TABLES IN DATABASE ===\n")

tables = cursor.tables(tableType='TABLE').fetchall()

for idx, table_info in enumerate(tables, 1):
    table_name = table_info[2]
    print(f"{idx:3}. {table_name}")

conn.close()

print(f"\nTotal tables: {len(tables)}")
