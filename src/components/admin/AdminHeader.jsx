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
    <header className="w-full max-w-full px-3 md:px-6 py-2.5 sm:py-3 border-b-2 border-slate-300 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between gap-2 md:gap-4 shrink-0 select-none">
      {/* 1. Left Cluster: Brand, Admin Tag, & Live Telemetry (Responsive collapsing) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0 max-w-[200px] sm:max-w-xs md:max-w-md">
        <img
          src="/images/inventech_logo.png"
          alt="InvenTech Logo"
          className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-sm transition-transform hover:scale-105 shrink-0"
        />
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {/* INVEN - TECH with theme color swap:
              Dark mode: INVEN = Vivid Orange (#f97316), TECH = Sky Blue (#38bdf8)
              Light mode: INVEN = Sky Blue (#0284c7), TECH = Vivid Orange (#ea580c)
          */}
          <span className="text-sm sm:text-base md:text-lg font-black tracking-tight uppercase whitespace-nowrap leading-none flex items-center truncate">
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
          </span>

          {/* Monospace ADMIN badge (hidden on small mobile < 640px) */}
          <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-black tracking-wider uppercase bg-slate-900 text-white dark:bg-white/15 dark:text-white border border-slate-700 dark:border-white/20 shadow-xs shrink-0">
            ADMIN
          </span>

          {/* Status badge: Full LIVE SYNC on desktop, pulsing dot on mobile */}
          <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
            LIVE SYNC
          </span>
          <span
            className="md:hidden w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.9)] shrink-0"
            title="System Live Sync Active"
          />
        </div>
      </div>

      {/* 2. Center: 5 Clean Unboxed Navigation Items (Horizontally swipeable on mobile) */}
      <nav className="flex items-center gap-1 sm:gap-2 lg:gap-3 overflow-x-auto no-scrollbar py-0.5 shrink min-w-0">
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
              className={`relative py-1.5 px-2 sm:px-2.5 rounded-lg text-xs sm:text-sm font-extrabold uppercase tracking-wide transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 hover:bg-slate-200/50 dark:hover:bg-white/5 active:scale-95 ${
                isActive
                  ? 'text-cyan-600 dark:text-cyan-400 font-black'
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
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.id === 'reservations' ? 'Bookings' : tab.label.slice(0, 4)}</span>
              {badgeCount > 0 && (
                <span
                  className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black bg-amber-500 text-slate-950 shadow-xs"
                >
                  {badgeCount}
                </span>
              )}
              {/* Active Underline Indicator Bar */}
              {isActive && (
                <span className="absolute bottom-0 left-1.5 right-1.5 h-0.5 bg-cyan-600 dark:bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Right Cluster: Tactical Control Actions (Zero overlap flex-nowrap) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 flex-nowrap">
        {/* Optional Print Report Button */}
        {onPrintReport && (
          <>
            <button
              type="button"
              onClick={onPrintReport}
              className="hidden md:inline-flex items-center gap-1.5 neu-btn-raised h-8 sm:h-9 px-3 py-1 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer active:scale-95 shadow-xs"
              title="Print System Report"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Report</span>
            </button>
            <button
              type="button"
              onClick={onPrintReport}
              className="md:hidden neu-btn-raised h-8 w-8 sm:h-9 sm:w-9 p-1.5 rounded-lg flex items-center justify-center cursor-pointer active:scale-95 shadow-xs"
              title="Print System Report"
              aria-label="Print Report"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            </button>
          </>
        )}

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="neu-btn-raised h-8 w-8 sm:h-9 sm:w-9 p-1.5 sm:p-2 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 shadow-xs shrink-0"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-800 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Telemetry Clock (Hidden on screens < 1280px) */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg neu-inset-sm text-xs font-mono font-bold text-slate-700 dark:text-slate-200 shrink-0">
          <Clock className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>{time}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 dark:text-slate-400">{date}</span>
        </div>

        {/* Logout / Exit to Kiosk */}
        <button
          type="button"
          onClick={onLogout}
          className="neu-btn-danger h-8 sm:h-9 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs shrink-0"
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

