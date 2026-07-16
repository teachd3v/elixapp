"use client";
import React, { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Save, X, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { croppedDataUrl } from '../lib/image';

// Modal pemotong avatar: drag foto untuk atur posisi, slider untuk zoom.
// Preview lingkaran biar user tahu persis bagian mana yang jadi avatar.
// Setelah "Simpan", `onCropped(dataUrl)` dipanggil dengan hasil JPEG kecil.
export default function AvatarCropModal({ darkMode, imageSrc, onClose, onCropped }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixelCrop, setPixelCrop] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const onCropComplete = useCallback((_area, areaPixels) => {
    setPixelCrop(areaPixels);
  }, []);

  const save = async () => {
    if (!pixelCrop) { setError('Belum ada area yang dipilih.'); return; }
    setSaving(true); setError(null);
    try {
      const dataUrl = await croppedDataUrl(imageSrc, pixelCrop, { maxDim: 400, quality: 0.85 });
      await onCropped(dataUrl);
      // Caller yang tutup modal setelah upload sukses (biar bisa show loading).
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-lg border rounded-3xl shadow-2xl overflow-hidden ${card}`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black">Atur Foto Profil</h3>
            <p className="text-[11px] text-slate-500">Geser foto & atur zoom biar pas di lingkaran.</p>
          </div>
          <button onClick={onClose} disabled={saving} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cropper needs a positioned container with an explicit size. */}
        <div className="relative w-full h-72 sm:h-80 bg-slate-950">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={saving}
              className="flex-1 accent-indigo-500"
            />
            <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-2xl shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Menyimpan...' : <><Save className="w-4 h-4" /> Simpan</>}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-3 rounded-2xl font-semibold text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
