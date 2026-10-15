"use client";

import React from 'react';
import {
  Compass, Calendar, Building2, User, FileText,
  AlertTriangle, CheckCircle2, Edit3, X, Clock, Layers
} from 'lucide-react';

export default function WilayahObservationDetailModal({
  observation,
  onClose,
  onEdit,
  darkMode,
}) {
  if (!observation) return null;

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const subCard = darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80';

  const formattedDate = observation.observationDate
    ? new Date(observation.observationDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const findings = Array.isArray(observation.findings) ? observation.findings : [];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className={`w-full max-w-3xl border rounded-3xl shadow-2xl flex flex-col max-h-[90vh] my-auto overflow-hidden ${card}`}
      >
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase">
                  Instrumen 3 Monev
                </span>
                <span className="text-xs text-slate-400">· Observasi Wilayah</span>
              </div>
              <h2 className="text-lg font-black mt-0.5">
                Wilayah {observation.wilayah?.name || 'Program'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* METADATA HIGHLIGHTS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-3.5 rounded-2xl border ${subCard} flex items-center gap-3`}>
              <Layers className="w-4 h-4 text-purple-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Periode</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {observation.periodName}
                </span>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${subCard} flex items-center gap-3`}>
              <Calendar className="w-4 h-4 text-purple-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tanggal Observasi</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {formattedDate}
                </span>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${subCard} flex items-center gap-3`}>
              <User className="w-4 h-4 text-purple-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Observer</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {observation.evaluatedBy?.name || 'Superadmin'}
                </span>
              </div>
            </div>
          </div>

          {/* BAGIAN A: PERKEMBANGAN PROGRAM */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-[11px]">
                A
              </div>
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Bagian A. Perkembangan Program
              </h3>
            </div>

            {/* Realisasi Pelaksanaan Program */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-500" />
                Realisasi Pelaksanaan Program
              </h4>
              <div className={`p-4 rounded-2xl border ${subCard} leading-relaxed font-normal whitespace-pre-wrap text-slate-700 dark:text-slate-300`}>
                {observation.programRealization || '—'}
              </div>
            </div>

            {/* Performa Mentor */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-500" />
                Performa Mentor
              </h4>
              <div className={`p-4 rounded-2xl border ${subCard} leading-relaxed font-normal whitespace-pre-wrap text-slate-700 dark:text-slate-300`}>
                {observation.mentorPerformanceSummary || '—'}
              </div>
            </div>

            {/* Aspek Tambahan Bagian A jika ada */}
            {observation.sectionAAnswers && typeof observation.sectionAAnswers === 'object' && Object.keys(observation.sectionAAnswers).length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                {Object.entries(observation.sectionAAnswers).map(([title, val], idx) => {
                  if (!val || typeof val !== 'string') return null;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        {title}
                      </h4>
                      <div className={`p-4 rounded-2xl border ${subCard} leading-relaxed font-normal whitespace-pre-wrap text-slate-700 dark:text-slate-300`}>
                        {val}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BAGIAN B: TEMUAN KETIDAKCAPAIAN TARGET PROGRAM */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-[11px]">
                  B
                </div>
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Bagian B. Temuan Ketidakcapaian Target Program
                </h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                {findings.length} Temuan
              </span>
            </div>

            {findings.length === 0 ? (
              <div className={`p-6 rounded-2xl border border-dashed text-center space-y-1 ${subCard}`}>
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-600 dark:text-slate-300">
                  Tidak ada temuan ketidakcapaian pada periode ini.
                </p>
                <p className="text-[11px] text-slate-400">
                  Seluruh target dan operasional wilayah berjalan sesuai perencanaan.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100/80 border-slate-200'}`}>
                    <tr>
                      <th className="py-2.5 px-3 font-black text-[11px] w-12 text-center">No</th>
                      <th className="py-2.5 px-3 font-black text-[11px]">Temuan Masalah</th>
                      <th className="py-2.5 px-3 font-black text-[11px]">Rekomendasi Tindak Lanjut</th>
                      <th className="py-2.5 px-3 font-black text-[11px] w-32">Due Date (Bulan)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {findings.map((f, idx) => (
                      <tr key={f.id || idx} className="hover:bg-slate-500/5 transition-colors">
                        <td className="py-3 px-3 text-center font-black text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                          {f.category && (
                            <span className="inline-block mb-1.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              {f.category}
                            </span>
                          )}
                          <div>{f.finding || '—'}</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                          {f.recommendation || '—'}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {f.dueDate ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Clock className="w-3 h-3" />
                              {f.dueDate}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Tidak ditentukan</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-[11px] text-slate-400">
            Dibuat pada {new Date(observation.createdAt).toLocaleDateString('id-ID')}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (onEdit) onEdit(observation);
              }}
              className="px-4 py-2 rounded-xl text-xs font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Laporan
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
