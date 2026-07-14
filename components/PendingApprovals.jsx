import React, { useEffect, useState } from 'react';
import { UserCheck, Clock, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

const APPROVE_ROLES = [
  { value: 'AWARDEE', label: 'Awardee' },
  { value: 'MENTOR', label: 'Mentor' },
  { value: 'SUPERADMIN', label: 'Superadmin' },
];

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok || !contentType.includes('application/json')) {
    const detail = contentType.includes('application/json')
      ? (await res.json().catch(() => ({})))?.error
      : await res.text().catch(() => '');
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// SUPERADMIN-only panel: lists users still pending approval (role UNVERIFIED)
// and lets an admin approve them by assigning a role. Backed by the real
// /api/users endpoints, which re-check the caller's role server-side.
export default function PendingApprovals({ darkMode }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState({}); // userId -> role
  const [submittingId, setSubmittingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await fetchJson('/api/users');
      setPending(users.filter(u => u.role === 'UNVERIFIED'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (user) => {
    const role = selectedRole[user.id] || 'AWARDEE';
    setSubmittingId(user.id);
    try {
      await fetchJson(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      setPending(prev => prev.filter(u => u.id !== user.id));
    } catch (err) {
      setError(`Gagal menyetujui ${user.email}: ${err.message}`);
    } finally {
      setSubmittingId(null);
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';

  return (
    <div className={`border rounded-[32px] overflow-hidden shadow-sm ${card}`}>
      <div className="p-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-amber-500/10 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-wider">Persetujuan Akun Baru</p>
            <p className="text-xs text-slate-500 font-bold">
              {loading ? 'Memuat...' : `${pending.length} user menunggu approval`}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} disabled:opacity-50`}
          title="Muat ulang"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mx-5 mb-4 flex items-start gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && pending.length === 0 && (
        <div className="px-5 pb-6 flex flex-col items-center gap-2 text-slate-400 text-xs font-bold">
          <CheckCircle2 className="w-8 h-8 opacity-20" />
          Tidak ada akun yang menunggu persetujuan.
        </div>
      )}

      {pending.length > 0 && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {pending.map(user => (
            <div key={user.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : <UserCheck className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="min-w-0">
                  <span className="font-bold block text-sm truncate">{user.name}</span>
                  <span className="text-[11px] text-slate-500 truncate block">{user.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-0 border-slate-200 dark:border-slate-700 pt-3 sm:pt-0">
                <select
                  value={selectedRole[user.id] || 'AWARDEE'}
                  onChange={(e) => setSelectedRole(prev => ({ ...prev, [user.id]: e.target.value }))}
                  disabled={submittingId === user.id}
                  className={`text-xs font-bold rounded-xl px-3 py-2 border cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                >
                  {APPROVE_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <button
                  onClick={() => approve(user)}
                  disabled={submittingId === user.id}
                  className="px-4 py-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-xl flex items-center gap-2 font-bold text-xs transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submittingId === user.id ? 'Memproses...' : 'Setujui'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
