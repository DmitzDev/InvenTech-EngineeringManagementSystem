import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import { LAB_OPTIONS, getInventory, isItemConsumable } from '../../data/equipmentData';
import TouchButton from '../ui/TouchButton';

const FACILITY_META = {
  CE: {
    code: 'DEPT-CE',
    division: 'Structural, Geotechnical & Surveying Division',
    highlights: ['Surveying Instruments', 'Concrete & Soil Testing', 'Materials Apparatus'],
    accentLight: 'border-t-amber-600',
    accentDark: 'border-t-amber-500',
    badgeLight: 'bg-amber-50 text-amber-900 border-amber-300',
    badgeDark: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  CHEM: {
    code: 'DEPT-CHEM',
    division: 'Analytical & General Chemistry Division',
    highlights: ['Volumetric Glassware', 'Analytical Balances', 'Thermal & Titration'],
    accentLight: 'border-t-emerald-600',
    accentDark: 'border-t-emerald-500',
    badgeLight: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    badgeDark: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  DIGITAL: {
    code: 'DEPT-DIG/ECE',
    division: 'Digital Logic, Microcontrollers & Communications',
    highlights: ['TTL Logic Gate ICs', 'ETEK Trainer Modules', 'Test & Measurement'],
    accentLight: 'border-t-blue-600',
    accentDark: 'border-t-cyan-500',
    badgeLight: 'bg-sky-50 text-sky-900 border-sky-300',
    badgeDark: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  PHYSICS: {
    code: 'DEPT-PHY',
    division: 'Classical Mechanics, Optics & Electromagnetism',
    highlights: ['Mechanics & Dynamics', 'Optics & Lasers', 'Calorimetry & Balances'],
    accentLight: 'border-t-rose-600',
    accentDark: 'border-t-rose-500',
    badgeLight: 'bg-rose-50 text-rose-900 border-rose-300',
    badgeDark: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
};

export default function LabSelector() {
  const { selectedLab, setLab, setStep, borrower, theme } = useTransaction();
  const allEquipment = useMemo(() => getInventory(), []);
  const isDark = theme === 'dark';

  const handleSelectLab = (labId) => {
    setLab(labId);
    setStep(3);
  };

  return (
    <div className="flex-1 max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto w-full max-w-full overflow-x-hidden p-3 sm:p-5 lg:p-6 pb-4 sm:pb-6 flex flex-col justify-between select-none min-h-0">
      {/* 1. Institutional Step Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b pb-2.5 sm:pb-3 shrink-0 ${
          isDark ? 'border-slate-800' : 'border-slate-300'
        }`}
      >
        <div>
          <span
            className={`font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-widest block mb-0.5 ${
              isDark ? 'text-cyan-400' : 'text-slate-600'
            }`}
          >
            Step 2 of 4 • Laboratory Facility Selection
          </span>
          <h1
            className={`text-lg sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight ${
              isDark ? 'text-slate-100' : 'text-slate-950'
            }`}
          >
            Select Engineering Laboratory Facility
          </h1>
        </div>

        {/* Active Borrower Summary Strip */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs w-fit ${
            isDark
              ? 'bg-[#0f172a] border-slate-800 text-slate-300'
              : 'bg-white border-slate-300 text-slate-700 shadow-xs'
          }`}
        >
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Borrower:</span>
          <span className={`font-extrabold uppercase ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {borrower.groupLeader || 'STUDENT'}
          </span>
          <span className="opacity-40">•</span>
          <span
            className={`font-mono font-bold ${
              isDark ? 'text-cyan-400' : 'text-blue-700'
            }`}
          >
            {borrower.courseCode || borrower.program || 'ENGR'}
          </span>
        </div>
      </div>

      {/* 2. 4-Facility Selector Grid (1-col on phone, 2-col on tablet, 4-col on desktop/kiosk) */}
      <div
        className={`my-3 sm:my-auto rounded-2xl p-2 sm:p-3.5 border ${
          isDark
            ? 'bg-[#080d16] border-slate-800/80'
            : 'bg-slate-200/75 border-slate-300 shadow-inner'
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4">
          {LAB_OPTIONS.map((lab, idx) => {
            const isSelected = selectedLab === lab.id;
            const meta = FACILITY_META[lab.id] || FACILITY_META.CE;

            const labItems = lab.subLabs
              ? allEquipment.filter((item) => lab.subLabs.includes(item.lab))
              : allEquipment.filter((item) => item.lab === lab.id);

            const totalApparatus = labItems.length;
            const totalUnits = labItems.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
            const returnableCount = labItems.filter((item) => !isItemConsumable(item)).length;
            const consumableCount = totalApparatus - returnableCount;

            return (
              <button
                key={lab.id}
                type="button"
                onClick={() => handleSelectLab(lab.id)}
                className={`group text-left rounded-xl p-3.5 sm:p-4 lg:p-5 flex flex-col justify-between transition-all duration-150 cursor-pointer touch-manipulation active:scale-[0.99] border border-t-4 ${
                  isDark ? meta.accentDark : meta.accentLight
                } ${
                  isSelected
                    ? isDark
                      ? 'bg-[#131d31] border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg'
                      : 'bg-white border-slate-900 ring-2 ring-slate-900/15 shadow-md'
                    : isDark
                    ? 'bg-[#0f172a] border-slate-800 hover:border-slate-700 hover:bg-[#131c30] shadow-md'
                    : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="w-full">
                  {/* Row 1: Facility Index + Room Code Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`font-mono text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        isDark ? meta.badgeDark : meta.badgeLight
                      }`}
                    >
                      0{idx + 1} • {lab.tag}
                    </span>

                    <span
                      className={`font-mono text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded border truncate ${
                        isDark
                          ? 'bg-slate-900 text-slate-300 border-slate-700'
                          : 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                    >
                      {lab.room}
                    </span>
                  </div>

                  {/* Row 2: Department Title & Division Subtitle */}
                  <h2
                    className={`text-base sm:text-lg lg:text-xl font-black tracking-tight leading-snug ${
                      isDark ? 'text-slate-100' : 'text-slate-950'
                    }`}
                  >
                    {lab.name}
                  </h2>
                  <p
                    className={`text-[11px] sm:text-xs font-semibold mt-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {meta.division}
                  </p>

                  {/* Row 3: Live Inventory Specification Ledger */}
                  <div
                    className={`mt-3 rounded-lg border grid grid-cols-2 divide-x overflow-hidden ${
                      isDark
                        ? 'bg-[#090e19] border-slate-800 divide-slate-800'
                        : 'bg-slate-50 border-slate-200/90 divide-slate-200/90'
                    }`}
                  >
                    <div className="px-2.5 py-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider block ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        Catalog Specs
                      </span>
                      <span
                        className={`font-mono text-xs sm:text-sm font-extrabold tabular-nums ${
                          isDark ? 'text-slate-100' : 'text-slate-900'
                        }`}
                      >
                        {totalApparatus} Items
                      </span>
                    </div>
                    <div className="px-2.5 py-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider block ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        Total Stock
                      </span>
                      <span
                        className={`font-mono text-xs sm:text-sm font-extrabold tabular-nums ${
                          isDark ? 'text-cyan-400' : 'text-blue-700'
                        }`}
                      >
                        {totalUnits} Units
                      </span>
                    </div>
                  </div>

                  {/* Row 4: Description & Scope Tags */}
                  <p
                    className={`text-xs mt-2.5 leading-relaxed line-clamp-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {lab.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {meta.highlights.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          isDark
                            ? 'bg-slate-900/90 text-slate-300 border-slate-800'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                    {consumableCount > 0 && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          isDark
                            ? 'bg-amber-950/50 text-amber-300 border-amber-800/60'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}
                      >
                        {consumableCount} Consumables
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 5: Action Footer */}
                <div
                  className={`w-full pt-3 mt-3.5 border-t flex items-center justify-between ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isSelected
                        ? isDark
                          ? 'text-cyan-400'
                          : 'text-blue-700'
                        : isDark
                        ? 'text-slate-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Active Facility</span>
                      </>
                    ) : (
                      <span>Ready for Requisition</span>
                    )}
                  </span>

                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      isSelected
                        ? isDark
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : 'bg-slate-900 text-white'
                        : isDark
                        ? 'bg-slate-800 text-slate-200 group-hover:bg-cyan-500 group-hover:text-slate-950'
                        : 'bg-slate-900 text-white group-hover:bg-blue-700'
                    }`}
                  >
                    <span>Open Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Navigation Bar (Responsive on both Mobile & Kiosk) */}
      <div
        className={`pt-2.5 sm:pt-3.5 border-t flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-slate-800' : 'border-slate-300'
        }`}
      >
        <TouchButton
          variant="secondary"
          size="md"
          icon={ArrowLeft}
          onClick={() => setStep(1)}
          className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold shrink-0"
        >
          Back to Borrower Form
        </TouchButton>

        <div
          className={`text-[11px] sm:text-xs font-medium text-right truncate ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          Tap any laboratory card above to browse its apparatus catalog.
        </div>
      </div>
    </div>
  );
}
