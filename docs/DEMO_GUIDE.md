# LedgerLens Demonstration & Evaluation Script

Follow this step-by-step walkthrough to test and demonstrate the complete LedgerLens workflow.

---

### Step 1: Launch LedgerLens Backend & Frontend

1. **Start the FastAPI Backend:**
   ```powershell
   $env:PYTHONPATH="backend"
   .\.venv\Scripts\python -m uvicorn app.main:app --port 8000 --reload
   ```

2. **Start the Vite Frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

### Step 2: Seed or Import Sample Financial Documents

You can either:
- **Click "Seed Demo Data"** in the top navigation bar to instantly populate 10 realistic freelance records, or
- **Navigate to the "Documents" tab** and drag & drop the sample files from `sample-data/`:
  - `sample-data/invoices/aws_cloud_invoice.pdf`
  - `sample-data/invoices/github_copilot_teams.pdf`
  - `sample-data/receipts/uber_trip_receipt.pdf`
  - `sample-data/receipts/starbucks_meeting.pdf`
  - `sample-data/csvs/q3_freelance_expenses.csv`

---

### Step 3: Review Queue & Candidate Approval

1. Click on the **Review Queue** tab.
2. Note how extracted candidate values (merchant name, date, exact total, invoice #) are displayed as drafts.
3. Observe the **AI Category Suggestion** pill with confidence score and reasoning.
4. Click **Edit** on any record to adjust ambiguous descriptions or amounts, then click **Save & Approve**.
5. Use **Batch Approve** to confirm multiple records at once to your SQLite ledger.

---

### Step 4: Explainable Duplicate Detection

1. If you upload the same receipt twice or use the synthetic seed, notice the **Duplicate Flagged** badge.
2. Click the duplicate badge to open the **Duplicate Comparison Modal**.
3. View the explainable match reason (e.g., identical amount and merchant within close dates, or matching invoice #).
4. Notice that LedgerLens **never silently deletes** records—it provides choices: *Delete Duplicate* or *Keep & Confirm Record*.

---

### Step 5: Ask Natural-Language Questions in the AI Assistant

1. Click on the **AI Assistant** tab.
2. Select a suggested prompt or type:
   > *"How much did I spend on Software & Subscriptions this month?"*
3. Observe:
   - The verified answer in plain English.
   - The large bold total calculated by deterministic Python Decimal math.
   - The **Parsed Filter Intent** inspector proving that the LLM converted intent into safe application parameters, not arbitrary SQL.
   - The list of matched transactions below the answer.

---

### Step 6: Reports & Deterministic CSV Export

1. Navigate to the **Reports** tab.
2. Review the monthly spend summary and standard category allocation tables.
3. Click **Download Complete CSV Report** or export a specific month.
4. Open the CSV in Excel or a text editor to verify exact decimal amounts, RFC 4180 formatting, and audit metadata.
