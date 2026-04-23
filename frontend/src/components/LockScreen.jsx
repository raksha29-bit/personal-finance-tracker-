import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Check, Delete } from 'lucide-react';

export default function LockScreen({ onUnlock, mode = 'login', onChangePinSuccess, onCancelChange }) {
  const [pin, setPin] = useState('');
  const [savedPin, setSavedPin] = useState(null);
  const [error, setError] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);
  
  // For change PIN mode
  const [changeStep, setChangeStep] = useState('verify_current'); // verify_current, enter_new
  
  // Attempt tracking
  const [attempts, setAttempts] = useState(3);
  const [lockoutTime, setLockoutTime] = useState(0);

  useEffect(() => {
    const storedPin = localStorage.getItem('app_pin');
    if (storedPin) {
      setSavedPin(storedPin);
    } else if (mode === 'login') {
      setIsSettingPin(true);
    }
  }, [mode]);

  useEffect(() => {
    let timer;
    if (lockoutTime > 0) {
      timer = setTimeout(() => {
        setLockoutTime(prev => prev - 1);
      }, 1000);
    } else if (lockoutTime === 0 && attempts === 0) {
      setAttempts(3); // Reset attempts after lockout
    }
    return () => clearTimeout(timer);
  }, [lockoutTime, attempts]);

  const handleDigit = (digit) => {
    if (lockoutTime > 0) return;
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setError(false);
    }
  };

  const handleDelete = () => {
    if (lockoutTime > 0) return;
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleEnter = () => {
    if (pin.length !== 4 || lockoutTime > 0) return;

    if (mode === 'change') {
      if (changeStep === 'verify_current') {
        if (pin === savedPin) {
          setChangeStep('enter_new');
          setPin('');
          setAttempts(3);
        } else {
          handleFailure();
        }
      } else if (changeStep === 'enter_new') {
        localStorage.setItem('app_pin', pin);
        if (onChangePinSuccess) onChangePinSuccess();
      }
      return;
    }

    // Normal login mode
    if (isSettingPin) {
      localStorage.setItem('app_pin', pin);
      setSavedPin(pin);
      setIsSettingPin(false);
      onUnlock();
    } else {
      if (pin === savedPin) {
        setAttempts(3);
        onUnlock();
      } else {
        handleFailure();
      }
    }
  };

  const handleFailure = () => {
    setError(true);
    setPin('');
    const newAttempts = attempts - 1;
    setAttempts(newAttempts);
    
    if (newAttempts <= 0) {
      setLockoutTime(30); // 30 second lockout
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="w-full max-w-sm p-8 glass rounded-3xl flex flex-col items-center animate-in zoom-in-95 duration-500 shadow-2xl border border-slate-200 dark:border-white/10">
        
        <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mb-6">
          {error ? <Lock className="text-red-500" size={32} /> : 
           isSettingPin || changeStep === 'enter_new' ? <Unlock className="text-emerald-500 dark:text-emerald-400" size={32} /> : 
           <Lock className="text-indigo-500 dark:text-indigo-400" size={32} />}
        </div>

        <div className="text-center mb-8 h-20">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            {isSettingPin ? 'Set New PIN' : 
             changeStep === 'verify_current' ? 'Enter Current PIN' :
             changeStep === 'enter_new' ? 'Enter New PIN' :
             'Enter PIN'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {lockoutTime > 0 ? `Locked for ${lockoutTime} seconds` :
             isSettingPin ? 'Create a 4-digit PIN to secure your data' : 
             mode === 'change' ? 'Update your security credentials' :
             'Welcome back, secure your finances'}
          </p>
          {!isSettingPin && lockoutTime === 0 && mode !== 'change' && (
            <p className="text-red-500 dark:text-red-400 text-sm font-medium mt-1">{attempts} attempt{attempts !== 1 ? 's' : ''} left</p>
          )}
          {!isSettingPin && lockoutTime === 0 && mode === 'change' && changeStep === 'verify_current' && (
            <p className="text-red-500 dark:text-red-400 text-sm font-medium mt-1">{attempts} attempt{attempts !== 1 ? 's' : ''} left</p>
          )}
        </div>

        {/* PIN Indicators */}
        <div className={`flex space-x-4 mb-8 ${error ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                i < pin.length 
                  ? 'bg-indigo-500 dark:bg-indigo-400 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.5)]' 
                  : 'bg-slate-200 dark:bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleDigit(num.toString())}
              disabled={lockoutTime > 0}
              className="h-14 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent hover:bg-slate-50 dark:hover:bg-white/10 text-xl font-medium text-slate-800 dark:text-white transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm dark:shadow-none"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleDelete}
            disabled={pin.length === 0 || lockoutTime > 0}
            className="h-14 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent hover:bg-slate-50 dark:hover:bg-white/10 text-sm font-medium text-slate-500 dark:text-slate-400 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm dark:shadow-none"
          >
            DEL
          </button>
          <button
            onClick={() => handleDigit('0')}
            disabled={lockoutTime > 0}
            className="h-14 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent hover:bg-slate-50 dark:hover:bg-white/10 text-xl font-medium text-slate-800 dark:text-white transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm dark:shadow-none"
          >
            0
          </button>
          <button
            onClick={handleEnter}
            disabled={pin.length !== 4 || lockoutTime > 0}
            className="h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-100 dark:border-transparent"
          >
            <Check size={24} />
          </button>
        </div>

        {mode === 'change' && (
          <button onClick={onCancelChange} className="mt-6 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
