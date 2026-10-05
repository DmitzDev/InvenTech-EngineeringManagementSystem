import React, { useState, useEffect } from 'react';
import { Clock, Terminal, Menu, X, Sun, Moon, Printer, LogOut, ShieldCheck } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';

export default function AdminHeader({ onToggleMobileMenu, isMobileMenuOpen, onLogout, onPrintReport }) {
  const { theme, toggleTheme } = useTransaction();
  const isDark = theme === 'dark';

  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePrint = () => {
    if (onPrintReport) {
      onPrintReport();
    } else {
      window.print();
    }
  };

  return (
    <header className="h-16 sm:h-20 px-3 sm:px-6 bg-white dark:bg-[#111827] border-b-2 border-slate-200 dark:border-slate-800 ring-1 ring-inset ring-white/10 dark:ring-white/5 flex items-center justify-between shrink-0 transition-colors z-20 select-none shadow-xs">
      {/* Left: Mobile Trigger + Institutional Brand & Telemetry */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden min-h-[44px] min-w-[44px] p-2 rounded-xl bg-slate-100 dark:bg-[#0B0F19] border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all duration-150"
          aria-label={isMobileMenuOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6 text-rose-500" /> : <Menu className="w-6 h-6 text-slate-900 dark:text-white" />}
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-black tracking-tight text-slate-950 dark:text-white truncate">
              INVENTECH // CENTRAL LABORATORY MANAGEMENT CONSOLE
            </span>
            <span className="hidden lg:inline-flex items-center font-mono text-xs font-bold px-2 py-0.5 rounded-md border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100">
              [SYS.MOD // 02 • ADMIN CONSOLE]
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            {/* Live Network Heartbeat Pulse Badge */}
            <div
              className="inline-flex items-center gap-1.5 font-mono text-[11px] sm:text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border-2 border-emerald-400 dark:border-emerald-600/80 shrink-0"
              role="status"
              aria-live="polite"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" />
              <span>[ LINK: ACTIVE ]</span>
            </div>
            <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold hidden md:inline truncate">
              • Universidad de Dagupan School of Engineering
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions, Theme Toggle, and Control Cluster */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Exact Kiosk-Matching Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-900 dark:text-yellow-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all duration-150 flex items-center justify-center cursor-pointer shadow-xs"
          title={isDark ? 'Switch to High-Contrast Light Mode' : 'Switch to High-Contrast Dark Mode'}
          aria-label="Toggle visual contrast theme"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400 transition-transform duration-150 hover:rotate-45" />
          ) : (
            <Moon className="w-5 h-5 text-slate-900 transition-transform duration-150 hover:-rotate-12" />
          )}
        </button>

        {/* Action Button: Print Lab Report */}
        <button
          type="button"
          onClick={handlePrint}
          className="hidden sm:inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-950 dark:text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer active:scale-95 shadow-xs"
          title="Print official laboratory report / slip"
          aria-label="Print Laboratory Report"
        >
          <Printer className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Print Report</span>
        </button>

        {/* Action Button: Launch Kiosk (Return to Student Terminal) */}
        <a
          href="/"
          className="hidden lg:inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl border-2 border-cyan-500/50 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900 text-cyan-950 dark:text-cyan-200 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer active:scale-95 shadow-xs"
          title="Open Public Student Kiosk Interface"
        >
          <Terminal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Launch Kiosk</span>
        </a>

        {/* Action Button: Exit Console */}
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 min-h-[44px] px-3 sm:px-4 py-2 rounded-xl border-2 border-rose-300 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer active:scale-95 shadow-xs"
          title="Exit Admin Console"
          aria-label="Exit Console"
        >
          <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span className="hidden xs:inline">Exit Console</span>
        </button>

        {/* Telemetry Clock */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0B0F19] text-xs font-mono font-bold text-slate-950 dark:text-slate-100 shrink-0">
          <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>{time}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-700 dark:text-slate-300">{date}</span>
        </div>
      </div>
    </header>
  );
}
