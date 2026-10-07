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
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dash', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', shortLabel: 'Items', icon: Package },
  { id: 'reservations', label: 'Bookings', shortLabel: 'Book', icon: Calendar },
  { id: 'transactions', label: 'Loans', shortLabel: 'Loans', icon: ScrollText },
  { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: FileSpreadsheet },
  { id: 'security', label: 'Security', shortLabel: 'Security', icon: ShieldCheck },
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
    <header className="w-full max-w-full sticky top-0 z-50 border-b border-slate-300 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md select-none shrink-0 shadow-xs">
      {/* Top Navbar Row */}
      <div className="h-14 sm:h-16 px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 lg:gap-4 w-full">
        {/* 1. Left Cluster: Official Brand (Responsive, Never Overlaps) */}
        {/* Mobile View (< md) */}
        <div className="flex md:hidden items-center gap-2 shrink-0 min-w-0">
          <img
            src="/images/inventech_logo.png"
            alt="InvenTech"
            className="w-7 h-7 object-contain drop-shadow-xs shrink-0"
          />
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="text-sm font-black tracking-tight uppercase truncate"
              style={{ color: isDark ? '#38bdf8' : '#0284c7' }}
            >
              INVENTECH
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-slate-900 text-white dark:bg-white/15 dark:text-white border border-slate-700 dark:border-white/20 shrink-0">
              ADMIN
            </span>
          </div>
        </div>

        {/* Desktop View (>= md) */}
        <div className="hidden md:flex items-center gap-2 sm:gap-2.5 shrink-0">
          <img
            src="/images/inventech_logo.png"
            alt="InvenTech Logo"
            className="w-8 h-8 lg:w-9 lg:h-9 object-contain drop-shadow-sm transition-transform hover:scale-105"
          />
          <div className="flex items-center gap-1.5">
            <span
              className="text-base lg:text-lg font-black tracking-tight uppercase whitespace-nowrap leading-none"
              style={{ color: isDark ? '#38bdf8' : '#0284c7' }}
            >
              INVENTECH
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-mono font-black tracking-wider uppercase bg-slate-900 text-white dark:bg-white/15 dark:text-white border border-slate-700 dark:border-white/20 shadow-xs">
              ADMIN
            </span>
          </div>
        </div>

        {/* 2. Center: Realigned Desktop Navigation Items (Segmented Control Pill with Zero Collision) */}
        <nav className="hidden md:flex items-center justify-center flex-1 min-w-0 px-2">
          <div className="flex items-center gap-1 lg:gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 max-w-full overflow-x-auto no-scrollbar">
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
                  className={`relative h-8 lg:h-9 px-2.5 lg:px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 active:scale-95 ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white font-black shadow-xs border border-slate-200/90 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0 transition-colors ${
                      isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  />
                  {/* Dynamic responsive text: compact on medium/small laptop, full on large screen */}
                  <span className="hidden xl:inline">{tab.label}</span>
                  <span className="inline xl:hidden">{tab.shortLabel}</span>
                  {badgeCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black bg-amber-500 text-slate-950 shadow-xs">
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* 3. Right Cluster: Compact Controls (Zero Overlap Guaranteed) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap">
          {/* Print Report Button (Desktop only on wide viewports) */}
          {onPrintReport && (
            <button
              type="button"
              onClick={onPrintReport}
              className="hidden xl:flex h-8 sm:h-9 px-2.5 text-xs font-bold items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer active:scale-95 transition-all shadow-xs shrink-0"
              title="Print System Report"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
              <span>Report</span>
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

          {/* Telemetry Clock (Extra-wide only) */}
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
            className="h-8 sm:h-9 px-2 sm:px-3 text-xs font-bold uppercase tracking-wider rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs shrink-0"
            title="Exit to Kiosk"
            aria-label="Exit to Kiosk"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Rail (< md): 6-Column Grid with Proportional Padding & Zero Overlap */}
      <nav
        className="md:hidden border-t border-slate-200/90 dark:border-slate-800/90 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md px-1 py-1 w-full"
        aria-label="Mobile Navigation Tabs"
      >
        <div className="grid grid-cols-6 gap-0.5 sm:gap-1 w-full items-center">
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
                className={`relative min-h-[44px] py-1.5 px-0.5 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 min-w-0 ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white font-black shadow-xs border border-slate-200 dark:border-slate-700/80'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[8.5px] font-mono font-black bg-amber-500 text-slate-950 shadow-xs">
                      {badgeCount}
                    </span>
                  )}
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-tight truncate w-full text-center mt-0.5 leading-tight">
                  {tab.shortLabel}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-sky-600 dark:bg-sky-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
