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
import TouchButton from '../ui/TouchButton';
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
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [mobileLabFilter, setMobileLabFilter] = useState('ALL'); // 'ALL' | 'CE' | 'CHEM'
  const [mobileViewMode, setMobileViewMode] = useState('grid'); // 'grid' | 'compact'
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedItemForReservation, setSelectedItemForReservation] = useState(null);

  const scrollContainerRef = useRef(null);

  // Get live inventory from shared storage
  const allEquipment = useMemo(() => getInventory(), []);

  // Get current laboratory info
  const currentLabInfo = useMemo(() => {
    return (
      LAB_OPTIONS.find((l) => l.id === selectedLab) || {
        name: 'Civil & Chemistry Lab',
        shortName: 'Civil & Chem',
      }
    );
  }, [selectedLab]);

  // Extract laboratory equipment with deduplication
  const labEquipment = useMemo(() => {
    if (!selectedLab) return allEquipment;
    let list = [];
    if (selectedLab === 'CE_CHEM' || selectedLab === 'CE' || selectedLab === 'CHEM') {
      list = allEquipment.filter((item) => item.lab === 'CE' || item.lab === 'CHEM');
    } else if (selectedLab === 'DIGITAL_ECE') {
      list = allEquipment.filter((item) => item.lab === 'DIGITAL' || item.lab === 'ECE');
    } else {
      list = allEquipment.filter((item) => item.lab === selectedLab);
    }

    // Deduplicate items with identical or equivalent names
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

  // Sub-lab counts for fast phone filtering
  const subLabCounts = useMemo(() => {
    const ceCount = labEquipment.filter((i) => i.lab === 'CE').length;
    const chemCount = labEquipment.filter((i) => i.lab === 'CHEM').length;
    const digCount = labEquipment.filter((i) => i.lab === 'DIGITAL').length;
    const eceCount = labEquipment.filter((i) => i.lab === 'ECE').length;
    return { ceCount, chemCount, digCount, eceCount, total: labEquipment.length };
  }, [labEquipment]);

  // Filter by mobile sub-lab
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
    return subLabFiltered.filter((item) => {
      const matchesCategory =
        activeCategory === 'ALL' || item.category === activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tagCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [subLabFiltered, activeCategory, searchQuery]);

  // Group items by base name for clean variant selection (Chemistry, Civil, Digital & ECE)
  const groupedEquipment = useMemo(() => {
    const groupsMap = new Map();

    for (const item of filteredEquipment) {
      let baseName = item.name;
      let variantLabel = null;

      const normName = item.name.trim();

      // 0. Digital & ECE: TTL Logic Gate ICs (7400, 7402, 7404, 7405, 7432, 7445, 7449, 7473, 7476, 7477, 7485, 7490, 74138, 74169, 74LS...)
      if (/^74(LS)?\d+/i.test(normName) || (normName.startsWith('74') && normName.length <= 7)) {
        baseName = 'TTL Logic Gate IC (74xx Series)';
        variantLabel = normName;
      }
      // 1. Digital & ECE: LEDs (Red, Blue, Green, Transparent, Standard 5mm)
      else if (/^LED\s+/i.test(normName) || normName.toUpperCase() === 'LED STD SIZE' || normName.toUpperCase().startsWith('LED ')) {
        baseName = 'LED (Light Emitting Diode)';
        let clean = normName.replace(/^LED\s*/i, '').trim().toUpperCase();
        if (clean === 'RED') variantLabel = 'Red';
        else if (clean === 'BLU' || clean === 'BLUE') variantLabel = 'Blue';
        else if (clean === 'GRN' || clean === 'GREEN') variantLabel = 'Green';
        else if (clean === 'TRANSP' || clean === 'CLEAR') variantLabel = 'Transparent';
        else if (clean === 'STD SIZE' || clean === 'STANDARD') variantLabel = 'Standard 5mm';
        else variantLabel = clean || '5mm';
      }
      // 2. Digital & ECE: Electrolytic Capacitors (50V)
      else if (/^\d+(\.\d+)?\s*UF\/50/i.test(normName)) {
        baseName = 'Electrolytic Capacitor (50V)';
        variantLabel = normName.replace(/\/50V?/i, '').trim();
      }
      // 3. Digital & ECE: AC/DC High Voltage Capacitors (450V)
      else if (/^\d+(\.\d+)?\s*(UFD|UF)\/450V?/i.test(normName)) {
        baseName = 'High-Voltage Capacitor (450V)';
        variantLabel = normName.replace(/\/450V?/i, '').replace('UFD', 'µF').replace('UF', 'µF').trim();
      }
      // 4. Digital & ECE: Push Button Switches (NO vs NC)
      else if (/^PB\s*SW/i.test(normName)) {
        baseName = 'Push Button Switch';
        variantLabel = normName.toUpperCase().includes('NO') ? 'NO (Normally Open)' : 'NC (Normally Closed)';
      }
      // 5. Digital & ECE: BJT Transistors (2N2222A, 2N2907, 2N3904, 2N3906)
      else if (/^2N(2222|2907|3904|3906)/i.test(normName)) {
        baseName = 'BJT Small Signal Transistor (2N Series)';
        variantLabel = normName;
      }
      // 6. Digital & ECE: TIP Power Transistors (TIP32, TIP41, TIP42)
      else if (/^TIP(32|41|42)/i.test(normName)) {
        baseName = 'TIP Power Transistor';
        variantLabel = normName;
      }
      // 7. Digital & ECE: Rectifier Diodes (10A10, 1N5402)
      else if (/DIODE/i.test(normName) && (/10A10/i.test(normName) || /1N5402/i.test(normName) || /1N400/i.test(normName))) {
        baseName = 'Silicon Rectifier Diode';
        variantLabel = normName.replace(/DIODE/i, '').trim();
      }
      // 8. Digital & ECE: Infrared Sensors (IRRX, IRTX)
      else if (normName.toUpperCase() === 'IRRX' || normName.toUpperCase() === 'IRTX') {
        baseName = 'Infrared IR Sensor Pair';
        variantLabel = normName.toUpperCase() === 'IRRX' ? 'Receiver (RX)' : 'Transmitter (TX)';
      }
      // 9. Standard parentheses matching: Name (Variant)
      else {
        const parenMatch = normName.match(/^(.+?)\s*\((.+?)\)$/);
        if (parenMatch) {
          baseName = parenMatch[1].trim();
          variantLabel = parenMatch[2].trim();
        } else if (normName.toLowerCase().startsWith('moisture cans')) {
          baseName = 'Moisture Cans';
          variantLabel = normName.toLowerCase().includes('w/o') ? 'Without Lid' : 'With Lid';
        } else if (normName.toLowerCase().startsWith('graduated cylinder') && (normName.includes('1000') || normName.includes('500'))) {
          baseName = 'Graduated Cylinder';
          variantLabel = normName.includes('1000') ? '1000 ml' : '500 ml';
        } else if (normName.toLowerCase().startsWith('crucible') && normName.toLowerCase().includes('cover')) {
          baseName = 'Crucible';
          variantLabel = 'w/ Cover';
        }
      }

      const groupKey = `${item.lab}_${baseName.toLowerCase()}`;
      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          id: `group_${item.id}`,
          baseName,
          category: item.category,
          lab: item.lab,
          unit: item.unit,
          variants: [],
        });
      }

      const group = groupsMap.get(groupKey);
      group.variants.push({
        ...item,
        variantLabel: variantLabel || item.name,
      });
    }

    return Array.from(groupsMap.values());
  }, [filteredEquipment]);

  // ----------------------------------------------------------------------
  // Pagination State & Logic
  // ----------------------------------------------------------------------
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = mobileViewMode === 'compact' ? 10 : 12;

  // Auto-reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, mobileLabFilter, selectedLab]);

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

  // Handle scroll detection for back-to-top floating button on phone
  const handleScroll = (e) => {
    if (e.target.scrollTop > 180) {
      if (!showScrollTop) setShowScrollTop(true);
    } else {
      if (showScrollTop) setShowScrollTop(false);
    }
  };

  // Lock background body scrolling when cart drawer or modal is open
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
    <div className="flex-1 max-w-[1720px] mx-auto w-full max-w-full overflow-x-hidden p-2.5 sm:p-4 lg:p-5 flex flex-col justify-between select-none min-h-0 relative">
      {/* 1. Top Department Breadcrumb & Mobile View Controls */}
      <div className={`flex flex-col gap-1.5 sm:gap-2 pb-2 mb-1.5 border-b shrink-0 ${
        isDark ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <div className="flex items-center justify-between gap-2">
          {/* Left: Change Lab Breadcrumb */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <TouchButton
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={() => setStep(2)}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-bold shrink-0"
            >
              Change Lab
            </TouchButton>
            <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>|</span>
            <div className="flex items-center gap-1.5 truncate">
              <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-full shrink-0 ${
                isDark ? 'text-cyan-400 neu-inset-sm' : 'bg-blue-50 text-blue-800 border border-blue-200/60 font-semibold'
              }`}>
                {currentLabInfo.shortName}
              </span>
              <span className={`text-xs font-bold hidden md:inline truncate ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {currentLabInfo.name}
              </span>
            </div>
          </div>

          {/* Phone-Only: View Mode Toggle (Grid vs Ultra-Compact List Strip) */}
          <div className={`sm:hidden flex items-center gap-1 p-1 rounded-xl shrink-0 ${
            isDark ? 'neu-inset' : 'bg-slate-100 border border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setMobileViewMode('grid')}
              title="2-Column Grid View"
              className={`p-1.5 rounded-lg transition-all ${mobileViewMode === 'grid'
                  ? 'neu-btn-primary text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode('compact')}
              title="Compact Single-Line List View (Faster Scrolling)"
              className={`p-1.5 rounded-lg transition-all ${mobileViewMode === 'compact'
                  ? 'neu-btn-primary text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Fast Search & Category Filter Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-2.5 w-full">
          {/* Instant Search Box */}
          <div className="relative w-full sm:w-60 md:w-64 lg:w-80 shrink-0">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-slate-400' : 'text-slate-400'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apparatus..."
              className={`w-full min-h-[36px] sm:min-h-[40px] pl-9 pr-8 rounded-xl text-xs sm:text-sm focus:outline-none transition-all ${
                isDark
                  ? 'neu-inset text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-white'
                  : 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-xs p-1 ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Chips (ALL, APPARATUS, INSTRUMENTS, CONSUMABLES...) */}
          <div className="w-full sm:flex-1 min-w-0 max-w-full overflow-hidden">
            <div className="flex items-center gap-2 w-full max-w-full overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain scroll-smooth py-1 px-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`min-h-[36px] sm:min-h-[40px] px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap active:scale-95 transition-transform duration-75 ease-out touch-manipulation cursor-pointer flex items-center justify-center ${
                      isActive
                        ? isDark
                          ? 'neu-btn-primary shadow-md text-slate-950 font-black'
                          : 'bg-slate-900 text-white shadow-sm font-semibold'
                        : isDark
                        ? 'neu-btn-raised text-slate-300 hover:text-white font-medium'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Dedicated Borrow Cart Button (Responsive on all screen sizes) */}
          <div className="flex sm:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={openCartDrawer}
              className={`w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 min-h-[38px] sm:min-h-[40px] rounded-xl transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                isDark
                  ? 'neu-btn-raised text-slate-100 hover:text-white shadow-md'
                  : 'bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 shadow-xs'
              }`}
              title="Open Borrow Cart"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-white shadow-xs">
                <img
                  src="/images/engrCartLogo.jpg"
                  alt="Engineering Cart"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs sm:text-sm font-bold">Cart</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold shadow-xs ${
                isDark ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-900 text-white font-bold'
              }`}>
                {totalUnitsCount}
              </span>
            </button>
          </div>
        </div>

        {/* 3. Sub-Lab Switcher Pills Placed Directly Below Search Bar on Phone */}
        {selectedLab === 'CE_CHEM' && (
          <div className="sm:hidden w-full max-w-full overflow-hidden">
            <div className="flex items-center gap-2 w-full max-w-full overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain scroll-smooth py-1 px-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => {
                  setMobileLabFilter('ALL');
                  setActiveCategory('ALL');
                }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap active:scale-95 transition-transform duration-75 ease-out touch-manipulation ${mobileLabFilter === 'ALL'
                    ? isDark ? 'bg-cyan-500 text-slate-950 font-black shadow-sm' : 'bg-slate-900 text-white font-semibold shadow-sm'
                    : isDark ? 'neu-btn-raised text-slate-300' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
              >
                ALL ITEMS ({subLabCounts.total})
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileLabFilter('CE');
                  setActiveCategory('ALL');
                }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap active:scale-95 transition-transform duration-75 ease-out touch-manipulation ${mobileLabFilter === 'CE'
                    ? isDark ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : isDark ? 'neu-btn-raised text-amber-300' : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
                  }`}
              >
                Civil Lab ({subLabCounts.ceCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileLabFilter('CHEM');
                  setActiveCategory('ALL');
                }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap active:scale-95 transition-transform duration-75 ease-out touch-manipulation ${mobileLabFilter === 'CHEM'
                    ? isDark ? 'bg-emerald-500 text-slate-950 font-black shadow-sm' : 'bg-emerald-600 text-white font-bold shadow-sm'
                    : isDark ? 'neu-btn-raised text-emerald-300' : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                  }`}
              >
                Chemistry Lab ({subLabCounts.chemCount})
              </button>
            </div>
          </div>
        )}

        {selectedLab === 'DIGITAL_ECE' && (
          <div className="sm:hidden w-full max-w-full overflow-hidden">
            <div className="flex items-center gap-2 w-full max-w-full overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain scroll-smooth py-1 px-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => {
                  setMobileLabFilter('ALL');
                  setActiveCategory('ALL');
                }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap active:scale-95 transition-transform duration-75 ease-out touch-manipulation ${mobileLabFilter === 'ALL'
                    ? isDark ? 'bg-cyan-500 text-slate-950 font-black shadow-sm' : 'bg-slate-900 text-white font-semibold shadow-sm'
                    : isDark ? 'neu-btn-raised text-slate-300' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
              >
                ALL ITEMS ({subLabCounts.total})
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileLabFilter('DIGITAL');
                  setActiveCategory('ALL');
                }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap active:scale-95 transition-transform duration-75 ease-out touch-manipulation ${mobileLabFilter === 'DIGITAL'
                    ? isDark ? 'bg-cyan-500 text-slate-950 font-black shadow-sm' : 'bg-slate-900 text-white font-semibold shadow-sm'
                    : isDark ? 'neu-btn-raised text-cyan-300' : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-50'
                  }`}
              >
                Digital Lab ({subLabCounts.digCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileLabFilter('ECE');
                  setActiveCategory('ALL');
                }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap active:scale-95 transition-transform duration-75 ease-out touch-manipulation ${mobileLabFilter === 'ECE'
                    ? isDark ? 'bg-indigo-500 text-slate-950 font-black shadow-sm' : 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : isDark ? 'neu-btn-raised text-indigo-300' : 'bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-50'
                  }`}
              >
                ECE / Circuits ({subLabCounts.eceCount})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Fast Catalog Grid / Compact View (Ultra-fast scrolling on mobile, 4-columns on 15" kiosk/desktop) */}
      <div
        id="equipment-scroll-area"
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto pr-1 pb-28 md:pb-6 scroll-smooth"
      >
        {groupedEquipment.length === 0 ? (
          <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-slate-600 mb-1" />
            <p className="text-sm sm:text-base font-bold text-slate-300">No apparatus found</p>
            <p className="text-xs text-slate-500 max-w-[240px]">
              Try adjusting your search query or selecting another category.
            </p>
          </div>
        ) : (
          <>
            {mobileViewMode === 'compact' ? (
              /* Mobile Ultra-Compact Row Strip View (Fits 8-10 items per screen height) */
              <div className="space-y-1.5 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 sm:gap-4 sm:space-y-0">
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
              /* Standard 2-Column Fast Phone Grid / 4-Column Kiosk Grid */
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-4">
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
          </>
        )}
      </div>

      {/* 5. Fixed / Sticky Pagination Bar (NOT included in scrolling - always docked at bottom for fast navigation!) */}
      {totalPages > 1 && (
        <div className={`shrink-0 pt-2.5 sm:pt-3 pb-1 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 z-20 ${
          isDark
            ? 'bg-[#0a0e17]/95 border-slate-800/90 backdrop-blur-sm'
            : 'bg-slate-100/95 border-slate-200/90 backdrop-blur-sm'
        }`}>
          {/* Information */}
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center sm:text-left">
            Pinapakita ang{' '}
            <span className="font-bold text-slate-900 dark:text-slate-200">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>
            –
            <span className="font-bold text-slate-900 dark:text-slate-200">
              {Math.min(currentPage * itemsPerPage, groupedEquipment.length)}
            </span>{' '}
            sa{' '}
            <span className="font-bold text-slate-900 dark:text-slate-200">
              {groupedEquipment.length}
            </span>{' '}
            kagamitan
            <span className="hidden sm:inline text-slate-400 dark:text-slate-500 ml-1.5">
              • Pahina {currentPage} ng {totalPages}
            </span>
          </div>

          {/* Page Action Controls */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`h-9 sm:h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all touch-manipulation active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-slate-400 font-bold select-none">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className={`h-9 sm:h-10 min-w-[36px] sm:min-w-[40px] px-2.5 rounded-xl text-xs font-bold transition-all touch-manipulation active:scale-[0.97] cursor-pointer ${
                      currentPage === p
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30 font-black'
                        : isDark
                        ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs'
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
              className={`h-9 sm:h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all touch-manipulation active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs'
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Scroll to Top Quick Jump Button (Phone View Only) */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          title="Scroll back to top"
          className="sm:hidden fixed bottom-20 right-5 z-40 w-10 h-10 rounded-full neu-btn-raised bg-[#0f172a] border border-cyan-500/30 text-cyan-400 shadow-xl flex items-center justify-center animate-fade-in active:scale-95 cursor-pointer"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* 5. Mobile Bottom Sheet / Desktop Slide-Over Cart Drawer */}
      {isCartDrawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-stretch justify-center md:justify-end animate-fade-in touch-none">
            {/* Overlay Click to Close */}
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={closeCartDrawer}
            />

            {/* Mobile Bottom Sheet (< md:) / Desktop Side Drawer (md:) Container */}
            <div className={`relative z-10 w-full max-h-[85vh] h-auto rounded-t-2xl md:rounded-none md:rounded-l-3xl md:h-full md:max-h-[100dvh] md:max-w-lg ${
              isDark ? 'bg-[#0e1422] border-slate-800' : 'bg-slate-50 border-slate-300 shadow-2xl'
            } border-t md:border-t-0 md:border-l shadow-2xl flex flex-col animate-slide-up md:animate-slide-left overflow-hidden`}>
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
}// ----------------------------------------------------------------------
// Helper: Professional Laboratory Accent System (Clean Institutional UI)
// ----------------------------------------------------------------------
const getLabAccent = (lab, isDark = true) => {
  if (!isDark) {
    // Light Mode: clean, crisp, high-contrast badges (NO orange or skyblue fonts!)
    switch (lab) {
      case 'DIGITAL':
        return {
          badge: 'bg-slate-100 text-slate-900 border-slate-300 font-black shadow-2xs',
          dot: 'bg-slate-900',
          activeRing: 'ring-slate-400 border-slate-400',
        };
      case 'ECE':
        return {
          badge: 'bg-indigo-100 text-indigo-950 border-indigo-300 font-black shadow-2xs',
          dot: 'bg-indigo-700',
          activeRing: 'ring-indigo-400 border-indigo-400',
        };
      case 'CE':
        return {
          badge: 'bg-amber-100 text-amber-950 border-amber-300 font-black shadow-2xs',
          dot: 'bg-amber-700',
          activeRing: 'ring-amber-400 border-amber-400',
        };
      case 'CHEM':
        return {
          badge: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-black shadow-2xs',
          dot: 'bg-emerald-700',
          activeRing: 'ring-emerald-400 border-emerald-400',
        };
      case 'PHYSICS':
        return {
          badge: 'bg-rose-100 text-rose-950 border-rose-300 font-black shadow-2xs',
          dot: 'bg-rose-700',
          activeRing: 'ring-rose-400 border-rose-400',
        };
      default:
        return {
          badge: 'bg-slate-100 text-slate-900 border-slate-300 font-black shadow-2xs',
          dot: 'bg-slate-700',
          activeRing: 'ring-slate-400 border-slate-400',
        };
    }
  }

  // Dark Mode:
  switch (lab) {
    case 'DIGITAL':
      return {
        badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        dot: 'bg-cyan-400',
        activeRing: 'ring-cyan-500/40 border-cyan-500/50',
      };
    case 'ECE':
      return {
        badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        dot: 'bg-indigo-400',
        activeRing: 'ring-indigo-500/40 border-indigo-500/50',
      };
    case 'CE':
      return {
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dot: 'bg-amber-400',
        activeRing: 'ring-amber-500/40 border-amber-500/50',
      };
    case 'CHEM':
      return {
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dot: 'bg-emerald-400',
        activeRing: 'ring-emerald-500/40 border-emerald-500/50',
      };
    case 'PHYSICS':
      return {
        badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        dot: 'bg-rose-400',
        activeRing: 'ring-rose-500/40 border-rose-500/50',
      };
    default:
      return {
        badge: 'bg-slate-700/30 text-slate-300 border-slate-600/30',
        dot: 'bg-slate-400',
        activeRing: 'ring-slate-500/40 border-slate-500/50',
      };
  }
};

// ----------------------------------------------------------------------
// 1. EquipmentCard: Clean, High-End Institutional Card Layout
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
  const isMaintenance = currentItem.status === 'Under Maintenance' || (currentItem.condition && currentItem.condition !== 'Functional' && currentItem.condition !== 'Passed Inspection');
  const availableStock = Math.max(0, totalStock - inCartQty);
  const isOutOfStock = availableStock === 0 || isMaintenance;
  const isAllInCart = inCartQty > 0 && availableStock === 0 && !isMaintenance;
  const isLowStock = !isMaintenance && availableStock > 0 && availableStock <= 3;

  const accent = getLabAccent(currentItem.lab, isDark);
  const isWhiteBg = itemImg && (itemImg.includes('/digital/') || itemImg.endsWith('.png'));

  return (
    <div
      className={`${
        isDark
          ? 'neu-card neu-card-hover'
          : 'bg-white border border-slate-200/90 rounded-xl shadow-sm'
      } group relative p-2.5 sm:p-3 transition-transform duration-75 ease-out active:scale-[0.99] flex flex-col justify-between text-left select-none touch-manipulation ${
        isMaintenance
          ? 'opacity-80 border-rose-500/40 bg-rose-950/20'
          : totalGroupInCart > 0
          ? isDark
            ? 'ring-2 ring-white/60 border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
            : 'ring-2 ring-slate-900 border-slate-900 shadow-md'
          : ''
      }`}
    >
      <div>
        {/* Hero Image Stage (Full Edge-to-Edge Container Fit) */}
        <div
          className={`relative w-full aspect-[4/3] rounded-lg overflow-hidden mb-2.5 group/img flex items-center justify-center transition-colors ${
            isDark
              ? 'neu-inset-sm bg-[#060a12]'
              : 'bg-slate-100 border border-slate-200/80'
          }`}
        >
          {itemImg ? (
            <img
              key={itemImg}
              src={itemImg}
              alt={currentItem.name}
              className="w-full h-full object-cover object-center group-hover/img:scale-105 transition-transform duration-300 animate-fade-in"
              loading="lazy"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${isDark ? 'text-slate-600 bg-slate-900/50' : 'text-slate-400 bg-slate-100'}`}>
              <ShoppingBag className="w-8 h-8" />
            </div>
          )}

          {/* Bottom-Left Clean Stock Indicator Capsule */}
          <div
            className={`absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-sm font-sans text-xs font-bold pointer-events-none ${
              isDark
                ? 'bg-slate-950/95 backdrop-blur-md border-white/15 text-white'
                : 'bg-slate-900/90 backdrop-blur-md text-white border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isMaintenance
                  ? 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                  : isAllInCart
                  ? 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]'
                  : isOutOfStock
                  ? 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                  : isLowStock
                  ? 'bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                  : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
              }`}
            />
            <span className="truncate">
              {isMaintenance
                ? 'Under Repair'
                : isAllInCart
                ? `Max in cart (${inCartQty})`
                : isOutOfStock
                ? 'Out of stock'
                : `${availableStock} available`}
            </span>
            {totalReservedQty > 0 && !isMaintenance && (
              <span className="text-[11px] shrink-0 font-medium text-amber-300">
                • {totalReservedQty} rsv
              </span>
            )}
          </div>
        </div>

        {/* Clean Categorization Badges Row (Decluttered: Tag Code + Lab Only) */}
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${
            isDark ? 'text-slate-200 bg-slate-900/90 border-slate-800' : 'bg-slate-100 text-slate-800 font-semibold border-slate-200'
          }`}>
            {currentItem.tagCode}
          </span>

          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md uppercase border ${accent.badge}`}>
            {currentItem.lab} Lab
          </span>

          {isItemConsumable(currentItem) && (
            <span className={`text-xs px-2 py-0.5 rounded-md font-semibold border ${
              isDark
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}>
              Consumable
            </span>
          )}
        </div>

        {/* Tool Title */}
        <h3 className={`text-sm sm:text-base font-bold leading-snug line-clamp-1 ${
          isDark ? 'text-slate-100 group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-blue-700'
        }`}>
          {group.baseName}
        </h3>

        {/* Clean Specifications Subtext */}
        <p className={`text-xs line-clamp-1 leading-normal mt-0.5 ${
          isDark ? 'text-slate-400' : 'text-slate-600 font-normal'
        }`}>
          {currentItem.description || currentItem.category}
        </p>

        {/* Variant Selector */}
        {group.variants.length > 1 && (
          <div className="my-2 relative">
            <div className="relative">
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className={`w-full h-8 pl-2.5 pr-8 rounded-xl text-xs font-semibold appearance-none cursor-pointer focus:outline-none transition-all truncate ${
                  isDark
                    ? 'neu-inset text-slate-100 focus:ring-1 focus:ring-white shadow-inner'
                    : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
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
                      className={isDark ? 'bg-[#131b28] text-slate-100 py-1.5' : 'bg-white text-slate-900 py-1.5'}
                    >
                      {v.variantLabel} • {vAvail === 0 ? 'Out of stock' : `${vAvail} left`} {vQty > 0 ? `(${vQty} in cart)` : ''}
                    </option>
                  );
                })}
              </select>
              <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer: Action Buttons (Consistent Height, Sizing, Tactile Feedback) */}
      <div className={`mt-3 pt-2.5 border-t flex items-center gap-2 ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        {/* Reserve Button */}
        <button
          type="button"
          disabled={isMaintenance}
          onClick={() => onReserve(currentItem)}
          className={`h-9 sm:h-10 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform duration-75 ease-out touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0 font-semibold text-xs ${
            isDark
              ? 'neu-btn-raised text-amber-300 hover:text-amber-200 border-amber-500/30'
              : 'bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 shadow-xs'
          }`}
          title={isMaintenance ? 'Item Locked' : 'Reserve Equipment in Advance'}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reserve</span>
        </button>

        {/* Card Action Button: Add to Cart */}
        <button
          type="button"
          onClick={() => onAddToCart(currentItem)}
          disabled={isOutOfStock || isAllInCart || isMaintenance}
          className={`flex-1 h-9 sm:h-10 text-xs font-bold px-3 rounded-xl shadow-xs transition-transform duration-75 ease-out touch-manipulation flex items-center justify-center gap-1.5 active:scale-[0.97] cursor-pointer ${
            isMaintenance || isOutOfStock || isAllInCart
              ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
              : inCartQty > 0
              ? isDark
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-white font-bold ring-2 ring-slate-400'
              : isDark
              ? 'neu-btn-primary text-white font-bold'
              : 'bg-slate-900 hover:bg-slate-800 text-white font-bold'
          }`}
          title="Add apparatus to cart"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>
            {isMaintenance
              ? 'Locked'
              : isAllInCart
              ? 'Max Added'
              : isOutOfStock
              ? '0 Stock'
              : inCartQty > 0
              ? `Add (+1) • ${inCartQty}`
              : 'Add to Cart'}
          </span>
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. EquipmentCompactRow: Clean Mobile Strip View
// ----------------------------------------------------------------------
function EquipmentCompactRow({ group, onAddToCart, onReserve, getItemCartQty, getItemActiveReservations, isDark = false }) {
  const [selectedVariantId, setSelectedVariantId] = useState(group.variants[0]?.id);
  const currentItem = group.variants.find((v) => v.id === selectedVariantId) || group.variants[0];

  const inCartQty = getItemCartQty(currentItem.id);
  const totalStock = currentItem.stock || 0;
  const isMaintenance = currentItem.status === 'Under Maintenance' || (currentItem.condition && currentItem.condition !== 'Functional' && currentItem.condition !== 'Passed Inspection');
  const availableStock = Math.max(0, totalStock - inCartQty);
  const isOutOfStock = totalStock <= 0 || isMaintenance;
  const isAllInCart = inCartQty >= totalStock && totalStock > 0 && !isMaintenance;
  const isLowStock = !isMaintenance && availableStock > 0 && availableStock <= 3;
  const itemImg = getItemImage(currentItem);

  const accent = getLabAccent(currentItem.lab, isDark);

  return (
    <div
      className={`${
        isDark
          ? 'neu-card neu-card-hover'
          : 'bg-white border border-slate-200/90 rounded-2xl shadow-sm'
      } p-3 flex items-center justify-between gap-3 transition-transform duration-75 ease-out active:scale-[0.99] select-none touch-manipulation ${
        isMaintenance ? 'border-rose-500/40 opacity-80' : ''
      }`}
    >
      {/* Thumbnail + Left Info */}
      <div className="min-w-0 flex-1 flex items-center gap-3">
        {itemImg && (
          <div className={`w-12 h-12 rounded-xl shrink-0 overflow-hidden flex items-center justify-center transition-colors ${
            isDark ? 'neu-inset-sm bg-[#080d16]' : 'bg-slate-100 border border-slate-200/80'
          }`}>
            <img
              key={itemImg}
              src={itemImg}
              alt={currentItem.name}
              className="w-full h-full object-cover object-center animate-fade-in"
            />
          </div>
        )}

        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded font-semibold border shrink-0 ${
              isDark ? 'text-slate-200 bg-slate-900 border-slate-700/60' : 'bg-slate-100 text-slate-800 border-slate-200'
            }`}>
              {currentItem.tagCode}
            </span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded uppercase shrink-0 border ${accent.badge}`}>
              {currentItem.lab}
            </span>
            <span className="text-xs font-medium truncate flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isMaintenance
                    ? 'bg-rose-400'
                    : isAllInCart
                    ? 'bg-sky-400'
                    : isOutOfStock
                    ? 'bg-rose-400'
                    : isLowStock
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-emerald-400'
                }`}
              />
              <span className={`truncate font-semibold ${
                isMaintenance
                  ? isDark ? 'text-rose-400' : 'text-rose-800'
                  : isAllInCart
                  ? isDark ? 'text-cyan-300' : 'text-slate-900'
                  : isOutOfStock
                  ? isDark ? 'text-rose-400' : 'text-rose-800'
                  : isLowStock
                  ? isDark ? 'text-amber-300' : 'text-amber-800'
                  : isDark ? 'text-slate-200' : 'text-emerald-800'
              }`}>
                {isMaintenance
                  ? 'Repair'
                  : isAllInCart
                  ? `Max (${inCartQty})`
                  : isOutOfStock
                  ? '0 stock'
                  : `${availableStock} left`}
              </span>
            </span>
          </div>

          <h4 className={`text-xs sm:text-sm font-bold truncate leading-tight mt-1 ${
            isDark ? 'text-slate-100' : 'text-slate-900'
          }`}>
            {group.baseName}
          </h4>

          {/* Variants dropdown in compact row if multiple variants exist */}
          {group.variants.length > 1 && (
            <div className="mt-1 relative max-w-[170px] sm:max-w-[200px]">
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className={`w-full h-6 pl-2 pr-6 rounded-lg text-[10px] font-semibold appearance-none cursor-pointer focus:outline-none truncate ${
                  isDark
                    ? 'neu-inset text-slate-100'
                    : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
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
                      className={isDark ? 'bg-[#131b28] text-slate-200' : 'bg-white text-slate-900 font-medium'}
                    >
                      {v.variantLabel} • {vAvail} left {vQty > 0 ? `(${vQty})` : ''}
                    </option>
                  );
                })}
              </select>
              <div className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <ChevronDown className="w-3 h-3 stroke-[2.5]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          disabled={isMaintenance}
          onClick={() => onReserve(currentItem)}
          className={`h-9 px-2.5 rounded-xl flex items-center justify-center active:scale-[0.97] transition-transform duration-75 ease-out touch-manipulation shrink-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer font-semibold text-xs ${
            isDark
              ? 'neu-btn-raised text-amber-300 hover:text-amber-200'
              : 'bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 shadow-xs'
          }`}
          title={isMaintenance ? 'Under Maintenance' : 'Reserve'}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reserve</span>
        </button>

        <button
          type="button"
          disabled={isOutOfStock || isMaintenance}
          onClick={() => onAddToCart(currentItem)}
          className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-[0.97] transition-transform duration-75 ease-out touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-xs ${
            isMaintenance || isOutOfStock
              ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
              : inCartQty > 0
              ? isDark
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'bg-slate-900 text-white font-bold ring-1 ring-slate-400'
              : isDark
              ? 'neu-btn-primary text-white font-bold'
              : 'bg-slate-900 text-white font-bold'
          }`}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{isMaintenance ? 'Locked' : isOutOfStock ? (isAllInCart ? 'Max' : '0') : 'Add'}</span>
          {inCartQty > 0 && !isMaintenance && <span className="text-[10px] font-bold">({inCartQty})</span>}
        </button>
      </div>
    </div>
  );
}
