import React from 'react';
import {
  Compass, BookOpen, ClipboardCheck, FolderHeart, User,
  UserCheck, Megaphone, Calendar, Users, SlidersHorizontal, BarChart3
} from 'lucide-react';

const MENU_CONFIG = {
  awardee: [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'assessment', label: 'Isi SA', icon: BookOpen },
    { id: 'attendance', label: 'Absen', icon: ClipboardCheck },
    { id: 'portfolio', label: 'Karya', icon: FolderHeart },
    { id: 'profile', label: 'Profil', icon: User },
  ],
  mentor: [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'assessment', label: 'Nilai MA', icon: UserCheck },
    { id: 'sessions', label: 'Sesi & Presensi', icon: ClipboardCheck },
    { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
    { id: 'elix_analysis', label: 'Analisis Wilayah', icon: BarChart3 },
    { id: 'profile', label: 'Profil Saya', icon: UserCheck },
  ],
  superadmin: [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'attendance', label: 'Absen', icon: ClipboardCheck },
    { id: 'pengumuman', label: 'Info', icon: Megaphone },
    { id: 'instruments', label: 'Formula', icon: SlidersHorizontal },
    { id: 'elix_analysis', label: 'Analisis', icon: BarChart3 },
  ],
};

export default function MobileNav({ darkMode, role, activeTab, setActiveTab }) {
  const items = MENU_CONFIG[role] || [];

  // No menu for this role (e.g. UNVERIFIED) — don't render an empty bar.
  if (items.length === 0) return null;

  return (
    <div className={`md:hidden fixed bottom-4 left-4 right-4 z-50 border rounded-full px-6 py-3.5 flex justify-around items-center backdrop-blur-lg shadow-xl ${
      darkMode 
        ? 'bg-slate-950/80 border-slate-800/40 text-white' 
        : 'bg-white/80 border-white/20 text-[#0f2942]'
    }`}>
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === id 
              ? 'text-amber-500 scale-105 font-bold' 
              : 'text-slate-400'
          }`}
        >
          <Icon className="w-5 h-5" />
          <span className="text-[9px] font-bold">{label}</span>
        </button>
      ))}
    </div>
  );
}