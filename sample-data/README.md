# LedgerLens • Synthetic Sample Dataset

This directory contains synthetic, privacy-safe invoices, receipts, and CSV exports designed for evaluating LedgerLens's document ingestion pipeline, extraction heuristics, duplicate detection, and category suggestions.

> **Privacy Note:** None of the data in this directory contains real personal or financial information. All account numbers, names, and amounts are synthetic fixtures.

## Included Sample Files

| File | Type | Expected Merchant | Expected Total | Expected Category | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `invoices/aws_cloud_invoice.pdf` | PDF Invoice | Amazon Web Services | $198.94 | Software & Subscriptions | Multi-line item compute & storage breakdown. |
| `invoices/github_copilot_teams.pdf` | PDF Receipt | GitHub | $49.00 | Software & Subscriptions | Team plan + Copilot seat licenses. |
| `receipts/uber_trip_receipt.pdf` | PDF Receipt | Uber | $38.50 | Travel & Transport | Tests merchant extraction when payment footer says "Apple Pay". |
| `receipts/starbucks_meeting.pdf` | PDF Receipt | Starbucks | $16.10 | Meals & Entertainment | Cafe receipt with sales tax itemization. |
| `csvs/q3_freelance_expenses.csv` | Bank CSV | Multiple | Varied | Varied | Batch import fixture with 7 freelancer line items. |

## Generating New Synthetic Data

You can regenerate or extend the sample files at any time:
```powershell
python scripts/generate_sample_data.py
```
