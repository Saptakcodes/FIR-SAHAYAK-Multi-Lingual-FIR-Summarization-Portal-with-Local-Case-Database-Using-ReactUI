import sqlite3
from pathlib import Path

DB_PATH = Path("fir_metadata.db")

if not DB_PATH.exists():
    print("❌ Database file not found.")
    exit()

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# 1. List all tables
c.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = c.fetchall()
print("📁 Tables in database:")
for table in tables:
    print(f"  - {table[0]}")

# 2. Show schema of the 'firs' table
print("\n📋 Schema of 'firs' table:")
c.execute("PRAGMA table_info(firs)")
columns = c.fetchall()
for col in columns:
    print(f"  {col[1]} ({col[2]})")

# 3. Show all records (limit to 10)
print("\n📊 Records (last 10):")
c.execute("SELECT * FROM firs ORDER BY id DESC LIMIT 10")
rows = c.fetchall()
if rows:
    col_names = [col[1] for col in columns]
    for row in rows:
        print("\n--- Record ---")
        for name, val in zip(col_names, row):
            # Truncate long fields for readability
            if isinstance(val, str) and len(val) > 100:
                val = val[:100] + "..."
            print(f"  {name}: {val}")
else:
    print("  No records found.")

conn.close()