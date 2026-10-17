import uuid
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import sqlite3

from app.config import settings
from app.db.database import get_db
from app.schemas.document import DocumentResponse, ExtractedCandidate
from app.services.document_parser import document_parser
from app.services.field_extractor import field_extractor
from app.services.duplicate_service import duplicate_service
from app.services.local_llm import local_llm_service
from app.services.category_service import category_service

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload", response_model=List[ExtractedCandidate])
async def upload_documents(
    files: List[UploadFile] = File(...),
    conn: sqlite3.Connection = Depends(get_db)
):
    """
    Upload one or more invoice/receipt/CSV files.
    Validates file extension and size, extracts text, computes hash,
    checks for duplicates, generates candidate fields and AI category suggestions.
    Does NOT finalize financial record until user review & approval.
    """
    results: List[ExtractedCandidate] = []

    for file in files:
        ext = Path(file.filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        doc_id = str(uuid.uuid4())
        safe_filename = f"{doc_id}_{Path(file.filename).name}"
        saved_path = settings.DOCUMENTS_DIR / safe_filename

        # Write uploaded content
        content = await file.read()
        if len(content) > settings.MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024*1024)}MB."
            )

        with open(saved_path, "wb") as f:
            f.write(content)

        # Parse document
        file_hash, extracted_text, method, parsed_csv_rows = document_parser.parse_file(saved_path)

        # Record document in DB
        now_iso = datetime.now().isoformat()
        conn.execute("""
            INSERT INTO documents (
                id, filename, filepath, file_hash, file_type, file_size, 
                uploaded_at, extracted_text, extraction_method, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            doc_id, file.filename, str(saved_path), file_hash,
            ext.replace(".", ""), len(content), now_iso,
            extracted_text, method, "pending_review"
        ))

        # Check duplicate file hash
        is_file_dup, dup_doc_id, dup_file_reason = duplicate_service.check_document_duplicate(
            conn, file_hash, current_doc_id=doc_id
        )

        # If it's a CSV with structured rows, generate candidates for each row
        if ext == ".csv" and parsed_csv_rows:
            for idx, row in enumerate(parsed_csv_rows):
                # Search for merchant, date, amount columns
                row_merchant = row.get("Merchant") or row.get("merchant") or row.get("Description") or row.get("description") or f"CSV Item {idx+1}"
                row_date = row.get("Date") or row.get("date") or datetime.today().strftime("%Y-%m-%d")
                row_amount = row.get("Amount") or row.get("amount") or row.get("Total") or row.get("total") or "0.00"
                clean_total = field_extractor.normalize_amount_str(str(row_amount)) or "0.00"
                row_invoice = row.get("Invoice") or row.get("invoice_number") or row.get("Reference") or None

                # Check duplicate transaction
                is_tx_dup, dup_tx_id, dup_tx_reason = duplicate_service.check_transaction_duplicate(
                    conn, merchant=row_merchant, total=clean_total, date_str=row_date, invoice_number=row_invoice
                )

                # Category suggestion
                cat_resp, _ = await local_llm_service.suggest_category(
                    merchant=row_merchant,
                    total=clean_total,
                    raw_text=str(row)
                )

                candidate = ExtractedCandidate(
                    document_id=doc_id,
                    filename=f"{file.filename} (Row {idx+1})",
                    merchant=row_merchant,
                    date=row_date,
                    total=clean_total,
                    currency="USD",
                    tax=None,
                    invoice_number=row_invoice,
                    suggested_category=cat_resp.suggested_category,
                    category_confidence=cat_resp.confidence,
                    category_reasoning=cat_resp.reasoning,
                    uncertain_fields=[],
                    raw_text_snippet=str(row),
                    is_duplicate=is_tx_dup,
                    duplicate_reason=dup_tx_reason,
                    duplicate_of_id=dup_tx_id
                )
                results.append(candidate)
        else:
            # Single document candidate (PDF or image)
            candidate = field_extractor.extract_candidate(
                document_id=doc_id,
                filename=file.filename,
                text=extracted_text
            )

            # Check duplicate transaction
            is_tx_dup, dup_tx_id, dup_tx_reason = duplicate_service.check_transaction_duplicate(
                conn,
                merchant=candidate.merchant or "",
                total=candidate.total or "0.00",
                date_str=candidate.date or datetime.today().strftime("%Y-%m-%d"),
                invoice_number=candidate.invoice_number
            )

            # Local open-weight AI category suggestion
            cat_resp, _ = await local_llm_service.suggest_category(
                merchant=candidate.merchant or "",
                total=candidate.total,
                raw_text=extracted_text
            )

            candidate.suggested_category = cat_resp.suggested_category
            candidate.category_confidence = cat_resp.confidence
            candidate.category_reasoning = cat_resp.reasoning

            if is_file_dup:
                candidate.is_duplicate = True
                candidate.duplicate_reason = dup_file_reason
                candidate.duplicate_of_id = dup_doc_id
            elif is_tx_dup:
                candidate.is_duplicate = True
                candidate.duplicate_reason = dup_tx_reason
                candidate.duplicate_of_id = dup_tx_id

            results.append(candidate)

    return results

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    conn: sqlite3.Connection = Depends(get_db),
    status: Optional[str] = None
):
    """List uploaded documents."""
    query = "SELECT * FROM documents"
    params = []
    if status:
        query += " WHERE status = ?"
        params.append(status)
    query += " ORDER BY uploaded_at DESC"
    rows = conn.execute(query, params).fetchall()
    return [dict(r) for r in rows]

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    conn: sqlite3.Connection = Depends(get_db)
):
    """Get single document details with extracted text."""
    row = conn.execute("SELECT * FROM documents WHERE id = ?", (document_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    return dict(row)

@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    conn: sqlite3.Connection = Depends(get_db)
):
    """Delete a document and clean up local file storage."""
    row = conn.execute("SELECT filepath FROM documents WHERE id = ?", (document_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = Path(row["filepath"])
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception:
            pass

    conn.execute("DELETE FROM documents WHERE id = ?", (document_id,))
    return {"message": "Document deleted successfully"}
