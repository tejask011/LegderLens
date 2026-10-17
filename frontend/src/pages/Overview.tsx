import React from 'react';
import {
  DollarSign,
  Receipt,
  Clock,
  Copy,
  ArrowUpRight,
  Upload,
  Download,
  Sparkles,
  PieChart as PieIcon,
  TrendingUp,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { OverviewReport } from '../types';
import { MetricCard } from '../components/MetricCard';
import { CategoryPill } from '../components/CategoryPill';

interface OverviewProps {
  report: OverviewReport | null;
  loading: boolean;
  onNavigate: (tab: string) => void;
  onExportCsv: () => void;
}

const COLORS = [
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#f97316', // orange
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#10b981', // emerald
  '#f43f5e', // rose
  '#64748b', // slate
];

export const Overview: React.FC<OverviewProps> = ({
  report,
  loading,
  onNavigate,
  onExportCsv
}) => {
  if (loading || !report) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-mono">Computing financial metrics with Decimal precision...</p>
      </div>
    );
  }

  const pieData = report.categories_breakdown.map((c) => ({
    name: c.category,
    value: parseFloat(c.total_amount),
    percentage: c.percentage,
    count: c.transaction_count
  }));

  const trendData = report.monthly_trends.map((m) => ({
    month: m.month,
    amount: parseFloat(m.total_amount),
    count: m.transaction_count
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Financial Dashboard
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-brand-950/80 text-brand-400 border border-brand-800/60 font-mono">
              Local SQLite Database
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic Decimal calculations • Explainable duplicate detection • Zero cloud telemetry
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('documents')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white transition shadow-sm glow-emerald"
          >
            <Upload className="w-3.5 h-3.5" />
            Import Documents
          </button>
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-brand-400" />
            Export CSV
          </button>
          <button
            onClick={() => onNavigate('assistant')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border border-indigo-900/40 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Ask AI
          </button>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Approved Spend"
          value={`$${report.total_spend}`}
          subtitle="Strict Decimal precision math"
          icon={DollarSign}
          accentColor="emerald"
          badge={{ text: "Authoritative", variant: "success" }}
        />
        <MetricCard
          title="Approved Records"
          value={report.approved_count}
          subtitle={`Across ${report.categories_breakdown.length} active categories`}
          icon={Receipt}
          accentColor="blue"
          badge={{ text: "Confirmed", variant: "info" }}
        />
        <div
          onClick={() => onNavigate('review')}
          className="cursor-pointer transition hover:scale-[1.02]"
        >
          <MetricCard
            title="Pending Review Queue"
            value={report.pending_count}
            subtitle={report.pending_count > 0 ? "Awaiting your human verification" : "All records confirmed"}
            icon={Clock}
            accentColor="amber"
            badge={{
              text: report.pending_count > 0 ? "Action Required" : "Clean",
              variant: report.pending_count > 0 ? "warning" : "success"
            }}
          />
        </div>
        <div
          onClick={() => onNavigate('transactions')}
          className="cursor-pointer transition hover:scale-[1.02]"
        >
          <MetricCard
            title="Flagged Duplicates"
            value={report.duplicate_count}
            subtitle="Explainable matching • Never auto-deleted"
            icon={Copy}
            accentColor={report.duplicate_count > 0 ? "rose" : "emerald"}
            badge={{
              text: report.duplicate_count > 0 ? "Protected" : "Zero Dupes",
              variant: report.duplicate_count > 0 ? "danger" : "success"
            }}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Donut */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-brand-400" />
              <h2 className="text-sm font-semibold text-white">Spend by Category</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Approved Spend</span>
          </div>

          <div className="py-4 h-64 relative flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="glass-panel p-2.5 rounded-xl border border-slate-700 text-xs shadow-xl">
                            <p className="font-semibold text-white">{data.name}</p>
                            <p className="text-brand-400 font-mono font-bold mt-1">
                              ${data.value.toFixed(2)} ({data.percentage}%)
                            </p>
                            <p className="text-slate-400 text-[10px] mt-0.5">{data.count} transaction(s)</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 italic">No approved category data yet</p>
            )}
          </div>

          {/* Top 3 Legend items */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {report.categories_breakdown.slice(0, 4).map((c, idx) => (
              <div key={c.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-slate-300 truncate max-w-[150px]">{c.category}</span>
                </div>
                <div className="font-mono text-right">
                  <span className="text-white font-medium">${c.total_amount}</span>
                  <span className="text-slate-400 text-[11px] ml-1.5">({c.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Spend Trend */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Monthly Spending Trend</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Total Volume</span>
          </div>

          <div className="py-4 h-64">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="glass-panel p-2.5 rounded-xl border border-slate-700 text-xs shadow-xl">
                            <p className="font-semibold text-slate-300">{d.month}</p>
                            <p className="text-brand-400 font-mono font-bold mt-1 text-sm">
                              ${d.amount.toFixed(2)}
                            </p>
                            <p className="text-slate-400 text-[10px] mt-0.5">{d.count} confirmed expenses</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSpend)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                Upload receipts and approve them to view monthly spending progression
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Verified timeline of approved business deductions</span>
            <span className="font-mono text-emerald-400 font-medium">100% Deterministic</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Merchants & Category Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Merchants Leaderboard */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Top Merchants by Spend</h2>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-[11px] font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1 transition"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {report.top_merchants.length > 0 ? (
              report.top_merchants.slice(0, 5).map((m, idx) => (
                <div
                  key={m.merchant}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-slate-100">{m.merchant}</p>
                      <p className="text-[11px] text-slate-400">{m.transaction_count} transaction(s)</p>
                    </div>
                  </div>
                  <div className="font-mono text-sm font-semibold text-white">
                    ${m.total_amount}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-6 text-center">No merchant data recorded yet.</p>
            )}
          </div>
        </div>

        {/* Category Budget Allocation Progress */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Expense Distribution</h2>
            <button
              onClick={() => onNavigate('reports')}
              className="text-[11px] font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1 transition"
            >
              Full Breakdown <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3.5">
            {report.categories_breakdown.slice(0, 5).map((c) => (
              <div key={c.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{c.category}</span>
                  <span className="font-mono text-slate-100 font-semibold">
                    ${c.total_amount} <span className="text-slate-400 font-normal">({c.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, c.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
