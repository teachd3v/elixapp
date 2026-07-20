'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Save, Loader2 } from 'lucide-react';

// Dynamically import PDFDownloadLink to prevent SSR issues
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false, loading: () => <button disabled className="p-3 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm font-bold hidden md:inline">Menyiapkan PDF...</span></button> }
);

export default function PDFDownloadButton({ document, fileName, label = "Download Laporan PDF", className = "", iconOnly = false }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  if (!isClient) return null;

  return (
    <PDFDownloadLink document={document} fileName={fileName}>
      {({ blob, url, loading, error }) => (
        <button
          disabled={loading}
          className={`rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-sm
            ${iconOnly ? 'p-2 sm:p-2.5' : 'p-3 md:px-5 md:py-3'}
            ${loading 
              ? 'bg-slate-100 text-slate-400 border border-slate-200' 
              : 'bg-gradient-to-r from-blue-600 to-amber-500 text-white hover:shadow-md hover:scale-[1.02] active:scale-95'
            } ${className}`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {!iconOnly && <span className="text-sm hidden md:inline">{loading ? 'Menyiapkan PDF...' : label}</span>}
        </button>
      )}
    </PDFDownloadLink>
  );
}
