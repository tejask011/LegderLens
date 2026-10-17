import sqlite3
from contextlib import contextmanager
from typing import Generator
from app.config import settings

def get_connection() -> sqlite3.Connection:
    """Create a SQLite connection with WAL mode and foreign keys enabled."""
    conn = sqlite3.connect(
        str(settings.DB_PATH),
        detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES,
        check_same_thread=False
    )
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def get_db() -> Generator[sqlite3.Connection, None, None]:
    """FastAPI dependency yielding SQLite connection with auto-commit and rollback."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

@contextmanager
def get_db_context() -> Generator[sqlite3.Connection, None, None]:
    """Context manager for standalone background scripts and initialization."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db() -> None:
    """Initialize database tables, indexes, and initial default settings."""
    with get_db_context() as conn:
        # Documents table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                filepath TEXT NOT NULL,
                file_hash TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                uploaded_at TEXT NOT NULL,
                extracted_text TEXT,
                extraction_method TEXT,
                status TEXT NOT NULL DEFAULT 'pending_review'
            );
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(file_hash);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_documents_uploaded ON documents(uploaded_at);")

        # Transactions table
        # All monetary amounts stored as TEXT (e.g. "124.50") to guarantee zero float drift
        conn.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                document_id TEXT,
                merchant TEXT NOT NULL,
                date TEXT NOT NULL,
                total TEXT NOT NULL,
                currency TEXT NOT NULL DEFAULT 'USD',
                tax TEXT,
                invoice_number TEXT,
                category TEXT NOT NULL DEFAULT 'Other',
                suggested_category TEXT,
                category_confidence REAL DEFAULT 0.0,
                category_reasoning TEXT,
                notes TEXT,
                is_approved INTEGER NOT NULL DEFAULT 0,
                is_duplicate INTEGER NOT NULL DEFAULT 0,
                duplicate_of_id TEXT,
                duplicate_reason TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
                FOREIGN KEY (duplicate_of_id) REFERENCES transactions(id) ON DELETE SET NULL
            );
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_approved ON transactions(is_approved);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_duplicate ON transactions(is_duplicate);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON transactions(invoice_number);")

        # Key-Value Settings table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
        """)

        # Default settings seed
        default_settings = {
            "ollama_base_url": settings.OLLAMA_BASE_URL,
            "ollama_model": settings.OLLAMA_MODEL,
            "default_currency": "USD",
            "auto_suggest_categories": "true"
        }
        for k, v in default_settings.items():
            conn.execute(
                "INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?);",
                (k, v)
            )
