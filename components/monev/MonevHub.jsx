"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
  Award, SlidersHorizontal, BookOpen, Compass, Search, Filter,
  Building2, CheckCircle2, Clock, ChevronRight, UserCheck, Plus,
  TrendingUp, RefreshCw, Trash2, Edit3, Eye, FileText
} from 'lucide-react';
import MonevPerformanceInstrumentManager from './MonevPerformanceInstrumentManager';
import MentorPerformanceEvaluator from './MentorPerformanceEvaluator';
import { useDialog } from '../DialogProvider';
import { getPerformanceCategory } from '../../lib/monev';

export default function MonevHub({ darkMode }) {
  const { confirm, alert } = useDialog();

  const [activeSubTab, setActiveSubTab] = useState('performance'); // 'performance' | 'instrument_performance' | 'teaching' | 'observation'
  const [mentors, setMentors] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWilayah, setSelectedWilayah] = useState('ALL');

  // Evaluator View State
  const [evaluatingMentor, setEvaluatingMentor] = useState(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);

  // History Modal State
  const [historyMentor, setHistoryMentor] = useState(null);

  const loadMentors = async () => {
    setLoadingMentors(true);
    try {
      const res = await fetch('/api/admin/monev/mentors');
      if (!res.ok) throw new Error('Gagal memuat data mentor');
      const data = await res.json();
      setMentors(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMentors(false);
    }
  };

  useEffect(() => {
    loadMentors();
  }, []);

  // Wilayah list for filter dropdown
  const wilayahOptions = useMemo(() => {
    const map = new Map();
    for (const m of mentors) {
      if (m.wilayah?.id) {
        map.set(m.wilayah.id, m.wilayah.name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [mentors]);

  // Filtered mentors
  const filteredMentors = useMemo(() => {
    return mentors.filter((m) => {
      const matchSearch =
        !searchQuery.trim() ||
        (m.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.wilayah?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchWilayah = selectedWilayah === 'ALL' || m.wilayah?.id === selectedWilayah;

      return matchSearch && matchWilayah;
    });
  }, [mentors, searchQuery, selectedWilayah]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = mentors.length;
    let evaluated = 0;
    let scoreSum = 0;

    for (const m of mentors) {
      const evals = m.performanceEvaluations || [];
      if (evals.length > 0) {
        evaluated++;
        scoreSum += evals[0].totalScore || 0;
      }
    }

    const avgScore = evaluated > 0 ? (scoreSum / evaluated).toFixed(1) : '—';
    return {
      total,
      evaluated,
      unEvaluated: total - evaluated,
      avgScore,
    };
  }, [mentors]);

  // Handle Delete Evaluation
  const handleDeleteEvaluation = async (evaluationId) => {
    const ok = await confirm(
      'Apakah kamu yakin ingin menghapus arsip penilaian performa ini?',
      'Hapus Penilaian'
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/monev/performance-evaluations/${evaluationId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus penilaian');

      await loadMentors();
      if (historyMentor) {
        setHistoryMentor((prev) => ({
          ...prev,
          performanceEvaluations: (prev.performanceEvaluations || []).filter(
            (e) => e.id !== evaluationId
          ),
        }));
      }
      await alert('Arsip penilaian performa berhasil dihapus.', 'Berhasil', 'success');
    } catch (err) {
      await alert(err.message || 'Error saat menghapus', 'Error', 'error');
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputClass = darkMode
    ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-500'
    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500';

  // If currently evaluating a mentor, render evaluator view directly
  if (evaluatingMentor) {
    return (
      <MentorPerformanceEvaluator
        mentor={evaluatingMentor}
        initialEvaluation={selectedEvaluation}
        onBack={() => {
          setEvaluatingMentor(null);
          setSelectedEvaluation(null);
        }}
        onSaved={() => {
          loadMentors();
          setEvaluatingMentor(null);
          setSelectedEvaluation(null);
        }}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* MONEV SUB-NAVIGATION TABS */}
      <div className={`border rounded-3xl p-3 ${card} flex items-center justify-between flex-wrap gap-2`}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveSubTab('performance')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'performance'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            Penilaian Performa Mentor
          </button>

          <button
            onClick={() => setActiveSubTab('instrument_performance')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'instrument_performance'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Pengaturan Instrumen Performa
          </button>

          <button
            onClick={() => setActiveSubTab('teaching')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'teaching'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Kompetensi Mengajar
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold">
              Instrumen 2
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('observation')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'observation'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Compass className="w-4 h-4" />
            Observasi Wilayah
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold">
              Instrumen 3
            </span>
          </button>
        </div>

        <button
          onClick={loadMentors}
          disabled={loadingMentors}
          className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 cursor-pointer"
          title="Segarkan Data"
        >
          <RefreshCw className={`w-4 h-4 ${loadingMentors ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* SUB-TAB 1: PENILAIAN PERFORMA MENTOR */}
      {activeSubTab === 'performance' && (
        <div className="space-y-6">
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`border rounded-3xl p-5 ${card}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">Total Mentor</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{stats.total}</span>
                <span className="text-xs text-slate-400 font-semibold">Akun</span>
              </div>
            </div>

            <div className={`border rounded-3xl p-5 ${card}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">Sudah Dinilai</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-500">{stats.evaluated}</span>
                <span className="text-xs text-emerald-600/70 font-semibold">Mentor</span>
              </div>
            </div>

            <div className={`border rounded-3xl p-5 ${card}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">Belum Dinilai</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-500">{stats.unEvaluated}</span>
                <span className="text-xs text-amber-600/70 font-semibold">Mentor</span>
              </div>
            </div>

            <div className={`border rounded-3xl p-5 ${card}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">Rata-rata Skor</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-500 font-mono">{stats.avgScore}</span>
                <span className="text-xs text-blue-600/70 font-semibold">/ 100</span>
              </div>
            </div>
          </div>

          {/* SEARCH & WILAYAH FILTER BAR */}
          <div className={`border rounded-3xl p-4 ${card} flex flex-col sm:flex-row items-center justify-between gap-3`}>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari mentor, email, atau wilayah..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs border outline-none font-medium ${inputClass}`}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedWilayah}
                onChange={(e) => setSelectedWilayah(e.target.value)}
                className={`w-full sm:w-56 p-2.5 rounded-2xl text-xs font-bold border outline-none cursor-pointer ${inputClass}`}
              >
                <option value="ALL">Semua Wilayah ({mentors.length})</option>
                {wilayahOptions.map((w) => (
                  <option key={w.id} value={w.id} className="dark:bg-slate-900">
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MENTORS LIST */}
          {loadingMentors ? (
            <div className={`border rounded-3xl p-12 text-center ${card}`}>
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-semibold">Memuat data mentor & performa...</p>
            </div>
          ) : filteredMentors.length === 0 ? (
            <div className={`border rounded-3xl p-12 text-center space-y-2 ${card}`}>
              <Building2 className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
              <h4 className="font-black text-sm">Tidak Ada Mentor Ditemukan</h4>
              <p className="text-xs text-slate-400">
                Coba ubah kata kunci pencarian atau filter wilayah di atas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMentors.map((m) => {
                const evals = m.performanceEvaluations || [];
                const latestEval = evals[0] || null;
                const hasEvaluated = !!latestEval;
                const categoryObj = hasEvaluated ? getPerformanceCategory(latestEval.totalScore) : null;

                return (
                  <div
                    key={m.id}
                    className={`border rounded-3xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${card}`}
                  >
                    <div>
                      {/* Top Bar: Wilayah Badge & Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {m.wilayah?.name || 'Tanpa Wilayah'}
                        </span>

                        {hasEvaluated ? (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${categoryObj?.tone}`}
                          >
                            {categoryObj?.label} ({latestEval.totalScore})
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400">
                            Belum Dinilai
                          </span>
                        )}
                      </div>

                      {/* Mentor Profile Info */}
                      <div className="flex items-center gap-3.5 mb-4">
                        <img
                          src={
                            m.user?.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              m.user?.name || 'Mentor'
                            )}&background=random`
                          }
                          alt="Avatar"
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">
                            {m.user?.name || 'Mentor'}
                          </h4>
                          <p className="text-xs text-slate-400 truncate">{m.user?.email || '—'}</p>
                          {m.user?.phone && (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {m.user.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Latest Evaluation Summary Box */}
                      {hasEvaluated ? (
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5 mb-4">
                          <div className="flex items-center justify-between text-slate-400 font-semibold text-[11px]">
                            <span>Periode:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                              {latestEval.periodName} ({latestEval.evaluationYear})
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Sem 1 / Sem 2:</span>
                            <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                              {latestEval.scoreSemester1 ?? '—'} / {latestEval.scoreSemester2 ?? '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                            <span className="text-slate-400">Total Nilai 1 Thn:</span>
                            <span className="font-black text-amber-500 font-mono text-xs">
                              {latestEval.totalScore} / 100
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-600/80 dark:text-amber-400/80 mb-4 flex items-center gap-2">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>Belum ada lembar evaluasi performa yang tersimpan.</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setEvaluatingMentor(m);
                          setSelectedEvaluation(latestEval || null);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        {hasEvaluated ? 'Edit Penilaian' : 'Nilai Performa'}
                      </button>

                      {evals.length > 0 && (
                        <button
                          onClick={() => setHistoryMentor(m)}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                          title="Lihat Riwayat Penilaian"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: PENGATURAN INSTRUMEN PERFORMA */}
      {activeSubTab === 'instrument_performance' && (
        <MonevPerformanceInstrumentManager darkMode={darkMode} />
      )}

      {/* SUB-TAB 3: PLACEHOLDER INSTRUMEN 2 (KOMPETENSI MENGAJAR) */}
      {activeSubTab === 'teaching' && (
        <div className={`border rounded-3xl p-12 text-center space-y-4 ${card}`}>
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-500 border border-blue-500/20">
            Instrumen 2 Monev
          </span>
          <h3 className="text-lg font-black">Penilaian Kompetensi Mengajar Mentor</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Instrumen evaluasi kualitas pedagogik, penyampaian materi kurikulum kepemimpinan, dan interaksi pengajaran mentor bersama awardee. Fitur ini akan kita aktifkan pada langkah selanjutnya!
          </p>
        </div>
      )}

      {/* SUB-TAB 4: PLACEHOLDER INSTRUMEN 3 (OBSERVASI WILAYAH) */}
      {activeSubTab === 'observation' && (
        <div className={`border rounded-3xl p-12 text-center space-y-4 ${card}`}>
          <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto">
            <Compass className="w-8 h-8" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-purple-500/10 text-purple-500 border border-purple-500/20">
            Instrumen 3 Monev
          </span>
          <h3 className="text-lg font-black">Laporan Observasi Monev Wilayah</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Instrumen tinjauan langsung lapangan, sarana prasarana asrama/wilayah, kedisiplinan pembinaan, serta laporan kepatuhan program YES masing-masing wilayah. Fitur ini akan kita aktifkan pada langkah berikutnya!
          </p>
        </div>
      )}

      {/* MODAL RIWAYAT PENILAIAN MENTOR */}
      {historyMentor && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className={`w-full max-w-2xl border rounded-3xl p-6 shadow-2xl my-8 ${card}`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={
                    historyMentor.user?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      historyMentor.user?.name || 'Mentor'
                    )}&background=random`
                  }
                  alt="Avatar"
                  className="w-10 h-10 rounded-2xl object-cover"
                />
                <div>
                  <h3 className="font-black text-sm">Riwayat Penilaian Performa</h3>
                  <p className="text-xs text-slate-400">
                    {historyMentor.user?.name} · Wilayah {historyMentor.wilayah?.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setHistoryMentor(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {(historyMentor.performanceEvaluations || []).length === 0 ? (
                <p className="p-8 text-center text-xs text-slate-400 italic">
                  Belum ada riwayat penilaian tersimpan.
                </p>
              ) : (
                historyMentor.performanceEvaluations.map((ev) => {
                  const cat = getPerformanceCategory(ev.totalScore);
                  return (
                    <div
                      key={ev.id}
                      className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-xs">{ev.periodName} ({ev.evaluationYear})</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${cat.tone}`}>
                            {cat.label} ({ev.totalScore})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Sem 1: {ev.scoreSemester1 ?? '—'} · Sem 2: {ev.scoreSemester2 ?? '—'} · Dinilai oleh:{' '}
                          {ev.evaluatedBy?.name || 'Admin'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setEvaluatingMentor(historyMentor);
                            setSelectedEvaluation(ev);
                            setHistoryMentor(null);
                          }}
                          className="p-2 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors cursor-pointer"
                          title="Buka / Edit Penilaian"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvaluation(ev.id)}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          title="Hapus Penilaian"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setHistoryMentor(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
