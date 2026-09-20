import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Minus,
  Check,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Calendar,
  ShoppingBag,
  X,
  ArrowUp,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import { getInventory, LAB_OPTIONS, getItemImage } from '../../data/equipmentData';
import TouchButton from '../ui/TouchButton';
import BorrowCart from './BorrowCart';
import ReservationModal from './ReservationModal';

export default function EquipmentCatalog() {
  const {
    selectedLab,
    cart,
    addToCart,
    updateCartQty,
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
  const allEquipment = useMemo(() => getInventory(), [selectedLab]);

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

      // 1. Digital & ECE: LEDs (Red, Blue, Green, Transparent, Standard 5mm)
      if (/^LED\s+/i.test(normName) || normName.toUpperCase() === 'LED STD SIZE' || normName.toUpperCase().startsWith('LED ')) {
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
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
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
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in">
          {/* Overlay Click to Close */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={closeCartDrawer}
          />

          {/* Slide-in Cart Container */}
          <div className="relative z-10 w-full max-w-md sm:max-w-lg md:max-w-xl h-full max-h-[100dvh] bg-[#0e1422] border-l border-slate-800 shadow-2xl flex flex-col animate-slide-left overflow-hidden">
            <BorrowCart
              onClose={closeCartDrawer}
              onProceed={() => {
                closeCartDrawer();
                commitTransaction();
              }}
            />
          </div>
        </div>
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

// 1. Standard 2-Column Grid Card (Optimized without nested double box for variants)
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
  const availableStock = Math.max(0, totalStock - inCartQty);
  const isOutOfStock = availableStock === 0;
  const isAllInCart = inCartQty > 0 && availableStock === 0;
  const isLowStock = availableStock > 0 && availableStock <= 3;

  return (
    <div
      className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all duration-200 flex flex-col justify-between text-left ${totalGroupInCart > 0
          ? 'neu-card ring-2 ring-cyan-500 shadow-[0_0_18px_rgba(6,182,212,0.3)] bg-gradient-to-b from-cyan-950/25 to-[#0e1422]'
          : 'neu-card-sm neu-card-hover'
        }`}
    >
      <div>
        {/* Media Header: Compact 1:1 Thumbnail + Tags */}
        <div className="flex items-start gap-2 sm:gap-2.5 mb-1 sm:mb-1.5">
          {itemImg && (
            <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden bg-slate-950 border border-slate-800/90 shrink-0 relative flex items-center justify-center shadow-md group">
              <img
                src={itemImg}
                alt={currentItem.name}
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-200"
                loading="lazy"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Tag Code & Lab Pill */}
            <div className="flex items-center justify-between mb-1 gap-1">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[9.5px] sm:text-[10.5px] font-mono font-bold text-cyan-300 neu-inset-sm px-1.5 py-0.5 rounded truncate max-w-[85px] sm:max-w-none tracking-tight">
                  {currentItem.tagCode}
                </span>
                <span
                  className={`text-[8.5px] sm:text-[9.5px] font-mono font-extrabold px-1.5 py-0.5 rounded uppercase ${currentItem.lab === 'DIGITAL'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : currentItem.lab === 'ECE'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : currentItem.lab === 'CE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : currentItem.lab === 'CHEM'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-700/40 text-slate-200'
                    }`}
                >
                  {currentItem.lab}
                </span>
              </div>
            </div>

            {/* Equipment Base Name */}
            <h3 className="text-xs sm:text-[14px] font-extrabold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug line-clamp-1">
              {group.baseName}
            </h3>
          </div>
        </div>

        {/* Clean Spec / Size Option Pills (Direct option buttons, no outer double box) */}
        {group.variants.length > 1 && (
          <div className="my-1.5 flex items-center gap-1.5 flex-wrap">
            {group.variants.map((v) => {
              const isSelected = v.id === currentItem.id;
              const vQty = getItemCartQty(v.id);
              const vTotalStock = v.stock || 10;
              const vAvail = Math.max(0, vTotalStock - vQty);
              const vIsOut = vAvail === 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10.5px] font-mono font-bold rounded-lg border transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${isSelected
                      ? 'bg-cyan-500 text-slate-950 font-black border-cyan-400 shadow-sm'
                      : vIsOut
                        ? 'neu-btn-raised border-slate-800 text-slate-500 hover:text-slate-400 opacity-60'
                        : 'neu-btn-raised border-slate-700/80 text-slate-200 hover:text-white'
                    }`}
                >
                  <span>{v.variantLabel}</span>
                  {vQty > 0 && (
                    <span className={`px-1 py-0.2 rounded-full text-[8px] font-black ${isSelected ? 'bg-slate-950 text-cyan-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                      {vQty}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Improved Real-Time Stocks & Inventory Status Indicator - Clean Text with Dot (NO BOX) */}
        <div className="mt-2 pt-1.5 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold flex-wrap gap-1">
            {/* Live Color-Coded Stock Status Text with Dot Indicator */}
            <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-xs font-bold">
              {/* Glowing Pulse Dot */}
              <span className="relative flex h-2 w-2 shrink-0">
                {isLowStock && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                )}
                {isAllInCart && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${isAllInCart
                      ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                      : isOutOfStock
                        ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                        : isLowStock
                          ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                          : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                    }`}
                />
              </span>

              {/* Status Text with Live Available Count & Total Ratio */}
              <span className={`tracking-tight ${isAllInCart ? 'text-cyan-300' : isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-300' : 'text-emerald-400'
                }`}>
                {isAllInCart ? (
                  `Max in Cart (${inCartQty}/${totalStock} ${currentItem.unit || 'pcs'})`
                ) : isOutOfStock ? (
                  'Out of Stock (0 avail)'
                ) : isLowStock ? (
                  `Low: ${availableStock} / ${totalStock} ${currentItem.unit || 'pcs'}`
                ) : (
                  `Stock: ${availableStock} / ${totalStock} ${currentItem.unit || 'pcs'}`
                )}
              </span>
            </div>

            {/* In-Cart / Active Reservation Badges */}
            <div className="flex items-center gap-1">
              {inCartQty > 0 && !isAllInCart && (
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5 text-cyan-400 stroke-[3]" />
                  <span>{inCartQty} in cart</span>
                </span>
              )}

              {totalReservedQty > 0 && (
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-300 neu-inset-amber px-1.5 sm:px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{totalReservedQty} Booked</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Actions: Clean Responsive 2-Column Button Grid (Zero Overflow on Mobile) */}
      <div className="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-1 sm:gap-2 w-full">
        {/* Reserve Button */}
        <button
          type="button"
          onClick={() => onReserve(currentItem)}
          className="h-8 sm:h-10 px-2 sm:px-3 rounded-lg sm:rounded-xl neu-btn-raised text-amber-400 hover:text-amber-300 text-[11px] sm:text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1 shrink-0 w-full min-w-0"
          title="Reserve equipment"
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Reserve</span>
        </button>

        {/* Add to Cart Button */}
        <button
          type="button"
          onClick={() => onAddToCart(currentItem)}
          disabled={isOutOfStock || isAllInCart}
          className={`h-8 sm:h-10 px-2 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1 shrink-0 w-full min-w-0 ${isOutOfStock || isAllInCart
              ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
              : inCartQty > 0
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-black shadow-md'
                : 'neu-btn-primary text-slate-950 font-black'
            }`}
          title={isOutOfStock ? 'Out of Stock' : isAllInCart ? 'Max quantity reached in cart' : 'Add to borrow cart'}
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {isAllInCart ? 'Max' : isOutOfStock ? '0 Left' : inCartQty > 0 ? `Add (${inCartQty})` : 'Add'}
          </span>
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// EquipmentCompactRow: Phone-Optimized Single Horizontal Strip View
// ----------------------------------------------------------------------
function EquipmentCompactRow({ group, onAddToCart, onReserve, getItemCartQty, getItemActiveReservations }) {
  const [selectedVariantId, setSelectedVariantId] = useState(group.variants[0]?.id);
  const currentItem = group.variants.find((v) => v.id === selectedVariantId) || group.variants[0];

  const inCartQty = getItemCartQty(currentItem.id);
  const totalStock = currentItem.stock || 0;
  const availableStock = Math.max(0, totalStock - inCartQty);
  const isOutOfStock = totalStock <= 0;
  const isAllInCart = inCartQty >= totalStock && totalStock > 0;
  const isLowStock = availableStock > 0 && availableStock <= 3;

  const activeReservations = getItemActiveReservations(currentItem.id);
  const totalReservedQty = activeReservations.reduce((sum, r) => sum + (r.quantity || 1), 0);

  return (
    <div className="neu-card-sm rounded-xl p-2.5 flex items-center justify-between gap-2.5 transition-all select-none">
      {/* Left Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-mono font-bold text-cyan-300 neu-inset-sm px-1.5 py-0.2 rounded shrink-0">
              {currentItem.tagCode}
            </span>
            <span
              className={`text-[9.5px] sm:text-[10.5px] font-mono font-bold flex items-center gap-1.5 truncate ${isAllInCart
                  ? 'text-cyan-300'
                  : isOutOfStock
                    ? 'text-rose-400'
                    : isLowStock
                      ? 'text-amber-300'
                      : 'text-emerald-400'
                }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${isAllInCart
                    ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]'
                    : isOutOfStock
                      ? 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                      : isLowStock
                        ? 'bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.8)]'
                        : 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                  }`}
              />
              <span className="truncate">
                {isAllInCart
                  ? `Max (${inCartQty}/${totalStock})`
                  : isOutOfStock
                    ? '0 stock'
                    : `Stock: ${availableStock} / ${totalStock} ${currentItem.unit || 'pcs'}`}
              </span>
            </span>
          </div>

          <h4 className="text-xs font-extrabold text-slate-100 truncate leading-tight mt-0.5">
            {group.baseName}
          </h4>

          {/* Variants row if any (Direct buttons without outer double box) */}
          {group.variants.length > 1 && (
            <div className="flex items-center gap-1 mt-0.5 overflow-x-auto no-scrollbar">
              {group.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`px-1.5 py-0.5 text-[8.5px] font-mono font-bold rounded border shrink-0 ${v.id === currentItem.id ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                >
                  {v.variantLabel}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onReserve(currentItem)}
          className="p-1.5 rounded-lg neu-btn-raised text-amber-300 active:scale-95 shrink-0"
          title="Reserve"
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          disabled={isOutOfStock}
          onClick={() => onAddToCart(currentItem)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${inCartQty > 0 ? 'neu-btn-primary text-slate-950 font-black' : 'neu-btn-raised text-slate-200'
            }`}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{isOutOfStock ? (isAllInCart ? 'Max' : '0') : 'Add'}</span>
          {inCartQty > 0 && <span className="text-[9px] font-black font-mono">({inCartQty})</span>}
        </button>
      </div>
    </div>
  );
}
