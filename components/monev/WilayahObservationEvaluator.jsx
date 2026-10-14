"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, Compass, Save, Plus, Trash2, Calendar,
  Building2, Users, FileText, AlertTriangle, CheckCircle2,
  Clock, Sparkles, HelpCircle
} from 'lucide-react';
import { useDialog } from '../DialogProvider';

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

  // Bagian B states: [{ id, finding, recommendation, dueDate }]
  const [findings, setFindings] = useState(() => {
    if (initialObservation?.findings && Array.isArray(initialObservation.findings) && initialObservation.findings.length > 0) {
      return initialObservation.findings;
    }
    return [];
  });

  const [observers, setObservers] = useState([]);
  const [evaluatedById, setEvaluatedById] = useState(initialObservation?.evaluatedById || '');

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
    fetchObservers();
    return () => {
      isMounted = false;
    };
  }, [initialObservation]);

  // Get info of currently selected wilayah
  const selectedWilayah = useMemo(() => {
    return wilayahList.find((w) => w.id === selectedWilayahId) || null;
  }, [wilayahList, selectedWilayahId]);

  // Handler for adding a new finding row
  const handleAddFinding = () => {
    setFindings((prev) => [
      ...prev,
      {
        id: `finding-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        finding: '',
        recommendation: '',
        dueDate: '',
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
    if (!programRealization.trim()) {
      await alert('Kesimpulan Realisasi Pelaksanaan Program (Bagian A) wajib diisi.', 'Validasi', 'error');
      return;
    }
    if (!mentorPerformanceSummary.trim()) {
      await alert('Kesimpulan Performa Mentor (Bagian A) wajib diisi.', 'Validasi', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        wilayahId: selectedWilayahId,
        periodName: periodName.trim(),
        observationDate,
        programRealization: programRealization.trim(),
        mentorPerformanceSummary: mentorPerformanceSummary.trim(),
        findings: findings.filter(f => f.finding?.trim() || f.recommendation?.trim()),
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

      {/* METADATA OBSERVASI CARD */}
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
              Pilih Wilayah Program <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedWilayahId}
              onChange={(e) => setSelectedWilayahId(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition-all cursor-pointer ${inputClass}`}
            >
              <option value="" disabled>-- Pilih Wilayah --</option>
              {wilayahList.map((w) => (
                <option key={w.id} value={w.id}>
                  Wilayah {w.name} {w.mentorCount ? `(${w.mentorCount} Mentor)` : ''}
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
              Tanggal Pelaksanaan <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={observationDate}
              onChange={(e) => setObservationDate(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition-all ${inputClass}`}
            />
          </div>

          {/* Observer / Penilai */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Penilai / Observer (Superadmin) <span className="text-rose-500">*</span>
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

      {/* BAGIAN A: PERKEMBANGAN PROGRAM */}
      <div className={`border rounded-3xl p-5 sm:p-6 ${card} space-y-5 shadow-sm`}>
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
                Observasi kualitatif komprehensif realisasi program dan performa mentor wilayah
              </p>
            </div>
          </div>
        </div>

        {/* Realisasi Pelaksanaan Program */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <span>Realisasi Pelaksanaan Program</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400">
              Mengacu pada keseluruhan instrumen monev
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Berikan kesimpulan komprehensif mengenai capaian target kegiatan, dinamika pembinaan, kehadiran awardee, kepatuhan kurikulum, serta sarana/prasarana pendukung di wilayah ini.
          </p>
          <textarea
            rows={5}
            value={programRealization}
            onChange={(e) => setProgramRealization(e.target.value)}
            placeholder="Tuliskan kesimpulan observasi pelaksanaan program di wilayah ini secara detail..."
            className={`w-full p-4 rounded-2xl border text-xs font-medium leading-relaxed outline-none transition-all resize-y ${inputClass}`}
          />
        </div>

        {/* Performa Mentor */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-baseline justify-between gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <span>Performa Mentor</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400">
              Mengacu pada Instrumen Penilaian Mentor & Mengajar Mentor
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Berikan kesimpulan umum terkait kedisiplinan administratif (jurnal), kepemimpinan mentor dalam mendampingi awardee, serta kompetensi pedagogik saat memandu sesi pembinaan.
          </p>
          <textarea
            rows={5}
            value={mentorPerformanceSummary}
            onChange={(e) => setMentorPerformanceSummary(e.target.value)}
            placeholder="Tuliskan kesimpulan performa dan kompetensi mentor wilayah ini..."
            className={`w-full p-4 rounded-2xl border text-xs font-medium leading-relaxed outline-none transition-all resize-y ${inputClass}`}
          />
        </div>
      </div>

      {/* BAGIAN B: TEMUAN KETIDAKCAPAIAN TARGET PROGRAM */}
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
                Daftar kendala lapangan, rekomendasi perbaikan terukur, dan tenggat waktu
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
              Jika pelaksanaan program berjalan sesuai target atau tidak ada gap yang perlu ditindaklanjuti, Anda dapat melanjutkan tanpa menambah temuan. Atau klik tombol di bawah untuk menambah catatan temuan.
            </p>
            <button
              onClick={handleAddFinding}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Temuan Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {findings.map((item, index) => (
              <div
                key={item.id || index}
                className={`p-4 rounded-2xl border ${subCard} transition-all space-y-3`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-black">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                      Temuan & Rekomendasi
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

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Temuan */}
                  <div className="md:col-span-5 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Temuan Ketidakcapaian / Kendala
                    </label>
                    <textarea
                      rows={3}
                      value={item.finding}
                      onChange={(e) => handleUpdateFinding(index, 'finding', e.target.value)}
                      placeholder="Contoh: Kehadiran awardee pada sesi klasikal masih di bawah 80% karena bentrok jadwal kuliah praktikum..."
                      className={`w-full p-2.5 rounded-xl border text-xs font-medium outline-none transition-all resize-y ${inputClass}`}
                    />
                  </div>

                  {/* Rekomendasi */}
                  <div className="md:col-span-5 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Rekomendasi Tindak Lanjut
                    </label>
                    <textarea
                      rows={3}
                      value={item.recommendation}
                      onChange={(e) => handleUpdateFinding(index, 'recommendation', e.target.value)}
                      placeholder="Contoh: Menggeser jadwal sesi ke Sabtu malam atau Minggu pagi, serta melakukan koordinasi ulang komitmen awardee..."
                      className={`w-full p-2.5 rounded-xl border text-xs font-medium outline-none transition-all resize-y ${inputClass}`}
                    />
                  </div>

                  {/* Due Date (Bulan) */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Due Date (Bulan)
                    </label>
                    <input
                      type="text"
                      value={item.dueDate}
                      onChange={(e) => handleUpdateFinding(index, 'dueDate', e.target.value)}
                      placeholder="Contoh: Nov 2026 / Bulan ke-2"
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all ${inputClass}`}
                    />
                    <span className="text-[10px] text-slate-400 block">
                      Target bulan perbaikan
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddFinding}
              className="w-full py-3 rounded-2xl border border-dashed border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/5 transition-colors text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Baris Temuan Baru
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className={`border rounded-3xl p-4 sm:p-5 ${card} flex items-center justify-between flex-wrap gap-4 shadow-sm`}>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-4 h-4" />
          <span>Pastikan seluruh bagian observasi kualitatif telah terisi dengan jelas sebelum menyimpan.</span>
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
            className="px-6 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Menyimpan...' : 'Simpan Laporan Observasi'}
          </button>
        </div>
      </div>
    </div>
  );
}
