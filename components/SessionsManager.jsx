import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Plus, Edit, Trash2, X, AlertCircle, ClipboardCheck, CheckCircle2, XCircle, Users, User, FileText, ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react';
import { useDialog } from './DialogProvider';
import AttendanceModal from './AttendanceModal';
import AttendanceReview from './AttendanceReview';
import ExcuseModal from './ExcuseModal';
import { isAttendanceOpen, isExcuseOpen, attendanceStatusText, excuseStatusText } from '../lib/attendance-window';
import { exportSessionsAttendanceList } from '../lib/exportExcel';

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    const detail = ct.includes('application/json') ? (await res.json().catch(() => ({})))?.error : await res.text().catch(() => '');
    throw new Error(detail || `HTTP ${res.status}`);
  }
  // DELETE returns JSON too; GET/POST/PATCH all JSON.
  return ct.includes('application/json') ? res.json() : null;
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}
function toDateInput(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function toDateTimeLocalInput(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtTime(iso) {
  try { return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

// Manages Sesi Pembinaan for the current user. Read-only for AWARDEE;
// CRUD for MENTOR (WILAYAH sessions) and SUPERADMIN (NASIONAL sessions).
// The server enforces scope + authorization; this UI just reflects it.
export default function SessionsManager({ darkMode, dbUser, role, canCreate = false, awardees = [] }) {
  console.log('SESSIONS MANAGER RENDER:', { role, awardeeCount: awardees.length });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wilayahList, setWilayahList] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', time: '', category: 'KLASIKAL', endDate: '', awardeeId: '', awardeeIds: [] });
  const [editing, setEditing] = useState(null); // session object or null (new)
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const { confirm, alert } = useDialog();

  // Wilayah accordion expanded state & Excel export state (default closed/collapsed)
  const [expandedGroups, setExpandedGroups] = useState({});
  const [exportingAll, setExportingAll] = useState(false);

  const toggleWilayahGroup = (section, wilayah) => {
    const id = `${section}-${wilayah}`;
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const groupSessionsByWilayah = (list) => {
    const groups = { Nasional: [] };
    for (const w of wilayahList) {
      const cleanName = w.name.replace(/^Wilayah\s+/i, '');
      if (!groups[cleanName]) groups[cleanName] = [];
    }
    for (const s of list) {
      const key = s.scope === 'NASIONAL' ? 'Nasional' : (s.wilayah?.name?.replace(/^Wilayah\s+/i, '') || 'Wilayah Lainnya');
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    return groups;
  };

  // Attendance state
  const [attendModal, setAttendModal] = useState(null); // { session, existing }
  const [excuseModal, setExcuseModal] = useState(null); // { session, existing }
  const [reviewSession, setReviewSession] = useState(null); // session being reviewed by mentor/superadmin
  // Refresh clock every 60s so window-based buttons re-enable on time.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(t); }, []);
  // Per-session attendance summary keyed by session.id
  //   awardee: { my: { status } }
  //   mentor/superadmin: { total, pending }
  const [attSummary, setAttSummary] = useState({});

  const isAwardee = role === 'awardee';
  const canReview = role === 'mentor' || role === 'superadmin';

  const handleExportAll = async () => {
    if (sessions.length === 0) return;
    setExportingAll(true);
    try {
      await exportSessionsAttendanceList({
        sessions,
        filename: `Rekap_Presensi_Semua_Sesi_${new Date().toISOString().slice(0, 10)}.xlsx`
      });
    } catch (err) {
      await alert(err.message || 'Gagal mengekspor data', 'Gagal');
    } finally {
      setExportingAll(false);
    }
  };

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [list, wl] = await Promise.all([
        fetchJson('/api/sessions'),
        fetchJson('/api/wilayah').catch(() => []),
      ]);
      setSessions(list || []);
      setWilayahList(wl || []);
      // Fetch attendance summary in parallel — a lightweight per-session GET.
      const summaries = await Promise.all((list || []).map(async (s) => {
        try {
          const rows = await fetchJson(`/api/sessions/${s.id}/attendance`);
          if (isAwardee) return [s.id, { my: rows[0] || null }];
          return [s.id, { total: rows.length, pending: rows.filter((r) => r.status === 'MENUNGGU_KONFIRMASI').length }];
        } catch { return [s.id, null]; }
      }));
      setAttSummary(Object.fromEntries(summaries));
    }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load();   }, [role]);

  const canMutate = (s) => role === 'superadmin' || s.createdById === dbUser?.id;

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', date: '', time: '', category: 'KLASIKAL', endDate: '', awardeeId: '', awardeeIds: [] });
    setError(null);
    setFormOpen(true);
  };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ 
      title: s.title, 
      date: s.category === 'KLASIKAL' ? toDateTimeLocalInput(s.date) : toDateInput(s.date), 
      category: s.category || 'KLASIKAL', 
      endDate: s.category === 'KLASIKAL' ? (s.endDate ? toDateTimeLocalInput(s.endDate) : toDateTimeLocalInput(s.date)) : (s.endDate ? toDateInput(s.endDate) : ''), 
      awardeeId: s.awardeeId || '',
      awardeeIds: s.awardeeId ? [s.awardeeId] : []
    });
    setError(null);
    setFormOpen(true);
  };
  const closeForm = () => { setFormOpen(false); setEditing(null); };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) { setError('Judul dan tanggal wajib diisi.'); return; }
    if (form.category === 'INDIVIDU' && (!form.endDate || (form.awardeeIds.length === 0 && !form.awardeeId))) { setError('Tanggal akhir dan Awardee wajib diisi untuk sesi individu.'); return; }
    if (form.category === 'KLASIKAL' && !form.endDate) { setError('Waktu selesai wajib diisi.'); return; }
    setSaving(true); setError(null);
    
    // Parse form dates in local timezone to ISO string (UTC)
    const payload = { ...form };
    if (payload.category === 'KLASIKAL') {
      payload.date = new Date(form.date).toISOString();
      payload.endDate = new Date(form.endDate).toISOString();
    } else {
      payload.date = new Date(form.date + "T00:00:00").toISOString();
      payload.endDate = new Date(form.endDate + "T23:59:59").toISOString();
      if (form.awardeeIds.length > 0) payload.awardeeId = form.awardeeIds[0];
    }
    try {
      if (editing) {
        await fetchJson(`/api/sessions/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetchJson('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      closeForm();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    const isConfirmed = await confirm(`Hapus sesi "${s.title}"? Absensi yang terkait juga ikut terhapus.`);
    if (!isConfirmed) return;
    setBusyId(s.id);
    try {
      await fetchJson(`/api/sessions/${s.id}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((x) => x.id !== s.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputCls = `w-full text-sm rounded-xl px-3 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`;

  const upcoming = sessions.filter((s) => new Date(s.date) >= new Date(new Date().toDateString()));
  const past = sessions.filter((s) => new Date(s.date) < new Date(new Date().toDateString()));

  const STATUS_LABEL = { MENUNGGU_KONFIRMASI: 'Menunggu', HADIR: 'Hadir', ALFA: 'Alfa', IZIN: 'Izin' };
  const STATUS_TONE = {
    MENUNGGU_KONFIRMASI: 'bg-amber-500/10 text-amber-600',
    HADIR: 'bg-emerald-500/10 text-emerald-600',
    ALFA: 'bg-rose-500/10 text-rose-600',
    IZIN: 'bg-sky-500/10 text-sky-600',
  };

  const SessionRow = ({ s }) => {
    const mine = canMutate(s);
    const summary = attSummary[s.id];
    const myAtt = isAwardee ? summary?.my : null;
    const verified = myAtt && myAtt.status !== 'MENUNGGU_KONFIRMASI';
    return (
      <div className={`flex flex-col gap-2 p-3 rounded-xl border ${darkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/70'}`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${s.category === 'INDIVIDU' ? 'bg-fuchsia-500/10 text-fuchsia-600' : (s.scope === 'NASIONAL' ? 'bg-violet-500/10 text-violet-600' : 'bg-emerald-500/10 text-emerald-600')}`}>
              {s.category === 'INDIVIDU' ? 'Individu' : (s.scope === 'NASIONAL' ? 'Nasional' : 'Wilayah')}
            </span>
            {s.wilayah?.name && s.category === 'KLASIKAL' && s.scope !== 'NASIONAL' && (
              <span className="inline-flex items-center gap-1 text-[9px] text-slate-500">
                <MapPin className="w-2.5 h-2.5" /> {s.wilayah.name.replace(/^Wilayah\s+/i, '')}
              </span>
            )}
            {isAwardee && myAtt && (
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${STATUS_TONE[myAtt.status]}`}>
                {myAtt.status === 'HADIR' ? <CheckCircle2 className="w-2.5 h-2.5" /> : myAtt.status === 'ALFA' ? <XCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                {STATUS_LABEL[myAtt.status]}
              </span>
            )}
            {canReview && summary && (
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${summary.pending > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-500/10 text-slate-500'}`}>
                <Users className="w-2.5 h-2.5" /> {summary.total} absensi{summary.pending > 0 ? ` · ${summary.pending} mnggu` : ''}
              </span>
            )}
          </div>
          <p className="font-bold text-xs mb-1 line-clamp-2 leading-snug">{s.title}</p>
          <div className="flex flex-col gap-0.5 text-[10px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3 shrink-0" />
              {s.category === 'INDIVIDU' ? `${fmtDate(s.date)} - ${fmtDate(s.endDate)}` : fmtDate(s.date)}
            </span>
            {s.category === 'KLASIKAL' && s.endDate && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" />{fmtTime(s.date)} - {fmtTime(s.endDate)}
              </span>
            )}
            {s.category === 'INDIVIDU' && s.awardee && (
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3 shrink-0" />{s.awardee.user?.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 shrink-0 flex-wrap">
          {isAwardee && (() => {
            const attnOpen = isAttendanceOpen(s, now);
            const excOpen  = isExcuseOpen(s, myAtt?.status, now);
            const isExcuseSubmitted = myAtt?.excuseCategory && myAtt?.status === 'MENUNGGU_KONFIRMASI';
            const attendBlockedReason = verified
              ? 'Sudah diverifikasi mentor — hubungi mentor jika perlu diubah'
              : (!attnOpen ? attendanceStatusText(s, now) : '');
            const excuseBlockedReason = !excOpen ? excuseStatusText(s, myAtt?.status, now) : '';
            return (
              <>
                <button
                  onClick={() => setAttendModal({ session: s, existing: myAtt })}
                  disabled={verified || !attnOpen}
                  title={attendBlockedReason}
                  className="px-3 py-1.5 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 rounded-lg font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  {verified ? 'Terverifikasi' : (myAtt?.selfiePhoto ? 'Ganti Absensi' : 'Absen')}
                </button>
                <button
                  onClick={() => setExcuseModal({ session: s, existing: myAtt })}
                  disabled={!excOpen}
                  title={excuseBlockedReason}
                  className="px-3 py-1.5 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 rounded-lg font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {isExcuseSubmitted ? 'Ganti Izin' : 'Izin'}
                </button>
              </>
            );
          })()}
          {canReview && (
            <button
              type="button"
              onClick={() => setReviewSession(s)}
              className="p-1.5 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded-lg transition-colors cursor-pointer"
              title="Kelola & Review Absensi"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
            </button>
          )}
          {canCreate && mine && (
            <>
              <button
                type="button"
                onClick={() => openEdit(s)}
                disabled={busyId === s.id}
                className="p-1.5 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Edit Sesi"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(s)}
                disabled={busyId === s.id}
                className="p-1.5 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Hapus Sesi"
              >
                {busyId === s.id ? (
                  <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // If a reviewer clicked "Absensi" on a session, show the review panel instead
  // of the list so they can focus on that one session.
  if (reviewSession) {
    return <AttendanceReview darkMode={darkMode} session={reviewSession} onBack={() => { setReviewSession(null); load(); }} />;
  }

  const bookedAwardeeIds = new Set(sessions.filter(s => s.category === 'INDIVIDU').map(s => s.awardeeId));
  const availableAwardees = awardees.filter(a => !bookedAwardeeIds.has(a.id) || (editing && form.awardeeIds.includes(a.id)));

  return (
    <div className="space-y-6">
      <div className={`border rounded-3xl p-5 flex items-center justify-between gap-3 ${card}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600"><Calendar className="w-5 h-5" /></div>
          <div className="min-w-0">
            <h3 className="text-base font-black">Sesi Pembinaan</h3>
            <p className="text-xs text-slate-500 truncate">
              {loading ? 'Memuat...' : `${sessions.length} sesi total • ${upcoming.length} mendatang`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canReview && sessions.length > 0 && (
            <button
              type="button"
              onClick={handleExportAll}
              disabled={exportingAll}
              className="p-2.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl font-bold text-xs flex items-center justify-center transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              title={exportingAll ? 'Mengekspor data ke Excel...' : 'Export Semua Data Presensi ke Excel'}
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          )}
          {canCreate && !formOpen && (
            <button
              type="button"
              onClick={openNew}
              className="p-2.5 bg-gradient-to-br from-[#0f2942] via-sky-800 to-amber-400 text-white font-bold text-xs rounded-xl flex items-center justify-center shrink-0 shadow-sm hover:opacity-95 transition-all cursor-pointer"
              title="Tambah Sesi Baru"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {error && !formOpen && (
        <div className="flex items-start gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={save} className={`w-full max-w-md my-8 border rounded-3xl p-5 space-y-4 shadow-2xl ${card}`}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black">{editing ? 'Edit Sesi' : `Sesi Baru (${role === 'superadmin' ? 'Nasional' : 'Wilayah'})`}</h4>
              <button type="button" onClick={closeForm} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
            </div>
            {error && (
              <div className="flex items-start gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Judul <span className="text-rose-500">*</span></label>
              <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="mis. Pembinaan Mingguan Quranic Tahfidz" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Kategori Sesi <span className="text-rose-500">*</span></label>
              <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} disabled={editing}>
                <option value="KLASIKAL">Klasikal (Group)</option>
                {role?.toLowerCase() === 'mentor' && awardees?.length > 0 && <option value="INDIVIDU">Individu (1-on-1)</option>}
              </select>
            </div>
            
            {form.category === 'KLASIKAL' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Waktu Mulai <span className="text-rose-500">*</span></label>
                  <input type="datetime-local" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Waktu Selesai <span className="text-rose-500">*</span></label>
                  <input type="datetime-local" className={inputCls} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Tanggal Mulai <span className="text-rose-500">*</span></label>
                    <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Tanggal Berakhir <span className="text-rose-500">*</span></label>
                    <input type="date" className={inputCls} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-xs font-bold text-slate-400 block mb-2">Pilih Awardee <span className="text-rose-500">*</span></label>
                  {availableAwardees.length === 0 ? (
                    <div className="text-sm text-slate-500 italic p-3 border rounded-xl border-dashed dark:border-slate-700">Semua awardee sudah memiliki sesi individu.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-xl dark:border-slate-700">
                      {availableAwardees.map(a => (
                        <label key={a.id} className={`flex items-center gap-3 text-sm p-3 rounded-xl transition-all cursor-pointer border ${form.awardeeIds.includes(a.id) ? 'bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800' : 'hover:bg-slate-50 border-transparent dark:hover:bg-slate-800'}`}>
                          <input type="checkbox" className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 dark:bg-slate-800 dark:border-slate-600" 
                            checked={form.awardeeIds.includes(a.id)}
                            onChange={(e) => {
                              const ids = new Set(form.awardeeIds);
                              if (e.target.checked) ids.add(a.id);
                              else ids.delete(a.id);
                              setForm({ ...form, awardeeIds: Array.from(ids) });
                            }} 
                            disabled={editing !== null && form.awardeeIds.length === 1 && !form.awardeeIds.includes(a.id)}
                          />
                          <span className="truncate font-medium">{a.user?.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="flex items-center gap-2 pt-2">
              <button type="button" onClick={closeForm} className="flex-1 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700">Batal</button>
              <button type="submit" disabled={saving}
                className="flex-1 px-5 py-2.5 bg-gradient-to-br from-[#0f2942] via-sky-800 to-amber-400 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50">
                {saving ? 'Menyimpan...' : (editing ? 'Simpan' : 'Buat Sesi')}
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div className={`border rounded-3xl p-10 text-center ${card}`}>
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold mb-1">Belum ada sesi pembinaan</p>
          <p className="text-xs text-slate-500">{canCreate ? 'Klik "Tambah Sesi" untuk memulai.' : 'Sesi akan muncul di sini begitu dijadwalkan.'}</p>
        </div>
      )}

      {/* Helper to render sessions grouped by wilayah with collapsible accordion */}
      {(() => {
        const renderWilayahAccordion = (list, sectionName) => {
          const grouped = groupSessionsByWilayah(list);
          if (!grouped['Nasional']) {
            grouped['Nasional'] = [];
          }
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
                const groupSessions = grouped[wilayah];
                const groupId = `${sectionName}-${wilayah}`;
                const isExpanded = !!expandedGroups[groupId];

                return (
                  <div
                    key={groupId}
                    className={`border rounded-2xl overflow-hidden transition-all shadow-xs hover:shadow-sm ${
                      darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200/80 bg-white'
                    }`}
                  >
                    <div
                      onClick={() => toggleWilayahGroup(sectionName, wilayah)}
                      className={`p-3.5 flex flex-col justify-between gap-2.5 cursor-pointer select-none transition-colors ${
                        darkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`p-1.5 rounded-lg shrink-0 ${
                              wilayah.toLowerCase() === 'nasional'
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

                        <div className="flex items-center gap-1 shrink-0">
                          {canReview && groupSessions.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportSessionsAttendanceList({
                                  sessions: groupSessions,
                                  filename: `Presensi_${wilayah.replace(/[^a-zA-Z0-9]/g, '_')}_${sectionName}.xlsx`,
                                }).catch((err) => alert(err.message || 'Gagal export data', 'Gagal'));
                              }}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors cursor-pointer"
                              title={`Export presensi ${wilayah} ke Excel`}
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <div className="text-slate-400 p-0.5">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
                        <span className="text-slate-400 font-medium">Total Sesi</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full ${
                            darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {groupSessions.length} sesi
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-2.5 pt-0 space-y-2 border-t border-slate-100 dark:border-slate-800/60 max-h-96 overflow-y-auto">
                        {groupSessions.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic py-3 text-center">
                            Belum ada sesi {wilayah.toLowerCase() === 'nasional' ? 'nasional' : `di wilayah ${wilayah}`}{sectionName === 'upcoming' ? ' mendatang' : ''}.
                          </p>
                        ) : (
                          groupSessions.map((s) => (
                            <SessionRow key={s.id} s={s} />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        };

        return (
          <>
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
                Mendatang ({upcoming.length})
              </p>
              {renderWilayahAccordion(upcoming, 'upcoming')}
            </div>
            {past.length > 0 && (
              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
                  Riwayat ({past.length})
                </p>
                {renderWilayahAccordion(past, 'past')}
              </div>
            )}
          </>
        );
      })()}

      {attendModal && (
        <AttendanceModal
          darkMode={darkMode}
          session={attendModal.session}
          existing={attendModal.existing}
          onClose={() => setAttendModal(null)}
          onSaved={load}
        />
      )}
      {excuseModal && (
        <ExcuseModal
          darkMode={darkMode}
          session={excuseModal.session}
          existing={excuseModal.existing}
          onClose={() => setExcuseModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
