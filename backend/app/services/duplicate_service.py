from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any, List
import sqlite3
import re

class DuplicateService:
    @staticmethod
    def normalize_merchant(name: str) -> str:
        """Normalize merchant name for comparison by removing punctuation and legal suffixes."""
        if not name:
            return ""
        s = name.lower()
        s = re.sub(r'\b(inc|llc|corp|ltd|co|gmbh|technologies|services)\b', '', s)
        s = re.sub(r'[^a-z0-9]', '', s)
        return s.strip()

    @classmethod
    def check_document_duplicate(
        cls,
        conn: sqlite3.Connection,
        file_hash: str,
        current_doc_id: Optional[str] = None
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Check if an uploaded file has an identical SHA256 checksum to another document.
        Returns (is_duplicate, duplicate_of_id, reason).
        """
        query = "SELECT id, filename, uploaded_at FROM documents WHERE file_hash = ?"
        params = [file_hash]
        if current_doc_id:
            query += " AND id != ?"
            params.append(current_doc_id)

        row = conn.execute(query, params).fetchone()
        if row:
            return (
                True,
                row["id"],
                f"Exact duplicate file: SHA-256 matches existing document '{row['filename']}' uploaded on {row['uploaded_at'][:10]}."
            )
        return (False, None, None)

    @classmethod
    def check_transaction_duplicate(
        cls,
        conn: sqlite3.Connection,
        merchant: str,
        total: str,
        date_str: str,
        invoice_number: Optional[str] = None,
        current_tx_id: Optional[str] = None
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Check if a candidate transaction is a duplicate of an existing record.
        Never auto-deletes; returns explainable reasons.
        """
        norm_merchant = cls.normalize_merchant(merchant)

        # 1. Check Invoice Number duplicate
        if invoice_number and len(invoice_number.strip()) >= 3:
            query = "SELECT id, merchant, date, total FROM transactions WHERE invoice_number = ?"
            params = [invoice_number.strip()]
            if current_tx_id:
                query += " AND id != ?"
                params.append(current_tx_id)

            row = conn.execute(query, params).fetchone()
            if row:
                return (
                    True,
                    row["id"],
                    f"Duplicate invoice number '{invoice_number}' matching recorded transaction from {row['merchant']} on {row['date']} for ${row['total']}."
                )

        # 2. Check exact total + same merchant + date within ±3 days
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            start_date = (target_date - timedelta(days=3)).strftime("%Y-%m-%d")
            end_date = (target_date + timedelta(days=3)).strftime("%Y-%m-%d")

            query = """
                SELECT id, merchant, date, total, invoice_number 
                FROM transactions 
                WHERE total = ? AND date BETWEEN ? AND ?
            """
            params = [total, start_date, end_date]
            if current_tx_id:
                query += " AND id != ?"
                params.append(current_tx_id)

            rows = conn.execute(query, params).fetchall()
            for r in rows:
                other_norm = cls.normalize_merchant(r["merchant"])
                if norm_merchant and other_norm:
                    if norm_merchant == other_norm or norm_merchant in other_norm or other_norm in norm_merchant:
                        days_diff = abs((datetime.strptime(r["date"], "%Y-%m-%d").date() - target_date).days)
                        day_text = "same day" if days_diff == 0 else f"{days_diff} days apart"
                        return (
                            True,
                            r["id"],
                            f"Suspected duplicate: identical amount ${total} for {r['merchant']} ({day_text}, dated {r['date']})."
                        )
        except Exception:
            pass

        return (False, None, None)

duplicate_service = DuplicateService()
