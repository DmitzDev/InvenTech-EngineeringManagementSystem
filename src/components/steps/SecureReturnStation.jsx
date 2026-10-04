import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  RotateCcw,
  ShieldCheck,
  Search,
  Lock,
  Package,
  PackageCheck,
  PackageX,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  User,
  Hash,
  Calendar,
  Building2,
  X,
  Delete,
  CheckSquare,
  Square,
  Printer,
  ChevronRight,
  MapPin,
  Tag,
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from '../ui/TouchButton';

export default function SecureReturnStation({ isOpen, onClose, onOpenClearance }) {
  const { activeTransactions, returnEquipmentTransaction, showToast, theme } = useTransaction();
  const isDark = theme === 'dark';

  // State management
  const [enteredId, setEnteredId] = useState('');
  const [lookupAttempted, setLookupAttempted] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set()); // set of "txId:itemId"
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedSummary, setSubmittedSummary] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(30);

  const inputRef = useRef(null);

  // 30-Second Security Inactivity Auto-Reset Safeguard
  useEffect(() => {
    if (!isOpen) return;

    // Reset countdown on modal open
    setSecondsLeft(30);

    const resetInactivity = () => {
      setSecondsLeft(30);
    };

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSecurityExit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    window.addEventListener('pointerdown', resetInactivity);
    window.addEventListener('keydown', resetInactivity);
    window.addEventListener('touchstart', resetInactivity, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('pointerdown', resetInactivity);
      window.removeEventListener('keydown', resetInactivity);
      window.removeEventListener('touchstart', resetInactivity);
    };
  }, [isOpen]);

  // Clean exit handler (wipes all state for student privacy)
  const handleSecurityExit = (timedOut = false) => {
    setEnteredId('');
    setLookupAttempted(false);
    setSelectedItems(new Set());
    setIsSubmitted(false);
    setSubmittedSummary(null);
    onClose();
    if (timedOut) {
      showToast('Session automatically closed to protect your student privacy.', 'info');
    }
  };

  // STRICT DATA PRIVACY FILTERING (Zero Leakage)
  // Query or filter the borrowed transactions database STRICTLY by the entered Student ID
  const activeLoans = useMemo(() => {
    const cleanEnteredId = enteredId.trim().toUpperCase();
    if (!cleanEnteredId || !lookupAttempted) return [];

    return activeTransactions.filter((tx) => {
      if (tx.status !== 'BORROWED') return false;
      const sId = (tx.borrower?.studentId || tx.studentId || '').trim().toUpperCase();
      return sId === cleanEnteredId;
    });
  }, [activeTransactions, enteredId, lookupAttempted]);

  // Aggregate all individual tools across the student's active loans
  const loanToolsList = useMemo(() => {
    const list = [];
    activeLoans.forEach((tx) => {
      (tx.items || []).forEach((item) => {
        const itemKey = `${tx.txId}:${item.id}`;
        // Calculate assigned locker / cabinet bin location
        const lockerNumber = item.tagCode
          ? item.tagCode.replace(/[^0-9]/g, '').slice(-2) || '01'
          : '01';
        const assignedLocker = item.location || `Locker Bay #${lockerNumber} • Engineering Storage`;

        list.push({
          itemKey,
          txId: tx.txId,
          itemId: item.id,
          name: item.name,
          tagCode: item.tagCode,
          qty: item.qty || 1,
          unit: item.unit || 'pc',
          dateBorrowed: tx.borrowedAt || tx.borrower?.date || 'Today',
          dueDate: tx.borrower?.labTime ? `Today • ${tx.borrower.labTime}` : 'End of Laboratory Period',
          assignedLocker,
          itemRef: item,
        });
      });
    });
    return list;
  }, [activeLoans]);

  // Auto-select all items upon loan retrieval
  useEffect(() => {
    if (loanToolsList.length > 0) {
      const allKeys = new Set(loanToolsList.map((i) => i.itemKey));
      setSelectedItems(allKeys);
    } else {
      setSelectedItems(new Set());
    }
  }, [loanToolsList]);

  // Handle Numpad / Keypad Input
  const handleNumpadPress = (char) => {
    if (enteredId.length >= 16) return;
    setEnteredId((prev) => prev + char);
  };

  const handleBackspace = () => {
    setEnteredId((prev) => prev.slice(0, -1));
  };

  const handleClearInput = () => {
    setEnteredId('');
    setLookupAttempted(false);
  };

  const handleLookup = (e) => {
    if (e) e.preventDefault();
    if (!enteredId.trim()) {
      showToast('Please enter your Student ID number', 'error');
      return;
    }
    setLookupAttempted(true);
  };

  // Toggle item selection
  const handleToggleItem = (itemKey) => {
    setSelectedItems((prev) => {
      const updated = new Set(prev);
      if (updated.has(itemKey)) {
        updated.delete(itemKey);
      } else {
        updated.add(itemKey);
      }
      return updated;
    });
  };

  // Toggle select all
  const handleToggleSelectAll = () => {
    if (selectedItems.size === loanToolsList.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(loanToolsList.map((i) => i.itemKey)));
    }
  };

  // Submit Return Check-In
  const handleConfirmReturn = () => {
    if (selectedItems.size === 0) {
      showToast('Please select at least one tool to return', 'error');
      return;
    }

    const returnedToolsList = [];

    // Group selected items by transaction ID
    activeLoans.forEach((tx) => {
      const returnedInTx = (tx.items || []).filter((item) =>
        selectedItems.has(`${tx.txId}:${item.id}`)
      );

      if (returnedInTx.length > 0) {
        const formattedReturnedItems = returnedInTx.map((item) => ({
          ...item,
          returnCondition: 'good',
          qtyReturned: item.qty || 1,
          damageNote: '',
          damageSeverity: 'None',
        }));

        returnedToolsList.push(...formattedReturnedItems);

        // Update transaction status in TransactionContext
        returnEquipmentTransaction({
          txId: tx.txId,
          returnedItems: formattedReturnedItems,
          custodianNotes: 'Self-Service Kiosk Return Check-In (Pending Custodian Inspection)',
        });
      }
    });

    const primaryTx = activeLoans[0];
    setSubmittedSummary({
      studentName: primaryTx?.borrower?.groupLeader || 'Student Borrower',
      studentId: enteredId,
      program: primaryTx?.borrower?.program || 'Engineering',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      returnedCount: selectedItems.size,
      items: returnedToolsList,
    });

    setIsSubmitted(true);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none touch-manipulation">
      <div
        className={`w-full max-w-4xl h-[94vh] sm:h-[88vh] max-h-[820px] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border ${
          isDark
            ? 'bg-[#0b101b] border-slate-800 text-slate-100'
            : 'bg-slate-100 border-slate-300 text-slate-900'
        }`}
      >
        {/* Top Kiosk Security Banner */}
        <div
          className={`px-4 sm:px-6 py-2.5 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-tight">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>
                PRIVACY GUARD STATION
              </span>
              <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}>
                Isolated Student Record
              </span>
            </div>
          </div>

          {/* 30-Second Inactivity Security Timer */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                secondsLeft <= 10
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                  : isDark
                  ? 'neu-inset text-cyan-400'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
              title="Session automatically clears when unattended to protect student data"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Auto-reset in {secondsLeft}s</span>
            </div>

            <button
              type="button"
              onClick={() => handleSecurityExit(false)}
              className={`p-1.5 rounded-full transition-transform active:scale-95 cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Close and Clear Session"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Viewport: Step Switching */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3.5 sm:p-6 lg:p-7">
          {/* =========================================================================
              VIEW 1: ID INPUT & VERIFICATION SCREEN (Initial State)
             ========================================================================= */}
          {!lookupAttempted && (
            <div className="flex-1 flex flex-col justify-between max-w-xl mx-auto w-full py-1 sm:py-2">
              <div className="text-center space-y-1.5">
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mx-auto flex items-center justify-center shadow-md mb-2 ${
                    isDark
                      ? 'neu-inset text-cyan-400'
                      : 'bg-blue-50 text-blue-700 border border-blue-200/80'
                  }`}
                >
                  <RotateCcw className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                </div>
                <h2
                  className={`text-xl sm:text-2xl font-black tracking-tight ${
                    isDark ? 'text-slate-100' : 'text-slate-950 font-black'
                  }`}
                >
                  Return Equipment
                </h2>
                <p
                  className={`text-xs sm:text-sm max-w-md mx-auto ${
                    isDark ? 'text-slate-400' : 'text-slate-600 font-medium'
                  }`}
                >
                  Enter your Student ID to retrieve your active borrowed tools. Only your account's
                  apparatus records will be loaded.
                </p>
              </div>

              {/* ID Input Box & Digital Display */}
              <div className="my-3 space-y-2">
                <form onSubmit={handleLookup} className="relative">
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={enteredId}
                      onChange={(e) => setEnteredId(e.target.value.toUpperCase())}
                      placeholder="e.g. 21-0482-119"
                      autoFocus
                      className={`w-full h-14 sm:h-16 px-4 pr-12 rounded-2xl font-mono text-center text-xl sm:text-2xl tracking-widest font-black focus:outline-none transition-all shadow-inner ${
                        isDark
                          ? 'neu-inset text-cyan-300 placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-400/50'
                          : 'bg-white border-2 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100'
                      }`}
                    />
                    {enteredId && (
                      <button
                        type="button"
                        onClick={handleClearInput}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Clear Input"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </form>

                {/* Touch-Friendly On-Screen Numpad */}
                <div
                  className={`p-2.5 sm:p-3 rounded-2xl border shadow-sm ${
                    isDark ? 'bg-[#0d1424] border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-sm mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleNumpadPress(String(num))}
                        className={`h-11 sm:h-12 rounded-xl font-mono text-lg font-bold flex items-center justify-center transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                          isDark
                            ? 'neu-btn-raised text-slate-200 hover:text-white'
                            : 'bg-slate-100 hover:bg-slate-200 border border-slate-200/90 text-slate-900 shadow-2xs'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                    {/* Bottom row: Dash, Zero, Backspace */}
                    <button
                      type="button"
                      onClick={() => handleNumpadPress('-')}
                      className={`h-11 sm:h-12 rounded-xl font-mono text-lg font-bold flex items-center justify-center transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                        isDark
                          ? 'neu-btn-raised text-cyan-400 font-black'
                          : 'bg-slate-100 hover:bg-slate-200 border border-slate-200/90 text-slate-900 font-black'
                      }`}
                      title="Hyphen (-)"
                    >
                      —
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumpadPress('0')}
                      className={`h-11 sm:h-12 rounded-xl font-mono text-lg font-bold flex items-center justify-center transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                        isDark
                          ? 'neu-btn-raised text-slate-200 hover:text-white'
                          : 'bg-slate-100 hover:bg-slate-200 border border-slate-200/90 text-slate-900 shadow-2xs'
                      }`}
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleBackspace}
                      className={`h-11 sm:h-12 rounded-xl font-mono text-base font-bold flex items-center justify-center transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                        isDark
                          ? 'neu-btn-raised text-rose-400'
                          : 'bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-800'
                      }`}
                      title="Backspace"
                    >
                      <Delete className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={!enteredId.trim()}
                  className={`w-full h-12 sm:h-13 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDark
                      ? 'neu-btn-primary text-slate-950 font-black'
                      : 'bg-slate-900 hover:bg-slate-800 text-white font-bold'
                  }`}
                >
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span>Look Up Borrowed Tools</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSecurityExit(false)}
                  className={`w-full h-10 sm:h-11 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                    isDark
                      ? 'neu-btn-raised text-slate-300'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Cancel / Return to Welcome Screen</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: EMPTY STATE (NO ACTIVE LOANS FOUND FOR ENTERED ID)
             ========================================================================= */}
          {lookupAttempted && !isSubmitted && activeLoans.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mb-4 shadow-sm ${
                  isDark
                    ? 'neu-inset text-slate-400'
                    : 'bg-slate-200/80 text-slate-600 border border-slate-300'
                }`}
              >
                <PackageX className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <span
                className={`text-xs font-mono font-black uppercase px-2.5 py-0.5 rounded-full mb-2 ${
                  isDark
                    ? 'neu-inset text-cyan-400'
                    : 'bg-blue-50 text-blue-700 border border-blue-200/60 font-semibold'
                }`}
              >
                STUDENT ID: {enteredId}
              </span>

              <h3
                className={`text-lg sm:text-xl font-black ${
                  isDark ? 'text-slate-100' : 'text-slate-900 font-bold'
                }`}
              >
                No Active Borrowed Items Found
              </h3>

              <p
                className={`text-xs sm:text-sm mt-2 max-w-md ${
                  isDark ? 'text-slate-400' : 'text-slate-600 font-medium'
                }`}
              >
                You currently have no outstanding tools marked as borrowed, or all items have already
                been checked in and cleared by the custodian.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-6 w-full max-w-sm">
                <button
                  type="button"
                  onClick={() => setLookupAttempted(false)}
                  className={`w-full sm:flex-1 h-11 rounded-xl text-xs font-bold transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                    isDark
                      ? 'neu-btn-raised text-slate-200'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Try Another ID
                </button>

                <button
                  type="button"
                  onClick={() => handleSecurityExit(false)}
                  className={`w-full sm:flex-1 h-11 rounded-xl text-xs font-bold transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                    isDark
                      ? 'neu-btn-primary text-slate-950 font-black'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Return to Home
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 3: ACTIVE LOANS CHECKLIST (FILTERED BY ENTERED STUDENT ID ONLY)
             ========================================================================= */}
          {lookupAttempted && !isSubmitted && activeLoans.length > 0 && (
            <div className="flex-1 flex flex-col justify-between h-full">
              <div className="space-y-3">
                {/* Greeting Card: Student Credentials & Active Borrow Session */}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                    isDark
                      ? 'neu-card bg-[#111a2c]'
                      : 'bg-white border-slate-200/90 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        isDark
                          ? 'neu-inset text-cyan-400'
                          : 'bg-blue-50 text-blue-700 border border-blue-200/70'
                      }`}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-sm sm:text-base font-black ${
                            isDark ? 'text-slate-100' : 'text-slate-950'
                          }`}
                        >
                          Welcome, {activeLoans[0]?.borrower?.groupLeader || 'Student'}
                        </h3>
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                            isDark
                              ? 'neu-inset text-cyan-300'
                              : 'bg-blue-50 text-blue-800 border border-blue-200/60'
                          }`}
                        >
                          ID: {enteredId}
                        </span>
                      </div>
                      <p
                        className={`text-xs mt-0.5 ${
                          isDark ? 'text-slate-400' : 'text-slate-600 font-medium'
                        }`}
                      >
                        {activeLoans[0]?.borrower?.program || 'Engineering'} • Course:{' '}
                        {activeLoans[0]?.borrower?.courseCode || 'N/A'} • Instructor:{' '}
                        {activeLoans[0]?.borrower?.instructor || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase border ${
                        isDark
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-amber-50 text-amber-900 border-amber-200/80 font-semibold'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      {activeLoans.length} Active Loan Session
                    </span>
                  </div>
                </div>

                {/* Checklist Controls: Select All Toggle */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                        selectedItems.size === loanToolsList.length
                          ? isDark
                            ? 'neu-btn-primary text-slate-950 font-black'
                            : 'bg-slate-900 text-white'
                          : isDark
                          ? 'neu-btn-raised text-slate-300'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {selectedItems.size === loanToolsList.length ? (
                        <CheckSquare className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      <span>
                        {selectedItems.size === loanToolsList.length
                          ? 'Deselect All'
                          : 'Select All Items'}
                      </span>
                    </button>
                    <span
                      className={`text-xs ${
                        isDark ? 'text-slate-400' : 'text-slate-600 font-medium'
                      }`}
                    >
                      ({selectedItems.size} of {loanToolsList.length} tools selected)
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-mono ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Check each item you are returning
                  </span>
                </div>

                {/* Itemized Tools Checklist */}
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {loanToolsList.map((tool) => {
                    const isChecked = selectedItems.has(tool.itemKey);
                    return (
                      <div
                        key={tool.itemKey}
                        onClick={() => handleToggleItem(tool.itemKey)}
                        className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isChecked
                            ? isDark
                              ? 'neu-card ring-2 ring-cyan-400/60 bg-[#10192a]'
                              : 'bg-white border-blue-600 ring-2 ring-blue-600/20 shadow-md'
                            : isDark
                            ? 'neu-card opacity-80 hover:opacity-100'
                            : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Checkbox indicator */}
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isChecked
                                ? isDark
                                  ? 'bg-cyan-400 text-slate-950 font-black'
                                  : 'bg-blue-600 text-white font-bold'
                                : isDark
                                ? 'neu-inset text-slate-500'
                                : 'border-2 border-slate-300 bg-slate-50'
                            }`}
                          >
                            {isChecked && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                          </div>

                          {/* Tool Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={`text-xs sm:text-sm font-semibold truncate ${
                                  isDark ? 'text-slate-100' : 'text-slate-900'
                                }`}
                              >
                                {tool.name}
                              </h4>
                              <span
                                className={`font-mono text-[9.5px] font-bold px-1.5 py-0.2 rounded border ${
                                  isDark
                                    ? 'neu-inset text-slate-300'
                                    : 'bg-slate-100 text-slate-800 border-slate-200'
                                }`}
                              >
                                {tool.tagCode}
                              </span>
                              <span
                                className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                  isDark
                                    ? 'bg-cyan-500/20 text-cyan-300'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200/50'
                                }`}
                              >
                                Qty: {tool.qty} {tool.unit}
                              </span>
                            </div>

                            {/* Assigned Locker Location */}
                            <div className="flex items-center gap-2 mt-1 text-[11px] font-medium flex-wrap">
                              <span
                                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  isDark
                                    ? 'neu-inset text-emerald-400 border-emerald-500/30'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                                }`}
                              >
                                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Return Target: {tool.assignedLocker}</span>
                              </span>
                              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                                Borrowed: {tool.dateBorrowed}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Check tag */}
                        <div className="shrink-0 text-right">
                          <span
                            className={`text-[10.5px] font-bold ${
                              isChecked
                                ? isDark
                                  ? 'text-cyan-300'
                                  : 'text-blue-700'
                                : isDark
                                ? 'text-slate-500'
                                : 'text-slate-400'
                            }`}
                          >
                            {isChecked ? 'Marked for Return' : 'Keep Borrowed'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div
                className={`mt-4 pt-3 border-t flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 shrink-0 ${
                  isDark ? 'border-slate-800' : 'border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSecurityExit(false)}
                  className={`w-full sm:w-auto px-5 h-11 rounded-xl text-xs font-bold transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                    isDark
                      ? 'neu-btn-raised text-slate-300'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Cancel / Exit
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setLookupAttempted(false)}
                    className={`px-4 h-11 rounded-xl text-xs font-bold transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                      isDark
                        ? 'neu-btn-raised text-slate-300'
                        : 'bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    Change ID
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmReturn}
                    disabled={selectedItems.size === 0}
                    className={`flex-1 sm:flex-initial sm:min-w-[240px] h-11 px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark
                        ? 'neu-btn-primary text-slate-950 font-black'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Confirm & Submit Return ({selectedItems.size})</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 4: CONFIRMATION & RECEIPT SCREEN
             ========================================================================= */}
          {isSubmitted && submittedSummary && (
            <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full py-4 text-center">
              <div>
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl mx-auto flex items-center justify-center mb-3 shadow-md ${
                    isDark
                      ? 'neu-inset text-emerald-400'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>

                <span
                  className={`inline-block text-[11px] font-mono font-bold uppercase px-3 py-0.5 rounded-full mb-2 ${
                    isDark
                      ? 'neu-inset text-emerald-400'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold'
                  }`}
                >
                  STATUS: RETURN CHECK-IN RECORDED
                </span>

                <h3
                  className={`text-xl sm:text-2xl font-black ${
                    isDark ? 'text-slate-100' : 'text-slate-900 font-bold'
                  }`}
                >
                  Return Check-In Successful!
                </h3>

                <p
                  className={`text-xs sm:text-sm mt-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-600 font-medium'
                  }`}
                >
                  Thank you, <span className="font-bold">{submittedSummary.studentName}</span>. Your{' '}
                  <span className="font-bold">{submittedSummary.returnedCount} returned apparatus</span>{' '}
                  have been updated in the kiosk system for custodian inspection.
                </p>

                {/* Receipt Card */}
                <div
                  className={`mt-4 p-4 rounded-2xl border text-left font-mono text-xs space-y-2 shadow-xs ${
                    isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-dashed border-slate-300 dark:border-slate-800">
                    <span className="text-slate-500">Student ID:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {submittedSummary.studentId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-dashed border-slate-300 dark:border-slate-800">
                    <span className="text-slate-500">Date & Time:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {submittedSummary.date} • {submittedSummary.timestamp}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Items Processed:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {submittedSummary.returnedCount} Apparatus Returned
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-4">
                <button
                  type="button"
                  onClick={() => handleSecurityExit(false)}
                  className={`w-full h-12 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                    isDark
                      ? 'neu-btn-primary text-slate-950 font-black'
                      : 'bg-slate-900 text-white hover:bg-slate-800 font-bold'
                  }`}
                >
                  <span>Finish & Return to Main Screen</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
