import React from 'react';

export default function StatsCard({
  icon: Icon,
  sysTag,
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
      className="neu-card neu-card-hover p-3 sm:p-3.5 rounded-xl flex flex-col justify-between select-none relative overflow-hidden transition-all duration-150 min-w-0"
      aria-label={`${label}: ${value}`}
    >
      <div className="min-w-0">
        {/* Top Header: Icon & optional tag */}
        <div className="flex items-center justify-between gap-2">
          {Icon ? (
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center shrink-0 ${iconAccent}`}
              aria-hidden="true"
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          ) : <div />}
          {sysTag && (
            <span className="font-mono text-[10px] font-bold text-slate-500 tracking-wider truncate">
              {sysTag}
            </span>
          )}
        </div>

        {/* Clean Label */}
        <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mt-2 truncate">
          {label}
        </h3>

        {/* Recessed Gauge with Value */}
        <div className="neu-inset-sm px-3 py-1.5 rounded-lg mt-1.5 flex items-baseline justify-between gap-1.5 min-w-0">
          <div
            className="text-lg sm:text-xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white truncate min-w-0"
            role="status"
            aria-live="polite"
          >
            {value}
          </div>
          {trend && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight shrink-0 ${badgeClasses}`}>
              {trend}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <div className="mt-2 text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
          {subtitle}
        </div>
      )}
    </article>
  );
}
