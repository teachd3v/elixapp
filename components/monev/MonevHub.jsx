"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
  Award, SlidersHorizontal, BookOpen, Compass, Search, Filter,
  Building2, CheckCircle2, Clock, ChevronRight, UserCheck, Plus,
  TrendingUp, RefreshCw, Trash2, Edit3, Eye, FileText, MessageSquare,
  GraduationCap, ClipboardList, AlertTriangle, Users
} from 'lucide-react';
import MonevPerformanceInstrumentManager from './MonevPerformanceInstrumentManager';
import MentorPerformanceEvaluator from './MentorPerformanceEvaluator';
import MonevTeachingInstrumentManager from './MonevTeachingInstrumentManager';
import MentorTeachingEvaluator from './MentorTeachingEvaluator';
import WilayahObservationEvaluator from './WilayahObservationEvaluator';
import WilayahObservationDetailModal from './WilayahObservationDetailModal';
import MonevObservationInstrumentManager from './MonevObservationInstrumentManager';
import MonevInterviewInstrumentManager from './MonevInterviewInstrumentManager';
import AwardeeInterviewEvaluator from './AwardeeInterviewEvaluator';
import AwardeeInterviewDetailModal from './AwardeeInterviewDetailModal';
import { useDialog } from '../DialogProvider';
import { getPerformanceCategory, getTeachingCategory } from '../../lib/monev';

export default function MonevHub({ darkMode }) {
  const { confirm, alert } = useDialog();

  const [activeSubTab, setActiveSubTab] = useState('performance'); // 'performance' | 'instrument_performance' | 'teaching' | 'instrument_teaching' | 'observation' | 'instrument_observation' | 'interview' | 'instrument_interview'
  const [mentors, setMentors] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(true);

  // Search & Filter (Mentor Performance & Teaching)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWilayah, setSelectedWilayah] = useState('ALL');

  // Evaluator View State (Performa)
  const [evaluatingMentor, setEvaluatingMentor] = useState(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [historyMentor, setHistoryMentor] = useState(null);

  // Evaluator View State (Kompetensi Mengajar)
  const [evaluatingTeachingMentor, setEvaluatingTeachingMentor] = useState(null);
  const [selectedTeachingEvaluation, setSelectedTeachingEvaluation] = useState(null);
  const [historyTeachingMentor, setHistoryTeachingMentor] = useState(null);

  // Evaluator View State (Instrumen 3: Observasi Wilayah)
  const [observations, setObservations] = useState([]);
  const [loadingObservations, setLoadingObservations] = useState(false);
  const [wilayahList, setWilayahList] = useState([]);
  const [creatingObservation, setCreatingObservation] = useState(false);
  const [editingObservation, setEditingObservation] = useState(null);
  const [selectedWilayahForObservation, setSelectedWilayahForObservation] = useState(null);
  const [detailObservation, setDetailObservation] = useState(null);
  const [observationSearchQuery, setObservationSearchQuery] = useState('');
  const [observationStatusFilter, setObservationStatusFilter] = useState('ALL');

  // Evaluator View State (Instrumen 4: Indepth Interview Awardee)
  const [awardees, setAwardees] = useState([]);
  const [loadingAwardees, setLoadingAwardees] = useState(false);
  const [evaluatingAwardee, setEvaluatingAwardee] = useState(null);
  const [selectedInterviewRecord, setSelectedInterviewRecord] = useState(null);
  const [detailInterviewRecord, setDetailInterviewRecord] = useState(null);
  const [historyAwardee, setHistoryAwardee] = useState(null);
  const [awardeeSearchQuery, setAwardeeSearchQuery] = useState('');
  const [awardeeWilayahFilter, setAwardeeWilayahFilter] = useState('ALL');
  const [awardeeInterviewStatusFilter, setAwardeeInterviewStatusFilter] = useState('ALL');

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

  const loadWilayahList = async () => {
    try {
      const res = await fetch('/api/wilayah');
      if (res.ok) {
        const data = await res.json();
        setWilayahList(data || []);
      }
    } catch (err) {
      console.error('Gagal memuat daftar wilayah:', err);
    }
  };

  const loadObservations = async () => {
    setLoadingObservations(true);
    try {
      const res = await fetch('/api/admin/monev/wilayah-observations');
      if (res.ok) {
        const data = await res.json();
        setObservations(data || []);
      }
    } catch (err) {
      console.error('Gagal memuat laporan observasi:', err);
    } finally {
      setLoadingObservations(false);
    }
  };

  const loadAwardees = async () => {
    setLoadingAwardees(true);
    try {
      const res = await fetch('/api/admin/monev/awardees');
      if (res.ok) {
        const data = await res.json();
        setAwardees(data || []);
      }
    } catch (err) {
      console.error('Gagal memuat awardee untuk monev:', err);
    } finally {
      setLoadingAwardees(false);
    }
  };

  useEffect(() => {
    loadMentors();
    loadWilayahList();
    loadObservations();
    loadAwardees();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'observation') {
      loadObservations();
      if (wilayahList.length === 0) {
        loadWilayahList();
      }
    } else if (activeSubTab === 'interview') {
      loadAwardees();
      if (wilayahList.length === 0) {
        loadWilayahList();
      }
    }
  }, [activeSubTab]);

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

  // Handle Delete Teaching Evaluation
  const handleDeleteTeachingEvaluation = async (evaluationId) => {
    const ok = await confirm(
      'Apakah kamu yakin ingin menghapus arsip evaluasi kompetensi mengajar ini?',
      'Hapus Evaluasi'
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/monev/teaching-evaluations/${evaluationId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus evaluasi');

      await loadMentors();
      if (historyTeachingMentor) {
        setHistoryTeachingMentor((prev) => ({
          ...prev,
          teachingEvaluations: (prev.teachingEvaluations || []).filter(
            (e) => e.id !== evaluationId
          ),
        }));
      }
      await alert('Arsip evaluasi kompetensi mengajar berhasil dihapus.', 'Berhasil', 'success');
    } catch (err) {
      await alert(err.message || 'Error saat menghapus', 'Error', 'error');
    }
  };

  // Delete Wilayah Observation Handler
  const handleDeleteObservation = async (id) => {
    const ok = await confirm(
      'Apakah kamu yakin ingin menghapus arsip laporan observasi wilayah ini?',
      'Hapus Laporan Observasi'
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/monev/wilayah-observations/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus laporan observasi');

      setObservations((prev) => prev.filter((o) => o.id !== id));
      if (detailObservation?.id === id) {
        setDetailObservation(null);
      }
      await alert('Laporan observasi wilayah berhasil dihapus.', 'Berhasil', 'success');
    } catch (err) {
      await alert(err.message || 'Error saat menghapus', 'Error', 'error');
    }
  };

  // Teaching Stats calculation
  const teachingStats = useMemo(() => {
    const total = mentors.length;
    let evaluated = 0;
    let pctSum = 0;

    for (const m of mentors) {
      const evals = m.teachingEvaluations || [];
      if (evals.length > 0) {
        evaluated++;
        pctSum += Number(evals[0].percentage) || 0;
      }
    }

    const avgPct = evaluated > 0 ? (pctSum / evaluated).toFixed(1) : '—';
    return {
      total,
      evaluated,
      unEvaluated: total - evaluated,
      avgPct,
    };
  }, [mentors]);

  // Observation Stats calculation
  const observationStats = useMemo(() => {
    const totalWilayah = wilayahList.length || 0;
    const evaluatedWilayahIds = new Set(observations.map((o) => o.wilayahId));
    const totalEvaluatedWilayah = evaluatedWilayahIds.size;
    const unEvaluatedWilayah = Math.max(0, totalWilayah - totalEvaluatedWilayah);
    const totalObservations = observations.length;
    let totalFindings = 0;
    for (const o of observations) {
      if (Array.isArray(o.findings)) {
        totalFindings += o.findings.length;
      }
    }
    return {
      totalWilayah,
      totalEvaluatedWilayah,
      unEvaluatedWilayah,
      totalObservations,
      totalFindings,
    };
  }, [wilayahList, observations]);

  // Wilayah cards with observation status
  const wilayahObservationCards = useMemo(() => {
    return wilayahList.map((w) => {
      const wObsList = observations
        .filter((o) => o.wilayahId === w.id)
        .sort((a, b) => new Date(b.observationDate || b.createdAt) - new Date(a.observationDate || a.createdAt));
      const latestObs = wObsList[0] || null;
      const hasObservation = !!latestObs;
      const totalFindings = wObsList.reduce((acc, curr) => {
        const fList = Array.isArray(curr.findings) ? curr.findings : [];
        return acc + fList.length;
      }, 0);

      return {
        ...w,
        observations: wObsList,
        latestObs,
        hasObservation,
        totalFindings,
      };
    });
  }, [wilayahList, observations]);

  const filteredWilayahCards = useMemo(() => {
    return wilayahObservationCards.filter((w) => {
      const matchSearch =
        !observationSearchQuery.trim() ||
        w.name.toLowerCase().includes(observationSearchQuery.toLowerCase()) ||
        (w.mentorNames && w.mentorNames.some((n) => n.toLowerCase().includes(observationSearchQuery.toLowerCase())));

      const matchStatus =
        observationStatusFilter === 'ALL' ||
        (observationStatusFilter === 'OBSERVED' && w.hasObservation) ||
        (observationStatusFilter === 'UNOBSERVED' && !w.hasObservation);

      return matchSearch && matchStatus;
    });
  }, [wilayahObservationCards, observationSearchQuery, observationStatusFilter]);

  // Delete Interview Record Handler
  const handleDeleteInterviewRecord = async (recordId) => {
    const ok = await confirm(
      'Apakah kamu yakin ingin menghapus catatan wawancara indepth awardee ini?',
      'Hapus Wawancara'
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/monev/interview-records/${recordId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus catatan wawancara');

      await loadAwardees();
      if (historyAwardee) {
        setHistoryAwardee((prev) => ({
          ...prev,
          interviewRecords: (prev.interviewRecords || []).filter((r) => r.id !== recordId),
        }));
      }
      if (detailInterviewRecord?.id === recordId) {
        setDetailInterviewRecord(null);
      }
      await alert('Catatan wawancara berhasil dihapus.', 'Berhasil', 'success');
    } catch (err) {
      await alert(err.message || 'Error saat menghapus', 'Error', 'error');
    }
  };

  // Interview Stats calculation
  const interviewStats = useMemo(() => {
    const total = awardees.length;
    let interviewed = 0;
    let totalInterviewsCount = 0;

    for (const a of awardees) {
      const count = (a.interviewRecords || []).length;
      if (count > 0) {
        interviewed++;
        totalInterviewsCount += count;
      }
    }

    return {
      total,
      interviewed,
      unInterviewed: total - interviewed,
      totalInterviewsCount,
    };
  }, [awardees]);

  // Filtered awardees for interview tab
  const filteredAwardees = useMemo(() => {
    return awardees.filter((a) => {
      const matchWilayah =
        awardeeWilayahFilter === 'ALL' || a.wilayahId === awardeeWilayahFilter;
      if (!matchWilayah) return false;

      const hasInterviews = (a.interviewRecords || []).length > 0;
      if (awardeeInterviewStatusFilter === 'INTERVIEWED' && !hasInterviews) return false;
      if (awardeeInterviewStatusFilter === 'NOT_INTERVIEWED' && hasInterviews) return false;

      if (!awardeeSearchQuery.trim()) return true;
      const q = awardeeSearchQuery.toLowerCase();
      const name = a.user?.name?.toLowerCase() || '';
      const email = a.user?.email?.toLowerCase() || '';
      const univ = a.university?.toLowerCase() || '';
      const major = a.major?.toLowerCase() || '';
      const wName = a.wilayah?.name?.toLowerCase() || '';

      return name.includes(q) || email.includes(q) || univ.includes(q) || major.includes(q) || wName.includes(q);
    });
  }, [awardees, awardeeWilayahFilter, awardeeInterviewStatusFilter, awardeeSearchQuery]);

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputClass = darkMode
    ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-500'
    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500';

  // If currently evaluating performance
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

  // If currently evaluating teaching competency
  if (evaluatingTeachingMentor) {
    return (
      <MentorTeachingEvaluator
        mentor={evaluatingTeachingMentor}
        initialEvaluation={selectedTeachingEvaluation}
        onBack={() => {
          setEvaluatingTeachingMentor(null);
          setSelectedTeachingEvaluation(null);
        }}
        onSaved={() => {
          loadMentors();
          setEvaluatingTeachingMentor(null);
          setSelectedTeachingEvaluation(null);
        }}
        darkMode={darkMode}
      />
    );
  }

  // If currently creating/editing wilayah observation
  if (creatingObservation || editingObservation) {
    return (
      <WilayahObservationEvaluator
        wilayahList={wilayahList}
        initialObservation={editingObservation}
        initialWilayahId={selectedWilayahForObservation?.id || editingObservation?.wilayahId}
        onBack={() => {
          setCreatingObservation(false);
          setEditingObservation(null);
          setSelectedWilayahForObservation(null);
        }}
        onSaved={() => {
          setCreatingObservation(false);
          setEditingObservation(null);
          setSelectedWilayahForObservation(null);
          loadObservations();
        }}
        darkMode={darkMode}
      />
    );
  }

  // If currently conducting interview with an awardee
  if (evaluatingAwardee) {
    return (
      <AwardeeInterviewEvaluator
        awardee={evaluatingAwardee}
        initialRecord={selectedInterviewRecord}
        onBack={() => {
          setEvaluatingAwardee(null);
          setSelectedInterviewRecord(null);
        }}
        onSaved={() => {
          loadAwardees();
          setEvaluatingAwardee(null);
          setSelectedInterviewRecord(null);
        }}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* MONEV SUB-NAVIGATION TABS */}
      {/* MONEV SUB-NAVIGATION TABS (CLEAN 1-ROW SEGMENTED) */}
      <div className={`border rounded-2xl p-2 ${card} flex items-center justify-between gap-3 overflow-x-auto no-scrollbar`}>
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Mode Switcher: Input Penilaian vs Pengaturan Instrumen */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 shrink-0">
            <button
              onClick={() => {
                if (activeSubTab.startsWith('instrument_')) {
                  setActiveSubTab('performance');
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                !activeSubTab.startsWith('instrument_')
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
              <span>Input Penilaian</span>
            </button>

            <button
              onClick={() => {
                if (!activeSubTab.startsWith('instrument_')) {
                  setActiveSubTab('instrument_performance');
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab.startsWith('instrument_')
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
              <span>Pengaturan Instrumen</span>
            </button>
          </div>

          {/* Subtle Vertical Divider */}
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

          {/* Sub-Instrument Pills */}
          <div className="flex items-center gap-1 shrink-0">
            {!activeSubTab.startsWith('instrument_') ? (
              <>
                <button
                  onClick={() => setActiveSubTab('performance')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'performance'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-sm shadow-amber-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  1. Performa Mentor
                </button>

                <button
                  onClick={() => setActiveSubTab('teaching')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'teaching'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-sm shadow-amber-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  2. Kompetensi Mengajar
                </button>

                <button
                  onClick={() => setActiveSubTab('observation')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'observation'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-sm shadow-amber-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  3. Observasi Wilayah
                </button>

                <button
                  onClick={() => setActiveSubTab('interview')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'interview'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-sm shadow-amber-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  4. Wawancara Awardee
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveSubTab('instrument_performance')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'instrument_performance'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-sm shadow-amber-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Instrumen 1 (Performa)
                </button>

                <button
                  onClick={() => setActiveSubTab('instrument_teaching')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'instrument_teaching'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-sm shadow-amber-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Instrumen 2 (Mengajar)
                </button>

                <button
                  onClick={() => setActiveSubTab('instrument_observation')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'instrument_observation'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-sm shadow-amber-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Instrumen 3 (Observasi)
                </button>

                <button
                  onClick={() => setActiveSubTab('instrument_interview')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === 'instrument_interview'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-sm shadow-amber-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Instrumen 4 (Wawancara)
                </button>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            loadMentors();
            loadObservations();
            loadWilayahList();
            loadAwardees();
          }}
          disabled={loadingMentors || loadingObservations || loadingAwardees}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 cursor-pointer shrink-0 ml-auto"
          title="Segarkan Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${(loadingMentors || loadingObservations || loadingAwardees) ? 'animate-spin' : ''}`} />
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

      {/* SUB-TAB 3: PENILAIAN KOMPETENSI MENGAJAR MENTOR */}
      {activeSubTab === 'teaching' && (
        <div className="space-y-6">
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`border rounded-3xl p-5 ${card}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">Total Mentor</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{teachingStats.total}</span>
                <span className="text-xs text-slate-400 font-semibold">Akun</span>
              </div>
            </div>

            <div className={`border rounded-3xl p-5 ${card}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">Sudah Diobservasi</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-500">{teachingStats.evaluated}</span>
                <span className="text-xs text-emerald-600/70 font-semibold">Mentor</span>
              </div>
            </div>

            <div className={`border rounded-3xl p-5 ${card}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">Belum Diobservasi</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-500">{teachingStats.unEvaluated}</span>
                <span className="text-xs text-amber-600/70 font-semibold">Mentor</span>
              </div>
            </div>

            <div className={`border rounded-3xl p-5 ${card}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">Rata-rata Skor Capaian</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-500 font-mono">{teachingStats.avgPct}</span>
                <span className="text-xs text-blue-600/70 font-semibold">%</span>
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
                <option value="ALL">Semua Wilayah ({wilayahOptions.length})</option>
                {wilayahOptions.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MENTOR CARDS GRID */}
          {filteredMentors.length === 0 ? (
            <div className={`border rounded-3xl p-12 text-center text-slate-400 ${card}`}>
              Tidak ada data mentor yang cocok dengan pencarian atau filter wilayah saat ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMentors.map((m) => {
                const evals = m.teachingEvaluations || [];
                const hasEvaluated = evals.length > 0;
                const latestEval = hasEvaluated ? evals[0] : null;
                const cat = latestEval ? getTeachingCategory(latestEval.percentage) : null;

                return (
                  <div
                    key={m.id}
                    className={`border rounded-3xl p-5 ${card} hover:border-blue-500/50 transition-all flex flex-col justify-between`}
                  >
                    <div>
                      {/* Top Bar: Wilayah Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {m.wilayah?.name || 'Wilayah Belum Diset'}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                            hasEvaluated
                              ? `${cat.tone}`
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {hasEvaluated ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              {cat.label} ({latestEval.percentage}%)
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Belum Diobservasi
                            </>
                          )}
                        </span>
                      </div>

                      {/* Mentor Info */}
                      <div className="flex items-center gap-3 mb-4">
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

                      {/* Latest Teaching Evaluation Summary Box */}
                      {hasEvaluated ? (
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5 mb-4">
                          <div className="flex items-center justify-between text-slate-400 font-semibold text-[11px]">
                            <span>Periode:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                              {latestEval.periodName}
                            </span>
                          </div>
                          {latestEval.sessionTopic && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Topik Sesi:</span>
                              <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                                {latestEval.sessionTopic}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                            <span className="text-slate-400">Skor Capaian:</span>
                            <span className="font-black text-blue-600 dark:text-blue-400 font-mono text-xs">
                              {latestEval.totalScore} / {latestEval.maxScore} ({latestEval.percentage}%)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-600/80 dark:text-amber-400/80 mb-4 flex items-center gap-2">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>Belum ada lembar evaluasi kompetensi mengajar yang tersimpan.</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setEvaluatingTeachingMentor(m);
                          setSelectedTeachingEvaluation(latestEval || null);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        {hasEvaluated ? 'Edit Penilaian' : 'Nilai Kompetensi'}
                      </button>

                      {evals.length > 0 && (
                        <button
                          onClick={() => setHistoryTeachingMentor(m)}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                          title="Lihat Riwayat Observasi Mengajar"
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

      {/* SUB-TAB 4: PENGATURAN INSTRUMEN KOMPETENSI MENGAJAR */}
      {activeSubTab === 'instrument_teaching' && (
        <MonevTeachingInstrumentManager darkMode={darkMode} />
      )}

      {/* SUB-TAB 5: INSTRUMEN 3 (OBSERVASI MONEV WILAYAH) */}
      {activeSubTab === 'observation' && (
        <div className="space-y-6">
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`border rounded-3xl p-5 ${card}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">Total Wilayah</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{observationStats.totalWilayah}</span>
                <span className="text-xs text-slate-400 font-semibold">Wilayah</span>
              </div>
            </div>

            <div className={`border rounded-3xl p-5 ${card}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">Wilayah Terobservasi</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-500">
                  {observationStats.totalEvaluatedWilayah}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  / {observationStats.totalWilayah}
                </span>
              </div>
            </div>

            <div className={`border rounded-3xl p-5 ${card}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">Belum Diobservasi</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-500">
                  {observationStats.unEvaluatedWilayah}
                </span>
                <span className="text-xs text-slate-400 font-semibold">Wilayah</span>
              </div>
            </div>

            <div className={`border rounded-3xl p-5 ${card}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">Temuan Terbuka</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-indigo-500">
                  {observationStats.totalFindings}
                </span>
                <span className="text-xs text-slate-400 font-semibold">Catatan</span>
              </div>
            </div>
          </div>

          {/* FILTER BAR & SETTINGS SHORTCUT */}
          <div className={`border rounded-3xl p-4 sm:p-5 ${card} flex items-center justify-between flex-wrap gap-4`}>
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama wilayah atau mentor..."
                  value={observationSearchQuery}
                  onChange={(e) => setObservationSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition-all ${inputClass}`}
                />
              </div>

              {/* Status Filter */}
              <div className="relative w-52 shrink-0 hidden sm:block">
                <select
                  value={observationStatusFilter}
                  onChange={(e) => setObservationStatusFilter(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition-all cursor-pointer ${inputClass}`}
                >
                  <option value="ALL">Semua Status ({wilayahList.length})</option>
                  <option value="OBSERVED">Sudah Diobservasi ({observationStats.totalEvaluatedWilayah})</option>
                  <option value="UNOBSERVED">Belum Diobservasi ({observationStats.unEvaluatedWilayah})</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setActiveSubTab('instrument_observation')}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4 text-purple-500" />
              Kelola Instrumen Observasi
            </button>
          </div>

          {/* WILAYAH CARDS GRID */}
          {loadingObservations ? (
            <div className={`p-12 text-center border rounded-3xl ${card}`}>
              <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-semibold">Memuat daftar wilayah binaan...</p>
            </div>
          ) : filteredWilayahCards.length === 0 ? (
            <div className={`p-12 text-center border rounded-3xl ${card} space-y-3`}>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-200">
                Tidak Ada Wilayah yang Cocok
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {observationSearchQuery || observationStatusFilter !== 'ALL'
                  ? 'Tidak ada wilayah binaan yang sesuai dengan filter pencarian.'
                  : 'Belum ada data wilayah binaan yang terdaftar pada sistem.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWilayahCards.map((w) => (
                <div
                  key={w.id}
                  className={`border rounded-3xl p-5 sm:p-6 ${card} hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md`}
                >
                  {/* Top Wilayah Header & Status Badge */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black shrink-0">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight truncate">
                            Wilayah {w.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                            <Users className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span className="truncate">
                              {w.mentorNames && w.mentorNames.length > 0
                                ? w.mentorNames.join(', ')
                                : 'Belum ada mentor'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {w.hasObservation ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Terobservasi
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Belum Diobservasi
                        </span>
                      )}
                    </div>

                    {/* Middle Card: Observation Details / Empty State */}
                    {w.hasObservation ? (
                      <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200/60'} space-y-2 text-xs`}>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {w.latestObs.periodName || 'Periode Monev'}
                          </span>
                          <span>
                            {new Date(w.latestObs.observationDate || w.latestObs.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        {w.latestObs.programRealization && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed font-medium">
                            "{w.latestObs.programRealization}"
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                          {w.totalFindings > 0 ? (
                            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {w.totalFindings} Temuan Masalah
                            </span>
                          ) : (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Target Tercapai Baik
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            Observer: {w.latestObs.evaluatedBy?.name || 'Admin'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
                        <Compass className="w-5 h-5 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Belum Ada Laporan Observasi
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Pilih wilayah ini untuk memulai pengisian observasi
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                    {w.hasObservation ? (
                      <>
                        <button
                          onClick={() => setDetailObservation(w.latestObs)}
                          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Rincian
                        </button>

                        <button
                          onClick={() => {
                            setSelectedWilayahForObservation(w);
                            setEditingObservation(w.latestObs);
                            setCreatingObservation(false);
                          }}
                          className="p-2 rounded-xl text-purple-600 hover:bg-purple-500/10 border border-purple-500/20 transition-colors cursor-pointer"
                          title="Edit Laporan Observasi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedWilayahForObservation(w);
                            setEditingObservation(null);
                            setCreatingObservation(true);
                          }}
                          className="py-2 px-3 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Buat Laporan Observasi Baru untuk Wilayah Ini"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Observasi
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedWilayahForObservation(w);
                          setEditingObservation(null);
                          setCreatingObservation(true);
                        }}
                        className="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Compass className="w-4 h-4" />
                        Observasi Wilayah Ini
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 6: INSTRUMEN 4 (INDEPTH INTERVIEW AWARDEE) */}
      {activeSubTab === 'interview' && (
        <div className="space-y-6">
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`border rounded-3xl p-5 ${card}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">Total Awardee</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{interviewStats.total}</span>
                <span className="text-xs text-slate-400 font-semibold">Mahasiswa</span>
              </div>
            </div>

            <div className={`border rounded-3xl p-5 ${card}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">Sudah Diwawancara</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-500">
                  {interviewStats.interviewed}
                </span>
                <span className="text-xs text-slate-400 font-semibold">Awardee</span>
              </div>
            </div>

            <div className={`border rounded-3xl p-5 ${card}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">Belum Diwawancara</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-500">
                  {interviewStats.unInterviewed}
                </span>
                <span className="text-xs text-slate-400 font-semibold">Awardee</span>
              </div>
            </div>

            <div className={`border rounded-3xl p-5 ${card}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">Total Sesi Wawancara</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-indigo-500">
                  {interviewStats.totalInterviewsCount}
                </span>
                <span className="text-xs text-slate-400 font-semibold">Lembar</span>
              </div>
            </div>
          </div>

          {/* FILTER & SEARCH BAR */}
          <div className={`border rounded-3xl p-4 sm:p-5 ${card} flex items-center justify-between flex-wrap gap-4`}>
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama awardee, universitas, jurusan, atau wilayah..."
                  value={awardeeSearchQuery}
                  onChange={(e) => setAwardeeSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition-all ${inputClass}`}
                />
              </div>

              {/* Filter Wilayah */}
              <div className="relative w-44 shrink-0 hidden sm:block">
                <select
                  value={awardeeWilayahFilter}
                  onChange={(e) => setAwardeeWilayahFilter(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition-all cursor-pointer ${inputClass}`}
                >
                  <option value="ALL">Semua Wilayah</option>
                  {wilayahList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Status */}
              <div className="relative w-44 shrink-0 hidden md:block">
                <select
                  value={awardeeInterviewStatusFilter}
                  onChange={(e) => setAwardeeInterviewStatusFilter(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition-all cursor-pointer ${inputClass}`}
                >
                  <option value="ALL">Semua Status</option>
                  <option value="INTERVIEWED">Sudah Diwawancara</option>
                  <option value="NOT_INTERVIEWED">Belum Diwawancara</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setActiveSubTab('instrument_interview')}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
              Kelola Instrumen Pertanyaan
            </button>
          </div>

          {/* AWARDEE CARDS GRID */}
          {loadingAwardees ? (
            <div className={`p-12 text-center border rounded-3xl ${card}`}>
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-semibold">Memuat daftar awardee...</p>
            </div>
          ) : filteredAwardees.length === 0 ? (
            <div className={`p-12 text-center border rounded-3xl ${card} space-y-3`}>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-200">
                Tidak Ada Data Awardee
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {awardeeSearchQuery || awardeeWilayahFilter !== 'ALL' || awardeeInterviewStatusFilter !== 'ALL'
                  ? 'Tidak ada awardee yang cocok dengan filter yang dipilih.'
                  : 'Belum ada data awardee terdaftar pada sistem.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAwardees.map((a) => {
                const records = a.interviewRecords || [];
                const hasInterviewed = records.length > 0;
                const latestRecord = records[0];
                const latestDate = latestRecord?.interviewDate
                  ? new Date(latestRecord.interviewDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : null;

                return (
                  <div
                    key={a.id}
                    className={`border rounded-3xl p-5 ${card} hover:border-emerald-500/30 transition-all flex flex-col justify-between shadow-sm space-y-4`}
                  >
                    <div>
                      {/* Awardee Identity */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              a.user?.avatarUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                a.user?.name || 'Awardee'
                              )}&background=random`
                            }
                            alt="Avatar"
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                              {a.user?.name || 'Awardee'}
                            </h3>
                            <p className="text-xs text-slate-400 truncate max-w-[170px]">
                              {a.user?.email || '—'}
                            </p>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                          {a.wilayah?.name || '—'}
                        </span>
                      </div>

                      {/* University & Major info */}
                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 mb-3">
                        <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {a.university || 'Belum mengisi universitas'}
                        </p>
                        <p className="text-[11px] truncate">
                          {a.major ? `${a.major}` : ''}
                          {a.generation ? ` · Angkatan ${a.generation}` : ''}
                        </p>
                      </div>

                      {/* Status Wawancara Banner */}
                      {hasInterviewed ? (
                        <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-[11px]">
                              Sudah Diwawancara
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600">
                              {records.length} Sesi
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Terakhir: {latestDate} ({latestRecord.periodName})
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/15 text-xs text-amber-600/90 dark:text-amber-400/90 flex items-center gap-2">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span className="text-[11px]">Belum pernah dilakukan indepth interview.</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setEvaluatingAwardee(a);
                          setSelectedInterviewRecord(null);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {hasInterviewed ? 'Wawancara Baru' : 'Wawancara Sekarang'}
                      </button>

                      {hasInterviewed && (
                        <button
                          onClick={() => setHistoryAwardee(a)}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                          title="Lihat Riwayat Wawancara"
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

      {/* PENGATURAN INSTRUMEN OBSERVASI WILAYAH */}
      {activeSubTab === 'instrument_observation' && (
        <MonevObservationInstrumentManager darkMode={darkMode} />
      )}

      {/* SUB-TAB 7: PENGATURAN INSTRUMEN WAWANCARA */}
      {activeSubTab === 'instrument_interview' && (
        <MonevInterviewInstrumentManager darkMode={darkMode} />
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

      {/* MODAL RIWAYAT OBSERVASI KOMPETENSI MENGAJAR MENTOR */}
      {historyTeachingMentor && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className={`w-full max-w-2xl border rounded-3xl p-6 shadow-2xl my-8 ${card}`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={
                    historyTeachingMentor.user?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      historyTeachingMentor.user?.name || 'Mentor'
                    )}&background=random`
                  }
                  alt="Avatar"
                  className="w-10 h-10 rounded-2xl object-cover"
                />
                <div>
                  <h3 className="font-black text-sm">Riwayat Observasi Kompetensi Mengajar</h3>
                  <p className="text-xs text-slate-400">
                    {historyTeachingMentor.user?.name} · Wilayah {historyTeachingMentor.wilayah?.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setHistoryTeachingMentor(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {(historyTeachingMentor.teachingEvaluations || []).length === 0 ? (
                <p className="p-8 text-center text-xs text-slate-400 italic">
                  Belum ada riwayat observasi mengajar tersimpan.
                </p>
              ) : (
                historyTeachingMentor.teachingEvaluations.map((ev) => {
                  const cat = getTeachingCategory(ev.percentage);
                  return (
                    <div
                      key={ev.id}
                      className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-xs">{ev.periodName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${cat.tone}`}>
                            {cat.label} ({ev.percentage}%)
                          </span>
                        </div>
                        {ev.sessionTopic && (
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-0.5">
                            Topik: {ev.sessionTopic}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400">
                          Skor: {ev.totalScore} / {ev.maxScore} · Dinilai oleh:{' '}
                          {ev.evaluatedBy?.name || 'Admin'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setEvaluatingTeachingMentor(historyTeachingMentor);
                            setSelectedTeachingEvaluation(ev);
                            setHistoryTeachingMentor(null);
                          }}
                          className="p-2 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors cursor-pointer"
                          title="Buka / Edit Penilaian"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeachingEvaluation(ev.id)}
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
                onClick={() => setHistoryTeachingMentor(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL OBSERVASI MONEV WILAYAH */}
      {detailObservation && (
        <WilayahObservationDetailModal
          observation={detailObservation}
          onClose={() => setDetailObservation(null)}
          onEdit={(obs) => {
            setDetailObservation(null);
            setEditingObservation(obs);
          }}
          darkMode={darkMode}
        />
      )}

      {/* MODAL RIWAYAT WAWANCARA AWARDEE */}
      {historyAwardee && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className={`w-full max-w-2xl border rounded-3xl p-6 shadow-2xl my-8 ${card}`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={
                    historyAwardee.user?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      historyAwardee.user?.name || 'Awardee'
                    )}&background=random`
                  }
                  alt="Avatar"
                  className="w-10 h-10 rounded-2xl object-cover"
                />
                <div>
                  <h3 className="font-black text-sm">Riwayat Wawancara Indepth</h3>
                  <p className="text-xs text-slate-400">
                    {historyAwardee.user?.name} · Wilayah {historyAwardee.wilayah?.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setHistoryAwardee(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {(historyAwardee.interviewRecords || []).length === 0 ? (
                <p className="p-8 text-center text-xs text-slate-400 italic">
                  Belum ada riwayat wawancara tersimpan.
                </p>
              ) : (
                historyAwardee.interviewRecords.map((rec) => {
                  const recDate = rec.interviewDate
                    ? new Date(rec.interviewDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <div
                      key={rec.id}
                      className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-xs">{rec.periodName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            {recDate}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Pewawancara: {rec.evaluatedBy?.name || 'Admin'}
                        </p>
                        {rec.generalSummary && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-1 font-medium">
                            {rec.generalSummary}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setDetailInterviewRecord(rec);
                            setHistoryAwardee(null);
                          }}
                          className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white transition-colors cursor-pointer"
                          title="Lihat Dossier Lengkap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEvaluatingAwardee(historyAwardee);
                            setSelectedInterviewRecord(rec);
                            setHistoryAwardee(null);
                          }}
                          className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                          title="Buka / Edit Wawancara"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInterviewRecord(rec.id)}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          title="Hapus Wawancara"
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
                onClick={() => setHistoryAwardee(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DOSSIER WAWANCARA AWARDEE */}
      {detailInterviewRecord && (
        <AwardeeInterviewDetailModal
          record={detailInterviewRecord}
          onClose={() => setDetailInterviewRecord(null)}
          onEdit={(rec) => {
            setDetailInterviewRecord(null);
            setEvaluatingAwardee(rec.awardee || historyAwardee);
            setSelectedInterviewRecord(rec);
          }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
