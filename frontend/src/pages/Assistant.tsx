import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Cpu,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Database,
  Terminal,
  Receipt
} from 'lucide-react';
import { NLQueryResponse, OllamaStatus } from '../types';
import { api } from '../lib/api';
import { CategoryPill } from '../components/CategoryPill';

interface AssistantProps {
  ollamaStatus: OllamaStatus | null;
  onRefreshOllama: () => void;
  onNavigateToSettings: () => void;
}

const SAMPLE_PROMPTS = [
  "How much did I spend on Software & Subscriptions this month?",
  "How much did I spend on Uber?",
  "What was my total spend in October 2026?",
  "Show me my expenses for Office Supplies",
  "How much did I spend on AWS?"
];

export const Assistant: React.FC<AssistantProps> = ({
  ollamaStatus,
  onRefreshOllama,
  onNavigateToSettings
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<NLQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (qText?: string) => {
    const textToSend = qText || query;
    if (!textToSend.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.queryAssistant(textToSend.trim());
      setResponse(res);
      if (!qText) setQuery('');
    } catch (err: any) {
      setError(err.message || 'Failed to process natural-language question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-brand-400" />
          AI Financial Assistant
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Ask questions in natural English. Open-weight AI maps intent to validated application filters;
          financial calculations are strictly computed by deterministic Decimal code.
        </p>
      </div>

      {/* Ollama Status Alert Banner */}
      <div className={`p-4 rounded-2xl border ${
        ollamaStatus?.available
          ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
          : 'bg-slate-900/80 border-slate-800 text-slate-300'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              ollamaStatus?.available
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-white">
                  {ollamaStatus?.available ? `Connected to Ollama (${ollamaStatus.configured_model})` : 'Local AI Runner (Ollama) Offline'}
                </span>
                {ollamaStatus?.latency_ms && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/40">
                    {ollamaStatus.latency_ms}ms latency
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {ollamaStatus?.available
                  ? 'All document inference runs locally on your machine. Zero cloud APIs called.'
                  : 'LedgerLens is using the deterministic heuristic engine. Non-AI workflows remain 100% operational.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onNavigateToSettings}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Model Settings
            </button>
            <button
              onClick={onRefreshOllama}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Check Status
            </button>
          </div>
        </div>

        {!ollamaStatus?.available && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
            <Terminal className="w-3.5 h-3.5 text-brand-400 shrink-0" />
            <span>To start local open-weight model:</span>
            <code className="bg-slate-950 px-2 py-0.5 rounded text-brand-400 font-mono text-[10px] border border-slate-800">
              ollama run qwen2.5:3b
            </code>
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Suggested Question Prompts
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1.5 rounded-xl text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition text-left"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Query Input Box */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question about your approved expenses (e.g. 'How much did I spend on software this month?')..."
          className="w-full pl-4 pr-24 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 shadow-xl transition"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          className="absolute right-2 top-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 shadow-sm glow-emerald"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-900/70 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Answer & Result Card */}
      {response && (
        <div className="glass-card rounded-2xl p-6 space-y-6 animate-fade-in border border-brand-500/30">
          <div className="flex items-start justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand-400 font-bold block mb-1">
                Natural-Language Query Answer
              </span>
              <p className="text-base font-semibold text-white leading-relaxed">
                {response.answer}
              </p>
            </div>
            {response.calculated_total && (
              <div className="text-right shrink-0 pl-4">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Verified Sum</span>
                <span className="font-mono text-2xl font-bold text-brand-400">
                  ${response.calculated_total}
                </span>
              </div>
            )}
          </div>

          {/* Parsed Query Intent Inspector */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                Parsed Filter Intent
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-brand-950/60 text-brand-300 border border-brand-800/40 font-mono">
                {response.is_llm_assisted ? `Model: ${response.model_used}` : 'Heuristic Rules Engine'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">Intent:</span>
                <span className="font-mono text-slate-200 font-medium">{response.parsed_intent.intent_type}</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">Category:</span>
                <span className="font-medium text-slate-200">{response.parsed_intent.category || 'Any'}</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">Merchant:</span>
                <span className="font-medium text-slate-200">{response.parsed_intent.merchant || 'Any'}</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">Time Period:</span>
                <span className="font-mono text-slate-200 font-medium">{response.parsed_intent.month || 'All Time'}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 italic pt-1">
              Security Guarantee: LedgerLens strictly translates natural language into validated application parameters. Arbitrary SQL execution is disallowed.
            </p>
          </div>

          {/* Matched Transactions Table */}
          {response.matched_transactions && response.matched_transactions.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                Matched Approved Records ({response.matched_count})
              </span>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Merchant</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {response.matched_transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{tx.date}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-200">{tx.merchant}</td>
                        <td className="py-2.5 px-3">
                          <CategoryPill category={tx.category} />
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{tx.invoice_number || '—'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">${tx.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
