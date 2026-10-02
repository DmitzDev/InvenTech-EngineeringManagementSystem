import React, { useState, useEffect, useRef } from 'react';
import { Clock, Fingerprint } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';

const INACTIVITY_TIMEOUT_MS = 60 * 1000; // 60 seconds idle sleep
const LOGO_CYCLE_INTERVAL_MS = 6 * 1000; // 6 seconds logo cycle

const LOGO_DATA = [
  {
    id: 'udd',
    src: '/images/udd_logo.png',
    alt: 'Universidad de Dagupan',
    badge: 'Official University Seal',
    title: 'Universidad de Dagupan',
    subtitle: 'School of Engineering • Laboratory Management System',
  },
  {
    id: 'soe',
    src: '/images/soe_logo_transparent.png',
    fallbackSrc: '/images/soe_logo.png',
    alt: 'School of Engineering',
    badge: 'Department Crest',
    title: 'School of Engineering',
    subtitle: 'Equipment Custody, Apparatus Catalog & Clearance Kiosk',
  },
  {
    id: 'inventech',
    src: '/images/inventech_logo.png',
    alt: 'InvenTech System',
    badge: 'Institutional Terminal',
    title: 'InvenTech Management',
    subtitle: 'Automated Engineering Inventory & Smart Borrowing Station',
  },
];

const ENGINEERING_PROGRAMS = [
  { code: 'BSCE', name: 'Civil' },
  { code: 'BSCPE', name: 'Computer' },
  { code: 'BSECE', name: 'Electronics' },
  { code: 'BSCEE', name: 'Civil-Env' },
  { code: 'BSEE', name: 'Electrical' },
  { code: 'BSME', name: 'Mechanical' },
];

export default function KioskScreensaver() {
  const { theme } = useTransaction();
  const isDark = theme === 'dark';

  const [isAsleep, setIsAsleep] = useState(false);
  const [activeLogoIndex, setActiveLogoIndex] = useState(0); // 0 = UdD, 1 = SOE, 2 = InvenTech
  const [isFading, setIsFading] = useState(false);
  const [time, setTime] = useState('');
  const [seconds, setSeconds] = useState('');
  const [ampm, setAmpm] = useState('');
  const [date, setDate] = useState('');

  const idleTimerRef = useRef(null);
  const logoIntervalRef = useRef(null);

  // Live real-time Philippine Standard Time & Date
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
        }, 500);
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
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-5 sm:p-8 md:p-10 select-none cursor-pointer overflow-hidden transition-all duration-500 ease-out ${
        isDark ? 'bg-[#050811] text-slate-100' : 'bg-[#f4f7fb] text-slate-900'
      }`}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Background Subtle Tech Architectural Grid */}
      <div
        className={`absolute inset-0 bg-[size:36px_36px] pointer-events-none ${
          isDark
            ? 'bg-[linear-gradient(to_right,#1e293b14_1px,transparent_1px),linear-gradient(to_bottom,#1e293b14_1px,transparent_1px)]'
            : 'bg-[linear-gradient(to_right,#cbd5e128_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e128_1px,transparent_1px)]'
        }`}
      />

      {/* Atmospheric Radial Backlight Bloom */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] blur-[130px] rounded-full pointer-events-none transition-all duration-700 ${
          isDark
            ? 'bg-gradient-to-b from-cyan-600/15 via-blue-900/10 to-transparent'
            : 'bg-gradient-to-b from-cyan-400/20 via-blue-200/25 to-transparent'
        }`}
      />
      {/* 1. Header: Sleek Centered Institutional Clock Capsule */}
      <header className="flex items-center justify-center w-full max-w-5xl relative z-10">
        <div
          className={`flex items-center gap-3 px-5 py-2 rounded-2xl border backdrop-blur-md shadow-md ${
            isDark
              ? 'bg-slate-900/80 border-slate-800/90 text-white shadow-slate-950/40'
              : 'bg-white/90 border-slate-200/90 text-slate-800 shadow-slate-200/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            <div className="flex items-baseline gap-0.5 font-mono">
              <span className={`text-base sm:text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {time}
              </span>
              <span className={`text-[11px] font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                :{seconds}
              </span>
              <span className={`text-[10px] font-bold ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {ampm}
              </span>
            </div>
          </div>
          <div className={`h-3.5 w-px ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <span className={`text-xs font-mono font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {date}
          </span>
        </div>
      </header>

      {/* 2. Main Hero Showcase Area */}
      <main className="flex flex-col items-center justify-center my-auto relative z-10 text-center space-y-5 sm:space-y-6 max-w-2xl w-full px-4">
        {/* Floating Emblem (No Hard Box, Smooth Natural Depth) */}
        <div className="relative flex items-center justify-center min-h-[170px] sm:min-h-[210px] md:min-h-[230px]">
          {/* Subtle Ambient Aura */}
          <div
            className={`absolute inset-0 blur-2xl rounded-full scale-125 pointer-events-none ${
              isDark ? 'bg-cyan-500/15' : 'bg-cyan-400/25'
            }`}
          />

          <div
            className={`w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 flex items-center justify-center transition-all duration-500 transform ${
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
              className={`max-w-full max-h-full object-contain filter ${
                isDark
                  ? 'drop-shadow-[0_16px_32px_rgba(0,0,0,0.9)] drop-shadow-[0_0_24px_rgba(6,182,212,0.2)]'
                  : 'drop-shadow-[0_14px_24px_rgba(0,0,0,0.18)]'
              }`}
            />
          </div>
        </div>

        {/* Institution & Department Information */}
        <div
          className={`space-y-2.5 transition-all duration-500 ${
            isFading ? 'opacity-0 translate-y-1.5' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5">
            <span
              className={`px-3.5 py-1 rounded-full border text-[10.5px] font-mono tracking-wider uppercase font-bold backdrop-blur-md ${
                isDark
                  ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300 shadow-sm'
                  : 'bg-cyan-100/90 border-cyan-300 text-cyan-900 shadow-sm'
              }`}
            >
              {currentItem.badge}
            </span>
          </div>

          {/* Main Title */}
          <h1
            className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {currentItem.title}
          </h1>

          {/* Subtitle */}
          <p
            className={`text-xs sm:text-sm md:text-base font-medium max-w-lg mx-auto leading-relaxed ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {currentItem.subtitle}
          </p>

          {/* Engineering Department Tags */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-1.5">
            {ENGINEERING_PROGRAMS.map((p) => (
              <span
                key={p.code}
                className={`px-2.5 py-0.5 rounded-lg border text-[10.5px] font-mono font-bold transition-colors ${
                  isDark
                    ? 'bg-slate-900/80 border-slate-800 text-slate-400'
                    : 'bg-white/90 border-slate-200 text-slate-700 shadow-xs'
                }`}
              >
                {p.code}
              </span>
            ))}
          </div>
        </div>

        {/* 3. High-Contrast Touch-to-Wake Capsule (Invite interaction) */}
        <div className="pt-2 sm:pt-4">
          <div
            className={`inline-flex items-center gap-3 px-7 sm:px-9 py-3 sm:py-3.5 rounded-full border text-sm sm:text-base font-extrabold tracking-wide transition-all duration-300 shadow-lg active:scale-95 group ${
              isDark
                ? 'bg-slate-900/90 border-cyan-500/40 text-white shadow-[0_0_30px_rgba(6,182,212,0.18)] hover:border-cyan-400'
                : 'bg-white border-cyan-500/60 text-slate-900 shadow-[0_8px_25px_rgba(6,182,212,0.2)] hover:border-cyan-600'
            }`}
          >
            <Fingerprint
              className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 transition-transform group-hover:scale-110 ${
                isDark ? 'text-cyan-400 animate-pulse' : 'text-cyan-600 animate-pulse'
              }`}
            />
            <span className="tracking-wider">Touch screen to begin</span>
          </div>
        </div>
      </main>

      {/* 3. Footer: Subtext & Version Identifier */}
      <footer className="w-full max-w-5xl flex items-center justify-between text-[10px] font-mono text-slate-500 relative z-10 pt-2">
        <span className="truncate">Universidad de Dagupan • Engineering Department</span>
        <span className="shrink-0">v2.4 KIOSK ISO-CERTIFIED</span>
      </footer>
    </div>
  );
}


