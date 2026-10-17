"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
  Award, BookOpen, Compass, Calendar, User, CheckCircle2,
  Layers, Sparkles, FileText, Clock, ThumbsUp, Lightbulb,
  Target, ChevronDown, ChevronUp
} from 'lucide-react';
import { getPerformanceCategory, getTeachingCategory } from '@/lib/monev';

export default function MentorMonevView({ darkMode, dbUser }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    mentor: null,
    performanceEvaluations: [],
    teachingEvaluations: [],
    wilayahObservations: [],
    plans: [],
    teachingAspects: [],
  });

  const [activeSubTab, setActiveSubTab] = useState('performance'); // 'performance' | 'teaching' | 'wilayah'
  const [selectedPerfId, setSelectedPerfId] = useState(null);
  const [selectedTeachId, setSelectedTeachId] = useState(null);
  const [selectedObsId, setSelectedObsId] = useState(null);

  // Accordion state (default closed for minimalism on mobile)
  const [openPlanIds, setOpenPlanIds] = useState({});
  const [openTeachAspectIds, setOpenTeachAspectIds] = useState({});

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const subCard = darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80';

  useEffect(() => {
    async function fetchMonevData() {
      setLoading(true);
      try {
        const res = await fetch('/api/mentor/monev');
        if (!res.ok) throw new Error('Gagal memuat data Monev');
        const json = await res.json();
        setData(json);

        if (json.performanceEvaluations?.length > 0) {
          setSelectedPerfId(json.performanceEvaluations[0].id);
        }
        if (json.teachingEvaluations?.length > 0) {
          setSelectedTeachId(json.teachingEvaluations[0].id);
        }
        if (json.wilayahObservations?.length > 0) {
          setSelectedObsId(json.wilayahObservations[0].id);
        }
      } catch (err) {
        console.error('Error fetching mentor monev data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMonevData();
  }, []);

  const activePerf = useMemo(() => {
    return data.performanceEvaluations.find((p) => p.id === selectedPerfId) || data.performanceEvaluations[0] || null;
  }, [data.performanceEvaluations, selectedPerfId]);

  const activeTeach = useMemo(() => {
    return data.teachingEvaluations.find((t) => t.id === selectedTeachId) || data.teachingEvaluations[0] || null;
  }, [data.teachingEvaluations, selectedTeachId]);

  const activeObs = useMemo(() => {
    return data.wilayahObservations.find((o) => o.id === selectedObsId) || data.wilayahObservations[0] || null;
  }, [data.wilayahObservations, selectedObsId]);

  const togglePlan = (planId) => {
    setOpenPlanIds((prev) => ({ ...prev, [planId]: !prev[planId] }));
  };

  const toggleTeachAspect = (aspectId) => {
    setOpenTeachAspectIds((prev) => ({ ...prev, [aspectId]: !prev[aspectId] }));
  };

  if (loading) {
    return (
      <div className={`border rounded-3xl p-16 flex flex-col items-center justify-center gap-4 ${card}`}>
        <div className="w-9 h-9 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold opacity-60">Memuat hasil evaluasi Monev...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-32">
      {/* HEADER BANNER */}
      <div className={`border rounded-3xl p-4 sm:p-6 relative overflow-hidden ${card}`}>
        <h1 className="text-lg sm:text-2xl font-black tracking-tight mb-3.5">
          Hasil Monev
        </h1>

        {/* SUB-TABS NAVIGATION */}
        <div className="flex items-center gap-2 pt-3.5 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveSubTab('performance')}
            title="Performa Kerja"
            className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'performance'
                ? 'flex-1 px-4 bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'px-3.5 shrink-0 text-slate-500 hover:text-slate-800 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4 shrink-0" />
            {activeSubTab === 'performance' && (
              <>
                <span className="truncate">Performa Kerja</span>
                {data.performanceEvaluations.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/15 shrink-0">
                    {data.performanceEvaluations.length}
                  </span>
                )}
              </>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('teaching')}
            title="Kompetensi Mengajar"
            className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'teaching'
                ? 'flex-1 px-4 bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'px-3.5 shrink-0 text-slate-500 hover:text-slate-800 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            {activeSubTab === 'teaching' && (
              <>
                <span className="truncate">Kompetensi Mengajar</span>
                {data.teachingEvaluations.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/15 shrink-0">
                    {data.teachingEvaluations.length}
                  </span>
                )}
              </>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('wilayah')}
            title="Laporan Akhir"
            className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'wilayah'
                ? 'flex-1 px-4 bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'px-3.5 shrink-0 text-slate-500 hover:text-slate-800 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            {activeSubTab === 'wilayah' && (
              <>
                <span className="truncate">Laporan Akhir</span>
                {data.wilayahObservations.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/15 shrink-0">
                    {data.wilayahObservations.length}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: PERFORMA KERJA MENTOR                               */}
      {/* ============================================================== */}
      {activeSubTab === 'performance' && (
        <div className="space-y-4">
          {data.performanceEvaluations.length === 0 ? (
            <div className={`border rounded-3xl p-10 sm:p-12 text-center flex flex-col items-center gap-2.5 ${card}`}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Award className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-base font-black">Belum Ada Penilaian Performa</h3>
            </div>
          ) : (
            <>
              {/* PERIOD SELECTOR (IF MULTIPLE) */}
              {data.performanceEvaluations.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {data.performanceEvaluations.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedPerfId(ev.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        activePerf?.id === ev.id
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {ev.periodName} ({ev.evaluationYear})
                    </button>
                  ))}
                </div>
              )}

              {activePerf && (
                <>
                  {/* UNIFIED SCORECARD (3 KOLOM SKOR + 1 BARIS METADATA) */}
                  <div className={`border rounded-3xl p-4 sm:p-5 ${card}`}>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {/* TOTAL */}
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          Total
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 my-0.5">
                          {Number(activePerf.totalScore || 0).toFixed(1)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase truncate max-w-full ${
                          getPerformanceCategory(activePerf.totalScore).badge
                        }`}>
                          {activePerf.category || getPerformanceCategory(activePerf.totalScore).label}
                        </span>
                      </div>

                      {/* SEM 1 */}
                      <div className={`p-3 rounded-2xl border ${subCard} flex flex-col items-center justify-center text-center`}>
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Semester 1
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 my-0.5">
                          {activePerf.scoreSemester1 != null ? Number(activePerf.scoreSemester1).toFixed(1) : '—'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold">
                          {activePerf.scoreSemester1 != null ? 'Dinilai' : 'Belum'}
                        </span>
                      </div>

                      {/* SEM 2 */}
                      <div className={`p-3 rounded-2xl border ${subCard} flex flex-col items-center justify-center text-center`}>
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Semester 2
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 my-0.5">
                          {activePerf.scoreSemester2 != null ? Number(activePerf.scoreSemester2).toFixed(1) : '—'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold">
                          {activePerf.scoreSemester2 != null ? 'Dinilai' : 'Belum'}
                        </span>
                      </div>
                    </div>

                    {/* 1-LINE METADATA BAR */}
                    <div className={`mt-3.5 pt-3.5 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'} grid grid-cols-3 divide-x ${darkMode ? 'divide-slate-800' : 'divide-slate-200/80'}`}>
                      <div className="pr-2 flex flex-col justify-center min-w-0">
                        <span className="text-[8px] sm:text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5 text-amber-500 shrink-0" /> Periode
                        </span>
                        <span className="font-extrabold text-[10px] sm:text-xs text-slate-800 dark:text-white truncate mt-0.5">
                          {activePerf.periodName} {activePerf.evaluationYear}
                        </span>
                      </div>

                      <div className="px-2.5 flex flex-col justify-center min-w-0">
                        <span className="text-[8px] sm:text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-amber-500 shrink-0" /> Tanggal
                        </span>
                        <span className="font-extrabold text-[10px] sm:text-xs text-slate-800 dark:text-white truncate mt-0.5">
                          {new Date(activePerf.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="pl-2.5 flex flex-col justify-center min-w-0">
                        <span className="text-[8px] sm:text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                          <User className="w-2.5 h-2.5 text-amber-500 shrink-0" /> Observer
                        </span>
                        <span className="font-extrabold text-[10px] sm:text-xs text-slate-800 dark:text-white truncate mt-0.5">
                          {activePerf.evaluatedBy?.name || 'Observer Pusat'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* HIGHLIGHT FEEDBACK (RINGKAS) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className={`border rounded-3xl p-4 sm:p-5 ${card} border-emerald-500/20 bg-emerald-500/5`}>
                      <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                        <ThumbsUp className="w-4 h-4 shrink-0" />
                        <h3 className="font-black text-xs uppercase tracking-wider">
                          Apresiasi & Kelebihan
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {activePerf.wellDoneNotes || (
                          <span className="italic text-slate-400">Belum ada catatan apresiasi.</span>
                        )}
                      </p>
                    </div>

                    <div className={`border rounded-3xl p-4 sm:p-5 ${card} border-amber-500/20 bg-amber-500/5`}>
                      <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
                        <Target className="w-4 h-4 shrink-0" />
                        <h3 className="font-black text-xs uppercase tracking-wider">
                          Area Pengembangan
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {activePerf.improvementNotes || (
                          <span className="italic text-slate-400">Belum ada catatan rekomendasi perbaikan.</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* BREAKDOWN PER TARGET KERJA (ACCORDION DEFAULT TERTUTUP) */}
                  <div className={`border rounded-3xl p-4 sm:p-5 ${card} space-y-3.5`}>
                    <h3 className="font-black text-sm sm:text-base">Rincian Target Kerja</h3>

                    <div className="space-y-2.5">
                      {data.plans.map((plan) => {
                        const isOpen = !!openPlanIds[plan.id];

                        return (
                          <div key={plan.id} className={`rounded-2xl border ${subCard} overflow-hidden`}>
                            <button
                              type="button"
                              onClick={() => togglePlan(plan.id)}
                              className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                            >
                              <div className="min-w-0">
                                <h4 className={`font-black text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100 ${isOpen ? 'whitespace-normal leading-snug' : 'truncate'}`}>
                                  {plan.title}
                                </h4>
                                <span className="text-[10px] font-semibold text-slate-400">
                                  {plan.targets.length} Indikator Target
                                </span>
                              </div>
                              <div className="p-1 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 dark:text-slate-300 shrink-0">
                                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </button>

                            {isOpen && (
                              <div className="p-3.5 pt-2.5 space-y-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                                {plan.targets.map((tgt) => {
                                  const scoreEntry = activePerf.itemScores?.[tgt.id] || {};
                                  const sem1 = scoreEntry.scoreSem1;
                                  const sem2 = scoreEntry.scoreSem2;

                                  return (
                                    <div
                                      key={tgt.id}
                                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs"
                                    >
                                      <div className="font-bold text-slate-800 dark:text-slate-100 leading-snug">
                                        {tgt.title}
                                      </div>

                                      {tgt.targetSemester && (
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                          Target: {tgt.targetSemester}
                                        </p>
                                      )}

                                      {/* 1-LINE COMPACT BADGES */}
                                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                          Bobot {tgt.weight}%
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                          Sem 1: {sem1 != null ? `${sem1} / 4` : '—'}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                          Sem 2: {sem2 != null ? `${sem2} / 4` : '—'}
                                        </span>
                                      </div>

                                      {scoreEntry.evidence && (
                                        <div className="text-[11px] text-slate-600 dark:text-slate-300 pl-2.5 border-l-2 border-amber-500 pt-0.5">
                                          {scoreEntry.evidence}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: KOMPETENSI MENGAJAR MENTOR                           */}
      {/* ============================================================== */}
      {activeSubTab === 'teaching' && (
        <div className="space-y-4">
          {data.teachingEvaluations.length === 0 ? (
            <div className={`border rounded-3xl p-10 sm:p-12 text-center flex flex-col items-center gap-2.5 ${card}`}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-base font-black">Belum Ada Penilaian Mengajar</h3>
            </div>
          ) : (
            <>
              {/* SESSION SELECTOR (IF MULTIPLE) */}
              {data.teachingEvaluations.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {data.teachingEvaluations.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedTeachId(ev.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        activeTeach?.id === ev.id
                          ? 'bg-blue-500 text-white font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {ev.periodName} ({new Date(ev.evaluationDate).toLocaleDateString('id-ID')})
                    </button>
                  ))}
                </div>
              )}

              {activeTeach && (
                <>
                  {/* UNIFIED SCORECARD (2 KOLOM SKOR + 1 BARIS METADATA) */}
                  <div className={`border rounded-3xl p-4 sm:p-5 ${card}`}>
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          Capaian Mengajar
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 my-0.5">
                          {Number(activeTeach.percentage || 0).toFixed(1)}%
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase truncate max-w-full ${
                          getTeachingCategory(activeTeach.percentage).badge
                        }`}>
                          {activeTeach.category || getTeachingCategory(activeTeach.percentage).label}
                        </span>
                      </div>

                      <div className={`p-3 rounded-2xl border ${subCard} flex flex-col items-center justify-center text-center`}>
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Skor Indikator
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 my-0.5">
                          {activeTeach.totalScore} / {activeTeach.maxScore}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold">
                          Poin Terpenuhi
                        </span>
                      </div>
                    </div>

                    {/* 1-LINE METADATA BAR */}
                    <div className={`mt-3.5 pt-3.5 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'} grid grid-cols-3 divide-x ${darkMode ? 'divide-slate-800' : 'divide-slate-200/80'}`}>
                      <div className="pr-2 flex flex-col justify-center min-w-0">
                        <span className="text-[8px] sm:text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5 text-blue-500 shrink-0" /> Topik
                        </span>
                        <span className="font-extrabold text-[10px] sm:text-xs text-slate-800 dark:text-white truncate mt-0.5">
                          {activeTeach.sessionTopic || activeTeach.periodName}
                        </span>
                      </div>

                      <div className="px-2.5 flex flex-col justify-center min-w-0">
                        <span className="text-[8px] sm:text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-blue-500 shrink-0" /> Tanggal
                        </span>
                        <span className="font-extrabold text-[10px] sm:text-xs text-slate-800 dark:text-white truncate mt-0.5">
                          {new Date(activeTeach.evaluationDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="pl-2.5 flex flex-col justify-center min-w-0">
                        <span className="text-[8px] sm:text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                          <User className="w-2.5 h-2.5 text-blue-500 shrink-0" /> Observer
                        </span>
                        <span className="font-extrabold text-[10px] sm:text-xs text-slate-800 dark:text-white truncate mt-0.5">
                          {activeTeach.evaluatedBy?.name || 'Observer Pusat'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* STRENGTHS & IMPROVEMENT NOTES (RINGKAS) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className={`border rounded-3xl p-4 sm:p-5 ${card} border-emerald-500/20 bg-emerald-500/5`}>
                      <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <h3 className="font-black text-xs uppercase tracking-wider">
                          Kelebihan Mengajar
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {activeTeach.strengthsNotes || (
                          <span className="italic text-slate-400">Belum ada catatan kelebihan mengajar.</span>
                        )}
                      </p>
                    </div>

                    <div className={`border rounded-3xl p-4 sm:p-5 ${card} border-sky-500/20 bg-sky-500/5`}>
                      <div className="flex items-center gap-2 mb-2 text-sky-600 dark:text-sky-400">
                        <Lightbulb className="w-4 h-4 shrink-0" />
                        <h3 className="font-black text-xs uppercase tracking-wider">
                          Saran Pengembangan
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {activeTeach.improvementNotes || (
                          <span className="italic text-slate-400">Belum ada saran pengembangan mengajar.</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* INDICATOR CHECKLIST BREAKDOWN (ACCORDION DEFAULT TERTUTUP) */}
                  <div className={`border rounded-3xl p-4 sm:p-5 ${card} space-y-3.5`}>
                    <h3 className="font-black text-sm sm:text-base">Checklist Indikator Mengajar</h3>

                    <div className="space-y-2.5">
                      {data.teachingAspects.map((aspect) => {
                        const isOpen = !!openTeachAspectIds[aspect.id];
                        const fulfilledCount = aspect.indicators.filter(
                          (ind) => !!activeTeach.itemScores?.[ind.id]?.checked
                        ).length;

                        return (
                          <div key={aspect.id} className={`rounded-2xl border ${subCard} overflow-hidden`}>
                            <button
                              type="button"
                              onClick={() => toggleTeachAspect(aspect.id)}
                              className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                            >
                              <div className="min-w-0">
                                <h4 className={`font-black text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100 ${isOpen ? 'whitespace-normal leading-snug' : 'truncate'}`}>
                                  {aspect.title}
                                </h4>
                                <span className="text-[10px] font-semibold text-slate-400">
                                  {fulfilledCount} / {aspect.indicators.length} Indikator Terpenuhi
                                </span>
                              </div>
                              <div className="p-1 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 dark:text-slate-300 shrink-0">
                                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </button>

                            {isOpen && (
                              <div className="p-3.5 pt-2.5 space-y-2 border-t border-slate-200/60 dark:border-slate-700/60">
                                {aspect.indicators.map((ind) => {
                                  const item = activeTeach.itemScores?.[ind.id] || {};
                                  const checked = !!item.checked;
                                  const scoreVal = item.score !== undefined ? item.score : ind.score;

                                  return (
                                    <div
                                      key={ind.id}
                                      className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${
                                        checked
                                          ? 'bg-emerald-500/5 border-emerald-500/30'
                                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                                      }`}
                                    >
                                      <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                                        checked ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                      }`}>
                                        {checked ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                                      </div>

                                      <div className="flex-1 min-w-0 text-xs">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="font-bold text-slate-800 dark:text-slate-100 leading-snug">
                                            {ind.title}
                                          </span>
                                          <span className="font-black text-[10px] shrink-0 text-emerald-600 dark:text-emerald-400">
                                            {checked ? `+${scoreVal}` : '0'}
                                          </span>
                                        </div>
                                        {item.notes && (
                                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">
                                            {item.notes}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 3: OBSERVASI WILAYAH (LAPORAN AKHIR)                   */}
      {/* ============================================================== */}
      {activeSubTab === 'wilayah' && (
        <div className="space-y-4">
          {data.wilayahObservations.length === 0 ? (
            <div className={`border rounded-3xl p-10 sm:p-12 text-center flex flex-col items-center gap-2.5 ${card}`}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-base font-black">Belum Ada Laporan Akhir</h3>
            </div>
          ) : (
            <>
              {/* PERIOD SELECTOR (IF MULTIPLE) */}
              {data.wilayahObservations.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {data.wilayahObservations.map((obs) => (
                    <button
                      key={obs.id}
                      onClick={() => setSelectedObsId(obs.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        activeObs?.id === obs.id
                          ? 'bg-purple-600 text-white font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {obs.periodName} ({new Date(obs.observationDate).toLocaleDateString('id-ID')})
                    </button>
                  ))}
                </div>
              )}

              {activeObs && (
                <>
                  {/* OBS INFO HERO + 1-LINE METADATA */}
                  <div className={`border rounded-3xl p-4 sm:p-5 ${card}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Compass className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 block">
                          Observasi Wilayah
                        </span>
                        <h2 className="text-base sm:text-lg font-black truncate">
                          Wilayah {activeObs.wilayah?.name || 'Program'}
                        </h2>
                      </div>
                    </div>

                    <div className={`mt-3.5 pt-3.5 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'} grid grid-cols-3 divide-x ${darkMode ? 'divide-slate-800' : 'divide-slate-200/80'}`}>
                      <div className="pr-2 flex flex-col justify-center min-w-0">
                        <span className="text-[8px] sm:text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5 text-purple-500 shrink-0" /> Periode
                        </span>
                        <span className="font-extrabold text-[10px] sm:text-xs text-slate-800 dark:text-white truncate mt-0.5">
                          {activeObs.periodName}
                        </span>
                      </div>

                      <div className="px-2.5 flex flex-col justify-center min-w-0">
                        <span className="text-[8px] sm:text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-purple-500 shrink-0" /> Tanggal
                        </span>
                        <span className="font-extrabold text-[10px] sm:text-xs text-slate-800 dark:text-white truncate mt-0.5">
                          {new Date(activeObs.observationDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="pl-2.5 flex flex-col justify-center min-w-0">
                        <span className="text-[8px] sm:text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                          <User className="w-2.5 h-2.5 text-purple-500 shrink-0" /> Observer
                        </span>
                        <span className="font-extrabold text-[10px] sm:text-xs text-slate-800 dark:text-white truncate mt-0.5">
                          {activeObs.evaluatedBy?.name || 'Superadmin'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BAGIAN A: PERKEMBANGAN PROGRAM */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className={`border rounded-3xl p-4 sm:p-5 ${card} space-y-2`}>
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                        <FileText className="w-4 h-4 shrink-0" />
                        <h3 className="font-black text-xs uppercase tracking-wider">
                          Realisasi Program
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {activeObs.programRealization || (
                          <span className="italic text-slate-400">Belum ada catatan realisasi program.</span>
                        )}
                      </p>
                    </div>

                    <div className={`border rounded-3xl p-4 sm:p-5 ${card} space-y-2`}>
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <User className="w-4 h-4 shrink-0" />
                        <h3 className="font-black text-xs uppercase tracking-wider">
                          Performa Mentor
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {activeObs.mentorPerformanceSummary || (
                          <span className="italic text-slate-400">Belum ada kesimpulan performa mentor.</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* BAGIAN B: TEMUAN & REKOMENDASI */}
                  <div className={`border rounded-3xl p-4 sm:p-5 ${card} space-y-3.5`}>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-black text-sm sm:text-base">Temuan & Rekomendasi</h3>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                        {Array.isArray(activeObs.findings) ? activeObs.findings.length : 0} Temuan
                      </span>
                    </div>

                    {(!Array.isArray(activeObs.findings) || activeObs.findings.length === 0) ? (
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold text-center">
                        ✓ Tidak ada temuan kendala target program.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {activeObs.findings.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className={`p-3.5 rounded-2xl border ${subCard} space-y-2.5`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black text-[10px] uppercase">
                                Temuan #{idx + 1}
                              </span>

                              {item.dueDate && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black">
                                  <Clock className="w-3 h-3" />
                                  {item.dueDate}
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                              {item.finding}
                            </p>

                            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block">
                                Rekomendasi Solusi:
                              </span>
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {item.recommendation || <span className="italic text-slate-400">Belum ada arahan rekomendasi.</span>}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
