"use client";

import React, { useMemo } from 'react';
import {
  MessageSquare, Calendar, Building2, User, FileText,
  CheckCircle2, Edit3, X, Clock, Layers, GraduationCap,
  Heart, BookOpen, ShieldCheck, Compass, UserCheck
} from 'lucide-react';

const ASPECT_ICONS = {
  'academic readiness': GraduationCap,
  'islamic character': Heart,
  'quranic development': BookOpen,
  'self mastery': ShieldCheck,
  'social impact leadership': Compass,
  'mentor': UserCheck,
};

export default function AwardeeInterviewDetailModal({
  record,
  onClose,
  onEdit,
  darkMode,
}) {
  if (!record) return null;

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const subCard = darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80';

  const formattedDate = record.interviewDate
    ? new Date(record.interviewDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  // Group answers by aspectName
  const groupedAnswers = useMemo(() => {
    const map = new Map();
    const answers = Array.isArray(record.answers) ? record.answers : [];

    answers.forEach((ans) => {
      const asp = ans.aspectName || 'Lainnya';
      if (!map.has(asp)) {
        map.set(asp, []);
      }
      map.get(asp).push(ans);
    });

    return Array.from(map.entries()).map(([aspectName, items]) => ({
      aspectName,
      items,
    }));
  }, [record.answers]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className={`w-full max-w-3xl border rounded-3xl shadow-2xl flex flex-col max-h-[90vh] my-auto overflow-hidden ${card}`}
      >
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <img
              src={
                record.awardee?.user?.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  record.awardee?.user?.name || 'Awardee'
                )}&background=random`
              }
              alt="Avatar"
              className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500/30"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                  Dossier Wawancara Indepth
                </span>
                <span className="text-xs text-slate-400">· Instrumen 3</span>
              </div>
              <h2 className="text-lg font-black mt-0.5">
                {record.awardee?.user?.name || 'Awardee'}
              </h2>
              <p className="text-xs text-slate-400">
                {(record.awardee?.school || record.awardee?.university) ? `${record.awardee?.school || record.awardee?.university} · ` : ''}Wilayah {record.awardee?.wilayah?.name || '—'} · {record.periodName}
              </p>
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
              <Layers className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Periode</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {record.periodName}
                </span>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${subCard} flex items-center gap-3`}>
              <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tanggal Wawancara</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {formattedDate}
                </span>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${subCard} flex items-center gap-3`}>
              <User className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Pewawancara</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {record.evaluatedBy?.name || 'Superadmin'}
                </span>
              </div>
            </div>
          </div>

          {/* TRANSCRIPT BY ASPECT */}
          <div className="space-y-6">
            {groupedAnswers.map((group, gIdx) => {
              const Icon = ASPECT_ICONS[group.aspectName.toLowerCase()] || MessageSquare;

              return (
                <div key={gIdx} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100">
                      Aspek: {group.aspectName}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((item, iIdx) => (
                      <div
                        key={item.questionId || iIdx}
                        className={`p-4 rounded-2xl border ${subCard} space-y-2`}
                      >
                        <p className="font-black text-xs text-slate-800 dark:text-slate-100 leading-relaxed">
                          Q{iIdx + 1}: {item.question}
                        </p>

                        <div className="pl-3 border-l-2 border-emerald-500 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Jawaban Awardee:
                          </span>
                          <p className="font-normal text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {item.answer || <span className="italic text-slate-400">Belum ada jawaban tercatat</span>}
                          </p>
                        </div>

                        {item.notes && (
                          <div className="pt-1 text-[11px] text-slate-400 italic">
                            Catatan Observer: {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* KESIMPULAN & RENCANA AKSI */}
          {(record.generalSummary || record.actionPlan) && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Kesimpulan & Rencana Aksi
              </h3>

              {record.generalSummary && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-200 block text-xs">
                    Kesimpulan Umum
                  </span>
                  <div className={`p-4 rounded-2xl border ${subCard} leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300`}>
                    {record.generalSummary}
                  </div>
                </div>
              )}

              {record.actionPlan && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-200 block text-xs">
                    Rencana Aksi & Rekomendasi Pengembangan Diri
                  </span>
                  <div className={`p-4 rounded-2xl border ${subCard} leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300`}>
                    {record.actionPlan}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-[11px] text-slate-400">
            Dicatat pada {new Date(record.createdAt).toLocaleDateString('id-ID')}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (onEdit) onEdit(record);
              }}
              className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Wawancara
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
