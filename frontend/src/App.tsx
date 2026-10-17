import React, { useState, useEffect, useCallback } from 'react';
import {
  Document,
  Transaction,
  OverviewReport,
  OllamaStatus,
  AppSettings,
  ExtractedCandidate
} from './types';
import { api } from './lib/api';
import { Navbar } from './components/Navbar';
import { Overview } from './pages/Overview';
import { Documents } from './pages/Documents';
import { ReviewQueue } from './pages/ReviewQueue';
import { Transactions } from './pages/Transactions';
import { Reports } from './pages/Reports';
import { Assistant } from './pages/Assistant';
import { Settings } from './pages/Settings';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [report, setReport] = useState<OverviewReport | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAllData = useCallback(async () => {
    try {
      const [docs, txs, rep, ollama, setts] = await Promise.all([
        api.listDocuments(),
        api.listTransactions(),
        api.getOverviewReport({ approved_only: true }),
        api.getOllamaStatus().catch(() => ({
          available: false,
          base_url: 'http://localhost:11434',
          configured_model: 'qwen2.5:3b',
          available_models: [],
          message: 'Ollama is offline on localhost:11434'
        })),
        api.getSettings().catch(() => null)
      ]);

      setDocuments(docs);
      setTransactions(txs);
      setReport(rep);
      setOllamaStatus(ollama);
      if (setts) setSettings(setts);
    } catch (err) {
      console.error('Error loading LedgerLens data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handler for file uploads
  const handleUpload = async (files: File[]): Promise<ExtractedCandidate[]> => {
    const candidates = await api.uploadDocuments(files);

    // Automatically create transactions as unapproved candidates for review
    for (const cand of candidates) {
      await api.createTransaction({
        document_id: cand.document_id,
        merchant: cand.merchant || 'Unknown Merchant',
        date: cand.date || new Date().toISOString().slice(0, 10),
        total: cand.total || '0.00',
        currency: cand.currency,
        tax: cand.tax,
        invoice_number: cand.invoice_number,
        category: cand.suggested_category || 'Other',
        suggested_category: cand.suggested_category,
        category_confidence: cand.category_confidence,
        category_reasoning: cand.category_reasoning,
        is_approved: false,
        is_duplicate: cand.is_duplicate,
        duplicate_reason: cand.duplicate_reason,
        duplicate_of_id: cand.duplicate_of_id,
        notes: cand.is_duplicate ? `[Duplicate Alert] ${cand.duplicate_reason}` : undefined
      });
    }

    await loadAllData();
    showToast(`Uploaded ${files.length} document(s) & extracted candidates`);
    return candidates;
  };

  const handleApproveTransaction = async (id: string) => {
    await api.approveTransaction(id);
    await loadAllData();
    showToast('Record confirmed and committed to local ledger');
  };

  const handleBatchApprove = async (ids: string[]) => {
    const res = await api.batchApprove(ids);
    await loadAllData();
    showToast(`Batch approved ${res.approved_count} records`);
  };

  const handleUpdateTransaction = async (
    id: string,
    updated: Partial<Transaction>,
    andApprove: boolean = false
  ) => {
    await api.updateTransaction(id, updated);
    if (andApprove) {
      await api.approveTransaction(id);
      showToast('Record updated & approved');
    } else {
      showToast('Record updated');
    }
    await loadAllData();
  };

  const handleDeleteTransaction = async (id: string) => {
    await api.deleteTransaction(id);
    await loadAllData();
    showToast('Transaction removed');
  };

  const handleDeleteDocument = async (id: string) => {
    await api.deleteDocument(id);
    await loadAllData();
    showToast('Document deleted from local storage');
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const res = await api.seedSyntheticData();
      await loadAllData();
      showToast(`Seeded ${res.records_created} synthetic freelance records!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to seed synthetic records', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleExportCsv = (params?: { category?: string; start_date?: string; end_date?: string }) => {
    const url = api.getExportCsvUrl({ ...params, approved_only: true });
    window.open(url, '_blank');
    showToast('CSV export downloaded');
  };

  const pendingCount = transactions.filter((t) => !t.is_approved).length;

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col text-slate-100">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
          <div className={`p-4 rounded-2xl shadow-2xl border text-xs font-medium flex items-center gap-2.5 ${
            toast.type === 'success'
              ? 'bg-slate-900 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-900 border-rose-500/50 text-rose-300'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        ollamaStatus={ollamaStatus}
        onRefreshOllama={loadAllData}
        onSeedData={handleSeedData}
        seeding={seeding}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'overview' && (
          <Overview
            report={report}
            loading={loading}
            onNavigate={setActiveTab}
            onExportCsv={() => handleExportCsv()}
          />
        )}

        {activeTab === 'documents' && (
          <Documents
            documents={documents}
            loading={loading}
            onUpload={handleUpload}
            onDeleteDocument={handleDeleteDocument}
            onNavigateToReview={() => setActiveTab('review')}
          />
        )}

        {activeTab === 'review' && (
          <ReviewQueue
            transactions={transactions}
            loading={loading}
            onApprove={handleApproveTransaction}
            onBatchApprove={handleBatchApprove}
            onUpdate={handleUpdateTransaction}
            onDelete={handleDeleteTransaction}
          />
        )}

        {activeTab === 'transactions' && (
          <Transactions
            transactions={transactions}
            loading={loading}
            onUpdate={handleUpdateTransaction}
            onDelete={handleDeleteTransaction}
            onExportCsv={handleExportCsv}
            onApprove={handleApproveTransaction}
          />
        )}

        {activeTab === 'reports' && (
          <Reports
            report={report}
            loading={loading}
            onExportCsv={handleExportCsv}
          />
        )}

        {activeTab === 'assistant' && (
          <Assistant
            ollamaStatus={ollamaStatus}
            onRefreshOllama={loadAllData}
            onNavigateToSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            settings={settings}
            ollamaStatus={ollamaStatus}
            onRefreshOllama={loadAllData}
            onUpdateSettings={async (updated) => {
              const s = await api.updateSettings(updated);
              setSettings(s);
              await loadAllData();
            }}
            onSeedData={handleSeedData}
            seeding={seeding}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>LedgerLens v0.1.0 • Local-First Financial Document Assistant</span>
          <span>Open-Weight AI • Exact Decimal Arithmetic • Zero Cloud Telemetry</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
