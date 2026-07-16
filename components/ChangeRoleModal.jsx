import React, { useState } from 'react';
import { X, AlertCircle, Shield, Save } from 'lucide-react';

const ROLES = [
  { value: 'UNVERIFIED', label: 'Unverified', desc: 'Akun tidak aktif — user hanya melihat halaman menunggu approval.' },
  { value: 'AWARDEE',    label: 'Awardee',    desc: 'Peserta program. Butuh profil lengkap + wilayah.' },
  { value: 'MENTOR',     label: 'Mentor',     desc: 'Pengelola satu wilayah binaan. Butuh profil lengkap + wilayah unik.' },
  { value: 'SUPERADMIN', label: 'Superadmin', desc: 'Akses penuh ke semua fitur & data.' },
];

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    const msg = ct.includes('application/json') ? (await res.json())?.error : await res.text();
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return ct.includes('application/json') ? res.json() : null;
}

// Modal untuk Superadmin: ubah role user existing (bukan cuma approve pending).
// PATCH /api/users/[id] sudah support ini — server juga guard supaya superadmin
// tidak bisa demote dirinya sendiri.
export default function ChangeRoleModal({ darkMode, user, currentRole, meId, onClose, onSaved }) {
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isSelf = user.id === meId;
  const changed = role !== currentRole;

  const save = async () => {
    if (!changed) { onClose(); return; }
    if (isSelf && role !== 'SUPERADMIN') {
      setError('Kamu tidak boleh menurunkan role diri sendiri.');
      return;
    }
    setSaving(true); setError(null);
    try {
      await fetchJson(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (onSaved) onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className={`w-full max-w-md mt-4 mb-24 md:my-8 border rounded-3xl shadow-2xl ${card}`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0">
            <h3 className="text-base font-black truncate">Ubah Role</h3>
            <p className="text-[11px] text-slate-500 truncate">{user.name} — {user.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-3">
          {isSelf && (
            <div className="flex items-start gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Ini akunmu sendiri. Kamu tidak bisa menurunkan role dari SUPERADMIN.</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            {ROLES.map((r) => {
              const active = role === r.value;
              const disabled = isSelf && r.value !== 'SUPERADMIN';
              return (
                <label key={r.value}
                  className={`block p-3 rounded-2xl border cursor-pointer transition-all ${
                    active
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : (darkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300')
                  } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  <input type="radio" name="role" value={r.value} checked={active}
                    disabled={disabled}
                    onChange={() => setRole(r.value)} className="sr-only" />
                  <div className="flex items-start gap-2">
                    <Shield className={`w-4 h-4 shrink-0 mt-0.5 ${active ? 'text-indigo-500' : 'text-slate-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-black">{r.label}</span>
                        {r.value === currentRole && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">saat ini</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">{r.desc}</p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="p-5 pt-0 flex items-center gap-2">
          <button onClick={save} disabled={saving || !changed}
            className="flex-1 px-5 py-3 bg-gradient-to-br from-[#0f2942] via-sky-800 to-amber-400 text-white font-semibold rounded-2xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'Menyimpan...' : <><Save className="w-4 h-4" /> Simpan Perubahan</>}
          </button>
          <button onClick={onClose} className="px-5 py-3 rounded-2xl font-semibold text-sm text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700">Batal</button>
        </div>
      </div>
    </div>
  );
}
