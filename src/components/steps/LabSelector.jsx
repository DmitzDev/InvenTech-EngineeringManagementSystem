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
      if (lab.id === 'CE_CHEM' || lab.id === 'CE' || lab.id === 'CHEM') return 'neu-card ring-2 ring-emerald-500/80 shadow-[0_0_24px_rgba(16,185,129,0.25)]';
      if (lab.id === 'DIGITAL_ECE' || lab.id === 'DIGITAL' || lab.id === 'ECE') return 'neu-card ring-2 ring-cyan-500/80 shadow-[0_0_24px_rgba(6,182,212,0.25)]';
      if (lab.id === 'PHYSICS') return 'neu-card ring-2 ring-rose-500/80 shadow-[0_0_24px_rgba(244,63,94,0.25)]';
    }
    return 'neu-card neu-card-hover';
  };

  const getIconContainerStyle = (labId) => {
    if (labId === 'CE_CHEM' || labId === 'CE' || labId === 'CHEM') return 'neu-inset text-emerald-400 border border-emerald-500/20';
    if (labId === 'DIGITAL_ECE' || labId === 'DIGITAL' || labId === 'ECE') return 'neu-inset text-cyan-400 border border-cyan-500/20';
    if (labId === 'PHYSICS') return 'neu-inset text-rose-400 border border-rose-500/20';
    return 'neu-inset text-slate-400';
  };

  return (
    <div className="flex-1 max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto w-full p-3.5 sm:p-5 lg:p-6 pb-6 sm:pb-8 lg:pb-8 flex flex-col justify-between select-none">
      {/* 1. Step Header (Pixel-aligned with Step 1) */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-mono text-cyan-400 font-extrabold tracking-wider uppercase">
              Step 02 of 04
            </span>
            <span className="text-xs sm:text-sm text-slate-400 font-medium">• Institutional Facility</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-100 leading-tight mt-0.5">
            Select Laboratory Department
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 hidden md:block">
          Choose the specific engineering discipline and lab facility for your laboratory session.
        </p>
      </div>

      {/* 2. 3 Large Neumorphic Department Selection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 my-auto py-3">
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
              className={`p-5 sm:p-6 lg:p-7 rounded-3xl cursor-pointer flex flex-col justify-between group active:scale-98 min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] xl:min-h-[340px] transition-all duration-200 shadow-xl ${getAccentCardStyle(
                lab
              )}`}
            >
              <div>
                {/* Top Badge & Icon */}
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-md ${getIconContainerStyle(
                      lab.id
                    )}`}
                  >
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full neu-inset text-slate-300 font-extrabold">
                    {lab.tag}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-100 group-hover:text-white transition-colors leading-snug">
                  {lab.name}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-cyan-400 mt-1 uppercase tracking-wider">
                  {lab.shortName} • {itemCount} Items
                </p>
                <p className="text-xs sm:text-sm text-slate-300 mt-2.5 sm:mt-3 line-clamp-3 leading-relaxed">
                  {lab.description}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-4 sm:pt-5 flex items-center justify-between border-t border-slate-800/80 mt-4 sm:mt-5">
                <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="truncate">{lab.room ? lab.room.split(' ')[0] : 'Ready Facility'}</span>
                </span>

                <span
                  className={`text-xs sm:text-sm font-black flex items-center gap-1.5 transition-colors ${isSelected
                      ? 'text-cyan-400'
                      : 'text-slate-400 group-hover:text-cyan-300'
                    }`}
                >
                  <span>{isSelected ? 'Selected' : 'Open Catalog'}</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Bottom Navigation (Elevated with comfortable margin from bottom bezel) */}
      <div className="pt-3 sm:pt-4 mb-2 border-t border-slate-800/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4 shrink-0">
        <TouchButton
          variant="secondary"
          size="md"
          icon={ArrowLeft}
          onClick={() => setStep(1)}
          className="w-full sm:w-auto min-w-[150px] text-xs sm:text-sm font-bold"
        >
          Back to Borrower Info
        </TouchButton>

        <div className="text-xs sm:text-sm text-slate-400 font-medium text-center sm:text-right">
          Borrower: <span className="text-cyan-400 font-bold">{borrower.groupLeader || 'Not set'}</span> ({borrower.program || 'N/A'})
        </div>
      </div>
    </div>
  );
}

