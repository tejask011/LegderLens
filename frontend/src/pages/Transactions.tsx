import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  Edit2,
  Trash2,
  Copy,
  Receipt,
  X,
  Plus
} from 'lucide-react';
import { Transaction } from '../types';
import { CategoryPill } from '../components/CategoryPill';
import { StatusBadge } from '../components/StatusBadge';
import { EditTransactionModal } from '../components/EditTransactionModal';
import { DuplicateModal } from '../components/DuplicateModal';

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

interface TransactionsProps {
  transactions: Transaction[];
  loading: boolean;
  onUpdate: (id: string, updated: Partial<Transaction>, andApprove?: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onExportCsv: (params?: { category?: string; start_date?: string; end_date?: string }) => void;
  onApprove: (id: string) => Promise<void>;
}

export const Transactions: React.FC<TransactionsProps> = ({
  transactions,
  loading,
  onUpdate,
  onDelete,
  onExportCsv,
  onApprove
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'duplicate'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [duplicateTx, setDuplicateTx] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search text
      if (search) {
        const q = search.toLowerCase();
        const matchesMerchant = tx.merchant.toLowerCase().includes(q);
        const matchesNotes = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
        const matchesInv = tx.invoice_number ? tx.invoice_number.toLowerCase().includes(q) : false;
        if (!matchesMerchant && !matchesNotes && !matchesInv) return false;
      }

      // Category
      if (selectedCategory && tx.category !== selectedCategory) {
        return false;
      }

      // Status
      if (statusFilter === 'approved' && !tx.is_approved) return false;
      if (statusFilter === 'pending' && tx.is_approved) return false;
      if (statusFilter === 'duplicate' && !tx.is_duplicate) return false;

      // Date range
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;

      return true;
    });
  }, [transactions, search, selectedCategory, statusFilter, startDate, endDate]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = search || selectedCategory || statusFilter !== 'all' || startDate || endDate;

  // Calculate sum of currently filtered records with Decimal string addition
  const filteredTotal = useMemo(() => {
    let sum = 0;
    filteredTransactions.forEach((t) => {
      if (t.is_approved) {
        sum += parseFloat(t.total) || 0;
      }
    });
    return sum.toFixed(2);
  }, [filteredTransactions]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Financial Ledger
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              {filteredTransactions.length} Record{filteredTransactions.length !== 1 ? 's' : ''}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Searchable, auditable ledger with exact money figures and multi-criteria filters.
          </p>
        </div>

        <button
          onClick={() =>
            onExportCsv({
              category: selectedCategory || undefined,
              start_date: startDate || undefined,
              end_date: endDate || undefined
            })
          }
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition shadow-sm glow-emerald shrink-0"
        >
          <Download className="w-4 h-4" />
          Export Filtered CSV
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merchant, invoice #..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500 transition"
            >
              <option value="">All Categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500 transition"
            >
              <option value="all">All Records</option>
              <option value="approved">Approved Only</option>
              <option value="pending">Pending Review Only</option>
              <option value="duplicate">Flagged Duplicates</option>
            </select>
          </div>

          {/* Date range pickers */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-brand-500"
              title="Start Date"
            />
            <span className="text-slate-500 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-brand-500"
              title="End Date"
            />
          </div>
        </div>

        {/* Filter Summary & Reset */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Approved Total in view:</span>
            <span className="font-mono font-bold text-brand-400 text-sm">${filteredTotal}</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Merchant / Details</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Invoice #</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-slate-100 block">{tx.merchant}</span>
                        {tx.notes && (
                          <span className="text-[11px] text-slate-400 italic block truncate max-w-xs">
                            {tx.notes}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <CategoryPill category={tx.category} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {tx.invoice_number || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={tx.is_approved ? 'approved' : 'pending'} />
                        {tx.is_duplicate && (
                          <button
                            onClick={() => setDuplicateTx(tx)}
                            title="Inspect duplicate match details"
                            className="p-1 rounded text-rose-400 hover:bg-rose-950/60 transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm whitespace-nowrap">
                      ${tx.total}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingTx(tx)}
                          title="Edit transaction details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(tx.id)}
                          title="Delete transaction record"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-xs text-slate-400 space-y-2">
            <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-300">No transactions match your current filters</p>
            <p className="text-[11px] text-slate-500">
              Try adjusting your search query, selecting different categories, or clearing filters.
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditTransactionModal
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
        onSave={onUpdate}
      />

      {/* Duplicate Modal */}
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
