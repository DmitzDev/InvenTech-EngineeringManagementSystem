/**
 * InvenTech Laboratory Management System - Custodian Hardware Override Modal
 * Module: [SYS.SEC // HARDWARE-OVERRIDE-01]
 * 
 * Invoked via 3 successive taps on the [SYS.MOD // 01] emblem.
 * Compact tactile PIN keypad for lab custodians with anti-brute-force lockout protection.
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound,
  ShieldAlert,
  X,
  Delete,
  Lock,
  Unlock,
  AlertOctagon,
  Loader2,
} from 'lucide-react';
import { verifyCustodianPin, setCustodianSession } from '../../utils/authSecurity';
import { useRateLimiter } from '../../utils/rateLimiter';
import { logSecurityEvent, SECURITY_EVENT_TYPES, SEVERITY_LEVELS } from '../../services/securityAuditService';
import { useTransaction } from '../../context/TransactionContext';

export default function CustodianOverrideModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { showToast, theme } = useTransaction();
  const isDark = theme === 'dark';

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Anti-Brute-Force Rate Limiter Guardrail (Max 4 attempts, 60s cooldown)
  const {
    isLocked,
    remainingSeconds,
    failedAttempts,
    maxAttempts,
    recordFailure,
    recordSuccess,
  } = useRateLimiter('admin_auth');

  if (!isOpen) return null;

  const handleDigitPress = (digit) => {
    if (isLocked || isVerifying) return;
    if (pin.length >= 8) return;
    setPin((prev) => prev + digit);
    setError('');
  };

  const handleBackspace = () => {
    if (isLocked || isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    if (isLocked || isVerifying) return;
    setPin('');
    setError('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isLocked || isVerifying || !pin.trim()) return;

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await verifyCustodianPin(pin.trim());

      if (isValid) {
        recordSuccess();
        setCustodianSession('CUSTODIAN_ON_SITE');
        logSecurityEvent({
          eventType: SECURITY_EVENT_TYPES.CUSTODIAN_OVERRIDE,
          actorId: 'CUSTODIAN',
          severity: SEVERITY_LEVELS.INFO,
          details: 'Physical kiosk hardware override successful via emblem combo.',
        });
        showToast('Custodian Access Granted. Switching to Admin Console...', 'success');
        onClose();
        navigate('/admin');
      } else {
        const limiterRes = recordFailure('CUSTODIAN_UNKNOWN', 'Emblem hardware PIN attempt');
        if (limiterRes.isLocked) {
          setError(`SECURITY LOCKOUT // EXCESSIVE ATTEMPTS DETECTED - COOLDOWN ${limiterRes.remainingSeconds}s`);
        } else {
          const attemptsLeft = maxAttempts - limiterRes.failedAttempts;
          setError(`Invalid passcode. ${attemptsLeft} attempt(s) remaining before security lockout.`);
        }
        setPin('');
      }
    } catch (err) {
      setError('Cryptographic authentication failed. Please try again.');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="override-title"
    >
      <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-[#0c1424] border-2 border-slate-300 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-scale-up text-slate-950 dark:text-white">
        {/* Top Monospace Telemetry Strip */}
        <div className="bg-slate-900 text-white dark:bg-slate-800 px-4 py-3 flex items-center justify-between border-b-2 border-slate-700">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-cyan-400">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <span>[SYS.SEC // CUSTODIAN-OVERRIDE]</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-slate-700 active:scale-95 transition-all text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            aria-label="Close override modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="text-center space-y-1">
            <h2 id="override-title" className="text-lg sm:text-xl font-black uppercase tracking-tight">
              On-Site Custodian Override
            </h2>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Hardware quick-access combo recognized. Enter custodian PIN.
            </p>
          </div>

          {/* Cooldown Lockout Warning Alert */}
          {isLocked ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-500 text-rose-900 dark:text-rose-200 text-center space-y-2 animate-pulse">
              <div className="flex items-center justify-center gap-2 font-mono font-black text-xs text-rose-600 dark:text-rose-400">
                <AlertOctagon className="w-4 h-4" />
                <span>[ SECURITY LOCKOUT ACTIVE ]</span>
              </div>
              <p className="font-mono text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                COOLDOWN: {remainingSeconds}s
              </p>
              <p className="text-xs font-medium">
                Form disabled due to 4 consecutive failed attempts.
              </p>
            </div>
          ) : (
            <>
              {/* PIN Display Visual Field */}
              <div className="w-full py-3.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-900/90 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 transition-all ${
                      pin.length > idx
                        ? 'bg-cyan-500 border-cyan-400 scale-110 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                        : 'border-slate-400 dark:border-slate-600 bg-transparent'
                    }`}
                  />
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 text-xs font-bold text-center">
                  {error}
                </div>
              )}

              {/* 44px+ Tactile Numpad Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleDigitPress(String(digit))}
                    disabled={isVerifying || isLocked}
                    className="min-h-[50px] sm:min-h-[56px] rounded-xl text-lg sm:text-xl font-mono font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 border-2 border-slate-300 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 shadow-xs"
                  >
                    {digit}
                  </button>
                ))}

                {/* Clear Button */}
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isVerifying || isLocked || !pin}
                  className="min-h-[50px] sm:min-h-[56px] rounded-xl text-xs font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 active:scale-95 border-2 border-slate-300 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center disabled:opacity-40"
                >
                  CLR
                </button>

                {/* Digit 0 */}
                <button
                  type="button"
                  onClick={() => handleDigitPress('0')}
                  disabled={isVerifying || isLocked}
                  className="min-h-[50px] sm:min-h-[56px] rounded-xl text-lg sm:text-xl font-mono font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 border-2 border-slate-300 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 shadow-xs"
                >
                  0
                </button>

                {/* Backspace Button */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={isVerifying || isLocked || !pin}
                  className="min-h-[50px] sm:min-h-[56px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 active:scale-95 border-2 border-slate-300 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center disabled:opacity-40"
                  aria-label="Backspace"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Submit Override Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isVerifying || isLocked || !pin}
                className="w-full min-h-[52px] rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-black text-sm tracking-wide flex items-center justify-center gap-2 border-2 border-cyan-400 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50 mt-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>VERIFYING DIGEST...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-5 h-5" />
                    <span>UNLOCK ADMIN CONSOLE</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
