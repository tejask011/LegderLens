from typing import Optional, List
from pydantic import BaseModel

class AppSettings(BaseModel):
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:3b"
    default_currency: str = "USD"
    auto_suggest_categories: bool = True

class AppSettingsUpdate(BaseModel):
    ollama_base_url: Optional[str] = None
    ollama_model: Optional[str] = None
    default_currency: Optional[str] = None
    auto_suggest_categories: Optional[bool] = None

class SystemHealthResponse(BaseModel):
    status: str
    database_ok: bool
    document_count: int
    transaction_count: int
    approved_count: int
    ollama_status: dict
    storage_path: str
