import React from 'react';
import { useTransaction } from '../../context/TransactionContext';

const STEPS = [
  { id: 1, label: 'Borrower' },
  { id: 2, label: 'Select Lab' },
  { id: 3, label: 'Equipment' },
  { id: 4, label: 'Done!' },
];

export default function MobileBottomNav() {
  const { currentStep, setStep, borrower, selectedLab, cart, theme } = useTransaction();

  // Hide on Welcome Screen (Step 0)
  if (currentStep === 0) return null;

  const isDark = theme === 'dark';

  const canNavigateTo = (stepId) => {
    if (stepId === 1) return true;
    if (stepId === 2) return Boolean(borrower.groupLeader);
    if (stepId === 3) return Boolean(borrower.groupLeader && selectedLab);
    if (stepId === 4) return currentStep === 4;
    return false;
  };

  return (
    <nav
      className={`xl:hidden fixed bottom-0 left-0 right-0 z-40 px-3 py-2.5 sm:py-3 select-none backdrop-blur-xl border-t transition-colors duration-300 ${
        isDark
          ? 'bg-[#0a0f1a]/95 border-slate-800/80 shadow-[0_-8px_24px_rgba(0,0,0,0.6)]'
          : 'bg-[#f0f5fa]/95 border-slate-300/80 shadow-[0_-8px_24px_rgba(100,116,139,0.2)]'
      }`}
      aria-label="Mobile Navigation"
    >
      {/* Outer Chevron Ribbon Track Capsule */}
      <div
        className={`max-w-xl mx-auto h-11 sm:h-12 rounded-full p-0.5 flex items-stretch border transition-all duration-300 overflow-hidden relative ${
          isDark
            ? 'bg-[#111a2a] border-slate-700/60 shadow-inner'
            : 'bg-[#d8e3f0] border-slate-300 shadow-inner'
        }`}
      >
        {STEPS.map((step, index) => {
          const isFirst = index === 0;
          const isLast = index === STEPS.length - 1;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isClickable = canNavigateTo(step.id) && step.id <= currentStep;

          // Compute exact chevron arrow clip-path for each position
          let clipPath = '';
          if (isFirst) {
            clipPath = 'polygon(0% 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 0% 100%)';
          } else if (isLast) {
            clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 10px 50%)';
          } else {
            clipPath = 'polygon(0% 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 0% 100%, 10px 50%)';
          }

          // Rounded outer corners for first and last segments
          const roundedClass = isFirst
            ? 'rounded-l-full pl-3.5 pr-2'
            : isLast
            ? 'rounded-r-full pl-3 pr-3.5'
            : 'px-2.5';

          // Theme-aware styles for active, completed, and inactive segments
          let segmentStyle = '';
          if (isActive) {
            segmentStyle = isDark
              ? 'bg-gradient-to-r from-[#00b4d8] via-[#06d6a0] to-[#00b4d8] text-slate-950 font-extrabold shadow-[0_0_16px_rgba(6,214,160,0.6)] z-20'
              : 'bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-600 text-white font-extrabold shadow-[0_2px_12px_rgba(13,148,136,0.5)] z-20';
          } else if (isCompleted) {
            segmentStyle = isDark
              ? 'bg-[#182438] text-slate-200 hover:text-white z-10'
              : 'bg-[#ebf2fa] text-slate-700 hover:text-slate-900 z-10 font-semibold';
          } else {
            segmentStyle = isDark
              ? 'bg-transparent text-slate-500 opacity-60 z-0'
              : 'bg-transparent text-slate-400 opacity-60 z-0';
          }

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && setStep(step.id)}
              style={{ clipPath }}
              className={`flex-1 flex items-center justify-center text-xs transition-all duration-200 relative font-medium active:scale-98 ${roundedClass} ${segmentStyle}`}
            >
              <span className="truncate text-[11px] sm:text-xs tracking-tight">
                {step.label}
              </span>

              {/* Cart Badge on Equipment Step */}
              {step.id === 3 && cart.length > 0 && (
                <span
                  className={`ml-1 text-[9px] font-bold rounded-full h-3.5 min-w-3.5 px-1 flex items-center justify-center ${
                    isActive
                      ? isDark
                        ? 'bg-slate-950 text-cyan-300'
                        : 'bg-white text-teal-800'
                      : 'bg-cyan-500 text-slate-950'
                  }`}
                >
                  {cart.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
