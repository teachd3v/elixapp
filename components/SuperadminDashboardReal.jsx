import React, { useEffect, useState } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import {
  Users, MapPin, ClipboardCheck, SlidersHorizontal, Megaphone,
  TrendingUp, UserCheck, CheckCircle2, BarChart3, Shield,
} from 'lucide-react';
import PendingApprovals from './PendingApprovals';
import SessionsManager from './SessionsManager';
import AnnouncementsManager from './AnnouncementsManager';
import ChangeRoleModal from './ChangeRoleModal';
import { Edit } from 'lucide-react';

async function fetchJson(url) {
  const res = await fetch(url);
  const ct = res.headers.get('content-type') || '';
  if (!res.ok || !ct.includes('application/json')) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function EmptyState({ icon: Icon, title, desc, darkMode }) {
  return (
    <div className={`border rounded-3xl p-10 flex flex-col items-center text-center gap-3 ${
      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-black">{title}</h3>
      <p className="text-xs opacity-60 max-w-sm leading-relaxed">{desc}</p>
    </div>
  );
}

// Real, DB-backed Superadmin experience. Replaces the mock SuperadminView.
// Wired tabs: dashboard, users (PendingApprovals + real directory), elix_analysis.
// The remaining tabs (attendance/instruments/pengumuman) are honest EmptyStates
// until those features have a real backend.
export default function SuperadminDashboardReal({ darkMode, activeTab, dbUser, role }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null); // { user, currentRole }

  const load = async () => {
    try {
      const d = await fetchJson('/api/admin/stats');
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';

  if (activeTab === 'attendance') {
    // Fase 6a: superadmin mengelola sesi Nasional (dan melihat semua sesi wilayah).
    // Fitur monitoring absensi lintas wilayah menyusul di Fase 6b.
    return <SessionsManager darkMode={darkMode} dbUser={dbUser} role={role} canCreate />;
  }
  if (activeTab === 'instruments') {
    return <EmptyState darkMode={darkMode} icon={SlidersHorizontal} title="Instrumen & Formula"
      desc="Bobot dimensi ELIX & pernyataan SA/MA saat ini diambil dari data/constants.js. Editor dinamis belum tersedia." />;
  }
  if (activeTab === 'pengumuman') {
    return <AnnouncementsManager darkMode={darkMode} dbUser={dbUser} role={role} />;
  }

  if (loading) {
    return <div className={`border rounded-3xl p-8 text-center ${card}`}><p className="text-sm opacity-60">Memuat data...</p></div>;
  }
  if (error) {
    return <div className={`border rounded-3xl p-8 text-center ${card}`}><p className="text-sm text-rose-500">Gagal memuat: {error}</p></div>;
  }

  const { roleCounts = {}, totals = {}, nationalElix, wilayahRollup = [], dimensionAverages = [], awardees = [], mentors = [], superadmins = [] } = data || {};

  // ---------- USERS TAB (approvals + real directory) ----------
  if (activeTab === 'users') {
    // Normalize bucket entries so each row exposes `user` + optional `wilayahId`.
    const roleBuckets = [
      { role: 'SUPERADMIN', label: 'Superadmin', tone: 'bg-rose-500/10 text-rose-600',
        users: superadmins.map((u) => ({ id: u.id, user: u })) },
      { role: 'MENTOR', label: 'Mentor', tone: 'bg-amber-500/10 text-amber-600', users: mentors },
      { role: 'AWARDEE', label: 'Awardee', tone: 'bg-sky-500/10 text-sky-600', users: awardees },
    ];
    return (
      <div className="space-y-6">
        <PendingApprovals darkMode={darkMode} />

        <div className={`border rounded-3xl p-5 ${card}`}>
          <h3 className="text-base font-black mb-1">Direktori User</h3>
          <p className="text-xs text-slate-500 mb-4">Data live dari database.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {['SUPERADMIN','MENTOR','AWARDEE','UNVERIFIED'].map((r) => (
              <div key={r} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{r}</p>
                <p className="text-xl font-black mt-1">{roleCounts[r] || 0}</p>
              </div>
            ))}
          </div>

          <div className="space-y-5">
            {roleBuckets.map((b) => (
              <div key={b.role}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className={`w-4 h-4 ${b.tone.split(' ')[1]}`} />
                  <span className="text-xs font-black uppercase tracking-wider">{b.label}</span>
                  <span className="text-[10px] font-bold text-slate-400">{b.users.length}</span>
                </div>
                {b.users.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic pl-6">Belum ada.</p>
                ) : (
                  <div className="space-y-2">
                    {b.users.map((u) => {
                      const user = u.user || u;
                      const wilayah = wilayahRollup.find((w) => w.id === u.wilayahId)?.name;
                      return (
                        <div key={u.id || user.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${darkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-white border-slate-100'}`}>
                          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                            {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : <UserCheck className="w-4 h-4 text-slate-400" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs block truncate">{user.name}</span>
                            <span className="text-[10px] text-slate-500 truncate block">{user.email}</span>
                          </div>
                          {wilayah && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                              <MapPin className="w-3 h-3 inline mr-0.5" />{wilayah}
                            </span>
                          )}
                          <button
                            onClick={() => setEditingUser({ user, currentRole: b.role })}
                            className="px-3 py-1.5 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 rounded-lg font-bold text-xs flex items-center gap-1 shrink-0"
                            title="Ubah role"
                          >
                            <Edit className="w-3.5 h-3.5" /> Ubah Role
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {editingUser && (
          <ChangeRoleModal
            darkMode={darkMode}
            user={editingUser.user}
            currentRole={editingUser.currentRole}
            meId={dbUser?.id}
            onClose={() => setEditingUser(null)}
            onSaved={load}
          />
        )}
      </div>
    );
  }

  // ---------- ELIX ANALYSIS TAB ----------
  if (activeTab === 'elix_analysis') {
    const scoredAwardees = awardees.filter((a) => a.elix != null).sort((a, b) => b.elix - a.elix);
    const radarData = dimensionAverages.map((d) => ({ subject: d.name.split(' ')[0], A: d.avg, fullMark: 4 }));
    const barData = wilayahRollup.filter((w) => w.avgElix != null).map((w) => ({ name: w.name, elix: w.avgElix }));

    return (
      <div className="space-y-6">
        <div className={`border rounded-3xl p-6 ${card}`}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-rata ELIX Nasional</p>
          <div className="flex items-baseline gap-3 mt-2">
            <span className="text-5xl font-black">{nationalElix == null ? '—' : nationalElix.toFixed(1)}</span>
            <span className="text-xs text-slate-500">dari {scoredAwardees.length} awardee ternilai</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`border rounded-3xl p-5 ${card}`}>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Perbandingan ELIX per Wilayah</h3>
            {barData.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada wilayah dengan awardee ternilai.</p>
            ) : (
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid stroke={darkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? '#cbd5e1' : '#475569' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ background: darkMode ? '#0f172a' : '#fff', border: '1px solid #64748b', borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="elix" radius={[8,8,0,0]}>
                      {barData.map((_, i) => <Cell key={i} fill="#6366f1" />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className={`border rounded-3xl p-5 ${card}`}>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Rata-rata per Dimensi (Nasional)</h3>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: darkMode ? '#cbd5e1' : '#475569' }} />
                  <PolarRadiusAxis domain={[0, 4]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Radar dataKey="A" stroke="#0284c7" fill="#0284c7" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className={`border rounded-3xl p-5 ${card}`}>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">Peringkat Awardee</h3>
          {scoredAwardees.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada awardee dengan skor.</p>
          ) : (
            <div className="space-y-2">
              {scoredAwardees.map((a, i) => (
                <div key={a.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${darkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <span className="text-xs font-black w-6 text-slate-400">#{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    {a.user?.avatarUrl ? <img src={a.user.avatarUrl} alt={a.user?.name} className="w-full h-full object-cover" /> : <UserCheck className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs block truncate">{a.user?.name}</span>
                    <span className="text-[10px] text-slate-500">{wilayahRollup.find((w) => w.id === a.wilayahId)?.name || '—'}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500">{a.category}</span>
                  <span className="text-sm font-black w-10 text-right">{a.elix.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- DASHBOARD TAB ----------
  const stats = [
    { label: 'Total Awardee', value: totals.awardees || 0, icon: Users, tone: 'text-sky-500' },
    { label: 'Total Mentor', value: totals.mentors || 0, icon: UserCheck, tone: 'text-amber-500' },
    { label: 'SA Terisi', value: totals.saFilled || 0, icon: CheckCircle2, tone: 'text-emerald-500' },
    { label: 'MA Terisi', value: totals.maFilled || 0, icon: BarChart3, tone: 'text-violet-500' },
  ];

  return (
    <div className="space-y-6">
      <div className={`border rounded-3xl p-6 ${card}`}>
        <p className="text-xs font-bold text-slate-400">Dashboard Konsolidasi</p>
        <h2 className="text-xl font-black">{dbUser?.name}</h2>
        <div className="flex items-baseline gap-3 mt-3">
          <span className="text-4xl font-black">{nationalElix == null ? '—' : nationalElix.toFixed(1)}</span>
          <span className="text-xs text-slate-500">rata-rata ELIX nasional</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={`border rounded-3xl p-5 ${card}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span>
              <Icon className={`w-4 h-4 ${tone}`} />
            </div>
            <p className="text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>

      <div className={`border rounded-3xl p-5 ${card}`}>
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">Wilayah Binaan</h3>
        {wilayahRollup.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Belum ada wilayah.</p>
        ) : (
          <div className="space-y-3">
            {wilayahRollup.map((w) => (
              <div key={w.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-bold text-sm truncate">{w.name}</span>
                  </div>
                  <span className="text-xs font-black">{w.avgElix == null ? '—' : w.avgElix.toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold text-slate-500">
                  <span>Awardee: <span className="text-slate-700 dark:text-slate-300">{w.awardeeCount}</span></span>
                  <span>·</span>
                  <span>SA: <span className="text-slate-700 dark:text-slate-300">{w.saFilled}</span></span>
                  <span>·</span>
                  <span>MA: <span className="text-slate-700 dark:text-slate-300">{w.maFilled}</span></span>
                  <span>·</span>
                  <span>Mentor: <span className="text-slate-700 dark:text-slate-300">{w.mentor?.name || '—'}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
