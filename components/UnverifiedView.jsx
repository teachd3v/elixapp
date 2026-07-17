import React, { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { ShieldAlert, Clock, RefreshCw } from 'lucide-react';

// Shown to signed-in users whose role is still UNVERIFIED — i.e. they have not
// yet been approved by a SUPERADMIN. They get no app menus and no data access;
// this is a friendly holding screen. Real enforcement lives server-side.
export default function UnverifiedView({ darkMode }) {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;

  useEffect(() => {
    // Auto-polling tiap 5 detik untuk cek apakah admin sudah meng-approve.
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/sync');
        if (res.ok) {
          const data = await res.json();
          if (data.role && data.role !== 'UNVERIFIED') {
            window.location.reload();
          }
        }
      } catch (err) {
        // Ignore network errors during polling
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center py-10">
      <div className={`max-w-md w-full p-8 rounded-3xl shadow-xl text-center ${
        darkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'
      }`}>
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 transform -rotate-3">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Akun Menunggu Persetujuan</h1>
        <p className="text-sm mb-6 opacity-70 leading-relaxed">
          Halo{email ? <> <span className="font-semibold">{email}</span></> : ''}, akunmu berhasil dibuat
          tapi belum diverifikasi. Seorang admin perlu menyetujui dan menetapkan peranmu
          (Awardee / Mentor) sebelum kamu bisa mengakses dashboard.
        </p>

        <div className={`flex items-center justify-center gap-2 text-xs font-bold px-4 py-3 rounded-2xl mb-6 ${
          darkMode ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'
        }`}>
          <Clock className="w-4 h-4" />
          Status: Menunggu approval
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-2xl cursor-pointer shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
        >
          <RefreshCw className="w-4 h-4" /> Cek Status Lagi
        </button>
      </div>
    </div>
  );
}
