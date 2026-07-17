'use client';
import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, MapPin, GraduationCap, FileText, Download,
  CheckCircle2, XCircle, LayoutDashboard, LineChart, Target
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

export default function AwardeeDetailPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/awardees/${resolvedParams.id}`).then(r => {
        if (!r.ok) throw new Error('Gagal memuat profil awardee');
        return r.json();
      }),
      fetch('/api/admin/dimensions').then(r => r.ok ? r.json() : [])
    ]).then(([awardeeData, dimData]) => {
      setData(awardeeData);
      setDimensions(dimData);
      setLoading(false);
    }).catch(e => {
      setError(e.message);
      setLoading(false);
    });
  }, [resolvedParams.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Memuat detail...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-rose-500">{error}</div>;
  if (!data) return null;

  // Render History Line Chart
  const historyData = data.history.map(r => ({
    name: r.period?.name || 'Unknown',
    elix: r.elix || 0,
    sa: r.saScore || 0,
    ma: r.maScore || 0
  }));

  // Render Radar Chart for current active period or latest
  const dimData = dimensions.map(d => {
    const sa = data.hasFilledSA ? (data.saDimensionScores?.[d.id] || 0) : 0;
    const ma = data.hasFilledMA ? (data.maDimensionScores?.[d.id] || 0) : 0;
    let blended = 0;
    if (data.hasFilledSA && data.hasFilledMA) blended = 0.4 * sa + 0.6 * ma;
    else if (data.hasFilledSA) blended = sa;
    else if (data.hasFilledMA) blended = ma;
    
    return {
      subject: d.name,
      Skor: blended,
      fullMark: 4,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <ArrowLeft className="w-5 h-5" /> Kembali
          </button>
          <h1 className="text-xl font-black text-slate-800 hidden sm:block">Detail Awardee</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
          <img src={data.user?.avatarUrl || `https://ui-avatars.com/api/?name=${data.user?.name}&background=random`} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover shadow-sm" />
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-2xl font-black text-slate-800">{data.user?.name}</h2>
              <p className="text-slate-500 flex items-center gap-1.5 mt-1"><MapPin className="w-4 h-4"/> {data.wilayah?.name}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg"><GraduationCap className="w-4 h-4"/> {data.school || 'Belum diatur'}</span>
            </div>
          </div>
          <div className="shrink-0 bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-center min-w-[120px] w-full md:w-auto mt-4 md:mt-0">
            <div className="text-xs font-bold text-indigo-400 mb-1">Indeks ELIX</div>
            <div className="text-4xl font-black text-indigo-600 mb-1">{data.elix ? data.elix.toFixed(0) : '-'}</div>
            {data.category && <div className="text-xs font-bold text-indigo-500 mb-3">{data.category}</div>}
            
            <div className="flex items-center justify-between gap-4 border-t border-indigo-100 pt-3">
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400">Skor SA</div>
                <div className="text-sm font-black text-slate-700">{data.hasFilledSA ? (data.saScore || 0).toFixed(2) : '-'}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400">Skor MA</div>
                <div className="text-sm font-black text-slate-700">{data.hasFilledMA ? (data.maScore || 0).toFixed(2) : '-'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-black mb-4 flex items-center gap-2"><Radar className="w-5 h-5 text-sky-500"/> Sebaran Dimensi</h3>
            {dimData.some(d => d.Skor > 0) ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dimData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 4]} tick={false} axisLine={false} />
                    <Radar name="Skor" dataKey="Skor" stroke="#0284c7" fill="#38bdf8" fillOpacity={0.4} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-slate-400 font-bold bg-slate-50 rounded-2xl">Belum ada data penilaian aktif</div>
            )}
          </div>

          {/* Line Chart History */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-black mb-4 flex items-center gap-2"><LineChart className="w-5 h-5 text-emerald-500"/> Historis ELIX</h3>
            {historyData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ReLineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} domain={[0, 100]} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Line type="monotone" dataKey="elix" name="Indeks ELIX" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                  </ReLineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-slate-400 font-bold bg-slate-50 rounded-2xl">Belum ada riwayat siklus</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Tabs */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-black mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-violet-500"/> Portofolio Karya</h3>
            {data.portfolios.length > 0 ? (
              <div className="space-y-3">
                {data.portfolios.map(p => (
                  <div key={p.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm text-slate-800">{p.title}</div>
                      <div className="text-xs text-slate-500">{p.category}</div>
                    </div>
                    {p.link && <a href={p.link} target="_blank" className="text-[10px] font-bold text-sky-500 hover:underline px-3 py-1 bg-sky-50 rounded-full">Lampiran</a>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 font-bold text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">Belum ada portofolio.</div>
            )}
          </div>

          {/* Attendance */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-black mb-4 flex items-center gap-2"><LayoutDashboard className="w-5 h-5 text-orange-500"/> Riwayat Kehadiran</h3>
            {data.attendances.length > 0 ? (
              <div className="space-y-3">
                {data.attendances.map(a => (
                  <div key={a.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm text-slate-800">{a.session.title}</div>
                      <div className="text-xs text-slate-500">{new Date(a.session.date).toLocaleDateString('id-ID')}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      a.status === 'HADIR' ? 'bg-emerald-100 text-emerald-700' :
                      a.status === 'IZIN' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {a.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 font-bold text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">Belum ada data kehadiran.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
