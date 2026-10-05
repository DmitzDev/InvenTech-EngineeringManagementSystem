import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Unlock, ArrowLeft, Loader2, KeyRound, Eye, EyeOff, Lock, Sun, Moon } from 'lucide-react';
import { verifyCustodianPin } from '../../utils/authSecurity';
import { useTransaction } from '../../context/TransactionContext';

export default function AdminLogin({ onAuthenticated }) {
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { theme, toggleTheme } = useTransaction();
  const isDark = theme === 'dark';

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!pin.trim() || isVerifying) return;

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await verifyCustodianPin(pin.trim());
      if (isValid) {
        onAuthenticated(true);
      } else {
        setError('Invalid custodian passcode. Please verify your code and try again.');
        setPin('');
      }
    } catch {
      setError('Authentication failed. Please try again.');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="admin-shell min-h-screen w-screen bg-slate-100 dark:bg-slate-950 text-slate-950 dark:text-white flex flex-col justify-between p-4 sm:p-6 relative select-none animate-fade-in font-sans transition-colors">
      {/* Top Header Navigation */}
      <header className="w-full flex items-center justify-between max-w-5xl mx-auto z-20 py-2">
        <a
          href="/"
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Return to Student Kiosk</span>
        </a>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-yellow-400 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-xs"
            title={isDark ? 'Switch to High-Contrast Light Mode' : 'Switch to High-Contrast Dark Mode'}
            aria-label="Toggle visual contrast theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-900" />
            )}
          </button>

          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SYS.AUTH // READY</span>
          </div>
        </div>
      </header>

      {/* Main Centered Login Container */}
      <main className="w-full max-w-md mx-auto my-auto relative z-10 py-6">
        <div className="w-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-6 sm:p-8 shadow-md space-y-6 text-slate-950 dark:text-white">
          {/* Official University Branding & Monospace Module Pill */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 p-2 flex items-center justify-center shadow-xs">
              <img
                src="/images/udd_logo.png"
                alt="Universidad de Dagupan"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="inline-flex items-center font-mono text-xs font-bold px-2.5 py-0.5 rounded border border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase mb-2">
                [SYS.SEC // 01 • ACCESS CONTROL]
              </span>
              <h1 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                Lab Custodian Portal
              </h1>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                School of Engineering & Architecture — Administrative Console
              </p>
            </div>
          </div>

          {/* Secure Instruction Note with AAA Contrast */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-cyan-700 dark:text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              Enter your designated passcode to access laboratory equipment inventory, student loan authorizations, and real-time transaction telemetry.
            </p>
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                  <span>Custodian Passcode</span>
                </label>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono font-bold">Default: 2026</span>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  maxLength={16}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  autoFocus
                  className="w-full h-12 pl-4 pr-12 text-center tracking-[0.25em] font-mono text-xl font-black rounded-lg bg-slate-50 dark:bg-slate-950 border-2 border-slate-400 dark:border-slate-600 text-slate-950 dark:text-cyan-300 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600 dark:focus:border-cyan-400 transition-all shadow-inner"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] p-2 rounded-md text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                  title={showPassword ? 'Hide passcode' : 'Show passcode'}
                  aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-cyan-700 dark:text-cyan-400" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Error Message with AAA Contrast */}
              {error && (
                <div className="p-3 rounded-lg bg-rose-100 dark:bg-rose-950 border-2 border-rose-500 text-rose-950 dark:text-rose-200 text-xs sm:text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Submit CTA - Min 48px hit area, High Contrast */}
            <button
              type="submit"
              disabled={isVerifying || !pin.trim()}
              className="w-full min-h-[48px] rounded-lg bg-cyan-700 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white font-black text-sm flex items-center justify-center gap-2 border-2 border-cyan-800 dark:border-cyan-500 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5" />
                  <span>Sign In to Custodian Portal</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Institutional Security Footer */}
      <footer className="w-full text-center text-xs font-semibold text-slate-700 dark:text-slate-400 py-3 relative z-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <span>© {new Date().getFullYear()} Universidad de Dagupan</span>
        <span className="hidden sm:inline text-slate-400 dark:text-slate-600">•</span>
        <span className="inline-flex items-center gap-1.5 text-slate-800 dark:text-slate-300 font-bold">
          <Lock className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
          Hardware Locked & Encrypted Console
        </span>
      </footer>
    </div>
  );
}

