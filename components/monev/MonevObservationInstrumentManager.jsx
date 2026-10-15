"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass, Plus, Trash2, Edit3, Download,
  CheckCircle2, AlertCircle, Layers,
  Loader2, X, Check, FileUp
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
  const [aspectOrder, setAspectOrder] = useState(1);
  const [aspectSection, setAspectSection] = useState('SECTION_A');
  const [aspectTitle, setAspectTitle] = useState('');
  const [aspectDescription, setAspectDescription] = useState('');
  const [savingAspect, setSavingAspect] = useState(false);

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const subCard = darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80';
  const inputClass = darkMode
    ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-500'
    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500';

  const loadAspects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/monev/observation-aspects');
      if (!res.ok) throw new Error('Gagal memuat master instrumen observasi');
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
    let secACount = 0;
    let secBCount = 0;
    for (const a of aspects) {
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
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data import');

      await alert(
        `Sukses! ${data.countAspects} aspek observasi wilayah berhasil diimpor ke sistem.`,
        'Bulk Import Berhasil',
        'success'
      );
      setImportModalOpen(false);
      setSelectedFile(null);
      setParsedResult(null);
      await loadAspects();
    } catch (err) {
      console.error(err);
      await alert(err.message || 'Gagal mengeksekusi import.', 'Error Import', 'error');
    } finally {
      setSubmittingImport(false);
    }
  };

  // Open modal create aspect
  const handleOpenAddAspect = (defaultSec = 'SECTION_A') => {
    setEditingAspect(null);
    setAspectOrder(aspects.length + 1);
    setAspectSection(defaultSec);
    setAspectTitle('');
    setAspectDescription('');
    setAspectModalOpen(true);
  };

  // Open modal edit aspect
  const handleOpenEditAspect = (asp) => {
    setEditingAspect(asp);
    setAspectOrder(asp.order || 1);
    setAspectSection(asp.section || 'SECTION_A');
    setAspectTitle(asp.title || '');
    setAspectDescription(asp.description || '');
    setAspectModalOpen(true);
  };

  // Save Aspect
  const handleSaveAspect = async (e) => {
    e.preventDefault();
    if (!aspectTitle.trim()) {
      await alert('Nama aspek wajib diisi.', 'Validasi', 'error');
      return;
    }

    setSavingAspect(true);
    try {
      if (editingAspect) {
        const res = await fetch('/api/admin/monev/observation-aspects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingAspect.id,
            section: aspectSection,
            title: aspectTitle.trim(),
            description: aspectDescription.trim() || null,
            order: Number(aspectOrder) || 1,
          }),
        });
        if (!res.ok) throw new Error('Gagal memperbarui aspek');
      } else {
        const res = await fetch('/api/admin/monev/observation-aspects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: aspectSection,
            title: aspectTitle.trim(),
            description: aspectDescription.trim() || null,
            order: Number(aspectOrder) || (aspects.length + 1),
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
      `Apakah kamu yakin ingin menghapus aspek "${asp.title}"?`,
      'Hapus Aspek Observasi'
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/monev/observation-aspects?id=${asp.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus aspek');
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
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black">Pengaturan Instrumen Observasi Wilayah</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Kelola master aspek observasi wilayah: Bagian A (Perkembangan Program) dan Bagian B (Temuan Ketidakcapaian Target Program) melalui fitur Bulk Import Excel.
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5">Total Aspek Master</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black">{totalMetrics.totalAspects}</span>
              <span className="text-[11px] text-slate-400 font-semibold">Aspek</span>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <span className="text-[11px] font-bold text-blue-500/80 block mb-0.5">Bagian A: Perkembangan Program</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalMetrics.secACount}</span>
              <span className="text-[11px] text-blue-500/80 font-semibold">Aspek Deskriptif</span>
            </div>
          </div>

          <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/30">
            <span className="text-[11px] font-bold text-purple-500/80 block mb-0.5">Bagian B: Ketidakcapaian Target</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalMetrics.secBCount}</span>
              <span className="text-[11px] text-purple-500/80 font-semibold">Kategori Temuan</span>
            </div>
          </div>
        </div>

        {/* FILTER & ADD BUTTON BAR */}
        <div className="flex items-center justify-between flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Semua Bagian ({aspects.length})
            </button>
            <button
              onClick={() => setActiveFilter('SECTION_A')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'SECTION_A'
                  ? 'bg-blue-600 text-white font-black shadow-sm shadow-blue-500/20'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Bagian A: Perkembangan Program ({totalMetrics.secACount})
            </button>
            <button
              onClick={() => setActiveFilter('SECTION_B')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'SECTION_B'
                  ? 'bg-purple-600 text-white font-black shadow-sm shadow-purple-500/20'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Bagian B: Temuan Target Program ({totalMetrics.secBCount})
            </button>
          </div>

          <button
            onClick={() => handleOpenAddAspect(activeFilter === 'SECTION_B' ? 'SECTION_B' : 'SECTION_A')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Aspek Manual
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
        <div className={`border rounded-3xl p-12 text-center space-y-4 ${card}`}>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black">Belum Ada Instrumen Observasi Wilayah</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Gunakan fitur <strong>Bulk Import Excel</strong> untuk memasukkan master aspek observasi sekaligus. Template Excel resmi dapat diunduh langsung di dalam menu import.
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
        <div className={`border rounded-3xl overflow-hidden ${card}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b ${darkMode ? 'bg-slate-800/60 border-slate-800' : 'bg-slate-50/80 border-slate-100'}`}>
                <tr>
                  <th className="py-3.5 px-4 font-black w-14 text-center">No</th>
                  <th className="py-3.5 px-4 font-black w-48">Bagian</th>
                  <th className="py-3.5 px-4 font-black w-72">Aspek</th>
                  <th className="py-3.5 px-4 font-black">Deskripsi Aspek</th>
                  <th className="py-3.5 px-4 font-black w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredAspects.map((asp, idx) => {
                  const isSecB = asp.section === 'SECTION_B';
                  return (
                    <tr key={asp.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {asp.order || (idx + 1)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isSecB
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {isSecB ? 'Bagian B (Temuan Target)' : 'Bagian A (Perkembangan)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-800 dark:text-white">
                        {asp.title}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        {asp.description || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditAspect(asp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                            title="Edit Aspek"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAspect(asp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Hapus Aspek"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT ASPEK */}
      {aspectModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg border rounded-3xl p-6 shadow-2xl ${card}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black">
                {editingAspect ? 'Edit Aspek Observasi' : 'Tambah Aspek Observasi Baru'}
              </h3>
              <button
                onClick={() => setAspectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAspect} className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Nomor Urut <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={aspectOrder}
                    onChange={(e) => setAspectOrder(e.target.value)}
                    className={`w-full p-3 rounded-xl text-xs font-semibold border outline-none ${inputClass}`}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Bagian Observasi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={aspectSection}
                    onChange={(e) => setAspectSection(e.target.value)}
                    className={`w-full p-3 rounded-xl text-xs font-semibold border outline-none cursor-pointer ${inputClass}`}
                  >
                    <option value="SECTION_A">Bagian A: Perkembangan Program</option>
                    <option value="SECTION_B">Bagian B: Temuan Target Program</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Nama Aspek <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={aspectTitle}
                  onChange={(e) => setAspectTitle(e.target.value)}
                  placeholder="Contoh: Realisasi Pelaksanaan Program"
                  className={`w-full p-3 rounded-xl text-xs font-semibold border outline-none ${inputClass}`}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Deskripsi Aspek (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={aspectDescription}
                  onChange={(e) => setAspectDescription(e.target.value)}
                  placeholder="Keterangan singkat mengenai aspek observasi..."
                  className={`w-full p-3 rounded-xl text-xs font-medium border outline-none resize-y ${inputClass}`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAspectModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAspect}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingAspect ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingAspect ? 'Perbarui Aspek' : 'Simpan Aspek'}
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
                  <h3 className="text-base font-black">Bulk Import Instrumen Observasi Wilayah</h3>
                  <p className="text-[11px] text-slate-400">
                    Impor master aspek Bagian A dan Bagian B melalui spreadsheet Excel (.xlsx, .xls)
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
                  Gunakan format kolom: <strong>No</strong>, <strong>Bagian</strong>, <strong>Aspek</strong>, dan <strong>Deskripsi Aspek</strong>.
                </span>
              </div>
              <button
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
                      <span className="text-[10px] text-slate-400 block">Distribusi Bagian</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        A: {parsedResult.aspects.filter(a => a.section === 'SECTION_A').length} | B: {parsedResult.aspects.filter(a => a.section === 'SECTION_B').length}
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
                          Gabungkan aspek baru di akhir daftar master
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
                disabled={!parsedResult || submittingImport}
                onClick={handleExecuteImport}
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
