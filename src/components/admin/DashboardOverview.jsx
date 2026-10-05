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
  Printer,
  LayoutGrid,
  List,
  MapPin,
  ExternalLink,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { getInventory, getItemImage } from '../../data/equipmentData';
import { useTransaction } from '../../context/TransactionContext';
import StatsCard from './StatsCard';

export default function DashboardOverview({ onNavigateTab }) {
  const {
    activeTransactions,
    reservations,
    clearanceHolds,
    returnEquipmentTransaction,
    showToast,
    theme,
  } = useTransaction();
  const isDark = theme === 'dark';

  const inventory = useMemo(() => getInventory(), []);

  // Search & Filter Toolbar States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'OVERDUE' | 'LOCKERS'
  const [subLabFilter, setSubLabFilter] = useState('ALL'); // 'ALL' | 'CE' | 'DIGITAL' | 'ECE' | 'CHEM' | 'PHYSICS'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedSlipModal, setSelectedSlipModal] = useState(null);

  // 1. Primary Metrics Calculation
  const totalStock = useMemo(
    () => inventory.reduce((sum, i) => sum + (Number(i.stock) || 0), 0),
    [inventory]
  );
  const activeBorrowedTxs = useMemo(
    () => (activeTransactions || []).filter((tx) => tx.status === 'BORROWED'),
    [activeTransactions]
  );
  const totalDispatchedUnits = useMemo(
    () =>
      activeBorrowedTxs.reduce(
        (sum, tx) => sum + (tx.items || []).reduce((s, it) => s + (it.qty || 1), 0),
        0
      ),
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

  // 2. Department Breakdown (5 Engineering Labs)
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

  // 3. Filtered Live Data Rows & Items
  const displayRows = useMemo(() => {
    let rows = [];

    if (filterMode === 'LOCKERS') {
      // Storage Lockers & Apparatus Catalog
      let list = inventory;
      if (subLabFilter !== 'ALL') {
        list = list.filter((i) => i.lab === subLabFilter);
      }

      rows = list.map((item) => ({
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
      // Transactions mode (Loans & Borrows)
      rows = (activeTransactions || []).map((tx) => {
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
          binLocation: binLoc.startsWith('BIN') || binLoc.startsWith('LOCKER') ? binLoc : `LOCKER // ${binLoc}`,
          status: tx.status === 'RETURNED_CLEARED' ? 'CLEARED' : (isOverdue ? 'OVERDUE' : 'BORROWED'),
          units: `${(tx.items || []).reduce((s, it) => s + (it.qty || 1), 0)} Units`,
          borrowedAt: tx.borrowedAt || 'Recent Active',
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
  }, [activeTransactions, inventory, filterMode, subLabFilter, searchQuery, overdueTxs]);

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
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-[1720px] mx-auto select-none font-sans">
      {/* 1. Institutional Context Header Bar */}
      <section className="rounded-2xl bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 ring-1 ring-inset ring-white/10 dark:ring-white/5 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-[#0B0F19] px-2.5 py-1 rounded-md border-2 border-slate-300 dark:border-slate-700">
              SYS.PANEL // 01 • OVERVIEW
            </span>
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
              • UNIVERSIDAD DE DAGUPAN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white mt-2 tracking-tight uppercase">
            Laboratory Custodian Management Console
          </h1>
          <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 mt-1">
            Mission-critical telemetry, live student borrowing records, and high-precision apparatus status.
          </p>
        </div>

        {/* Tactical Shortcut Buttons with Borrow Kiosk Micro-Feedback */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('inventory')}
            className="min-h-[48px] px-4 py-2.5 rounded-xl bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-sm font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all duration-150"
          >
            <Package className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Master Inventory</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('reservations')}
            className="min-h-[48px] px-4 py-2.5 rounded-xl bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-sm font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all duration-150"
          >
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Student Bookings</span>
          </button>
        </div>
      </section>

      {/* 2. Primary 4-Card Industrial KPI Grid (Borrow Kiosk Instrument Panels) */}
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
            subtitle={`${totalDispatchedUnits} physical units in laboratories`}
            trend={activeBorrowedTxs.length > 0 ? `${activeBorrowedTxs.length} Dispatched` : 'All Stored'}
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
            subtitle="Damaged apparatus or maintenance bins"
            trend={inRepairItems.length > 0 ? 'Maintenance Flag' : '100% Operational'}
            trendType={inRepairItems.length > 0 ? 'warning' : 'normal'}
          />
        </div>
      </section>

      {/* 3. Senior Custodian Search & Horizontal Swipeable Category Pill Rail */}
      <section
        className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 ring-1 ring-inset ring-white/10 dark:ring-white/5 shadow-sm space-y-4"
        aria-label="Table Search and Filters"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Prominent Search Box (Min 48px Touch Target) */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student ID, apparatus, slip number, or locker bin..."
              className="w-full h-12 min-h-[48px] text-base pl-11 pr-11 border-2 border-slate-200 dark:border-slate-800 rounded-xl placeholder:text-slate-500 bg-slate-50 dark:bg-[#0B0F19] text-slate-950 dark:text-white font-medium focus:outline-none focus:border-slate-900 dark:focus:border-white transition-all shadow-inner"
              aria-label="Search records"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] p-2 rounded-lg text-slate-500 hover:text-slate-950 dark:hover:text-white flex items-center justify-center cursor-pointer active:scale-95"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Mode Switcher: Cards vs Matrix Table */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0B0F19] border-2 border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`min-h-[42px] px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-95 ${
                viewMode === 'grid'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`min-h-[42px] px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-95 ${
                viewMode === 'table'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Matrix Table</span>
            </button>
          </div>
        </div>

        {/* Horizontal Swipeable Category Pill Rail (Borrow Kiosk Parity) */}
        <div className="flex items-center gap-2 overflow-x-auto touch-pan-x overscroll-x-contain pb-1 pt-0.5 no-scrollbar">
          {[
            { id: 'ALL', label: 'All Transactions' },
            { id: 'ACTIVE', label: 'Active Loans' },
            { id: 'OVERDUE', label: 'Overdue Only' },
            { id: 'LOCKERS', label: 'Storage Lockers & Apparatus' },
          ].map((btn) => {
            const isActive = filterMode === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setFilterMode(btn.id)}
                className={`min-h-[48px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider border-2 transition-all duration-150 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap shadow-xs ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                    : 'bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                }`}
                aria-pressed={isActive}
              >
                {btn.label}
              </button>
            );
          })}

          {/* Sub-Lab Filter Chips when viewing Storage Lockers */}
          {filterMode === 'LOCKERS' && (
            <>
              <span className="text-slate-300 dark:text-slate-700 px-1 font-mono">|</span>
              {['ALL', 'CE', 'DIGITAL', 'ECE', 'CHEM', 'PHYSICS'].map((labId) => {
                const isSubActive = subLabFilter === labId;
                return (
                  <button
                    key={labId}
                    type="button"
                    onClick={() => setSubLabFilter(labId)}
                    className={`min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase border transition-all duration-150 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap ${
                      isSubActive
                        ? 'bg-cyan-600 text-white border-cyan-700 dark:bg-cyan-400 dark:text-slate-950 dark:border-cyan-300 font-black'
                        : 'bg-slate-100 dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    {labId === 'ALL' ? 'All Labs' : `${labId} Lab`}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Live Filter Indicator Bar */}
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 pt-2 border-t-2 border-slate-100 dark:border-slate-800/80">
          <span>
            Verified Records: <strong className="text-slate-950 dark:text-white font-mono text-sm">{displayRows.length}</strong> entries
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
          <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            <span>[SYS.DATA // REAL-TIME SYNCED]</span>
          </span>
        </div>
      </section>

      {/* 4. Live Records View: Card Grid (Borrow Kiosk Style) or Data Table Matrix */}
      <section
        className="rounded-2xl bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 ring-1 ring-inset ring-white/10 dark:ring-white/5 shadow-sm overflow-hidden"
        aria-label="Inventory and Transaction Live Records"
      >
        {/* Table/Card Header Title Bar */}
        <div className="p-4 sm:p-5 border-b-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-black text-slate-900 dark:text-white px-2 py-0.5 rounded-md border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827]">
              SYS.LEDGER // 01
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
              {filterMode === 'LOCKERS'
                ? 'Storage Lockers & Master Apparatus Inventory'
                : 'Live Laboratory Borrowing & Clearance Telemetry'}
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 font-mono hidden sm:inline">
            WCAG 2.1 AAA HIGH CONTRAST MATRIX
          </span>
        </div>

        {displayRows.length === 0 ? (
          <div className="p-12 sm:p-16 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600 dark:text-emerald-400" />
            <p className="text-lg font-bold text-slate-950 dark:text-white">No Matching Records Found</p>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              There are currently no active transactions or inventory records matching the search query or active filter.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* ========================================================================= */
          /* CARD GRID VIEW (100% BORROW KIOSK VISUAL PARITY)                          */
          /* ========================================================================= */
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayRows.map((row) => {
              if (row.type === 'STORAGE') {
                // RENDER APPARATUS ITEM CARD (Exact Borrow Kiosk Item Card DNA)
                const item = row.rawItem;
                const itemImg = getItemImage(item);
                const isUnderRepair =
                  item.status === 'Under Maintenance' ||
                  (item.condition && item.condition !== 'Functional' && item.condition !== 'Passed Inspection');

                return (
                  <article
                    key={row.id}
                    className="rounded-2xl bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 ring-1 ring-inset ring-white/10 dark:ring-white/5 p-3.5 flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-150 shadow-xs group"
                  >
                    <div>
                      {/* Hero Image Stage */}
                      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-slate-100 dark:bg-[#060a12] border-2 border-slate-200/80 dark:border-slate-800 flex items-center justify-center">
                        {itemImg ? (
                          <img
                            src={itemImg}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-slate-400 flex flex-col items-center">
                            <ShoppingBag className="w-8 h-8" />
                          </div>
                        )}

                        {/* Live Stock Indicator Capsule */}
                        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/95 backdrop-blur-md border border-white/15 text-white font-mono text-[10px] font-black shadow-md">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isUnderRepair
                                ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                                : item.stock === 0
                                ? 'bg-rose-500'
                                : item.stock <= 3
                                ? 'bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                                : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                            }`}
                          />
                          <span>
                            {isUnderRepair
                              ? 'UNDER REPAIR'
                              : item.stock === 0
                              ? '0 IN STOCK'
                              : `${item.stock} UNITS AVAILABLE`}
                          </span>
                        </div>
                      </div>

                      {/* Header Badges */}
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0B0F19] border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                          [{item.lab}-LAB]
                        </span>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                          {row.binLocation}
                        </span>
                      </div>

                      {/* Nomenclature */}
                      <h3 className="text-base font-bold text-slate-950 dark:text-white leading-snug line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {item.category || 'General Laboratory Apparatus'}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t-2 border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                        ID: #{item.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigateTab && onNavigateTab('inventory')}
                        className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider border-2 border-slate-900 dark:border-white shadow-xs cursor-pointer active:scale-95 transition-all duration-150"
                      >
                        Manage
                      </button>
                    </div>
                  </article>
                );
              }

              // RENDER TELEMETRY TRANSACTION CARD (Active Student Loan Module)
              const tx = row.rawTx;
              const isOverdue = row.status === 'OVERDUE';
              const isCleared = row.status === 'CLEARED';

              return (
                <article
                  key={row.id}
                  className="rounded-2xl bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 ring-1 ring-inset ring-white/10 dark:ring-white/5 p-4 sm:p-5 flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-150 shadow-xs space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Ribbon & Telemetry Tag */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-cyan-300 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0B0F19] border-2 border-slate-200 dark:border-slate-700">
                        [TX.REF // {tx.txId}]
                      </span>

                      {/* Status Ribbon */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider border-2 shrink-0 ${
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
                        <span>{isOverdue ? 'OVERDUE LOAN' : isCleared ? 'CLEARED' : 'ACTIVE LOAN'}</span>
                      </span>
                    </div>

                    {/* Borrower Telemetry Module */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border-2 border-slate-200 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white">
                          {row.studentId}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">
                          {row.binLocation}
                        </span>
                      </div>

                      <p className="text-sm font-black text-slate-950 dark:text-white uppercase leading-tight pt-0.5">
                        {row.leaderName}
                      </p>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {row.secondaryInfo}
                      </p>
                    </div>

                    {/* Borrowed Items Telemetry List */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                        Borrowed Apparatus ({tx.items?.length || 0}):
                      </span>
                      <div className="space-y-1">
                        {(tx.items || []).slice(0, 3).map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs font-bold"
                          >
                            <span className="truncate text-slate-950 dark:text-white pr-2">
                              {item.name}
                            </span>
                            <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shrink-0">
                              x{item.qty || 1}
                            </span>
                          </div>
                        ))}
                        {(tx.items || []).length > 3 && (
                          <p className="text-[11px] font-mono font-bold text-slate-500 text-center pt-0.5">
                            +{(tx.items || []).length - 3} more items on slip
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 48px Tactile 1-Click Action Buttons */}
                  <div className="pt-3 border-t-2 border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                    {tx.status !== 'RETURNED_CLEARED' && (
                      <button
                        type="button"
                        onClick={() => handleQuickReturn(tx)}
                        className="flex-1 min-h-[48px] px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-1.5 border-2 border-emerald-700 shadow-sm cursor-pointer active:scale-95 transition-all duration-150"
                        title="Mark equipment returned and clear borrower"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Returned</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedSlipModal(tx)}
                      className="flex-1 min-h-[48px] px-3.5 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-950 dark:text-white font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all duration-150"
                      title="Inspect official loan record slip"
                    >
                      <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span>View Slip</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* ========================================================================= */
          /* HIGH-DENSITY DATA TABLE MATRIX                                            */
          /* ========================================================================= */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <caption className="sr-only">Live inventory and transaction records table</caption>
              <thead>
                <tr className="sticky top-0 bg-slate-100 dark:bg-[#0B0F19] text-slate-950 dark:text-white py-3.5 px-4 text-xs font-black tracking-wider uppercase border-b-2 border-slate-200 dark:border-slate-800">
                  <th scope="col" className="py-3.5 px-4">TRACKING / SLIP ID</th>
                  <th scope="col" className="py-3.5 px-4">TOOL / APPARATUS NAME</th>
                  <th scope="col" className="py-3.5 px-4">STUDENT ID & BORROWER</th>
                  <th scope="col" className="py-3.5 px-4">LOCKER / BIN</th>
                  <th scope="col" className="py-3.5 px-4">STATUS</th>
                  <th scope="col" className="py-3.5 px-4 text-right">DIRECT ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-800/80">
                {displayRows.map((row) => {
                  const isOverdue = row.status === 'OVERDUE';
                  const isCleared = row.status === 'CLEARED';

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* ID / Slip */}
                      <td className="py-4 px-4 font-mono text-sm font-bold text-slate-950 dark:text-cyan-300 whitespace-nowrap">
                        {row.id}
                        {row.borrowedAt && (
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                            {row.borrowedAt}
                          </div>
                        )}
                      </td>

                      {/* Primary Tool Name */}
                      <td className="py-4 px-4">
                        <p className="text-base font-bold text-slate-950 dark:text-white leading-snug">
                          {row.primaryName}
                        </p>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                          {row.secondaryInfo}
                        </p>
                      </td>

                      {/* Student ID & Borrower */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-sm font-black text-slate-950 dark:text-white px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0B0F19] border-2 border-slate-200 dark:border-slate-700">
                            {row.studentId}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 uppercase">
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
                        <span className="font-mono text-xs sm:text-sm font-black px-2.5 py-1 rounded-md border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-[#0B0F19] text-slate-950 dark:text-yellow-400">
                          {row.binLocation}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider border-2 ${
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

                      {/* Direct 48px Action Buttons */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {row.rawTx && row.status !== 'CLEARED' && (
                            <button
                              type="button"
                              onClick={() => handleQuickReturn(row.rawTx)}
                              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center gap-1.5 border-2 border-emerald-700 shadow-xs cursor-pointer active:scale-95 transition-all duration-150"
                              title="Clear and return equipment"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>Mark Returned</span>
                            </button>
                          )}

                          {row.rawTx && (
                            <button
                              type="button"
                              onClick={() => setSelectedSlipModal(row.rawTx)}
                              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-950 dark:text-white font-bold uppercase tracking-wider text-xs sm:text-sm border-2 border-slate-200 dark:border-slate-800 flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all duration-150"
                              title="Inspect official slip"
                            >
                              <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                              <span>View Slip</span>
                            </button>
                          )}

                          {row.type === 'STORAGE' && (
                            <button
                              type="button"
                              onClick={() => onNavigateTab && onNavigateTab('inventory')}
                              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-950 dark:text-white font-bold uppercase tracking-wider text-xs sm:text-sm border-2 border-slate-200 dark:border-slate-800 flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all duration-150"
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
        )}
      </section>

      {/* 5. Department Laboratory Breakdown (5 Labs - Borrow Kiosk Instrument Cards) */}
      <section aria-label="Department Laboratories Overview" className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span>Department Laboratory Storage Status (5 Labs)</span>
          </h2>
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            {totalStock} Total Catalog Units
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {labsData.map((lab) => {
            const Icon = lab.icon;
            return (
              <div
                key={lab.id}
                onClick={() => onNavigateTab && onNavigateTab('inventory')}
                className="p-4 rounded-2xl bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 ring-1 ring-inset ring-white/10 dark:ring-white/5 space-y-3 shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-150 cursor-pointer group select-none active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#0B0F19] border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-950 dark:text-white truncate">
                      {lab.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 border-2 border-slate-200 dark:border-slate-700">
                    {lab.code}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border-2 border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-semibold">Types</span>
                    <p className="text-base font-black font-mono text-slate-950 dark:text-white">{lab.items.length}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border-2 border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-semibold">Stock</span>
                    <p className="text-base font-black font-mono text-slate-950 dark:text-white">{lab.stock} pcs</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 font-mono font-bold">
                    <span>Stock Ratio</span>
                    <span>{lab.percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div
                      className="h-full bg-slate-900 dark:bg-white rounded-full"
                      style={{ width: `${lab.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Inspection Slip Modal (Borrow Kiosk Mechanical Parity) */}
      {selectedSlipModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="slip-modal-title"
        >
          <div className="w-full max-w-2xl bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 ring-1 ring-inset ring-white/10 dark:ring-white/5 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-black text-cyan-800 dark:text-cyan-300">
                  OFFICIAL LABORATORY CLEARANCE SLIP
                </span>
                <h3 id="slip-modal-title" className="text-lg font-black text-slate-950 dark:text-white mt-0.5">
                  {selectedSlipModal.txId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlipModal(null)}
                className="min-h-[44px] min-w-[44px] p-2 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer active:scale-95 transition-all duration-150"
                aria-label="Close transaction slip details"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
              {/* Borrower Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border-2 border-slate-200 dark:border-slate-800">
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
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-950 dark:text-white mb-2">
                  Borrowed Apparatus & Components ({selectedSlipModal.items?.length || 0})
                </h4>
                <div className="border-2 border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y-2 divide-slate-100 dark:divide-slate-800/80">
                  {(selectedSlipModal.items || []).map((item, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-[#111827] flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-950 dark:text-white text-sm">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                          {item.tagCode} • Location: {item.location || 'Bin B-01'}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-black px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#0B0F19] border-2 border-slate-200 dark:border-slate-700">
                        x{item.qty || 1} {item.unit || 'pc'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custodian Clearance Notes */}
              {selectedSlipModal.custodianNotes && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 text-xs">
                  <strong>Custodian Remarks:</strong> {selectedSlipModal.custodianNotes}
                </div>
              )}
            </div>

            {/* Modal Actions (48px Touch Targets) */}
            <div className="p-4 border-t-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all duration-150"
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
                    className="min-h-[48px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center gap-1.5 border-2 border-emerald-700 shadow-sm cursor-pointer active:scale-95 transition-all duration-150"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Confirm Full Return</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedSlipModal(null)}
                  className="min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-white font-bold uppercase tracking-wider text-xs sm:text-sm cursor-pointer active:scale-95 transition-all duration-150"
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
