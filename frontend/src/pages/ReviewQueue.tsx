import React, { useState } from 'react';
import {
  CheckSquare,
  AlertTriangle,
  Check,
  Edit2,
  Trash2,
  Sparkles,
  HelpCircle,
  Copy,
  Info
} from 'lucide-react';
import { Transaction } from '../types';
import { CategoryPill } from '../components/CategoryPill';
import { StatusBadge } from '../components/StatusBadge';
import { EditTransactionModal } from '../components/EditTransactionModal';
import { DuplicateModal } from '../components/DuplicateModal';

interface ReviewQueueProps {
  transactions: Transaction[];
  loading: boolean;
  onApprove: (id: string) => Promise<void>;
  onBatchApprove: (ids: string[]) => Promise<void>;
  onUpdate: (id: string, updated: Partial<Transaction>, andApprove?: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({
  transactions,
  loading,
  onApprove,
  onBatchApprove,
  onUpdate,
  onDelete
}) => {
  const pendingTransactions = transactions.filter((t) => !t.is_approved);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [duplicateTx, setDuplicateTx] = useState<Transaction | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingTransactions.map((t) => t.id));
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    await onBatchApprove(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Review & Approval Queue
            {pendingTransactions.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 font-mono font-bold">
                {pendingTransactions.length} Pending
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Acceptance Rule: No extracted record is treated as confirmed financial truth until approved by you.
          </p>
        </div>

        {pendingTransactions.length > 0 && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleBatchApprove}
              disabled={selectedIds.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition disabled:opacity-40 disabled:hover:bg-brand-600 shadow-sm glow-emerald"
            >
              <Check className="w-4 h-4" />
              Batch Approve Selected ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      {pendingTransactions.length > 0 ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.length === pendingTransactions.length && pendingTransactions.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-slate-700 text-brand-500 focus:ring-brand-500 bg-slate-800"
              />
              <span className="text-xs font-medium text-slate-300">
                {selectedIds.length > 0 ? `${selectedIds.length} records selected` : 'Select all candidates'}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Deterministic review before ledger entry
            </span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {pendingTransactions.map((tx) => (
              <div
                key={tx.id}
                className={`p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  selectedIds.includes(tx.id) ? 'bg-brand-950/20' : 'hover:bg-slate-800/25'
                }`}
              >
                {/* Left check & main details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(tx.id)}
                    onChange={() => toggleSelect(tx.id)}
                    className="mt-1 w-4 h-4 rounded border-slate-700 text-brand-500 focus:ring-brand-500 bg-slate-800 shrink-0"
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white text-sm truncate max-w-[220px]">
                        {tx.merchant}
                      </span>
                      <CategoryPill category={tx.category} />
                      {tx.is_duplicate && (
                        <button
                          onClick={() => setDuplicateTx(tx)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/80 text-rose-300 border border-rose-800/70 hover:bg-rose-900 transition"
                        >
                          <Copy className="w-3 h-3 text-rose-400" />
                          Duplicate Flagged
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="font-mono">{tx.date}</span>
                      {tx.invoice_number && (
                        <>
                          <span>•</span>
                          <span className="font-mono">Inv #{tx.invoice_number}</span>
                        </>
                      )}
                      {tx.tax && tx.tax !== '0.00' && (
                        <>
                          <span>•</span>
                          <span>Tax: ${tx.tax}</span>
                        </>
                      )}
                      {tx.notes && (
                        <>
                          <span>•</span>
                          <span className="italic truncate max-w-[200px] text-slate-300">"{tx.notes}"</span>
                        </>
                      )}
                    </div>

                    {/* AI Category Suggestion Pill / Reasoning */}
                    {tx.suggested_category && (
                      <div className="flex items-center gap-2 pt-1 text-[11px]">
                        <span className="flex items-center gap-1 text-indigo-300 font-medium bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/40">
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          AI Suggestion: {tx.suggested_category}
                          {tx.category_confidence ? ` (${Math.round(tx.category_confidence * 100)}%)` : ''}
                        </span>
                        {tx.category_reasoning && (
                          <span className="text-slate-400 truncate max-w-[320px] hidden sm:inline" title={tx.category_reasoning}>
                            {tx.category_reasoning}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Duplicate reason warning callout */}
                    {tx.is_duplicate && tx.duplicate_reason && (
                      <div className="mt-2 p-2 rounded-lg bg-rose-950/30 border border-rose-900/40 text-[11px] text-rose-300 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>{tx.duplicate_reason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Amount and actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pl-7 md:pl-0">
                  <div className="text-right">
                    <span className="font-mono font-bold text-lg text-white block">
                      ${tx.total}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono uppercase">{tx.currency}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingTx(tx)}
                      title="Edit extracted fields before approval"
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(tx.id)}
                      title="Reject and delete candidate"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onApprove(tx.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition shadow-sm glow-emerald"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-white">Review Queue is Clear!</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All imported financial records have been confirmed and stored in your local SQLite ledger.
            Upload new receipts or CSV statements to process more transactions.
          </p>
        </div>
      )}

      {/* Edit Modal */}
      <EditTransactionModal
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
        onSave={onUpdate}
      />

      {/* Duplicate Inspection Modal */}
      <DuplicateModal
        isOpen={!!duplicateTx}
        onClose={() => setDuplicateTx(null)}
        transaction={duplicateTx}
        matchedRecord={null}
        onApproveAnyway={onApprove}
        onDelete={onDelete}
      />
    </div>
  );
};
