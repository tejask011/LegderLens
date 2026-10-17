import sqlite3
import pytest
from app.services.report_service import report_service

@pytest.fixture
def populated_db():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE transactions (
            id TEXT PRIMARY KEY,
            merchant TEXT,
            date TEXT,
            total TEXT,
            category TEXT,
            is_approved INTEGER,
            is_duplicate INTEGER
        );
    """)
    conn.execute("INSERT INTO transactions VALUES ('1', 'AWS', '2026-10-01', '100.00', 'Software & Subscriptions', 1, 0)")
    conn.execute("INSERT INTO transactions VALUES ('2', 'GitHub', '2026-10-05', '50.00', 'Software & Subscriptions', 1, 0)")
    conn.execute("INSERT INTO transactions VALUES ('3', 'Uber', '2026-10-08', '50.00', 'Travel & Transport', 1, 0)")
    conn.execute("INSERT INTO transactions VALUES ('4', 'Pending', '2026-10-10', '99.00', 'Other', 0, 0)")
    conn.commit()
    yield conn
    conn.close()

def test_overview_report_approved_totals(populated_db):
    rep = report_service.get_overview_report(populated_db, approved_only=True)
    assert rep.total_spend == "200.00"
    assert rep.approved_count == 3
    assert rep.pending_count == 0

    # Software should be $150.00 (75.0%), Travel should be $50.00 (25.0%)
    cats = {c.category: (c.total_amount, c.percentage) for c in rep.categories_breakdown}
    assert cats["Software & Subscriptions"] == ("150.00", 75.0)
    assert cats["Travel & Transport"] == ("50.00", 25.0)

def test_overview_report_including_pending(populated_db):
    rep = report_service.get_overview_report(populated_db, approved_only=False)
    assert rep.total_spend == "299.00"
    assert rep.total_transactions == 4
    assert rep.pending_count == 1
