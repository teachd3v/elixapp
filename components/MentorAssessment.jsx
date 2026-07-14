import React, { useEffect, useState } from 'react';
import { defaultDimensionsList, defaultStatements } from '../data/constants';
import { CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, TrendingUp } from 'lucide-react';

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

// Mentor Assessment of one awardee: same 55 statements (mentor-phrased),
// rated 1-4. Score computed server-side and stored on the awardee's profile.
export default function MentorAssessment({ darkMode, awardee, onBack, onSaved }) {
  const [responses, setResponses] = useState({});
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const url = `/api/mentor/assessment/${awardee.id}`;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const d = await fetchJson(url);
        if (!active) return;
        setExisting(d);
        if (d.maResponses && typeof d.maResponses === 'object') setResponses(d.maResponses);
        setEditing(!d.hasFilledMA);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [url]);

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
      const res = await fetchJson(url, {
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
  const name = awardee.user?.name || 'Awardee';

  const Header = () => (
    <div className={`border rounded-3xl p-5 ${card}`}>
      <button onClick={onBack} className="text-xs font-bold text-sky-500 hover:text-sky-600 flex items-center gap-1 mb-3">
        <ArrowLeft className="w-4 h-4" /> Kembali ke daftar awardee
      </button>
      <h3 className="text-base font-black">Penilaian Mentor (MA)</h3>
      <p className="text-xs text-slate-500">Untuk: <span className="font-bold">{name}</span></p>
    </div>
  );

  if (loading) {
    return <div className="space-y-6"><Header /><div className={`border rounded-3xl p-8 text-center ${card}`}><p className="text-sm opacity-60">Memuat...</p></div></div>;
  }

  // ---------- RESULT VIEW ----------
  if (!editing && existing?.hasFilledMA) {
    const dimScores = existing.maDimensionScores || {};
    return (
      <div className="space-y-6">
        <Header />
        <div className={`border rounded-3xl p-6 ${card}`}>
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="w-5 h-5" /></div>
              <div>
                <h3 className="text-sm font-black">Penilaian tersimpan</h3>
                <p className="text-xs text-slate-500">Skor MA: <span className="font-bold">{(existing.maScore || 0).toFixed(2)}</span> / 4.00</p>
              </div>
            </div>
            <button onClick={() => setEditing(true)} className="px-4 py-2 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 rounded-xl flex items-center gap-2 font-bold text-xs shrink-0">
              <RefreshCw className="w-4 h-4" /> Nilai Ulang
            </button>
          </div>
          <div className="space-y-3">
            {defaultDimensionsList.map((dim) => {
              const score = dimScores[dim.id] || 0;
              return (
                <div key={dim.id}>
                  <div className="flex justify-between text-xs font-bold mb-1"><span>{dim.name}</span><span>{score.toFixed(2)}</span></div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(score / 4) * 100}%`, backgroundColor: dim.color }} />
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
      <Header />
      <div className={`border rounded-3xl p-4 ${card}`}>
        <div className="flex justify-between text-xs font-bold mb-1"><span className="text-slate-400">Progress</span><span>{answered} / {TOTAL}</span></div>
        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all" style={{ width: `${(answered / TOTAL) * 100}%` }} />
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
                  <p className="text-xs mb-2 leading-relaxed"><span className="font-bold text-slate-400">{s.code}.</span> {s.text_mentor}</p>
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
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-transparent shadow'
                              : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-500' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-400')
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
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-semibold rounded-2xl cursor-pointer shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TrendingUp className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Kirim Penilaian'}
        </button>
      </div>
    </div>
  );
}
