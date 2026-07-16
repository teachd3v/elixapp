import React, { useCallback, useEffect, useState } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';
import {
  BookOpen, ClipboardCheck, FolderHeart, Award, MapPin,
  GraduationCap, UserCheck, TrendingUp, CalendarDays, Loader2
} from 'lucide-react';
import RealProfile from './RealProfile';
import SelfAssessment from './SelfAssessment';
import SessionsManager from './SessionsManager';
import PortfolioManager from './PortfolioManager';
import { toElixIndex, elixCategory, blendedScore } from '../lib/assessment';
// Force Turbopack reload

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

// Real, DB-backed Awardee dashboard. Data comes from /api/profile; scores come
// from the real Self Assessment. New awardees see honest empty/zero states.
export default function AwardeeDashboard({ darkMode, role, dbUser, setDbUser, activeTab }) {
  const [data, setData] = useState(null);
  const [dimensions, setDimensions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [d, inst] = await Promise.all([
        fetchJson('/api/profile'),
        fetchJson('/api/instruments')
      ]);
      setData(d);
      setDimensions(inst || []);
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
  if (activeTab === 'assessment') {
    return <SelfAssessment darkMode={darkMode} onSaved={load} />;
  }
  if (activeTab === 'attendance') {
    // Fase 6a: awardee bisa lihat daftar sesi (mendatang & riwayat).
    // Tombol absen dengan foto akan hadir di Fase 6b.
    return <SessionsManager darkMode={darkMode} dbUser={dbUser} role={role} canCreate={false} />;
  }
  if (activeTab === 'portfolio') {
    return <PortfolioManager darkMode={darkMode} dbUser={dbUser} role={role} canCreate />;
  }

  // ---------- dashboard tab ----------
  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';

  if (loading) {
    return (
      <div className={`border rounded-3xl p-16 flex flex-col items-center justify-center gap-4 ${card}`}>
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-bold opacity-60">Memuat dashboard...</p>
      </div>
    );
  }

  const profile = data?.profile;
  const saScore = profile?.saScore ?? 0;
  const hasSA = !!profile?.hasFilledSA;
  const maScore = profile?.maScore ?? 0;
  const hasMA = !!profile?.hasFilledMA;
  const dimScores = profile?.saDimensionScores || {};
  const elixIndex = (hasSA || hasMA) ? toElixIndex(blendedScore(saScore, maScore, hasSA, hasMA)) : null;

  const chips = [
    profile?.wilayah?.name && { icon: MapPin, text: `Wilayah ${profile.wilayah.name}` },
    profile?.school && { icon: GraduationCap, text: profile.school },
    profile?.generation && { icon: Award, text: `Angkatan ${profile.generation}` },
  ].filter(Boolean);

  const stats = [
    { label: 'ELIX Index', value: elixIndex == null ? '—' : elixIndex.toFixed(0), icon: TrendingUp, tone: 'text-indigo-500' },
    { label: 'Skor SA', value: hasSA ? saScore.toFixed(2) : 'Belum', icon: BookOpen, tone: 'text-sky-500' },
    { label: 'Skor MA', value: profile?.hasFilledMA ? (profile.maScore ?? 0).toFixed(2) : 'Belum', icon: UserCheck, tone: 'text-amber-500' },
    { label: 'Sesi Dihadiri', value: 0, icon: CalendarDays, tone: 'text-emerald-500' },
  ];

  const radarData = dimensions.map((dim) => ({
    subject: dim.name.split(' ')[0],
    A: dimScores[dim.id] || 0,
    fullMark: 4,
  }));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className={`border rounded-3xl p-6 ${card}`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
            {dbUser?.avatarUrl
              ? <img src={dbUser.avatarUrl} alt={dbUser.name} className="w-full h-full object-cover" />
              : <UserCheck className="w-7 h-7 text-slate-400" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400">Selamat datang,</p>
            <h2 className="text-xl font-black truncate">{dbUser?.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {chips.map(({ icon: Icon, text }, i) => (
                <span key={i} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon className="w-3 h-3" /> {text}
                </span>
              ))}
              {hasSA && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500">
                  <TrendingUp className="w-3 h-3" /> {elixCategory(elixIndex)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stat tiles */}
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

      {/* Radar (real SA dimension scores) or empty prompt */}
      {hasSA ? (
        <div className={`border rounded-3xl p-6 ${card}`}>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-2">Profil Dimensi (Self Assessment)</h3>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: darkMode ? '#cbd5e1' : '#475569' }} />
                <PolarRadiusAxis domain={[0, 4]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Radar name="SA" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className={`border rounded-3xl p-5 flex items-center gap-3 ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
          <TrendingUp className="w-5 h-5 shrink-0" />
          <p className="text-xs font-semibold leading-relaxed">
            Kamu belum mengisi Self Assessment. Buka tab <b>Self Assessment (SA)</b> untuk menilai dirimu — ELIX Index dan profil dimensimu akan langsung terhitung.
          </p>
        </div>
      )}
    </div>
  );
}
