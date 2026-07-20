import React, { useState } from 'react';
import { FileText, X, AlertCircle, Camera } from 'lucide-react';
import { fileToCompressedDataUrl } from '../lib/image';

const CATEGORIES = [
  { value: 'SAKIT', label: 'Sakit' },
  { value: 'AGENDA_KELUARGA', label: 'Agenda Keluarga' },
  { value: 'AGENDA_ORGANISASI', label: 'Agenda Organisasi' },
  { value: 'AGENDA_PRIBADI', label: 'Agenda Pribadi' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

// Awardee submit izin (leave) untuk sesi tertentu.
export default function ExcuseModal({ darkMode, session, existing, onClose, onSaved }) {
  const [category, setCategory] = useState(existing?.excuseCategory || '');
  const [reason, setReason] = useState(existing?.excuseReason || '');
  const [photo, setPhoto] = useState(existing?.excusePhoto || null);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setProcessing(true); setError(null);
    try {
      setPhoto(await fileToCompressedDataUrl(file, { maxDim: 1000, quality: 0.75 }));
    } catch (e) {
      setError(`Gagal memproses foto: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!category) { setError('Kategori izin wajib dipilih.'); return; }
    if (!reason.trim()) { setError('Keterangan izin wajib diisi.'); return; }
    if (!photo) { setError('Foto bukti izin wajib diunggah.'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/sessions/${session.id}/excuse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excuseCategory: category, excuseReason: reason, excusePhoto: photo }),
      });
      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        const msg = ct.includes('application/json') ? (await res.json())?.error : await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }
      if (onSaved) onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputCls = `w-full text-sm rounded-xl px-3 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className={`w-full max-w-lg my-8 border rounded-3xl shadow-2xl ${card}`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0">
            <h3 className="text-base font-black truncate">Ajukan Izin</h3>
            <p className="text-[11px] text-slate-500 truncate">{session.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">Kategori Izin <span className="text-rose-500">*</span></label>
            <select className={`${inputCls} cursor-pointer`} value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="">— Pilih Kategori —</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">Keterangan <span className="text-rose-500">*</span></label>
            <textarea
              value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="Jelaskan alasan izinmu secara singkat"
              className={`${inputCls} resize-none`}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-2">Foto Bukti (surat sakit, undangan, dll.) <span className="text-rose-500">*</span></label>
            {photo ? (
              <div className="relative">
                <img src={photo} alt="Bukti izin" className="w-full max-h-56 object-contain rounded-2xl bg-slate-100 dark:bg-slate-800" />
                <button type="button" onClick={() => setPhoto(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900/80" title="Ganti foto">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className={`h-40 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${darkMode ? 'border-slate-700 hover:border-sky-500 bg-slate-800/40' : 'border-slate-300 hover:border-sky-400 bg-slate-50'}`}>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])} disabled={processing} />
                {processing ? (
                  <p className="text-xs font-bold text-slate-500">Memproses...</p>
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-slate-400" />
                    <p className="text-xs font-bold text-slate-500">Ambil / Pilih Foto Bukti</p>
                  </>
                )}
              </label>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit" disabled={saving || processing}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold rounded-2xl shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Mengirim...' : <><FileText className="w-4 h-4" /> Kirim Pengajuan Izin</>}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-3 rounded-2xl font-semibold text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">Batal</button>
          </div>
        </form>
      </div>
    </div>
  );
}
