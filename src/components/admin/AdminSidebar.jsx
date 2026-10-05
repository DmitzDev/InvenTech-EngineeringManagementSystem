import React from 'react';
import { LayoutDashboard, Package, ScrollText, Calendar, Lock, X, FileSpreadsheet, Shield, LogOut } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import { getInventory } from '../../data/equipmentData';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Live Telemetry & Actions', sysCode: 'SYS.NAV // 01' },
  { id: 'inventory', label: 'Equipment Inventory', icon: Package, desc: 'Master Apparatus Catalog', sysCode: 'SYS.NAV // 02' },
  { id: 'reservations', label: 'Advance Bookings', icon: Calendar, desc: 'Student Reservation Queue', sysCode: 'SYS.NAV // 03' },
  { id: 'transactions', label: 'Transaction History', icon: ScrollText, desc: 'Borrowing & Audit Logs', sysCode: 'SYS.NAV // 04' },
  { id: 'reports', label: 'Audit Reports & Slips', icon: FileSpreadsheet, desc: 'CHED / PACUCOA Analytics', sysCode: 'SYS.NAV // 05' },
];

export default function AdminSidebar({ activeTab, onTabChange, onLock, isMobileOpen, onCloseMobile }) {
  const { reservations, activeTransactions } = useTransaction();
  const inventory = getInventory();

  const pendingCount = (reservations || []).filter((r) => (r.status || 'PENDING') === 'PENDING').length;
  const activeBorrowedCount = (activeTransactions || []).filter((t) => t.status === 'BORROWED').length;

  const handleSelectTab = (id) => {
    onTabChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleLock = () => {
    onLock();
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-76 bg-white dark:bg-[#111827] border-r-2 border-slate-200 dark:border-slate-800 ring-1 ring-inset ring-white/10 dark:ring-white/5 flex flex-col h-full shrink-0 transition-transform duration-300 ease-in-out select-none shadow-xl md:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Admin Navigation Sidebar"
      >
        {/* Header / Brand */}
        <div className="px-5 py-4 border-b-2 border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0B0F19]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center p-1.5 shadow-xs shrink-0">
              <img src="/images/udd_logo.png" alt="UdD Seal" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-slate-950 dark:text-white tracking-tight">
                  UDD CUSTODIAN
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" aria-hidden="true" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                School of Engineering
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-slate-100 dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center cursor-pointer active:scale-95 transition-all duration-150"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3.5 space-y-2.5 overflow-y-auto">
          <div className="px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            [CONSOLE MODULES]
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isReservation = item.id === 'reservations';
            const isInventory = item.id === 'inventory';
            const isTransactions = item.id === 'transactions';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full min-h-[52px] flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer relative group border-2 active:scale-95 ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                    : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white bg-slate-50/70 dark:bg-[#0B0F19]/70 hover:bg-slate-100 dark:hover:bg-[#1f2937] border-slate-200 dark:border-slate-800'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border-2 ${
                      isActive
                        ? 'bg-white text-slate-900 border-white dark:bg-slate-900 dark:text-white dark:border-slate-900'
                        : 'bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                    }`}
                    aria-hidden="true"
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className={`text-sm font-bold truncate leading-tight uppercase tracking-wider ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-950 dark:text-white'}`}>
                      {item.label}
                    </p>
                    <p className={`text-xs truncate font-medium mt-0.5 ${isActive ? 'text-slate-300 dark:text-slate-700' : 'text-slate-600 dark:text-slate-400'}`}>
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* High-Contrast Counter Badges */}
                <div className="shrink-0 pl-1.5">
                  {isReservation && pendingCount > 0 && (
                    <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-amber-400 text-amber-950 border-amber-500'
                        : 'bg-amber-200 dark:bg-amber-950 text-amber-950 dark:text-amber-200 border-amber-600 dark:border-amber-500'
                    } animate-pulse`}>
                      {pendingCount}
                    </span>
                  )}
                  {isInventory && (
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                      isActive
                        ? 'bg-slate-800 text-slate-100 border-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                    }`}>
                      {inventory.length}
                    </span>
                  )}
                  {isTransactions && activeBorrowedCount > 0 && (
                    <span className={`text-xs font-mono font-black px-2 py-0.5 rounded border ${
                      isActive
                        ? 'bg-cyan-400 text-cyan-950 border-cyan-500'
                        : 'bg-cyan-200 dark:bg-cyan-950 text-cyan-950 dark:text-cyan-200 border-cyan-600 dark:border-cyan-500'
                    }`}>
                      {activeBorrowedCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Exit Console Footer */}
        <div className="p-4 border-t-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] space-y-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Direct Custodian Access</span>
            </span>
            <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">[ONLINE]</span>
          </div>

          <button
            type="button"
            onClick={onLock}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border-2 border-rose-300 dark:border-rose-900/60 transition-all duration-150 cursor-pointer active:scale-95 shadow-xs"
            aria-label="Exit Admin Console to Student Kiosk"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit to Student Kiosk</span>
          </button>
        </div>
      </aside>
    </>
  );
}
