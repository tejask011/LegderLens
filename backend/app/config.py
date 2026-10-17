from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "LedgerLens"
    VERSION: str = "0.1.0"
    API_PREFIX: str = "/api"

    # Base workspace data directory
    WORKSPACE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = WORKSPACE_DIR / "data"
    DOCUMENTS_DIR: Path = WORKSPACE_DIR / "data" / "documents"
    EXPORTS_DIR: Path = WORKSPACE_DIR / "data" / "exports"
    DB_PATH: Path = WORKSPACE_DIR / "data" / "ledgerlens.db"

    # Ollama settings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:3b"
    OLLAMA_TIMEOUT_SECONDS: float = 30.0

    # Document extraction limits
    MAX_FILE_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    ALLOWED_EXTENSIONS: set = {".pdf", ".png", ".jpg", ".jpeg", ".csv"}

    # OCR settings
    ENABLE_OCR: bool = True
    TESSERACT_CMD: str | None = None

    model_config = SettingsConfigDict(env_prefix="LEDGERLENS_", env_file=".env")

settings = Settings()

# Ensure required runtime directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
settings.EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
