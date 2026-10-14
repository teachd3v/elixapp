"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
  ChevronLeft, Award, CheckCircle2, AlertCircle, Save, Info,
  TrendingUp, Sparkles, FileText, Calendar, Building2, User
} from 'lucide-react';
import { useDialog } from '../DialogProvider';
import { SCORE_RUBRICS, calculatePerformanceScores, getPerformanceCategory } from '../../lib/monev';

export default function MentorPerformanceEvaluator({
  mentor,
  initialEvaluation = null,
  onBack,
  onSaved,
  darkMode,
}) {
  const { alert, confirm } = useDialog();

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [evaluationId, setEvaluationId] = useState(initialEvaluation?.id || null);
  const [periodName, setPeriodName] = useState(initialEvaluation?.periodName || 'Oktober - November');
  const [evaluationYear, setEvaluationYear] = useState(
    initialEvaluation?.evaluationYear || new Date().getFullYear()
  );
  const [itemScores, setItemScores] = useState(initialEvaluation?.itemScores || {});
  const [wellDoneNotes, setWellDoneNotes] = useState(initialEvaluation?.wellDoneNotes || '');
  const [improvementNotes, setImprovementNotes] = useState(initialEvaluation?.improvementNotes || '');
  const [showRubricInfo, setShowRubricInfo] = useState(true);
  const [observers, setObservers] = useState([]);
  const [evaluatedById, setEvaluatedById] = useState(initialEvaluation?.evaluatedById || '');

  // Load master plans, targets & observers
  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoadingPlans(true);
      try {
        const [plansRes, obsRes] = await Promise.all([
          fetch('/api/admin/monev/performance-plans'),
          fetch('/api/admin/monev/observers'),
        ]);
        if (plansRes.ok) {
          const data = await plansRes.json();
          if (isMounted) setPlans(data || []);
        }
        if (obsRes.ok) {
          const obsData = await obsRes.json();
          if (isMounted) {
            setObservers(obsData.observers || []);
            if (!initialEvaluation?.evaluatedById && obsData.currentObserverId) {
              setEvaluatedById(obsData.currentObserverId);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoadingPlans(false);
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [initialEvaluation]);

  // Flatten all targets across plans for score calculations
  const allTargets = useMemo(() => {
    const list = [];
    for (const p of plans) {
      if (p.targets) {
        for (const t of p.targets) {
          list.push(t);
        }
      }
    }
    return list;
  }, [plans]);

  // Live calculation based on current state
  const liveScores = useMemo(() => {
    return calculatePerformanceScores(allTargets, itemScores);
  }, [allTargets, itemScores]);

  const categoryInfo = useMemo(() => {
    return getPerformanceCategory(liveScores.totalScore);
  }, [liveScores.totalScore]);

  // Update score helper for Sem 1
  const handleScoreSem1Change = (targetId, scoreVal) => {
    setItemScores((prev) => {
      const current = prev[targetId] || {};
      const nextScore = current.scoreSem1 === scoreVal ? null : scoreVal;
      return {
        ...prev,
        [targetId]: {
          ...current,
          scoreSem1: nextScore,
        },
      };
    });
  };

  // Update score helper for Sem 2
  const handleScoreSem2Change = (targetId, scoreVal) => {
    setItemScores((prev) => {
      const current = prev[targetId] || {};
      const nextScore = current.scoreSem2 === scoreVal ? null : scoreVal;
      return {
        ...prev,
        [targetId]: {
          ...current,
          scoreSem2: nextScore,
        },
      };
    });
  };

  // Update evidence text helper
  const handleEvidenceChange = (targetId, text) => {
    setItemScores((prev) => {
      const current = prev[targetId] || {};
      return {
        ...prev,
        [targetId]: {
          ...current,
          evidence: text,
        },
      };
    });
  };

  // Submit Evaluation
  const handleSave = async (e) => {
    e.preventDefault();

    if (!periodName.trim()) {
      await alert('Silakan isi Periode Penilaian (misal: Oktober - November).', 'Perhatian', 'error');
      return;
    }

    if (allTargets.length === 0) {
      await alert('Belum ada instrumen target kerja untuk dinilai.', 'Perhatian', 'error');
      return;
    }

    const ok = await confirm(
      `Simpan lembar penilaian performa untuk mentor ${mentor.user?.name} (Total Nilai: ${liveScores.totalScore} - ${liveScores.category})?`,
      'Konfirmasi Simpan Penilaian'
    );
    if (!ok) return;

    setSaving(true);
    try {
      const payload = {
        id: evaluationId,
        mentorId: mentor.id,
        periodName: periodName.trim(),
        evaluationYear: parseInt(evaluationYear, 10) || new Date().getFullYear(),
        itemScores,
        wellDoneNotes: wellDoneNotes.trim(),
        improvementNotes: improvementNotes.trim(),
        evaluatedById: evaluatedById || undefined,
      };

      const res = await fetch('/api/admin/monev/performance-evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal menyimpan penilaian');
      }

      const savedData = await res.json();
      setEvaluationId(savedData.id);

      await alert(
        `Penilaian performa untuk ${mentor.user?.name} berhasil disimpan dengan predikat ${savedData.category} (${savedData.totalScore}).`,
        'Berhasil Disimpan',
        'success'
      );

      if (onSaved) onSaved(savedData);
    } catch (err) {
      await alert(err.message || 'Terjadi kesalahan saat menyimpan.', 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputClass = darkMode
    ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-500'
    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500';

  let runningNumber = 0;

  return (
    <div className="space-y-6">
      {/* Header bar with Back button and Mentor identity */}
      <div className={`border rounded-3xl p-6 ${card}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Kembali ke Daftar Mentor"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              <img
                src={
                  mentor.user?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    mentor.user?.name || 'Mentor'
                  )}&background=random`
                }
                alt="Avatar"
                className="w-13 h-13 rounded-2xl object-cover border-2 border-amber-500/30"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    {mentor.user?.name || 'Mentor'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Mentor
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold">
                    <Building2 className="w-3.5 h-3.5" /> Wilayah: {mentor.wilayah?.name || '—'}
                  </span>
                  <span>·</span>
                  <span className="truncate">{mentor.user?.email || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRubricInfo(!showRubricInfo)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer text-slate-500 dark:text-slate-400"
            >
              <Info className="w-4 h-4 text-amber-500" />
              {showRubricInfo ? 'Sembunyikan Rubrik' : 'Panduan Rubrik'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loadingPlans}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Penilaian'}
            </button>
          </div>
        </div>

        {/* Input Periode, Tahun Penilaian & Penilai Observer */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-400 block mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              Periode Penilaian (Rentang Bulan) <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={periodName}
                onChange={(e) => setPeriodName(e.target.value)}
                placeholder="Contoh: Oktober - November"
                className={`w-full p-2.5 rounded-xl text-xs font-semibold border outline-none ${inputClass}`}
                required
              />
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setPeriodName('Januari - Juni (Semester 1)')}
                  className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  Sem 1
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodName('Juli - Desember (Semester 2)')}
                  className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  Sem 2
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodName('Oktober - November')}
                  className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  Okt-Nov
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">
              Tahun Evaluasi
            </label>
            <input
              type="number"
              value={evaluationYear}
              onChange={(e) => setEvaluationYear(e.target.value)}
              className={`w-full p-2.5 rounded-xl text-xs font-black font-mono border outline-none ${inputClass}`}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-500" />
              Penilai / Observer (Superadmin) <span className="text-rose-500">*</span>
            </label>
            <select
              value={evaluatedById}
              onChange={(e) => setEvaluatedById(e.target.value)}
              className={`w-full p-2.5 rounded-xl text-xs font-semibold border outline-none cursor-pointer ${inputClass}`}
            >
              {observers.length === 0 && <option value="">Memuat observer...</option>}
              {observers.map((obs) => (
                <option key={obs.id} value={obs.id}>
                  {obs.name} ({obs.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Rubric Reference Bar */}
      {showRubricInfo && (
        <div className="bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/20 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Rubrik Skala Skoring Penilaian (0 - 4)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
            {Object.entries(SCORE_RUBRICS).map(([score, item]) => (
              <div
                key={score}
                className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/80 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-amber-600 dark:text-amber-400 text-xs">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                    {item.range}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REAL-TIME SCORE DISPLAY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Semester 1 Card */}
        <div className={`border rounded-3xl p-5 shadow-sm ${card}`}>
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1.5">
            <span>Poin Semester 1</span>
            <span className="text-[10px] font-mono">Skala 100</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-500 font-mono">
              {liveScores.scoreSemester1 !== null ? liveScores.scoreSemester1 : '—'}
            </span>
            <span className="text-xs text-slate-400 font-bold">/ 100</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, liveScores.scoreSemester1 || 0)}%` }}
            />
          </div>
        </div>

        {/* Semester 2 Card */}
        <div className={`border rounded-3xl p-5 shadow-sm ${card}`}>
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1.5">
            <span>Poin Semester 2</span>
            <span className="text-[10px] font-mono">Skala 100</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-500 font-mono">
              {liveScores.scoreSemester2 !== null ? liveScores.scoreSemester2 : '—'}
            </span>
            <span className="text-xs text-slate-400 font-bold">/ 100</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, liveScores.scoreSemester2 || 0)}%` }}
            />
          </div>
        </div>

        {/* Total Nilai 1 Tahun */}
        <div className={`border rounded-3xl p-5 shadow-sm ${card}`}>
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1.5">
            <span>Total Nilai 1 Tahun</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-500 font-mono">
              {liveScores.totalScore}
            </span>
            <span className="text-xs text-slate-400 font-bold">/ 100</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, liveScores.totalScore || 0)}%` }}
            />
          </div>
        </div>

        {/* Predikat Definitif Card */}
        <div className={`border rounded-3xl p-5 shadow-sm ${card} flex flex-col justify-between`}>
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1.5">
            <span>Kategori Predikat</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div
              className={`inline-block px-3 py-1.5 rounded-xl font-black text-sm tracking-wide border ${categoryInfo.tone}`}
            >
              {categoryInfo.label}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              &ge;85 Sangat Baik | &ge;70 Baik | &ge;60 Cukup | &lt;60 Kurang
            </p>
          </div>
        </div>
      </div>

      {/* INSTRUMEN TABEL PENILAIAN */}
      {loadingPlans ? (
        <div className={`border rounded-3xl p-12 text-center ${card}`}>
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-semibold">Memuat format instrumen penilaian...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className={`border rounded-3xl p-12 text-center space-y-3 ${card}`}>
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-black">Instrumen Belum Diatur</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Silakan atur atau muat template standar pada tab &quot;Pengaturan Instrumen Performa&quot; terlebih dahulu sebelum melakukan penilaian.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map((p, pIdx) => {
            return (
              <div key={p.id} className={`border rounded-3xl overflow-hidden shadow-sm ${card}`}>
                {/* Plan Header */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 font-black text-xs flex items-center justify-center">
                      {pIdx + 1}
                    </span>
                    <h3 className="font-black text-sm text-slate-800 dark:text-white">
                      {p.title}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">
                    {p.targets?.length || 0} Target Kerja
                  </span>
                </div>

                {/* Table of Targets */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/20 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="py-3 px-4 w-12 text-center">No</th>
                        <th className="py-3 px-4 min-w-[200px]">Target Kerja</th>
                        <th className="py-3 px-4 w-24 text-center">Bobot</th>
                        <th className="py-3 px-4 w-28 text-center">Semester</th>
                        <th className="py-3 px-4 min-w-[210px]">Target Capaian (0.00 - 4.00)</th>
                        <th className="py-3 px-4 min-w-[260px] text-center">Input Skor (0 - 4)</th>
                        <th className="py-3 px-4 min-w-[220px]">Catatan Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {p.targets.map((t) => {
                        runningNumber++;
                        const currentEntry = itemScores[t.id] || {};
                        const scope = t.semesterScope || 'KEDUANYA';
                        const showSem1 = scope === 'SEMESTER_1' || scope === 'KEDUANYA';
                        const showSem2 = scope === 'SEMESTER_2' || scope === 'KEDUANYA';

                        const expSem1 = t.targetScoreSem1 != null ? Number(t.targetScoreSem1).toFixed(2) : '4.00';
                        const expSem2 = t.targetScoreSem2 != null ? Number(t.targetScoreSem2).toFixed(2) : '4.00';

                        return (
                          <tr
                            key={t.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-[11px] align-top">
                              {runningNumber}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-200 align-top">
                              {t.title}
                            </td>
                            <td className="py-3.5 px-4 text-center align-top">
                              <span className="inline-block px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-xs font-mono">
                                {t.weight}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center align-top">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                  scope === 'KEDUANYA'
                                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                    : scope === 'SEMESTER_1'
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {scope === 'KEDUANYA'
                                  ? 'Sem 1 & 2'
                                  : scope === 'SEMESTER_1'
                                  ? 'Semester 1'
                                  : 'Semester 2'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 leading-relaxed text-[11px] align-top">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {showSem1 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold font-mono text-[10px]">
                                      Sem 1: {expSem1}
                                    </span>
                                  )}
                                  {showSem2 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold font-mono text-[10px]">
                                      Sem 2: {expSem2}
                                    </span>
                                  )}
                                </div>
                                {t.targetSemester && (
                                  <p className="text-[10px] text-slate-400 leading-snug">
                                    {t.targetSemester}
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* SKOR SELECTOR CELL */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="space-y-2">
                                {showSem1 && (
                                  <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-1 text-[10px] font-black text-blue-500 uppercase shrink-0">
                                      <span>Sem 1</span>
                                      <span className="text-[9px] font-mono text-slate-400 font-bold">(Tgt: {expSem1}):</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {[0, 1, 2, 3, 4].map((sVal) => {
                                        const isSelected = currentEntry.scoreSem1 === sVal;
                                        return (
                                          <button
                                            key={sVal}
                                            type="button"
                                            onClick={() => handleScoreSem1Change(t.id, sVal)}
                                            title={`Skor ${sVal} (${SCORE_RUBRICS[sVal].range})`}
                                            className={`w-6 h-6 rounded-lg text-[11px] font-black font-mono transition-all cursor-pointer ${
                                              isSelected
                                                ? sVal === 4
                                                  ? 'bg-emerald-500 text-white shadow-sm'
                                                  : sVal === 3
                                                  ? 'bg-sky-500 text-white shadow-sm'
                                                  : sVal === 2
                                                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                                                  : 'bg-rose-500 text-white shadow-sm'
                                                : 'bg-white dark:bg-slate-700/60 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                                            }`}
                                          >
                                            {sVal}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {showSem2 && (
                                  <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-1 text-[10px] font-black text-purple-500 uppercase shrink-0">
                                      <span>Sem 2</span>
                                      <span className="text-[9px] font-mono text-slate-400 font-bold">(Tgt: {expSem2}):</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {[0, 1, 2, 3, 4].map((sVal) => {
                                        const isSelected = currentEntry.scoreSem2 === sVal;
                                        return (
                                          <button
                                            key={sVal}
                                            type="button"
                                            onClick={() => handleScoreSem2Change(t.id, sVal)}
                                            title={`Skor ${sVal} (${SCORE_RUBRICS[sVal].range})`}
                                            className={`w-6 h-6 rounded-lg text-[11px] font-black font-mono transition-all cursor-pointer ${
                                              isSelected
                                                ? sVal === 4
                                                  ? 'bg-emerald-500 text-white shadow-sm'
                                                  : sVal === 3
                                                  ? 'bg-sky-500 text-white shadow-sm'
                                                  : sVal === 2
                                                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                                                  : 'bg-rose-500 text-white shadow-sm'
                                                : 'bg-white dark:bg-slate-700/60 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                                            }`}
                                          >
                                            {sVal}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* CATATAN EVIDENCE */}
                            <td className="py-3.5 px-4 align-top">
                              <textarea
                                rows={2}
                                value={currentEntry.evidence || ''}
                                onChange={(e) => handleEvidenceChange(t.id, e.target.value)}
                                placeholder="Catatan bukti / eviden..."
                                className={`w-full p-2 rounded-xl text-xs border outline-none leading-relaxed resize-none ${inputClass}`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CATATAN OBSERVER (ITEM 5) */}
      <div className={`border rounded-3xl p-6 ${card}`}>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-black">Catatan Observer</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
              1. Hal yang sudah berjalan / tercapai dengan baik
            </label>
            <textarea
              rows={4}
              value={wellDoneNotes}
              onChange={(e) => setWellDoneNotes(e.target.value)}
              placeholder="Tuliskan apresiasi, pencapaian luar biasa, atau aspek positif mentor yang telah terlaksana dengan optimal..."
              className={`w-full p-3.5 rounded-2xl text-xs border outline-none leading-relaxed ${inputClass}`}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
              2. Hal yang perlu dikembangkan
            </label>
            <textarea
              rows={4}
              value={improvementNotes}
              onChange={(e) => setImprovementNotes(e.target.value)}
              placeholder="Tuliskan rekomendasi, area perbaikan, atau tindak lanjut pengembangan kompetensi & performa mentor..."
              className={`w-full p-3.5 rounded-2xl text-xs border outline-none leading-relaxed ${inputClass}`}
            />
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              Predikat Terkini: <strong>{liveScores.category}</strong> (Skor: {liveScores.totalScore})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loadingPlans}
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Penilaian Performa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
