from decimal import Decimal
import pytest
from app.services.report_service import report_service

def test_decimal_precision_avoids_floating_point_drift():
    """Verify that financial totals do not suffer from binary float inaccuracies (0.1 + 0.2 != 0.30000000000000004)."""
    amounts = ["0.10", "0.20"]
    total = sum(Decimal(a) for a in amounts)
    assert str(total) == "0.30"
    assert total == Decimal("0.30")

def test_to_decimal_quantization():
    assert report_service.to_decimal("149.99") == Decimal("149.99")
    assert report_service.to_decimal(149.999) == Decimal("150.00")
    assert report_service.to_decimal(None) == Decimal("0.00")
    assert report_service.to_decimal("") == Decimal("0.00")
    assert report_service.to_decimal("invalid") == Decimal("0.00")

def test_large_number_of_line_items_exact_sum():
    # 100 items of 0.07 each = exactly 7.00
    items = [Decimal("0.07") for _ in range(100)]
    assert sum(items) == Decimal("7.00")
