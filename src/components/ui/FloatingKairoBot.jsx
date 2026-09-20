import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, User, Settings, Plus, Check, Loader2, BookOpen, Layers, Minimize2, RotateCcw, Bot, ShieldCheck, Calendar, Clock, AlertTriangle, ShoppingBag } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import { askKairoAi, getStoredApiKey } from '../../services/kairoAiService';
import { getInventory } from '../../data/equipmentData';
import KairoSettingsModal from '../steps/KairoSettingsModal';

import {
  FACULTY_MEMBERS,
  STANDARD_TIME_SLOTS,
  ENGINEERING_PROGRAMS,
  SAMPLE_STUDENTS,
  COMMON_COURSE_CODES,
} from '../../data/facultyData';

// In-Chat Interactive Reservation Form Component with Dual-Input (Type & Select)
function InChatReservationForm({ initialItem, isDark, onReservationSubmitted }) {
  const { borrower, addReservation, checkReservationConflict, showToast } = useTransaction();
  const inventory = getInventory();

  // Tomorrow's date
  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [selectedItemId, setSelectedItemId] = useState(initialItem?.id || (inventory[0]?.id || 'ce-001'));
  const [reserveDate, setReserveDate] = useState(getTomorrowDate());
  const [timeSlot, setTimeSlot] = useState(STANDARD_TIME_SLOTS[1]);
  const [qty, setQty] = useState(1);
  const [studentName, setStudentName] = useState(borrower.groupLeader || '');
  const [program, setProgram] = useState(borrower.program || 'BSCE');
  const [courseCode, setCourseCode] = useState(borrower.courseCode || 'CEMAT1L');
  const [groupNo, setGroupNo] = useState(borrower.groupNo || '1');
  const [instructor, setInstructor] = useState(borrower.instructor || 'Engr. Jin Benir Macaranas');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState('');

  const currentItem = inventory.find((i) => i.id === selectedItemId) || inventory[0] || {};
  const conflictInfo = checkReservationConflict(currentItem.id, reserveDate, timeSlot, qty, currentItem.stock || 10);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      showToast('Please enter Reserving Student Name', 'error');
      return;
    }
    if (!instructor.trim()) {
      showToast('Please enter Laboratory Instructor / Professor name', 'error');
      return;
    }
    if (!timeSlot.trim()) {
      showToast('Please provide a Laboratory Time Schedule', 'error');
      return;
    }

    if (conflictInfo.hasConflict) {
      showToast(`Conflict! Only ${conflictInfo.availableSlots} units available for this time slot.`, 'error');
      return;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newReservation = {
      id: `RES-${(currentItem.tagCode || 'UDD').slice(0, 4)}-${randomSuffix}`,
      itemId: currentItem.id,
      tagCode: currentItem.tagCode,
      name: currentItem.name,
      unit: currentItem.unit || 'pc',
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
    setIsSubmitted(true);
    setSubmittedRef(newReservation.id);
    if (onReservationSubmitted) onReservationSubmitted(newReservation);
  };

  if (isSubmitted) {
    return (
      <div className={`mt-2 p-3 rounded-2xl border space-y-2 text-center animate-fade-in ${
        isDark ? 'bg-[#041224] border-emerald-500/40 text-slate-100' : 'bg-emerald-50 border-emerald-300 text-emerald-950'
      }`}>
        <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Advance Reservation Confirmed!</span>
        </div>
        <p className="text-[11px] text-slate-300">
          Ref ID: <strong className="font-mono text-cyan-400">{submittedRef}</strong>
        </p>
        <div className="p-2.5 rounded-xl bg-[#081b33]/80 border border-slate-800 text-[10.5px] text-left space-y-1">
          <div><span className="text-slate-400">Apparatus:</span> <strong className="text-slate-200">{currentItem.name} ({qty} {currentItem.unit}s)</strong></div>
          <div><span className="text-slate-400">Schedule:</span> <strong className="text-cyan-300">{reserveDate} • {timeSlot}</strong></div>
          <div><span className="text-slate-400">Student:</span> <strong className="text-slate-200">{studentName} ({program})</strong></div>
          <div><span className="text-slate-400">Faculty:</span> <strong className="text-slate-200">{instructor}</strong></div>
        </div>
        <p className="text-[9.5px] text-amber-300 font-medium">
          ⚡ Synced to Custodian Counter (Ready for clearance slip prep).
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`mt-2 p-3 rounded-2xl border space-y-2.5 text-xs ${
      isDark ? 'bg-[#050e1c] border-[#7fdcff]/30 text-slate-200 shadow-md' : 'bg-white border-[#bae6fd] text-slate-800 shadow-sm'
    }`}>
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
        <span className={`font-black text-[11px] flex items-center gap-1.5 ${isDark ? 'text-[#dff7ff]' : 'text-[#0369a1]'}`}>
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>Advance Reservation Form</span>
        </span>
        <span className="text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
          Dual-Input
        </span>
      </div>

      {/* Apparatus Dropdown */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 mb-1">Select Laboratory Apparatus *</label>
        <select
          value={selectedItemId}
          onChange={(e) => setSelectedItemId(e.target.value)}
          className={`w-full h-8 px-2 rounded-xl text-xs font-semibold focus:outline-none ${
            isDark ? 'bg-[#0a1628] border border-slate-700 text-slate-100' : 'bg-slate-50 border border-slate-300 text-slate-800'
          }`}
        >
          {inventory.map((item) => (
            <option key={item.id} value={item.id} className={isDark ? 'bg-[#0a1628] text-white' : 'bg-white text-black'}>
              [{item.tagCode}] {item.name} ({item.stock} {item.unit}s)
            </option>
          ))}
        </select>
      </div>

      {/* Date and Time Slot */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Reservation Date *</label>
          <input
            type="date"
            value={reserveDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setReserveDate(e.target.value)}
            required
            className={`w-full h-8 px-2 rounded-xl text-[11px] font-mono focus:outline-none ${
              isDark ? 'bg-[#0a1628] border border-slate-700 text-slate-100' : 'bg-slate-50 border border-slate-300 text-slate-800'
            }`}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Time Schedule *</label>
          <select
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            className={`w-full h-8 px-1 rounded-xl text-[10.5px] focus:outline-none ${
              isDark ? 'bg-[#0a1628] border border-slate-700 text-cyan-300' : 'bg-slate-50 border border-slate-300 text-slate-800'
            }`}
          >
            {STANDARD_TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot} className={isDark ? 'bg-[#0a1628] text-white' : 'bg-white text-black'}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Name and Program */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Student Name *</label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Student Name..."
            required
            className={`w-full h-8 px-2 rounded-xl text-[11px] focus:outline-none ${
              isDark ? 'bg-[#0a1628] border border-slate-700 text-slate-100' : 'bg-slate-50 border border-slate-300 text-slate-800'
            }`}
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Program</label>
          <select
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className={`w-full h-8 px-2 rounded-xl text-[11px] focus:outline-none ${
              isDark ? 'bg-[#0a1628] border border-slate-700 text-slate-100' : 'bg-slate-50 border border-slate-300 text-slate-800'
            }`}
          >
            {ENGINEERING_PROGRAMS.map((p) => (
              <option key={p.code} value={p.code} className={isDark ? 'bg-[#0a1628] text-white' : 'bg-white text-black'}>
                {p.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Instructor / Faculty Input */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 mb-1">Instructor / Professor * (Type Name)</label>
        <input
          type="text"
          value={instructor}
          onChange={(e) => setInstructor(e.target.value)}
          placeholder="e.g. Engr. Jin Benir Macaranas"
          required
          className={`w-full h-8 px-2 rounded-xl text-[11px] focus:outline-none ${
            isDark ? 'bg-[#0a1628] border border-slate-700 text-slate-100' : 'bg-slate-50 border border-slate-300 text-slate-800'
          }`}
        />
      </div>

      {/* Quantity & Anti Double-Booking status */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400">Qty:</span>
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-6 h-6 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold"
          >
            -
          </button>
          <span className="w-5 text-center font-mono font-bold text-cyan-400">{qty}</span>
          <button
            type="button"
            onClick={() => setQty(Math.min(currentItem.stock || 10, qty + 1))}
            className="w-6 h-6 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold"
          >
            +
          </button>
        </div>

        <span className={`text-[10px] font-mono font-bold ${conflictInfo.hasConflict ? 'text-rose-400' : 'text-emerald-400'}`}>
          {conflictInfo.hasConflict ? 'Slot Full' : `${conflictInfo.availableSlots} free`}
        </span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={conflictInfo.hasConflict}
        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98 cursor-pointer mt-1"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>Submit Advance Reservation</span>
      </button>
    </form>
  );
}

const INITIAL_MESSAGES = [
  {
    id: 'msg-welcome',
    sender: 'kairo',
    text: `Kumusta! Ako si **Kairo AI**, ang iyong intelligent Engineering Laboratory Assistant sa Universidad de Dagupan.

Maaari mo akong tanungin tungkol sa mga kailangang apparatus para sa iyong experiments (Civil, Digital/ECE, o Chemistry), circuit setups, o laboratory safety rules!`,
    timestamp: 'Just now',
    recommendedItems: [],
  },
];

const SUGGESTED_QUESTIONS = [
  { label: '📅 Pa-reserve ng Gamit', prompt: 'Gusto ko magpa-reserve ng apparatus para sa susunod naming laboratory experiment.' },
  { label: 'Slump Test (Civil)', prompt: 'Anong kailangan na apparatus para sa Concrete Slump Test sa Civil Engineering?' },
  { label: 'Logic Gates ICs (ECE)', prompt: 'I-recommend ang complete breadboard at logic gates ICs para sa Digital Electronics.' },
  { label: 'Acid-Base Titration (Chem)', prompt: 'Anong glassware at materials ang kailangan sa Acid-Base Titration experiment?' },
  { label: 'Lab Safety Rules', prompt: 'Ano ang mga opisyal na safety rules at breakage liability sa Engineering Lab?' },
  { label: 'Paano Humiram?', prompt: 'Paano ang tamang proseso ng paghiram at pagbalik ng gamit sa Kiosk?' },
];

// Helper to format rich markdown (headers, **bold**, `code`, [TAGS], numbered lists, bullet points)
function FormattedKairoText({ text, isDark }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lIdx} className="h-1" />;

        // Handle Headers (### or ## or #)
        if (trimmed.startsWith('#')) {
          const headerText = trimmed.replace(/^#+\s*/, '');
          return (
            <h4
              key={lIdx}
              className={`font-black text-xs pt-1 pb-0.5 border-b flex items-center gap-1.5 ${
                isDark
                  ? 'text-[#dff7ff] border-[#7fdcff]/20'
                  : 'text-[#0c4a6e] border-[#bae6fd]'
              }`}
            >
              <Sparkles className={`w-3 h-3 ${isDark ? 'text-[#7fdcff]' : 'text-[#0284c7]'}`} />
              <span>{headerText}</span>
            </h4>
          );
        }

        // Handle Numbered Lists (1. 2. etc)
        const isNumbered = /^\d+\.\s+/.test(trimmed);
        const numberPrefix = isNumbered ? trimmed.match(/^\d+\./)[0] : '';
        const cleanNumbered = isNumbered ? trimmed.replace(/^\d+\.\s+/, '') : trimmed;

        // Handle Bullet Points (- * •)
        const isBullet = !isNumbered && (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• '));
        const cleanBullet = isBullet ? trimmed.replace(/^[-*•]\s+/, '') : cleanNumbered;

        // Parse **bold**, `code`, [TAG-CODE]
        const parts = cleanBullet.split(/(\*\*.*?\*\*|`.*?`|\[[A-Z0-9-]+\])/g);

        const renderedLine = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong
                key={pIdx}
                className={`font-black ${
                  isDark ? 'text-[#dff7ff] drop-shadow-[0_0_8px_rgba(127,220,255,0.3)]' : 'text-[#0369a1]'
                }`}
              >
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code
                key={pIdx}
                className={`font-mono text-[10px] px-1 py-0.5 rounded border ${
                  isDark
                    ? 'bg-[#071322] text-[#7fdcff] border-[#7fdcff]/30'
                    : 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]'
                }`}
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          if (/^\[[A-Z0-9-]+\]$/.test(part)) {
            return (
              <span
                key={pIdx}
                className={`font-mono font-bold text-[9px] px-1.5 py-0.5 rounded border inline-block mx-0.5 ${
                  isDark
                    ? 'bg-[#081a30] text-[#7fdcff] border-[#7fdcff]/40 shadow-[0_0_6px_rgba(127,220,255,0.2)]'
                    : 'bg-[#bae6fd] text-[#0369a1] border-[#7fdcff]'
                }`}
              >
                {part.slice(1, -1)}
              </span>
            );
          }
          return part;
        });

        if (isNumbered) {
          return (
            <div key={lIdx} className="flex items-start gap-1.5 pl-1">
              <span className={`text-[10px] font-mono font-bold mt-0.5 shrink-0 ${isDark ? 'text-[#7fdcff]' : 'text-[#0284c7]'}`}>
                {numberPrefix}
              </span>
              <div className="flex-1">{renderedLine}</div>
            </div>
          );
        }

        if (isBullet) {
          return (
            <div key={lIdx} className="flex items-start gap-1.5 pl-1">
              <span className={`text-[11px] mt-0.5 font-bold shrink-0 ${isDark ? 'text-[#7fdcff]' : 'text-[#0284c7]'}`}>•</span>
              <div className="flex-1">{renderedLine}</div>
            </div>
          );
        }

        return <p key={lIdx}>{renderedLine}</p>;
      })}
    </div>
  );
}

export default function FloatingKairoBot() {
  const {
    currentStep,
    selectedLab,
    cart,
    addMultipleToCart,
    openCartDrawer,
    theme,
    showToast,
  } = useTransaction();
  const isDark = theme === 'dark';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasApiKey, setHasApiKey] = useState(Boolean(getStoredApiKey()));
  const [addedBundleKeys, setAddedBundleKeys] = useState([]);

  const messagesEndRef = useRef(null);

  // Monitor network connectivity in real-time
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshKeyStatus = () => {
    setHasApiKey(Boolean(getStoredApiKey()));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
    setAddedBundleKeys([]);
    showToast('Kairo AI conversation restarted.', 'info');
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 80);
    }
  }, [isOpen, messages, isLoading]);

  // Hide floating bot on Welcome Standby screen (Step 0)
  if (currentStep === 0) return null;

  const handleSendMessage = async (customPrompt) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputText('');
    setIsLoading(true);

    try {
      // Pass previous messages as conversation context
      const response = await askKairoAi(textToSend.trim(), selectedLab, messages);
      const kairoMsg = {
        id: `kairo-${Date.now()}`,
        sender: 'kairo',
        text: response.text,
        source: response.source, // 'gemini' | 'offline'
        recommendedItems: response.recommendedItems || [],
        isReservationIntent: response.isReservationIntent || false,
        matchedReservationItem: response.matchedReservationItem || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, kairoMsg]);
    } catch (error) {
      console.error('Error fetching Kairo response:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `kairo-err-${Date.now()}`,
          sender: 'kairo',
          text: 'Paumanhin, nagkaroon ng pansamantalang aberya. Subukan muli o mag-tanong tungkol sa ibang gamit.',
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
    showToast(`Added ${items.length} apparatus items to your borrow cart!`, 'success');
  };

  const totalUnitsInCart = cart ? cart.reduce((sum, item) => sum + item.qty, 0) : 0;

  return (
    <>
      {/* 1. FLOATING KAIRO AI 3D ROBOT HEAD + FLOATING CART DOCK (Side-by-side) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 select-none flex items-center gap-2.5">
          {/* Mobile-Only Floating Cart Button: Positioned right beside Kairo AI Bot (Hidden on 15" Kiosk Screen) */}
          {currentStep === 3 && (
            <button
              type="button"
              onClick={openCartDrawer}
              title="Open Borrow Cart"
              className="sm:hidden group relative w-11 h-11 rounded-full neu-btn-raised bg-[#0f172a] border border-cyan-500/40 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />

              {totalUnitsInCart > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-mono font-black text-[10px] flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.6)] border border-slate-950 animate-fade-in">
                  {totalUnitsInCart}
                </span>
              )}
            </button>
          )}

          {/* Kairo AI Trigger Button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            title="Chat with Kairo AI (Engineering Assistant)"
            className="group relative flex items-center gap-2 p-1.5 pr-3.5 rounded-full font-black hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer neu-btn-raised bg-[#0f172a] border border-cyan-500/30 shadow-lg shrink-0"
          >
            {/* Single Clean Avatar (No double nested circle border) */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shrink-0">
              <img
                src="/images/kairo_avatar.png"
                alt="Kairo AI Avatar"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950" />
            </div>

            {/* Contrast Text Label */}
            <div className="text-left leading-tight pr-1 hidden xs:block">
              <div className="text-xs font-black tracking-tight flex items-center gap-1 text-cyan-300">
                <span>Kairo AI</span>
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
              </div>
              <div className="text-[10px] font-bold text-slate-400">
                Lab Assistant
              </div>
            </div>
          </button>
        </div>
      )}

      {/* 2. RESPONSIVE FLOATING CHAT PANEL (Ocean Breeze Theme) */}
      {isOpen && (
        <>
          {/* Mobile backdrop (desktop click-away) */}
          <div
            onClick={() => setIsOpen(false)}
            className="hidden sm:block fixed inset-0 z-40 bg-black/40 backdrop-blur-xs animate-fade-in"
          />

          {/* Chat Window Container: 100% Fullscreen on Mobile, Sleek Floating Window on Desktop */}
          <div className="kairo-chat-shell fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[450px] sm:h-[620px] sm:max-h-[85vh] z-50 rounded-none sm:rounded-3xl flex flex-col overflow-hidden animate-slide-up backdrop-blur-2xl select-none shadow-2xl border-0 sm:border border-slate-700/60">
            {/* Mobile Drag Handle & Close Bar */}
            <div className={`sm:hidden w-full pt-3 pb-1 px-4 flex justify-between items-center ${isDark ? 'bg-[#060e1c]' : 'bg-[#f0f9ff]'} border-b border-slate-800/60`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-300 font-mono">UdD KAIRO AI LAB ASSISTANT</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-white"
                title="Close Fullscreen Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Window Top Bar (Ocean Breeze Header) */}
            <div className="kairo-header px-4 py-3 sm:p-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {/* 3D Head Avatar */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shrink-0">
                  <img
                    src="/images/kairo_avatar.png"
                    alt="Kairo AI"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h3 className={`text-sm sm:text-base font-black truncate ${
                      isDark ? 'text-[#dff7ff]' : 'text-[#0c4a6e]'
                    }`}>
                      Kairo AI Assistant
                    </h3>
                    {/* Status Connectivity Pill */}
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                        isOnline && hasApiKey
                          ? isDark
                            ? 'bg-[#071a2e] text-[#7fdcff] border-[#7fdcff]/40 shadow-[0_0_8px_rgba(127,220,255,0.3)]'
                            : 'bg-[#e0f2fe] text-[#0284c7] border-[#7fdcff]'
                          : isDark
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {isOnline && hasApiKey ? (
                        <>
                          <span className={`w-1.5 h-1.5 rounded-full animate-ping ${isDark ? 'bg-[#7fdcff]' : 'bg-[#0284c7]'}`} />
                          <span>Gemini 3.6</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>Offline Hub</span>
                        </>
                      )}
                    </span>
                  </div>
                  <p className={`text-[11px] font-medium truncate ${
                    isDark ? 'text-[#7fcdff]/80' : 'text-[#0369a1]'
                  }`}>
                    Engineering Syllabus & Apparatus Concierge
                  </p>
                </div>
              </div>

              {/* Action Icons: Reset, Settings, Minimize */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] sm:w-12 sm:h-12 sm:min-w-[48px] sm:min-h-[48px] rounded-xl neu-btn-raised text-slate-400 hover:text-cyan-400 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                  title="Restart Conversation"
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] sm:w-12 sm:h-12 sm:min-w-[48px] sm:min-h-[48px] rounded-xl neu-btn-raised text-slate-400 hover:text-cyan-400 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                  title="Configure Gemini API Key"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="hidden sm:flex w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl neu-btn-raised text-slate-400 hover:text-white items-center justify-center cursor-pointer transition-colors active:scale-95"
                  title="Minimize Kairo AI"
                >
                  <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Quick Prompt Chips (Ocean Breeze Pill Badges) */}
            <div className={`px-3 py-2 border-b overflow-x-auto flex items-center gap-1.5 no-scrollbar shrink-0 ${
              isDark ? 'bg-[#060e1a] border-[#7fdcff]/15' : 'bg-[#eaf4fb] border-[#bae6fd]'
            }`}>
              <span className={`text-[9px] font-extrabold uppercase tracking-wider shrink-0 flex items-center gap-1 ${
                isDark ? 'text-[#7fcdff]' : 'text-[#0369a1]'
              }`}>
                <BookOpen className="w-3 h-3" />
                <span>Quick:</span>
              </span>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q.prompt)}
                  disabled={isLoading}
                  className="kairo-chip-btn px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all active:scale-95 shrink-0 cursor-pointer"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg) => {
                const isKairo = msg.sender === 'kairo';
                const bundleKey = `bundle-${msg.id}`;
                const isAlreadyAdded = addedBundleKeys.includes(bundleKey);

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 text-xs leading-relaxed ${
                      isKairo ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    {isKairo && (
                      <div className={`w-6 h-6 rounded-full overflow-hidden border shrink-0 mt-0.5 shadow-sm ${
                        isDark ? 'border-[#7fdcff]/80 bg-slate-950' : 'border-[#0284c7] bg-white'
                      }`}>
                        <img
                          src="/images/kairo_avatar.png"
                          alt="Kairo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] rounded-2xl p-3 space-y-2.5 ${
                        isKairo ? 'kairo-bubble-bot' : 'kairo-bubble-user'
                      }`}
                    >
                      {/* Rich Message Content */}
                      <div className="leading-relaxed text-[11px] sm:text-xs">
                        {isKairo ? (
                          <FormattedKairoText text={msg.text} isDark={isDark} />
                        ) : (
                          <div className="whitespace-pre-wrap keep-white font-medium">
                            {msg.text}
                          </div>
                        )}
                      </div>

                      {/* 1-Tap Cart Injection Card (Ocean Breeze Accent) */}
                      {isKairo && msg.recommendedItems && msg.recommendedItems.length > 0 && (
                        <div className={`mt-2 p-2.5 rounded-2xl border space-y-2 ${
                          isDark
                            ? 'bg-[#050e1c] border-[#7fdcff]/30 shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]'
                            : 'bg-white border-[#bae6fd] shadow-sm'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-black flex items-center gap-1 ${
                              isDark ? 'text-[#dff7ff]' : 'text-[#0c4a6e]'
                            }`}>
                              <Layers className={`w-3.5 h-3.5 ${isDark ? 'text-[#7fdcff]' : 'text-[#0284c7]'}`} />
                              <span>Recommended Apparatus ({msg.recommendedItems.length})</span>
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                              isDark ? 'bg-[#7fdcff]/15 text-[#7fdcff]' : 'bg-[#e0f2fe] text-[#0369a1]'
                            }`}>
                              Auto-detected
                            </span>
                          </div>

                          <div className="space-y-1">
                            {msg.recommendedItems.map((item) => (
                              <div
                                key={item.id}
                                className={`text-[10px] flex items-center justify-between py-1 px-1.5 rounded-lg ${
                                  isDark ? 'bg-[#0a1628]/60 text-slate-200' : 'bg-[#f0f9ff] text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[9px] ${
                                    isDark ? 'bg-[#0d223f] text-[#7fdcff]' : 'bg-[#bae6fd] text-[#0369a1]'
                                  }`}>
                                    {item.tagCode}
                                  </span>
                                  <span className="truncate font-medium">{item.name}</span>
                                </div>
                                <span className="font-mono text-slate-400 shrink-0 text-[9px] ml-1">
                                  {item.stock} {item.unit}s
                                </span>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddItemsToCart(msg.recommendedItems, bundleKey)}
                            disabled={isAlreadyAdded}
                            className={`w-full py-2 px-3 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md mt-1 cursor-pointer ${
                              isAlreadyAdded
                                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                                : 'kairo-ocean-btn-primary active:scale-98'
                            }`}
                          >
                            {isAlreadyAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Added to Borrow Cart!</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>+ Add All {msg.recommendedItems.length} to Borrow Cart</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* In-Chat Interactive Advance Reservation Form */}
                      {isKairo && msg.isReservationIntent && (
                        <InChatReservationForm
                          initialItem={msg.matchedReservationItem}
                          isDark={isDark}
                          onReservationSubmitted={() => {
                            setTimeout(scrollToBottom, 120);
                          }}
                        />
                      )}

                      <div
                        className={`text-[8.5px] font-mono text-right ${
                          isKairo
                            ? isDark ? 'text-[#7fcdff]/60' : 'text-slate-400'
                            : 'text-cyan-100/90'
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>

                    {!isKairo && (
                      <div className="w-6 h-6 rounded-full bg-cyan-600 border border-cyan-400/60 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing Loader */}
              {isLoading && (
                <div className="flex gap-2 text-xs justify-start items-center animate-fade-in">
                  <div className={`w-6 h-6 rounded-full overflow-hidden border shrink-0 ${
                    isDark ? 'border-[#7fdcff]/80 bg-slate-950' : 'border-[#0284c7] bg-white'
                  }`}>
                    <img
                      src="/images/kairo_avatar.png"
                      alt="Kairo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="kairo-bubble-bot rounded-2xl px-3 py-2 flex items-center gap-2">
                    <Loader2 className={`w-3.5 h-3.5 animate-spin ${isDark ? 'text-[#7fdcff]' : 'text-[#0284c7]'}`} />
                    <span className={`text-[10.5px] font-bold ${isDark ? 'text-[#dff7ff]' : 'text-[#0369a1]'}`}>
                      Kairo is analyzing...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Chat Input Form (Ocean Breeze Inset) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className={`p-3 sm:p-3.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t flex items-center gap-2 shrink-0 ${
                isDark ? 'bg-[#081220] border-[#7fdcff]/20' : 'bg-[#eaf4fb] border-[#bae6fd]'
              }`}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask Kairo about apparatus, syllabus experiments, or safety..."
                className={`flex-1 h-11 sm:h-10 px-4 rounded-2xl text-xs sm:text-sm transition-all focus:outline-none ${
                  isDark
                    ? 'neu-inset text-[#dff7ff] placeholder-slate-500 focus:ring-2 focus:ring-[#7fdcff]/60'
                    : 'neu-inset text-[#0f172a] placeholder-slate-400 focus:ring-2 focus:ring-[#0284c7]'
                }`}
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="kairo-ocean-btn-primary h-11 sm:h-10 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer shadow-md shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden xs:inline">Send</span>
              </button>
            </form>
          </div>
        </>
      )}

      {/* Settings Modal */}
      <KairoSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onKeySaved={refreshKeyStatus}
      />
    </>
  );
}

