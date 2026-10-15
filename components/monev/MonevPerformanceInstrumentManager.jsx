"use client";

import React, { useEffect, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  SlidersHorizontal, Plus, Trash2, Pencil, CheckCircle2,
  AlertCircle, RefreshCw, X, Layers, Target, ChevronDown,
  Download, FileUp, FileSpreadsheet, Loader2, Check
} from 'lucide-react';
import { useDialog } from '../DialogProvider';
import { exportMonevPerformanceTemplate } from '../../lib/exportExcel';
import { parseExcelPerformancePlans } from '../../lib/monev';

export default function MonevPerformanceInstrumentManager({ darkMode }) {
  const { confirm, alert } = useDialog();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Bulk import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [importMode, setImportMode] = useState('REPLACE');
  const [submittingImport, setSubmittingImport] = useState(false);

  // Modal state
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planTitle, setPlanTitle] = useState('');

  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [targetTitle, setTargetTitle] = useState('');
  const [targetWeight, setTargetWeight] = useState('10');
  const [semesterScope, setSemesterScope] = useState('KEDUANYA');
  const [targetScoreSem1, setTargetScoreSem1] = useState('4.00');
  const [targetScoreSem2, setTargetScoreSem2] = useState('4.00');
  const [targetSemester, setTargetSemester] = useState('');
  const [savingTarget, setSavingTarget] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/monev/performance-plans');
      if (!res.ok) throw new Error('Gagal memuat master instrumen');
      const data = await res.json();
      setPlans(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const totalWeight = useMemo(() => {
    let sum = 0;
    for (const p of plans) {
      for (const t of p.targets || []) {
        sum += Number(t.weight) || 0;
      }
    }
    return Math.round(sum * 10) / 10;
  }, [plans]);

  const handleSeedTemplate = async () => {
    const ok = await confirm(
      'Muat template standar rencana & target kerja bawaan? Data instrumen saat ini akan diperbarui dengan template resmi (Total Bobot 100%).',
      'Muat Template Standar'
    );
    if (!ok) return;

    setSeeding(true);
    try {
      const res = await fetch('/api/admin/monev/performance-plans/seed', { method: 'POST' });
      if (!res.ok) throw new Error('Gagal memuat template');
      const data = await res.json();
      setPlans(data.plans || []);
      await alert('Template instrumen standar berhasil dimuat dengan total bobot 100%.', 'Berhasil', 'success');
    } catch (err) {
      await alert(err.message || 'Gagal memuat template', 'Error', 'error');
    } finally {
      setSeeding(false);
    }
  };

  // Bulk import handlers
  const handleDownloadTemplate = () => {
    try {
      exportMonevPerformanceTemplate('Template_Instrumen_Performa_Mentor.xlsx');
    } catch (err) {
      console.error(err);
      alert('Gagal mengunduh template Excel.', 'Error', 'error');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processExcelFile(file);
  };

  const processExcelFile = (file) => {
    setSelectedFile(file);
    setParsingFile(true);
    setParsedResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName =
          workbook.SheetNames.find((s) => s.toLowerCase().includes('instrumen')) ||
          workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
          throw new Error('Lembar kerja (sheet) tidak ditemukan dalam file Excel.');
        }

        const jsonRows = XLSX.utils.sheet_to_json(sheet);
        const parsed = parseExcelPerformancePlans(jsonRows);
        setParsedResult(parsed);
      } catch (err) {
        console.error('Error parsing excel:', err);
        alert(err.message || 'Gagal memproses file Excel.', 'Error Parsing', 'error');
      } finally {
        setParsingFile(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmitImport = async () => {
    if (!parsedResult || parsedResult.plans.length === 0) {
      await alert('Tidak ada rencana kerja yang valid untuk diimpor.', 'Perhatian', 'error');
      return;
    }

    setSubmittingImport(true);
    try {
      const res = await fetch('/api/admin/monev/performance-plans/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: importMode,
          plans: parsedResult.plans,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal mengimpor data');
      }

      setPlans(resData.plans || []);
      setImportModalOpen(false);
      setSelectedFile(null);
      setParsedResult(null);

      await alert(
        resData.message || 'Bulk import berhasil disimpan ke database!',
        'Impor Berhasil',
        'success'
      );
    } catch (err) {
      await alert(err.message || 'Terjadi kesalahan saat menyimpan import.', 'Error', 'error');
    } finally {
      setSubmittingImport(false);
    }
  };

  // Plan CRUD
  const openAddPlan = () => {
    setEditingPlan(null);
    setPlanTitle('');
    setPlanModalOpen(true);
  };

  const openEditPlan = (p) => {
    setEditingPlan(p);
    setPlanTitle(p.title);
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planTitle.trim()) {
      await alert('Nama Rencana Kerja tidak boleh kosong.', 'Perhatian', 'error');
      return;
    }

    try {
      if (editingPlan) {
        const res = await fetch(`/api/admin/monev/performance-plans/${editingPlan.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'PLAN', title: planTitle.trim() }),
        });
        if (!res.ok) throw new Error('Gagal memperbarui rencana kerja');
      } else {
        const res = await fetch('/api/admin/monev/performance-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'PLAN', planTitle: planTitle.trim() }),
        });
        if (!res.ok) throw new Error('Gagal membuat rencana kerja');
      }
      setPlanModalOpen(false);
      await loadPlans();
    } catch (err) {
      await alert(err.message, 'Gagal', 'error');
    }
  };

  const handleDeletePlan = async (p) => {
    const ok = await confirm(
      `Hapus Rencana Kerja "${p.title}" beserta seluruh target kerjanya?`,
      'Hapus Rencana Kerja'
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/monev/performance-plans/${p.id}?type=PLAN`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus rencana kerja');
      await loadPlans();
      await alert('Rencana kerja berhasil dihapus.', 'Berhasil', 'success');
    } catch (err) {
      await alert(err.message, 'Error', 'error');
    }
  };

  // Target CRUD
  const openAddTarget = (planId) => {
    setEditingTarget(null);
    setSelectedPlanId(planId || plans[0]?.id || '');
    setTargetTitle('');
    setTargetWeight('10');
    setSemesterScope('KEDUANYA');
    setTargetScoreSem1('4.00');
    setTargetScoreSem2('4.00');
    setTargetSemester('');
    setTargetModalOpen(true);
  };

  const openEditTarget = (p, t) => {
    setEditingTarget(t);
    setSelectedPlanId(p.id);
    setTargetTitle(t.title);
    setTargetWeight(String(t.weight));
    setSemesterScope(t.semesterScope || 'KEDUANYA');
    setTargetScoreSem1(t.targetScoreSem1 != null ? String(t.targetScoreSem1) : '4.00');
    setTargetScoreSem2(t.targetScoreSem2 != null ? String(t.targetScoreSem2) : '4.00');
    setTargetSemester(t.targetSemester || '');
    setTargetModalOpen(true);
  };

  const handleSaveTarget = async (e) => {
    e.preventDefault();
    if (!selectedPlanId) {
      await alert('Pilih Rencana Kerja induk.', 'Perhatian', 'error');
      return;
    }
    if (!targetTitle.trim()) {
      await alert('Nama Target Kerja wajib diisi.', 'Perhatian', 'error');
      return;
    }
    const w = parseFloat(targetWeight);
    if (Number.isNaN(w) || w <= 0) {
      await alert('Bobot harus berupa angka positif.', 'Perhatian', 'error');
      return;
    }

    const s1 = parseFloat(targetScoreSem1);
    const s2 = parseFloat(targetScoreSem2);

    setSavingTarget(true);
    try {
      if (editingTarget) {
        const res = await fetch(`/api/admin/monev/performance-plans/${editingTarget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'TARGET',
            planId: selectedPlanId,
            title: targetTitle.trim(),
            weight: w,
            semesterScope,
            targetScoreSem1: semesterScope === 'SEMESTER_2' ? null : Number.isNaN(s1) ? 4.0 : s1,
            targetScoreSem2: semesterScope === 'SEMESTER_1' ? null : Number.isNaN(s2) ? 4.0 : s2,
            targetSemester: targetSemester.trim(),
          }),
        });
        if (!res.ok) throw new Error('Gagal memperbarui target kerja');
      } else {
        const res = await fetch('/api/admin/monev/performance-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'TARGET',
            planId: selectedPlanId,
            targetTitle: targetTitle.trim(),
            weight: w,
            semesterScope,
            targetScoreSem1: semesterScope === 'SEMESTER_2' ? null : Number.isNaN(s1) ? 4.0 : s1,
            targetScoreSem2: semesterScope === 'SEMESTER_1' ? null : Number.isNaN(s2) ? 4.0 : s2,
            targetSemester: targetSemester.trim(),
          }),
        });
        if (!res.ok) throw new Error('Gagal membuat target kerja');
      }
      setTargetModalOpen(false);
      await loadPlans();
    } catch (err) {
      await alert(err.message, 'Gagal', 'error');
    } finally {
      setSavingTarget(false);
    }
  };

  const handleDeleteTarget = async (t) => {
    const ok = await confirm(`Hapus Target Kerja "${t.title}"?`, 'Hapus Target Kerja');
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/monev/performance-plans/${t.id}?type=TARGET`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus target kerja');
      await loadPlans();
      await alert('Target kerja berhasil dihapus.', 'Berhasil', 'success');
    } catch (err) {
      await alert(err.message, 'Error', 'error');
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const subCard = darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80';
  const inputClass = darkMode
    ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-500'
    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500';

  let runningNumber = 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className={`border rounded-3xl p-6 ${card}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black">Pengaturan Instrumen Performa Mentor</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Atur hierarki Rencana Kerja, Target Kerja, Target Capaian Semester, dan Bobot persentase penilaian performa mentor (Total bobot wajib 100%).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setSelectedFile(null);
                setParsedResult(null);
                setImportModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
              title="Unggah dan impor file spreadsheet Excel"
            >
              <FileUp className="w-4 h-4" />
              Bulk Import Excel
            </button>
          </div>
        </div>

        {/* Live Total Weight Counter Badge */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Status Akumulasi Bobot:</span>
            {totalWeight === 100 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" /> Total Bobot: 100% (Sempurna)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <AlertCircle className="w-4 h-4" /> Total Bobot: {totalWeight}% (Harus 100% — Selisih {(100 - totalWeight).toFixed(1)}%)
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <span>{plans.length} Rencana Kerja</span>
            <span>·</span>
            <span>{plans.reduce((acc, p) => acc + (p.targets?.length || 0), 0)} Target Kerja</span>
          </div>
        </div>
      </div>

      {/* Plans & Targets Table */}
      {loading ? (
        <div className={`border rounded-3xl p-12 text-center ${card}`}>
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-semibold">Memuat data instrumen...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className={`border rounded-3xl p-12 text-center space-y-4 ${card}`}>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black">Belum Ada Instrumen Performa Mentor</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Gunakan fitur <strong>Bulk Import Excel</strong> untuk memasukkan master rencana kerja dan target kerja sekaligus. Template Excel resmi dapat diunduh langsung di dalam menu import.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setSelectedFile(null);
                setParsedResult(null);
                setImportModalOpen(true);
              }}
              className="px-6 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 hover:opacity-95 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <FileUp className="w-4 h-4" /> Unggah & Bulk Import Excel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((p, pIdx) => {
            const planWeightSum = (p.targets || []).reduce((s, t) => s + (Number(t.weight) || 0), 0);

            return (
              <div key={p.id} className={`border rounded-3xl overflow-hidden shadow-sm ${card}`}>
                {/* Plan Header Bar */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-500 font-black text-xs flex items-center justify-center shrink-0">
                      {pIdx + 1}
                    </span>
                    <div>
                      <h4 className="font-black text-sm text-slate-800 dark:text-white truncate">
                        {p.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold">
                        Subtotal Bobot: {planWeightSum}% · {p.targets?.length || 0} Target Kerja
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditPlan(p)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 hover:text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Edit Nama Rencana Kerja"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(p)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                      title="Hapus Rencana Kerja"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Targets Table */}
                {(p.targets || []).length === 0 ? (
                  <p className="p-5 text-xs text-slate-400 italic text-center">
                    Belum ada target kerja di bawah rencana kerja ini. Klik &quot;+ Target Kerja&quot; untuk menambahkan.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                          <th className="py-3 px-4 w-12 text-center">No</th>
                          <th className="py-3 px-4 min-w-[200px]">Target Kerja</th>
                          <th className="py-3 px-4 w-28 text-center">Bobot (%)</th>
                          <th className="py-3 px-4 w-32 text-center">Penilaian Semester</th>
                          <th className="py-3 px-4 min-w-[240px]">Target Capaian (0.00 - 4.00)</th>
                          <th className="py-3 px-4 w-20 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {p.targets.map((t) => {
                          runningNumber++;
                          const isBoth = t.semesterScope === 'KEDUANYA';
                          const isSem1 = t.semesterScope === 'SEMESTER_1';

                          return (
                            <tr
                              key={t.id}
                              className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="py-3 px-4 text-center font-bold text-slate-400 text-[11px]">
                                {runningNumber}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-200">
                                {t.title}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-xs font-mono">
                                  {t.weight}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                    isBoth
                                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                      : isSem1
                                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {isBoth ? 'Semester 1 & 2' : isSem1 ? 'Semester 1' : 'Semester 2'}
                                </span>
                              </td>
                              <td className="py-3 px-4 leading-relaxed text-[11px]">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {(isBoth || isSem1) && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold font-mono text-[10px]">
                                        Sem 1: {t.targetScoreSem1 != null ? Number(t.targetScoreSem1).toFixed(2) : '4.00'}
                                      </span>
                                    )}
                                    {(isBoth || !isSem1) && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold font-mono text-[10px]">
                                        Sem 2: {t.targetScoreSem2 != null ? Number(t.targetScoreSem2).toFixed(2) : '4.00'}
                                      </span>
                                    )}
                                  </div>
                                  {t.targetSemester && (
                                    <p className="text-[10px] text-slate-400 leading-snug line-clamp-2" title={t.targetSemester}>
                                      {t.targetSemester}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => openEditTarget(p, t)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 transition-colors cursor-pointer"
                                    title="Edit Target Kerja"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTarget(t)}
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                                    title="Hapus Target Kerja"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL PLAN (TAMBAH / EDIT RENCANA KERJA) */}
      {planModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md border rounded-3xl p-6 shadow-2xl ${card}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black">
                {editingPlan ? 'Edit Rencana Kerja' : 'Tambah Rencana Kerja Baru'}
              </h3>
              <button
                onClick={() => setPlanModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Nama Rencana Kerja <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="Contoh: Pembinaan & Pendampingan Karakter Awardee"
                  className={`w-full p-3 rounded-xl text-xs font-semibold border outline-none ${inputClass}`}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl text-xs font-bold bg-[#13385c] text-white hover:opacity-95 shadow-md cursor-pointer"
                >
                  {editingPlan ? 'Simpan Perubahan' : 'Tambah Rencana'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TARGET (TAMBAH / EDIT TARGET KERJA) */}
      {targetModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className={`w-full max-w-lg border rounded-3xl p-6 shadow-2xl my-8 ${card}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black">
                {editingTarget ? 'Edit Target Kerja' : 'Tambah Target Kerja Baru'}
              </h3>
              <button
                onClick={() => setTargetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Rencana Kerja Induk <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className={`w-full p-3 rounded-xl text-xs font-bold border outline-none cursor-pointer ${inputClass}`}
                  required
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id} className="dark:bg-slate-900">
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Nama Target Kerja <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={targetTitle}
                  onChange={(e) => setTargetTitle(e.target.value)}
                  placeholder="Contoh: Pembinaan Klasikal Bulanan"
                  className={`w-full p-3 rounded-xl text-xs font-semibold border outline-none ${inputClass}`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Bobot Penilaian (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    placeholder="misal: 15"
                    className={`w-full p-3 rounded-xl text-xs font-black font-mono border outline-none ${inputClass}`}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Penilaian Semester <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={semesterScope}
                    onChange={(e) => setSemesterScope(e.target.value)}
                    className={`w-full p-3 rounded-xl text-xs font-bold border outline-none cursor-pointer ${inputClass}`}
                  >
                    <option value="KEDUANYA" className="dark:bg-slate-900">Semester 1 & 2 (Keduanya)</option>
                    <option value="SEMESTER_1" className="dark:bg-slate-900">Semester 1 Saja</option>
                    <option value="SEMESTER_2" className="dark:bg-slate-900">Semester 2 Saja</option>
                  </select>
                </div>
              </div>

              {/* TARGET CAPAIAN NILAI (0.00 - 4.00) */}
              <div className="grid grid-cols-2 gap-3">
                {(semesterScope === 'SEMESTER_1' || semesterScope === 'KEDUANYA') && (
                  <div className={semesterScope === 'SEMESTER_1' ? 'col-span-2' : ''}>
                    <label className="text-xs font-bold text-slate-400 block mb-1.5 flex items-center justify-between">
                      <span>Target Nilai Sem 1 <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-blue-500 font-mono font-bold">0.00 - 4.00</span>
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="4"
                      value={targetScoreSem1}
                      onChange={(e) => setTargetScoreSem1(e.target.value)}
                      placeholder="4.00"
                      className={`w-full p-3 rounded-xl text-xs font-black font-mono border outline-none ${inputClass}`}
                      required
                    />
                  </div>
                )}

                {(semesterScope === 'SEMESTER_2' || semesterScope === 'KEDUANYA') && (
                  <div className={semesterScope === 'SEMESTER_2' ? 'col-span-2' : ''}>
                    <label className="text-xs font-bold text-slate-400 block mb-1.5 flex items-center justify-between">
                      <span>Target Nilai Sem 2 <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-purple-500 font-mono font-bold">0.00 - 4.00</span>
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="4"
                      value={targetScoreSem2}
                      onChange={(e) => setTargetScoreSem2(e.target.value)}
                      placeholder="4.00"
                      className={`w-full p-3 rounded-xl text-xs font-black font-mono border outline-none ${inputClass}`}
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Deskripsi / Indikator Capaian <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  rows={2}
                  value={targetSemester}
                  onChange={(e) => setTargetSemester(e.target.value)}
                  placeholder="Kriteria kualitatif / indikator ketercapaian target capaian..."
                  className={`w-full p-3 rounded-xl text-xs border outline-none leading-relaxed ${inputClass}`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTargetModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingTarget}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md font-black hover:opacity-95 cursor-pointer disabled:opacity-50"
                >
                  {savingTarget ? 'Menyimpan...' : editingTarget ? 'Simpan Target' : 'Tambah Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BULK IMPORT EXCEL */}
      {importModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className={`w-full max-w-2xl border rounded-3xl p-6 shadow-2xl my-auto space-y-5 ${card}`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Bulk Import Instrumen Performa Mentor</h3>
                  <p className="text-[11px] text-slate-400">
                    Impor master rencana kerja dan target kerja melalui spreadsheet Excel (.xlsx, .xls)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Box */}
            <div className={`p-4 rounded-2xl border ${subCard} flex items-center justify-between flex-wrap gap-3`}>
              <div>
                <span className="text-xs font-black block">Format Template Resmi</span>
                <span className="text-[11px] text-slate-400">
                  Gunakan format kolom: <strong>No</strong>, <strong>Rencana Kerja</strong>, <strong>Target Kerja</strong>, <strong>Bobot (%)</strong>, dan <strong>Target Nilai</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Template (.xlsx)
              </button>
            </div>

            {/* File Drop Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block">Pilih File Spreadsheet</label>
              <label
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                  selectedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-slate-300 dark:border-slate-700 hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-black text-slate-700 dark:text-slate-200">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB — Klik untuk mengganti file
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <FileUp className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Klik atau seret file Excel ke sini
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Mendukung format .xlsx atau .xls
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Parsing Indicator */}
            {parsingFile && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-amber-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Membaca dan memvalidasi struktur file...
              </div>
            )}

            {/* Parsing Result Summary Preview */}
            {parsedResult && (
              <div className="space-y-3">
                <div className={`p-4 rounded-2xl border ${subCard} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">Hasil Pratinjau Parsing</span>
                    <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Siap Diimpor
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[10px] text-slate-400 block">Total Rencana</span>
                      <span className="text-base font-black text-amber-500">
                        {parsedResult.plans.length} Rencana
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[10px] text-slate-400 block">Total Target</span>
                      <span className="text-base font-black text-sky-500">
                        {parsedResult.totalTargets} Target
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[10px] text-slate-400 block">Total Bobot</span>
                      <span className={`text-base font-black ${parsedResult.totalWeight === 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {parsedResult.totalWeight}%
                      </span>
                    </div>
                  </div>

                  {parsedResult.totalWeight !== 100 && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Catatan: Total bobot target saat ini {parsedResult.totalWeight}% (idealnya 100%).
                    </div>
                  )}

                  {parsedResult.errors?.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] space-y-1">
                      <div className="flex items-center gap-1 font-bold">
                        <AlertCircle className="w-3.5 h-3.5" /> Peringatan Baris:
                      </div>
                      <ul className="list-disc list-inside space-y-0.5">
                        {parsedResult.errors.slice(0, 3).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Import Mode Radio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 block">Mode Impor</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label
                      className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        importMode === 'REPLACE'
                          ? 'border-amber-500 bg-amber-500/10 font-bold'
                          : 'border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        value="REPLACE"
                        checked={importMode === 'REPLACE'}
                        onChange={() => setImportMode('REPLACE')}
                        className="accent-amber-500"
                      />
                      <div>
                        <span>Timpa Seluruh Data</span>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Hapus master instrumen lama dan ganti dengan file ini
                        </span>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        importMode === 'APPEND'
                          ? 'border-amber-500 bg-amber-500/10 font-bold'
                          : 'border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        value="APPEND"
                        checked={importMode === 'APPEND'}
                        onChange={() => setImportMode('APPEND')}
                        className="accent-amber-500"
                      />
                      <div>
                        <span>Tambahkan ke Data yang Ada</span>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Gabungkan rencana kerja baru di akhir daftar master
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!parsedResult || parsedResult.plans.length === 0 || submittingImport}
                onClick={handleSubmitImport}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:opacity-95 shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submittingImport ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses Impor...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Mulai Eksekusi Impor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
