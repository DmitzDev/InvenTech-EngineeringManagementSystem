import React from 'react';

export default function StatsCard({
  icon: Icon,
  sysTag = '[SYS.METRIC]',
  label,
  value,
  accent = 'cyan',
  subtitle,
  trend,
  trendType = 'normal', // 'normal' | 'critical' | 'warning'
}) {
  const badgeClasses = {
    normal:
      'bg-emerald-100 text-emerald-950 border border-emerald-600 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-500 font-bold',
    critical:
      'bg-rose-100 text-rose-950 border border-rose-600 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-500 font-bold animate-pulse',
    warning:
      'bg-amber-100 text-amber-950 border border-amber-600 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-500 font-bold',
  }[trendType] || 'bg-slate-200 text-slate-950 border border-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 font-bold';

  const iconAccent = {
    cyan: 'text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/80 border-cyan-400 dark:border-cyan-600',
    violet: 'text-violet-700 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/80 border-violet-400 dark:border-violet-600',
    amber: 'text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 border-amber-500 dark:border-amber-600',
    rose: 'text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 border-rose-400 dark:border-rose-600',
    emerald: 'text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 dark:border-emerald-600',
  }[accent] || 'text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700';

  return (
    <article
      className="p-5 rounded-2xl bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 ring-1 ring-inset ring-white/10 dark:ring-white/5 shadow-xs flex flex-col justify-between select-none relative overflow-hidden transition-all duration-150 hover:border-slate-300 dark:hover:border-slate-700"
      aria-label={`${label}: ${value}`}
    >
      <div>
        {/* Monospace System Micro-Tag & Icon */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider">
            {sysTag}
          </span>
          {Icon && (
            <div
              className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 ${iconAccent}`}
              aria-hidden="true"
            >
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* High-Legibility Label */}
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mt-3">
          {label}
        </h3>

        {/* High-Contrast Large Value */}
        <div
          className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-950 dark:text-white mt-1"
          role="status"
          aria-live="polite"
        >
          {value}
        </div>
      </div>

      {/* Subtitle & Trend/Status Pill */}
      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t-2 border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs sm:text-sm text-slate-700 dark:text-slate-300 gap-2">
          <span className="font-medium truncate">{subtitle}</span>
          {trend && (
            <span className={`px-2.5 py-1 rounded-md text-xs tracking-tight shrink-0 ${badgeClasses}`}>
              {trend}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
