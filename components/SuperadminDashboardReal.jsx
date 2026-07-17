import React, { useEffect, useState } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  LineChart, Line, Legend, ComposedChart
} from 'recharts';
import {
  Users, MapPin, ClipboardCheck, SlidersHorizontal, Megaphone,
  TrendingUp, UserCheck, CheckCircle2, BarChart3, Shield, Loader2, RotateCcw,
  ChevronDown, ChevronUp, X
} from 'lucide-react';
import PendingApprovals from './PendingApprovals';
import SessionsManager from './SessionsManager';
import AnnouncementsManager from './AnnouncementsManager';
import ChangeRoleModal from './ChangeRoleModal';
import { Edit } from 'lucide-react';
import InstrumentEditor from './InstrumentEditor';
import { useDialog } from './DialogProvider';

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

function ProfileModal({ profile, onClose, darkMode }) {
  if (!profile) return null;
  const isAwardee = 'gpa' in profile;
  
  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className={`w-full max-w-md my-8 border rounded-3xl p-6 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-lg">Detail Profil</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <img src={profile.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.user?.name || 'User')}&background=random`} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
          <div>
            <h4 className="font-bold text-lg leading-tight">{profile.user?.name}</h4>
            <p className="text-sm opacity-60">{profile.user?.email}</p>
            <p className="text-xs font-bold text-blue-500 mt-1">{isAwardee ? 'Awardee' : 'Mentor'}</p>
          </div>
        </div>
        
        <div className="space-y-4 text-sm">
          {profile.user?.phone && (
             <div className="grid grid-cols-3 gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold opacity-60">No. HP</span>
                <span className="col-span-2">{profile.user.phone}</span>
             </div>
          )}
          {isAwardee && (
            <>
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold opacity-60">TTL</span>
                <span className="col-span-2">{profile.birthInfo || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold opacity-60">Jenis Kelamin</span>
                <span className="col-span-2">{profile.gender || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold opacity-60">Alamat</span>
                <span className="col-span-2">{profile.address || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold opacity-60">Sekolah/Univ</span>
                <span className="col-span-2">{profile.university || profile.school || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold opacity-60">Jurusan</span>
                <span className="col-span-2">{profile.major || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold opacity-60">Angkatan</span>
                <span className="col-span-2">{profile.generation || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold opacity-60">IPK / Rata-rata</span>
                <span className="col-span-2">{profile.gpa || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <span className="font-bold opacity-60">Nilai ELIX</span>
                <span className="col-span-2 font-black text-lg">{profile.elix != null ? profile.elix.toFixed(1) : '—'}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Real, DB-backed Superadmin experience. Replaces the mock SuperadminView.
export default function SuperadminDashboardReal({ darkMode, activeTab, dbUser, role }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedWilayah, setExpandedWilayah] = useState({});
  const [editingUser, setEditingUser] = useState(null);
  const [cycleFilter, setCycleFilter] = useState('ACTIVE');
  const [filterWilayah, setFilterWilayah] = useState('ALL');
  const [filterAwardee, setFilterAwardee] = useState('ALL');
  const [viewingProfile, setViewingProfile] = useState(null);
  const { confirm, alert } = useDialog();

  const toggleWilayah = (id) => {
    setExpandedWilayah(prev => ({ ...prev, [id]: !prev[id] }));
  };

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

  useEffect(() => {
    load();
    // Silent background polling every 5 seconds for real-time sync
    const intervalId = setInterval(load, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const resetAssessment = async (userId, type, userName) => {
    const isConfirmed = await confirm(`Yakin ingin mereset data penilaian ${type} untuk ${userName}? Data yang dihapus tidak bisa dikembalikan.`);
    if (!isConfirmed) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/reset-assessment/${userId}?type=${type}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      await alert(`Gagal mereset: ${e.message}`, 'Gagal');
      setLoading(false);
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';

  if (activeTab === 'attendance') {
    // Fase 6a: superadmin mengelola sesi Nasional (dan melihat semua sesi wilayah).
    // Fitur monitoring absensi lintas wilayah menyusul di Fase 6b.
    return <SessionsManager darkMode={darkMode} dbUser={dbUser} role={role} canCreate />;
  }
  if (activeTab === 'instruments') {
    return <InstrumentEditor darkMode={darkMode} />;
  }
  if (activeTab === 'pengumuman') {
    return <AnnouncementsManager darkMode={darkMode} dbUser={dbUser} role={role} />;
  }

  if (loading) {
    return (
      <div className={`border rounded-3xl p-16 flex flex-col items-center justify-center gap-4 ${card}`}>
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-bold opacity-60">Memuat data...</p>
      </div>
    );
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
                          {b.role === 'AWARDEE' && (u.hasFilledSA || u.hasFilledMA) && (
                            <button
                              onClick={() => resetAssessment(user.id, 'BOTH', user.name)}
                              className="p-2 md:px-3 md:py-1.5 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg font-bold text-xs flex items-center justify-center gap-1 shrink-0"
                              title="Reset Data SA/MA"
                            >
                              <RotateCcw className="w-4 h-4 md:w-3.5 md:h-3.5" /> <span className="hidden md:inline">Reset SA/MA</span>
                            </button>
                          )}
                          <button
                            onClick={() => setEditingUser({ user, currentRole: b.role })}
                            className="p-2 md:px-3 md:py-1.5 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 rounded-lg font-bold text-xs flex items-center justify-center gap-1 shrink-0"
                            title="Ubah role"
                          >
                            <Edit className="w-4 h-4 md:w-3.5 md:h-3.5" /> <span className="hidden md:inline">Ubah Role</span>
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
    const filteredAwardees = awardees.filter(a => {
      const matchW = filterWilayah === 'ALL' || a.wilayahId === filterWilayah;
      const matchA = filterAwardee === 'ALL' || a.id === filterAwardee;
      return matchW && matchA;
    });

    const scoredFiltered = filteredAwardees.filter((a) => a.elix != null).sort((a, b) => b.elix - a.elix);
    const avgElix = scoredFiltered.length ? (scoredFiltered.reduce((s, a) => s + a.elix, 0) / scoredFiltered.length) : null;

    const radarData = dimensionAverages.map((d) => {
      if (filterWilayah === 'ALL' && filterAwardee === 'ALL') return { subject: d.name.split(' ')[0], A: d.avg, fullMark: 4 };
      const values = filteredAwardees.map(a => {
        const sa = a.hasFilledSA ? a.saDimensionScores?.[d.id] : null;
        const ma = a.hasFilledMA ? a.maDimensionScores?.[d.id] : null;
        if (sa != null && ma != null) return 0.4 * sa + 0.6 * ma;
        if (sa != null) return sa;
        if (ma != null) return ma;
        return null;
      }).filter(v => v != null);
      const avg = values.length ? values.reduce((s,v)=>s+v,0)/values.length : 0;
      return { subject: d.name.split(' ')[0], A: Number(avg.toFixed(2)), fullMark: 4 };
    });

    const barData = filterWilayah === 'ALL' && filterAwardee === 'ALL' 
      ? wilayahRollup.filter((w) => w.avgElix != null).map((w) => {
          const wAwardees = filteredAwardees.filter(a => a.wilayahId === w.id && a.elix != null);
          const dimScores = {};
          dimensionAverages.forEach(d => {
            const values = wAwardees.map(a => {
              const sa = a.hasFilledSA ? a.saDimensionScores?.[d.id] : null;
              const ma = a.hasFilledMA ? a.maDimensionScores?.[d.id] : null;
              if (sa != null && ma != null) return 0.4 * sa + 0.6 * ma;
              if (sa != null) return sa;
              if (ma != null) return ma;
              return null;
            }).filter(v => v != null);
            const avg = values.length ? values.reduce((s,v)=>s+v,0)/values.length : 0;
            dimScores[d.name.split(' ')[0]] = Number((avg * 25).toFixed(1));
          });
          return { name: w.name, elix: w.avgElix, ...dimScores };
        })
      : scoredFiltered.map(a => {
          const dimScores = {};
          dimensionAverages.forEach(d => {
            const sa = a.hasFilledSA ? a.saDimensionScores?.[d.id] : null;
            const ma = a.hasFilledMA ? a.maDimensionScores?.[d.id] : null;
            let val = 0;
            if (sa != null && ma != null) val = 0.4 * sa + 0.6 * ma;
            else if (sa != null) val = sa;
            else if (ma != null) val = ma;
            dimScores[d.name.split(' ')[0]] = Number((val * 25).toFixed(1));
          });
          return { name: a.user?.name || 'Awardee', elix: a.elix, ...dimScores };
        });

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <select value={filterWilayah} onChange={e => { setFilterWilayah(e.target.value); setFilterAwardee('ALL'); }} className={`px-4 py-2 rounded-xl text-sm font-bold border outline-none cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
            <option value="ALL">Semua Wilayah</option>
            {wilayahRollup.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          {filterWilayah !== 'ALL' && (
            <select value={filterAwardee} onChange={e => setFilterAwardee(e.target.value)} className={`px-4 py-2 rounded-xl text-sm font-bold border outline-none cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
              <option value="ALL">Semua Awardee</option>
              {awardees.filter(a => a.wilayahId === filterWilayah).map(a => <option key={a.id} value={a.id}>{a.user?.name}</option>)}
            </select>
          )}
        </div>

        <div className={`border rounded-3xl p-6 ${card}`}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{filterWilayah === 'ALL' && filterAwardee === 'ALL' ? 'Rata-rata ELIX Nasional' : 'Rata-rata ELIX (Filtered)'}</p>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
            <div className="flex flex-col md:border-r border-slate-200 dark:border-slate-700 md:pr-4">
              <span className="text-4xl font-black">{avgElix == null ? '—' : avgElix.toFixed(1)}</span>
              <span className="text-[10px] text-slate-500 mt-1">dari {scoredFiltered.length} awardee ternilai</span>
            </div>
            {dimensionAverages.map((d, i) => {
              const radarDim = radarData.find(r => r.subject === d.name.split(' ')[0]);
              const dimScore = radarDim ? (radarDim.A * 25).toFixed(1) : '—';
              const colors = ['text-blue-500', 'text-emerald-500', 'text-amber-500', 'text-purple-500', 'text-pink-500'];
              return (
                <div key={d.id} className="flex flex-col">
                  <span className={`text-xl font-black ${colors[i % colors.length]}`}>{dimScore}</span>
                  <span className="text-[10px] font-bold text-slate-500 leading-tight mt-1">{d.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className={`border rounded-3xl p-5 ${card}`}>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Tren Siklus ELIX</h3>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? '#cbd5e1' : '#475569' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: darkMode ? '#0f172a' : '#fff', border: '1px solid #64748b', borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="avgElix" name="Indeks ELIX" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} label={{ fill: '#1e293b', fontSize: 12, fontWeight: 'bold', position: 'top' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`border rounded-3xl p-5 ${card}`}>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">{filterWilayah === 'ALL' && filterAwardee === 'ALL' ? 'Perbandingan ELIX per Wilayah' : 'Perbandingan ELIX antar Awardee'}</h3>
            {barData.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada data ternilai.</p>
            ) : (
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid stroke={darkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? '#cbd5e1' : '#475569' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ background: darkMode ? '#0f172a' : '#fff', border: '1px solid #64748b', borderRadius: 12, fontSize: 12 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 'bold', paddingTop: '10px' }} />
                    {dimensionAverages.map((d, i) => {
                      const dimName = d.name.split(' ')[0];
                      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
                      return (
                        <Bar key={dimName} dataKey={dimName} name={dimName} fill={colors[i % colors.length]} radius={[4,4,0,0]} />
                      )
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className={`border rounded-3xl p-6 ${card}`}>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">Kategori Indeks ELIX</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-800/50">
              <div className="text-rose-500 font-black text-lg mb-1">0 - 45</div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300">Emerging Leader</div>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-800/50">
              <div className="text-orange-500 font-black text-lg mb-1">46 - 65</div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300">Developing Leader</div>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
              <div className="text-emerald-500 font-black text-lg mb-1">66 - 85</div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300">Growing Leader</div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
              <div className="text-blue-500 font-black text-lg mb-1">86 - 100</div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300">Excellent Leader</div>
            </div>
          </div>
        </div>

        <div className={`border rounded-3xl p-5 ${card}`}>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">Peringkat Awardee</h3>
          {scoredFiltered.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada awardee dengan skor.</p>
          ) : (
            <div className="space-y-2">
              {scoredFiltered.map((a, i) => (
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
            {wilayahRollup.map((w) => {
              const isExpanded = expandedWilayah[w.id];
              const wAwardees = awardees.filter(a => a.wilayahId === w.id);
              const wMentor = mentors.find(m => m.wilayahId === w.id);

              return (
                <div key={w.id} className={`p-4 rounded-2xl border transition-colors ${darkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <div 
                    className="flex items-center justify-between gap-3 mb-2 cursor-pointer group"
                    onClick={() => toggleWilayah(w.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-bold text-sm truncate group-hover:text-blue-500 transition-colors">{w.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black">{w.avgElix == null ? '—' : w.avgElix.toFixed(0)}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold text-slate-500 mb-2">
                    <span>Awardee: <span className="text-slate-700 dark:text-slate-300">{w.awardeeCount}</span></span>
                    <span>·</span>
                    <span>SA: <span className="text-slate-700 dark:text-slate-300">{w.saFilled}</span></span>
                    <span>·</span>
                    <span>MA: <span className="text-slate-700 dark:text-slate-300">{w.maFilled}</span></span>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t border-slate-200 dark:border-slate-700 pt-3">
                       {wMentor && (
                         <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setViewingProfile(wMentor)}>
                           <div className="flex items-center gap-3">
                              <img src={wMentor.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(wMentor.user?.name || 'User')}&background=random`} alt="" className="w-8 h-8 rounded-full object-cover" />
                              <div>
                                 <p className="text-xs font-bold">{wMentor.user?.name}</p>
                                 <p className="text-[10px] text-blue-500 font-bold">Mentor</p>
                              </div>
                           </div>
                         </div>
                       )}
                       {wAwardees.length > 0 ? (
                         wAwardees.map(a => (
                           <div key={a.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-blue-500 transition-colors" onClick={() => window.location.href = `/awardee/${a.id}`}>
                             <div className="flex items-center gap-3">
                                <img src={a.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.user?.name || 'User')}&background=random`} alt="" className="w-8 h-8 rounded-full object-cover" />
                                <div>
                                   <p className="text-xs font-bold">{a.user?.name}</p>
                                   <p className="text-[10px] text-slate-500">{a.university || a.school}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <span className="text-xs font-black">{a.elix != null ? a.elix.toFixed(1) : '—'}</span>
                             </div>
                           </div>
                         ))
                       ) : (
                         <p className="text-[10px] text-slate-400 italic">Belum ada awardee di wilayah ini.</p>
                       )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ProfileModal profile={viewingProfile} onClose={() => setViewingProfile(null)} darkMode={darkMode} />
    </div>
  );
}
