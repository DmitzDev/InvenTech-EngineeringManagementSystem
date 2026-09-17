import React from 'react';

export default function StatsCard({ icon: Icon, label, value, accent = 'cyan', subtitle, trend }) {
  const accentMap = {
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      valueText: 'text-cyan-300',
      glow: 'hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]',
      badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      valueText: 'text-emerald-300',
      glow: 'hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      valueText: 'text-amber-300',
      glow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      valueText: 'text-rose-300',
      glow: 'hover:shadow-[0_0_25px_rgba(244,63,94,0.15)]',
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    },
    violet: {
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/30',
      text: 'text-violet-400',
      valueText: 'text-violet-300',
      glow: 'hover:shadow-[0_0_25px_rgba(139,92,246,0.15)]',
      badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      valueText: 'text-blue-300',
      glow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.15)]',
      badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    },
  };

  const colors = accentMap[accent] || accentMap.cyan;

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-[#091120] border ${colors.border} flex flex-col justify-between transition-all duration-300 hover:border-slate-600 ${colors.glow} select-none relative overflow-hidden group`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
          <p className={`text-2xl sm:text-3xl font-extrabold font-mono ${colors.valueText} leading-tight mt-1.5`}>
            {value}
          </p>
        </div>
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105`}
        >
          {Icon && <Icon className={`w-5 h-5 ${colors.text}`} />}
        </div>
      </div>

      {subtitle && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 gap-2">
          <span className="truncate">{subtitle}</span>
          {trend && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold border ${colors.badge} shrink-0`}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
