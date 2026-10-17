import sqlite3
import csv
import io
from app.services.export_service import export_service

def test_export_transactions_to_csv():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE transactions (
            id TEXT, date TEXT, merchant TEXT, category TEXT, total TEXT,
            currency TEXT, tax TEXT, invoice_number TEXT, is_approved INTEGER,
            is_duplicate INTEGER, duplicate_reason TEXT, suggested_category TEXT,
            notes TEXT, created_at TEXT
        );
    """)
    conn.execute("""
        INSERT INTO transactions VALUES (
            'tx-1', '2026-10-15', 'Figma', 'Software & Subscriptions', '15.00',
            'USD', '0.00', 'INV-123', 1, 0, NULL, 'Software & Subscriptions',
            'Design tool', '2026-10-15T12:00:00'
        )
    """)
    conn.commit()

    csv_data = export_service.export_transactions_to_csv(conn, approved_only=True)
    reader = csv.reader(io.StringIO(csv_data))
    rows = list(reader)

    # Check header
    assert rows[0][0] == "Transaction ID"
    assert rows[0][4] == "Total Amount"

    # Check row
    assert rows[1][1] == "2026-10-15"
    assert rows[1][2] == "Figma"
    assert rows[1][4] == "15.00"
    assert rows[1][8] == "Yes"
