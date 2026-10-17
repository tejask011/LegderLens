import json
import time
import re
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any, Tuple
import httpx
import logging

from app.config import settings
from app.schemas.assistant import (
    OllamaStatusResponse,
    CategorySuggestionResponse,
    ParsedQueryIntent,
    NLQueryResponse
)
from app.schemas.transaction import EXPENSE_CATEGORIES
from app.services.category_service import category_service
from app.services.report_service import report_service

logger = logging.getLogger(__name__)

class LocalLLMService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT_SECONDS

    async def check_status(self, custom_base_url: Optional[str] = None, custom_model: Optional[str] = None) -> OllamaStatusResponse:
        """
        Check if Ollama localhost API is active and discover loaded open-weight models.
        """
        url = (custom_base_url or self.base_url).rstrip("/")
        target_model = custom_model or self.model
        start_time = time.time()

        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{url}/api/tags")
                latency_ms = round((time.time() - start_time) * 1000, 1)

                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name", "") for m in data.get("models", [])]
                    model_found = any(target_model in m for m in models)
                    
                    msg = f"Connected to Ollama localhost. Configured model: '{target_model}'."
                    if not model_found and models:
                        msg = f"Ollama is online, but '{target_model}' is not in local tags. Available: {', '.join(models[:3])}."
                    elif not models:
                        msg = "Ollama is online, but no models are downloaded yet. Run 'ollama run qwen2.5:3b' to pull one."

                    return OllamaStatusResponse(
                        available=True,
                        base_url=url,
                        configured_model=target_model,
                        available_models=models,
                        latency_ms=latency_ms,
                        message=msg
                    )
        except Exception as e:
            logger.info(f"Ollama connection check failed at {url}: {e}")

        return OllamaStatusResponse(
            available=False,
            base_url=url,
            configured_model=target_model,
            available_models=[],
            latency_ms=None,
            message="Ollama instance not detected at localhost:11434. Non-AI workflows remain 100% operational."
        )

    async def suggest_category(
        self,
        merchant: str,
        total: Optional[str] = None,
        raw_text: Optional[str] = None
    ) -> Tuple[CategorySuggestionResponse, bool]:
        """
        Request open-weight AI to categorize expense and normalize merchant description.
        Falls back to deterministic rule-based engine if Ollama is unavailable.
        Returns (CategorySuggestionResponse, is_llm_assisted).
        """
        # First check if Ollama is available
        status = await self.check_status()
        if not status.available:
            cat, conf, reason = category_service.suggest_category_rule_based(
                merchant=merchant,
                raw_text=raw_text or ""
            )
            return (
                CategorySuggestionResponse(
                    suggested_category=cat,
                    confidence=conf,
                    reasoning=f"{reason} (Local AI offline, used rule-based fallback)",
                    normalized_merchant=merchant.strip()
                ),
                False
            )

        system_prompt = f"""You are a financial document assistant for LedgerLens.
Your task is to classify this transaction into exactly ONE of the following approved categories:
{json.dumps(EXPENSE_CATEGORIES)}

Respond ONLY with a JSON object in this exact schema:
{{
  "suggested_category": "one of the approved categories",
  "confidence": 0.95,
  "reasoning": "brief 1-sentence reason",
  "normalized_merchant": "clean business name without receipt clutter"
}}"""

        user_content = f"Merchant: {merchant}\nTotal: {total or 'Unknown'}\nDocument snippet:\n{raw_text[:400] if raw_text else 'N/A'}"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_content}
                        ],
                        "stream": False,
                        "format": "json"
                    }
                )

                if res.status_code == 200:
                    body = res.json()
                    msg_content = body.get("message", {}).get("content", "{}")
                    parsed = json.loads(msg_content)

                    # Validate category
                    cand_cat = parsed.get("suggested_category")
                    if cand_cat not in EXPENSE_CATEGORIES:
                        # Find closest match or fallback
                        cand_cat = "Other"

                    cand_conf = float(parsed.get("confidence", 0.8))
                    cand_conf = max(0.0, min(1.0, cand_conf))
                    cand_reason = parsed.get("reasoning", "Suggested by local open-weight model.")
                    cand_norm = parsed.get("normalized_merchant", merchant)

                    return (
                        CategorySuggestionResponse(
                            suggested_category=cand_cat,
                            confidence=cand_conf,
                            reasoning=cand_reason,
                            normalized_merchant=cand_norm
                        ),
                        True
                    )
        except Exception as e:
            logger.warning(f"Local LLM call failed: {e}. Falling back to rule-based categorizer.")

        # Fallback to rule engine
        cat, conf, reason = category_service.suggest_category_rule_based(merchant=merchant, raw_text=raw_text or "")
        return (
            CategorySuggestionResponse(
                suggested_category=cat,
                confidence=conf,
                reasoning=f"{reason} (Fallback invoked)",
                normalized_merchant=merchant.strip()
            ),
            False
        )

    def heuristic_parse_query(self, query: str) -> ParsedQueryIntent:
        """
        Safe deterministic fallback regex parser for natural-language questions.
        Translates query into structured filters without calling any LLM.
        """
        q = query.lower()

        # Check category
        matched_category = None
        for cat in EXPENSE_CATEGORIES:
            cat_words = [w.lower() for w in cat.split() if w not in {"&", "and"}]
            if any(w in q for w in cat_words):
                matched_category = cat
                break

        # Check month or date
        matched_month = None
        current_year = datetime.now().year
        # Check "this month"
        if "this month" in q or "current month" in q:
            matched_month = datetime.now().strftime("%Y-%m")
        elif "last month" in q:
            curr_m = datetime.now().month
            last_m = 12 if curr_m == 1 else curr_m - 1
            last_y = current_year - 1 if curr_m == 1 else current_year
            matched_month = f"{last_y}-{str(last_m).zfill(2)}"
        else:
            # Check month names
            month_names = {
                "january": "01", "february": "02", "march": "03", "april": "04",
                "may": "05", "june": "06", "july": "07", "august": "08",
                "september": "09", "october": "10", "november": "11", "december": "12"
            }
            for m_name, m_num in month_names.items():
                if m_name in q:
                    matched_month = f"{current_year}-{m_num}"
                    break

        # Check merchant
        matched_merchant = None
        for m in ["aws", "amazon", "github", "uber", "starbucks", "staples", "google", "slack", "zoom", "apple"]:
            if m in q:
                matched_merchant = m
                break

        intent_type = "general_query"
        if matched_category:
            intent_type = "category_spend"
        elif matched_merchant:
            intent_type = "merchant_spend"
        elif matched_month:
            intent_type = "monthly_spend"
        elif "total" in q or "spend" in q or "spent" in q or "how much" in q:
            intent_type = "total_spend"

        return ParsedQueryIntent(
            intent_type=intent_type,
            category=matched_category,
            merchant=matched_merchant,
            month=matched_month
        )

    async def parse_natural_language_query(self, query: str) -> Tuple[ParsedQueryIntent, bool]:
        """
        Translate user's query into safe application filter parameters using Ollama if available,
        or heuristic rule parser as fallback.
        NEVER generates or executes SQL.
        """
        status = await self.check_status()
        if not status.available:
            return self.heuristic_parse_query(query), False

        system_prompt = f"""You are a natural-language query parser for LedgerLens finance records.
Convert the user query into a validated filter JSON object.
Approved categories: {json.dumps(EXPENSE_CATEGORIES)}
Intent types: ["category_spend", "merchant_spend", "monthly_spend", "total_spend", "list_expenses"]

Respond ONLY with a JSON object in this exact schema:
{{
  "intent_type": "one of the allowed intent types",
  "category": "one of the approved categories or null",
  "merchant": "merchant name or null",
  "month": "YYYY-MM format or null",
  "start_date": "YYYY-MM-DD or null",
  "end_date": "YYYY-MM-DD or null"
}}"""

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": query}
                        ],
                        "stream": False,
                        "format": "json"
                    }
                )

                if res.status_code == 200:
                    body = res.json()
                    msg_content = body.get("message", {}).get("content", "{}")
                    parsed = json.loads(msg_content)

                    # Validate intent
                    intent_type = parsed.get("intent_type", "general_query")
                    cand_cat = parsed.get("category")
                    if cand_cat and cand_cat not in EXPENSE_CATEGORIES:
                        cand_cat = None

                    cand_month = parsed.get("month")
                    if cand_month and not re.match(r'^\d{4}-\d{2}$', str(cand_month)):
                        cand_month = None

                    intent = ParsedQueryIntent(
                        intent_type=intent_type,
                        category=cand_cat,
                        merchant=parsed.get("merchant"),
                        month=cand_month,
                        start_date=parsed.get("start_date"),
                        end_date=parsed.get("end_date")
                    )
                    return intent, True
        except Exception as e:
            logger.warning(f"Error parsing query with local model: {e}")

        # Fallback to heuristic parser
        return self.heuristic_parse_query(query), False

local_llm_service = LocalLLMService()
