/**
 * InvenTech Laboratory Management System - Monochromatic Custodian Access Terminal
 * Module: [SYS.SEC // ACCESS-KEYPAD-01]
 * 
 * Non-colorful, minimalist stealth industrial vault keypad.
 * Pure button-driven numpad with zero native input focus to completely prevent
 * mobile OS virtual keyboards from popping up on phones.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Delete, ArrowLeft, Loader2, AlertOctagon } from 'lucide-react';
import { verifyCustodianPin, setCustodianSession } from '../../utils/authSecurity';
import { useRateLimiter } from '../../utils/rateLimiter';

export default function AdminLogin({ onAuthenticated }) {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Anti-Brute-Force Rate Limiter (Max 4 attempts, 60s cooldown lock)
  const {
    isLocked,
    remainingSeconds,
    failedAttempts,
    maxAttempts,
    recordFailure,
    recordSuccess,
  } = useRateLimiter('admin_auth');

  // Support physical hardware keyboard (for desktop/laptop keyboards only)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isLocked || isVerifying) return;

      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isLocked, isVerifying]);

  const handleDigitPress = (digit) => {
    if (isLocked || isVerifying) return;
    if (pin.length >= 6) return;

    const nextPin = pin + digit;
    setPin(nextPin);
    setError('');

    // Auto-verify on 4th digit
    if (nextPin.length === 4) {
      executeVerification(nextPin);
    }
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

  const executeVerification = async (candidatePin) => {
    const code = candidatePin || pin;
    if (!code.trim() || isVerifying || isLocked) return;

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await verifyCustodianPin(code.trim());
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
        if (res.isLocked) {
          setError(`LOCKOUT // ${res.remainingSeconds}s`);
        } else {
          const attemptsLeft = maxAttempts - res.failedAttempts;
          setError(`INVALID (${attemptsLeft} ATTEMPT${attemptsLeft > 1 ? 'S' : ''} LEFT)`);
        }
        setPin('');
      }
    } catch {
      setError('AUTH FAILED');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen h-[100dvh] w-full flex flex-col justify-between items-center p-4 bg-[#0a0d14] text-slate-100 select-none overflow-hidden font-mono">
      {/* Top Header: Simple return link */}
      <header className="w-full max-w-sm flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="h-10 px-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 border border-slate-800 bg-[#0f1420]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kiosk</span>
        </button>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>TERMINAL ACCESS</span>
        </div>
      </header>

      {/* Center: Monochromatic Hardware Keypad Panel */}
      <main className="w-full max-w-[320px] my-auto flex flex-col items-center">
        {/* Terminal Header */}
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-bold">
            CUSTODIAN ACCESS
          </p>
          <p className="text-[11px] text-slate-600 mt-1">
            ENTER 4-DIGIT PASSCODE
          </p>
        </div>

        {/* Lockout Screen */}
        {isLocked ? (
          <div className="w-full p-6 rounded-2xl bg-[#141824] border border-rose-500/40 text-center space-y-2 mb-6 animate-pulse">
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-bold">
              <AlertOctagon className="w-4 h-4" />
              <span>SECURITY LOCKOUT</span>
            </div>
            <p className="text-4xl font-black text-rose-400 tabular-nums my-1">
              {remainingSeconds}s
            </p>
            <p className="text-[11px] text-slate-400">
              Cooldown active due to invalid attempts.
            </p>
          </div>
        ) : (
          <>
            {/* PIN Dots Bay (Monochrome indicator, pure white / slate) */}
            <div className="flex items-center justify-center gap-4 mb-8 h-8">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border transition-all duration-150 ${
                      isFilled
                        ? 'bg-white border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                        : 'border-slate-700 bg-transparent'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            <div className="h-5 mb-3 flex items-center justify-center text-center">
              {error ? (
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                  {error}
                </span>
              ) : isVerifying ? (
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                  <span>CHECKING...</span>
                </span>
              ) : null}
            </div>

            {/* Hardware-Style Tactile Numpad (Monochrome Matte Finish) */}
            <div className="w-full grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => handleDigitPress(String(digit))}
                  disabled={isVerifying || isLocked}
                  className="h-14 rounded-2xl text-xl font-bold bg-[#121722] hover:bg-[#1a2130] active:bg-white active:text-slate-950 text-slate-200 border border-slate-800 active:border-white transition-all duration-75 flex items-center justify-center cursor-pointer shadow-xs disabled:opacity-40"
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
                className="h-14 rounded-2xl text-xs font-bold uppercase bg-[#121722] hover:bg-[#1a2130] active:bg-[#20293a] text-slate-400 border border-slate-800 transition-all duration-75 flex items-center justify-center cursor-pointer disabled:opacity-30"
                style={{ touchAction: 'manipulation' }}
              >
                CLR
              </button>

              {/* 0 */}
              <button
                type="button"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => handleDigitPress('0')}
                disabled={isVerifying || isLocked}
                className="h-14 rounded-2xl text-xl font-bold bg-[#121722] hover:bg-[#1a2130] active:bg-white active:text-slate-950 text-slate-200 border border-slate-800 active:border-white transition-all duration-75 flex items-center justify-center cursor-pointer shadow-xs disabled:opacity-40"
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
                className="h-14 rounded-2xl bg-[#121722] hover:bg-[#1a2130] active:bg-[#20293a] text-slate-400 border border-slate-800 transition-all duration-75 flex items-center justify-center cursor-pointer disabled:opacity-30"
                style={{ touchAction: 'manipulation' }}
                aria-label="Delete"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </main>

      {/* Discrete Bottom Indicator */}
      <footer className="w-full text-center py-2 text-[10px] text-slate-600 tracking-widest uppercase">
        UDD • SYS.MOD 01
      </footer>
    </div>
  );
}
