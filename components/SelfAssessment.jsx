import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, ClipboardCheck, TrendingUp } from 'lucide-react';

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
export default function SelfAssessment({ darkMode, onSaved }) {
  const [responses, setResponses] = useState({});
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const containerRef = useRef(null);

  const [dimensions, setDimensions] = useState([]);
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
    const elix = ((existing.saScore || 0) / 4) * 100;
    return (
      <div className="space-y-6">
        <div className={`border rounded-3xl p-6 ${card}`}>
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="w-5 h-5" /></div>
              <div className="min-w-0">
                <h3 className="text-sm md:text-base font-black truncate">Self Assessment Selesai</h3>
                <div className="text-[10px] text-slate-500 mt-1 flex flex-col sm:flex-row sm:gap-2">
                  <span>Skor SA: <strong className="font-black text-slate-700 dark:text-slate-300">{(existing.saScore || 0).toFixed(2)}</strong> / 4.00</span>
                  <span className="hidden sm:inline">•</span>
                  <span>ELIX: <strong className="font-black text-slate-700 dark:text-slate-300">{elix.toFixed(0)}</strong></span>
                </div>
              </div>
            </div>
            <button onClick={() => setEditing(true)} className="px-4 py-2 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 rounded-xl flex items-center gap-2 font-bold text-xs shrink-0">
              <RefreshCw className="w-4 h-4" /> Isi Ulang
            </button>
          </div>
          <div className="space-y-3">
            {dimensions.map((dim) => {
              const score = dimScores[dim.id] || 0;
              const pct = (score / 4) * 100;
              return (
                <div key={dim.id}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>{dim.name}</span>
                    <span>{score.toFixed(2)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: dim.color }} />
                  </div>
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
    <div className="space-y-6 scroll-mt-6" ref={containerRef}>
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

      <div className={`sticky bottom-4 border rounded-3xl p-4 flex items-center justify-between gap-3 backdrop-blur shadow-xl ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
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
