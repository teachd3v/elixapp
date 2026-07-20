'use client';
import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MapPin, GraduationCap, FileText, LayoutDashboard, LineChart, BarChart3
} from 'lucide-react';
import { ResponsiveContainer,
  LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar
} from 'recharts';

const ELIX_DESCRIPTIONS = {
  'Emerging Leader': "Awardee masih berada pada tahap awal pengembangan diri dan belum menunjukkan kompetensi yang diharapkan pada sebagian besar dimensi. Kesiapan akademik masih rendah, internalisasi nilai-nilai Islam dan kedekatan dengan Al-Qur'an belum konsisten, kemampuan mengelola diri dan emosi masih terbatas, serta belum menunjukkan inisiatif dan kepemimpinan sosial yang nyata. Awardee memerlukan pendampingan intensif, penguatan karakter, dan stimulasi yang berkelanjutan untuk mengembangkan potensinya.",
  'Developing Leader': "Awardee mulai menunjukkan perkembangan positif pada kelima dimensi, seperti motivasi belajar yang meningkat, perilaku Islami yang mulai terbentuk, kebiasaan berinteraksi dengan Al-Qur'an yang mulai berkembang, kemampuan mengenali diri dan mengelola emosi yang mulai muncul, serta kepedulian sosial yang mulai terlihat. Namun, implementasi berbagai kompetensi tersebut masih belum konsisten dan masih memerlukan arahan, pembinaan, serta penguatan secara berkelanjutan.",
  'Growing Leader': "Awardee menunjukkan kompetensi yang cukup matang pada sebagian besar dimensi. Memiliki kesiapan akademik yang baik, menunjukkan karakter Islami secara konsisten, menjadikan Al-Qur'an sebagai bagian dari proses pengembangan diri, mampu mengelola potensi dan tantangan diri secara efektif, serta aktif berkontribusi dalam lingkungan sosial. Awardee mulai menunjukkan kapasitas kepemimpinan, kemampuan memengaruhi orang lain secara positif, dan kesiapan untuk mengambil peran yang lebih besar dalam menciptakan perubahan.",
  'Excellent Leader': "Awardee menunjukkan keunggulan dan konsistensi pada seluruh dimensi pengembangan. Memiliki kesiapan akademik yang tinggi dan berorientasi pada prestasi, menginternalisasi nilai-nilai Islam sebagai landasan perilaku dan pengambilan keputusan, menjadikan Al-Qur'an sebagai pedoman hidup, menunjukkan penguasaan diri yang matang melalui disiplin, integritas, dan resiliensi, serta mampu menginisiasi dan memimpin aksi-aksi yang memberikan dampak positif dan berkelanjutan bagi masyarakat. Awardee tidak hanya berkembang secara personal, tetapi juga menjadi teladan, penggerak, dan inspirasi bagi lingkungan sekitarnya."
};

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
      fetch('/api/instruments').then(r => r.ok ? r.json() : [])
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
    sa: r.saScore ? Number((r.saScore * 25).toFixed(0)) : 0,
    ma: r.maScore ? Number((r.maScore * 25).toFixed(0)) : 0
  }));

  // Render Horizontal Bar Chart for current active period or latest
  const dimData = dimensions.map(d => {
    const sa = data.hasFilledSA ? (data.saDimensionScores?.[d.id] || 0) : 0;
    const ma = data.hasFilledMA ? (data.maDimensionScores?.[d.id] || 0) : 0;
    
    return {
      subject: d.name.split(' ')[0], // short name
      full_name: d.name,
      sa: Number((sa * 25).toFixed(0)),
      ma: Number((ma * 25).toFixed(0)),
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
          <div className="shrink-0 flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <div className="text-center px-4">
              <div className="text-[10px] font-bold text-blue-500 mb-1">SKOR SA</div>
              <div className="text-2xl font-black text-slate-800">{data.hasFilledSA ? ((data.saScore || 0) * 25).toFixed(0) : '-'}</div>
            </div>
            
            <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
            
            <div className="text-center px-4">
              <div className="text-[10px] font-bold text-indigo-500 mb-1">SKOR MA</div>
              <div className="text-2xl font-black text-slate-800">{data.hasFilledMA ? ((data.maScore || 0) * 25).toFixed(0) : '-'}</div>
            </div>
            
            <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
            
            <div className="text-center px-4 bg-amber-50 rounded-xl py-2 border border-amber-100">
              <div className="text-[10px] font-bold text-amber-500 mb-1">INDEKS ELIX</div>
              <div className="text-3xl font-black text-slate-800">{data.elix ? data.elix.toFixed(0) : '-'}</div>
            </div>
          </div>
        </div>

        {/* ELIX Category Description */}
        {data.category && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="shrink-0">
                <div className="inline-flex items-center justify-center bg-amber-500 text-white font-black px-4 py-2 rounded-xl text-lg shadow-sm">
                  {data.category}
                </div>
              </div>
              <div className="text-sm text-amber-900/80 leading-relaxed">
                {ELIX_DESCRIPTIONS[data.category] || "Kategori indeks ELIX."}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Horizontal Bar Chart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-black mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-sky-500"/> Sebaran Dimensi</h3>
            {dimData.some(d => d.sa > 0 || d.ma > 0) ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dimData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} width={70} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 'bold', color: '#64748b' }} />
                    <Bar dataKey="sa" name="Skor SA" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} label={{ position: 'right', fill: '#1e293b', fontSize: 10, fontWeight: 'bold' }} />
                    <Bar dataKey="ma" name="Skor MA" fill="#1e3a8a" radius={[0, 4, 4, 0]} barSize={12} label={{ position: 'right', fill: '#1e293b', fontSize: 10, fontWeight: 'bold' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-sm text-slate-400 font-bold bg-slate-50 rounded-2xl">Belum ada data penilaian aktif</div>
            )}
          </div>

          {/* Line Chart History */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-black mb-4 flex items-center gap-2"><LineChart className="w-5 h-5 text-emerald-500"/> Tren ELIX</h3>
            {historyData.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ReLineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} domain={[0, 100]} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 'bold', color: '#64748b' }} />
                    <Line type="monotone" dataKey="sa" name="Skor SA" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} label={{ fill: '#3b82f6', fontSize: 12, fontWeight: 'bold', position: 'top' }} />
                    <Line type="monotone" dataKey="ma" name="Skor MA" stroke="#1e3a8a" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} label={{ fill: '#1e3a8a', fontSize: 12, fontWeight: 'bold', position: 'top' }} />
                  </ReLineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-sm text-slate-400 font-bold bg-slate-50 rounded-2xl">Belum ada riwayat siklus</div>
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
