import React from 'react';
import { ShoppingBag, Sparkles, Trash2, Plus, Minus, ArrowRight, AlertTriangle, ShieldAlert, ChevronRight } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from '../ui/TouchButton';

export default function BorrowCart({ onProceed, onOpenAIAssistant }) {
  const { cart, updateCartQty, toggleItemDamage, removeFromCart, clearCart } = useTransaction();

  const totalUnitsCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const distinctItemCount = cart.length;
  const isLimitReached = distinctItemCount >= 15;
  const damagedCount = cart.filter((i) => i.isDamaged).length;

  return (
    <div className="neu-card rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl">
      {/* 1. Cart Header */}
      <div className="p-4 border-b border-slate-800/80 bg-[#111a2c] shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl neu-inset flex items-center justify-center text-cyan-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-100">Borrow Cart</h3>
                {damagedCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full neu-inset-amber text-amber-300 font-mono font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {damagedCount} Flagged
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {totalUnitsCount} total units • <span className="font-bold text-slate-200">{distinctItemCount}/15</span> maximum slots
              </p>
            </div>
          </div>

          {distinctItemCount > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors px-2.5 py-1 rounded-lg neu-btn-raised"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Integrated Capacity Meter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold">Sheet Capacity:</span>
            <span
              className={`font-mono font-bold ${isLimitReached ? 'text-rose-400' : 'text-cyan-400'
                }`}
            >
              {distinctItemCount} of 15 Items
            </span>
          </div>
          <div className="w-full h-2 neu-inset rounded-full overflow-hidden p-0.5">
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
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 min-h-[160px]">
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
          cart.map((item, index) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl transition-all duration-150 flex flex-col gap-2.5 text-left ${item.isDamaged
                  ? 'neu-card ring-2 ring-amber-500/80 shadow-[0_0_16px_rgba(245,158,11,0.25)]'
                  : 'neu-card-sm neu-card-hover'
                }`}
            >
              {/* Row 1: Number, Title, Tag & Remove */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span className="w-6 h-6 rounded-lg neu-inset text-cyan-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5 flex-wrap">
                      <span className="text-cyan-400 neu-inset-sm px-1.5 py-0.5 rounded font-bold">
                        {item.tagCode}
                      </span>
                      <span>•</span>
                      <span>Unit: {item.unit}</span>
                      <span>•</span>
                      <span className="text-slate-400">{item.category}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 neu-btn-raised transition-colors shrink-0"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Damaged Status Banner (if flagged) */}
              {item.isDamaged && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-inset-amber text-[11px] text-amber-200">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-300" />
                  <span className="font-bold">Flagged for Custodian Inspection (Pre-existing issue)</span>
                </div>
              )}

              {/* Row 2: Quantity Controls & Damage Toggle Button */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                {/* Stepper with Neumorphic buttons */}
                <div className="flex items-center gap-1.5 neu-inset rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => updateCartQty(item.id, -1)}
                    className="w-8 h-8 rounded-lg neu-btn-raised text-slate-300 flex items-center justify-center text-base font-bold"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="w-8 text-center font-mono font-bold text-sm text-cyan-400">
                    {item.qty}
                  </span>

                  <button
                    type="button"
                    onClick={() => updateCartQty(item.id, 1)}
                    className="w-8 h-8 rounded-lg neu-btn-raised text-slate-300 flex items-center justify-center text-base font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Report Damaged / Issue Toggle */}
                <button
                  type="button"
                  onClick={() => toggleItemDamage(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${item.isDamaged
                      ? 'neu-inset-amber text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                      : 'neu-btn-raised text-slate-300 hover:text-amber-300'
                    }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.isDamaged ? 'Flagged Damaged' : 'Report Damaged'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Cart Fixed Bottom Checkout Bar */}
      <div className="p-4 border-t border-slate-800/80 bg-[#111a2c] shrink-0 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300 px-1">
          <span className="font-semibold">Borrow Summary:</span>
          <span className="font-mono font-bold text-cyan-400 text-sm">
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
          className="py-3.5"
        >
          Generate Borrower Sheet ({distinctItemCount})
        </TouchButton>
      </div>
    </div>
  );
}
