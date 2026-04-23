import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ArrowLeft, Plus, Trash2, Edit2, Download, Save } from 'lucide-react';

export default function SmartLedger({ onNavigate }) {
  const { expenses, categories, currency, addExpense, updateExpense, deleteExpense, selectedMonth, isDirty, saveChanges } = useFinance();
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCatName, setNewCatName] = useState('');

  // Group expenses by rowId
  const rowsData = useMemo(() => {
    const rowMap = {};
    expenses.forEach(exp => {
      if (!rowMap[exp.rowId]) {
        rowMap[exp.rowId] = { rowId: exp.rowId, date: exp.date, expenses: {} };
      }
      rowMap[exp.rowId].expenses[exp.category] = exp;
    });
    // Sort by date ascending for ledger view
    return Object.values(rowMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [expenses]);

  const CURRENCIES = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹' };
  const sym = CURRENCIES[currency];

  const categoryTotals = useMemo(() => {
    const totals = {};
    categories.forEach(c => totals[c] = 0);
    expenses.forEach(exp => {
      if (totals[exp.category] !== undefined) {
        totals[exp.category] += parseFloat(exp.amount) || 0;
      }
    });
    return totals;
  }, [expenses, categories]);

  const handleCellEdit = (rowId, date, category, val) => {
    const amount = parseFloat(val);
    const existingRow = rowsData.find(r => r.rowId === rowId);
    const existingExp = existingRow?.expenses[category];

    if (isNaN(amount) || amount <= 0) {
      if (existingExp) deleteExpense(existingExp._id);
      return;
    }

    if (existingExp) {
      if (amount !== parseFloat(existingExp.amount)) {
        updateExpense(existingExp._id, { amount });
      }
    } else {
      addExpense({
        rowId,
        date,
        category,
        amount
      });
    }
  };

  const handleDateEdit = (rowId, newDate) => {
    const existingRow = rowsData.find(r => r.rowId === rowId);
    if (!existingRow) return;
    Object.values(existingRow.expenses).forEach(exp => {
      updateExpense(exp._id, { date: newDate });
    });
  };

  const handleRenameCategory = async (oldName) => {
    if (!newCatName || newCatName === oldName) return;
    try {
      await fetch(`http://localhost:5001/api/categories/${oldName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName })
      });
      window.location.reload(); // Quick refresh to grab new state
    } catch (e) { console.error(e); }
  };

  const handleDeleteCategory = async (name) => {
    if (!window.confirm(`Delete category ${name}?`)) return;
    try {
      await fetch(`http://localhost:5001/api/categories/${name}`, { method: 'DELETE' });
      window.location.reload();
    } catch (e) { console.error(e); }
  };

  const handleAddCategory = async () => {
    const name = prompt("New category name:");
    if (!name) return;
    try {
      await fetch(`http://localhost:5001/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      window.location.reload();
    } catch (e) { console.error(e); }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['Date,Category,Amount'];
    const rows = expenses.map(exp => `${exp.date},${exp.category},${exp.amount}`);
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smart_ledger_export_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add an empty row for new inputs
  const defaultNewDate = selectedMonth === new Date().toISOString().slice(0, 7) ? new Date().toISOString().slice(0, 10) : `${selectedMonth}-01`;
  const displayRows = [...rowsData, { rowId: 'new', date: defaultNewDate, expenses: {}, isNew: true }];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 flex flex-col h-screen transition-colors duration-300">
      <header className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={() => onNavigate('dashboard')} className="p-2 glass rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white transition-colors border-slate-300 dark:border-white/20">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Smart Ledger <span className="text-sm font-normal text-slate-500 ml-2">({selectedMonth})</span></h1>
        </div>
        <div className="flex items-center space-x-3">
          {/* Save Button */}
          <button 
            onClick={saveChanges}
            disabled={!isDirty}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all relative ${
              isDirty 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 cursor-pointer' 
                : 'bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isDirty && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
            <Save size={16} />
            <span className="hidden sm:inline font-medium text-sm">{isDirty ? "Save Changes" : "Saved"}</span>
          </button>

          <button onClick={handleExportCSV} className="flex items-center space-x-1 text-sm bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-white px-3 py-1.5 rounded-lg transition-colors border border-slate-300 dark:border-white/10">
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={handleAddCategory} className="flex items-center space-x-1 text-sm bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
            <Plus size={16} />
            <span className="hidden sm:inline">Add Category</span>
          </button>
        </div>
      </header>

      <div className="flex-1 glass rounded-2xl overflow-hidden flex flex-col relative border border-slate-200 dark:border-white/10 shadow-2xl">
        <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="sticky top-0 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur z-10 shadow-sm border-b border-slate-300 dark:border-white/10">
              <tr>
                <th className="p-4 text-slate-600 dark:text-slate-300 font-medium w-40 border-r border-slate-200 dark:border-white/5">Date</th>
                {categories.map(cat => (
                  <th key={cat} className="p-4 text-slate-600 dark:text-slate-300 font-medium min-w-[140px] border-r border-slate-200 dark:border-white/5 group">
                    {editingCategory === cat ? (
                      <div className="flex items-center space-x-2">
                        <input 
                          autoFocus
                          defaultValue={cat}
                          onChange={e => setNewCatName(e.target.value)}
                          onBlur={() => { handleRenameCategory(cat); setEditingCategory(null); }}
                          onKeyDown={e => { if (e.key === 'Enter') { handleRenameCategory(cat); setEditingCategory(null); } }}
                          className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm px-2 py-1 rounded w-24 outline-none border border-indigo-500/50"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span>{cat}</span>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingCategory(cat)} className="text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 p-1"><Edit2 size={12}/></button>
                          <button onClick={() => handleDeleteCategory(cat)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-1"><Trash2 size={12}/></button>
                        </div>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, i) => (
                <tr key={row.rowId} className="border-b border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="p-2 border-r border-slate-200 dark:border-white/5">
                    <input 
                      type="date"
                      defaultValue={row.date}
                      onBlur={e => row.isNew ? null : handleDateEdit(row.rowId, e.target.value)}
                      className="bg-transparent text-slate-600 dark:text-slate-300 text-sm px-2 py-1.5 rounded outline-none focus:ring-1 focus:ring-indigo-500/50 w-full dark:[color-scheme:dark]"
                    />
                  </td>
                  {categories.map(cat => {
                    const exp = row.expenses[cat];
                    const amountStr = exp ? parseFloat(exp.amount).toFixed(2) : '';
                    return (
                      <td key={cat} className="p-2 border-r border-slate-200 dark:border-white/5 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm">{sym}</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          defaultValue={amountStr}
                          onBlur={e => {
                            const val = e.target.value;
                            if (val === amountStr) return;
                            const rId = row.isNew ? Date.now().toString() : row.rowId;
                            handleCellEdit(rId, row.date, cat, val);
                            if (row.isNew) e.target.value = '';
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') e.target.blur();
                          }}
                          className="w-full bg-transparent text-slate-800 dark:text-white pl-6 pr-2 py-1.5 rounded outline-none focus:bg-slate-100 dark:focus:bg-white/5 focus:ring-1 focus:ring-indigo-500/50 text-right font-mono"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur z-10 border-t border-slate-300 dark:border-white/10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <tr>
                <td className="p-4 text-slate-800 dark:text-white font-bold border-r border-slate-200 dark:border-white/5">Totals</td>
                {categories.map(cat => (
                  <td key={cat} className="p-4 text-emerald-600 dark:text-emerald-400 font-bold border-r border-slate-200 dark:border-white/5 text-right font-mono">
                    {sym}{categoryTotals[cat].toFixed(2)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
