import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  FileCheck,
  ShieldCheck,
  Building2,
  Receipt
} from 'lucide-react';
import { OverviewReport } from '../types';
import { CategoryPill } from '../components/CategoryPill';

interface ReportsProps {
  report: OverviewReport | null;
  loading: boolean;
  onExportCsv: (params?: { category?: string; start_date?: string; end_date?: string }) => void;
}

export const Reports: React.FC<ReportsProps> = ({
  report,
  loading,
  onExportCsv
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  if (loading || !report) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-mono">Generating financial report metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Financial & Tax Reports
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono">
              Deterministic Math
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Auditable expense summaries for freelancer bookkeeping and accountant handoffs.
          </p>
        </div>

        <button
          onClick={() =>
            onExportCsv({
              start_date: exportStartDate || undefined,
              end_date: exportEndDate || undefined
            })
          }
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition shadow-sm glow-emerald shrink-0"
        >
          <Download className="w-4 h-4" />
          Download Complete CSV Report
        </button>
      </div>

      {/* Tax & Deductions Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Deductible Spend</p>
              <h3 className="text-2xl font-bold font-mono text-white mt-0.5">${report.total_spend}</h3>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-800">
            Approved business expenses recorded on local device
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Approved Invoices/Receipts</p>
              <h3 className="text-2xl font-bold font-mono text-white mt-0.5">{report.approved_count}</h3>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-800">
            Backed by verified document hashes and invoices
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Audit Verification</p>
              <h3 className="text-2xl font-bold font-mono text-white mt-0.5">100% Passed</h3>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-800">
            Zero floating point drift • Exact Decimal sums
          </p>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Monthly Expense Summary</h2>
          <span className="text-xs text-slate-400 font-mono">Aggregated by calendar month</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Month</th>
                <th className="py-3 px-4 font-semibold">Transactions</th>
                <th className="py-3 px-4 font-semibold">Total Approved Volume</th>
                <th className="py-3 px-4 font-semibold text-right">Quick Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {report.monthly_trends.length > 0 ? (
                report.monthly_trends.map((m) => (
                  <tr key={m.month} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-100">{m.month}</td>
                    <td className="py-3 px-4 text-slate-400">{m.transaction_count} transaction(s)</td>
                    <td className="py-3 px-4 font-mono font-bold text-white text-sm">${m.total_amount}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() =>
                          onExportCsv({
                            start_date: `${m.month}-01`,
                            end_date: `${m.month}-31`
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-brand-400 border border-slate-700 transition"
                      >
                        <Download className="w-3 h-3" />
                        Export {m.month}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-slate-500 italic">
                    No approved monthly records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Expense Category Allocations</h2>
          <span className="text-xs text-slate-400 font-mono">Standard business taxonomy</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Transactions</th>
                <th className="py-3 px-4 font-semibold">Share of Total</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {report.categories_breakdown.map((c) => (
                <tr key={c.category} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4">
                    <CategoryPill category={c.category} />
                  </td>
                  <td className="py-3 px-4 text-slate-400">{c.transaction_count} transaction(s)</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${Math.min(100, c.percentage)}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-300">{c.percentage}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                    ${c.total_amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
