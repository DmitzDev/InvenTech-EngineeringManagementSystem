import React from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';

export default function InactivityWarningModal({
  isOpen,
  remainingSeconds = 15,
  onContinue,
  onResetNow,
}) {
  const { theme } = useTransaction();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in select-none"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="inactivity-title"
    >
      <div
        className={`w-full max-w-sm rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center space-y-6 shadow-2xl animate-scale-up transition-colors ${
          isDark
            ? 'bg-[#0f172a] text-slate-100 border border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.85)]'
            : 'bg-white text-slate-900 border border-slate-200 shadow-xl'
        }`}
      >
        {/* Minimalist Countdown Ring */}
        <div className="relative flex items-center justify-center">
          <div
            className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 transition-colors ${
              isDark
                ? 'border-amber-400/80 bg-amber-950/30 text-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.15)]'
                : 'border-amber-500 bg-amber-50 text-amber-600'
            }`}
          >
            <span className="text-4xl font-black font-mono tracking-tight tabular-nums leading-none">
              {remainingSeconds}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-80">
              seconds
            </span>
          </div>
        </div>

        {/* Clean, Non-Technical Title & Subtitle */}
        <div className="space-y-1.5">
          <h2
            id="inactivity-title"
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Are you still there?
          </h2>
          <p
            className={`text-xs sm:text-sm font-medium ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Your session will reset soon due to inactivity.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={onContinue}
            className={`w-full min-h-[48px] py-3 px-5 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md ${
              isDark
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
            autoFocus
          >
            <RefreshCw className="w-4 h-4" />
            <span>Continue Session</span>
          </button>

          <button
            type="button"
            onClick={onResetNow}
            className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all border ${
              isDark
                ? 'bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border-slate-700/80 hover:border-rose-500/40'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-rose-700 border-slate-300'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Now</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
