from typing import List, Optional
from pydantic import BaseModel

class CategorySummary(BaseModel):
    category: str
    total_amount: str  # Exact Decimal string
    percentage: float
    transaction_count: int

class MonthlyTrend(BaseModel):
    month: str  # YYYY-MM
    total_amount: str
    transaction_count: int

class MerchantSummary(BaseModel):
    merchant: str
    total_amount: str
    transaction_count: int

class OverviewReport(BaseModel):
    total_spend: str
    total_transactions: int
    approved_count: int
    pending_count: int
    duplicate_count: int
    categories_breakdown: List[CategorySummary]
    monthly_trends: List[MonthlyTrend]
    top_merchants: List[MerchantSummary]
    currency: str = "USD"
