"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
  ChevronLeft, BookOpen, CheckCircle2, AlertCircle, Save, Info,
  Sparkles, FileText, Calendar, Building2, User, Check, X, Loader2
} from 'lucide-react';
import { useDialog } from '../DialogProvider';
import { getTeachingCategory } from '../../lib/monev';

export default function MentorTeachingEvaluator({
  mentor,
  initialEvaluation = null,
  onBack,
  onSaved,
  darkMode,
}) {
  const { alert, confirm } = useDialog();

  const [aspects, setAspects] = useState([]);
  const [loadingAspects, setLoadingAspects] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [evaluationId, setEvaluationId] = useState(initialEvaluation?.id || null);
  const [periodName, setPeriodName] = useState(
    initialEvaluation?.periodName || 'Semester 1 - Oktober 2026'
  );
  const [evaluationDate, setEvaluationDate] = useState(
    initialEvaluation?.evaluationDate
      ? new Date(initialEvaluation.evaluationDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [sessionTopic, setSessionTopic] = useState(initialEvaluation?.sessionTopic || '');
  
  // itemScores structure: { [indicatorId]: { checked: boolean, notes: string, score: number } }
  const [itemScores, setItemScores] = useState(initialEvaluation?.itemScores || {});
  
  const [strengthsNotes, setStrengthsNotes] = useState(initialEvaluation?.strengthsNotes || '');
  const [improvementNotes, setImprovementNotes] = useState(initialEvaluation?.improvementNotes || '');
  const [observers, setObservers] = useState([]);
  const [evaluatedById, setEvaluatedById] = useState(initialEvaluation?.evaluatedById || '');

  // Load master aspects, indicators & observers
  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoadingAspects(true);
      try {
        const [aspectsRes, obsRes] = await Promise.all([
          fetch('/api/admin/monev/teaching-plans'),
          fetch('/api/admin/monev/observers'),
        ]);
        if (aspectsRes.ok) {
          const data = await aspectsRes.json();
          if (isMounted) setAspects(data || []);
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
        if (isMounted) setLoadingAspects(false);
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [initialEvaluation]);

  // Compute live scores
  const scoreMetrics = useMemo(() => {
    let totalScore = 0;
    let maxScore = 0;
    let totalChecked = 0;
    let totalIndicators = 0;

    for (const aspect of aspects) {
      for (const ind of aspect.indicators || []) {
        totalIndicators++;
        const s = Number(ind.score) || 4.0;
        maxScore += s;
        if (itemScores[ind.id]?.checked) {
          totalScore += s;
          totalChecked++;
        }
      }
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const roundedScore = Math.round(totalScore * 10) / 10;
    const roundedMax = Math.round(maxScore * 10) / 10;
    const roundedPct = Math.round(percentage * 10) / 10;
    const categoryObj = getTeachingCategory(roundedPct);

    return {
      totalScore: roundedScore,
      maxScore: roundedMax,
      percentage: roundedPct,
      category: categoryObj.label,
      tone: categoryObj.tone,
      badge: categoryObj.badge,
      totalChecked,
      totalIndicators,
    };
  }, [aspects, itemScores]);

  // Toggle Checkbox Indicator
  const handleToggleIndicator = (indicatorId, defaultScore) => {
    setItemScores((prev) => {
      const cur = prev[indicatorId] || {};
      const newChecked = !cur.checked;
      return {
        ...prev,
        [indicatorId]: {
          ...cur,
          checked: newChecked,
          score: newChecked ? defaultScore : 0,
        },
      };
    });
  };

  // Update note per indicator
  const handleNoteChange = (indicatorId, notes) => {
    setItemScores((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        notes,
      },
    }));
  };

  // Save Evaluation
  const handleSave = async () => {
    if (!periodName.trim()) {
      await alert('Nama Periode Penilaian wajib diisi.', 'Perhatian', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        mentorId: mentor.id,
        periodName: periodName.trim(),
        evaluationDate,
        sessionTopic: sessionTopic.trim() || null,
        totalScore: scoreMetrics.totalScore,
        maxScore: scoreMetrics.maxScore,
        percentage: scoreMetrics.percentage,
        category: scoreMetrics.category,
        strengthsNotes: strengthsNotes.trim() || null,
        improvementNotes: improvementNotes.trim() || null,
        itemScores,
        evaluatedById: evaluatedById || undefined,
      };

      const url = evaluationId
        ? `/api/admin/monev/teaching-evaluations/${evaluationId}`
        : '/api/admin/monev/teaching-evaluations';
      const method = evaluationId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan evaluasi');

      await alert(
        `Penilaian kompetensi mengajar untuk mentor ${mentor.user?.name || ''} berhasil disimpan dengan predikat ${scoreMetrics.category} (${scoreMetrics.percentage}%).`,
        'Berhasil',
        'success'
      );

      if (onSaved) onSaved();
    } catch (err) {
      await alert(err.message || 'Terjadi kesalahan saat menyimpan.', 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputClass = darkMode
    ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500'
    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500';

  return (
    <div className="space-y-6 pb-32">
      {/* TOP BAR / BACK NAVIGATION */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar Mentor
        </button>

        <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Instrumen 2 — Kompetensi Mengajar
        </span>
      </div>

      {/* MENTOR PROFILE BANNER */}
      <div className={`border rounded-3xl p-6 ${card} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
        <div className="flex items-center gap-4">
          <img
            src={
              mentor.user?.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                mentor.user?.name || 'Mentor'
              )}&background=random`
            }
            alt=""
            className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
          />
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
              Lembar Observasi Mengajar Mentor
            </span>
            <h2 className="text-xl font-black">{mentor.user?.name || 'Mentor'}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {mentor.wilayah?.name || 'Wilayah —'}
              </span>
              <span>·</span>
              <span>{mentor.user?.email || '—'}</span>
            </div>
          </div>
        </div>

        {/* Live Score Highlight Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
              Skor Terakumulasi
            </span>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                {scoreMetrics.totalScore}
              </span>
              <span className="text-xs text-slate-400 font-bold">/ {scoreMetrics.maxScore}</span>
            </div>
          </div>
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
              Predikat Capaian
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black inline-block border ${scoreMetrics.tone}`}>
              {scoreMetrics.category} ({scoreMetrics.percentage}%)
            </span>
          </div>
        </div>
      </div>

      {/* OBSERVATION METADATA FORM */}
      <div className={`border rounded-3xl p-6 ${card} space-y-4`}>
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
          Informasi Sesi & Observasi
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Periode / Siklus Penilaian
            </label>
            <input
              type="text"
              required
              value={periodName}
              onChange={(e) => setPeriodName(e.target.value)}
              placeholder="Contoh: Semester 1 - Oktober 2026"
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold border outline-none ${inputClass}`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Tanggal Pelaksanaan Observasi
            </label>
            <input
              type="date"
              required
              value={evaluationDate}
              onChange={(e) => setEvaluationDate(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold border outline-none cursor-pointer ${inputClass}`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Topik Sesi Mengajar (Opsional)
            </label>
            <input
              type="text"
              value={sessionTopic}
              onChange={(e) => setSessionTopic(e.target.value)}
              placeholder="Contoh: Pembinaan Klasikal"
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-medium border outline-none ${inputClass}`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Penilai / Observer (Superadmin)
            </label>
            <select
              value={evaluatedById}
              onChange={(e) => setEvaluatedById(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold border outline-none cursor-pointer ${inputClass}`}
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

      {/* TEACHING RUBRICS TABLE (GROUPED BY ASPECT) */}
      {loadingAspects ? (
        <div className={`border rounded-3xl p-16 flex flex-col items-center justify-center gap-3 ${card}`}>
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs font-bold text-slate-400">Memuat butir indikator kompetensi mengajar...</p>
        </div>
      ) : aspects.length === 0 ? (
        <div className={`border rounded-3xl p-12 text-center space-y-3 ${card}`}>
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-sm font-black">Instrumen Belum Diatur</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Belum ada master aspek dan butir indikator yang tersimpan. Harap buka tab "Pengaturan Instrumen Kompetensi" untuk mengunggah file template Excel terlebih dahulu.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {aspects.map((aspect, aIdx) => (
            <div key={aspect.id} className={`border rounded-3xl overflow-hidden ${card}`}>
              {/* Aspect Header */}
              <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {aIdx + 1}
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Aspek
                    </span>
                    <h4 className="font-black text-sm">{aspect.title}</h4>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-slate-400">
                  {aspect.indicators?.length || 0} Butir
                </span>
              </div>

              {/* Table of Indicators */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4">Indikator Pengamatan</th>
                      <th className="py-3 px-4 w-36 text-center">Status Pencapaian</th>
                      <th className="py-3 px-4 w-28 text-center">Skor Poin</th>
                      <th className="py-3 px-4 w-72">Catatan Observer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {aspect.indicators && aspect.indicators.map((ind, iIdx) => {
                      const isChecked = !!itemScores[ind.id]?.checked;
                      const scoreVal = Number(ind.score) || 4.0;
                      const noteVal = itemScores[ind.id]?.notes || '';

                      return (
                        <tr
                          key={ind.id}
                          className={`transition-colors ${
                            isChecked
                              ? 'bg-blue-500/5 dark:bg-blue-500/10'
                              : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                          }`}
                        >
                          {/* 1. Nomor */}
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                            {iIdx + 1}
                          </td>

                          {/* 2. Indikator */}
                          <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                            {ind.title}
                          </td>

                          {/* 3. Checkbox Interaktif */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleIndicator(ind.id, scoreVal)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer ${
                                isChecked
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs scale-102'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                                  isChecked
                                    ? 'border-white bg-white/20 text-white'
                                    : 'border-slate-300 dark:border-slate-600'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span>{isChecked ? 'Tercapai' : 'Belum'}</span>
                            </button>
                          </td>

                          {/* 4. Skor Dinamis (Muncul ketika di-check) */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isChecked ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono animate-fade-in shadow-xs">
                                <Sparkles className="w-3 h-3" /> +{scoreVal.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 font-mono font-bold text-xs">
                                —
                              </span>
                            )}
                          </td>

                          {/* 5. Catatan Observer per butir */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={noteVal}
                              onChange={(e) => handleNoteChange(ind.id, e.target.value)}
                              placeholder="Catatan observasi butir ini..."
                              className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-medium transition-colors ${inputClass}`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GENERAL OBSERVER FEEDBACK NOTES */}
      <div className={`border rounded-3xl p-6 ${card} space-y-4`}>
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <FileText className="w-4 h-4" />
          </span>
          <h3 className="text-base font-black">Catatan Evaluator & Observer</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Kelebihan / Hal yang Berjalan Baik (Strengths)
            </label>
            <textarea
              rows={4}
              value={strengthsNotes}
              onChange={(e) => setStrengthsNotes(e.target.value)}
              placeholder="Uraikan hal-hal positif, penguasaan materi, atau antusiasme interaksi yang berhasil dibangun mentor..."
              className={`w-full p-3 rounded-xl text-xs border outline-none leading-relaxed font-medium ${inputClass}`}
            />
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Area yang Perlu Dikembangkan (Improvements)
            </label>
            <textarea
              rows={4}
              value={improvementNotes}
              onChange={(e) => setImprovementNotes(e.target.value)}
              placeholder="Uraikan rekomendasi atau aspek pedagogik/pengelolaan kelas yang perlu ditingkatkan pada sesi mendatang..."
              className={`w-full p-3 rounded-xl text-xs border outline-none leading-relaxed font-medium ${inputClass}`}
            />
          </div>
        </div>
      </div>

      {/* FIXED BOTTOM ACTION BAR */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-md p-4 transition-all shadow-xl ${
        darkMode ? 'bg-slate-950/90 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-800'
      }`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Summary status in bottom bar */}
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={onBack}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              Batal
            </button>

            <div className="flex items-center gap-3">
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px]">Tercapai:</span>
                <span className="font-black text-slate-700 dark:text-slate-200">
                  {scoreMetrics.totalChecked} / {scoreMetrics.totalIndicators} Indikator
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px]">Total Skor:</span>
                <span className="font-black font-mono text-blue-600 dark:text-blue-400 text-sm">
                  {scoreMetrics.totalScore} / {scoreMetrics.maxScore}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <span className={`px-3 py-1 rounded-xl text-xs font-black border ${scoreMetrics.tone}`}>
                {scoreMetrics.category} ({scoreMetrics.percentage}%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Simpan Penilaian Kompetensi
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
