"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
  Award, BookOpen, Compass, Calendar, User, CheckCircle2,
  AlertCircle, ChevronRight, Layers, Sparkles, TrendingUp,
  FileText, Clock, AlertTriangle, ThumbsUp, Lightbulb, Target
} from 'lucide-react';
import { getPerformanceCategory, getTeachingCategory, SCORE_RUBRICS } from '@/lib/monev';

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

  if (loading) {
    return (
      <div className={`border rounded-3xl p-16 flex flex-col items-center justify-center gap-4 ${card}`}>
        <div className="w-9 h-9 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold opacity-60">Memuat hasil evaluasi Monev...</p>
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
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Portal Hasil Monev Mentor
              </span>
              {data.mentor?.wilayah?.name && (
                <span className="text-xs text-slate-400">
                  · Wilayah {data.mentor.wilayah.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Evaluasi & Refleksi Pembimbingan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Hasil penilaian performa kerja, observasi kompetensi mengajar, dan catatan monitoring wilayah yang dirilis oleh observer pusat sebagai kompas pertumbuhan dan perbaikan berkelanjutan.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Mentor Terdaftar</span>
              <span className="font-black text-sm block truncate max-w-[180px]">
                {data.mentor?.user?.name || dbUser?.name || 'Mentor'}
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                Wilayah {data.mentor?.wilayah?.name || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveSubTab('performance')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'performance'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            Performa Kerja
            {data.performanceEvaluations.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/15">
                {data.performanceEvaluations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('teaching')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'teaching'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Kompetensi Mengajar
            {data.teachingEvaluations.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/15">
                {data.teachingEvaluations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('wilayah')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'wilayah'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            Observasi Wilayah
            {data.wilayahObservations.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/15">
                {data.wilayahObservations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: PERFORMA KERJA MENTOR                               */}
      {/* ============================================================== */}
      {activeSubTab === 'performance' && (
        <div className="space-y-6">
          {data.performanceEvaluations.length === 0 ? (
            <div className={`border rounded-3xl p-12 text-center flex flex-col items-center gap-3 ${card}`}>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black">Belum Ada Penilaian Performa</h3>
              <p className="text-xs opacity-60 max-w-md leading-relaxed">
                Observer pusat belum merilis dokumen evaluasi performa kerja mentor untuk akun ini. Hasil penilaian akan otomatis tampil di sini setelah diverifikasi.
              </p>
            </div>
          ) : (
            <>
              {/* PERIOD SELECTOR (IF MULTIPLE) */}
              {data.performanceEvaluations.length > 1 && (
                <div className={`border rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap ${card}`}>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Layers className="w-4 h-4 text-amber-500" />
                    Pilih Periode Penilaian:
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {data.performanceEvaluations.map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedPerfId(ev.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activePerf?.id === ev.id
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                      >
                        {ev.periodName} ({ev.evaluationYear})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SCORE HERO CARDS */}
              {activePerf && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* TOTAL SCORE */}
                    <div className={`border rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between ${card}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Total Nilai 1 Tahun
                        </span>
                        <Award className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="my-3">
                        <div className="text-4xl font-black tracking-tight text-amber-600 dark:text-amber-400">
                          {Number(activePerf.totalScore || 0).toFixed(1)}
                        </div>
                        <span className="text-[11px] text-slate-400">Skala 0 - 100</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                          getPerformanceCategory(activePerf.totalScore).badge
                        }`}>
                          Kategori: {activePerf.category || getPerformanceCategory(activePerf.totalScore).label}
                        </span>
                      </div>
                    </div>

                    {/* SEMESTER 1 */}
                    <div className={`border rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between ${card}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Skor Semester 1
                        </span>
                        <Calendar className="w-5 h-5 text-sky-500" />
                      </div>
                      <div className="my-3">
                        <div className="text-3xl font-black tracking-tight text-sky-600 dark:text-sky-400">
                          {activePerf.scoreSemester1 != null ? Number(activePerf.scoreSemester1).toFixed(1) : '—'}
                        </div>
                        <span className="text-[11px] text-slate-400">Poin Capaian Sem 1</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                        {activePerf.scoreSemester1 != null ? 'Telah dinilai' : 'Belum terlaksana'}
                      </div>
                    </div>

                    {/* SEMESTER 2 */}
                    <div className={`border rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between ${card}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Skor Semester 2
                        </span>
                        <Calendar className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="my-3">
                        <div className="text-3xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                          {activePerf.scoreSemester2 != null ? Number(activePerf.scoreSemester2).toFixed(1) : '—'}
                        </div>
                        <span className="text-[11px] text-slate-400">Poin Capaian Sem 2</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                        {activePerf.scoreSemester2 != null ? 'Telah dinilai' : 'Belum terlaksana'}
                      </div>
                    </div>

                    {/* EVALUATOR INFO */}
                    <div className={`border rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between ${card}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Info Observer
                        </span>
                        <User className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="my-3">
                        <div className="text-sm font-black truncate">
                          {activePerf.evaluatedBy?.name || 'Observer Pusat'}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Periode: {activePerf.periodName} ({activePerf.evaluationYear})
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                        Dicatat: {new Date(activePerf.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>

                  {/* HIGHLIGHT FEEDBACK (WELL DONE & IMPROVEMENTS) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* WELL DONE */}
                    <div className={`border rounded-3xl p-6 ${card} border-emerald-500/20 bg-emerald-500/5`}>
                      <div className="flex items-center gap-2.5 mb-3 text-emerald-600 dark:text-emerald-400">
                        <ThumbsUp className="w-5 h-5 shrink-0" />
                        <h3 className="font-black text-sm uppercase tracking-wider">
                          Hal yang Sudah Berjalan dengan Baik
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {activePerf.wellDoneNotes || (
                          <span className="italic text-slate-400">
                            Belum ada catatan apresiasi khusus yang dicantumkan observer.
                          </span>
                        )}
                      </p>
                    </div>

                    {/* IMPROVEMENTS */}
                    <div className={`border rounded-3xl p-6 ${card} border-amber-500/20 bg-amber-500/5`}>
                      <div className="flex items-center gap-2.5 mb-3 text-amber-600 dark:text-amber-400">
                        <Target className="w-5 h-5 shrink-0" />
                        <h3 className="font-black text-sm uppercase tracking-wider">
                          Area yang Perlu Dikembangkan (Growth)
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {activePerf.improvementNotes || (
                          <span className="italic text-slate-400">
                            Belum ada catatan rekomendasi perbaikan khusus yang dicantumkan observer.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* BREAKDOWN PER TARGET KERJA */}
                  <div className={`border rounded-3xl p-6 ${card} space-y-5`}>
                    <div>
                      <h3 className="font-black text-base">Rincian Capaian Target Kerja Mentor</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Daftar indikator rencana kerja beserta skor capaian (Skala 0 - 4) dan catatan evidence.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {data.plans.map((plan) => (
                        <div key={plan.id} className={`p-5 rounded-2xl border ${subCard} space-y-3`}>
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                            <h4 className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                              {plan.title}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400">
                              {plan.targets.length} Target
                            </span>
                          </div>

                          <div className="space-y-3">
                            {plan.targets.map((tgt) => {
                              const scoreEntry = activePerf.itemScores?.[tgt.id] || {};
                              const sem1 = scoreEntry.scoreSem1;
                              const sem2 = scoreEntry.scoreSem2;

                              return (
                                <div
                                  key={tgt.id}
                                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="font-bold text-slate-800 dark:text-slate-100 flex-1">
                                      {tgt.title}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                        Bobot: {tgt.weight}%
                                      </span>
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                        {tgt.semesterScope === 'KEDUANYA' ? 'Sem 1 & 2' : tgt.semesterScope === 'SEMESTER_1' ? 'Sem 1' : 'Sem 2'}
                                      </span>
                                    </div>
                                  </div>

                                  {tgt.targetSemester && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Target: {tgt.targetSemester}
                                    </p>
                                  )}

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                                      <span className="text-[10px] text-slate-400 font-bold uppercase">Skor Semester 1:</span>
                                      <span className="font-black text-xs text-sky-600 dark:text-sky-400">
                                        {sem1 != null ? `${sem1} / 4.0 (${SCORE_RUBRICS[sem1]?.range || ''})` : '—'}
                                      </span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                                      <span className="text-[10px] text-slate-400 font-bold uppercase">Skor Semester 2:</span>
                                      <span className="font-black text-xs text-indigo-600 dark:text-indigo-400">
                                        {sem2 != null ? `${sem2} / 4.0 (${SCORE_RUBRICS[sem2]?.range || ''})` : '—'}
                                      </span>
                                    </div>
                                  </div>

                                  {scoreEntry.evidence && (
                                    <div className="text-[11px] text-slate-600 dark:text-slate-300 pl-2.5 border-l-2 border-amber-500">
                                      <span className="font-bold text-slate-400 text-[10px] uppercase block">Catatan Evidence:</span>
                                      {scoreEntry.evidence}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
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
        <div className="space-y-6">
          {data.teachingEvaluations.length === 0 ? (
            <div className={`border rounded-3xl p-12 text-center flex flex-col items-center gap-3 ${card}`}>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black">Belum Ada Penilaian Mengajar</h3>
              <p className="text-xs opacity-60 max-w-md leading-relaxed">
                Observasi sesi mengajar atau microteaching belum dilaksanakan atau belum dirilis oleh observer untuk akun mentor ini.
              </p>
            </div>
          ) : (
            <>
              {/* SESSION SELECTOR (IF MULTIPLE) */}
              {data.teachingEvaluations.length > 1 && (
                <div className={`border rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap ${card}`}>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Layers className="w-4 h-4 text-blue-500" />
                    Pilih Sesi Observasi:
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {data.teachingEvaluations.map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedTeachId(ev.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activeTeach?.id === ev.id
                            ? 'bg-blue-500 text-white font-black'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                      >
                        {ev.periodName} ({new Date(ev.evaluationDate).toLocaleDateString('id-ID')})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SCORE HERO CARDS */}
              {activeTeach && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* PERCENTAGE & CATEGORY */}
                    <div className={`border rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between ${card}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Persentase Capaian
                        </span>
                        <BookOpen className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="my-3">
                        <div className="text-4xl font-black tracking-tight text-blue-600 dark:text-blue-400">
                          {Number(activeTeach.percentage || 0).toFixed(1)}%
                        </div>
                        <span className="text-[11px] text-slate-400">Ketercapaian Indikator</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                          getTeachingCategory(activeTeach.percentage).badge
                        }`}>
                          {activeTeach.category || getTeachingCategory(activeTeach.percentage).label}
                        </span>
                      </div>
                    </div>

                    {/* TOTAL SCORE */}
                    <div className={`border rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between ${card}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Total Skor Indikator
                        </span>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="my-3">
                        <div className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                          {activeTeach.totalScore} / {activeTeach.maxScore}
                        </div>
                        <span className="text-[11px] text-slate-400">Poin Indikator Terpenuhi</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                        Dari total skor maksimal
                      </div>
                    </div>

                    {/* SESSION TOPIC */}
                    <div className={`border rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between ${card}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Topik Sesi
                        </span>
                        <FileText className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="my-3">
                        <div className="text-sm font-black line-clamp-2">
                          {activeTeach.sessionTopic || 'Sesi Pembinaan Mengajar'}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-1">
                          {activeTeach.periodName}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                        Tgl: {new Date(activeTeach.evaluationDate).toLocaleDateString('id-ID')}
                      </div>
                    </div>

                    {/* OBSERVER */}
                    <div className={`border rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between ${card}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Observer
                        </span>
                        <User className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="my-3">
                        <div className="text-sm font-black truncate">
                          {activeTeach.evaluatedBy?.name || 'Observer Pusat'}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Superadmin Monev
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                        Dicatat: {new Date(activeTeach.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>

                  {/* STRENGTHS & IMPROVEMENT NOTES */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* STRENGTHS */}
                    <div className={`border rounded-3xl p-6 ${card} border-emerald-500/20 bg-emerald-500/5`}>
                      <div className="flex items-center gap-2.5 mb-3 text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="w-5 h-5 shrink-0" />
                        <h3 className="font-black text-sm uppercase tracking-wider">
                          Kelebihan Mengajar & Pedagogik
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {activeTeach.strengthsNotes || (
                          <span className="italic text-slate-400">
                            Belum ada catatan kelebihan khusus yang dicantumkan observer.
                          </span>
                        )}
                      </p>
                    </div>

                    {/* IMPROVEMENTS */}
                    <div className={`border rounded-3xl p-6 ${card} border-sky-500/20 bg-sky-500/5`}>
                      <div className="flex items-center gap-2.5 mb-3 text-sky-600 dark:text-sky-400">
                        <Lightbulb className="w-5 h-5 shrink-0" />
                        <h3 className="font-black text-sm uppercase tracking-wider">
                          Saran Pengembangan Mengajar
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {activeTeach.improvementNotes || (
                          <span className="italic text-slate-400">
                            Belum ada saran pengembangan pedagogik khusus yang dicantumkan observer.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* INDICATOR CHECKLIST BREAKDOWN */}
                  <div className={`border rounded-3xl p-6 ${card} space-y-5`}>
                    <div>
                      <h3 className="font-black text-base">Checklist Indikator Kompetensi Mengajar</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Indikator observasi yang dinilai langsung saat sesi mengajar mentor berlangsung.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {data.teachingAspects.map((aspect) => (
                        <div key={aspect.id} className={`p-5 rounded-2xl border ${subCard} space-y-3`}>
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                            <h4 className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                              {aspect.title}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400">
                              {aspect.indicators.length} Indikator
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {aspect.indicators.map((ind) => {
                              const item = activeTeach.itemScores?.[ind.id] || {};
                              const checked = !!item.checked;
                              const scoreVal = item.score !== undefined ? item.score : ind.score;

                              return (
                                <div
                                  key={ind.id}
                                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                                    checked
                                      ? 'bg-emerald-500/5 border-emerald-500/30'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                                  }`}
                                >
                                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                    checked ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                  }`}>
                                    {checked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                                  </div>

                                  <div className="flex-1 min-w-0 text-xs">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-bold text-slate-800 dark:text-slate-100">
                                        {ind.title}
                                      </span>
                                      <span className="font-black text-[11px] shrink-0 text-slate-500">
                                        {checked ? `+${scoreVal} Poin` : '0 Poin'}
                                      </span>
                                    </div>
                                    {item.notes && (
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">
                                        Catatan: {item.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 3: OBSERVASI WILAYAH (INSTRUMEN 3)                      */}
      {/* ============================================================== */}
      {activeSubTab === 'wilayah' && (
        <div className="space-y-6">
          {data.wilayahObservations.length === 0 ? (
            <div className={`border rounded-3xl p-12 text-center flex flex-col items-center gap-3 ${card}`}>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Compass className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black">Belum Ada Laporan Observasi Wilayah</h3>
              <p className="text-xs opacity-60 max-w-md leading-relaxed">
                Observer pusat belum merilis laporan observasi komprehensif untuk wilayah binaan ini. Hasil observasi akan otomatis terlihat setelah diterbitkan.
              </p>
            </div>
          ) : (
            <>
              {/* PERIOD SELECTOR (IF MULTIPLE) */}
              {data.wilayahObservations.length > 1 && (
                <div className={`border rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap ${card}`}>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Layers className="w-4 h-4 text-purple-500" />
                    Pilih Periode Observasi:
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {data.wilayahObservations.map((obs) => (
                      <button
                        key={obs.id}
                        onClick={() => setSelectedObsId(obs.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activeObs?.id === obs.id
                            ? 'bg-purple-600 text-white font-black'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                      >
                        {obs.periodName} ({new Date(obs.observationDate).toLocaleDateString('id-ID')})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeObs && (
                <>
                  {/* OBS INFO HERO */}
                  <div className={`border rounded-3xl p-6 ${card} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Compass className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            Laporan Observasi Wilayah
                          </span>
                          <span className="text-xs text-slate-400">· {activeObs.periodName}</span>
                        </div>
                        <h2 className="text-lg font-black mt-0.5">
                          Wilayah {activeObs.wilayah?.name || 'Program'}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-slate-400 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase font-bold block">Tanggal Observasi</span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {new Date(activeObs.observationDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold block">Observer</span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {activeObs.evaluatedBy?.name || 'Superadmin'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BAGIAN A: PERKEMBANGAN PROGRAM */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`border rounded-3xl p-6 ${card} space-y-2`}>
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                        <FileText className="w-4 h-4" />
                        <h3 className="font-black text-xs uppercase tracking-wider">
                          Realisasi Pelaksanaan Program
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {activeObs.programRealization || (
                          <span className="italic text-slate-400">Belum ada catatan realisasi program.</span>
                        )}
                      </p>
                    </div>

                    <div className={`border rounded-3xl p-6 ${card} space-y-2`}>
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <User className="w-4 h-4" />
                        <h3 className="font-black text-xs uppercase tracking-wider">
                          Performa Mentor Wilayah
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {activeObs.mentorPerformanceSummary || (
                          <span className="italic text-slate-400">Belum ada kesimpulan performa mentor.</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* BAGIAN B: TEMUAN & REKOMENDASI (DUE DATE) */}
                  <div className={`border rounded-3xl p-6 ${card} space-y-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-black text-base">Temuan & Rekomendasi Solusi Wilayah</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Tindak lanjut perbaikan target program beserta batas waktu (due date) penyelesaian.
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {Array.isArray(activeObs.findings) ? activeObs.findings.length : 0} Butir Temuan
                      </span>
                    </div>

                    {(!Array.isArray(activeObs.findings) || activeObs.findings.length === 0) ? (
                      <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold text-center">
                        ✓ Tidak ada temuan kendala target program. Seluruh indikator wilayah berjalan sesuai rencana!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeObs.findings.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className={`p-4 rounded-2xl border ${subCard} space-y-3`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black text-xs flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                                  Temuan Ketidakcapaian
                                </span>
                              </div>

                              {item.dueDate && (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black">
                                  <Clock className="w-3.5 h-3.5" />
                                  Due Date: {item.dueDate}
                                </div>
                              )}
                            </div>

                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 pl-8">
                              {item.finding}
                            </p>

                            <div className="ml-8 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block">
                                Rekomendasi Solusi & Arahan:
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
