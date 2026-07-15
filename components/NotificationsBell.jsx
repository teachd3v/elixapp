import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Megaphone, MapPin, Users } from 'lucide-react';

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return ct.includes('application/json') ? res.json() : null;
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

const ROLE_LABEL = { ALL: 'Semua', AWARDEE: 'Awardee', MENTOR: 'Mentor' };

// Header notifications bell — polls /api/announcements every 60s and shows
// unread count + a dropdown of recent announcements applicable to the user.
export default function NotificationsBell({ darkMode }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const load = useCallback(async () => {
    try { setItems(await fetchJson('/api/announcements')); }
    catch { /* silent */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  // Refresh every 60s so new announcements & read state stay current.
  useEffect(() => { const t = setInterval(load, 60_000); return () => clearInterval(t); }, [load]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const unread = items.filter((n) => !n.isRead).length;

  const markOne = async (id) => {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    try { await fetch(`/api/announcements/${id}/read`, { method: 'POST' }); } catch {}
  };
  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try { await fetch('/api/announcements/read-all', { method: 'POST' }); } catch {}
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`p-2.5 rounded-full ${darkMode ? 'bg-slate-900 text-sky-400' : 'bg-sky-100 text-[#13385c]'} transition-all relative`}
        title="Notifikasi"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-rose-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 md:hidden bg-slate-900/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 mt-3 w-[calc(100vw-32px)] sm:w-96 rounded-3xl shadow-2xl z-50 overflow-hidden border flex flex-col ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          } origin-top-right animate-scale-up max-h-[80vh] sm:max-h-[70vh] -mr-[4.5rem] sm:mr-0`}>
            <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
              <h4 className="font-bold text-sm">Notifikasi</h4>
              {unread > 0 && (
                <button onClick={markAll} className="text-[10px] font-bold text-sky-500 hover:text-sky-600">
                  Tandai semua dibaca
                </button>
              )}
            </div>
            <div className="p-2 overflow-y-auto flex-1">
              {items.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs font-bold flex flex-col items-center gap-2">
                  <Bell className="w-8 h-8 opacity-20 mb-2" />
                  Belum ada notifikasi
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { if (!n.isRead) markOne(n.id); }}
                      className={`w-full text-left p-3 rounded-2xl transition-all flex gap-3 ${
                        !n.isRead
                          ? (darkMode ? 'bg-sky-900/20' : 'bg-sky-50')
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-sky-500/10 text-sky-600">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h5 className={`text-xs font-bold truncate ${!n.isRead ? (darkMode ? 'text-white' : 'text-slate-900') : (darkMode ? 'text-slate-300' : 'text-slate-600')}`}>
                            {n.title}
                          </h5>
                          <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap shrink-0">{fmtDate(n.createdAt)}</span>
                        </div>
                        <p className={`text-[10px] leading-relaxed line-clamp-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {n.message}
                        </p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            <Users className="w-2.5 h-2.5" /> {ROLE_LABEL[n.targetRole]}
                          </span>
                          {n.targetRegion && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              <MapPin className="w-2.5 h-2.5" /> Wilayah {n.targetRegionName || '—'}
                            </span>
                          )}
                          {n.createdByName && (
                            <span className="text-[9px] text-slate-400 truncate">oleh {n.createdByName}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
