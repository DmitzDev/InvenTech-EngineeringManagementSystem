import React from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from './TouchButton';

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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="inactivity-title"
    >
      <div
        className={`w-full max-w-sm rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center space-y-6 shadow-2xl animate-scale-up transition-colors ${
          isDark
            ? 'neu-card border border-slate-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-slate-100'
            : 'bg-white text-slate-900 border border-slate-200 shadow-2xl'
        }`}
      >
        {/* Minimalist Countdown Ring - Synced to Kiosk Cyber Cyan / Electric Blue */}
        <div className="relative flex items-center justify-center">
          <div
            className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 transition-colors ${
              isDark
                ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_24px_rgba(6,182,212,0.35)]'
                : 'border-blue-500 bg-blue-50 text-blue-600 shadow-md'
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

        {/* Action Buttons - Synced with TouchButton (neu-btn-primary and neu-btn-raised) */}
        <div className="w-full flex flex-col gap-3 pt-1">
          <TouchButton
            variant="primary"
            size="md"
            icon={RefreshCw}
            onClick={onContinue}
            fullWidth
            className="w-full font-black text-sm tracking-wide shadow-lg"
            autoFocus
          >
            Continue Session
          </TouchButton>

          <TouchButton
            variant="secondary"
            size="md"
            icon={RotateCcw}
            onClick={onResetNow}
            fullWidth
            className="w-full font-bold text-xs"
          >
            Reset Now
          </TouchButton>
        </div>
      </div>
    </div>,
    document.body
  );
}
