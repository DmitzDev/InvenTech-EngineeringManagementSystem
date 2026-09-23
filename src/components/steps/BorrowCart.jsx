import React from 'react';
import { ShoppingBag, Sparkles, Trash2, Plus, Minus, ArrowRight, AlertTriangle, ShieldAlert, ChevronRight, X } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import { getItemImage } from '../../data/equipmentData';
import TouchButton from '../ui/TouchButton';

export default function BorrowCart({ onProceed, onClose, onOpenAIAssistant }) {
  const { cart, updateCartQty, toggleItemDamage, removeFromCart, clearCart } = useTransaction();

  const totalUnitsCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const distinctItemCount = cart.length;
  const isLimitReached = distinctItemCount >= 15;
  const damagedCount = cart.filter((i) => i.isDamaged).length;

  return (
    <div className="w-full h-full max-h-[100dvh] flex flex-col justify-between overflow-hidden shadow-2xl bg-[#0e1422] rounded-none sm:rounded-l-3xl">
      {/* 1. Cart Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-800/80 bg-[#111a2c] shrink-0 space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl neu-inset flex items-center justify-center text-cyan-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-100">Borrow Cart</h3>
                {distinctItemCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full neu-inset text-cyan-300 font-mono text-xs font-bold">
                    {distinctItemCount}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {totalUnitsCount} total units • <span className="font-bold text-slate-200">{distinctItemCount}/15</span> maximum slots
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {distinctItemCount > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 rounded-lg neu-btn-raised"
              >
                Clear
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg neu-btn-raised text-slate-400 hover:text-white flex items-center justify-center transition-colors active:scale-95"
                title="Close Cart"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Integrated Capacity Meter */}
        <div className="space-y-1 sm:space-y-1.5">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
            <span className="text-slate-400 font-semibold">Sheet Capacity:</span>
            <span
              className={`font-mono font-bold ${isLimitReached ? 'text-rose-400' : 'text-cyan-400'
                }`}
            >
              {distinctItemCount} of 15 Items
            </span>
          </div>
          <div className="w-full h-1.5 sm:h-2 neu-inset rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full transition-all duration-300 rounded-full ${isLimitReached
                ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                : distinctItemCount > 10
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                }`}
              style={{ width: `${Math.min(100, (distinctItemCount / 15) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cart Item List (Dominant, Scrollable, Neumorphic Cards) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-3.5 space-y-2.5 sm:space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3 my-auto">
            <div className="w-14 h-14 rounded-2xl neu-inset flex items-center justify-center text-slate-500">
              <ShoppingBag className="w-7 h-7 stroke-1" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">Your Cart is Empty</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px] leading-relaxed">
                Select laboratory apparatus from the catalog on the left to add items to your borrower sheet.
              </p>
            </div>
          </div>
        ) : (
          cart.map((item, index) => {
            const itemImg = getItemImage(item);
            return (
              <div
                key={item.id}
                className={`p-3 sm:p-3.5 rounded-2xl transition-all duration-150 flex flex-col gap-2 sm:gap-2.5 text-left ${item.isDamaged
                  ? 'neu-card ring-2 ring-amber-500/80 shadow-[0_0_16px_rgba(245,158,11,0.25)]'
                  : 'neu-card-sm neu-card-hover'
                  }`}
              >
                {/* Row 1: Number, Thumbnail, Title, Tag & Remove */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 sm:gap-2.5 min-w-0 flex-1">
                    {itemImg ? (
                      <img
                        src={itemImg}
                        alt={item.name}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover bg-slate-950 border border-slate-800 shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs shrink-0 mt-0.5">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-mono text-cyan-400 font-bold truncate">
                          {item.tagCode}
                        </span>
                        <span
                          className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded uppercase ${
                            item.isConsumable
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {item.isConsumable ? 'Consumable' : 'Returnable'}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate leading-snug">
                        {item.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Unit: {item.unit || 'pc'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="w-8 h-8 rounded-lg neu-btn-raised text-slate-500 hover:text-rose-400 flex items-center justify-center shrink-0 transition-colors active:scale-95"
                    title="Remove from Cart"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Damaged Status Banner (if flagged) */}
                {item.isDamaged && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-inset-amber text-[11px] text-amber-200">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-300" />
                    <span className="font-bold">Flagged for Custodian Inspection (Pre-existing issue)</span>
                  </div>
                )}

                {/* Row 2: Quantity Controls & Damage Flag */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                  {/* Stepper (+ / -) */}
                  <div className="flex items-center gap-1.5 neu-inset rounded-xl p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.id, -1)}
                      className="w-8 h-8 sm:w-10 sm:h-10 min-w-[32px] sm:min-w-[40px] rounded-lg neu-btn-raised text-slate-300 hover:text-rose-400 flex items-center justify-center text-sm font-bold active:scale-95 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    <span className="w-7 sm:w-8 text-center font-mono font-extrabold text-xs sm:text-sm text-cyan-300">
                      {item.qty}
                    </span>

                    <button
                      type="button"
                      onClick={() => updateCartQty(item.id, 1)}
                      className="w-8 h-8 sm:w-10 sm:h-10 min-w-[32px] sm:min-w-[40px] rounded-lg neu-btn-raised text-slate-300 flex items-center justify-center text-sm font-bold active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>

                  {/* Report Damaged / Issue Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleItemDamage(item.id)}
                    className={`min-h-[36px] sm:min-h-[44px] px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${item.isDamaged
                      ? 'neu-inset-amber text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                      : 'neu-btn-raised text-slate-300 hover:text-amber-300'
                      }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.isDamaged ? 'Flagged Damaged' : 'Report Damaged'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Cart Fixed Bottom Checkout Bar (Always visible on mobile without scrolling) */}
      <div className="p-3.5 sm:p-4 border-t border-slate-800/80 bg-[#111a2c] shrink-0 space-y-2.5 sm:space-y-3 z-20 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between text-xs text-slate-300 px-1">
          <span className="font-semibold">Borrow Summary:</span>
          <span className="font-mono font-bold text-cyan-400 text-xs sm:text-sm">
            {totalUnitsCount} Units • {distinctItemCount} Apparatus
          </span>
        </div>

        <TouchButton
          variant="primary"
          size="lg"
          fullWidth
          disabled={cart.length === 0}
          icon={ArrowRight}
          onClick={onProceed}
          className="py-3 sm:py-3.5 text-xs sm:text-sm font-bold"
        >
          Generate Borrower Sheet ({distinctItemCount})
        </TouchButton>
      </div>
    </div>
  );
}
