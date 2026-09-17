import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, Home, RotateCcw, X } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import ConfirmDialog from './ConfirmDialog';
import ReturnEquipmentModal from '../steps/ReturnEquipmentModal';
import ReturnClearanceModal from '../steps/ReturnClearanceModal';

export default function RudderActionMenu() {
  const { currentStep, resetTransaction, goToWelcome } = useTransaction();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isHomeDialogOpen, setIsHomeDialogOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);

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
    if (currentStep === 0) {
      setIsOpen(false);
      return;
    }
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

  // Hide Rudder menu during Step 0 (WelcomeScreen)
  if (currentStep === 0) return null;

  return (
    <>
      {/* Dim Click-away Backdrop when Rudder Menu is Expanded */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] animate-fade-in select-none"
        />
      )}

      {/* Floating Center Rudder Controller: 
          Aligned exactly level ('tapat') with the kiosk's left & right navigation buttons on steps 1-4 */}
      <div className="fixed left-1/2 -translate-x-1/2 z-40 flex flex-col items-center select-none pointer-events-auto transition-all duration-300 bottom-[48px] sm:bottom-[54px] lg:bottom-[58px]">
        {/* EXPANDED STATE: Horizontal 5-Item Action Dock + Bottom 'X' Button */}
        {isOpen ? (
          <div className="flex flex-col items-center gap-2 sm:gap-2.5 animate-slide-up">
            {/* 1. The 5-Item Horizontal Dock (Exit Fullscreen - Home - InvenTech Center Logo - Return - Reset) */}
            <div className="bg-[#09101d]/95 border border-cyan-500/40 backdrop-blur-2xl px-3 sm:px-5 py-2 rounded-full shadow-[0_16px_45px_rgba(0,0,0,0.85)] flex items-center justify-center gap-2 sm:gap-3">
              {/* Item 1: Exit Full Screen / Fullscreen Toggle */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl neu-btn-raised text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
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

              {/* Item 3 (GITNA / CENTER): The Elevated InvenTech Circle Logo (Aligned level with all 4 buttons) */}
              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 bg-[#0a1324] border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center justify-center relative shrink-0"
                title="InvenTech Core Hub"
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

            {/* 2. Anchor Spot 'X' (Close) Button: Exactly in line between the kiosk's left and right buttons */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full neu-btn-raised bg-[#0b1322] border border-cyan-500/40 flex items-center justify-center text-slate-300 hover:text-rose-400 shadow-[0_4px_16px_rgba(0,0,0,0.7)] cursor-pointer active:scale-95 transition-all"
              title="Close Rudder Menu"
              aria-label="Close Rudder Menu"
            >
              <X className="w-5 h-5 text-slate-300 hover:text-rose-400 transition-colors" />
            </button>
          </div>
        ) : (
          /* COLLAPSED IDLE STATE: Circular InvenTech Rudder Button 
             (Perfect horizontal & vertical alignment with Kiosk Left & Right CTA buttons) */
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative w-12 h-12 sm:w-13 sm:h-13 rounded-full p-0.5 bg-[#091120] border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_28px_rgba(6,182,212,0.8)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center"
            title="Open InvenTech Quick Menu"
            aria-label="Open InvenTech Quick Menu"
          >
            {/* Radiant Touch Pulse */}
            <span className="absolute inset-0 rounded-full border border-cyan-400/40 animate-ping pointer-events-none" />

            {/* Circular InvenTech Logo */}
            <img
              src="/images/inventech_logo.png"
              alt="InvenTech Rudder Menu"
              className="w-full h-full object-cover rounded-full"
            />
          </button>
        )}
      </div>

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
