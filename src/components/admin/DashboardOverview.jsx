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
  ShoppingBag,
  RotateCcw
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

  // Items in repair
  const inRepairItems = useMemo(
    () => inventory.filter((i) => i.isDamaged || i.damageNote || i.status === 'MAINTENANCE'),
    [inventory]
  );

  // 2. Department Breakdown (The 4 iconic lab colors from Kiosk borrow section)
  const labsData = useMemo(() => {
    return [
      { id: 'CE', name: 'Civil Engineering', code: 'CE', icon: Building2, color: 'amber', items: inventory.filter((i) => i.lab === 'CE') },
      { id: 'DIGITAL', name: 'Digital Logic', code: 'DIGITAL', icon: Cpu, color: 'cyan', items: inventory.filter((i) => i.lab === 'DIGITAL') },
      { id: 'ECE', name: 'ECE & Circuits', code: 'ECE', icon: Radio, color: 'indigo', items: inventory.filter((i) => i.lab === 'ECE') },
      { id: 'CHEM', name: 'Chemistry Lab', code: 'CHEM', icon: FlaskConical, color: 'emerald', items: inventory.filter((i) => i.lab === 'CHEM') },
      { id: 'PHYSICS', name: 'Physics Lab', code: 'PHYSICS', icon: Atom, color: 'slate', items: inventory.filter((i) => i.lab === 'PHYSICS') },
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
      let list = inventory;
      if (subLabFilter !== 'ALL') {
        list = list.filter((i) => i.lab === subLabFilter);
      }

      rows = list.map((item) => ({
        id: `INV-${item.id}`,
        type: 'STORAGE',
        primaryName: item.name,
        secondaryInfo: item.category || 'General Apparatus',
        studentId: 'IN-STOCK',
        department: `${item.lab} LAB`,
        binLocation: item.location || `BIN [${item.lab}-${String(item.id).slice(-2).padStart(2, '0')}]`,
        status: item.stock > 0 ? (item.stock <= 3 ? 'LOW_STOCK' : 'AVAILABLE') : 'DEPLETED',
        units: `${item.stock} in locker`,
        rawItem: item,
      }));
    } else {
      rows = (activeTransactions || []).map((tx) => {
        const isOverdue = overdueTxs.some((o) => o.txId === tx.txId);
        const firstItem = (tx.items && tx.items[0]) ? tx.items[0].name : 'Equipment';
        const moreCount = tx.items && tx.items.length > 1 ? ` +${tx.items.length - 1} more` : '';
        const binLoc = (tx.items && tx.items[0] && tx.items[0].location) ? tx.items[0].location : 'DESK-01';

        return {
          id: tx.txId,
          type: 'TRANSACTION',
          primaryName: `${firstItem}${moreCount}`,
          secondaryInfo: `${tx.borrower?.program || 'ENG'} • Group ${tx.borrower?.groupNo || '1'}`,
          studentId: tx.borrower?.studentId || 'NO-ID',
          leaderName: tx.borrower?.groupLeader || 'Student Borrower',
          department: tx.borrower?.courseCode || 'ENG-LAB',
          binLocation: binLoc.startsWith('BIN') || binLoc.startsWith('LOCKER') ? binLoc : `BIN [${binLoc}]`,
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
    <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 max-w-[1720px] mx-auto select-none font-sans">
      {/* 1. Sleek Compact Command Bar */}
      <section className="neu-card p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Laboratory Telemetry & Borrowing Console
          </h1>
        </div>

        {/* Quick Nav Shortcuts */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('inventory')}
            className="neu-btn-raised min-h-[36px] sm:min-h-[40px] px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Package className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Inventory</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('reservations')}
            className="neu-btn-raised min-h-[36px] sm:min-h-[40px] px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Bookings</span>
          </button>
        </div>
      </section>

      {/* 2. Primary 4-Card Industrial KPI Grid (The 4 iconic colors: Cyan, Indigo, Amber, Emerald) */}
      <section aria-label="Key Laboratory Telemetry Metrics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
          <StatsCard
            icon={Package}
            label="Total Inventory"
            value={totalStock.toLocaleString()}
            accent="cyan"
            subtitle={`${inventory.length} apparatus types`}
            trend="Active Master"
            trendType="normal"
          />
          <StatsCard
            icon={ArrowUpDown}
            label="Dispatched Loans"
            value={activeBorrowedTxs.length}
            accent="violet"
            subtitle={`${totalDispatchedUnits} units dispatched`}
            trend={activeBorrowedTxs.length > 0 ? `${activeBorrowedTxs.length} In-Use` : 'All Stored'}
            trendType={activeBorrowedTxs.length > 0 ? 'warning' : 'normal'}
          />
          <StatsCard
            icon={AlertTriangle}
            label="Overdue Alerts"
            value={totalOverdueAlerts}
            accent="amber"
            subtitle={totalOverdueAlerts > 0 ? 'Requires attention' : 'All loans cleared'}
            trend={totalOverdueAlerts > 0 ? `${totalOverdueAlerts} Overdue` : 'Zero Overdue'}
            trendType={totalOverdueAlerts > 0 ? 'critical' : 'normal'}
          />
          <StatsCard
            icon={Wrench}
            label="In Maintenance"
            value={inRepairItems.length}
            accent="emerald"
            subtitle="Damaged or offline"
            trend={inRepairItems.length > 0 ? 'Service Flag' : 'Operational'}
            trendType={inRepairItems.length > 0 ? 'warning' : 'normal'}
          />
        </div>
      </section>

      {/* 3. Search & Horizontal Filter Bar */}
      <section
        className="neu-card p-2.5 sm:p-3 rounded-2xl"
        aria-label="Table Search and Filters"
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Top Row on mobile (< lg): Search Box + View Switcher */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            {/* Recessed Skeuomorphic Search Box */}
            <div className="relative flex-1 lg:w-56 xl:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student ID, item, or bin..."
                className="w-full h-9 sm:h-10 text-xs sm:text-sm pl-9 pr-8 rounded-xl neu-inset text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-white/30"
                aria-label="Search records"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-500 hover:text-slate-950 dark:hover:text-white cursor-pointer active:scale-90"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Mobile View Switcher (< lg) */}
            <div className="flex lg:hidden items-center gap-1 p-1 rounded-xl neu-inset-sm shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer active:scale-95 transition-all ${
                  viewMode === 'grid'
                    ? 'neu-btn-primary shadow-sm text-cyan-600 dark:text-cyan-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Cards View"
                aria-label="Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer active:scale-95 transition-all ${
                  viewMode === 'table'
                    ? 'neu-btn-primary shadow-sm text-cyan-600 dark:text-cyan-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Table View"
                aria-label="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4 Category Filter Buttons (Beside search bar on lg, full-width swipeable touch-rail on mobile) */}
          <div className="flex items-center gap-1.5 overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain py-0.5 no-scrollbar flex-1 min-w-0">
            {[
              { id: 'ALL', label: 'All Transactions' },
              { id: 'ACTIVE', label: 'Active Loans' },
              { id: 'OVERDUE', label: 'Overdue' },
              { id: 'LOCKERS', label: 'Locker Apparatus' },
            ].map((btn) => {
              const isActive = filterMode === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setFilterMode(btn.id)}
                  className={`h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 cursor-pointer active:scale-95 transition-all whitespace-nowrap ${
                    isActive
                      ? isDark ? 'bg-white text-slate-950 font-black shadow-md' : 'bg-slate-900 text-white font-black shadow-md'
                      : 'neu-btn-raised text-slate-700 dark:text-slate-300'
                  }`}
                  aria-pressed={isActive}
                >
                  {btn.label}
                </button>
              );
            })}

            {/* Sub-Lab Filter Chips when viewing Locker Apparatus */}
            {filterMode === 'LOCKERS' && (
              <>
                <span className="text-slate-400 dark:text-slate-600 px-1 font-mono shrink-0">|</span>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'CE', label: 'Civil' },
                  { id: 'CHEM', label: 'Chem' },
                  { id: 'DIGITAL', label: 'Digital' },
                  { id: 'ECE', label: 'ECE' },
                ].map((lab) => {
                  const isSubActive = subLabFilter === lab.id;
                  return (
                    <button
                      key={lab.id}
                      type="button"
                      onClick={() => setSubLabFilter(lab.id)}
                      className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg text-xs font-mono font-bold uppercase shrink-0 cursor-pointer active:scale-95 transition-all whitespace-nowrap ${
                        isSubActive
                          ? isDark ? 'bg-cyan-500 text-slate-950 font-black shadow-sm' : 'bg-slate-900 text-white font-bold shadow-sm'
                          : 'neu-btn-raised text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {lab.label}
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Desktop View Switcher (Visible on lg+) */}
          <div className="hidden lg:flex items-center gap-1 p-1 rounded-xl neu-inset-sm shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center cursor-pointer active:scale-95 transition-all ${
                viewMode === 'grid'
                  ? 'neu-btn-primary shadow-sm text-cyan-600 dark:text-cyan-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Cards View"
              aria-label="Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center cursor-pointer active:scale-95 transition-all ${
                viewMode === 'table'
                  ? 'neu-btn-primary shadow-sm text-cyan-600 dark:text-cyan-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
              aria-label="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Live Records View: Card Grid (Borrow Kiosk Style) or Table */}
      <section aria-label="Inventory and Transaction Records">
        {displayRows.length === 0 ? (
          <div className="neu-card p-10 sm:p-14 text-center rounded-2xl space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 dark:text-emerald-400" />
            <p className="text-base font-bold text-slate-900 dark:text-white">No Matching Records</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              There are currently no active transaction or inventory records matching your query.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* ========================================================================= */
          /* CARD GRID VIEW (SKEUOMORPHIC BORROW KIOSK CARDS)                          */
          /* ========================================================================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
                    className="neu-card neu-card-hover p-3.5 rounded-2xl flex flex-col justify-between group select-none"
                  >
                    <div>
                      {/* Hero Image Stage */}
                      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-2.5 neu-inset-sm flex items-center justify-center">
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
                        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/95 backdrop-blur-md border border-white/15 text-white font-mono text-[9px] font-black shadow-md">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
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
                              ? 'REPAIR'
                              : item.stock === 0
                              ? '0 STOCK'
                              : `${item.stock} LEFT`}
                          </span>
                        </div>
                      </div>

                      {/* Header Badges */}
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md neu-inset-sm text-slate-800 dark:text-slate-200">
                          [{item.lab}]
                        </span>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md neu-inset-sm text-slate-700 dark:text-slate-300">
                          {row.binLocation}
                        </span>
                      </div>

                      {/* Nomenclature */}
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {item.category || 'General Apparatus'}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                        #{item.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigateTab && onNavigateTab('inventory')}
                        className="neu-btn-raised min-h-[38px] px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-95"
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
                  className="neu-card neu-card-hover p-4 rounded-2xl flex flex-col justify-between space-y-3 select-none"
                >
                  <div className="space-y-2.5">
                    {/* Top Ribbon & Telemetry Tag */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-black text-slate-800 dark:text-cyan-300 neu-inset-sm px-2 py-0.5 rounded-md">
                        {tx.txId}
                      </span>

                      {/* Status Badge using the 4 iconic Kiosk colors */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider border shrink-0 ${
                          isOverdue
                            ? 'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-600 animate-pulse'
                            : isCleared
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-600'
                            : 'bg-indigo-100 text-indigo-950 border-indigo-400 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isOverdue ? 'bg-amber-600' : isCleared ? 'bg-emerald-600' : 'bg-indigo-600'
                          }`}
                        />
                        <span>{isOverdue ? 'OVERDUE' : isCleared ? 'CLEARED' : 'ACTIVE'}</span>
                      </span>
                    </div>

                    {/* Borrower Capsule (Clean & Minimal) */}
                    <div className="neu-inset-sm p-3 rounded-xl space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                          {row.studentId}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                          {row.binLocation}
                        </span>
                      </div>

                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase leading-tight">
                        {row.leaderName}
                      </p>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {row.secondaryInfo}
                      </p>
                    </div>

                    {/* Borrowed Items */}
                    <div className="space-y-1">
                      {(tx.items || []).slice(0, 2).map((item, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1.5 rounded-lg neu-inset-sm flex items-center justify-between text-xs font-semibold"
                        >
                          <span className="truncate text-slate-900 dark:text-white pr-2">
                            {item.name}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">
                            x{item.qty || 1}
                          </span>
                        </div>
                      ))}
                      {(tx.items || []).length > 2 && (
                        <p className="text-[11px] font-mono font-bold text-slate-500 text-center">
                          +{(tx.items || []).length - 2} more items
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 1-Click Action Buttons */}
                  <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center gap-2">
                    {tx.status !== 'RETURNED_CLEARED' && (
                      <button
                        type="button"
                        onClick={() => handleQuickReturn(tx)}
                        className="flex-1 neu-btn-secondary min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        title="Mark equipment returned"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Return</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedSlipModal(tx)}
                      className="flex-1 neu-btn-raised min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      title="Inspect loan slip"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>Slip</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* ========================================================================= */
          /* TABLE VIEW                                                                */
          /* ========================================================================= */
          <>
            {/* Desktop & Tablets (>= 768px): Modular Skeuomorphic Table */}
            <div className="hidden md:block neu-card rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 py-3 px-4 text-xs font-black tracking-wider uppercase">
                    <th scope="col" className="py-3 px-4">TRACKING ID</th>
                    <th scope="col" className="py-3 px-4">TOOL / APPARATUS</th>
                    <th scope="col" className="py-3 px-4">BORROWER</th>
                    <th scope="col" className="py-3 px-4">LOCATION</th>
                    <th scope="col" className="py-3 px-4">STATUS</th>
                    <th scope="col" className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                  {displayRows.map((row) => {
                    const isOverdue = row.status === 'OVERDUE';
                    const isCleared = row.status === 'CLEARED';

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors"
                      >
                        {/* ID */}
                        <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900 dark:text-cyan-300 whitespace-nowrap">
                          {row.id}
                        </td>

                        {/* Tool Name */}
                        <td className="py-3 px-4">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                            {row.primaryName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {row.secondaryInfo}
                          </p>
                        </td>

                        {/* Student ID & Borrower */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-black text-slate-900 dark:text-white px-2 py-0.5 rounded neu-inset-sm">
                              {row.studentId}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {row.leaderName}
                            </span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {row.binLocation}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider border ${
                              isOverdue
                                ? 'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-950 dark:text-amber-200'
                                : isCleared
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-200'
                                : 'bg-indigo-100 text-indigo-950 border-indigo-400 dark:bg-indigo-950 dark:text-indigo-200'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {row.rawTx && row.status !== 'CLEARED' && (
                              <button
                                type="button"
                                onClick={() => handleQuickReturn(row.rawTx)}
                                className="neu-btn-secondary min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Return</span>
                              </button>
                            )}

                            {row.rawTx && (
                              <button
                                type="button"
                                onClick={() => setSelectedSlipModal(row.rawTx)}
                                className="neu-btn-raised min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer active:scale-95"
                              >
                                <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                                <span>Slip</span>
                              </button>
                            )}

                            {row.type === 'STORAGE' && (
                              <button
                                type="button"
                                onClick={() => onNavigateTab && onNavigateTab('inventory')}
                                className="neu-btn-raised min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer active:scale-95"
                              >
                                <Package className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                                <span>Manage</span>
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

            {/* Mobile Phones (< 768px): Responsive Skeuomorphic Transaction Cards */}
            <div className="block md:hidden space-y-3">
              {displayRows.map((row) => {
                const isOverdue = row.status === 'OVERDUE';
                const isCleared = row.status === 'CLEARED';

                return (
                  <article
                    key={`mob-${row.id}`}
                    className="neu-card p-3.5 rounded-2xl space-y-2.5 select-none"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-cyan-300 neu-inset-sm px-2 py-0.5 rounded">
                        {row.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider border ${
                          isOverdue
                            ? 'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-950 dark:text-amber-200'
                            : isCleared
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-200'
                            : 'bg-indigo-100 text-indigo-950 border-indigo-400 dark:bg-indigo-950 dark:text-indigo-200'
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>

                    {/* Tool Name in Bold */}
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                        {row.primaryName}
                      </h4>
                      {row.secondaryInfo && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {row.secondaryInfo}
                        </p>
                      )}
                    </div>

                    {/* Borrower ID + Department Badge + Locker Bin Pill */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-white px-2 py-0.5 rounded neu-inset-sm">
                        {row.studentId}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {row.leaderName}
                      </span>
                      <span className="ml-auto font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300 neu-inset-sm px-2 py-0.5 rounded-md">
                        {row.binLocation}
                      </span>
                    </div>

                    {/* Bottom Actions with minimum 44px touch height */}
                    <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center gap-2">
                      {row.rawTx && row.status !== 'CLEARED' && (
                        <button
                          type="button"
                          onClick={() => handleQuickReturn(row.rawTx)}
                          className="w-full neu-btn-secondary min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-xs"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Mark Returned</span>
                        </button>
                      )}

                      {row.rawTx && (
                        <button
                          type="button"
                          onClick={() => setSelectedSlipModal(row.rawTx)}
                          className="neu-btn-raised min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-xs shrink-0"
                          title="View Slip"
                        >
                          <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                          <span>Slip</span>
                        </button>
                      )}

                      {row.type === 'STORAGE' && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab && onNavigateTab('inventory')}
                          className="w-full neu-btn-raised min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
                        >
                          <Package className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                          <span>Manage</span>
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

      {/* 5. Department Breakdown (The 4 iconic lab colors from Kiosk borrow section) */}
      <section aria-label="Department Laboratories" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Laboratories Status</span>
          </h2>
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
            {totalStock} Total Apparatus
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {labsData.map((lab) => {
            const Icon = lab.icon;
            return (
              <div
                key={lab.id}
                onClick={() => onNavigateTab && onNavigateTab('inventory')}
                className="neu-card neu-card-hover p-3 rounded-2xl space-y-2 cursor-pointer group select-none active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg neu-inset-sm flex items-center justify-center text-slate-800 dark:text-slate-200 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {lab.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded neu-inset-sm text-slate-700 dark:text-slate-300">
                    {lab.code}
                  </span>
                </div>

                <div className="neu-inset-sm p-2 rounded-xl flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Stock</span>
                  <span className="text-slate-900 dark:text-white">{lab.stock} pcs</span>
                </div>

                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 dark:bg-white rounded-full"
                    style={{ width: `${lab.percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Inspection Slip Modal (Skeuomorphic Kiosk Parity) */}
      {selectedSlipModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="slip-modal-title"
        >
          <div className="neu-card w-full max-w-xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                  CLEARANCE SLIP
                </span>
                <h3 id="slip-modal-title" className="text-base font-black text-slate-900 dark:text-white">
                  {selectedSlipModal.txId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlipModal(null)}
                className="neu-btn-raised min-h-[38px] min-w-[38px] p-2 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer active:scale-95"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {/* Borrower Details Grid */}
              <div className="neu-inset-sm p-3.5 rounded-xl grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-bold text-[10px]">STUDENT ID</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">
                    {selectedSlipModal.borrower?.studentId || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-bold text-[10px]">BORROWER</span>
                  <span className="font-black text-slate-900 dark:text-white uppercase truncate block">
                    {selectedSlipModal.borrower?.groupLeader || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-bold text-[10px]">PROGRAM</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedSlipModal.borrower?.program} • {selectedSlipModal.borrower?.courseCode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-bold text-[10px]">INSTRUCTOR</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedSlipModal.borrower?.instructor} • Grp {selectedSlipModal.borrower?.groupNo}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Items ({selectedSlipModal.items?.length || 0})
                </span>
                <div className="neu-inset-sm rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-white/10">
                  {(selectedSlipModal.items || []).map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {item.tagCode} • {item.location || 'Bin B-01'}
                        </p>
                      </div>
                      <span className="font-mono font-bold px-2 py-0.5 rounded neu-card">
                        x{item.qty || 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSlipModal.custodianNotes && (
                <div className="neu-inset-sm p-3 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                  <strong>Notes:</strong> {selectedSlipModal.custodianNotes}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="neu-btn-raised min-h-[42px] px-3.5 py-2 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedSlipModal.status !== 'RETURNED_CLEARED' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickReturn(selectedSlipModal);
                      setSelectedSlipModal(null);
                    }}
                    className="neu-btn-secondary min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Clear Return</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedSlipModal(null)}
                  className="neu-btn-raised min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-95"
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
