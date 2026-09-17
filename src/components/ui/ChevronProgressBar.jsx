import React from 'react';
import { 
  UserCheck, 
  CircuitBoard, 
  SlidersHorizontal, 
  FileCheck2, 
  Check, 
  Activity, 
  Sparkles,
  Layers,
  Cpu
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';

const STEPS = [
  { 
    id: 1, 
    code: 'SPEC-01', 
    title: 'BORROWER', 
    subtitle: 'ID CLEARANCE',
    icon: UserCheck 
  },
  { 
    id: 2, 
    code: 'SPEC-02', 
    title: 'FACILITY', 
    subtitle: 'LAB DISCIPLINE',
    icon: CircuitBoard 
  },
  { 
    id: 3, 
    code: 'SPEC-03', 
    title: 'APPARATUS', 
    subtitle: 'EQUIPMENT & CART',
    icon: SlidersHorizontal 
  },
  { 
    id: 4, 
    code: 'SPEC-04', 
    title: 'DISPATCH', 
    subtitle: 'SLIP & COMMIT',
    icon: FileCheck2 
  },
];

export default function ChevronProgressBar() {
  const { currentStep, setStep, borrower, selectedLab, cart, theme } = useTransaction();

  // Standby on Welcome Screen (Step 0)
  if (currentStep === 0) return null;

  const isDark = theme === 'dark';

  const canNavigateTo = (stepId) => {
    if (stepId === 1) return true;
    if (stepId === 2) return Boolean(borrower.groupLeader);
    if (stepId === 3) return Boolean(borrower.groupLeader && selectedLab);
    if (stepId === 4) return currentStep === 4;
    return false;
  };

  return (
    <div
      className={`w-full py-2 px-3 sm:px-6 lg:px-8 border-b shrink-0 select-none z-10 transition-colors duration-300 relative ${
        isDark
          ? 'bg-[#080d17] border-slate-800/90 shadow-[0_4px_16px_rgba(0,0,0,0.6)]'
          : 'bg-[#e4ebf5] border-slate-300/80 shadow-[0_4px_12px_rgba(0,0,0,0.06)]'
      }`}
      aria-label="Engineering Process Telemetry Bar"
    >
      {/* Main Engineering Schematic Process Track Container */}
      <div
        className={`max-w-6xl xl:max-w-7xl mx-auto rounded-2xl p-1 sm:p-1.5 flex items-stretch gap-1.5 sm:gap-2 border relative transition-all duration-300 shadow-inner ${
          isDark
            ? 'bg-[#0b1220] border-slate-700/80 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]'
            : 'bg-[#d5e0ee] border-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]'
        }`}
      >
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isClickable = canNavigateTo(step.id) && step.id <= currentStep;
          const StepIcon = step.icon;

          // Technical Chamfer Clip-Path for precision engineering aesthetic
          // Left-most chamfer on left, right-most on right, chevron connection between
          let chamferClass = 'rounded-xl';

          // Visual Styling depending on state
          let nodeStyles = '';
          if (isActive) {
            nodeStyles = isDark
              ? 'bg-gradient-to-r from-[#00b4d8] via-[#0891b2] to-[#0284c7] text-slate-950 border-2 border-cyan-300 shadow-[0_0_22px_rgba(6,182,212,0.65)] ring-1 ring-white/40 z-20'
              : 'bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-700 text-white border-2 border-cyan-300 shadow-[0_4px_16px_rgba(13,148,136,0.45)] z-20';
          } else if (isCompleted) {
            nodeStyles = isDark
              ? 'bg-[#121c2d] border border-emerald-500/50 text-slate-200 hover:border-emerald-400 hover:bg-[#18263e] shadow-[0_2px_8px_rgba(16,185,129,0.15)] z-10 cursor-pointer'
              : 'bg-[#eaf1fa] border border-emerald-600/40 text-slate-800 hover:bg-white shadow-sm z-10 cursor-pointer';
          } else {
            nodeStyles = isDark
              ? 'bg-[#090e18]/80 border border-slate-800/80 text-slate-500 opacity-65 z-0'
              : 'bg-[#cedbe9]/70 border border-slate-300/80 text-slate-400 opacity-65 z-0';
          }

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && setStep(step.id)}
              className={`flex-1 min-h-[46px] sm:min-h-[52px] px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-2.5 transition-all duration-200 relative group active:scale-[0.98] ${chamferClass} ${nodeStyles}`}
            >
              {/* Left Segment: Engineering Node Tag + Icon */}
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                {/* Technical Node Badge */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 transition-all ${
                    isActive
                      ? isDark
                        ? 'bg-slate-950 text-cyan-300 border border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                        : 'bg-white text-teal-900 border border-white/80 shadow-md'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : isDark
                      ? 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
                      : 'bg-slate-200 text-slate-500 border border-slate-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span className="tracking-tight">{step.id}</span>
                  )}
                </div>

                {/* Technical Label Readout */}
                <div className="flex flex-col text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] sm:text-[10px] font-mono font-extrabold uppercase tracking-widest ${
                        isActive
                          ? isDark
                            ? 'text-slate-900'
                            : 'text-cyan-100'
                          : isCompleted
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.code}
                    </span>

                    {/* Step Icon */}
                    <StepIcon
                      className={`w-3.5 h-3.5 hidden md:inline shrink-0 ${
                        isActive
                          ? isDark
                            ? 'text-slate-950'
                            : 'text-white'
                          : isCompleted
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                      }`}
                    />
                  </div>

                  <span
                    className={`truncate text-xs sm:text-sm font-black tracking-tight leading-tight ${
                      isActive
                        ? isDark
                          ? 'text-slate-950 font-black'
                          : 'text-white font-black'
                        : isCompleted
                        ? isDark
                          ? 'text-slate-100'
                          : 'text-slate-900 font-extrabold'
                        : isDark
                        ? 'text-slate-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              </div>

              {/* Right Segment: Status LED or Cart Counter */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Step 3 Live Apparatus Counter Pill */}
                {step.id === 3 && cart.length > 0 && (
                  <div
                    className={`px-1.5 sm:px-2 py-0.5 rounded-md font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm ${
                      isActive
                        ? isDark
                          ? 'bg-slate-950 text-cyan-300 border border-cyan-400'
                          : 'bg-white text-teal-900 border border-white'
                        : 'bg-cyan-500 text-slate-950 font-extrabold'
                    }`}
                  >
                    <Layers className="w-2.5 h-2.5" />
                    <span>{cart.length} {cart.length === 1 ? 'UNIT' : 'UNITS'}</span>
                  </div>
                )}

                {/* State Diodes */}
                {isActive && (
                  <span
                    className={`hidden xl:flex items-center gap-1 text-[9.5px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isDark
                        ? 'bg-slate-950/80 text-cyan-300 border border-cyan-400/80'
                        : 'bg-white/20 text-white border border-white/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    ACTIVE
                  </span>
                )}

                {isCompleted && (
                  <span className="hidden xl:inline text-[9px] font-mono text-emerald-400 font-extrabold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/40">
                    PASS
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
