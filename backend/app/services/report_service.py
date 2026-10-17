from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, List, Dict, Any
import sqlite3
from app.schemas.report import (
    OverviewReport,
    CategorySummary,
    MonthlyTrend,
    MerchantSummary
)

class ReportService:
    @staticmethod
    def to_decimal(val: Any) -> Decimal:
        """Safely convert value to 2-decimal places Decimal."""
        if val is None or val == "":
            return Decimal("0.00")
        try:
            return Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        except Exception:
            return Decimal("0.00")

    @classmethod
    def get_overview_report(
        cls,
        conn: sqlite3.Connection,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        category: Optional[str] = None,
        approved_only: bool = True
    ) -> OverviewReport:
        """
        Compute high-level finance overview metrics with deterministic Decimal calculations.
        """
        where_clauses = []
        params: List[Any] = []

        if approved_only:
            where_clauses.append("is_approved = 1")
        if start_date:
            where_clauses.append("date >= ?")
            params.append(start_date)
        if end_date:
            where_clauses.append("date <= ?")
            params.append(end_date)
        if category:
            where_clauses.append("category = ?")
            params.append(category)

        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

        # Fetch records
        query = f"""
            SELECT id, merchant, date, total, category, is_approved, is_duplicate
            FROM transactions
            {where_sql}
            ORDER BY date DESC
        """
        rows = conn.execute(query, params).fetchall()

        # Compute totals using Decimal
        total_spend = Decimal("0.00")
        total_tx = len(rows)
        approved_count = 0
        pending_count = 0
        duplicate_count = 0

        # Accumulators
        category_totals: Dict[str, Decimal] = {}
        category_counts: Dict[str, int] = {}
        monthly_totals: Dict[str, Decimal] = {}
        monthly_counts: Dict[str, int] = {}
        merchant_totals: Dict[str, Decimal] = {}
        merchant_counts: Dict[str, int] = {}

        for r in rows:
            amt = cls.to_decimal(r["total"])
            total_spend += amt

            if r["is_approved"] == 1:
                approved_count += 1
            else:
                pending_count += 1

            if r["is_duplicate"] == 1:
                duplicate_count += 1

            # Category
            cat = r["category"] or "Other"
            category_totals[cat] = category_totals.get(cat, Decimal("0.00")) + amt
            category_counts[cat] = category_counts.get(cat, 0) + 1

            # Monthly trend (YYYY-MM)
            date_val = r["date"] or ""
            month_key = date_val[:7] if len(date_val) >= 7 else "Unknown"
            monthly_totals[month_key] = monthly_totals.get(month_key, Decimal("0.00")) + amt
            monthly_counts[month_key] = monthly_counts.get(month_key, 0) + 1

            # Merchant
            merch = r["merchant"] or "Unknown"
            merchant_totals[merch] = merchant_totals.get(merch, Decimal("0.00")) + amt
            merchant_counts[merch] = merchant_counts.get(merch, 0) + 1

        # Calculate percentages
        categories_breakdown: List[CategorySummary] = []
        for cat, cat_amt in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
            pct = 0.0
            if total_spend > Decimal("0.00"):
                pct = float((cat_amt / total_spend * Decimal("100")).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))
            categories_breakdown.append(CategorySummary(
                category=cat,
                total_amount=f"{cat_amt:.2f}",
                percentage=pct,
                transaction_count=category_counts[cat]
            ))

        # Sort monthly trends chronologically
        monthly_trends: List[MonthlyTrend] = []
        for month in sorted([m for m in monthly_totals.keys() if m != "Unknown"]):
            monthly_trends.append(MonthlyTrend(
                month=month,
                total_amount=f"{monthly_totals[month]:.2f}",
                transaction_count=monthly_counts[month]
            ))

        # Top merchants by spend
        top_merchants: List[MerchantSummary] = []
        for merch, merch_amt in sorted(merchant_totals.items(), key=lambda x: x[1], reverse=True)[:10]:
            top_merchants.append(MerchantSummary(
                merchant=merch,
                total_amount=f"{merch_amt:.2f}",
                transaction_count=merchant_counts[merch]
            ))

        return OverviewReport(
            total_spend=f"{total_spend:.2f}",
            total_transactions=total_tx,
            approved_count=approved_count,
            pending_count=pending_count,
            duplicate_count=duplicate_count,
            categories_breakdown=categories_breakdown,
            monthly_trends=monthly_trends,
            top_merchants=top_merchants,
            currency="USD"
        )

report_service = ReportService()
