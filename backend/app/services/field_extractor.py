import re
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from app.schemas.document import ExtractedCandidate

class FieldExtractor:
    # Common currency symbols and codes
    CURRENCY_SYMBOLS = {
        "$": "USD",
        "€": "EUR",
        "£": "GBP",
        "¥": "JPY",
        "₹": "INR",
        "A$": "AUD",
        "C$": "CAD",
        "USD": "USD",
        "EUR": "EUR",
        "GBP": "GBP",
        "CAD": "CAD",
        "AUD": "AUD"
    }

    # Month name to number mapping
    MONTHS = {
        "jan": 1, "january": 1,
        "feb": 2, "february": 2,
        "mar": 3, "march": 3,
        "apr": 4, "april": 4,
        "may": 5,
        "jun": 6, "june": 6,
        "jul": 7, "july": 7,
        "aug": 8, "august": 8,
        "sep": 9, "september": 9,
        "oct": 10, "october": 10,
        "nov": 11, "november": 11,
        "dec": 12, "december": 12
    }

    @classmethod
    def extract_currency(cls, text: str) -> str:
        """Detect currency from text, defaulting to USD."""
        for sym, code in cls.CURRENCY_SYMBOLS.items():
            if re.search(r'(?:^|\s|[0-9])' + re.escape(sym) + r'(?:\s|[0-9]|$)', text, re.IGNORECASE):
                return code
        return "USD"

    @classmethod
    def normalize_amount_str(cls, raw_val: str) -> Optional[str]:
        """Convert a raw money string into a clean decimal string like '49.99'."""
        if not raw_val:
            return None
        cleaned = re.sub(r'[^\d.,]', '', raw_val.strip())
        if not cleaned:
            return None

        # Handle European decimal comma if comma is the last separator e.g. "1.240,50" -> "1240.50"
        if "," in cleaned and "." in cleaned:
            if cleaned.rfind(",") > cleaned.rfind("."):
                cleaned = cleaned.replace(".", "").replace(",", ".")
            else:
                cleaned = cleaned.replace(",", "")
        elif "," in cleaned and "." not in cleaned:
            # Could be "1,200" or "49,99"
            parts = cleaned.split(",")
            if len(parts) == 2 and len(parts[1]) == 2:
                cleaned = parts[0] + "." + parts[1]
            else:
                cleaned = cleaned.replace(",", "")

        try:
            d = Decimal(cleaned)
            # Format to 2 decimal places
            return f"{d:.2f}"
        except Exception:
            return None

    @classmethod
    def extract_total(cls, text: str) -> Optional[str]:
        """
        Extract total amount from invoice/receipt text.
        Prioritizes lines containing 'Total', 'Amount Due', 'Grand Total', etc.
        """
        lines = text.splitlines()

        # Priority patterns for Total
        total_patterns = [
            r'(?:total\s+amount|grand\s+total|amount\s+due|balance\s+due|total\s+due|final\s+total)\s*[:=]?\s*[$€£₹]?\s*([\d,]+(?:\.\d{2})?)',
            r'(?:total|payment|paid)\s*[:=]?\s*[$€£₹]?\s*([\d,]+(?:\.\d{2})?)',
            r'[$€£₹]\s*([\d,]+\.\d{2})\b'
        ]

        # First try finding strong keywords on specific lines
        for pattern in total_patterns[:2]:
            for line in lines:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    val = cls.normalize_amount_str(match.group(1))
                    if val and Decimal(val) > 0:
                        return val

        # Fallback: find all monetary amounts ($xx.xx) and select largest reasonable amount
        all_amounts = []
        for line in lines:
            matches = re.findall(r'[$€£₹]?\s*([\d,]+\.\d{2})', line)
            for m in matches:
                amt = cls.normalize_amount_str(m)
                if amt:
                    try:
                        all_amounts.append(Decimal(amt))
                    except Exception:
                        pass

        if all_amounts:
            max_amt = max(all_amounts)
            return f"{max_amt:.2f}"

        return None

    @classmethod
    def extract_tax(cls, text: str) -> Optional[str]:
        """Extract sales tax, VAT, or GST amount."""
        patterns = [
            r'(?:sales\s+tax|tax|vat|gst)\s*[:=]?\s*[$€£₹]?\s*([\d,]+(?:\.\d{2})?)',
            r'(?:tax\s+amount)\s*[:=]?\s*[$€£₹]?\s*([\d,]+(?:\.\d{2})?)'
        ]
        for line in text.splitlines():
            for p in patterns:
                m = re.search(p, line, re.IGNORECASE)
                if m:
                    amt = cls.normalize_amount_str(m.group(1))
                    if amt:
                        return amt
        return None

    @classmethod
    def extract_date(cls, text: str, filename: str = "") -> Optional[str]:
        """Extract transaction date in ISO YYYY-MM-DD format."""
        # 1. ISO format: 2026-10-15 or 2026/10/15
        iso_match = re.search(r'\b(20\d{2})[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b', text)
        if iso_match:
            y, m, d = iso_match.groups()
            return f"{y}-{m.zfill(2)}-{d.zfill(2)}"

        # 2. Textual month format: "October 15, 2026" or "15 Oct 2026"
        text_match = re.search(
            r'\b([a-zA-Z]{3,9})\s+([0-3]?\d)(?:st|nd|rd|th)?,\s*(20\d{2})\b',
            text,
            re.IGNORECASE
        )
        if text_match:
            month_str, day_str, year_str = text_match.groups()
            m_num = cls.MONTHS.get(month_str.lower()[:3])
            if m_num:
                return f"{year_str}-{str(m_num).zfill(2)}-{day_str.zfill(2)}"

        text_match2 = re.search(
            r'\b([0-3]?\d)\s+([a-zA-Z]{3,9})\s+(20\d{2})\b',
            text,
            re.IGNORECASE
        )
        if text_match2:
            day_str, month_str, year_str = text_match2.groups()
            m_num = cls.MONTHS.get(month_str.lower()[:3])
            if m_num:
                return f"{year_str}-{str(m_num).zfill(2)}-{day_str.zfill(2)}"

        # 3. Standard MM/DD/YYYY or DD/MM/YYYY
        slash_match = re.search(r'\b(0?[1-9]|1[0-2])/(0?[1-9]|[12]\d|3[01])/(20\d{2})\b', text)
        if slash_match:
            m, d, y = slash_match.groups()
            return f"{y}-{m.zfill(2)}-{d.zfill(2)}"

        # 4. Check filename for date pattern e.g. receipt_2026-10-14.pdf
        fn_match = re.search(r'(20\d{2})[-_](0[1-9]|1[0-2])[-_](0[1-9]|[12]\d|3[01])', filename)
        if fn_match:
            y, m, d = fn_match.groups()
            return f"{y}-{m.zfill(2)}-{d.zfill(2)}"

        return None

    @classmethod
    def extract_invoice_number(cls, text: str) -> Optional[str]:
        """Extract invoice, receipt, or order number."""
        patterns = [
            r'(?:invoice\s*(?:#|no\.?|num(?:ber)?)|inv#|inv\s*no)\s*[:=]?\s*([A-Za-z0-9\-_]{3,30})',
            r'(?:receipt\s*(?:#|no\.?|num(?:ber)?))\s*[:=]?\s*([A-Za-z0-9\-_]{3,30})',
            r'(?:order\s*(?:#|id|no\.?|num(?:ber)?))\s*[:=]?\s*([A-Za-z0-9\-_]{3,30})'
        ]
        for line in text.splitlines():
            for p in patterns:
                m = re.search(p, line, re.IGNORECASE)
                if m:
                    cand = m.group(1).strip()
                    # Discard if it looks like common word
                    if cand.lower() not in {"date", "total", "amount", "due", "paid"}:
                        return cand
        return None

    @classmethod
    def extract_merchant(cls, text: str, filename: str = "") -> Optional[str]:
        """
        Extract merchant / vendor name.
        Looks at prominent top lines and known merchant signatures.
        """
        # Known merchant signatures dictionary
        known_merchants = [
            "Amazon Web Services", "AWS", "GitHub", "Google Cloud", "DigitalOcean",
            "Slack Technologies", "Zoom Video", "Stripe", "Figma", "Notion",
            "Vercel", "Heroku", "OpenAI", "Anthropic", "Apple Store", "Apple", "Microsoft",
            "Uber", "Lyft", "Delta Air Lines", "United Airlines", "American Airlines",
            "Starbucks", "Staples", "Office Depot", "Best Buy", "Home Depot",
            "WeWork", "Mailchimp", "Cloudflare", "Atlassian", "Adobe"
        ]

        lines = [line.strip() for line in text.splitlines() if line.strip()]
        header_text = " ".join(lines[:4]).lower()

        # Check top lines against known merchants first
        for km in known_merchants:
            # Avoid matching Apple if it's just "Apple Pay"
            if km.lower() == "apple" and "apple pay" in header_text:
                continue
            if re.search(r'\b' + re.escape(km.lower()) + r'\b', header_text):
                return km

        # Check filename if merchant name is encoded e.g. "uber_trip_receipt.pdf"
        clean_fn = re.sub(r'[\-_.]', ' ', filename).lower()
        for km in known_merchants:
            if re.search(r'\b' + re.escape(km.lower()) + r'\b', clean_fn):
                return km

        # Check entire text against known merchants (excluding payment methods)
        text_lower = text.lower()
        for km in known_merchants:
            if km.lower() == "apple" and ("apple pay" in text_lower and not "apple.com" in text_lower and not "apple store" in text_lower):
                continue
            if re.search(r'\b' + re.escape(km.lower()) + r'\b', text_lower):
                return km

        # Look at the first 5 non-empty lines for vendor header
        for line in lines[:5]:
            if re.match(r'^(invoice|receipt|bill|statement|tax invoice|order)\b', line, re.IGNORECASE):
                continue
            if len(line) >= 3 and len(line) <= 50 and not re.search(r'\d{4}', line):
                cleaned_line = re.sub(r'^(from|vendor|biller|merchant)\s*:\s*', '', line, flags=re.IGNORECASE)
                return cleaned_line.strip()

        # Filename fallback without extension
        fn_base = re.sub(r'\.[a-zA-Z0-9]+$', '', filename)
        fn_base_clean = re.sub(r'[_\-]+', ' ', fn_base).strip()
        if fn_base_clean:
            return fn_base_clean.title()

        return None

    @classmethod
    def extract_candidate(
        cls,
        document_id: str,
        filename: str,
        text: str
    ) -> ExtractedCandidate:
        """
        Extract candidate fields and flag uncertain/missing values for user review.
        """
        merchant = cls.extract_merchant(text, filename)
        date = cls.extract_date(text, filename)
        total = cls.extract_total(text)
        currency = cls.extract_currency(text)
        tax = cls.extract_tax(text)
        invoice_num = cls.extract_invoice_number(text)

        uncertain_fields = []
        if not merchant or len(merchant) < 2:
            uncertain_fields.append("merchant")
        if not date:
            uncertain_fields.append("date")
        if not total:
            uncertain_fields.append("total")
        if not invoice_num:
            uncertain_fields.append("invoice_number")

        raw_snippet = text[:500] if text else ""

        return ExtractedCandidate(
            document_id=document_id,
            filename=filename,
            merchant=merchant or "Unknown Merchant",
            date=date or datetime.today().strftime("%Y-%m-%d"),
            total=total or "0.00",
            currency=currency,
            tax=tax,
            invoice_number=invoice_num,
            uncertain_fields=uncertain_fields,
            raw_text_snippet=raw_snippet
        )

field_extractor = FieldExtractor()
