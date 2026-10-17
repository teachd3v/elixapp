"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen, Plus, Calendar, Clock, MapPin, Video, Building2,
  FileText, BarChart2, AlertCircle, CheckCircle2, Image as ImageIcon,
  Trash2, Pencil, Download, Search, Filter, X, Eye, Sparkles, Hash, UploadCloud,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useDialog } from './DialogProvider';
import { fileToCompressedDataUrl } from '../lib/image';
import { exportMentorJournalsToExcel, formatDateDDMMYYYY } from '../lib/exportExcel';

export const JOURNAL_ACTIVITY_OPTIONS = [
  'Ekselensia Leadership Camp',
  'Seleksi YES',
  'Pembinaan Individu',
  'Pembinaan Klasikal',
  'Outing Class',
  'YES Day Out',
  'Weekly Meeting',
  'Young Leadership Festival',
  'Temu Tokoh',
  'Book Sharing',
  'Merapihkan Administrasi',
  'Laporan Keuangan',
  'Publikasi Instagram',
  'Talent Hub Class',
  'Kegiatan Mitra',
  'Upgrading Mentor',
];

const MONTHS_ID = [
  { val: '01', label: '01 - Januari' },
  { val: '02', label: '02 - Februari' },
  { val: '03', label: '03 - Maret' },
  { val: '04', label: '04 - April' },
  { val: '05', label: '05 - Mei' },
  { val: '06', label: '06 - Juni' },
  { val: '07', label: '07 - Juli' },
  { val: '08', label: '08 - Agustus' },
  { val: '09', label: '09 - September' },
  { val: '10', label: '10 - Oktober' },
  { val: '11', label: '11 - November' },
  { val: '12', label: '12 - Desember' },
];

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES_60 = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

function generatePreviewCode(yyyy, mm, dd) {
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JRN-${yyyy}${mm}${dd}-${rand}`;
}

function getTodayParts() {
  const now = new Date();
  return {
    dd: String(now.getDate()).padStart(2, '0'),
    mm: String(now.getMonth() + 1).padStart(2, '0'),
    yyyy: String(now.getFullYear()),
  };
}

function parseTimeParts(timeStr) {
  // Format e.g. "09:00 - 11:00" or "09:00"
  if (!timeStr) {
    return { startH: '09', startM: '00', endH: '11', endM: '00', useRange: true };
  }
  const clean = timeStr.replace(/WIB/gi, '').trim();
  if (clean.includes('-')) {
    const [s, e] = clean.split('-').map((x) => x.trim());
    const [sh = '09', sm = '00'] = s.split(':');
    const [eh = '11', em = '00'] = e.split(':');
    return {
      startH: sh.padStart(2, '0'),
      startM: sm.padStart(2, '0'),
      endH: eh.padStart(2, '0'),
      endM: em.padStart(2, '0'),
      useRange: true,
    };
  }
  const [sh = '09', sm = '00'] = clean.split(':');
  return {
    startH: sh.padStart(2, '0'),
    startM: sm.padStart(2, '0'),
    endH: '11',
    endM: '00',
    useRange: false,
  };
}

export default function MentorJournalManager({ darkMode, dbUser }) {
  const { confirm, alert } = useDialog();
  const [journals, setJournals] = useState([]);
  const [wilayah, setWilayah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActivity, setFilterActivity] = useState('ALL');
  const [filterLocationType, setFilterLocationType] = useState('ALL');
  const [openCardId, setOpenCardId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // Modal Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form fields (1 - 10)
  const today = getTodayParts();
  const [journalCode, setJournalCode] = useState('');
  const [activityName, setActivityName] = useState(JOURNAL_ACTIVITY_OPTIONS[0]);
  const [qualitativeAchievement, setQualitativeAchievement] = useState('');
  const [quantitativeAchievement, setQuantitativeAchievement] = useState('');
  const [dateDD, setDateDD] = useState(today.dd);
  const [dateMM, setDateMM] = useState(today.mm);
  const [dateYYYY, setDateYYYY] = useState(today.yyyy);
  const [startH, setStartH] = useState('09');
  const [startM, setStartM] = useState('00');
  const [endH, setEndH] = useState('11');
  const [endM, setEndM] = useState('00');
  const [useTimeRange, setUseTimeRange] = useState(true);
  const [locationType, setLocationType] = useState('Luring');
  const [locationDetail, setLocationDetail] = useState('');
  const [problemIdentification, setProblemIdentification] = useState('');
  const [improvementPlan, setImprovementPlan] = useState('');
  const [evidenceText, setEvidenceText] = useState('');
  const [evidencePhoto, setEvidencePhoto] = useState(null);
  const [evidenceFileName, setEvidenceFileName] = useState('');
  const [compressingPhoto, setCompressingPhoto] = useState(false);

  const loadJournals = useCallback(async () => {
    try {
      const res = await fetch('/api/mentor/journals');
      if (!res.ok) throw new Error('Gagal memuat data jurnal');
      const data = await res.json();
      setJournals(data.journals || []);
      if (data.wilayah) setWilayah(data.wilayah);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJournals();
  }, [loadJournals]);

  const openCreateModal = () => {
    const t = getTodayParts();
    setEditingId(null);
    setJournalCode(generatePreviewCode(t.yyyy, t.mm, t.dd));
    setActivityName(JOURNAL_ACTIVITY_OPTIONS[0]);
    setQualitativeAchievement('');
    setQuantitativeAchievement('');
    setDateDD(t.dd);
    setDateMM(t.mm);
    setDateYYYY(t.yyyy);
    setStartH('09');
    setStartM('00');
    setEndH('11');
    setEndM('00');
    setUseTimeRange(true);
    setLocationType('Luring');
    setLocationDetail('');
    setProblemIdentification('');
    setImprovementPlan('1. ');
    setEvidenceText('');
    setEvidencePhoto(null);
    setEvidenceFileName('');
    setModalOpen(true);
  };

  const openEditModal = (j) => {
    setEditingId(j.id);
    setJournalCode(j.journalCode || '');
    setActivityName(j.activityName || JOURNAL_ACTIVITY_OPTIONS[0]);
    setQualitativeAchievement(j.qualitativeAchievement || '');
    setQuantitativeAchievement(j.quantitativeAchievement || '');

    const d = j.activityDate ? new Date(j.activityDate) : new Date();
    if (!Number.isNaN(d.getTime())) {
      setDateDD(String(d.getDate()).padStart(2, '0'));
      setDateMM(String(d.getMonth() + 1).padStart(2, '0'));
      setDateYYYY(String(d.getFullYear()));
    }

    const tp = parseTimeParts(j.activityTime);
    setStartH(tp.startH);
    setStartM(tp.startM);
    setEndH(tp.endH);
    setEndM(tp.endM);
    setUseTimeRange(tp.useRange);

    setLocationType(j.locationType === 'Daring' ? 'Daring' : 'Luring');
    setLocationDetail(j.locationDetail || '');
    setProblemIdentification(j.problemIdentification || '');
    setImprovementPlan(j.improvementPlan || '');
    setEvidenceText(j.evidenceText || '');
    setEvidencePhoto(j.evidencePhoto || null);
    setEvidenceFileName(j.evidencePhoto ? 'Foto Dokumentasi Tersimpan' : '');
    setModalOpen(true);
  };

  // Update preview code date prefix if creating new journal
  const handleDatePartChange = (part, value) => {
    let nextDD = dateDD;
    let nextMM = dateMM;
    let nextYYYY = dateYYYY;
    if (part === 'dd') { setDateDD(value); nextDD = value; }
    if (part === 'mm') { setDateMM(value); nextMM = value; }
    if (part === 'yyyy') { setDateYYYY(value); nextYYYY = value; }

    if (!editingId && journalCode) {
      const suffix = journalCode.split('-')[2] || Math.random().toString(36).substring(2, 6).toUpperCase();
      setJournalCode(`JRN-${nextYYYY}${nextMM}${nextDD}-${suffix}`);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressingPhoto(true);
    try {
      const compressed = await fileToCompressedDataUrl(file, { maxDim: 1000, quality: 0.78 });
      setEvidencePhoto(compressed);
      setEvidenceFileName(file.name);
    } catch (err) {
      await alert(err.message || 'Gagal memproses foto dokumentasi.', 'Gagal Unggah Foto', 'error');
    } finally {
      setCompressingPhoto(false);
      e.target.value = '';
    }
  };

  const handleAddImprovementPoint = () => {
    const lines = improvementPlan.trim() ? improvementPlan.trim().split('\n') : [];
    const nextNum = lines.length + 1;
    const prefix = improvementPlan.trim() ? `${improvementPlan.replace(/\s+$/, '')}\n${nextNum}. ` : `1. `;
    setImprovementPlan(prefix);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!qualitativeAchievement.trim()) {
      await alert('Capaian Kualitatif wajib diisi secara lengkap.', 'Input Belum Lengkap', 'error');
      return;
    }
    if (!quantitativeAchievement.trim()) {
      await alert('Capaian Kuantitatif (Result/Indikator) wajib diisi.', 'Input Belum Lengkap', 'error');
      return;
    }
    if (!locationDetail.trim()) {
      await alert(
        locationType === 'Daring'
          ? ' Harap isi platform daring (misal: Zoom Meeting atau Google Meet).'
          : 'Harap isi nama tempat atau daerah pelaksanaan luring.',
        'Tempat Pelaksanaan Kosong',
        'error'
      );
      return;
    }
    if (!problemIdentification.trim()) {
      await alert('Identifikasi Masalah wajib diisi.', 'Input Belum Lengkap', 'error');
      return;
    }
    if (!improvementPlan.trim()) {
      await alert('Rencana Perbaikan wajib diisi.', 'Input Belum Lengkap', 'error');
      return;
    }
    if (!evidenceText.trim() && !evidencePhoto) {
      await alert(
        'Harap isi minimal salah satu Evidence: teks keterangan/link atau unggah foto dokumentasi.',
        'Evidence Belum Diisi',
        'error'
      );
      return;
    }

    const isoDateStr = `${dateYYYY}-${dateMM}-${dateDD}T12:00:00.000Z`;
    const formattedTime = useTimeRange
      ? `${startH}:${startM} - ${endH}:${endM}`
      : `${startH}:${startM}`;

    setSubmitting(true);
    try {
      const payload = {
        journalCode,
        activityName,
        qualitativeAchievement: qualitativeAchievement.trim(),
        quantitativeAchievement: quantitativeAchievement.trim(),
        activityDate: isoDateStr,
        activityTime: formattedTime,
        locationType,
        locationDetail: locationDetail.trim(),
        problemIdentification: problemIdentification.trim(),
        improvementPlan: improvementPlan.trim(),
        evidenceText: evidenceText.trim() || null,
        evidencePhoto: evidencePhoto || null,
      };

      const url = editingId ? `/api/mentor/journals/${editingId}` : '/api/mentor/journals';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.error || 'Gagal menyimpan jurnal mentor.');
      }

      setModalOpen(false);
      await loadJournals();
      await alert(
        editingId ? 'Data jurnal berhasil diperbarui.' : 'Jurnal aktivitas harian berhasil disimpan.',
        'Berhasil Disimpan',
        'success'
      );
    } catch (err) {
      await alert(err.message || 'Terjadi kesalahan saat menyimpan jurnal.', 'Gagal Menyimpan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (journal) => {
    const ok = await confirm(
      `Apakah kamu yakin ingin menghapus jurnal "${journal.activityName}" (${journal.journalCode}) pada tanggal ${formatDateDDMMYYYY(journal.activityDate)}?`,
      'Hapus Jurnal Mentor'
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/mentor/journals/${journal.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal menghapus jurnal.');
      }
      await loadJournals();
      await alert('Data jurnal telah dihapus dari riwayat.', 'Jurnal Dihapus', 'success');
    } catch (err) {
      await alert(err.message || 'Gagal menghapus jurnal.', 'Error', 'error');
    }
  };

  const filteredJournals = useMemo(() => {
    return journals.filter((j) => {
      if (filterActivity !== 'ALL' && j.activityName !== filterActivity) return false;
      if (filterLocationType !== 'ALL' && j.locationType !== filterLocationType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = (j.journalCode || '').toLowerCase().includes(q);
        const matchAct = (j.activityName || '').toLowerCase().includes(q);
        const matchQual = (j.qualitativeAchievement || '').toLowerCase().includes(q);
        const matchQuant = (j.quantitativeAchievement || '').toLowerCase().includes(q);
        const matchLoc = (j.locationDetail || '').toLowerCase().includes(q);
        const matchDate = formatDateDDMMYYYY(j.activityDate).includes(q);
        if (!matchCode && !matchAct && !matchQual && !matchQuant && !matchLoc && !matchDate) {
          return false;
        }
      }
      return true;
    });
  }, [journals, filterActivity, filterLocationType, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthCount = journals.filter((j) => {
      const d = new Date(j.activityDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const daringCount = journals.filter((j) => j.locationType === 'Daring').length;
    const luringCount = journals.filter((j) => j.locationType === 'Luring').length;
    return {
      total: journals.length,
      thisMonth: thisMonthCount,
      daring: daringCount,
      luring: luringCount,
    };
  }, [journals]);

  const cardClass = darkMode
    ? 'bg-slate-900 border-slate-800 text-white'
    : 'bg-white border-slate-200 text-slate-800';

  const inputClass = darkMode
    ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-amber-500'
    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500';

  const daysInSelectedMonth = useMemo(() => {
    const y = parseInt(dateYYYY, 10) || 2026;
    const m = parseInt(dateMM, 10) || 1;
    const maxDays = new Date(y, m, 0).getDate();
    return Array.from({ length: maxDays }, (_, i) => String(i + 1).padStart(2, '0'));
  }, [dateYYYY, dateMM]);

  return (
    <div className="space-y-6 pb-32">
      {/* Header Banner */}
      <div className={`border rounded-3xl p-5 sm:p-6 ${cardClass}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">Jurnal Mentor</h2>
                {wilayah?.name && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Wilayah {wilayah.name}
                  </span>
                )}
                {dbUser?.name && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {dbUser.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {journals.length > 0 && (
              <button
                onClick={() =>
                  exportMentorJournalsToExcel({
                    journals: filteredJournals,
                    mentorName: dbUser?.name,
                    wilayahName: wilayah?.name,
                  })
                }
                className="p-2.5 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center justify-center cursor-pointer"
                title="Export Excel"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={openCreateModal}
              className="p-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 hover:opacity-95 transition-all flex items-center justify-center shrink-0 cursor-pointer"
              title="Tulis Jurnal Baru"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Summary Stats (3 Kolom) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/15">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-indigo-500 block">Total Jurnal</span>
            <p className="text-xl sm:text-2xl font-black mt-1">{stats.total}</p>
          </div>
          <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-500 block">Luring</span>
            <p className="text-xl sm:text-2xl font-black mt-1">{stats.luring}</p>
          </div>
          <div className="p-3 sm:p-3.5 rounded-2xl bg-sky-500/5 border border-sky-500/15">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-sky-500 block">Daring</span>
            <p className="text-xl sm:text-2xl font-black mt-1">{stats.daring}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={`border rounded-2xl p-4 flex flex-col md:flex-row gap-3 ${cardClass}`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kegiatan, tanggal (DD/MM/YYYY), lokasi, atau capaian..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all ${inputClass}`}
          />
        </div>
        <div className="grid grid-cols-2 md:flex gap-2">
          <select
            value={filterActivity}
            onChange={(e) => setFilterActivity(e.target.value)}
            className={`w-full md:w-auto min-w-0 px-3 py-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer truncate ${inputClass}`}
          >
            <option value="ALL">Kegiatan</option>
            {JOURNAL_ACTIVITY_OPTIONS.map((act) => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>

          <select
            value={filterLocationType}
            onChange={(e) => setFilterLocationType(e.target.value)}
            className={`w-full md:w-auto min-w-0 px-3 py-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer truncate ${inputClass}`}
          >
            <option value="ALL">Tempat</option>
            <option value="Luring">Luring (Offline)</option>
            <option value="Daring">Daring (Online)</option>
          </select>
        </div>
      </div>

      {/* Journal List Day-by-Day */}
      {loading ? (
        <div className={`border rounded-3xl p-12 text-center ${cardClass}`}>
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-semibold">Memuat riwayat jurnal mentor...</p>
        </div>
      ) : filteredJournals.length === 0 ? (
        <div className={`border rounded-3xl p-10 sm:p-12 text-center space-y-2.5 ${cardClass}`}>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h3 className="text-sm sm:text-base font-black">
            {journals.length === 0 ? 'Belum Ada Catatan Jurnal' : 'Tidak Ada Jurnal yang Cocok'}
          </h3>
          {journals.length > 0 && (
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Coba ubah filter kegiatan atau kata kunci pencarianmu.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredJournals.map((j) => {
            const isCardOpen = openCardId === j.id;
            const isExpanded = expandedId === j.id;
            const formattedDate = formatDateDDMMYYYY(j.activityDate);
            const isDaring = j.locationType === 'Daring';

            const toggleCard = () => {
              if (isCardOpen) {
                setOpenCardId(null);
                if (expandedId === j.id) setExpandedId(null);
              } else {
                setOpenCardId(j.id);
              }
            };

            return (
              <div
                key={j.id}
                className={`border rounded-3xl p-4 sm:p-5 transition-all hover:shadow-md ${cardClass}`}
              >
                {/* Header Card (Collapsible - Default Tertutup): Nama Kegiatan, Lokasi, Tanggal/Jam, Aksi */}
                <div className="flex flex-col gap-3">
                  <div
                    onClick={toggleCard}
                    className="flex items-start justify-between gap-2.5 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="px-3 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-xs">
                        {j.activityName}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          isDaring
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isDaring ? <Video className="w-3 h-3 shrink-0" /> : <Building2 className="w-3 h-3 shrink-0" />}
                        <span className="truncate">{j.locationType}: {j.locationDetail}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCard();
                      }}
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
                      title={isCardOpen ? 'Tutup Capaian' : 'Buka Capaian'}
                    >
                      {isCardOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div
                      onClick={toggleCard}
                      className="flex items-center gap-3 text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {formattedDate}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        {j.activityTime} WIB
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(j)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-amber-500/15 text-slate-600 hover:text-amber-600 dark:bg-slate-800 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Edit Jurnal"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(j)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                        title="Hapus Jurnal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Isi Collapse: Capaian Kualitatif & Kuantitatif + Thumbnail Foto + Tombol Mata */}
                {isCardOpen && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3.5 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-500 mb-1.5">
                          <FileText className="w-3.5 h-3.5" /> Capaian Kualitatif
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200">
                          {j.qualitativeAchievement}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-500 mb-1.5">
                          <BarChart2 className="w-3.5 h-3.5" /> Capaian Kuantitatif (Result / Indikator)
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200">
                          {j.quantitativeAchievement}
                        </p>
                      </div>
                    </div>

                    {/* Bar Bawah Capaian: Thumbnail Foto / Unggahan File & Tombol Mata */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {j.evidencePhoto ? (
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(j.evidencePhoto)}
                            className="group relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 cursor-pointer"
                            title="Klik untuk memperbesar foto dokumentasi"
                          >
                            <img
                              src={j.evidencePhoto}
                              alt="Thumbnail Dokumentasi"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-white" />
                            </div>
                          </button>
                        ) : j.evidenceText ? (
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : j.id)}
                            className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 cursor-pointer"
                            title={j.evidenceText}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Tanpa lampiran foto</span>
                        )}

                        {j.evidenceText && (
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                            {j.evidenceText}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : j.id)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                          isExpanded
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                        }`}
                        title={isExpanded ? 'Sembunyikan Detail Lainnya' : 'Lihat Detail Keterangan Lainnya'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Detail Keterangan Lainnya (Saat Tombol Mata Diklik) */}
                    {isExpanded && (
                      <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-3.5 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/15">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-500 mb-1.5">
                              <AlertCircle className="w-3.5 h-3.5" /> Identifikasi Masalah
                            </div>
                            <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200">
                              {j.problemIdentification}
                            </p>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/15">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
                              <Sparkles className="w-3.5 h-3.5" /> Rencana Perbaikan
                            </div>
                            <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200">
                              {j.improvementPlan}
                            </p>
                          </div>
                        </div>

                        {j.evidenceText && (
                          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 break-words">
                            <span className="font-black text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                              Keterangan Evidence / Tautan
                            </span>
                            {j.evidenceText}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL FORM INPUT / EDIT JURNAL (10 FIELDS) */}
      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm overflow-y-auto">
          <div
            className={`w-full max-w-2xl border rounded-3xl p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 bg-inherit">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {editingId ? 'Edit Jurnal Aktivitas Mentor' : 'Form Input Jurnal Mentor Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Lengkapi 10 poin pencatatan jurnal harian di bawah ini
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 mt-5">
              {/* 1. Unique ID Otomatis */}
              <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-between gap-4">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-indigo-500 block">
                    1. Unique ID History Jurnal (Otomatis)
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ID unik riwayat jurnal yang tercatat otomatis di database
                  </p>
                </div>
                <span className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-500/30 font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm">
                  {journalCode}
                </span>
              </div>

              {/* 2. Nama Kegiatan (Dropdown 16 Pilihan) */}
              <div>
                <label className="text-xs font-bold block mb-1.5">
                  2. Nama Kegiatan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  className={`w-full p-3 rounded-xl text-xs font-bold border outline-none cursor-pointer ${inputClass}`}
                >
                  {JOURNAL_ACTIVITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="dark:bg-slate-900">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Capaian Kualitatif */}
              <div>
                <label className="text-xs font-bold block mb-1.5">
                  3. Capaian Kualitatif <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={qualitativeAchievement}
                  onChange={(e) => setQualitativeAchievement(e.target.value)}
                  placeholder="Tuliskan deskripsi panjang capaian kualitatif dari pelaksanaan kegiatan (misal: antusiasme peserta, pemahaman materi, dinamika diskusi)..."
                  className={`w-full p-3 rounded-xl text-xs border outline-none leading-relaxed ${inputClass}`}
                />
              </div>

              {/* 4. Capaian Kuantitatif */}
              <div>
                <label className="text-xs font-bold block mb-1.5">
                  4. Capaian Kuantitatif (Result / Capaian Indikator) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={quantitativeAchievement}
                  onChange={(e) => setQuantitativeAchievement(e.target.value)}
                  placeholder="Tuliskan hasil/indikator terukur secara kuantitatif (contoh: 18 dari 20 Awardee hadir [90%], 3 modul selesai dibahas, 1 laporan keuangan tuntas)..."
                  className={`w-full p-3 rounded-xl text-xs border outline-none leading-relaxed ${inputClass}`}
                />
              </div>

              {/* 5. Tanggal Pelaksanaan (Format DD/MM/YYYY) & 6. Waktu Pelaksanaan (Format 24 Jam) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 5. Tanggal Pelaksanaan */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold">
                      5. Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {dateDD}/{dateMM}/{dateYYYY}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Pilih Tanggal / Bulan / Tahun (Format DD/MM/YYYY):</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block mb-1">Tanggal (DD)</span>
                      <select
                        value={dateDD}
                        onChange={(e) => handleDatePartChange('dd', e.target.value)}
                        className={`w-full p-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer ${inputClass}`}
                      >
                        {daysInSelectedMonth.map((d) => (
                          <option key={d} value={d} className="dark:bg-slate-900">{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block mb-1">Bulan (MM)</span>
                      <select
                        value={dateMM}
                        onChange={(e) => handleDatePartChange('mm', e.target.value)}
                        className={`w-full p-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer ${inputClass}`}
                      >
                        {MONTHS_ID.map((m) => (
                          <option key={m.val} value={m.val} className="dark:bg-slate-900">{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block mb-1">Tahun (YYYY)</span>
                      <select
                        value={dateYYYY}
                        onChange={(e) => handleDatePartChange('yyyy', e.target.value)}
                        className={`w-full p-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer ${inputClass}`}
                      >
                        {['2024', '2025', '2026', '2027', '2028'].map((y) => (
                          <option key={y} value={y} className="dark:bg-slate-900">{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 6. Waktu Pelaksanaan (Format Indonesia 24 Jam) */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold">
                      6. Waktu Pelaksanaan (24 Jam) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      {useTimeRange ? `${startH}:${startM} - ${endH}:${endM} WIB` : `${startH}:${startM} WIB`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Format Waktu Indonesia 24 Jam</span>
                    <label className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useTimeRange}
                        onChange={(e) => setUseTimeRange(e.target.checked)}
                        className="rounded"
                      />
                      Rentang Selesai
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <span className="text-[9px] font-bold text-slate-400 block mb-1">Jam Mulai</span>
                      <div className="flex items-center gap-1">
                        <select
                          value={startH}
                          onChange={(e) => setStartH(e.target.value)}
                          className={`flex-1 p-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${inputClass}`}
                        >
                          {HOURS_24.map((h) => (
                            <option key={h} value={h} className="dark:bg-slate-900">{h}</option>
                          ))}
                        </select>
                        <span className="font-black text-xs">:</span>
                        <select
                          value={startM}
                          onChange={(e) => setStartM(e.target.value)}
                          className={`flex-1 p-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${inputClass}`}
                        >
                          {MINUTES_60.map((m) => (
                            <option key={m} value={m} className="dark:bg-slate-900">{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {useTimeRange && (
                      <>
                        <span className="text-xs font-bold text-slate-400 mt-4">s/d</span>
                        <div className="flex-1">
                          <span className="text-[9px] font-bold text-slate-400 block mb-1">Jam Selesai</span>
                          <div className="flex items-center gap-1">
                            <select
                              value={endH}
                              onChange={(e) => setEndH(e.target.value)}
                              className={`flex-1 p-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${inputClass}`}
                            >
                              {HOURS_24.map((h) => (
                                <option key={h} value={h} className="dark:bg-slate-900">{h}</option>
                              ))}
                            </select>
                            <span className="font-black text-xs">:</span>
                            <select
                              value={endM}
                              onChange={(e) => setEndM(e.target.value)}
                              className={`flex-1 p-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${inputClass}`}
                            >
                              {MINUTES_60.map((m) => (
                                <option key={m} value={m} className="dark:bg-slate-900">{m}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 7. Tempat Pelaksanaan (Dropdown Daring/Luring + Deskripsi Singkat) */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="text-xs font-bold block">
                  7. Tempat Pelaksanaan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">Mode Pelaksanaan</span>
                    <select
                      value={locationType}
                      onChange={(e) => setLocationType(e.target.value)}
                      className={`w-full p-3 rounded-xl text-xs font-bold border outline-none cursor-pointer ${inputClass}`}
                    >
                      <option value="Luring" className="dark:bg-slate-900">Luring (Tatap Muka)</option>
                      <option value="Daring" className="dark:bg-slate-900">Daring (Online)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">
                      {locationType === 'Daring'
                        ? 'Platform Daring (Zoom / Google Meet / dll.)'
                        : 'Lokasi Luring (Nama Tempat / Gedung / Daerah)'}
                    </span>
                    <input
                      type="text"
                      value={locationDetail}
                      onChange={(e) => setLocationDetail(e.target.value)}
                      placeholder={
                        locationType === 'Daring'
                          ? 'Contoh: Zoom Meeting / Google Meet / MS Teams'
                          : 'Contoh: Asrama YES Surabaya / Aula Kampus / Taman Kota Bandung'
                      }
                      className={`w-full p-3 rounded-xl text-xs font-semibold border outline-none ${inputClass}`}
                    />
                  </div>
                </div>
              </div>

              {/* 8. Identifikasi Masalah */}
              <div>
                <label className="text-xs font-bold block mb-1.5">
                  8. Identifikasi Masalah <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={problemIdentification}
                  onChange={(e) => setProblemIdentification(e.target.value)}
                  placeholder="Uraikan kendala, hambatan, atau permasalahan yang ditemukan selama pelaksanaan kegiatan (jika berjalan lancar tanpa kendala berarti, jelaskan evaluasi pengamatan)..."
                  className={`w-full p-3 rounded-xl text-xs border outline-none leading-relaxed ${inputClass}`}
                />
              </div>

              {/* 9. Rencana Perbaikan (Bisa per poin) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold">
                    9. Rencana Perbaikan (Perencanaan per Poin) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddImprovementPoint}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                  >
                    + Tambah Poin Baru
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={improvementPlan}
                  onChange={(e) => setImprovementPlan(e.target.value)}
                  placeholder={"1. Melakukan follow-up individu kepada awardee yang berhalangan hadir\n2. Menyiapkan materi pengayaan sebelum sesi dimulai\n3. ..."}
                  className={`w-full p-3 rounded-xl text-xs border outline-none leading-relaxed ${inputClass}`}
                />
              </div>

              {/* 10. Evidence (Input Teks Singkat & Unggah Foto Dokumentasi) */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div>
                  <label className="text-xs font-bold block">
                    10. Evidence / Bukti Dokumentasi <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Bisa diisi berupa keterangan teks singkat/tautan, foto dokumentasi yang diunggah, atau keduanya.
                  </p>
                </div>

                {/* 10a. Input Teks Singkat */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">
                    A. Keterangan Bukti / Link Dokumentasi (Teks Singkat)
                  </span>
                  <input
                    type="text"
                    value={evidenceText}
                    onChange={(e) => setEvidenceText(e.target.value)}
                    placeholder="Contoh: Link Google Drive dokumentasi / Link Postingan IG / Daftar hadir terlampir..."
                    className={`w-full p-3 rounded-xl text-xs font-semibold border outline-none ${inputClass}`}
                  />
                </div>

                {/* 10b. Upload Foto Dokumentasi */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">
                    B. Unggah Foto Dokumentasi Kegiatan
                  </span>
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      type="file"
                      id="journal-evidence-photo"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="journal-evidence-photo"
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 cursor-pointer inline-flex items-center gap-2 transition-all"
                    >
                      <UploadCloud className="w-4 h-4" />
                      {compressingPhoto
                        ? 'Memproses Foto...'
                        : evidencePhoto
                        ? 'Ganti Foto Dokumentasi'
                        : 'Pilih / Unggah Foto'}
                    </label>

                    {evidencePhoto && (
                      <button
                        type="button"
                        onClick={() => {
                          setEvidencePhoto(null);
                          setEvidenceFileName('');
                        }}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
                      >
                        Hapus Foto
                      </button>
                    )}

                    {evidenceFileName && (
                      <span className="text-[11px] font-semibold text-emerald-500 truncate max-w-xs">
                        ✓ {evidenceFileName}
                      </span>
                    )}
                  </div>

                  {evidencePhoto && (
                    <div className="mt-3">
                      <img
                        src={evidencePhoto}
                        alt="Preview Dokumentasi"
                        className="h-36 rounded-xl border border-slate-200 dark:border-slate-700 object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Tombol Batal & Simpan */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/3 py-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || compressingPhoto}
                  className="w-2/3 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-[#0f2942] via-sky-800 to-indigo-700 text-white shadow-lg hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting
                    ? 'Menyimpan Jurnal...'
                    : editingId
                    ? 'Simpan Perubahan Jurnal'
                    : 'Simpan Jurnal Aktivitas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal Preview Foto Dokumentasi */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative max-w-3xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewPhoto(null)}
              className="self-end mb-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" /> Tutup Preview
            </button>
            <img
              src={previewPhoto}
              alt="Bukti Dokumentasi Jurnal"
              className="max-h-[80vh] w-auto rounded-2xl border border-white/20 shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
