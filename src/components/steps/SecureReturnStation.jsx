import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  RotateCcw,
  Search,
  PackageX,
  CheckCircle2,
  ArrowLeft,
  Clock,
  User,
  X,
  Delete,
  CheckSquare,
  Square,
  MapPin,
  AlertOctagon,
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import ThemeToggle from '../ui/ThemeToggle';
import InstitutionalQrCode from '../ui/InstitutionalQrCode';
import { generateReturnReceiptPdf } from '../../utils/generateReturnReceiptPdf';
import { getReceiptBaseUrl } from '../../utils/networkConfig';
import { formatStudentId, handleStudentIdChange } from '../../utils/studentIdFormatter';
import { useRateLimiter } from '../../utils/rateLimiter';

export default function SecureReturnStation({ onBack, onTimeout, onClose, onOpenClearance }) {
  const { activeTransactions, returnEquipmentTransaction, showToast, theme } = useTransaction();
  const isDark = theme === 'dark';

  // Anti-Brute-Force Rate Limiter Guardrail (Max 4 attempts, 60s cooldown lock)
  const {
    isLocked,
    remainingSeconds: lockoutSeconds,
    failedAttempts,
    maxAttempts,
    recordFailure,
    recordSuccess,
  } = useRateLimiter('student_return_lookup');

  // State management
  const [enteredId, setEnteredId] = useState('');
  const [lookupAttempted, setLookupAttempted] = useState(false);
  const [inputError, setInputError] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set()); // set of "txId:itemId"
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedSummary, setSubmittedSummary] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(30);

  const inputRef = useRef(null);

  // 30-Second Security Inactivity Auto-Reset Safeguard
  useEffect(() => {
    // Reset countdown on mount
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
  }, []);

  // Auto-focus on desktop / kiosk displays only (avoids mobile viewport jump)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kiosk-dismiss-osk'));
    }
    if (!lookupAttempted && typeof window !== 'undefined' && window.innerWidth >= 768) {
      inputRef.current?.focus();
    }
  }, [lookupAttempted]);

  // Clean exit handler (wipes all state for student privacy)
  const handleSecurityExit = (timedOut = false) => {
    setEnteredId('');
    setLookupAttempted(false);
    setSelectedItems(new Set());
    setIsSubmitted(false);
    setSubmittedSummary(null);
    if (timedOut) {
      if (onTimeout) onTimeout();
      else if (onBack) onBack();
      else if (onClose) onClose();
      showToast('Session automatically closed to protect your student privacy.', 'info');
    } else {
      if (onBack) onBack();
      else if (onClose) onClose();
    }
  };

  // STRICT DATA PRIVACY FILTERING (Zero Leakage)
  // Query or filter the borrowed transactions database STRICTLY by the entered Student ID
  const activeLoans = useMemo(() => {
    const cleanEnteredDigits = enteredId.replace(/\D/g, '');
    if (!cleanEnteredDigits || cleanEnteredDigits.length !== 9 || !lookupAttempted) return [];

    return activeTransactions.filter((tx) => {
      if (tx.status !== 'BORROWED') return false;
      const txDigits = (tx.borrower?.studentId || tx.studentId || '').replace(/\D/g, '');
      return txDigits === cleanEnteredDigits;
    });
  }, [activeTransactions, enteredId, lookupAttempted]);

  // Aggregate all individual tools across the student's active loans
  const loanToolsList = useMemo(() => {
    const list = [];
    activeLoans.forEach((tx) => {
      (tx.items || []).forEach((item) => {
        const currentTxId = tx.txId || tx.transactionId || tx.id;
        const itemKey = `${currentTxId}:${item.id || item.tagCode || item.name}`;
        // Calculate assigned locker / cabinet bin location
        const lockerNumber = item.tagCode
          ? item.tagCode.replace(/[^0-9]/g, '').slice(-2) || '01'
          : '01';
        const assignedLocker = item.location || `Locker Bay #${lockerNumber} • Engineering Storage`;

        list.push({
          itemKey,
          txId: currentTxId,
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

  // Handle Numpad / Keypad Input (Automatic dash formatting, max 9 digits)
  const handleNumpadPress = (char) => {
    if (isLocked) return;
    if (!/\d/.test(char)) return; // Only accept digits; dashes are auto-formatted
    setInputError('');
    const currentDigits = enteredId.replace(/\D/g, '');
    if (currentDigits.length >= 9) return; // Strict 9 digits maximum
    const newDigits = currentDigits + char;
    setEnteredId(formatStudentId(newDigits));
  };

  const handleBackspace = () => {
    if (isLocked) return;
    setInputError('');
    const currentDigits = enteredId.replace(/\D/g, '');
    if (!currentDigits) return;
    const newDigits = currentDigits.slice(0, -1);
    setEnteredId(formatStudentId(newDigits));
  };

  const handleClearInput = () => {
    if (isLocked) return;
    setInputError('');
    setEnteredId('');
    setLookupAttempted(false);
  };

  const handleLookup = (e) => {
    if (e) e.preventDefault();
    if (isLocked) {
      showToast(`Lockout active. Please wait ${lockoutSeconds}s before retrying.`, 'error');
      return;
    }
    const digitsOnly = enteredId.replace(/\D/g, '');
    if (!digitsOnly) {
      setInputError('Please enter your Student ID number');
      showToast('Please enter your Student ID number', 'error');
      return;
    }
    if (digitsOnly.length !== 9) {
      setInputError('Student ID must be exactly 9 digits (e.g. 23-1374-693)');
      showToast('Student ID must be exactly 9 digits (e.g. 23-1374-693)', 'error');
      return;
    }

    setInputError('');
    const cleanEnteredDigits = digitsOnly;
    const matchingLoans = activeTransactions.filter((tx) => {
      if (tx.status !== 'BORROWED') return false;
      const txDigits = (tx.borrower?.studentId || tx.studentId || '').replace(/\D/g, '');
      return txDigits === cleanEnteredDigits;
    });

    if (matchingLoans.length === 0) {
      const res = recordFailure(cleanEnteredId, 'Student ID Return Lookup - No active loan records found');
      if (res.isLocked) {
        showToast(`[ SECURITY LOCKOUT // EXCESSIVE ATTEMPTS DETECTED - COOLDOWN ${res.remainingSeconds}s ]`, 'error');
      } else {
        const remaining = maxAttempts - res.failedAttempts;
        setInputError(`No active loans found for ${enteredId}`);
        showToast(`No active loans found for ${enteredId}. ${remaining} attempt(s) remaining before lockout.`, 'error');
      }
      setLookupAttempted(true);
      return;
    }

    // Success
    recordSuccess();
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
      const currentTxId = tx.txId || tx.transactionId || tx.id;
      const returnedInTx = (tx.items || []).filter((item) =>
        selectedItems.has(`${currentTxId}:${item.id || item.tagCode || item.name}`)
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
          txId: currentTxId,
          returnedItems: formattedReturnedItems,
          custodianNotes: 'Self-Service Kiosk Return Check-In (Pending Custodian Inspection)',
        });
      }
    });

    const primaryTx = activeLoans[0];
    const primaryTxId = primaryTx?.txId || primaryTx?.transactionId || primaryTx?.id || `UDD-RET-${Date.now().toString().slice(-6)}`;
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const summaryObj = {
      txId: primaryTxId,
      studentName: primaryTx?.borrower?.groupLeader || primaryTx?.studentName || 'Student Borrower',
      studentId: enteredId,
      program: primaryTx?.borrower?.program || primaryTx?.program || 'Engineering',
      courseCode: primaryTx?.borrower?.courseCode || primaryTx?.courseCode || 'LAB-CLASS',
      groupNo: primaryTx?.borrower?.groupNo || primaryTx?.groupNo || '1',
      instructor: primaryTx?.borrower?.instructor || primaryTx?.instructor || 'Laboratory Professor',
      timestamp: timeStr,
      date: dateStr,
      returnedCount: selectedItems.size,
      items: returnedToolsList,
    };

    // Build compact base64 payload so scanning the QR code on any mobile phone auto-downloads the exact PDF receipt
    const baseUrl = getReceiptBaseUrl();
    let qrUrl = `${baseUrl}/receipt/${encodeURIComponent(primaryTxId)}?auto=1`;
    try {
      const compact = {
        t: summaryObj.txId,
        n: summaryObj.studentName,
        s: summaryObj.studentId,
        p: summaryObj.program,
        c: summaryObj.courseCode,
        g: summaryObj.groupNo,
        i: summaryObj.instructor,
        dt: summaryObj.date,
        tm: summaryObj.timestamp,
        it: returnedToolsList.slice(0, 15).map((it) => [
          String(it.name || 'Apparatus').slice(0, 36),
          String(it.tagCode || 'N/A').slice(0, 16),
          Number(it.qtyReturned || it.qty || 1),
          String(it.unit || 'pc'),
        ]),
      };
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
      qrUrl = `${baseUrl}/receipt/${encodeURIComponent(primaryTxId)}?auto=1&d=${encodeURIComponent(encoded)}`;
    } catch (err) {
      console.warn('Compact QR payload fallback:', err);
    }

    setSubmittedSummary({
      ...summaryObj,
      qrUrl,
    });
    setSecondsLeft(90);
    setIsSubmitted(true);
  };

  return (
    <div className="flex-1 w-full max-w-full overflow-x-hidden min-h-[100dvh] lg:min-h-0 lg:h-full flex flex-col justify-between px-2.5 sm:px-4 py-2 sm:py-3.5 max-w-4xl mx-auto relative z-10 select-none animate-fade-in">
      {/* 1. Clean Institutional Header Bar */}
      <div
        className={`w-full max-w-full overflow-hidden border-b pb-3 pt-1 flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        {/* Left: Back Button + Clean Station Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => handleSecurityExit(false)}
            className={`h-10 px-3 sm:px-3.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-xs shrink-0 ${
              isDark
                ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
            }`}
            title="Return to Mode Selection"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Back to Menu</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div className="flex items-center gap-2 truncate">
            <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ${isDark ? 'bg-cyan-400' : 'bg-blue-600'}`} />
            <div>
              <h2 className={`text-sm sm:text-base font-extrabold tracking-tight truncate ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                Return Equipment Station
              </h2>
              <p className={`text-[11px] font-medium hidden sm:block ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                School of Engineering Laboratory Custody
              </p>
            </div>
          </div>
        </div>

        {/* Right: Inactivity Countdown Badge & Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border whitespace-nowrap shadow-xs ${
              secondsLeft <= 10
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : isDark
                ? 'bg-slate-800/90 border-slate-700 text-slate-300'
                : 'bg-white border-slate-300 text-slate-800'
            }`}
            title="Session automatically clears when unattended to protect student data"
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">{secondsLeft}s</span>
            <span className="hidden sm:inline">Auto-reset in {secondsLeft}s</span>
          </div>

          <ThemeToggle />
        </div>
      </div>

      {/* Main Viewport: Step Switching (Direct Full-Screen Content, Zero Floating Box) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto py-2 sm:py-4">
          {/* =========================================================================
              VIEW 1: ID INPUT & VERIFICATION SCREEN (Initial State)
             ========================================================================= */}
          {!lookupAttempted && (
            <div className="my-auto flex flex-col items-center justify-center max-w-md mx-auto w-full py-2 sm:py-4">
              <div className="text-center space-y-1 mb-2.5 sm:mb-4">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-2 ${
                    isDark
                      ? 'neu-inset text-cyan-400'
                      : 'bg-blue-50 text-blue-700 border border-blue-200/80'
                  }`}
                >
                  <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                </div>
                <h2
                  className={`text-lg sm:text-2xl font-black tracking-tight ${
                    isDark ? 'text-slate-100' : 'text-slate-950 font-black'
                  }`}
                >
                  Return Equipment
                </h2>
                <p
                  className={`text-xs sm:text-sm max-w-xs sm:max-w-sm mx-auto ${
                    isDark ? 'text-slate-400' : 'text-slate-600 font-medium'
                  }`}
                >
                  Enter your Student ID to retrieve your active borrowed tools.
                </p>
              </div>

              {/* Lockout Notification Banner */}
              {isLocked && (
                <div className="w-full p-4 rounded-xl bg-rose-100 dark:bg-rose-950/70 border-2 border-rose-500 text-rose-950 dark:text-rose-200 text-center space-y-1.5 animate-pulse mb-3">
                  <div className="flex items-center justify-center gap-2 font-mono font-black text-xs text-rose-600 dark:text-rose-400">
                    <AlertOctagon className="w-4 h-4" />
                    <span>[ SECURITY LOCKOUT // EXCESSIVE ATTEMPTS DETECTED ]</span>
                  </div>
                  <p className="font-mono text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                    COOLDOWN: {lockoutSeconds}s
                  </p>
                  <p className="text-xs font-semibold">
                    Submission locked for 60 seconds after 4 consecutive failed lookups.
                  </p>
                </div>
              )}

              {/* ID Input Box & Digital Display */}
              <div className="w-full space-y-2 mb-2.5">
                <form onSubmit={handleLookup} className="relative">
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      enterKeyHint="done"
                      maxLength={11}
                      disabled={isLocked}
                      autoComplete="off"
                      spellCheck={false}
                      value={enteredId}
                      data-no-osk="true"
                      onChange={(e) => {
                        setInputError('');
                        const formatted = handleStudentIdChange(e.target.value, enteredId);
                        setEnteredId(formatted);
                      }}
                      placeholder="e.g. 23-1374-693"
                      className={`w-full h-12 sm:h-14 px-4 pr-12 rounded-xl font-mono text-center text-lg sm:text-xl tracking-widest font-black focus:outline-none transition-all shadow-inner touch-manipulation disabled:opacity-50 ${
                        inputError
                          ? 'border-2 border-rose-500 ring-2 ring-rose-500/50 text-rose-600'
                          : isDark
                          ? 'neu-inset text-cyan-300 placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-400/50'
                          : 'bg-white border-2 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100'
                      }`}
                    />
                    {enteredId && (
                      <button
                        type="button"
                        onClick={handleClearInput}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Clear Input"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {inputError && (
                    <p className="text-xs text-rose-500 font-semibold text-center mt-2 animate-fadeIn">
                      {inputError}
                    </p>
                  )}
                </form>

                {/* Touch-Friendly On-Screen Numpad (Desktop / Kiosk Viewports >= 1024px Only - Strictly Hidden on Mobile) */}
                <div
                  className={`hidden lg:block p-2 sm:p-2.5 rounded-xl border shadow-sm ${
                    isDark ? 'bg-[#0d1424] border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="grid grid-cols-3 gap-1.5 max-w-xs mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => handleNumpadPress(String(num))}
                        className={`h-10 sm:h-11 rounded-lg font-mono text-base font-bold flex items-center justify-center transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                          isDark
                            ? 'neu-btn-raised text-slate-200 hover:text-white'
                            : 'bg-slate-100 hover:bg-slate-200 border border-slate-200/90 text-slate-900 shadow-2xs'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                    {/* Bottom row: Clear, Zero, Backspace */}
                    <button
                      type="button"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={handleClearInput}
                      className={`h-10 sm:h-11 rounded-lg font-mono text-xs sm:text-sm font-bold flex items-center justify-center transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                        isDark
                          ? 'neu-btn-raised text-amber-400 hover:text-amber-300'
                          : 'bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-800'
                        }`}
                      title="Clear All"
                    >
                      CLR
                    </button>
                    <button
                      type="button"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => handleNumpadPress('0')}
                      className={`h-10 sm:h-11 rounded-lg font-mono text-base font-bold flex items-center justify-center transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                        isDark
                          ? 'neu-btn-raised text-slate-200 hover:text-white'
                          : 'bg-slate-100 hover:bg-slate-200 border border-slate-200/90 text-slate-900 shadow-2xs'
                      }`}
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={handleBackspace}
                      className={`h-10 sm:h-11 rounded-lg font-mono text-sm font-bold flex items-center justify-center transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                        isDark
                          ? 'neu-btn-raised text-rose-400'
                          : 'bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-800'
                      }`}
                      title="Backspace"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Unified ergonomic row on mobile so NO scrolling is needed! */}
              <div className="w-full flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => handleSecurityExit(false)}
                  className={`h-11 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer shrink-0 shadow-xs border ${
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 shadow-xs'
                  }`}
                  title="Return to Mode Selection"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                  <span>BACK</span>
                </button>

                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={!enteredId.trim() || isLocked}
                  className={`flex-1 h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDark
                      ? 'neu-btn-primary text-slate-950 font-black'
                      : 'bg-slate-900 hover:bg-slate-800 text-white font-bold'
                  }`}
                >
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span>Look Up Borrowed Tools</span>
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
                    className={`hidden sm:inline text-[11px] font-mono ${
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
              VIEW 4: CONFIRMATION & QR CODE PDF RECEIPT SCREEN
             ========================================================================= */}
          {isSubmitted && submittedSummary && (
            <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full py-2 sm:py-4">
              <div className="space-y-4">
                {/* Top Status Header Card */}
                <div
                  className={`rounded-2xl px-5 py-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
                    isDark
                      ? 'bg-[#0f172a] border-slate-800 text-slate-100'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                        isDark
                          ? 'bg-emerald-950/70 border-emerald-600 text-emerald-400'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      }`}
                    >
                      <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base sm:text-lg font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                        Pagsasauli Matagumpay na Naitukoy (Cleared)
                      </h3>
                      <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        I-scan ang QR code sa ibaba gamit ang cellphone camera para awtomatikong ma-download ang Fastfood-style PDF resibo.
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-xs sm:text-sm font-black uppercase px-3 py-1.5 rounded-lg border w-fit shrink-0 ${
                      isDark
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    }`}
                  >
                    REF: {submittedSummary.txId}
                  </span>
                </div>

                {/* Main Two-Column Grid: Left = Fastfood-style Ledger Summary, Right = Large QR Code Auto-Download */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                  {/* Left Column (md:col-span-6): Official Fastfood-style Return Summary & Items */}
                  <div
                    className={`md:col-span-6 rounded-2xl border overflow-hidden flex flex-col justify-between shadow-sm ${
                      isDark
                        ? 'bg-[#0f172a] border-slate-800 text-slate-100'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <div>
                      <div
                        className={`px-4 py-3 border-b flex items-center justify-between text-xs sm:text-sm font-black uppercase tracking-wider ${
                          isDark
                            ? 'bg-[#0b1120] border-slate-800 text-slate-200'
                            : 'bg-slate-100 border-slate-300 text-slate-800'
                        }`}
                      >
                        <span>Official Return Receipt Summary</span>
                        <span className="font-mono bg-emerald-600/20 text-emerald-500 px-2 py-0.5 rounded text-xs font-bold">
                          {submittedSummary.returnedCount} Item(s)
                        </span>
                      </div>

                      <div className="p-4 space-y-3 text-xs sm:text-sm font-sans">
                        <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                          <span className={isDark ? 'text-slate-400 font-semibold' : 'text-slate-500 font-bold'}>
                            Student Borrower
                          </span>
                          <span className="font-black uppercase text-sm">
                            {submittedSummary.studentName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                          <span className={isDark ? 'text-slate-400 font-semibold' : 'text-slate-500 font-bold'}>
                            Student ID Number
                          </span>
                          <span className={`font-mono text-sm font-black ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>
                            {submittedSummary.studentId}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                          <span className={isDark ? 'text-slate-400 font-semibold' : 'text-slate-500 font-bold'}>
                            Program & Course
                          </span>
                          <span className="font-extrabold text-xs sm:text-sm text-right">
                            {submittedSummary.program} ({submittedSummary.courseCode})
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                          <span className={isDark ? 'text-slate-400 font-semibold' : 'text-slate-500 font-bold'}>
                            Instructor / Professor
                          </span>
                          <span className="font-bold truncate max-w-[220px]">
                            {submittedSummary.instructor}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className={isDark ? 'text-slate-400 font-semibold' : 'text-slate-500 font-bold'}>
                            Date & Time Returned
                          </span>
                          <span className="font-mono font-bold text-xs">
                            {submittedSummary.date} • {submittedSummary.timestamp}
                          </span>
                        </div>

                        {/* Returned Items List */}
                        <div className="pt-2">
                          <div className={`text-xs font-black uppercase tracking-wider mb-2 flex items-center justify-between ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            <span>Apparatus Checked In</span>
                            <span className="text-[11px] font-mono text-emerald-500 font-bold">STATUS: CLEARED</span>
                          </div>
                          <div className={`rounded-xl border divide-y max-h-44 overflow-y-auto ${
                            isDark ? 'bg-[#090d16] border-slate-800 divide-slate-800' : 'bg-slate-50 border-slate-200 divide-slate-200'
                          }`}>
                            {(submittedSummary.items || []).map((item, idx) => (
                              <div key={idx} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {idx + 1}. {item.name} <span className="font-mono font-normal opacity-70">({item.tagCode})</span>
                                </span>
                                <span className="font-mono font-black shrink-0 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  {item.qtyReturned || item.qty || 1} {item.unit || 'pc'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Direct Kiosk PDF Download Fallback Button */}
                    <div className="p-4 pt-1">
                      <button
                        type="button"
                        onClick={() => generateReturnReceiptPdf(submittedSummary)}
                        className={`w-full h-11 rounded-xl border text-xs sm:text-sm font-black transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 ${
                          isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                        }`}
                      >
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <span>I-download ang Receipt PDF Dito sa Kiosk</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column (md:col-span-6): Phone Camera QR Code Auto-Download Panel (Enlarged) */}
                  <div
                    className={`md:col-span-6 rounded-2xl border overflow-hidden flex flex-col justify-between shadow-sm ${
                      isDark
                        ? 'bg-[#0f172a] border-slate-800 text-slate-100'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <div
                      className={`px-4 py-3 border-b flex items-center justify-between text-xs sm:text-sm font-black uppercase tracking-wider ${
                        isDark
                          ? 'bg-[#0b1120] border-slate-800 text-slate-200'
                          : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-cyan-500" />
                        Mobile PDF Receipt Scan
                      </span>
                      <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                        Fastfood Style
                      </span>
                    </div>

                    <div className="p-5 flex flex-col items-center justify-center text-center flex-1 space-y-3.5">
                      {/* Big, High-Contrast QR Code */}
                      <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-slate-200 dark:border-slate-700">
                        <InstitutionalQrCode value={submittedSummary.qrUrl} size={250} />
                      </div>

                      <div className="space-y-1.5 max-w-sm">
                        <div className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                          <span>Itapat ang Camera ng Cellphone</span>
                        </div>
                        <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          Awtomatikong mag-da-download sa iyong phone ang official <strong className={isDark ? 'text-cyan-300' : 'text-blue-700'}>Fastfood POS-Style Return Clearance Receipt (PDF)</strong> na maipapakita mo agad kay Professor o Laboratory Custodian.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Finish Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => handleSecurityExit(false)}
                  className={`w-full h-12 rounded-xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform duration-75 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                    isDark
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  <span>Tapusin at Bumalik sa Main Screen</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
