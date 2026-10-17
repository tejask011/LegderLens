# LedgerLens Architecture & Design Specification

LedgerLens is designed as a **local-first** financial document assistant. It pairs deterministic document parsing and Decimal financial calculations with a locally-running open-weight large language model.

## Core Architectural Principles

1. **Local-First & Offline By Default:** All database storage, file handling, and AI inference execute on `localhost`. No financial documents or summaries are ever transmitted to remote commercial AI APIs.
2. **Strict Separation of Concerns:**
   - **Deterministic Application Code:** Computes financial arithmetic, totals, sales tax, currency formatting, multi-factor duplicate checks, and report aggregations.
   - **Open-Weight AI Model:** Suggests expense categories, explains ambiguous transaction strings, and translates natural-language queries into validated filter schemas.
3. **No Direct Model Database Execution:** The AI model **never** generates or executes arbitrary SQL, runs shell commands, or mutates the database directly. All database queries use parameterized SQLite statements strictly controlled by application code.
4. **Human Review Before Commitment:** Extracted records are treated as candidate drafts until reviewed and approved by the user.

```
+-------------------------------------------------------------------------+
|                              REACT FRONTEND                             |
|  Overview • Documents • Review Queue • Transactions • Reports • AI Chat |
+------------------------------------+------------------------------------+
                                     |  HTTP REST (/api)
+------------------------------------v------------------------------------+
|                             FASTAPI BACKEND                             |
|                                                                         |
|  +--------------------+   +---------------------+   +----------------+  |
|  |  Document Parser   |   |   Field Extractor   |   |   Duplicates   |  |
|  |  (PyMuPDF / OCR)   |-->| (Merchant, Date, $) |-->| (Hash, Match)  |  |
|  +--------------------+   +---------------------+   +----------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                        Report & Math Engine                       |  |
|  |                Python Decimal (Exact Financial Sums)              |  |
|  +-------------------------------------------------------------------+  |
+-------------------+---------------------------------+-------------------+
                    |                                 |
+-------------------v-------------------+ +-----------v-------------------+
|            LOCAL SQLITE DB            | |      OLLAMA RUNTIME (LOCAL)   |
|   documents • transactions • settings | |  qwen2.5:3b / llama3.2:3b     |
|   Exact TEXT Decimals & Foreign Keys  | |  Structured Pydantic Schemas  |
+---------------------------------------+ +-------------------------------+
```

## Money Arithmetic & Decimal Precision

Binary floating-point types (`float` in Python or `number` in JavaScript) are notoriously unsafe for accounting due to precision drift (e.g. `0.1 + 0.2 = 0.30000000000000004`).

In LedgerLens:
- All monetary totals are stored as exact `TEXT` representation in SQLite (e.g., `'149.99'`).
- In Python, amounts are parsed and accumulated using `decimal.Decimal` with explicit `ROUND_HALF_UP` quantization.
- Financial reports produce exact, RFC 4180-compliant decimal figures.

## Duplicate Detection Engine

LedgerLens implements explainable duplicate detection with zero silent deletions:
1. **File Hash Collision:** SHA-256 hash match against previously ingested documents.
2. **Duplicate Invoice Number:** Checks if an invoice number already exists for a merchant.
3. **Fuzzy Multi-Factor Match:** Checks if candidate has the same normalized merchant, identical total amount, and transaction date within ±3 days.
