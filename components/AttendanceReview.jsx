import React, { useEffect, useState } from 'react';
import { ArrowLeft, UserCheck, CheckCircle2, XCircle, Clock, RefreshCw, AlertCircle, Image as ImageIcon, FileText } from 'lucide-react';

const EXCUSE_LABEL = {
  SAKIT: 'Sakit',
  AGENDA_KELUARGA: 'Agenda Keluarga',
  AGENDA_ORGANISASI: 'Agenda Organisasi',
  AGENDA_PRIBADI: 'Agenda Pribadi',
  LAINNYA: 'Lainnya',
};

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    const msg = ct.includes('application/json') ? (await res.json())?.error : await res.text();
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return ct.includes('application/json') ? res.json() : null;
}

const STATUS_META = {
  MENUNGGU_KONFIRMASI: { label: 'Menunggu', icon: Clock, tone: 'bg-amber-500/10 text-amber-600' },
  HADIR: { label: 'Hadir', icon: CheckCircle2, tone: 'bg-emerald-500/10 text-emerald-600' },
  ALFA: { label: 'Alfa', icon: XCircle, tone: 'bg-rose-500/10 text-rose-600' },
  IZIN: { label: 'Izin', icon: Clock, tone: 'bg-sky-500/10 text-sky-600' },
};

// Panel used by MENTOR & SUPERADMIN to review attendance for one session.
// Shows submitted photos and lets the reviewer set HADIR / ALFA / reset.
export default function AttendanceReview({ darkMode, session, onBack }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [preview, setPreview] = useState(null); // { src, alt }

  const load = async () => {
    setLoading(true); setError(null);
    try { setRows(await fetchJson(`/api/sessions/${session.id}/attendance`)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load();   }, [session.id]);

  const setStatus = async (row, status) => {
    setBusyId(row.id); setError(null);
    try {
      const updated = await fetchJson(`/api/attendance/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, ...updated } : r));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';

  return (
    <div className="space-y-4">
      <div className={`border rounded-3xl p-5 ${card}`}>
        <button onClick={onBack} className="text-xs font-bold text-sky-500 hover:text-sky-600 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-4 h-4" /> Kembali ke daftar sesi
        </button>
        <h3 className="text-base font-black">Verifikasi Absensi</h3>
        <p className="text-xs text-slate-500 truncate">{session.title}</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      {loading && <div className={`border rounded-3xl p-8 text-center ${card}`}><p className="text-sm opacity-60">Memuat absensi...</p></div>}

      {!loading && rows.length === 0 && (
        <div className={`border rounded-3xl p-10 text-center ${card}`}>
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold mb-1">Belum ada awardee yang absen</p>
          <p className="text-xs text-slate-500">Absensi akan muncul di sini begitu awardee mengunggah bukti kehadiran.</p>
        </div>
      )}

      {rows.map((r) => {
        const meta = STATUS_META[r.status] || STATUS_META.MENUNGGU_KONFIRMASI;
        const Icon = meta.icon;
        const isReset = r.status !== 'MENUNGGU_KONFIRMASI';
        const isExcuseRow = !!r.excuseCategory;
        return (
          <div key={r.id} className={`border rounded-3xl p-4 ${card}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                {r.awardee?.user?.avatarUrl
                  ? <img src={r.awardee.user.avatarUrl} alt={r.awardee.user.name} className="w-full h-full object-cover" />
                  : <UserCheck className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-sm block truncate">{r.awardee?.user?.name}</span>
                <span className="text-[10px] text-slate-500 truncate block">{r.awardee?.user?.email}</span>
              </div>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${isExcuseRow ? 'bg-sky-500/10 text-sky-600' : meta.tone}`}>
                {isExcuseRow ? <FileText className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                {isExcuseRow && r.status === 'MENUNGGU_KONFIRMASI' ? 'Izin diajukan' : meta.label}
              </span>
            </div>

            {isExcuseRow ? (
              <>
                <div className="mb-3 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Kategori: <span className="text-slate-700 dark:text-slate-200">{EXCUSE_LABEL[r.excuseCategory] || r.excuseCategory}</span>
                  </p>
                  <p className="text-xs">"{r.excuseReason}"</p>
                </div>
                <button type="button" onClick={() => r.excusePhoto && setPreview({ src: r.excusePhoto, alt: `Bukti - ${r.awardee?.user?.name}` })}
                  className="w-full h-40 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 group mb-3 relative">
                  {r.excusePhoto ? (
                    <>
                      <img src={r.excusePhoto} alt="Bukti izin" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900/60 text-white">Bukti Izin</span>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400">
                      <ImageIcon className="w-5 h-5" /><span className="text-[10px] font-bold">Bukti belum ada</span>
                    </div>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[['Selfie', r.selfiePhoto], ['Suasana', r.atmospherePhoto]].map(([lab, src]) => (
                    <button key={lab} type="button" onClick={() => src && setPreview({ src, alt: `${lab} - ${r.awardee?.user?.name}` })}
                      className="relative h-28 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 group">
                      {src ? (
                        <>
                          <img src={src} alt={lab} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900/60 text-white">{lab}</span>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400">
                          <ImageIcon className="w-5 h-5" /><span className="text-[10px] font-bold">{lab} —</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {r.notes && <p className="text-[11px] text-slate-500 mb-3 italic">"{r.notes}"</p>}
              </>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {isExcuseRow ? (
                <>
                  <button onClick={() => setStatus(r, 'IZIN')} disabled={busyId === r.id || r.status === 'IZIN'}
                    className="flex-1 px-3 py-2 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Setujui Izin
                  </button>
                  <button onClick={() => setStatus(r, 'ALFA')} disabled={busyId === r.id || r.status === 'ALFA'}
                    className="flex-1 px-3 py-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
                    <XCircle className="w-3.5 h-3.5" /> Tolak (Alfa)
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setStatus(r, 'HADIR')} disabled={busyId === r.id || r.status === 'HADIR'}
                    className="flex-1 px-3 py-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Hadir
                  </button>
                  <button onClick={() => setStatus(r, 'ALFA')} disabled={busyId === r.id || r.status === 'ALFA'}
                    className="flex-1 px-3 py-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
                    <XCircle className="w-3.5 h-3.5" /> Alfa
                  </button>
                </>
              )}
              {isReset && (
                <button onClick={() => setStatus(r, 'MENUNGGU_KONFIRMASI')} disabled={busyId === r.id}
                  className="px-3 py-2 bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 rounded-xl font-bold text-xs flex items-center gap-1 disabled:opacity-40">
                  <RefreshCw className="w-3.5 h-3.5" /> Reset
                </button>
              )}
            </div>
          </div>
        );
      })}

      {preview && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <img src={preview.src} alt={preview.alt} className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}
