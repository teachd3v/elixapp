import React, { useCallback, useEffect, useState } from 'react';
import {
  Users, ClipboardCheck, Megaphone, Calendar, UserCheck, MapPin,
  TrendingUp, CheckCircle2, ChevronRight, BarChart3
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
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

  useEffect(() => { load(); }, [load]);

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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Rata-rata Penilaian</h3>
          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className={`text-xs font-bold px-3 py-1 rounded-full outline-none border transition-colors cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <option value="ACTIVE">Siklus Aktif</option>
            <option value="ALL">Semua Siklus (Tren)</option>
          </select>
        </div>
        
        <div className="w-full h-72">
          {cycleFilter === 'ACTIVE' ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={(data?.dimensionAverages || []).map(d => ({ subject: d.name.split(' ')[0], A: d.avg, fullMark: 4 }))} outerRadius="70%">
                <PolarGrid stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: darkMode ? '#cbd5e1' : '#475569' }} />
                <PolarRadiusAxis domain={[0, 4]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Radar dataKey="A" stroke="#0284c7" fill="#0284c7" fillOpacity={0.4} />
                <Tooltip contentStyle={{ background: darkMode ? '#0f172a' : '#fff', border: '1px solid #64748b', borderRadius: 12, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? '#cbd5e1' : '#475569' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: darkMode ? '#0f172a' : '#fff', border: '1px solid #64748b', borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="avgElix" name="Indeks ELIX" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
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
