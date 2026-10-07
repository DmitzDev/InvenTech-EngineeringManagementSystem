import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Delete, Lock } from 'lucide-react';
import { verifyCustodianPin, setCustodianSession } from '../../utils/authSecurity';
import { useRateLimiter } from '../../utils/rateLimiter';

export default function AdminLogin({ onAuthenticated, isOpen = true, onClose }) {
  const navigate = useNavigate();

  const [pin, setPin] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Rate Limiter: 4 attempts, 60s cooldown
  const {
    isLocked,
    remainingSeconds,
    failedAttempts,
    maxAttempts,
    recordFailure,
    recordSuccess,
  } = useRateLimiter('admin_auth');

  const handleExit = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  }, [navigate, onClose]);

  const triggerShake = useCallback((message) => {
    setIsShaking(true);
    setErrorText(message);
    setTimeout(() => {
      setIsShaking(false);
    }, 350);
  }, []);

  const checkPin = useCallback(
    async (candidatePin) => {
      const code = candidatePin.trim();
      if (!code || isVerifying || isLocked) return;

      setIsVerifying(true);
      setErrorText('');

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
            triggerShake(`Too many failed attempts. Locked for ${res.remainingSeconds}s.`);
          } else {
            const left = maxAttempts - res.failedAttempts;
            triggerShake(`Incorrect PIN (${left} attempt${left > 1 ? 's' : ''} left)`);
          }
        }
      } catch {
        setPin('');
        triggerShake('Verification error. Try again.');
      } finally {
        setIsVerifying(false);
      }
    },
    [isVerifying, isLocked, recordSuccess, onAuthenticated, navigate, recordFailure, maxAttempts, triggerShake]
  );

  const handleDigit = useCallback(
    (digit) => {
      if (isLocked || isVerifying) return;
      if (pin.length >= 4) return;

      const next = pin + digit;
      setPin(next);
      setErrorText('');

      if (next.length === 4) {
        checkPin(next);
      }
    },
    [isLocked, isVerifying, pin, checkPin]
  );

  const handleBackspace = useCallback(() => {
    if (isLocked || isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorText('');
  }, [isLocked, isVerifying]);

  const handleClear = useCallback(() => {
    if (isLocked || isVerifying) return;
    setPin('');
    setErrorText('');
  }, [isLocked, isVerifying]);

  // Physical keyboard listener (Desktop / Laptop)
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (isLocked || isVerifying) return;

      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleExit();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isLocked, isVerifying, handleDigit, handleBackspace, handleExit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm select-none">
      <style>{`
        @keyframes pinShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .pin-shake {
          animation: pinShake 0.35s ease-in-out;
        }
      `}</style>

      {/* Main Modal Card */}
      <div className="w-full max-w-[320px] sm:max-w-[340px] rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center">
        {/* Header: Logo & Title */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <img
              src="/images/inventech_logo.png"
              alt="InvenTech"
              className="w-8 h-8 object-contain"
            />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Admin Access
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enter your 4-digit PIN
          </p>
        </div>

        {/* Lockout Notice or PIN Dots */}
        {isLocked ? (
          <div className="w-full my-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center">
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Security Lockout
            </p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 my-1 font-mono">
              {remainingSeconds}s
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Too many invalid attempts. Please wait.
            </p>
          </div>
        ) : (
          <>
            {/* PIN Dots Bay */}
            <div
              className={`flex items-center justify-center gap-4 my-6 h-8 ${
                isShaking ? 'pin-shake' : ''
              }`}
            >
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pin.length > idx;
                const hasError = Boolean(errorText) || isShaking;

                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                      hasError
                        ? 'bg-rose-500 border-2 border-rose-500 scale-110'
                        : isFilled
                        ? 'bg-slate-900 dark:bg-white border-2 border-slate-900 dark:border-white scale-110'
                        : 'border-2 border-slate-300 dark:border-slate-700 bg-transparent'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error or Verifying Message */}
            <div className="h-4 -mt-3 mb-3 flex items-center justify-center text-center">
              {errorText ? (
                <span className="text-xs font-medium text-rose-500">{errorText}</span>
              ) : isVerifying ? (
                <span className="text-xs font-medium text-slate-400">Verifying...</span>
              ) : null}
            </div>

            {/* Simple Numpad */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => handleDigit(String(digit))}
                  disabled={isVerifying || isLocked}
                  className="h-13 sm:h-14 rounded-2xl text-xl font-semibold bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-white transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
                  style={{ touchAction: 'manipulation' }}
                >
                  {digit}
                </button>
              ))}

              {/* Clear */}
              <button
                type="button"
                onPointerDown={(e) => e.preventDefault()}
                onClick={handleClear}
                disabled={isVerifying || isLocked || !pin}
                className="h-13 sm:h-14 rounded-2xl text-xs font-semibold uppercase text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30"
                style={{ touchAction: 'manipulation' }}
              >
                Clear
              </button>

              {/* 0 */}
              <button
                type="button"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => handleDigit('0')}
                disabled={isVerifying || isLocked}
                className="h-13 sm:h-14 rounded-2xl text-xl font-semibold bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-white transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
                style={{ touchAction: 'manipulation' }}
              >
                0
              </button>

              {/* Backspace */}
              <button
                type="button"
                onPointerDown={(e) => e.preventDefault()}
                onClick={handleBackspace}
                disabled={isVerifying || isLocked || !pin}
                className="h-13 sm:h-14 rounded-2xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30"
                style={{ touchAction: 'manipulation' }}
                aria-label="Delete"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* Footer: Simple Cancel */}
        <button
          type="button"
          onClick={handleExit}
          className="mt-5 text-xs font-semibold text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer py-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}


