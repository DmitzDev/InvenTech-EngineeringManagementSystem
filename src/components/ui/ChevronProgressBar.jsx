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

  const currentStepData = STEPS.find((s) => s.id === currentStep) || STEPS[0];
  const StepIconMobile = currentStepData.icon;

  return (
    <div
      className="w-full max-w-full overflow-hidden py-1 sm:py-2.5 px-2.5 sm:px-4 lg:px-8 shrink-0 select-none z-10 relative"
      aria-label="Engineering Process Telemetry Bar"
    >
      {/* Mobile-Native Compact Stepper (< md:) */}
      <div className="md:hidden w-full max-w-md mx-auto">
        <div className="neu-card-sm px-3 py-2 rounded-2xl border border-slate-800/80 flex flex-col gap-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/15 neu-inset flex items-center justify-center text-cyan-400 shrink-0">
                <StepIconMobile className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span className="text-[10px] font-mono text-cyan-400 font-extrabold uppercase tracking-wider shrink-0">
                  Step 0{currentStep}/04
                </span>
                <span className="text-slate-600 text-xs">•</span>
                <span className="text-xs font-bold text-slate-100 uppercase tracking-tight truncate">
                  {currentStepData.title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {currentStep === 3 && cart.length > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full neu-inset text-cyan-300 font-extrabold">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </span>
              )}
              <span className="text-[10px] font-mono text-slate-400">
                {currentStepData.code}
              </span>
            </div>
          </div>

          {/* 4-Step Interactive Pill Track */}
          <div className="grid grid-cols-4 gap-1.5 pt-0.5">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isClickable = canNavigateTo(step.id) && step.id <= currentStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && setStep(step.id)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                      : isCompleted
                      ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] cursor-pointer'
                      : 'bg-slate-800/90'
                  }`}
                  title={`${step.code}: ${step.title}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop/Tablet 15" Kiosk Hardware Stepper (hidden md:flex) */}
      <div className="hidden md:flex max-w-6xl xl:max-w-7xl mx-auto items-stretch gap-1.5 sm:gap-2.5 lg:gap-3">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isClickable = canNavigateTo(step.id) && step.id <= currentStep;
          const StepIcon = step.icon;

          let chamferClass = 'rounded-xl sm:rounded-2xl';

          // Visual Styling for each independent tactile hardware box
          let nodeStyles = '';
          if (isActive) {
            nodeStyles = isDark
              ? 'bg-gradient-to-b from-white via-slate-100 to-slate-200 text-slate-950 border-2 border-white shadow-[0_6px_20px_rgba(248,250,252,0.4),0_3px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_#ffffff,inset_0_-1px_2px_rgba(0,0,0,0.25)] z-20 font-bold scale-[1.01]'
              : 'bg-gradient-to-b from-white via-slate-100 to-slate-200 text-slate-900 border-2 border-slate-400 shadow-[0_6px_16px_rgba(0,0,0,0.15),inset_0_1px_1px_#ffffff] z-20 font-bold scale-[1.01]';
          } else if (isCompleted) {
            nodeStyles = isDark
              ? 'bg-gradient-to-b from-[#182334] to-[#101724] border border-emerald-500/50 text-slate-100 hover:border-emerald-400 hover:bg-[#1c293c] shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] z-10 cursor-pointer'
              : 'bg-gradient-to-b from-white to-[#edf2f8] border border-emerald-600/40 text-slate-800 hover:bg-white shadow-[0_2px_6px_rgba(0,0,0,0.08)] z-10 cursor-pointer';
          } else {
            nodeStyles = isDark
              ? 'bg-gradient-to-b from-[#141c2a] to-[#0e1522] border border-slate-800/90 text-slate-400 opacity-60 z-0 shadow-[0_3px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]'
              : 'bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] border border-slate-300 text-slate-700 z-0 shadow-sm';
          }

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && setStep(step.id)}
              className={`flex-1 min-h-[36px] sm:min-h-[42px] lg:min-h-[52px] px-1 sm:px-2 lg:px-3 py-0.5 sm:py-1 lg:py-2 flex items-center justify-between gap-0.5 sm:gap-1.5 lg:gap-2.5 transition-all duration-200 relative group active:scale-[0.98] ${chamferClass} ${nodeStyles}`}
            >
              {/* Left Segment: Engineering Node Tag + Icon */}
              <div className="flex items-center gap-0.5 sm:gap-1 lg:gap-2 min-w-0">
                {/* Technical Node Badge */}
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-md sm:rounded-lg flex items-center justify-center font-mono font-black text-[9px] sm:text-[10px] lg:text-xs shrink-0 transition-all ${isActive
                      ? isDark
                        ? 'bg-slate-950 text-white border border-slate-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]'
                        : 'bg-slate-950 text-white border border-slate-900 shadow-md keep-white'
                      : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : isDark
                          ? 'bg-slate-900 text-slate-500 border border-slate-800'
                          : 'bg-slate-200 text-slate-700 border border-slate-300 font-black'
                    }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  ) : (
                    <span className="tracking-tight">{step.id}</span>
                  )}
                </div>

                {/* Technical Label Readout */}
                <div className="flex flex-col text-left min-w-0">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span
                      className={`hidden sm:inline text-[9px] sm:text-[10px] font-mono font-extrabold uppercase tracking-widest ${isActive
                          ? isDark
                            ? 'text-slate-700'
                            : 'text-slate-600'
                          : isCompleted
                            ? 'text-emerald-400'
                            : isDark
                              ? 'text-slate-500'
                              : 'text-slate-600 font-bold'
                        }`}
                    >
                      {step.code}
                    </span>

                    {/* Step Icon */}
                    <StepIcon
                      className={`w-3.5 h-3.5 hidden md:inline shrink-0 ${isActive
                          ? isDark
                            ? 'text-slate-950'
                            : 'text-slate-900'
                          : isCompleted
                            ? 'text-emerald-400'
                            : isDark
                              ? 'text-slate-500'
                              : 'text-slate-700'
                        }`}
                    />
                  </div>

                  <span
                    className={`truncate text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-black tracking-tight leading-tight ${isActive
                        ? isDark
                          ? 'text-slate-950 font-black'
                          : 'text-slate-950 font-black'
                        : isCompleted
                          ? isDark
                            ? 'text-slate-100 font-extrabold'
                            : 'text-slate-900 font-extrabold'
                          : isDark
                            ? 'text-slate-400'
                            : 'text-slate-700 font-black'
                      }`}
                  >
                    {step.title}
                  </span>
                </div>
              </div>

              {/* Right Segment: Status LED or Cart Counter */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Step 3 Live Apparatus Counter Pill */}
                {step.id === 3 && cart.length > 0 && (
                  <div
                    className={`hidden xs:flex px-1 sm:px-2 py-0.5 rounded-md font-mono text-[8px] sm:text-[10px] font-black uppercase tracking-wider items-center gap-0.5 sm:gap-1 shadow-sm ${isActive
                        ? isDark
                          ? 'bg-slate-950 text-white border border-slate-800 shadow-inner'
                          : 'bg-slate-900 text-white border border-slate-950 keep-white'
                        : 'bg-slate-200 text-slate-950 font-extrabold'
                      }`}
                  >
                    <Layers className="w-2.5 h-2.5" />
                    <span>{cart.length} {cart.length === 1 ? 'UNIT' : 'UNITS'}</span>
                  </div>
                )}

                {/* State Diodes */}
                {isActive && (
                  <span
                    className={`hidden xl:flex items-center gap-1.5 text-[9.5px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${isDark
                        ? 'bg-slate-950 text-slate-100 border border-slate-800 shadow-inner'
                        : 'bg-slate-950 text-white keep-white'
                      }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
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
