import React, { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, X, AlertCircle, MapPin, Users, Calendar } from 'lucide-react';
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

function fmtDate(iso) {
  try { return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

const ROLE_LABEL = { ALL: 'Semua', AWARDEE: 'Awardee', MENTOR: 'Mentor' };

// Pengumuman manager for MENTOR & SUPERADMIN.
// MENTOR: hanya bisa kirim ke AWARDEE di wilayahnya (server enforce).
// SUPERADMIN: bebas pilih target role & wilayah.
export default function AnnouncementsManager({ darkMode, dbUser, role }) {
  const [items, setItems] = useState([]);
  const [wilayahList, setWilayahList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', targetRole: 'ALL', targetRegion: '' });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const { confirm } = useDialog();

  const isSuper = role === 'superadmin';

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [list, wl] = await Promise.all([
        fetchJson('/api/announcements?scope=manage'),
        isSuper ? fetchJson('/api/wilayah') : Promise.resolve([]),
      ]);
      setItems(list);
      setWilayahList(wl);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [role]);

  const openNew = () => {
    setForm({ title: '', message: '', targetRole: 'ALL', targetRegion: '' });
    setError(null);
    setFormOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) { setError('Judul dan pesan wajib diisi.'); return; }
    setSaving(true); setError(null);
    try {
      const payload = isSuper
        ? { title: form.title, message: form.message, targetRole: form.targetRole, targetRegion: form.targetRegion || null }
        : { title: form.title, message: form.message };
      await fetchJson('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setFormOpen(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a) => {
    const isConfirmed = await confirm(`Hapus pengumuman "${a.title}"?`);
    if (!isConfirmed) return;
    setBusyId(a.id);
    try {
      await fetchJson(`/api/announcements/${a.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((x) => x.id !== a.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputCls = `w-full text-sm rounded-xl px-3 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`;

  return (
    <div className="space-y-6">
      <div className={`border rounded-3xl p-5 flex items-center justify-between gap-3 ${card}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-3 rounded-full bg-purple-500/10 text-purple-600"><Megaphone className="w-5 h-5" /></div>
          <div className="min-w-0">
            <h3 className="text-base font-black">Pengumuman</h3>
            <p className="text-xs text-slate-500 truncate">
              {loading ? 'Memuat...' : `${items.length} pengumuman • ${isSuper ? 'kirim ke role/wilayah tertentu' : `otomatis ke awardee wilayahmu`}`}
            </p>
          </div>
        </div>
        {!formOpen && (
          <button onClick={openNew}
            className="p-2.5 md:px-4 md:py-2 bg-gradient-to-br from-[#0f2942] via-sky-800 to-amber-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shrink-0 shadow-md">
            <Plus className="w-4 h-4" /> <span className="hidden md:inline">Kirim Pengumuman</span>
          </button>
        )}
      </div>

      {error && !formOpen && (
        <div className="flex items-start gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={submit} className={`w-full max-w-md my-8 border rounded-3xl p-5 space-y-4 shadow-2xl ${card}`}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black">Pengumuman Baru</h4>
              <button type="button" onClick={() => setFormOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
            </div>
            {error && (
              <div className="flex items-start gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Judul <span className="text-rose-500">*</span></label>
              <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="mis. Perubahan Jadwal Pembinaan" required maxLength={120} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Pesan <span className="text-rose-500">*</span></label>
              <textarea className={`${inputCls} resize-none`} rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tulis isi pengumuman..." required />
            </div>

            {isSuper ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Target Role</label>
                  <select className={`${inputCls} cursor-pointer`} value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}>
                    <option value="ALL">Semua (Awardee + Mentor)</option>
                    <option value="AWARDEE">Awardee saja</option>
                    <option value="MENTOR">Mentor saja</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Target Wilayah</label>
                  <select className={`${inputCls} cursor-pointer`} value={form.targetRegion} onChange={(e) => setForm({ ...form, targetRegion: e.target.value })}>
                    <option value="">Semua wilayah</option>
                    {wilayahList.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800/50 rounded-xl px-3 py-2">
                <MapPin className="w-3 h-3 inline mr-1" />
                Pengumuman akan dikirim otomatis ke <b>awardee di wilayahmu</b>.
              </p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} className="flex-1 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700">Batal</button>
              <button type="submit" disabled={saving}
                className="flex-1 px-5 py-2.5 bg-gradient-to-br from-[#0f2942] via-sky-800 to-amber-400 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50">
                {saving ? 'Mengirim...' : 'Kirim'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className={`border rounded-3xl p-10 text-center ${card}`}>
          <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold mb-1">Belum ada pengumuman</p>
          <p className="text-xs text-slate-500">Klik "Kirim Pengumuman" untuk mulai.</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((a) => {
          const mine = a.createdById === dbUser?.id;
          return (
            <div key={a.id} className={`border rounded-3xl p-5 ${card}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      <Users className="w-3 h-3" /> {ROLE_LABEL[a.targetRole]}
                    </span>
                    {a.targetRegion ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">
                        <MapPin className="w-3 h-3" /> Wilayah {a.targetRegionName || '—'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-600">
                        <MapPin className="w-3 h-3" /> Nasional
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                      <Calendar className="w-3 h-3" /> {fmtDate(a.createdAt)}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm mb-1">{a.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line">{a.message}</p>
                  {a.createdByName && (
                    <p className="text-[10px] text-slate-400 mt-2">oleh {a.createdByName}{mine ? ' (kamu)' : ''}</p>
                  )}
                </div>
                {(mine || isSuper) && (
                  <button onClick={() => remove(a)} disabled={busyId === a.id}
                    className="px-3 py-1.5 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg font-bold text-xs flex items-center gap-1 disabled:opacity-50 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" /> {busyId === a.id ? '...' : 'Hapus'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
