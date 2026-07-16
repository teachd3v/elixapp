import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Plus, Edit, Trash2, X, AlertCircle, ClipboardCheck, CheckCircle2, XCircle, Users, FileText } from 'lucide-react';
import { useDialog } from './DialogProvider';
import AttendanceModal from './AttendanceModal';
import AttendanceReview from './AttendanceReview';
import ExcuseModal from './ExcuseModal';
import { isAttendanceOpen, isExcuseOpen, attendanceStatusText, excuseStatusText } from '../lib/attendance-window';

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
  return d.toISOString().slice(0, 10);
}

// Manages Sesi Pembinaan for the current user. Read-only for AWARDEE;
// CRUD for MENTOR (WILAYAH sessions) and SUPERADMIN (NASIONAL sessions).
// The server enforces scope + authorization; this UI just reflects it.
export default function SessionsManager({ darkMode, dbUser, role, canCreate = false }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // session object or null (new)
  const [form, setForm] = useState({ title: '', date: '', time: '' });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const { confirm } = useDialog();

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

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const list = await fetchJson('/api/sessions');
      setSessions(list);
      // Fetch attendance summary in parallel — a lightweight per-session GET.
      const summaries = await Promise.all(list.map(async (s) => {
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
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [role]);

  const canMutate = (s) => role === 'superadmin' || s.createdById === dbUser?.id;

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', date: '', time: '' });
    setError(null);
    setFormOpen(true);
  };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ title: s.title, date: toDateInput(s.date), time: s.time || '' });
    setError(null);
    setFormOpen(true);
  };
  const closeForm = () => { setFormOpen(false); setEditing(null); };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) { setError('Judul dan tanggal wajib diisi.'); return; }
    setSaving(true); setError(null);
    try {
      if (editing) {
        await fetchJson(`/api/sessions/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetchJson('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
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
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${s.scope === 'NASIONAL' ? 'bg-violet-500/10 text-violet-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
              {s.scope === 'NASIONAL' ? 'Nasional' : 'Wilayah'}
            </span>
            {s.wilayah?.name && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                <MapPin className="w-3 h-3" /> {s.wilayah.name}
              </span>
            )}
            {isAwardee && myAtt && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${STATUS_TONE[myAtt.status]}`}>
                {myAtt.status === 'HADIR' ? <CheckCircle2 className="w-3 h-3" /> : myAtt.status === 'ALFA' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {STATUS_LABEL[myAtt.status]}
              </span>
            )}
            {canReview && summary && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${summary.pending > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-500/10 text-slate-500'}`}>
                <Users className="w-3 h-3" /> {summary.total} absensi{summary.pending > 0 ? ` · ${summary.pending} menunggu` : ''}
              </span>
            )}
          </div>
          <p className="font-bold text-sm mb-1">{s.title}</p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(s.date)}</span>
            {s.time && <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{s.time}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
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
              onClick={() => setReviewSession(s)}
              className="px-3 py-1.5 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded-lg font-bold text-xs flex items-center gap-1"
            >
              <ClipboardCheck className="w-3.5 h-3.5" /> Absensi
            </button>
          )}
          {canCreate && mine && (
            <>
              <button onClick={() => openEdit(s)} disabled={busyId === s.id}
                className="px-3 py-1.5 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 rounded-lg font-bold text-xs flex items-center gap-1 disabled:opacity-50">
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => remove(s)} disabled={busyId === s.id}
                className="px-3 py-1.5 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg font-bold text-xs flex items-center gap-1 disabled:opacity-50">
                <Trash2 className="w-3.5 h-3.5" /> {busyId === s.id ? '...' : 'Hapus'}
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
        {canCreate && !formOpen && (
          <button onClick={openNew}
            className="p-2.5 md:px-4 md:py-2 bg-gradient-to-br from-[#0f2942] via-sky-800 to-amber-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shrink-0 shadow-md">
            <Plus className="w-4 h-4" /> <span className="hidden md:inline">Tambah Sesi</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Tanggal <span className="text-rose-500">*</span></label>
                <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Waktu</label>
                <input className={inputCls} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="mis. 13:30 - 15:30" />
              </div>
            </div>
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

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">Mendatang</p>
          {upcoming.map((s) => <SessionRow key={s.id} s={s} />)}
        </div>
      )}
      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">Riwayat</p>
          {past.map((s) => <SessionRow key={s.id} s={s} />)}
        </div>
      )}

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
