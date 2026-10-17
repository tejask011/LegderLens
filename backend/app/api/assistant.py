from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
import sqlite3

from app.db.database import get_db
from app.schemas.assistant import (
    OllamaStatusResponse,
    CategorySuggestionRequest,
    CategorySuggestionResponse,
    NLQueryRequest,
    NLQueryResponse,
    ParsedQueryIntent
)
from app.services.local_llm import local_llm_service
from app.services.report_service import report_service

router = APIRouter(prefix="/assistant", tags=["Assistant"])

@router.get("/ollama-status", response_model=OllamaStatusResponse)
async def get_ollama_status(conn: sqlite3.Connection = Depends(get_db)):
    """
    Check connection to local Ollama runner, active open-weight model, and ping latency.
    """
    row_url = conn.execute("SELECT value FROM app_settings WHERE key = 'ollama_base_url'").fetchone()
    row_model = conn.execute("SELECT value FROM app_settings WHERE key = 'ollama_model'").fetchone()

    base_url = row_url["value"] if row_url else None
    model = row_model["value"] if row_model else None

    return await local_llm_service.check_status(custom_base_url=base_url, custom_model=model)

@router.post("/suggest-category", response_model=CategorySuggestionResponse)
async def suggest_category(
    payload: CategorySuggestionRequest
):
    """
    Request category suggestion, confidence score, and normalized merchant name
    using open-weight AI model with fallback to deterministic rules.
    """
    resp, _ = await local_llm_service.suggest_category(
        merchant=payload.merchant,
        total=payload.total,
        raw_text=payload.raw_text
    )
    return resp

@router.post("/query", response_model=NLQueryResponse)
async def query_assistant(
    payload: NLQueryRequest,
    conn: sqlite3.Connection = Depends(get_db)
):
    """
    Translate natural-language financial questions into strictly validated report filters.
    All calculations are performed deterministically in Python application code.
    Arbitrary SQL or code execution is strictly prohibited.
    """
    query_text = payload.query.strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # 1. Parse intent safely using local open-weight model or fallback heuristic
    intent, is_llm = await local_llm_service.parse_natural_language_query(query_text)

    # 2. Build parameterized query
    where_clauses = ["is_approved = 1"]
    params = []

    if intent.category:
        where_clauses.append("category = ?")
        params.append(intent.category)

    if intent.merchant:
        where_clauses.append("merchant LIKE ?")
        params.append(f"%{intent.merchant}%")

    if intent.month:
        where_clauses.append("date LIKE ?")
        params.append(f"{intent.month}%")
    elif intent.start_date and intent.end_date:
        where_clauses.append("date BETWEEN ? AND ?")
        params.extend([intent.start_date, intent.end_date])
    elif intent.start_date:
        where_clauses.append("date >= ?")
        params.append(intent.start_date)

    where_sql = f"WHERE {' AND '.join(where_clauses)}"
    sql = f"""
        SELECT id, merchant, date, total, currency, category, invoice_number, notes
        FROM transactions
        {where_sql}
        ORDER BY date DESC
        LIMIT 100
    """

    rows = conn.execute(sql, params).fetchall()
    matched_txs = [dict(r) for r in rows]

    # 3. Deterministic Decimal arithmetic
    total_dec = Decimal("0.00")
    for r in matched_txs:
        total_dec += report_service.to_decimal(r["total"])

    total_formatted = f"{total_dec:.2f}"

    # 4. Formulate human explanation
    time_desc = f" in {intent.month}" if intent.month else ""
    target_desc = ""
    if intent.category:
        target_desc = f" on {intent.category}"
    elif intent.merchant:
        target_desc = f" at {intent.merchant.title()}"

    if len(matched_txs) == 0:
        answer = f"No approved records were found matching your query{target_desc}{time_desc}."
    else:
        answer = f"You spent a total of ${total_formatted}{target_desc}{time_desc} across {len(matched_txs)} approved transaction{'s' if len(matched_txs) != 1 else ''}."

    warning = None
    if not is_llm:
        warning = "Local model was offline; query was translated using safe heuristic rules."

    return NLQueryResponse(
        query=query_text,
        parsed_intent=intent,
        answer=answer,
        calculated_total=total_formatted,
        currency="USD",
        matched_count=len(matched_txs),
        matched_transactions=matched_txs,
        model_used=local_llm_service.model if is_llm else "rule-heuristic-fallback",
        is_llm_assisted=is_llm,
        warning=warning
    )
