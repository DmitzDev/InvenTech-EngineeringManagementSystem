import React from 'react';
import { 
  Check, 
  UserCheck, 
  CircuitBoard, 
  SlidersHorizontal, 
  FileCheck2, 
  Cpu, 
  Layers 
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';

const STEPS = [
  { id: 1, code: 'SPEC-01', label: 'Borrower Clearance', shortLabel: 'Borrower', icon: UserCheck },
  { id: 2, code: 'SPEC-02', label: 'Laboratory Facility', shortLabel: 'Lab', icon: CircuitBoard },
  { id: 3, code: 'SPEC-03', label: 'Apparatus Matrix', shortLabel: 'Apparatus', icon: SlidersHorizontal },
  { id: 4, code: 'SPEC-04', label: 'Dispatch & Print', shortLabel: 'Commit', icon: FileCheck2 },
];

export default function StepIndicator() {
  const { currentStep, setStep, borrower, selectedLab, cart } = useTransaction();
  if (currentStep === 0) return null;

  const canNavigateTo = (stepId) => {
    if (stepId === 1) return true;
    if (stepId === 2) return Boolean(borrower.groupLeader);
    if (stepId === 3) return Boolean(borrower.groupLeader && selectedLab);
    if (stepId === 4) return currentStep === 4;
    return false;
  };

  return (
    <div className="w-full bg-[#080d17] border-b border-slate-800/80 px-4 md:px-8 py-2 shrink-0 select-none shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 relative">
        {STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isClickable = canNavigateTo(step.id) && step.id < currentStep;
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              onClick={() => isClickable && setStep(step.id)}
              className={`flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition-all duration-200 border ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/90 to-[#0e1b2f] border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.35)]'
                  : isCompleted
                  ? 'bg-[#0f192b] border-emerald-500/40 cursor-pointer hover:border-emerald-400 text-slate-200'
                  : 'bg-[#090f1a] border-slate-800/80 opacity-60 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-black shrink-0 ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider truncate">
                    {step.code}
                  </span>
                  <span
                    className={`text-xs font-black truncate ${
                      isActive ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>

              {step.id === 3 && cart && cart.length > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 text-[10px] font-mono font-black shrink-0">
                  {cart.length}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
