"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle, Plus, Trash2, Edit3, UploadCloud, Download,
  CheckCircle2, AlertCircle, FileSpreadsheet, Layers,
  ChevronDown, ChevronUp, Loader2, Sparkles, X, Check,
  MessageSquare, UserCheck, FileUp
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useDialog } from '../DialogProvider';
import { parseInterviewExcelRows } from '../../lib/monev';
import { exportMonevInterviewTemplate } from '../../lib/exportExcel';

export default function MonevInterviewInstrumentManager({ darkMode }) {
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

  // Manual Modals
  const [aspectModalOpen, setAspectModalOpen] = useState(false);
  const [aspectName, setAspectName] = useState('');
  const [aspectDescription, setAspectDescription] = useState('');

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [targetAspectId, setTargetAspectId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionGuide, setQuestionGuide] = useState('');
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Accordion open/close state
  const [openAspects, setOpenAspects] = useState({});

  const loadAspects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/monev/interview-questions');
      if (!res.ok) throw new Error('Gagal memuat master instrumen');
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
    let qCount = 0;
    for (const a of aspects) {
      qCount += (a.questions || []).length;
    }
    return {
      totalAspects: aspects.length,
      totalQuestions: qCount,
    };
  }, [aspects]);

  const toggleAspect = (id) => {
    setOpenAspects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Seed default template handler
  const handleSeedDefault = async () => {
    const ok = await confirm(
      'Apakah kamu yakin ingin memuat 6 aspek standar wawancara bawaan YES? Instrumen saat ini akan diperbarui dengan template standar.',
      'Muat Template Bawaan'
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/monev/interview-questions/seed', {
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

  // Bulk import handlers
  const handleDownloadTemplate = () => {
    try {
      exportMonevInterviewTemplate('Template_Instrumen_Wawancara_Awardee.xlsx');
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
          workbook.SheetNames.find((s) => s.toLowerCase().includes('instrumen') || s.toLowerCase().includes('wawancara')) ||
          workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
          throw new Error('Lembar kerja (sheet) tidak ditemukan dalam file Excel.');
        }

        const jsonRows = XLSX.utils.sheet_to_json(sheet);
        const parsed = parseInterviewExcelRows(jsonRows);
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
      await alert('Tidak ada data pertanyaan yang valid untuk diimpor.', 'Validasi', 'error');
      return;
    }

    setSubmittingImport(true);
    try {
      const res = await fetch('/api/admin/monev/interview-questions/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: importMode,
          aspects: parsedResult.aspects,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data import.');

      await alert(data.message || 'Bulk import berhasil disimpan!', 'Import Berhasil', 'success');
      setImportModalOpen(false);
      setSelectedFile(null);
      setParsedResult(null);
      await loadAspects();
    } catch (err) {
      await alert(err.message || 'Terjadi kesalahan saat menyimpan import.', 'Error', 'error');
    } finally {
      setSubmittingImport(false);
    }
  };

  // Add Aspect manually
  const handleSaveAspect = async () => {
    if (!aspectName.trim()) {
      await alert('Nama Aspek wajib diisi.', 'Validasi', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/monev/interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ASPECT',
          name: aspectName.trim(),
          description: aspectDescription.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan aspek.');

      await alert('Aspek wawancara berhasil ditambahkan.', 'Berhasil', 'success');
      setAspectModalOpen(false);
      setAspectName('');
      setAspectDescription('');
      await loadAspects();
    } catch (err) {
      await alert(err.message || 'Terjadi error.', 'Error', 'error');
    }
  };

  // Add Question manually
  const handleSaveQuestion = async () => {
    if (!targetAspectId) {
      await alert('Pilih aspek terlebih dahulu.', 'Validasi', 'error');
      return;
    }
    if (!questionText.trim()) {
      await alert('Teks pertanyaan wajib diisi.', 'Validasi', 'error');
      return;
    }

    setSavingQuestion(true);
    try {
      const res = await fetch('/api/admin/monev/interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'QUESTION',
          aspectId: targetAspectId,
          question: questionText.trim(),
          guideNotes: questionGuide.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pertanyaan.');

      await alert('Pertanyaan wawancara berhasil ditambahkan.', 'Berhasil', 'success');
      setQuestionModalOpen(false);
      setQuestionText('');
      setQuestionGuide('');
      await loadAspects();
    } catch (err) {
      await alert(err.message || 'Terjadi error.', 'Error', 'error');
    } finally {
      setSavingQuestion(false);
    }
  };

  // Delete Aspect
  const handleDeleteAspect = async (aspectId, name) => {
    const ok = await confirm(
      `Apakah kamu yakin ingin menghapus aspek "${name}" beserta seluruh pertanyaan di dalamnya?`,
      'Hapus Aspek Wawancara'
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/monev/interview-questions?type=aspect&id=${aspectId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus aspek');

      setAspects((prev) => prev.filter((a) => a.id !== aspectId));
      await alert('Aspek berhasil dihapus.', 'Berhasil', 'success');
    } catch (err) {
      await alert(err.message || 'Error saat menghapus', 'Error', 'error');
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (questionId) => {
    const ok = await confirm(
      'Apakah kamu yakin ingin menghapus butir pertanyaan ini?',
      'Hapus Pertanyaan'
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/monev/interview-questions?type=question&id=${questionId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus pertanyaan');

      setAspects((prev) =>
        prev.map((a) => ({
          ...a,
          questions: (a.questions || []).filter((q) => q.id !== questionId),
        }))
      );
      await alert('Pertanyaan berhasil dihapus.', 'Berhasil', 'success');
    } catch (err) {
      await alert(err.message || 'Error saat menghapus', 'Error', 'error');
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const subCard = darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80';
  const inputClass = darkMode
    ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
    : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500';

  return (
    <div className="space-y-6">
      {/* HEADER & TOP ACTION BAR */}
      <div className={`border rounded-3xl p-6 ${card}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black">Pengaturan Instrumen Wawancara Awardee</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Kelola master aspek dan butir pertanyaan indepth interview awardee melalui fitur Bulk Import Excel.
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
        <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Total Aspek Wawancara</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">{totalMetrics.totalAspects}</span>
              <span className="text-xs text-slate-400 font-semibold">Aspek</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Total Butir Pertanyaan</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-500">{totalMetrics.totalQuestions}</span>
              <span className="text-xs text-slate-400 font-semibold">Pertanyaan</span>
            </div>
          </div>
        </div>
      </div>

      {/* ASPECT ACCORDION LIST */}
      {loading ? (
        <div className={`p-12 text-center border rounded-3xl ${card}`}>
          <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-semibold">Memuat daftar instrumen wawancara...</p>
        </div>
      ) : aspects.length === 0 ? (
        <div className={`border rounded-3xl p-12 text-center space-y-4 ${card}`}>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black">Belum Ada Instrumen Wawancara Awardee</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Gunakan fitur <strong>Bulk Import Excel</strong> untuk memasukkan master aspek dan pertanyaan wawancara sekaligus. Template Excel resmi dapat diunduh langsung di dalam menu import.
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
          {aspects.map((aspect, aIdx) => {
            const isOpen = openAspects[aspect.id] !== false;
            const qList = aspect.questions || [];

            return (
              <div
                key={aspect.id}
                className={`border rounded-3xl overflow-hidden transition-all shadow-sm ${card}`}
              >
                {/* Aspect Header */}
                <div
                  onClick={() => toggleAspect(aspect.id)}
                  className={`p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                    darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center">
                      #{aIdx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-sm text-slate-900 dark:text-white">
                          {aspect.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {qList.length} Pertanyaan
                        </span>
                      </div>
                      {aspect.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{aspect.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setTargetAspectId(aspect.id);
                        setQuestionText('');
                        setQuestionGuide('');
                        setQuestionModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Tambah Pertanyaan pada Aspek Ini"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Pertanyaan</span>
                    </button>

                    <button
                      onClick={() => handleDeleteAspect(aspect.id, aspect.name)}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Hapus Aspek Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleAspect(aspect.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Questions Body */}
                {isOpen && (
                  <div className="p-4 sm:p-5 pt-0 space-y-2.5 border-t border-slate-100 dark:border-slate-800/80">
                    {qList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-3 text-center">
                        Belum ada pertanyaan pada aspek ini. Klik "+ Pertanyaan" di atas.
                      </p>
                    ) : (
                      qList.map((q, qIdx) => (
                        <div
                          key={q.id}
                          className={`p-3.5 rounded-2xl border ${subCard} flex items-start justify-between gap-3 text-xs`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                              <span className="font-black text-slate-400">
                                {aIdx + 1}.{qIdx + 1}
                              </span>
                              <p className="font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                                {q.question}
                              </p>
                            </div>
                            {q.guideNotes && (
                              <p className="text-[11px] text-slate-400 italic pl-5">
                                Panduan: {q.guideNotes}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                            title="Hapus Pertanyaan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL BULK IMPORT EXCEL */}
      {importModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className={`w-full max-w-2xl border rounded-3xl shadow-2xl flex flex-col max-h-[90vh] my-auto overflow-hidden ${card}`}>
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm">Bulk Import Pertanyaan Wawancara</h3>
                  <p className="text-xs text-slate-400">
                    Unggah file Excel berisi 6 aspek dan daftar pertanyaan
                  </p>
                </div>
              </div>

              <button
                onClick={() => setImportModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Unduh Template Banner */}
              <div className={`p-4 rounded-2xl border ${subCard} flex items-center justify-between flex-wrap gap-3`}>
                <div>
                  <h4 className="font-black text-slate-800 dark:text-white text-xs">
                    Template Format Excel
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gunakan template ini untuk struktur kolom No, Aspek, Pertanyaan, dan Panduan.
                  </p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Template (.xlsx)
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                  Pilih File Excel (.xlsx / .xls)
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <UploadCloud className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-xs text-slate-700 dark:text-slate-200">
                    {selectedFile ? selectedFile.name : 'Klik atau seret file Excel ke sini'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Format file harus berekstensi .xlsx atau .xls
                  </p>
                </div>
              </div>

              {/* Mode Import */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                  Mode Penyimpanan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    onClick={() => setImportMode('REPLACE')}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                      importMode === 'REPLACE'
                        ? 'border-emerald-500 bg-emerald-500/10 font-black text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'REPLACE'}
                        onChange={() => setImportMode('REPLACE')}
                      />
                      <span>Timpa (Replace All)</span>
                    </div>
                    <span className="text-[10px] block mt-1 text-slate-400 font-normal">
                      Menghapus master lama dan menggantinya dengan isi file baru.
                    </span>
                  </label>

                  <label
                    onClick={() => setImportMode('APPEND')}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                      importMode === 'APPEND'
                        ? 'border-emerald-500 bg-emerald-500/10 font-black text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'APPEND'}
                        onChange={() => setImportMode('APPEND')}
                      />
                      <span>Tambah (Append)</span>
                    </div>
                    <span className="text-[10px] block mt-1 text-slate-400 font-normal">
                      Menambahkan pertanyaan ke dalam master yang sudah ada.
                    </span>
                  </label>
                </div>
              </div>

              {/* Preview Hasil Parse */}
              {parsingFile && (
                <div className="p-4 text-center text-xs text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-500" />
                  Memproses lembar Excel...
                </div>
              )}

              {parsedResult && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Terdeteksi {parsedResult.aspects.length} Aspek ({parsedResult.totalQuestions} Pertanyaan)
                    </span>
                  </div>

                  {parsedResult.errors && parsedResult.errors.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[11px] space-y-1">
                      {parsedResult.errors.map((e, idx) => (
                        <p key={idx}>⚠️ {e}</p>
                      ))}
                    </div>
                  )}

                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedResult.aspects.map((a, idx) => (
                      <div key={idx} className="p-2.5">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {idx + 1}. {a.name} ({a.questions.length} Pertanyaan)
                        </span>
                        <ul className="list-disc pl-5 text-[11px] text-slate-400 mt-1 space-y-0.5">
                          {a.questions.map((q, qIdx) => (
                            <li key={qIdx}>{q.question}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitImport}
                disabled={submittingImport || !parsedResult}
                className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submittingImport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {submittingImport ? 'Menyimpan...' : 'Terapkan Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH ASPEK */}
      {aspectModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md border rounded-3xl p-5 sm:p-6 shadow-2xl ${card} space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm">Tambah Aspek Wawancara</h3>
              <button onClick={() => setAspectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Nama Aspek <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={aspectName}
                  onChange={(e) => setAspectName(e.target.value)}
                  placeholder="Contoh: Academic Readiness"
                  className={`w-full p-2.5 rounded-xl border font-semibold outline-none ${inputClass}`}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={aspectDescription}
                  onChange={(e) => setAspectDescription(e.target.value)}
                  placeholder="Penjelasan fokus observasi dari aspek ini..."
                  className={`w-full p-2.5 rounded-xl border outline-none resize-none ${inputClass}`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setAspectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAspect}
                className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white cursor-pointer"
              >
                Simpan Aspek
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PERTANYAAN */}
      {questionModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg border rounded-3xl p-5 sm:p-6 shadow-2xl ${card} space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm">Tambah Butir Pertanyaan</h3>
              <button onClick={() => setQuestionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Pilih Aspek <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetAspectId}
                  onChange={(e) => setTargetAspectId(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-semibold outline-none cursor-pointer ${inputClass}`}
                >
                  <option value="" disabled>-- Pilih Aspek --</option>
                  {aspects.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Teks Pertanyaan Wawancara <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Tuliskan pertanyaan yang akan diajukan ke awardee..."
                  className={`w-full p-2.5 rounded-xl border font-medium outline-none resize-y ${inputClass}`}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Catatan Panduan Observer (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={questionGuide}
                  onChange={(e) => setQuestionGuide(e.target.value)}
                  placeholder="Petunjuk fokus atau hal penting yang perlu digali..."
                  className={`w-full p-2.5 rounded-xl border outline-none resize-none ${inputClass}`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setQuestionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveQuestion}
                disabled={savingQuestion}
                className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white cursor-pointer disabled:opacity-50"
              >
                {savingQuestion ? 'Menyimpan...' : 'Simpan Pertanyaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
