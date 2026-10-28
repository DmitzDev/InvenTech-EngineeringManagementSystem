import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Plus,
  ArrowLeft,
  AlertCircle,
  Calendar,
  ShoppingBag,
  X,
  ArrowUp,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import { getInventory, LAB_OPTIONS, getItemImage, isItemConsumable } from '../../data/equipmentData';
import BorrowCart from './BorrowCart';
import ReservationModal from './ReservationModal';

export default function EquipmentCatalog() {
  const {
    selectedLab,
    cart,
    addToCart,
    setStep,
    prepareTransactionReview,
    reservations,
    isCartDrawerOpen,
    openCartDrawer,
    closeCartDrawer,
    theme,
  } = useTransaction();

  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [mobileLabFilter, setMobileLabFilter] = useState('ALL'); // 'ALL' | 'CE' | 'CHEM' | 'DIGITAL' | 'ECE'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'compact'
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedItemForReservation, setSelectedItemForReservation] = useState(null);

  const scrollContainerRef = useRef(null);

  // Close search when clicking outside
  useEffect(() => {
    if (!isSearchOpen) return;

    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
        if (!searchQuery.trim()) {
          setSearchQuery('');
        }
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isSearchOpen, searchQuery]);

  // Reset filter and search on lab change
  useEffect(() => {
    setMobileLabFilter('ALL');
    setActiveCategory('ALL');
    setSearchQuery('');
    setIsSearchOpen(false);
  }, [selectedLab]);

  // Get live inventory from shared storage
  const allEquipment = useMemo(() => getInventory(), []);

  // Get current laboratory info
  const currentLabInfo = useMemo(() => {
    return (
      LAB_OPTIONS.find((l) => l.id === selectedLab) || {
        name: 'Engineering Laboratory',
        shortName: 'Engr Lab',
      }
    );
  }, [selectedLab]);

  // Extract laboratory equipment with deduplication
  const labEquipment = useMemo(() => {
    if (!selectedLab) return allEquipment;
    let list = [];
    if (selectedLab === 'CE') {
      list = allEquipment.filter((item) => item.lab === 'CE');
    } else if (selectedLab === 'CHEM') {
      list = allEquipment.filter((item) => item.lab === 'CHEM');
    } else if (selectedLab === 'CE_CHEM') {
      list = allEquipment.filter((item) => item.lab === 'CE' || item.lab === 'CHEM');
    } else if (selectedLab === 'DIGITAL' || selectedLab === 'DIGITAL_ECE') {
      list = allEquipment.filter((item) => item.lab === 'DIGITAL' || item.lab === 'ECE');
    } else {
      list = allEquipment.filter((item) => item.lab === selectedLab);
    }

    const seenNames = new Set();
    const deduplicated = [];
    for (const item of list) {
      const normalizedKey = (item.name || '').trim().toLowerCase();
      if (!seenNames.has(normalizedKey)) {
        seenNames.add(normalizedKey);
        deduplicated.push(item);
      }
    }
    return deduplicated;
  }, [selectedLab, allEquipment]);

  // Sub-lab counts for fast filtering
  const subLabCounts = useMemo(() => {
    const ceCount = labEquipment.filter((i) => i.lab === 'CE').length;
    const chemCount = labEquipment.filter((i) => i.lab === 'CHEM').length;
    const digCount = labEquipment.filter((i) => i.lab === 'DIGITAL').length;
    const eceCount = labEquipment.filter((i) => i.lab === 'ECE').length;
    return { ceCount, chemCount, digCount, eceCount, total: labEquipment.length };
  }, [labEquipment]);

  // Filter by sub-lab
  const subLabFiltered = useMemo(() => {
    if (mobileLabFilter === 'ALL') return labEquipment;
    return labEquipment.filter((item) => item.lab === mobileLabFilter);
  }, [labEquipment, mobileLabFilter]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = ['ALL', ...new Set(subLabFiltered.map((item) => item.category))];
    return cats;
  }, [subLabFiltered]);

  // Filter equipment based on search and category
  const filteredEquipment = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return subLabFiltered.filter((item) => {
      const matchesCategory =
        activeCategory === 'ALL' || item.category === activeCategory;
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.tagCode.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [subLabFiltered, activeCategory, searchQuery]);

  // Group items by base name for structured variant selection across all labs
  const groupedEquipment = useMemo(() => {
    const groupsMap = new Map();

    for (const item of filteredEquipment) {
      let baseName = item.name;
      let variantLabel = null;

      const normName = item.name.trim();

      // 1. Digital & ECE: TTL Logic Gate ICs (7400, 7402, 7404, 7405, 7432, 7445, 7449, 7473, 7476, 7477, 74138, 74169)
      if (/^74(LS)?\d+/i.test(normName) || (normName.startsWith('74') && normName.length <= 7)) {
        baseName = 'TTL Logic Gate IC (74xx Series)';
        variantLabel = `IC ${normName}`;
      }
      // 2. Digital & ECE: BJT Transistors (2N2222A, 2N2907, 2N3904, 2N3906)
      else if (/^2N(2222|2907|3904|3906)/i.test(normName)) {
        baseName = 'BJT Small-Signal Transistor (2N Series)';
        variantLabel = normName;
      }
      // 3. Digital & ECE: TIP Power Transistors (TIP32, TIP41, TIP42)
      else if (/^TIP(32|41|42)/i.test(normName)) {
        baseName = 'TIP Power Transistor';
        variantLabel = normName;
      }
      // 4. Standard parentheses matching: Base Name (Variant Spec)
      else {
        const parenMatch = normName.match(/^(.+?)\s*\((.+?)\)$/);
        if (parenMatch) {
          baseName = parenMatch[1].trim();
          variantLabel = parenMatch[2].trim();
        }
      }

      const groupKey = `${item.lab}_${baseName.toLowerCase()}`;
      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          id: `group_${item.id}`,
          baseName,
          category: item.category,
          lab: item.lab,
          unit: item.unit || 'pc',
          variants: [],
        });
      }

      const group = groupsMap.get(groupKey);
      group.variants.push({
        ...item,
        variantLabel: variantLabel || item.name,
        hasExplicitVariant: Boolean(variantLabel),
      });
    }

    return Array.from(groupsMap.values());
  }, [filteredEquipment]);

  // ----------------------------------------------------------------------
  // Pagination State & Logic
  // ----------------------------------------------------------------------
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'compact' ? 12 : 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, mobileLabFilter, selectedLab, viewMode]);

  const totalPages = Math.max(1, Math.ceil(groupedEquipment.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedEquipment = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return groupedEquipment.slice(startIndex, startIndex + itemsPerPage);
  }, [groupedEquipment, currentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    scrollToTop();
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop > 180) {
      if (!showScrollTop) setShowScrollTop(true);
    } else {
      if (showScrollTop) setShowScrollTop(false);
    }
  };

  useEffect(() => {
    if (isCartDrawerOpen || selectedItemForReservation) {
      const origOverflow = document.body.style.overflow;
      const origPosition = document.body.style.position;
      const origTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = origOverflow;
        document.body.style.position = origPosition;
        document.body.style.touchAction = origTouchAction;
      };
    }
  }, [isCartDrawerOpen, selectedItemForReservation]);

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (item) => {
    addToCart(item);
  };

  const getItemCartQty = (id) => {
    const found = cart.find((i) => i.id === id);
    return found ? found.qty : 0;
  };

  const getItemActiveReservations = (itemId) => {
    return reservations.filter((r) => r.itemId === itemId);
  };

  const totalUnitsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="flex-1 max-w-[1720px] mx-auto w-full max-w-full overflow-x-hidden p-2 sm:p-3 lg:p-4 flex flex-col justify-between select-none min-h-0 relative">
      {/* 1. Master Control Toolbar: Change Lab + Instant Search + Filter Chips + View Switcher + Cart */}
      <div
        className={`p-2 sm:p-2.5 rounded-2xl border mb-2.5 flex flex-col gap-2 shrink-0 ${
          isDark
            ? 'bg-[#0f172a] border-slate-800 shadow-sm'
            : 'bg-white border-slate-300 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Left: Change Lab + Search Box + Desktop Chips Container */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
            {/* Change Lab Button */}
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-transform active:scale-[0.97] touch-manipulation cursor-pointer shrink-0 ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200/80'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Change Lab</span>
              <span className="sm:hidden">Lab</span>
            </button>

            {/* Expandable Search Button & Input Box */}
            <div ref={searchContainerRef} className="relative flex items-center shrink-0">
              {isSearchOpen ? (
                <div className="relative w-36 sm:w-60 md:w-72 lg:w-80 shrink-0 transition-all duration-200 ease-out">
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search apparatus..."
                    autoFocus
                    className={`w-full h-9 sm:h-10 pl-8 sm:pl-9 pr-7 sm:pr-8 rounded-xl text-xs sm:text-sm focus:outline-none transition-all ${
                      isDark
                        ? 'bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500 ring-1 ring-cyan-500/20'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white ring-1 ring-blue-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    title="Close search"
                    className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer rounded-lg transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(true);
                    setTimeout(() => searchInputRef.current?.focus(), 60);
                  }}
                  title="Search apparatus"
                  className={`h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl border flex items-center gap-1.5 transition-all active:scale-[0.97] touch-manipulation cursor-pointer shrink-0 ${
                    searchQuery
                      ? isDark
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-blue-50 border-blue-400 text-blue-900'
                      : isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-800 border-slate-300'
                  }`}
                >
                  <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="hidden sm:inline text-xs sm:text-sm font-bold">
                    {searchQuery ? `"${searchQuery}"` : 'Search'}
                  </span>
                  {searchQuery && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery('');
                      }}
                      className="ml-1 p-0.5 rounded-full hover:bg-rose-500 hover:text-white transition-colors"
                      title="Clear filter"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Desktop/Tablet Sub-Lab & Category Chips Container (Hidden on narrow mobile so it never clips) */}
            <div className="hidden sm:block flex-1 min-w-0 max-w-full overflow-hidden">
              <div className="flex items-center gap-1.5 overflow-x-auto touch-pan-x scroll-smooth py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(selectedLab === 'DIGITAL' || selectedLab === 'DIGITAL_ECE') && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {[
                      { id: 'ALL', label: `All (${subLabCounts.total})` },
                      { id: 'DIGITAL', label: `Consumables (${subLabCounts.digCount})` },
                      { id: 'ECE', label: `ECE Modules (${subLabCounts.eceCount})` },
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setMobileLabFilter(sub.id);
                          setActiveCategory('ALL');
                        }}
                        className={`h-10 px-3.5 rounded-xl text-xs font-bold shrink-0 transition-transform active:scale-[0.97] cursor-pointer border ${
                          mobileLabFilter === sub.id
                            ? isDark
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-xs'
                              : 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200/80'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}

                {selectedLab !== 'DIGITAL' &&
                  selectedLab !== 'DIGITAL_ECE' &&
                  categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`h-10 px-3.5 rounded-xl text-xs font-bold shrink-0 whitespace-nowrap transition-transform active:scale-[0.97] cursor-pointer border ${
                        activeCategory === cat
                          ? isDark
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-xs'
                            : 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : isDark
                          ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200/80'
                      }`}
                    >
                      {cat === 'ALL' ? `All (${subLabFiltered.length})` : cat}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Right: Universal Grid / List View Switcher & Borrow Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div
              className={`flex items-center gap-0.5 p-0.5 sm:p-1 rounded-xl border ${
                isDark
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-slate-200/80 border-slate-300'
              }`}
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Card Grid View"
                className={`p-1.5 sm:h-8 sm:px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? isDark
                      ? 'bg-cyan-500 text-slate-950 shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs border border-slate-300/80'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden lg:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                title="Compact List View"
                className={`p-1.5 sm:h-8 sm:px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'compact'
                    ? isDark
                      ? 'bg-cyan-500 text-slate-950 shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs border border-slate-300/80'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden lg:inline">List</span>
              </button>
            </div>

            {/* Borrow Cart Button */}
            <button
              type="button"
              onClick={openCartDrawer}
              className={`h-9 sm:h-10 px-2.5 sm:px-4 rounded-xl border flex items-center gap-1.5 sm:gap-2 transition-transform duration-75 ease-out active:scale-[0.97] touch-manipulation cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
              }`}
            >
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-white shadow-xs">
                <img src="/images/engrCartLogo.jpg" alt="Cart" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs sm:text-sm font-bold">Cart</span>
              <span
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-black shadow-xs ${
                  isDark ? 'bg-cyan-500 text-slate-950' : 'bg-white text-slate-900'
                }`}
              >
                {totalUnitsCount}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile-Only Filter Chips Row (Only shown when Digital/ECE sub-labs or multiple categories exist) */}
        {((selectedLab === 'DIGITAL' || selectedLab === 'DIGITAL_ECE') || categories.length > 2) && (
          <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto touch-pan-x scroll-smooth pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(selectedLab === 'DIGITAL' || selectedLab === 'DIGITAL_ECE') ? (
              [
                { id: 'ALL', label: `All (${subLabCounts.total})` },
                { id: 'DIGITAL', label: `Consumables (${subLabCounts.digCount})` },
                { id: 'ECE', label: `ECE (${subLabCounts.eceCount})` },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    setMobileLabFilter(sub.id);
                    setActiveCategory('ALL');
                  }}
                  className={`h-8 px-3 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer border ${
                    mobileLabFilter === sub.id
                      ? isDark
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                        : 'bg-slate-900 text-white border-slate-900'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {sub.label}
                </button>
              ))
            ) : (
              categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`h-8 px-3 rounded-lg text-[11px] font-bold shrink-0 whitespace-nowrap cursor-pointer border ${
                    activeCategory === cat
                      ? isDark
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                        : 'bg-slate-900 text-white border-slate-900'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {cat === 'ALL' ? `All (${subLabFiltered.length})` : cat}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* 2. High-Contrast Catalog Viewport (Recessed slate tray in Light Mode prevents white-on-white blending) */}
      <div
        id="equipment-scroll-area"
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-1 min-h-0 overflow-y-auto rounded-2xl p-2 sm:p-3 scroll-smooth border ${
          isDark
            ? 'bg-[#070b13] border-slate-800/80'
            : 'bg-slate-200/75 border-slate-300 shadow-inner'
        }`}
      >
        {groupedEquipment.length === 0 ? (
          <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-center p-6 space-y-2">
            <AlertCircle className={`w-8 h-8 sm:w-10 sm:h-10 mb-1 ${isDark ? 'text-slate-600' : 'text-slate-500'}`} />
            <p className={`text-sm sm:text-base font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              No apparatus found
            </p>
            <p className={`text-xs max-w-[240px] ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
              Try adjusting your search query or selecting another category.
            </p>
          </div>
        ) : viewMode === 'compact' ? (
          /* Compact List / Strip View (1-col on phone, 2-col on tablet, 3-col on desktop/kiosk) */
          <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
            {paginatedEquipment.map((group) => (
              <EquipmentCompactRow
                key={group.id}
                group={group}
                onAddToCart={handleAddToCart}
                onReserve={setSelectedItemForReservation}
                getItemCartQty={getItemCartQty}
                getItemActiveReservations={getItemActiveReservations}
                isDark={isDark}
              />
            ))}
          </div>
        ) : (
          /* Standard Card Grid View (2-col on phone, 3-col on tablet, 4-col on desktop/kiosk) */
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3.5">
            {paginatedEquipment.map((group) => (
              <EquipmentCard
                key={group.id}
                group={group}
                onAddToCart={handleAddToCart}
                onReserve={setSelectedItemForReservation}
                getItemCartQty={getItemCartQty}
                getItemActiveReservations={getItemActiveReservations}
                isDark={isDark}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Bottom Bar: Facility Title on Left + Truly Centered Pagination + Page Status on Right */}
      <div
        className={`shrink-0 py-1.5 sm:py-2.5 px-2 sm:px-3 border-t flex items-center justify-between sm:grid sm:grid-cols-3 gap-1.5 sm:gap-3 z-20 mt-2 rounded-xl border ${
          isDark
            ? 'bg-[#0a0e17]/95 border-slate-800/90'
            : 'bg-white border-slate-300 shadow-xs'
        }`}
      >
        {/* Left: Facility Title (Shortened on Mobile so pagination never overflows) */}
        <div className="flex items-center gap-2 shrink-0 min-w-0 justify-self-start">
          <span
            className={`text-[10.5px] sm:text-xs font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border tracking-wide uppercase truncate ${
              isDark
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                : 'bg-slate-100 text-slate-900 border-slate-300'
            }`}
          >
            <span className="sm:hidden">{currentLabInfo.shortName || currentLabInfo.name}</span>
            <span className="hidden sm:inline">{currentLabInfo.name}</span>
          </span>
          <span
            className={`hidden xl:inline text-xs font-semibold truncate ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            ({filteredEquipment.length} items)
          </span>
        </div>

        {/* Center / Right: Pagination Controls */}
        {totalPages > 1 ? (
          <>
            {/* Mobile (< sm): Compact 3-piece control */}
            <div className="flex sm:hidden items-center justify-end gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`h-8 px-2 rounded-xl border text-[11px] font-bold flex items-center gap-0.5 transition-all active:scale-95 touch-manipulation cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-white border-slate-300 text-slate-800 shadow-xs'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div
                className={`h-8 px-2 rounded-xl border flex items-center justify-center text-[11px] font-bold min-w-[54px] shadow-xs ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-slate-200'
                    : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <span className="text-blue-600 dark:text-cyan-400 font-extrabold mr-0.5">{currentPage}</span>
                <span className="text-slate-400 font-medium">/{totalPages}</span>
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`h-8 px-2 rounded-xl border text-[11px] font-bold flex items-center gap-0.5 transition-all active:scale-95 touch-manipulation cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-white border-slate-300 text-slate-800 shadow-xs'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Kiosk & Desktop (>= sm): Perfectly Centered in Middle Grid Column */}
            <div className="hidden sm:flex items-center justify-center gap-1.5 justify-self-center">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all touch-manipulation active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-xs text-slate-400 font-bold select-none">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePageChange(p)}
                      className={`h-9 min-w-[36px] px-2.5 rounded-xl text-xs font-bold transition-all touch-manipulation active:scale-[0.97] cursor-pointer border ${
                        currentPage === p
                          ? isDark
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-xs'
                            : 'bg-slate-900 text-white border-slate-900 font-black shadow-xs'
                          : isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all touch-manipulation active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden sm:block shrink-0 text-right justify-self-end">
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Page {currentPage} of {totalPages}
              </span>
            </div>
          </>
        ) : (
          <div className={`text-xs font-semibold sm:col-span-2 text-right ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Showing all {groupedEquipment.length} apparatus
          </div>
        )}
      </div>

      {/* Floating Scroll to Top Quick Jump Button (Phone View Only) */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          title="Scroll back to top"
          className="sm:hidden fixed bottom-20 right-5 z-40 w-10 h-10 rounded-full bg-slate-900 border border-slate-700 text-white shadow-xl flex items-center justify-center active:scale-95 cursor-pointer"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Slide-Over Cart Drawer */}
      {isCartDrawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-stretch justify-center md:justify-end animate-fade-in touch-none">
            <div className="absolute inset-0 cursor-pointer" onClick={closeCartDrawer} />
            <div
              className={`relative z-10 w-full max-h-[85vh] h-auto rounded-t-2xl md:rounded-none md:rounded-l-3xl md:h-full md:max-h-[100dvh] md:max-w-lg ${
                isDark ? 'bg-[#0e1422] border-slate-800' : 'bg-slate-50 border-slate-300 shadow-2xl'
              } border-t md:border-t-0 md:border-l shadow-2xl flex flex-col animate-slide-up md:animate-slide-left overflow-hidden`}
            >
              <BorrowCart
                onClose={closeCartDrawer}
                onProceed={() => {
                  closeCartDrawer();
                  prepareTransactionReview();
                }}
              />
            </div>
          </div>,
          document.body
        )}

      {/* Equipment Advance Reservation Modal */}
      {selectedItemForReservation && (
        <ReservationModal
          item={selectedItemForReservation}
          isOpen={Boolean(selectedItemForReservation)}
          onClose={() => setSelectedItemForReservation(null)}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Helper: Clean Institutional Lab Badge Colors
// ----------------------------------------------------------------------
const getLabAccent = (lab, isDark = true) => {
  if (!isDark) {
    switch (lab) {
      case 'DIGITAL':
        return 'bg-sky-50 text-sky-900 border-sky-300';
      case 'ECE':
        return 'bg-indigo-50 text-indigo-900 border-indigo-300';
      case 'CE':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case 'CHEM':
        return 'bg-emerald-50 text-emerald-900 border-emerald-300';
      case 'PHYSICS':
        return 'bg-rose-50 text-rose-900 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  }

  switch (lab) {
    case 'DIGITAL':
      return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    case 'ECE':
      return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    case 'CE':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'CHEM':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'PHYSICS':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
};

// ----------------------------------------------------------------------
// 1. EquipmentCard: Clean, Uncluttered High-Contrast Grid Card
// ----------------------------------------------------------------------
function EquipmentCard({ group, onAddToCart, onReserve, getItemCartQty, getItemActiveReservations, isDark = false }) {
  const [selectedVariantId, setSelectedVariantId] = useState(group.variants[0].id);

  const currentItem = useMemo(() => {
    return group.variants.find((v) => v.id === selectedVariantId) || group.variants[0];
  }, [group, selectedVariantId]);

  const inCartQty = getItemCartQty(currentItem.id);
  const totalGroupInCart = group.variants.reduce((sum, v) => sum + getItemCartQty(v.id), 0);
  const itemImg = getItemImage(currentItem);
  const activeReservations = getItemActiveReservations(currentItem.id);
  const totalReservedQty = activeReservations.reduce((sum, r) => sum + (r.quantity || 1), 0);

  const totalStock = currentItem.stock || 10;
  const isMaintenance =
    currentItem.status === 'Under Maintenance' ||
    (currentItem.condition && currentItem.condition !== 'Functional' && currentItem.condition !== 'Passed Inspection');
  const availableStock = Math.max(0, totalStock - inCartQty);
  const isOutOfStock = availableStock === 0 || isMaintenance;
  const isAllInCart = inCartQty > 0 && availableStock === 0 && !isMaintenance;
  const isLowStock = !isMaintenance && availableStock > 0 && availableStock <= 3;

  const labBadgeClass = getLabAccent(currentItem.lab, isDark);

  const displayTitle =
    group.variants.length === 1 && currentItem.hasExplicitVariant
      ? currentItem.name
      : group.baseName;

  return (
    <div
      className={`group relative rounded-xl p-2 sm:p-3 flex flex-col justify-between text-left select-none touch-manipulation transition-all duration-150 ${
        isDark
          ? 'bg-[#111827] border border-slate-800 hover:border-slate-700 shadow-md'
          : 'bg-white border border-slate-300 hover:border-slate-400 shadow-sm hover:shadow-md'
      } ${
        isMaintenance
          ? 'opacity-80 border-rose-500/40'
          : totalGroupInCart > 0
          ? isDark
            ? 'ring-2 ring-cyan-400 border-cyan-400'
            : 'ring-2 ring-blue-600 border-blue-600'
          : ''
      }`}
    >
      <div>
        {/* 1. Framed Image Stage with Single Bottom-Left Stock Capsule (No Top-Right Clutter) */}
        <div
          className={`relative w-full aspect-[4/3] rounded-lg overflow-hidden mb-2 flex items-center justify-center border ${
            isDark
              ? 'bg-[#080d16] border-slate-800/90'
              : 'bg-slate-100 border-slate-200'
          }`}
        >
          {itemImg ? (
            <img
              key={itemImg}
              src={itemImg}
              alt={currentItem.name}
              className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${
                isDark ? 'text-slate-600 bg-slate-900/50' : 'text-slate-400 bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-8 h-8" />
            </div>
          )}

          {/* Bottom-Left Stock Capsule */}
          <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 z-10 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-slate-950/90 backdrop-blur-md border border-white/15 text-white font-sans text-[10px] sm:text-[11px] font-bold pointer-events-none shadow-xs">
            <span
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${
                isMaintenance || isOutOfStock
                  ? 'bg-rose-400'
                  : isAllInCart
                  ? 'bg-sky-400'
                  : isLowStock
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="truncate">
              {isMaintenance
                ? 'Under Repair'
                : isAllInCart
                ? `Max (${inCartQty})`
                : isOutOfStock
                ? 'Out of stock'
                : `${availableStock} avail`}
            </span>
            {totalReservedQty > 0 && !isMaintenance && (
              <span className="text-[10px] shrink-0 font-semibold text-amber-300">
                • {totalReservedQty} rsv
              </span>
            )}
          </div>
        </div>

        {/* 2. Single-Line Metadata Row (Full Tag Code on Desktop, Short Tag on Mobile so it never shows '...') */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <span
            className={`font-mono text-[9.5px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded border truncate ${
              isDark
                ? 'bg-slate-900 text-slate-300 border-slate-800'
                : 'bg-slate-100 text-slate-700 border-slate-200/90'
            }`}
            title={currentItem.tagCode}
          >
            <span className="sm:hidden">
              {(currentItem.tagCode || '').replace(/^ENG-EQ-/, '')}
            </span>
            <span className="hidden sm:inline">{currentItem.tagCode}</span>
          </span>

          <span className={`text-[9.5px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded uppercase border shrink-0 ${labBadgeClass}`}>
            {currentItem.lab}
          </span>
        </div>

        {/* 3. Apparatus Title */}
        <h3
          className={`text-xs sm:text-sm font-bold leading-snug line-clamp-1 mt-1 ${
            isDark ? 'text-slate-100' : 'text-slate-900'
          }`}
          title={displayTitle}
        >
          {displayTitle}
        </h3>

        {/* 4. Variant Dropdown ONLY if item has multiple specs; clean subtitle if single item */}
        {group.variants.length > 1 ? (
          <div className="mt-1.5 relative">
            <select
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              className={`w-full h-7 sm:h-8 pl-2 sm:pl-2.5 pr-6 sm:pr-7 rounded-lg text-[11px] sm:text-xs font-bold appearance-none cursor-pointer focus:outline-none transition-colors truncate border ${
                isDark
                  ? 'bg-[#090e17] border-slate-700 text-cyan-300 focus:border-cyan-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 hover:border-slate-400 focus:border-blue-600'
              }`}
            >
              {group.variants.map((v) => {
                const vQty = getItemCartQty(v.id);
                const vStock = v.stock || 10;
                const vAvail = Math.max(0, vStock - vQty);
                return (
                  <option
                    key={v.id}
                    value={v.id}
                    className={isDark ? 'bg-[#131b28] text-slate-100' : 'bg-white text-slate-900'}
                  >
                    {v.variantLabel} • {vAvail === 0 ? 'Out of stock' : `${vAvail} left`}{' '}
                    {vQty > 0 ? `(${vQty} in cart)` : ''}
                  </option>
                );
              })}
            </select>
            <ChevronDown
              className={`w-3.5 h-3.5 absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            />
          </div>
        ) : (
          <p
            className={`text-[10.5px] sm:text-xs truncate mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {currentItem.category}
          </p>
        )}
      </div>

      {/* 5. Card Footer: Action Buttons */}
      <div
        className={`mt-2 sm:mt-2.5 pt-2 sm:pt-2.5 border-t flex items-center gap-1 sm:gap-2 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <button
          type="button"
          disabled={isMaintenance}
          onClick={() => onReserve(currentItem)}
          className={`h-8 sm:h-9 px-2 sm:px-3 rounded-lg flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0 font-bold text-xs border ${
            isDark
              ? 'bg-slate-800/90 hover:bg-slate-800 text-amber-300 border-slate-700'
              : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
          }`}
          title={isMaintenance ? 'Item Locked' : 'Reserve Equipment in Advance'}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reserve</span>
        </button>

        <button
          type="button"
          onClick={() => onAddToCart(currentItem)}
          disabled={isOutOfStock || isAllInCart || isMaintenance}
          className={`flex-1 h-8 sm:h-9 text-[11px] sm:text-xs font-bold px-2 sm:px-3 rounded-lg transition-transform touch-manipulation flex items-center justify-center gap-1 sm:gap-1.5 active:scale-[0.97] cursor-pointer ${
            isMaintenance || isOutOfStock || isAllInCart
              ? isDark
                ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-400 border border-slate-700'
                : 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-300'
              : inCartQty > 0
              ? isDark
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-xs'
                : 'bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs'
              : isDark
              ? 'bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs'
              : 'bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs'
          }`}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
          <span className="truncate">
            {isMaintenance
              ? 'Locked'
              : isAllInCart
              ? 'Max'
              : isOutOfStock
              ? '0 Stock'
              : inCartQty > 0
              ? `Add (${inCartQty})`
              : 'Add'}
          </span>
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. EquipmentCompactRow: High-Contrast List / Compact Card View
// ----------------------------------------------------------------------
function EquipmentCompactRow({ group, onAddToCart, onReserve, getItemCartQty, isDark = false }) {
  const [selectedVariantId, setSelectedVariantId] = useState(group.variants[0]?.id);
  const currentItem = group.variants.find((v) => v.id === selectedVariantId) || group.variants[0];

  const inCartQty = getItemCartQty(currentItem.id);
  const totalGroupInCart = group.variants.reduce((sum, v) => sum + getItemCartQty(v.id), 0);
  const totalStock = currentItem.stock || 0;
  const isMaintenance =
    currentItem.status === 'Under Maintenance' ||
    (currentItem.condition && currentItem.condition !== 'Functional' && currentItem.condition !== 'Passed Inspection');
  const availableStock = Math.max(0, totalStock - inCartQty);
  const isOutOfStock = totalStock <= 0 || isMaintenance;
  const isAllInCart = inCartQty >= totalStock && totalStock > 0 && !isMaintenance;
  const isLowStock = !isMaintenance && availableStock > 0 && availableStock <= 3;
  const itemImg = getItemImage(currentItem);

  const labBadgeClass = getLabAccent(currentItem.lab, isDark);
  const displayTitle =
    group.variants.length === 1 && currentItem.hasExplicitVariant
      ? currentItem.name
      : group.baseName;

  return (
    <div
      className={`rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-3 transition-all select-none touch-manipulation ${
        isDark
          ? 'bg-[#111827] border border-slate-800 hover:border-slate-700 shadow-sm'
          : 'bg-white border border-slate-300 hover:border-slate-400 shadow-sm'
      } ${
        isMaintenance
          ? 'border-rose-500/40 opacity-80'
          : totalGroupInCart > 0
          ? isDark
            ? 'ring-2 ring-cyan-400 border-cyan-400'
            : 'ring-2 ring-blue-600 border-blue-600'
          : ''
      }`}
    >
      {/* Left: Framed Thumbnail + Structured Label Stack */}
      <div className="min-w-0 flex-1 flex items-center gap-3">
        {itemImg && (
          <div
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-lg shrink-0 overflow-hidden flex items-center justify-center border ${
              isDark ? 'bg-[#080d16] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <img
              key={itemImg}
              src={itemImg}
              alt={currentItem.name}
              className="w-full h-full object-cover object-center"
              loading="lazy"
            />
          </div>
        )}

        <div className="min-w-0 flex-1 flex flex-col">
          {/* Row 1: Title */}
          <h4
            className={`text-xs sm:text-sm font-bold truncate leading-tight ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
            title={displayTitle}
          >
            {displayTitle}
          </h4>

          {/* Row 2: Tag + Lab + Stock Indicator */}
          <div className="flex items-center gap-1.5 mt-1 flex-nowrap overflow-hidden">
            <span
              className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold border truncate shrink-0 ${
                isDark
                  ? 'text-slate-300 bg-slate-900 border-slate-800'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <span className="sm:hidden">
                {(currentItem.tagCode || '').replace(/^ENG-EQ-/, '')}
              </span>
              <span className="hidden sm:inline">{currentItem.tagCode}</span>
            </span>

            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 border ${labBadgeClass}`}>
              {currentItem.lab}
            </span>

            <span className="text-[11px] font-bold truncate flex items-center gap-1 ml-0.5 shrink-0">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isMaintenance || isOutOfStock
                    ? 'bg-rose-500'
                    : isAllInCart
                    ? 'bg-sky-500'
                    : isLowStock
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
              />
              <span
                className={
                  isMaintenance || isOutOfStock
                    ? isDark
                      ? 'text-rose-400'
                      : 'text-rose-700'
                    : isLowStock
                    ? isDark
                      ? 'text-amber-300'
                      : 'text-amber-800'
                    : isDark
                    ? 'text-slate-300'
                    : 'text-slate-700'
                }
              >
                {isMaintenance
                  ? 'Repair'
                  : isAllInCart
                  ? `Max (${inCartQty})`
                  : isOutOfStock
                  ? '0 stock'
                  : `${availableStock} avail`}
              </span>
            </span>
          </div>

          {/* Row 3: Variant Selector if multi-variant */}
          {group.variants.length > 1 && (
            <div className="mt-1.5 relative max-w-[210px]">
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className={`w-full h-7 pl-2 pr-6 rounded-md text-[11px] font-bold appearance-none cursor-pointer focus:outline-none truncate border ${
                  isDark
                    ? 'bg-[#090e17] border-slate-700 text-cyan-300'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {group.variants.map((v) => {
                  const vQty = getItemCartQty(v.id);
                  const vStock = v.stock || 10;
                  const vAvail = Math.max(0, vStock - vQty);
                  return (
                    <option
                      key={v.id}
                      value={v.id}
                      className={isDark ? 'bg-[#131b28] text-slate-200' : 'bg-white text-slate-900'}
                    >
                      {v.variantLabel} • {vAvail} left {vQty > 0 ? `(${vQty})` : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown
                className={`w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          disabled={isMaintenance}
          onClick={() => onReserve(currentItem)}
          className={`h-9 px-2.5 rounded-lg flex items-center justify-center active:scale-[0.97] transition-transform touch-manipulation shrink-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer font-bold text-xs border ${
            isDark
              ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
              : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
          }`}
          title={isMaintenance ? 'Under Maintenance' : 'Reserve'}
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          disabled={isOutOfStock || isAllInCart || isMaintenance}
          onClick={() => onAddToCart(currentItem)}
          className={`h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-[0.97] transition-transform touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer ${
            isMaintenance || isOutOfStock || isAllInCart
              ? isDark
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : 'bg-slate-100 text-slate-400 border border-slate-300'
              : inCartQty > 0
              ? isDark
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'bg-blue-600 text-white font-bold'
              : isDark
              ? 'bg-blue-600 hover:bg-blue-500 text-white font-bold'
              : 'bg-slate-900 hover:bg-slate-800 text-white font-bold'
          }`}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{isMaintenance ? 'Locked' : isAllInCart ? 'Max' : isOutOfStock ? '0' : 'Add'}</span>
          {inCartQty > 0 && !isMaintenance && <span className="text-[10px] font-extrabold">({inCartQty})</span>}
        </button>
      </div>
    </div>
  );
}
