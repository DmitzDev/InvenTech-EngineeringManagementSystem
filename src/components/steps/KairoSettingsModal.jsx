import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Loader2, Sparkles, ShieldCheck, Lock, Unlock, Clipboard } from 'lucide-react';
import { getStoredApiKey, saveApiKey, testGeminiApiKey } from '../../services/kairoAiService';
import { verifyCustodianPin } from '../../utils/authSecurity';
import TouchButton from '../ui/TouchButton';

export default function KairoSettingsModal({ isOpen, onClose, onKeySaved }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [status, setStatus] = useState({ state: 'idle', message: '' }); // 'idle' | 'testing' | 'success' | 'error'

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

  // Handle Admin PIN Unlock using Cryptographic Salted Hash
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
      console.warn('Clipboard read failed:', err);
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
        setStatus({ state: 'idle', message: 'Kairo AI is using Local Offline Engine.' });
      }
      return;
    }

    setStatus({ state: 'testing', message: 'Verifying with Google Gemini API...' });
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
    setStatus({ state: 'idle', message: 'API key removed. Running in offline mode.' });
    if (onKeySaved) onKeySaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md bg-[#0f1728] border border-slate-700/80 rounded-3xl shadow-2xl text-slate-100 flex flex-col max-h-[85vh] overflow-hidden relative">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 neu-inset flex items-center justify-center text-cyan-400">
              {isAuthenticated ? <Unlock className="w-5 h-5 text-cyan-400" /> : <Lock className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Kairo AI Settings
              </h3>
              <p className="text-xs text-slate-400">
                {isAuthenticated ? 'Gemini API Portal' : 'Custodian Passcode Required'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl neu-btn-raised text-slate-400 hover:text-white flex items-center justify-center active:scale-95 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. ADMIN PIN LOCK SCREEN */}
        {!isAuthenticated ? (
          <form onSubmit={handlePinSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="p-4 rounded-2xl neu-inset text-xs space-y-2 text-slate-300">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Custodian Security Lock:</span>
                </div>
                <p className="leading-relaxed text-slate-400">
                  Ang portal na ito ay para lamang sa awtorisadong <strong>Laboratory Custodians & Instructors</strong> upang protektahan ang system configuration.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Enter Custodian Passcode
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••••"
                  autoFocus
                  className="w-full h-12 px-4 text-center tracking-[0.3em] font-mono text-base rounded-xl neu-inset text-cyan-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {pinError && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
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
                className="min-h-[48px] px-5 py-2.5 rounded-xl neu-btn-raised text-xs font-bold text-slate-400 hover:text-slate-200 active:scale-95 cursor-pointer"
              >
                Cancel
              </button>

              <TouchButton
                variant="primary"
                size="md"
                type="submit"
                icon={Unlock}
              >
                Unlock Settings
              </TouchButton>
            </div>
          </form>
        ) : (
          /* 2. UNLOCKED ADMIN SETTINGS FORM (Strictly Masked Password Field) */
          <form onSubmit={handleTestAndSave} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Informational description */}
              <div className="p-3.5 rounded-2xl neu-inset text-xs space-y-2 text-slate-300">
                <div className="flex items-center gap-2 font-bold text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Google Gemini AI Engine:</span>
                </div>
                <p className="leading-relaxed text-slate-400">
                  I-paste ang iyong Google Gemini API Key. Naka-mask ito para sa seguridad.
                </p>
              </div>

              {/* Key Active Security Shield */}
              {hasExistingKey && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-emerald-300 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>API Key Active & Encrypted</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    PROTECTED
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    {hasExistingKey ? 'Update / Replace API Key' : 'Enter Gemini API Key'}
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="min-h-[36px] text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-btn-raised cursor-pointer active:scale-95"
                    title="Paste from clipboard"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Paste Key</span>
                  </button>
                </div>

                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={hasExistingKey ? '••••••••••••••••••••••••••••••••••••' : 'Paste API Key (AIzaSy...)'}
                  autoComplete="off"
                  className="w-full h-12 px-3.5 rounded-xl neu-inset text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />

                <p className="text-[10px] text-slate-500 font-mono">
                  {hasExistingKey
                    ? 'Key is saved securely. Leave blank if you want to keep the current key.'
                    : 'Key will be saved encrypted in this terminal.'}
                </p>
              </div>

              {/* Status Message Display */}
              {status.state !== 'idle' && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    status.state === 'testing'
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                      : status.state === 'success'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {status.state === 'testing' && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                  {status.state === 'success' && <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />}
                  {status.state === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                  <span className="leading-snug">{status.message}</span>
                </div>
              )}
            </div>

            {/* Pinned Action Buttons with 16px Gap */}
            <div className="p-4 border-t border-slate-800 bg-[#0c1322] flex items-center justify-between gap-4 shrink-0">
              <button
                type="button"
                onClick={handleClear}
                className="min-h-[48px] text-xs text-slate-400 hover:text-rose-400 px-4 py-2.5 rounded-xl neu-btn-raised cursor-pointer active:scale-95 font-semibold"
              >
                Clear Key
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[48px] px-5 py-2.5 rounded-xl neu-btn-raised text-xs font-bold text-slate-300 cursor-pointer active:scale-95"
                >
                  Close
                </button>
                <TouchButton
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={status.state === 'testing'}
                  icon={status.state === 'testing' ? Loader2 : CheckCircle}
                >
                  {status.state === 'testing' ? 'Verifying...' : 'Save & Lock'}
                </TouchButton>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

