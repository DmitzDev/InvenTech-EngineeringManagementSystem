import React from 'react';
import {
  Package,
  ArrowUpDown,
  AlertTriangle,
  Activity,
  Building2,
  Cpu,
  FlaskConical,
  Radio,
  Atom,
  Calendar,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { getInventory, LAB_OPTIONS } from '../../data/equipmentData';
import { useTransaction } from '../../context/TransactionContext';
import StatsCard from './StatsCard';

export default function DashboardOverview({ onNavigateTab }) {
  const { activeTransactions, reservations } = useTransaction();
  const inventory = getInventory();

  // Compute metrics
  const totalItems = inventory.length;
  const totalStock = inventory.reduce((sum, i) => sum + i.stock, 0);
  const activeBorrowed = activeTransactions.filter((tx) => tx.status === 'BORROWED');
  const totalBorrowedUnits = activeBorrowed.reduce((sum, tx) => sum + tx.items.reduce((s, it) => s + (it.qty || 1), 0), 0);
  const lowStockItems = inventory.filter((i) => i.stock <= 3);
  const returnedToday = activeTransactions.filter((tx) => tx.status === 'RETURNED_CLEARED');
  const pendingReservations = (reservations || []).filter((r) => (r.status || 'PENDING') === 'PENDING');

  // Lab breakdowns across all 5 labs
  const labsData = [
    {
      id: 'CE',
      name: 'Civil Engineering',
      code: 'CE',
      icon: Building2,
      accent: 'amber',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      bar: 'bg-gradient-to-r from-amber-500 to-amber-400',
      items: inventory.filter((i) => i.lab === 'CE'),
    },
    {
      id: 'DIGITAL',
      name: 'Digital Logic Lab',
      code: 'DIGITAL',
      icon: Cpu,
      accent: 'cyan',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      bar: 'bg-gradient-to-r from-cyan-500 to-cyan-400',
      items: inventory.filter((i) => i.lab === 'DIGITAL'),
    },
    {
      id: 'ECE',
      name: 'ECE & Circuits Lab',
      code: 'ECE',
      icon: Radio,
      accent: 'violet',
      border: 'border-violet-500/30',
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
      bar: 'bg-gradient-to-r from-violet-500 to-violet-400',
      items: inventory.filter((i) => i.lab === 'ECE'),
    },
    {
      id: 'CHEM',
      name: 'Chemistry Laboratory',
      code: 'CHEM',
      icon: FlaskConical,
      accent: 'emerald',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      bar: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
      items: inventory.filter((i) => i.lab === 'CHEM'),
    },
    {
      id: 'PHYSICS',
      name: 'Physics Laboratory',
      code: 'PHYSICS',
      icon: Atom,
      accent: 'blue',
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      bar: 'bg-gradient-to-r from-blue-500 to-blue-400',
      items: inventory.filter((i) => i.lab === 'PHYSICS'),
    },
  ].map((lab) => {
    const stock = lab.items.reduce((s, i) => s + i.stock, 0);
    const percent = totalStock > 0 ? ((stock / totalStock) * 100).toFixed(1) : 0;
    return { ...lab, stock, percent };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 overflow-y-auto h-full max-w-[1600px] mx-auto select-none">
      {/* Page Header */}
      <div className="border-b border-slate-800/80 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
              Command Center
            </span>
            <span className="text-xs text-slate-500 font-medium hidden xs:inline">• Universidad de Dagupan</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">Laboratory Executive Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time equipment overview, department stock health, active borrowings, and advance booking requests
          </p>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('inventory')}
            className="px-3.5 py-2 rounded-xl bg-[#091120] hover:bg-[#0d182d] border border-slate-700/80 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Package className="w-3.5 h-3.5 text-cyan-400" />
            <span>Inventory</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('reservations')}
            className="px-3.5 py-2 rounded-xl bg-[#091120] hover:bg-[#0d182d] border border-slate-700/80 hover:border-amber-500/50 text-xs font-semibold text-slate-200 hover:text-amber-300 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Bookings</span>
          </button>
        </div>
      </div>

      {/* Pending Reservations Alert Banner */}
      {pendingReservations.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#17130a] via-[#1a1c29] to-[#0c1626] border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Calendar className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {pendingReservations.length} Pending Advance Booking{pendingReservations.length > 1 ? 's' : ''}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Students submitted advance apparatus reservations. Review schedules and prepare official clearance slips.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('reservations')}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <span>Review Bookings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          icon={Package}
          label="Total Equipment"
          value={totalItems}
          accent="cyan"
          subtitle={`${totalStock} total units across 5 labs`}
          trend="Master Catalog"
        />
        <StatsCard
          icon={ArrowUpDown}
          label="Active Borrowed"
          value={activeBorrowed.length}
          accent="violet"
          subtitle={`${totalBorrowedUnits} units currently in laboratory`}
          trend={activeBorrowed.length > 0 ? `${activeBorrowed.length} Active Slips` : 'No Active Borrowers'}
        />
        <StatsCard
          icon={Calendar}
          label="Advance Bookings"
          value={reservations.length}
          accent={pendingReservations.length > 0 ? 'amber' : 'cyan'}
          subtitle={`${pendingReservations.length} pending custodian review`}
          trend={pendingReservations.length > 0 ? `${pendingReservations.length} Pending` : 'All Clear'}
        />
        <StatsCard
          icon={Activity}
          label="Cleared / Returned"
          value={returnedToday.length}
          accent="emerald"
          subtitle="Transactions cleared & logged"
          trend="Audited"
        />
      </div>

      {/* 5 Laboratory Department Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Department Laboratory Breakdown (5 Labs)</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {totalStock} Total Storage Units
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {labsData.map((lab) => {
            const Icon = lab.icon;
            return (
              <div
                key={lab.id}
                onClick={() => onNavigateTab && onNavigateTab('inventory')}
                className={`p-4 rounded-2xl bg-[#091120] border ${lab.border} space-y-3 transition-all duration-300 hover:border-slate-500 hover:shadow-lg cursor-pointer group select-none`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-xl ${lab.bg} border ${lab.border} flex items-center justify-center ${lab.text} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-200 truncate group-hover:text-white">
                      {lab.name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold ${lab.text} ${lab.bg} px-2 py-0.5 rounded border ${lab.border} shrink-0`}>
                    {lab.code}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-[#060b14] border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-medium">Apparatus</span>
                    <p className={`text-base font-bold font-mono ${lab.text}`}>{lab.items.length}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#060b14] border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-medium">Stock</span>
                    <p className={`text-base font-bold font-mono ${lab.text}`}>{lab.stock} pcs</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Stock Share</span>
                    <span className="font-bold text-slate-300">{lab.percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${lab.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${lab.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dual Column: Active Borrowings & Low Stock Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Active Borrowings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-violet-400" />
              <span>Live Active Borrowings</span>
            </h2>
            {activeBorrowed.length > 0 && (
              <span className="text-xs font-semibold text-violet-300 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/30">
                {activeBorrowed.length} Outstanding Slip{activeBorrowed.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {activeBorrowed.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#091120] border border-slate-800 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">All Equipment Returned</p>
              <p className="text-xs text-slate-500">No active student borrowing slips at this moment.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeBorrowed.slice(0, 4).map((tx) => (
                <div
                  key={tx.txId}
                  className="p-3.5 sm:p-4 rounded-xl bg-[#091120] border border-slate-800 hover:border-violet-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30">
                        {tx.txId}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                        IN LAB
                      </span>
                      <span className="text-xs text-slate-400">• {tx.items.length} items</span>
                    </div>
                    <p className="text-sm font-bold text-white truncate uppercase">{tx.borrower.groupLeader}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {tx.borrower.program} • {tx.borrower.courseCode} • Group {tx.borrower.groupNo} • {tx.borrower.instructor}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 w-full sm:w-auto">
                    <p className="text-xs font-semibold text-slate-300 font-mono">{tx.borrowedAt}</p>
                  </div>
                </div>
              ))}

              {activeBorrowed.length > 4 && (
                <button
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab('transactions')}
                  className="w-full py-2.5 rounded-xl bg-[#091120] hover:bg-[#0d1627] border border-slate-800 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View all {activeBorrowed.length} active slips in Transaction History</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Low Stock Radar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Low Stock Equipment Radar ({lowStockItems.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('inventory')}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Restock in Inventory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#091120] border border-slate-800 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
              <p className="text-sm font-semibold text-slate-300">Healthy Storage Levels</p>
              <p className="text-xs text-slate-500">All apparatus have adequate stock (more than 3 units).</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockItems.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[#140a10] border border-rose-500/30 flex items-center justify-between gap-3 hover:border-rose-500/50 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-center shrink-0 w-10 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30">
                      <p className="text-base font-bold font-mono text-rose-400">{item.stock}</p>
                      <p className="text-[9px] text-rose-400/80 uppercase font-bold">left</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">
                        <span className="font-mono text-cyan-400">{item.tagCode}</span> • {item.lab} Lab
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase shrink-0">
                    Restock
                  </span>
                </div>
              ))}

              {lowStockItems.length > 4 && (
                <button
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab('inventory')}
                  className="w-full py-2.5 rounded-xl bg-[#091120] hover:bg-[#0d1627] border border-slate-800 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View all {lowStockItems.length} low stock items in Inventory</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
