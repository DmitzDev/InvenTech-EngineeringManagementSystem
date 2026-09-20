import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Clock,
  AlertTriangle,
  ShieldCheck,
  X,
  Check,
  Users,
  GraduationCap,
  UserCheck,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from '../ui/TouchButton';
import {
  FACULTY_MEMBERS,
  STANDARD_TIME_SLOTS,
  ENGINEERING_PROGRAMS,
  SAMPLE_STUDENTS,
  COMMON_COURSE_CODES,
} from '../../data/facultyData';

export default function ReservationModal({ item, isOpen, onClose }) {
  const { borrower, addReservation, checkReservationConflict, showToast } = useTransaction();

  // Tomorrow's date formatted as YYYY-MM-DD
  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [reserveDate, setReserveDate] = useState(getTomorrowDate());
  const [timeSlot, setTimeSlot] = useState(STANDARD_TIME_SLOTS[1]);
  const [qty, setQty] = useState(1);
  const [studentName, setStudentName] = useState(borrower.groupLeader || '');
  const [program, setProgram] = useState(borrower.program || 'BSCE');
  const [courseCode, setCourseCode] = useState(borrower.courseCode || 'CEMAT1L');
  const [groupNo, setGroupNo] = useState(borrower.groupNo || '1');
  const [instructor, setInstructor] = useState(borrower.instructor || 'Engr. Jin Benir Macaranas');

  const [confirmedReservation, setConfirmedReservation] = useState(null);

  useEffect(() => {
    if (borrower.groupLeader) setStudentName(borrower.groupLeader);
    if (borrower.program) setProgram(borrower.program);
    if (borrower.courseCode) setCourseCode(borrower.courseCode);
    if (borrower.groupNo) setGroupNo(borrower.groupNo);
    if (borrower.instructor) setInstructor(borrower.instructor);
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

  if (!isOpen || !item) return null;

  // Real-time conflict check
  const conflictInfo = checkReservationConflict(item.id, reserveDate, timeSlot, qty, item.stock);

  const handleConfirmReservation = (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      showToast('Please enter the Reserving Student Name', 'error');
      return;
    }
    if (!instructor.trim()) {
      showToast('Please enter the Laboratory Instructor / Professor name', 'error');
      return;
    }
    if (!timeSlot.trim()) {
      showToast('Please enter or select a Laboratory Time Schedule', 'error');
      return;
    }

    if (conflictInfo.hasConflict) {
      showToast(
        `Double-booking conflict! Only ${conflictInfo.availableSlots} units available for this time slot.`,
        'error'
      );
      return;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newReservation = {
      id: `RES-${(item.tagCode || 'UDD').slice(0, 4)}-${randomSuffix}`,
      itemId: item.id,
      tagCode: item.tagCode,
      name: item.name,
      unit: item.unit || 'pc',
      reserveDate,
      timeSlot: timeSlot.trim(),
      qty,
      studentName: studentName.trim(),
      program: program.trim().toUpperCase(),
      courseCode: courseCode.trim().toUpperCase(),
      groupNo: String(groupNo),
      instructor: instructor.trim(),
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
      {/* Click-away backdrop for mobile drawer and kiosk dialog */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleClose}
      />

      {/* Sidebar Drawer Container on Phone (Slides from Left) / Centered Card on 15" Kiosk */}
      <div className="relative z-10 w-[88vw] max-w-[360px] sm:max-w-xl sm:w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] bg-[#0c1424] sm:bg-[#0c1527] border-r sm:border border-slate-700/80 shadow-[10px_0_35px_rgba(0,0,0,0.85)] sm:shadow-2xl sm:rounded-3xl flex flex-col overflow-hidden animate-slide-left-drawer sm:animate-none my-0 sm:my-auto">
        {/* Header - Pinned at top */}
        <div className="px-3.5 py-3 sm:px-6 sm:py-4 border-b border-slate-800/90 flex items-center justify-between bg-[#111a2c] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl neu-inset flex items-center justify-center text-cyan-400 shrink-0 shadow-sm">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-lg font-bold text-slate-100 truncate flex items-center gap-1.5">
                <span>Advance Reservation</span>
                <span className="sm:hidden text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
                  FORM
                </span>
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                Book lab apparatus in advance for upcoming class.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl neu-btn-raised text-slate-400 hover:text-white flex items-center justify-center active:scale-95 cursor-pointer shrink-0"
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
                  <h4 className="text-sm sm:text-lg font-bold text-emerald-400">Equipment Reserved Successfully!</h4>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Ref ID: <span className="font-mono font-bold text-cyan-400 text-xs sm:text-sm">{confirmedReservation.id}</span>
                  </p>
                </div>

                <div className="neu-inset rounded-xl sm:rounded-2xl p-3 sm:p-4 text-left space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Apparatus:</span>
                    <span className="font-bold text-slate-100 truncate max-w-[180px] sm:max-w-[320px]">{confirmedReservation.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Quantity:</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {confirmedReservation.qty} {confirmedReservation.unit}s
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Schedule:</span>
                    <span className="font-bold text-slate-100 truncate max-w-[180px] sm:max-w-[320px]">
                      {confirmedReservation.reserveDate} • {confirmedReservation.timeSlot}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Student:</span>
                    <span className="font-bold text-slate-100 truncate max-w-[180px] sm:max-w-[320px]">
                      {confirmedReservation.studentName} ({confirmedReservation.program} • G{confirmedReservation.groupNo})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Instructor:</span>
                    <span className="font-bold text-slate-100 truncate max-w-[180px] sm:max-w-[320px]">{confirmedReservation.instructor}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t border-slate-800 bg-[#09101d] sm:bg-[#111a2c] flex items-center justify-center shrink-0">
              <TouchButton variant="primary" size="md" onClick={handleClose} className="w-full sm:w-auto px-6 sm:px-10 py-2.5 sm:py-3 text-xs sm:text-base">
                Done & Back to Catalog
              </TouchButton>
            </div>
          </>
        ) : (
          <form onSubmit={handleConfirmReservation} className="flex flex-col flex-1 min-h-0">
            {/* Form Body - Smoothly scrollable with clear spacing */}
            <div className="p-3.5 sm:p-6 space-y-2.5 sm:space-y-4 overflow-y-auto flex-1 min-h-0">
              {/* 1. Item Header + Quantity Stepper */}
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl neu-inset flex items-center justify-between gap-2.5 sm:gap-4 bg-[#09101d]/60">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[8.5px] sm:text-xs font-mono font-bold text-cyan-400 uppercase neu-inset-sm px-1.5 sm:px-2 py-0.5 rounded">
                      {item.tagCode}
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono text-slate-400">
                      Stock: <strong className="text-emerald-400">{item.stock}</strong>
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-base font-bold text-slate-100 truncate leading-tight mt-1">{item.name}</h4>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-1 sm:gap-2 neu-inset rounded-lg sm:rounded-xl p-0.5 sm:p-1 shrink-0 bg-[#070d18]">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg neu-btn-raised text-slate-200 font-black flex items-center justify-center text-xs sm:text-base active:scale-95 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-5 sm:w-8 text-center font-mono font-black text-xs sm:text-base text-cyan-400">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(Math.min(item.stock, qty + 1))}
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg neu-btn-raised text-slate-200 font-black flex items-center justify-center text-xs sm:text-base active:scale-95 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 2. Date & Time Schedule Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <label className="block text-[10.5px] sm:text-xs font-bold text-slate-300 mb-1 sm:mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
                    <span>Reservation Date *</span>
                  </label>
                  <input
                    type="date"
                    value={reserveDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setReserveDate(e.target.value)}
                    className="w-full h-9 sm:h-11 px-2.5 sm:px-3 rounded-lg sm:rounded-xl neu-inset text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] sm:text-xs font-bold text-slate-300 mb-1 sm:mb-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
                    <span>Time Schedule *</span>
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full h-9 sm:h-11 px-2 sm:px-3 rounded-lg sm:rounded-xl neu-inset text-[11px] sm:text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-[#111a2c]"
                    required
                  >
                    {STANDARD_TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot} className="bg-[#111a2c] text-slate-100 text-xs sm:text-sm">
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Real-Time Conflict / Availability Pill */}
              <div className={`px-2.5 py-1.5 rounded-lg sm:rounded-xl text-[10.5px] sm:text-xs flex items-center justify-between ${
                conflictInfo.hasConflict
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
              }`}>
                <span className="flex items-center gap-1.5 font-semibold truncate">
                  {conflictInfo.hasConflict ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
                      <span>Slot Conflict! Only {conflictInfo.availableSlots} units left.</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                      <span>Available for Booking</span>
                    </>
                  )}
                </span>
                <span className="font-mono text-[10px] sm:text-xs shrink-0 ml-1 font-bold">
                  {conflictInfo.availableSlots} / {item.stock} free
                </span>
              </div>

              {/* 4. Student Name */}
              <div>
                <label className="block text-[10.5px] sm:text-xs font-bold text-slate-300 mb-1 sm:mb-1.5 flex items-center gap-1">
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
                  <span>Student Leader *</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Jason Cayabyab"
                  className="w-full h-9 sm:h-11 px-2.5 sm:px-3 rounded-lg sm:rounded-xl neu-inset text-xs sm:text-sm text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              {/* 5. Program & Course Row */}
              <div>
                <label className="block text-[10.5px] sm:text-xs font-bold text-slate-300 mb-1 sm:mb-1.5 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
                  <span>Program & Course Code</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  <select
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    className="h-9 sm:h-11 px-1.5 sm:px-2 rounded-lg sm:rounded-xl neu-inset text-[11px] sm:text-xs text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-[#111a2c]"
                  >
                    {ENGINEERING_PROGRAMS.map((p) => (
                      <option key={p.code} value={p.code} className="bg-[#111a2c] text-slate-100 text-xs sm:text-sm">
                        {p.code}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                    placeholder="Code (e.g. CEMAT1L)"
                    className="h-9 sm:h-11 px-2 sm:px-2.5 rounded-lg sm:rounded-xl neu-inset text-[11px] sm:text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* 6. Laboratory Instructor */}
              <div>
                <label className="block text-[10.5px] sm:text-xs font-bold text-slate-300 mb-1 sm:mb-1.5 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
                  <span>Laboratory Instructor / Professor *</span>
                </label>
                <input
                  type="text"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  placeholder="e.g. Engr. Jin Benir Macaranas"
                  className="w-full h-9 sm:h-11 px-2.5 sm:px-3 rounded-lg sm:rounded-xl neu-inset text-xs sm:text-sm text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>
            </div>

            {/* Modal / Drawer Footer - Fixed and Always Visible at Bottom */}
            <div className="px-3.5 py-3 sm:px-6 sm:py-4 border-t border-slate-800/90 bg-[#09101d] sm:bg-[#111a2c] flex items-center justify-between gap-2.5 sm:gap-4 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="h-9 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl neu-btn-raised text-xs sm:text-sm text-slate-300 font-bold cursor-pointer active:scale-95 shrink-0"
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
