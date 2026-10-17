# Local Open-Weight AI Setup Guide

LedgerLens connects to Ollama on `http://localhost:11434` for open-weight language model assistance.

## 1. Install Ollama

Download and install Ollama for your operating system:
- **Windows:** https://ollama.com/download/windows
- **macOS:** https://ollama.com/download/mac
- **Linux:** `curl -fsSL https://ollama.com/install.sh | sh`

## 2. Pull an Open-Weight Model

We recommend instruction-tuned models between 2B and 7B parameters depending on your RAM and VRAM availability:

| Model Tag | Parameters | Required RAM / VRAM | Recommended For |
| :--- | :--- | :--- | :--- |
| `qwen2.5:3b` | 3 Billion | ~3.5 GB | **Default / Best balance of speed & JSON accuracy** |
| `llama3.2:3b` | 3 Billion | ~3.5 GB | Excellent instruction-following on modern laptops |
| `gemma2:2b` | 2 Billion | ~2.5 GB | Ultra lightweight for low-spec or older hardware |
| `qwen2.5:7b` | 7 Billion | ~6.5 GB | Maximum nuance on machines with 16GB+ RAM |

Pull and launch your chosen default model:
```bash
ollama run qwen2.5:3b
```

## 3. Verify Connection

Open LedgerLens and navigate to **Settings** or look at the top navigation bar. If Ollama is active on `http://localhost:11434`, LedgerLens will show a green status pill with the active model and ping latency.

## 4. Offline Fallback Behavior

If Ollama is stopped or unavailable:
- LedgerLens does **not** crash or disable core functionality.
- Non-AI features (document upload, PyMuPDF extraction, candidate review, Decimal totals, duplicate checks, and CSV export) remain **100% operational**.
- Category suggestions and natural-language query questions fall back seamlessly to LedgerLens's deterministic heuristic engine.
