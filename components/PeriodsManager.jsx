import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Plus, Trash2, Edit2, X, Loader2 } from 'lucide-react';
import { useDialog } from './DialogProvider';

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    const msg = ct.includes('application/json') ? (await res.json())?.error : await res.text();
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return ct.includes('application/json') ? res.json() : null;
}

export default function PeriodsManager({ darkMode }) {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { confirm, alert } = useDialog();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: 'Baseline', startDate: '', endDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [activatingId, setActivatingId] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchJson(`/api/admin/periods?_t=${Date.now()}`);
      setPeriods(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleOpenModal = (period = null) => {
    if (period) {
      setEditingId(period.id);
      setFormData({
        name: period.name,
        startDate: period.startDate.split('T')[0],
        endDate: period.endDate.split('T')[0]
      });
    } else {
      setEditingId(null);
      setFormData({ name: 'Baseline', startDate: '', endDate: '' });
    }
    setShowModal(true);
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert("Semua kolom wajib diisi.", "Error");
      return;
    }
    setSubmitting(true);
    try {
      const url = editingId ? `/api/admin/periods/${editingId}` : '/api/admin/periods';
      const method = editingId ? 'PATCH' : 'POST';
      
      await fetchJson(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, startDate: formData.startDate, endDate: formData.endDate, isActive: false })
      });
      setShowModal(false);
      load();
    } catch (e) {
      alert(e.message, "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (id) => {
    const yes = await confirm("Mengaktifkan siklus ini akan menyimpan nilai awardee saat ini ke siklus yang sedang aktif (sebagai riwayat), lalu me-reset/memuat nilai untuk siklus baru ini. Yakin?", "Aktivasi Siklus");
    if (!yes) return;
    setActivatingId(id);
    try {
      await fetchJson(`/api/admin/periods/activate/${id}`, { method: 'POST' });
      alert("Siklus berhasil diaktifkan. Data nilai awardee telah disesuaikan.", "Sukses", "success");
      load();
    } catch (e) {
      alert(e.message, "Error");
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = async (id, isActive) => {
    if (isActive) {
      alert("Tidak bisa menghapus siklus yang sedang aktif.", "Ditolak");
      return;
    }
    const yes = await confirm("Yakin ingin menghapus siklus ini? Riwayat nilai pada siklus ini akan ikut terhapus.", "Hapus Siklus");
    if (!yes) return;
    try {
      await fetchJson(`/api/admin/periods/${id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      alert(e.message, "Error");
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';

  if (loading && periods.length === 0) return <div className="text-xs text-slate-400 p-4">Memuat data siklus...</div>;

  return (
    <>
      <div className={`border rounded-3xl p-5 md:p-8 mb-6 ${card}`}>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black">Manajemen Siklus Penilaian</h2>
            <p className="text-xs opacity-60 mt-1 max-w-lg">Atur periode pelaksanaan SA & MA. Hanya 1 siklus yang dapat aktif di waktu yang sama. Saat siklus berganti, riwayat nilai akan disimpan.</p>
          </div>
          <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white p-2 md:px-4 md:py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Tambah Siklus</span>
          </button>
        </div>

        {error && <div className="bg-rose-500/10 text-rose-500 p-3 rounded-xl text-sm font-bold mb-4">{error}</div>}

        <div className="space-y-3">
          {periods.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
               <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-3" />
               <p className="text-sm font-bold text-slate-500">Belum ada siklus penilaian.</p>
            </div>
          ) : (
            periods.map(p => {
              const sd = new Date(p.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
              const ed = new Date(p.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
              return (
                <div key={p.id} className={`p-4 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${p.isActive ? (darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200') : (darkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50 border-slate-100')}`}>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-base">{p.name}</h3>
                      {p.isActive && <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Aktif</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{sd} — {ed}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!p.isActive && (
                      <button 
                        onClick={() => handleActivate(p.id)} 
                        disabled={activatingId === p.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'} ${activatingId === p.id ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {activatingId === p.id ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Proses...</> : 'Set Aktif'}
                      </button>
                    )}
                    <button onClick={() => handleOpenModal(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id, p.isActive)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-3xl shadow-xl ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                {editingId ? 'Edit Siklus Penilaian' : 'Tambah Siklus Penilaian'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nama Siklus</label>
                <select 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className={`w-full p-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  required
                >
                  <option value="Baseline">Baseline</option>
                  <option value="Mid-Review">Mid-Review</option>
                  <option value="End-Review">End-Review</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Mulai</label>
                  <input 
                    type="date" 
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className={`w-full p-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Selesai</label>
                  <input 
                    type="date" 
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className={`w-full p-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    required
                  />
                </div>
              </div>
              
              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                  {submitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Simpan Siklus')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
