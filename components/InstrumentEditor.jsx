import React, { useEffect, useState } from 'react';
import { SlidersHorizontal, Save, Plus, Trash2, GripVertical, AlertCircle, RefreshCw, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
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
  const inputCls = `w-full text-xs rounded-lg px-2 py-1.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`;

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
            <p className="text-xs text-slate-500">Atur dimensi, bobot, dan daftar pernyataan penilaian.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dimensions.length === 0 && (
            <button onClick={seed} disabled={saving} className="px-4 py-2 bg-amber-500/10 text-amber-600 font-bold text-xs rounded-xl flex items-center gap-1 hover:bg-amber-500/20">
              <RefreshCw className="w-4 h-4" /> Muat Default
            </button>
          )}
          <button onClick={save} disabled={saving} className="p-2.5 md:px-4 md:py-2 bg-gradient-to-br from-[#0f2942] via-sky-800 to-amber-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shrink-0 shadow-md">
            <Save className="w-4 h-4" /> {saving ? <span className="hidden md:inline">Menyimpan...</span> : <span className="hidden md:inline">Simpan Perubahan</span>}
          </button>
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

      <div className="space-y-4">
        {dimensions.map((d, dIdx) => {
          const isExpanded = expandedDims[dIdx];
          return (
          <div key={dIdx} className={`border rounded-2xl overflow-hidden ${card}`} style={{ backgroundColor: darkMode ? '#171717' : '#ffffff' }}>
            {/* Dimension Header */}
            <div className="p-3 md:p-4 border-b border-slate-100 dark:border-slate-800" style={{ backgroundColor: darkMode ? 'transparent' : '#ffffff' }}>
              <div className="flex items-center justify-between mb-2 md:hidden">
                 <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleDim(dIdx)}>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    <span className="font-bold text-sm truncate">{d.name || 'Dimensi Baru'}</span>
                 </div>
                 <button onClick={() => removeDim(dIdx)} className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg shrink-0">
                  <Trash2 className="w-4 h-4" />
                 </button>
              </div>

              <div className={`flex-wrap gap-2 items-center ${isExpanded ? 'flex' : 'hidden md:flex'}`}>
                <GripVertical className="w-4 h-4 text-slate-300 cursor-move hidden md:block shrink-0" />
                <input className={`${inputCls} font-bold w-full md:w-auto md:min-w-[150px] mb-2 md:mb-0`} value={d.name} onChange={e => updateDim(dIdx, 'name', e.target.value)} placeholder="Nama Dimensi" />
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-400">Bobot:</span>
                  <input type="number" step="0.01" className={`${inputCls} w-16 text-center py-1`} value={d.weight} onChange={e => updateDim(dIdx, 'weight', e.target.value)} />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-400">Warna:</span>
                  <input type="color" className="w-7 h-7 rounded cursor-pointer border-0 p-0" value={d.color} onChange={e => updateDim(dIdx, 'color', e.target.value)} />
                </div>
                <button onClick={() => removeDim(dIdx)} className="ml-auto p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg hidden md:block" title="Hapus Dimensi">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Statements List */}
            <div className={`p-3 md:p-4 space-y-3 ${isExpanded ? 'block' : 'hidden md:block'}`}>
              {d.statements.map((s, sIdx) => (
                <div key={sIdx} className="flex gap-3 items-start border-b border-dashed border-slate-200 dark:border-slate-700 pb-3 last:border-0 last:pb-0">
                  <GripVertical className="w-3.5 h-3.5 text-slate-300 mt-2 cursor-move shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input className={`${inputCls} w-24 uppercase font-mono text-[10px]`} value={s.code} onChange={e => updateStmt(dIdx, sIdx, 'code', e.target.value)} placeholder="Kode" />
                      <input className={`${inputCls} flex-1`} value={s.aspect} onChange={e => updateStmt(dIdx, sIdx, 'aspect', e.target.value)} placeholder="Aspek Penilaian" />
                    </div>
                    <textarea className={`${inputCls} min-h-[40px] leading-tight`} value={s.textAwardee} onChange={e => updateStmt(dIdx, sIdx, 'textAwardee', e.target.value)} placeholder="Pernyataan untuk Awardee" />
                    <textarea className={`${inputCls} min-h-[40px] leading-tight`} value={s.textMentor} onChange={e => updateStmt(dIdx, sIdx, 'textMentor', e.target.value)} placeholder="Pernyataan untuk Mentor" />
                  </div>
                  <button onClick={() => removeStmt(dIdx, sIdx)} className="p-1 text-slate-400 hover:text-rose-500 mt-1 shrink-0" title="Hapus Pernyataan">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={() => addStmt(dIdx)} className="mt-2 px-3 py-1.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-lg flex items-center gap-1">
                <Plus className="w-3 h-3" /> Tambah Pernyataan
              </button>
            </div>
          </div>
          );
        })}
        
        <button onClick={addDim} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Dimensi Baru
        </button>
      </div>
    </div>
  );
}
