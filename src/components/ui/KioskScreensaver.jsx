import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Clock, ShieldCheck } from 'lucide-react';

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes idle sleep
const LOGO_CYCLE_INTERVAL_MS = 60 * 1000; // 1 minute logo crossfade cycle

export default function KioskScreensaver() {
  const [isAsleep, setIsAsleep] = useState(false);
  const [activeLogoIndex, setActiveLogoIndex] = useState(0); // 0 = UdD Seal, 1 = SOE Seal
  const [isFading, setIsFading] = useState(false);
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  const idleTimerRef = useRef(null);
  const logoIntervalRef = useRef(null);

  // Live time and date update
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
    const clockInterval = setInterval(updateTime, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Reset Idle Inactivity Timer on any user touch/mouse/keyboard activity
  const resetIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    if (isAsleep) {
      // Instant wake up
      setIsAsleep(false);
    }

    idleTimerRef.current = setTimeout(() => {
      setIsAsleep(true);
      setActiveLogoIndex(0);
    }, INACTIVITY_TIMEOUT_MS);
  };

  useEffect(() => {
    // Register global user activity listeners
    const events = ['pointerdown', 'touchstart', 'mousedown', 'mousemove', 'keydown', 'scroll', 'click'];

    const handleUserActivity = () => {
      if (!isAsleep) {
        resetIdleTimer();
      }
    };

    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Start initial idle timer
    idleTimerRef.current = setTimeout(() => {
      setIsAsleep(true);
    }, INACTIVITY_TIMEOUT_MS);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isAsleep]);

  // Alternate between UdD and SOE logos every 1 minute with a smooth crossfade
  useEffect(() => {
    if (isAsleep) {
      logoIntervalRef.current = setInterval(() => {
        setIsFading(true);
        setTimeout(() => {
          setActiveLogoIndex((prev) => (prev === 0 ? 1 : 0));
          setIsFading(false);
        }, 800); // Cross-fade duration
      }, LOGO_CYCLE_INTERVAL_MS);
    } else {
      if (logoIntervalRef.current) clearInterval(logoIntervalRef.current);
    }

    return () => {
      if (logoIntervalRef.current) clearInterval(logoIntervalRef.current);
    };
  }, [isAsleep]);

  // Wake up when screen is clicked/tapped while asleep
  const handleWakeUp = (e) => {
    e.stopPropagation();
    setIsAsleep(false);
    resetIdleTimer();
  };

  if (!isAsleep) return null;

  return (
    <div
      onClick={handleWakeUp}
      onTouchStart={handleWakeUp}
      className="fixed inset-0 z-[999] bg-[#050811]/98 backdrop-blur-2xl flex flex-col items-center justify-between p-6 sm:p-10 select-none cursor-pointer overflow-hidden animate-fade-in"
    >
      {/* Dynamic Ambient Glowing Halo Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-cyan-500/10 via-emerald-500/10 to-blue-500/10 blur-[160px] rounded-full pointer-events-none animate-pulse" />

      {/* 1. Top Screensaver Header */}
      <div className="flex items-center justify-between w-full relative z-10 max-w-5xl">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>UDD POS TOUCHSCREEN KIOSK • SLEEP MODE</span>
        </div>

        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full neu-inset text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-cyan-300 font-bold">{time}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 hidden sm:inline">{date}</span>
        </div>
      </div>

      {/* 2. Center Rotating Logo Display (Alternates every 1 minute) */}
      <div className="flex flex-col items-center justify-center my-auto relative z-10 text-center space-y-6">
        {/* Floating Logo Badge with Radiant Breathing Halo */}
        <div className="relative group flex items-center justify-center">
          <div
            className={`w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full p-4 sm:p-5 neu-card shadow-[0_0_60px_rgba(6,182,212,0.25)] flex items-center justify-center relative transition-all duration-1000 transform ${
              isFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            {/* Illuminated Outer Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-pulse pointer-events-none" />

            {activeLogoIndex === 0 ? (
              <img
                src="/images/udd_logo.png"
                alt="Universidad de Dagupan"
                className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
              />
            ) : (
              <img
                src="/images/soe_logo.png"
                alt="School of Engineering"
                className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
              />
            )}
          </div>
        </div>

        {/* Institution Titles (Synced with active logo) */}
        <div
          className={`space-y-1.5 transition-all duration-700 ${
            isFading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {activeLogoIndex === 0 ? 'Universidad de Dagupan' : 'School of Engineering'}
          </h2>
          <p className="text-xs sm:text-sm font-medium text-cyan-300/80 tracking-wider uppercase font-mono">
            {activeLogoIndex === 0 ? 'Engineering Laboratory Management System' : 'Laboratory POS Touchscreen Kiosk'}
          </p>
        </div>

        {/* Pulsing Touch Wakeup Indicator */}
        <div className="pt-4 flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs sm:text-sm font-bold tracking-wide shadow-[0_0_24px_rgba(6,182,212,0.4)] animate-bounce">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>Tap anywhere on the screen to wake kiosk</span>
        </div>
      </div>

      {/* 3. Bottom Screensaver Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-xs text-slate-500 w-full relative z-10 max-w-5xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Official Laboratory Equipment Borrower's System (UdD-FM-LM-01A-01)</span>
        </div>
        <div className="font-mono text-slate-400 text-[11px]">
          Arellano St., Dagupan City, Pangasinan
        </div>
      </div>
    </div>
  );
}
