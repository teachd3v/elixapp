import React from 'react';
import {
  Compass, BookOpen, ClipboardCheck, UserCheck, FolderHeart,
  Megaphone, Calendar, Users, SlidersHorizontal, BarChart3
} from 'lucide-react';

const MENU_CONFIG = {
  awardee: [
    { id: 'dashboard', label: 'Dashboard ELIX', icon: Compass },
    { id: 'assessment', label: 'Self Assessment (SA)', icon: BookOpen },
    { id: 'attendance', label: 'Sesi & Absensi', icon: ClipboardCheck },
    { id: 'profile', label: 'Profil Saya', icon: UserCheck },
    { id: 'portfolio', label: 'Portofolio', icon: FolderHeart },
  ],
  mentor: [
    { id: 'dashboard', label: 'Dashboard Wilayah', icon: Compass },
    { id: 'assessment', label: 'Penilaian Mentor (MA)', icon: UserCheck },
    { id: 'sessions', label: 'Sesi & Presensi', icon: ClipboardCheck },
    { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
    { id: 'profile', label: 'Profil Saya', icon: UserCheck },
  ],
  superadmin: [
    { id: 'dashboard', label: 'Dashboard Konsolidasi', icon: Compass },
    { id: 'users', label: 'Manajemen User', icon: Users },
    { id: 'attendance', label: 'Sesi & Presensi', icon: ClipboardCheck },
    { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
    { id: 'instruments', label: 'Instrumen & Formula', icon: SlidersHorizontal },
    { id: 'elix_analysis', label: 'Analisis ELIX', icon: BarChart3 },
  ],
};

export default function DesktopNav({ role, activeTab, setActiveTab }) {
  const items = MENU_CONFIG[role] || [];

  return (
    <div className="hidden md:flex flex-wrap gap-2 bg-blue-100 dark:bg-blue-900/40 p-1.5 rounded-2xl border border-blue-300 dark:border-blue-700/60 w-fit backdrop-blur-md">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === id 
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20' 
              : 'text-black dark:text-blue-200 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white/40 dark:hover:bg-blue-955/40'
          }`}
        >
          <Icon className="w-4 h-4" /> {label}
        </button>
      ))}
    </div>
  );
}
