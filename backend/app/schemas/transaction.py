from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

EXPENSE_CATEGORIES = [
    "Software & Subscriptions",
    "Office Supplies",
    "Travel & Transport",
    "Meals & Entertainment",
    "Professional Services",
    "Utilities & Internet",
    "Marketing & Advertising",
    "Hardware & Equipment",
    "Taxes & Fees",
    "Other"
]

class TransactionBase(BaseModel):
    merchant: str
    date: str  # YYYY-MM-DD
    total: str  # Exact decimal string, e.g. "149.99"
    currency: str = "USD"
    tax: Optional[str] = None
    invoice_number: Optional[str] = None
    category: str = "Other"
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    document_id: Optional[str] = None
    suggested_category: Optional[str] = None
    category_confidence: Optional[float] = 0.0
    category_reasoning: Optional[str] = None
    is_approved: bool = False
    is_duplicate: bool = False
    duplicate_of_id: Optional[str] = None
    duplicate_reason: Optional[str] = None

class TransactionUpdate(BaseModel):
    merchant: Optional[str] = None
    date: Optional[str] = None
    total: Optional[str] = None
    currency: Optional[str] = None
    tax: Optional[str] = None
    invoice_number: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    is_approved: Optional[bool] = None

class TransactionResponse(TransactionBase):
    id: str
    document_id: Optional[str] = None
    suggested_category: Optional[str] = None
    category_confidence: float = 0.0
    category_reasoning: Optional[str] = None
    is_approved: bool
    is_duplicate: bool
    duplicate_of_id: Optional[str] = None
    duplicate_reason: Optional[str] = None
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)

class BatchApproveRequest(BaseModel):
    transaction_ids: List[str]

class TransactionFilter(BaseModel):
    search: Optional[str] = None
    category: Optional[str] = None
    merchant: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_approved: Optional[bool] = None
    is_duplicate: Optional[bool] = None
