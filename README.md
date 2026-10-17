# LEDGERLENS

**Local-First AI Finance Assistant**  
*Organize invoices and receipts, review expense categories, flag duplicates, and generate reports—keeping documents and AI inference on your computer by default.*

---

## 🌟 Executive Summary

**LedgerLens** is a local-first financial document organizer built for freelancers, consultants, and small businesses. Users import digital invoices, receipts, and bank CSV exports, review extracted information, correct uncertain fields, identify explainable duplicates, ask natural-language questions about their approved expenses, and export RFC 4180-compliant CSV reports.

Its core differentiator is **not** simply adding a chat window to a dashboard. LedgerLens combines **deterministic document parsing and financial Decimal calculations** with a locally running **open-weight language model** (via Ollama). Amounts, totals, duplicate checks, and report calculations remain ordinary, auditable application logic—while the local model assists with ambiguous merchant descriptions, category suggestions, and translating natural-language queries into safe application filters.

---

<img width="1841" height="945" alt="image" src="https://github.com/user-attachments/assets/82735a29-5419-47b3-bc9b-d2c07734ec73" />
<img width="1886" height="797" alt="image" src="https://github.com/user-attachments/assets/8cf37b82-dc59-4050-9bef-cfa0f916a610" />


## ⚡ Core Features

- 📄 **Multi-Format Document Ingestion:** Extracts text from PDFs using **PyMuPDF**, handles image receipts via safe OCR fallback, and digests bank statement CSV files.
- 🔍 **Deterministic Candidate Extraction:** Identifies candidate merchant, date, total amount, currency, invoice number, and tax with zero hallucinated arithmetic.
- 🛡️ **Review & Approval Queue:** No extracted record is treated as confirmed until approved by the user. Easily review uncertain fields and AI suggestions before committing.
- 🔁 **Explainable Duplicate Detection:** Flags duplicates across identical SHA-256 file hashes, duplicate invoice numbers, or fuzzy merchant + amount + close date matches. **Never auto-deletes records.**
- 🦙 **Local Open-Weight AI Inference:** Integrates with Ollama (`qwen2.5:3b`, `llama3.2:3b`, `gemma2:2b`) on `localhost:11434` for category suggestions and description normalization.
- 💬 **Safe Natural-Language Queries:** Ask *"How much did I spend on Software this month?"* The model translates intent into validated filter schemas—arbitrary SQL execution is strictly prohibited.
- 📊 **Executive Finance Dashboard:** Interactive category breakdown donut charts, monthly spending trend area charts, and top merchant leaderboards powered by Recharts.
- 📥 **RFC 4180 CSV Export:** Download audit-ready spreadsheets with exact Decimal numbers.
- 🔒 **Privacy By Default:** Zero remote commercial AI API calls. Zero cloud telemetry. Works 100% offline.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, Pydantic-Settings |
| **Storage** | SQLite (WAL mode, Foreign Keys) with Decimal strings |
| **Calculations** | Python `decimal.Decimal` (Zero binary floating-point drift) |
| **PDF Extraction**| PyMuPDF (`pymupdf`) |
| **Local LLM** | Ollama Localhost API (`http://localhost:11434`) with structured JSON |
| **Testing** | Pytest, Pytest-Asyncio (19 unit & integration tests) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) [Ollama](https://ollama.com/) for local open-weight AI features

### 2. Backend Setup
```powershell
# Navigate to project root
python -m venv .venv
.\.venv\Scripts\pip install -r backend/requirements.txt

# Run FastAPI backend (http://127.0.0.1:8000)
$env:PYTHONPATH="backend"
.\.venv\Scripts\python -m uvicorn app.main:app --port 8000 --reload
```

### 3. Frontend Setup
```powershell
cd frontend
npm install

# Run Vite development server (http://localhost:5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Local AI Setup (Optional)
To enable local open-weight model category suggestions and natural-language queries:
```powershell
# Pull and start the recommended model in a separate terminal
ollama run qwen2.5:3b
```
LedgerLens automatically detects the running Ollama instance on `localhost:11434`. If Ollama is offline, LedgerLens seamlessly falls back to its deterministic heuristic engine.

---

## 🧪 Running Automated Tests

Run the complete backend test suite covering Decimal precision, duplicate detection, field extraction, report aggregations, query intent translation, and CSV exports:

```powershell
$env:PYTHONPATH="backend"
.\.venv\Scripts\pytest -v
```

All 19 tests pass in < 1 second with zero warnings!

---

## 📁 Repository Structure

```
DEV2/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (documents, transactions, reports, assistant, settings)
│   │   ├── db/              # SQLite database connection & schema
│   │   ├── schemas/         # Pydantic v2 data models
│   │   ├── services/        # Business logic (PyMuPDF parser, extractor, duplicates, decimal reports, Ollama LLM)
│   │   ├── config.py        # Application configuration
│   │   └── main.py          # FastAPI application entry point
│   ├── tests/               # Pytest automated test suite (19 tests)
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, MetricCard, StatusBadge, CategoryPill, DuplicateModal, etc.
│   │   ├── pages/           # Overview, Documents, ReviewQueue, Transactions, Reports, Assistant, Settings
│   │   ├── lib/             # API client
│   │   ├── types.ts         # TypeScript interfaces
│   │   ├── App.tsx          # Main shell & toast management
│   │   ├── main.tsx         # React mount
│   │   └── index.css        # Tailwind styling & glassmorphism
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── sample-data/             # Synthetic sample invoices, receipts, and CSV fixtures
│   ├── invoices/            # Synthetic PDF invoices (AWS, GitHub)
│   ├── receipts/            # Synthetic PDF receipts (Uber, Starbucks)
│   ├── csvs/                # Synthetic bank export CSV
│   └── README.md
├── scripts/
│   └── generate_sample_data.py # Generator for synthetic PDF/CSV fixtures
├── docs/
│   ├── ARCHITECTURE.md      # Detailed architecture & design decisions
│   ├── PRIVACY.md           # Local-first privacy disclosure
│   ├── LOCAL_AI_SETUP.md    # Ollama model configuration guide
│   └── DEMO_GUIDE.md        # Step-by-step walkthrough demo script
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

---

## 🔒 Security & Privacy by Default

- **No Data Leaves Your Computer:** Documents, extracted drafts, and ledger entries remain in local SQLite files (`./data/`).
- **No Model SQL Writing:** The LLM does not write raw SQL or execute code. Queries are safely translated into validated parameter objects.
- **Human Verification:** Extracted fields must be confirmed by the user before entering the permanent ledger.

---

## 📄 License

Distributed under the [MIT License](file:///d:/apna%20clg/HACKtober/DEV2/LICENSE).
