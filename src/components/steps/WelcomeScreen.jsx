import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, QrCode, FileCheck, Clock, ShieldCheck, RotateCcw } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from '../ui/TouchButton';
import FullscreenToggle from '../ui/FullscreenToggle';
import ReturnEquipmentModal from './ReturnEquipmentModal';
import ReturnClearanceModal from './ReturnClearanceModal';

export default function WelcomeScreen() {
  const { setStep } = useTransaction();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
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
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    setStep(1);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col justify-between p-4 sm:p-6 lg:p-7 overflow-y-auto lg:overflow-hidden relative select-none animate-fade-in">
      {/* Soft Ambient Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-cyan-500/5 blur-[140px] rounded-full pointer-events-none -z-0" />

      {/* 1. Top Header Bar (Terminal ID & Theme Switcher) */}
      <div className="flex items-center justify-between w-full relative z-10 shrink-0 pb-1">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="font-bold tracking-wider text-cyan-400">UDD-POS-ENG</span>
          <span className="text-slate-600">•</span>
          <span>Kiosk Terminal #01</span>
        </div>

        <div>
          <FullscreenToggle />
        </div>
      </div>

      {/* 2. Center Section: Spacious, Evenly Distributed across Screen Height */}
      <div className="flex-1 flex flex-col items-center justify-between text-center py-2 sm:py-3 max-w-3xl mx-auto w-full relative z-10">
        {/* Top Header Elements: Status Pill & Live Digital Clock Pod */}
        <div className="flex flex-col items-center gap-2">
          {/* Touchscreen Kiosk Status Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full neu-inset-sm border border-emerald-500/20 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
            </span>
            <span className="text-[10.5px] sm:text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
              TOUCHSCREEN KIOSK READY • SYSTEM ACTIVE
            </span>
          </div>

          {/* Live Digital Clock Pod */}
          <div className="flex items-center gap-2 neu-inset px-5 py-1.5 rounded-full text-xs font-mono text-slate-300 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-400 font-bold text-xs sm:text-sm tracking-wider">{time}</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 text-xs hidden sm:inline">{date}</span>
          </div>
        </div>

        {/* Dual University Circular Logos with Halo Accent Rings */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 md:gap-16 py-1">
          {/* UdD Main University Seal */}
          <div className="relative group flex flex-col items-center">
            <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full p-2 neu-card transition-all duration-300 group-hover:scale-105 flex items-center justify-center relative shadow-md">
              <div className="absolute inset-0 rounded-full border border-cyan-500/20 pointer-events-none" />
              <img
                src="/images/udd_logo.png"
                alt="Universidad de Dagupan Seal"
                className="w-full h-full object-contain drop-shadow"
              />
            </div>
            <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider mt-2.5">
              Universidad de Dagupan
            </span>
          </div>

          {/* Divider Spark Line */}
          <div className="h-14 w-[1.5px] bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent hidden sm:block" />

          {/* School of Engineering Seal */}
          <div className="relative group flex flex-col items-center">
            <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full p-2 neu-card transition-all duration-300 group-hover:scale-105 flex items-center justify-center relative shadow-md">
              <div className="absolute inset-0 rounded-full border border-cyan-500/20 pointer-events-none" />
              <img
                src="/images/soe_logo.png"
                alt="School of Engineering Seal"
                className="w-full h-full object-contain drop-shadow"
              />
            </div>
            <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider mt-2.5">
              School of Engineering
            </span>
          </div>
        </div>

        {/* Hero Typography */}
        <div className="space-y-1 max-w-2xl px-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Engineering Laboratory Management System
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-normal">
            Mobile POS Touchscreen Kiosk • Automated Equipment Borrower's Slip & Inventory Control
          </p>
        </div>

        {/* 3 Feature Highlights (Spacious Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl px-2">
          <div className="flex items-center gap-3 p-3 rounded-2xl neu-card-sm text-left">
            <div className="w-8 h-8 rounded-xl neu-inset flex items-center justify-center text-cyan-400 shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">ID / RFID Scan</div>
              <div className="text-[11px] text-slate-400">1-Tap Student Autofill</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl neu-card-sm text-left">
            <div className="w-8 h-8 rounded-xl neu-inset flex items-center justify-center text-cyan-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Kairo AI Assistant</div>
              <div className="text-[11px] text-slate-400">Lab Syllabus Guidance</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl neu-card-sm text-left">
            <div className="w-8 h-8 rounded-xl neu-inset flex items-center justify-center text-cyan-400 shrink-0">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Print & PDF Slip</div>
              <div className="text-[11px] text-slate-400">UdD-FM-LM-01A-01</div>
            </div>
          </div>
        </div>

        {/* Dual Action CTA: Tap to Continue (Borrow) + Return Equipment / Clearance */}
        <div className="w-full max-w-md space-y-2.5 px-2">
          <TouchButton
            variant="primary"
            size="lg"
            icon={ArrowRight}
            fullWidth
            onClick={handleStart}
            className="font-bold tracking-wide py-3 sm:py-3.5 shadow-lg shadow-cyan-950/50"
          >
            TAP TO CONTINUE (BORROW)
          </TouchButton>

          <button
            type="button"
            onClick={() => setIsReturnModalOpen(true)}
            className="w-full min-h-[44px] rounded-2xl neu-btn-raised flex items-center justify-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-all active:scale-98 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return Equipment / Custodian Clearance Station</span>
          </button>
        </div>
      </div>

      {/* 3. Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 pt-2 border-t border-slate-800/80 text-[10px] sm:text-[11px] text-slate-500 w-full relative z-10 shrink-0">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Universidad de Dagupan • Arellano St., Dagupan City, Pangasinan</span>
        </div>
        <div className="font-mono text-slate-400">
          Document Code: UdD-FM-LM-01A-01 (Rev. 0)
        </div>
      </div>

      {/* Return Equipment Modal */}
      <ReturnEquipmentModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onOpenClearance={() => setIsClearanceModalOpen(true)}
      />

      {/* Return Clearance Certificate Slip Modal */}
      <ReturnClearanceModal
        isOpen={isClearanceModalOpen}
        onClose={() => setIsClearanceModalOpen(false)}
      />
    </div>
  );
}
