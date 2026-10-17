import pytest
from app.services.local_llm import local_llm_service
from app.schemas.assistant import CategorySuggestionResponse, ParsedQueryIntent

def test_heuristic_query_category_intent():
    intent = local_llm_service.heuristic_parse_query("How much did I spend on Software & Subscriptions this month?")
    assert intent.intent_type == "category_spend"
    assert intent.category == "Software & Subscriptions"
    assert intent.month is not None

def test_heuristic_query_merchant_intent():
    intent = local_llm_service.heuristic_parse_query("Show me all AWS receipts in October")
    assert intent.intent_type == "merchant_spend" or intent.merchant == "aws"
    assert intent.merchant == "aws"

def test_category_suggestion_schema_validation():
    resp = CategorySuggestionResponse(
        suggested_category="Software & Subscriptions",
        confidence=0.92,
        reasoning="Matched developer tools",
        normalized_merchant="GitHub Inc"
    )
    assert resp.suggested_category == "Software & Subscriptions"
    assert 0.0 <= resp.confidence <= 1.0

def test_confidence_validation_bounds():
    with pytest.raises(Exception):
        CategorySuggestionResponse(
            suggested_category="Software & Subscriptions",
            confidence=1.5,  # Exceeds max 1.0
            reasoning="Invalid",
            normalized_merchant="Test"
        )
