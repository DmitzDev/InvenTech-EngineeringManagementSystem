import React, { useState, useEffect } from 'react';
import { Clock, Terminal, Menu, X, Shield, Sparkles } from 'lucide-react';
import FullscreenToggle from '../ui/FullscreenToggle';

export default function AdminHeader({ onToggleMobileMenu, isMobileMenuOpen }) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

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
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 px-3.5 sm:px-6 bg-[#080e1a] border-b border-slate-800/80 flex items-center justify-between shrink-0 transition-colors z-20 select-none">
      {/* Left: Mobile Drawer Trigger + Portal Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2.5 rounded-xl bg-[#0d1627] border border-slate-700/80 text-slate-300 hover:text-white cursor-pointer active:scale-95"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5 text-cyan-400" />}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping hidden sm:inline-block" />
          <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">
            Engineering Laboratory Portal
          </span>
        </div>
      </div>

      {/* Right: Actions, Theme, and Live Clock */}
      <div className="flex items-center gap-2 sm:gap-3">
        <a
          href="/"
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-950/80 to-[#0e192d] hover:from-cyan-900/80 hover:to-[#13233f] border border-cyan-500/40 text-xs sm:text-sm font-bold text-cyan-300 hover:text-cyan-200 transition-all shrink-0 cursor-pointer active:scale-95 shadow-sm"
          title="Open Student Kiosk Terminal"
        >
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="hidden xs:inline">Launch Kiosk</span>
        </a>

        <FullscreenToggle />

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0d1627] border border-slate-800 text-xs text-slate-300 shrink-0">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold font-mono text-cyan-300">{time}</span>
          <span className="text-slate-600 hidden lg:inline">•</span>
          <span className="text-slate-400 hidden lg:inline font-medium">{date}</span>
        </div>
      </div>
    </header>
  );
}
