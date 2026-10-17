# Privacy & Security Disclosure

LedgerLens was built from the ground up for privacy-conscious freelancers, consultants, and small businesses who handle sensitive financial records, invoices, and client billing statements.

## Privacy Guarantees

1. **Default Zero Cloud AI:** LedgerLens does not integrate remote LLM APIs (such as OpenAI, Anthropic, or cloud endpoints) by default. All model inference is routed to an Ollama runner on `http://localhost:11434`.
2. **Local Document Storage:** Invoices and receipts reside only in the local data directory (`./data/documents`).
3. **No Account or Telemetry:** LedgerLens does not require user registration, cloud login, usage tracking, or analytics pings.
4. **Full Offline Support:** After installing the application and downloading an open-weight model, LedgerLens operates completely offline with the network cable unplugged or Wi-Fi disabled.

## Security Considerations

- **Device Security:** Because data is stored in standard local SQLite files (`./data/ledgerlens.db`), privacy depends on the host machine's disk encryption (e.g. BitLocker or FileVault) and operating system permissions.
- **Model Output Untrusted:** AI suggestions are treated as untrusted drafts. The model has zero database write permissions and cannot execute system commands.
- **Legal & Tax Disclaimer:** LedgerLens is an automated document organizer and reporting assistant. It does not provide certified legal, accounting, or tax advice. Users should verify approved records with their qualified accountant or CPA.
