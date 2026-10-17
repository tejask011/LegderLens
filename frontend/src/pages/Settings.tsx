import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  Database,
  ShieldCheck,
  RefreshCw,
  Save,
  CheckCircle2,
  HardDrive,
  Lock,
  Server
} from 'lucide-react';
import { AppSettings, OllamaStatus, SystemHealth } from '../types';
import { api } from '../lib/api';

interface SettingsProps {
  settings: AppSettings | null;
  ollamaStatus: OllamaStatus | null;
  onRefreshOllama: () => void;
  onUpdateSettings: (updated: Partial<AppSettings>) => Promise<void>;
  onSeedData: () => Promise<void>;
  seeding: boolean;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  ollamaStatus,
  onRefreshOllama,
  onUpdateSettings,
  onSeedData,
  seeding
}) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [autoSuggest, setAutoSuggest] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    if (settings) {
      setBaseUrl(settings.ollama_base_url);
      setModel(settings.ollama_model);
      setCurrency(settings.default_currency);
      setAutoSuggest(settings.auto_suggest_categories);
    }
  }, [settings]);

  useEffect(() => {
    api.getHealth().then(setHealth).catch(console.error);
  }, [ollamaStatus]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateSettings({
        ollama_base_url: baseUrl.trim(),
        ollama_model: model.trim(),
        default_currency: currency,
        auto_suggest_categories: autoSuggest
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-brand-400" />
          Settings & Local Environment
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure local open-weight model integration, document storage, and ledger parameters.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="glass-card rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Local Open-Weight Model Runner (Ollama)</h2>
          </div>
          <button
            type="button"
            onClick={onRefreshOllama}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Test Connection
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Ollama API Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:11434"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono focus:outline-none focus:border-brand-500 transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              LedgerLens communicates directly with your local Ollama daemon over HTTP localhost.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Configured Model Tag
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="qwen2.5:3b"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono focus:outline-none focus:border-brand-500 transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Recommended: <code className="text-brand-400">qwen2.5:3b</code>, <code className="text-brand-400">llama3.2:3b</code>, or <code className="text-brand-400">gemma2:2b</code>
              </p>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500 transition"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
                <option value="AUD">AUD ($) - Australian Dollar</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSuggest}
                onChange={(e) => setAutoSuggest(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-brand-500 focus:ring-brand-500 bg-slate-800"
              />
              <span className="text-xs text-slate-300">
                Automatically suggest expense categories and normalize merchant names during file import
              </span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            {saveSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Settings updated successfully!
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition shadow-sm glow-emerald disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>

      {/* Synthetic Dataset Seeder Card */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-brand-400" />
            <h2 className="text-sm font-semibold text-white">Demonstration & Synthetic Data</h2>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            Test Fixture
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Quickly populate LedgerLens with synthetic freelance invoices (AWS, GitHub, Uber, Delta Air Lines, Staples),
          an intentional duplicate to test explainable match alerts, and a candidate record for review.
        </p>
        <button
          onClick={onSeedData}
          disabled={seeding}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
        >
          <Database className="w-4 h-4 text-brand-400" />
          <span>{seeding ? 'Generating dataset...' : 'Seed 10 Realistic Demo Records'}</span>
        </button>
      </div>

      {/* System Health & Diagnostics */}
      {health && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Server className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">System Diagnostics & Storage</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Database:</span>
              <span className="font-mono text-emerald-400 font-semibold">SQLite (WAL)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Documents:</span>
              <span className="font-mono text-white font-semibold">{health.document_count}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Transactions:</span>
              <span className="font-mono text-white font-semibold">{health.transaction_count}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">Approved:</span>
              <span className="font-mono text-brand-400 font-semibold">{health.approved_count}</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span className="truncate">Local Storage: {health.storage_path}</span>
            <span className="text-emerald-400 shrink-0 ml-2">Encrypted by OS filesystem</span>
          </div>
        </div>
      )}

      {/* Privacy Guarantees Card */}
      <div className="glass-card rounded-2xl p-6 space-y-3 border border-emerald-500/20">
        <div className="flex items-center gap-2.5 text-emerald-400 pb-2 border-b border-slate-800">
          <Lock className="w-5 h-5" />
          <h2 className="text-sm font-semibold text-white">Local-First Privacy Architecture</h2>
        </div>
        <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
          <li><strong>Zero Remote Cloud AI:</strong> Documents and financial records never leave your local device.</li>
          <li><strong>Open-Weight Model Autonomy:</strong> Category inference and query intent run via local Ollama localhost endpoints.</li>
          <li><strong>No Cloud Accounts Required:</strong> Fully functional offline after initial model setup.</li>
          <li><strong>Deterministic Calculations:</strong> Totals and duplicates are computed with application code, not LLM guesses.</li>
        </ul>
      </div>
    </div>
  );
};
