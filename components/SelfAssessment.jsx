import React, { useEffect, useState } from 'react';
import { defaultDimensionsList, defaultStatements } from '../data/constants';
import { CheckCircle2, AlertCircle, RefreshCw, ClipboardCheck, TrendingUp } from 'lucide-react';

const SCALE = [
  { v: 1, label: 'Sangat Kurang' },
  { v: 2, label: 'Kurang' },
  { v: 3, label: 'Baik' },
  { v: 4, label: 'Sangat Baik' },
];
const TOTAL = defaultStatements.length;

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const ct = res.headers.get('content-type') || '';
  if (!res.ok || !ct.includes('application/json')) {
    const detail = ct.includes('application/json') ? (await res.json().catch(() => ({})))?.error : null;
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// Real Self Assessment: 55 statements across 5 weighted dimensions, rated 1-4.
// Score is computed server-side; this only collects and displays.
export default function SelfAssessment({ darkMode, onSaved }) {
  const [responses, setResponses] = useState({});
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const d = await fetchJson('/api/assessment/sa');
        if (!active) return;
        setExisting(d);
        if (d.saResponses && typeof d.saResponses === 'object') setResponses(d.saResponses);
        setEditing(!d.hasFilledSA);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const answered = defaultStatements.filter((s) => {
    const v = Number(responses[s.id]);
    return v >= 1 && v <= 4;
  }).length;
  const allAnswered = answered === TOTAL;

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
              <div>
                <h3 className="text-base font-black">Self Assessment Selesai</h3>
                <p className="text-xs text-slate-500">Skor SA: <span className="font-bold">{(existing.saScore || 0).toFixed(2)}</span> / 4.00 • ELIX (dari SA): <span className="font-bold">{elix.toFixed(0)}</span></p>
              </div>
            </div>
            <button onClick={() => setEditing(true)} className="px-4 py-2 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 rounded-xl flex items-center gap-2 font-bold text-xs shrink-0">
              <RefreshCw className="w-4 h-4" /> Isi Ulang
            </button>
          </div>
          <div className="space-y-3">
            {defaultDimensionsList.map((dim) => {
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
    <div className="space-y-6">
      <div className={`border rounded-3xl p-5 ${card}`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-sky-500/10 text-sky-600"><ClipboardCheck className="w-5 h-5" /></div>
          <div className="flex-1">
            <h3 className="text-base font-black">Self Assessment</h3>
            <p className="text-xs text-slate-500">Nilai dirimu pada setiap pernyataan (1 = Sangat Kurang, 4 = Sangat Baik).</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-slate-400">Progress</span>
            <span>{answered} / {TOTAL}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all" style={{ width: `${(answered / TOTAL) * 100}%` }} />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs font-bold px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      {defaultDimensionsList.map((dim) => {
        const items = defaultStatements.filter((s) => s.dimensionId === dim.id);
        return (
          <div key={dim.id} className={`border rounded-3xl p-5 ${card}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dim.color }} />
              <h4 className="text-sm font-black">{dim.name}</h4>
              <span className="text-[10px] font-bold text-slate-400">Bobot {Math.round(dim.weight * 100)}%</span>
            </div>
            <div className="space-y-4">
              {items.map((s) => (
                <div key={s.id} className="border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                  <p className="text-xs mb-2 leading-relaxed"><span className="font-bold text-slate-400">{s.code}.</span> {s.text_awardee}</p>
                  <div className="flex gap-2 flex-wrap">
                    {SCALE.map(({ v, label }) => {
                      const active = Number(responses[s.id]) === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => rate(s.id, v)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                            active
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent shadow'
                              : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-indigo-500' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400')
                          }`}
                        >
                          {v} · {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className={`sticky bottom-4 border rounded-3xl p-4 flex items-center justify-between gap-3 backdrop-blur ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <span className="text-xs font-bold text-slate-500">{answered} / {TOTAL} terisi</span>
        <button
          onClick={submit}
          disabled={saving || !allAnswered}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-2xl cursor-pointer shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TrendingUp className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Kirim & Hitung Skor'}
        </button>
      </div>
    </div>
  );
}
