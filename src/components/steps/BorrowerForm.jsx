import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, GraduationCap, Users, Clock, UserCheck } from 'lucide-react';
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
  const { borrower, setBorrowerField, setStep, goToWelcome } = useTransaction();
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
      } else {
        const parts = trimmed.split(' ');
        if (parts.length >= 2) {
          const prog = parts[0];
          const numPart = parts[1];
          if (ENGINEERING_PROGRAMS.includes(prog)) {
            setBorrowerField('program', prog);
          } else if (prog) {
            setIsOtherProgram(true);
            setCustomProgram(prog);
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
  }, [borrower.courseCode, borrower.program, selectedYear, selectedSem, selectedSection, setBorrowerField]);

  const validate = () => {
    const errs = {};
    if (!borrower.program?.trim()) errs.program = 'Select or specify an Academic Program';
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
    <div className="flex-1 max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto w-full p-3.5 sm:p-5 lg:p-6 pb-6 sm:pb-8 lg:pb-8 flex flex-col justify-between select-none">
      {/* 1. Step Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-mono text-cyan-400 font-extrabold tracking-wider uppercase">
              Step 01 of 04
            </span>
            <span className="text-xs sm:text-sm text-slate-400 font-medium">• Institutional Clearance</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-100 leading-tight mt-0.5">
            Borrower Identification Form
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 hidden md:block">
          Select program, academic level, and laboratory schedule credentials.
        </p>
      </div>

      {/* 2. Form Grid with Neumorphic Raised Panels (Enlarged & Comfortable for 15" Touchscreen) */}
      <form onSubmit={handleNext} className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 my-auto py-2">
        {/* Left Column: Academic & Course Code Builder */}
        <div className="neu-card rounded-3xl p-5 sm:p-6 lg:p-7 space-y-4 sm:space-y-5">
          <h2 className="text-sm sm:text-base font-bold text-slate-200 flex items-center gap-2.5 pb-2 border-b border-slate-800/80 uppercase tracking-wider">
            <GraduationCap className="w-5 h-5 text-cyan-400" />
            <span>Program & Course Details</span>
          </h2>

          {/* Academic Information: Clean 2x2 Uniform Dropdown Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 items-start">
            {/* 1. Academic Program */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5">
                Academic Program / Course
              </label>
              <select
                value={isOtherProgram ? 'OTHERS' : borrower.program}
                onChange={(e) => handleProgramChange(e.target.value)}
                className={`w-full h-12 sm:h-13 min-h-[48px] sm:min-h-[52px] px-3.5 rounded-xl neu-inset text-xs sm:text-sm font-bold text-slate-100 bg-[#0e1422] border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer ${
                  errors.program ? 'ring-2 ring-rose-500' : ''
                }`}
              >
                <option value="" className="bg-[#0e1422] text-slate-400">Select Program</option>
                {ENGINEERING_PROGRAMS.map((prog) => (
                  <option key={prog} value={prog} className="bg-[#0e1422] text-slate-100">
                    {prog}
                  </option>
                ))}
                <option value="OTHERS" className="bg-[#0e1422] text-amber-300 font-bold">
                  Others
                </option>
              </select>

              {/* Custom Program Input directly under the Program dropdown */}
              {isOtherProgram && (
                <div className="mt-2.5 animate-fade-in">
                  <input
                    type="text"
                    value={customProgram}
                    onChange={(e) => handleCustomProgramChange(e.target.value)}
                    placeholder="Type course (e.g. BSIT, BSN, BSBA)..."
                    className="w-full h-11 sm:h-12 px-3.5 rounded-xl neu-inset text-cyan-300 font-bold text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all uppercase bg-[#0e1422] border border-amber-500/40"
                    autoFocus
                  />
                </div>
              )}

              {errors.program && (
                <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.program}</p>
              )}
            </div>

            {/* 2. Year Level */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5">
                Year Level
              </label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full h-12 sm:h-13 min-h-[48px] sm:min-h-[52px] px-3.5 rounded-xl neu-inset text-xs sm:text-sm font-bold text-slate-100 bg-[#0e1422] border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="" className="bg-[#0e1422] text-slate-400">Select Year Level</option>
                {YEAR_LEVELS.map((y) => (
                  <option key={y.id} value={y.id} className="bg-[#0e1422] text-slate-100">
                    {y.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Term / Semester */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5">
                Term / Semester
              </label>
              <select
                value={selectedSem}
                onChange={(e) => handleSemChange(e.target.value)}
                className="w-full h-12 sm:h-13 min-h-[48px] sm:min-h-[52px] px-3.5 rounded-xl neu-inset text-xs sm:text-sm font-bold text-slate-100 bg-[#0e1422] border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="" className="bg-[#0e1422] text-slate-400">Select Term / Sem</option>
                <option value="1" className="bg-[#0e1422] text-slate-100">1st Semester</option>
                <option value="2" className="bg-[#0e1422] text-slate-100">2nd Semester</option>
                {(selectedYear === '2' || selectedYear === '3') && (
                  <option value="3" className="bg-[#0e1422] text-amber-300">Summer Term</option>
                )}
              </select>
            </div>

            {/* 4. Class Section */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5">
                Class Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => handleSectionChange(e.target.value)}
                className="w-full h-12 sm:h-13 min-h-[48px] sm:min-h-[52px] px-3.5 rounded-xl neu-inset text-xs sm:text-sm font-bold font-mono text-slate-100 bg-[#0e1422] border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="" className="bg-[#0e1422] text-slate-400">Select Section</option>
                {SECTIONS.map((sec) => (
                  <option key={sec} value={sec} className="bg-[#0e1422] text-slate-100 font-mono">
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Course Code Input (Auto-calculated or manually editable) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-300">
                Course Code
              </label>
              <span className="text-xs text-slate-400">
                Auto-generated or custom editable
              </span>
            </div>

            <input
              type="text"
              value={borrower.courseCode}
              onChange={(e) => setBorrowerField('courseCode', e.target.value.toUpperCase())}
              placeholder="e.g. 41-BSCPE-01"
              className={`w-full h-12 sm:h-13 min-h-[48px] sm:min-h-[52px] px-4 rounded-xl neu-inset text-cyan-300 font-mono text-sm sm:text-base font-extrabold placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                errors.courseCode ? 'ring-2 ring-rose-500' : ''
              }`}
            />
            {errors.courseCode && (
              <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.courseCode}</p>
            )}
          </div>
        </div>

        {/* Right Column: Group & Schedule Details */}
        <div className="neu-card rounded-3xl p-5 sm:p-6 lg:p-7 space-y-4 sm:space-y-5">
          <h2 className="text-sm sm:text-base font-bold text-slate-200 flex items-center gap-2.5 pb-2 border-b border-slate-800/80 uppercase tracking-wider">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Group & Schedule Information</span>
          </h2>

          <div className="grid grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5">
                Group No.
              </label>
              <div className="flex items-center neu-inset rounded-xl h-12 sm:h-13 min-h-[48px] sm:min-h-[52px] px-2">
                <button
                  type="button"
                  onClick={() =>
                    setBorrowerField('groupNo', String(Math.max(1, parseInt(borrower.groupNo || 1) - 1)))
                  }
                  className="w-10 h-10 sm:w-11 sm:h-11 min-w-[38px] min-h-[38px] rounded-lg neu-btn-raised text-slate-200 font-bold flex items-center justify-center text-lg active:scale-95 cursor-pointer"
                >
                  -
                </button>
                <span className="flex-1 text-center font-mono font-extrabold text-cyan-400 text-base sm:text-lg">
                  {borrower.groupNo || '1'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setBorrowerField('groupNo', String(Math.min(12, parseInt(borrower.groupNo || 1) + 1)))
                  }
                  className="w-10 h-10 sm:w-11 sm:h-11 min-w-[38px] min-h-[38px] rounded-lg neu-btn-raised text-slate-200 font-bold flex items-center justify-center text-lg active:scale-95 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5">
                Group Leader / Student Name
              </label>
              <input
                type="text"
                value={borrower.groupLeader}
                onChange={(e) => setBorrowerField('groupLeader', e.target.value)}
                placeholder="e.g. JASON CAYABYAB"
                className={`w-full h-12 sm:h-13 min-h-[48px] sm:min-h-[52px] px-4 rounded-xl neu-inset text-slate-100 text-sm sm:text-base font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                  errors.groupLeader ? 'ring-2 ring-rose-500' : ''
                }`}
              />
              {errors.groupLeader && (
                <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.groupLeader}</p>
              )}
            </div>
          </div>

          {/* Laboratory Instructor Input */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>Laboratory Instructor</span>
            </label>
            <input
              type="text"
              value={borrower.instructor}
              onChange={(e) => setBorrowerField('instructor', e.target.value)}
              placeholder="e.g. Engr. Jin Benir Macaranas"
              className={`w-full h-12 sm:h-13 min-h-[48px] sm:min-h-[52px] px-4 rounded-xl neu-inset text-slate-100 text-sm sm:text-base font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                errors.instructor ? 'ring-2 ring-rose-500' : ''
              }`}
            />
            {errors.instructor && (
              <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.instructor}</p>
            )}
          </div>

          {/* Clean Unified Time of Laboratory Schedule */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Time of Laboratory Schedule</span>
              </label>
              {borrower.labTime && (
                <span className="text-xs font-mono text-cyan-400 font-extrabold bg-cyan-950/70 px-3 py-1 rounded-full border border-cyan-500/40 truncate max-w-[240px]">
                  {borrower.labTime}
                </span>
              )}
            </div>

            <div className="w-full py-2.5 px-3.5 rounded-2xl neu-inset border border-slate-800/80">
              <div className="flex items-center justify-between gap-3">
                {/* Start Time */}
                <div className="flex-1">
                  <span className="block text-[10px] sm:text-xs uppercase font-bold text-slate-400 mb-1">
                    Start Time
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
                    className="w-full h-11 sm:h-12 px-3.5 rounded-xl neu-inset text-cyan-300 font-mono text-sm sm:text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all bg-[#0e1422] border border-slate-800/80 cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                {/* "to" separator */}
                <div className="flex flex-col items-center justify-center pt-4">
                  <span className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest px-1 shrink-0 select-none">
                    to
                  </span>
                </div>

                {/* End Time */}
                <div className="flex-1">
                  <span className="block text-[10px] sm:text-xs uppercase font-bold text-slate-400 mb-1">
                    End Time
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
                    className="w-full h-11 sm:h-12 px-3.5 rounded-xl neu-inset text-cyan-300 font-mono text-sm sm:text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all bg-[#0e1422] border border-slate-800/80 cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
            </div>

            {errors.labTime && (
              <p className="text-xs text-rose-400 mt-1 font-semibold">{errors.labTime}</p>
            )}
          </div>
        </div>
      </form>

      {/* 3. Bottom Action CTA Bar (Elevated with comfortable margin from bottom bezel) */}
      <div className="pt-3 sm:pt-4 mb-2 border-t border-slate-800/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4 shrink-0">
        <TouchButton
          variant="secondary"
          size="md"
          icon={ArrowLeft}
          onClick={goToWelcome}
          className="w-full sm:w-auto min-w-[130px] sm:min-w-[150px] text-xs sm:text-sm font-bold"
        >
          Cancel
        </TouchButton>

        <TouchButton
          variant="primary"
          size="lg"
          icon={ArrowRight}
          onClick={handleNext}
          className="w-full sm:w-auto min-w-[240px] sm:min-w-[300px] text-sm sm:text-base font-extrabold shadow-lg"
        >
          Next: Select Laboratory
        </TouchButton>
      </div>
    </div>
  );
}
