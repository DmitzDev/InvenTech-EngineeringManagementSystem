import React, { useState, useEffect } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in select-none overflow-y-auto">
      <div className="neu-card rounded-3xl max-w-xl w-full shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85vh] overflow-hidden border border-slate-800 my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#111a2c] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-inset flex items-center justify-center text-cyan-400 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-100">
                  Advance Equipment Reservation
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full neu-inset-sm text-cyan-400 font-bold">
                  DUAL-INPUT (TYPE & SELECT)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Reserve lab apparatus in advance. You can either type custom details or tap quick presets.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl neu-btn-raised text-slate-400 hover:text-white flex items-center justify-center active:scale-95 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {confirmedReservation ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="space-y-4 text-center py-2 animate-fade-in">
                <div className="w-14 h-14 rounded-full neu-inset mx-auto flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>

                <div>
                  <h4 className="text-lg font-bold text-emerald-400">Equipment Reserved Successfully!</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Your reservation reference is{' '}
                    <span className="font-mono font-bold text-cyan-400">{confirmedReservation.id}</span>
                  </p>
                </div>

                <div className="neu-inset rounded-2xl p-4 text-left space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400 font-medium">Apparatus:</span>
                    <span className="font-bold text-slate-100">{confirmedReservation.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400 font-medium">Reserved Quantity:</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {confirmedReservation.qty} {confirmedReservation.unit}s
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400 font-medium">Scheduled Date:</span>
                    <span className="font-bold text-slate-100">{confirmedReservation.reserveDate}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400 font-medium">Time Schedule:</span>
                    <span className="font-bold text-cyan-400">{confirmedReservation.timeSlot}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400 font-medium">Student & Group:</span>
                    <span className="font-bold text-slate-100">
                      {confirmedReservation.studentName} ({confirmedReservation.program} • Group {confirmedReservation.groupNo})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Instructor:</span>
                    <span className="font-bold text-slate-100">{confirmedReservation.instructor}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800/80 bg-[#111a2c] flex items-center justify-center shrink-0">
              <TouchButton variant="primary" size="md" onClick={handleClose}>
                Done & Back to Catalog
              </TouchButton>
            </div>
          </>
        ) : (
          <form onSubmit={handleConfirmReservation} className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Selected Equipment Banner */}
              <div className="p-3.5 rounded-2xl neu-inset flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                    {item.tagCode}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate">{item.name}</h4>
                </div>
                <div className="text-right font-mono text-xs shrink-0">
                  <span className="text-slate-400">Total Stock: </span>
                  <span className="font-bold text-emerald-400">
                    {item.stock} {item.unit || 'unit'}s
                  </span>
                </div>
              </div>

              {/* Date & Time Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Reservation Date *</span>
                  </label>
                  <input
                    type="date"
                    value={reserveDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setReserveDate(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 rounded-xl neu-inset text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Time Schedule *</span>
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 rounded-xl neu-inset text-xs sm:text-sm text-cyan-300 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-[#111a2c]"
                    required
                  >
                    {STANDARD_TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot} className="bg-[#111a2c] text-slate-100">
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity Stepper & Anti-Double Booking Banner */}
              <div className="p-3.5 rounded-2xl neu-card-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-300">Quantity to Reserve</label>
                    <span className="text-[11px] text-slate-400">Units needed for your group</span>
                  </div>

                  <div className="flex items-center gap-2 neu-inset rounded-2xl p-1.5">
                    <button
                      type="button"
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl neu-btn-raised text-slate-200 font-extrabold flex items-center justify-center text-lg active:scale-95 cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-mono font-extrabold text-base text-cyan-400">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(Math.min(item.stock, qty + 1))}
                      className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl neu-btn-raised text-slate-200 font-extrabold flex items-center justify-center text-lg active:scale-95 cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Conflict Status */}
                {conflictInfo.hasConflict ? (
                  <div className="p-3 rounded-xl neu-inset-amber text-xs text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <div>
                      <span className="font-bold">Schedule Overlap Alert!</span>
                      <p className="text-[11px] text-amber-200 mt-0.5">
                        Only {conflictInfo.availableSlots} units remaining for this slot ({conflictInfo.existingCount} already booked).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl neu-inset flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Available for Booking</span>
                    </span>
                    <span className="font-mono text-slate-300 text-[11px]">
                      {conflictInfo.availableSlots} of {item.stock} units free
                    </span>
                  </div>
                )}
              </div>

              {/* Student Details & Group Info */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Reserving Student / Leader *</span>
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Jason Cayabyab"
                      className="w-full min-h-[48px] px-3.5 rounded-xl neu-inset text-xs sm:text-sm text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Program & Course Code</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={program}
                        onChange={(e) => setProgram(e.target.value)}
                        className="min-h-[48px] px-3 rounded-xl neu-inset text-xs text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-[#111a2c]"
                      >
                        {ENGINEERING_PROGRAMS.map((p) => (
                          <option key={p.code} value={p.code} className="bg-[#111a2c] text-slate-100">
                            {p.code}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={courseCode}
                        onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                        placeholder="Course Code"
                        className="min-h-[48px] px-3 rounded-xl neu-inset text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Laboratory Instructor */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Laboratory Instructor * (Type Name)</span>
                  </label>

                  <input
                    type="text"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    placeholder="e.g. Engr. Jin Benir Macaranas"
                    className="w-full min-h-[48px] px-3.5 rounded-xl neu-inset text-xs sm:text-sm text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pinned Modal Footer with 16px Anti-Fat-Finger Gap */}
            <div className="p-4 border-t border-slate-800/80 bg-[#111a2c] flex items-center justify-between gap-4 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="min-h-[48px] px-5 py-2.5 rounded-xl neu-btn-raised text-xs text-slate-300 font-bold cursor-pointer active:scale-95"
              >
                Cancel
              </button>

              <TouchButton
                variant="primary"
                size="md"
                disabled={conflictInfo.hasConflict}
                type="submit"
              >
                Confirm Advance Booking ({qty} Units)
              </TouchButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
