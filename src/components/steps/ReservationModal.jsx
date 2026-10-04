import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Clock,
  AlertTriangle,
  X,
  Check,
  Users,
  GraduationCap,
  UserCheck,
  Layers,
  BookOpen,
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
const GROUP_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export default function ReservationModal({ item, isOpen, onClose }) {
  const { borrower, addReservation, checkReservationConflict, showToast, theme } = useTransaction();
  const isDark = theme === 'dark';

  // Tomorrow's date formatted as YYYY-MM-DD
  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [reserveDate, setReserveDate] = useState(getTomorrowDate());
  const [qty, setQty] = useState(1);

  // Full Borrower / Academic Details from Step 1
  const [studentName, setStudentName] = useState(borrower.groupLeader || '');
  const [program, setProgram] = useState(borrower.program || 'BSCE');
  const [isOtherProgram, setIsOtherProgram] = useState(false);
  const [customProgram, setCustomProgram] = useState('');
  const [selectedYear, setSelectedYear] = useState('4');
  const [selectedSem, setSelectedSem] = useState('1');
  const [selectedSection, setSelectedSection] = useState('01');
  const [groupNo, setGroupNo] = useState(borrower.groupNo || '1');
  const [instructor, setInstructor] = useState(borrower.instructor || 'Engr. Jin Benir Macaranas');
  const [courseCode, setCourseCode] = useState(borrower.courseCode || '41-BSCE-01');

  // Structured Time Range States (-- : -- AM/PM to -- : -- AM/PM)
  const [startHour, setStartHour] = useState('10');
  const [startMinute, setStartMinute] = useState('00');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endHour, setEndHour] = useState('12');
  const [endMinute, setEndMinute] = useState('00');
  const [endPeriod, setEndPeriod] = useState('NN');

  const [confirmedReservation, setConfirmedReservation] = useState(null);

  // Load borrower data from context if already filled in Step 1
  useEffect(() => {
    if (borrower.groupLeader) setStudentName(borrower.groupLeader);
    if (borrower.program) {
      if (ENGINEERING_PROGRAMS.includes(borrower.program)) {
        setProgram(borrower.program);
        setIsOtherProgram(false);
      } else {
        setIsOtherProgram(true);
        setCustomProgram(borrower.program === 'OTHERS' ? '' : borrower.program);
        setProgram('OTHERS');
      }
    }
    if (borrower.groupNo) setGroupNo(borrower.groupNo);
    if (borrower.instructor) setInstructor(borrower.instructor);
    if (borrower.courseCode) setCourseCode(borrower.courseCode);

    if (borrower.labTime) {
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
  }, [borrower, isOpen]);

  // Lock background scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle program change
  const handleProgramChange = (val) => {
    if (val === 'OTHERS') {
      setIsOtherProgram(true);
      setProgram('OTHERS');
    } else {
      setIsOtherProgram(false);
      setProgram(val);
    }
  };

  // Synchronize auto course code
  useEffect(() => {
    const prog = isOtherProgram ? (customProgram || 'OTHERS') : program;
    if (selectedYear && selectedSem && prog && selectedSection) {
      const autoCode = `${selectedYear}${selectedSem}-${prog}-${selectedSection}`;
      setCourseCode(autoCode);
    }
  }, [program, isOtherProgram, customProgram, selectedYear, selectedSem, selectedSection]);

  if (!isOpen || !item) return null;

  // Formatted Time Slot
  const formattedLabTime = `${startHour.padStart(2, '0')}:${startMinute.padStart(2, '0')} ${startPeriod} - ${endHour.padStart(2, '0')}:${endMinute.padStart(2, '0')} ${endPeriod}`;

  // Real-time conflict check
  const conflictInfo = checkReservationConflict(item.id, reserveDate, formattedLabTime, qty, item.stock);

  const handleConfirmReservation = (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      showToast('Please enter the Reserving Student / Group Leader Name', 'error');
      return;
    }
    if (!instructor.trim()) {
      showToast('Please enter the Laboratory Instructor / Professor name', 'error');
      return;
    }
    if (isOtherProgram && !customProgram.trim()) {
      showToast('Please enter your specific Academic Program / Department', 'error');
      return;
    }

    if (conflictInfo.hasConflict) {
      showToast(
        `Double-booking conflict! Only ${conflictInfo.availableSlots} units available for this time slot.`,
        'error'
      );
      return;
    }

    const resolvedProgram = isOtherProgram ? customProgram.trim().toUpperCase() : program;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newReservation = {
      id: `RES-${(item.tagCode || 'UDD').slice(0, 4)}-${randomSuffix}`,
      itemId: item.id,
      tagCode: item.tagCode,
      name: item.name,
      unit: item.unit || 'pc',
      reserveDate,
      timeSlot: formattedLabTime,
      qty,
      studentName: studentName.trim(),
      program: resolvedProgram,
      courseCode: courseCode.trim().toUpperCase(),
      groupNo: String(groupNo),
      instructor: instructor.trim(),
      yearLevel: selectedYear,
      semester: selectedSem,
      section: selectedSection,
      status: 'PENDING',
      createdAt: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    addReservation(newReservation);
    setConfirmedReservation(newReservation);
  };

  const handleClose = () => {
    setConfirmedReservation(null);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex sm:items-center sm:justify-center sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      {/* Click-away backdrop */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleClose}
      />

      {/* Sidebar Drawer on Phone (Slides from Left) / Centered Card on 15" Kiosk */}
      <div className={`relative z-10 w-[90vw] max-w-[380px] sm:max-w-2xl sm:w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] ${
        isDark ? 'bg-[#0c1424] sm:bg-[#0c1527] border-slate-700/80 text-slate-100' : 'bg-white border-slate-300 text-slate-950 shadow-2xl'
      } border-r sm:border shadow-[10px_0_35px_rgba(0,0,0,0.85)] sm:shadow-2xl sm:rounded-3xl flex flex-col overflow-hidden animate-slide-left-drawer sm:animate-none my-0 sm:my-auto`}>
        {/* Header - Pinned at top */}
        <div className={`px-3.5 py-3 sm:px-6 sm:py-4 border-b ${
          isDark ? 'border-slate-800/90 bg-[#111a2c]' : 'border-slate-300 bg-slate-100'
        } flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl neu-inset flex items-center justify-center ${
              isDark ? 'text-cyan-400' : 'text-slate-950 bg-white border border-slate-300'
            } shrink-0 shadow-sm`}>
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-xs sm:text-lg font-black ${isDark ? 'text-slate-100' : 'text-slate-950'} truncate flex items-center gap-1.5`}>
                <span>Advance Reservation</span>
                <span className={`sm:hidden text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-200 text-slate-900 border border-slate-300'
                }`}>
                  FORM
                </span>
              </h3>
              <p className={`text-[10px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'} truncate`}>
                Book laboratory apparatus in advance for upcoming class experiments.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl neu-btn-raised ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950 font-bold'
            } flex items-center justify-center active:scale-95 cursor-pointer shrink-0`}
            aria-label="Close form"
            title="Close sidebar"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal / Drawer Content */}
        {confirmedReservation ? (
          <>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
              <div className="space-y-2 text-center animate-fade-in">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full neu-inset mx-auto flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)]">
                  <Check className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
                </div>

                <div>
                  <h4 className="text-sm sm:text-lg font-bold text-emerald-500 font-black">Equipment Reserved Successfully!</h4>
                  <p className={`text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Ref ID: <span className={`font-mono font-bold text-xs sm:text-sm ${isDark ? 'text-cyan-400' : 'text-slate-950'}`}>{confirmedReservation.id}</span>
                  </p>
                </div>

                <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 text-left space-y-1.5 sm:space-y-2 text-xs sm:text-sm ${
                  isDark ? 'neu-inset' : 'bg-slate-100 border border-slate-300'
                }`}>
                  <div className={`flex justify-between border-b ${isDark ? 'border-slate-800' : 'border-slate-300'} pb-1`}>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600 font-bold'}>Apparatus:</span>
                    <span className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-950 font-black'} truncate max-w-[180px] sm:max-w-[320px]`}>{confirmedReservation.name}</span>
                  </div>
                  <div className={`flex justify-between border-b ${isDark ? 'border-slate-800' : 'border-slate-300'} pb-1`}>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600 font-bold'}>Quantity:</span>
                    <span className={`font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-slate-950 font-black'}`}>
                      {confirmedReservation.qty} {confirmedReservation.unit}s
                    </span>
                  </div>
                  <div className={`flex justify-between border-b ${isDark ? 'border-slate-800' : 'border-slate-300'} pb-1`}>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600 font-bold'}>Schedule:</span>
                    <span className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-950'} truncate max-w-[180px] sm:max-w-[320px]`}>
                      {confirmedReservation.reserveDate} • {confirmedReservation.timeSlot}
                    </span>
                  </div>
                  <div className={`flex justify-between border-b ${isDark ? 'border-slate-800' : 'border-slate-300'} pb-1`}>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600 font-bold'}>Student Leader:</span>
                    <span className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-950'} truncate max-w-[180px] sm:max-w-[320px]`}>
                      {confirmedReservation.studentName} ({confirmedReservation.program} • G{confirmedReservation.groupNo})
                    </span>
                  </div>
                  <div className={`flex justify-between border-b ${isDark ? 'border-slate-800' : 'border-slate-300'} pb-1`}>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600 font-bold'}>Year / Section:</span>
                    <span className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>{confirmedReservation.yearLevel}th Year • Sec {confirmedReservation.section}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600 font-bold'}>Instructor:</span>
                    <span className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-950'} truncate max-w-[180px] sm:max-w-[320px]`}>{confirmedReservation.instructor}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-3 sm:p-4 border-t ${
              isDark ? 'border-slate-800 bg-[#09101d] sm:bg-[#111a2c]' : 'border-slate-300 bg-white'
            } flex items-center justify-center shrink-0`}>
              <TouchButton variant="primary" size="md" onClick={handleClose} className="w-full sm:w-auto px-6 sm:px-10 py-2.5 sm:py-3 text-xs sm:text-base">
                Done & Back to Catalog
              </TouchButton>
            </div>
          </>
        ) : (
          <form onSubmit={handleConfirmReservation} className="flex flex-col flex-1 min-h-0">
            {/* Form Body - Full Step 1 Academic Form embedded */}
            <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1 min-h-0">
              {/* 1. Item Header + Quantity Stepper (With Clean Text + Dot Stock, NO BOX) */}
              <div className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2.5 sm:gap-4 ${
                isDark ? 'neu-inset bg-[#09101d]/60' : 'bg-slate-100 border border-slate-300'
              }`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8.5px] sm:text-xs font-mono font-black uppercase px-1.5 sm:px-2 py-0.5 rounded border ${
                      isDark ? 'text-cyan-400 neu-inset-sm border-transparent' : 'text-slate-900 bg-white border-slate-300'
                    }`}>
                      {item.tagCode}
                    </span>
                    {/* Clean Green Text with Dot Indicator (NO BOX) */}
                    <div className={`flex items-center gap-1.5 font-mono text-[10px] sm:text-xs font-black ${
                      isDark ? 'text-emerald-400' : 'text-emerald-800'
                    }`}>
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] shrink-0" />
                      <span>Stock: {item.stock} {item.unit || 'pcs'}</span>
                    </div>
                  </div>
                  <h4 className={`text-xs sm:text-base font-black ${
                    isDark ? 'text-slate-100' : 'text-slate-950'
                  } truncate leading-tight mt-1`}>{item.name}</h4>
                </div>

                {/* Stepper */}
                <div className={`flex items-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl p-0.5 sm:p-1 shrink-0 ${
                  isDark ? 'neu-inset bg-[#070d18]' : 'bg-white border border-slate-300 shadow-sm'
                }`}>
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className={`w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg neu-btn-raised ${
                      isDark ? 'text-slate-200' : 'text-slate-700 font-bold'
                    } font-black flex items-center justify-center text-xs sm:text-base active:scale-95 cursor-pointer`}
                  >
                    -
                  </button>
                  <span className={`w-5 sm:w-8 text-center font-mono font-black text-xs sm:text-base ${
                    isDark ? 'text-cyan-400' : 'text-slate-950'
                  }`}>{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(Math.min(item.stock, qty + 1))}
                    className={`w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg neu-btn-raised ${
                      isDark ? 'text-slate-200' : 'text-slate-700 font-bold'
                    } font-black flex items-center justify-center text-xs sm:text-base active:scale-95 cursor-pointer`}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Conflict Alert (Shown only if double booking occurs) */}
              {conflictInfo.hasConflict && (
                <div className="p-2 sm:p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-500 font-bold text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Double-booking conflict! Only {conflictInfo.availableSlots} units available for this schedule.</span>
                </div>
              )}

              {/* 2. Reservation Date & Subject Course Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <label className={`block text-[10.5px] sm:text-xs font-bold mb-1 flex items-center gap-1 ${
                    isDark ? 'text-slate-300' : 'text-slate-700 font-bold'
                  }`}>
                    <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-slate-900'} shrink-0`} />
                    <span>Reservation Date *</span>
                  </label>
                  <input
                    type="date"
                    value={reserveDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setReserveDate(e.target.value)}
                    className={`w-full h-9 sm:h-11 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-1 ${
                      isDark ? 'neu-inset text-slate-100 focus:ring-cyan-500' : 'bg-slate-100 border border-slate-300 text-slate-950 font-bold focus:ring-slate-950'
                    }`}
                    style={{ colorScheme: isDark ? 'dark' : 'light' }}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-[10.5px] sm:text-xs font-bold mb-1 flex items-center gap-1 ${
                    isDark ? 'text-slate-300' : 'text-slate-700 font-bold'
                  }`}>
                    <BookOpen className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-slate-900'} shrink-0`} />
                    <span>Subject / Course Code</span>
                  </label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                    placeholder="e.g. 41-BSCPE-01"
                    className={`w-full h-9 sm:h-11 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:ring-1 ${
                      isDark ? 'neu-inset text-cyan-300 focus:ring-cyan-500' : 'bg-slate-100 border border-slate-300 text-slate-950 focus:ring-slate-950'
                    }`}
                  />
                </div>
              </div>

              {/* 3. Academic Program Selection */}
              <div>
                <label className={`block text-[10.5px] sm:text-xs font-bold mb-1 flex items-center gap-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-700 font-bold'
                }`}>
                  <GraduationCap className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-slate-900'} shrink-0`} />
                  <span>Academic Program *</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
                  {[...ENGINEERING_PROGRAMS, 'OTHERS'].map((progOption) => {
                    const isSelected = isOtherProgram ? progOption === 'OTHERS' : program === progOption;
                    return (
                      <button
                        key={progOption}
                        type="button"
                        onClick={() => handleProgramChange(progOption)}
                        className={`h-8 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
                          isSelected
                            ? isDark
                              ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                              : 'neu-btn-primary text-white font-black shadow-md'
                            : isDark
                            ? 'neu-btn-raised text-slate-300 hover:text-white'
                            : 'neu-btn-raised text-slate-700 font-bold'
                        }`}
                      >
                        {progOption}
                      </button>
                    );
                  })}
                </div>

                {isOtherProgram && (
                  <div className="mt-1.5 animate-fade-in">
                    <input
                      type="text"
                      value={customProgram}
                      onChange={(e) => setCustomProgram(e.target.value.toUpperCase())}
                      placeholder="Type your course name (e.g., BSIT, BSCS, BSHM)..."
                      className={`w-full h-8 sm:h-10 px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold uppercase focus:outline-none focus:ring-1 ${
                        isDark ? 'neu-inset text-slate-100 focus:ring-cyan-500' : 'bg-slate-100 border border-slate-300 text-slate-950 focus:ring-slate-950'
                      }`}
                      required
                    />
                  </div>
                )}
              </div>

              {/* 4. Year Level, Semester, Section, Group No. Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {/* Year Level */}
                <div>
                  <label className={`block text-[10px] sm:text-xs font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Year Level</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className={`w-full h-8 sm:h-10 px-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-1 ${
                      isDark ? 'neu-inset text-slate-100 bg-[#111a2c] focus:ring-cyan-500' : 'bg-slate-100 border border-slate-300 text-slate-950 focus:ring-slate-950'
                    }`}
                  >
                    {YEAR_LEVELS.map((y) => (
                      <option key={y.id} value={y.id} className={isDark ? 'bg-[#111a2c] text-slate-100' : 'bg-white text-slate-950'}>
                        {y.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester */}
                <div>
                  <label className={`block text-[10px] sm:text-xs font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Semester</label>
                  <select
                    value={selectedSem}
                    onChange={(e) => setSelectedSem(e.target.value)}
                    className={`w-full h-8 sm:h-10 px-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-1 ${
                      isDark ? 'neu-inset text-slate-100 bg-[#111a2c] focus:ring-cyan-500' : 'bg-slate-100 border border-slate-300 text-slate-950 focus:ring-slate-950'
                    }`}
                  >
                    <option value="1" className={isDark ? 'bg-[#111a2c] text-slate-100' : 'bg-white text-slate-950'}>1st Sem</option>
                    <option value="2" className={isDark ? 'bg-[#111a2c] text-slate-100' : 'bg-white text-slate-950'}>2nd Sem</option>
                    <option value="3" className={isDark ? 'bg-[#111a2c] text-slate-100' : 'bg-white text-slate-950'}>Midyear</option>
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label className={`block text-[10px] sm:text-xs font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Section</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className={`w-full h-8 sm:h-10 px-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-1 ${
                      isDark ? 'neu-inset text-slate-100 bg-[#111a2c] focus:ring-cyan-500' : 'bg-slate-100 border border-slate-300 text-slate-950 focus:ring-slate-950'
                    }`}
                  >
                    {SECTIONS.map((s) => (
                      <option key={s} value={s} className={isDark ? 'bg-[#111a2c] text-slate-100' : 'bg-white text-slate-950'}>
                        Sec {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Group No */}
                <div>
                  <label className={`block text-[10px] sm:text-xs font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Group No.</label>
                  <select
                    value={groupNo}
                    onChange={(e) => setGroupNo(e.target.value)}
                    className={`w-full h-8 sm:h-10 px-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-1 ${
                      isDark ? 'neu-inset text-slate-100 bg-[#111a2c] focus:ring-cyan-500' : 'bg-slate-100 border border-slate-300 text-slate-950 focus:ring-slate-950'
                    }`}
                  >
                    {GROUP_OPTIONS.map((g) => (
                      <option key={g} value={g} className={isDark ? 'bg-[#111a2c] text-slate-100' : 'bg-white text-slate-950'}>
                        Group {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. Student Leader / Reserving Student Name */}
              <div>
                <label className={`block text-[10.5px] sm:text-xs font-bold mb-1 flex items-center gap-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-700 font-bold'
                }`}>
                  <Users className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-slate-900'} shrink-0`} />
                  <span>Student Leader / Borrower Name *</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Jason Cayabyab"
                  className={`w-full h-9 sm:h-11 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 ${
                    isDark ? 'neu-inset text-slate-100 focus:ring-cyan-500' : 'bg-slate-100 border border-slate-300 text-slate-950 font-bold focus:ring-slate-950'
                  }`}
                  required
                />
              </div>

              {/* 6. Laboratory Instructor */}
              <div>
                <label className={`block text-[10.5px] sm:text-xs font-bold mb-1 flex items-center gap-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-700 font-bold'
                }`}>
                  <UserCheck className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-slate-900'} shrink-0`} />
                  <span>Laboratory Instructor / Professor *</span>
                </label>
                <input
                  type="text"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  placeholder="e.g. Engr. Jin Benir Macaranas"
                  className={`w-full h-9 sm:h-11 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 ${
                    isDark ? 'neu-inset text-slate-100 focus:ring-cyan-500' : 'bg-slate-100 border border-slate-300 text-slate-950 font-bold focus:ring-slate-950'
                  }`}
                  required
                />
              </div>

              {/* 7. Structured Time of Laboratory Schedule */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-[10.5px] sm:text-xs font-bold flex items-center gap-1 ${
                    isDark ? 'text-slate-300' : 'text-slate-700 font-bold'
                  }`}>
                    <Clock className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-slate-900'} shrink-0`} />
                    <span>Time Schedule of Laboratory *</span>
                  </label>
                  <span className={`text-[10px] sm:text-xs font-mono font-extrabold px-2 sm:px-3 py-0.5 rounded-full border truncate ${
                    isDark ? 'text-cyan-400 bg-cyan-950/70 border-cyan-500/40' : 'text-slate-950 bg-slate-200 border-slate-300 font-black'
                  }`}>
                    {formattedLabTime}
                  </span>
                </div>

                <div className={`w-full py-1.5 sm:py-2.5 px-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl border ${
                  isDark ? 'neu-inset border-slate-800/80 bg-[#0a111e]' : 'bg-slate-100 border-slate-300'
                }`}>
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    {/* Start Time */}
                    <div className="flex-1">
                      <span className={`block text-[9px] sm:text-xs uppercase font-bold mb-0.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>Start</span>
                      <input
                        type="time"
                        value={(() => {
                          let h = parseInt(startHour, 10) || 10;
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
                        className={`w-full h-8 sm:h-10 px-2 sm:px-3 rounded-lg sm:rounded-xl font-mono text-xs sm:text-sm font-extrabold focus:outline-none focus:ring-1 cursor-pointer ${
                          isDark
                            ? 'neu-inset text-cyan-300 bg-[#0e1422] border border-slate-800/80 focus:ring-cyan-500'
                            : 'bg-white text-slate-950 border border-slate-300 focus:ring-slate-950'
                        }`}
                        style={{ colorScheme: isDark ? 'dark' : 'light' }}
                      />
                    </div>

                    <div className="flex flex-col items-center justify-center pt-3">
                      <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest px-1 select-none ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        to
                      </span>
                    </div>

                    {/* End Time */}
                    <div className="flex-1">
                      <span className={`block text-[9px] sm:text-xs uppercase font-bold mb-0.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>End</span>
                      <input
                        type="time"
                        value={(() => {
                          let h = parseInt(endHour, 10) || 12;
                          if (endPeriod === 'PM' && h !== 12) h += 12;
                          if (endPeriod === 'AM' && h === 12) h = 0;
                          return `${String(h).padStart(2, '0')}:${endMinute || '00'}`;
                        })()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const [hStr, mStr] = val.split(':');
                            let h = parseInt(hStr, 10);
                            const period = h === 12 ? 'NN' : h > 12 ? 'PM' : 'AM';
                            if (h === 0) h = 12;
                            else if (h > 12) h -= 12;
                            setEndHour(String(h).padStart(2, '0'));
                            setEndMinute(mStr);
                            setEndPeriod(period);
                          }
                        }}
                        className={`w-full h-8 sm:h-10 px-2 sm:px-3 rounded-lg sm:rounded-xl font-mono text-xs sm:text-sm font-extrabold focus:outline-none focus:ring-1 cursor-pointer ${
                          isDark
                            ? 'neu-inset text-cyan-300 bg-[#0e1422] border border-slate-800/80 focus:ring-cyan-500'
                            : 'bg-white text-slate-950 border border-slate-300 focus:ring-slate-950'
                        }`}
                        style={{ colorScheme: isDark ? 'dark' : 'light' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal / Drawer Footer - Fixed and Always Visible at Bottom */}
            <div className={`px-3.5 py-3 sm:px-6 sm:py-4 border-t ${
              isDark ? 'border-slate-800/90 bg-[#09101d] sm:bg-[#111a2c]' : 'border-slate-300 bg-white'
            } flex items-center justify-between gap-2.5 sm:gap-4 shrink-0`}>
              <button
                type="button"
                onClick={handleClose}
                className={`h-9 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl neu-btn-raised text-xs sm:text-sm ${
                  isDark ? 'text-slate-300' : 'text-slate-700 font-bold'
                } font-bold cursor-pointer active:scale-95 shrink-0`}
              >
                Cancel
              </button>

              <TouchButton
                variant="primary"
                size="md"
                disabled={conflictInfo.hasConflict}
                type="submit"
                className="text-xs sm:text-base px-4 sm:px-8 h-9 sm:h-11 flex-1 max-w-[280px] sm:max-w-[340px]"
              >
                Confirm ({qty} {item.unit || 'unit'}s)
              </TouchButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
