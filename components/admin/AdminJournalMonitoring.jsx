"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen, Users, MapPin, Sparkles, Search, Filter, Calendar, Clock,
  Video, Building2, FileSpreadsheet, Eye, X, Image as ImageIcon,
  LayoutGrid, Table as TableIcon, ExternalLink, AlertCircle, CheckCircle2,
  RotateCcw, FileText, Loader2, ArrowUpDown
} from 'lucide-react';
import { exportMentorJournalsToExcel, formatDateDDMMYYYY } from '../../lib/exportExcel';
import { JOURNAL_ACTIVITY_OPTIONS } from '../MentorJournalManager';

// Activity category color mapping for friendly UI badges
function getActivityBadgeColor(name) {
  if (!name) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  if (name.includes('Pembinaan')) {
    return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  }
  if (name.includes('Leadership') || name.includes('Festival') || name.includes('Camp')) {
    return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  }
  if (name.includes('Administrasi') || name.includes('Keuangan')) {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  }
  if (name.includes('Instagram') || name.includes('Talent') || name.includes('Mitra')) {
    return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
  }
  return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
}

export default function AdminJournalMonitoring({ darkMode }) {
  const [data, setData] = useState({
    journals: [],
    summary: {
      totalJournals: 0,
      uniqueMentorsCount: 0,
      totalMentorsCount: 0,
      topActivity: '—',
      topActivityCount: 0,
      mostActiveWilayah: '—',
      mostActiveWilayahCount: 0,
    },
    filterOptions: {
      wilayahList: [],
      mentorList: [],
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWilayah, setFilterWilayah] = useState('ALL');
  const [filterMentor, setFilterMentor] = useState('ALL');
  const [filterActivity, setFilterActivity] = useState('ALL');
  const [filterLocationType, setFilterLocationType] = useState('ALL');

  // View state: 'feed' (default) or 'table'
  const [viewMode, setViewMode] = useState('feed');

  // Modal detail & preview states
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterWilayah !== 'ALL') params.append('wilayahId', filterWilayah);
      if (filterMentor !== 'ALL') params.append('mentorId', filterMentor);
      if (filterActivity !== 'ALL') params.append('activityName', filterActivity);
      if (filterLocationType !== 'ALL') params.append('locationType', filterLocationType);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/journals?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Gagal memuat data jurnal`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }, [filterWilayah, filterMentor, filterActivity, filterLocationType, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // When filterWilayah changes, reset filterMentor if the selected mentor does not belong to that wilayah
  const handleWilayahChange = (newWilayah) => {
    setFilterWilayah(newWilayah);
    if (newWilayah !== 'ALL' && filterMentor !== 'ALL') {
      const currentMentorObj = data.filterOptions.mentorList.find(m => m.id === filterMentor);
      if (currentMentorObj && currentMentorObj.wilayahId !== newWilayah) {
        setFilterMentor('ALL');
      }
    }
  };

  // Available mentors filtered by selected wilayah
  const availableMentors = useMemo(() => {
    const list = data.filterOptions.mentorList || [];
    if (filterWilayah === 'ALL') return list;
    return list.filter(m => m.wilayahId === filterWilayah);
  }, [data.filterOptions.mentorList, filterWilayah]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setFilterWilayah('ALL');
    setFilterMentor('ALL');
    setFilterActivity('ALL');
    setFilterLocationType('ALL');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || filterWilayah !== 'ALL' || filterMentor !== 'ALL' || filterActivity !== 'ALL' || filterLocationType !== 'ALL';

  // Export to Excel handler
  const handleExportExcel = () => {
    const activeWilayahName = filterWilayah !== 'ALL' 
      ? data.filterOptions.wilayahList.find(w => w.id === filterWilayah)?.name 
      : 'Nasional';
    const activeMentorName = filterMentor !== 'ALL'
      ? data.filterOptions.mentorList.find(m => m.id === filterMentor)?.user?.name
      : null;

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Rekap_Jurnal_Mentor_${activeWilayahName.replace(/\s+/g, '_')}_${dateStr}.xlsx`;

    exportMentorJournalsToExcel({
      journals: data.journals,
      mentorName: activeMentorName || 'Seluruh Mentor',
      wilayahName: activeWilayahName,
      filename,
    });
  };

  const cardBase = darkMode 
    ? 'bg-slate-900 border-slate-800 text-white' 
    : 'bg-white border-slate-200 text-slate-800';

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Stat Cards */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">Monitoring Jurnal Mentor</h2>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Pantau laporan aktivitas harian, capaian, dan evaluasi berkala dari mentor seluruh wilayah.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleExportExcel}
              disabled={loading || data.journals.length === 0}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Unduh data terfilter ke format spreadsheet Excel"
            >
              <FileSpreadsheet className="w-4 h-4" /> Ekspor Excel ({data.journals.length})
            </button>
          </div>
        </div>

        {/* 4 Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Total Jurnal */}
          <div className={`p-4 rounded-2xl border transition-all ${cardBase}`}>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Jurnal</span>
              <BookOpen className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">{data.summary.totalJournals}</span>
              <span className="text-xs font-semibold text-slate-400">entri</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Tercatat dalam filter saat ini</p>
          </div>

          {/* Mentor Aktif */}
          <div className={`p-4 rounded-2xl border transition-all ${cardBase}`}>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Mentor Kontributor</span>
              <Users className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">{data.summary.uniqueMentorsCount}</span>
              <span className="text-xs font-semibold text-slate-400">/ {data.summary.totalMentorsCount} Mentor</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {data.summary.totalMentorsCount > 0
                ? `${Math.round((data.summary.uniqueMentorsCount / data.summary.totalMentorsCount) * 100)}% mentor aktif menulis`
                : 'Belum ada data'}
            </p>
          </div>

          {/* Wilayah Teraktif */}
          <div className={`p-4 rounded-2xl border transition-all ${cardBase}`}>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Wilayah Teraktif</span>
              <MapPin className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-1 truncate">
              <span className="text-lg font-black truncate">{data.summary.mostActiveWilayah}</span>
              {data.summary.mostActiveWilayahCount > 0 && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                  ({data.summary.mostActiveWilayahCount})
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Aktivitas terlapor terbanyak</p>
          </div>

          {/* Kegiatan Terbanyak */}
          <div className={`p-4 rounded-2xl border transition-all ${cardBase}`}>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Kegiatan Dominan</span>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-1 truncate">
              <span className="text-base font-black truncate" title={data.summary.topActivity}>
                {data.summary.topActivity}
              </span>
              {data.summary.topActivityCount > 0 && (
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 shrink-0">
                  ({data.summary.topActivityCount})
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Program paling sering dijalankan</p>
          </div>
        </div>
      </div>

      {/* 2. Omni-Filter Bar */}
      <div className={`p-4 rounded-2xl border space-y-3 ${cardBase}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari mentor, kode, capaian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Wilayah Dropdown */}
          <div>
            <select
              value={filterWilayah}
              onChange={(e) => handleWilayahChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Wilayah ({data.filterOptions.wilayahList.length})</option>
              {data.filterOptions.wilayahList.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Mentor Dropdown (Dynamic per Wilayah) */}
          <div>
            <select
              value={filterMentor}
              onChange={(e) => setFilterMentor(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Mentor ({availableMentors.length})</option>
              {availableMentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.user?.name || 'Mentor'} {filterWilayah === 'ALL' && m.wilayah?.name ? `(${m.wilayah.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Kegiatan Dropdown */}
          <div>
            <select
              value={filterActivity}
              onChange={(e) => setFilterActivity(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Jenis Kegiatan (16)</option>
              {JOURNAL_ACTIVITY_OPTIONS.map((act) => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row: Location Type + View Mode Switcher + Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400">Tipe Tempat:</span>
            {['ALL', 'LURING', 'DARING'].map((loc) => (
              <button
                key={loc}
                onClick={() => setFilterLocationType(loc)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterLocationType === loc
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {loc === 'ALL' ? 'Semua' : loc}
              </button>
            ))}

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="ml-2 px-3 py-1 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-500/10 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filter
              </button>
            )}
          </div>

          {/* View Mode Switcher: Cards vs Table */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('feed')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'feed'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kartu Feed
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Tabel Ringkas
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Content: Loading, Error, Empty, Feed, or Table */}
      {loading ? (
        <div className={`p-16 rounded-3xl border flex flex-col items-center justify-center gap-3 ${cardBase}`}>
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs font-bold text-slate-400">Memuat data jurnal mentor...</p>
        </div>
      ) : error ? (
        <div className={`p-8 rounded-3xl border text-center ${cardBase}`}>
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-xs font-bold text-rose-500 mb-2">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      ) : data.journals.length === 0 ? (
        <div className={`p-16 rounded-3xl border text-center ${cardBase}`}>
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Tidak ada jurnal ditemukan</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            {hasActiveFilters
              ? 'Tidak ada data jurnal mentor yang sesuai dengan kriteria filter saat ini.'
              : 'Belum ada mentor yang memasukkan entri jurnal aktivitas harian.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      ) : viewMode === 'feed' ? (
        /* MODE 1: FEED KARTU AKTIVITAS (Friendly & Modern) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.journals.map((j) => {
            const mentorName = j.mentor?.user?.name || 'Mentor';
            const mentorAvatar = j.mentor?.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentorName)}&background=random`;
            const wilayahName = j.mentor?.wilayah?.name || 'Wilayah —';
            const isDaring = j.locationType === 'DARING';

            return (
              <div
                key={j.id}
                className={`p-5 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between ${cardBase}`}
              >
                {/* Card Top: Mentor Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={mentorAvatar}
                        alt={mentorName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold truncate leading-tight">{mentorName}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">{wilayahName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Daring/Luring Badge */}
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1 ${
                        isDaring
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {isDaring ? <Video className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                      {j.locationType}
                    </span>
                  </div>

                  {/* Activity Tag & Date/Time Bar */}
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getActivityBadgeColor(j.activityName)}`}>
                      {j.activityName}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDateDDMMYYYY(j.activityDate)}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {j.activityTime || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Location Detail Snippet */}
                  {j.locationDetail && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 truncate">
                      📍 <span className="font-medium">{j.locationDetail}</span>
                    </p>
                  )}

                  {/* Quantitative & Qualitative Achievement Snippet */}
                  <div className="space-y-2 mb-3">
                    {j.quantitativeAchievement && (
                      <div className="p-2.5 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/15">
                        <div className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-0.5">
                          🎯 Capaian Kuantitatif
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {j.quantitativeAchievement}
                        </p>
                      </div>
                    )}

                    {j.qualitativeAchievement && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                          📝 Capaian Kualitatif
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {j.qualitativeAchievement}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Evidence indicators + Action */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {j.evidencePhoto && (
                      <button
                        onClick={() => setPreviewPhoto(j.evidencePhoto)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Klik untuk pratinjau foto dokumentasi"
                      >
                        <ImageIcon className="w-3 h-3" /> Foto Bukti
                      </button>
                    )}
                    {j.evidenceText && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Bukti Teks
                      </span>
                    )}
                    <span className="text-[9px] font-mono font-bold text-slate-400">
                      {j.journalCode}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedJournal(j)}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Rincian
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MODE 2: TABEL RINGKAS (Compact Audit) */
        <div className={`border rounded-2xl overflow-hidden ${cardBase}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">No</th>
                  <th className="p-3.5">Unique ID</th>
                  <th className="p-3.5">Tanggal & Waktu</th>
                  <th className="p-3.5">Mentor & Wilayah</th>
                  <th className="p-3.5">Kegiatan</th>
                  <th className="p-3.5">Lokasi</th>
                  <th className="p-3.5">Bukti</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.journals.map((j, idx) => {
                  const mentorName = j.mentor?.user?.name || 'Mentor';
                  const wilayahName = j.mentor?.wilayah?.name || '—';
                  const isDaring = j.locationType === 'DARING';

                  return (
                    <tr
                      key={j.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-3.5 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-600 dark:text-slate-300">
                        {j.journalCode}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold">{formatDateDDMMYYYY(j.activityDate)}</div>
                        <div className="text-[10px] text-slate-400">{j.activityTime || '—'}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{mentorName}</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{wilayahName}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border inline-block ${getActivityBadgeColor(j.activityName)}`}>
                          {j.activityName}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isDaring ? 'bg-purple-500/10 text-purple-600' : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {j.locationType}
                        </span>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{j.locationDetail}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {j.evidencePhoto && (
                            <button
                              onClick={() => setPreviewPhoto(j.evidencePhoto)}
                              className="text-sky-600 hover:text-sky-700 cursor-pointer"
                              title="Lihat foto"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          )}
                          {j.evidenceText && (
                            <span title={j.evidenceText} className="text-amber-600 cursor-help">
                              <FileText className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedJournal(j)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors"
                        >
                          Rincian
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MODAL RINCIAN HOLISTIK (Dossier View 10 Poin) */}
      {selectedJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className={`w-full max-w-2xl border rounded-3xl p-6 shadow-2xl relative my-8 space-y-5 ${cardBase}`}>
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    {selectedJournal.journalCode}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                    selectedJournal.locationType === 'DARING' ? 'bg-purple-500/10 text-purple-600' : 'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {selectedJournal.locationType}
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-tight">{selectedJournal.activityName}</h3>
              </div>
              <button
                onClick={() => setSelectedJournal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile & Metadata Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={selectedJournal.mentor?.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedJournal.mentor?.user?.name || 'Mentor')}&background=random`}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedJournal.mentor?.user?.name || 'Mentor'}</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{selectedJournal.mentor?.wilayah?.name || '—'}</p>
                </div>
              </div>

              <div className="space-y-1 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{formatDateDDMMYYYY(selectedJournal.activityDate)}</span>
                  <span>·</span>
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedJournal.activityTime || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{selectedJournal.locationDetail || '—'}</span>
                </div>
              </div>
            </div>

            {/* Capaian Kualitatif & Kuantitatif */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Hasil & Capaian Aktivitas</h4>
              
              {/* Capaian Kuantitatif */}
              <div className="p-3.5 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/15">
                <div className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                  🎯 4. Capaian Kuantitatif (Result / Indikator Angka)
                </div>
                <p className="text-xs font-bold leading-relaxed text-slate-800 dark:text-slate-100">
                  {selectedJournal.quantitativeAchievement || '—'}
                </p>
              </div>

              {/* Capaian Kualitatif */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  📝 3. Capaian Kualitatif (Deskripsi Lengkap)
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200">
                  {selectedJournal.qualitativeAchievement || '—'}
                </p>
              </div>
            </div>

            {/* Evaluasi Lapangan: Masalah & Rencana Perbaikan */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Evaluasi & Tindak Lanjut</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 8. Identifikasi Masalah */}
                <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/15">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-500 mb-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> 8. Identifikasi Masalah
                  </div>
                  <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200">
                    {selectedJournal.problemIdentification || '—'}
                  </p>
                </div>

                {/* 9. Rencana Perbaikan */}
                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/15">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> 9. Rencana Perbaikan
                  </div>
                  <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200">
                    {selectedJournal.improvementPlan || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Evidence & Dokumentasi */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">10. Bukti / Evidence Dokumentasi</h4>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
                {selectedJournal.evidenceText ? (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Keterangan / Tautan:</span>
                    <p className="text-xs text-slate-700 dark:text-slate-200 break-words font-medium">
                      {selectedJournal.evidenceText.startsWith('http') ? (
                        <a
                          href={selectedJournal.evidenceText}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500 underline inline-flex items-center gap-1"
                        >
                          {selectedJournal.evidenceText} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        selectedJournal.evidenceText
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Tidak ada catatan teks evidence.</p>
                )}

                {selectedJournal.evidencePhoto ? (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-1.5">Foto Dokumentasi Kegiatan:</span>
                    <img
                      src={selectedJournal.evidencePhoto}
                      alt="Dokumentasi"
                      onClick={() => setPreviewPhoto(selectedJournal.evidencePhoto)}
                      className="max-h-64 rounded-xl border border-slate-200 dark:border-slate-700 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Klik foto untuk memperbesar</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Tidak ada foto dokumentasi terlampir.</p>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedJournal(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. LIGHTBOX PREVIEW FOTO */}
      {previewPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/40 cursor-pointer transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewPhoto}
              alt="Pratinjau Foto Dokumentasi"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
