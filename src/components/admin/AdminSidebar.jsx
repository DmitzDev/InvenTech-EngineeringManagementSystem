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
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 neu-card rounded-none border-r-2 border-slate-300 dark:border-white/10 flex flex-col h-full shrink-0 transition-transform duration-300 ease-in-out select-none shadow-xl md:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Admin Navigation Sidebar"
      >
        {/* Header / Brand */}
        <div className="px-4 py-3.5 border-b border-slate-300 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl neu-inset-sm flex items-center justify-center p-1.5 shrink-0">
              <img src="/images/udd_logo.png" alt="UdD Seal" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">
                  UdD Custodian
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.9)] shrink-0" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                Engineering Labs
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden neu-btn-raised min-h-[38px] min-w-[38px] p-1.5 rounded-xl flex items-center justify-center cursor-pointer active:scale-95"
            aria-label="Close navigation sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
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
                className={`w-full min-h-[46px] flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative group active:scale-95 ${
                  isActive
                    ? 'neu-btn-primary shadow-md'
                    : 'neu-btn-raised text-slate-700 dark:text-slate-300'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white dark:bg-slate-900/40 dark:text-slate-950'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                    aria-hidden="true"
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider truncate">
                    {item.label}
                  </span>
                </div>

                {/* Counter Badges using Iconic Kiosk Colors */}
                <div className="shrink-0 pl-1">
                  {isReservation && pendingCount > 0 && (
                    <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md bg-amber-400 text-amber-950 border border-amber-500 animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                  {isInventory && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md neu-inset-sm">
                      {inventory.length}
                    </span>
                  )}
                  {isTransactions && activeBorrowedCount > 0 && (
                    <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md bg-cyan-400 text-cyan-950 border border-cyan-500">
                      {activeBorrowedCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Exit Console Footer */}
        <div className="p-3 border-t border-slate-300 dark:border-white/10 space-y-2">
          <div className="px-2.5 py-1 rounded-lg neu-inset-sm flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Custodian Mode</span>
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">READY</span>
          </div>

          <button
            type="button"
            onClick={onLock}
            className="neu-btn-danger w-full min-h-[42px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-95"
            aria-label="Exit Admin Console to Student Kiosk"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Kiosk</span>
          </button>
        </div>
      </aside>
    </>
  );
}
