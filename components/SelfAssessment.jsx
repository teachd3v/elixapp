import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, ClipboardCheck, TrendingUp } from 'lucide-react';
import AwardeePDF from './pdf/AwardeePDF';
import { elixCategory, blendedScore, toElixIndex } from '../lib/assessment';
import PDFDownloadButton from './pdf/PDFDownloadButton';

const SCALE = [
  { v: 1, label: 'Sangat Kurang', emoji: '😞', color: 'from-rose-500 to-red-500 text-white' },
  { v: 2, label: 'Kurang', emoji: '🙁', color: 'from-amber-500 to-orange-500 text-white' },
  { v: 3, label: 'Baik', emoji: '😊', color: 'from-sky-500 to-blue-600 text-white' },
  { v: 4, label: 'Sangat Baik', emoji: '🤩', color: 'from-emerald-400 to-teal-500 text-white' },
];

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const ct = res.headers.get('content-type') || '';
  if (!res.ok || !ct.includes('application/json')) {
    const detail = ct.includes('application/json') ? (await res.json().catch(() => ({})))?.error : null;
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// Real Self Assessment: statements across weighted dimensions, rated 1-4.
// Score is computed server-side; this only collects and displays.
export default function SelfAssessment({ darkMode, onSaved, dbUser, profile }) {
  const [responses, setResponses] = useState({});
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [cycleFilter, setCycleFilter] = useState('ALL');
  const containerRef = useRef(null);

  const [dimensions, setDimensions] = useState([]);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [statements, setStatements] = useState([]);

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
    // Add a tiny delay to allow render before scrolling
    setTimeout(() => {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [d, inst] = await Promise.all([
          fetchJson('/api/assessment/sa'),
          fetchJson('/api/instruments')
        ]);
        if (!active) return;
        setExisting(d);
        if (d.saResponses && typeof d.saResponses === 'object') setResponses(d.saResponses);
        setEditing(!d.hasFilledSA);

        setDimensions(inst || []);
        setStatements((inst || []).flatMap(dim => dim.statements));
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const TOTAL = statements.length;
  const answered = statements.filter((s) => {
    const v = Number(responses[s.id]);
    return v >= 1 && v <= 4;
  }).length;
  const allAnswered = TOTAL > 0 && answered === TOTAL;

  const rate = (sid, v) => setResponses((prev) => ({ ...prev, [sid]: v }));

  const submit = async () => {
    if (!allAnswered) { setError(`Masih ada ${TOTAL - answered} pernyataan yang belum diisi.`); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetchJson('/api/assessment/sa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses }),
      });
      setExisting(res);
      setEditing(false);
      if (onSaved) onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';

  if (loading) {
    return <div className={`border rounded-3xl p-8 text-center ${card}`}><p className="text-sm opacity-60">Memuat Self Assessment...</p></div>;
  }

  const formatDateRange = (start, end) => {
    if (!start || !end) return '';
    const d1 = new Date(start);
    const d2 = new Date(end);
    const m1 = d1.toLocaleString('id-ID', { month: 'long' });
    const m2 = d2.toLocaleString('id-ID', { month: 'long' });
    const y1 = d1.getFullYear();
    const y2 = d2.getFullYear();
    if (m1 === m2 && y1 === y2) {
      return `${d1.getDate()}-${d2.getDate()} ${m1} ${y1}`;
    }
    return `${d1.getDate()} ${m1} ${y1} - ${d2.getDate()} ${m2} ${y2}`;
  };

  // ---------- NOT ACTIVE VIEW ----------
  if (existing?.periodActive === false) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 text-sm font-bold px-5 py-5 rounded-3xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            {existing?.periodStatus === 'NOT_STARTED' 
              ? `Siklus ${existing.periodName} akan dibuka pada tanggal ${formatDateRange(existing.periodStart, existing.periodEnd)}.`
              : existing?.periodStatus === 'ENDED'
                ? `Siklus ${existing.periodName} sudah ditutup.`
                : 'Tidak ada siklus penilaian yang diset aktif saat ini.'}
          </span>
        </div>
      </div>
    );
  }

  // ---------- RESULT VIEW ----------
  if (!editing && existing?.hasFilledSA) {
    const dimScores = existing.saDimensionScores || {};
    const maDimScores = existing.maDimensionScores || {};
    
    // Calculate blended ELIX if MA is available, else use SA
    const saScore = existing.saScore || 0;
    const maScore = existing.maScore || 0;
    const hasMA = !!existing.hasFilledMA;
    
    // Using simple average if both exist, otherwise SA. (Can be adjusted to use weighted from constants)
    let overall = saScore;
    if (hasMA) overall = (saScore * 0.4) + (maScore * 0.6); // Assuming standard 40-60 weight
    
    const elix = (overall / 4) * 100;
    
    const getElixCategory = (score) => {
      if (score <= 45) return { 
        label: 'Emerging Leader', 
        desc: "Awardee masih berada pada tahap awal pengembangan diri dan belum menunjukkan kompetensi yang diharapkan pada sebagian besar dimensi. Kesiapan akademik masih rendah, internalisasi nilai-nilai Islam dan kedekatan dengan Al-Qur'an belum konsisten, kemampuan mengelola diri dan emosi masih terbatas, serta belum menunjukkan inisiatif dan kepemimpinan sosial yang nyata. Awardee memerlukan pendampingan intensif, penguatan karakter, dan stimulasi yang berkelanjutan untuk mengembangkan potensinya." 
      };
      if (score <= 65) return { 
        label: 'Developing Leader', 
        desc: "Awardee mulai menunjukkan perkembangan positif pada kelima dimensi, seperti motivasi belajar yang meningkat, perilaku Islami yang mulai terbentuk, kebiasaan berinteraksi dengan Al-Qur'an yang mulai berkembang, kemampuan mengenali diri dan mengelola emosi yang mulai muncul, serta kepedulian sosial yang mulai terlihat. Namun, implementasi berbagai kompetensi tersebut masih belum konsisten dan masih memerlukan arahan, pembinaan, serta penguatan secara berkelanjutan." 
      };
      if (score <= 85) return { 
        label: 'Growing Leader', 
        desc: "Awardee menunjukkan kompetensi yang cukup matang pada sebagian besar dimensi. Memiliki kesiapan akademik yang baik, menunjukkan karakter Islami secara konsisten, menjadikan Al-Qur'an sebagai bagian dari proses pengembangan diri, mampu mengelola potensi dan tantangan diri secara efektif, serta aktif berkontribusi dalam lingkungan sosial. Awardee mulai menunjukkan kapasitas kepemimpinan, kemampuan memengaruhi orang lain secara positif, dan kesiapan untuk mengambil peran yang lebih besar dalam menciptakan perubahan." 
      };
      return { 
        label: 'Excellent Leader', 
        desc: "Awardee menunjukkan keunggulan dan konsistensi pada seluruh dimensi pengembangan. Memiliki kesiapan akademik yang tinggi dan berorientasi pada prestasi, menginternalisasi nilai-nilai Islam sebagai landasan perilaku dan pengambilan keputusan, menjadikan Al-Qur'an sebagai pedoman hidup, menunjukkan penguasaan diri yang matang melalui disiplin, integritas, dan resiliensi, serta mampu menginisiasi dan memimpin aksi-aksi yang memberikan dampak positif dan berkelanjutan bagi masyarakat. Awardee tidak hanya berkembang secara personal, tetapi juga menjadi teladan, penggerak, dan inspirasi bagi lingkungan sekitarnya." 
      };
    };
    
    const category = getElixCategory(elix);

    const periods = profile?.assessmentRecords?.map(r => r.period) || [];
    // Ensure active period is included if it exists in periods
    
    // Calculate dynamicTrend for Awardee PDF
    const dynamicTrend = (periods || []).sort((a,b) => new Date(a.startDate || 0) - new Date(b.startDate || 0)).map(p => {
      const rec = profile.assessmentRecords.find(r => r.periodId === p.id);
      let avgElix = null;
      if (rec && rec.hasFilledSA && rec.hasFilledMA) {
        const raw = blendedScore(rec.saScore || 0, rec.maScore || 0, true, true);
        avgElix = toElixIndex(raw);
      }
      return {
        name: p.name,
        avgElix
      };
    });

    return (
      <div className="space-y-6 pb-24">
        <div className={`border rounded-3xl p-6 ${card}`}>
          <div className="flex items-center justify-between gap-3 mb-5 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1 overflow-x-auto no-scrollbar">
              <div className="flex flex-col gap-1 shrink-0 px-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500">SA <strong className="text-slate-700 dark:text-slate-300">{saScore.toFixed(2)}</strong></span>
                </div>
                {hasMA && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold text-slate-500">MA <strong className="text-amber-600 dark:text-amber-400">{maScore.toFixed(2)}</strong></span>
                  </div>
                )}
              </div>
              
              {hasMA && profile && (
                <>
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0"></div>
                  <select value={cycleFilter} onChange={e => setCycleFilter(e.target.value)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer shrink-0 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
                    <option value="ALL">Semua Siklus</option>
                    <option value="ACTIVE">{existing?.periodName || 'Siklus Aktif'}</option>
                    {periods.filter(p => !p.isActive).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setEditing(true)} className="p-2 sm:p-2.5 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 rounded-2xl flex items-center justify-center font-bold transition-colors" aria-label="Isi Ulang">
                <RefreshCw className="w-5 h-5" />
              </button>
              {hasMA && profile && (
                <PDFDownloadButton 
                  document={<AwardeePDF profile={profile} dbUser={dbUser} dimensions={dimensions} activePeriodName={cycleFilter === 'ACTIVE' ? (existing?.periodName || 'Siklus Aktif') : (cycleFilter === 'ALL' ? 'Semua Siklus' : (periods.find(p=>p.id===cycleFilter)?.name || 'Siklus Aktif'))} dynamicTrend={dynamicTrend} />}
                  fileName={`Laporan_ELIX_${dbUser?.name?.replace(/\s+/g, '_')}.pdf`}
                  iconOnly={true}
                />
              )}
            </div>
          </div>
          
          {/* Expandable description */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-500">Kategori Indeks ELIX</span>
              <span className="text-3xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">{elix.toFixed(0)}</span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white mb-1">{category.label}</h4>
            {/* Show truncated or full description */}
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {showFullDesc
                ? category.desc
                : `${category.desc.split(' ').slice(0,10).join(' ')}...`}
            </p>
            <button onClick={() => setShowFullDesc(!showFullDesc)}
                    className="mt-2 text-sm font-medium text-indigo-600 hover:underline">
              {showFullDesc ? 'Lihat lebih singkat' : 'Lihat selengkapnya'}
            </button>
          </div>
          
          {/* Category grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Emerging Leader', range: '0 - 45', bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-600' },
              { label: 'Developing Leader', range: '46 - 65', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-600' },
              { label: 'Growing Leader', range: '66 - 85', bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-600' },
              { label: 'Excellent Leader', range: '86 - 100', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-600' },
            ].map((c) => (
              <div key={c.label}
                   className={`p-3 rounded-xl ${c.bg} ${c.border} text-center`}> 
                <span className="block text-base font-bold text-slate-500">{c.range}</span>
                <span className={`text-xs font-bold ${c.text}`}>{c.label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {dimensions.map((dim) => {
              const saVal = dimScores[dim.id] || 0;
              const maVal = maDimScores[dim.id] || 0;
              const saPct = (saVal / 4) * 100;
              const maPct = (maVal / 4) * 100;
              return (
                <div key={dim.id}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>{dim.name}</span>
                  </div>
                  {hasMA ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span className="text-sky-500">SA</span>
                      <span className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-sky-500" style={{ width: `${saPct}%` }} />
                      </span>
                      <span className="text-slate-500">{saVal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-amber-500">MA</span>
                      <span className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${maPct}%` }} />
                      </span>
                      <span className="text-slate-500">{maVal.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${saPct}%`, backgroundColor: dim.color }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ---------- FORM ----------
  return (
    <div className="space-y-6 scroll-mt-6 pb-32" ref={containerRef}>
      <div className={`border rounded-3xl p-5 ${card}`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-sky-500/10 text-sky-600"><ClipboardCheck className="w-5 h-5" /></div>
          <div className="flex-1">
            <h3 className="text-base font-black">Self Assessment</h3>
            {existing?.periodActive && (
               <div className="mt-2 inline-block px-3 py-1 bg-emerald-500/10 text-emerald-600 font-bold text-[10px] rounded-lg border border-emerald-500/20">
                 Siklus saat ini: {existing.periodName} ({formatDateRange(existing.periodStart, existing.periodEnd)})
               </div>
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-slate-400">Progress</span>
            <span>{answered} / {TOTAL}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-blue-500 transition-all" style={{ width: TOTAL > 0 ? `${(answered / TOTAL) * 100}%` : '0%' }} />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      {dimensions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x mt-2">
          {dimensions.map((dim, idx) => (
            <button
              key={dim.id}
              onClick={() => goToStep(idx)}
              className={`snap-start shrink-0 px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                idx === currentStep
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {idx + 1}. {dim.name}
            </button>
          ))}
        </div>
      )}

      {dimensions.length > 0 && (() => {
        const dim = dimensions[currentStep];
        const items = statements.filter((s) => s.dimensionId === dim.id);
        return (
          <div key={dim.id} className={`border rounded-3xl p-5 ${card} animate-in fade-in zoom-in-95 duration-300`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dim.color }} />
              <h4 className="text-sm font-black">{dim.name}</h4>
              <span className="text-[10px] font-bold text-slate-400">Bobot {Math.round(dim.weight * 100)}%</span>
            </div>
            <div className="space-y-4">
              {items.map((s) => (
                <div key={s.id} className="border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                  <p className="text-xs mb-2 leading-relaxed"><span className="font-bold text-slate-400">{s.code}.</span> {s.textAwardee}</p>
                  <div className="flex gap-2 flex-wrap">
                    {SCALE.map(({ v, label, emoji, color }) => {
                      const active = Number(responses[s.id]) === v;
                      const disabled = existing?.periodActive === false;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => !disabled && rate(s.id, v)}
                          disabled={disabled}
                          className={`flex-1 min-w-[70px] flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all ${
                            active
                              ? `bg-gradient-to-br ${color} border-transparent shadow-lg scale-105`
                              : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800')
                          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:-translate-y-0.5'}`}
                        >
                          <span className="text-2xl mb-1 drop-shadow-sm">{emoji}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-center leading-tight">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Make it fixed at the bottom with enough spacing for mobile nav */}
      <div className={`fixed bottom-24 left-4 right-4 z-40 border rounded-3xl p-4 flex items-center justify-between gap-3 backdrop-blur shadow-xl ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => goToStep(currentStep - 1)}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Sebelumnya
          </button>
          <div className="hidden sm:block text-xs font-bold text-slate-500">
            Kategori {currentStep + 1} dari {dimensions.length}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[10px] font-bold text-slate-400">{answered} / {TOTAL} terisi</span>
          {currentStep === dimensions.length - 1 ? (
            <button
              onClick={submit}
              disabled={saving || !allAnswered || existing?.periodActive === false}
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl cursor-pointer shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrendingUp className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Kirim'}
            </button>
          ) : (
            <button
              onClick={() => goToStep(currentStep + 1)}
              className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/20"
            >
              Selanjutnya
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
