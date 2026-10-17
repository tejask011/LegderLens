# Contributing to LedgerLens

Thank you for your interest in contributing to LedgerLens! We welcome contributions that improve document parsing, offline reliability, UX polish, and open-source local AI workflows.

## Development Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/ledgerlens.git
   cd ledgerlens
   ```

2. **Backend Setup:**
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\pip install -r backend/requirements.txt
   ```

3. **Frontend Setup:**
   ```powershell
   cd frontend
   npm install
   ```

## Running Tests

Before submitting a Pull Request, please ensure all backend test suites pass:
```powershell
$env:PYTHONPATH="backend"
.\.venv\Scripts\pytest -v
```

And verify the frontend builds cleanly without TypeScript or bundling errors:
```powershell
cd frontend
npm run build
```

## Contribution Principles

- **Local-First Always:** Avoid introducing mandatory remote cloud dependencies or telemetry.
- **Deterministic Financial Arithmetic:** Use `decimal.Decimal` in Python for all financial calculations. Never use binary floating-point math for money.
- **Safety First:** The LLM must never be allowed to execute arbitrary SQL or system commands. All model outputs must be validated by Pydantic schemas.
- **Explainable Duplicates:** Never silently auto-delete duplicate records. Always present explainable reasons to the user.
