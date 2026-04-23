import React, { useState } from 'react';
import ExpenseForm from './ExpenseForm';
import ExpenseChart from './ExpenseChart';
import SettingsDrawer from './SettingsDrawer';
import LockScreen from './LockScreen';
import WalletModal from './WalletModal';
import { Wallet, PiggyBank, Receipt, TrendingDown, Settings, Edit2, Check, X, Download, Sun, Moon, Calendar, Save, Trash2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const CURRENCIES = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  INR: '₹'
};

export default function Dashboard({ onNavigate }) {
  const { expenses, currency, totalBudget, saveCurrency, saveBudget, theme, toggleTheme, selectedMonth, changeMonth, isDirty, saveChanges, deleteExpense } = useFinance();
  
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState('');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isChangePinMode, setIsChangePinMode] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  const handleCurrencyChange = (e) => {
    saveCurrency(e.target.value);
  };

  const handleSaveBudget = () => {
    const parsed = parseFloat(tempBudget);
    if (!isNaN(parsed) && parsed > 0) {
      saveBudget(parsed);
    }
    setIsEditingBudget(false);
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['Date,Category,Amount'];
    const rows = expenses.map(exp => `${exp.date},${exp.category},${exp.amount}`);
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expenses_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const remainingBudget = totalBudget - totalSpent;
  const percentLeft = (remainingBudget / totalBudget) * 100;

  // Budget warnings
  let warningClass = "text-emerald-500 dark:text-emerald-400";
  let borderClass = "";
  if (percentLeft <= 0) {
    warningClass = "text-red-500";
    borderClass = "border-red-500/50 animate-pulse";
  } else if (percentLeft <= 25) {
    warningClass = "text-orange-500 dark:text-orange-400";
    borderClass = "border-orange-500/50";
  } else if (percentLeft <= 50) {
    warningClass = "text-yellow-500 dark:text-yellow-400";
  }

  const sym = CURRENCIES[currency];

  if (isChangePinMode) {
    return <LockScreen 
      mode="change" 
      onChangePinSuccess={() => { setIsChangePinMode(false); setIsSettingsOpen(false); }} 
      onCancelChange={() => setIsChangePinMode(false)} 
    />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <SettingsDrawer 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onChangePinRequest={() => setIsChangePinMode(true)}
        onNavigate={onNavigate}
      />
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />

      <header className="flex flex-col sm:flex-row sm:items-center justify-between py-4 space-y-4 sm:space-y-0 relative">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent flex items-center space-x-4">
            <span>Finance</span>
            <div className="relative">
              <button 
                onClick={() => setIsCurrencyDropdownOpen(true)}
                className="text-sm font-medium bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg py-1.5 px-3 text-slate-800 dark:text-white focus:outline-none flex items-center hover:bg-slate-300/50 dark:hover:bg-white/10 transition-colors"
              >
                {currency} ({CURRENCIES[currency]})
              </button>

              {isCurrencyDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center p-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Select Currency</span>
                    <button onClick={() => setIsCurrencyDropdownOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="py-1">
                    {Object.keys(CURRENCIES).map(c => (
                      <button
                        key={c}
                        onClick={() => {
                          handleCurrencyChange({ target: { value: c }});
                          setIsCurrencyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-base hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center justify-between ${currency === c ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 font-medium' : 'text-slate-700 dark:text-slate-200'}`}
                      >
                        <span>{c}</span>
                        <span className="text-lg font-bold">{CURRENCIES[c]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </h1>
          <div className="mt-2 flex items-center space-x-3 relative">
            <span className="text-xl font-medium text-slate-700 dark:text-slate-200">
              {new Date(selectedMonth + '-01T00:00:00').toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button 
              onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors group"
              title="Change Month"
            >
              <Calendar size={20} className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
            </button>

            {isMonthPickerOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200 w-64">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Select Month</h3>
                  <button onClick={() => setIsMonthPickerOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <select 
                    value={selectedMonth.split('-')[1]}
                    onChange={(e) => {
                      const year = selectedMonth.split('-')[0];
                      changeMonth(`${year}-${e.target.value}`);
                    }}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-sm rounded-lg p-2 outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                      <option key={m} value={m}>{new Date(`2000-${m}-01T00:00:00`).toLocaleString('default', { month: 'short' })}</option>
                    ))}
                  </select>
                  <select
                    value={selectedMonth.split('-')[0]}
                    onChange={(e) => {
                      const month = selectedMonth.split('-')[1];
                      changeMonth(`${e.target.value}-${month}`);
                    }}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-sm rounded-lg p-2 outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {[2023, 2024, 2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Save Button */}
          <button 
            onClick={saveChanges}
            disabled={!isDirty}
            className={`w-12 h-12 rounded-full glass flex items-center justify-center transition-colors relative group ${
              isDirty 
                ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 cursor-pointer' 
                : 'border-slate-200 dark:border-white/10 opacity-50 cursor-not-allowed'
            }`}
            title={isDirty ? "Save Changes" : "No unsaved changes"}
          >
            {isDirty && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
            <Save className={isDirty ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"} size={20} />
          </button>
          
          <button onClick={toggleTheme} className="w-12 h-12 rounded-full glass flex items-center justify-center border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            {theme === 'dark' ? <Sun className="text-yellow-400" /> : <Moon className="text-indigo-600" />}
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="w-12 h-12 rounded-full glass flex items-center justify-center border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <Settings className="text-slate-600 dark:text-slate-300" />
          </button>
          <button onClick={() => setIsWalletOpen(true)} className="w-12 h-12 rounded-full glass flex items-center justify-center border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer">
            <Wallet className="text-indigo-600 dark:text-indigo-400" />
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
              <Wallet size={16} />
              <span className="text-sm">Total Budget</span>
            </div>
            {!isEditingBudget && (
              <button onClick={() => { setTempBudget(totalBudget.toString()); setIsEditingBudget(true); }} className="text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                <Edit2 size={14} />
              </button>
            )}
          </div>
          {isEditingBudget ? (
            <div className="flex items-center space-x-2">
              <span className="text-xl text-slate-800 dark:text-white">{sym}</span>
              <input 
                type="number" 
                value={tempBudget} 
                onChange={e => setTempBudget(e.target.value)} 
                className="bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded px-2 py-1 text-slate-800 dark:text-white w-24 outline-none"
                autoFocus
              />
              <button onClick={handleSaveBudget} className="text-emerald-500 dark:text-emerald-400 p-1 hover:bg-emerald-100 dark:hover:bg-emerald-400/20 rounded">
                <Check size={16} />
              </button>
            </div>
          ) : (
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{sym}{totalBudget.toFixed(2)}</span>
          )}
        </div>

        <div className="glass rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2">
            <TrendingDown size={16} />
            <span className="text-sm">Total Spent</span>
          </div>
          <span className="text-2xl font-bold text-slate-800 dark:text-white">{sym}{totalSpent.toFixed(2)}</span>
        </div>

        <div className={`glass rounded-2xl p-5 flex flex-col justify-between ${borderClass}`}>
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2">
            <PiggyBank size={16} />
            <span className="text-sm">Remaining</span>
          </div>
          <span className={`text-2xl font-bold ${warningClass}`}>{sym}{remainingBudget.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ExpenseForm />
          
          {/* Recent Transactions */}
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Receipt className="text-indigo-500 dark:text-indigo-400" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Recent Transactions</h3>
              </div>
              <button 
                onClick={handleExportCSV}
                disabled={expenses.length === 0}
                className="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export to Excel (CSV)"
              >
                <Download size={14} />
                <span>Export</span>
              </button>
            </div>
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {expenses.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">No expenses for {selectedMonth}</p>
              ) : (
                expenses.slice(0, 5).map((exp, i) => (
                  <div key={exp._id || i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{exp.category}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{exp.date}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <p className="font-bold text-red-500 dark:text-red-400 font-mono">
                        -{sym}{parseFloat(exp.amount).toFixed(2)}
                      </p>
                      <button 
                        onClick={() => deleteExpense(exp._id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete expense"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Spending Analysis</h3>
          <div className="flex-1 min-h-[300px]">
             <ExpenseChart expenses={expenses} totalBudget={totalBudget} currencySymbol={sym} />
          </div>
        </div>
      </div>
    </div>
  );
}
