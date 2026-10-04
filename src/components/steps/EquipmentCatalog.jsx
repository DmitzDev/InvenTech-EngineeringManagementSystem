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
    <div className="flex-1 max-w-[1720px] mx-auto w-full p-2.5 sm:p-4 lg:p-5 flex flex-col justify-between select-none min-h-0 relative">
      {/* 1. Top Department Breadcrumb & Mobile View Controls */}
      <div className="flex flex-col gap-1.5 sm:gap-2 pb-2 mb-1.5 border-b border-slate-800/80 shrink-0">
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
            <span className="text-slate-700 hidden xs:inline">|</span>
            <div className="flex items-center gap-1.5 truncate">
              <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-full neu-inset-sm shrink-0 ${
                isDark ? 'text-cyan-400' : 'text-slate-950 bg-slate-100 border border-slate-300'
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
          <div className="sm:hidden flex items-center gap-1 neu-inset p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setMobileViewMode('grid')}
              title="2-Column Grid View"
              className={`p-1.5 rounded-lg transition-all ${mobileViewMode === 'grid'
                  ? 'neu-btn-primary text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode('compact')}
              title="Compact Single-Line List View (Faster Scrolling)"
              className={`p-1.5 rounded-lg transition-all ${mobileViewMode === 'compact'
                  ? 'neu-btn-primary text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Fast Search & Category Filter Pills */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:flex-1 min-w-0">
            {/* Instant Search Box */}
            <div className="relative w-full sm:w-64 lg:w-80 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apparatus..."
                className="w-full min-h-[36px] sm:min-h-[42px] pl-9 pr-8 rounded-xl neu-inset text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Chips (ALL, APPARATUS, INSTRUMENTS, CONSUMABLES...) */}
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1 scroll-smooth snap-x touch-pan-x flex-1 min-w-0">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`min-h-[34px] sm:min-h-[40px] px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all whitespace-nowrap active:scale-95 cursor-pointer flex items-center justify-center shrink-0 snap-start ${isActive
                        ? 'neu-btn-primary shadow-md text-slate-950 font-black'
                        : 'neu-btn-raised text-slate-300 hover:text-white'
                      }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Dedicated Borrow Cart Button (Desktop / Kiosk Only) */}
          <div className="hidden sm:flex sm:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={openCartDrawer}
              className="w-auto flex items-center justify-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 min-h-[38px] sm:min-h-[40px] rounded-xl neu-btn-raised text-slate-200 hover:text-white transition-all active:scale-95 cursor-pointer shadow-md"
              title="Open Borrow Cart"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-white shadow-xs">
                <img
                  src="/images/engrCartLogo.jpg"
                  alt="Engineering Cart"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs sm:text-sm font-bold">Borrow Cart</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-extrabold bg-white text-slate-950 shadow-sm">
                {totalUnitsCount}
              </span>
            </button>
          </div>
        </div>

        {/* 3. Sub-Lab Switcher Pills Placed Directly Below Search Bar on Phone */}
        {selectedLab === 'CE_CHEM' && (
          <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar pt-0.5">
            <button
              type="button"
              onClick={() => {
                setMobileLabFilter('ALL');
                setActiveCategory('ALL');
              }}
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold shrink-0 transition-all active:scale-95 ${mobileLabFilter === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                  : 'neu-btn-raised text-slate-300'
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
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold shrink-0 transition-all active:scale-95 ${mobileLabFilter === 'CE'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'neu-btn-raised text-amber-300'
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
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold shrink-0 transition-all active:scale-95 ${mobileLabFilter === 'CHEM'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                  : 'neu-btn-raised text-emerald-300'
                }`}
            >
              Chemistry Lab ({subLabCounts.chemCount})
            </button>
          </div>
        )}

        {selectedLab === 'DIGITAL_ECE' && (
          <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar pt-0.5">
            <button
              type="button"
              onClick={() => {
                setMobileLabFilter('ALL');
                setActiveCategory('ALL');
              }}
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold shrink-0 transition-all active:scale-95 ${mobileLabFilter === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                  : 'neu-btn-raised text-slate-300'
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
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold shrink-0 transition-all active:scale-95 ${mobileLabFilter === 'DIGITAL'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                  : 'neu-btn-raised text-cyan-300'
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
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold shrink-0 transition-all active:scale-95 ${mobileLabFilter === 'ECE'
                  ? 'bg-indigo-500 text-slate-950 font-black shadow-sm'
                  : 'neu-btn-raised text-indigo-300'
                }`}
            >
              ECE / Circuits ({subLabCounts.eceCount})
            </button>
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
        ) : mobileViewMode === 'compact' ? (
          /* Mobile Ultra-Compact Row Strip View (Fits 8-10 items per screen height) */
          <div className="space-y-1.5 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 sm:gap-4 sm:space-y-0">
            {groupedEquipment.map((group) => (
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
            {groupedEquipment.map((group) => (
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
      className={`neu-card neu-card-hover group relative rounded-2xl p-2.5 sm:p-3 transition-all duration-200 flex flex-col justify-between text-left select-none ${
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
        {/* Hero Image Showcase Stage (Edge-to-Edge Fitted Container + Bottom-Left Stock Capsule) */}
        <div
          className={`neu-inset-sm relative w-full aspect-[4/3] sm:aspect-[4/3] rounded-xl overflow-hidden mb-2 group/img flex items-center justify-center transition-colors ${
            isDark
              ? isWhiteBg ? 'bg-white border-slate-700/60' : 'bg-[#060a12]'
              : isWhiteBg ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200'
          }`}
        >
          {/* Smooth Fade-in Switching Image that fits edge-to-edge seamlessly */}
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

          {/* Bottom-Left Live Stock Indicator Capsule (Hardware Milled Pill - High-Contrast on ANY Image) */}
          <div
            className={`absolute bottom-1.5 left-1.5 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-md border shadow-md font-mono text-[9px] sm:text-[10px] font-black pointer-events-none ${
              isDark
                ? 'bg-slate-950/95 backdrop-blur-md border-white/15 text-white'
                : 'bg-[#090e17] text-white border-slate-700 shadow-md'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${
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
            <span className="truncate font-bold text-white keep-white">
              {isMaintenance
                ? 'Repair'
                : isAllInCart
                ? `Max (${inCartQty})`
                : isOutOfStock
                ? '0 stock'
                : `${availableStock} left`}
            </span>
            {totalReservedQty > 0 && !isMaintenance && (
              <span className="text-[8px] sm:text-[8.5px] font-mono shrink-0 font-bold text-amber-300 keep-white">
                • {totalReservedQty} rsv
              </span>
            )}
          </div>
        </div>

        {/* Clean Categorization Badges Row (Below Image, Zero Obstruction on Photo) */}
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          {/* Tag Code Badge */}
          <span className={`text-[9px] sm:text-[9.5px] font-mono font-black px-1.5 py-0.5 rounded border shadow-xs ${
            isDark ? 'text-slate-200 bg-slate-900/90 border-slate-800' : 'text-slate-900 bg-slate-100 border-slate-300'
          }`}>
            {currentItem.tagCode}
          </span>

          {/* Lab & Type Pills */}
          <span className={`text-[8px] sm:text-[8.5px] font-mono font-black px-1.5 py-0.5 rounded uppercase border backdrop-blur-md ${accent.badge}`}>
            {currentItem.lab}
          </span>
          <span
            className={`text-[8px] sm:text-[8.5px] font-mono font-black px-1.5 py-0.5 rounded uppercase border backdrop-blur-md ${
              isItemConsumable(currentItem)
                ? isDark
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-amber-100 text-amber-950 border-amber-300'
                : isDark
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : 'bg-slate-100 text-slate-900 border-slate-300'
            }`}
          >
            {isItemConsumable(currentItem) ? 'Consumable' : 'Tool'}
          </span>
        </div>

        {/* Equipment Name & Subtitle */}
        <h3 className={`text-xs sm:text-[13.5px] font-black leading-snug line-clamp-1 ${
          isDark ? 'text-slate-100 group-hover:text-cyan-300' : 'text-slate-950 group-hover:text-slate-800'
        }`}>
          {group.baseName}
        </h3>
        <p className={`text-[10px] sm:text-[11px] line-clamp-1 leading-normal mt-0.5 ${
          isDark ? 'text-slate-400' : 'text-slate-700 font-bold'
        }`}>
          {currentItem.description || `${currentItem.category} • ${currentItem.lab} Laboratory`}
        </p>

        {/* Variant Selector: Unified Modern Dropdown for all multi-variant items */}
        {group.variants.length > 1 && (
          <div className="my-2 relative">
            <div className="relative">
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className={`w-full h-8 pl-2.5 pr-8 rounded-xl font-mono text-[10.5px] sm:text-[11px] font-bold appearance-none cursor-pointer focus:outline-none focus:ring-1 transition-all shadow-inner truncate ${
                  isDark
                    ? 'neu-inset text-slate-100 focus:ring-white'
                    : 'bg-slate-100 border border-slate-300 text-slate-950 focus:ring-slate-950 shadow-sm'
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
                      className={isDark ? 'bg-[#131b28] text-slate-100 py-1.5 font-mono' : 'bg-white text-slate-950 py-1.5 font-mono font-bold'}
                    >
                      {v.variantLabel} {vQty > 0 ? `(${vQty} in cart)` : ''} — {vAvail === 0 ? 'Out of stock' : `${vAvail} left`}
                    </option>
                  );
                })}
              </select>
              <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                isDark ? 'text-slate-400' : 'text-slate-700'
              }`}>
                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer: Spacious Clean Action Buttons */}
      <div className={`mt-2.5 pt-2 border-t flex items-center gap-2 ${
        isDark ? 'border-slate-700/60' : 'border-slate-200'
      }`}>
        {/* Reserve Button */}
        <button
          type="button"
          disabled={isMaintenance}
          onClick={() => onReserve(currentItem)}
          className={`h-7.5 sm:h-8 px-2.5 rounded-lg flex items-center justify-center gap-1 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0 ${
            isDark
              ? 'neu-btn-raised text-amber-300'
              : 'bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold shadow-xs'
          }`}
          title={isMaintenance ? 'Item Locked' : 'Reserve Equipment'}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[10.5px] font-bold">Reserve</span>
        </button>

        {/* Add to Cart Button (Spacious Full-flex Button) */}
        <button
          type="button"
          onClick={() => onAddToCart(currentItem)}
          disabled={isOutOfStock || isAllInCart || isMaintenance}
          className={`flex-1 h-7.5 sm:h-8 px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer ${
            isMaintenance || isOutOfStock || isAllInCart
              ? 'opacity-40 cursor-not-allowed neu-inset text-slate-400'
              : inCartQty > 0
              ? 'neu-btn-secondary text-white font-black'
              : 'neu-btn-primary text-white font-black'
          }`}
          title="Add apparatus to cart"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>
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
      className={`neu-card neu-card-hover rounded-xl p-2.5 flex items-center justify-between gap-2.5 transition-all select-none ${
        isMaintenance ? 'border-rose-500/40 opacity-80' : ''
      }`}
    >
      {/* Thumbnail + Left Info */}
      <div className="min-w-0 flex-1 flex items-center gap-2.5">
        {itemImg && (
          <div className={`neu-inset-sm w-11 h-11 rounded-lg shrink-0 overflow-hidden flex items-center justify-center p-0.5 ${
            isDark ? 'bg-[#080d16]' : 'bg-white border border-slate-200'
          }`}>
            <img
              key={itemImg}
              src={itemImg}
              alt={currentItem.name}
              className={`w-full h-full ${
                itemImg.toLowerCase().endsWith('.png') ? 'object-contain' : 'object-cover'
              } object-center animate-fade-in`}
            />
          </div>
        )}

        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded border shrink-0 ${
              isDark ? 'text-slate-200 bg-slate-900 border-slate-700/60' : 'text-slate-900 bg-slate-100 border-slate-300'
            }`}>
              {currentItem.tagCode}
            </span>
            <span className={`text-[8px] font-mono font-black px-1.5 py-0.2 rounded uppercase shrink-0 border ${accent.badge}`}>
              {currentItem.lab}
            </span>
            <span className={`text-[9.5px] font-mono font-bold truncate flex items-center gap-1.5 ${
              isDark ? 'text-slate-200' : 'text-slate-950 font-black'
            }`}>
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
              <span className={`truncate font-black ${
                isMaintenance
                  ? isDark ? 'text-rose-400' : 'text-rose-700'
                  : isAllInCart
                  ? isDark ? 'text-cyan-300' : 'text-slate-900'
                  : isOutOfStock
                  ? isDark ? 'text-rose-400' : 'text-rose-700'
                  : isLowStock
                  ? isDark ? 'text-amber-300' : 'text-amber-800'
                  : isDark ? 'text-slate-200' : 'text-slate-950'
              }`}>
                {isMaintenance
                  ? 'Repair'
                  : isAllInCart
                  ? `Max (${inCartQty}/${totalStock})`
                  : isOutOfStock
                  ? '0 stock'
                  : `${availableStock}/${totalStock} left`}
              </span>
            </span>
          </div>

          <h4 className={`text-xs font-black truncate leading-tight mt-0.5 ${
            isDark ? 'text-slate-100' : 'text-slate-950 font-black'
          }`}>
            {group.baseName}
          </h4>

          {/* Variants dropdown in compact row if multiple variants exist */}
          {group.variants.length > 1 && (
            <div className="mt-1 relative max-w-[170px] sm:max-w-[200px]">
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className={`w-full h-6 pl-2 pr-6 rounded-lg font-mono text-[9px] font-bold appearance-none cursor-pointer focus:outline-none truncate ${
                  isDark
                    ? 'neu-inset text-slate-100'
                    : 'bg-slate-100 border border-slate-300 text-slate-950'
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
                      className={isDark ? 'bg-[#131b28] text-slate-200' : 'bg-white text-slate-950 font-bold'}
                    >
                      {v.variantLabel} {vQty > 0 ? `(${vQty})` : ''} — {vAvail} left
                    </option>
                  );
                })}
              </select>
              <div className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                isDark ? 'text-slate-400' : 'text-slate-700'
              }`}>
                <ChevronDown className="w-3 h-3 stroke-[2.5]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          disabled={isMaintenance}
          onClick={() => onReserve(currentItem)}
          className={`w-7 h-7 rounded-lg flex items-center justify-center active:scale-95 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
            isDark
              ? 'neu-btn-raised text-amber-300'
              : 'bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold shadow-xs'
          }`}
          title={isMaintenance ? 'Under Maintenance' : 'Reserve'}
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          disabled={isOutOfStock || isMaintenance}
          onClick={() => onAddToCart(currentItem)}
          className="neu-btn-primary h-7 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 text-white font-black cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{isMaintenance ? 'Locked' : isOutOfStock ? (isAllInCart ? 'Max' : '0') : 'Add'}</span>
          {inCartQty > 0 && !isMaintenance && <span className="text-[8.5px] font-bold font-mono">({inCartQty})</span>}
        </button>
      </div>
    </div>
  );
}
