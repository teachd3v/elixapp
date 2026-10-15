import React, { useEffect, useState } from 'react';
import { SlidersHorizontal, Save, Plus, Trash2, GripVertical, AlertCircle, RefreshCw, X, Loader2, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { useDialog } from './DialogProvider';
import PeriodsManager from './PeriodsManager';

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    const msg = ct.includes('application/json') ? (await res.json().catch(() => ({})))?.error : await res.text().catch(() => '');
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return ct.includes('application/json') ? res.json() : null;
}

export default function InstrumentEditor({ darkMode }) {
  const [dimensions, setDimensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [expandedDims, setExpandedDims] = useState({});
  const { confirm } = useDialog();

  const toggleDim = (dIdx) => {
    setExpandedDims(prev => ({ ...prev, [dIdx]: !prev[dIdx] }));
  };

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchJson('/api/instruments');
      setDimensions(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cancelEdit = async () => {
    await load();
    setIsEditing(false);
  };

  const seed = async () => {
    setSaving(true); setError(null);
    try {
      await fetchJson('/api/admin/seed-instruments', { method: 'POST' });
      await load();
      setSuccess('Berhasil memuat data default.');
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const res = await fetchJson('/api/instruments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dimensions),
      });
      if (res.ok) {
        setDimensions(res.dimensions);
        setSuccess('Berhasil menyimpan instrumen.');
        setIsEditing(false);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const addDim = () => {
    setDimensions([...dimensions, {
      id: '', name: 'Dimensi Baru', weight: 0.1, color: '#64748b', bg: 'bg-slate-500/10', text: 'text-slate-600', statements: []
    }]);
  };
  const removeDim = async (dIdx) => {
    const isConfirmed = await confirm('Hapus dimensi ini beserta pertanyaannya?');
    if (!isConfirmed) return;
    setDimensions(dimensions.filter((_, i) => i !== dIdx));
  };
  const updateDim = (dIdx, field, val) => {
    const newDims = [...dimensions];
    newDims[dIdx][field] = field === 'weight' ? parseFloat(val) || 0 : val;
    setDimensions(newDims);
  };

  const addStmt = (dIdx) => {
    const newDims = [...dimensions];
    newDims[dIdx].statements.push({
      id: '', aspect: 'Aspek Baru', code: 'NEW', textAwardee: 'Pernyataan untuk awardee', textMentor: 'Pernyataan untuk mentor'
    });
    setDimensions(newDims);
  };
  const removeStmt = async (dIdx, sIdx) => {
    const isConfirmed = await confirm('Hapus pernyataan ini?');
    if (!isConfirmed) return;
    const newDims = [...dimensions];
    newDims[dIdx].statements = newDims[dIdx].statements.filter((_, i) => i !== sIdx);
    setDimensions(newDims);
  };
  const updateStmt = (dIdx, sIdx, field, val) => {
    const newDims = [...dimensions];
    newDims[dIdx].statements[sIdx][field] = val;
    setDimensions(newDims);
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputCls = `w-full text-xs rounded-lg px-2.5 py-1.5 border transition-all ${
    darkMode
      ? 'bg-slate-800/80 border-slate-700 text-white disabled:bg-slate-800/30 disabled:border-slate-800 disabled:text-slate-200'
      : 'bg-white border-slate-200 text-slate-800 disabled:bg-slate-50/80 disabled:border-slate-200/50 disabled:text-slate-700'
  } disabled:cursor-default`;

  if (loading) {
    return (
      <div className={`border rounded-3xl p-16 flex flex-col items-center justify-center gap-4 ${card}`}>
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-bold opacity-60">Memuat instrumen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PeriodsManager darkMode={darkMode} />

      <div className={`border rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${card}`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-violet-500/10 text-violet-600">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black">Editor Instrumen ELIX</h3>
            <p className="text-xs text-slate-500">
              {isEditing ? 'Mode Edit aktif: Ubah dimensi, bobot, atau pernyataan lalu simpan.' : 'Kondisi terkunci (read-only). Klik ikon pensil untuk mulai mengedit.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dimensions.length === 0 && (
            <button
              onClick={seed}
              disabled={saving}
              className="px-3.5 py-2 bg-amber-500/10 text-amber-600 font-bold text-xs rounded-xl flex items-center gap-1 hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Muat Default
            </button>
          )}

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-2.5 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 rounded-xl transition-all cursor-pointer shadow-xs"
              title="Edit Instrumen"
            >
              <Pencil className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="p-2.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                title="Batal Edit"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="p-2.5 bg-gradient-to-br from-[#0f2942] via-sky-800 to-amber-400 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md disabled:opacity-50"
                title="Simpan Perubahan"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600">
          <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
          <AlertCircle className="w-4 h-4 shrink-0" /><span>{success}</span>
        </div>
      )}

      {dimensions.length === 0 && !loading && (
        <div className={`border rounded-3xl p-10 text-center ${card}`}>
          <p className="text-sm font-bold opacity-60">Belum ada dimensi yang dikonfigurasi.</p>
          <p className="text-xs text-slate-500 mt-1">Klik "Muat Default" untuk mengambil data dari constants.js</p>
        </div>
      )}

      {/* Grid 2 Kolom per Dimensi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {dimensions.map((d, dIdx) => (
          <div
            key={dIdx}
            className={`border rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition-all ${card}`}
          >
            {/* Dimension Header */}
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80">
              {isEditing ? (
                <div className="flex flex-wrap items-center gap-2">
                  <GripVertical className="w-4 h-4 text-slate-300 cursor-move shrink-0" />
                  <input
                    className={`${inputCls} font-bold flex-1 min-w-[130px]`}
                    value={d.name}
                    onChange={e => updateDim(dIdx, 'name', e.target.value)}
                    placeholder="Nama Dimensi"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400">Bobot:</span>
                    <input
                      type="number"
                      step="0.01"
                      className={`${inputCls} w-16 text-center py-1 font-bold`}
                      value={d.weight}
                      onChange={e => updateDim(dIdx, 'weight', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400">Warna:</span>
                    <input
                      type="color"
                      className="w-7 h-7 rounded cursor-pointer border-0 p-0 shrink-0"
                      value={d.color}
                      onChange={e => updateDim(dIdx, 'color', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDim(dIdx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Hapus Dimensi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: d.color || '#64748b' }} />
                    <h4 className="font-bold text-sm truncate text-slate-900 dark:text-white" title={d.name}>{d.name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                      Bobot: {d.weight}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                    {d.statements.length} pernyataan
                  </span>
                </div>
              )}
            </div>

            {/* Statements List */}
            <div className="p-3.5 space-y-3">
              {d.statements.map((s, sIdx) => (
                <div key={sIdx} className="flex gap-2.5 items-start border-b border-dashed border-slate-200 dark:border-slate-800/80 pb-3 last:border-0 last:pb-0">
                  {isEditing && (
                    <GripVertical className="w-3.5 h-3.5 text-slate-300 mt-2 cursor-move shrink-0" />
                  )}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex gap-2">
                      <input
                        className={`${inputCls} w-20 uppercase font-mono text-[10px] shrink-0 font-bold`}
                        value={s.code}
                        disabled={!isEditing}
                        onChange={e => updateStmt(dIdx, sIdx, 'code', e.target.value)}
                        placeholder="Kode"
                      />
                      <input
                        className={`${inputCls} flex-1 font-semibold`}
                        value={s.aspect}
                        disabled={!isEditing}
                        onChange={e => updateStmt(dIdx, sIdx, 'aspect', e.target.value)}
                        placeholder="Aspek Penilaian"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Awardee</span>
                      <textarea
                        className={`${inputCls} min-h-[38px] leading-relaxed resize-none`}
                        value={s.textAwardee}
                        disabled={!isEditing}
                        onChange={e => updateStmt(dIdx, sIdx, 'textAwardee', e.target.value)}
                        placeholder="Pernyataan untuk Awardee"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Mentor</span>
                      <textarea
                        className={`${inputCls} min-h-[38px] leading-relaxed resize-none`}
                        value={s.textMentor}
                        disabled={!isEditing}
                        onChange={e => updateStmt(dIdx, sIdx, 'textMentor', e.target.value)}
                        placeholder="Pernyataan untuk Mentor"
                      />
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => removeStmt(dIdx, sIdx)}
                      className="p-1 text-slate-400 hover:text-rose-500 mt-1 shrink-0 transition-colors cursor-pointer"
                      title="Hapus Pernyataan"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => addStmt(dIdx)}
                  className="mt-2 px-3 py-1.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Tambah Pernyataan
                </button>
              )}
            </div>
          </div>
        ))}

        {isEditing && (
          <button
            type="button"
            onClick={addDim}
            className="lg:col-span-2 w-full py-3.5 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Dimensi Baru
          </button>
        )}
      </div>
    </div>
  );
}
