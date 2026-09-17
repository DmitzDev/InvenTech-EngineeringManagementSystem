import React, { useState, useEffect } from 'react';
import { Clock, Maximize2, Minimize2, Home, RotateCcw, X } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import ConfirmDialog from './ConfirmDialog';
import ReturnEquipmentModal from '../steps/ReturnEquipmentModal';
import ReturnClearanceModal from '../steps/ReturnClearanceModal';

export default function Header() {
  const { currentStep, theme, resetTransaction, goToWelcome } = useTransaction();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isHomeDialogOpen, setIsHomeDialogOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize fullscreen state with browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  };

  const handleHomeClick = () => {
    setIsHomeDialogOpen(true);
  };

  const handleConfirmHome = () => {
    goToWelcome();
    setIsHomeDialogOpen(false);
    setIsOpen(false);
  };

  const handleResetClick = () => {
    setIsResetDialogOpen(true);
  };

  const handleConfirmReset = () => {
    resetTransaction();
    setIsResetDialogOpen(false);
    setIsOpen(false);
  };

  const handleReturnClick = () => {
    setIsReturnModalOpen(true);
    setIsOpen(false);
  };

  // Hide header during Step 0 (WelcomeScreen)
  if (currentStep === 0) return null;

  return (
    <>
      <header className="h-16 sm:h-20 px-4 sm:px-8 lg:px-10 bg-[#111a2c] shadow-[0_4px_16px_#060a12] border-b border-slate-800/80 flex items-center justify-between shrink-0 select-none z-30 relative">
        {/* Left: Official Logos & University Branding */}
        <div className="flex items-center gap-3 sm:gap-4 z-10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-1 neu-card-sm flex items-center justify-center shrink-0">
              <img
                src="/images/udd_logo.png"
                alt="UdD Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-1 neu-card-sm hidden sm:flex items-center justify-center shrink-0">
              <img
                src="/images/soe_logo.png"
                alt="SOE Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div>
            <div className="text-sm sm:text-base font-extrabold text-slate-100 tracking-tight">
              <span className="truncate">Universidad de Dagupan</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 hidden sm:block font-medium">
              School of Engineering
            </p>
          </div>
        </div>

        {/* Center: Absolute 100% Dead-Center Dynamic Theme-Responsive INVEN • [Logo / X Trigger] • TECH 
            AM (Light Mode): INVEN is Sky Blue, TECH is Orange
            PM (Dark Mode): INVEN is Orange, TECH is Sky Blue */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 md:gap-4 select-none z-30">
          <span
            className={`text-lg sm:text-2xl md:text-3xl lg:text-[32px] xl:text-[36px] font-black tracking-wider sm:tracking-widest transition-colors duration-500 font-sans pointer-events-none ${
              isDark
                ? 'text-orange-400 drop-shadow-[0_0_16px_rgba(251,146,60,0.55)]'
                : 'text-sky-500 drop-shadow-[0_0_16px_rgba(14,165,233,0.45)]'
            }`}
          >
            INVEN
          </span>

          {/* Trigger Button: InvenTech Logo when closed -> Transforms to 'X' close button when open */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`relative group w-10 h-10 sm:w-12 sm:h-12 md:w-13 md:h-13 lg:w-14 lg:h-14 rounded-full p-0.5 sm:p-1 transition-all duration-300 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 ${
              isOpen
                ? 'bg-[#151c2d] border-2 border-rose-500/80 shadow-[0_0_24px_rgba(244,63,94,0.65)] rotate-90 text-rose-400 ring-4 ring-rose-500/20 scale-105'
                : 'bg-[#0c1527] border-2 border-cyan-400/90 shadow-[0_0_20px_rgba(6,182,212,0.6)] hover:shadow-[0_0_28px_rgba(6,182,212,0.85)] hover:scale-105 rotate-0'
            }`}
            title={isOpen ? 'Close Rudder Menu' : 'Open InvenTech Rudder Menu (Fullscreen, Home, Return, Reset)'}
            aria-label="Toggle InvenTech Rudder Menu"
          >
            {isOpen ? (
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400 transition-transform duration-300" />
            ) : (
              <>
                {/* Gentle Radar Pulse when Idle */}
                <span className="absolute inset-0 rounded-full border border-cyan-400/40 animate-ping pointer-events-none" />

                <img
                  src="/images/inventech_logo.png"
                  alt="InvenTech Brand Logo"
                  className="w-full h-full object-cover rounded-full"
                />

                {/* Micro Status Dot */}
                <span className="absolute -bottom-0.5 sm:-bottom-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)] group-hover:scale-125 transition-transform" />
              </>
            )}
          </button>

          <span
            className={`text-lg sm:text-2xl md:text-3xl lg:text-[32px] xl:text-[36px] font-black tracking-wider sm:tracking-widest transition-colors duration-500 font-sans pointer-events-none ${
              isDark
                ? 'text-sky-400 drop-shadow-[0_0_16px_rgba(56,189,248,0.55)]'
                : 'text-orange-500 drop-shadow-[0_0_16px_rgba(249,115,22,0.45)]'
            }`}
          >
            TECH
          </span>
        </div>

        {/* Dropdown Floating Action Dock (Directly below the top navbar center) */}
        {isOpen && (
          <>
            {/* Dimmed Click-away backdrop */}
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] animate-fade-in select-none"
            />

            {/* Floating Rudder Action Menu Dock (Animated slide-down) */}
            <div className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-50 select-none pointer-events-auto">
              <div className="animate-slide-down bg-[#09101d]/95 border border-cyan-500/50 backdrop-blur-2xl px-3 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex items-center justify-center gap-2 sm:gap-3">
                {/* Item 1: Exit Fullscreen / Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl neu-btn-raised text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="whitespace-nowrap">Exit Full</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="whitespace-nowrap">Fullscreen</span>
                    </>
                  )}
                </button>

                {/* Item 2: Home Button */}
                <button
                  type="button"
                  onClick={handleHomeClick}
                  className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl neu-btn-raised text-slate-200 hover:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
                  title="Return to Welcome Screen"
                >
                  <Home className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Home</span>
                </button>

                {/* Item 3 (GITNA / CENTER): The InvenTech Logo right in the middle of the 4 buttons! */}
                <div
                  onClick={() => setIsOpen(false)}
                  className="w-11 h-11 sm:w-12 sm:h-12 lg:w-13 lg:h-13 rounded-full p-0.5 sm:p-1 bg-[#0a1324] border-2 border-cyan-400 shadow-[0_0_24px_rgba(6,182,212,0.85)] flex items-center justify-center relative shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                  title="InvenTech Core Logo (Tap to close)"
                >
                  <img
                    src="/images/inventech_logo.png"
                    alt="InvenTech Central Hub"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

                {/* Item 4: Return Equipment Modal Station */}
                <button
                  type="button"
                  onClick={handleReturnClick}
                  className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl neu-btn-raised text-emerald-400 hover:text-emerald-300 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
                  title="Equipment Return & Custodian Clearance"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Return</span>
                </button>

                {/* Item 5: Reset Session Button */}
                <button
                  type="button"
                  onClick={handleResetClick}
                  className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl neu-btn-raised text-slate-300 hover:text-rose-400 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
                  title="Reset current transaction"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Right: Live Digital Clock Pod (Clean, Spacious, Uncluttered) */}
        <div className="flex items-center gap-2.5 sm:gap-3 neu-inset px-4 sm:px-5 py-2 rounded-2xl z-10">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs sm:text-sm text-slate-300 font-medium hidden sm:inline">{date}</span>
          <span className="text-xs text-slate-600 hidden sm:inline">|</span>
          <span className="font-mono text-xs sm:text-sm font-extrabold text-cyan-400 tracking-wider">
            {time || '12:00 PM'}
          </span>
        </div>
      </header>

      {/* Global Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        title="Reset Current Session?"
        description="This will clear all borrower information and current cart items. Are you sure you want to restart?"
        confirmText="Yes, Reset"
        cancelText="Cancel"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetDialogOpen(false)}
      />

      {/* Global Confirm Home Dialog */}
      <ConfirmDialog
        isOpen={isHomeDialogOpen}
        title="Return to Welcome Screen?"
        description="This will end the current session and return to the main standby screen. Uncommitted cart items will be cleared."
        confirmText="Return to Welcome"
        cancelText="Stay Here"
        onConfirm={handleConfirmHome}
        onCancel={() => setIsHomeDialogOpen(false)}
      />

      {/* Global Return Equipment Station Modal */}
      <ReturnEquipmentModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onOpenClearance={() => setIsClearanceModalOpen(true)}
      />

      {/* Global Return Clearance Slip Modal */}
      <ReturnClearanceModal
        isOpen={isClearanceModalOpen}
        onClose={() => setIsClearanceModalOpen(false)}
      />
    </>
  );
}
