/**
 * InvenTech Laboratory Management System - Custodian Access Gateway
 * Module: [SYS.SEC // ACCESS-TERMINAL-01]
 * 
 * Sleek, high-contrast skeuomorphic industrial interface.
 * Zero exposed passcodes, zero verbose text, tactile 44px+ numpad,
 * LED status nodes, and anti-brute-force rate limiting.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Unlock,
  ArrowLeft,
  Loader2,
  Delete,
  AlertOctagon,
  Sun,
  Moon,
  Lock,
} from 'lucide-react';
import { verifyCustodianPin, setCustodianSession } from '../../utils/authSecurity';
import { useRateLimiter } from '../../utils/rateLimiter';
import { useTransaction } from '../../context/TransactionContext';

export default function AdminLogin({ onAuthenticated }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTransaction();
  const isDark = theme === 'dark';

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Anti-Brute-Force Rate Limiter (Max 4 attempts, 60s cooldown lockout)
  const {
    isLocked,
    remainingSeconds,
    failedAttempts,
    maxAttempts,
    recordFailure,
    recordSuccess,
  } = useRateLimiter('admin_auth');

  // Support physical hardware keyboard typing
  useEffect(() => {
    const handlePhysicalKeyDown = (e) => {
      if (isLocked || isVerifying) return;

      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 8) {
          setPin((prev) => prev + e.key);
          setError('');
        }
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setError('');
      } else if (e.key === 'Escape') {
        setPin('');
        setError('');
      } else if (e.key === 'Enter') {
        if (pin.length > 0) {
          submitPin(pin);
        }
      }
    };

    window.addEventListener('keydown', handlePhysicalKeyDown);
    return () => window.removeEventListener('keydown', handlePhysicalKeyDown);
  }, [pin, isLocked, isVerifying]);

  const handleDigitPress = (digit) => {
    if (isLocked || isVerifying) return;
    if (pin.length >= 8) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setError('');

    // Auto-verify if 4 digits entered for maximum speed
    if (nextPin.length === 4) {
      submitPin(nextPin);
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

  const submitPin = async (candidatePin) => {
    const pinToVerify = candidatePin || pin;
    if (!pinToVerify.trim() || isVerifying || isLocked) return;

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await verifyCustodianPin(pinToVerify.trim());
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
          setError(`LOCKOUT // COOLDOWN ${res.remainingSeconds}s`);
        } else {
          const attemptsLeft = maxAttempts - res.failedAttempts;
          setError(`INVALID PASSCODE • ${attemptsLeft} ATTEMPT(S) REMAINING`);
        }
        setPin('');
      }
    } catch {
      setError('AUTHENTICATION FAILED');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={`min-h-screen w-screen flex flex-col justify-between p-3 sm:p-6 select-none transition-colors relative overflow-hidden font-sans ${
      isDark ? 'bg-[#060a12] text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Background Industrial Grid Accent */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle at 50% 50%, rgba(14,165,233,0.1) 0%, transparent 70%)',
        }}
      />

      {/* Top Header Navigation Bar */}
      <header className="w-full flex items-center justify-between max-w-4xl mx-auto z-20">
        <button
          type="button"
          onClick={() => navigate('/')}
          className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-2 transition-all cursor-pointer active:scale-95 shadow-xs ${
            isDark
              ? 'bg-[#0c1424] border-slate-700/80 text-slate-200 hover:text-white hover:border-slate-500'
              : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ArrowLeft className="w-4 h-4 text-cyan-500" />
          <span>Exit to Kiosk</span>
        </button>

        <div className="flex items-center gap-2.5">
          {/* Telemetry Badge */}
          <div className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold ${
            isDark
              ? 'bg-[#0c1424] border-slate-800 text-slate-300'
              : 'bg-white border-slate-300 text-slate-800 shadow-xs'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isLocked ? 'bg-rose-500 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
            <span>{isLocked ? `LOCKOUT // ${remainingSeconds}s` : 'SYS.GATE // ARMED'}</span>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border-2 flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-xs ${
              isDark
                ? 'bg-[#0c1424] border-slate-700/80 text-yellow-400 hover:bg-slate-800'
                : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-50'
            }`}
            title="Toggle Theme"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-900" />}
          </button>
        </div>
      </header>

      {/* Main Tactical Industrial Console */}
      <main className="w-full max-w-sm sm:max-w-md mx-auto my-auto relative z-10 py-4">
        <div className={`w-full rounded-3xl p-6 sm:p-8 border-2 shadow-2xl space-y-6 transition-all ${
          isDark
            ? 'bg-[#0a1222]/95 border-slate-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.85)]'
            : 'bg-white border-slate-300 shadow-xl'
        }`}>
          {/* Header Branding Pill */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className={`w-14 h-14 rounded-2xl p-2 border-2 flex items-center justify-center shadow-inner ${
              isDark ? 'bg-[#060c18] border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <img
                src="/images/udd_logo.png"
                alt="Universidad de Dagupan"
                className="w-full h-full object-contain drop-shadow"
              />
            </div>

            <div>
              <span className="font-mono text-[10px] sm:text-xs font-black tracking-widest uppercase px-2.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-500 dark:text-cyan-400">
                [SYS.SEC // CUSTODIAN GATEWAY]
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-2 text-slate-950 dark:text-white uppercase">
                Laboratory Custodian
              </h1>
            </div>
          </div>

          {/* Rate Limit Lockout Notification Banner */}
          {isLocked ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-500 text-center space-y-1.5 animate-pulse">
              <div className="flex items-center justify-center gap-1.5 font-mono font-black text-xs text-rose-600 dark:text-rose-400">
                <AlertOctagon className="w-4 h-4" />
                <span>[ TERMINAL TEMPORARILY LOCKED ]</span>
              </div>
              <p className="font-mono text-3xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
                {remainingSeconds}s
              </p>
              <p className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">
                4 consecutive invalid attempts. Cooldown enforced.
              </p>
            </div>
          ) : (
            <>
              {/* LED Status Nodes Display (Recessed Chamfered Bay) */}
              <div className={`w-full py-4 px-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 ${
                isDark ? 'bg-[#060c18] border-slate-800' : 'bg-slate-100 border-slate-300'
              }`}>
                <div className="flex items-center gap-4 sm:gap-5">
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = pin.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 transition-all duration-150 ${
                          isFilled
                            ? 'bg-cyan-400 border-cyan-300 scale-110 shadow-[0_0_14px_rgba(6,182,212,0.9)]'
                            : isDark
                            ? 'border-slate-700 bg-slate-900/60'
                            : 'border-slate-400 bg-white'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Error Banner */}
                {error && (
                  <span className="font-mono text-[11px] font-black text-rose-500 dark:text-rose-400 tracking-wider animate-shake">
                    {error}
                  </span>
                )}
              </div>

              {/* Tactile 44px+ Industrial Numpad */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleDigitPress(String(digit))}
                    disabled={isVerifying || isLocked}
                    className={`min-h-[50px] sm:min-h-[54px] rounded-xl font-mono text-xl sm:text-2xl font-black border-2 transition-all duration-75 ease-out active:scale-95 cursor-pointer flex items-center justify-center shadow-xs disabled:opacity-40 ${
                      isDark
                        ? 'bg-[#0d1627] hover:bg-[#121e35] text-slate-100 border-slate-700/80 active:bg-cyan-950/60'
                        : 'bg-slate-50 hover:bg-slate-200 text-slate-900 border-slate-300'
                    }`}
                  >
                    {digit}
                  </button>
                ))}

                {/* Clear */}
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isVerifying || isLocked || !pin}
                  className={`min-h-[50px] sm:min-h-[54px] rounded-xl font-mono text-xs font-black uppercase border-2 transition-all duration-75 active:scale-95 cursor-pointer flex items-center justify-center disabled:opacity-30 ${
                    isDark
                      ? 'bg-[#0d1627] hover:bg-[#121e35] text-amber-400 border-slate-700/80'
                      : 'bg-slate-50 hover:bg-slate-200 text-amber-700 border-slate-300'
                  }`}
                >
                  CLR
                </button>

                {/* 0 */}
                <button
                  type="button"
                  onClick={() => handleDigitPress('0')}
                  disabled={isVerifying || isLocked}
                  className={`min-h-[50px] sm:min-h-[54px] rounded-xl font-mono text-xl sm:text-2xl font-black border-2 transition-all duration-75 ease-out active:scale-95 cursor-pointer flex items-center justify-center shadow-xs disabled:opacity-40 ${
                    isDark
                      ? 'bg-[#0d1627] hover:bg-[#121e35] text-slate-100 border-slate-700/80 active:bg-cyan-950/60'
                      : 'bg-slate-50 hover:bg-slate-200 text-slate-900 border-slate-300'
                  }`}
                >
                  0
                </button>

                {/* Backspace */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={isVerifying || isLocked || !pin}
                  className={`min-h-[50px] sm:min-h-[54px] rounded-xl border-2 transition-all duration-75 active:scale-95 cursor-pointer flex items-center justify-center disabled:opacity-30 ${
                    isDark
                      ? 'bg-[#0d1627] hover:bg-[#121e35] text-slate-300 border-slate-700/80'
                      : 'bg-slate-50 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                  aria-label="Backspace"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Submit CTA Button */}
              <button
                type="button"
                onClick={() => submitPin()}
                disabled={isVerifying || isLocked || !pin}
                className="w-full min-h-[50px] sm:min-h-[54px] rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-black text-sm tracking-wider flex items-center justify-center gap-2 border-2 border-cyan-400 shadow-lg active:scale-98 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>VERIFYING HASH...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-5 h-5" />
                    <span>AUTHENTICATE</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </main>

      {/* Discrete Monospace Footer */}
      <footer className="w-full text-center py-2 relative z-10 flex items-center justify-center gap-2 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-500">
        <Lock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
        <span>SHA-256 ENCRYPTED CONSOLE • UDD-POS-ENG</span>
      </footer>
    </div>
  );
}
