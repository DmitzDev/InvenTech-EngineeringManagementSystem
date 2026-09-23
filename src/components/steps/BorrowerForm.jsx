import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Users,
  Clock,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from '../ui/TouchButton';

const ENGINEERING_PROGRAMS = ['BSCPE', 'BSCE', 'BSCEE', 'BSECE'];
const YEAR_LEVELS = [
  { id: '1', label: '1st Year' },
  { id: '2', label: '2nd Year' },
  { id: '3', label: '3rd Year' },
  { id: '4', label: '4th Year' },
];
const SECTIONS = ['01', '02', '03', '04'];

export default function BorrowerForm() {
  const {
    borrower,
    setBorrowerField,
    checkStudentOverdueClearance,
    setStep,
    goToWelcome,
  } = useTransaction();

  const [errors, setErrors] = useState({});
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Support for custom / other non-engineering courses
  const [isOtherProgram, setIsOtherProgram] = useState(false);
  const [customProgram, setCustomProgram] = useState('');

  // Structured Time Range States (-- : -- AM/PM to -- : -- AM/PM)
  const [startHour, setStartHour] = useState('');
  const [startMinute, setStartMinute] = useState('');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endHour, setEndHour] = useState('');
  const [endMinute, setEndMinute] = useState('');
  const [endPeriod, setEndPeriod] = useState('AM');

  // Real-time clearance check
  const clearanceStatus = useMemo(() => {
    return checkStudentOverdueClearance(borrower.studentId, borrower.groupLeader);
  }, [borrower.studentId, borrower.groupLeader, checkStudentOverdueClearance]);

  // Handler for Academic Program dropdown
  const handleProgramChange = (val) => {
    if (val === 'OTHERS') {
      setIsOtherProgram(true);
      setBorrowerField('program', customProgram || 'OTHERS');
    } else {
      setIsOtherProgram(false);
      setBorrowerField('program', val);
    }
  };

  const handleCustomProgramChange = (val) => {
    const cleanVal = val.toUpperCase();
    setCustomProgram(cleanVal);
    setBorrowerField('program', cleanVal || 'OTHERS');
  };

  // Handler for Year Level dropdown
  const handleYearChange = (yearId) => {
    setSelectedYear(yearId);
    if ((yearId === '1' || yearId === '4') && selectedSem === '3') {
      setSelectedSem('');
    }
  };

  // Handler for Semester / Term dropdown
  const handleSemChange = (semId) => {
    setSelectedSem(semId);
  };

  // Handler for Section dropdown
  const handleSectionChange = (sec) => {
    setSelectedSection(sec);
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

  // Parse existing Course Code and Program on mount
  useEffect(() => {
    if (borrower.program && !ENGINEERING_PROGRAMS.includes(borrower.program)) {
      setIsOtherProgram(true);
      setCustomProgram(borrower.program === 'OTHERS' ? '' : borrower.program);
    }

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
          if (ENGINEERING_PROGRAMS.includes(prog)) {
            setBorrowerField('program', prog);
          } else if (prog) {
            setIsOtherProgram(true);
            setCustomProgram(prog);
            setBorrowerField('program', prog);
          }
          if (SECTIONS.includes(sec)) {
            setSelectedSection(sec);
          }
        }
      }
    }
  }, [borrower.courseCode, borrower.program, selectedYear, selectedSem, selectedSection, setBorrowerField]);

  const validate = () => {
    const errs = {};
    if (!borrower.program?.trim()) errs.program = 'Select or specify a Program';
    if (!borrower.courseCode?.trim()) errs.courseCode = 'Course Code required (e.g. 41-BSCPE-01)';
    if (!borrower.groupLeader?.trim()) errs.groupLeader = 'Student Name is required';
    if (!borrower.studentId?.trim()) errs.studentId = 'Student ID Number is required';
    if (!borrower.instructor?.trim()) errs.instructor = 'Instructor name required';
    if (!borrower.labTime?.trim() || !startHour || !endHour) {
      errs.labTime = 'Please complete the time schedule range';
    }

    // Overdue Clearance Lockout Validation Check
    if (clearanceStatus.isRestricted) {
      errs.clearance = clearanceStatus.reason;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (e) => {
    e?.preventDefault();
    if (validate()) {
      setStep(2);
    }
  };

  return (
    <div className="flex-1 max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto w-full p-2.5 sm:p-5 lg:p-6 pb-2.5 sm:pb-8 flex flex-col justify-between select-none min-h-0">
      {/* 1. Step Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 sm:pb-2.5 shrink-0">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] sm:text-sm font-mono text-cyan-400 font-extrabold tracking-wider uppercase">
              Step 01 of 04
            </span>
            <span className="text-[11px] sm:text-sm text-slate-400 font-medium truncate">• Institutional Clearance</span>
          </div>
          <h1 className="text-base sm:text-2xl lg:text-3xl font-extrabold text-slate-100 leading-tight">
            Borrower Identification Form
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 hidden md:block">
          Select program, academic level, student credentials, and laboratory schedule.
        </p>
      </div>

      {/* Overdue / Clearance Hold Lockout Alert Banner */}
      {clearanceStatus.isRestricted && (
        <div className="my-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-950/80 border-2 border-rose-500/80 text-rose-100 shadow-xl animate-fade-in shrink-0">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-rose-300">
                  ⛔ BORROWING RESTRICTED — Clearance Lockout Active
                </span>
                <span className="text-[10px] sm:text-xs font-mono bg-rose-900/90 px-2 py-0.5 rounded border border-rose-400/40 text-rose-200">
                  Hold Reference: {clearanceStatus.clearanceHold?.id || 'UNRETURNED_SESSION'}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-rose-100 mt-1">
                {clearanceStatus.reason}
              </p>

              {/* Unreturned Items Breakdown */}
              <div className="mt-2.5 pt-2 border-t border-rose-800/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {clearanceStatus.overdueItems.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="bg-rose-900/40 p-2 rounded-lg border border-rose-700/40 flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-rose-200">{item.name}</span>
                      <div className="text-[10px] text-rose-300 font-mono">Tag: {item.tagCode || 'N/A'}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-amber-300">Due: {item.dueDate || item.date}</span>
                      <div className="text-[10px] text-rose-300">Qty: {item.qty}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Form Grid with Neumorphic Raised Panels (Compact on Mobile, Spacious on 15" Kiosk) */}
      <form onSubmit={handleNext} className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-6 my-auto py-1 sm:py-2 min-h-0">
        {/* Left Column: Academic & Course Code Builder */}
        <div className="neu-card rounded-2xl sm:rounded-3xl p-3 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-3.5">
          <h2 className="text-xs sm:text-base font-bold text-slate-200 flex items-center gap-2 pb-1 sm:pb-2 border-b border-slate-800/80 uppercase tracking-wider">
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
            <span>Program & Course</span>
          </h2>

          {/* Academic Information: Clean 2x2 Uniform Dropdown Selectors */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 items-start">
            {/* 1. Academic Program */}
            <div>
              <label className="block text-[10.5px] sm:text-sm font-bold text-slate-300 mb-1">
                Program
              </label>
              <select
                value={isOtherProgram ? 'OTHERS' : borrower.program}
                onChange={(e) => handleProgramChange(e.target.value)}
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-2 sm:px-3.5 rounded-lg sm:rounded-xl neu-inset text-xs sm:text-sm bg-[#0e1422] border border-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer ${
                  !borrower.program ? 'text-slate-400/50' : 'text-slate-100 font-bold'
                } ${errors.program ? 'ring-2 ring-rose-500' : ''}`}
              >
                <option value="" className="bg-[#0e1422] text-slate-500/70">Select Program</option>
                {ENGINEERING_PROGRAMS.map((prog) => (
                  <option key={prog} value={prog} className="bg-[#0e1422] text-slate-100 font-bold">
                    {prog}
                  </option>
                ))}
                <option value="OTHERS" className="bg-[#0e1422] text-amber-300 font-bold">
                  Others
                </option>
              </select>

              {/* Custom Program Input directly under the Program dropdown */}
              {isOtherProgram && (
                <div className="mt-1.5 animate-fade-in">
                  <input
                    type="text"
                    value={customProgram}
                    onChange={(e) => handleCustomProgramChange(e.target.value)}
                    placeholder="Type course..."
                    className="w-full h-8 sm:h-11 px-2.5 sm:px-3.5 rounded-lg sm:rounded-xl neu-inset text-cyan-300 font-bold text-xs sm:text-sm placeholder:text-slate-600/70 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all uppercase bg-[#0e1422] border border-amber-500/40"
                    autoFocus
                  />
                </div>
              )}

              {errors.program && (
                <p className="text-[10px] sm:text-xs text-rose-400 mt-0.5 font-semibold">{errors.program}</p>
              )}
            </div>

            {/* 2. Year Level */}
            <div>
              <label className="block text-[10.5px] sm:text-sm font-bold text-slate-300 mb-1">
                Year Level
              </label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-2 sm:px-3.5 rounded-lg sm:rounded-xl neu-inset text-xs sm:text-sm bg-[#0e1422] border border-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer ${
                  !selectedYear ? 'text-slate-400/50' : 'text-slate-100 font-bold'
                }`}
              >
                <option value="" className="bg-[#0e1422] text-slate-500/70">Select Year</option>
                {YEAR_LEVELS.map((y) => (
                  <option key={y.id} value={y.id} className="bg-[#0e1422] text-slate-100 font-bold">
                    {y.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Term / Semester */}
            <div>
              <label className="block text-[10.5px] sm:text-sm font-bold text-slate-300 mb-1">
                Semester
              </label>
              <select
                value={selectedSem}
                onChange={(e) => handleSemChange(e.target.value)}
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-2 sm:px-3.5 rounded-lg sm:rounded-xl neu-inset text-xs sm:text-sm bg-[#0e1422] border border-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer ${
                  !selectedSem ? 'text-slate-400/50' : 'text-slate-100 font-bold'
                }`}
              >
                <option value="" className="bg-[#0e1422] text-slate-500/70">Select Semester</option>
                <option value="1" className="bg-[#0e1422] text-slate-100 font-bold">1st Semester</option>
                <option value="2" className="bg-[#0e1422] text-slate-100 font-bold">2nd Semester</option>
                {(selectedYear === '2' || selectedYear === '3') && (
                  <option value="3" className="bg-[#0e1422] text-amber-300 font-bold">Summer Term</option>
                )}
              </select>
            </div>

            {/* 4. Class Section */}
            <div>
              <label className="block text-[10.5px] sm:text-sm font-bold text-slate-300 mb-1">
                Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => handleSectionChange(e.target.value)}
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-2 sm:px-3.5 rounded-lg sm:rounded-xl neu-inset text-xs sm:text-sm font-mono bg-[#0e1422] border border-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer ${
                  !selectedSection ? 'text-slate-400/50 font-sans' : 'text-slate-100 font-bold'
                }`}
              >
                <option value="" className="bg-[#0e1422] text-slate-500/70 font-sans">Select Section</option>
                {SECTIONS.map((sec) => (
                  <option key={sec} value={sec} className="bg-[#0e1422] text-slate-100 font-mono font-bold">
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Course Code Input */}
          <div>
            <label className="block text-[10.5px] sm:text-sm font-bold text-slate-300 mb-1">
              Course Code
            </label>
            <input
              type="text"
              value={borrower.courseCode}
              onChange={(e) => setBorrowerField('courseCode', e.target.value.toUpperCase())}
              placeholder="e.g. 41-BSCPE-01"
              className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-3 sm:px-4 rounded-lg sm:rounded-xl neu-inset text-cyan-300 font-mono text-xs sm:text-base font-extrabold placeholder:text-slate-600/70 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all ${
                errors.courseCode ? 'ring-2 ring-rose-500' : ''
              }`}
            />
            {errors.courseCode && (
              <p className="text-[10px] sm:text-xs text-rose-400 mt-0.5 font-semibold">{errors.courseCode}</p>
            )}
          </div>
        </div>

        {/* Right Column: Student Details & Schedule */}
        <div className="neu-card rounded-2xl sm:rounded-3xl p-3 sm:p-5 lg:p-6 space-y-2.5 sm:space-y-3.5">
          <h2 className="text-xs sm:text-base font-bold text-slate-200 flex items-center gap-2 pb-1 sm:pb-2 border-b border-slate-800/80 uppercase tracking-wider">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
            <span>Student & Schedule</span>
          </h2>

          {/* Student Name & Student ID Number (Grid on 15" screen) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label className="block text-[10.5px] sm:text-sm font-bold text-slate-300 mb-1">
                Student Name
              </label>
              <input
                type="text"
                value={borrower.groupLeader}
                onChange={(e) => setBorrowerField('groupLeader', e.target.value.toUpperCase())}
                placeholder="e.g. JASON CAYABYAB"
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-3 sm:px-4 rounded-lg sm:rounded-xl neu-inset text-slate-100 text-xs sm:text-sm font-bold uppercase placeholder:text-slate-600/70 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all ${
                  errors.groupLeader ? 'ring-2 ring-rose-500' : ''
                }`}
              />
              {errors.groupLeader && (
                <p className="text-[10px] sm:text-xs text-rose-400 mt-0.5 font-semibold">{errors.groupLeader}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10.5px] sm:text-sm font-bold text-slate-300">
                  Student ID Number
                </label>
                {borrower.studentId && !clearanceStatus.isRestricted && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Cleared
                  </span>
                )}
              </div>
              <input
                type="text"
                value={borrower.studentId || ''}
                onChange={(e) => setBorrowerField('studentId', e.target.value.toUpperCase())}
                placeholder="e.g. 21-0482-119"
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-3 sm:px-4 rounded-lg sm:rounded-xl neu-inset font-mono text-xs sm:text-sm font-extrabold transition-all uppercase placeholder:text-slate-600/70 ${
                  clearanceStatus.isRestricted
                    ? 'text-rose-400 border border-rose-500 bg-rose-950/40 ring-2 ring-rose-500'
                    : 'text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500'
                } ${errors.studentId ? 'ring-2 ring-rose-500' : ''}`}
              />
              {errors.studentId && (
                <p className="text-[10px] sm:text-xs text-rose-400 mt-0.5 font-semibold">{errors.studentId}</p>
              )}
            </div>
          </div>

          {/* Group No. & Instructor */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className="block text-[10.5px] sm:text-sm font-bold text-slate-300 mb-1">
                Group No.
              </label>
              <div className="flex items-center neu-inset rounded-lg sm:rounded-xl h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-1 sm:px-2">
                <button
                  type="button"
                  onClick={() =>
                    setBorrowerField('groupNo', String(Math.max(1, parseInt(borrower.groupNo || 1) - 1)))
                  }
                  className="w-7 h-7 sm:w-10 sm:h-10 min-w-[28px] sm:min-w-[38px] min-h-[28px] sm:min-h-[38px] rounded neu-btn-raised text-slate-200 font-bold flex items-center justify-center text-sm sm:text-lg active:scale-95 cursor-pointer shrink-0"
                >
                  -
                </button>
                <span className="flex-1 text-center font-mono font-extrabold text-cyan-400 text-sm sm:text-lg">
                  {borrower.groupNo || '1'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setBorrowerField('groupNo', String(Math.min(12, parseInt(borrower.groupNo || 1) + 1)))
                  }
                  className="w-7 h-7 sm:w-10 sm:h-10 min-w-[28px] sm:min-w-[38px] min-h-[28px] sm:min-h-[38px] rounded neu-btn-raised text-slate-200 font-bold flex items-center justify-center text-sm sm:text-lg active:scale-95 cursor-pointer shrink-0"
                >
                  +
                </button>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-[10.5px] sm:text-sm font-bold text-slate-300 mb-1">
                Instructor
              </label>
              <input
                type="text"
                value={borrower.instructor}
                onChange={(e) => setBorrowerField('instructor', e.target.value)}
                placeholder="e.g. Engr. Jin Benir Macaranas"
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-3 sm:px-4 rounded-lg sm:rounded-xl neu-inset text-slate-100 text-xs sm:text-base font-bold placeholder:text-slate-600/70 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all ${
                  errors.instructor ? 'ring-2 ring-rose-500' : ''
                }`}
              />
              {errors.instructor && (
                <p className="text-[10px] sm:text-xs text-rose-400 mt-0.5 font-semibold">{errors.instructor}</p>
              )}
            </div>
          </div>

          {/* Time Schedule */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10.5px] sm:text-sm font-bold text-slate-300">
                Time Schedule
              </label>
              {borrower.labTime && (
                <span className="text-[10px] sm:text-xs font-mono text-cyan-400 font-extrabold bg-cyan-950/70 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-cyan-500/40 truncate max-w-[190px] sm:max-w-[240px]">
                  {borrower.labTime}
                </span>
              )}
            </div>

            <div className="w-full py-1.5 sm:py-2.5 px-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl neu-inset border border-slate-800/80">
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                {/* Start Time */}
                <div className="flex-1">
                  <span className="block text-[9px] sm:text-xs uppercase font-bold text-slate-400 mb-0.5">
                    Start
                  </span>
                  <input
                    type="time"
                    value={(() => {
                      if (!startHour) return '';
                      let h = parseInt(startHour, 10);
                      if (startPeriod === 'PM' && h !== 12) h += 12;
                      if (startPeriod === 'AM' && h === 12) h = 0;
                      return `${String(h).padStart(2, '0')}:${startMinute || '00'}`;
                    })()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const [hStr, mStr] = val.split(':');
                        let h = parseInt(hStr, 10);
                        const period = h >= 12 ? 'PM' : 'AM';
                        if (h === 0) h = 12;
                        else if (h > 12) h -= 12;
                        setStartHour(String(h).padStart(2, '0'));
                        setStartMinute(mStr);
                        setStartPeriod(period);
                      }
                    }}
                    className="w-full h-8 sm:h-11 px-2 sm:px-3 rounded-lg sm:rounded-xl neu-inset text-cyan-300 font-mono text-xs sm:text-base font-extrabold focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all bg-[#0e1422] border border-slate-800/80 cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                {/* "to" separator */}
                <div className="flex flex-col items-center justify-center pt-3 sm:pt-4">
                  <span className="text-[10px] sm:text-sm font-black text-slate-400 uppercase tracking-widest px-1 shrink-0 select-none">
                    to
                  </span>
                </div>

                {/* End Time */}
                <div className="flex-1">
                  <span className="block text-[9px] sm:text-xs uppercase font-bold text-slate-400 mb-0.5">
                    End
                  </span>
                  <input
                    type="time"
                    value={(() => {
                      if (!endHour) return '';
                      let h = parseInt(endHour, 10);
                      if (endPeriod === 'PM' && h !== 12) h += 12;
                      if (endPeriod === 'AM' && h === 12) h = 0;
                      return `${String(h).padStart(2, '0')}:${endMinute || '00'}`;
                    })()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const [hStr, mStr] = val.split(':');
                        let h = parseInt(hStr, 10);
                        const period = h >= 12 ? 'PM' : 'AM';
                        if (h === 0) h = 12;
                        else if (h > 12) h -= 12;
                        setEndHour(String(h).padStart(2, '0'));
                        setEndMinute(mStr);
                        setEndPeriod(period);
                      }
                    }}
                    className="w-full h-8 sm:h-11 px-2 sm:px-3 rounded-lg sm:rounded-xl neu-inset text-cyan-300 font-mono text-xs sm:text-base font-extrabold focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all bg-[#0e1422] border border-slate-800/80 cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
            </div>

            {errors.labTime && (
              <p className="text-[10px] sm:text-xs text-rose-400 mt-0.5 font-semibold">{errors.labTime}</p>
            )}
          </div>
        </div>
      </form>

      {/* 3. Bottom Action CTA Bar (Side by side on mobile for zero scrolling) */}
      <div className="pt-2 sm:pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
        <TouchButton
          variant="secondary"
          size="sm"
          icon={ArrowLeft}
          onClick={goToWelcome}
          className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold shrink-0"
        >
          Cancel
        </TouchButton>

        <TouchButton
          variant={clearanceStatus.isRestricted ? 'danger' : 'primary'}
          size="md"
          icon={clearanceStatus.isRestricted ? AlertTriangle : ArrowRight}
          onClick={handleNext}
          disabled={clearanceStatus.isRestricted}
          className={`flex-1 sm:flex-initial sm:min-w-[320px] py-2 sm:py-3 text-xs sm:text-base font-extrabold shadow-lg truncate ${
            clearanceStatus.isRestricted ? 'opacity-60 cursor-not-allowed bg-rose-700' : ''
          }`}
        >
          {clearanceStatus.isRestricted ? '⛔ Borrowing Restricted (Clearance Hold)' : 'Next: Select Laboratory'}
        </TouchButton>
      </div>
    </div>
  );
}
