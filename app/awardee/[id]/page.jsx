'use client';
import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MapPin, GraduationCap, FileText, LayoutDashboard, LineChart, BarChart3, Eye,
  CheckCircle2, XCircle, Calendar, Clock, Award, Check, Phone, Mail, AlertCircle,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { ResponsiveContainer,
  LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar
} from 'recharts';
import PDFDownloadButton from '../../../components/pdf/PDFDownloadButton';
import AwardeeComprehensivePDF from '../../../components/pdf/AwardeeComprehensivePDF';
import ElixDetailModal from '../../../components/modals/ElixDetailModal';
import AppLoadingScreen from '../../../components/AppLoadingScreen';

const ELIX_DESCRIPTIONS = {
  'Emerging Leader': "Awardee masih berada pada tahap awal pengembangan diri dan belum menunjukkan kompetensi yang diharapkan pada sebagian besar dimensi. Kesiapan akademik masih rendah, internalisasi nilai-nilai Islam dan kedekatan dengan Al-Qur'an belum konsisten, kemampuan mengelola diri dan emosi masih terbatas, serta belum menunjukkan inisiatif dan kepemimpinan sosial yang nyata. Awardee memerlukan pendampingan intensif, penguatan karakter, dan stimulasi yang berkelanjutan untuk mengembangkan potensinya.",
  'Developing Leader': "Awardee mulai menunjukkan perkembangan positif pada kelima dimensi, seperti motivasi belajar yang meningkat, perilaku Islami yang mulai terbentuk, kebiasaan berinteraksi dengan Al-Qur'an yang mulai berkembang, kemampuan mengenali diri dan mengelola emosi yang mulai muncul, serta kepedulian sosial yang mulai terlihat. Namun, implementasi berbagai kompetensi tersebut masih belum konsisten dan masih memerlukan arahan, pembinaan, serta penguatan secara berkelanjutan.",
  'Growing Leader': "Awardee menunjukkan kompetensi yang cukup matang pada sebagian besar dimensi. Memiliki kesiapan akademik yang baik, menunjukkan karakter Islami secara konsisten, menjadikan Al-Qur'an sebagai bagian dari proses pengembangan diri, mampu mengelola potensi dan tantangan diri secara efektif, serta aktif berkontribusi dalam lingkungan sosial. Awardee mulai menunjukkan kapasitas kepemimpinan, kemampuan memengaruhi orang lain secara positif, dan kesiapan untuk mengambil peran yang lebih besar dalam menciptakan perubahan.",
  'Excellent Leader': "Awardee menunjukkan keunggulan dan konsistensi pada seluruh dimensi pengembangan. Memiliki kesiapan akademik yang tinggi dan berorientasi pada prestasi, menginternalisasi nilai-nilai Islam sebagai landasan perilaku dan pengambilan keputusan, menjadikan Al-Qur'an sebagai pedoman hidup, menunjukkan penguasaan diri yang matang melalui disiplin, integritas, dan resiliensi, serta mampu menginisiasi dan memimpin aksi-aksi yang memberikan dampak positif dan berkelanjutan bagi masyarakat. Awardee tidak hanya berkembang secara personal, tetapi juga menjadi teladan, penggerak, dan inspirasi bagi lingkungan sekitarnya."
};

function formatDate(d) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return null;
  }
}

export default function AwardeeDetailPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCycleForModal, setSelectedCycleForModal] = useState(null);
  const [selectedDimCycleId, setSelectedDimCycleId] = useState('');
  const [selectedPdfCycleId, setSelectedPdfCycleId] = useState('ALL');
  const [isDescExpanded, setIsDescExpanded] = useState(false);

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

  if (loading) return <AppLoadingScreen message="Memuat detail profil awardee..." />;
  if (error) return <div className="min-h-screen flex items-center justify-center text-rose-500 font-bold">{error}</div>;
  if (!data) return null;

  const cycles = data.cycles || data.history || [];
  const activeCycle = cycles.find(c => c.isLive || c.period?.isActive) || cycles[cycles.length - 1] || data;

  // Render History Line Chart across all registered periods (both historical & active)
  const historyData = cycles.map(r => ({
    name: r.period?.name || 'Unknown',
    isLive: !!r.isLive || !!r.period?.isActive,
    elix: r.elix != null ? Number(r.elix.toFixed(1)) : null,
    sa: r.hasFilledSA ? Number(((r.saScore || 0) * 25).toFixed(1)) : null,
    ma: r.hasFilledMA ? Number(((r.maScore || 0) * 25).toFixed(1)) : null,
    saRaw: r.saScore,
    maRaw: r.maScore,
    hasFilledSA: r.hasFilledSA,
    hasFilledMA: r.hasFilledMA,
  }));

  // Resolve cycle for Dimension Bar Chart
  const activeCycleForDim = (selectedDimCycleId ? cycles.find(c => c.periodId === selectedDimCycleId) : null) || activeCycle;
  const dimData = dimensions.map(d => {
    const sa = activeCycleForDim?.hasFilledSA ? (activeCycleForDim.saDimensionScores?.[d.id] || 0) : 0;
    const ma = activeCycleForDim?.hasFilledMA ? (activeCycleForDim.maDimensionScores?.[d.id] || 0) : 0;
    
    return {
      subject: d.name.split(' ')[0],
      full_name: d.name,
      sa: Number((sa * 25).toFixed(1)),
      ma: Number((ma * 25).toFixed(1)),
    };
  });

  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl text-xs space-y-2 border border-slate-700 min-w-[200px]">
          <div className="flex items-center justify-between gap-3 font-bold border-b border-slate-700 pb-1.5">
            <span>{label}</span>
            {item?.isLive && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black">Aktif</span>}
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-emerald-400 font-bold">Indeks ELIX:</span>
            <span className="font-black text-sm">{item?.elix != null ? item.elix : '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> SA:
            </span>
            <span className="font-bold">
              {item?.hasFilledSA ? `${item.sa} (${item.saRaw?.toFixed(2)}/4)` : 'Belum diisi'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> MA:
            </span>
            <span className="font-bold">
              {item?.hasFilledMA ? `${item.ma} (${item.maRaw?.toFixed(2)}/4)` : 'Belum dinilai'}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Unified Top Action Bar (Single Row, Balanced Height h-10) */}
        <div className="flex items-center gap-2 mb-4">
          {/* 1. Tombol Kembali (Icon only) */}
          <button
            onClick={() => router.back()}
            className="w-10 h-10 shrink-0 flex items-center justify-center text-slate-600 hover:text-slate-900 bg-white rounded-xl border border-slate-200 shadow-xs cursor-pointer transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* 2. Tombol Mata Detail Data ELIX (Icon only) */}
          <button
            onClick={() => {
              setSelectedCycleForModal(activeCycle?.periodId || null);
              setShowDetailModal(true);
            }}
            className="w-10 h-10 shrink-0 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl border border-indigo-200 shadow-xs transition-colors cursor-pointer"
            title="Detail Data ELIX"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* 3. Dropdown Siklus (Label 'Siklus') */}
          <select
            value={selectedPdfCycleId}
            onChange={(e) => setSelectedPdfCycleId(e.target.value)}
            className="flex-1 min-w-0 h-10 px-3 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs outline-none cursor-pointer truncate"
            title="Pilih siklus export PDF"
          >
            <option value="ALL">Siklus</option>
            {cycles.map(c => (
              <option key={c.periodId || c.id} value={c.periodId}>
                {c.period?.name || 'Siklus'} {c.isLive ? '(Aktif)' : ''}
              </option>
            ))}
          </select>

          {/* 4. Tombol Save / PDF Download */}
          <div className="shrink-0">
            <PDFDownloadButton
              key={`pdf-head-${selectedPdfCycleId}`}
              document={
                <AwardeeComprehensivePDF
                  awardee={data}
                  dimensions={dimensions}
                  selectedCycle={selectedPdfCycleId === 'ALL' ? null : selectedPdfCycleId}
                />
              }
              fileName={`Laporan_ELIX_${(data.user?.name || 'Awardee').replace(/[^a-zA-Z0-9]/g, '_')}_${
                selectedPdfCycleId === 'ALL'
                  ? 'Semua_Siklus'
                  : (cycles.find(c => c.periodId === selectedPdfCycleId)?.period?.name || 'Siklus').replace(/[^a-zA-Z0-9]/g, '_')
              }.pdf`}
              iconOnly={true}
              className="!w-10 !h-10 !p-0 !rounded-xl"
            />
          </div>
        </div>

        {/* Profile Card & Scorecard */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3.5">
          {/* Avatar & Info */}
          <div className="flex items-start gap-3 sm:gap-4">
            <img
              src={data.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user?.name || 'Awardee')}&background=random`}
              alt="Avatar"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-xs shrink-0 border border-slate-100"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <h2 className="text-base sm:text-lg font-black text-slate-800 truncate leading-snug">
                {data.user?.name}
              </h2>
              
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] leading-tight">
                {activeCycle?.period?.name && (
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
                    Siklus: {activeCycle.period.name}
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-500 shrink-0">
                  <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                  {data.wilayah?.name || '—'}
                </span>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1 text-slate-600 truncate max-w-[150px] sm:max-w-none">
                  <GraduationCap className="w-3 h-3 text-slate-400 shrink-0" />
                  {data.university || data.school || 'Belum diatur'}
                </span>
                {data.user?.email && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1 text-slate-400 truncate max-w-[150px] sm:max-w-none">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      {data.user.email}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Scorecard (3 Kolom: SA, MA, ELIX) */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50 border border-slate-100 rounded-2xl py-2 px-1">
            {/* SA */}
            <div className="flex flex-col items-center justify-center text-center px-1">
              <div className="mb-0.5">
                {activeCycle?.hasFilledSA ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                {activeCycle?.hasFilledSA ? ((activeCycle.saScore || 0) * 25).toFixed(0) : '—'}
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">SA</span>
            </div>

            {/* MA */}
            <div className="flex flex-col items-center justify-center text-center px-1">
              <div className="mb-0.5">
                {activeCycle?.hasFilledMA ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                {activeCycle?.hasFilledMA ? ((activeCycle.maScore || 0) * 25).toFixed(0) : '—'}
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">MA</span>
            </div>

            {/* ELIX */}
            <div className="flex flex-col items-center justify-center text-center px-1">
              <button
                onClick={() => {
                  setSelectedCycleForModal(activeCycle?.periodId || null);
                  setShowDetailModal(true);
                }}
                className="mb-0.5 inline-flex items-center gap-1 text-[10px] font-black text-amber-600 hover:text-amber-700 cursor-pointer"
                title="Lihat Detail ELIX"
              >
                <span>ELIX</span>
                <Eye className="w-3.5 h-3.5" />
              </button>
              <div className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                {activeCycle?.elix != null ? activeCycle.elix.toFixed(0) : '—'}
              </div>
              <span className="text-[10px] font-bold text-amber-600 truncate max-w-[85px]">
                {activeCycle?.category || 'Belum Ada'}
              </span>
            </div>
          </div>
        </div>

        {/* ELIX Category Description (Collapsible) */}
        {activeCycle?.category && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="inline-flex items-center justify-center bg-amber-500 text-white font-black px-3 py-1 rounded-lg text-xs shadow-xs">
                {activeCycle.category}
              </span>
              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="text-amber-700 hover:text-amber-900 px-2 py-1 rounded-lg hover:bg-amber-100/60 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                title={isDescExpanded ? 'Tutup rincian' : 'Baca selengkapnya'}
              >
                <span className="text-[11px]">{isDescExpanded ? 'Tutup' : 'Selengkapnya'}</span>
                {isDescExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className={`text-xs text-amber-900/80 leading-relaxed ${isDescExpanded ? '' : 'line-clamp-2'}`}>
              {ELIX_DESCRIPTIONS[activeCycle.category] || "Kategori indeks kepemimpinan ELIX."}
            </p>
          </div>
        )}

        {/* SECTION: RINCIAN NILAI SIKLUS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h3 className="text-base font-black flex items-center gap-2 text-slate-800">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <span>Rincian Nilai Siklus</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {cycles.length} Siklus
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cycles.map((c) => {
              const isLive = !!c.isLive;
              const startDateStr = formatDate(c.period?.startDate);
              const endDateStr = formatDate(c.period?.endDate);
              const dateRange = (startDateStr && endDateStr) ? `${startDateStr} - ${endDateStr}` : null;

              return (
                <div
                  key={c.id || c.periodId}
                  className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                    isLive
                      ? 'bg-gradient-to-b from-indigo-50/50 via-white to-white border-indigo-200 shadow-sm'
                      : 'bg-slate-50/60 border-slate-200/80'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header Siklus */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-sm text-slate-800 truncate">
                        {c.period?.name || 'Siklus Penilaian'}
                      </span>
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-200 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Siklus Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/70 text-slate-600 shrink-0">
                          Riwayat
                        </span>
                      )}
                    </div>

                    {dateRange && (
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{dateRange}</span>
                      </p>
                    )}

                    {/* Box Self Assessment (SA) */}
                    <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500 text-[11px]">Self Assessment (SA) · 40%</span>
                        {c.hasFilledSA ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200">
                            <CheckCircle2 className="w-3 h-3" /> Sudah Diisi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                            <XCircle className="w-3 h-3" /> Belum Diisi
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline justify-between pt-0.5">
                        <span className="text-[10px] text-slate-400">
                          {c.saSubmittedAt ? `Tanggal: ${formatDate(c.saSubmittedAt)}` : (c.hasFilledSA ? 'Tersimpan' : 'Menunggu awardee')}
                        </span>
                        <span className="text-xs font-black text-slate-800">
                          {c.hasFilledSA ? `${Number(c.saScore).toFixed(2)} / 4.00 (${((c.saScore || 0) * 25).toFixed(0)})` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Box Mentor Assessment (MA) */}
                    <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500 text-[11px]">Mentor Assessment (MA) · 60%</span>
                        {c.hasFilledMA ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200">
                            <CheckCircle2 className="w-3 h-3" /> Sudah Dinilai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200">
                            <XCircle className="w-3 h-3" /> Belum Dinilai
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline justify-between pt-0.5">
                        <span className="text-[10px] text-slate-400">
                          {c.maSubmittedAt ? `Tanggal: ${formatDate(c.maSubmittedAt)}` : (c.hasFilledMA ? 'Tersimpan' : 'Menunggu mentor')}
                        </span>
                        <span className="text-xs font-black text-slate-800">
                          {c.hasFilledMA ? `${Number(c.maScore).toFixed(2)} / 4.00 (${((c.maScore || 0) * 25).toFixed(0)})` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Box Indeks ELIX Siklus */}
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Indeks ELIX</span>
                        <span className="text-[10px] font-bold text-slate-600">
                          {c.category || (c.hasFilledSA || c.hasFilledMA ? 'Dalam Proses' : 'Belum Ada Skor')}
                        </span>
                      </div>
                      <span className="text-xl font-black text-amber-600">
                        {c.elix != null ? c.elix.toFixed(1) : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Tombol Aksi per Siklus (1 Baris) */}
                  <div className="mt-3.5 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedCycleForModal(c.periodId);
                        setShowDetailModal(true);
                      }}
                      className="flex-1 h-10 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">Detail Jawaban</span>
                    </button>
                    <div className="shrink-0">
                      <PDFDownloadButton
                        key={`card-pdf-${c.periodId}`}
                        document={<AwardeeComprehensivePDF awardee={data} dimensions={dimensions} selectedCycle={c} />}
                        fileName={`Laporan_ELIX_${(data.user?.name || 'Awardee').replace(/[^a-zA-Z0-9]/g, '_')}_${(c.period?.name || 'Siklus').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
                        iconOnly={true}
                        className="!w-10 !h-10 !p-0 !rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION: SEBARAN DIMENSI & TREN SIKLUS ELIX */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Horizontal Bar Chart (Sebaran Dimensi) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="font-black flex items-center gap-2 text-sm text-slate-800">
                <BarChart3 className="w-5 h-5 text-sky-500"/> Sebaran Dimensi
              </h3>
              {cycles.length > 1 && (
                <select
                  value={activeCycleForDim?.periodId || ''}
                  onChange={(e) => setSelectedDimCycleId(e.target.value)}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none cursor-pointer"
                >
                  {cycles.map(c => (
                    <option key={c.periodId || c.id} value={c.periodId}>
                      {c.period?.name} {c.isLive ? '(Aktif)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {dimData.some(d => d.sa > 0 || d.ma > 0) ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dimData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} width={70} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 'bold', color: '#64748b' }} />
                    <Bar dataKey="sa" name="Skor SA (Awardee)" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} label={{ position: 'right', fill: '#1e293b', fontSize: 10, fontWeight: 'bold' }} />
                    <Bar dataKey="ma" name="Skor MA (Mentor)" fill="#1e3a8a" radius={[0, 4, 4, 0]} barSize={12} label={{ position: 'right', fill: '#1e293b', fontSize: 10, fontWeight: 'bold' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl p-4 text-center">
                <AlertCircle className="w-6 h-6 mb-1 text-slate-300" />
                <span>Belum ada data skor dimensi pada siklus {activeCycleForDim?.period?.name || 'ini'}.</span>
              </div>
            )}
          </div>

          {/* Line Chart History (Tren Perkembangan Antar Siklus) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="font-black flex items-center gap-2 text-sm text-slate-800">
                <LineChart className="w-5 h-5 text-emerald-500"/> Tren Perkembangan Antar Siklus
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {historyData.length} Siklus Terdata
              </span>
            </div>

            {historyData.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ReLineChart data={historyData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} domain={[0, 100]} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 'bold', color: '#64748b' }} />
                    <Line type="monotone" dataKey="elix" name="Indeks ELIX" stroke="#10b981" strokeWidth={3.5} dot={{r: 5, strokeWidth: 2, fill: '#10b981'}} activeDot={{r: 7}} connectNulls />
                    <Line type="monotone" dataKey="sa" name="Skor SA (Awardee)" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" dot={{r: 3.5, strokeWidth: 2, fill: '#3b82f6'}} connectNulls />
                    <Line type="monotone" dataKey="ma" name="Skor MA (Mentor)" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" dot={{r: 3.5, strokeWidth: 2, fill: '#6366f1'}} connectNulls />
                  </ReLineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-sm text-slate-400 font-bold bg-slate-50 rounded-2xl">
                Belum ada data siklus penilaian
              </div>
            )}
          </div>
        </div>

        {/* SECTION: PORTOFOLIO & PRESENSI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Tabs */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-black mb-4 flex items-center gap-2 text-sm text-slate-800">
              <FileText className="w-5 h-5 text-violet-500"/> Portofolio Karya & Prestasi
            </h3>
            {data.portfolios && data.portfolios.length > 0 ? (
              <div className="space-y-3">
                {data.portfolios.map(p => (
                  <div key={p.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm text-slate-800">{p.title}</div>
                      <div className="text-xs text-slate-500">{p.category}</div>
                    </div>
                    {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-sky-500 hover:underline px-3 py-1 bg-sky-50 rounded-full">Lampiran</a>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 font-bold text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">Belum ada portofolio.</div>
            )}
          </div>

          {/* Attendance */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-black mb-4 flex items-center gap-2 text-sm text-slate-800">
              <LayoutDashboard className="w-5 h-5 text-orange-500"/> Riwayat Kehadiran Sesi
            </h3>
            {data.attendances && data.attendances.length > 0 ? (
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
              <div className="text-xs text-slate-400 font-bold text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">Belum ada data kehadiran.</div>
            )}
          </div>
        </div>

        {/* Modal Detail Data ELIX */}
        <ElixDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCycleForModal(null);
          }}
          data={data}
          dimensions={dimensions}
          initialPeriodId={selectedCycleForModal}
        />
      </div>
    </div>
  );
}
