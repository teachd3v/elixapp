"use client";
import React, { createContext, useContext, useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

const DialogContext = createContext();
export const useDialog = () => useContext(DialogContext);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const confirm = (message, title = 'Konfirmasi') => {
    return new Promise((resolve) => {
      setDialog({
        type: 'confirm',
        title,
        message,
        onConfirm: () => { setDialog(null); resolve(true); },
        onCancel: () => { setDialog(null); resolve(false); }
      });
    });
  };

  const alert = (message, title = 'Perhatian', variant = 'error') => {
    return new Promise((resolve) => {
      setDialog({
        type: 'alert',
        variant,
        title,
        message,
        onConfirm: () => { setDialog(null); resolve(true); }
      });
    });
  };

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className={`p-4 rounded-full mb-4 ${
                dialog.type === 'confirm' ? 'bg-amber-500/10 text-amber-500' 
                : dialog.variant === 'success' ? 'bg-emerald-500/10 text-emerald-500' 
                : 'bg-rose-500/10 text-rose-500'
              }`}>
                {dialog.type === 'confirm' ? <AlertTriangle className="w-8 h-8" /> 
                 : dialog.variant === 'success' ? <CheckCircle2 className="w-8 h-8" /> 
                 : <X className="w-8 h-8" />}
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">{dialog.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{dialog.message}</p>
              
              <div className="flex gap-3 w-full">
                {dialog.type === 'confirm' && (
                  <button onClick={dialog.onCancel} className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-700 dark:text-white bg-slate-100 dark:bg-[#262626] hover:bg-slate-200 dark:hover:bg-[#333333] transition-colors">
                    Batal
                  </button>
                )}
                <button onClick={dialog.onConfirm} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-opacity hover:opacity-90 ${
                  dialog.type === 'confirm' ? 'bg-gradient-to-br from-[#0f2942] via-sky-800 to-amber-400' 
                  : dialog.variant === 'success' ? 'bg-emerald-500' 
                  : 'bg-rose-500'
                }`}>
                  {dialog.type === 'confirm' ? 'Ya, Lanjutkan' : 'Mengerti'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
