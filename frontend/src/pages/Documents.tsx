import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  Eye,
  AlertCircle,
  Hash,
  ArrowRight,
  HardDrive
} from 'lucide-react';
import { Document, ExtractedCandidate } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { DocumentViewerModal } from '../components/DocumentViewerModal';

interface DocumentsProps {
  documents: Document[];
  loading: boolean;
  onUpload: (files: File[]) => Promise<ExtractedCandidate[]>;
  onDeleteDocument: (id: string) => Promise<void>;
  onNavigateToReview: () => void;
}

export const Documents: React.FC<DocumentsProps> = ({
  documents,
  loading,
  onUpload,
  onDeleteDocument,
  onNavigateToReview
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [recentCandidates, setRecentCandidates] = useState<ExtractedCandidate[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = async (files: File[]) => {
    setUploading(true);
    setUploadError(null);
    try {
      const candidates = await onUpload(files);
      setRecentCandidates(candidates);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Financial Documents</h1>
          <p className="text-xs text-slate-400 mt-1">
            Import digital invoices, scanned receipts, and CSV statements for local parsing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono">
            {documents.length} File{documents.length !== 1 ? 's' : ''} Stored Locally
          </span>
        </div>
      </div>

      {/* Upload Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          dragActive
            ? 'border-brand-500 bg-brand-950/20 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.csv"
          onChange={handleChange}
          className="hidden"
          id="file-upload-input"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <label
              htmlFor="file-upload-input"
              className="cursor-pointer text-sm font-semibold text-brand-400 hover:text-brand-300 transition"
            >
              Choose files to upload
            </label>
            <span className="text-slate-400 text-sm"> or drag and drop</span>
            <p className="text-xs text-slate-400 mt-1">
              Supports PDF invoices, PNG/JPG receipts, and bank CSV exports (up to 15MB)
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-900/40 font-mono">
              PyMuPDF Text Engine
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-900/40 font-mono">
              OCR Scanned Pages
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-teal-950/60 text-teal-300 border border-teal-900/40 font-mono">
              CSV Parser
            </span>
          </div>
        </div>

        {uploading && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-300 font-mono">Extracting fields and running duplicate checks...</p>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-900/70 text-rose-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Banner when candidates were extracted */}
      {recentCandidates.length > 0 && (
        <div className="p-4 rounded-xl bg-brand-950/50 border border-brand-800/60 flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-brand-400" />
            <div>
              <p className="font-semibold text-white">
                {recentCandidates.length} candidate record{recentCandidates.length !== 1 ? 's' : ''} extracted successfully!
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Review candidate dates, amounts, and AI suggested categories before confirming to your ledger.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToReview}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition shadow-sm"
          >
            Go to Review Queue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Uploaded Documents Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Stored Document Files</h2>
          <span className="text-xs text-slate-400 font-mono">Local-first repository</span>
        </div>

        {documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Filename</th>
                  <th className="py-3 px-4 font-semibold">Size</th>
                  <th className="py-3 px-4 font-semibold">Method</th>
                  <th className="py-3 px-4 font-semibold">SHA-256 Checksum</th>
                  <th className="py-3 px-4 font-semibold">Uploaded</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {doc.file_type === 'csv' ? (
                          <FileSpreadsheet className="w-4 h-4 text-teal-400 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        )}
                        <span className="font-medium text-slate-200 truncate max-w-[200px]" title={doc.filename}>
                          {doc.filename}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{formatFileSize(doc.file_size)}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={doc.extraction_method || 'pymupdf'} />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      <span className="truncate max-w-[120px] inline-block" title={doc.file_hash}>
                        {doc.file_hash.slice(0, 12)}...
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{doc.uploaded_at.slice(0, 10)}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          title="Inspect raw extracted text and checksum"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteDocument(doc.id)}
                          title="Delete document and remove local file"
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
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <p>No documents uploaded yet.</p>
            <p className="text-[11px] text-slate-400">
              Drag & drop invoice PDFs, receipts, or bank CSV files above or use the "Seed Demo Data" button.
            </p>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      <DocumentViewerModal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        document={selectedDoc}
      />
    </div>
  );
};
