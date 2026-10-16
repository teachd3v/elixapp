"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
  MessageSquare, Calendar, Building2, User, FileText,
  CheckCircle2, Clock, Layers, GraduationCap, Heart,
  BookOpen, ShieldCheck, Compass, UserCheck, Sparkles,
  Target, Award, ChevronDown, ChevronUp
} from 'lucide-react';

const ASPECT_ICONS = {
  'academic readiness': GraduationCap,
  'islamic character': Heart,
  'quranic development': BookOpen,
  'self mastery': ShieldCheck,
  'social impact leadership': Compass,
  'mentor': UserCheck,
};

export default function AwardeeMonevView({ darkMode, dbUser }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    awardee: null,
    records: [],
  });
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [expandedAspects, setExpandedAspects] = useState({});

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const subCard = darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80';

  useEffect(() => {
    async function fetchAwardeeMonev() {
      setLoading(true);
      try {
        const res = await fetch('/api/awardee/monev');
        if (!res.ok) throw new Error('Gagal memuat data evaluasi');
        const json = await res.json();
        setData(json);
        if (json.records?.length > 0) {
          setSelectedRecordId(json.records[0].id);
        }
      } catch (err) {
        console.error('Error fetching awardee monev:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAwardeeMonev();
  }, []);

  const activeRecord = useMemo(() => {
    return data.records.find((r) => r.id === selectedRecordId) || data.records[0] || null;
  }, [data.records, selectedRecordId]);

  // Group answers by aspectName
  const groupedAnswers = useMemo(() => {
    if (!activeRecord) return [];
    const map = new Map();
    const answers = Array.isArray(activeRecord.answers) ? activeRecord.answers : [];

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
  }, [activeRecord]);

  const toggleAspect = (aspectName) => {
    setExpandedAspects((prev) => ({
      ...prev,
      [aspectName]: prev[aspectName] === undefined ? false : !prev[aspectName],
    }));
  };

  if (loading) {
    return (
      <div className={`border rounded-3xl p-16 flex flex-col items-center justify-center gap-4 ${card}`}>
        <div className="w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold opacity-60">Memuat hasil wawancara Monev...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      {/* HEADER BANNER */}
      <div className={`border rounded-3xl p-6 sm:p-8 relative overflow-hidden ${card}`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Instrumen 3: Indepth Interview
              </span>
              {data.awardee?.wilayah?.name && (
                <span className="text-xs text-slate-400">
                  · Wilayah {data.awardee.wilayah.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Potret Diri & Rencana Pengembangan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Hasil wawancara mendalam (indepth interview) dengan observer pusat untuk merefleksikan capaian akademik, karakter, kepemimpinan, dan menentukan roadmap langkah aksi ke depan.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Awardee</span>
              <span className="font-black text-sm block truncate max-w-[180px]">
                {data.awardee?.user?.name || dbUser?.name || 'Awardee'}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Wilayah {data.awardee?.wilayah?.name || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {data.records.length === 0 ? (
        <div className={`border rounded-3xl p-12 text-center flex flex-col items-center gap-3 ${card}`}>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black">Belum Ada Sesi Wawancara</h3>
          <p className="text-xs opacity-60 max-w-md leading-relaxed">
            Observer pusat belum merilis hasil sesi indepth interview untuk akunmu. Catatan wawancara dan rencana aksi pengembangan diri akan otomatis tampil di sini setelah diverifikasi.
          </p>
        </div>
      ) : (
        <>
          {/* PERIOD SELECTOR (IF MULTIPLE) */}
          {data.records.length > 1 && (
            <div className={`border rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap ${card}`}>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <Layers className="w-4 h-4 text-emerald-500" />
                Pilih Periode Wawancara:
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {data.records.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRecordId(r.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeRecord?.id === r.id
                        ? 'bg-emerald-500 text-white font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {r.periodName} ({new Date(r.interviewDate).toLocaleDateString('id-ID')})
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeRecord && (
            <div className="space-y-6">
              {/* METADATA BAR */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-4 rounded-2xl border ${subCard} flex items-center gap-3`}>
                  <Layers className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Periode Evaluasi</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-white">
                      {activeRecord.periodName}
                    </span>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${subCard} flex items-center gap-3`}>
                  <Calendar className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tanggal Wawancara</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-white">
                      {new Date(activeRecord.interviewDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${subCard} flex items-center gap-3`}>
                  <User className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Pewawancara / Observer</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-white">
                      {activeRecord.evaluatedBy?.name || 'Observer Pusat'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* GOLDEN HIGHLIGHT: RENCANA AKSI & REKOMENDASI PENGEMBANGAN DIRI */}
              {/* ============================================================== */}
              <div className="relative p-6 sm:p-7 rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent shadow-lg shadow-amber-500/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md shadow-amber-500/20">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      Highlight Utama
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      Rencana Aksi & Rekomendasi Pengembangan Diri
                    </h2>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-amber-500/20 backdrop-blur-sm">
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-medium">
                    {activeRecord.actionPlan || (
                      <span className="italic text-slate-400 font-normal">
                        Belum ada catatan rencana aksi spesifik yang dicantumkan untuk sesi wawancara ini.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* KESIMPULAN UMUM WAWANCARA */}
              {activeRecord.generalSummary && (
                <div className={`border rounded-3xl p-6 ${card} space-y-3`}>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="font-black text-xs uppercase tracking-wider">
                      Kesimpulan Umum Pewawancara
                    </h3>
                  </div>
                  <div className={`p-4 rounded-2xl border ${subCard} leading-relaxed text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap`}>
                    {activeRecord.generalSummary}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TRANSKRIP 6 ASPEK WAWANCARA                                    */}
              {/* ============================================================== */}
              <div className={`border rounded-3xl p-6 ${card} space-y-5`}>
                <div>
                  <h3 className="font-black text-base">Transkrip Diskusi per Aspek</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Catatan butir pertanyaan, jawaban awardee, serta ulasan observer pada 6 aspek pembinaan.
                  </p>
                </div>

                <div className="space-y-4">
                  {groupedAnswers.map((group, gIdx) => {
                    const Icon = ASPECT_ICONS[group.aspectName.toLowerCase()] || MessageSquare;
                    const isCollapsed = expandedAspects[group.aspectName] === false;

                    return (
                      <div key={gIdx} className={`rounded-2xl border ${subCard} overflow-hidden`}>
                        {/* ASPECT HEADER BUTTON */}
                        <button
                          type="button"
                          onClick={() => toggleAspect(group.aspectName)}
                          className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">
                                Aspek: {group.aspectName}
                              </h4>
                              <span className="text-[10px] text-slate-400">
                                {group.items.length} Pertanyaan Tercatat
                              </span>
                            </div>
                          </div>

                          <div className="text-slate-400 p-1">
                            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                          </div>
                        </button>

                        {/* ASPECT QUESTIONS CONTENT */}
                        {!isCollapsed && (
                          <div className="p-4 pt-0 space-y-3 border-t border-slate-200/60 dark:border-slate-700/60 mt-1">
                            {group.items.map((item, iIdx) => (
                              <div
                                key={item.questionId || iIdx}
                                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs"
                              >
                                <p className="font-black text-slate-800 dark:text-slate-100 leading-relaxed">
                                  Q{iIdx + 1}: {item.question}
                                </p>

                                <div className="pl-3 border-l-2 border-emerald-500 space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                    Jawaban Awardee:
                                  </span>
                                  <p className="font-normal text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {item.answer || <span className="italic text-slate-400">Tidak ada jawaban tercatat.</span>}
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
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
