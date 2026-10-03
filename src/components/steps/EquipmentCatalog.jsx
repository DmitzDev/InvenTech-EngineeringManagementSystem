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
    commitTransaction,
    reservations,
    isCartDrawerOpen,
    openCartDrawer,
    closeCartDrawer,
  } = useTransaction();

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
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full neu-inset-sm text-cyan-400 shrink-0">
                {currentLabInfo.shortName}
              </span>
              <span className="text-xs text-slate-300 font-semibold hidden md:inline truncate">
                {currentLabInfo.name}
              </span>
            </div>
          </div>

          {/* Phone-Only: View Mode Toggle (Grid vs Ultra-Compact List Strip) */}
          <div className="sm:hidden flex items-center gap-1 bg-[#09101d] p-0.5 rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setMobileViewMode('grid')}
              title="2-Column Grid View"
              className={`p-1.5 rounded-lg transition-all ${mobileViewMode === 'grid'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
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
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
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
                className="w-full min-h-[36px] sm:min-h-[42px] pl-9 pr-8 rounded-xl neu-inset text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1 min-w-0">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`min-h-[34px] sm:min-h-[40px] px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all whitespace-nowrap active:scale-95 cursor-pointer flex items-center justify-center shrink-0 ${isActive
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
              className="w-auto flex items-center justify-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 min-h-[38px] sm:min-h-[40px] rounded-xl neu-btn-raised border border-cyan-500/30 text-slate-200 hover:text-white hover:border-cyan-400 transition-all active:scale-95 cursor-pointer shadow-md"
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
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-extrabold bg-cyan-500 text-slate-950">
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
        className="flex-1 min-h-0 overflow-y-auto pr-1 pb-16 sm:pb-6 scroll-smooth"
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

      {/* 5. Slide-Over Cart Drawer Modal */}
      {isCartDrawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-fade-in touch-none">
            {/* Overlay Click to Close */}
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={closeCartDrawer}
            />

            {/* Slide-in Cart Container */}
            <div className="relative z-10 w-full sm:max-w-md md:max-w-lg h-full h-[100dvh] max-h-[100dvh] bg-[#0e1422] sm:border-l border-slate-800 shadow-2xl flex flex-col animate-slide-left overflow-hidden">
              <BorrowCart
                onClose={closeCartDrawer}
                onProceed={() => {
                  closeCartDrawer();
                  commitTransaction();
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
const getLabAccent = (lab) => {
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
function EquipmentCard({ group, onAddToCart, onReserve, getItemCartQty, getItemActiveReservations }) {
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

  const accent = getLabAccent(currentItem.lab);
  const isWhiteBg = itemImg && (itemImg.includes('/digital/') || itemImg.endsWith('.png'));

  return (
    <div
      className={`group relative rounded-2xl p-2.5 sm:p-3 transition-all duration-200 flex flex-col justify-between text-left select-none bg-[#0e1522] border border-slate-800/90 shadow-sm hover:shadow-lg hover:border-slate-700 ${
        isMaintenance
          ? 'opacity-80 border-rose-500/30 bg-rose-950/10'
          : totalGroupInCart > 0
          ? 'ring-2 ring-cyan-500/50 border-cyan-500/40 bg-gradient-to-b from-[#111e30] to-[#0e1522]'
          : ''
      }`}
    >
      <div>
        {/* Hero Image Showcase Stage (Edge-to-Edge Fitted Container + Bottom-Left Stock Capsule) */}
        <div
          className={`relative w-full aspect-[4/3] sm:aspect-[4/3] rounded-xl overflow-hidden mb-2 group/img flex items-center justify-center border transition-colors ${
            isWhiteBg ? 'bg-white border-slate-700/60' : 'bg-[#070c14] border-slate-800/80'
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
            <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900/50">
              <ShoppingBag className="w-8 h-8" />
            </div>
          )}

          {/* Bottom-Left Live Stock Indicator Capsule (Frosted Glass Pill) */}
          <div className="absolute bottom-1.5 left-1.5 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-md border border-white/10 shadow-md font-mono text-[9px] sm:text-[10px] font-bold pointer-events-none">
            <span
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${
                isMaintenance
                  ? 'bg-rose-500'
                  : isAllInCart
                  ? 'bg-cyan-400'
                  : isOutOfStock
                  ? 'bg-rose-400'
                  : isLowStock
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
            <span
              className={`truncate ${
                isMaintenance
                  ? 'text-rose-400'
                  : isAllInCart
                  ? 'text-cyan-300'
                  : isOutOfStock
                  ? 'text-rose-400'
                  : isLowStock
                  ? 'text-amber-300'
                  : 'text-slate-200'
              }`}
            >
              {isMaintenance
                ? 'Repair'
                : isAllInCart
                ? `Max (${inCartQty})`
                : isOutOfStock
                ? '0 stock'
                : `${availableStock} left`}
            </span>
            {totalReservedQty > 0 && !isMaintenance && (
              <span className="text-[8px] sm:text-[8.5px] text-amber-400 font-mono shrink-0">
                • {totalReservedQty} rsv
              </span>
            )}
          </div>
        </div>

        {/* Clean Categorization Badges Row (Below Image, Zero Obstruction on Photo) */}
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          {/* Tag Code Badge */}
          <span className="text-[9px] sm:text-[9.5px] font-mono font-bold text-slate-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800 shadow-xs">
            {currentItem.tagCode}
          </span>

          {/* Lab & Type Pills */}
          <span className={`text-[8px] sm:text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border backdrop-blur-md ${accent.badge}`}>
            {currentItem.lab}
          </span>
          <span
            className={`text-[8px] sm:text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border backdrop-blur-md ${
              isItemConsumable(currentItem)
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
            }`}
          >
            {isItemConsumable(currentItem) ? 'Consumable' : 'Tool'}
          </span>
        </div>

        {/* Equipment Name & Subtitle */}
        <h3 className="text-xs sm:text-[13.5px] font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug line-clamp-1">
          {group.baseName}
        </h3>
        <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-1 leading-normal mt-0.5">
          {currentItem.description || `${currentItem.category} • ${currentItem.lab} Laboratory`}
        </p>

        {/* Variant Selector: Unified Modern Dropdown for all multi-variant items */}
        {group.variants.length > 1 && (
          <div className="my-2 relative">
            <div className="relative">
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className="w-full h-8 pl-2.5 pr-8 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-mono text-[10.5px] sm:text-[11px] font-bold appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all shadow-sm truncate"
              >
                {group.variants.map((v) => {
                  const vQty = getItemCartQty(v.id);
                  const vStock = v.stock || 10;
                  const vAvail = Math.max(0, vStock - vQty);
                  return (
                    <option key={v.id} value={v.id} className="bg-[#0f172a] text-slate-200 py-1.5 font-mono">
                      {v.variantLabel} {vQty > 0 ? `(${vQty} in cart)` : ''} — {vAvail === 0 ? 'Out of stock' : `${vAvail} left`}
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-400">
                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer: Spacious Clean Action Buttons */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/70 flex items-center gap-2">
        {/* Reserve Button */}
        <button
          type="button"
          disabled={isMaintenance}
          onClick={() => onReserve(currentItem)}
          className="h-7.5 sm:h-8 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-amber-300 flex items-center justify-center gap-1 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
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
          className={`flex-1 h-7.5 sm:h-8 px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow-sm ${
            isMaintenance || isOutOfStock || isAllInCart
              ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-400'
              : inCartQty > 0
              ? 'bg-cyan-500 text-slate-950 font-extrabold hover:bg-cyan-400 shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-950 font-extrabold shadow-sm'
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
function EquipmentCompactRow({ group, onAddToCart, onReserve, getItemCartQty }) {
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

  const accent = getLabAccent(currentItem.lab);

  return (
    <div
      className={`rounded-xl p-2.5 flex items-center justify-between gap-2.5 transition-all select-none bg-[#0e1522] border border-slate-800/90 shadow-sm ${
        isMaintenance ? 'border-rose-500/30 opacity-80' : ''
      }`}
    >
      {/* Thumbnail + Left Info */}
      <div className="min-w-0 flex-1 flex items-center gap-2.5">
        {itemImg && (
          <div className="w-11 h-11 rounded-lg bg-[#070c14] border border-slate-800/80 shrink-0 overflow-hidden flex items-center justify-center p-0.5">
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
            <span className="text-[9px] font-mono font-bold text-slate-200 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-700/60 shrink-0">
              {currentItem.tagCode}
            </span>
            <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded uppercase shrink-0 border ${accent.badge}`}>
              {currentItem.lab}
            </span>
            <span className="text-[9.5px] font-mono font-semibold text-slate-300 truncate flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isMaintenance
                    ? 'bg-rose-500'
                    : isAllInCart
                    ? 'bg-cyan-400'
                    : isOutOfStock
                    ? 'bg-rose-400'
                    : isLowStock
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="truncate">
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

          <h4 className="text-xs font-bold text-slate-100 truncate leading-tight mt-0.5">
            {group.baseName}
          </h4>

          {/* Variants dropdown in compact row if multiple variants exist */}
          {group.variants.length > 1 && (
            <div className="mt-1 relative max-w-[170px] sm:max-w-[200px]">
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className="w-full h-6 pl-2 pr-6 rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-300 font-mono text-[9px] font-bold appearance-none cursor-pointer focus:outline-none focus:border-cyan-400 truncate"
              >
                {group.variants.map((v) => {
                  const vQty = getItemCartQty(v.id);
                  const vStock = v.stock || 10;
                  const vAvail = Math.max(0, vStock - vQty);
                  return (
                    <option key={v.id} value={v.id} className="bg-[#0f172a] text-slate-200">
                      {v.variantLabel} {vQty > 0 ? `(${vQty})` : ''} — {vAvail} left
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-400">
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
          className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-amber-300 flex items-center justify-center active:scale-95 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
          title={isMaintenance ? 'Under Maintenance' : 'Reserve'}
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          disabled={isOutOfStock || isMaintenance}
          onClick={() => onAddToCart(currentItem)}
          className={`h-7 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${
            inCartQty > 0
              ? 'bg-cyan-500 text-slate-950 font-extrabold'
              : 'bg-white text-slate-950 hover:bg-slate-100 font-extrabold'
          }`}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{isMaintenance ? 'Locked' : isOutOfStock ? (isAllInCart ? 'Max' : '0') : 'Add'}</span>
          {inCartQty > 0 && !isMaintenance && <span className="text-[8.5px] font-bold font-mono">({inCartQty})</span>}
        </button>
      </div>
    </div>
  );
}
