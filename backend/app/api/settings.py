import uuid
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends
import sqlite3

from app.config import settings
from app.db.database import get_db
from app.schemas.settings import AppSettings, AppSettingsUpdate, SystemHealthResponse
from app.services.local_llm import local_llm_service

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=AppSettings)
def get_settings(conn: sqlite3.Connection = Depends(get_db)):
    """Retrieve saved application settings."""
    rows = conn.execute("SELECT key, value FROM app_settings").fetchall()
    data = {r["key"]: r["value"] for r in rows}

    return AppSettings(
        ollama_base_url=data.get("ollama_base_url", settings.OLLAMA_BASE_URL),
        ollama_model=data.get("ollama_model", settings.OLLAMA_MODEL),
        default_currency=data.get("default_currency", "USD"),
        auto_suggest_categories=data.get("auto_suggest_categories", "true").lower() == "true"
    )

@router.put("", response_model=AppSettings)
def update_settings(
    payload: AppSettingsUpdate,
    conn: sqlite3.Connection = Depends(get_db)
):
    """Update application settings."""
    if payload.ollama_base_url is not None:
        conn.execute(
            "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('ollama_base_url', ?)",
            (payload.ollama_base_url.strip(),)
        )
    if payload.ollama_model is not None:
        conn.execute(
            "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('ollama_model', ?)",
            (payload.ollama_model.strip(),)
        )
    if payload.default_currency is not None:
        conn.execute(
            "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('default_currency', ?)",
            (payload.default_currency.strip(),)
        )
    if payload.auto_suggest_categories is not None:
        conn.execute(
            "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('auto_suggest_categories', ?)",
            (str(payload.auto_suggest_categories).lower(),)
        )

    return get_settings(conn)

@router.get("/health", response_model=SystemHealthResponse)
async def get_system_health(conn: sqlite3.Connection = Depends(get_db)):
    """Health check endpoint displaying system state, record counts, and Ollama connectivity."""
    doc_count = conn.execute("SELECT COUNT(*) as c FROM documents").fetchone()["c"]
    tx_count = conn.execute("SELECT COUNT(*) as c FROM transactions").fetchone()["c"]
    appr_count = conn.execute("SELECT COUNT(*) as c FROM transactions WHERE is_approved = 1").fetchone()["c"]

    ollama_stat = await local_llm_service.check_status()

    return SystemHealthResponse(
        status="healthy",
        database_ok=True,
        document_count=doc_count,
        transaction_count=tx_count,
        approved_count=appr_count,
        ollama_status=ollama_stat.model_dump(),
        storage_path=str(settings.DATA_DIR)
    )

@router.post("/seed-synthetic")
def seed_synthetic_data(conn: sqlite3.Connection = Depends(get_db)):
    """
    Seed realistic synthetic freelance financial records for demonstration and testing.
    Includes diverse categories, realistic dates, an intentional duplicate, and pending reviews.
    """
    now_iso = datetime.now().isoformat()

    sample_txs = [
        {
            "merchant": "Amazon Web Services",
            "date": "2026-10-02",
            "total": "184.20",
            "currency": "USD",
            "tax": "14.74",
            "invoice_number": "INV-AWS-2026-10",
            "category": "Software & Subscriptions",
            "suggested_category": "Software & Subscriptions",
            "category_confidence": 0.95,
            "category_reasoning": "Keyword 'Amazon Web Services' matched cloud hosting.",
            "notes": "Production cluster & S3 backup storage",
            "is_approved": 1,
            "is_duplicate": 0
        },
        {
            "merchant": "GitHub",
            "date": "2026-10-05",
            "total": "49.00",
            "currency": "USD",
            "tax": "0.00",
            "invoice_number": "GH-9482910",
            "category": "Software & Subscriptions",
            "suggested_category": "Software & Subscriptions",
            "category_confidence": 0.96,
            "category_reasoning": "GitHub code hosting and Copilot subscriptions.",
            "notes": "Team plan + Copilot licenses",
            "is_approved": 1,
            "is_duplicate": 0
        },
        {
            "merchant": "Uber",
            "date": "2026-10-08",
            "total": "38.50",
            "currency": "USD",
            "tax": "2.80",
            "invoice_number": "UBER-77192",
            "category": "Travel & Transport",
            "suggested_category": "Travel & Transport",
            "category_confidence": 0.94,
            "category_reasoning": "Uber rideshare ride from client meeting.",
            "notes": "Ride to Downtown design agency",
            "is_approved": 1,
            "is_duplicate": 0
        },
        {
            "merchant": "Starbucks",
            "date": "2026-10-09",
            "total": "14.85",
            "currency": "USD",
            "tax": "1.25",
            "invoice_number": "SB-88219",
            "category": "Meals & Entertainment",
            "suggested_category": "Meals & Entertainment",
            "category_confidence": 0.92,
            "category_reasoning": "Starbucks cafe receipt.",
            "notes": "Coffee meeting with client",
            "is_approved": 1,
            "is_duplicate": 0
        },
        {
            "merchant": "Staples",
            "date": "2026-10-11",
            "total": "89.99",
            "currency": "USD",
            "tax": "7.20",
            "invoice_number": "STP-440192",
            "category": "Office Supplies",
            "suggested_category": "Office Supplies",
            "category_confidence": 0.93,
            "category_reasoning": "Office stationery and whiteboard markers.",
            "notes": "Quarterly office restock",
            "is_approved": 1,
            "is_duplicate": 0
        },
        {
            "merchant": "Figma",
            "date": "2026-09-14",
            "total": "15.00",
            "currency": "USD",
            "tax": "0.00",
            "invoice_number": "FIG-2026-09",
            "category": "Software & Subscriptions",
            "suggested_category": "Software & Subscriptions",
            "category_confidence": 0.95,
            "category_reasoning": "Design tool subscription.",
            "notes": "UI/UX design workspace",
            "is_approved": 1,
            "is_duplicate": 0
        },
        {
            "merchant": "Delta Air Lines",
            "date": "2026-09-20",
            "total": "342.10",
            "currency": "USD",
            "tax": "28.50",
            "invoice_number": "DL-9081293",
            "category": "Travel & Transport",
            "suggested_category": "Travel & Transport",
            "category_confidence": 0.96,
            "category_reasoning": "Airline flight ticket for client workshop.",
            "notes": "Roundtrip to SF tech conference",
            "is_approved": 1,
            "is_duplicate": 0
        },
        {
            "merchant": "Apple Store",
            "date": "2026-09-24",
            "total": "69.00",
            "currency": "USD",
            "tax": "5.52",
            "invoice_number": "APL-55102",
            "category": "Hardware & Equipment",
            "suggested_category": "Hardware & Equipment",
            "category_confidence": 0.91,
            "category_reasoning": "Computer accessories & hardware.",
            "notes": "Thunderbolt adapter & cables",
            "is_approved": 1,
            "is_duplicate": 0
        }
    ]

    seeded_ids = []
    for item in sample_txs:
        t_id = str(uuid.uuid4())
        seeded_ids.append(t_id)
        conn.execute("""
            INSERT INTO transactions (
                id, merchant, date, total, currency, tax, invoice_number,
                category, suggested_category, category_confidence, category_reasoning,
                notes, is_approved, is_duplicate, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            t_id, item["merchant"], item["date"], item["total"], item["currency"],
            item["tax"], item["invoice_number"], item["category"], item["suggested_category"],
            item["category_confidence"], item["category_reasoning"], item["notes"],
            item["is_approved"], item["is_duplicate"], now_iso, now_iso
        ))

    # Seed an intentional duplicate to demonstrate explainable duplicate detection!
    # Same merchant (Uber), same total ($38.50), date 1 day apart (2026-10-09)
    first_uber_id = seeded_ids[2]
    dup_id = str(uuid.uuid4())
    conn.execute("""
        INSERT INTO transactions (
            id, merchant, date, total, currency, tax, invoice_number,
            category, suggested_category, category_confidence, category_reasoning,
            notes, is_approved, is_duplicate, duplicate_of_id, duplicate_reason,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        dup_id, "Uber", "2026-10-09", "38.50", "USD", "2.80", "UBER-77192",
        "Travel & Transport", "Travel & Transport", 0.94,
        "Uber ride matching prior trip", "Duplicate upload test receipt",
        0, 1, first_uber_id,
        "Duplicate invoice number 'UBER-77192' and identical amount $38.50 matching recorded transaction from Uber on 2026-10-08.",
        now_iso, now_iso
    ))

    # Seed a pending review candidate with an ambiguous merchant
    pending_id = str(uuid.uuid4())
    conn.execute("""
        INSERT INTO transactions (
            id, merchant, date, total, currency, tax, invoice_number,
            category, suggested_category, category_confidence, category_reasoning,
            notes, is_approved, is_duplicate, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        pending_id, "SQ *CITY COFFEE ROAST", "2026-10-15", "9.75", "USD", "0.80", None,
        "Other", "Meals & Entertainment", 0.72,
        "Ambiguous merchant string containing 'coffee' suggests cafe or dining.",
        "Needs user confirmation on category and merchant name",
        0, 0, now_iso, now_iso
    ))

    return {
        "message": "Synthetic demonstration dataset seeded successfully",
        "records_created": len(sample_txs) + 2
    }
