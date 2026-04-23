import React, { createContext, useState, useEffect, useContext } from 'react';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState(['Lifestyle', 'Snacks', 'Celebration', 'Personal', 'Misc']);
  const [currency, setCurrency] = useState('USD');
  const [totalBudget, setTotalBudget] = useState(1250);
  const [theme, setTheme] = useState('dark');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const cachedExps = localStorage.getItem('expenses_cache');
    if (cachedExps) setExpenses(JSON.parse(cachedExps));

    const savedCurr = localStorage.getItem('app_currency');
    if (savedCurr) setCurrency(savedCurr);

    const savedBudget = localStorage.getItem('app_total_budget');
    if (savedBudget) setTotalBudget(parseFloat(savedBudget));

    const savedCats = localStorage.getItem('app_categories');
    if (savedCats) setCategories(JSON.parse(savedCats));

    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme) setTheme(savedTheme);

    const savedMonth = localStorage.getItem('app_selected_month');
    if (savedMonth) setSelectedMonth(savedMonth);
  }, []);

  // Sync theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Fetch data when selectedMonth changes
  useEffect(() => {
    fetchData(selectedMonth);
  }, [selectedMonth]);

  const fetchData = async (month) => {
    try {
      // Fetch categories
      const catRes = await fetch('http://localhost:5001/api/categories');
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
        localStorage.setItem('app_categories', JSON.stringify(catData));
      }

      // Fetch expenses for the selected month
      const res = await fetch(`http://localhost:5001/api/expenses?monthTag=${month}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
        localStorage.setItem(`expenses_cache_${month}`, JSON.stringify(data));
      } else {
        // Fallback to cache if API fails
        const cachedExps = localStorage.getItem(`expenses_cache_${month}`);
        if (cachedExps) setExpenses(JSON.parse(cachedExps));
      }
    } catch (err) {
      console.error("Failed to fetch from backend", err);
      const cachedExps = localStorage.getItem(`expenses_cache_${month}`);
      if (cachedExps) setExpenses(JSON.parse(cachedExps));
    }
  };

  const saveChanges = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/expenses/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthTag: selectedMonth, expenses })
      });
      if (res.ok) {
        setIsDirty(false);
      } else {
        const errorData = await res.json();
        console.error("Failed to save changes:", errorData);
        alert("Failed to save changes to the database. Please try again.");
      }
    } catch (err) {
      console.error("Failed to save changes to backend", err);
      alert("Network error: Could not reach the server to save changes.");
    }
  };

  const addExpense = async (expense) => {
    const rowId = expense.rowId || Date.now().toString();
    const newExpense = { ...expense, rowId, _id: Date.now().toString() }; // Optimistic id
    const newExpenses = [newExpense, ...expenses];
    setExpenses(newExpenses);
    localStorage.setItem(`expenses_cache_${selectedMonth}`, JSON.stringify(newExpenses));
    setIsDirty(true);
  };

  const updateExpense = async (id, updates) => {
    const updatedExpenses = expenses.map(e => e._id === id ? { ...e, ...updates } : e);
    setExpenses(updatedExpenses);
    localStorage.setItem(`expenses_cache_${selectedMonth}`, JSON.stringify(updatedExpenses));
    setIsDirty(true);
  };

  const deleteExpense = async (id) => {
    const filtered = expenses.filter(e => e._id !== id);
    setExpenses(filtered);
    localStorage.setItem(`expenses_cache_${selectedMonth}`, JSON.stringify(filtered));
    setIsDirty(true);
  };

  const saveCurrency = (curr) => {
    setCurrency(curr);
    localStorage.setItem('app_currency', curr);
  };

  const saveBudget = (val) => {
    setTotalBudget(val);
    localStorage.setItem('app_total_budget', val.toString());
  };

  const addCategory = async (name) => {
    const newCats = [...categories, name];
    const uniqueCats = [...new Set(newCats)];
    setCategories(uniqueCats);
    localStorage.setItem('app_categories', JSON.stringify(uniqueCats));
    
    try {
      await fetch(`http://localhost:5001/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
    } catch (e) { console.error(e); }
  };

  const removeCategory = async (name) => {
    const newCats = categories.filter(c => c !== name);
    setCategories(newCats);
    localStorage.setItem('app_categories', JSON.stringify(newCats));
    
    try {
      await fetch(`http://localhost:5001/api/categories/${name}`, { method: 'DELETE' });
    } catch (e) { console.error(e); }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);
  };

  const changeMonth = (month) => {
    if (isDirty) {
      const confirmLeave = window.confirm("You have unsaved changes for the current month. If you switch months, these changes will be lost. Are you sure you want to discard them?");
      if (!confirmLeave) return;
    }
    setSelectedMonth(month);
    localStorage.setItem('app_selected_month', month);
    setIsDirty(false); // Reset dirty flag when switching months
  };

  return (
    <FinanceContext.Provider value={{
      expenses, categories, currency, totalBudget, theme, selectedMonth, isDirty,
      addExpense, updateExpense, deleteExpense, saveChanges,
      saveCurrency, saveBudget, addCategory, removeCategory,
      toggleTheme, changeMonth
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
