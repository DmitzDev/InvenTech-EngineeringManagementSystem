import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, FileCheck, Clock, ShieldCheck, RotateCcw, Maximize2 } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from '../ui/TouchButton';
import ReturnEquipmentModal from './ReturnEquipmentModal';
import ReturnClearanceModal from './ReturnClearanceModal';

export default function WelcomeScreen() {
  const { setStep, theme } = useTransaction();
  const isDark = theme === 'dark';
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);
  const [fullscreenToast, setFullscreenToast] = useState(null);

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

  // Automatic Fullscreen Toggle via Double Touch / Tap (Exclusive to Welcome Screen)
  useEffect(() => {
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    const handlePointerDown = (e) => {
      // Ignore if clicking interactive buttons, links, or modals
      if (e.target.closest('button, a, input, [role="button"], .modal-overlay, .modal-content')) {
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastTapTime;
      const dist = Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY);

      // Double-tap threshold: between 60ms and 400ms, within 55px radius
      if (timeDiff > 60 && timeDiff < 400 && dist < 55) {
        try {
          if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            const docEl = document.documentElement;
            if (docEl.requestFullscreen) {
              docEl.requestFullscreen();
            } else if (docEl.webkitRequestFullscreen) {
              docEl.webkitRequestFullscreen();
            }
            setFullscreenToast('FULLSCREEN ENABLED');
          } else {
            if (document.exitFullscreen) {
              document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
            }
            setFullscreenToast('EXIT FULLSCREEN');
          }
          setTimeout(() => setFullscreenToast(null), 2000);
        } catch (err) {
          console.warn('Fullscreen toggle failed:', err);
        }
        lastTapTime = 0;
      } else {
        lastTapTime = now;
        lastTapX = e.clientX;
        lastTapY = e.clientY;
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const handleStart = () => {
    setStep(1);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col justify-between p-4 sm:p-6 lg:p-7 overflow-y-auto lg:overflow-hidden relative select-none animate-fade-in">
      {/* Toast Feedback for Double-Tap Fullscreen */}
      {fullscreenToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-cyan-950/90 border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.6)] text-cyan-300 font-mono text-xs font-black tracking-widest uppercase flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
          <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{fullscreenToast}</span>
        </div>
      )}

      {/* Soft Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[950px] h-[600px] bg-cyan-500/8 blur-[180px] rounded-full pointer-events-none -z-0" />

      {/* 1. Top Header Bar (Terminal ID) */}
      <div className="flex items-center justify-between w-full relative z-10 shrink-0 pb-1">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="font-bold tracking-wider text-cyan-400">UDD-POS-ENG</span>
          <span className="text-slate-600">•</span>
          <span>Kiosk Terminal #01</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-500 text-[10px] hidden sm:inline">(Double-touch to Fullscreen)</span>
        </div>
      </div>

      {/* 2. Center Section: Balanced, Luxurious Spacing Across Screen Height */}
      <div className="flex-1 flex flex-col items-center justify-evenly text-center pt-0 pb-2 sm:pb-4 lg:pb-6 max-w-4xl mx-auto w-full relative z-10">
        {/* Block 1: Status Pill & Live Digital Clock Pod (Lifted higher up) */}
        <div className="flex flex-col items-center gap-2 sm:gap-2.5 -mt-3 sm:-mt-6 lg:-mt-8">
          {/* Touchscreen Kiosk Status Pill */}
          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full neu-inset-sm border border-emerald-500/20 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
            </span>
            <span className="text-xs sm:text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
              TOUCHSCREEN KIOSK READY • SYSTEM ACTIVE
            </span>
          </div>

          {/* Live Digital Clock Pod */}
          <div className="flex items-center gap-2.5 neu-inset px-6 py-2 rounded-full text-xs font-mono text-slate-300 shadow-sm">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 font-bold text-xs sm:text-sm tracking-wider">{time}</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 text-xs hidden sm:inline">{date}</span>
          </div>
        </div>

        {/* Block 2: Hero Brand Centerpiece (Trio Logos, INVEN TECH, & Title) */}
        <div className="flex flex-col items-center w-full">
          {/* Trio Logos: UdD Logo (Left), InvenTech Logo (Center - prominent), SOE Logo (Right) */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 md:gap-14">
            {/* UdD Main University Seal */}
            <div className="relative group flex flex-col items-center">
              <div className="w-22 h-22 sm:w-26 sm:h-26 lg:w-30 lg:h-30 rounded-full p-2.5 neu-card transition-all duration-300 group-hover:scale-105 flex items-center justify-center relative shadow-lg">
                <div className="absolute inset-0 rounded-full border border-cyan-500/20 pointer-events-none" />
                <img
                  src="/images/udd_logo.png"
                  alt="Universidad de Dagupan Seal"
                  className="w-full h-full object-contain drop-shadow"
                />
              </div>
            </div>

            {/* Left Divider Accent Line */}
            <div className="h-14 sm:h-20 w-[1.5px] bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent hidden sm:block" />

            {/* Center InvenTech Circular Logo (Grand prominent hero size with rich halo) */}
            <div className="relative group flex flex-col items-center">
              <div className="w-28 h-28 sm:w-34 sm:h-34 lg:w-42 lg:h-42 rounded-full p-2.5 sm:p-3 bg-[#0c1527] border-[3px] border-cyan-400/90 shadow-[0_0_35px_rgba(6,182,212,0.65)] transition-all duration-300 group-hover:scale-105 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-pulse pointer-events-none" />
                <img
                  src="/images/inventech_logo.png"
                  alt="InvenTech Brand Logo"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>

            {/* Right Divider Accent Line */}
            <div className="h-14 sm:h-20 w-[1.5px] bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent hidden sm:block" />

            {/* School of Engineering Seal */}
            <div className="relative group flex flex-col items-center">
              <div className="w-22 h-22 sm:w-26 sm:h-26 lg:w-30 lg:h-30 rounded-full p-2.5 neu-card transition-all duration-300 group-hover:scale-105 flex items-center justify-center relative shadow-lg">
                <div className="absolute inset-0 rounded-full border border-cyan-500/20 pointer-events-none" />
                <img
                  src="/images/soe_logo.png"
                  alt="School of Engineering Seal"
                  className="w-full h-full object-contain drop-shadow"
                />
              </div>
            </div>
          </div>

          {/* INVEN TECH Brand Text with AM/PM Dynamic Theme Color Switching */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-4 mb-2 select-none">
            <span
              className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-wider sm:tracking-widest transition-colors duration-500 font-sans ${
                isDark
                  ? 'text-orange-400 drop-shadow-[0_0_24px_rgba(251,146,60,0.6)]'
                  : 'text-sky-500 drop-shadow-[0_0_24px_rgba(14,165,233,0.5)]'
              }`}
            >
              INVEN
            </span>
            <span
              className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-wider sm:tracking-widest transition-colors duration-500 font-sans ${
                isDark
                  ? 'text-sky-400 drop-shadow-[0_0_24px_rgba(56,189,248,0.6)]'
                  : 'text-orange-500 drop-shadow-[0_0_24px_rgba(249,115,22,0.5)]'
              }`}
            >
              TECH
            </span>
          </div>

          {/* Hero Typography */}
          <div className="space-y-1.5 max-w-2xl px-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-extrabold text-slate-100 tracking-tight leading-tight">
              Engineering Laboratory Management System
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-400 font-medium tracking-wide">
              Mobile POS Touchscreen Kiosk • Automated Equipment Borrower's Slip & Inventory Control
            </p>
          </div>
        </div>

        {/* Block 3: Feature Highlights (2 Features: Kairo AI & Print Slip) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl px-2">
          <div className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl neu-card-sm text-left">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl neu-inset flex items-center justify-center text-cyan-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-100">Kairo AI Assistant</div>
              <div className="text-[11px] sm:text-xs text-slate-400">Lab Syllabus Guidance</div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl neu-card-sm text-left">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl neu-inset flex items-center justify-center text-cyan-400 shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-100">Print & PDF Slip</div>
              <div className="text-[11px] sm:text-xs text-slate-400">UdD-FM-LM-01A-01</div>
            </div>
          </div>
        </div>

        {/* Block 4: Dual Action CTA Buttons */}
        <div className="w-full max-w-lg space-y-3 px-2">
          <TouchButton
            variant="primary"
            size="lg"
            icon={ArrowRight}
            fullWidth
            onClick={handleStart}
            className="font-extrabold tracking-wider py-3.5 sm:py-4 text-sm sm:text-base shadow-xl shadow-cyan-950/60"
          >
            TAP TO CONTINUE (BORROW)
          </TouchButton>

          <button
            type="button"
            onClick={() => setIsReturnModalOpen(true)}
            className="w-full min-h-[46px] sm:min-h-[50px] rounded-2xl neu-btn-raised flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-all active:scale-98 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
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
