import sqlite3
import pytest
from app.services.duplicate_service import duplicate_service

@pytest.fixture
def memory_db():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE documents (
            id TEXT PRIMARY KEY,
            filename TEXT,
            uploaded_at TEXT,
            file_hash TEXT
        );
    """)
    conn.execute("""
        CREATE TABLE transactions (
            id TEXT PRIMARY KEY,
            merchant TEXT,
            date TEXT,
            total TEXT,
            invoice_number TEXT
        );
    """)
    yield conn
    conn.close()

def test_document_hash_duplicate_match(memory_db):
    memory_db.execute("INSERT INTO documents VALUES ('doc-1', 'receipt.pdf', '2026-10-10', 'hash_abc123')")
    memory_db.commit()

    is_dup, dup_id, reason = duplicate_service.check_document_duplicate(memory_db, 'hash_abc123', current_doc_id='doc-2')
    assert is_dup is True
    assert dup_id == 'doc-1'
    assert "Exact duplicate file" in reason

def test_transaction_invoice_duplicate(memory_db):
    memory_db.execute("INSERT INTO transactions VALUES ('tx-1', 'GitHub', '2026-10-01', '49.00', 'GH-1002')")
    memory_db.commit()

    is_dup, dup_id, reason = duplicate_service.check_transaction_duplicate(
        memory_db,
        merchant='GitHub',
        total='49.00',
        date_str='2026-10-01',
        invoice_number='GH-1002',
        current_tx_id='tx-2'
    )
    assert is_dup is True
    assert dup_id == 'tx-1'
    assert "GH-1002" in reason

def test_fuzzy_duplicate_same_merchant_amount_close_date(memory_db):
    memory_db.execute("INSERT INTO transactions VALUES ('tx-1', 'Uber Technologies Inc', '2026-10-05', '34.20', NULL)")
    memory_db.commit()

    # Candidate uploaded 2 days later with same amount and Uber merchant
    is_dup, dup_id, reason = duplicate_service.check_transaction_duplicate(
        memory_db,
        merchant='Uber',
        total='34.20',
        date_str='2026-10-07',
        current_tx_id='tx-2'
    )
    assert is_dup is True
    assert dup_id == 'tx-1'
    assert "Suspected duplicate" in reason

def test_non_duplicate_different_amount(memory_db):
    memory_db.execute("INSERT INTO transactions VALUES ('tx-1', 'Uber', '2026-10-05', '34.20', NULL)")
    memory_db.commit()

    is_dup, dup_id, reason = duplicate_service.check_transaction_duplicate(
        memory_db,
        merchant='Uber',
        total='19.50',
        date_str='2026-10-05',
        current_tx_id='tx-2'
    )
    assert is_dup is False
    assert dup_id is None
