from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import PlainTextResponse
import sqlite3

from app.db.database import get_db
from app.schemas.report import OverviewReport
from app.services.report_service import report_service
from app.services.export_service import export_service

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/overview", response_model=OverviewReport)
def get_overview_report(
    conn: sqlite3.Connection = Depends(get_db),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    approved_only: bool = Query(True, description="Calculate report based on confirmed approved records")
):
    """
    Get deterministic high-level overview metrics, monthly trends, and category breakdowns.
    All monetary sums are computed using Python Decimal arithmetic.
    """
    return report_service.get_overview_report(
        conn=conn,
        start_date=start_date,
        end_date=end_date,
        category=category,
        approved_only=approved_only
    )

@router.get("/export-csv")
def export_csv_report(
    conn: sqlite3.Connection = Depends(get_db),
    approved_only: bool = Query(True),
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Export financial records as a downloadable CSV.
    """
    csv_content = export_service.export_transactions_to_csv(
        conn=conn,
        approved_only=approved_only,
        category=category,
        start_date=start_date,
        end_date=end_date
    )

    filename = f"ledgerlens_export_{start_date or 'all'}_to_{end_date or 'latest'}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
