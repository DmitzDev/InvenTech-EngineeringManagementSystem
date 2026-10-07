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
  ShieldCheck,
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';

const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'reservations', label: 'Bookings', icon: Calendar },
  { id: 'transactions', label: 'Transactions', icon: ScrollText },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'security', label: 'Security & Audit', icon: ShieldCheck },
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
    <header className="w-full max-w-full sticky top-0 z-50 border-b-2 border-slate-300 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md select-none shrink-0 shadow-xs overflow-hidden">
      {/* Primary Top Row (Brand on Left, Tabs in Center on Desktop md+, Controls on Right) */}
      <div className="h-14 md:h-16 px-2.5 sm:px-4 md:px-6 flex items-center justify-between gap-2 md:gap-4 w-full relative">
        {/* 1. Left Cluster: */}
        {/* Mobile View (< md): UDD Logo + ADMIN Badge */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0 z-10">
          <img
            src="/images/udd_logo.png"
            alt="UDD Logo"
            className="w-7 h-7 object-contain drop-shadow-sm shrink-0"
          />
          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase bg-slate-900 text-white dark:bg-white/15 dark:text-white border border-slate-700 dark:border-white/20 shadow-xs shrink-0">
            ADMIN
          </span>
        </div>

        {/* Mobile View (< md) Center: INVEN [LOGO] TECH */}
        <div className="flex md:hidden items-center justify-center gap-1.5 shrink-0 absolute left-1/2 -translate-x-1/2 pointer-events-none z-0">
          <span
            className="text-sm sm:text-base font-black tracking-tight uppercase leading-none"
            style={{ color: isDark ? '#f97316' : '#0284c7' }}
          >
            INVEN
          </span>
          <img
            src="/images/inventech_logo.png"
            alt="InvenTech Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow-sm shrink-0"
          />
          <span
            className="text-sm sm:text-base font-black tracking-tight uppercase leading-none"
            style={{ color: isDark ? '#38bdf8' : '#ea580c' }}
          >
            TECH
          </span>
        </div>

        {/* Desktop View (>= md): InvenTech Logo + INVENTECH Title + ADMIN Badge */}
        <div className="hidden md:flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
          <img
            src="/images/inventech_logo.png"
            alt="InvenTech Logo"
            className="w-8 h-8 md:w-9 md:h-9 object-contain drop-shadow-sm transition-transform hover:scale-105 shrink-0"
          />
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="text-base md:text-lg font-black tracking-tight uppercase whitespace-nowrap leading-none flex items-center">
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

            {/* Monospace ADMIN badge */}
            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-black tracking-wider uppercase bg-slate-900 text-white dark:bg-white/15 dark:text-white border border-slate-700 dark:border-white/20 shadow-xs shrink-0">
              ADMIN
            </span>
          </div>
        </div>

        {/* 2. Center: 5 Clean Unboxed Navigation Items (Zero Overlap on Laptops & Desktops) */}
        <nav className="hidden md:flex items-center justify-center gap-1 lg:gap-1.5 shrink-0">
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
                className={`relative h-8 sm:h-9 py-1 px-2 sm:px-2.5 lg:px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 active:scale-95 ${
                  isActive
                    ? 'bg-slate-200/90 dark:bg-white/10 text-slate-950 dark:text-white font-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-white/5'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-colors ${
                    isActive ? 'text-slate-950 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <span>{tab.label}</span>
                {badgeCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black bg-amber-500 text-slate-950 shadow-xs">
                    {badgeCount}
                  </span>
                )}
                {/* Platinum Active Underline Indicator Bar */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-slate-800 dark:bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* 3. Right Cluster: Compact Controls (Zero overlap flex-nowrap) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap">
          {/* Print Report Button */}
          {onPrintReport && (
            <button
              type="button"
              onClick={onPrintReport}
              className="h-8 sm:h-9 px-2 sm:px-2.5 text-xs font-bold flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer active:scale-95 transition-all shadow-xs shrink-0"
              title="Print System Report"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden lg:inline">Report</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="h-8 w-8 sm:h-9 sm:w-9 p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center cursor-pointer shadow-xs shrink-0"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Telemetry Clock (Only shown on extra-wide screens to prevent cramming) */}
          <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 shrink-0">
            <Clock className="w-3 h-3 text-slate-600 dark:text-slate-300 shrink-0" />
            <span>{time}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500 dark:text-slate-400">{date}</span>
          </div>

          {/* Logout / Exit Button */}
          <button
            type="button"
            onClick={onLogout}
            className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-bold uppercase tracking-wider rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs shrink-0"
            title="Exit to Kiosk"
            aria-label="Exit to Kiosk"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Rail (< md): Dedicated Touch-Friendly Navigation Row */}
      <nav
        className="md:hidden border-t border-slate-200/90 dark:border-slate-800/90 bg-slate-100/70 dark:bg-slate-900/70 backdrop-blur-md px-1 py-1 grid grid-cols-6 gap-0.5 w-full"
        aria-label="Mobile Navigation Tabs"
      >
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
              className={`relative py-1.5 px-0.5 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 min-w-0 ${
                isActive
                  ? 'bg-slate-200/90 dark:bg-white/10 text-slate-950 dark:text-white font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-slate-950 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[9px] font-mono font-black bg-amber-500 text-slate-950 shadow-xs">
                    {badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tight truncate mt-0.5 max-w-full">
                {tab.id === 'dashboard'
                  ? 'Dash'
                  : tab.id === 'inventory'
                  ? 'Items'
                  : tab.id === 'reservations'
                  ? 'Book'
                  : tab.id === 'transactions'
                  ? 'Loans'
                  : tab.id === 'reports'
                  ? 'Audit'
                  : 'Sec'}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1.5 right-1.5 h-0.5 bg-slate-800 dark:bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

