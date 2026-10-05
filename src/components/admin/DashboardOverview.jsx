import React, { useState, useMemo } from 'react';
import {
  Package,
  ArrowUpDown,
  AlertTriangle,
  Building2,
  Cpu,
  FlaskConical,
  Radio,
  Atom,
  Calendar,
  CheckCircle2,
  Search,
  Check,
  FileText,
  Clock,
  Layers,
  Wrench,
  ShieldAlert,
  ChevronRight,
  X,
  User,
  Printer
} from 'lucide-react';
import { getInventory } from '../../data/equipmentData';
import { useTransaction } from '../../context/TransactionContext';
import StatsCard from './StatsCard';

export default function DashboardOverview({ onNavigateTab }) {
  const { activeTransactions, reservations, clearanceHolds, returnEquipmentTransaction, showToast } = useTransaction();
  const inventory = getInventory();

  // Search & Filter Toolbar States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'OVERDUE' | 'LOCKERS'
  const [selectedSlipModal, setSelectedSlipModal] = useState(null);

  // 1. Primary Metrics Calculation
  const totalStock = useMemo(() => inventory.reduce((sum, i) => sum + (Number(i.stock) || 0), 0), [inventory]);
  const activeBorrowedTxs = useMemo(
    () => activeTransactions.filter((tx) => tx.status === 'BORROWED'),
    [activeTransactions]
  );
  const totalDispatchedUnits = useMemo(
    () => activeBorrowedTxs.reduce((sum, tx) => sum + (tx.items || []).reduce((s, it) => s + (it.qty || 1), 0), 0),
    [activeBorrowedTxs]
  );

  // Overdue calculation
  const overdueTxs = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return activeBorrowedTxs.filter((tx) => {
      if (tx.isOverdue) return true;
      if (tx.borrower && tx.borrower.date && tx.borrower.date < today) return true;
      return false;
    });
  }, [activeBorrowedTxs]);

  const totalOverdueAlerts = overdueTxs.length + (clearanceHolds ? clearanceHolds.length : 0);

  // Compartments / items in repair or maintenance
  const inRepairItems = useMemo(
    () => inventory.filter((i) => i.isDamaged || i.damageNote || i.status === 'MAINTENANCE'),
    [inventory]
  );

  // 2. Department Breakdown
  const labsData = useMemo(() => {
    return [
      { id: 'CE', name: 'Civil Engineering', code: 'CE', icon: Building2, items: inventory.filter((i) => i.lab === 'CE') },
      { id: 'DIGITAL', name: 'Digital Logic Lab', code: 'DIGITAL', icon: Cpu, items: inventory.filter((i) => i.lab === 'DIGITAL') },
      { id: 'ECE', name: 'ECE & Circuits Lab', code: 'ECE', icon: Radio, items: inventory.filter((i) => i.lab === 'ECE') },
      { id: 'CHEM', name: 'Chemistry Laboratory', code: 'CHEM', icon: FlaskConical, items: inventory.filter((i) => i.lab === 'CHEM') },
      { id: 'PHYSICS', name: 'Physics Laboratory', code: 'PHYSICS', icon: Atom, items: inventory.filter((i) => i.lab === 'PHYSICS') },
    ].map((lab) => {
      const stock = lab.items.reduce((s, i) => s + (Number(i.stock) || 0), 0);
      const percent = totalStock > 0 ? ((stock / totalStock) * 100).toFixed(1) : 0;
      return { ...lab, stock, percent };
    });
  }, [inventory, totalStock]);

  // 3. Filtered Live Data Rows (Combines Transactions & Storage Lockers)
  const displayRows = useMemo(() => {
    let rows = [];

    if (filterMode === 'LOCKERS') {
      // Show equipment locker bins
      rows = inventory.map((item) => ({
        id: `INV-${item.id}`,
        type: 'STORAGE',
        primaryName: item.name,
        secondaryInfo: `Category: ${item.category || 'General Apparatus'}`,
        studentId: 'IN-STOCK CUSTODIAN',
        department: `${item.lab} LAB`,
        binLocation: item.location || `BIN [${item.lab}-${String(item.id).slice(-2).padStart(2, '0')}]`,
        status: item.stock > 0 ? (item.stock <= 3 ? 'LOW_STOCK' : 'AVAILABLE') : 'DEPLETED',
        units: `${item.stock} in locker`,
        rawItem: item,
      }));
    } else {
      // Default / Transactions mode
      rows = activeTransactions.map((tx) => {
        const isOverdue = overdueTxs.some((o) => o.txId === tx.txId);
        const firstItem = (tx.items && tx.items[0]) ? tx.items[0].name : 'Laboratory Equipment';
        const moreCount = tx.items && tx.items.length > 1 ? ` +${tx.items.length - 1} more` : '';
        const binLoc = (tx.items && tx.items[0] && tx.items[0].location) ? tx.items[0].location : 'LAB DESK // 01';

        return {
          id: tx.txId,
          type: 'TRANSACTION',
          primaryName: `${firstItem}${moreCount}`,
          secondaryInfo: `${tx.borrower?.program || 'ENG'} • Group ${tx.borrower?.groupNo || '1'} • ${tx.borrower?.instructor || 'Instructor Pending'}`,
          studentId: tx.borrower?.studentId || 'NO-ID',
          leaderName: tx.borrower?.groupLeader || 'Borrower Pending',
          department: tx.borrower?.courseCode || 'ENG-LAB',
          binLocation: binLoc.startsWith('BIN') ? binLoc : `BIN [${binLoc}]`,
          status: tx.status === 'RETURNED_CLEARED' ? 'CLEARED' : (isOverdue ? 'OVERDUE' : 'BORROWED'),
          units: `${(tx.items || []).reduce((s, it) => s + (it.qty || 1), 0)} Units`,
          borrowedAt: tx.borrowedAt || 'Recent',
          rawTx: tx,
        };
      });

      if (filterMode === 'ACTIVE') {
        rows = rows.filter((r) => r.status === 'BORROWED');
      } else if (filterMode === 'OVERDUE') {
        rows = rows.filter((r) => r.status === 'OVERDUE');
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.primaryName.toLowerCase().includes(q) ||
          r.studentId.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.binLocation.toLowerCase().includes(q) ||
          r.secondaryInfo.toLowerCase().includes(q)
      );
    }

    return rows;
  }, [activeTransactions, inventory, filterMode, searchQuery, overdueTxs]);

  // 1-Click Direct Return Handler
  const handleQuickReturn = (tx) => {
    if (!tx) return;
    const returnedItems = (tx.items || []).map((it) => ({
      ...it,
      returnCondition: 'good',
    }));
    returnEquipmentTransaction({
      txId: tx.txId,
      returnedItems,
      custodianNotes: 'Quick Cleared by Custodian via Admin Console',
    });
    if (showToast) {
      showToast(`Transaction ${tx.txId} marked returned and cleared!`, 'success');
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-[1680px] mx-auto select-none font-sans">
      {/* 1. Header Bar with Institutional Context */}
      <section className="border-b-2 border-slate-300 dark:border-slate-700 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black text-cyan-900 dark:text-cyan-200 bg-cyan-100 dark:bg-cyan-950 px-2.5 py-1 rounded border-2 border-cyan-500">
              SYS.PANEL // 01 • OVERVIEW
            </span>
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
              • UNIVERSIDAD DE DAGUPAN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white mt-2 tracking-tight">
            Laboratory Custodian Management Console
          </h1>
          <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 mt-1">
            Mission-critical equipment telemetry, live student borrowing records, and storage locker verification.
          </p>
        </div>

        {/* Quick Nav Shortcuts */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('inventory')}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 hover:border-cyan-600 text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Package className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Master Inventory</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('reservations')}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 hover:border-amber-600 text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Student Bookings</span>
          </button>
        </div>
      </section>

      {/* 2. Primary 4-Card Industrial KPI Grid (Strict Specifications) */}
      <section aria-label="Key Laboratory Telemetry Metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard
            icon={Package}
            sysTag="[SYS.METRIC // 01]"
            label="Total Inventory Units"
            value={totalStock.toLocaleString()}
            accent="cyan"
            subtitle={`${inventory.length} cataloged apparatus types`}
            trend="Active Master"
            trendType="normal"
          />
          <StatsCard
            icon={ArrowUpDown}
            sysTag="[SYS.METRIC // 02]"
            label="Active Dispatched Loans"
            value={activeBorrowedTxs.length}
            accent="violet"
            subtitle={`${totalDispatchedUnits} physical units currently in labs`}
            trend={activeBorrowedTxs.length > 0 ? `${activeBorrowedTxs.length} In-Use Slips` : 'All Stored'}
            trendType={activeBorrowedTxs.length > 0 ? 'warning' : 'normal'}
          />
          <StatsCard
            icon={AlertTriangle}
            sysTag="[SYS.ALERT // 03]"
            label="Critical Overdue Alerts"
            value={totalOverdueAlerts}
            accent="rose"
            subtitle={totalOverdueAlerts > 0 ? 'Requires immediate student follow-up' : 'All loans within authorized window'}
            trend={totalOverdueAlerts > 0 ? `${totalOverdueAlerts} Overdue` : 'Zero Overdue'}
            trendType={totalOverdueAlerts > 0 ? 'critical' : 'normal'}
          />
          <StatsCard
            icon={Wrench}
            sysTag="[SYS.STATUS // 04]"
            label="Compartments In Repair"
            value={inRepairItems.length}
            accent="amber"
            subtitle="Damaged apparatus or offline bins"
            trend={inRepairItems.length > 0 ? 'Maintenance Flag' : '100% Operational'}
            trendType={inRepairItems.length > 0 ? 'warning' : 'normal'}
          />
        </div>
      </section>

      {/* 3. Senior Custodian Search & Filter Toolbar (Specification 5) */}
      <section
        className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-sm space-y-4"
        aria-label="Table Search and Filters"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Prominent Large Search Box */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student ID, apparatus, slip number, or bin location..."
              className="w-full h-12 text-base pl-11 pr-4 border-2 border-slate-400 dark:border-slate-600 rounded-lg placeholder:text-slate-500 bg-white dark:bg-slate-900 text-slate-950 dark:text-white font-medium focus:outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
              aria-label="Search records"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Large Filter Pills (minimum 44px height) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mr-1">
              [FILTER]:
            </span>
            {[
              { id: 'ALL', label: 'Show All' },
              { id: 'ACTIVE', label: 'Active Loans' },
              { id: 'OVERDUE', label: 'Overdue Only' },
              { id: 'LOCKERS', label: 'Storage Lockers' },
            ].map((btn) => {
              const isActive = filterMode === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setFilterMode(btn.id)}
                  className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-cyan-500 dark:text-slate-950 dark:border-cyan-400 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                  aria-pressed={isActive}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Filter Indicator Bar */}
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800">
          <span>
            Showing <strong className="text-slate-950 dark:text-white">{displayRows.length}</strong> verified entries
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
          <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400">
            [SYS.DATA // REAL-TIME SYNCED]
          </span>
        </div>
      </section>

      {/* 4. Senior-Friendly Data Table (Desktop) & Cards (Mobile Fallback) */}
      <section
        className="rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden"
        aria-label="Inventory and Transaction Live Records"
      >
        {/* Table Title Bar */}
        <div className="p-4 sm:p-5 border-b-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-black text-slate-900 dark:text-white px-2 py-0.5 rounded border border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800">
              SYS.TBL // 01
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white">
              {filterMode === 'LOCKERS' ? 'Storage Lockers & Master Inventory' : 'Live Laboratory Borrowing & Clearance Ledger'}
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 font-mono hidden sm:inline">
            WCAG 2.1 AAA HIGH CONTRAST MATRIX
          </span>
        </div>

        {displayRows.length === 0 ? (
          <div className="p-10 sm:p-14 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600 dark:text-emerald-400" />
            <p className="text-lg font-bold text-slate-950 dark:text-white">No Matching Records Found</p>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              There are currently no transaction or inventory records matching the selected search query and filter criteria.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (≥ 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <caption className="sr-only">Live inventory and transaction records table</caption>
                <thead>
                  <tr className="sticky top-0 bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-white py-3.5 px-4 text-sm font-black tracking-wider border-b-2 border-slate-300 dark:border-slate-700">
                    <th scope="col" className="py-3.5 px-4 font-black">TRACKING / SLIP ID</th>
                    <th scope="col" className="py-3.5 px-4 font-black">TOOL / APPARATUS NAME</th>
                    <th scope="col" className="py-3.5 px-4 font-black">STUDENT ID & BORROWER</th>
                    <th scope="col" className="py-3.5 px-4 font-black">LOCKER / BIN</th>
                    <th scope="col" className="py-3.5 px-4 font-black">STATUS</th>
                    <th scope="col" className="py-3.5 px-4 font-black text-right">DIRECT ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-300 dark:divide-slate-700">
                  {displayRows.map((row) => {
                    const isOverdue = row.status === 'OVERDUE';
                    const isCleared = row.status === 'CLEARED';

                    return (
                      <tr
                        key={row.id}
                        className="border-b border-slate-300 dark:border-slate-700 hover:bg-blue-50/70 dark:hover:bg-slate-800/80 transition-colors"
                      >
                        {/* ID / Slip */}
                        <td className="py-4 px-4 font-mono text-sm font-bold text-slate-950 dark:text-cyan-300 whitespace-nowrap">
                          {row.id}
                          {row.borrowedAt && (
                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-400 mt-0.5">
                              {row.borrowedAt}
                            </div>
                          )}
                        </td>

                        {/* Primary Tool Name */}
                        <td className="py-4 px-4">
                          <p className="text-base font-bold text-slate-950 dark:text-white leading-snug">
                            {row.primaryName}
                          </p>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                            {row.secondaryInfo}
                          </p>
                        </td>

                        {/* Student ID & Borrower */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-sm font-black text-slate-950 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-400 dark:border-slate-600">
                              {row.studentId}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-600 uppercase">
                              {row.department}
                            </span>
                          </div>
                          {row.leaderName && (
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 uppercase">
                              Leader: {row.leaderName}
                            </p>
                          )}
                        </td>

                        {/* Locker / Bin Indicator */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs sm:text-sm font-black px-2.5 py-1 rounded-md border-2 border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-yellow-400">
                            {row.binLocation}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black border-2 ${
                              isOverdue
                                ? 'bg-rose-100 text-rose-950 border-rose-600 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-500 animate-pulse'
                                : isCleared
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-600 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-500'
                                : 'bg-cyan-100 text-cyan-950 border-cyan-600 dark:bg-cyan-950 dark:text-cyan-200 dark:border-cyan-500'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isOverdue ? 'bg-rose-600' : isCleared ? 'bg-emerald-600' : 'bg-cyan-600'
                              }`}
                            />
                            <span>{row.status}</span>
                          </span>
                        </td>

                        {/* Direct 1-Click Action Buttons */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            {row.rawTx && row.status !== 'CLEARED' && (
                              <button
                                type="button"
                                onClick={() => handleQuickReturn(row.rawTx)}
                                className="min-h-[44px] px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 border-2 border-emerald-700 shadow-xs cursor-pointer active:scale-95"
                                title="Instantly clear and return this equipment"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>Mark Returned</span>
                              </button>
                            )}

                            {row.rawTx && (
                              <button
                                type="button"
                                onClick={() => setSelectedSlipModal(row.rawTx)}
                                className="min-h-[44px] px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-950 dark:text-white font-bold text-xs sm:text-sm border-2 border-slate-400 dark:border-slate-600 flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                                title="Inspect official transaction slip"
                              >
                                <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                <span>View Slip</span>
                              </button>
                            )}

                            {row.type === 'STORAGE' && (
                              <button
                                type="button"
                                onClick={() => onNavigateTab && onNavigateTab('inventory')}
                                className="min-h-[44px] px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-950 dark:text-white font-bold text-xs sm:text-sm border-2 border-slate-400 dark:border-slate-600 flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                              >
                                <Package className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                <span>Manage Item</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Responsive Summary Cards (< 768px Roaming Custodian Flow) */}
            <div className="md:hidden divide-y-2 divide-slate-300 dark:divide-slate-700 p-3 space-y-3">
              {displayRows.map((row) => {
                const isOverdue = row.status === 'OVERDUE';
                const isCleared = row.status === 'CLEARED';

                return (
                  <article
                    key={row.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-cyan-300">
                          {row.id}
                        </span>
                        <h3 className="text-base font-bold text-slate-950 dark:text-white leading-snug mt-0.5">
                          {row.primaryName}
                        </h3>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {row.secondaryInfo}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-black border-2 shrink-0 ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-950 border-rose-600 dark:bg-rose-950 dark:text-rose-200'
                            : isCleared
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-600 dark:bg-emerald-950 dark:text-emerald-200'
                            : 'bg-cyan-100 text-cyan-950 border-cyan-600 dark:bg-cyan-950 dark:text-cyan-200'
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-1 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-slate-600 dark:text-slate-400 block text-[11px]">STUDENT ID:</span>
                        <span className="font-mono font-bold text-slate-950 dark:text-white">{row.studentId}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400 block text-[11px]">LOCATION:</span>
                        <span className="font-mono font-bold text-slate-950 dark:text-yellow-400">{row.binLocation}</span>
                      </div>
                    </div>

                    {/* Mobile Direct Action Buttons (Min 44px tap area) */}
                    <div className="pt-2 flex items-center gap-2">
                      {row.rawTx && row.status !== 'CLEARED' && (
                        <button
                          type="button"
                          onClick={() => handleQuickReturn(row.rawTx)}
                          className="flex-1 min-h-[44px] px-3 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 border-2 border-emerald-700 active:scale-95"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Mark Returned</span>
                        </button>
                      )}

                      {row.rawTx && (
                        <button
                          type="button"
                          onClick={() => setSelectedSlipModal(row.rawTx)}
                          className="flex-1 min-h-[44px] px-3 py-2 rounded-lg bg-white dark:bg-slate-700 text-slate-950 dark:text-white font-bold text-xs border-2 border-slate-400 dark:border-slate-600 flex items-center justify-center gap-1 active:scale-95"
                        >
                          <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                          <span>View Slip</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* 5. Laboratory Department Breakdown (5 Labs - High Contrast Cards) */}
      <section aria-label="Department Laboratories Overview" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span>Department Laboratory Storage Status (5 Labs)</span>
          </h2>
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            {totalStock} Total Catalog Units
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {labsData.map((lab) => {
            const Icon = lab.icon;
            return (
              <div
                key={lab.id}
                onClick={() => onNavigateTab && onNavigateTab('inventory')}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 space-y-3 shadow-xs hover:border-slate-500 transition-all cursor-pointer group select-none"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-950 dark:text-white truncate">
                      {lab.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-400 dark:border-slate-600">
                    {lab.code}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 block font-semibold">Types</span>
                    <p className="text-base font-black font-mono text-slate-950 dark:text-white">{lab.items.length}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 block font-semibold">Stock</span>
                    <p className="text-base font-black font-mono text-slate-950 dark:text-white">{lab.stock} pcs</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 font-mono font-bold">
                    <span>Stock Ratio</span>
                    <span>{lab.percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-600 dark:bg-cyan-400 rounded-full"
                      style={{ width: `${lab.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Senior-Friendly Transaction Slip Inspection Modal */}
      {selectedSlipModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="slip-modal-title"
        >
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-2 border-slate-400 dark:border-slate-600 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-cyan-300">
                  OFFICIAL LABORATORY CLEARANCE SLIP
                </span>
                <h3 id="slip-modal-title" className="text-lg font-black text-slate-950 dark:text-white mt-0.5">
                  {selectedSlipModal.txId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlipModal(null)}
                className="min-h-[44px] min-w-[44px] p-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
                aria-label="Close transaction slip details"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
              {/* Borrower Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700">
                <div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 block font-bold">STUDENT ID:</span>
                  <span className="font-mono text-base font-black text-slate-950 dark:text-white">
                    {selectedSlipModal.borrower?.studentId || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 block font-bold">GROUP LEADER:</span>
                  <span className="text-base font-black text-slate-950 dark:text-white uppercase">
                    {selectedSlipModal.borrower?.groupLeader || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 block font-bold">PROGRAM & COURSE:</span>
                  <span className="text-sm font-bold text-slate-950 dark:text-white">
                    {selectedSlipModal.borrower?.program} • {selectedSlipModal.borrower?.courseCode}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 block font-bold">INSTRUCTOR & GROUP:</span>
                  <span className="text-sm font-bold text-slate-950 dark:text-white">
                    {selectedSlipModal.borrower?.instructor} • Group {selectedSlipModal.borrower?.groupNo}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-bold text-sm text-slate-950 dark:text-white uppercase mb-2">
                  Borrowed Apparatus & Components ({selectedSlipModal.items?.length || 0})
                </h4>
                <div className="border-2 border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-300 dark:divide-slate-700">
                  {(selectedSlipModal.items || []).map((item, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-950 dark:text-white text-sm">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                          {item.tagCode} • Location: {item.location || 'Bin B-01'}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-black px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
                        x{item.qty || 1} {item.unit || 'pc'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custodian Clearance Notes */}
              {selectedSlipModal.custodianNotes && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-200 text-xs">
                  <strong>Custodian Remarks:</strong> {selectedSlipModal.custodianNotes}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border-2 border-slate-400 dark:border-slate-600 text-slate-950 dark:text-white font-bold text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Slip</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedSlipModal.status !== 'RETURNED_CLEARED' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickReturn(selectedSlipModal);
                      setSelectedSlipModal(null);
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-1.5 border-2 border-emerald-700 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Confirm Full Return</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedSlipModal(null)}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-slate-300 dark:bg-slate-700 text-slate-950 dark:text-white font-bold text-sm cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
