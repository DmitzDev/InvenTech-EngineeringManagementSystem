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
  X,
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from '../ui/TouchButton';
import MaterialTimePicker from '../ui/MaterialTimePicker';
import { handleStudentIdChange } from '../../utils/studentIdFormatter';

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
    lookupStudentInDatabase,
    setStep,
    goToWelcome,
    theme,
    showToast,
  } = useTransaction();

  const isDark = theme === 'dark';

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
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

  // Active Material Time Picker ('start' | 'end' | null)
  const [activePicker, setActivePicker] = useState(null);



  // Real-time clearance check
  const clearanceStatus = useMemo(() => {
    return checkStudentOverdueClearance(borrower.groupLeader, borrower.studentId);
  }, [borrower.studentId, borrower.groupLeader, checkStudentOverdueClearance]);

  // Database validation check for duplicate active loans and past profiles
  const databaseCheck = useMemo(() => {
    return lookupStudentInDatabase?.(borrower.studentId) || {
      hasDuplicateActiveLoan: false,
      activeLoanTx: null,
      previousProfile: null,
    };
  }, [borrower.studentId, lookupStudentInDatabase]);

  const isTimeScheduleValid = Boolean(startHour && endHour && !(startHour === endHour && startMinute === endMinute && startPeriod === endPeriod));

  const handleApplyPreviousProfile = () => {
    if (!databaseCheck.previousProfile) return;
    const { studentName, program, yearLevel, section, courseCode, instructor } = databaseCheck.previousProfile;
    if (studentName) setBorrowerField('groupLeader', studentName);
    if (program) setBorrowerField('program', program);
    if (yearLevel) {
      setSelectedYear(yearLevel);
      setBorrowerField('yearLevel', yearLevel);
    }
    if (section) {
      setSelectedSection(section);
      setBorrowerField('section', section);
    }
    if (courseCode) setBorrowerField('courseCode', courseCode);
    if (instructor) setBorrowerField('instructor', instructor);
    setErrors({});
  };

  // Handler for Academic Program dropdown
  const handleProgramChange = (val) => {
    setErrors((prev) => ({ ...prev, program: null, courseCode: null }));
    if (val === 'OTHERS') {
      setIsOtherProgram(true);
      setCustomProgram('');
      setBorrowerField('program', '');
    } else {
      setIsOtherProgram(false);
      setCustomProgram('');
      setBorrowerField('program', val);
    }
  };

  const handleCustomProgramChange = (val) => {
    setErrors((prev) => ({ ...prev, program: null, courseCode: null }));
    const cleanVal = val.toUpperCase();
    setCustomProgram(cleanVal);
    setBorrowerField('program', cleanVal);
  };

  // Handler for Year Level dropdown
  const handleYearChange = (yearId) => {
    setErrors((prev) => ({ ...prev, year: null, courseCode: null }));
    setSelectedYear(yearId);
    if ((yearId === '1' || yearId === '4') && selectedSem === '3') {
      setSelectedSem('');
    }
  };

  // Handler for Semester / Term dropdown
  const handleSemChange = (semId) => {
    setErrors((prev) => ({ ...prev, sem: null, courseCode: null }));
    setSelectedSem(semId);
  };

  // Handler for Section dropdown
  const handleSectionChange = (sec) => {
    setErrors((prev) => ({ ...prev, section: null, courseCode: null }));
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

  // Reset local state if borrower session is cleared / reset
  useEffect(() => {
    if (!borrower.program && !borrower.courseCode && !borrower.studentId && !borrower.groupLeader) {
      setSelectedYear('');
      setSelectedSem('');
      setSelectedSection('');
      setIsOtherProgram(false);
      setCustomProgram('');
      setStartHour('');
      setStartMinute('');
      setEndHour('');
      setEndMinute('');
      setErrors({});
      setTouched({});
      setHasSubmitted(false);
    }
  }, [borrower.program, borrower.courseCode, borrower.studentId, borrower.groupLeader]);

  const validate = () => {
    const errs = {};
    if (!borrower.program?.trim()) {
      errs.program = 'Pumili o maglagay ng Academic Program';
    } else if (isOtherProgram && customProgram.trim().length < 2) {
      errs.program = 'Ilagay ang Program name (e.g. BSIT)';
    }

    if (!selectedYear) {
      errs.year = 'Pumili ng Year Level';
    }
    if (!selectedSem) {
      errs.sem = 'Pumili ng Semester';
    }
    if (!selectedSection) {
      errs.section = 'Pumili ng Section';
    }

    if (!borrower.courseCode?.trim()) {
      errs.courseCode = 'Kailangan ang Course Code (Program, Year, Sem, & Section)';
    }

    const curLeader = (borrower.groupLeader || '').trim();
    if (!curLeader) {
      errs.groupLeader = 'Kinakailangan ang Student Full Name';
    } else if (curLeader.length < 5 || !curLeader.includes(' ')) {
      errs.groupLeader = 'Pakilagay ang buong pangalan (First Name at Last Name)';
    } else if (!/^[A-Za-z\s.\-ñÑ]+$/.test(curLeader)) {
      errs.groupLeader = 'Mga letra at espasyo lamang ang tanggap sa pangalan';
    }

    const curCleanId = (borrower.studentId || '').replace(/\D/g, '');
    if (!curCleanId) {
      errs.studentId = 'Kinakailangan ang Student ID Number';
    } else if (curCleanId.length !== 9) {
      errs.studentId = `Kulang ang Student ID: 9 digits ang kailangan (${curCleanId.length}/9 digits naipasa)`;
    } else if (databaseCheck.hasDuplicateActiveLoan) {
      errs.studentId = `Bawal humiram muli: May aktibong hiniram pa ang Student ID na ito (${databaseCheck.activeLoanTx?.transactionId || databaseCheck.activeLoanTx?.txId}). Paki-sauli muna ang mga gamit bago magsimula ng bagong transaksyon.`;
    }

    const curInstructor = (borrower.instructor || '').trim();
    if (!curInstructor) {
      errs.instructor = 'Kinakailangan ang pangalan ng Instructor';
    } else if (curInstructor.length < 3) {
      errs.instructor = 'Masyadong maikli ang pangalan ng Instructor (at least 3 characters)';
    } else if (!/^[A-Za-z\s.\-ñÑ,]+$/.test(curInstructor)) {
      errs.instructor = 'Mga letra lamang ang tanggap sa pangalan ng Instructor';
    }

    if (!borrower.labTime?.trim() || !startHour || !endHour) {
      errs.labTime = 'Pakikumpleto pareho ang Start Time at End Time';
    } else if (startHour === endHour && startMinute === endMinute && startPeriod === endPeriod) {
      errs.labTime = 'Bawal magkapareho ang Start at End time';
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
    setHasSubmitted(true);
    setTouched({
      program: true,
      year: true,
      sem: true,
      section: true,
      courseCode: true,
      groupLeader: true,
      studentId: true,
      instructor: true,
      labTime: true,
    });

    if (validate()) {
      setStep(2);
    } else {
      if (showToast) {
        showToast('Paki-kumpleto ang lahat ng required fields sa Step 1 bago magpatuloy.', 'error');
      }
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

      {/* Overdue / Clearance Hold Alert Banner (Clean & Elegant Institutional Card) */}
      {clearanceStatus.isRestricted && (
        <div className={`my-2 p-3.5 sm:p-4 rounded-2xl border transition-all animate-fade-in shrink-0 shadow-xs ${
          isDark
            ? 'bg-[#121927] border-rose-500/30 text-slate-200'
            : 'bg-white border-rose-200 text-slate-800'
        }`}>
          {/* Top Row: Icon + Title + Reference Badge */}
          <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark
                  ? 'bg-rose-950/60 border-rose-800/60 text-rose-400'
                  : 'bg-rose-50 border-rose-200 text-rose-600'
              }`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm sm:text-base font-bold leading-tight ${
                  isDark ? 'text-rose-300' : 'text-rose-950'
                }`}>
                  Borrowing Restricted — Clearance Hold Active
                </h3>
                <p className={`text-xs mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  You have unreturned apparatus from a previous session. Please settle with the lab custodian to clear your account.
                </p>
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-center">
              <span className={`text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                Ref: {clearanceStatus.clearanceHold?.id || 'HOLD-001'}
              </span>
            </div>
          </div>

          {/* Unreturned Items Grid */}
          {clearanceStatus.overdueItems && clearanceStatus.overdueItems.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {clearanceStatus.overdueItems.slice(0, 6).map((item, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                      isDark
                        ? 'bg-slate-900/60 border-slate-800'
                        : 'bg-slate-50/80 border-slate-200/80'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold truncate text-slate-900 dark:text-slate-100">
                        {item.name}
                      </p>
                      <p className="text-[10.5px] font-mono text-slate-500 dark:text-slate-400 truncate">
                        {item.tagCode || 'N/A'} • Qty: {item.qty}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                      Due {item.dueDate || item.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 1 Validation Summary Alert Banner */}
      {hasSubmitted && Object.keys(errors).length > 0 && (
        <div className="my-2 p-3 sm:p-3.5 rounded-2xl border border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-300 animate-shake flex items-center justify-between gap-3 shadow-xs shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-500">
              <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold leading-tight">
                Pakikumpleto ang mga kinakailangang field sa Step 1:
              </p>
              <p className="text-[11px] opacity-90 truncate mt-0.5">
                {Object.values(errors).filter(Boolean).slice(0, 3).join(' • ')}
                {Object.values(errors).length > 3 && ` (+${Object.values(errors).length - 3} pa)`}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-extrabold px-2 py-1 rounded-lg bg-rose-600 text-white shrink-0">
            {Object.keys(errors).length} Field(s)
          </span>
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
            {/* 1. Academic Program (In-place transformation when 'Others' is selected) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`block text-[10.5px] sm:text-sm font-medium ${
                  isDark ? 'text-slate-300 font-bold' : 'text-slate-700'
                }`}>
                  Program
                </label>
                {isOtherProgram && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtherProgram(false);
                      setCustomProgram('');
                      setBorrowerField('program', '');
                    }}
                    className={`text-[9.5px] sm:text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    Select from list
                  </button>
                )}
              </div>

              {!isOtherProgram ? (
                <select
                  value={borrower.program}
                  onBlur={() => setTouched((prev) => ({ ...prev, program: true }))}
                  onChange={(e) => handleProgramChange(e.target.value)}
                  className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-2 sm:px-3.5 rounded-lg sm:rounded-xl text-xs sm:text-sm cursor-pointer transition-all ${
                    isDark
                      ? 'neu-inset bg-[#0e1422] border border-slate-800 focus:ring-1 focus:ring-cyan-500'
                      : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
                  } ${!borrower.program ? (isDark ? 'text-slate-400/50' : 'text-slate-400') : (isDark ? 'text-slate-100 font-bold' : 'text-slate-900 font-bold')} ${
                    (hasSubmitted || touched.program) && errors.program ? 'ring-2 ring-rose-500 border-rose-500' : ''
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
              ) : (
                <div className="relative w-full">
                  <input
                    type="text"
                    value={customProgram}
                    onBlur={() => setTouched((prev) => ({ ...prev, program: true }))}
                    onChange={(e) => handleCustomProgramChange(e.target.value)}
                    placeholder="Type program (e.g. BSIT)..."
                    autoComplete="off"
                    spellCheck={false}
                    autoFocus
                    className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] pl-3 pr-8 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all uppercase ${
                      isDark
                        ? 'neu-inset text-cyan-300 bg-[#0e1422] border border-cyan-500/50 placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500'
                        : 'bg-white border border-blue-400 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-xs'
                    } ${(hasSubmitted || touched.program) && errors.program ? 'ring-2 ring-rose-500 border-rose-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtherProgram(false);
                      setCustomProgram('');
                      setBorrowerField('program', '');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                    title="Back to list"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              )}

              {(hasSubmitted || touched.program) && errors.program && (
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
                onBlur={() => setTouched((prev) => ({ ...prev, year: true }))}
                onChange={(e) => handleYearChange(e.target.value)}
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-2 sm:px-3.5 rounded-lg sm:rounded-xl text-xs sm:text-sm cursor-pointer transition-all ${
                  isDark
                    ? 'neu-inset bg-[#0e1422] border border-slate-800 focus:ring-1 focus:ring-cyan-500'
                    : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
                } ${(hasSubmitted || touched.year) && errors.year ? 'ring-2 ring-rose-500 border-rose-500' : ''} ${!selectedYear ? (isDark ? 'text-slate-400/50' : 'text-slate-400') : (isDark ? 'text-slate-100 font-bold' : 'text-slate-900 font-bold')}`}
              >
                <option value="" className={isDark ? 'bg-[#0e1422] text-slate-500' : 'bg-white text-slate-400'}>Select Year</option>
                {YEAR_LEVELS.map((y) => (
                  <option key={y.id} value={y.id} className={isDark ? 'bg-[#0e1422] text-slate-100 font-bold' : 'bg-white text-slate-900 font-semibold'}>
                    {y.label}
                  </option>
                ))}
              </select>
              {(hasSubmitted || touched.year) && errors.year && (
                <p className="text-[10px] sm:text-xs text-rose-500 mt-0.5 font-semibold">{errors.year}</p>
              )}
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
                onBlur={() => setTouched((prev) => ({ ...prev, sem: true }))}
                onChange={(e) => handleSemChange(e.target.value)}
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-2 sm:px-3.5 rounded-lg sm:rounded-xl text-xs sm:text-sm cursor-pointer transition-all ${
                  isDark
                    ? 'neu-inset bg-[#0e1422] border border-slate-800 focus:ring-1 focus:ring-cyan-500'
                    : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
                } ${(hasSubmitted || touched.sem) && errors.sem ? 'ring-2 ring-rose-500 border-rose-500' : ''} ${!selectedSem ? (isDark ? 'text-slate-400/50' : 'text-slate-400') : (isDark ? 'text-slate-100 font-bold' : 'text-slate-900 font-bold')}`}
              >
                <option value="" className={isDark ? 'bg-[#0e1422] text-slate-500' : 'bg-white text-slate-400'}>Select Semester</option>
                <option value="1" className={isDark ? 'bg-[#0e1422] text-slate-100 font-bold' : 'bg-white text-slate-900 font-semibold'}>1st Semester</option>
                <option value="2" className={isDark ? 'bg-[#0e1422] text-slate-100 font-bold' : 'bg-white text-slate-900 font-semibold'}>2nd Semester</option>
                {(selectedYear === '2' || selectedYear === '3') && (
                  <option value="3" className={isDark ? 'bg-[#0e1422] text-amber-300 font-bold' : 'bg-white text-amber-800 font-bold'}>Summer Term</option>
                )}
              </select>
              {(hasSubmitted || touched.sem) && errors.sem && (
                <p className="text-[10px] sm:text-xs text-rose-500 mt-0.5 font-semibold">{errors.sem}</p>
              )}
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
                onBlur={() => setTouched((prev) => ({ ...prev, section: true }))}
                onChange={(e) => handleSectionChange(e.target.value)}
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-2 sm:px-3.5 rounded-lg sm:rounded-xl text-xs sm:text-sm cursor-pointer transition-all ${
                  isDark
                    ? 'neu-inset bg-[#0e1422] border border-slate-800 focus:ring-1 focus:ring-cyan-500'
                    : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
                } ${(hasSubmitted || touched.section) && errors.section ? 'ring-2 ring-rose-500 border-rose-500' : ''} ${!selectedSection ? (isDark ? 'text-slate-400/50' : 'text-slate-400') : (isDark ? 'text-slate-100 font-bold' : 'text-slate-900 font-bold')}`}
              >
                <option value="" className={isDark ? 'bg-[#0e1422] text-slate-500' : 'bg-white text-slate-400'}>Select Section</option>
                {SECTIONS.map((sec) => (
                  <option key={sec} value={sec} className={isDark ? 'bg-[#0e1422] text-slate-100 font-bold' : 'bg-white text-slate-900 font-semibold'}>
                    Section {sec}
                  </option>
                ))}
              </select>
              {(hasSubmitted || touched.section) && errors.section && (
                <p className="text-[10px] sm:text-xs text-rose-500 mt-0.5 font-semibold">{errors.section}</p>
              )}
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
            </div>
            <div
              tabIndex={-1}
              data-no-osk="true"
              className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-3 sm:px-4 rounded-lg sm:rounded-xl font-mono text-xs sm:text-base font-extrabold flex items-center select-none cursor-default ${
                isDark
                  ? 'neu-inset text-cyan-300 bg-[#0a101d] border border-slate-800/90'
                  : 'bg-slate-100 border border-slate-300 text-slate-800 shadow-xs'
              } ${(hasSubmitted || touched.courseCode) && errors.courseCode ? 'ring-2 ring-rose-500 border-rose-500' : ''}`}
            >
              {borrower.courseCode ? (
                <span>{borrower.courseCode}</span>
              ) : (
                <span className={`font-normal text-xs sm:text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Select your program, year, and section.
                </span>
              )}
            </div>
            {(hasSubmitted || touched.courseCode) && errors.courseCode && (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 items-start">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`block text-[10.5px] sm:text-sm font-medium ${
                  isDark ? 'text-slate-300 font-bold' : 'text-slate-700'
                }`}>
                  Student Fullname
                </label>
              </div>
              <input
                type="text"
                value={borrower.groupLeader}
                onBlur={() => setTouched((prev) => ({ ...prev, groupLeader: true }))}
                onChange={(e) => {
                  setErrors((prev) => ({ ...prev, groupLeader: null }));
                  setBorrowerField('groupLeader', e.target.value.toUpperCase());
                }}
                placeholder="e.g. JUAN DELA CRUZ"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="next"
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-3 sm:px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold uppercase transition-all ${
                  isDark
                    ? 'neu-inset text-slate-100 placeholder:text-slate-600/70 focus:outline-none focus:ring-1 focus:ring-cyan-500'
                    : 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
                } ${(hasSubmitted || touched.groupLeader) && errors.groupLeader ? 'ring-2 ring-rose-500 border-rose-500' : ''}`}
              />
              {(hasSubmitted || touched.groupLeader) && errors.groupLeader && (
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
                {databaseCheck.hasDuplicateActiveLoan && (
                  <span className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5">
                    <AlertTriangle className="w-3 h-3" /> May Aktibong Hirap
                  </span>
                )}
              </div>
              <input
                type="text"
                value={borrower.studentId || ''}
                onBlur={() => setTouched((prev) => ({ ...prev, studentId: true }))}
                onChange={(e) => {
                  setErrors((prev) => ({ ...prev, studentId: null }));
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
                  clearanceStatus.isRestricted || databaseCheck.hasDuplicateActiveLoan
                    ? isDark
                      ? 'text-rose-400 border border-rose-500 bg-rose-950/40 ring-2 ring-rose-500'
                      : 'text-rose-900 border-2 border-rose-400 bg-rose-50 ring-2 ring-rose-200'
                    : isDark
                      ? 'neu-inset text-cyan-300 placeholder:text-slate-600/70 focus:outline-none focus:ring-1 focus:ring-cyan-500'
                      : 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
                } ${(hasSubmitted || touched.studentId) && errors.studentId ? 'ring-2 ring-rose-500 border-rose-500' : ''}`}
              />
              {(hasSubmitted || touched.studentId) && errors.studentId && (
                <p className="text-[10px] sm:text-xs text-rose-500 mt-1 font-semibold">{errors.studentId}</p>
              )}

              {/* Duplicate Active Loan Warning */}
              {databaseCheck.hasDuplicateActiveLoan && (
                <div className="mt-2 p-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs animate-fade-in">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>May Aktibong Hirap pa sa Database!</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    Ang ID na ito ay may kasalukuyang hiniram na gamit sa transaksyon (
                    <span className="font-mono font-bold">{databaseCheck.activeLoanTx?.transactionId || databaseCheck.activeLoanTx?.txId}</span>
                    ). Paki-sauli muna ang gamit sa laboratory custodian bago humiram muli.
                  </p>
                </div>
              )}

              {/* Database Registered Profile Match / Auto-fill Helper */}
              {databaseCheck.previousProfile && !databaseCheck.hasDuplicateActiveLoan && (
                <div className={`mt-2 p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fade-in ${
                  isDark ? 'bg-blue-950/30 border-blue-500/30 text-blue-300' : 'bg-blue-50/80 border-blue-200 text-blue-900'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="truncate">
                      <span className="font-bold">Record sa Database:</span>{' '}
                      <span>{databaseCheck.previousProfile.studentName} ({databaseCheck.previousProfile.program})</span>
                    </div>
                  </div>
                  {(!borrower.groupLeader || !borrower.program) && (
                    <button
                      type="button"
                      onClick={handleApplyPreviousProfile}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white shrink-0 active:scale-95 transition-all cursor-pointer shadow-xs"
                    >
                      I-fill Out
                    </button>
                  )}
                </div>
              )}

              {/* Mismatched Name Warning */}
              {borrower.groupLeader && databaseCheck.previousProfile &&
                !databaseCheck.previousProfile.studentName.toLowerCase().includes(borrower.groupLeader.trim().toLowerCase()) &&
                !borrower.groupLeader.trim().toLowerCase().includes(databaseCheck.previousProfile.studentName.toLowerCase()) && (
                  <p className="text-[11px] text-amber-500 mt-1 font-medium">
                    ⚠️ Paalala: Ang ID na ito ay nakatala sa database bilang "{databaseCheck.previousProfile.studentName}".
                  </p>
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
              <div className="flex items-center justify-between mb-1">
                <label className={`block text-[10.5px] sm:text-sm font-medium ${
                  isDark ? 'text-slate-300 font-bold' : 'text-slate-700'
                }`}>
                  Instructor
                </label>
              </div>
              <input
                type="text"
                value={borrower.instructor}
                onBlur={() => setTouched((prev) => ({ ...prev, instructor: true }))}
                onChange={(e) => {
                  setErrors((prev) => ({ ...prev, instructor: null }));
                  setBorrowerField('instructor', e.target.value);
                }}
                placeholder="e.g. Engr. Jin Benir Macaranas"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="done"
                className={`w-full h-9 sm:h-12 min-h-[36px] sm:min-h-[48px] px-3 sm:px-4 rounded-lg sm:rounded-xl text-xs sm:text-base font-bold transition-all ${
                  isDark
                    ? 'neu-inset text-slate-100 placeholder:text-slate-600/70 focus:outline-none focus:ring-1 focus:ring-cyan-500'
                    : 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs'
                } ${(hasSubmitted || touched.instructor) && errors.instructor ? 'ring-2 ring-rose-500 border-rose-500' : ''}`}
              />
              {(hasSubmitted || touched.instructor) && errors.instructor && (
                <p className="text-[10px] sm:text-xs text-rose-500 mt-0.5 font-semibold">{errors.instructor}</p>
              )}
            </div>
          </div>

          {/* Time Schedule Selector (Touch-Optimized for Kiosk Displays) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-[10.5px] sm:text-sm font-medium ${
                isDark ? 'text-slate-300 font-bold' : 'text-slate-700'
              }`}>
                Time Schedule
              </label>
              {borrower.labTime && isTimeScheduleValid && (
                <span className={`text-[10px] sm:text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-full border truncate max-w-[210px] ${
                  isDark ? 'text-cyan-400 bg-cyan-950/70 border-cyan-500/40' : 'bg-blue-50 text-blue-800 border border-blue-200/60 font-semibold'
                }`}>
                  {borrower.labTime}
                </span>
              )}
              {startHour && endHour && !isTimeScheduleValid && (
                <span className="text-[10px] font-bold text-rose-500">
                  Bawal magkapareho ang oras
                </span>
              )}
            </div>

            {/* Laboratory Schedule Time Selector (slim single-row) */}
            <div className="flex items-center gap-2">
              {[
                { key: 'start', label: 'Start', h: startHour, m: startMinute, p: startPeriod },
                { key: 'end', label: 'End', h: endHour, m: endMinute, p: endPeriod },
              ].map((t, idx) => (
                <React.Fragment key={t.key}>
                  {idx === 1 && (
                    <span className={`text-[10px] sm:text-xs font-bold uppercase shrink-0 ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      to
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setActivePicker(t.key)}
                    className={`flex-1 h-9 sm:h-11 px-2.5 sm:px-3 rounded-lg sm:rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                      (hasSubmitted || touched.labTime) && errors.labTime
                        ? 'border-rose-500 ring-1 ring-rose-500'
                        : isDark
                        ? 'border-slate-800 hover:border-cyan-500/60'
                        : 'border-slate-300 hover:border-blue-400'
                    } ${isDark ? 'neu-inset bg-[#0e1422]' : 'bg-white shadow-xs'}`}
                  >
                    <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                    <span className={`text-[9px] sm:text-[11px] font-bold uppercase tracking-wide ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {t.label}
                    </span>
                    <span className={`ml-auto font-mono text-sm sm:text-base font-extrabold ${
                      t.h
                        ? isDark ? 'text-slate-100' : 'text-slate-900'
                        : isDark ? 'text-slate-600' : 'text-slate-300'
                    }`}>
                      {t.h ? `${t.h}:${t.m || '00'}` : '--:--'}
                    </span>
                    {t.h && (
                      <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        t.p === 'AM'
                          ? isDark ? 'text-amber-400 bg-amber-500/10' : 'text-amber-800 bg-amber-100'
                          : isDark ? 'text-cyan-400 bg-cyan-500/10' : 'text-blue-800 bg-blue-100'
                      }`}>
                        {t.p}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {(hasSubmitted || touched.labTime) && errors.labTime && (
              <p className="text-[10px] sm:text-xs text-rose-500 mt-1 font-semibold">{errors.labTime}</p>
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
          variant={clearanceStatus.isRestricted || databaseCheck.hasDuplicateActiveLoan ? 'danger' : 'primary'}
          size="md"
          icon={clearanceStatus.isRestricted || databaseCheck.hasDuplicateActiveLoan ? AlertTriangle : ArrowRight}
          onClick={handleNext}
          disabled={clearanceStatus.isRestricted || databaseCheck.hasDuplicateActiveLoan}
          className={`flex-1 sm:flex-initial sm:min-w-[320px] py-2 sm:py-3 text-xs sm:text-base font-extrabold shadow-lg truncate ${
            clearanceStatus.isRestricted || databaseCheck.hasDuplicateActiveLoan ? 'opacity-60 cursor-not-allowed bg-rose-700' : ''
          }`}
        >
          {clearanceStatus.isRestricted
            ? 'Borrowing Restricted (Clearance Hold)'
            : databaseCheck.hasDuplicateActiveLoan
            ? 'Borrowing Restricted (Active Loan)'
            : 'Next: Select Laboratory'}
        </TouchButton>
      </div>

      {/* Material 3 Android Time Picker Modal */}
      <MaterialTimePicker
        isOpen={activePicker !== null}
        initialHour={activePicker === 'start' ? (startHour || '08') : (endHour || '11')}
        initialMinute={activePicker === 'start' ? (startMinute || '00') : (endMinute || '00')}
        initialPeriod={activePicker === 'start' ? (startPeriod || 'AM') : (endPeriod || 'AM')}
        onSave={({ hour12, minuteStr, period }) => {
          if (activePicker === 'start') {
            setStartHour(hour12);
            setStartMinute(minuteStr);
            setStartPeriod(period);
          } else {
            setEndHour(hour12);
            setEndMinute(minuteStr);
            setEndPeriod(period);
          }
          setErrors((prev) => ({ ...prev, labTime: null }));
          setTouched((prev) => ({ ...prev, labTime: true }));
        }}
        onClear={() => {
          if (activePicker === 'start') {
            setStartHour('');
            setStartMinute('');
          } else {
            setEndHour('');
            setEndMinute('');
          }
          setTouched((prev) => ({ ...prev, labTime: true }));
        }}
        onClose={() => setActivePicker(null)}
      />
    </div>
  );
}
