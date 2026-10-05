import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  Check,
  X,
  Building2,
  Cpu,
  Radio,
  FlaskConical,
  Atom,
  Download,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ShieldCheck,
  MapPin,
  PackageCheck,
  CheckCircle2,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Wrench
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  resetMasterInventory
} from '../../data/equipmentData';
import AddItemModal from './AddItemModal';
import EditItemModal from './EditItemModal';

const LAB_MAP = {
  CE: { name: 'Civil Engineering', short: 'CE Lab', color: 'amber', icon: Building2, tag: 'CE-LAB' },
  DIGITAL: { name: 'Digital & Logic', short: 'Digital Lab', color: 'cyan', icon: Cpu, tag: 'DIG-LAB' },
  ECE: { name: 'ECE & Comms', short: 'ECE Lab', color: 'indigo', icon: Radio, tag: 'ECE-LAB' },
  CHEM: { name: 'Chemistry Lab', short: 'Chem Lab', color: 'emerald', icon: FlaskConical, tag: 'CHM-LAB' },
  PHYSICS: { name: 'Physics & Mechanics', short: 'Physics Lab', color: 'rose', icon: Atom, tag: 'PHY-LAB' },
};

const CATEGORIES = [
  'ALL',
  'Equipment & Apparatus',
  'Consumables',
  'Trainer Modules & Instruments',
  'Tools & Assets',
];

export default function InventoryManager() {
  const { restoreInventoryItem } = useTransaction();
  const [inventory, setInventory] = useState(() => getInventory());
  const [search, setSearch] = useState('');
  const [filterLab, setFilterLab] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStock, setFilterStock] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'MAINTENANCE'
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc' | 'name-desc' | 'stock-desc' | 'stock-asc' | 'tag-asc'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25); // 25 | 50 | 100 | 'ALL'

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItemToEdit, setSelectedItemToEdit] = useState(null);
  const [quickViewItem, setQuickViewItem] = useState(null);
  const [editingStockId, setEditingStockId] = useState(null);
  const [editStockValue, setEditStockValue] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterLab, filterCategory, filterStock, sortBy, pageSize]);

  const refreshInventory = () => setInventory([...getInventory()]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Precomputed Lab Counts
  const labCounts = useMemo(() => {
    const counts = { ALL: inventory.length };
    for (let i = 0; i < inventory.length; i++) {
      const l = inventory[i].lab;
      counts[l] = (counts[l] || 0) + 1;
    }
    return counts;
  }, [inventory]);

  // Overall KPIs in single O(N) pass
  const { totalUnits, lowCount, outCount, maintenanceCount } = useMemo(() => {
    let units = 0;
    let low = 0;
    let out = 0;
    let maintenance = 0;
    for (let i = 0; i < inventory.length; i++) {
      const s = inventory[i].stock || 0;
      const isM =
        inventory[i].status === 'Under Maintenance' ||
        (inventory[i].condition &&
          inventory[i].condition !== 'Functional' &&
          inventory[i].condition !== 'Passed Inspection');
      units += s;
      if (isM) maintenance++;
      if (s === 0) out++;
      else if (s <= 3) low++;
    }
    return { totalUnits: units, lowCount: low, outCount: out, maintenanceCount: maintenance };
  }, [inventory]);

  // Fast Filter & Sort Pipeline
  const filteredAndSorted = useMemo(() => {
    const q = search.toLowerCase().trim();
    const hasSearch = Boolean(q);
    const result = [];

    for (let i = 0; i < inventory.length; i++) {
      const item = inventory[i];
      const isM =
        item.status === 'Under Maintenance' ||
        (item.condition &&
          item.condition !== 'Functional' &&
          item.condition !== 'Passed Inspection');

      // Lab filter
      if (filterLab !== 'ALL' && item.lab !== filterLab) continue;

      // Category filter
      if (filterCategory !== 'ALL' && item.category !== filterCategory) continue;

      // Stock & Maintenance filter
      const s = item.stock || 0;
      if (filterStock === 'MAINTENANCE' && !isM) continue;
      if (filterStock === 'IN_STOCK' && (s <= 3 || isM)) continue;
      if (filterStock === 'LOW_STOCK' && (s === 0 || s > 3 || isM)) continue;
      if (filterStock === 'OUT_OF_STOCK' && (s !== 0 || isM)) continue;

      // Search query
      if (hasSearch) {
        const matches =
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.tagCode && item.tagCode.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.room && item.room.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q));
        if (!matches) continue;
      }

      result.push(item);
    }

    if (sortBy === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'name-desc') result.sort((a, b) => b.name.localeCompare(a.name));
    else if (sortBy === 'stock-desc') result.sort((a, b) => (b.stock || 0) - (a.stock || 0));
    else if (sortBy === 'stock-asc') result.sort((a, b) => (a.stock || 0) - (b.stock || 0));
    else if (sortBy === 'tag-asc') result.sort((a, b) => a.tagCode.localeCompare(b.tagCode));
    else if (sortBy === 'tag-desc') result.sort((a, b) => b.tagCode.localeCompare(a.tagCode));
    else if (sortBy === 'dept-asc') result.sort((a, b) => (a.lab || '').localeCompare(b.lab || ''));
    else if (sortBy === 'cat-asc') result.sort((a, b) => (a.category || '').localeCompare(b.category || ''));

    return result;
  }, [inventory, search, filterLab, filterCategory, filterStock, sortBy]);

  // Handle Restoring an item to active service
  const handleRestoreItem = (id, name) => {
    restoreInventoryItem(id);
    refreshInventory();
    showToast(`Restored "${name}" to active service & cleared maintenance flag.`);
  };

  // Paginated Items Slice
  const totalPages = pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(filteredAndSorted.length / Number(pageSize)));
  const paginatedItems = useMemo(() => {
    if (pageSize === 'ALL') return filteredAndSorted;
    const size = Number(pageSize);
    const start = (currentPage - 1) * size;
    return filteredAndSorted.slice(start, start + size);
  }, [filteredAndSorted, currentPage, pageSize]);

  // Handle Sort Column Toggle
  const toggleSort = (columnKey) => {
    if (columnKey === 'name') {
      setSortBy((prev) => (prev === 'name-asc' ? 'name-desc' : 'name-asc'));
    } else if (columnKey === 'tag') {
      setSortBy((prev) => (prev === 'tag-asc' ? 'tag-desc' : 'tag-asc'));
    } else if (columnKey === 'stock') {
      setSortBy((prev) => (prev === 'stock-desc' ? 'stock-asc' : 'stock-desc'));
    } else if (columnKey === 'dept') {
      setSortBy((prev) => (prev === 'dept-asc' ? 'name-asc' : 'dept-asc'));
    } else if (columnKey === 'cat') {
      setSortBy((prev) => (prev === 'cat-asc' ? 'name-asc' : 'cat-asc'));
    }
  };

  // CRUD Handlers
  const handleAddItem = (newItem) => {
    addInventoryItem(newItem);
    refreshInventory();
    setShowAddModal(false);
    showToast(`Added "${newItem.name}" to inventory!`);
  };

  const handleSaveFullEdit = (id, updatedFields) => {
    updateInventoryItem(id, updatedFields);
    refreshInventory();
    setSelectedItemToEdit(null);
    showToast('Equipment details updated successfully.');
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from the inventory?`)) {
      deleteInventoryItem(id);
      refreshInventory();
      showToast(`Removed "${name}" from inventory.`);
    }
  };

  const handleStepStock = (id, delta) => {
    const target = inventory.find((i) => i.id === id);
    if (!target) return;
    const newStock = Math.max(0, (target.stock || 0) + delta);
    updateInventoryItem(id, { stock: newStock });
    refreshInventory();
  };

  const startQuickEditStock = (id, currentStock) => {
    setEditingStockId(id);
    setEditStockValue(String(currentStock));
  };

  const saveQuickEditStock = (id) => {
    const newStock = Math.max(0, parseInt(editStockValue, 10) || 0);
    updateInventoryItem(id, { stock: newStock });
    refreshInventory();
    setEditingStockId(null);
  };

  const cancelQuickEditStock = () => {
    setEditingStockId(null);
    setEditStockValue('');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const targetDept = filterLab === 'ALL' ? 'ALL_DEPTS' : filterLab;
    const headers = ['ID', 'Tag Code', 'Name', 'Lab', 'Category', 'Stock', 'Unit', 'Condition', 'Status', 'Room', 'Safety Clearance'];
    const rows = filteredAndSorted.map((item) => [
      item.id,
      `"${item.tagCode}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      item.lab,
      `"${item.category || ''}"`,
      item.stock,
      item.unit || 'pc',
      item.condition || 'Functional',
      item.status || 'Available',
      `"${item.room || ''}"`,
      `"${item.safetyClearance || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UdD_Master_Inventory_${targetDept}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported inventory to CSV successfully.');
  };

  // Reseed master database
  const handleReseedMaster = () => {
    if (window.confirm('Restore official 263 items from Universidad de Dagupan Master Inventory?')) {
      resetMasterInventory();
      refreshInventory();
      showToast('Master inventory reseeded with 263 official items.');
    }
  };

  const getStockBadge = (stock) => {
    if (stock === 0) {
      return {
        label: 'Out of Stock',
        badge: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
        dot: 'bg-rose-400',
      };
    }
    if (stock <= 3) {
      return {
        label: 'Low Stock',
        badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        dot: 'bg-amber-400',
      };
    }
    return {
      label: 'In Stock',
      badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      dot: 'bg-emerald-400',
    };
  };

  const getLabBadgeStyle = (labId) => {
    switch (labId) {
      case 'CE':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'DIGITAL':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'ECE':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'CHEM':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'PHYSICS':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 overflow-y-auto overflow-x-hidden h-full max-w-[1600px] w-full mx-auto select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-cyan-950 border border-cyan-500/50 text-cyan-200 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Command Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b-2 border-slate-300 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-600 text-white dark:bg-cyan-500/20 dark:text-cyan-400 flex items-center justify-center shadow-xs shrink-0">
            <Boxes className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Master Laboratory Inventory
            </h1>
            <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Live catalog across all 5 Engineering Laboratory departments
            </p>
          </div>
        </div>

        {/* Global Action Buttons: Clean Single Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg neu-btn-raised text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Export CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleReseedMaster}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg neu-btn-raised text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Restore Master 263 items"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Sync Master</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg neu-btn-primary text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Equipment</span>
          </button>
        </div>
      </div>

      {/* 2. Skeuomorphic KPI Command Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* Total Unique Items */}
        <div className="neu-card p-2.5 sm:p-3 rounded-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-400">Total Unique Items</span>
            <span className="p-1 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
              <PackageCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400">{inventory.length}</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase">types</span>
          </div>
        </div>

        {/* Total Available Units */}
        <div className="neu-card p-2.5 sm:p-3 rounded-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-400">Total Available Units</span>
            <span className="p-1 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{totalUnits}</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase">units</span>
          </div>
        </div>

        {/* Under Maintenance / Incident Flagged */}
        <div
          onClick={() => setFilterStock(filterStock === 'MAINTENANCE' ? 'ALL' : 'MAINTENANCE')}
          className={`neu-card p-2.5 sm:p-3 rounded-xl relative overflow-hidden cursor-pointer transition-all ${
            filterStock === 'MAINTENANCE'
              ? 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-50 dark:bg-rose-950/40'
              : 'hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-400">Under Maintenance</span>
            <span className="p-1 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <Wrench className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-rose-600 dark:text-rose-400">{maintenanceCount}</span>
            <span className="text-[9px] text-rose-500/80 font-bold uppercase">for repair</span>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div
          onClick={() => setFilterStock(filterStock === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
          className={`neu-card p-2.5 sm:p-3 rounded-xl relative overflow-hidden cursor-pointer transition-all ${
            filterStock === 'LOW_STOCK'
              ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-50 dark:bg-amber-950/40'
              : 'hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400">Low Stock (≤3)</span>
            <span className="p-1 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{lowCount}</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase">restock</span>
          </div>
        </div>

        {/* Out of Stock Alert */}
        <div
          onClick={() => setFilterStock(filterStock === 'OUT_OF_STOCK' ? 'ALL' : 'OUT_OF_STOCK')}
          className={`neu-card p-2.5 sm:p-3 rounded-xl relative overflow-hidden cursor-pointer transition-all ${
            filterStock === 'OUT_OF_STOCK'
              ? 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-50 dark:bg-rose-950/40'
              : 'hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-400">Out of Stock (0)</span>
            <span className="p-1 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <X className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-rose-600 dark:text-rose-400">{outCount}</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase">depleted</span>
          </div>
        </div>
      </div>

      {/* 3. 5-Department Navigation Tabs with Live Badges */}
      <div className="p-1 rounded-xl neu-inset-sm flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => setFilterLab('ALL')}
          className={`h-8 sm:h-9 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
            filterLab === 'ALL'
              ? 'bg-white text-slate-950 dark:bg-white/15 dark:text-white font-black shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Boxes className="w-3.5 h-3.5 shrink-0" />
          <span>All Departments</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
            filterLab === 'ALL'
              ? 'bg-slate-900/10 dark:bg-white/20 text-slate-900 dark:text-white'
              : 'bg-black/10 dark:bg-white/10 text-slate-500 dark:text-slate-400'
          }`}>
            {inventory.length}
          </span>
        </button>

        {Object.entries(LAB_MAP).map(([id, info]) => {
          const Icon = info.icon;
          const isActive = filterLab === id;
          const count = labCounts[id] || 0;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setFilterLab(id)}
              className={`h-8 sm:h-9 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-white text-slate-950 dark:bg-white/15 dark:text-white font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{info.short}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                isActive
                  ? 'bg-slate-900/10 dark:bg-white/20 text-slate-900 dark:text-white'
                  : 'bg-black/10 dark:bg-white/10 text-slate-500 dark:text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Multi-Filter Toolbar & Search */}
      <div className="space-y-2 sm:space-y-2.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 sm:gap-2.5">
          {/* Search Input with Clear Button */}
          <div className="flex-1 relative w-full md:max-w-md lg:max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment, tag code, room, bin..."
              className="w-full h-10 pl-9 pr-9 rounded-xl neu-inset text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/60"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector & View Mode Switcher (Symmetrically balanced on mobile, adjacent on desktop) */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full md:w-auto">
            {/* Sort Dropdown */}
            <div className="flex-1 sm:flex-initial flex items-center gap-1.5 px-3 h-10 rounded-xl neu-inset text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1 font-medium w-full truncate"
              >
                <option value="name-asc" className="bg-white dark:bg-[#111827] text-slate-900 dark:text-white">Name: A to Z</option>
                <option value="name-desc" className="bg-white dark:bg-[#111827] text-slate-900 dark:text-white">Name: Z to A</option>
                <option value="stock-desc" className="bg-white dark:bg-[#111827] text-slate-900 dark:text-white">Stock: High to Low</option>
                <option value="stock-asc" className="bg-white dark:bg-[#111827] text-slate-900 dark:text-white">Stock: Low to High</option>
                <option value="tag-asc" className="bg-white dark:bg-[#111827] text-slate-900 dark:text-white">Tag Code Order</option>
              </select>
            </div>

            {/* View Mode Toggle (Table / Grid) */}
            <div className="flex items-center p-1 rounded-xl neu-inset-sm shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'neu-btn-raised text-cyan-600 dark:text-cyan-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Table View"
                aria-label="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'neu-btn-raised text-cyan-600 dark:text-cyan-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Card Grid View"
                aria-label="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category & Stock Filter Chips (Swipeable touch-rail) */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain no-scrollbar py-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Category:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`h-7 px-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                  filterCategory === cat
                    ? 'neu-btn-raised bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'neu-btn-raised text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All' : cat}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold shrink-0 pr-1">
            Showing <strong className="text-cyan-600 dark:text-cyan-400">{filteredAndSorted.length}</strong> of {inventory.length}
          </div>
        </div>
      </div>

      {/* 5. Modern Interactive Sortable Table View (Active only when viewMode === 'table') */}
      {viewMode === 'table' && (
        <div className="space-y-3">
          {/* Desktop & Tablets (>= 768px): Modular Table */}
          <div className="hidden md:block neu-card rounded-3xl overflow-x-auto shadow-xl">
          <div className="min-w-[1080px]">
            {/* Table Column Headers with Interactive Sorting */}
            <div className="grid grid-cols-[45px_minmax(220px,2fr)_minmax(180px,1.2fr)_120px_130px_140px_110px_160px] gap-3 px-5 py-3.5 bg-slate-100/80 dark:bg-[#070b12] border-b border-slate-200 dark:border-white/10 text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider select-none">
              <span className="text-center">#</span>
              
              <button
                type="button"
                onClick={() => toggleSort('name')}
                className="flex items-center gap-1 hover:text-cyan-300 transition-colors text-left cursor-pointer"
              >
                <span>Equipment / Apparatus</span>
                {sortBy === 'name-asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : sortBy === 'name-desc' ? <ArrowDown className="w-3 h-3 text-cyan-400" /> : <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />}
              </button>

              <button
                type="button"
                onClick={() => toggleSort('tag')}
                className="flex items-center gap-1 hover:text-cyan-300 transition-colors text-left cursor-pointer"
              >
                <span>Tag Code</span>
                {sortBy === 'tag-asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : sortBy === 'tag-desc' ? <ArrowDown className="w-3 h-3 text-cyan-400" /> : <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />}
              </button>

              <button
                type="button"
                onClick={() => toggleSort('dept')}
                className="flex items-center justify-center gap-1 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <span>Dept</span>
                {sortBy === 'dept-asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />}
              </button>

              <button
                type="button"
                onClick={() => toggleSort('cat')}
                className="flex items-center gap-1 hover:text-cyan-300 transition-colors text-left cursor-pointer"
              >
                <span>Category</span>
                {sortBy === 'cat-asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />}
              </button>

              <span>Condition & Specs</span>

              <button
                type="button"
                onClick={() => toggleSort('stock')}
                className="flex items-center justify-center gap-1 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <span>Stock</span>
                {sortBy === 'stock-desc' ? <ArrowDown className="w-3 h-3 text-cyan-400" /> : sortBy === 'stock-asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />}
              </button>

              <span className="text-center">Actions</span>
            </div>

            {paginatedItems.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500 space-y-2">
                <PackageCheck className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-bold text-slate-400">No equipment found matching your criteria</p>
                <p className="text-xs text-slate-600">Try clearing the search query or switching department filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-white/10 max-h-[calc(100vh-420px)] overflow-y-auto">
                {paginatedItems.map((item, index) => {
                  const stockBadge = getStockBadge(item.stock);
                  const labBadge = getLabBadgeStyle(item.lab);
                  const isQuickEditing = editingStockId === item.id;
                  const itemIndex = (currentPage - 1) * (pageSize === 'ALL' ? 0 : Number(pageSize)) + index + 1;

                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[45px_minmax(220px,2fr)_minmax(180px,1.2fr)_120px_130px_140px_110px_160px] gap-3 px-5 py-3 items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                    >
                      {/* Index */}
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500 text-center font-bold">
                        {itemIndex}
                      </span>

                      {/* Equipment Name & Room */}
                      <div className="min-w-0 pr-2">
                        <p
                          onClick={() => setQuickViewItem(item)}
                          className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors cursor-pointer"
                          title={item.name}
                        >
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                          <span>{item.room || 'General Engineering Lab'}</span>
                        </p>
                      </div>

                      {/* Tag Code */}
                      <div className="min-w-0 pr-1">
                        <span
                          className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/30 truncate block max-w-full text-center"
                          title={item.tagCode}
                        >
                          {item.tagCode}
                        </span>
                      </div>

                      {/* Lab Department */}
                      <div className="min-w-0 flex justify-center">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border truncate inline-block text-center ${labBadge}`}
                          title={LAB_MAP[item.lab]?.name || item.lab}
                        >
                          {LAB_MAP[item.lab]?.short || item.lab}
                        </span>
                      </div>

                      {/* Category */}
                      <div className="min-w-0">
                        <span
                          className="text-xs text-slate-600 dark:text-slate-400 truncate block font-medium"
                          title={item.category || 'Apparatus'}
                        >
                          {item.category || 'Apparatus'}
                        </span>
                      </div>

                      {/* Condition & Safety */}
                      <div className="space-y-0.5 min-w-0">
                        {item.status === 'Under Maintenance' || (item.condition && item.condition !== 'Functional' && item.condition !== 'Passed Inspection') ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)] animate-ping shrink-0" />
                            <span className="truncate">Under Maintenance</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] shrink-0" />
                            <span className="truncate">{item.condition || 'Functional'}</span>
                          </div>
                        )}
                        <span className="text-[10px] text-slate-500 truncate block font-medium">
                          {item.safetyClearance || 'Safe for Use'}
                        </span>
                      </div>

                      {/* Interactive Stock Stepper */}
                      <div className="flex items-center justify-center shrink-0">
                        {isQuickEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              value={editStockValue}
                              onChange={(e) => setEditStockValue(e.target.value)}
                              className="w-12 h-7 text-center font-mono rounded-lg neu-inset text-cyan-700 dark:text-cyan-300 text-xs focus:outline-none font-bold"
                              autoFocus
                            />
                            <button
                              onClick={() => saveQuickEditStock(item.id)}
                              className="p-1 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={cancelQuickEditStock}
                              className="p-1 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/30 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 neu-inset-sm p-1 rounded-xl shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStepStock(item.id, -1)}
                              className="w-6 h-6 rounded-lg neu-btn-raised text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs active:scale-90 transition-transform cursor-pointer"
                              title="Decrease Stock"
                            >
                              -
                            </button>

                            <button
                              type="button"
                              onClick={() => startQuickEditStock(item.id, item.stock)}
                              className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black ${stockBadge.badge} hover:brightness-110 cursor-pointer`}
                              title="Click to type exact stock"
                            >
                              {item.stock}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStepStock(item.id, 1)}
                              className="w-6 h-6 rounded-lg neu-btn-raised text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs active:scale-90 transition-transform cursor-pointer"
                              title="Increase Stock"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-center gap-1.5 shrink-0">
                        {(item.status === 'Under Maintenance' || (item.condition && item.condition !== 'Functional' && item.condition !== 'Passed Inspection')) && (
                          <button
                            type="button"
                            onClick={() => handleRestoreItem(item.id, item.name)}
                            className="px-2 py-1 rounded-lg neu-btn-raised border border-emerald-500/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer flex items-center gap-1 font-bold text-[10px] shrink-0"
                            title="Mark Repaired / Restore to Active Service"
                          >
                            <Wrench className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Restore</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setQuickViewItem(item)}
                          className="p-1.5 rounded-lg neu-btn-raised text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-all cursor-pointer"
                          title="Quick View Specs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedItemToEdit(item)}
                          className="p-1.5 rounded-lg neu-btn-raised text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-all cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-1.5 rounded-lg neu-btn-raised text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-all cursor-pointer"
                          title="Delete Equipment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Phones (< 768px): Responsive Tactile Inventory Cards */}
        <div className="block md:hidden space-y-3">
          {paginatedItems.length === 0 ? (
            <div className="p-8 rounded-2xl neu-card text-center text-xs text-slate-500 space-y-2">
              <PackageCheck className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="font-bold text-slate-400">No equipment found matching criteria</p>
            </div>
          ) : (
            paginatedItems.map((item) => {
              const stockBadge = getStockBadge(item.stock);

              return (
                <article
                  key={`mob-inv-${item.id}`}
                  className="neu-card p-3.5 rounded-2xl space-y-2.5 select-none"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-cyan-300 neu-inset-sm px-2 py-0.5 rounded">
                      {item.tagCode || `EQ-${item.id}`}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${stockBadge.border} ${stockBadge.bg} ${stockBadge.color}`}
                    >
                      {item.stock} {stockBadge.label}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.category} • {item.lab || item.department || 'General Lab'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300 neu-inset-sm px-2 py-0.5 rounded-md">
                      {item.storageBin || item.location || 'Bin A-1'}
                    </span>
                    <span className={`text-[11px] font-semibold ${item.status === 'Under Maintenance' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {item.status === 'Under Maintenance' ? 'Under Maintenance' : (item.condition || 'Functional')}
                    </span>
                  </div>

                  {/* Stock Stepper & Quick Actions with minimum 44px touch height */}
                  <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1 neu-inset-sm p-1 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(item.id, -1)}
                        disabled={Number(item.stock) <= 0}
                        className="w-8 h-8 rounded-lg neu-btn-raised flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer active:scale-95"
                        title="Decrease Stock"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {item.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(item.id, 1)}
                        className="w-8 h-8 rounded-lg neu-btn-raised flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-300 cursor-pointer active:scale-95"
                        title="Increase Stock"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      {(item.status === 'Under Maintenance' || (item.condition && item.condition !== 'Functional' && item.condition !== 'Passed Inspection')) && (
                        <button
                          type="button"
                          onClick={() => handleRestoreItem(item.id, item.name)}
                          className="neu-btn-raised min-h-[44px] px-3 py-1.5 rounded-xl border border-emerald-500/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setQuickViewItem(item)}
                        className="neu-btn-raised min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-slate-600 dark:text-slate-400 flex items-center justify-center active:scale-95 cursor-pointer"
                        title="View Specs"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedItemToEdit(item)}
                        className="neu-btn-raised min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-cyan-600 dark:text-cyan-400 flex items-center justify-center active:scale-95 cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.name)}
                        className="neu-btn-raised min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-rose-600 dark:text-rose-400 flex items-center justify-center active:scale-95 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
      )}

      {/* 6. Card Grid View (Active only when viewMode === 'grid') */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-2">
          {paginatedItems.length === 0 ? (
            <div className="col-span-full p-10 rounded-3xl bg-[#08101d] border border-slate-800 text-center text-sm text-slate-500 space-y-2">
              <PackageCheck className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-bold text-slate-400">No equipment found matching criteria</p>
            </div>
          ) : (
            paginatedItems.map((item) => {
              const stockBadge = getStockBadge(item.stock);
              const labBadge = getLabBadgeStyle(item.lab);
              const isQuickEditing = editingStockId === item.id;
              const isM =
                item.status === 'Under Maintenance' ||
                (item.condition &&
                  item.condition !== 'Functional' &&
                  item.condition !== 'Passed Inspection');

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 ring-1 ring-inset ring-white/10 dark:ring-white/5 hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-150 space-y-3.5 shadow-xs flex flex-col justify-between group ${
                    isM ? 'border-rose-400 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20' : ''
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Tag Code & Department */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-cyan-300 bg-slate-100 dark:bg-[#0B0F19] px-2.5 py-0.5 rounded-lg border-2 border-slate-200 dark:border-slate-700 truncate">
                        {item.tagCode}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isM && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-400 animate-pulse">
                            MAINTENANCE
                          </span>
                        )}
                        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-lg border ${labBadge}`}>
                          {LAB_MAP[item.lab]?.short || item.lab}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3
                        onClick={() => setQuickViewItem(item)}
                        className="text-base font-bold text-slate-950 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors cursor-pointer leading-snug line-clamp-2"
                      >
                        {item.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description || 'Institutional engineering laboratory apparatus.'}
                      </p>
                    </div>

                    {/* Specifications Pill Grid */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                      <div className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 truncate flex items-center gap-1 font-semibold">
                        <MapPin className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span className="truncate">{item.room || 'Engineering Lab'}</span>
                      </div>
                      <div className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 truncate flex items-center gap-1 font-medium">
                        {isM ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                            <span className="truncate text-rose-700 dark:text-rose-400 font-bold">For Repair</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                            <span className="truncate font-semibold">{item.condition || 'Functional'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Command Strip */}
                  <div className="pt-3 border-t-2 border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    {/* Stock Stepper */}
                    {isQuickEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          value={editStockValue}
                          onChange={(e) => setEditStockValue(e.target.value)}
                          className="w-12 h-7 text-center font-mono rounded-lg bg-[#050b14] border border-cyan-500 text-cyan-300 text-xs focus:outline-none font-bold"
                          autoFocus
                        />
                        <button
                          onClick={() => saveQuickEditStock(item.id)}
                          className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={cancelQuickEditStock}
                          className="p-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-[#050b14] p-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleStepStock(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs active:scale-90 transition-transform cursor-pointer"
                          title="Decrease Stock"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => startQuickEditStock(item.id, item.stock)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black ${stockBadge.badge} hover:brightness-110 cursor-pointer`}
                          title="Click to type exact stock"
                        >
                          {item.stock} {item.unit || 'pcs'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStepStock(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs active:scale-90 transition-transform cursor-pointer"
                          title="Increase Stock"
                        >
                          +
                        </button>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {isM && (
                        <button
                          type="button"
                          onClick={() => handleRestoreItem(item.id, item.name)}
                          className="p-1.5 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                          title="Mark Repaired / Restore to Service"
                        >
                          <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setQuickViewItem(item)}
                        className="p-1.5 rounded-xl bg-[#0e172a] border border-slate-700/80 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedItemToEdit(item)}
                        className="p-1.5 rounded-xl bg-[#0e172a] border border-slate-700/80 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-colors cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-1.5 rounded-xl bg-[#0e172a] border border-slate-700/80 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 transition-colors cursor-pointer"
                        title="Delete Apparatus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 7. Fast Instant Pagination Toolbar */}
      {filteredAndSorted.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 pb-4 border-t border-slate-300 dark:border-white/10">
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span>
              Showing <strong className="text-cyan-600 dark:text-cyan-400 font-mono">
                {pageSize === 'ALL' ? 1 : (currentPage - 1) * Number(pageSize) + 1}
              </strong> - <strong className="text-cyan-600 dark:text-cyan-400 font-mono">
                {pageSize === 'ALL' ? filteredAndSorted.length : Math.min(currentPage * Number(pageSize), filteredAndSorted.length)}
              </strong> of <strong className="text-cyan-600 dark:text-cyan-400 font-mono">{filteredAndSorted.length}</strong> apparatus
            </span>

            <div className="flex items-center gap-1.5 neu-inset px-2.5 py-1 rounded-xl">
              <span className="text-[11px] text-slate-500 font-bold">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1 font-semibold"
              >
                <option value={25} className="bg-white dark:bg-[#111827]">25 / page</option>
                <option value={50} className="bg-white dark:bg-[#111827]">50 / page</option>
                <option value={100} className="bg-white dark:bg-[#111827]">100 / page</option>
                <option value="ALL" className="bg-white dark:bg-[#111827]">All (335)</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl neu-btn-raised text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Prev</span>
              </button>

              <div className="flex items-center gap-1 px-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                <span className="text-cyan-600 dark:text-cyan-400">{currentPage}</span>
                <span className="text-slate-400">/</span>
                <span>{totalPages}</span>
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl neu-btn-raised text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
              >
                <span className="hidden xs:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 8. Quick View Full Specifications Modal */}
      {quickViewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-lg rounded-3xl neu-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{quickViewItem.name}</h3>
                  <span className="text-xs font-mono text-cyan-600 dark:text-cyan-300 font-bold">{quickViewItem.tagCode}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickViewItem(null)}
                className="p-2 rounded-xl neu-btn-raised text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-2xl neu-inset space-y-2">
                <div className="flex justify-between"><span className="text-slate-500">Department:</span> <strong className="text-slate-900 dark:text-slate-200">{LAB_MAP[quickViewItem.lab]?.name} ({quickViewItem.lab})</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Room:</span> <strong className="text-cyan-600 dark:text-cyan-300">{quickViewItem.room || 'General Engineering'}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Category:</span> <strong className="text-slate-900 dark:text-slate-200">{quickViewItem.category || 'Apparatus'}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Available Stock:</span> <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{quickViewItem.stock} {quickViewItem.unit}s</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Condition:</span> <strong className="text-emerald-600 dark:text-emerald-400">{quickViewItem.condition || 'Functional'}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Safety Clearance:</span> <strong className="text-cyan-600 dark:text-cyan-400">{quickViewItem.safetyClearance || 'Safe for Use'}</strong></div>
                {quickViewItem.chedReq && (
                  <div className="flex justify-between"><span className="text-slate-500">CHED Requirement:</span> <strong className="text-amber-600 dark:text-amber-300 font-mono">{quickViewItem.chedReq}</strong></div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedItemToEdit(quickViewItem);
                  setQuickViewItem(null);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Equipment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add & Edit Modals */}
      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddItem}
      />
      <EditItemModal
        isOpen={!!selectedItemToEdit}
        item={selectedItemToEdit}
        onClose={() => setSelectedItemToEdit(null)}
        onSave={handleSaveFullEdit}
      />
    </div>
  );
}
