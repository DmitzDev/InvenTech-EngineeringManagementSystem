import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Users,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from '../ui/TouchButton';
import { handleStudentIdChange } from '../../utils/studentIdFormatter';

const ENGINEERING_PROGRAMS = ['BSCPE', 'BSCE', 'BSCEE', 'BSECE'];
const YEAR_LEVELS = [
  { id: '1', label: '1st Year' },
  { id: '2', label: '2nd Year' },
  { id: '3', label: '3rd Year' },
  { id: '4', label: '4th Year' },
];
const SECTIONS = ['01', '02', '03', '04'];

const parseCourseCode = (courseCode) => {
  if (!courseCode || typeof courseCode !== 'string') {
    return { year: '', sem: '', section: '', isOther: false, customProg: '' };
  }
  const parts = courseCode.trim().split('-');
  if (parts.length === 3) {
    const [yrSem, prog, sec] = parts;
    const yr = yrSem && yrSem.length >= 2 ? yrSem[0] : '';
    const sem = yrSem && yrSem.length >= 2 ? yrSem[1] : '';
    const isOther = Boolean(prog && !ENGINEERING_PROGRAMS.includes(prog));
    return {
      year: ['1', '2', '3', '4'].includes(yr) ? yr : '',
      sem: ['1', '2', '3'].includes(sem) ? sem : '',
      section: SECTIONS.includes(sec) ? sec : '',
      isOther,
      customProg: isOther ? prog : '',
    };
  }
  return { year: '', sem: '', section: '', isOther: false, customProg: '' };
};

const parseLabTime = (labTime) => {
  if (!labTime || typeof labTime !== 'string') {
    return { sH: '', sM: '', sP: 'AM', eH: '', eM: '', eP: 'AM' };
  }
  const parts = labTime.split(' - ');
  if (parts.length === 2) {
    const [start, end] = parts;
    const [sTime, sP] = (start || '').split(' ');
    const [sH, sM] = (sTime || '').split(':');
    const [eTime, eP] = (end || '').split(' ');
    const [eH, eM] = (eTime || '').split(':');
    return {
      sH: sH && sH !== '--' ? sH : '',
      sM: sM || '',
      sP: sP === 'PM' ? 'PM' : 'AM',
      eH: eH && eH !== '--' ? eH : '',
      eM: eM || '',
      eP: eP === 'PM' ? 'PM' : 'AM',
    };
  }
  return { sH: '', sM: '', sP: 'AM', eH: '', eM: '', eP: 'AM' };
};

export default function BorrowerForm() {
  const {
    borrower,
    setBorrowerField,
    checkStudentOverdueClearance,
    setStep,
    goToWelcome,
    theme,
  } = useTransaction();

  const isDark = theme === 'dark';

  const initialCourse = useMemo(() => parseCourseCode(borrower.courseCode), [borrower.courseCode]);
  const initialTime = useMemo(() => parseLabTime(borrower.labTime), [borrower.labTime]);

  const [errors, setErrors] = useState({});
  const [selectedYear, setSelectedYear] = useState(initialCourse.year);
  const [selectedSem, setSelectedSem] = useState(initialCourse.sem);
  const [selectedSection, setSelectedSection] = useState(initialCourse.section);

  // Support for custom / other non-engineering courses
  const [isOtherProgram, setIsOtherProgram] = useState(
    Boolean(borrower.program && !ENGINEERING_PROGRAMS.includes(borrower.program)) || initialCourse.isOther
  );
  const [customProgram, setCustomProgram] = useState(
    borrower.program && !ENGINEERING_PROGRAMS.includes(borrower.program)
      ? (borrower.program === 'OTHERS' ? '' : borrower.program)
      : initialCourse.customProg
  );

  // Structured Time Range States (-- : -- AM/PM to -- : -- AM/PM)
  const [startHour, setStartHour] = useState(initialTime.sH);
  const [startMinute, setStartMinute] = useState(initialTime.sM);
  const [startPeriod, setStartPeriod] = useState(initialTime.sP);
  const [endHour, setEndHour] = useState(initialTime.eH);
  const [endMinute, setEndMinute] = useState(initialTime.eM);
  const [endPeriod, setEndPeriod] = useState(initialTime.eP);

  // Real-time clearance check
  const clearanceStatus = useMemo(() => {
    return checkStudentOverdueClearance(borrower.studentId, borrower.groupLeader);
  }, [borrower.studentId, borrower.groupLeader, checkStudentOverdueClearance]);

  const updateCourseCode = (yr, sem, prog, sec) => {
    if (yr && sem && prog && sec) {
      setBorrowerField('courseCode', `${yr}${sem}-${prog}-${sec}`);
    }
  };

  const syncLabTime = (sH, sM, sP, eH, eM, eP) => {
    if (sH || sM || eH || eM) {
      const startH = sH ? sH.padStart(2, '0') : '--';
      const startM = sM ? sM.padStart(2, '0') : '00';
      const endH = eH ? eH.padStart(2, '0') : '--';
      const endM = eM ? eM.padStart(2, '0') : '00';
      const combinedTime = `${startH}:${startM} ${sP} - ${endH}:${endM} ${eP}`;
      setBorrowerField('labTime', combinedTime);
    }
  };

  // Handler for Academic Program dropdown
  const handleProgramChange = (val) => {
    if (val === 'OTHERS') {
      setIsOtherProgram(true);
      const prog = customProgram || 'OTHERS';
      setBorrowerField('program', prog);
      updateCourseCode(selectedYear, selectedSem, prog, selectedSection);
    } else {
      setIsOtherProgram(false);
      setBorrowerField('program', val);
      updateCourseCode(selectedYear, selectedSem, val, selectedSection);
    }
  };

  const handleCustomProgramChange = (val) => {
    const cleanVal = val.toUpperCase();
    setCustomProgram(cleanVal);
    const prog = cleanVal || 'OTHERS';
    setBorrowerField('program', prog);
    updateCourseCode(selectedYear, selectedSem, prog, selectedSection);
  };

  // Handler for Year Level dropdown
  const handleYearChange = (yearId) => {
    setSelectedYear(yearId);
    let newSem = selectedSem;
    if ((yearId === '1' || yearId === '4') && selectedSem === '3') {
      setSelectedSem('');
      newSem = '';
    }
    const currentProg = isOtherProgram ? (customProgram || 'OTHERS') : borrower.program;
    updateCourseCode(yearId, newSem, currentProg, selectedSection);
  };

  // Handler for Semester / Term dropdown
  const handleSemChange = (semId) => {
    setSelectedSem(semId);
    const currentProg = isOtherProgram ? (customProgram || 'OTHERS') : borrower.program;
    updateCourseCode(selectedYear, semId, currentProg, selectedSection);
  };

  // Handler for Section dropdown
  const handleSectionChange = (sec) => {
    setSelectedSection(sec);
    const currentProg = isOtherProgram ? (customProgram || 'OTHERS') : borrower.program;
    updateCourseCode(selectedYear, selectedSem, currentProg, sec);
  };

  const validate = () => {
    const errs = {};
    if (!borrower.program?.trim()) errs.program = 'Select or specify a Program';
    if (!borrower.courseCode?.trim()) errs.courseCode = 'Course Code required (e.g. 41-BSCPE-01)';
    if (!borrower.groupLeader?.trim()) errs.groupLeader = 'Student Name is required';
    const cleanId = (borrower.studentId || '').replace(/\D/g, '');
    if (!cleanId) {
      errs.studentId = 'Student ID Number is required';
    } else if (cleanId.length !== 9) {
      errs.studentId = 'Student ID must be exactly 9 digits (e.g. 23-1374-693)';
    }
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
    <div className="flex-1 max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto w-full max-w-full overflow-x-hidden p-2.5 sm:p-5 lg:p-6 pb-2.5 sm:pb-8 flex flex-col md:justify-between select-none min-h-0">
      {/* 1. Step Header */}
      <div className={`flex items-center justify-between border-b pb-1.5 sm:pb-2.5 shrink-0 ${
        isDark ? 'border-slate-800/80' : 'border-slate-300'
      }`}>
        <div>
          <h1 className={`text-base sm:text-2xl lg:text-3xl font-black leading-tight ${
            isDark ? 'text-slate-100' : 'text-slate-950 font-black'
          }`}>
            Borrower Identification Form
          </h1>
        </div>
        <p className={`text-xs sm:text-sm hidden md:block ${
          isDark ? 'text-slate-400' : 'text-slate-700 font-bold'
        }`}>
          Select program, academic level, student credentials, and laboratory schedule.
        </p>
      </div>

      {/* Overdue / Clearance Hold Lockout Alert Banner */}
      {clearanceStatus.isRestricted && (
        <div className={`my-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 shadow-xl animate-fade-in shrink-0 ${
          isDark
            ? 'bg-rose-950/80 border-rose-500/80 text-rose-100'
            : 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm'
        }`}>
          <div className="flex items-start gap-3">
            <ShieldAlert className={`w-6 h-6 sm:w-7 sm:h-7 shrink-0 mt-0.5 animate-pulse ${
              isDark ? 'text-rose-400' : 'text-rose-600'
            }`} />
            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className={`text-xs sm:text-sm font-extrabold uppercase tracking-wider ${
                  isDark ? 'text-rose-300' : 'text-rose-900'
                }`}>
                  ⛔ BORROWING RESTRICTED — Clearance Lockout Active
                </span>
                <span className={`text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded border ${
                  isDark
                    ? 'bg-rose-900/90 border-rose-400/40 text-rose-200'
                    : 'bg-rose-100 border-rose-200 text-rose-800 font-semibold'
                }`}>
                  Hold Reference: {clearanceStatus.clearanceHold?.id || 'UNRETURNED_SESSION'}
                </span>
              </div>
              <p className={`text-xs sm:text-sm font-bold mt-1 ${
                isDark ? 'text-rose-100' : 'text-rose-800'
              }`}>
                {clearanceStatus.reason}
              </p>

              {/* Unreturned Items Breakdown */}
              <div className={`mt-2.5 pt-2 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs ${
                isDark ? 'border-rose-800/60' : 'border-rose-200'
              }`}>
                {clearanceStatus.overdueItems.slice(0, 4).map((item, idx) => (
                  <div key={idx} className={`p-2 rounded-lg border flex items-center justify-between ${
                    isDark ? 'bg-rose-900/40 border-rose-700/40' : 'bg-white border-rose-200 shadow-xs'
                  }`}>
                    <div>
                      <span className={`font-extrabold ${isDark ? 'text-rose-200' : 'text-rose-900'}`}>{item.name}</span>
                      <div className={`text-[10px] font-mono ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>Tag: {item.tagCode || 'N/A'}</div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>Due: {item.dueDate || item.date}</span>
                      <div className={`text-[10px] ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>Qty: {item.qty}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Form Grid with Raised Surface Panels (Pure white with border-slate-200 in Light Mode) */}
      <form onSubmit={handleNext} className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 my-2 sm:my-3 md:my-auto py-1 min-h-0">
        {/* Left Column: Academic & Course Code Builder */}
        <div className={`rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 space-y-3 sm:space-y-3.5 ${
          isDark ? 'neu-card' : 'bg-white border border-slate-200 shadow-sm'
        }`}>
          <h2 className={`text-xs sm:text-base font-black flex items-center gap-2 pb-1 sm:pb-2 border-b uppercase tracking-wider ${
            isDark ? 'text-slate-200 border-slate-800/80' : 'text-slate-900 border-slate-200 font-black'
          }`}>
            <GraduationCap className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-slate-900'}`} />
            <span>Program & Course</span>
          </h2>

          {/* Academic Information: Clean 2x2 Uniform Dropdown Selectors */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 items-start">
            {/* 1. Academic Program */}
            <div>
              <label className={`block text-[10.5px] sm:text-sm font-medium mb-1 ${
                isDark ? 'text-slate-300 font-bold' : 'text-slate-700'
              }`}>
                Program
              </label>
              <select
                value={isOtherProgram ? 'OTHERS' : borrower.program}
                onChange={(e) => handleProgramChange(e.target.value)}
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-2 sm:px-3.5 rounded-lg sm:rounded-xl text-xs sm:text-sm cursor-pointer transition-all ${
                  isDark
                    ? 'neu-inset bg-[#0e1422] border border-slate-800 focus:ring-1 focus:ring-cyan-500'
                    : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
                } ${!borrower.program ? (isDark ? 'text-slate-400/50' : 'text-slate-400') : (isDark ? 'text-slate-100 font-bold' : 'text-slate-900 font-bold')} ${
                  errors.program ? 'ring-2 ring-rose-500' : ''
                }`}
              >
                <option value="" className={isDark ? 'bg-[#0e1422] text-slate-500' : 'bg-white text-slate-400'}>Select Program</option>
                {ENGINEERING_PROGRAMS.map((prog) => (
                  <option key={prog} value={prog} className={isDark ? 'bg-[#0e1422] text-slate-100 font-bold' : 'bg-white text-slate-900 font-semibold'}>
                    {prog}
                  </option>
                ))}
                <option value="OTHERS" className={isDark ? 'bg-[#0e1422] text-amber-300 font-bold' : 'bg-white text-amber-800 font-bold'}>
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
                    autoComplete="off"
                    spellCheck={false}
                    className={`w-full h-8 sm:h-11 px-2.5 sm:px-3.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all uppercase ${
                      isDark
                        ? 'neu-inset text-cyan-300 bg-[#0e1422] border border-amber-500/40 placeholder:text-slate-600/70 focus:ring-1 focus:ring-cyan-500'
                        : 'bg-white border border-amber-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
                    }`}
                    autoFocus
                  />
                </div>
              )}

              {errors.program && (
                <p className="text-[10px] sm:text-xs text-rose-500 mt-0.5 font-semibold">{errors.program}</p>
              )}
            </div>

            {/* 2. Year Level */}
            <div>
              <label className={`block text-[10.5px] sm:text-sm font-medium mb-1 ${
                isDark ? 'text-slate-300 font-bold' : 'text-slate-700'
              }`}>
                Year Level
              </label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-2 sm:px-3.5 rounded-lg sm:rounded-xl text-xs sm:text-sm cursor-pointer transition-all ${
                  isDark
                    ? 'neu-inset bg-[#0e1422] border border-slate-800 focus:ring-1 focus:ring-cyan-500'
                    : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
                } ${!selectedYear ? (isDark ? 'text-slate-400/50' : 'text-slate-400') : (isDark ? 'text-slate-100 font-bold' : 'text-slate-900 font-bold')}`}
              >
                <option value="" className={isDark ? 'bg-[#0e1422] text-slate-500' : 'bg-white text-slate-400'}>Select Year</option>
                {YEAR_LEVELS.map((y) => (
                  <option key={y.id} value={y.id} className={isDark ? 'bg-[#0e1422] text-slate-100 font-bold' : 'bg-white text-slate-900 font-semibold'}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Term / Semester */}
            <div>
              <label className={`block text-[10.5px] sm:text-sm font-medium mb-1 ${
                isDark ? 'text-slate-300 font-bold' : 'text-slate-700'
              }`}>
                Semester
              </label>
              <select
                value={selectedSem}
                onChange={(e) => handleSemChange(e.target.value)}
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-2 sm:px-3.5 rounded-lg sm:rounded-xl text-xs sm:text-sm cursor-pointer transition-all ${
                  isDark
                    ? 'neu-inset bg-[#0e1422] border border-slate-800 focus:ring-1 focus:ring-cyan-500'
                    : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
                } ${!selectedSem ? (isDark ? 'text-slate-400/50' : 'text-slate-400') : (isDark ? 'text-slate-100 font-bold' : 'text-slate-900 font-bold')}`}
              >
                <option value="" className={isDark ? 'bg-[#0e1422] text-slate-500' : 'bg-white text-slate-400'}>Select Semester</option>
                <option value="1" className={isDark ? 'bg-[#0e1422] text-slate-100 font-bold' : 'bg-white text-slate-900 font-semibold'}>1st Semester</option>
                <option value="2" className={isDark ? 'bg-[#0e1422] text-slate-100 font-bold' : 'bg-white text-slate-900 font-semibold'}>2nd Semester</option>
                {(selectedYear === '2' || selectedYear === '3') && (
                  <option value="3" className={isDark ? 'bg-[#0e1422] text-amber-300 font-bold' : 'bg-white text-amber-800 font-bold'}>Summer Term</option>
                )}
              </select>
            </div>

            {/* 4. Class Section */}
            <div>
              <label className={`block text-[10.5px] sm:text-sm font-medium mb-1 ${
                isDark ? 'text-slate-300 font-bold' : 'text-slate-700'
              }`}>
                Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => handleSectionChange(e.target.value)}
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-2 sm:px-3.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-mono cursor-pointer transition-all ${
                  isDark
                    ? 'neu-inset bg-[#0e1422] border border-slate-800 focus:ring-1 focus:ring-cyan-500'
                    : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
                } ${!selectedSection ? (isDark ? 'text-slate-400/50 font-sans' : 'text-slate-400 font-sans') : (isDark ? 'text-slate-100 font-bold' : 'text-slate-900 font-bold')}`}
              >
                <option value="" className={isDark ? 'bg-[#0e1422] text-slate-500 font-sans' : 'bg-white text-slate-400 font-sans'}>Select Section</option>
                {SECTIONS.map((sec) => (
                  <option key={sec} value={sec} className={isDark ? 'bg-[#0e1422] text-slate-100 font-mono font-bold' : 'bg-white text-slate-900 font-mono font-bold'}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Course Code (Auto-Generated based on Program, Year, Term & Section) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`block text-[10.5px] sm:text-sm font-medium ${
                isDark ? 'text-slate-300 font-bold' : 'text-slate-700'
              }`}>
                Course Code
              </label>
              <span className={`text-[9.5px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                isDark
                  ? 'bg-cyan-950/50 text-cyan-400 border-cyan-500/30'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}>
                AUTO-GENERATED
              </span>
            </div>
            <div
              tabIndex={-1}
              data-no-osk="true"
              className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-3 sm:px-4 rounded-lg sm:rounded-xl font-mono text-xs sm:text-base font-extrabold flex items-center select-none cursor-default ${
                isDark
                  ? 'neu-inset text-cyan-300 bg-[#0a101d] border border-slate-800/90'
                  : 'bg-slate-100 border border-slate-300 text-slate-800 shadow-xs'
              } ${errors.courseCode ? 'ring-2 ring-rose-500' : ''}`}
            >
              {borrower.courseCode ? (
                <span>{borrower.courseCode}</span>
              ) : (
                <span className={`font-normal text-xs sm:text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Auto-generates upon selecting Program, Year & Section
                </span>
              )}
            </div>
            {errors.courseCode && (
              <p className="text-[10px] sm:text-xs text-rose-500 mt-0.5 font-semibold">{errors.courseCode}</p>
            )}
          </div>
        </div>

        {/* Right Column: Student Details & Schedule */}
        <div className={`rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 space-y-3 sm:space-y-3.5 ${
          isDark ? 'neu-card' : 'bg-white border border-slate-200 shadow-sm'
        }`}>
          <h2 className={`text-xs sm:text-base font-black flex items-center gap-2 pb-1 sm:pb-2 border-b uppercase tracking-wider ${
            isDark ? 'text-slate-200 border-slate-800/80' : 'text-slate-900 border-slate-200 font-black'
          }`}>
            <Users className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-slate-900'}`} />
            <span>Student & Schedule</span>
          </h2>

          {/* Student Name & Student ID Number (Grid on 15" screen) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label className={`block text-[10.5px] sm:text-sm font-medium mb-1 ${
                isDark ? 'text-slate-300 font-bold' : 'text-slate-700'
              }`}>
                Student Name
              </label>
              <input
                type="text"
                value={borrower.groupLeader}
                onChange={(e) => setBorrowerField('groupLeader', e.target.value.toUpperCase())}
                placeholder="e.g. JASON CAYABYAB"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="next"
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-3 sm:px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold uppercase transition-all ${
                  isDark
                    ? 'neu-inset text-slate-100 placeholder:text-slate-600/70 focus:outline-none focus:ring-1 focus:ring-cyan-500'
                    : 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
                } ${errors.groupLeader ? 'ring-2 ring-rose-500' : ''}`}
              />
              {errors.groupLeader && (
                <p className="text-[10px] sm:text-xs text-rose-500 mt-0.5 font-semibold">{errors.groupLeader}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`text-[10.5px] sm:text-sm font-medium ${
                  isDark ? 'text-slate-300 font-bold' : 'text-slate-700'
                }`}>
                  Student ID Number
                </label>
                {borrower.studentId && !clearanceStatus.isRestricted && (
                  <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>
                    <CheckCircle2 className="w-3 h-3" /> Cleared
                  </span>
                )}
              </div>
              <input
                type="text"
                value={borrower.studentId || ''}
                onChange={(e) => {
                  const formatted = handleStudentIdChange(e.target.value, borrower.studentId);
                  setBorrowerField('studentId', formatted);
                }}
                placeholder="e.g. 23-1374-693"
                autoComplete="off"
                spellCheck={false}
                maxLength={11}
                inputMode="numeric"
                pattern="[0-9]*"
                enterKeyHint="next"
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-3 sm:px-4 rounded-lg sm:rounded-xl font-mono text-xs sm:text-sm font-extrabold transition-all uppercase ${
                  clearanceStatus.isRestricted
                    ? isDark
                      ? 'text-rose-400 border border-rose-500 bg-rose-950/40 ring-2 ring-rose-500'
                      : 'text-rose-900 border-2 border-rose-400 bg-rose-50 ring-2 ring-rose-200'
                    : isDark
                      ? 'neu-inset text-cyan-300 placeholder:text-slate-600/70 focus:outline-none focus:ring-1 focus:ring-cyan-500'
                      : 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
                } ${errors.studentId ? 'ring-2 ring-rose-500' : ''}`}
              />
              {errors.studentId && (
                <p className="text-[10px] sm:text-xs text-rose-500 mt-0.5 font-semibold">{errors.studentId}</p>
              )}
            </div>
          </div>

          {/* Group No. & Instructor */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className={`block text-[10.5px] sm:text-sm font-medium mb-1 ${
                isDark ? 'text-slate-300 font-bold' : 'text-slate-700'
              }`}>
                Group No.
              </label>
              <div className={`flex items-center rounded-lg sm:rounded-xl h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-1 sm:px-2 ${
                isDark ? 'neu-inset' : 'bg-slate-50 border border-slate-300 shadow-xs'
              }`}>
                <button
                  type="button"
                  onClick={() =>
                    setBorrowerField('groupNo', String(Math.max(1, parseInt(borrower.groupNo || 1) - 1)))
                  }
                  className={`w-7 h-7 sm:w-10 sm:h-10 min-w-[28px] sm:min-w-[38px] min-h-[28px] sm:min-h-[38px] rounded font-bold flex items-center justify-center text-sm sm:text-lg active:scale-95 cursor-pointer shrink-0 ${
                    isDark ? 'neu-btn-raised text-slate-200' : 'bg-white text-slate-800 border border-slate-200 shadow-xs hover:bg-slate-100'
                  }`}
                >
                  -
                </button>
                <span className={`flex-1 text-center font-mono font-extrabold text-sm sm:text-lg ${
                  isDark ? 'text-cyan-400' : 'text-slate-900 font-black'
                }`}>
                  {borrower.groupNo || '1'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setBorrowerField('groupNo', String(Math.min(12, parseInt(borrower.groupNo || 1) + 1)))
                  }
                  className={`w-7 h-7 sm:w-10 sm:h-10 min-w-[28px] sm:min-w-[38px] min-h-[28px] sm:min-h-[38px] rounded font-bold flex items-center justify-center text-sm sm:text-lg active:scale-95 cursor-pointer shrink-0 ${
                    isDark ? 'neu-btn-raised text-slate-200' : 'bg-white text-slate-800 border border-slate-200 shadow-xs hover:bg-slate-100'
                  }`}
                >
                  +
                </button>
              </div>
            </div>

            <div className="col-span-2">
              <label className={`block text-[10.5px] sm:text-sm font-medium mb-1 ${
                isDark ? 'text-slate-300 font-bold' : 'text-slate-700'
              }`}>
                Instructor
              </label>
              <input
                type="text"
                value={borrower.instructor}
                onChange={(e) => setBorrowerField('instructor', e.target.value)}
                placeholder="e.g. Engr. Jin Benir Macaranas"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="done"
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-3 sm:px-4 rounded-lg sm:rounded-xl text-xs sm:text-base font-bold transition-all ${
                  isDark
                    ? 'neu-inset text-slate-100 placeholder:text-slate-600/70 focus:outline-none focus:ring-1 focus:ring-cyan-500'
                    : 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
                } ${errors.instructor ? 'ring-2 ring-rose-500' : ''}`}
              />
              {errors.instructor && (
                <p className="text-[10px] sm:text-xs text-rose-500 mt-0.5 font-semibold">{errors.instructor}</p>
              )}
            </div>
          </div>

          {/* Time Schedule */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`text-[10.5px] sm:text-sm font-medium ${
                isDark ? 'text-slate-300 font-bold' : 'text-slate-700'
              }`}>
                Time Schedule
              </label>
              {borrower.labTime && (
                <span className={`text-[10px] sm:text-xs font-mono font-extrabold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border truncate max-w-[190px] sm:max-w-[240px] ${
                  isDark ? 'text-cyan-400 bg-cyan-950/70 border-cyan-500/40' : 'bg-blue-50 text-blue-800 border border-blue-200/60 font-semibold'
                }`}>
                  {borrower.labTime}
                </span>
              )}
            </div>

            <div className={`w-full py-1.5 sm:py-2.5 px-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl border ${
              isDark ? 'neu-inset border-slate-800/80' : 'bg-slate-50 border border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                {/* Start Time */}
                <div className="flex-1">
                  <span className={`block text-[9px] sm:text-xs uppercase font-bold mb-0.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Start
                  </span>
                  <input
                    type="time"
                    data-no-osk="true"
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
                        const sH = String(h).padStart(2, '0');
                        setStartHour(sH);
                        setStartMinute(mStr);
                        setStartPeriod(period);
                        syncLabTime(sH, mStr, period, endHour, endMinute, endPeriod);
                      }
                    }}
                    className={`w-full h-8 sm:h-11 px-2 sm:px-3 rounded-lg sm:rounded-xl font-mono text-xs sm:text-base font-extrabold transition-all cursor-pointer ${
                      isDark
                        ? 'neu-inset text-cyan-300 bg-[#0e1422] border-slate-800/80 focus:ring-1 focus:ring-cyan-500'
                        : 'bg-white border border-slate-300 text-slate-900 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
                    }`}
                    style={{ colorScheme: isDark ? 'dark' : 'light' }}
                  />
                </div>

                {/* "to" separator */}
                <div className="flex flex-col items-center justify-center pt-3 sm:pt-4">
                  <span className={`text-[10px] sm:text-sm font-black uppercase tracking-widest px-1 shrink-0 select-none ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    to
                  </span>
                </div>

                {/* End Time */}
                <div className="flex-1">
                  <span className={`block text-[9px] sm:text-xs uppercase font-bold mb-0.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    End
                  </span>
                  <input
                    type="time"
                    data-no-osk="true"
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
                        const eH = String(h).padStart(2, '0');
                        setEndHour(eH);
                        setEndMinute(mStr);
                        setEndPeriod(period);
                        syncLabTime(startHour, startMinute, startPeriod, eH, mStr, period);
                      }
                    }}
                    className={`w-full h-8 sm:h-11 px-2 sm:px-3 rounded-lg sm:rounded-xl font-mono text-xs sm:text-base font-extrabold transition-all cursor-pointer ${
                      isDark
                        ? 'neu-inset text-cyan-300 bg-[#0e1422] border-slate-800/80 focus:ring-1 focus:ring-cyan-500'
                        : 'bg-white border border-slate-300 text-slate-900 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
                    }`}
                    style={{ colorScheme: isDark ? 'dark' : 'light' }}
                  />
                </div>
              </div>
            </div>

            {errors.labTime && (
              <p className="text-[10px] sm:text-xs text-rose-500 mt-0.5 font-semibold">{errors.labTime}</p>
            )}
          </div>
        </div>
      </form>

      {/* 3. Bottom Action CTA Bar (Side by side on mobile for zero scrolling) */}
      <div className="mt-auto md:mt-0 pt-2.5 sm:pt-4 pb-1 sm:pb-0 border-t border-slate-800/80 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
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
