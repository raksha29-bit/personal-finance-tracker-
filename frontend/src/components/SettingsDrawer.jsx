import React from 'react';
import { X, Lock, TableProperties, Save } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export default function SettingsDrawer({ isOpen, onClose, onChangePinRequest, onNavigate }) {
  const { isDirty, saveChanges } = useFinance();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-80 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => {
              onNavigate('ledger');
              onClose();
            }}
            className="w-full flex items-center space-x-3 p-4 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white transition-colors border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none"
          >
            <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
              <TableProperties size={20} />
            </div>
            <span className="font-medium">Smart Ledger</span>
          </button>

          <button 
            onClick={onChangePinRequest}
            className="w-full flex items-center space-x-3 p-4 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white transition-colors border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none"
          >
            <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Lock size={20} />
            </div>
            <span className="font-medium">Change PIN</span>
          </button>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-200 dark:border-white/10">
          <button 
            onClick={() => {
              saveChanges();
              if(!isDirty) onClose();
            }}
            disabled={!isDirty}
            className={`w-full flex items-center justify-center space-x-2 p-4 rounded-xl transition-all relative ${
              isDirty 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                : 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isDirty && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
            <Save size={20} />
            <span className="font-bold">{isDirty ? "Save Changes" : "Up to date"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
