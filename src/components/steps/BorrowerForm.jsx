import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, GraduationCap, Users, Clock, UserCheck } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from '../ui/TouchButton';
import ScrollNumberPicker from '../ui/ScrollNumberPicker';

const PROGRAMS = ['BSCPE', 'BSCE', 'BSCEE', 'BSECE'];
const YEAR_LEVELS = [
  { id: '1', label: '1st Year', code: '1' },
  { id: '2', label: '2nd Year', code: '2' },
  { id: '3', label: '3rd Year', code: '3' },
  { id: '4', label: '4th Year', code: '4' },
];
const SECTIONS = ['01', '02', '03', '04'];

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export default function BorrowerForm() {
  const { borrower, setBorrowerField, setStep, goToWelcome } = useTransaction();
  const [errors, setErrors] = useState({});
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Structured Time Range States (-- : -- AM/PM to -- : -- AM/PM)
  const [startHour, setStartHour] = useState('');
  const [startMinute, setStartMinute] = useState('');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endHour, setEndHour] = useState('');
  const [endMinute, setEndMinute] = useState('');
  const [endPeriod, setEndPeriod] = useState('AM');

  // Toggle selection for Program (tap again to untouch/deselect)
  const handleProgramSelect = (prog) => {
    setBorrowerField('program', borrower.program === prog ? '' : prog);
  };

  // Toggle selection for Year Level (tap again to untouch/deselect)
  const handleYearSelect = (yearId) => {
    if (selectedYear === yearId) {
      setSelectedYear('');
      if (selectedSem === '3') {
        setSelectedSem('');
      }
    } else {
      setSelectedYear(yearId);
      if (yearId === '1' || yearId === '4') {
        if (selectedSem === '3') setSelectedSem('');
      }
    }
  };

  // Toggle selection for Semester / Term (tap again to untouch/deselect)
  const handleSemSelect = (semId) => {
    setSelectedSem(selectedSem === semId ? '' : semId);
  };

  // Toggle selection for Section (tap again to untouch/deselect)
  const handleSectionSelect = (sec) => {
    setSelectedSection(selectedSection === sec ? '' : sec);
  };

  // Synchronize Structured Time Range into borrower.labTime
  useEffect(() => {
    if (startHour || startMinute || endHour || endMinute) {
      const sH = startHour ? startHour.padStart(2, '0') : '--';
      const sM = startMinute ? startMinute.padStart(2, '0') : '00';
      const eH = endHour ? endHour.padStart(2, '0') : '--';
      const eM = endMinute ? endMinute.padStart(2, '0') : '00';

      const combinedTime = `${sH}:${sM} ${startPeriod} - ${eH}:${eM} ${endPeriod}`;
      setBorrowerField('labTime', combinedTime);
    }
  }, [startHour, startMinute, startPeriod, endHour, endMinute, endPeriod, setBorrowerField]);

  // Initial load of existing borrower.labTime if available
  useEffect(() => {
    if (borrower.labTime && !startHour && !endHour) {
      const parts = borrower.labTime.split(' - ');
      if (parts.length === 2) {
        const [start, end] = parts;
        const [sTime, sP] = start.split(' ');
        const [sH, sM] = (sTime || '').split(':');
        const [eTime, eP] = end.split(' ');
        const [eH, eM] = (eTime || '').split(':');

        if (sH && sH !== '--') setStartHour(sH);
        if (sM) setStartMinute(sM);
        if (sP) setStartPeriod(sP);
        if (eH && eH !== '--') setEndHour(eH);
        if (eM) setEndMinute(eM);
        if (eP) setEndPeriod(eP);
      }
    }
  }, [borrower.labTime, startHour, endHour]);

  // Automatically update the Course Code whenever selections change (Format: 41-BSCPE-01)
  useEffect(() => {
    if (borrower.program || selectedYear || selectedSem || selectedSection) {
      const prog = borrower.program || '';
      const yr = selectedYear || '';
      const sem = selectedSem || '';
      const sec = selectedSection || '';

      if (yr && sem && prog && sec) {
        const autoCode = `${yr}${sem}-${prog}-${sec}`;
        setBorrowerField('courseCode', autoCode);
      }
    }
  }, [borrower.program, selectedYear, selectedSem, selectedSection, setBorrowerField]);

  // Parse existing Course Code on mount (Supports 41-BSCPE-01 and legacy formats)
  useEffect(() => {
    if (borrower.courseCode && !selectedYear && !selectedSem && !selectedSection) {
      const trimmed = borrower.courseCode.trim();
      if (trimmed.includes('-')) {
        const parts = trimmed.split('-');
        if (parts.length === 3) {
          const [yrSem, prog, sec] = parts;
          if (yrSem && yrSem.length >= 2) {
            const yr = yrSem[0];
            const sem = yrSem[1];
            if (['1', '2', '3', '4'].includes(yr)) setSelectedYear(yr);
            if (['1', '2', '3'].includes(sem)) setSelectedSem(sem);
          }
          if (PROGRAMS.includes(prog)) {
            setBorrowerField('program', prog);
          }
          if (SECTIONS.includes(sec)) {
            setSelectedSection(sec);
          }
        }
      } else {
        const parts = trimmed.split(' ');
        if (parts.length >= 2) {
          const prog = parts[0];
          const numPart = parts[1];
          if (PROGRAMS.includes(prog)) {
            setBorrowerField('program', prog);
          }
          if (numPart && numPart.length >= 4) {
            const yr = numPart[0];
            const sem = numPart[1];
            const sec = numPart.substring(2, 4);

            if (['1', '2', '3', '4'].includes(yr)) setSelectedYear(yr);
            if (['1', '2', '3'].includes(sem)) setSelectedSem(sem);
            if (SECTIONS.includes(sec)) setSelectedSection(sec);
          }
        }
      }
    }
  }, [borrower.courseCode, selectedYear, selectedSem, selectedSection, setBorrowerField]);

  const validate = () => {
    const errs = {};
    if (!borrower.program) errs.program = 'Select an Engineering Program';
    if (!borrower.courseCode?.trim()) errs.courseCode = 'Course Code required (e.g. 41-BSCPE-01)';
    if (!borrower.groupLeader?.trim()) errs.groupLeader = 'Group Leader / Student Name required';
    if (!borrower.instructor?.trim()) errs.instructor = 'Instructor name required';
    if (!borrower.labTime?.trim() || !startHour || !endHour) {
      errs.labTime = 'Please complete the time schedule range';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validate()) {
      setStep(2);
    }
  };

  return (
    <div className="flex-1 max-w-6xl xl:max-w-7xl 2xl:max-w-[1540px] mx-auto w-full p-3 sm:p-4 lg:p-5 flex flex-col justify-between min-h-screen lg:min-h-0 lg:h-full overflow-y-auto lg:overflow-hidden select-none pb-20 lg:pb-0">
      {/* 1. Step Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 font-extrabold tracking-wider uppercase">
              Step 01 of 04
            </span>
            <span className="text-xs text-slate-400 font-medium">• Institutional Clearance</span>
          </div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-100 leading-tight mt-0.5">
            Borrower Identification Form
          </h1>
        </div>
        <p className="text-xs text-slate-400 hidden md:block">
          Select program, schedule, and group credentials. Tap buttons to toggle.
        </p>
      </div>

      {/* 2. Form Grid with Neumorphic Raised Panels (Zero-Scroll 100% Viewport Fit on Kiosk) */}
      <form onSubmit={handleNext} className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 my-auto py-2">
        {/* Left Column: Academic & Course Code Builder */}
        <div className="neu-card rounded-3xl p-4 sm:p-5 space-y-3">
          <h2 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2 pb-1.5 border-b border-slate-800/80 uppercase tracking-wider">
            <GraduationCap className="w-4 h-4 text-cyan-400" />
            <span>Program & Course Details</span>
          </h2>

          {/* 1. Engineering Program Pill Select (Toggleable) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Engineering Program *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PROGRAMS.map((prog) => {
                const isSelected = borrower.program === prog;
                return (
                  <button
                    key={prog}
                    type="button"
                    onClick={() => handleProgramSelect(prog)}
                    className={`h-9 sm:h-10.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                      isSelected
                        ? 'neu-inset-cyan text-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.4)] ring-2 ring-cyan-400/80'
                        : 'neu-btn-raised text-slate-200 hover:text-white'
                    }`}
                  >
                    {prog}
                  </button>
                );
              })}
            </div>
            {errors.program && (
              <p className="text-[11px] text-rose-400 mt-0.5 font-semibold">{errors.program}</p>
            )}
          </div>

          {/* 2. Year Level & Semester Selector (Toggleable) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Year Level *
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {YEAR_LEVELS.map((y) => {
                  const isSelected = selectedYear === y.id;
                  return (
                    <button
                      key={y.id}
                      type="button"
                      onClick={() => handleYearSelect(y.id)}
                      className={`h-8.5 sm:h-9.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'neu-inset-cyan text-cyan-300 ring-2 ring-cyan-400/60'
                          : 'neu-btn-raised text-slate-200 hover:text-white'
                      }`}
                    >
                      {y.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Term / Semester *
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSemSelect('1')}
                  className={`h-8.5 sm:h-9.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedSem === '1'
                      ? 'neu-inset-cyan text-cyan-300 ring-2 ring-cyan-400/60'
                      : 'neu-btn-raised text-slate-200 hover:text-white'
                  }`}
                >
                  1st Sem
                </button>

                <button
                  type="button"
                  onClick={() => handleSemSelect('2')}
                  className={`h-8.5 sm:h-9.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedSem === '2'
                      ? 'neu-inset-cyan text-cyan-300 ring-2 ring-cyan-400/60'
                      : 'neu-btn-raised text-slate-200 hover:text-white'
                  }`}
                >
                  2nd Sem
                </button>

                {/* Summer button cleanly placed on the row below when 2nd or 3rd Year is clicked */}
                {(selectedYear === '2' || selectedYear === '3') && (
                  <button
                    type="button"
                    onClick={() => handleSemSelect('3')}
                    className={`col-span-2 h-8 rounded-xl text-xs font-bold transition-all animate-fade-in cursor-pointer ${
                      selectedSem === '3'
                        ? 'neu-inset-cyan text-cyan-300 ring-2 ring-cyan-400/60'
                        : 'neu-btn-raised text-amber-300 hover:text-amber-200 border border-amber-500/40'
                    }`}
                  >
                    Summer Term
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. Section Number Selector (Toggleable) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Class Section *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SECTIONS.map((sec) => {
                const isSelected = selectedSection === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleSectionSelect(sec)}
                    className={`h-8.5 sm:h-9.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'neu-inset-cyan text-cyan-300 ring-2 ring-cyan-400/60'
                        : 'neu-btn-raised text-slate-200 hover:text-white'
                    }`}
                  >
                    Sec {sec}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Course Code Display (Empty until options are selected) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Course Code *
            </label>

            <input
              type="text"
              value={borrower.courseCode}
              onChange={(e) => setBorrowerField('courseCode', e.target.value.toUpperCase())}
              placeholder="e.g. 41-BSCPE-01 (Select options above)"
              className={`w-full h-9.5 sm:h-10.5 px-3.5 rounded-xl neu-inset text-cyan-300 font-mono text-sm font-extrabold placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                errors.courseCode ? 'ring-2 ring-rose-500' : ''
              }`}
            />
            {errors.courseCode && (
              <p className="text-[11px] text-rose-400 mt-0.5 font-semibold">{errors.courseCode}</p>
            )}
          </div>
        </div>

        {/* Right Column: Group & Schedule Details */}
        <div className="neu-card rounded-3xl p-4 sm:p-5 space-y-3">
          <h2 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2 pb-1.5 border-b border-slate-800/80 uppercase tracking-wider">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Group & Schedule Information</span>
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Group No.
              </label>
              <div className="flex items-center neu-inset rounded-xl h-9.5 sm:h-10.5 px-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setBorrowerField('groupNo', String(Math.max(1, parseInt(borrower.groupNo || 1) - 1)))
                  }
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg neu-btn-raised text-slate-200 font-bold flex items-center justify-center text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="flex-1 text-center font-mono font-extrabold text-cyan-400 text-sm sm:text-base">
                  {borrower.groupNo || '1'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setBorrowerField('groupNo', String(Math.min(12, parseInt(borrower.groupNo || 1) + 1)))
                  }
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg neu-btn-raised text-slate-200 font-bold flex items-center justify-center text-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Group Leader / Student Name *
              </label>
              <input
                type="text"
                value={borrower.groupLeader}
                onChange={(e) => setBorrowerField('groupLeader', e.target.value)}
                placeholder="e.g. JASON CAYABYAB"
                className={`w-full h-9.5 sm:h-10.5 px-3.5 rounded-xl neu-inset text-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                  errors.groupLeader ? 'ring-2 ring-rose-500' : ''
                }`}
              />
              {errors.groupLeader && (
                <p className="text-[11px] text-rose-400 mt-0.5 font-semibold">{errors.groupLeader}</p>
              )}
            </div>
          </div>

          {/* Typeable Laboratory Instructor Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Laboratory Instructor * (Type Name)</span>
            </label>
            <input
              type="text"
              value={borrower.instructor}
              onChange={(e) => setBorrowerField('instructor', e.target.value)}
              placeholder="e.g. Engr. Jin Benir Macaranas"
              className={`w-full h-9.5 sm:h-10.5 px-3.5 rounded-xl neu-inset text-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                errors.instructor ? 'ring-2 ring-rose-500' : ''
              }`}
            />
            {errors.instructor && (
              <p className="text-[11px] text-rose-400 mt-0.5 font-semibold">{errors.instructor}</p>
            )}
          </div>

          {/* Structured Time of Laboratory Schedule */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Time of Laboratory Schedule *</span>
              </label>
              <span className="text-[11px] font-mono text-cyan-400 font-extrabold bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-500/40 truncate max-w-[200px]">
                {borrower.labTime}
              </span>
            </div>

            {/* DUAL TIME RANGE PICKER CONTAINER (Slim & Space-Saving) */}
            <div className="w-full py-1.5 sm:py-2 px-1.5 sm:px-3.5 rounded-2xl neu-inset border border-slate-800/80 flex items-center justify-between gap-0.5 sm:gap-1.5 overflow-x-auto no-scrollbar">
              {/* START TIME BLOCK */}
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                {/* Start Hour Scroll Picker */}
                <ScrollNumberPicker
                  value={startHour}
                  onChange={setStartHour}
                  options={HOUR_OPTIONS}
                  placeholder="--"
                />
                <span className="text-cyan-400 font-bold text-sm sm:text-base my-auto select-none">:</span>
                {/* Start Minute Scroll Picker */}
                <ScrollNumberPicker
                  value={startMinute}
                  onChange={setStartMinute}
                  options={MINUTE_OPTIONS}
                  placeholder="--"
                />

                {/* Start AM / PM Single Tap Toggle */}
                <button
                  type="button"
                  onClick={() => setStartPeriod((prev) => (prev === 'AM' ? 'PM' : 'AM'))}
                  className="w-10 sm:w-11 h-12 sm:h-13 rounded-xl neu-btn-raised bg-[#0f172a] hover:bg-[#131d35] border border-cyan-500/30 hover:border-cyan-400/80 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-sm select-none"
                  title="Tap to toggle AM / PM"
                >
                  <span className="font-mono font-black text-xs sm:text-sm text-cyan-300 drop-shadow-[0_0_6px_rgba(6,182,212,0.65)]">
                    {startPeriod}
                  </span>
                </button>
              </div>

              {/* MIDDLE "to" SEPARATOR */}
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-0.5 sm:px-1 shrink-0 my-auto select-none">
                to
              </span>

              {/* END TIME BLOCK */}
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                {/* End Hour Scroll Picker */}
                <ScrollNumberPicker
                  value={endHour}
                  onChange={setEndHour}
                  options={HOUR_OPTIONS}
                  placeholder="--"
                />
                <span className="text-cyan-400 font-bold text-sm sm:text-base my-auto select-none">:</span>
                {/* End Minute Scroll Picker */}
                <ScrollNumberPicker
                  value={endMinute}
                  onChange={setEndMinute}
                  options={MINUTE_OPTIONS}
                  placeholder="--"
                />

                {/* End AM / PM Single Tap Toggle */}
                <button
                  type="button"
                  onClick={() => setEndPeriod((prev) => (prev === 'AM' ? 'PM' : 'AM'))}
                  className="w-10 sm:w-11 h-12 sm:h-13 rounded-xl neu-btn-raised bg-[#0f172a] hover:bg-[#131d35] border border-cyan-500/30 hover:border-cyan-400/80 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-sm select-none"
                  title="Tap to toggle AM / PM"
                >
                  <span className="font-mono font-black text-xs sm:text-sm text-cyan-300 drop-shadow-[0_0_6px_rgba(6,182,212,0.65)]">
                    {endPeriod}
                  </span>
                </button>
              </div>
            </div>

            {errors.labTime && (
              <p className="text-[11px] text-rose-400 mt-0.5 font-semibold">{errors.labTime}</p>
            )}
          </div>
        </div>
      </form>

      {/* 3. Bottom Action CTA Bar (Responsive on Mobile, Zero-Scroll on Kiosk) */}
      <div className="pt-2 sm:pt-3 border-t border-slate-800/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 sm:gap-4 shrink-0">
        <TouchButton
          variant="secondary"
          size="md"
          icon={ArrowLeft}
          onClick={goToWelcome}
          className="w-full sm:w-auto min-w-[120px] sm:min-w-[140px] text-xs sm:text-sm font-bold"
        >
          Cancel
        </TouchButton>

        <TouchButton
          variant="primary"
          size="lg"
          icon={ArrowRight}
          onClick={handleNext}
          className="w-full sm:w-auto min-w-[220px] sm:min-w-[280px] text-sm sm:text-base font-extrabold shadow-lg"
        >
          Next: Select Laboratory
        </TouchButton>
      </div>
    </div>
  );
}
