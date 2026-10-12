import React, { useState } from 'react';
import { X, Award, CheckCircle2, FileText, ChevronDown, ChevronUp, Layers, HelpCircle } from 'lucide-react';

const SCORE_BADGES = {
  1: { label: '1 - Kurang', cls: 'bg-rose-50 text-rose-600 border border-rose-200' },
  2: { label: '2 - Cukup', cls: 'bg-amber-50 text-amber-600 border border-amber-200' },
  3: { label: '3 - Baik', cls: 'bg-sky-50 text-sky-600 border border-sky-200' },
  4: { label: '4 - Sangat Baik', cls: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
};

export default function ElixDetailModal({ isOpen, onClose, data, dimensions = [] }) {
  if (!isOpen || !data) return null;

  const [activeTab, setActiveTab] = useState('questions'); // 'dimensions' | 'questions'
  const [collapsedDim, setCollapsedDim] = useState({});

  const toggleDim = (dimId) => {
    setCollapsedDim(prev => ({ ...prev, [dimId]: !prev[dimId] }));
  };

  const saResponses = data.saResponses || {};
  const maResponses = data.maResponses || {};
  const saDim = data.saDimensionScores || {};
  const maDim = data.maDimensionScores || {};

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-4xl my-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500"><Award className="w-4 h-4" /></span>
              <h3 className="text-base font-black text-slate-800 dark:text-white truncate">Rincian Detail Evaluasi ELIX</h3>
            </div>
            <p className="text-xs text-slate-500 truncate">{data.user?.name} · {data.wilayah?.name || '—'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Skor Overview Bar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 shrink-0">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 text-center">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Indeks ELIX</span>
            <span className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{data.elix != null ? data.elix.toFixed(1) : '—'}</span>
            <span className="text-[10px] font-bold text-amber-600 block mt-0.5">{data.category || 'Belum ada kategori'}</span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 text-center">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">Skor SA (40%)</span>
            <span className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{data.hasFilledSA ? ((data.saScore || 0) * 25).toFixed(1) : '—'}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{data.hasFilledSA ? `${(data.saScore || 0).toFixed(2)} / 4.00` : 'Belum diisi'}</span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 text-center">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Skor MA (60%)</span>
            <span className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{data.hasFilledMA ? ((data.maScore || 0) * 25).toFixed(1) : '—'}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{data.hasFilledMA ? `${(data.maScore || 0).toFixed(2)} / 4.00` : 'Belum dinilai'}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Pengisian</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mt-1">SA: {data.hasFilledSA ? '✓ Lengkap' : '—'}</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">MA: {data.hasFilledMA ? '✓ Lengkap' : '—'}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 flex gap-2 shrink-0 bg-slate-50/30 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors ${
              activeTab === 'questions'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Rincian per Pertanyaan</span>
          </button>
          <button
            onClick={() => setActiveTab('dimensions')}
            className={`px-4 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors ${
              activeTab === 'dimensions'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sebaran 5 Dimensi</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'dimensions' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                Tabel di bawah menunjukkan kontribusi dan rata-rata skor pada masing-masing dimensi evaluasi kepemimpinan.
              </p>
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3">Dimensi</th>
                      <th className="p-3 text-center">Bobot</th>
                      <th className="p-3 text-center">Skor SA (1-4)</th>
                      <th className="p-3 text-center">Skor MA (1-4)</th>
                      <th className="p-3 text-right">Indeks ELIX</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dimensions.map((d) => {
                      const sa = saDim[d.id] ?? null;
                      const ma = maDim[d.id] ?? null;
                      const blended = (sa != null && ma != null) ? (0.4 * sa + 0.6 * ma) : (sa != null ? sa : ma);
                      const elixDim = blended != null ? (blended * 25).toFixed(1) : '—';

                      return (
                        <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{d.name}</td>
                          <td className="p-3 text-center text-slate-500">{d.weight ? `${d.weight}%` : '—'}</td>
                          <td className="p-3 text-center font-bold text-blue-600">{sa != null ? sa.toFixed(2) : '—'}</td>
                          <td className="p-3 text-center font-bold text-indigo-600">{ma != null ? ma.toFixed(2) : '—'}</td>
                          <td className="p-3 text-right font-black text-amber-600 text-sm">{elixDim}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Rincian butir jawaban per indikator antara penilaian mandiri (Awardee / SA) dan penilaian objektif (Mentor / MA).
              </p>

              {dimensions.map((dim) => {
                const stmts = dim.statements || [];
                if (stmts.length === 0) return null;
                const isCollapsed = !!collapsedDim[dim.id];

                return (
                  <div key={dim.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    {/* Dimension header */}
                    <div
                      onClick={() => toggleDim(dim.id)}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <span className="font-bold text-xs text-slate-800 dark:text-white">{dim.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700">
                          {stmts.length} butir
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {stmts.map((stmt, sIdx) => {
                          const valSA = saResponses[stmt.id];
                          const valMA = maResponses[stmt.id];
                          const badgeSA = valSA ? SCORE_BADGES[valSA] : null;
                          const badgeMA = valMA ? SCORE_BADGES[valMA] : null;

                          return (
                            <div key={stmt.id} className="p-3.5 space-y-2 hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                    {stmt.code || `Q${sIdx+1}`}
                                  </span>
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                                    {stmt.aspect || 'Indikator'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <span className="text-slate-400 font-bold text-[10px]">SA:</span>
                                    {badgeSA ? (
                                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${badgeSA.cls}`}>
                                        {badgeSA.label}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 text-xs">—</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <span className="text-slate-400 font-bold text-[10px]">MA:</span>
                                    {badgeMA ? (
                                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${badgeMA.cls}`}>
                                        {badgeMA.label}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 text-xs">—</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                                {stmt.textAwardee || stmt.textMentor || '—'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 font-bold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
