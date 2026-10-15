import React, { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, X, AlertCircle, MapPin, Users, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedGroups, setExpandedGroups] = useState({});
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
        fetchJson('/api/wilayah'),
      ]);
      setItems(list || []);
      setWilayahList(wl || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [role]);

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
          <button
            type="button"
            onClick={openNew}
            className="p-2.5 bg-gradient-to-br from-[#0f2942] via-sky-800 to-amber-400 text-white font-bold text-xs rounded-xl flex items-center justify-center shrink-0 shadow-sm hover:opacity-95 transition-all cursor-pointer"
            title="Kirim Pengumuman Baru"
          >
            <Plus className="w-4 h-4" />
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
                    <option value="">Nasional (Semua Wilayah)</option>
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
          <p className="text-xs text-slate-500">Klik tombol "+" untuk mulai membuat pengumuman.</p>
        </div>
      )}

      {/* Grid 5 Kolom per Wilayah (Nasional selalu di Kolom 1) */}
      {(() => {
        const toggleWilayahGroup = (wilayahKey) => {
          setExpandedGroups((prev) => ({ ...prev, [wilayahKey]: !prev[wilayahKey] }));
        };

        // Group announcements by wilayah & Nasional
        const grouped = { Nasional: [] };
        for (const w of wilayahList) {
          const cleanName = w.name.replace(/^Wilayah\s+/i, '');
          if (!grouped[cleanName]) grouped[cleanName] = [];
        }

        for (const a of items) {
          if (!a.targetRegion) {
            grouped.Nasional.push(a);
          } else {
            const cleanName = (a.targetRegionName || 'Wilayah Lainnya').replace(/^Wilayah\s+/i, '');
            if (!grouped[cleanName]) grouped[cleanName] = [];
            grouped[cleanName].push(a);
          }
        }

        // Keys: 'Nasional' ALWAYS in Column 1, followed by alphabetical order of other regions
        const keys = Object.keys(grouped).sort((a, b) => {
          const isANasional = a.trim().toLowerCase() === 'nasional';
          const isBNasional = b.trim().toLowerCase() === 'nasional';
          if (isANasional && !isBNasional) return -1;
          if (!isANasional && isBNasional) return 1;
          return a.localeCompare(b, 'id', { sensitivity: 'base' });
        });

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-start">
            {keys.map((wilayah) => {
              const groupItems = grouped[wilayah] || [];
              const isExpanded = !!expandedGroups[wilayah];
              const isNasional = wilayah.toLowerCase() === 'nasional';

              return (
                <div
                  key={wilayah}
                  className={`border rounded-2xl overflow-hidden transition-all shadow-xs hover:shadow-sm ${
                    darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200/80 bg-white'
                  }`}
                >
                  <div
                    onClick={() => toggleWilayahGroup(wilayah)}
                    className={`p-3.5 flex flex-col justify-between gap-2.5 cursor-pointer select-none transition-colors ${
                      darkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isNasional
                              ? 'bg-violet-500/10 text-violet-500'
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}
                        >
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs truncate text-slate-800 dark:text-white" title={wilayah}>
                          {wilayah}
                        </span>
                      </div>

                      <div className="text-slate-400 p-0.5 shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
                      <span className="text-slate-400 font-medium">Total Pengumuman</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full ${
                          darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {groupItems.length} info
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-2.5 pt-0 space-y-2 border-t border-slate-100 dark:border-slate-800/60 max-h-96 overflow-y-auto">
                      {groupItems.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic py-3 text-center">
                          {isNasional ? 'Belum ada pengumuman nasional.' : `Belum ada pengumuman di wilayah ${wilayah}.`}
                        </p>
                      ) : (
                        groupItems.map((a) => {
                          const mine = a.createdById === dbUser?.id;
                          return (
                            <div
                              key={a.id}
                              className={`flex flex-col gap-2 p-3 rounded-xl border ${
                                darkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/70'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  <Users className="w-2.5 h-2.5" /> {ROLE_LABEL[a.targetRole]}
                                </span>
                                {(mine || isSuper) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      remove(a);
                                    }}
                                    disabled={busyId === a.id}
                                    className="p-1 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-md transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                                    title="Hapus Pengumuman"
                                  >
                                    {busyId === a.id ? (
                                      <div className="w-3 h-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>

                              <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 leading-snug" title={a.title}>
                                {a.title}
                              </h5>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-4 leading-relaxed whitespace-pre-line">
                                {a.message}
                              </p>

                              <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[9px] text-slate-400">
                                <span className="truncate max-w-[100px]" title={a.createdByName ? `Oleh: ${a.createdByName}` : ''}>
                                  {a.createdByName ? `${a.createdByName}${mine ? ' (kamu)' : ''}` : 'Admin'}
                                </span>
                                <span className="inline-flex items-center gap-1 shrink-0">
                                  <Calendar className="w-2.5 h-2.5" /> {fmtDate(a.createdAt)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
