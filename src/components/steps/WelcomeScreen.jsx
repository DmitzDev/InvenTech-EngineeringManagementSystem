import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileCheck,
  Clock,
  RotateCcw,
  Maximize2,
  Package,
  PackageCheck,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from '../ui/TouchButton';
import SecureReturnStation from './SecureReturnStation';
import ReturnEquipmentModal from './ReturnEquipmentModal';
import ReturnClearanceModal from './ReturnClearanceModal';

export default function WelcomeScreen() {
  const { setStep, theme } = useTransaction();
  const isDark = theme === 'dark';
  const [viewMode, setViewMode] = useState('landing'); // 'landing' | 'mode_select'
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [isSecureReturnOpen, setIsSecureReturnOpen] = useState(false);
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

  const handleStartBorrow = () => {
    setStep(1);
  };

  return (
    <div className="flex-1 w-full min-h-screen lg:min-h-0 lg:h-full flex flex-col justify-between p-3 sm:p-6 lg:p-7 overflow-y-auto lg:overflow-hidden relative select-none animate-fade-in">
      {/* Toast Feedback for Double-Tap Fullscreen */}
      {fullscreenToast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full font-mono text-xs font-black tracking-widest uppercase flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200 shadow-xl ${
          isDark
            ? 'bg-cyan-950/90 border border-cyan-400/60 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
            : 'bg-slate-900/90 border border-slate-700 text-white'
        }`}>
          <Maximize2 className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-white'}`} />
          <span>{fullscreenToast}</span>
        </div>
      )}

      {/* Soft Ambient Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[950px] h-[600px] ${
        isDark ? 'bg-cyan-500/8' : 'bg-slate-300/20'
      } blur-[180px] rounded-full pointer-events-none -z-0`} />

      {/* 1. Top Header Bar (Terminal ID & Mode Indicator) */}
      <div className="flex items-center justify-between w-full relative z-10 shrink-0 pb-1">
        <div className={`flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono ${
          isDark ? 'text-slate-400' : 'text-slate-700 font-bold'
        }`}>
          <span className={`font-extrabold tracking-wider ${isDark ? 'text-cyan-400' : 'text-slate-900 font-black'}`}>UDD-POS-ENG</span>
          <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>•</span>
          <span className={isDark ? 'text-slate-300' : 'text-slate-800 font-bold'}>Terminal #01</span>
          <span className={`${isDark ? 'text-slate-600' : 'text-slate-400'} hidden sm:inline`}>•</span>
          <span className={`${isDark ? 'text-slate-500' : 'text-slate-600'} text-[10px] hidden sm:inline font-semibold`}>
            {viewMode === 'mode_select' ? 'Mode Selection Hub' : '(Double-touch to Fullscreen)'}
          </span>
        </div>

        {/* Live Digital Clock Pod */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono shadow-xs ${
          isDark ? 'neu-inset text-cyan-400' : 'bg-white border border-slate-300 text-slate-900 font-bold'
        }`}>
          <Clock className="w-3.5 h-3.5" />
          <span className="font-extrabold tracking-wider">{time}</span>
        </div>
      </div>

      {/* =========================================================================
          VIEW A: IDLE / LANDING SCREEN (Tap to Start / Tap to Continue)
         ========================================================================= */}
      {viewMode === 'landing' && (
        <div className="flex-1 flex flex-col items-center justify-evenly text-center py-4 lg:pt-0 lg:pb-6 max-w-4xl mx-auto w-full relative z-10 gap-4 sm:gap-6 lg:gap-0 animate-fade-in">
          {/* Block 1: Date Pill */}
          <div className="flex flex-col items-center gap-2 sm:gap-2.5 mt-0 lg:-mt-8">
            <div className={`flex items-center gap-2 neu-inset px-4 sm:px-6 py-1.5 rounded-full text-xs font-mono shadow-xs ${
              isDark ? 'text-slate-300' : 'text-slate-900 font-bold bg-white border border-slate-300'
            }`}>
              <span className={`${isDark ? 'text-slate-400' : 'text-slate-700 font-bold'} text-xs`}>{date}</span>
            </div>
          </div>

          {/* Block 2: Hero Brand Centerpiece (Trio Logos, INVEN TECH, & Title) */}
          <div className="flex flex-col items-center w-full">
            {/* Trio Logos: UdD Logo (Left), InvenTech Logo (Center - prominent), SOE Logo (Right) */}
            <div className="flex items-center justify-center gap-3 sm:gap-8 md:gap-14">
              {/* UdD Main University Seal */}
              <div className="relative group flex flex-col items-center">
                <div className="w-14 h-14 sm:w-24 sm:h-24 lg:w-30 lg:h-30 rounded-full p-1.5 sm:p-2.5 neu-card transition-all duration-300 group-hover:scale-105 flex items-center justify-center relative shadow-lg">
                  <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-cyan-500/20' : 'border-slate-300'} pointer-events-none`} />
                  <img
                    src="/images/udd_logo.png"
                    alt="Universidad de Dagupan Seal"
                    className="w-full h-full object-contain drop-shadow"
                  />
                </div>
              </div>

              {/* Left Divider Accent Line */}
              <div className={`h-10 sm:h-20 w-[1.5px] bg-gradient-to-b ${isDark ? 'from-transparent via-cyan-500/40 to-transparent' : 'from-transparent via-slate-300 to-transparent'} hidden sm:block`} />

              {/* Center InvenTech Circular Logo */}
              <div className="relative group flex flex-col items-center">
                <div className={`w-20 h-20 sm:w-32 sm:h-32 lg:w-42 lg:h-42 rounded-full p-1.5 sm:p-3 transition-all duration-300 group-hover:scale-105 flex items-center justify-center relative ${
                  isDark
                    ? 'bg-[#0c1527] border-2 sm:border-[3px] border-cyan-400/90 shadow-[0_0_35px_rgba(6,182,212,0.65)]'
                    : 'neu-card border-2 sm:border-[3px] border-slate-300 shadow-[0_10px_30px_rgba(148,163,184,0.45)]'
                }`}>
                  <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-cyan-400/30' : 'border-slate-400/40'} animate-pulse pointer-events-none`} />
                  <img
                    src="/images/inventech_logo.png"
                    alt="InvenTech Brand Logo"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>

              {/* Right Divider Accent Line */}
              <div className={`h-10 sm:h-20 w-[1.5px] bg-gradient-to-b ${isDark ? 'from-transparent via-cyan-500/40 to-transparent' : 'from-transparent via-slate-300 to-transparent'} hidden sm:block`} />

              {/* School of Engineering Seal */}
              <div className="relative group flex flex-col items-center">
                <div className="w-14 h-14 sm:w-24 sm:h-24 lg:w-30 lg:h-30 rounded-full p-1.5 sm:p-2.5 neu-card transition-all duration-300 group-hover:scale-105 flex items-center justify-center relative shadow-lg">
                  <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-cyan-500/20' : 'border-slate-300'} pointer-events-none`} />
                  <img
                    src="/images/soe_logo.png"
                    alt="School of Engineering Seal"
                    className="w-full h-full object-contain drop-shadow"
                  />
                </div>
              </div>
            </div>

            {/* INVEN TECH Brand Text */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-4 mt-3 sm:mt-4 mb-1.5 sm:mb-2 select-none">
              <span
                className={`keep-brand-inven text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-wider sm:tracking-widest transition-colors duration-500 font-sans ${isDark
                    ? 'text-orange-400 drop-shadow-[0_0_24px_rgba(251,146,60,0.6)]'
                    : 'drop-shadow-sm font-black'
                  }`}
                style={{ color: isDark ? '#fb923c' : '#0284c7' }}
              >
                INVEN
              </span>
              <span
                className={`keep-brand-tech text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-wider sm:tracking-widest transition-colors duration-500 font-sans ${isDark
                    ? 'text-sky-400 drop-shadow-[0_0_24px_rgba(56,189,248,0.7)]'
                    : 'drop-shadow-sm font-black'
                  }`}
                style={{ color: isDark ? '#38bdf8' : '#ea580c' }}
              >
                TECH
              </span>
            </div>

            {/* Hero Typography */}
            <div className="space-y-1 max-w-2xl px-2">
              <h1 className={`text-base sm:text-2xl md:text-3xl lg:text-[32px] font-black tracking-tight leading-tight ${
                isDark ? 'text-slate-100' : 'text-slate-950 font-black'
              }`}>
                Engineering Laboratory Management System
              </h1>
              <p className={`text-[11px] sm:text-sm md:text-base font-semibold tracking-wide ${
                isDark ? 'text-slate-400' : 'text-slate-700 font-bold'
              }`}>
                Touchscreen Kiosk • Automated Apparatus Borrowing & Return Station
              </p>
            </div>
          </div>

          {/* Block 3: Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 w-full max-w-2xl px-2">
            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-5 rounded-2xl neu-card-sm text-left">
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl neu-inset flex items-center justify-center shrink-0 ${isDark ? 'text-cyan-400' : 'text-slate-900 font-bold'}`}>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className={`text-xs sm:text-sm font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900 font-black'}`}>Kairo AI Assistant</div>
                <div className={`text-[10px] sm:text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600 font-bold'}`}>Lab Syllabus Guidance</div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-5 rounded-2xl neu-card-sm text-left">
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl neu-inset flex items-center justify-center shrink-0 ${isDark ? 'text-cyan-400' : 'text-slate-900 font-bold'}`}>
                <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className={`text-xs sm:text-sm font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900 font-black'}`}>Print & PDF Slip</div>
                <div className={`text-[10px] sm:text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600 font-bold'}`}>UdD-FM-LM-01A-01</div>
              </div>
            </div>
          </div>

          {/* Block 4: Primary CTA - Transitions to Mode Selection Hub */}
          <div className="w-full max-w-lg space-y-2.5 sm:space-y-3 px-2">
            <TouchButton
              variant="primary"
              size="lg"
              icon={ArrowRight}
              fullWidth
              onClick={() => setViewMode('mode_select')}
              className={`font-black tracking-wider py-3.5 sm:py-4 text-sm sm:text-base shadow-xl text-white ${
                isDark ? 'shadow-cyan-950/60' : 'shadow-slate-400/30'
              }`}
            >
              TAP TO START / CONTINUE
            </TouchButton>

            <button
              type="button"
              onClick={() => setIsSecureReturnOpen(true)}
              className={`w-full min-h-[42px] sm:min-h-[48px] rounded-2xl neu-btn-raised flex items-center justify-center gap-2 text-xs sm:text-sm font-black transition-transform duration-75 ease-out active:scale-95 touch-manipulation shadow-xs cursor-pointer ${
                isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-800 hover:text-emerald-950'
              }`}
            >
              <RotateCcw className="w-4 h-4 stroke-[2.2]" />
              <span>Direct Return Equipment Check-In</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW B: MODE SELECTION HUB (Borrow Equipment vs Return Equipment)
         ========================================================================= */}
      {viewMode === 'mode_select' && (
        <div className="flex-1 flex flex-col items-center justify-between text-center py-4 lg:py-6 max-w-4xl mx-auto w-full relative z-10 animate-fade-in">
          {/* Header Section */}
          <div className="space-y-2 max-w-xl px-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
              isDark ? 'neu-inset text-cyan-400' : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              <span>Station Mode Hub</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
              isDark ? 'text-slate-100' : 'text-slate-950 font-black'
            }`}>
              What would you like to do?
            </h2>
            <p className={`text-xs sm:text-sm font-medium ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Select an operational mode to begin. All sessions adhere to strict laboratory safety and student privacy standards.
            </p>
          </div>

          {/* Primary Mode Selection Cards (Card A & Card B) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl px-3 my-auto">
            {/* Card A: [ 📦 Borrow Equipment ] */}
            <button
              type="button"
              onClick={handleStartBorrow}
              className={`p-6 sm:p-8 rounded-3xl border flex flex-col items-center text-center justify-between gap-4 transition-all duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer group shadow-md hover:shadow-xl ${
                isDark
                  ? 'neu-card hover:border-cyan-400/60 bg-[#0f172a]'
                  : 'bg-white border-slate-200/90 hover:border-blue-500'
              }`}
            >
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-200 ${
                isDark
                  ? 'neu-inset text-cyan-400'
                  : 'bg-blue-50 text-blue-700 border border-blue-200/80'
              }`}>
                <Package className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.2]" />
              </div>

              <div className="space-y-1.5">
                <span className={`inline-block font-mono text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isDark
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-blue-100 text-blue-900 font-extrabold'
                }`}>
                  [ 📦 BORROW EQUIPMENT ]
                </span>
                <h3 className={`text-lg sm:text-xl font-black ${
                  isDark ? 'text-slate-100' : 'text-slate-950 font-black'
                }`}>
                  Borrow Apparatus
                </h3>
                <p className={`text-xs sm:text-sm font-medium max-w-xs ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Browse the laboratory catalog, add tools, and generate an official borrower's slip.
                </p>
              </div>

              <div className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                isDark
                  ? 'neu-btn-primary text-slate-950 font-black'
                  : 'bg-blue-600 text-white group-hover:bg-blue-700 font-bold'
              }`}>
                <span>Start Borrowing Flow</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* Card B: [ 🔄 Return Equipment ] */}
            <button
              type="button"
              onClick={() => setIsSecureReturnOpen(true)}
              className={`p-6 sm:p-8 rounded-3xl border flex flex-col items-center text-center justify-between gap-4 transition-all duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer group shadow-md hover:shadow-xl ${
                isDark
                  ? 'neu-card hover:border-emerald-400/60 bg-[#0f172a]'
                  : 'bg-white border-slate-200/90 hover:border-emerald-500'
              }`}
            >
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-200 ${
                isDark
                  ? 'neu-inset text-emerald-400'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
              }`}>
                <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.2]" />
              </div>

              <div className="space-y-1.5">
                <span className={`inline-block font-mono text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-emerald-100 text-emerald-950 font-extrabold'
                }`}>
                  [ 🔄 RETURN EQUIPMENT ]
                </span>
                <h3 className={`text-lg sm:text-xl font-black ${
                  isDark ? 'text-slate-100' : 'text-slate-950 font-black'
                }`}>
                  Return Equipment
                </h3>
                <p className={`text-xs sm:text-sm font-medium max-w-xs ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Secure Student ID verification, itemized tool return checklist, and locker bin check-in.
                </p>
              </div>

              <div className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                isDark
                  ? 'neu-btn-raised text-emerald-400 font-black'
                  : 'bg-emerald-600 text-white group-hover:bg-emerald-700 font-bold'
              }`}>
                <span>Open Secure Return Flow</span>
                <RotateCcw className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Back / Cancel Button to return to the idle landing screen */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setViewMode('landing')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                isDark
                  ? 'neu-btn-raised text-slate-300'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back / Return to Idle Screen</span>
            </button>
          </div>
        </div>
      )}

      {/* Secure Return Station Modal (Student Privacy Guard & ID Verification) */}
      <SecureReturnStation
        isOpen={isSecureReturnOpen}
        onClose={() => setIsSecureReturnOpen(false)}
        onOpenClearance={() => setIsClearanceModalOpen(true)}
      />

      {/* Legacy Return Modal (Available if needed for custodian check-in) */}
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
