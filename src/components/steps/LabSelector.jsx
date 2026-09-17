import React from 'react';
import { Building2, Cpu, Radio, FlaskConical, Atom, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import { LAB_OPTIONS, getInventory } from '../../data/equipmentData';
import TouchButton from '../ui/TouchButton';

const ICON_MAP = {
  Building2,
  Cpu,
  Radio,
  FlaskConical,
  Atom,
};

export default function LabSelector() {
  const { selectedLab, setLab, setStep, borrower } = useTransaction();
  const allEquipment = getInventory();

  const handleSelectLab = (labId) => {
    setLab(labId);
    setStep(3);
  };

  const getAccentCardStyle = (lab) => {
    if (selectedLab === lab.id) {
      if (lab.id === 'CE') return 'neu-card ring-2 ring-amber-500/80 shadow-[0_0_24px_rgba(245,158,11,0.25)]';
      if (lab.id === 'DIGITAL_ECE' || lab.id === 'DIGITAL' || lab.id === 'ECE') return 'neu-card ring-2 ring-cyan-500/80 shadow-[0_0_24px_rgba(6,182,212,0.25)]';
      if (lab.id === 'CHEM') return 'neu-card ring-2 ring-emerald-500/80 shadow-[0_0_24px_rgba(16,185,129,0.25)]';
      if (lab.id === 'PHYSICS') return 'neu-card ring-2 ring-rose-500/80 shadow-[0_0_24px_rgba(244,63,94,0.25)]';
    }
    return 'neu-card neu-card-hover';
  };

  const getIconContainerStyle = (labId) => {
    if (labId === 'CE') return 'neu-inset text-amber-400 border border-amber-500/20';
    if (labId === 'DIGITAL_ECE' || labId === 'DIGITAL' || labId === 'ECE') return 'neu-inset text-cyan-400 border border-cyan-500/20';
    if (labId === 'CHEM') return 'neu-inset text-emerald-400 border border-emerald-500/20';
    if (labId === 'PHYSICS') return 'neu-inset text-rose-400 border border-rose-500/20';
    return 'neu-inset text-slate-400';
  };

  return (
    <div className="flex-1 max-w-6xl xl:max-w-7xl 2xl:max-w-[1540px] mx-auto w-full p-3 sm:p-4 lg:p-5 flex flex-col justify-between min-h-screen lg:min-h-0 lg:h-full overflow-y-auto lg:overflow-hidden select-none pb-20 lg:pb-0">
      {/* 1. Step Header (Pixel-aligned with Step 1) */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 font-extrabold tracking-wider uppercase">
              Step 02 of 04
            </span>
            <span className="text-xs text-slate-400 font-medium">• Institutional Facility</span>
          </div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-100 leading-tight mt-0.5">
            Select Laboratory Department
          </h1>
        </div>
        <p className="text-xs text-slate-400 hidden md:block">
          Choose the specific engineering discipline and lab facility for your laboratory session.
        </p>
      </div>

      {/* 2. 4 Neumorphic Department Selection Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6 my-auto py-2">
        {LAB_OPTIONS.map((lab) => {
          const Icon = ICON_MAP[lab.iconName] || Building2;
          const isSelected = selectedLab === lab.id;
          const itemCount = lab.subLabs
            ? allEquipment.filter((item) => lab.subLabs.includes(item.lab)).length
            : allEquipment.filter((item) => item.lab === lab.id).length;

          return (
            <div
              key={lab.id}
              onClick={() => handleSelectLab(lab.id)}
              className={`p-4 sm:p-5 rounded-3xl cursor-pointer flex flex-col justify-between group active:scale-[0.98] min-h-[170px] sm:min-h-[220px] lg:min-h-[280px] transition-all duration-200 ${getAccentCardStyle(
                lab
              )}`}
            >
              <div>
                {/* Top Badge & Icon */}
                <div className="flex items-center justify-between mb-3 sm:mb-3.5">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${getIconContainerStyle(
                      lab.id
                    )}`}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full neu-inset-sm text-slate-300 font-bold">
                    {lab.tag}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-white transition-colors leading-tight">
                  {lab.name}
                </h3>
                <p className="text-[10px] font-bold text-cyan-400 mt-0.5 uppercase tracking-wider">
                  {lab.shortName} • {itemCount} Items
                </p>
                <p className="text-xs text-slate-400 mt-1.5 sm:mt-2 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                  {lab.description}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-3 sm:pt-3.5 flex items-center justify-between border-t border-slate-800/80 mt-2.5 sm:mt-3">
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate">{lab.room ? lab.room.split(' ')[0] : 'Ready'}</span>
                </span>

                <span
                  className={`text-xs font-bold flex items-center gap-1 transition-colors ${
                    isSelected
                      ? 'text-cyan-400'
                      : 'text-slate-400 group-hover:text-cyan-300'
                  }`}
                >
                  <span>{isSelected ? 'Selected' : 'Open'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Bottom Navigation */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 sm:gap-4 shrink-0">
        <TouchButton
          variant="secondary"
          size="md"
          icon={ArrowLeft}
          onClick={() => setStep(1)}
          className="w-full sm:w-auto text-xs sm:text-sm"
        >
          Back to Borrower Info
        </TouchButton>

        <div className="text-xs text-slate-400 font-medium text-center sm:text-right">
          Borrower: <span className="text-cyan-400 font-bold">{borrower.groupLeader || 'Not set'}</span> ({borrower.program})
        </div>
      </div>
    </div>
  );
}

