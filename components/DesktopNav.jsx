"use client";

import React from 'react';
import {
  Compass, BookOpen, ClipboardCheck, UserCheck, FolderHeart,
  Megaphone, Users, SlidersHorizontal, BarChart3, ClipboardList, Award
} from 'lucide-react';

const MENU_CONFIG = {
  awardee: [
    { id: 'dashboard', label: 'Dashboard', fullLabel: 'Dashboard ELIX', icon: Compass },
    { id: 'assessment', label: 'SA', fullLabel: 'Self Assessment (SA)', icon: BookOpen },
    { id: 'attendance', label: 'Presensi', fullLabel: 'Sesi & Absensi', icon: ClipboardCheck },
    { id: 'portfolio', label: 'Portofolio', fullLabel: 'Portofolio', icon: FolderHeart },
    { id: 'monev', label: 'Monev', fullLabel: 'Hasil Monev', icon: Award },
    { id: 'profile', label: 'Profil', fullLabel: 'Profil Saya', icon: UserCheck },
  ],
  mentor: [
    { id: 'dashboard', label: 'Dashboard', fullLabel: 'Dashboard Wilayah', icon: Compass },
    { id: 'assessment', label: 'MA', fullLabel: 'Penilaian Mentor (MA)', icon: UserCheck },
    { id: 'journal', label: 'Jurnal', fullLabel: 'Jurnal Mentor', icon: BookOpen },
    { id: 'sessions', label: 'Presensi', fullLabel: 'Sesi & Presensi', icon: ClipboardCheck },
    { id: 'pengumuman', label: 'Pengumuman', fullLabel: 'Pengumuman', icon: Megaphone },
    { id: 'elix_analysis', label: 'Analisis', fullLabel: 'Analisis Wilayah', icon: BarChart3 },
    { id: 'monev', label: 'Monev', fullLabel: 'Hasil Monev', icon: Award },
    { id: 'profile', label: 'Profil', fullLabel: 'Profil Saya', icon: UserCheck },
  ],
  superadmin: [
    { id: 'dashboard', label: 'Dashboard', fullLabel: 'Dashboard Konsolidasi', icon: Compass },
    { id: 'monitoring', label: 'Monitoring', fullLabel: 'Monitoring SA & MA', icon: ClipboardList },
    { id: 'journals', label: 'Jurnal', fullLabel: 'Jurnal Mentor', icon: BookOpen },
    { id: 'monev', label: 'Monev', fullLabel: 'Penilaian Monev', icon: Award },
    { id: 'users', label: 'Users', fullLabel: 'Manajemen User', icon: Users },
    { id: 'attendance', label: 'Presensi', fullLabel: 'Sesi & Presensi', icon: ClipboardCheck },
    { id: 'pengumuman', label: 'Pengumuman', fullLabel: 'Pengumuman', icon: Megaphone },
    { id: 'instruments', label: 'Instrumen', fullLabel: 'Instrumen & Formula', icon: SlidersHorizontal },
    { id: 'elix_analysis', label: 'Analisis', fullLabel: 'Analisis ELIX', icon: BarChart3 },
  ],
};

export default function DesktopNav({ role, activeTab, setActiveTab }) {
  const items = MENU_CONFIG[role] || [];

  return (
    <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-inner">
      {items.map(({ id, label, fullLabel, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <div key={id} className="relative group flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab(id)}
              className={`relative flex items-center justify-center transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md shadow-amber-500/20 px-3.5 py-1.5 rounded-full gap-2'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800 p-2 rounded-full'
              }`}
              title={fullLabel || label}
              aria-label={fullLabel || label}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {isActive && (
                <span className="text-xs font-black tracking-tight whitespace-nowrap">
                  {label}
                </span>
              )}
            </button>

            {/* Floating Tooltip on Hover for Inactive Items */}
            {!isActive && (
              <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 transform group-hover:translate-y-0 translate-y-1 z-50 whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xl border border-slate-700/40 dark:border-slate-300/40">
                {fullLabel || label}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
