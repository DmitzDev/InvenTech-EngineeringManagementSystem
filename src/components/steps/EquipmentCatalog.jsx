import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Plus, Check, ArrowLeft, ArrowRight, ShieldCheck, AlertCircle, Calendar, Package, ShoppingBag } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import { getInventory, LAB_OPTIONS } from '../../data/equipmentData';
import TouchButton from '../ui/TouchButton';
import BorrowCart from './BorrowCart';
import ReservationModal from './ReservationModal';
import ActiveReservationsModal from './ActiveReservationsModal';

export default function EquipmentCatalog() {
  const {
    selectedLab,
    cart,
    addToCart,
    setStep,
    commitTransaction,
    reservations,
  } = useTransaction();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isActiveReservationsOpen, setIsActiveReservationsOpen] = useState(false);
  const [selectedItemForReservation, setSelectedItemForReservation] = useState(null);
  const [mobileView, setMobileView] = useState('catalog'); // 'catalog' | 'cart'

  // Get live inventory from shared storage
  const allEquipment = useMemo(() => getInventory(), [selectedLab]);

  // Get current laboratory info
  const currentLabInfo = useMemo(() => {
    return (
      LAB_OPTIONS.find((l) => l.id === selectedLab) || {
        name: 'All Engineering Apparatus',
        shortName: 'ALL',
      }
    );
  }, [selectedLab]);

  // Extract laboratory equipment
  const labEquipment = useMemo(() => {
    if (!selectedLab) return allEquipment;
    if (selectedLab === 'DIGITAL_ECE') {
      return allEquipment.filter((item) => item.lab === 'DIGITAL' || item.lab === 'ECE');
    }
    return allEquipment.filter((item) => item.lab === selectedLab);
  }, [selectedLab, allEquipment]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = ['ALL', ...new Set(labEquipment.map((item) => item.category))];
    return cats;
  }, [labEquipment]);

  // Filter equipment based on search and category
  const filteredEquipment = useMemo(() => {
    return labEquipment.filter((item) => {
      const matchesCategory =
        activeCategory === 'ALL' || item.category === activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tagCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [labEquipment, activeCategory, searchQuery]);

  const handleAddToCart = (item) => {
    addToCart(item);
  };

  const handleProceed = () => {
    if (cart.length > 0) {
      commitTransaction();
    }
  };

  const getItemCartQty = (id) => {
    const found = cart.find((i) => i.id === id);
    return found ? found.qty : 0;
  };

  const getItemActiveReservations = (itemId) => {
    return reservations.filter((r) => r.itemId === itemId);
  };

  return (
    <div className="flex-1 overflow-y-auto lg:overflow-hidden p-3 sm:p-5 lg:p-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full flex flex-col justify-between select-none">
      {/* Top Department Breadcrumb & Actions */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TouchButton
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => setStep(2)}
            className="px-2.5 py-1 text-xs"
          >
            Change Lab
          </TouchButton>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full neu-inset-sm text-cyan-400">
              {currentLabInfo.shortName}
            </span>
            <span className="text-xs text-slate-300 font-semibold hidden sm:inline">
              {currentLabInfo.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Bookings Log Trigger */}
          <button
            type="button"
            onClick={() => setIsActiveReservationsOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl neu-btn-raised text-amber-400 text-xs font-bold transition-all active:scale-95"
            title="View Upcoming Equipment Reservations"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Bookings ({reservations.length})</span>
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Segmented Tab Switcher (Visible on screens < lg) */}
      <div className="lg:hidden flex items-center p-1 rounded-2xl neu-inset mb-3 gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setMobileView('catalog')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${mobileView === 'catalog'
              ? 'neu-btn-primary text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
            }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Catalog ({filteredEquipment.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileView('cart')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${mobileView === 'cart'
              ? 'neu-btn-primary text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
            }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Borrow Cart</span>
          {cart.length > 0 && (
            <span
              className={`text-[10px] font-bold rounded-full px-1.5 py-0.2 ${mobileView === 'cart' ? 'bg-slate-950 text-cyan-300' : 'bg-cyan-500 text-slate-950'
                }`}
            >
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Split Layout: Left 7 Cols (Catalog) | Right 5 Cols (Borrow Cart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left Catalog Grid */}
        <div
          className={`lg:col-span-7 flex-col h-full overflow-hidden neu-card rounded-2xl p-4 ${mobileView === 'catalog' ? 'flex' : 'hidden lg:flex'
            }`}
        >
          {/* Search & Category Filter Toolbar */}
          <div className="space-y-3 pb-3 border-b border-slate-800/80 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apparatus by name, tag code..."
                className="w-full min-h-[44px] pl-10 pr-4 rounded-xl neu-inset text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Category Filter Chips (Horizontal Scrollable) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive
                        ? 'neu-btn-primary shadow-md'
                        : 'neu-btn-raised text-slate-300 hover:text-white'
                      }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalog Scrollable Cards */}
          <div className="flex-1 overflow-y-auto pt-3 pr-1 space-y-3">
            {filteredEquipment.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-600 mb-1" />
                <p className="text-sm font-bold text-slate-300">No equipment found</p>
                <p className="text-xs text-slate-500 max-w-[200px]">
                  Try adjusting your search terms or category filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredEquipment.map((item) => {
                  const inCartQty = getItemCartQty(item.id);
                  const itemReservations = getItemActiveReservations(item.id);
                  const totalReservedQty = itemReservations.reduce((sum, r) => sum + r.qty, 0);

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl transition-all duration-200 flex flex-col justify-between text-left ${inCartQty > 0
                          ? 'neu-card ring-2 ring-cyan-500/80 shadow-[0_0_16px_rgba(6,182,212,0.25)]'
                          : 'neu-card-sm neu-card-hover'
                        }`}
                    >
                      <div>
                        {/* Tag Code, Unit & Stock Pill */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-cyan-400 neu-inset-sm px-2 py-0.5 rounded">
                              {item.tagCode}
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                item.lab === 'DIGITAL'
                                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                  : item.lab === 'ECE'
                                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                  : item.lab === 'CE'
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : item.lab === 'CHEM'
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : item.lab === 'PHYSICS'
                                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                  : 'bg-slate-700/30 text-slate-300'
                              }`}
                            >
                              {item.lab === 'DIGITAL' ? 'DIGITAL' : item.lab === 'ECE' ? 'ECE' : item.lab}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Reserved Status Indicator */}
                            {totalReservedQty > 0 && (
                              <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                                {totalReservedQty} Booked
                              </span>
                            )}

                            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                              <span>{item.stock} {item.unit}s</span>
                            </div>
                          </div>
                        </div>

                        {/* Name & Description */}
                        <h4 className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Card Bottom: Add to Cart + Advance Reserve Buttons */}
                      <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        {/* Reserve for Future Date Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedItemForReservation(item)}
                          className="min-h-[38px] px-2.5 rounded-xl text-xs font-bold neu-btn-raised text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-all active:scale-95"
                          title="Reserve equipment for a future date/time slot"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Reserve</span>
                        </button>

                        {/* Immediate Borrow Add to Cart Button */}
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${inCartQty > 0
                              ? 'neu-btn-primary shadow-md'
                              : 'neu-btn-raised text-slate-200 hover:text-white'
                            }`}
                        >
                          {inCartQty > 0 ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Added ({inCartQty})</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>+ Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Mobile Switch-to-Cart Action Bar (Visible when in catalog view on mobile and cart has items) */}
          {cart.length > 0 && (
            <div className="lg:hidden pt-3 mt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-300 font-bold">
                {cart.length} apparatus selected
              </span>
              <button
                type="button"
                onClick={() => setMobileView('cart')}
                className="px-4 py-2 rounded-xl neu-btn-primary text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <span>View Cart & Proceed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right 5 Columns: Borrow Cart */}
        <div
          className={`lg:col-span-5 flex-col h-full overflow-hidden ${
            mobileView === 'cart' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <BorrowCart onProceed={handleProceed} />
        </div>
      </div>

      {/* Equipment Advance Reservation Modal */}
      {selectedItemForReservation && (
        <ReservationModal
          item={selectedItemForReservation}
          isOpen={Boolean(selectedItemForReservation)}
          onClose={() => setSelectedItemForReservation(null)}
        />
      )}

      {/* Active Equipment Bookings Log Modal */}
      <ActiveReservationsModal
        isOpen={isActiveReservationsOpen}
        onClose={() => setIsActiveReservationsOpen(false)}
      />
    </div>
  );
}
