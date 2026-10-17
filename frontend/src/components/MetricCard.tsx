import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'info' | 'danger';
  };
  accentColor?: 'emerald' | 'amber' | 'blue' | 'purple' | 'rose';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  accentColor = 'emerald'
}) => {
  const colorMap = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const badgeMap = {
    success: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
    warning: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
    info: 'bg-blue-950/80 text-blue-300 border-blue-800/60',
    danger: 'bg-rose-950/80 text-rose-300 border-rose-800/60',
  };

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight text-white mt-2 font-mono">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${colorMap[accentColor]} transition-transform group-hover:scale-110 duration-200`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {badge && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${badgeMap[badge.variant]}`}>
            {badge.text}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Verified Local Math</span>
        </div>
      )}
    </div>
  );
};
