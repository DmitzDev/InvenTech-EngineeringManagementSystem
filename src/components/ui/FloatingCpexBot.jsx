import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  X,
  Send,
  User,
  Settings,
  Plus,
  Check,
  Loader2,
  Minimize2,
  RotateCcw,
  ShieldCheck,
  Calendar,
  Clock,
  Layers,
  Terminal,
  Activity,
  Cpu,
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import { askCpexAi, getStoredApiKey } from '../../services/cpexAiService';
import { getInventory } from '../../data/equipmentData';
import CpexSettingsModal from '../steps/CpexSettingsModal';
import { STANDARD_TIME_SLOTS, FACULTY_MEMBERS } from '../../data/facultyData';
import { handleStudentIdChange, isValidStudentId } from '../../utils/studentIdFormatter';

// Quick-Action Command Presets for CPEX
const QUICK_ACTION_COMMANDS = [
  { label: '📦 Check Tool Availability', prompt: 'Check tool availability in the laboratory inventory' },
  { label: '📅 Reserve Lab Equipment', prompt: 'Gusto ko magpa-reserve ng equipment para sa laboratory' },
  { label: '⚡ How to Return Equipment', prompt: 'How to return equipment and obtain laboratory clearance' },
  { label: '⚠️ Report Damaged Hardware', prompt: 'Report damaged hardware and safety protocols' },
];

// Rich Markdown Text Formatter for CPEX Terminal
function FormattedCpexText({ text, isDark }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 font-mono text-[11px] sm:text-xs leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Section Headers (### or [TAG])
        if (trimmed.startsWith('###') || (trimmed.startsWith('[') && trimmed.includes(']'))) {
          const headerText = trimmed.replace(/^###\s*/, '');
          return (
            <div
              key={idx}
              className={`font-mono font-black text-xs sm:text-sm tracking-wider uppercase flex items-center gap-1.5 pt-1 pb-0.5 border-b ${
                isDark
                  ? 'text-cyan-400 border-cyan-500/30'
                  : 'text-blue-700 border-blue-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 shrink-0" />
              <span>{headerText}</span>
            </div>
          );
        }

        // Bullet items
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const cleanLine = trimmed.replace(/^[•\-*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className={`shrink-0 font-bold ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>▸</span>
              <span className="flex-1">
                {parseFormattedSpans(cleanLine, isDark)}
              </span>
            </div>
          );
        }

        // Numbered lists
        if (/^\d+\./.test(trimmed)) {
          const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className={`font-mono font-bold shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                {numMatch[1]}.
              </span>
              <span className="flex-1">
                {parseFormattedSpans(numMatch[2], isDark)}
              </span>
            </div>
          );
        }

        return <div key={idx}>{parseFormattedSpans(trimmed, isDark)}</div>;
      })}
    </div>
  );
}

// Parses inline bolding **text**, code blocks `code`, and [TAG] badges
function parseFormattedSpans(text, isDark) {
  const parts = [];
  let remaining = text;
  let keyIdx = 0;

  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[A-Z0-9-_\s]{4,}\])/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={keyIdx++}>{remaining.slice(lastIndex, match.index)}</span>
      );
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={keyIdx++} className={isDark ? 'text-white font-extrabold' : 'text-slate-950 font-black'}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={keyIdx++}
          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
            isDark
              ? 'bg-[#060c18] text-cyan-300 border-cyan-500/30'
              : 'bg-slate-100 text-blue-700 border-slate-300'
          }`}
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[') && token.endsWith(']')) {
      parts.push(
        <span
          key={keyIdx++}
          className={`inline-block px-1.5 py-0.2 rounded font-mono font-bold text-[9.5px] border ${
            isDark
              ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/40'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          {token}
        </span>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < remaining.length) {
    parts.push(<span key={keyIdx++}>{remaining.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : text;
}

// In-Chat Interactive Reservation Form Component (Accurately Synced to Borrower Form Workflow)
function InChatReservationForm({ initialItem, isDark, onReservationSubmitted }) {
  const { borrower, addReservation, checkReservationConflict, showToast } = useTransaction();
  const inventory = getInventory();

  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Hardware & Schedule Selection
  const [selectedItemId, setSelectedItemId] = useState(initialItem?.id || (inventory[0]?.id || 'ce-001'));
  const [qty, setQty] = useState(1);
  const [reserveDate, setReserveDate] = useState(getTomorrowDate());
  const [timeSlot, setTimeSlot] = useState(STANDARD_TIME_SLOTS[0]);
  const [purpose, setPurpose] = useState(borrower.purpose || 'Laboratory Class Experiment');

  // 2. Student & Academic Information (Identical to BorrowerForm.jsx)
  const [studentId, setStudentId] = useState(borrower.studentId || '');
  const [studentName, setStudentName] = useState(borrower.groupLeader || '');
  const [program, setProgram] = useState(borrower.program || 'BSCPE');
  const [isOtherProgram, setIsOtherProgram] = useState(
    Boolean(borrower.program && !['BSCPE', 'BSCE', 'BSCEE', 'BSECE'].includes(borrower.program.toUpperCase()))
  );
  const [customProgram, setCustomProgram] = useState(
    borrower.program && !['BSCPE', 'BSCE', 'BSCEE', 'BSECE'].includes(borrower.program.toUpperCase())
      ? borrower.program
      : ''
  );
  const [yearLevel, setYearLevel] = useState('3');
  const [semester, setSemester] = useState('1');
  const [section, setSection] = useState('01');
  const [courseCode, setCourseCode] = useState(borrower.courseCode || 'CPEC311');
  const [groupNo, setGroupNo] = useState(borrower.groupNo || '1');
  const [instructor, setInstructor] = useState(borrower.instructor || 'Engr. Jin Benir Macaranas');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const currentItem = inventory.find((i) => i.id === selectedItemId) || inventory[0] || {};
  const conflictInfo = checkReservationConflict(currentItem.id, reserveDate, timeSlot, qty, currentItem.stock || 10);

  const handleProgramChange = (val) => {
    if (val === 'OTHERS') {
      setIsOtherProgram(true);
      setCustomProgram('');
      setProgram('');
    } else {
      setIsOtherProgram(false);
      setCustomProgram('');
      setProgram(val);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanId = studentId.replace(/\D/g, '');
    if (cleanId.length !== 9) {
      showToast('Student ID must be exactly 9 digits (e.g. 23-1374-693)', 'error');
      return;
    }

    if (!studentName.trim()) {
      showToast('Please enter Reserving Student / Group Leader Name', 'error');
      return;
    }

    const effectiveProgram = isOtherProgram ? customProgram.trim() : program.trim();
    if (!effectiveProgram) {
      showToast('Please specify Academic Program', 'error');
      return;
    }

    if (!courseCode.trim()) {
      showToast('Please enter Course Code / Subject', 'error');
      return;
    }

    if (!instructor.trim()) {
      showToast('Please enter Laboratory Instructor / Professor name', 'error');
      return;
    }

    if (conflictInfo.hasConflict) {
      showToast(`Conflict! Only ${conflictInfo.availableSlots} units available for this time slot.`, 'error');
      return;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newReservation = {
      id: `RES-${(currentItem.tagCode || 'CPEX').slice(0, 4)}-${randomSuffix}`,
      itemId: currentItem.id,
      tagCode: currentItem.tagCode,
      name: currentItem.name,
      category: currentItem.category,
      lab: currentItem.lab,
      unit: currentItem.unit || 'pc',
      qty,
      studentId: studentId.trim(),
      studentName: studentName.trim().toUpperCase(),
      program: effectiveProgram.toUpperCase(),
      yearLevel: `${yearLevel}${yearLevel === '1' ? 'st' : yearLevel === '2' ? 'nd' : yearLevel === '3' ? 'rd' : 'th'} Year`,
      semester: semester === '1' ? '1st Sem' : semester === '2' ? '2nd Sem' : 'Summer',
      section: section || '01',
      courseCode: courseCode.trim().toUpperCase(),
      groupNo: String(groupNo || '1'),
      instructor: instructor.trim(),
      purpose: purpose.trim(),
      reserveDate,
      timeSlot: timeSlot.trim(),
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
    setSubmittedData(newReservation);
    setIsSubmitted(true);
    if (onReservationSubmitted) onReservationSubmitted(newReservation);
    showToast(`Advance Reservation ${newReservation.id} queued successfully!`, 'success');
  };

  if (isSubmitted && submittedData) {
    return (
      <div className={`mt-2 p-3 sm:p-4 rounded-xl border space-y-3 text-center animate-fade-in font-mono ${
        isDark ? 'bg-[#030914] border-cyan-500/50 text-slate-100' : 'bg-sky-50 border-sky-300 text-sky-950'
      }`}>
        <div className="flex items-center justify-center gap-1.5 text-cyan-400 font-bold text-xs sm:text-sm">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>[CPEX.SYS // ADVANCE RESERVATION QUEUED]</span>
        </div>

        <p className="text-[11px] text-slate-300">
          Ref ID: <strong className="font-mono text-cyan-300 font-bold text-xs">{submittedData.id}</strong>
        </p>

        <div className="p-3 rounded-xl bg-[#071324] border border-slate-800 text-[11px] text-left space-y-1.5 leading-relaxed">
          <div><span className="text-slate-400">Apparatus:</span> <strong className="text-white">{submittedData.name} ({submittedData.qty} {submittedData.unit}s)</strong></div>
          <div><span className="text-slate-400">Tag Code:</span> <strong className="text-cyan-300 font-mono">[{submittedData.tagCode}]</strong></div>
          <div><span className="text-slate-400">Target Schedule:</span> <strong className="text-cyan-300">{submittedData.reserveDate} • {submittedData.timeSlot}</strong></div>
          <div><span className="text-slate-400">Student Borrower:</span> <strong className="text-white">{submittedData.studentName} ({submittedData.studentId})</strong></div>
          <div><span className="text-slate-400">Classification:</span> <strong className="text-slate-200">{submittedData.program} - {submittedData.yearLevel} (Sec {submittedData.section})</strong></div>
          <div><span className="text-slate-400">Subject & Group:</span> <strong className="text-slate-200">{submittedData.courseCode} • Group #{submittedData.groupNo}</strong></div>
          <div><span className="text-slate-400">Laboratory Faculty:</span> <strong className="text-white">{submittedData.instructor}</strong></div>
          <div><span className="text-slate-400">Purpose:</span> <strong className="text-slate-200">{submittedData.purpose}</strong></div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold px-1">
          <span>⚡ Synced to Custodian Counter Terminal</span>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">PENDING REVIEW</span>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsSubmitted(false);
            setSubmittedData(null);
          }}
          className="w-full h-8 rounded-lg font-mono font-bold text-[10.5px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer uppercase"
        >
          + Queue Another Apparatus Reservation
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`mt-2 p-3 sm:p-3.5 rounded-2xl border space-y-2.5 text-xs font-mono ${
      isDark ? 'bg-[#070e1b] border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
    }`}>
      {/* Form Header */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <span className={`font-black text-xs flex items-center gap-1.5 ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>
          <Calendar className="w-3.5 h-3.5" />
          <span>[CPEX // ADVANCE APPARATUS RESERVATION]</span>
        </span>
        <span className="text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
          BORROW FORMAT
        </span>
      </div>

      {/* 1. Apparatus & Qty Selection */}
      <div className="space-y-1">
        <label className="block text-[9.5px] font-bold text-slate-400 uppercase">Select Hardware Apparatus *</label>
        <div className="grid grid-cols-4 gap-1.5">
          <div className="col-span-3">
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className={`w-full h-8 px-2 rounded-lg text-xs font-semibold focus:outline-none ${
                isDark ? 'bg-[#0c1527] border border-slate-700 text-slate-100' : 'bg-white border border-slate-300 text-slate-900'
              }`}
            >
              {inventory.map((item) => (
                <option key={item.id} value={item.id} className={isDark ? 'bg-[#0c1527] text-white' : 'bg-white text-black'}>
                  [{item.tagCode}] {item.name} ({item.stock} {item.unit}s)
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="number"
              min={1}
              max={currentItem.stock || 5}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(currentItem.stock || 5, parseInt(e.target.value) || 1)))}
              title="Quantity to Reserve"
              className={`w-full h-8 px-2 text-center rounded-lg text-xs font-mono font-bold ${
                isDark ? 'bg-[#0c1527] border border-slate-700 text-slate-100' : 'bg-white border border-slate-300 text-slate-900'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 2. Schedule: Date & Timeslot */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5 uppercase">Target Reservation Date *</label>
          <input
            type="date"
            min={todayStr}
            value={reserveDate}
            onChange={(e) => setReserveDate(e.target.value)}
            className={`w-full h-8 px-2 rounded-lg text-xs font-mono font-bold ${
              isDark ? 'bg-[#0c1527] border border-slate-700 text-slate-100' : 'bg-white border border-slate-300 text-slate-900'
            }`}
          />
        </div>

        <div>
          <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5 uppercase">Laboratory Timeslot *</label>
          <select
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            className={`w-full h-8 px-1.5 rounded-lg text-[11px] font-mono font-bold ${
              isDark ? 'bg-[#0c1527] border border-slate-700 text-slate-100' : 'bg-white border border-slate-300 text-slate-900'
            }`}
          >
            {STANDARD_TIME_SLOTS.map((slot, i) => (
              <option key={i} value={slot} className={isDark ? 'bg-[#0c1527] text-white' : 'bg-white text-black'}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Student Identification (Student ID + Full Name) */}
      <div className="grid grid-cols-5 gap-2">
        <div className="col-span-2">
          <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5 uppercase">Student ID *</label>
          <input
            type="text"
            maxLength={11}
            value={studentId}
            onChange={(e) => setStudentId(handleStudentIdChange(e.target.value, studentId))}
            placeholder="23-1374-693"
            className={`w-full h-8 px-2 rounded-lg text-xs font-mono font-bold tracking-wider ${
              isDark ? 'bg-[#0c1527] border border-slate-700 text-cyan-300 placeholder-slate-600' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="col-span-3">
          <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5 uppercase">Reserving Student Name *</label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value.toUpperCase())}
            placeholder="JUAN DELA CRUZ"
            className={`w-full h-8 px-2 rounded-lg text-xs uppercase font-bold ${
              isDark ? 'bg-[#0c1527] border border-slate-700 text-slate-100 placeholder-slate-600' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* 4. Academic Program & Classification (Matches BorrowerForm with in-place OTHERS) */}
      <div className="grid grid-cols-4 gap-1.5">
        <div className="col-span-2">
          <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5 uppercase">Academic Program *</label>
          {isOtherProgram ? (
            <input
              type="text"
              autoFocus
              value={customProgram}
              onChange={(e) => setCustomProgram(e.target.value.toUpperCase())}
              placeholder="ENTER PROGRAM (e.g. BSIT)"
              className={`w-full h-8 px-2 rounded-lg text-[11px] font-mono font-bold ${
                isDark ? 'bg-[#0c1527] border border-cyan-500 text-cyan-300' : 'bg-white border border-blue-400 text-slate-900'
              }`}
            />
          ) : (
            <select
              value={program}
              onChange={(e) => handleProgramChange(e.target.value)}
              className={`w-full h-8 px-1.5 rounded-lg text-[11px] font-bold ${
                isDark ? 'bg-[#0c1527] border border-slate-700 text-slate-100' : 'bg-white border border-slate-300 text-slate-900'
              }`}
            >
              <option value="BSCPE">BS Computer Engineering (BSCpE)</option>
              <option value="BSCE">BS Civil Engineering (BSCE)</option>
              <option value="BSCEE">BS Ceramic Engineering (BSCEE)</option>
              <option value="BSECE">BS Electronics Engineering (BSECE)</option>
              <option value="OTHERS">Others (Type Program...)</option>
            </select>
          )}
        </div>

        <div>
          <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5 uppercase">Year Level</label>
          <select
            value={yearLevel}
            onChange={(e) => setYearLevel(e.target.value)}
            className={`w-full h-8 px-1.5 rounded-lg text-[11px] font-bold ${
              isDark ? 'bg-[#0c1527] border border-slate-700 text-slate-100' : 'bg-white border border-slate-300 text-slate-900'
            }`}
          >
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>

        <div>
          <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5 uppercase">Section</label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className={`w-full h-8 px-1.5 rounded-lg text-[11px] font-bold ${
              isDark ? 'bg-[#0c1527] border border-slate-700 text-slate-100' : 'bg-white border border-slate-300 text-slate-900'
            }`}
          >
            <option value="01">Sec 01</option>
            <option value="02">Sec 02</option>
            <option value="03">Sec 03</option>
            <option value="04">Sec 04</option>
          </select>
        </div>
      </div>

      {/* 5. Subject Code, Group No, & Faculty */}
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-2">
          <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5 uppercase">Course Code *</label>
          <input
            type="text"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
            placeholder="CPEC311"
            className={`w-full h-8 px-2 rounded-lg text-xs font-bold uppercase ${
              isDark ? 'bg-[#0c1527] border border-slate-700 text-slate-100' : 'bg-white border border-slate-300 text-slate-900'
            }`}
          />
        </div>

        <div>
          <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5 uppercase">Group #</label>
          <input
            type="text"
            value={groupNo}
            onChange={(e) => setGroupNo(e.target.value)}
            placeholder="1"
            className={`w-full h-8 px-2 text-center rounded-lg text-xs font-mono font-bold ${
              isDark ? 'bg-[#0c1527] border border-slate-700 text-slate-100' : 'bg-white border border-slate-300 text-slate-900'
            }`}
          />
        </div>

        <div>
          <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5 uppercase">Semester</label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className={`w-full h-8 px-1.5 rounded-lg text-[11px] font-bold ${
              isDark ? 'bg-[#0c1527] border border-slate-700 text-slate-100' : 'bg-white border border-slate-300 text-slate-900'
            }`}
          >
            <option value="1">1st Sem</option>
            <option value="2">2nd Sem</option>
            <option value="3">Summer</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5 uppercase">Laboratory Instructor / Professor *</label>
        <input
          type="text"
          list="cpex-faculty-list"
          value={instructor}
          onChange={(e) => setInstructor(e.target.value)}
          placeholder="Engr. Jin Benir Macaranas"
          className={`w-full h-8 px-2 rounded-lg text-xs font-bold ${
            isDark ? 'bg-[#0c1527] border border-slate-700 text-slate-100' : 'bg-white border border-slate-300 text-slate-900'
          }`}
        />
        <datalist id="cpex-faculty-list">
          {FACULTY_MEMBERS.map((fac, idx) => (
            <option key={idx} value={fac} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="block text-[9.5px] font-bold text-slate-400 mb-0.5 uppercase">Reservation Purpose</label>
        <input
          type="text"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Laboratory Class Experiment"
          className={`w-full h-8 px-2 rounded-lg text-xs font-medium ${
            isDark ? 'bg-[#0c1527] border border-slate-700 text-slate-100' : 'bg-white border border-slate-300 text-slate-900'
          }`}
        />
      </div>

      <button
        type="submit"
        className="w-full h-9 rounded-lg font-mono font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
      >
        <Zap className="w-3.5 h-3.5 fill-current" />
        <span>Submit Advance Telemetry Reservation</span>
      </button>
    </form>
  );
}

export default function FloatingCpexBot() {
  const { theme, selectedLab, addMultipleToCart, showToast, currentStep, openCartDrawer, cart } = useTransaction();
  const isDark = theme === 'dark';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'init-cpex-1',
      sender: 'cpex',
      text: `Hello! I am **CPEX** (Computer Programmed Engineering eXpert), your laboratory assistant.\n\n• **Equipment & Stock:** Oscilloscopes, multimeters, 74xx TTL ICs, microcontrollers, and apparatus bins.\n• **Rules & Guidelines:** Maximum 5 items per student group, return within class period.\n• **Procedures:** Equipment return clearance and reporting damaged hardware.\n\nHow can I help you today?`,
      source: 'offline',
      recommendedItems: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [addedBundleKeys, setAddedBundleKeys] = useState([]);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const refreshKeyStatus = () => {
    setHasApiKey(Boolean(getStoredApiKey()));
  };

  useEffect(() => {
    refreshKeyStatus();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleResetChat = () => {
    setMessages([
      {
        id: `cpex-reboot-${Date.now()}`,
        sender: 'cpex',
        text: `Conversation restarted. How can I help you with your laboratory equipment or experiment today?`,
        source: 'offline',
        recommendedItems: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setAddedBundleKeys([]);
    showToast('CPEX conversation reset.', 'info');
  };

  const handleSendMessage = async (customPrompt) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputText('');
    setIsLoading(true);

    try {
      const response = await askCpexAi(textToSend, selectedLab, messages);

      const cpexMsg = {
        id: `cpex-${Date.now()}`,
        sender: 'cpex',
        text: response.text,
        source: response.source || 'offline',
        recommendedItems: response.recommendedItems || [],
        isReservationIntent: response.isReservationIntent || false,
        matchedReservationItem: response.matchedReservationItem || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, cpexMsg]);
    } catch (error) {
      console.error('[CPEX.SYS] Error fetching response:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `cpex-err-${Date.now()}`,
          sender: 'cpex',
          text: '### [CPEX.SYS // TELEMETRY ANOMALY]\nTemporary communication disruption detected. Re-initiating query parser or select an offline action below.',
          source: 'offline',
          recommendedItems: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItemsToCart = (items, bundleKey) => {
    if (!items || items.length === 0) return;
    addMultipleToCart(items);
    if (bundleKey) {
      setAddedBundleKeys((prev) => [...prev, bundleKey]);
    }
    showToast(`Added ${items.length} apparatus item(s) to your borrow cart!`, 'success');
  };

  const totalUnitsInCart = cart ? cart.reduce((sum, item) => sum + item.qty, 0) : 0;

  // Hide Chatbot during Step 0 (WelcomeScreen)
  if (currentStep === 0) return null;

  return (
    <>
      {/* 1. FLOATING CPEX TACTILE ACTION HUB */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 select-none flex items-center gap-2.5">
          {/* Mobile-Only Floating Cart Button */}
          {currentStep === 3 && (
            <div className="sm:hidden relative shrink-0">
              <button
                type="button"
                onClick={openCartDrawer}
                title="Open Borrow Cart"
                className="group relative w-11 h-11 rounded-full border border-cyan-500/50 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden bg-white"
              >
                <img
                  src="/images/engrCartLogo.jpg"
                  alt="Engineering Cart"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </button>

              {totalUnitsInCart > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-mono font-black text-[10px] flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.6)] border border-slate-950 animate-fade-in z-20 pointer-events-none">
                  {totalUnitsInCart}
                </span>
              )}
            </div>
          )}

          {/* CPEX AI Trigger Button: Pure Edge-to-Edge Circle Icon */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              title="Chat with CPEX (Computer Programmed Engineering eXpert)"
              className="group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 shadow-[0_4px_16px_rgba(0,0,0,0.4)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.8)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden bg-slate-950 flex items-center justify-center"
            >
              <img
                src="/images/image_0.png"
                alt="CPEX Cybernetic Avatar"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </button>
            <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-950 pointer-events-none z-20 shadow-xs animate-pulse" />
          </div>
        </div>
      )}

      {/* 2. CHATBOT INTERFACE DIALOG WINDOW */}
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <div
            onClick={() => setIsOpen(false)}
            className="hidden sm:block fixed inset-0 z-40 bg-black/40 backdrop-blur-xs animate-fade-in"
          />

          {/* Dialog Container */}
          <div
            className={`cpex-chat-shell fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[470px] sm:max-w-[calc(100vw-3rem)] sm:h-[640px] sm:max-h-[85vh] z-50 rounded-none sm:rounded-3xl flex flex-col overflow-hidden animate-slide-up backdrop-blur-2xl select-none shadow-2xl border-0 sm:border-2 ${
              isDark
                ? 'bg-[#090e18]/95 border-slate-700 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.9)]'
                : 'bg-white/95 border-slate-300 text-slate-900 shadow-2xl'
            }`}
          >
            {/* Header Strip */}
            <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
              isDark ? 'bg-[#0c1424] border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar Badge */}
                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-slate-300 dark:border-slate-700 shadow-sm bg-slate-950">
                  <img
                    src="/images/image_0.png"
                    alt="CPEX Avatar"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-cyan-400 border border-slate-950" />
                </div>

                <div className="min-w-0">
                  <h3 className={`text-sm sm:text-base font-extrabold truncate ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    CPEX
                  </h3>
                  <p className={`text-[11px] truncate font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Computer Programmed Engineering eXpert
                  </p>
                </div>
              </div>

              {/* Controls: Reset and Minimize only (Settings removed for security) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleResetChat}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 border ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                  title="Restart Telemetry Session"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 border ${
                    isDark
                      ? 'bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 border-slate-700'
                      : 'bg-white hover:bg-rose-100 text-slate-700 hover:text-rose-700 border-slate-300'
                  }`}
                  title="Minimize CPEX"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Monospace Quick-Action Suggestion Pills Tray */}
            <div className={`px-3 py-2 border-b overflow-x-auto flex items-center gap-1.5 no-scrollbar shrink-0 ${
              isDark ? 'bg-[#080d17] border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              {QUICK_ACTION_COMMANDS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q.prompt)}
                  disabled={isLoading}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all active:scale-95 shrink-0 cursor-pointer border ${
                    isDark
                      ? 'bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border-slate-700/80 hover:border-cyan-500/50'
                      : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300 shadow-xs'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
              {messages.map((msg) => {
                const isCpex = msg.sender === 'cpex';
                const bundleKey = `bundle-${msg.id}`;
                const isAlreadyAdded = addedBundleKeys.includes(bundleKey);

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 text-xs leading-relaxed ${
                      isCpex ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    {/* Bot Avatar Thumbnail */}
                    {isCpex && (
                      <div className="w-7 h-7 rounded-lg overflow-hidden border border-cyan-500/40 bg-slate-950 shrink-0 mt-0.5 shadow-sm">
                        <img
                          src="/images/image_0.png"
                          alt="CPEX"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] rounded-xl p-3 space-y-2.5 ${
                        isCpex
                          ? isDark
                            ? 'bg-slate-950/70 border border-slate-800 text-slate-100'
                            : 'bg-slate-100 border border-slate-300 text-slate-900'
                          : isDark
                          ? 'bg-slate-800 text-white border-2 border-slate-700'
                          : 'bg-white text-slate-950 border-2 border-slate-300 shadow-sm'
                      }`}
                    >
                      {/* Message Content */}
                      <div className="leading-relaxed text-[11px] sm:text-xs">
                        {isCpex ? (
                          <FormattedCpexText text={msg.text} isDark={isDark} />
                        ) : (
                          <div className="whitespace-pre-wrap font-mono font-bold">
                            {msg.text}
                          </div>
                        )}
                      </div>

                      {/* 1-Tap Cart Injection Card */}
                      {isCpex && msg.recommendedItems && msg.recommendedItems.length > 0 && (
                        <div className={`mt-2 p-2.5 rounded-xl border space-y-2 font-mono ${
                          isDark
                            ? 'bg-[#050b16] border-cyan-500/30 shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]'
                            : 'bg-white border-slate-300 shadow-sm'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-black flex items-center gap-1.5 ${
                              isDark ? 'text-cyan-400' : 'text-blue-800'
                            }`}>
                              <Layers className="w-3.5 h-3.5" />
                              <span>HARDWARE DETECTED ({msg.recommendedItems.length})</span>
                            </span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                              AUTO-PARSED
                            </span>
                          </div>

                          <div className="space-y-1">
                            {msg.recommendedItems.map((item) => (
                              <div
                                key={item.id}
                                className={`text-[10px] flex items-center justify-between py-1 px-2 rounded-lg ${
                                  isDark ? 'bg-[#091222] text-slate-200' : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[9px] ${
                                    isDark ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30' : 'bg-blue-50 text-blue-800 border border-blue-200'
                                  }`}>
                                    {item.tagCode}
                                  </span>
                                  <span className="truncate font-semibold">{item.name}</span>
                                </div>
                                <span className="font-mono text-slate-400 shrink-0 text-[9px] ml-1">
                                  {item.stock} {item.unit || 'pcs'}
                                </span>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddItemsToCart(msg.recommendedItems, bundleKey)}
                            disabled={isAlreadyAdded}
                            className={`w-full py-2 px-3 rounded-lg text-[11px] font-mono font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md mt-1 cursor-pointer uppercase tracking-wider ${
                              isAlreadyAdded
                                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 cursor-default'
                                : 'bg-cyan-600 hover:bg-cyan-500 text-white active:scale-98 shadow-cyan-900/30'
                            }`}
                          >
                            {isAlreadyAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Injected into Borrow Cart</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>+ Inject {msg.recommendedItems.length} Item(s) into Cart</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* In-Chat Interactive Advance Reservation Form */}
                      {isCpex && msg.isReservationIntent && (
                        <InChatReservationForm
                          initialItem={msg.matchedReservationItem}
                          isDark={isDark}
                          onReservationSubmitted={() => {
                            setTimeout(scrollToBottom, 120);
                          }}
                        />
                      )}

                      <div className={`text-[8.5px] font-mono text-right ${
                        isCpex ? (isDark ? 'text-slate-500' : 'text-slate-400') : 'text-slate-400'
                      }`}>
                        {msg.timestamp}
                      </div>
                    </div>

                    {!isCpex && (
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm font-mono text-xs">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing Loader */}
              {isLoading && (
                <div className="flex gap-2.5 text-xs justify-start items-center animate-fade-in font-mono">
                  <div className="w-7 h-7 rounded-lg overflow-hidden border border-cyan-500/40 bg-slate-950 shrink-0">
                    <img
                      src="/images/image_0.png"
                      alt="CPEX"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className={`rounded-xl px-3 py-2 flex items-center gap-2 border ${
                    isDark ? 'bg-slate-950/70 border-slate-800 text-cyan-400' : 'bg-slate-100 border-slate-300 text-blue-700'
                  }`}>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span className="text-[10.5px] font-bold">
                      CPEX parsing engineering telemetry...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Command Input Tray */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className={`p-3 border-t flex items-center gap-2 shrink-0 ${
                isDark ? 'bg-[#0a101d] border-slate-800' : 'bg-slate-100 border-slate-300'
              }`}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="ENTER COMMAND OR QUERY TO CPEX..."
                className={`flex-1 h-11 px-4 rounded-xl text-xs font-mono font-bold transition-all focus:outline-none ${
                  isDark
                    ? 'bg-[#050912] border border-slate-800 text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-cyan-500'
                    : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500'
                }`}
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="h-11 px-4 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer shadow-md shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white uppercase tracking-wider"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">EXEC</span>
              </button>
            </form>
          </div>
        </>
      )}

      {/* Settings Modal */}
      <CpexSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onKeySaved={refreshKeyStatus}
      />
    </>
  );
}
