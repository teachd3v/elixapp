import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function AlertModal({ 
  modalOpen, setModalOpen, darkMode, 
  modalType, modalTitle, modalMessage 
}) {
  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-sm border rounded-[32px] p-6 text-center shadow-2xl ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#eef2f6] text-[#0f2942]'
      }`}>
        <div className="flex justify-center mb-4">
          <div className={`p-4 rounded-full ${
            modalType === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-sky-500/10 text-sky-600'
          }`}>
            <CheckCircle className="w-8 h-8" />
          </div>
        </div>
        <h3 className="text-lg font-black tracking-tight">{modalTitle}</h3>
        <p className={`text-xs mt-2 mb-6 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {modalMessage}
        </p>
        <button
          onClick={() => setModalOpen(false)}
          className="w-full py-3 bg-[#13385c] text-white hover:opacity-95 font-bold text-sm rounded-2xl shadow-md cursor-pointer"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
}
