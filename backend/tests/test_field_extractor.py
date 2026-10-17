from app.services.field_extractor import field_extractor

def test_extract_total_from_invoice():
    sample_text = """
    INVOICE
    AWS Services
    Subtotal: $120.00
    Tax: $9.60
    Total Amount Due: $129.60
    Thank you for your business!
    """
    total = field_extractor.extract_total(sample_text)
    assert total == "129.60"

def test_extract_date_formats():
    assert field_extractor.extract_date("Date: 2026-10-15") == "2026-10-15"
    assert field_extractor.extract_date("Billed on October 12, 2026") == "2026-10-12"
    assert field_extractor.extract_date("Tx Date: 09/24/2026") == "2026-09-24"

def test_extract_currency():
    assert field_extractor.extract_currency("Amount: $45.00") == "USD"
    assert field_extractor.extract_currency("Amount: €100.00") == "EUR"
    assert field_extractor.extract_currency("Amount: £32.50") == "GBP"

def test_extract_invoice_number():
    sample = "Invoice #: INV-2026-9041\nDate: 2026-10-01"
    assert field_extractor.extract_invoice_number(sample) == "INV-2026-9041"

def test_extract_candidate_uncertainty():
    sparse_text = "Some random memo with no total or merchant"
    cand = field_extractor.extract_candidate("doc-1", "receipt.pdf", sparse_text)
    assert "total" in cand.uncertain_fields
