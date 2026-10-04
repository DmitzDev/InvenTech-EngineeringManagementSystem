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
  Boxes,
  ChevronRight,
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from '../ui/TouchButton';
import SecureReturnStation from './SecureReturnStation';
import ReturnEquipmentModal from './ReturnEquipmentModal';
import ReturnClearanceModal from './ReturnClearanceModal';

export default function WelcomeScreen() {
  const { setStep, theme } = useTransaction();
  const isDark = theme === 'dark';
  const [viewMode, setViewMode] = useState('landing'); // 'landing' | 'mode_select' | 'return'
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
          <div className="w-full max-w-lg px-2">
            <TouchButton
              variant="primary"
              size="lg"
              icon={ArrowRight}
              fullWidth
              onClick={() => setViewMode('mode_select')}
              className={`font-black tracking-wider py-4 text-sm sm:text-base shadow-xl text-white ${
                isDark ? 'shadow-cyan-950/60' : 'shadow-slate-400/30'
              }`}
            >
              TAP TO START / CONTINUE
            </TouchButton>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW B: MODE SELECTION HUB (Borrow Equipment vs Return Equipment)
         ========================================================================= */}
      {/* =========================================================================
          VIEW B: MODE SELECTION HUB (Industrial Engineering Lab Terminal)
         ========================================================================= */}
      {/* =========================================================================
          VIEW B: MODE SELECTION HUB (Industrial Engineering Lab Terminal)
         ========================================================================= */}
      {viewMode === 'mode_select' && (
        <div className="flex-1 flex flex-col justify-between py-2 sm:py-3.5 max-w-4xl mx-auto w-full relative z-10 animate-fade-in select-none">
          {/* 1. Hub Header & Institutional Telemetry Bar */}
          <div className={`w-full border-b pb-3 pt-1 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 text-left">
                <div className={`w-2.5 h-2.5 rounded-xs shrink-0 ${isDark ? 'bg-cyan-400' : 'bg-blue-600'}`} />
                <div>
                  <h2 className={`text-xs sm:text-sm font-mono font-black tracking-wider uppercase ${
                    isDark ? 'text-slate-100' : 'text-slate-950'
                  }`}>
                    ENGINEERING LABORATORY MANAGEMENT TERMINAL
                  </h2>
                  <p className={`text-[11px] font-mono ${
                    isDark ? 'text-slate-400' : 'text-slate-600 font-bold'
                  }`}>
                    SELECT SYSTEM MODULE TO INITIALIZE WORKFLOW
                  </p>
                </div>
              </div>

              {/* Telemetry Snippet */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-md self-start sm:self-auto font-mono text-[10.5px] sm:text-[11px] border ${
                isDark
                  ? 'bg-slate-800/90 border-slate-700 text-slate-300'
                  : 'bg-white border-slate-300 text-slate-900 font-bold shadow-xs'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="tracking-tight">STATUS: ONLINE • READY FOR OPERATOR</span>
              </div>
            </div>
          </div>

          {/* 2. Primary Mode Selection Cards (Enterprise Instrument Panels) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full my-auto py-2 sm:py-3">
            {/* CARD A: BORROW EQUIPMENT */}
            <button
              type="button"
              onClick={handleStartBorrow}
              className={`group text-left p-5 sm:p-6 rounded-xl flex flex-col justify-between min-h-[220px] sm:min-h-[240px] transition-all duration-100 ease-out active:scale-[0.985] cursor-pointer select-none border ${
                isDark
                  ? 'bg-[#0f172a] border-slate-800 hover:border-slate-600 shadow-sm'
                  : 'bg-white border-slate-300/90 hover:border-blue-500 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Top Micro-Header */}
              <div>
                <div className={`flex items-center justify-between pb-3 mb-3 border-b ${
                  isDark ? 'border-slate-800/80' : 'border-slate-200'
                }`}>
                  <span className={`font-mono text-[11px] tracking-wider transition-colors ${
                    isDark
                      ? 'text-slate-400 group-hover:text-cyan-400 font-bold'
                      : 'text-slate-600 group-hover:text-blue-700 font-black'
                  }`}>
                    SYS.MOD // 01
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className={`font-mono text-[10px] uppercase font-bold ${
                      isDark ? 'text-blue-400' : 'text-blue-800'
                    }`}>
                      DISPATCH ACTIVE
                    </span>
                  </div>
                </div>

                {/* Icon & Title */}
                <div className="flex items-start gap-3.5">
                  <div className={`w-12 h-12 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 group-hover:border-blue-500/50 group-hover:text-cyan-400'
                      : 'bg-blue-50 border-blue-200 text-blue-700 group-hover:border-blue-400 group-hover:bg-blue-100'
                  }`}>
                    <Boxes className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-black tracking-tight leading-tight ${
                      isDark ? 'text-slate-100' : 'text-slate-950 font-black'
                    }`}>
                      BORROW EQUIPMENT
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${
                      isDark ? 'text-slate-400 font-normal' : 'text-slate-700 font-bold'
                    }`}>
                      Browse laboratory inventory, select tools, and request locker compartment dispatch.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Technical Chip */}
              <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
                isDark ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                <span className={`font-mono text-[10.5px] px-2.5 py-1 rounded border ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700 font-bold'
                    : 'bg-slate-100 text-slate-900 border-slate-300 font-black'
                }`}>
                  [ DIRECT DISPATCH • A1-C6 ]
                </span>
                <div className={`flex items-center gap-1 text-xs font-mono font-bold group-hover:translate-x-1 transition-all ${
                  isDark
                    ? 'text-slate-400 group-hover:text-cyan-400'
                    : 'text-slate-700 group-hover:text-blue-700 font-black'
                }`}>
                  <span>INITIALIZE</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            </button>

            {/* CARD B: RETURN EQUIPMENT */}
            <button
              type="button"
              onClick={() => setViewMode('return')}
              className={`group text-left p-5 sm:p-6 rounded-xl flex flex-col justify-between min-h-[220px] sm:min-h-[240px] transition-all duration-100 ease-out active:scale-[0.985] cursor-pointer select-none border ${
                isDark
                  ? 'bg-[#0f172a] border-slate-800 hover:border-slate-600 shadow-sm'
                  : 'bg-white border-slate-300/90 hover:border-emerald-500 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Top Micro-Header */}
              <div>
                <div className={`flex items-center justify-between pb-3 mb-3 border-b ${
                  isDark ? 'border-slate-800/80' : 'border-slate-200'
                }`}>
                  <span className={`font-mono text-[11px] tracking-wider transition-colors ${
                    isDark
                      ? 'text-slate-400 group-hover:text-emerald-400 font-bold'
                      : 'text-slate-600 group-hover:text-emerald-700 font-black'
                  }`}>
                    SYS.MOD // 02
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className={`font-mono text-[10px] uppercase font-bold ${
                      isDark ? 'text-emerald-400' : 'text-emerald-800'
                    }`}>
                      SECURE CHECK-IN
                    </span>
                  </div>
                </div>

                {/* Icon & Title */}
                <div className="flex items-start gap-3.5">
                  <div className={`w-12 h-12 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 group-hover:border-emerald-500/50 group-hover:text-emerald-400'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 group-hover:border-emerald-400 group-hover:bg-emerald-100'
                  }`}>
                    <RotateCcw className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-black tracking-tight leading-tight ${
                      isDark ? 'text-slate-100' : 'text-slate-950 font-black'
                    }`}>
                      RETURN EQUIPMENT
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${
                      isDark ? 'text-slate-400 font-normal' : 'text-slate-700 font-bold'
                    }`}>
                      Check in active loans, inspect tool condition, and reconcile assigned storage.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Technical Chip */}
              <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
                isDark ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                <span className={`font-mono text-[10.5px] px-2.5 py-1 rounded border ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700 font-bold'
                    : 'bg-slate-100 text-slate-900 border-slate-300 font-black'
                }`}>
                  [ STUDENT ID AUTH REQUIRED ]
                </span>
                <div className={`flex items-center gap-1 text-xs font-mono font-bold group-hover:translate-x-1 transition-all ${
                  isDark
                    ? 'text-slate-400 group-hover:text-emerald-400'
                    : 'text-slate-700 group-hover:text-emerald-700 font-black'
                }`}>
                  <span>AUTHENTICATE</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            </button>
          </div>

          {/* 3. Bottom Return to Standby Bar */}
          <div className={`pt-2 flex items-center justify-between border-t text-[11px] font-mono ${
            isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600 font-bold'
          }`}>
            <button
              type="button"
              onClick={() => setViewMode('landing')}
              className={`px-3.5 py-2 rounded-lg border font-mono font-bold flex items-center gap-2 transition-all duration-100 ease-out active:scale-95 cursor-pointer shadow-xs ${
                isDark
                  ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-900'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>[ ESC // STANDBY MODE ]</span>
            </button>

            <span className="hidden sm:inline">
              TERMINAL SECURE PROTOCOL v2.4 • TOUCH INTERFACE
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW C: RETURN EQUIPMENT TERMINAL (Full-Screen View, Zero Floating Box)
         ========================================================================= */}
      {viewMode === 'return' && (
        <SecureReturnStation
          onBack={() => setViewMode('mode_select')}
          onTimeout={() => setViewMode('landing')}
          onOpenClearance={() => setIsClearanceModalOpen(true)}
        />
      )}

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
