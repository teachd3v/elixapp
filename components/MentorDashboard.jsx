import React, { useCallback, useEffect, useState } from 'react';
import {
  Users, ClipboardCheck, Megaphone, Calendar, UserCheck, MapPin,
  TrendingUp, CheckCircle2, ChevronRight, BarChart3
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  LineChart, Line, Legend, ComposedChart
} from 'recharts';
import RealProfile from './RealProfile';
import MentorAssessment from './MentorAssessment';
import SessionsManager from './SessionsManager';
import AnnouncementsManager from './AnnouncementsManager';
import { blendedScore, toElixIndex } from '../lib/assessment';

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

function elixOf(a) {
  if (!a.hasFilledSA && !a.hasFilledMA) return null;
  return toElixIndex(blendedScore(a.saScore || 0, a.maScore || 0, a.hasFilledSA, a.hasFilledMA));
}

function StatusPill({ ok, label }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${ok ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-400/10 text-slate-400'}`}>
      {label}
    </span>
  );
}

// Real, DB-backed Mentor dashboard. Lists the awardees in the mentor's region
// and lets the mentor submit MA (Mentor Assessment) for each — which fills
// maScore and completes the awardee's ELIX (SA+MA blend).
export default function MentorDashboard({ darkMode, role, dbUser, setDbUser, activeTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [cycleFilter, setCycleFilter] = useState('ACTIVE');
  const [filterAwardee, setFilterAwardee] = useState('ALL');

  const load = useCallback(async () => {
    try {
      const d = await fetchJson('/api/mentor/awardees');
      setData(d);
    } catch {
      /* handled by empty defaults */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Silent background polling every 5 seconds for real-time sync
    const intervalId = setInterval(load, 5000);
    return () => clearInterval(intervalId);
  }, [load]);

  if (activeTab === 'profile') {
    return <RealProfile darkMode={darkMode} role={role} dbUser={dbUser} setDbUser={setDbUser} />;
  }
  if (activeTab === 'pengumuman') {
    return <AnnouncementsManager darkMode={darkMode} dbUser={dbUser} role={role} />;
  }
  if (activeTab === 'sessions') {
    return <SessionsManager darkMode={darkMode} dbUser={dbUser} role={role} canCreate />;
  }

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';

  if (loading) {
    return <div className={`border rounded-3xl p-8 text-center ${card}`}><p className="text-sm opacity-60">Memuat data wilayah...</p></div>;
  }

  const wilayah = data?.wilayah;
  const awardees = data?.awardees || [];

  // ---------- assessment (MA) tab ----------
  if (activeTab === 'assessment') {
    if (selected) {
      return <MentorAssessment darkMode={darkMode} awardee={selected} onBack={() => { setSelected(null); load(); }} onSaved={load} />;
    }
    return (
      <div className="space-y-4">
        <div className={`border rounded-3xl p-5 ${card}`}>
          <h3 className="text-base font-black">Penilaian Mentor (MA)</h3>
          <p className="text-xs text-slate-500">Pilih awardee untuk menilai. Skor MA menyempurnakan ELIX mereka.</p>
        </div>
        {awardees.length === 0 ? (
          <EmptyState darkMode={darkMode} icon={Users} title="Belum ada awardee"
            desc="Belum ada awardee terdaftar di wilayahmu untuk dinilai." />
        ) : (
          awardees.map((a) => (
            <button key={a.id} onClick={() => setSelected(a)}
              className={`w-full border rounded-2xl p-4 flex items-center justify-between gap-3 text-left transition-all hover:shadow-sm ${card}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {a.user?.avatarUrl ? <img src={a.user.avatarUrl} alt={a.user?.name} className="w-full h-full object-cover" /> : <UserCheck className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-sm block truncate">{a.user?.name}</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <StatusPill ok={a.hasFilledSA} label={a.hasFilledSA ? `SA ${(a.saScore || 0).toFixed(1)}` : 'SA belum'} />
                    <StatusPill ok={a.hasFilledMA} label={a.hasFilledMA ? `MA ${(a.maScore || 0).toFixed(1)}` : 'MA belum'} />
                  </div>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-amber-600 shrink-0">
                {a.hasFilledMA ? 'Ubah' : 'Nilai'} <ChevronRight className="w-4 h-4" />
              </span>
            </button>
          ))
        )}
      </div>
    );
  }

  // ---------- elix_analysis tab ----------
  if (activeTab === 'elix_analysis') {
    const { wilayah, awardees, dimensionAverages } = data || {};
    
    const filteredAwardees = (awardees || []).filter(a => filterAwardee === 'ALL' || a.id === filterAwardee);
    const withElix = filteredAwardees.map(a => ({ ...a, elix: elixOf(a) })).filter(a => a.elix !== null);
    const avgElix = withElix.length ? withElix.reduce((s, a) => s + a.elix, 0) / withElix.length : null;
    
    const barData = withElix.map(a => {
      const dimScores = {};
      (dimensionAverages || []).forEach(d => {
        const sa = a.hasFilledSA ? a.saDimensionScores?.[d.id] : null;
        const ma = a.hasFilledMA ? a.maDimensionScores?.[d.id] : null;
        let val = 0;
        if (sa != null && ma != null) val = 0.4 * sa + 0.6 * ma;
        else if (sa != null) val = sa;
        else if (ma != null) val = ma;
        dimScores[d.name.split(' ')[0]] = Number((val * 25).toFixed(1));
      });
      return { name: a.user?.name || 'Unknown', elix: a.elix, ...dimScores };
    });
    
    const radarData = (dimensionAverages || []).map(d => {
      if (filterAwardee === 'ALL') return { subject: d.name.split(' ')[0], A: d.avg, fullMark: 4 };
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

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <select value={filterAwardee} onChange={e => setFilterAwardee(e.target.value)} className={`px-4 py-2 rounded-xl text-sm font-bold border outline-none cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
            <option value="ALL">Semua Awardee</option>
            {(awardees || []).map(a => <option key={a.id} value={a.id}>{a.user?.name}</option>)}
          </select>
        </div>

        <div className={`border rounded-3xl p-6 ${card}`}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{filterAwardee === 'ALL' ? `Rata-rata ELIX Wilayah ${wilayah?.name || ''}` : 'Rata-rata ELIX (Filtered)'}</p>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
            <div className="flex flex-col md:border-r border-slate-200 dark:border-slate-700 md:pr-4">
              <span className="text-4xl font-black">{avgElix == null ? '—' : avgElix.toFixed(1)}</span>
              <span className="text-[10px] text-slate-500 mt-1">dari {withElix.length} awardee ternilai</span>
            </div>
            {(dimensionAverages || []).map((d, i) => {
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
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Perbandingan ELIX antar Awardee</h3>
            {barData.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada awardee ternilai di wilayah ini.</p>
            ) : (
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid stroke={darkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? '#cbd5e1' : '#475569' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ background: darkMode ? '#0f172a' : '#fff', border: '1px solid #64748b', borderRadius: 12, fontSize: 12 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 'bold', paddingTop: '10px' }} />
                    {(dimensionAverages || []).map((d, i) => {
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
      </div>
    );
  }


  // ---------- dashboard tab ----------
  const withElix = awardees.map(elixOf).filter((x) => x != null);
  const avgElix = withElix.length ? (withElix.reduce((s, x) => s + x, 0) / withElix.length) : null;
  const stats = [
    { label: 'Total Awardee', value: awardees.length, icon: Users, tone: 'text-sky-500' },
    { label: 'Sudah isi SA', value: awardees.filter((a) => a.hasFilledSA).length, icon: CheckCircle2, tone: 'text-emerald-500' },
    { label: 'Sudah dinilai MA', value: awardees.filter((a) => a.hasFilledMA).length, icon: ClipboardCheck, tone: 'text-amber-500' },
    { label: 'Rata-rata ELIX', value: avgElix == null ? '—' : avgElix.toFixed(0), icon: TrendingUp, tone: 'text-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      <div className={`border rounded-3xl p-6 ${card}`}>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 flex items-center justify-center border border-amber-500 shadow-sm">
            {dbUser?.avatarUrl ? (
              <img src={dbUser.avatarUrl} alt={dbUser.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-slate-400">{dbUser?.name?.charAt(0) || 'M'}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 mb-1">Dashboard Mentor</p>
            <h2 className="text-xl font-black truncate">{dbUser?.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600">
                <MapPin className="w-3 h-3" /> Wilayah {wilayah?.name || '—'}
              </span>
            </div>
          </div>
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
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">Daftar Awardee Bimbingan</h3>
        {awardees.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Belum ada awardee di wilayahmu.</p>
        ) : (
          <div className="space-y-3">
            {awardees.map((a) => {
              const elix = elixOf(a);
              return (
                <div key={a.id} onClick={() => window.location.href = `/awardee/${a.id}`} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-indigo-500 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {a.user?.avatarUrl ? <img src={a.user.avatarUrl} alt={a.user?.name} className="w-full h-full object-cover" /> : <UserCheck className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs block truncate">{a.user?.name}</span>
                      <span className="text-[10px] text-slate-400">{a.school || '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusPill ok={a.hasFilledSA} label={a.hasFilledSA ? `SA ${(a.saScore || 0).toFixed(1)}` : 'SA —'} />
                    <StatusPill ok={a.hasFilledMA} label={a.hasFilledMA ? `MA ${(a.maScore || 0).toFixed(1)}` : 'MA —'} />
                    <span className="text-xs font-black w-8 text-right hidden sm:block">{elix == null ? '—' : elix.toFixed(0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
