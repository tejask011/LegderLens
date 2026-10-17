import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
import sqlite3

from app.db.database import get_db
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    BatchApproveRequest
)
from app.services.duplicate_service import duplicate_service
from app.services.field_extractor import field_extractor

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
def list_transactions(
    conn: sqlite3.Connection = Depends(get_db),
    search: Optional[str] = None,
    category: Optional[str] = None,
    merchant: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    is_approved: Optional[bool] = None,
    is_duplicate: Optional[bool] = None,
    limit: int = Query(200, ge=1, le=1000)
):
    """
    Search and filter transactions stored locally.
    """
    where_clauses = []
    params = []

    if search:
        where_clauses.append("(merchant LIKE ? OR notes LIKE ? OR invoice_number LIKE ?)")
        s = f"%{search}%"
        params.extend([s, s, s])
    if category:
        where_clauses.append("category = ?")
        params.append(category)
    if merchant:
        where_clauses.append("merchant LIKE ?")
        params.append(f"%{merchant}%")
    if start_date:
        where_clauses.append("date >= ?")
        params.append(start_date)
    if end_date:
        where_clauses.append("date <= ?")
        params.append(end_date)
    if is_approved is not None:
        where_clauses.append("is_approved = ?")
        params.append(1 if is_approved else 0)
    if is_duplicate is not None:
        where_clauses.append("is_duplicate = ?")
        params.append(1 if is_duplicate else 0)

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
    query = f"""
        SELECT * FROM transactions
        {where_sql}
        ORDER BY date DESC, created_at DESC
        LIMIT ?
    """
    params.append(limit)

    rows = conn.execute(query, params).fetchall()
    return [
        TransactionResponse(
            id=r["id"],
            document_id=r["document_id"],
            merchant=r["merchant"],
            date=r["date"],
            total=r["total"],
            currency=r["currency"],
            tax=r["tax"],
            invoice_number=r["invoice_number"],
            category=r["category"],
            suggested_category=r["suggested_category"],
            category_confidence=r["category_confidence"] or 0.0,
            category_reasoning=r["category_reasoning"],
            notes=r["notes"],
            is_approved=bool(r["is_approved"]),
            is_duplicate=bool(r["is_duplicate"]),
            duplicate_of_id=r["duplicate_of_id"],
            duplicate_reason=r["duplicate_reason"],
            created_at=r["created_at"],
            updated_at=r["updated_at"]
        )
        for r in rows
    ]

@router.post("", response_model=TransactionResponse)
def create_transaction(
    payload: TransactionCreate,
    conn: sqlite3.Connection = Depends(get_db)
):
    """
    Create a new transaction record (candidate or approved).
    Validates amount formatting and re-checks duplicate status.
    """
    clean_total = field_extractor.normalize_amount_str(payload.total)
    if not clean_total:
        raise HTTPException(status_code=400, detail="Invalid monetary amount format.")

    tx_id = str(uuid.uuid4())
    now_iso = datetime.now().isoformat()

    # Check duplicate status
    is_dup, dup_id, dup_reason = duplicate_service.check_transaction_duplicate(
        conn,
        merchant=payload.merchant,
        total=clean_total,
        date_str=payload.date,
        invoice_number=payload.invoice_number
    )

    is_duplicate_val = payload.is_duplicate or is_dup
    dup_reason_val = payload.duplicate_reason or dup_reason
    dup_id_val = payload.duplicate_of_id or dup_id

    conn.execute("""
        INSERT INTO transactions (
            id, document_id, merchant, date, total, currency, tax, invoice_number,
            category, suggested_category, category_confidence, category_reasoning,
            notes, is_approved, is_duplicate, duplicate_of_id, duplicate_reason,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tx_id, payload.document_id, payload.merchant, payload.date, clean_total,
        payload.currency, payload.tax, payload.invoice_number, payload.category,
        payload.suggested_category, payload.category_confidence, payload.category_reasoning,
        payload.notes, 1 if payload.is_approved else 0,
        1 if is_duplicate_val else 0, dup_id_val, dup_reason_val,
        now_iso, now_iso
    ))

    # If document attached, update document status
    if payload.document_id and payload.is_approved:
        conn.execute("UPDATE documents SET status = 'approved' WHERE id = ?", (payload.document_id,))

    return TransactionResponse(
        id=tx_id,
        document_id=payload.document_id,
        merchant=payload.merchant,
        date=payload.date,
        total=clean_total,
        currency=payload.currency,
        tax=payload.tax,
        invoice_number=payload.invoice_number,
        category=payload.category,
        suggested_category=payload.suggested_category,
        category_confidence=payload.category_confidence or 0.0,
        category_reasoning=payload.category_reasoning,
        notes=payload.notes,
        is_approved=payload.is_approved,
        is_duplicate=is_duplicate_val,
        duplicate_of_id=dup_id_val,
        duplicate_reason=dup_reason_val,
        created_at=now_iso,
        updated_at=now_iso
    )

@router.put("/{tx_id}", response_model=TransactionResponse)
def update_transaction(
    tx_id: str,
    payload: TransactionUpdate,
    conn: sqlite3.Connection = Depends(get_db)
):
    """
    Update an existing transaction. Allows editing fields after review.
    """
    row = conn.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Transaction not found")

    new_merchant = payload.merchant if payload.merchant is not None else row["merchant"]
    new_date = payload.date if payload.date is not None else row["date"]
    new_total = field_extractor.normalize_amount_str(payload.total) if payload.total is not None else row["total"]
    new_currency = payload.currency if payload.currency is not None else row["currency"]
    new_tax = payload.tax if payload.tax is not None else row["tax"]
    new_invoice = payload.invoice_number if payload.invoice_number is not None else row["invoice_number"]
    new_category = payload.category if payload.category is not None else row["category"]
    new_notes = payload.notes if payload.notes is not None else row["notes"]
    new_approved = (1 if payload.is_approved else 0) if payload.is_approved is not None else row["is_approved"]

    now_iso = datetime.now().isoformat()

    conn.execute("""
        UPDATE transactions SET
            merchant = ?, date = ?, total = ?, currency = ?, tax = ?,
            invoice_number = ?, category = ?, notes = ?, is_approved = ?,
            updated_at = ?
        WHERE id = ?
    """, (
        new_merchant, new_date, new_total, new_currency, new_tax,
        new_invoice, new_category, new_notes, new_approved,
        now_iso, tx_id
    ))

    # If linked to a document and approved
    if row["document_id"] and new_approved == 1:
        conn.execute("UPDATE documents SET status = 'approved' WHERE id = ?", (row["document_id"],))

    updated_row = conn.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,)).fetchone()
    return TransactionResponse(
        id=updated_row["id"],
        document_id=updated_row["document_id"],
        merchant=updated_row["merchant"],
        date=updated_row["date"],
        total=updated_row["total"],
        currency=updated_row["currency"],
        tax=updated_row["tax"],
        invoice_number=updated_row["invoice_number"],
        category=updated_row["category"],
        suggested_category=updated_row["suggested_category"],
        category_confidence=updated_row["category_confidence"] or 0.0,
        category_reasoning=updated_row["category_reasoning"],
        notes=updated_row["notes"],
        is_approved=bool(updated_row["is_approved"]),
        is_duplicate=bool(updated_row["is_duplicate"]),
        duplicate_of_id=updated_row["duplicate_of_id"],
        duplicate_reason=updated_row["duplicate_reason"],
        created_at=updated_row["created_at"],
        updated_at=updated_row["updated_at"]
    )

@router.post("/{tx_id}/approve")
def approve_transaction(
    tx_id: str,
    conn: sqlite3.Connection = Depends(get_db)
):
    """Confirm and approve a single transaction."""
    row = conn.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Transaction not found")

    now_iso = datetime.now().isoformat()
    conn.execute("UPDATE transactions SET is_approved = 1, updated_at = ? WHERE id = ?", (now_iso, tx_id))
    if row["document_id"]:
        conn.execute("UPDATE documents SET status = 'approved' WHERE id = ?", (row["document_id"],))

    return {"message": "Transaction approved successfully", "id": tx_id}

@router.post("/batch-approve")
def batch_approve(
    req: BatchApproveRequest,
    conn: sqlite3.Connection = Depends(get_db)
):
    """Confirm and batch approve candidate records."""
    if not req.transaction_ids:
        return {"approved_count": 0}

    now_iso = datetime.now().isoformat()
    placeholders = ",".join("?" for _ in req.transaction_ids)
    conn.execute(
        f"UPDATE transactions SET is_approved = 1, updated_at = ? WHERE id IN ({placeholders})",
        [now_iso] + req.transaction_ids
    )

    # Update corresponding documents
    conn.execute(f"""
        UPDATE documents SET status = 'approved'
        WHERE id IN (
            SELECT document_id FROM transactions 
            WHERE id IN ({placeholders}) AND document_id IS NOT NULL
        )
    """, req.transaction_ids)

    return {"approved_count": len(req.transaction_ids)}

@router.delete("/{tx_id}")
def delete_transaction(
    tx_id: str,
    conn: sqlite3.Connection = Depends(get_db)
):
    """Delete a transaction record."""
    conn.execute("DELETE FROM transactions WHERE id = ?", (tx_id,))
    return {"message": "Transaction removed"}

@router.get("/{tx_id}/duplicates")
def get_duplicate_details(
    tx_id: str,
    conn: sqlite3.Connection = Depends(get_db)
):
    """Get comparison details between this transaction and its matched duplicate."""
    current = conn.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,)).fetchone()
    if not current:
        raise HTTPException(status_code=404, detail="Transaction not found")

    duplicate_match = None
    if current["duplicate_of_id"]:
        dup_row = conn.execute("SELECT * FROM transactions WHERE id = ?", (current["duplicate_of_id"],)).fetchone()
        if dup_row:
            duplicate_match = dict(dup_row)

    return {
        "transaction": dict(current),
        "is_duplicate": bool(current["is_duplicate"]),
        "reason": current["duplicate_reason"],
        "matched_record": duplicate_match
    }
