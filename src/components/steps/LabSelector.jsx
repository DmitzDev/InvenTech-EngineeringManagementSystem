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
  const { selectedLab, setLab, setStep, borrower, theme } = useTransaction();
  const allEquipment = getInventory();
  const isDark = theme === 'dark';

  const handleSelectLab = (labId) => {
    setLab(labId);
    setStep(3);
  };

  const getAccentCardStyle = (lab) => {
    if (selectedLab === lab.id) {
      if (isDark) {
        if (lab.id === 'CE_CHEM' || lab.id === 'CE' || lab.id === 'CHEM') return 'neu-card ring-2 ring-emerald-500/80 shadow-[0_0_24px_rgba(16,185,129,0.25)]';
        if (lab.id === 'DIGITAL_ECE' || lab.id === 'DIGITAL' || lab.id === 'ECE') return 'neu-card ring-2 ring-cyan-500/80 shadow-[0_0_24px_rgba(6,182,212,0.25)]';
        if (lab.id === 'PHYSICS') return 'neu-card ring-2 ring-rose-500/80 shadow-[0_0_24px_rgba(244,63,94,0.25)]';
        return 'neu-card ring-2 ring-white/60';
      }
      return 'bg-white border-2 border-slate-900 ring-2 ring-slate-900/15 shadow-md';
    }
    return isDark ? 'neu-card neu-card-hover' : 'bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300';
  };

  const getIconContainerStyle = (labId) => {
    if (isDark) {
      if (labId === 'CE_CHEM' || labId === 'CE' || labId === 'CHEM') return 'neu-inset text-emerald-400 border border-emerald-500/20';
      if (labId === 'DIGITAL_ECE' || labId === 'DIGITAL' || labId === 'ECE') return 'neu-inset text-cyan-400 border border-cyan-500/20';
      if (labId === 'PHYSICS') return 'neu-inset text-rose-400 border border-rose-500/20';
      return 'neu-inset text-slate-400';
    }
    return 'bg-slate-50 border border-slate-200 text-slate-900 shadow-xs';
  };

  return (
    <div className="flex-1 max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto w-full p-3.5 sm:p-5 lg:p-6 pb-6 sm:pb-8 lg:pb-8 flex flex-col md:justify-between select-none">
      {/* 1. Step Header (Pixel-aligned with Step 1) */}
      <div className={`flex items-center justify-between border-b pb-2.5 shrink-0 ${
        isDark ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <div>
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight ${
            isDark ? 'text-slate-100' : 'text-slate-900 font-black'
          }`}>
            Select Laboratory Department
          </h1>
        </div>
        <p className={`text-xs sm:text-sm hidden md:block ${
          isDark ? 'text-slate-400' : 'text-slate-600 font-medium'
        }`}>
          Choose the specific engineering discipline and lab facility for your laboratory session.
        </p>
      </div>

      {/* 2. 3 Large Department Selection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-3 sm:mt-4 md:mt-0 md:my-auto py-3">
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
              className={`p-5 sm:p-6 lg:p-7 rounded-3xl cursor-pointer flex flex-col justify-between group active:scale-98 min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] xl:min-h-[340px] transition-all duration-200 ${getAccentCardStyle(
                lab
              )}`}
            >
              <div>
                {/* Top Badge & Icon */}
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${getIconContainerStyle(
                      lab.id
                    )}`}
                  >
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <span className={`text-xs font-mono px-3 py-1 rounded-full font-bold border ${
                    isDark
                      ? 'neu-inset text-slate-300 border-slate-700/60'
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}>
                    {lab.tag}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className={`text-lg sm:text-xl lg:text-2xl font-black leading-snug transition-colors ${
                  isDark
                    ? 'text-slate-100 group-hover:text-white'
                    : 'text-slate-900 group-hover:text-slate-950'
                }`}>
                  {lab.name}
                </h3>
                <p className={`text-xs sm:text-sm font-bold mt-1 uppercase tracking-wider ${
                  isDark ? 'text-cyan-400' : 'text-slate-700'
                }`}>
                  {lab.shortName} • {itemCount} Items
                </p>
                <p className={`text-xs sm:text-sm mt-2.5 sm:mt-3 line-clamp-3 leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600 font-medium'
                }`}>
                  {lab.description}
                </p>
              </div>

              {/* Card Footer */}
              <div className={`pt-4 sm:pt-5 flex items-center justify-between border-t mt-4 sm:mt-5 ${
                isDark ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                {/* Locker Location Tag / Facility Badge */}
                <span className={`text-xs flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded border ${
                  isDark
                    ? 'text-slate-400 border-slate-800 bg-slate-900/60'
                    : 'bg-blue-50 text-blue-800 border-blue-200/60'
                }`}>
                  <ShieldCheck className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-blue-700'}`} />
                  <span className="truncate">{lab.room ? lab.room.split(' ')[0] : 'Ready Facility'}</span>
                </span>

                <span
                  className={`text-xs sm:text-sm font-black flex items-center gap-1.5 transition-colors ${
                    isSelected
                      ? isDark ? 'text-cyan-400' : 'text-slate-900'
                      : isDark ? 'text-slate-400 group-hover:text-cyan-300' : 'text-slate-600 group-hover:text-slate-900'
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

      {/* 3. Bottom Navigation */}
      <div className={`mt-auto md:mt-0 pt-3 sm:pt-4 mb-2 border-t flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4 shrink-0 ${
        isDark ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <TouchButton
          variant="secondary"
          size="md"
          icon={ArrowLeft}
          onClick={() => setStep(1)}
          className="w-full sm:w-auto min-w-[150px] text-xs sm:text-sm font-bold"
        >
          Back to Borrower Info
        </TouchButton>

        <div className={`text-xs sm:text-sm font-medium text-center sm:text-right ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Borrower: <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-slate-900'}`}>{borrower.groupLeader || 'Not set'}</span> ({borrower.program || 'N/A'})
        </div>
      </div>
    </div>
  );
}

