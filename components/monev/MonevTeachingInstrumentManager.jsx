"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Plus, Trash2, Edit3, UploadCloud, Download,
  CheckCircle2, AlertCircle, FileSpreadsheet, Layers,
  ChevronDown, ChevronUp, Loader2, Sparkles, X, Check
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

    if (parsedResult.errors && parsedResult.errors.length > 0) {
      const ok = await confirm(
        `Terdapat ${parsedResult.errors.length} catatan/peringatan pada baris Excel. Apakah Anda yakin ingin tetap melanjutkan impor data valid?`,
        'Lanjutkan Impor?'
      );
      if (!ok) return;
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
              <span className="p-2 rounded-2xl bg-blue-500/10 text-blue-500">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black">Pengaturan Instrumen Kompetensi Mengajar</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Kelola master aspek, indikator, dan poin skor pengamatan kualitas mengajar mentor. Anda dapat memperbarui data menggunakan fitur Bulk Import Excel.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setSelectedFile(null);
                setParsedResult(null);
                setImportModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
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
        <div className={`border rounded-3xl p-16 text-center space-y-4 ${card}`}>
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold">Instrumen Masih Kosong</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Belum ada aspek kompetensi mengajar yang terdaftar. Silakan unggah file template melalui tombol Bulk Import Excel.
          </p>
          <button
            onClick={() => {
              setSelectedFile(null);
              setParsedResult(null);
              setImportModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-2xl text-xs font-black bg-blue-600 text-white hover:bg-blue-700 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" /> Buka Modal Bulk Import
          </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-2xl my-auto border rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${card}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <UploadCloud className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black">Bulk Import Instrumen Kompetensi Mengajar</h3>
                  <p className="text-xs text-slate-400">Unggah file spreadsheet Excel berisi aspek dan indikator</p>
                </div>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
              {/* Template Download Box */}
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/15 flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    Belum memiliki template Excel?
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Unduh template resmi dengan kolom: <code className="font-mono font-bold">No, Aspek, Indikator, Skor</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700/60 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Template Excel
                </button>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Pilih File Excel (.xlsx / .xls)
                </label>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer border border-slate-200 dark:border-slate-700 rounded-2xl p-2 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Mode Pengimporan Data:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      importMode === 'REPLACE'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="REPLACE"
                      checked={importMode === 'REPLACE'}
                      onChange={() => setImportMode('REPLACE')}
                      className="text-blue-600 focus:ring-0"
                    />
                    <div>
                      <span className="block font-bold">Ganti Semua Data (Replace)</span>
                      <span className="text-[10px] text-slate-400 block font-normal leading-tight">
                        Menggantikan seluruh instrumen yang ada dengan isi file baru
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      importMode === 'APPEND'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="APPEND"
                      checked={importMode === 'APPEND'}
                      onChange={() => setImportMode('APPEND')}
                      className="text-blue-600 focus:ring-0"
                    />
                    <div>
                      <span className="block font-bold">Tambahkan Data (Append)</span>
                      <span className="text-[10px] text-slate-400 block font-normal leading-tight">
                        Menambahkan aspek & indikator baru di bawah instrumen lama
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Parsing status */}
              {parsingFile && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
                  <p className="font-bold text-slate-600 dark:text-slate-300">
                    Membaca dan memverifikasi baris file Excel...
                  </p>
                </div>
              )}

              {/* Parsed Result Preview */}
              {parsedResult && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      Pratinjau Hasil Pembacaan Excel:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-600">
                      {parsedResult.aspects.length} Aspek · {parsedResult.totalIndicators} Indikator
                    </span>
                  </div>

                  {parsedResult.errors && parsedResult.errors.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] space-y-1">
                      <div className="flex items-center gap-1 font-bold">
                        <AlertCircle className="w-3.5 h-3.5" /> Peringatan Baris Excel:
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {parsedResult.errors.slice(0, 3).map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                        {parsedResult.errors.length > 3 && (
                          <li>Dan {parsedResult.errors.length - 3} catatan lainnya...</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-800/30">
                    {parsedResult.aspects.map((asp, idx) => (
                      <div key={idx} className="text-[11px] space-y-1">
                        <p className="font-black text-blue-600 dark:text-blue-400">
                          {idx + 1}. {asp.title} ({asp.indicators.length} butir)
                        </p>
                        <div className="pl-3 space-y-0.5 text-slate-500 dark:text-slate-400">
                          {asp.indicators.map((ind, iIdx) => (
                            <div key={iIdx} className="flex items-baseline justify-between gap-2">
                              <span className="truncate">• {ind.title}</span>
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
                                +{ind.score}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-end gap-2 bg-slate-50/70 dark:bg-slate-800/50">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitImport}
                disabled={!parsedResult || submittingImport}
                className="px-5 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                {submittingImport ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Terapkan Import Excel
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
