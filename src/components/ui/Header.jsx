import React, { useState, useEffect } from 'react';
import { RotateCcw, Home, Clock } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import ConfirmDialog from './ConfirmDialog';
import FullscreenToggle from './FullscreenToggle';
import ReturnEquipmentModal from '../steps/ReturnEquipmentModal';
import ReturnClearanceModal from '../steps/ReturnClearanceModal';

export default function Header() {
  const { resetTransaction, goToWelcome, currentStep, selectedLab } = useTransaction();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isHomeDialogOpen, setIsHomeDialogOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);

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

  const handleConfirmReset = () => {
    resetTransaction();
    setIsResetDialogOpen(false);
  };

  const handleConfirmHome = () => {
    goToWelcome();
    setIsHomeDialogOpen(false);
  };

  const getLabLabel = () => {
    if (selectedLab === 'CE') return 'Civil Engr';
    if (selectedLab === 'DIGITAL') return 'Digital / ECE';
    if (selectedLab === 'CHEM') return 'Chemistry';
    return 'All Labs';
  };

  // Hide header during Step 0 (WelcomeScreen)
  if (currentStep === 0) return null;

  return (
    <>
      <header className="h-16 sm:h-18 px-4 sm:px-8 lg:px-10 bg-[#111a2c] shadow-[0_4px_16px_#060a12] border-b border-slate-800/80 flex items-center justify-between shrink-0 select-none z-20">
        {/* Left: Official Logos & Branding */}
        <div className="flex items-center gap-3 sm:gap-4">
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
            <div className="text-sm sm:text-base font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              <span className="truncate">Universidad de Dagupan</span>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full neu-inset-sm text-cyan-400 font-mono hidden md:inline">
                SOE POS
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 hidden sm:block font-medium">
              School of Engineering
            </p>
          </div>

          {/* Active Lab Badge for Laptops/Desktops */}
          <div className="hidden 2xl:flex items-center gap-2 pl-3 border-l border-slate-800/80">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              {getLabLabel()}
            </span>
          </div>
        </div>

        {/* Center: Live Digital Clock (Shown only on larger screens) */}
        <div className="hidden lg:flex items-center gap-3 neu-inset px-5 py-2 rounded-2xl">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs sm:text-sm text-slate-300 font-medium">{date}</span>
          <span className="text-xs text-slate-600">|</span>
          <span className="font-mono text-xs sm:text-sm font-extrabold text-cyan-400 tracking-wider">
            {time || '12:00 PM'}
          </span>
        </div>

        {/* Right: Theme Switcher, Return Check-in, Home & Reset */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Return Check-in Button */}
          <button
            onClick={() => setIsReturnModalOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-2xl neu-btn-raised text-emerald-400 hover:text-emerald-300 text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer"
            title="Open Equipment Return & Custodian Clearance Station"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Return</span>
          </button>

          {/* 15" Portable Monitor Fullscreen Toggle */}
          <FullscreenToggle />

          {/* Home Button */}
          <button
            onClick={() => setIsHomeDialogOpen(true)}
            className="flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-2 rounded-2xl neu-btn-raised text-slate-200 hover:text-white text-xs sm:text-sm font-bold cursor-pointer"
            title="Return to Welcome Screen"
          >
            <Home className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Home</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={() => setIsResetDialogOpen(true)}
            className="flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-2 rounded-2xl neu-btn-raised text-slate-400 hover:text-rose-400 text-xs sm:text-sm font-bold cursor-pointer"
            title="Reset active transaction"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        title="Reset Current Session?"
        description="This will clear all borrower information and current cart items. Are you sure you want to restart?"
        confirmText="Yes, Reset"
        cancelText="Cancel"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetDialogOpen(false)}
      />

      {/* Confirm Home Dialog */}
      <ConfirmDialog
        isOpen={isHomeDialogOpen}
        title="Return to Welcome Screen?"
        description="This will end the current session and return to the main standby screen. Uncommitted cart items will be cleared."
        confirmText="Return to Welcome"
        cancelText="Stay Here"
        onConfirm={handleConfirmHome}
        onCancel={() => setIsHomeDialogOpen(false)}
      />

      {/* Return Equipment Modal */}
      <ReturnEquipmentModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onOpenClearance={() => setIsClearanceModalOpen(true)}
      />

      {/* Return Clearance Slip Modal */}
      <ReturnClearanceModal
        isOpen={isClearanceModalOpen}
        onClose={() => setIsClearanceModalOpen(false)}
      />
    </>
  );
}
