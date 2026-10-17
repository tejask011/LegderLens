import React, { useState, useEffect } from 'react';
import { X, Check, Save } from 'lucide-react';
import { Transaction } from '../types';

const EXPENSE_CATEGORIES = [
  'Software & Subscriptions',
  'Office Supplies',
  'Travel & Transport',
  'Meals & Entertainment',
  'Professional Services',
  'Utilities & Internet',
  'Marketing & Advertising',
  'Hardware & Equipment',
  'Taxes & Fees',
  'Other'
];

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSave: (id: string, updated: Partial<Transaction>, andApprove?: boolean) => Promise<void>;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSave
}) => {
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState('');
  const [total, setTotal] = useState('');
  const [category, setCategory] = useState('Other');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setMerchant(transaction.merchant || '');
      setDate(transaction.date || '');
      setTotal(transaction.total || '');
      setCategory(transaction.category || 'Other');
      setInvoiceNumber(transaction.invoice_number || '');
      setNotes(transaction.notes || '');
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (andApprove: boolean = false) => {
    setLoading(true);
    try {
      await onSave(
        transaction.id,
        {
          merchant: merchant.trim(),
          date,
          total: total.trim(),
          category,
          invoice_number: invoiceNumber.trim() || undefined,
          notes: notes.trim() || undefined,
          is_approved: andApprove ? true : transaction.is_approved
        },
        andApprove
      );
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-700/60">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">Review & Edit Record</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {transaction.suggested_category && (
          <div className="my-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/50 text-xs text-indigo-200 flex items-center justify-between">
            <div>
              <span className="font-semibold text-indigo-300">AI Suggested Category: </span>
              <span>{transaction.suggested_category}</span>
              {transaction.category_confidence && (
                <span className="text-[11px] text-indigo-400 ml-1.5">
                  ({Math.round(transaction.category_confidence * 100)}% confidence)
                </span>
              )}
            </div>
            {category !== transaction.suggested_category && (
              <button
                type="button"
                onClick={() => setCategory(transaction.suggested_category!)}
                className="text-[11px] font-medium text-indigo-300 hover:text-white underline"
              >
                Apply
              </button>
            )}
          </div>
        )}

        <div className="space-y-4 my-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Merchant / Vendor</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white focus:outline-none focus:border-brand-500 transition"
              placeholder="e.g. Amazon Web Services"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white focus:outline-none focus:border-brand-500 transition font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Total Amount ($)</label>
              <input
                type="text"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white focus:outline-none focus:border-brand-500 transition font-mono"
                placeholder="49.99"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white focus:outline-none focus:border-brand-500 transition"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Invoice / Receipt #</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white focus:outline-none focus:border-brand-500 transition font-mono"
                placeholder="e.g. INV-2026-001"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Notes / Business Purpose</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white focus:outline-none focus:border-brand-500 transition"
              placeholder="e.g. Monthly server hosting for client project"
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1.5 transition shadow-sm glow-emerald"
            >
              <Check className="w-4 h-4" />
              Save & Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
