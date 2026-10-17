from typing import Optional, List, Any
from pydantic import BaseModel, Field

class CategorySuggestionRequest(BaseModel):
    merchant: str
    total: Optional[str] = None
    raw_text: Optional[str] = None
    existing_category: Optional[str] = None

class CategorySuggestionResponse(BaseModel):
    suggested_category: str
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    normalized_merchant: str

class NLQueryRequest(BaseModel):
    query: str

class ParsedQueryIntent(BaseModel):
    intent_type: str = "general_query"  # "category_spend", "merchant_spend", "total_spend", "monthly_spend", "list_expenses"
    category: Optional[str] = None
    merchant: Optional[str] = None
    month: Optional[str] = None  # YYYY-MM
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class NLQueryResponse(BaseModel):
    query: str
    parsed_intent: ParsedQueryIntent
    answer: str
    calculated_total: Optional[str] = None
    currency: str = "USD"
    matched_count: int = 0
    matched_transactions: List[dict] = Field(default_factory=list)
    model_used: Optional[str] = None
    is_llm_assisted: bool = False
    warning: Optional[str] = None

class OllamaStatusResponse(BaseModel):
    available: bool
    base_url: str
    configured_model: str
    available_models: List[str] = Field(default_factory=list)
    latency_ms: Optional[float] = None
    message: str
