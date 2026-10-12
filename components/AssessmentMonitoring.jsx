import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Search, Filter, FileSpreadsheet, MapPin, 
  ExternalLink, Phone, MessageSquare, Calendar, UserCheck, AlertCircle, ArrowUpDown
} from 'lucide-react';
import { exportAssessmentProgressToExcel } from '../lib/exportExcel';
import { blendedScore, toElixIndex, elixCategory } from '../lib/assessment';

export default function AssessmentMonitoring({ data, darkMode, onViewAwardee }) {
  const { periods = [], awardees = [], wilayahRollup = [], mentors = [] } = data || {};

  const activePeriod = periods.find(p => p.isActive) || periods[0];
  const [selectedPeriodId, setSelectedPeriodId] = useState(activePeriod?.id || '');
  const [filterWilayah, setFilterWilayah] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'NEED_SA' | 'NEED_MA' | 'COMPLETE'
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('name'); // 'name' | 'wilayah' | 'elix'
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    if (!selectedPeriodId && activePeriod?.id) {
      setSelectedPeriodId(activePeriod.id);
    }
  }, [activePeriod?.id, selectedPeriodId]);

  const currentPeriod = (selectedPeriodId ? periods.find(p => p.id === selectedPeriodId) : null) || activePeriod;

  // Resolve status for every awardee in this chosen cycle
  const resolvedList = useMemo(() => {
    if (!currentPeriod) return [];
    const isPeriodActive = !!currentPeriod.isActive;

    return awardees.map(a => {
      let hasSA = false;
      let saScore = 0;
      let hasMA = false;
      let maScore = 0;

      if (isPeriodActive) {
        hasSA = !!a.hasFilledSA;
        saScore = a.saScore || 0;
        hasMA = !!a.hasFilledMA;
        maScore = a.maScore || 0;
      } else {
        const rec = a.assessmentRecords?.find(r => r.periodId === currentPeriod.id);
        hasSA = !!rec?.hasFilledSA;
        saScore = rec?.saScore || 0;
        hasMA = !!rec?.hasFilledMA;
        maScore = rec?.maScore || 0;
      }

      const raw = blendedScore(saScore, maScore, hasSA, hasMA);
      const elix = (hasSA || hasMA) ? toElixIndex(raw) : null;
      const category = elix != null ? elixCategory(elix) : null;

      const wilayahName = wilayahRollup.find(w => w.id === a.wilayahId)?.name || '—';
      const mentorObj = mentors.find(m => m.wilayahId === a.wilayahId);
      const mentorName = mentorObj?.user?.name || '—';

      return {
        id: a.id,
        name: a.user?.name || 'Awardee',
        email: a.user?.email || '—',
        phone: a.user?.phone || '',
        avatarUrl: a.user?.avatarUrl || '',
        wilayahId: a.wilayahId,
        wilayah: wilayahName,
        mentor: mentorName,
        hasSA,
        saScore,
        hasMA,
        maScore,
        elix,
        category,
        isComplete: hasSA && hasMA,
      };
    });
  }, [awardees, currentPeriod, wilayahRollup, mentors]);

  // Filtered & sorted list
  const filteredList = useMemo(() => {
    return resolvedList.filter(item => {
      // Wilayah filter
      if (filterWilayah !== 'ALL' && item.wilayahId !== filterWilayah) return false;

      // Status filter
      if (filterStatus === 'NEED_SA' && item.hasSA) return false;
      if (filterStatus === 'NEED_MA' && item.hasMA) return false;
      if (filterStatus === 'COMPLETE' && !item.isComplete) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchEmail = item.email.toLowerCase().includes(q);
        const matchWilayah = item.wilayah.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchWilayah) return false;
      }

      return true;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'wilayah') cmp = a.wilayah.localeCompare(b.wilayah);
      else if (sortField === 'elix') cmp = (a.elix || 0) - (b.elix || 0);
      return sortAsc ? cmp : -cmp;
    });
  }, [resolvedList, filterWilayah, filterStatus, search, sortField, sortAsc]);

  // Aggregate counters for current period
  const totalCount = resolvedList.length;
  const saCount = resolvedList.filter(a => a.hasSA).length;
  const maCount = resolvedList.filter(a => a.hasMA).length;
  const completeCount = resolvedList.filter(a => a.isComplete).length;

  const saPct = totalCount ? Math.round((saCount / totalCount) * 100) : 0;
  const maPct = totalCount ? Math.round((maCount / totalCount) * 100) : 0;
  const completePct = totalCount ? Math.round((completeCount / totalCount) * 100) : 0;

  const card = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';

  const handleExport = () => {
    exportAssessmentProgressToExcel({
      periodName: currentPeriod?.name || 'Siklus',
      rows: filteredList,
      filename: `Monitoring_Evaluasi_${(currentPeriod?.name || 'Siklus').replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Card */}
      <div className={`border rounded-3xl p-5 md:p-6 shadow-sm ${card}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                <Calendar className="w-5 h-5" />
              </span>
              <h2 className="text-lg md:text-xl font-black">Monitoring Progres Evaluasi</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pantau kepatuhan pengisian Self Assessment (SA) dan penilaian Mentor (MA) per siklus.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Periode selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400">Siklus:</span>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                {periods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isActive ? '(Aktif Saat Ini)' : '(Riwayat)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Export Excel Button */}
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              title="Unduh Rekap Excel Progres Evaluasi"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Progress Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Awardee</span>
            <span className="text-2xl font-black mt-1 block">{totalCount}</span>
            <span className="text-[10px] text-slate-500 block mt-1">Siklus: {currentPeriod?.name}</span>
          </div>

          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-blue-900/10 border-blue-900/30' : 'bg-blue-50/60 border-blue-100'}`}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">SA Selesai</span>
              <span className="text-xs font-black text-blue-600">{saPct}%</span>
            </div>
            <span className="text-2xl font-black text-blue-600 mt-1 block">{saCount} / {totalCount}</span>
            <div className="w-full bg-blue-100 dark:bg-blue-950/60 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${saPct}%` }} />
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-indigo-900/10 border-indigo-900/30' : 'bg-indigo-50/60 border-indigo-100'}`}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">MA Selesai</span>
              <span className="text-xs font-black text-indigo-600">{maPct}%</span>
            </div>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">{maCount} / {totalCount}</span>
            <div className="w-full bg-indigo-100 dark:bg-indigo-950/60 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${maPct}%` }} />
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-emerald-50/60 border-emerald-100'}`}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Lengkap (SA & MA)</span>
              <span className="text-xs font-black text-emerald-600">{completePct}%</span>
            </div>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{completeCount} / {totalCount}</span>
            <div className="w-full bg-emerald-100 dark:bg-emerald-950/60 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${completePct}%` }} />
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Quick Status Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                filterStatus === 'ALL'
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              onClick={() => setFilterStatus('NEED_SA')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 ${
                filterStatus === 'NEED_SA'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Belum SA ({totalCount - saCount})</span>
            </button>
            <button
              onClick={() => setFilterStatus('NEED_MA')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 ${
                filterStatus === 'NEED_MA'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 hover:bg-amber-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Belum MA ({totalCount - maCount})</span>
            </button>
            <button
              onClick={() => setFilterStatus('COMPLETE')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 ${
                filterStatus === 'COMPLETE'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Lengkap ({completeCount})</span>
            </button>
          </div>

          {/* Wilayah & Search Input */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={filterWilayah}
              onChange={(e) => setFilterWilayah(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer outline-none shrink-0 ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">Semua Wilayah</option>
              {wilayahRollup.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>

            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama/email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className={`border rounded-3xl overflow-hidden shadow-sm ${card}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b ${darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'} uppercase text-[10px] font-black tracking-wider`}>
              <tr>
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4 cursor-pointer select-none" onClick={() => { setSortField('name'); setSortAsc(!sortAsc); }}>
                  <div className="flex items-center gap-1">
                    <span>Awardee</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer select-none" onClick={() => { setSortField('wilayah'); setSortAsc(!sortAsc); }}>
                  <div className="flex items-center gap-1">
                    <span>Wilayah & Mentor</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-4 text-center">Status SA (Awardee)</th>
                <th className="p-4 text-center">Status MA (Mentor)</th>
                <th className="p-4 text-right cursor-pointer select-none" onClick={() => { setSortField('elix'); setSortAsc(!sortAsc); }}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Indeks ELIX</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                    Tidak ada awardee yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const cleanPhone = item.phone ? item.phone.replace(/[^0-9]/g, '') : '';
                  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}` : null;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random`}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-xs block truncate text-slate-800 dark:text-white">{item.name}</span>
                            <span className="text-[11px] text-slate-500 block truncate">{item.email}</span>
                            {item.phone && <span className="text-[10px] text-slate-400 block">{item.phone}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-bold text-xs text-slate-700 dark:text-slate-300">
                            <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>{item.wilayah}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block pl-4">Mentor: {item.mentor}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {item.hasSA ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600">
                              <CheckCircle2 className="w-3 h-3" /> Sudah Diisi
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 mt-0.5">
                              {Number(item.saScore).toFixed(2)} ({(item.saScore * 25).toFixed(0)})
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600">
                            <XCircle className="w-3 h-3" /> Belum Diisi
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {item.hasMA ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600">
                              <CheckCircle2 className="w-3 h-3" /> Sudah Dinilai
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 mt-0.5">
                              {Number(item.maScore).toFixed(2)} ({(item.maScore * 25).toFixed(0)})
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">
                            <XCircle className="w-3 h-3" /> Belum Dinilai
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {item.elix != null ? (
                          <div>
                            <span className="font-black text-sm text-slate-800 dark:text-white block">{item.elix.toFixed(1)}</span>
                            <span className="text-[9px] font-bold text-amber-500 block">{item.category}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors"
                              title={`Chat WhatsApp ${item.name}`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => onViewAwardee ? onViewAwardee(item.id) : (window.location.href = `/awardee/${item.id}`)}
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 transition-colors"
                            title="Buka Halaman Detail Awardee"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
