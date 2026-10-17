import React from 'react';

const CATEGORY_STYLES: Record<string, string> = {
  'Software & Subscriptions': 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50',
  'Office Supplies': 'bg-blue-950/60 text-blue-300 border-blue-800/50',
  'Travel & Transport': 'bg-amber-950/60 text-amber-300 border-amber-800/50',
  'Meals & Entertainment': 'bg-orange-950/60 text-orange-300 border-orange-800/50',
  'Professional Services': 'bg-purple-950/60 text-purple-300 border-purple-800/50',
  'Utilities & Internet': 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50',
  'Marketing & Advertising': 'bg-pink-950/60 text-pink-300 border-pink-800/50',
  'Hardware & Equipment': 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
  'Taxes & Fees': 'bg-rose-950/60 text-rose-300 border-rose-800/50',
  'Other': 'bg-slate-800/60 text-slate-300 border-slate-700/50',
};

export const CategoryPill: React.FC<{ category: string }> = ({ category }) => {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES['Other'];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${style}`}>
      {category}
    </span>
  );
};
