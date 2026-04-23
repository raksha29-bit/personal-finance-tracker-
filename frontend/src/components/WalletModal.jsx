import React from 'react';
import { X, Wallet } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export default function WalletModal({ isOpen, onClose }) {
  const { expenses, totalBudget, currency, selectedMonth } = useFinance();

  if (!isOpen) return null;

  const CURRENCIES = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹' };
  const sym = CURRENCIES[currency];

  const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const remainingBudget = totalBudget - totalSpent;
  const percentUsed = ((totalSpent / totalBudget) * 100).toFixed(1);

  // Calculate top category
  const catTotals = {};
  expenses.forEach(exp => {
    catTotals[exp.category] = (catTotals[exp.category] || 0) + parseFloat(exp.amount);
  });
  
  let topCat = 'None';
  let topAmount = 0;
  Object.entries(catTotals).forEach(([cat, amt]) => {
    if (amt > topAmount) {
      topAmount = amt;
      topCat = cat;
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10">
          <X size={20} />
        </button>
        
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
            <Wallet className="text-indigo-500 dark:text-indigo-400" size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Wallet Overview</h2>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
            <span className="text-sm text-slate-500 dark:text-slate-400">Month</span>
            <span className="font-medium text-slate-800 dark:text-white">{selectedMonth}</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
            <span className="text-sm text-slate-500 dark:text-slate-400">Total Budget</span>
            <span className="font-medium text-slate-800 dark:text-white">{sym}{totalBudget.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
            <span className="text-sm text-slate-500 dark:text-slate-400">Total Spent</span>
            <span className="font-medium text-slate-800 dark:text-white">{sym}{totalSpent.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
            <span className="text-sm text-slate-500 dark:text-slate-400">Remaining</span>
            <span className={`font-medium ${remainingBudget < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{sym}{remainingBudget.toFixed(2)}</span>
          </div>

          <div className="pt-2">
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${percentUsed > 100 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
              You've used {percentUsed}% of your budget
            </p>
          </div>

          {topAmount > 0 && (
            <div className="mt-4 p-3 border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-center">
              <p className="text-sm text-indigo-800 dark:text-indigo-300">
                Top category: <span className="font-bold">{topCat}</span> ({sym}{topAmount.toFixed(2)})
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
