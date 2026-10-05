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
    <header className="neu-card rounded-none h-16 sm:h-20 px-3 sm:px-6 border-b-2 border-slate-300 dark:border-white/10 flex items-center justify-between shrink-0 z-20 select-none">
      {/* Left: Mobile Trigger + Institutional Brand & Telemetry */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden neu-btn-raised min-h-[44px] min-w-[44px] p-2 rounded-xl flex items-center justify-center cursor-pointer active:scale-95"
          aria-label={isMobileMenuOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6 text-rose-500" /> : <Menu className="w-6 h-6" />}
        </button>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase truncate">
            INVENTECH <span className="text-cyan-600 dark:text-cyan-400">CONSOLE</span>
          </span>
          <span className="hidden sm:inline-flex items-center font-mono text-xs font-black px-2 py-0.5 rounded-md border border-slate-300 dark:border-white/15 neu-inset-sm">
            [SYS.ADMIN]
          </span>

          {/* Live Network Heartbeat Pulse Badge */}
          <div
            className="inline-flex items-center gap-1.5 font-mono text-[11px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-400 dark:border-emerald-600 shrink-0"
            role="status"
            aria-live="polite"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.9)] shrink-0" />
            <span>[LINK: ACTIVE]</span>
          </div>
        </div>
      </div>

      {/* Right: Actions, Theme Toggle, and Control Cluster */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Exact Kiosk-Matching Tactile Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="neu-btn-raised min-h-[44px] min-w-[44px] p-2.5 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 shadow-sm"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle visual contrast theme"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-5 h-5 text-slate-900 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Action Button: Print Lab Report */}
        <button
          type="button"
          onClick={handlePrint}
          className="hidden sm:inline-flex items-center gap-1.5 neu-btn-raised min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer active:scale-95"
          title="Print official laboratory report"
          aria-label="Print Report"
        >
          <Printer className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Print</span>
        </button>

        {/* Action Button: Launch Kiosk (Return to Student Terminal) */}
        <a
          href="/"
          className="hidden lg:inline-flex items-center gap-1.5 neu-btn-primary min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer active:scale-95"
          title="Open Public Student Kiosk Interface"
        >
          <Terminal className="w-4 h-4" />
          <span>Kiosk View</span>
        </a>

        {/* Action Button: Exit Console */}
        <button
          type="button"
          onClick={onLogout}
          className="neu-btn-danger min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95"
          title="Exit Admin Console"
          aria-label="Exit Console"
        >
          <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>Exit</span>
        </button>

        {/* Telemetry Clock */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl neu-inset-sm text-xs font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
          <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>{time}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600 dark:text-slate-400">{date}</span>
        </div>
      </div>
    </header>
  );
}
