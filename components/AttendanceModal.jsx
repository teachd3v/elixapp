import React, { useState } from 'react';
import { Camera, UploadCloud, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { fileToCompressedDataUrl } from '../lib/image';

// Awardee attendance submission modal. Two photos (selfie + suasana) + optional
// notes. Photos are resized/compressed in the browser before upload.
export default function AttendanceModal({ darkMode, session, existing, onClose, onSaved }) {
  const [selfie, setSelfie] = useState(existing?.selfiePhoto || null);
  const [atmos, setAtmos] = useState(existing?.atmospherePhoto || null);
  const [notes, setNotes] = useState(existing?.notes || '');
  const [processing, setProcessing] = useState(null); // 'selfie' | 'atmos' | null
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (which, file) => {
    if (!file) return;
    setProcessing(which); setError(null);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, { maxDim: 900, quality: 0.75 });
      if (which === 'selfie') setSelfie(dataUrl); else setAtmos(dataUrl);
    } catch (e) {
      setError(`Gagal memproses foto: ${e.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!selfie || !atmos) { setError('Foto selfie dan foto suasana wajib diunggah.'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/sessions/${session.id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selfiePhoto: selfie, atmospherePhoto: atmos, notes }),
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

  const PhotoSlot = ({ label, value, which, capture }) => (
    <div>
      <label className="text-xs font-bold text-slate-400 block mb-2">{label} <span className="text-rose-500">*</span></label>
      {value ? (
        <div className="relative">
          <img src={value} alt={label} className="w-full h-40 object-cover rounded-2xl" />
          <button
            type="button"
            onClick={() => (which === 'selfie' ? setSelfie(null) : setAtmos(null))}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900/80"
            title="Ganti foto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className={`h-40 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${darkMode ? 'border-slate-700 hover:border-indigo-500 bg-slate-800/40' : 'border-slate-300 hover:border-indigo-400 bg-slate-50'}`}>
          <input type="file" accept="image/*" capture={capture} className="hidden"
            onChange={(e) => handleFile(which, e.target.files?.[0])} disabled={processing === which} />
          {processing === which ? (
            <p className="text-xs font-bold text-slate-500">Memproses...</p>
          ) : (
            <>
              <Camera className="w-6 h-6 text-slate-400" />
              <p className="text-xs font-bold text-slate-500">Ambil / Pilih Foto</p>
            </>
          )}
        </label>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className={`w-full max-w-lg my-8 border rounded-3xl shadow-2xl ${card}`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0">
            <h3 className="text-base font-black truncate">Absen Sesi</h3>
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

          <PhotoSlot label="Foto Selfie (bukti kehadiran)" value={selfie} which="selfie" capture="user" />
          <PhotoSlot label="Foto Suasana (ruangan/sesi)" value={atmos} which="atmos" capture="environment" />

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">Catatan (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Catatan tambahan, mis. datang terlambat 5 menit"
              className={`w-full text-sm rounded-xl px-3 py-2.5 border resize-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={saving || !selfie || !atmos || processing}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-2xl shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Mengirim...' : <><UploadCloud className="w-4 h-4" /> Kirim Absensi</>}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl font-semibold text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">Batal</button>
          </div>

          {existing && (
            <p className="text-[11px] text-slate-500 flex items-center gap-1 justify-center">
              <CheckCircle2 className="w-3 h-3" /> Kamu sudah mengirim absensi sebelumnya — akan diganti dengan yang baru.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
