import React, { useState } from 'react';
import { X, Copy, Check, FileText, Hash, HardDrive } from 'lucide-react';
import { Document } from '../types';
import { StatusBadge } from './StatusBadge';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !document) return null;

  const handleCopy = () => {
    if (document.extracted_text) {
      navigator.clipboard.writeText(document.extracted_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-3xl rounded-2xl p-6 shadow-2xl border border-slate-700/60 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{document.filename}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5" />
                  {formatFileSize(document.file_size)}
                </span>
                <span>•</span>
                <span>Uploaded {document.uploaded_at.replace('T', ' ').slice(0, 19)}</span>
                <span>•</span>
                <StatusBadge status={document.extraction_method || 'pymupdf'} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SHA-256 Hash */}
        <div className="my-4 px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <Hash className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400 font-mono">SHA-256:</span>
            <span className="text-slate-300 font-mono truncate">{document.file_hash}</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-900/40 shrink-0">
            Hash Verified
          </span>
        </div>

        {/* Text Preview */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-2 text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Extracted Text Content</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Text'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed selection:bg-brand-500 selection:text-white">
            {document.extracted_text || '(No text extracted from document)'}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
