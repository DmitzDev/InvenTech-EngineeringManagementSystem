import React from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTransaction();
  const isDark = theme === 'dark';

  return (
    <div
      onClick={toggleTheme}
      className="relative cursor-pointer select-none group flex items-center"
      title={`Switch to ${isDark ? 'Light Skeuomorphism' : 'Dark Neomorphism'}`}
    >
      {/* Outer Tactile Inset Track */}
      <div className={`relative flex items-center p-1 rounded-full transition-all duration-300 ${
        isDark
          ? 'bg-[#090f1a] shadow-[inset_3px_3px_6px_#04070d,inset_-3px_-3px_6px_#131e33] border border-cyan-500/20'
          : 'bg-[#d2ddec] shadow-[inset_3px_3px_6px_rgba(150,165,185,0.8),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] border border-slate-300'
      }`}>
        {/* Sliding Tactile Active Thumb */}
        <div
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-out flex items-center justify-center ${
            isDark
              ? 'left-1 bg-gradient-to-br from-[#16233b] to-[#0f1828] shadow-[2px_2px_8px_#040810,-2px_-2px_6px_#223556,0_0_12px_rgba(6,182,212,0.3)] border border-cyan-400/30'
              : 'left-[calc(50%+2px)] bg-gradient-to-br from-[#ffffff] to-[#e8eef6] shadow-[2px_3px_8px_rgba(140,155,175,0.6),-2px_-2px_6px_rgba(255,255,255,1)] border border-amber-400/50'
          }`}
        />

        {/* Left Segment: Dark Mode */}
        <div
          className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
            isDark ? 'text-cyan-300 font-bold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
            isDark ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'text-slate-500'
          }`}>
            <Moon className="w-3 h-3" />
          </div>
          <span className="text-[11px] font-mono tracking-tight font-semibold">Dark</span>
        </div>

        {/* Right Segment: Light Mode */}
        <div
          className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
            !isDark ? 'text-amber-700 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
            !isDark ? 'bg-amber-400/30 text-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-slate-500'
          }`}>
            <Sun className="w-3 h-3" />
          </div>
          <span className="text-[11px] font-mono tracking-tight font-semibold">Light</span>
        </div>
      </div>
    </div>
  );
}
