"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, MessageSquare, Save, Calendar, Building2,
  GraduationCap, UserCheck, HelpCircle, CheckCircle2,
  Clock, Sparkles, BookOpen, Heart, Compass, ShieldCheck,
  Award, FileText, ChevronRight
} from 'lucide-react';
import { useDialog } from '../DialogProvider';

// Aspect icon mapping helper
const ASPECT_ICONS = {
  'academic readiness': GraduationCap,
  'islamic character': Heart,
  'quranic development': BookOpen,
  'self mastery': ShieldCheck,
  'social impact leadership': Compass,
  'mentor': UserCheck,
};

export default function AwardeeInterviewEvaluator({
  awardee,
  initialRecord = null,
  onBack,
  onSaved,
  darkMode,
}) {
  const { alert, confirm } = useDialog();

  const [aspects, setAspects] = useState([]);
  const [loadingAspects, setLoadingAspects] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [periodName, setPeriodName] = useState(
    initialRecord?.periodName || `Semester 1 - ${new Date().getFullYear()}`
  );
  const [interviewDate, setInterviewDate] = useState(() => {
    if (initialRecord?.interviewDate) {
      return new Date(initialRecord.interviewDate).toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });

  // Answers map: { [questionId]: { answer: string, notes: string } }
  const [answersMap, setAnswersMap] = useState(() => {
    const map = {};
    if (initialRecord?.answers && Array.isArray(initialRecord.answers)) {
      initialRecord.answers.forEach((ans) => {
        if (ans.questionId) {
          map[ans.questionId] = {
            answer: ans.answer || '',
            notes: ans.notes || '',
          };
        }
      });
    }
    return map;
  });

  const [generalSummary, setGeneralSummary] = useState(
    initialRecord?.generalSummary || ''
  );
  const [actionPlan, setActionPlan] = useState(
    initialRecord?.actionPlan || ''
  );

  // Active aspect tab for easy navigation
  const [activeAspectId, setActiveAspectId] = useState('ALL');

  useEffect(() => {
    async function fetchQuestions() {
      setLoadingAspects(true);
      try {
        const res = await fetch('/api/admin/monev/interview-questions');
        if (!res.ok) throw new Error('Gagal memuat pertanyaan wawancara');
        const data = await res.json();
        setAspects(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAspects(false);
      }
    }
    fetchQuestions();
  }, []);

  // Update answer for a specific question
  const handleUpdateAnswer = (questionId, field, value) => {
    setAnswersMap((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || { answer: '', notes: '' }),
        [field]: value,
      },
    }));
  };

  // Completion calculation
  const completionStats = useMemo(() => {
    let totalQuestions = 0;
    let filledAnswers = 0;

    for (const a of aspects) {
      for (const q of a.questions || []) {
        totalQuestions++;
        const entry = answersMap[q.id];
        if (entry && entry.answer && entry.answer.trim().length > 0) {
          filledAnswers++;
        }
      }
    }

    const pct = totalQuestions > 0 ? Math.round((filledAnswers / totalQuestions) * 100) : 0;
    return { totalQuestions, filledAnswers, pct };
  }, [aspects, answersMap]);

  // Save handler
  const handleSave = async () => {
    if (!periodName.trim()) {
      await alert('Nama Periode Wawancara wajib diisi.', 'Validasi', 'error');
      return;
    }

    // Format answers array
    const formattedAnswers = [];
    for (const a of aspects) {
      for (const q of a.questions || []) {
        const entry = answersMap[q.id] || { answer: '', notes: '' };
        formattedAnswers.push({
          questionId: q.id,
          aspectId: a.id,
          aspectName: a.name,
          question: q.question,
          answer: entry.answer ? entry.answer.trim() : '',
          notes: entry.notes ? entry.notes.trim() : '',
        });
      }
    }

    setSaving(true);
    try {
      const payload = {
        awardeeId: awardee.id,
        periodName: periodName.trim(),
        interviewDate,
        answers: formattedAnswers,
        generalSummary: generalSummary.trim() || null,
        actionPlan: actionPlan.trim() || null,
      };

      const url = initialRecord?.id
        ? `/api/admin/monev/interview-records/${initialRecord.id}`
        : '/api/admin/monev/interview-records';

      const method = initialRecord?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan hasil wawancara.');

      await alert(
        initialRecord?.id
          ? 'Hasil wawancara awardee berhasil diperbarui!'
          : 'Hasil wawancara indepth awardee berhasil disimpan!',
        'Berhasil Disimpan',
        'success'
      );

      if (onSaved) onSaved(data);
    } catch (err) {
      await alert(err.message || 'Terjadi kesalahan sistem saat menyimpan.', 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const subCard = darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80';
  const inputClass = darkMode
    ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
    : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500';

  const displayedAspects = useMemo(() => {
    if (activeAspectId === 'ALL') return aspects;
    return aspects.filter((a) => a.id === activeAspectId);
  }, [aspects, activeAspectId]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* TOP BAR */}
      <div className={`border rounded-3xl p-4 sm:p-5 ${card} flex items-center justify-between flex-wrap gap-4 shadow-sm`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title="Kembali ke Daftar Awardee"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                Instrumen 4 Monev
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">· Indepth Interview Awardee</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black mt-0.5">
              {initialRecord ? 'Edit Lembar Wawancara' : 'Lembar Wawancara Indepth Awardee'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            disabled={saving}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Menyimpan...' : 'Simpan Wawancara'}
          </button>
        </div>
      </div>

      {/* AWARDEE PROFILE CARD */}
      <div className={`border rounded-3xl p-5 sm:p-6 ${card} space-y-4 shadow-sm`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <img
              src={
                awardee.user?.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  awardee.user?.name || 'Awardee'
                )}&background=random`
              }
              alt="Avatar"
              className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/30"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {awardee.user?.name || 'Nama Awardee'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Wilayah {awardee.wilayah?.name || '—'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>{awardee.university || 'Universitas'}</span>
                {awardee.major && <span>· Jurusan {awardee.major}</span>}
                {awardee.generation && <span>· Angkatan {awardee.generation}</span>}
              </p>
            </div>
          </div>

          {/* Progress Pill */}
          <div className={`p-3 rounded-2xl border ${subCard} flex items-center gap-3 shrink-0`}>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
              {completionStats.pct}%
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block">Progres Jawaban</span>
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                {completionStats.filledAnswers} dari {completionStats.totalQuestions} Terisi
              </span>
            </div>
          </div>
        </div>

        {/* METADATA FORM: PERIODE & TANGGAL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Periode Wawancara <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={periodName}
              onChange={(e) => setPeriodName(e.target.value)}
              placeholder="Contoh: Semester 1 - 2026"
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition-all ${inputClass}`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Tanggal Pelaksanaan <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition-all ${inputClass}`}
            />
          </div>
        </div>
      </div>

      {/* ASPECT FILTER PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveAspectId('ALL')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
            activeAspectId === 'ALL'
              ? 'bg-emerald-600 text-white shadow-sm'
              : `${card} text-slate-500 hover:text-slate-800 dark:hover:text-white`
          }`}
        >
          Semua Aspek ({aspects.length})
        </button>

        {aspects.map((a, idx) => {
          const Icon = ASPECT_ICONS[a.name.toLowerCase()] || MessageSquare;
          const isSelected = activeAspectId === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setActiveAspectId(a.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : `${card} text-slate-500 hover:text-slate-800 dark:hover:text-white`
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{a.name}</span>
            </button>
          );
        })}
      </div>

      {/* QUESTIONS SECTION */}
      {loadingAspects ? (
        <div className={`p-12 text-center border rounded-3xl ${card}`}>
          <Clock className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Memuat butir pertanyaan wawancara...</p>
        </div>
      ) : aspects.length === 0 ? (
        <div className={`p-12 text-center border rounded-3xl ${card} space-y-2`}>
          <HelpCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
            Pertanyaan Wawancara Belum Diatur
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Silakan buka tab "Pengaturan Instrumen Wawancara" untuk memuat template pertanyaan standar terlebih dahulu.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedAspects.map((aspect, aIdx) => {
            const Icon = ASPECT_ICONS[aspect.name.toLowerCase()] || MessageSquare;
            const qList = aspect.questions || [];

            return (
              <div
                key={aspect.id}
                className={`border rounded-3xl p-5 sm:p-6 ${card} space-y-5 shadow-sm`}
              >
                {/* Aspect Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                      Aspek {aspect.name}
                    </h2>
                    {aspect.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{aspect.description}</p>
                    )}
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-5">
                  {qList.map((q, qIdx) => {
                    const ans = answersMap[q.id] || { answer: '', notes: '' };

                    return (
                      <div
                        key={q.id}
                        className={`p-4 sm:p-5 rounded-2xl border ${subCard} space-y-3 transition-all`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">
                              #{qIdx + 1}
                            </span>
                            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-relaxed">
                              {q.question}
                            </h3>
                          </div>
                          {q.guideNotes && (
                            <p className="text-[11px] text-slate-400 italic pl-8">
                              💡 Panduan Penggalian: {q.guideNotes}
                            </p>
                          )}
                        </div>

                        {/* Jawaban / Temuan Awardee */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            Hasil Wawancara / Jawaban Awardee <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            rows={3}
                            value={ans.answer}
                            onChange={(e) => handleUpdateAnswer(q.id, 'answer', e.target.value)}
                            placeholder="Tuliskan rangkuman jawaban, fakta, atau kutipan awardee terkait butir ini..."
                            className={`w-full p-3 rounded-xl border text-xs font-medium leading-relaxed outline-none transition-all resize-y ${inputClass}`}
                          />
                        </div>

                        {/* Catatan Khusus Pewawancara */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            Catatan Khusus / Observasi Pewawancara (Opsional)
                          </label>
                          <input
                            type="text"
                            value={ans.notes}
                            onChange={(e) => handleUpdateAnswer(q.id, 'notes', e.target.value)}
                            placeholder="Catatan tambahan, gestur, atau hal yang perlu dicrosscheck..."
                            className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none transition-all ${inputClass}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* KESIMPULAN UMUM & RENCANA AKSI */}
          <div className={`border rounded-3xl p-5 sm:p-6 ${card} space-y-5 shadow-sm`}>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Kesimpulan & Rencana Aksi
                </h2>
                <p className="text-xs text-slate-400">
                  Rangkuman menyeluruh potret perkembangan awardee dan rekomendasi tindak lanjut
                </p>
              </div>
            </div>

            {/* Kesimpulan Umum */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Kesimpulan Umum Hasil Wawancara
              </label>
              <textarea
                rows={4}
                value={generalSummary}
                onChange={(e) => setGeneralSummary(e.target.value)}
                placeholder="Tuliskan kesimpulan umum mengenai kondisi akademik, karakter, kedisiplinan, dan dinamika bimbingan awardee..."
                className={`w-full p-4 rounded-2xl border text-xs font-medium leading-relaxed outline-none transition-all resize-y ${inputClass}`}
              />
            </div>

            {/* Rencana Aksi */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Rencana Aksi & Rekomendasi Pengembangan Diri
              </label>
              <textarea
                rows={4}
                value={actionPlan}
                onChange={(e) => setActionPlan(e.target.value)}
                placeholder="Tuliskan langkah konkret yang disepakati untuk perbaikan / peningkatan kapasitas awardee ke depan..."
                className={`w-full p-4 rounded-2xl border text-xs font-medium leading-relaxed outline-none transition-all resize-y ${inputClass}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM ACTION BAR */}
      <div className={`border rounded-3xl p-4 sm:p-5 ${card} flex items-center justify-between flex-wrap gap-4 shadow-sm`}>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-4 h-4" />
          <span>Pastikan seluruh rangkuman jawaban 6 aspek telah tercatat sebelum menyimpan.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            disabled={saving}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Kembali
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Menyimpan...' : 'Simpan Lembar Wawancara'}
          </button>
        </div>
      </div>
    </div>
  );
}
