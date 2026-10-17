from pathlib import Path
import pymupdf
import csv

WORKSPACE = Path(__file__).resolve().parent.parent
SAMPLE_DIR = WORKSPACE / "sample-data"
INVOICES_DIR = SAMPLE_DIR / "invoices"
RECEIPTS_DIR = SAMPLE_DIR / "receipts"
CSVS_DIR = SAMPLE_DIR / "csvs"

INVOICES_DIR.mkdir(parents=True, exist_ok=True)
RECEIPTS_DIR.mkdir(parents=True, exist_ok=True)
CSVS_DIR.mkdir(parents=True, exist_ok=True)

def create_pdf(filepath: Path, title: str, lines: list):
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842) # A4
    y = 50
    page.insert_text((50, y), title, fontsize=18, fontname="helv", color=(0.1, 0.2, 0.4))
    y += 35
    for line in lines:
        page.insert_text((50, y), line, fontsize=11, fontname="helv", color=(0.2, 0.2, 0.2))
        y += 20
    doc.save(str(filepath))
    doc.close()
    print(f"Created {filepath}")

# 1. AWS Invoice PDF
create_pdf(
    INVOICES_DIR / "aws_cloud_invoice.pdf",
    "AMAZON WEB SERVICES - TAX INVOICE",
    [
        "Invoice Number: INV-AWS-2026-10",
        "Invoice Date: 2026-10-02",
        "Billing Period: September 1 - September 30, 2026",
        "",
        "Billed To: Antigravity Labs LLC",
        "Account ID: 9481-2091-8841",
        "",
        "Item Breakdown:",
        "1. Amazon Elastic Compute Cloud (EC2) - Linux t4g.medium: $112.50",
        "2. Amazon Simple Storage Service (S3) Standard Storage: $32.40",
        "3. Amazon Relational Database Service (RDS) Postgres: $39.30",
        "",
        "Subtotal: $184.20",
        "Estimated Tax: $14.74",
        "Total Amount Due: $198.94 USD",
        "",
        "Status: Paid via Corporate Visa ending in 4091"
    ]
)

# 2. GitHub Invoice PDF
create_pdf(
    INVOICES_DIR / "github_copilot_teams.pdf",
    "GITHUB, INC. - RECEIPT / INVOICE",
    [
        "Invoice #: GH-9482910",
        "Date: 2026-10-05",
        "Payment Method: Stripe (Visa 4091)",
        "",
        "Description:",
        "GitHub Team Plan (5 seats) - October 2026: $20.00",
        "GitHub Copilot Business Add-on: $29.00",
        "",
        "Total: $49.00 USD",
        "Tax: $0.00",
        "Amount Paid: $49.00",
        "",
        "Thank you for building on GitHub!"
    ]
)

# 3. Uber Trip Receipt PDF
create_pdf(
    RECEIPTS_DIR / "uber_trip_receipt.pdf",
    "UBER TRIP RECEIPT",
    [
        "Receipt #: UBER-77192",
        "Date: October 8, 2026",
        "Rider: Alex Turner",
        "",
        "Trip Details:",
        "Pickup: 450 Mission St, San Francisco, CA",
        "Dropoff: SFO International Airport Terminal 2",
        "",
        "Base Fare: $31.20",
        "Airport Surcharge: $4.50",
        "Toll: $2.80",
        "",
        "Grand Total: $38.50 USD",
        "",
        "Payment Method: Apple Pay (Business MasterCard)"
    ]
)

# 4. Starbucks Coffee Receipt PDF
create_pdf(
    RECEIPTS_DIR / "starbucks_meeting.pdf",
    "STARBUCKS STORE #1492",
    [
        "Receipt No: SB-88219",
        "Date: 10/09/2026  09:14 AM",
        "",
        "Items:",
        "1  Caffe Latte Venti: $6.25",
        "1  Cold Brew Grande: $5.10",
        "1  Almond Croissant: $3.50",
        "",
        "Subtotal: $14.85",
        "Sales Tax: $1.25",
        "Total Due: $16.10",
        "",
        "Paid with Credit Card ****9921"
    ]
)

# 5. Bank Export CSV
csv_path = CSVS_DIR / "q3_freelance_expenses.csv"
rows = [
    ["Date", "Merchant", "Description", "Amount", "Invoice", "Category"],
    ["2026-09-10", "DigitalOcean", "Droplet server hosting", "24.00", "DO-581920", "Software & Subscriptions"],
    ["2026-09-14", "Figma", "UI/UX design annual seat", "15.00", "FIG-2026-09", "Software & Subscriptions"],
    ["2026-09-18", "Staples", "Printer toner & paper restock", "68.45", "STP-88291", "Office Supplies"],
    ["2026-09-20", "Delta Air Lines", "Flight to Tech Summit", "342.10", "DL-9081293", "Travel & Transport"],
    ["2026-09-24", "Apple Store", "USB-C Multiport Adapter", "69.00", "APL-55102", "Hardware & Equipment"],
    ["2026-09-28", "Slack Technologies", "Pro Workspace Monthly", "18.50", "SLACK-3910", "Software & Subscriptions"],
    ["2026-09-30", "Upwork Escrow", "Contractor frontend polish fee", "250.00", "UPW-99120", "Professional Services"],
]

with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print(f"Created {csv_path}")
