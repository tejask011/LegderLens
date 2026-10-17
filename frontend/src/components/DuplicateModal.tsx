import React from 'react';
import { AlertTriangle, X, Check, Trash2, ArrowRight } from 'lucide-react';
import { Transaction } from '../types';

interface DuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  matchedRecord: Transaction | null;
  reason?: string;
  onApproveAnyway: (id: string) => void;
  onDelete: (id: string) => void;
}

export const DuplicateModal: React.FC<DuplicateModalProps> = ({
  isOpen,
  onClose,
  transaction,
  matchedRecord,
  reason,
  onApproveAnyway,
  onDelete
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-amber-500/30">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Possible Duplicate Record Detected</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                LedgerLens protects your ledger from duplicate entries without silent deletions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explainable match reason */}
        <div className="my-5 p-4 rounded-xl bg-amber-950/40 border border-amber-900/60 text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
          <span className="font-semibold text-amber-400 uppercase tracking-wider text-[10px] mt-0.5 whitespace-nowrap">Reason:</span>
          <span>{reason || transaction.duplicate_reason || 'Identical merchant and amount recorded within close time frame.'}</span>
        </div>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          {/* Current Candidate */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <span className="font-semibold text-amber-400 uppercase tracking-wider text-[10px]">Current Record</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-900/40">
                {transaction.is_approved ? 'Approved' : 'Pending Review'}
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-slate-400">Merchant:</span>
                <p className="font-medium text-slate-100">{transaction.merchant}</p>
              </div>
              <div>
                <span className="text-slate-400">Amount:</span>
                <p className="font-mono font-bold text-slate-100 text-sm">${transaction.total} {transaction.currency}</p>
              </div>
              <div>
                <span className="text-slate-400">Date:</span>
                <p className="font-mono text-slate-100">{transaction.date}</p>
              </div>
              <div>
                <span className="text-slate-400">Invoice #:</span>
                <p className="font-mono text-slate-100">{transaction.invoice_number || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400">Category:</span>
                <p className="text-slate-100">{transaction.category}</p>
              </div>
            </div>
          </div>

          {/* Existing Matched Record */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Previously Recorded</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-900/40">
                Confirmed
              </span>
            </div>
            {matchedRecord ? (
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400">Merchant:</span>
                  <p className="font-medium text-slate-100">{matchedRecord.merchant}</p>
                </div>
                <div>
                  <span className="text-slate-400">Amount:</span>
                  <p className="font-mono font-bold text-slate-100 text-sm">${matchedRecord.total} {matchedRecord.currency}</p>
                </div>
                <div>
                  <span className="text-slate-400">Date:</span>
                  <p className="font-mono text-slate-100">{matchedRecord.date}</p>
                </div>
                <div>
                  <span className="text-slate-400">Invoice #:</span>
                  <p className="font-mono text-slate-100">{matchedRecord.invoice_number || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Category:</span>
                  <p className="text-slate-100">{matchedRecord.category}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 italic py-6 text-center">
                Matched original record details stored in ledger hash index.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              onDelete(transaction.id);
              onClose();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/50 hover:border-rose-900 border border-transparent flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete This Duplicate
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onApproveAnyway(transaction.id);
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition shadow-sm"
            >
              <Check className="w-4 h-4" />
              Keep & Confirm Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
