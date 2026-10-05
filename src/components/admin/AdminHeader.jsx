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
    <header className="neu-card rounded-none h-16 sm:h-20 px-3 sm:px-6 border-b-2 border-slate-300 dark:border-white/10 flex items-center justify-between gap-3 shrink-0 z-30 select-none">
      {/* 1. Left: Brand with InvenTech Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl neu-inset-sm flex items-center justify-center p-1.5 shrink-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 shadow-xs">
          <img
            src="/images/inventech_logo.png"
            alt="InvenTech Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white uppercase whitespace-nowrap">
              INVENTECH <span className="text-cyan-600 dark:text-cyan-400">ADMIN</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.9)] shrink-0 hidden sm:inline-block" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:block">
            Engineering Labs
          </span>
        </div>
      </div>

      {/* 2. Center: Top Navigation Tabs (Replacing the bulky sidebar) */}
      <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-1">
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
              className={`min-h-[40px] px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95 shrink-0 ${
                isActive
                  ? 'neu-btn-primary shadow-sm'
                  : 'neu-btn-raised text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {badgeCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                    isActive
                      ? 'bg-black/20 text-white'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Right: Utility Controls (Theme Toggle, Print, Telemetry Clock, Exit) */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="neu-btn-raised min-h-[40px] min-w-[40px] p-2 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 shadow-xs"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-slate-800 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Telemetry Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-inset-sm text-xs font-mono font-bold text-slate-700 dark:text-slate-200 shrink-0">
          <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>{time}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 dark:text-slate-400">{date}</span>
        </div>

        {/* Exit to Kiosk */}
        <button
          type="button"
          onClick={onLogout}
          className="neu-btn-danger min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
          title="Exit to Kiosk"
          aria-label="Exit to Kiosk"
        >
          <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>
    </header>
  );
}
