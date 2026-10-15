"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Plus, Trash2, Edit3, UploadCloud, Download,
  CheckCircle2, AlertCircle, FileSpreadsheet, Layers,
  ChevronDown, ChevronUp, Loader2, Sparkles, X, Check, FileUp
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useDialog } from '../DialogProvider';
import { parseExcelTeachingPlans } from '../../lib/monev';
import { exportMonevTeachingTemplate } from '../../lib/exportExcel';

export default function MonevTeachingInstrumentManager({ darkMode }) {
  const { confirm, alert } = useDialog();

  const [aspects, setAspects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bulk import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [importMode, setImportMode] = useState('REPLACE');
  const [submittingImport, setSubmittingImport] = useState(false);

  // Manual Edit Modal states (for quick typos/fixes)
  const [aspectModalOpen, setAspectModalOpen] = useState(false);
  const [editingAspect, setEditingAspect] = useState(null);
  const [aspectTitle, setAspectTitle] = useState('');

  const [indicatorModalOpen, setIndicatorModalOpen] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [selectedAspectId, setSelectedAspectId] = useState('');
  const [indicatorTitle, setIndicatorTitle] = useState('');
  const [indicatorScore, setIndicatorScore] = useState('4.0');
  const [savingIndicator, setSavingIndicator] = useState(false);

  const loadAspects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/monev/teaching-plans');
      if (!res.ok) throw new Error('Gagal memuat master instrumen');
      const data = await res.json();
      setAspects(data || []);
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
    let scoreSum = 0;
    for (const a of aspects) {
      for (const ind of a.indicators || []) {
        indCount++;
        scoreSum += Number(ind.score) || 0;
      }
    }
    return {
      totalAspects: aspects.length,
      totalIndicators: indCount,
      totalScore: Math.round(scoreSum * 10) / 10,
    };
  }, [aspects]);

  // Bulk import handlers
  const handleDownloadTemplate = () => {
    try {
      exportMonevTeachingTemplate('Template_Instrumen_Kompetensi_Mengajar.xlsx');
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
        const parsed = parseExcelTeachingPlans(jsonRows);
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
    if (!parsedResult || !parsedResult.aspects || parsedResult.aspects.length === 0) {
      await alert('Tidak ada data aspek yang valid untuk diimpor.', 'Perhatian', 'warning');
      return;
    }

    setSubmittingImport(true);
    try {
      const res = await fetch('/api/admin/monev/teaching-plans/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: importMode,
          aspects: parsedResult.aspects,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengimpor file Excel');

      await alert(data.message || 'Bulk import berhasil disimpan.', 'Berhasil', 'success');
      setImportModalOpen(false);
      setSelectedFile(null);
      setParsedResult(null);
      loadAspects();
    } catch (err) {
      await alert(err.message || 'Terjadi kesalahan saat impor.', 'Gagal', 'error');
    } finally {
      setSubmittingImport(false);
    }
  };

  // Manual Aspect Save
  const handleSaveAspect = async (e) => {
    e.preventDefault();
    if (!aspectTitle.trim()) return;

    try {
      if (editingAspect) {
        const res = await fetch(`/api/admin/monev/teaching-plans/${editingAspect.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'ASPECT', title: aspectTitle.trim() }),
        });
        if (!res.ok) throw new Error('Gagal memperbarui aspek');
      } else {
        const res = await fetch('/api/admin/monev/teaching-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'ASPECT', aspectTitle: aspectTitle.trim() }),
        });
        if (!res.ok) throw new Error('Gagal menambah aspek');
      }
      setAspectModalOpen(false);
      setAspectTitle('');
      setEditingAspect(null);
      loadAspects();
    } catch (err) {
      await alert(err.message, 'Error', 'error');
    }
  };

  // Delete Aspect
  const handleDeleteAspect = async (id, title) => {
    const ok = await confirm(
      `Hapus aspek "${title}" beserta seluruh butir indikator di dalamnya?`,
      'Konfirmasi Hapus Aspek'
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/monev/teaching-plans/${id}?type=ASPECT`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus aspek');
      await alert('Aspek berhasil dihapus.', 'Berhasil', 'success');
      loadAspects();
    } catch (err) {
      await alert(err.message, 'Error', 'error');
    }
  };

  // Manual Indicator Save
  const handleSaveIndicator = async (e) => {
    e.preventDefault();
    if (!indicatorTitle.trim() || !selectedAspectId) return;

    setSavingIndicator(true);
    try {
      if (editingIndicator) {
        const res = await fetch(`/api/admin/monev/teaching-plans/${editingIndicator.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'INDICATOR',
            title: indicatorTitle.trim(),
            score: Number(indicatorScore),
          }),
        });
        if (!res.ok) throw new Error('Gagal memperbarui indikator');
      } else {
        const res = await fetch('/api/admin/monev/teaching-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'INDICATOR',
            aspectId: selectedAspectId,
            indicatorTitle: indicatorTitle.trim(),
            score: Number(indicatorScore),
          }),
        });
        if (!res.ok) throw new Error('Gagal menambah indikator');
      }
      setIndicatorModalOpen(false);
      setEditingIndicator(null);
      loadAspects();
    } catch (err) {
      await alert(err.message, 'Error', 'error');
    } finally {
      setSavingIndicator(false);
    }
  };

  // Delete Indicator
  const handleDeleteIndicator = async (id, title) => {
    const ok = await confirm(`Hapus indikator "${title}"?`, 'Konfirmasi Hapus');
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/monev/teaching-plans/${id}?type=INDICATOR`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus indikator');
      await alert('Indikator berhasil dihapus.', 'Berhasil', 'success');
      loadAspects();
    } catch (err) {
      await alert(err.message, 'Error', 'error');
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const subCard = darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80';
  const inputClass = darkMode
    ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-500'
    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500';

  return (
    <div className="space-y-6">
      {/* HEADER & SUMMARY BAR */}
      <div className={`border rounded-3xl p-6 ${card}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black">Pengaturan Instrumen Kompetensi Mengajar</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Kelola master aspek, indikator, dan poin skor pengamatan kualitas mengajar mentor melalui fitur Bulk Import Excel.
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

        {/* METRICS STRIP */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Total Aspek</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">{totalMetrics.totalAspects}</span>
              <span className="text-xs text-slate-400 font-semibold">Grup</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Total Indikator</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">{totalMetrics.totalIndicators}</span>
              <span className="text-xs text-slate-400 font-semibold">Butir</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Total Skor Maksimal</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-blue-500 font-mono">{totalMetrics.totalScore}</span>
              <span className="text-xs text-blue-600/70 font-semibold">Poin</span>
            </div>
          </div>
        </div>
      </div>

      {/* MASTER DATA TABLE */}
      {loading ? (
        <div className={`border rounded-3xl p-16 flex flex-col items-center justify-center gap-3 ${card}`}>
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs font-bold text-slate-400">Memuat master instrumen kompetensi mengajar...</p>
        </div>
      ) : aspects.length === 0 ? (
        <div className={`border rounded-3xl p-12 text-center space-y-4 ${card}`}>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black">Belum Ada Instrumen Kompetensi Mengajar</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Gunakan fitur <strong>Bulk Import Excel</strong> untuk memasukkan master aspek dan indikator penilaian sekaligus. Template Excel resmi dapat diunduh langsung di dalam menu import.
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
              <FileUp className="w-4 h-4" /> Unggah &amp; Bulk Import Excel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {aspects.map((aspect, aIdx) => (
            <div key={aspect.id} className={`border rounded-3xl overflow-hidden ${card}`}>
              {/* Aspect Header */}
              <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-xs flex items-center justify-center shrink-0">
                    {aIdx + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Aspek Kompetensi
                    </span>
                    <h3 className="font-black text-sm truncate">{aspect.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                    {aspect.indicators?.length || 0} Indikator
                  </span>
                  <button
                    onClick={() => {
                      setEditingAspect(aspect);
                      setAspectTitle(aspect.title);
                      setAspectModalOpen(true);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                    title="Ubah Nama Aspek"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteAspect(aspect.id, aspect.title)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Hapus Aspek"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Indicators Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4">Butir Indikator Kompetensi</th>
                      <th className="py-3 px-4 w-28 text-center">Poin Skor</th>
                      <th className="py-3 px-4 w-24 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {aspect.indicators && aspect.indicators.length > 0 ? (
                      aspect.indicators.map((ind, iIdx) => (
                        <tr
                          key={ind.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-3 px-4 text-center font-mono text-slate-400 font-bold">
                            {iIdx + 1}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                            {ind.title}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                              +{Number(ind.score).toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingIndicator(ind);
                                  setSelectedAspectId(aspect.id);
                                  setIndicatorTitle(ind.title);
                                  setIndicatorScore(String(ind.score));
                                  setIndicatorModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Edit Indikator"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteIndicator(ind.id, ind.title)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Hapus Indikator"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-xs text-slate-400 italic">
                          Belum ada butir indikator pada aspek ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: BULK IMPORT EXCEL */}
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
                  <h3 className="text-base font-black">Bulk Import Instrumen Kompetensi Mengajar</h3>
                  <p className="text-[11px] text-slate-400">
                    Impor master aspek dan butir indikator melalui spreadsheet Excel (.xlsx, .xls)
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
                  Gunakan format kolom: <strong>No</strong>, <strong>Aspek</strong>, <strong>Indikator</strong>, dan <strong>Skor</strong>.
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

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[10px] text-slate-400 block">Total Aspek Terdeteksi</span>
                      <span className="text-base font-black text-amber-500">
                        {parsedResult.aspects.length} Aspek
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[10px] text-slate-400 block">Total Indikator</span>
                      <span className="text-base font-black text-sky-500">
                        {parsedResult.totalIndicators} Indikator
                      </span>
                    </div>
                  </div>

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
                          Gabungkan aspek & indikator baru di akhir daftar master
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
                disabled={!parsedResult || !parsedResult.aspects?.length || submittingImport}
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

      {/* MODAL 2: EDIT ASPEK TITLE */}
      {aspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md border rounded-3xl p-6 shadow-2xl relative space-y-4 ${card}`}>
            <h3 className="text-base font-black">
              {editingAspect ? 'Ubah Nama Aspek' : 'Tambah Aspek Baru'}
            </h3>
            <form onSubmit={handleSaveAspect} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Nama Aspek</label>
                <input
                  type="text"
                  required
                  value={aspectTitle}
                  onChange={(e) => setAspectTitle(e.target.value)}
                  placeholder="Contoh: Penguasaan Materi & Kurikulum"
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-bold ${inputClass}`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAspectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT INDIKATOR */}
      {indicatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md border rounded-3xl p-6 shadow-2xl relative space-y-4 ${card}`}>
            <h3 className="text-base font-black">
              {editingIndicator ? 'Edit Butir Indikator' : 'Tambah Indikator'}
            </h3>
            <form onSubmit={handleSaveIndicator} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Teks Butir Indikator
                </label>
                <textarea
                  required
                  rows={3}
                  value={indicatorTitle}
                  onChange={(e) => setIndicatorTitle(e.target.value)}
                  placeholder="Deskripsi butir indikator yang diamati..."
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-medium ${inputClass}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Poin Skor Jika Tercapai
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={indicatorScore}
                  onChange={(e) => setIndicatorScore(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-mono font-bold ${inputClass}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIndicatorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingIndicator}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                >
                  {savingIndicator ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
