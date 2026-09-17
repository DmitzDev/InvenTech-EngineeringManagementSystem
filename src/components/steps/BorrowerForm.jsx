import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, GraduationCap, Users, Clock, UserCheck } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from '../ui/TouchButton';

const PROGRAMS = ['BSCPE', 'BSCE', 'BSCEE', 'BSECE'];
const YEAR_LEVELS = [
  { id: '1', label: '1st Year', code: '1' },
  { id: '2', label: '2nd Year', code: '2' },
  { id: '3', label: '3rd Year', code: '3' },
  { id: '4', label: '4th Year', code: '4' },
];
const SECTIONS = ['01', '02', '03', '04'];

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

  // Automatically update the Course Code whenever selections change
  useEffect(() => {
    if (borrower.program || selectedYear || selectedSem || selectedSection) {
      const prog = borrower.program || '';
      const yr = selectedYear || '';
      const sem = selectedSem || '';
      const sec = selectedSection || '';

      if (prog && yr && sem && sec) {
        const autoCode = `${prog} ${yr}${sem}${sec}`;
        setBorrowerField('courseCode', autoCode);
      }
    }
  }, [borrower.program, selectedYear, selectedSem, selectedSection, setBorrowerField]);

  // Parse existing Course Code on mount
  useEffect(() => {
    if (borrower.courseCode && !selectedYear && !selectedSem && !selectedSection) {
      const parts = borrower.courseCode.trim().split(' ');
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
  }, [borrower.courseCode, selectedYear, selectedSem, selectedSection, setBorrowerField]);

  const validate = () => {
    const errs = {};
    if (!borrower.program) errs.program = 'Select an Engineering Program';
    if (!borrower.courseCode?.trim()) errs.courseCode = 'Course Code required (e.g. BSCPE 3101)';
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
    <div className="flex-1 max-w-6xl xl:max-w-7xl 2xl:max-w-[1540px] mx-auto w-full p-3 sm:p-4 lg:p-5 flex flex-col justify-between h-full overflow-y-auto lg:overflow-hidden select-none">
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

      {/* 2. Form Grid with Neumorphic Raised Panels (Zero-Scroll 100% Viewport Fit) */}
      <form onSubmit={handleNext} className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-auto py-1">
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
              placeholder="Select Program, Year, Term & Section above"
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

          {/* Group No. & Group Leader */}
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

            {/* DUAL TIME RANGE PICKER CONTAINER */}
            <div className="w-full p-2 sm:p-2.5 rounded-2xl neu-inset border border-slate-800/80 flex items-center justify-between gap-1 sm:gap-2">
              {/* START TIME BLOCK */}
              <div className="flex items-center gap-1 min-w-0">
                {/* Start Hour Input */}
                <input
                  type="text"
                  maxLength={2}
                  value={startHour}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setStartHour(val);
                  }}
                  placeholder="--"
                  className="w-8 sm:w-10 h-8 sm:h-9 text-center font-mono font-extrabold text-xs sm:text-sm text-cyan-300 rounded-lg neu-btn-raised focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder-slate-600"
                />
                <span className="text-cyan-400 font-bold text-xs sm:text-sm">:</span>
                {/* Start Minute Input */}
                <input
                  type="text"
                  maxLength={2}
                  value={startMinute}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setStartMinute(val);
                  }}
                  placeholder="--"
                  className="w-8 sm:w-10 h-8 sm:h-9 text-center font-mono font-extrabold text-xs sm:text-sm text-cyan-300 rounded-lg neu-btn-raised focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder-slate-600"
                />

                {/* Start AM / PM Dropdown Select */}
                <select
                  value={startPeriod}
                  onChange={(e) => setStartPeriod(e.target.value)}
                  className="h-8 sm:h-9 px-2 rounded-lg neu-btn-raised bg-[#111a2c] text-cyan-300 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                >
                  <option value="AM" className="bg-[#111a2c] text-slate-100">AM</option>
                  <option value="PM" className="bg-[#111a2c] text-slate-100">PM</option>
                </select>
              </div>

              {/* MIDDLE "to" SEPARATOR */}
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-0.5 shrink-0">
                to
              </span>

              {/* END TIME BLOCK */}
              <div className="flex items-center gap-1 min-w-0">
                {/* End Hour Input */}
                <input
                  type="text"
                  maxLength={2}
                  value={endHour}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setEndHour(val);
                  }}
                  placeholder="--"
                  className="w-8 sm:w-10 h-8 sm:h-9 text-center font-mono font-extrabold text-xs sm:text-sm text-cyan-300 rounded-lg neu-btn-raised focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder-slate-600"
                />
                <span className="text-cyan-400 font-bold text-xs sm:text-sm">:</span>
                {/* End Minute Input */}
                <input
                  type="text"
                  maxLength={2}
                  value={endMinute}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setEndMinute(val);
                  }}
                  placeholder="--"
                  className="w-8 sm:w-10 h-8 sm:h-9 text-center font-mono font-extrabold text-xs sm:text-sm text-cyan-300 rounded-lg neu-btn-raised focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder-slate-600"
                />

                {/* End AM / PM Dropdown Select */}
                <select
                  value={endPeriod}
                  onChange={(e) => setEndPeriod(e.target.value)}
                  className="h-8 sm:h-9 px-2 rounded-lg neu-btn-raised bg-[#111a2c] text-cyan-300 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                >
                  <option value="AM" className="bg-[#111a2c] text-slate-100">AM</option>
                  <option value="PM" className="bg-[#111a2c] text-slate-100">PM</option>
                </select>
              </div>
            </div>

            {errors.labTime && (
              <p className="text-[11px] text-rose-400 mt-0.5 font-semibold">{errors.labTime}</p>
            )}
          </div>
        </div>
      </form>

      {/* 3. Bottom Action CTA Bar (Zero-Scroll 100% Fit) */}
      <div className="pt-2 sm:pt-3 border-t border-slate-800/80 flex items-center justify-between gap-4 shrink-0">
        <TouchButton
          variant="secondary"
          size="md"
          icon={ArrowLeft}
          onClick={goToWelcome}
          className="min-w-[120px] sm:min-w-[140px] text-xs sm:text-sm font-bold"
        >
          Cancel
        </TouchButton>

        <TouchButton
          variant="primary"
          size="lg"
          icon={ArrowRight}
          onClick={handleNext}
          className="min-w-[220px] sm:min-w-[280px] text-sm sm:text-base font-extrabold shadow-lg"
        >
          Next: Select Laboratory
        </TouchButton>
      </div>
    </div>
  );
}
