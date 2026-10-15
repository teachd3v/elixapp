"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass, Plus, Trash2, Edit3, UploadCloud, Download,
  CheckCircle2, AlertCircle, FileSpreadsheet, Layers,
  ChevronDown, ChevronUp, Loader2, Sparkles, X, Check,
  Building2, HelpCircle, Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useDialog } from '../DialogProvider';
import { parseObservationExcelRows } from '../../lib/monev';
import { exportMonevObservationTemplate } from '../../lib/exportExcel';

export default function MonevObservationInstrumentManager({ darkMode }) {
  const { confirm, alert } = useDialog();

  const [aspects, setAspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'SECTION_A' | 'SECTION_B'

  // Bulk import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [importMode, setImportMode] = useState('REPLACE');
  const [submittingImport, setSubmittingImport] = useState(false);

  // Manual Aspect Modal
  const [aspectModalOpen, setAspectModalOpen] = useState(false);
  const [editingAspect, setEditingAspect] = useState(null);
  const [aspectSection, setAspectSection] = useState('SECTION_A');
  const [aspectTitle, setAspectTitle] = useState('');
  const [aspectDescription, setAspectDescription] = useState('');
  const [savingAspect, setSavingAspect] = useState(false);

  // Manual Indicator Modal
  const [indicatorModalOpen, setIndicatorModalOpen] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [targetAspectId, setTargetAspectId] = useState('');
  const [indicatorTitle, setIndicatorTitle] = useState('');
  const [indicatorGuide, setIndicatorGuide] = useState('');
  const [savingIndicator, setSavingIndicator] = useState(false);

  // Accordion state
  const [openAspects, setOpenAspects] = useState({});

  const card = darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm';

  const loadAspects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/monev/observation-aspects');
      if (!res.ok) throw new Error('Gagal memuat master instrumen observasi');
      const data = await res.json();
      setAspects(data || []);

      // Auto-open all aspects initially
      const initOpen = {};
      (data || []).forEach((a) => {
        initOpen[a.id] = true;
      });
      setOpenAspects(initOpen);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAspects();
  }, []);

  const totalMetrics = useMemo(() => {
    let indCount = 0;
    let secACount = 0;
    let secBCount = 0;
    for (const a of aspects) {
      indCount += (a.indicators || []).length;
      if (a.section === 'SECTION_B') {
        secBCount++;
      } else {
        secACount++;
      }
    }
    return {
      totalAspects: aspects.length,
      secACount,
      secBCount,
      totalIndicators: indCount,
    };
  }, [aspects]);

  const filteredAspects = useMemo(() => {
    if (activeFilter === 'SECTION_A') {
      return aspects.filter((a) => a.section !== 'SECTION_B');
    }
    if (activeFilter === 'SECTION_B') {
      return aspects.filter((a) => a.section === 'SECTION_B');
    }
    return aspects;
  }, [aspects, activeFilter]);

  const toggleAspect = (id) => {
    setOpenAspects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Seed default template handler
  const handleSeedDefault = async () => {
    const ok = await confirm(
      'Apakah kamu yakin ingin memuat 6 aspek standar observasi wilayah bawaan YES? Instrumen saat ini akan ditimpa dengan template standar.',
      'Muat Template Bawaan'
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/monev/observation-aspects/seed', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat template');

      await alert(data.message || 'Template standar berhasil dimuat!', 'Berhasil', 'success');
      await loadAspects();
    } catch (err) {
      await alert(err.message || 'Terjadi kesalahan sistem.', 'Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Download template handler
  const handleDownloadTemplate = () => {
    try {
      exportMonevObservationTemplate('Template_Instrumen_Observasi_Wilayah.xlsx');
    } catch (err) {
      console.error(err);
      alert('Gagal mengunduh template Excel.', 'Error', 'error');
    }
  };

  // Process Excel File for Bulk Import
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
          workbook.SheetNames.find(
            (s) =>
              s.toLowerCase().includes('instrumen') ||
              s.toLowerCase().includes('observasi') ||
              s.toLowerCase().includes('wilayah')
          ) || workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
          throw new Error('Lembar kerja (sheet) tidak ditemukan dalam file Excel.');
        }

        const jsonRows = XLSX.utils.sheet_to_json(sheet);
        const parsed = parseObservationExcelRows(jsonRows);
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

  const handleExecuteImport = async () => {
    if (!parsedResult || !parsedResult.aspects?.length) {
      await alert('Tidak ada data aspek yang valid untuk diimpor.', 'Validasi', 'error');
      return;
    }

    setSubmittingImport(true);
    try {
      const res = await fetch('/api/admin/monev/observation-aspects/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: importMode,
          aspects: parsedResult.aspects,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengimpor instrumen.');

      await alert(data.message || 'Berhasil mengimpor instrumen observasi wilayah.', 'Sukses', 'success');
      setImportModalOpen(false);
      setSelectedFile(null);
      setParsedResult(null);
      await loadAspects();
    } catch (err) {
      await alert(err.message || 'Gagal mengimpor.', 'Error', 'error');
    } finally {
      setSubmittingImport(false);
    }
  };

  // Open modal create aspect
  const handleOpenAddAspect = () => {
    setEditingAspect(null);
    setAspectSection('SECTION_A');
    setAspectTitle('');
    setAspectDescription('');
    setAspectModalOpen(true);
  };

  // Open modal edit aspect
  const handleOpenEditAspect = (asp) => {
    setEditingAspect(asp);
    setAspectSection(asp.section || 'SECTION_A');
    setAspectTitle(asp.title || '');
    setAspectDescription(asp.description || '');
    setAspectModalOpen(true);
  };

  // Save Aspect
  const handleSaveAspect = async (e) => {
    e.preventDefault();
    if (!aspectTitle.trim()) {
      await alert('Judul aspek wajib diisi.', 'Validasi', 'error');
      return;
    }

    setSavingAspect(true);
    try {
      if (editingAspect) {
        const res = await fetch('/api/admin/monev/observation-aspects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ASPECT',
            id: editingAspect.id,
            section: aspectSection,
            title: aspectTitle.trim(),
            description: aspectDescription.trim() || null,
          }),
        });
        if (!res.ok) throw new Error('Gagal memperbarui aspek');
      } else {
        const res = await fetch('/api/admin/monev/observation-aspects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ASPECT',
            section: aspectSection,
            title: aspectTitle.trim(),
            description: aspectDescription.trim() || null,
          }),
        });
        if (!res.ok) throw new Error('Gagal menambahkan aspek');
      }

      setAspectModalOpen(false);
      await loadAspects();
    } catch (err) {
      await alert(err.message || 'Gagal menyimpan aspek.', 'Error', 'error');
    } finally {
      setSavingAspect(false);
    }
  };

  // Delete Aspect
  const handleDeleteAspect = async (asp) => {
    const ok = await confirm(
      `Apakah kamu yakin ingin menghapus aspek "${asp.title}"? Semua butir panduan di dalamnya juga akan terhapus.`,
      'Hapus Aspek Observasi'
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/monev/observation-aspects?type=aspect&id=${asp.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus aspek');
      await loadAspects();
    } catch (err) {
      await alert(err.message || 'Gagal menghapus.', 'Error', 'error');
    }
  };

  // Open modal create indicator
  const handleOpenAddIndicator = (aspId = '') => {
    setEditingIndicator(null);
    setTargetAspectId(aspId || (aspects[0]?.id || ''));
    setIndicatorTitle('');
    setIndicatorGuide('');
    setIndicatorModalOpen(true);
  };

  // Open modal edit indicator
  const handleOpenEditIndicator = (ind) => {
    setEditingIndicator(ind);
    setTargetAspectId(ind.aspectId);
    setIndicatorTitle(ind.title || '');
    setIndicatorGuide(ind.guideNotes || '');
    setIndicatorModalOpen(true);
  };

  // Save Indicator
  const handleSaveIndicator = async (e) => {
    e.preventDefault();
    if (!targetAspectId) {
      await alert('Silakan pilih aspek terlebih dahulu.', 'Validasi', 'error');
      return;
    }
    if (!indicatorTitle.trim()) {
      await alert('Judul indikator / panduan wajib diisi.', 'Validasi', 'error');
      return;
    }

    setSavingIndicator(true);
    try {
      if (editingIndicator) {
        const res = await fetch('/api/admin/monev/observation-aspects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'INDICATOR',
            id: editingIndicator.id,
            title: indicatorTitle.trim(),
            guideNotes: indicatorGuide.trim() || null,
          }),
        });
        if (!res.ok) throw new Error('Gagal memperbarui indikator');
      } else {
        const res = await fetch('/api/admin/monev/observation-aspects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'INDICATOR',
            aspectId: targetAspectId,
            title: indicatorTitle.trim(),
            guideNotes: indicatorGuide.trim() || null,
          }),
        });
        if (!res.ok) throw new Error('Gagal menambahkan indikator');
      }

      setIndicatorModalOpen(false);
      await loadAspects();
    } catch (err) {
      await alert(err.message || 'Gagal menyimpan butir panduan.', 'Error', 'error');
    } finally {
      setSavingIndicator(false);
    }
  };

  // Delete Indicator
  const handleDeleteIndicator = async (ind) => {
    const ok = await confirm(
      `Apakah kamu yakin ingin menghapus butir panduan "${ind.title}"?`,
      'Hapus Butir Panduan'
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/monev/observation-aspects?type=indicator&id=${ind.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus butir panduan');
      await loadAspects();
    } catch (err) {
      await alert(err.message || 'Gagal menghapus.', 'Error', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION & METRICS */}
      <div className={`border rounded-3xl p-6 ${card}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">Pengaturan Instrumen Observasi Wilayah</h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Instrumen 3
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Konfigurasi aspek & panduan observasi wilayah: <strong>Bagian A (Perkembangan Program)</strong> untuk analisis kualitatif esai, dan <strong>Bagian B (Kategori Target & Temuan)</strong> sebagai acuan kendala serta rekomendasi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenAddAspect}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-sm hover:brightness-105 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Aspek
            </button>

            <button
              onClick={() => handleOpenAddIndicator()}
              disabled={aspects.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5 text-amber-500" />
              Tambah Panduan
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
              title="Unduh Template Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              Unduh Excel
            </button>

            <button
              onClick={() => {
                setSelectedFile(null);
                setParsedResult(null);
                setImportModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
              title="Bulk Import Excel"
            >
              <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
              Import Excel
            </button>

            <button
              onClick={handleSeedDefault}
              className="px-3 py-2 rounded-xl border border-amber-300/60 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-xs font-black flex items-center gap-1.5 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-all cursor-pointer"
              title="Muat 6 Aspek Standar Bawaan YES"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Template Bawaan
            </button>
          </div>
        </div>

        {/* METRICS & FILTER TABS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5">Total Aspek Master</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black">{totalMetrics.totalAspects}</span>
              <span className="text-[11px] text-slate-400 font-semibold">Aspek</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <span className="text-[11px] font-bold text-blue-500/80 block mb-0.5">Bagian A: Perkembangan</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalMetrics.secACount}</span>
              <span className="text-[11px] text-blue-500/80 font-semibold">Aspek</span>
            </div>
          </div>

          <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/30">
            <span className="text-[11px] font-bold text-purple-500/80 block mb-0.5">Bagian B: Kategori Target</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalMetrics.secBCount}</span>
              <span className="text-[11px] text-purple-500/80 font-semibold">Aspek</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
            <span className="text-[11px] font-bold text-emerald-500/80 block mb-0.5">Total Poin Panduan</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalMetrics.totalIndicators}</span>
              <span className="text-[11px] text-emerald-500/80 font-semibold">Butir Panduan</span>
            </div>
          </div>
        </div>

        {/* FILTER TOGGLE BUTTONS */}
        <div className="flex items-center gap-1.5 mt-4">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Semua Bagian ({aspects.length})
          </button>
          <button
            onClick={() => setActiveFilter('SECTION_A')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'SECTION_A'
                ? 'bg-blue-600 text-white font-black shadow-sm shadow-blue-500/20'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Bagian A: Perkembangan Program ({totalMetrics.secACount})
          </button>
          <button
            onClick={() => setActiveFilter('SECTION_B')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'SECTION_B'
                ? 'bg-purple-600 text-white font-black shadow-sm shadow-purple-500/20'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Bagian B: Kategori Target & Temuan ({totalMetrics.secBCount})
          </button>
        </div>
      </div>

      {/* LIST OF OBSERVATION ASPECTS */}
      {loading ? (
        <div className={`p-12 text-center rounded-3xl border ${card}`}>
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-semibold">Memuat master instrumen observasi wilayah...</p>
        </div>
      ) : aspects.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${card}`}>
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black mb-1">Belum Ada Aspek Observasi Wilayah</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Mulai atur butir instrumen pengamatan dengan memuat template standar 6 aspek YES atau menambah aspek secara manual.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleSeedDefault}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-sm hover:brightness-105 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Muat Template Bawaan YES
            </button>
            <button
              onClick={handleOpenAddAspect}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              + Buat Manual
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAspects.map((asp, idx) => {
            const isOpen = !!openAspects[asp.id];
            const isSecB = asp.section === 'SECTION_B';

            return (
              <div
                key={asp.id}
                className={`border rounded-3xl transition-all overflow-hidden ${card}`}
              >
                {/* ASPECT HEADER ACCORDION */}
                <div
                  onClick={() => toggleAspect(asp.id)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
                        isSecB
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {asp.order || idx + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isSecB
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {isSecB ? 'Bagian B: Kategori Target' : 'Bagian A: Perkembangan Program'}
                        </span>
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                          {asp.title}
                        </h4>
                      </div>
                      {asp.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {asp.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {asp.indicators?.length || 0} Panduan
                    </span>

                    <button
                      onClick={() => handleOpenAddIndicator(asp.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                      title="Tambah Panduan ke Aspek ini"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEditAspect(asp)}
                      className="p-2 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                      title="Edit Aspek"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteAspect(asp)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Hapus Aspek"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />

                    <button
                      onClick={() => toggleAspect(asp.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* INDICATORS LIST */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/40 space-y-2">
                    {(!asp.indicators || asp.indicators.length === 0) ? (
                      <div className="py-6 text-center">
                        <p className="text-xs text-slate-400 italic mb-2">Belum ada butir panduan pengamatan pada aspek ini.</p>
                        <button
                          onClick={() => handleOpenAddIndicator(asp.id)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black hover:bg-amber-500/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Tambah Panduan Pertama
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {asp.indicators.map((ind, indIdx) => (
                          <div
                            key={ind.id}
                            className="py-3 flex items-start justify-between gap-3 group"
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <span className="text-[11px] font-black text-slate-400 mt-0.5 shrink-0">
                                {asp.order || idx + 1}.{ind.order || indIdx + 1}
                              </span>
                              <div className="space-y-1 min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                                  {ind.title}
                                </p>
                                {ind.guideNotes && (
                                  <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed flex items-start gap-1.5">
                                    <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                    <span>
                                      <strong>Petunjuk Pengamatan:</strong> {ind.guideNotes}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditIndicator(ind)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                                title="Edit Panduan"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteIndicator(ind)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                title="Hapus Panduan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT ASPEK */}
      {aspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl space-y-5 ${card}`}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {editingAspect ? 'Edit Aspek Observasi' : 'Tambah Aspek Observasi Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pilih penempatan Bagian A (Perkembangan) atau Bagian B (Kategori Target).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAspectModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAspect} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Bagian Penempatan Aspek
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectSection('SECTION_A')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      aspectSection === 'SECTION_A'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-xs font-black block">Bagian A</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Perkembangan Program (Esai & Analisis)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAspectSection('SECTION_B')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      aspectSection === 'SECTION_B'
                        ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-xs font-black block">Bagian B</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Kategori Target / Temuan Kendala
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Judul Aspek Observasi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={aspectTitle}
                  onChange={(e) => setAspectTitle(e.target.value)}
                  placeholder="Contoh: Realisasi Pelaksanaan Program atau Target Capaian Akademik"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Deskripsi / Keterangan Aspek (Opsional)
                </label>
                <textarea
                  value={aspectDescription}
                  onChange={(e) => setAspectDescription(e.target.value)}
                  placeholder="Deskripsi singkat mengenai fokus pengamatan pada aspek ini..."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAspectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAspect}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black shadow-md hover:brightness-105 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {savingAspect ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingAspect ? 'Simpan Perubahan' : 'Tambah Aspek'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT INDIKATOR PANDUAN */}
      {indicatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl space-y-5 ${card}`}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {editingIndicator ? 'Edit Poin Panduan Observasi' : 'Tambah Poin Panduan Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Petunjuk operasional yang akan diobservasi observer di lapangan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIndicatorModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIndicator} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Pilih Aspek Induk <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetAspectId}
                  onChange={(e) => setTargetAspectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  required
                >
                  {aspects.map((asp) => (
                    <option key={asp.id} value={asp.id}>
                      [{asp.section === 'SECTION_B' ? 'Bagian B' : 'Bagian A'}] {asp.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Judul Indikator / Poin Panduan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={indicatorTitle}
                  onChange={(e) => setIndicatorTitle(e.target.value)}
                  placeholder="Contoh: Kesesuaian Kurikulum & Jadwal Pembinaan Wilayah..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Petunjuk Pengamatan Bagi Observer (Opsional)
                </label>
                <textarea
                  value={indicatorGuide}
                  onChange={(e) => setIndicatorGuide(e.target.value)}
                  placeholder="Contoh panduan teknis: Amati kesesuaian modul pembinaan bulanan dengan timeline kurikulum YES..."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIndicatorModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingIndicator}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black shadow-md hover:brightness-105 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {savingIndicator ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingIndicator ? 'Simpan Perubahan' : 'Tambah Panduan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BULK IMPORT EXCEL */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-2xl rounded-3xl border p-6 shadow-2xl space-y-5 ${card}`}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Bulk Import Instrumen Observasi Wilayah</h3>
                  <p className="text-[11px] text-slate-400">
                    Impor master aspek & butir panduan pengamatan sekaligus dari template file Excel (.xlsx).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* DRAG AND DROP / FILE SELECTOR */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-3xl p-6 text-center transition-all bg-slate-50/50 dark:bg-slate-800/30">
                <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {selectedFile ? selectedFile.name : 'Pilih atau Tarik File Excel ke Sini'}
                </p>
                <p className="text-[11px] text-slate-400 mb-4">Format file yang didukung: .xlsx</p>
                <label className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors inline-block">
                  Cari File Excel
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {parsingFile && (
                <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Membaca dan memverifikasi baris file Excel...
                </div>
              )}

              {/* PARSED PREVIEW */}
              {parsedResult && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>
                        Terdeteksi <strong>{parsedResult.aspects?.length || 0} Aspek</strong> dan{' '}
                        <strong>{parsedResult.totalIndicators || 0} Butir Panduan</strong>.
                      </span>
                    </div>
                  </div>

                  {parsedResult.errors?.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300 space-y-1 max-h-32 overflow-y-auto">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        Peringatan Validasi:
                      </div>
                      <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                        {parsedResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* MODE PILIHAN */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                      Metode Impor Data:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                        <input
                          type="radio"
                          name="importMode"
                          value="REPLACE"
                          checked={importMode === 'REPLACE'}
                          onChange={() => setImportMode('REPLACE')}
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span>
                          <strong>Ganti Total (Replace)</strong>
                          <span className="block text-[10px] text-slate-400">
                            Hapus instrumen saat ini & ganti baru
                          </span>
                        </span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                        <input
                          type="radio"
                          name="importMode"
                          value="APPEND"
                          checked={importMode === 'APPEND'}
                          onChange={() => setImportMode('APPEND')}
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span>
                          <strong>Tambahkan (Append)</strong>
                          <span className="block text-[10px] text-slate-400">
                            Pertahankan yang ada & gabung
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Belum punya format? Unduh Template Excel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImportModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={!parsedResult || !parsedResult.aspects?.length || submittingImport}
                    onClick={handleExecuteImport}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black shadow-md hover:brightness-105 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {submittingImport ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    Mulai Impor Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
