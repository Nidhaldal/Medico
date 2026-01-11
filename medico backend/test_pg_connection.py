import psycopg2

try:
    conn = psycopg2.connect(
        dbname="medico",
        user="postgres",
        password="admin",
        host="localhost",
        port="5432"
    )
    print("✅ Connected successfully to PostgreSQL!")
    conn.close()
except Exception as e:
    print("❌ Connection failed:", e)
