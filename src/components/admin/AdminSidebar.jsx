import React from 'react';
import { LayoutDashboard, Package, ScrollText, Calendar, Lock, X, ChevronRight, Shield, FileSpreadsheet } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import { getInventory } from '../../data/equipmentData';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview & Metrics' },
  { id: 'inventory', label: 'Equipment Inventory', icon: Package, desc: '335 Master Items' },
  { id: 'reservations', label: 'Advance Bookings', icon: Calendar, desc: 'Student Requests' },
  { id: 'transactions', label: 'Transaction History', icon: ScrollText, desc: 'Audit & Clearances' },
  { id: 'reports', label: 'Audit Reports & Logs', icon: FileSpreadsheet, desc: 'CHED / PACUCOA Data' },
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
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-[#080e1a] border-r border-slate-800/80 flex flex-col h-full shrink-0 transition-transform duration-300 ease-in-out select-none shadow-2xl md:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header / Brand */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-[#060b14]/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#091120] border border-cyan-500/30 flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <img src="/images/udd_logo.png" alt="UdD" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white tracking-tight">Lab Custodian</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400 font-medium">School of Engineering</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-[#0d1627] border border-slate-800 cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Control Navigation
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
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer relative group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1.5 bg-cyan-400 rounded-r shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}

                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-[#0d1627] text-slate-400 group-hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className={`text-xs sm:text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                  </div>
                </div>

                {/* Counter Badges */}
                <div className="shrink-0 pl-1">
                  {isReservation && pendingCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/25 border border-amber-500/50 text-amber-300 animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                  {isInventory && (
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                      {inventory.length}
                    </span>
                  )}
                  {isTransactions && activeBorrowedCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {activeBorrowedCount} In Lab
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Lock Session & Security Footer */}
        <div className="p-3.5 border-t border-slate-800/80 bg-[#060b14]/70 space-y-2">
          <div className="px-2 py-1.5 rounded-xl bg-[#091120] border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Session Secure</span>
            </span>
            <span className="font-mono text-[10px] text-emerald-400">ACTIVE</span>
          </div>

          <button
            type="button"
            onClick={handleLock}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 border border-rose-500/30 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <Lock className="w-4 h-4" />
            <span>Lock Admin Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
