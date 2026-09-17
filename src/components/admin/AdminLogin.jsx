import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Unlock, ArrowLeft, Loader2, KeyRound, Eye, EyeOff, Lock } from 'lucide-react';
import { verifyCustodianPin } from '../../utils/authSecurity';

export default function AdminLogin({ onAuthenticated }) {
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

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
    <div className="admin-shell min-h-screen w-screen bg-[#080d1a] text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative select-none animate-fade-in font-sans">
      {/* Top Header Navigation */}
      <header className="w-full flex items-center justify-between max-w-5xl mx-auto z-20 py-1">
        <a
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0e1626] border border-slate-800 text-xs font-semibold text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all active:scale-95 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Return to Student Kiosk</span>
        </a>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0e1626]/80 border border-slate-800/80 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>SYSTEM READY</span>
          </div>
        </div>
      </header>

      {/* Main Centered Login Container */}
      <main className="w-full max-w-md mx-auto my-auto relative z-10 py-6">
        <div className="w-full bg-[#0c1424] border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100 relative">
          {/* Official University Branding */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#080e1a] border border-slate-700/80 p-2 flex items-center justify-center shadow-md">
              <img
                src="/images/udd_logo.png"
                alt="Universidad de Dagupan"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold text-cyan-400 tracking-wider uppercase">
                Universidad de Dagupan
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Lab Custodian Portal
              </h1>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                School of Engineering & Architecture — Administrative Console
              </p>
            </div>
          </div>

          {/* Secure Instruction Note */}
          <div className="p-3.5 rounded-2xl bg-[#080e1a] border border-slate-800/80 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              Enter your designated passcode to access equipment inventory, student reservation requests, and clearance audit logs.
            </p>
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Custodian Passcode</span>
                </label>
                <span className="text-[11px] text-slate-500 font-mono">Default: 2026</span>
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
                  className="w-full h-12 pl-4 pr-11 text-center tracking-[0.25em] font-mono text-lg font-bold rounded-2xl bg-[#070d18] border border-slate-800 text-cyan-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-inner"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide passcode' : 'Show passcode'}
                  aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span className="font-medium">{error}</span>
                </div>
              )}
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isVerifying || !pin.trim()}
              className="w-full h-12 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Sign In to Custodian Portal</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Institutional Security Footer */}
      <footer className="w-full text-center text-xs text-slate-500 py-2 relative z-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <span>© {new Date().getFullYear()} Universidad de Dagupan</span>
        <span className="hidden sm:inline text-slate-700">•</span>
        <span className="flex items-center gap-1 text-slate-400 font-medium">
          <Lock className="w-3 h-3 text-cyan-400" />
          End-to-End Local Session Security
        </span>
      </footer>
    </div>
  );
}
