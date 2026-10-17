import csv
import io
from typing import List, Dict, Any, Optional
import sqlite3

class ExportService:
    @staticmethod
    def export_transactions_to_csv(
        conn: sqlite3.Connection,
        approved_only: bool = True,
        category: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> str:
        """
        Generate an RFC 4180 CSV export of transactions with exact Decimal amounts.
        """
        where_clauses = []
        params = []

        if approved_only:
            where_clauses.append("is_approved = 1")
        if category:
            where_clauses.append("category = ?")
            params.append(category)
        if start_date:
            where_clauses.append("date >= ?")
            params.append(start_date)
        if end_date:
            where_clauses.append("date <= ?")
            params.append(end_date)

        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

        query = f"""
            SELECT 
                id, date, merchant, category, total, currency, tax, 
                invoice_number, is_approved, is_duplicate, duplicate_reason,
                suggested_category, notes, created_at
            FROM transactions
            {where_sql}
            ORDER BY date DESC
        """
        rows = conn.execute(query, params).fetchall()

        output = io.StringIO()
        fieldnames = [
            "Transaction ID",
            "Date",
            "Merchant",
            "Category",
            "Total Amount",
            "Currency",
            "Tax",
            "Invoice Number",
            "Approved",
            "Is Duplicate",
            "Duplicate Reason",
            "AI Suggested Category",
            "Notes"
        ]

        writer = csv.writer(output, lineterminator="\n")
        writer.writerow(fieldnames)

        for r in rows:
            writer.writerow([
                r["id"],
                r["date"],
                r["merchant"],
                r["category"],
                r["total"],
                r["currency"],
                r["tax"] or "",
                r["invoice_number"] or "",
                "Yes" if r["is_approved"] == 1 else "No",
                "Yes" if r["is_duplicate"] == 1 else "No",
                r["duplicate_reason"] or "",
                r["suggested_category"] or "",
                r["notes"] or ""
            ])

        return output.getvalue()

export_service = ExportService()
