import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Check, X, ArrowRight } from 'lucide-react';

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const QUICK_MINUTES = ['00', '15', '30', '45'];

// Radius of the numbers circle from center (center is at 130px, 130px in a 260px circle)
const RADIUS = 96;
const CENTER = 130;

export default function CircularClockModal({
  isOpen,
  title = 'Select Time',
  initialHour = '08',
  initialMinute = '00',
  initialPeriod = 'AM',
  onSave,
  onClose,
  isDark = true,
  nextActionLabel = null,
  onNextAction = null,
}) {
  const [mode, setMode] = useState('hours'); // 'hours' | 'minutes'
  const [selectedHour, setSelectedHour] = useState('08');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');

  useEffect(() => {
    if (isOpen) {
      setSelectedHour(initialHour ? initialHour.padStart(2, '0') : '08');
      setSelectedMinute(initialMinute ? initialMinute.padStart(2, '0') : '00');
      setSelectedPeriod(initialPeriod || 'AM');
      setMode('hours');
    }
  }, [isOpen, initialHour, initialMinute, initialPeriod]);

  // Keyboard accessibility (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Hand rotation angle
  const handAngle = useMemo(() => {
    if (mode === 'hours') {
      const h = parseInt(selectedHour || '12', 10);
      return (h % 12) * 30;
    } else {
      const m = parseInt(selectedMinute || '0', 10);
      return m * 6;
    }
  }, [mode, selectedHour, selectedMinute]);

  if (!isOpen) return null;

  const handleHourSelect = (h) => {
    const formatted = String(h).padStart(2, '0');
    setSelectedHour(formatted);
    // Smooth auto-transition to minutes mode after brief tap feedback
    setTimeout(() => {
      setMode('minutes');
    }, 280);
  };

  const handleMinuteSelect = (m) => {
    setSelectedMinute(String(m).padStart(2, '0'));
  };

  const handleConfirm = () => {
    onSave({
      hour: selectedHour,
      minute: selectedMinute,
      period: selectedPeriod,
    });
    onClose();
  };

  const handleNextFlow = () => {
    onSave({
      hour: selectedHour,
      minute: selectedMinute,
      period: selectedPeriod,
    });
    if (onNextAction) {
      onNextAction();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div
        className={`w-full max-w-[360px] sm:max-w-[380px] rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isDark
            ? 'bg-[#0b1324] border-slate-700/80 text-slate-100 shadow-cyan-950/40'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-[#070c18]' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${
              isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-700'
            }`}>
              <Clock className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
              {title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500'
            }`}
            title="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 2. Big Digital Clock Readout & Mode Switcher */}
        <div className={`py-3.5 px-4 flex items-center justify-center gap-3 border-b ${
          isDark ? 'border-slate-800/80 bg-[#0d1629]' : 'border-slate-100 bg-blue-50/50'
        }`}>
          <div className="flex items-center gap-1 font-mono">
            {/* Hour Segment */}
            <button
              type="button"
              onClick={() => setMode('hours')}
              className={`px-3 py-1.5 rounded-xl text-3xl sm:text-4xl font-black tracking-tight transition-all cursor-pointer ${
                mode === 'hours'
                  ? isDark
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-blue-600 text-white shadow-md'
                  : isDark
                  ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {selectedHour}
            </button>

            <span className="text-2xl sm:text-3xl font-black opacity-40 select-none pb-1">:</span>

            {/* Minute Segment */}
            <button
              type="button"
              onClick={() => setMode('minutes')}
              className={`px-3 py-1.5 rounded-xl text-3xl sm:text-4xl font-black tracking-tight transition-all cursor-pointer ${
                mode === 'minutes'
                  ? isDark
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-blue-600 text-white shadow-md'
                  : isDark
                  ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {selectedMinute}
            </button>
          </div>

          {/* AM / PM Toggle Pills */}
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setSelectedPeriod('AM')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black transition-all cursor-pointer border ${
                selectedPeriod === 'AM'
                  ? isDark
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs'
                    : 'bg-amber-500 text-white border-amber-500 font-black shadow-xs'
                  : isDark
                  ? 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-slate-200'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('PM')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black transition-all cursor-pointer border ${
                selectedPeriod === 'PM'
                  ? isDark
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-xs'
                    : 'bg-blue-600 text-white border-blue-600 font-black shadow-xs'
                  : isDark
                  ? 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-slate-200'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
              }`}
            >
              PM
            </button>
          </div>
        </div>

        {/* 3. Circular Clock Dial */}
        <div className="py-4 flex flex-col items-center justify-center">
          <div
            className={`relative w-[260px] h-[260px] rounded-full border shadow-inner flex items-center justify-center ${
              isDark
                ? 'bg-[#070c18] border-slate-800 shadow-black/80'
                : 'bg-slate-100/70 border-slate-200/80 shadow-slate-200/60'
            }`}
          >
            {/* Center Pivot Dot */}
            <div
              className={`absolute z-20 w-3.5 h-3.5 rounded-full pointer-events-none ${
                isDark ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-blue-600'
              }`}
              style={{ left: `${CENTER - 7}px`, top: `${CENTER - 7}px` }}
            />

            {/* Rotating Clock Hand */}
            <div
              className="absolute pointer-events-none transition-transform duration-250 ease-out z-10"
              style={{
                width: '2px',
                height: `${RADIUS}px`,
                left: `${CENTER - 1}px`,
                top: `${CENTER - RADIUS}px`,
                transformOrigin: `1px ${RADIUS}px`,
                transform: `rotate(${handAngle}deg)`,
              }}
            >
              {/* Hand Line */}
              <div
                className={`w-full h-full ${
                  isDark ? 'bg-cyan-400/90 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-blue-600'
                }`}
              />
              {/* Hand Selector Disc wrapping the selected number */}
              <div
                className={`absolute -top-4 -left-4 w-9 h-9 rounded-full ${
                  isDark
                    ? 'bg-cyan-500/30 border-2 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                    : 'bg-blue-600/30 border-2 border-blue-600 shadow-sm'
                }`}
              />
            </div>

            {/* Numbers on the dial */}
            {mode === 'hours'
              ? HOURS.map((h) => {
                  const angleRad = (h * 30 - 90) * (Math.PI / 180);
                  const x = Math.round(CENTER + RADIUS * Math.cos(angleRad));
                  const y = Math.round(CENTER + RADIUS * Math.sin(angleRad));
                  const isSelected = parseInt(selectedHour, 10) === h;

                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleHourSelect(h)}
                      className={`absolute w-9 h-9 -ml-[18px] -mt-[18px] rounded-full flex items-center justify-center font-mono text-sm font-black transition-all cursor-pointer z-20 active:scale-95 ${
                        isSelected
                          ? isDark
                            ? 'text-cyan-300 font-black'
                            : 'text-blue-900 font-black'
                          : isDark
                          ? 'text-slate-200 hover:text-cyan-400 hover:scale-110'
                          : 'text-slate-800 hover:text-blue-600 hover:scale-110'
                      }`}
                      style={{ left: `${x}px`, top: `${y}px` }}
                    >
                      {h}
                    </button>
                  );
                })
              : MINUTES.map((m, idx) => {
                  const angleRad = ((idx + 1) * 30 - 90) * (Math.PI / 180);
                  const x = Math.round(CENTER + RADIUS * Math.cos(angleRad));
                  const y = Math.round(CENTER + RADIUS * Math.sin(angleRad));
                  const isSelected = selectedMinute === m;

                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMinuteSelect(m)}
                      className={`absolute w-9 h-9 -ml-[18px] -mt-[18px] rounded-full flex items-center justify-center font-mono text-xs font-black transition-all cursor-pointer z-20 active:scale-95 ${
                        isSelected
                          ? isDark
                            ? 'text-cyan-300 font-black'
                            : 'text-blue-900 font-black'
                          : isDark
                          ? 'text-slate-200 hover:text-cyan-400 hover:scale-110'
                          : 'text-slate-800 hover:text-blue-600 hover:scale-110'
                      }`}
                      style={{ left: `${x}px`, top: `${y}px` }}
                    >
                      {m}
                    </button>
                  );
                })}
          </div>

          {/* Quick 15-Minute Increment Bar (when in minutes mode) */}
          <div className="flex items-center gap-1.5 mt-3">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Quick Min:
            </span>
            {QUICK_MINUTES.map((qm) => (
              <button
                key={qm}
                type="button"
                onClick={() => {
                  setMode('minutes');
                  handleMinuteSelect(qm);
                }}
                className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold transition-all active:scale-95 cursor-pointer border ${
                  selectedMinute === qm
                    ? isDark
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                      : 'bg-blue-600 text-white border-blue-600'
                    : isDark
                    ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                :{qm}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Footer Actions */}
        <div className={`p-3 border-t flex items-center justify-between gap-2 ${
          isDark ? 'border-slate-800 bg-[#070c18]' : 'border-slate-100 bg-slate-50'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {nextActionLabel && (
              <button
                type="button"
                onClick={handleNextFlow}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-slate-800 text-cyan-300 hover:bg-slate-700 border border-slate-700'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <span>{nextActionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
                isDark
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-cyan-950'
                  : 'bg-blue-600 hover:bg-blue-700 text-white font-black'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Confirm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
