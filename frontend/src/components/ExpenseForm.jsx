import React, { useState, useEffect } from 'react';
import { PlusCircle, Plus, Trash2, ChevronDown } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export default function ExpenseForm({ currencySymbol = '$' }) {
  const { categories, addCategory, removeCategory, addExpense, selectedMonth } = useFinance();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  // Default to today if selectedMonth is current month, otherwise 1st of selectedMonth
  const defaultDate = selectedMonth === new Date().toISOString().slice(0, 7) 
    ? new Date().toISOString().slice(0, 10) 
    : `${selectedMonth}-01`;
  const [date, setDate] = useState(defaultDate);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Update date if selectedMonth changes
  useEffect(() => {
    setDate(selectedMonth === new Date().toISOString().slice(0, 7) 
      ? new Date().toISOString().slice(0, 10) 
      : `${selectedMonth}-01`);
  }, [selectedMonth]);

  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount)) return;

    addExpense({
      amount: parseFloat(amount),
      category: category || categories[0],
      date
    });

    setAmount('');
  };

  return (
    <div className="glass rounded-3xl p-6 relative z-20">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Add Expense</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{currencySymbol}</span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-8 pr-4 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Category</label>
            <button
              type="button"
              onClick={() => setIsCatOpen(!isCatOpen)}
              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex items-center justify-between"
            >
              <span>{category || 'Select...'}</span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>

            {isCatOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="max-h-48 overflow-y-auto custom-scrollbar py-1">
                  {categories.map(c => (
                    <div key={c} className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                      <button 
                        type="button" 
                        className="flex-1 text-left text-slate-700 dark:text-white" 
                        onClick={() => { setCategory(c); setIsCatOpen(false); }}
                      >
                        {c}
                      </button>
                      <button 
                        type="button" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          removeCategory(c); 
                          if(category===c) setCategory(categories.length > 1 ? categories.find(x => x !== c) : ''); 
                        }} 
                        className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 p-1"
                        title="Delete category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 dark:border-white/10 p-2 bg-slate-50 dark:bg-slate-900/50 flex items-center space-x-2">
                  <input 
                    type="text" 
                    value={newCatName} 
                    onChange={e => setNewCatName(e.target.value)} 
                    placeholder="New category..." 
                    className="flex-1 w-full bg-white dark:bg-white/5 text-sm px-2 py-1.5 rounded outline-none text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-transparent"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newCatName) { addCategory(newCatName); setNewCatName(''); }
                      }
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => { if (newCatName) { addCategory(newCatName); setNewCatName(''); } }}
                    className="p-1.5 bg-indigo-500 hover:bg-indigo-600 rounded text-white"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:[color-scheme:dark]"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-medium transition-colors flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
        >
          <PlusCircle size={20} />
          <span>Save Expense</span>
        </button>
      </form>
    </div>
  );
}
