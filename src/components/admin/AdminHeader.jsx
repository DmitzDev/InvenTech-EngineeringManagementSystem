import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Calendar,
  ScrollText,
  FileSpreadsheet,
  Sun,
  Moon,
  LogOut,
  Clock,
  Printer,
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';

const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'reservations', label: 'Bookings', icon: Calendar },
  { id: 'transactions', label: 'Transactions', icon: ScrollText },
  { id: 'reports', label: 'Audit Reports', icon: FileSpreadsheet },
];

export default function AdminHeader({ activeTab, onTabChange, onLogout, onPrintReport }) {
  const { theme, toggleTheme, reservations, activeTransactions } = useTransaction();
  const isDark = theme === 'dark';

  const pendingCount = (reservations || []).filter((r) => (r.status || 'PENDING') === 'PENDING').length;
  const activeBorrowedCount = (activeTransactions || []).filter((t) => t.status === 'BORROWED').length;

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
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="neu-card rounded-none h-14 sm:h-16 px-3 sm:px-6 border-b-2 border-slate-300 dark:border-white/10 flex items-center justify-between gap-2 sm:gap-4 shrink-0 z-30 select-none max-w-full">
      {/* 1. Left: Brand with Independent InvenTech Logo (No surrounding box/card) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <img
          src="/images/inventech_logo.png"
          alt="InvenTech Logo"
          className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm transition-transform hover:scale-105 shrink-0"
        />
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* INVEN - TECH with theme color swap:
              Dark mode: INVEN = Vivid Orange (#f97316), TECH = Sky Blue (#38bdf8)
              Light mode: INVEN = Sky Blue (#0284c7), TECH = Vivid Orange (#ea580c)
          */}
          <span className="text-sm sm:text-lg font-black tracking-tight uppercase whitespace-nowrap leading-none flex items-center">
            <span
              className={isDark ? 'text-[#f97316]' : 'text-[#0284c7]'}
              style={{ color: isDark ? '#f97316' : '#0284c7' }}
            >
              INVEN
            </span>
            <span
              className={isDark ? 'text-[#38bdf8]' : 'text-[#ea580c]'}
              style={{ color: isDark ? '#38bdf8' : '#ea580c' }}
            >
              TECH
            </span>
            <span className="ml-1.5 sm:ml-2 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-black tracking-wider uppercase bg-slate-900 text-white dark:bg-white/15 dark:text-white border border-slate-700 dark:border-white/20 shadow-xs">
              ADMIN
            </span>
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.9)] shrink-0 hidden sm:inline-block" />
        </div>
      </div>

      {/* 2. Center: 5 Clean Unboxed Navigation Items (Hindi naka-box, sleek, compact) */}
      <nav className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badgeCount =
            tab.id === 'reservations' ? pendingCount : tab.id === 'transactions' ? activeBorrowedCount : 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative py-1.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-extrabold uppercase tracking-wide transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 hover:bg-slate-200/50 dark:hover:bg-white/5 ${
                isActive
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-colors ${
                  isActive
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <span>{tab.label}</span>
              {badgeCount > 0 && (
                <span
                  className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black bg-amber-500 text-slate-950 shadow-xs"
                >
                  {badgeCount}
                </span>
              )}
              {/* Active Underline Indicator Bar */}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-600 dark:bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Right: Utility Controls (Theme Toggle, Telemetry Clock, Exit) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="neu-btn-raised h-8 w-8 sm:h-9 sm:w-9 p-1.5 sm:p-2 rounded-lg flex items-center justify-center cursor-pointer active:scale-95 shadow-xs"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-800 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Telemetry Clock */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg neu-inset-sm text-xs font-mono font-bold text-slate-700 dark:text-slate-200 shrink-0">
          <Clock className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>{time}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 dark:text-slate-400">{date}</span>
        </div>

        {/* Exit to Kiosk */}
        <button
          type="button"
          onClick={onLogout}
          className="neu-btn-danger h-8 sm:h-9 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
          title="Exit to Kiosk"
          aria-label="Exit to Kiosk"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>
    </header>
  );
}

