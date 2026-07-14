import React from 'react';

export default function DialogModal({
  dialogOpen, setDialogOpen, darkMode,
  dialogTitle, dialogMessage, dialogType,
  dialogInputs, setDialogInputs, 
  dialogOnConfirm, dialogOnCancel
}) {
  if (!dialogOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className={`w-full max-w-md border rounded-[32px] p-6 shadow-2xl relative my-8 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#eef2f6] text-[#0f2942]'
      }`}>
        <h3 className="text-base font-black tracking-tight mb-2">{dialogTitle}</h3>
        
        {dialogMessage && (
          <p className={`text-xs mb-4 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {dialogMessage}
          </p>
        )}

        {dialogType === 'prompt' && (
          <div className="space-y-3 mb-6">
            {dialogInputs.map((input, index) => (
              <div key={input.key || index}>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">{input.label}</label>
                {input.type === 'select' ? (
                  <select
                    className="w-full p-2.5 border rounded-xl text-xs bg-transparent text-inherit"
                    value={input.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDialogInputs(prev => prev.map((item, idx) => idx === index ? { ...item, value: val } : item));
                    }}
                  >
                    <option value="" disabled className="text-slate-500">{input.placeholder}</option>
                    {input.options?.map(opt => (
                      <option key={opt.value} value={opt.value} className={darkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type={input.type || 'text'}
                    className="w-full p-2.5 border rounded-xl text-xs bg-transparent text-inherit"
                    placeholder={input.placeholder || ''}
                    value={input.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDialogInputs(prev => prev.map((item, idx) => idx === index ? { ...item, value: val } : item));
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          {dialogType !== 'alert' && (
            <button
              onClick={() => {
                if (dialogOnCancel) dialogOnCancel();
                setDialogOpen(false);
              }}
              className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
            >
              Batal
            </button>
          )}
          <button
            onClick={() => {
              if (dialogType === 'prompt') {
                dialogOnConfirm(dialogInputs);
              } else {
                dialogOnConfirm();
              }
            }}
            className={`py-3 bg-[#13385c] text-white hover:opacity-95 font-bold text-xs rounded-xl cursor-pointer transition-all ${
              dialogType === 'alert' ? 'w-full' : 'w-1/2'
            }`}
          >
            Konfirmasi
          </button>
        </div>
      </div>
    </div>
  );
}
