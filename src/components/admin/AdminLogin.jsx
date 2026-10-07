/**
 * InvenTech Laboratory Management System - Industrial Custodian Passcode Modal
 * Module: [SYS.SEC // PIN-AUTH-GATEWAY-01]
 * 
 * High-precision skeuomorphic instrument design language matching Kiosk & Admin Console.
 * Tactile 3x4 mechanical keypad, recessed instrument LED tray, rate-limited crypto verification,
 * and zero native input focus to suppress mobile phone soft keyboards.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Unlock,
  Delete,
  ArrowLeft,
  Loader2,
  AlertOctagon,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { verifyCustodianPin, setCustodianSession } from '../../utils/authSecurity';
import { useRateLimiter } from '../../utils/rateLimiter';
import { useTransaction } from '../../context/TransactionContext';

export default function AdminLogin({
  onAuthenticated,
  isOpen = true,
  onClose,
}) {
  const navigate = useNavigate();
  const { theme } = useTransaction ? useTransaction() : { theme: 'dark' };
  const isDark = theme === 'dark';

  const [pin, setPin] = useState('');
  const [errorStatus, setErrorStatus] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Anti-Brute-Force Rate Limiter (Max 4 attempts, 60s cooldown lock)
  const {
    isLocked,
    remainingSeconds,
    failedAttempts,
    maxAttempts,
    recordFailure,
    recordSuccess,
  } = useRateLimiter('admin_auth');

  // Trigger shake animation and error feedback
  const triggerErrorShake = useCallback((message) => {
    setIsShaking(true);
    setErrorStatus(message);
    setTimeout(() => {
      setIsShaking(false);
    }, 350);
  }, []);

  const handleExit = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  }, [navigate, onClose]);

  const executeVerification = useCallback(
    async (candidatePin) => {
      const code = (candidatePin || pin).trim();
      if (!code || isVerifying || isLocked) return;

      setIsVerifying(true);
      setErrorStatus('');

      try {
        const isValid = await verifyCustodianPin(code);
        if (isValid) {
          recordSuccess();
          setCustodianSession('CUSTODIAN');
          if (onAuthenticated) {
            onAuthenticated(true);
          } else {
            navigate('/admin');
          }
        } else {
          const res = recordFailure('CUSTODIAN', 'Portal PIN submission');
          setPin('');
          if (res.isLocked) {
            triggerErrorShake(`LOCKOUT // ${res.remainingSeconds}s COOLDOWN`);
          } else {
            const attemptsLeft = maxAttempts - res.failedAttempts;
            triggerErrorShake(`INVALID CODE (${attemptsLeft} ATTEMPT${attemptsLeft > 1 ? 'S' : ''} LEFT)`);
          }
        }
      } catch {
        setPin('');
        triggerErrorShake('AUTHENTICATION ERROR');
      } finally {
        setIsVerifying(false);
      }
    },
    [pin, isVerifying, isLocked, recordSuccess, onAuthenticated, navigate, recordFailure, maxAttempts, triggerErrorShake]
  );

  const handleDigitPress = useCallback(
    (digit) => {
      if (isLocked || isVerifying) return;
      if (pin.length >= 6) return;

      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorStatus('');

      // Auto-submit when exactly 4 digits are entered
      if (nextPin.length === 4) {
        executeVerification(nextPin);
      }
    },
    [isLocked, isVerifying, pin, executeVerification]
  );

  const handleBackspace = useCallback(() => {
    if (isLocked || isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorStatus('');
  }, [isLocked, isVerifying]);

  const handleClear = useCallback(() => {
    if (isLocked || isVerifying) return;
    setPin('');
    setErrorStatus('');
  }, [isLocked, isVerifying]);

  // Physical Keyboard Listener (Desktop / Laptop / Hardware Numpads)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (isLocked || isVerifying) return;

      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        if (pin.length >= 4) {
          executeVerification(pin);
        }
      } else if (e.key === 'Escape') {
        handleExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, isLocked, isVerifying, handleDigitPress, handleBackspace, executeVerification, handleExit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 dark:bg-black/85 backdrop-blur-md select-none font-sans overflow-y-auto">
      {/* Embedded Skeuomorphic Keyframe Animations */}
      <style>{`
        @keyframes skeuomorphicShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-instrument-shake {
          animation: skeuomorphicShake 0.35s ease-in-out;
        }
      `}</style>

      {/* 1. Chassis & Surface Elevation */}
      <div
        className={`max-w-sm w-full mx-auto p-6 rounded-2xl relative transition-all duration-200 border-2 ${
          isDark
            ? 'bg-slate-900 border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] text-slate-100'
            : 'bg-slate-100 border-slate-300 shadow-[0_20px_50px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.8)] text-slate-900'
        }`}
      >
        {/* Monospace Header Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-black tracking-widest px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-200/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200">
              [SYS.SEC // PIN-AUTH]
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
              AUTHORIZED ONLY
            </span>
          </div>
        </div>

        {/* Console Emblem & Subtitle */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-400/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 mb-2 shadow-xs">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-base font-black tracking-tight text-slate-950 dark:text-white uppercase leading-none">
            ADMIN ACCESS GATEWAY
          </h2>
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-1 uppercase tracking-wider">
            InvenTech Central Console
          </p>
        </div>

        {/* Rate Limiter Active Lockout Banner */}
        {isLocked ? (
          <div className="mt-5 p-4 rounded-xl bg-rose-500/10 border-2 border-rose-500/40 text-center space-y-1.5 animate-pulse">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black text-rose-600 dark:text-rose-400 uppercase font-mono">
              <AlertOctagon className="w-4 h-4" />
              <span>SECURITY LOCKOUT ACTIVE</span>
            </div>
            <p className="text-3xl font-black font-mono text-rose-600 dark:text-rose-400 tabular-nums">
              {remainingSeconds}s
            </p>
            <p className="text-[10px] font-mono text-slate-700 dark:text-slate-300 font-bold uppercase">
              Cooldown enforced // 4 failed attempts recorded
            </p>
          </div>
        ) : (
          <>
            {/* 2. PIN Display Tray (Recessed Digital Instrument Display) */}
            <div className="mt-5">
              <div
                className={`w-full py-4 px-6 rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-slate-200/70 dark:bg-slate-950/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center transition-all ${
                  isShaking ? 'animate-instrument-shake border-rose-500 dark:border-rose-500' : ''
                }`}
              >
                {/* 4 Discrete Indicator Pods/Slots */}
                <div className="flex items-center justify-center gap-4">
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = pin.length > idx;
                    const isError = Boolean(errorStatus) || isShaking;

                    return (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                          isError
                            ? 'bg-rose-500 border border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.8)] scale-110'
                            : isFilled
                            ? 'bg-emerald-500 border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.7)] scale-115'
                            : 'border border-slate-400 dark:border-slate-700 bg-slate-300 dark:bg-slate-800'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Status / Error Readout */}
              <div className="h-5 mt-2 flex items-center justify-center text-center">
                {errorStatus ? (
                  <span className="font-mono text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">
                    {errorStatus}
                  </span>
                ) : isVerifying ? (
                  <span className="font-mono text-[11px] font-black text-sky-600 dark:text-sky-400 flex items-center gap-1.5 uppercase">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>VERIFYING PASSCODE...</span>
                  </span>
                ) : (
                  <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {pin.length === 0 ? 'ENTER 4-DIGIT PIN' : `${pin.length} / 4 DIGITS`}
                  </span>
                )}
              </div>
            </div>

            {/* 3. Tactile Skeuomorphic 3x4 Mechanical Numpad */}
            <div className="grid grid-cols-3 gap-3 w-full mt-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => handleDigitPress(String(digit))}
                  disabled={isVerifying || isLocked}
                  className="h-[52px] sm:h-14 rounded-xl font-mono font-black text-lg select-none cursor-pointer flex items-center justify-center transition-all bg-white text-slate-900 border-2 border-slate-300 shadow-[0_3px_0_#cbd5e1] active:shadow-none active:translate-y-[3px] active:scale-95 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:shadow-[0_3px_0_#020617] dark:active:shadow-none dark:active:translate-y-[3px] dark:hover:bg-slate-750 disabled:opacity-40 disabled:pointer-events-none"
                  style={{ touchAction: 'manipulation' }}
                >
                  {digit}
                </button>
              ))}

              {/* Key 10: Clear / Backspace */}
              <button
                type="button"
                onPointerDown={(e) => e.preventDefault()}
                onClick={handleBackspace}
                onDoubleClick={handleClear}
                disabled={isVerifying || isLocked || !pin}
                className="h-[52px] sm:h-14 rounded-xl font-mono font-black text-sm uppercase select-none cursor-pointer flex items-center justify-center gap-1 transition-all bg-slate-200 text-slate-800 border-2 border-slate-300 shadow-[0_3px_0_#cbd5e1] active:shadow-none active:translate-y-[3px] active:scale-95 hover:bg-slate-300 dark:bg-slate-850 dark:text-slate-200 dark:border-slate-700 dark:shadow-[0_3px_0_#020617] dark:active:shadow-none dark:active:translate-y-[3px] dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                style={{ touchAction: 'manipulation' }}
                title="Tap: Backspace | Double-tap: Clear"
                aria-label="Backspace"
              >
                <Delete className="w-5 h-5" />
              </button>

              {/* Key 11: Digit 0 */}
              <button
                type="button"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => handleDigitPress('0')}
                disabled={isVerifying || isLocked}
                className="h-[52px] sm:h-14 rounded-xl font-mono font-black text-lg select-none cursor-pointer flex items-center justify-center transition-all bg-white text-slate-900 border-2 border-slate-300 shadow-[0_3px_0_#cbd5e1] active:shadow-none active:translate-y-[3px] active:scale-95 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:shadow-[0_3px_0_#020617] dark:active:shadow-none dark:active:translate-y-[3px] dark:hover:bg-slate-750 disabled:opacity-40 disabled:pointer-events-none"
                style={{ touchAction: 'manipulation' }}
              >
                0
              </button>

              {/* Key 12: Submit / Unlock */}
              <button
                type="button"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => executeVerification(pin)}
                disabled={isVerifying || isLocked || pin.length < 4}
                className={`h-[52px] sm:h-14 rounded-xl font-mono font-black text-xs uppercase select-none cursor-pointer flex items-center justify-center gap-1 transition-all border-2 active:scale-95 ${
                  pin.length >= 4 && !isVerifying && !isLocked
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_3px_0_#047857] active:shadow-none active:translate-y-[3px] hover:bg-emerald-500'
                    : 'bg-slate-200 text-slate-400 border-slate-300 shadow-[0_3px_0_#cbd5e1] active:shadow-none active:translate-y-[3px] dark:bg-slate-850 dark:text-slate-500 dark:border-slate-700 dark:shadow-[0_3px_0_#020617] disabled:opacity-40'
                }`}
                style={{ touchAction: 'manipulation' }}
                aria-label="Submit Passcode"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>GO</span>
              </button>
            </div>
          </>
        )}

        {/* 4. Accessibility & Senior Faculty Ergonomics: Cancel / Return Button */}
        <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleExit}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>[ ESC // EXIT TO KIOSK ]</span>
          </button>
        </div>

        {/* Discrete Hardware Badge Footer */}
        <div className="mt-3 flex items-center justify-between text-[9px] font-mono font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase">
          <span>CONSOLE MOD // 01</span>
          <span>SHA-256 ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
}

