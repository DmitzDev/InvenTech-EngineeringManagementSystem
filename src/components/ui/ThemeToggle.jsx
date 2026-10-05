import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTransaction();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all text-slate-800 dark:text-slate-100 shadow-xs cursor-pointer shrink-0 select-none ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-700 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
