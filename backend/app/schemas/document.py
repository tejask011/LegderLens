from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class DocumentBase(BaseModel):
    filename: str
    file_type: str
    file_size: int

class DocumentCreate(DocumentBase):
    filepath: str
    file_hash: str
    extracted_text: Optional[str] = None
    extraction_method: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: str
    file_hash: str
    uploaded_at: str
    extracted_text: Optional[str] = None
    extraction_method: Optional[str] = None
    status: str

    model_config = ConfigDict(from_attributes=True)

class ExtractedCandidate(BaseModel):
    document_id: str
    filename: str
    merchant: Optional[str] = None
    date: Optional[str] = None
    total: Optional[str] = None
    currency: str = "USD"
    tax: Optional[str] = None
    invoice_number: Optional[str] = None
    suggested_category: str = "Other"
    category_confidence: float = 0.0
    category_reasoning: Optional[str] = None
    uncertain_fields: List[str] = Field(default_factory=list)
    raw_text_snippet: Optional[str] = None
    is_duplicate: bool = False
    duplicate_reason: Optional[str] = None
    duplicate_of_id: Optional[str] = None
