import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  CheckSquare,
  Receipt,
  BarChart3,
  Sparkles,
  Settings as SettingsIcon,
  Cpu,
  RefreshCw,
  Database
} from 'lucide-react';
import { OllamaStatus } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
  ollamaStatus: OllamaStatus | null;
  onRefreshOllama: () => void;
  onSeedData: () => Promise<void>;
  seeding: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  ollamaStatus,
  onRefreshOllama,
  onSeedData,
  seeding
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents', icon: FileSpreadsheet },
    { id: 'review', label: 'Review Queue', icon: CheckSquare, badge: pendingCount },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'assistant', label: 'AI Assistant', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="font-mono font-extrabold text-brand-400 text-lg">LL</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">LEDGER<span className="text-brand-400">LENS</span></span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 font-mono">
                LOCAL-FIRST
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5">Open-Weight AI Financial Organizer</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold ml-0.5">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick controls: Ollama Indicator & Seed button */}
        <div className="flex items-center gap-2.5">
          {/* Seed demo dataset button */}
          <button
            onClick={onSeedData}
            disabled={seeding}
            title="Populate synthetic sample invoices, receipts, and CSV records for instant testing"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5 text-brand-400" />
            <span>{seeding ? 'Seeding...' : 'Seed Demo Data'}</span>
          </button>

          {/* Ollama Status Badge */}
          <button
            onClick={onRefreshOllama}
            title={ollamaStatus?.message || 'Check local Ollama inference status'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition"
          >
            <span className="relative flex h-2 w-2">
              {ollamaStatus?.available ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              )}
            </span>
            <span className="text-slate-300 text-[11px] hidden sm:inline">
              {ollamaStatus?.available ? `Ollama: ${ollamaStatus.configured_model}` : 'Ollama Offline'}
            </span>
            <RefreshCw className="w-3 h-3 text-slate-500 hover:text-slate-300 ml-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
