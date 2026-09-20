import React, { useState, useEffect, useRef } from 'react';
import { Clock, Fingerprint } from 'lucide-react';

const INACTIVITY_TIMEOUT_MS = 60 * 1000; // 60 seconds idle sleep
const LOGO_CYCLE_INTERVAL_MS = 6 * 1000; // 6 seconds logo cycle

const LOGO_DATA = [
  {
    id: 'udd',
    src: '/images/udd_logo.png',
    alt: 'Universidad de Dagupan',
    badge: 'Official University Seal',
    title: 'Universidad de Dagupan',
    subtitle: 'Engineering Laboratory Management System',
  },
  {
    id: 'soe',
    src: '/images/soe_logo_transparent.png',
    fallbackSrc: '/images/soe_logo.png',
    alt: 'School of Engineering',
    badge: 'Department Crest',
    title: 'School of Engineering',
    subtitle: 'Laboratory Equipment Custody & Apparatus Kiosk',
  },
  {
    id: 'inventech',
    src: '/images/inventech_logo.png',
    alt: 'InvenTech System',
    badge: 'Smart Management System',
    title: 'InvenTech',
    subtitle: 'Automated Engineering Inventory & POS Kiosk',
  },
];

export default function KioskScreensaver() {
  const [isAsleep, setIsAsleep] = useState(false);
  const [activeLogoIndex, setActiveLogoIndex] = useState(0); // 0 = UdD, 1 = SOE, 2 = InvenTech
  const [isFading, setIsFading] = useState(false);
  const [time, setTime] = useState('');
  const [seconds, setSeconds] = useState('');
  const [ampm, setAmpm] = useState('');
  const [date, setDate] = useState('');

  const idleTimerRef = useRef(null);
  const logoIntervalRef = useRef(null);

  // Live time and date update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const secs = now.getSeconds().toString().padStart(2, '0');
      const hour12 = hours % 12 || 12;
      const period = hours >= 12 ? 'PM' : 'AM';

      setTime(`${hour12}:${minutes}`);
      setSeconds(secs);
      setAmpm(period);
      
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

  // Reset Idle Inactivity Timer on any user interaction
  const resetIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    if (isAsleep) {
      setIsAsleep(false);
    }

    idleTimerRef.current = setTimeout(() => {
      setIsAsleep(true);
      setActiveLogoIndex(0);
    }, INACTIVITY_TIMEOUT_MS);
  };

  useEffect(() => {
    const events = ['pointerdown', 'touchstart', 'mousedown', 'mousemove', 'keydown', 'scroll', 'click'];

    const handleUserActivity = () => {
      if (!isAsleep) {
        resetIdleTimer();
      }
    };

    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Initial timeout
    idleTimerRef.current = setTimeout(() => {
      setIsAsleep(true);
    }, INACTIVITY_TIMEOUT_MS);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isAsleep]);

  // Alternate between UdD, SOE, and InvenTech logos with a smooth crossfade
  useEffect(() => {
    if (isAsleep) {
      logoIntervalRef.current = setInterval(() => {
        setIsFading(true);
        setTimeout(() => {
          setActiveLogoIndex((prev) => (prev + 1) % LOGO_DATA.length);
          setIsFading(false);
        }, 600);
      }, LOGO_CYCLE_INTERVAL_MS);
    } else {
      if (logoIntervalRef.current) clearInterval(logoIntervalRef.current);
    }

    return () => {
      if (logoIntervalRef.current) clearInterval(logoIntervalRef.current);
    };
  }, [isAsleep]);

  const handleWakeUp = (e) => {
    e.stopPropagation();
    setIsAsleep(false);
    resetIdleTimer();
  };

  if (!isAsleep) return null;

  const currentItem = LOGO_DATA[activeLogoIndex] || LOGO_DATA[0];

  return (
    <div
      onClick={handleWakeUp}
      onTouchStart={handleWakeUp}
      className="fixed inset-0 z-[9999] bg-[#050811] flex flex-col items-center justify-between p-6 sm:p-10 select-none cursor-pointer overflow-hidden transition-opacity duration-500 ease-out"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Background Subtle Tech Matrix & Ambient Radial Halos */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* Soft Ambient Breathing Gradients */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[500px] bg-gradient-to-b from-cyan-600/10 via-blue-900/10 to-transparent blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[550px] h-[250px] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* 1. Top Centered Live Digital Clock */}
      <header className="flex items-center justify-center w-full relative z-10 pt-2">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 px-6 py-2 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-lg sm:text-xl font-extrabold text-white tracking-wider">{time}</span>
              <span className="text-xs text-cyan-400 font-bold">:{seconds}</span>
              <span className="text-xs text-slate-400 font-bold ml-1">{ampm}</span>
            </div>
          </div>
          <div className="h-4 w-px bg-slate-700/60 hidden sm:block" />
          <span className="text-xs sm:text-sm font-medium text-slate-400 font-mono">{date}</span>
        </div>
      </header>

      {/* 2. Center Hero: Clean Floating Logo (No Box/Card) & Rotating System Showcase */}
      <main className="flex flex-col items-center justify-center my-auto relative z-10 text-center space-y-6 max-w-2xl w-full px-4">
        
        {/* Floating Logo with Natural Depth (No Box Enclosure) */}
        <div className="relative flex items-center justify-center min-h-[180px] sm:min-h-[220px]">
          {/* Subtle Ambient Radial Glow behind the floating emblem */}
          <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-full scale-125 pointer-events-none" />

          <div
            className={`w-40 h-40 sm:w-52 sm:h-52 md:w-60 md:h-60 flex items-center justify-center transition-all duration-700 transform ${
              isFading ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
            }`}
          >
            <img
              src={currentItem.src}
              alt={currentItem.alt}
              onError={(e) => {
                if (currentItem.fallbackSrc && e.target.src !== currentItem.fallbackSrc) {
                  e.target.src = currentItem.fallbackSrc;
                }
              }}
              className="max-w-full max-h-full object-contain filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.85)] drop-shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            />
          </div>
        </div>

        {/* Institution & System Titles */}
        <div
          className={`space-y-2 transition-all duration-700 ${
            isFading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 text-[11px] font-mono tracking-widest uppercase">
            <span>{currentItem.badge}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            {currentItem.title}
          </h1>
          
          <p className="text-sm sm:text-base font-medium text-slate-400 max-w-lg mx-auto">
            {currentItem.subtitle}
          </p>

          {/* Department Tags */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-mono text-slate-500">
            <span className="px-2.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-800/80">ECE</span>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-800/80">CE</span>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-800/80">EE</span>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-800/80">ME</span>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-800/80">CpE</span>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-800/80">IE</span>
          </div>
        </div>

        {/* Minimalist Touch to Wake Button */}
        <div className="pt-2">
          <div className="inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-600/15 via-slate-900/90 to-cyan-600/15 border border-cyan-500/30 text-white font-semibold text-sm sm:text-base tracking-wide shadow-[0_0_24px_rgba(6,182,212,0.12)] hover:border-cyan-400 transition-all">
            <Fingerprint className="w-5 h-5 text-cyan-400 shrink-0" />
            <span className="tracking-wide">Touch screen to begin</span>
          </div>
        </div>
      </main>

      {/* Empty spacer for balanced vertical centering */}
      <div className="h-6 pointer-events-none" />
    </div>
  );
}


