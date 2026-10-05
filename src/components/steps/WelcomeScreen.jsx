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
import ThemeToggle from '../ui/ThemeToggle';
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

  const handleStartBorrow = () => {
    setStep(1);
  };

  return (
    <div className="flex-1 w-full max-w-full overflow-x-hidden min-h-screen lg:min-h-0 lg:h-full flex flex-col justify-between p-3 sm:p-6 lg:p-7 overflow-y-auto lg:overflow-hidden relative select-none animate-fade-in">
      {/* Soft Ambient Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[950px] h-[600px] ${
        isDark ? 'bg-cyan-500/8' : 'bg-slate-300/20'
      } blur-[180px] rounded-full pointer-events-none -z-0`} />

      {/* 1. Top Header Bar (Terminal ID & Mode Indicator) */}
      <div className="flex items-center justify-between w-full max-w-full overflow-hidden relative z-10 shrink-0 pb-1">
        <div className={`flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono min-w-0 truncate ${
          isDark ? 'text-slate-400' : 'text-slate-700 font-bold'
        }`}>
          <span className={`font-extrabold tracking-wider shrink-0 ${isDark ? 'text-cyan-400' : 'text-slate-900 font-black'}`}>UDD-POS-ENG</span>
          <span className={`shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>•</span>
          <span className={`truncate ${isDark ? 'text-slate-300' : 'text-slate-800 font-bold'}`}>Terminal #01</span>
        </div>

        {/* Right: Live Digital Clock Pod & Theme Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10.5px] sm:text-xs font-mono shadow-xs ${
            isDark ? 'neu-inset text-cyan-400' : 'bg-white border border-slate-300 text-slate-900 font-bold'
          }`}>
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="font-bold sm:font-extrabold tracking-tight sm:tracking-wider">{time}</span>
          </div>
          <ThemeToggle />
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
                className={`keep-brand keep-brand-inven text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-wider sm:tracking-widest transition-colors duration-500 font-sans ${isDark
                    ? 'text-sky-400 drop-shadow-[0_0_24px_rgba(56,189,248,0.7)]'
                    : 'text-orange-600 drop-shadow-sm font-black'
                  }`}
                style={{ color: isDark ? '#38bdf8' : '#ea580c' }}
              >
                INVEN
              </span>
              <span
                className={`keep-brand keep-brand-tech text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-wider sm:tracking-widest transition-colors duration-500 font-sans ${isDark
                    ? 'text-orange-400 drop-shadow-[0_0_24px_rgba(251,146,60,0.6)]'
                    : 'text-sky-600 drop-shadow-sm font-black'
                  }`}
                style={{ color: isDark ? '#fb923c' : '#0284c7' }}
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
          VIEW B: MODE SELECTION HUB (Clean Choice Screen)
         ========================================================================= */}
      {viewMode === 'mode_select' && (
        <div className="flex-1 flex flex-col justify-between py-3 sm:py-6 max-w-3xl mx-auto w-full relative z-10 animate-fade-in select-none">
          {/* 1. Hub Header */}
          <div className="text-center pt-2 pb-1">
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${
              isDark ? 'text-slate-100' : 'text-slate-950 font-black'
            }`}>
              Select Action
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${
              isDark ? 'text-slate-400' : 'text-slate-600 font-medium'
            }`}>
              Choose an operation to proceed
            </p>
          </div>

          {/* 2. Primary Mode Selection Cards (Rich Tactile Skeuomorphic Engineering Consoles) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full my-auto py-3">
            {/* CARD A: BORROW EQUIPMENT */}
            <button
              type="button"
              onClick={handleStartBorrow}
              className={`group relative text-left p-6 sm:p-7 rounded-2xl sm:rounded-3xl flex flex-col justify-between min-h-[190px] sm:min-h-[220px] transition-all duration-150 ease-out active:scale-[0.985] cursor-pointer select-none overflow-hidden ${
                isDark
                  ? 'bg-gradient-to-b from-[#1c2738] via-[#131b28] to-[#0c1320] border border-slate-700/80 shadow-[0_12px_28px_rgba(0,0,0,0.7),0_3px_6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-2px_4px_rgba(0,0,0,0.6)] hover:border-cyan-400/70 hover:shadow-[0_16px_36px_rgba(6,182,212,0.25),0_4px_12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.25)]'
                  : 'bg-gradient-to-b from-[#ffffff] via-[#f8fafc] to-[#edf2f7] border border-slate-300 shadow-[0_10px_24px_-3px_rgba(15,23,42,0.14),0_4px_8px_-2px_rgba(15,23,42,0.08),inset_0_1px_0_#ffffff,inset_0_-2px_3px_rgba(15,23,42,0.05)] hover:border-blue-500/70 hover:shadow-[0_16px_32px_rgba(37,99,235,0.18),0_6px_14px_rgba(15,23,42,0.12),inset_0_1px_0_#ffffff]'
              }`}
            >
              {/* Subtle metallic top highlight bar */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] ${
                isDark
                  ? 'bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-blue-400/40 to-transparent'
              }`} />

              <div>
                {/* Top Telemetry Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-mono font-black tracking-widest px-2.5 py-0.5 rounded-md ${
                    isDark
                      ? 'neu-inset-sm text-cyan-400 border border-cyan-500/30'
                      : 'bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs'
                  }`}>
                    STATION 01 • BORROW
                  </span>
                  <span className={`w-2 h-2 rounded-full ${
                    isDark ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-blue-600 shadow-xs'
                  }`} />
                </div>

                {/* Main Content: Skeuomorphic Recessed Well & Title */}
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 ${
                    isDark
                      ? 'neu-inset border border-cyan-500/30 text-cyan-400 shadow-[inset_0_3px_8px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.08)] group-hover:border-cyan-400 group-hover:text-cyan-300'
                      : 'bg-[#eef4fb] border border-blue-200/90 text-blue-700 shadow-[inset_0_2px_5px_rgba(30,64,175,0.12),0_1px_0_#ffffff] group-hover:border-blue-400 group-hover:text-blue-800'
                  }`}>
                    <Boxes className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-lg sm:text-xl font-black tracking-tight ${
                      isDark ? 'text-slate-100' : 'text-slate-950 font-black'
                    }`}>
                      Borrow Equipment
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${
                      isDark ? 'text-slate-400' : 'text-slate-600 font-medium'
                    }`}>
                      Browse laboratory inventory and checkout tools
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Tactile Dock */}
              <div className={`mt-5 px-3.5 py-2 rounded-xl flex items-center justify-between text-xs font-mono font-bold transition-all ${
                isDark
                  ? 'neu-inset-sm border border-white/5 text-slate-400 group-hover:text-cyan-300 group-hover:border-cyan-500/30'
                  : 'bg-slate-100/90 border border-slate-200/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] text-slate-700 group-hover:text-blue-700 group-hover:border-blue-300'
              }`}>
                <span>Proceed to Catalog</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* CARD B: RETURN EQUIPMENT */}
            <button
              type="button"
              onClick={() => setViewMode('return')}
              className={`group relative text-left p-6 sm:p-7 rounded-2xl sm:rounded-3xl flex flex-col justify-between min-h-[190px] sm:min-h-[220px] transition-all duration-150 ease-out active:scale-[0.985] cursor-pointer select-none overflow-hidden ${
                isDark
                  ? 'bg-gradient-to-b from-[#1c2738] via-[#131b28] to-[#0c1320] border border-slate-700/80 shadow-[0_12px_28px_rgba(0,0,0,0.7),0_3px_6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-2px_4px_rgba(0,0,0,0.6)] hover:border-emerald-400/70 hover:shadow-[0_16px_36px_rgba(16,185,129,0.25),0_4px_12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.25)]'
                  : 'bg-gradient-to-b from-[#ffffff] via-[#f8fafc] to-[#edf2f7] border border-slate-300 shadow-[0_10px_24px_-3px_rgba(15,23,42,0.14),0_4px_8px_-2px_rgba(15,23,42,0.08),inset_0_1px_0_#ffffff,inset_0_-2px_3px_rgba(15,23,42,0.05)] hover:border-emerald-500/70 hover:shadow-[0_16px_32px_rgba(16,185,129,0.18),0_6px_14px_rgba(15,23,42,0.12),inset_0_1px_0_#ffffff]'
              }`}
            >
              {/* Subtle metallic top highlight bar */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] ${
                isDark
                  ? 'bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent'
              }`} />

              <div>
                {/* Top Telemetry Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-mono font-black tracking-widest px-2.5 py-0.5 rounded-md ${
                    isDark
                      ? 'neu-inset-sm text-emerald-400 border border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs'
                  }`}>
                    STATION 02 • RETURN
                  </span>
                  <span className={`w-2 h-2 rounded-full ${
                    isDark ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-emerald-600 shadow-xs'
                  }`} />
                </div>

                {/* Main Content: Skeuomorphic Recessed Well & Title */}
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 ${
                    isDark
                      ? 'neu-inset border border-emerald-500/30 text-emerald-400 shadow-[inset_0_3px_8px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.08)] group-hover:border-emerald-400 group-hover:text-emerald-300'
                      : 'bg-[#ecfdf5] border border-emerald-200/90 text-emerald-700 shadow-[inset_0_2px_5px_rgba(6,95,70,0.12),0_1px_0_#ffffff] group-hover:border-emerald-400 group-hover:text-emerald-800'
                  }`}>
                    <RotateCcw className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-lg sm:text-xl font-black tracking-tight ${
                      isDark ? 'text-slate-100' : 'text-slate-950 font-black'
                    }`}>
                      Return Equipment
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${
                      isDark ? 'text-slate-400' : 'text-slate-600 font-medium'
                    }`}>
                      Check in and return borrowed laboratory tools
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Tactile Dock */}
              <div className={`mt-5 px-3.5 py-2 rounded-xl flex items-center justify-between text-xs font-mono font-bold transition-all ${
                isDark
                  ? 'neu-inset-sm border border-white/5 text-slate-400 group-hover:text-emerald-300 group-hover:border-emerald-500/30'
                  : 'bg-slate-100/90 border border-slate-200/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] text-slate-700 group-hover:text-emerald-700 group-hover:border-emerald-300'
              }`}>
                <span>Open Return Station</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* 3. Bottom Return to Standby Bar */}
          <div className="pt-2 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setViewMode('landing')}
              className={`px-5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all duration-100 ease-out active:scale-95 cursor-pointer shadow-sm ${
                isDark
                  ? 'neu-card-sm border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white'
                  : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-800 shadow-[0_2px_4px_rgba(0,0,0,0.05),inset_0_1px_0_#ffffff]'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Standby Screen</span>
            </button>
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
