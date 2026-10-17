'use client';
import React from 'react';

export default function AppLoadingScreen({ message = 'Memuat aplikasi...' }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 select-none">
      <div className="relative flex items-center justify-center mb-6">
        {/* Subtle outer pulse ring */}
        <div className="absolute w-28 h-28 rounded-3xl bg-indigo-500/10 dark:bg-amber-500/10 animate-ping" style={{ animationDuration: '2s' }} />
        {/* Logo container card */}
        <div className="relative w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 flex items-center justify-center p-4">
          <img
            src="/logo-yes-simple.png"
            alt="EXLEAD Logo"
            className="w-full h-full object-contain animate-pulse"
          />
        </div>
      </div>

      {/* Loading indicator & text */}
      <div className="flex items-center gap-2.5">
        <div className="w-4 h-4 border-2 border-indigo-600 dark:border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 tracking-wide">
          {message}
        </p>
      </div>
    </div>
  );
}
