import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, Copy, FileText, Cpu, Table } from 'lucide-react';

interface StatusBadgeProps {
  status: 'approved' | 'pending' | 'duplicate' | 'pymupdf' | 'ocr' | 'csv' | 'rejected' | string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          {label || 'Approved'}
        </span>
      );
    case 'pending':
    case 'pending_review':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/80 text-amber-300 border border-amber-800/60 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          {label || 'Review Needed'}
        </span>
      );
    case 'duplicate':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-950/80 text-rose-300 border border-rose-800/60 shadow-sm">
          <Copy className="w-3.5 h-3.5 text-rose-300" />
          {label || 'Possible Duplicate'}
        </span>
      );
    case 'pymupdf':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950/60 text-blue-300 border border-blue-900/40">
          <FileText className="w-3 h-3" />
          PyMuPDF
        </span>
      );
    case 'tesseract_ocr':
    case 'ocr':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-purple-950/60 text-purple-300 border border-purple-900/40">
          <Cpu className="w-3 h-3" />
          OCR
        </span>
      );
    case 'csv_parser':
    case 'csv':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-teal-950/60 text-teal-300 border border-teal-900/40">
          <Table className="w-3 h-3" />
          CSV
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          {label || status}
        </span>
      );
  }
};
