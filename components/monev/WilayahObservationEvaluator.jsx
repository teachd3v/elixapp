"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, Compass, Save, Plus, Trash2, Calendar,
  Building2, Users, FileText, AlertTriangle, CheckCircle2,
  Clock, Sparkles
} from 'lucide-react';
import { useDialog } from '../DialogProvider';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function WilayahObservationEvaluator({
  wilayahList = [],
  initialObservation = null,
  onBack,
  onSaved,
  darkMode,
}) {
  const { alert, confirm } = useDialog();

  const [saving, setSaving] = useState(false);
  const [selectedWilayahId, setSelectedWilayahId] = useState(
    initialObservation?.wilayahId || (wilayahList[0]?.id || '')
  );
  const [periodName, setPeriodName] = useState(
    initialObservation?.periodName || `Semester 1 - ${new Date().getFullYear()}`
  );
  const [observationDate, setObservationDate] = useState(() => {
    if (initialObservation?.observationDate) {
      return new Date(initialObservation.observationDate).toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });

  // Bagian A states
  const [programRealization, setProgramRealization] = useState(
    initialObservation?.programRealization || ''
  );
  const [mentorPerformanceSummary, setMentorPerformanceSummary] = useState(
    initialObservation?.mentorPerformanceSummary || ''
  );
  const [sectionAAnswers, setSectionAAnswers] = useState(() => {
    return (initialObservation?.sectionAAnswers && typeof initialObservation.sectionAAnswers === 'object')
      ? initialObservation.sectionAAnswers
      : {};
  });

  // Bagian B states: [{ id, category, finding, recommendation, dueDate }]
  const [findings, setFindings] = useState(() => {
    if (initialObservation?.findings && Array.isArray(initialObservation.findings) && initialObservation.findings.length > 0) {
      return initialObservation.findings;
    }
    return [];
  });

  const [observers, setObservers] = useState([]);
  const [evaluatedById, setEvaluatedById] = useState(initialObservation?.evaluatedById || '');
  const [masterAspects, setMasterAspects] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchObservers() {
      try {
        const res = await fetch('/api/admin/monev/observers');
        if (res.ok) {
          const d = await res.json();
          if (isMounted) {
            setObservers(d.observers || []);
            if (!initialObservation?.evaluatedById && d.currentObserverId) {
              setEvaluatedById(d.currentObserverId);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function fetchMasterAspects() {
      try {
        const res = await fetch('/api/admin/monev/observation-aspects');
        if (res.ok) {
          const d = await res.json();
          if (isMounted) {
            setMasterAspects(d || []);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchObservers();
    fetchMasterAspects();
    return () => {
      isMounted = false;
    };
  }, [initialObservation]);

  // Section A & B filtered aspects
  const sectionAAspects = useMemo(() => {
    const list = masterAspects.filter((a) => a.section !== 'SECTION_B');
    if (list.length > 0) return list;
    // Fallback if no master aspects seeded yet
    return [
      {
        id: 'default-1',
        order: 1,
        title: 'Realisasi Pelaksanaan Program',
        description: 'Kesimpulan pelaksanaan program mengacu pada keseluruhan instrumen monev.',
      },
      {
        id: 'default-2',
        order: 2,
        title: 'Performa Mentor',
        description: 'Kesimpulan performa mentor mengacu pada Instrumen Penilaian Mentor dan Mengajar Mentor.',
      },
    ];
  }, [masterAspects]);

  const sectionBAspects = useMemo(() => {
    return masterAspects.filter((a) => a.section === 'SECTION_B');
  }, [masterAspects]);

  // Month options for Due Date
  const currentYear = useMemo(() => {
    const match = periodName.match(/\b(20\d\d)\b/);
    return match ? parseInt(match[1], 10) : new Date().getFullYear();
  }, [periodName]);

  const monthOptions = useMemo(() => {
    const list = [];
    MONTH_NAMES.forEach((m) => list.push(`${m} ${currentYear}`));
    MONTH_NAMES.forEach((m) => list.push(`${m} ${currentYear + 1}`));
    return list;
  }, [currentYear]);

  // Selected wilayah info
  const selectedWilayah = useMemo(() => {
    return wilayahList.find((w) => w.id === selectedWilayahId) || null;
  }, [wilayahList, selectedWilayahId]);

  // Handler for adding a new finding row
  const handleAddFinding = () => {
    setFindings((prev) => [
      ...prev,
      {
        id: `finding-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        category: sectionBAspects[0]?.title || '',
        finding: '',
        recommendation: '',
        dueDate: `${MONTH_NAMES[new Date().getMonth()]} ${currentYear}`,
      },
    ]);
  };

  // Handler for updating a finding field
  const handleUpdateFinding = (index, field, value) => {
    setFindings((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Handler for removing a finding
  const handleRemoveFinding = (index) => {
    setFindings((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Save / Submit
  const handleSave = async () => {
    if (!selectedWilayahId) {
      await alert('Silakan pilih wilayah yang diobservasi.', 'Validasi', 'error');
      return;
    }
    if (!periodName.trim()) {
      await alert('Nama Periode Observasi wajib diisi.', 'Validasi', 'error');
      return;
    }

    // Determine values for programRealization and mentorPerformanceSummary
    let finalRealization = programRealization.trim();
    let finalMentor = mentorPerformanceSummary.trim();

    if (!finalRealization) {
      const keys = Object.keys(sectionAAnswers);
      const k = keys.find((key) => key.toLowerCase().includes('realisasi')) || keys[0];
      if (k) finalRealization = String(sectionAAnswers[k] || '').trim();
    }
    if (!finalMentor) {
      const keys = Object.keys(sectionAAnswers);
      const k = keys.find((key) => key.toLowerCase().includes('performa') || key.toLowerCase().includes('mentor')) || keys[1] || keys[0];
      if (k) finalMentor = String(sectionAAnswers[k] || '').trim();
    }

    if (!finalRealization) {
      await alert('Isian deskriptif Bagian A (Realisasi Program) wajib diisi.', 'Validasi', 'error');
      return;
    }
    if (!finalMentor) {
      finalMentor = finalRealization;
    }

    setSaving(true);
    try {
      const payload = {
        wilayahId: selectedWilayahId,
        periodName: periodName.trim(),
        observationDate,
        programRealization: finalRealization,
        mentorPerformanceSummary: finalMentor,
        sectionAAnswers,
        findings: findings.filter((f) => f.finding?.trim() || f.recommendation?.trim()),
        evaluatedById: evaluatedById || undefined,
      };

      const url = initialObservation?.id
        ? `/api/admin/monev/wilayah-observations/${initialObservation.id}`
        : '/api/admin/monev/wilayah-observations';

      const method = initialObservation?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan laporan observasi.');

      await alert(
        initialObservation?.id
          ? 'Laporan observasi wilayah berhasil diperbarui!'
          : 'Laporan observasi monev wilayah berhasil disimpan!',
        'Berhasil Disimpan',
        'success'
      );

      if (onSaved) onSaved(data);
    } catch (err) {
      await alert(err.message || 'Terjadi kesalahan sistem saat menyimpan data.', 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const subCard = darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80';
  const inputClass = darkMode
    ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20'
    : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20';

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* TOP NAVIGATION & ACTION BAR */}
      <div className={`border rounded-3xl p-4 sm:p-5 ${card} flex items-center justify-between flex-wrap gap-4 shadow-sm`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title="Kembali ke Daftar Observasi"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase">
                Instrumen 3 Monev
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">· Observasi Wilayah</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black mt-0.5">
              {initialObservation ? 'Edit Laporan Observasi Wilayah' : 'Laporan Observasi Monev Wilayah'}
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
            className="px-5 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Menyimpan...' : 'Simpan Laporan'}
          </button>
        </div>
      </div>

      {/* 1. PARAMETER OBSERVASI WILAYAH */}
      <div className={`border rounded-3xl p-5 sm:p-6 ${card} space-y-4 shadow-sm`}>
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Building2 className="w-5 h-5 text-purple-500" />
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
            1. Parameter Observasi Wilayah
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pilih Wilayah */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Wilayah Sasaran <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedWilayahId}
              onChange={(e) => setSelectedWilayahId(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition-all cursor-pointer ${inputClass}`}
            >
              {wilayahList.length === 0 && <option value="">Tidak ada wilayah</option>}
              {wilayahList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Periode */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Periode Observasi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={periodName}
              onChange={(e) => setPeriodName(e.target.value)}
              placeholder="Contoh: Semester 1 - 2026"
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition-all ${inputClass}`}
            />
          </div>

          {/* Tanggal Observasi */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Tanggal Kunjungan / Observasi <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={observationDate}
              onChange={(e) => setObservationDate(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition-all cursor-pointer ${inputClass}`}
            />
          </div>

          {/* Observer */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Identitas Observer / Penilai <span className="text-rose-500">*</span>
            </label>
            <select
              value={evaluatedById}
              onChange={(e) => setEvaluatedById(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition-all cursor-pointer ${inputClass}`}
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

        {/* Selected Wilayah Mentors Info Pill */}
        {selectedWilayah && (
          <div className={`p-3.5 rounded-2xl border ${subCard} flex items-center justify-between flex-wrap gap-2 text-xs`}>
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-purple-500 shrink-0" />
              <span className="font-bold text-slate-700 dark:text-slate-200">
                Mentor Bertugas Wilayah {selectedWilayah.name}:
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {selectedWilayah.mentorNames && selectedWilayah.mentorNames.length > 0
                  ? selectedWilayah.mentorNames.join(', ')
                  : 'Belum ada mentor terdaftar pada wilayah ini'}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              {selectedWilayah.mentorCount || 0} Akun Mentor
            </span>
          </div>
        )}
      </div>

      {/* BAGIAN A: PERKEMBANGAN PROGRAM (DESKRIPTIF / TULISAN PANJANG) */}
      <div className={`border rounded-3xl p-5 sm:p-6 ${card} space-y-6 shadow-sm`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-xs">
              A
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Bagian A. Perkembangan Program
              </h2>
              <p className="text-xs text-slate-400">
                Observasi kualitatif komprehensif dalam bentuk tulisan panjang deskriptif untuk setiap aspek
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {sectionAAspects.map((asp, aIdx) => {
            const isRealisasi = asp.title.toLowerCase().includes('realisasi');
            const isMentor = asp.title.toLowerCase().includes('performa') || asp.title.toLowerCase().includes('mentor');
            
            const currentVal = sectionAAnswers[asp.title] !== undefined
              ? sectionAAnswers[asp.title]
              : isRealisasi
              ? programRealization
              : isMentor
              ? mentorPerformanceSummary
              : '';

            return (
              <div
                key={asp.id || aIdx}
                className="space-y-2 pt-4 first:pt-0 border-t first:border-t-0 border-slate-100 dark:border-slate-800/80"
              >
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black text-xs flex items-center justify-center shrink-0">
                      {asp.order || aIdx + 1}
                    </span>
                    <span>{asp.title}</span>
                    <span className="text-rose-500">*</span>
                  </label>
                </div>

                {asp.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {asp.description}
                  </p>
                )}

                <textarea
                  rows={5}
                  value={currentVal}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSectionAAnswers((prev) => ({ ...prev, [asp.title]: val }));
                    if (isRealisasi) setProgramRealization(val);
                    if (isMentor) setMentorPerformanceSummary(val);
                  }}
                  placeholder={`Tuliskan laporan pengamatan deskriptif mengenai ${asp.title.toLowerCase()} secara detail dan mendalam...`}
                  className={`w-full p-4 rounded-2xl border text-xs font-medium leading-relaxed outline-none transition-all resize-y ${inputClass}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* BAGIAN B: TEMUAN KETIDAKCAPAIAN TARGET PROGRAM (3 INPUT: TEMUAN, REKOMENDASI, DUE DATE BULAN) */}
      <div className={`border rounded-3xl p-5 sm:p-6 ${card} space-y-4 shadow-sm`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs">
              B
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Bagian B. Temuan Ketidakcapaian Target Program
              </h2>
              <p className="text-xs text-slate-400">
                Catat poin ketidakcapaian target dengan 3 input: Temuan, Rekomendasi, dan Due Date (Opsi Bulan)
              </p>
            </div>
          </div>

          <button
            onClick={handleAddFinding}
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Temuan
          </button>
        </div>

        {findings.length === 0 ? (
          <div className={`p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2`}>
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Tidak Ada Temuan Ketidakcapaian Khusus
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Jika pelaksanaan program berjalan sesuai target, Anda dapat melanjutkan tanpa menambah temuan. Atau klik tombol di bawah untuk menambahkan catatan temuan.
            </p>
            <button
              onClick={handleAddFinding}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Temuan Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {findings.map((item, index) => (
              <div
                key={item.id || index}
                className={`p-4 sm:p-5 rounded-2xl border ${subCard} transition-all space-y-3.5`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-black">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                      Poin Temuan Ketidakcapaian #{index + 1}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemoveFinding(index)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Hapus baris temuan ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Optional category selector if sectionBAspects exist */}
                {sectionBAspects.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-purple-600 dark:text-purple-400 mb-1">
                      Kategori Aspek Target (Opsional)
                    </label>
                    <select
                      value={item.category || ''}
                      onChange={(e) => handleUpdateFinding(index, 'category', e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none cursor-pointer ${inputClass}`}
                    >
                      <option value="">-- Umum / Tanpa Kategori Khusus --</option>
                      {sectionBAspects.map((asp) => (
                        <option key={asp.id} value={asp.title}>
                          {asp.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 3 Core Inputs: 1. Temuan, 2. Rekomendasi, 3. Due Date Bulan */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                  {/* 1. Temuan */}
                  <div className="md:col-span-5 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      1. Temuan Ketidakcapaian <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={item.finding}
                      onChange={(e) => handleUpdateFinding(index, 'finding', e.target.value)}
                      placeholder="Jelaskan temuan ketidakcapaian atau kendala yang dihadapi..."
                      className={`w-full p-3 rounded-xl border text-xs font-medium outline-none transition-all resize-y ${inputClass}`}
                    />
                  </div>

                  {/* 2. Rekomendasi */}
                  <div className="md:col-span-4 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      2. Rekomendasi Solusi <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={item.recommendation}
                      onChange={(e) => handleUpdateFinding(index, 'recommendation', e.target.value)}
                      placeholder="Tuliskan rekomendasi atau langkah solusi penyelesaiannya..."
                      className={`w-full p-3 rounded-xl border text-xs font-medium outline-none transition-all resize-y ${inputClass}`}
                    />
                  </div>

                  {/* 3. Due Date (Opsi Bulan) */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>3. Due Date (Opsi Bulan)</span>
                    </label>
                    <select
                      value={item.dueDate || ''}
                      onChange={(e) => handleUpdateFinding(index, 'dueDate', e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all cursor-pointer ${inputClass}`}
                    >
                      <option value="">-- Pilih Bulan Target --</option>
                      {monthOptions.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                      {item.dueDate && !monthOptions.includes(item.dueDate) && (
                        <option value={item.dueDate}>{item.dueDate}</option>
                      )}
                    </select>
                    <span className="text-[10px] text-slate-400 block">
                      Target bulan penyelesaian perbaikan
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddFinding}
              className="w-full py-3 rounded-2xl border border-dashed border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/5 transition-colors text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Poin Temuan Lainnya
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
