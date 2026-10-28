import React, { useMemo } from 'react';
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
  const allEquipment = useMemo(() => getInventory(), []);
  const isDark = theme === 'dark';

  const handleSelectLab = (labId) => {
    setLab(labId);
    setStep(3);
  };

  const getCardStyle = (lab, isSelected) => {
    const topAccent =
      lab.id === 'CE'
        ? 'border-t-4 border-t-amber-500'
        : lab.id === 'CHEM'
        ? 'border-t-4 border-t-emerald-500'
        : lab.id === 'DIGITAL' || lab.id === 'DIGITAL_ECE'
        ? 'border-t-4 border-t-cyan-500'
        : 'border-t-4 border-t-rose-500';

    if (isSelected) {
      if (isDark) {
        return `bg-[#121c2e] border border-cyan-500/80 ${topAccent} ring-2 ring-cyan-500/25 shadow-lg`;
      }
      return `bg-white border-2 border-slate-900 ${topAccent} ring-2 ring-slate-900/10 shadow-md`;
    }

    return isDark
      ? `bg-[#0f172a] border border-slate-800 ${topAccent} hover:border-slate-700 hover:bg-[#131d31] shadow-md`
      : `bg-white border border-slate-300 ${topAccent} hover:border-slate-400 shadow-sm hover:shadow-md`;
  };

  const getIconStyle = (labId) => {
    if (isDark) {
      if (labId === 'CE') return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
      if (labId === 'CHEM') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
      if (labId === 'DIGITAL' || labId === 'DIGITAL_ECE') return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25';
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/25';
    }
    if (labId === 'CE') return 'bg-amber-50 border border-amber-200 text-amber-700';
    if (labId === 'CHEM') return 'bg-emerald-50 border border-emerald-200 text-emerald-700';
    if (labId === 'DIGITAL' || labId === 'DIGITAL_ECE') return 'bg-sky-50 border border-sky-200 text-sky-700';
    return 'bg-rose-50 border border-rose-200 text-rose-700';
  };

  return (
    <div className="flex-1 max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto w-full max-w-full overflow-x-hidden p-3 sm:p-5 lg:p-6 pb-5 sm:pb-7 flex flex-col md:justify-between select-none min-h-0">
      {/* 1. Step Header */}
      <div
        className={`flex items-center justify-between border-b pb-2.5 shrink-0 ${
          isDark ? 'border-slate-800/80' : 'border-slate-300'
        }`}
      >
        <h1
          className={`text-lg sm:text-2xl lg:text-3xl font-black leading-tight ${
            isDark ? 'text-slate-100' : 'text-slate-950'
          }`}
        >
          Select Laboratory Department
        </h1>
        <p
          className={`text-xs sm:text-sm hidden md:block ${
            isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'
          }`}
        >
          Choose the laboratory facility for your session.
        </p>
      </div>

      {/* 2. 4 Department Selection Cards Grid */}
      <div
        className={`my-3 md:my-auto rounded-2xl p-2.5 sm:p-3.5 border ${
          isDark
            ? 'bg-[#080d16] border-slate-800/80'
            : 'bg-slate-200/70 border-slate-300 shadow-inner'
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                className={`p-4 sm:p-5 rounded-2xl cursor-pointer flex flex-col justify-between group active:scale-[0.98] transition-all duration-150 touch-manipulation min-h-[200px] sm:min-h-[235px] lg:min-h-[260px] ${getCardStyle(
                  lab,
                  isSelected
                )}`}
              >
                <div>
                  {/* Top Icon & Tag */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${getIconStyle(
                        lab.id
                      )}`}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span
                      className={`text-[11px] font-mono px-2.5 py-1 rounded-lg font-bold border ${
                        isDark
                          ? 'bg-slate-900 text-slate-300 border-slate-700'
                          : 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                    >
                      {lab.tag}
                    </span>
                  </div>

                  {/* Lab Name & Available Items */}
                  <h3
                    className={`text-base sm:text-lg font-black leading-snug ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}
                  >
                    {lab.name}
                  </h3>
                  <p
                    className={`text-xs font-bold mt-1 uppercase tracking-wider ${
                      isDark ? 'text-cyan-400' : 'text-blue-700'
                    }`}
                  >
                    {itemCount} Items Available
                  </p>
                  <p
                    className={`text-xs mt-2 line-clamp-2 leading-relaxed ${
                      isDark ? 'text-slate-400' : 'text-slate-600 font-medium'
                    }`}
                  >
                    {lab.description}
                  </p>
                </div>

                {/* Card Footer */}
                <div
                  className={`pt-3.5 mt-4 flex items-center justify-between border-t ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <span
                    className={`text-xs flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg border ${
                      isDark
                        ? 'text-slate-300 border-slate-800 bg-slate-900'
                        : 'bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-blue-700'}`} />
                    <span>{lab.room ? lab.room.split(' ')[0] : 'Ready'}</span>
                  </span>

                  <span
                    className={`text-xs sm:text-sm font-black flex items-center gap-1.5 transition-colors ${
                      isSelected
                        ? isDark
                          ? 'text-cyan-400'
                          : 'text-blue-700'
                        : isDark
                        ? 'text-slate-300 group-hover:text-cyan-400'
                        : 'text-slate-800 group-hover:text-blue-700'
                    }`}
                  >
                    <span>{isSelected ? 'Selected' : 'Open Catalog'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Navigation */}
      <div
        className={`mt-auto md:mt-0 pt-3 border-t flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-slate-800/80' : 'border-slate-300'
        }`}
      >
        <TouchButton
          variant="secondary"
          size="md"
          icon={ArrowLeft}
          onClick={() => setStep(1)}
          className="w-full sm:w-auto min-w-[150px] text-xs sm:text-sm font-bold"
        >
          Back to Borrower Info
        </TouchButton>

        <div
          className={`text-xs sm:text-sm font-medium text-center sm:text-right ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          Borrower:{' '}
          <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-slate-900'}`}>
            {borrower.groupLeader || 'Not set'}
          </span>{' '}
          ({borrower.program || 'N/A'})
        </div>
      </div>
    </div>
  );
}
