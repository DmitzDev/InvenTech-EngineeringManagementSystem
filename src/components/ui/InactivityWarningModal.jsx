/**
 * InvenTech Laboratory Management System - Inactivity Deadman Warning Modal
 * Module: [SYS.SEC // OVERLAY-MOD-01]
 * 
 * High-contrast skeuomorphic industrial dialog triggered after 45s of terminal inactivity.
 * Displays countdown timer and provides large 44px+ touch targets for session continuation.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Clock, RefreshCw, LogOut, ShieldAlert } from 'lucide-react';
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="inactivity-title"
      aria-describedby="inactivity-desc"
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#0c1322] border-2 border-amber-500/80 dark:border-amber-500/90 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden animate-scale-up">
        {/* Top Warning Industrial Banner */}
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 flex items-center justify-between font-mono font-black text-xs sm:text-sm tracking-wider">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 animate-bounce" />
            <span>[SYS.SEC // GUARD-01 • DEADMAN ENGINE]</span>
          </div>
          <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
            TIMED OVERLAY
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-6">
          {/* Animated Countdown Radar Pod */}
          <div className="relative flex items-center justify-center">
            {/* Pulsing Alert Rings */}
            <span className="absolute w-28 h-28 rounded-full bg-amber-500/20 dark:bg-amber-500/10 animate-ping pointer-events-none" />
            <div className="w-24 h-24 rounded-full border-4 border-amber-500/80 dark:border-amber-400 bg-amber-50 dark:bg-amber-950/40 flex flex-col items-center justify-center shadow-inner relative z-10">
              <span className="font-mono text-4xl sm:text-5xl font-black text-amber-600 dark:text-amber-400 tracking-tighter tabular-nums">
                {String(remainingSeconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-mono font-extrabold uppercase text-amber-700 dark:text-amber-300 -mt-1">
                SEC REMAINING
              </span>
            </div>
          </div>

          {/* Heading & Notice */}
          <div className="space-y-2">
            <h2
              id="inactivity-title"
              className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight uppercase"
            >
              INACTIVITY DETECTED // AUTO-RESETTING SESSION IN {remainingSeconds}s
            </h2>
            <p
              id="inactivity-desc"
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 max-w-md mx-auto leading-relaxed"
            >
              Terminal has been idle for 45 seconds. To protect student privacy, uncommitted form entries and borrower data will be purged automatically upon expiry.
            </p>
          </div>

          {/* Telemetry Status Strip */}
          <div className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 flex items-center justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            <span>TARGET ACTION:</span>
            <span className="text-amber-600 dark:text-amber-400">HARD PURGE & RETURN TO STANDBY</span>
          </div>

          {/* Action Button Tray (High-Contrast, Min 44px+ Touch Targets) */}
          <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onContinue}
              className="flex-1 min-h-[52px] px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm sm:text-base tracking-wide flex items-center justify-center gap-2.5 shadow-lg active:scale-95 transition-all cursor-pointer border-2 border-amber-600 dark:border-amber-400"
              autoFocus
            >
              <RefreshCw className="w-5 h-5 shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
              <span>CONTINUE SESSION</span>
            </button>

            <button
              type="button"
              onClick={onResetNow}
              className="min-h-[52px] px-5 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-900 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-sm flex items-center justify-center gap-2 border-2 border-slate-300 dark:border-slate-700 transition-all cursor-pointer active:scale-95"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Reset Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
