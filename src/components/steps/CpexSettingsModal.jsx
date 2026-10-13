import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Loader2, Sparkles, ShieldCheck, Lock, Unlock, Clipboard, Cpu, Terminal } from 'lucide-react';
import { getStoredApiKey, saveApiKey, testGeminiApiKey } from '../../services/cpexAiService';
import { verifyCustodianPin } from '../../utils/authSecurity';
import TouchButton from '../ui/TouchButton';

export default function CpexSettingsModal({ isOpen, onClose, onKeySaved }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  useEffect(() => {
    if (isOpen) {
      setIsAuthenticated(false);
      setPinInput('');
      setPinError('');
      setIsVerifyingPin(false);
      setApiKeyInput('');
      setHasExistingKey(Boolean(getStoredApiKey()));
      setStatus({ state: 'idle', message: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (!pinInput.trim() || isVerifyingPin) return;

    setIsVerifyingPin(true);
    setPinError('');

    try {
      const isValid = await verifyCustodianPin(pinInput.trim());
      if (isValid) {
        setIsAuthenticated(true);
      } else {
        setPinError('Invalid Passcode. Access restricted to Lab Custodian.');
        setPinInput('');
      }
    } catch {
      setPinError('Authentication verification failed.');
      setPinInput('');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setApiKeyInput(text.trim());
      }
    } catch (err) {
      console.warn('[CPEX.SYS] Clipboard read failed:', err);
    }
  };

  const handleTestAndSave = async (e) => {
    e.preventDefault();
    const keyToTest = apiKeyInput.trim();

    if (!keyToTest) {
      if (hasExistingKey) {
        setStatus({ state: 'success', message: 'Existing secured API key is active.' });
      } else {
        saveApiKey('');
        setStatus({ state: 'idle', message: 'CPEX is operating in Local Offline Engine mode.' });
      }
      return;
    }

    setStatus({ state: 'testing', message: 'Verifying with Google Gemini Telemetry API...' });
    const result = await testGeminiApiKey(keyToTest);

    if (result.success) {
      saveApiKey(keyToTest);
      setHasExistingKey(true);
      setApiKeyInput('');
      setStatus({ state: 'success', message: result.message });
      if (onKeySaved) onKeySaved();
    } else {
      setStatus({ state: 'error', message: result.message });
    }
  };

  const handleClear = () => {
    saveApiKey('');
    setApiKeyInput('');
    setHasExistingKey(false);
    setStatus({ state: 'idle', message: 'API key cleared. CPEX running in offline telemetry mode.' });
    if (onKeySaved) onKeySaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md bg-[#0f1728] border-2 border-slate-700/80 rounded-3xl shadow-2xl text-slate-100 flex flex-col max-h-[85vh] overflow-hidden relative">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Terminal className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black font-mono tracking-wider text-white flex items-center gap-2">
                [CPEX.SYS // CONFIG]
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAuthenticated ? 'Gemini 3.6 API Configuration' : 'Custodian Authorization Required'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 cursor-pointer transition-all"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. ADMIN PIN LOCK SCREEN */}
        {!isAuthenticated ? (
          <form onSubmit={handlePinSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-2 text-slate-300">
                <div className="flex items-center gap-2 font-bold text-amber-400 font-mono">
                  <ShieldCheck className="w-4 h-4" />
                  <span>[RESTRICTED // CUSTODIAN-ONLY]</span>
                </div>
                <p className="leading-relaxed text-slate-400">
                  Access restricted to authorized Laboratory Custodians and Computer Engineering Faculty to modify AI telemetry parameters.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
                  Enter Custodian Passcode
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••••"
                  autoFocus
                  className="w-full h-12 px-4 text-center tracking-[0.3em] font-mono text-base rounded-xl bg-[#090d16] border border-slate-700 text-cyan-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {pinError && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-mono">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{pinError}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#0c1322] flex items-center justify-between gap-4 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 active:scale-95 cursor-pointer"
              >
                Cancel
              </button>

              <TouchButton
                variant="primary"
                size="md"
                type="submit"
                icon={Unlock}
              >
                {isVerifyingPin ? 'Verifying...' : 'Unlock Telemetry'}
              </TouchButton>
            </div>
          </form>
        ) : (
          /* 2. AUTHENTICATED API KEY CONFIGURATION */
          <form onSubmit={handleTestAndSave} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-xs space-y-1 text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400 font-mono">
                  <CheckCircle className="w-4 h-4" />
                  <span>[SECURITY STATUS: AUTHENTICATED]</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Configure high-speed Google Gemini API token for dynamic real-time engineering hardware assistance.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold uppercase text-slate-300">
                    Gemini API Key
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Clipboard className="w-3 h-3" />
                    <span>Paste</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={hasExistingKey ? '•••••••••••••••••••••••• (Active)' : 'AIzaSy...'}
                  className="w-full h-11 px-3 font-mono text-xs rounded-xl bg-[#080d16] border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Status Message */}
              {status.state !== 'idle' && (
                <div
                  className={`p-3 rounded-xl text-xs font-mono flex items-start gap-2 border ${
                    status.state === 'testing'
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                      : status.state === 'success'
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {status.state === 'testing' && <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />}
                  {status.state === 'success' && <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  {status.state === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span className="flex-1">{status.message}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#0c1322] flex items-center justify-between gap-3 shrink-0">
              {hasExistingKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-xs font-bold text-rose-300 active:scale-95 cursor-pointer"
                >
                  Clear Key
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 active:scale-95 cursor-pointer"
                >
                  Close
                </button>

                <TouchButton
                  variant="primary"
                  size="md"
                  type="submit"
                  icon={Sparkles}
                >
                  {status.state === 'testing' ? 'Verifying...' : 'Save & Calibrate'}
                </TouchButton>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
