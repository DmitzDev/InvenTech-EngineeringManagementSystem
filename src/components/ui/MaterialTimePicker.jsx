import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Keyboard, Clock } from 'lucide-react';

/**
 * MaterialTimePicker
 * Official Material 3 Time Picker Dialog
 * Features:
 * - Clean 12-hour single-ring clock face (12, 1..11) for zero clutter & huge touch targets
 * - Material 3 Segmented AM / PM switch in header
 * - Direct tap on any number button OR smooth radial touch/drag
 * - Auto-advances from Hour to Minute upon hour selection
 * - Exact center pivot dot and line geometry
 * - Manual numeric keypad mode toggle
 * - Clean "Clear", "Cancel", "Set" actions
 */
export default function MaterialTimePicker({
  isOpen,
  initialHour = '08',
  initialMinute = '00',
  initialPeriod = 'AM',
  onSave,
  onClose,
  onClear,
}) {
  const [mode, setMode] = useState('hour'); // 'hour' | 'minute'
  const [inputStyle, setInputStyle] = useState('dial'); // 'dial' | 'keyboard'

  // Time states
  const [hour, setHour] = useState(8); // 1..12
  const [minute, setMinute] = useState(0); // 0..59
  const [period, setPeriod] = useState('AM'); // 'AM' | 'PM'

  // Manual keypad inputs
  const [manualHour, setManualHour] = useState('08');
  const [manualMinute, setManualMinute] = useState('00');

  const dialRef = useRef(null);

  // Sync initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      let h = parseInt(initialHour, 10);
      if (isNaN(h) || h < 1 || h > 12) h = 8;
      let m = parseInt(initialMinute, 10);
      if (isNaN(m) || m < 0 || m > 59) m = 0;
      const p = initialPeriod === 'PM' ? 'PM' : 'AM';

      setHour(h);
      setMinute(m);
      setPeriod(p);
      setManualHour(String(h).padStart(2, '0'));
      setManualMinute(String(m).padStart(2, '0'));
      setMode('hour');
      setInputStyle('dial');
    }
  }, [isOpen, initialHour, initialMinute, initialPeriod]);

  // Sync manual inputs when dial changes
  useEffect(() => {
    setManualHour(String(hour).padStart(2, '0'));
    setManualMinute(String(minute).padStart(2, '0'));
  }, [hour, minute]);

  // Direct selection of an hour
  const selectHour = (h) => {
    setHour(h);
    // Smoothly advance to minute mode
    setTimeout(() => {
      setMode('minute');
    }, 220);
  };

  // Direct selection of a minute
  const selectMinute = (m) => {
    setMinute(m);
  };

  // Dial drag/pointer tracker
  const handlePointerAtPoint = useCallback(
    (clientX, clientY, isRelease = false) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;

      // Angle: 0° at top (12 o'clock), clockwise
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;

      if (mode === 'hour') {
        const index = Math.round(angle / 30) % 12;
        const selectedH = index === 0 ? 12 : index;
        setHour(selectedH);
        if (isRelease) {
          setTimeout(() => setMode('minute'), 200);
        }
      } else {
        const selectedM = Math.round(angle / 6) % 60;
        setMinute(selectedM);
      }
    },
    [mode]
  );

  const onDialPointerDown = (e) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    handlePointerAtPoint(e.clientX, e.clientY, false);
  };

  const onDialPointerMove = (e) => {
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    handlePointerAtPoint(e.clientX, e.clientY, false);
  };

  const onDialPointerUp = (e) => {
    handlePointerAtPoint(e.clientX, e.clientY, true);
  };

  if (!isOpen) return null;

  // Geometry: 256px circle, radius 128px, numbers at radius 96px
  const dialRadius = 128;
  const numRadius = 96;

  let handAngle = 0;
  if (mode === 'hour') {
    handAngle = (hour === 12 ? 0 : hour) * 30;
  } else {
    handAngle = minute * 6;
  }

  const rad = ((handAngle - 90) * Math.PI) / 180;
  const targetX = dialRadius + numRadius * Math.cos(rad);
  const targetY = dialRadius + numRadius * Math.sin(rad);

  // 12 Numbers for Hour Face
  const hoursList = [
    { label: '12', val: 12, angle: 0 },
    { label: '1', val: 1, angle: 30 },
    { label: '2', val: 2, angle: 60 },
    { label: '3', val: 3, angle: 90 },
    { label: '4', val: 4, angle: 120 },
    { label: '5', val: 5, angle: 150 },
    { label: '6', val: 6, angle: 180 },
    { label: '7', val: 7, angle: 210 },
    { label: '8', val: 8, angle: 240 },
    { label: '9', val: 9, angle: 270 },
    { label: '10', val: 10, angle: 300 },
    { label: '11', val: 11, angle: 330 },
  ];

  // 12 Numbers for Minute Face
  const minutesList = [
    { label: '00', val: 0, angle: 0 },
    { label: '05', val: 5, angle: 30 },
    { label: '10', val: 10, angle: 60 },
    { label: '15', val: 15, angle: 90 },
    { label: '20', val: 20, angle: 120 },
    { label: '25', val: 25, angle: 150 },
    { label: '30', val: 30, angle: 180 },
    { label: '35', val: 35, angle: 210 },
    { label: '40', val: 40, angle: 240 },
    { label: '45', val: 45, angle: 270 },
    { label: '50', val: 50, angle: 300 },
    { label: '55', val: 55, angle: 330 },
  ];

  const handleSave = () => {
    let finalH = hour;
    let finalM = minute;

    if (inputStyle === 'keyboard') {
      const parsedH = parseInt(manualHour, 10);
      const parsedM = parseInt(manualMinute, 10);
      if (!isNaN(parsedH)) finalH = Math.max(1, Math.min(12, parsedH));
      if (!isNaN(parsedM)) finalM = Math.max(0, Math.min(59, parsedM));
    }

    const hStr = String(finalH).padStart(2, '0');
    const mStr = String(finalM).padStart(2, '0');

    // 24-hour value
    let h24 = finalH;
    if (period === 'PM' && finalH !== 12) h24 += 12;
    if (period === 'AM' && finalH === 12) h24 = 0;

    onSave?.({
      hour12: hStr,
      minuteStr: mStr,
      period,
      hour24: h24,
      formattedTime: `${hStr}:${mStr} ${period}`,
    });
    onClose?.();
  };

  const handleClear = () => {
    onClear?.();
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[328px] bg-[#222428] rounded-[28px] shadow-2xl border border-white/10 overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 24px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        {/* Top Header Card (Material 3 Header with Time Digits and Segmented AM/PM) */}
        <div className="bg-[#35373c] py-5 px-6 rounded-t-[28px] flex items-center justify-between">
          {/* Big Time Display */}
          <div className="flex items-center font-sans text-5xl font-light tracking-tight select-none">
            <button
              type="button"
              onClick={() => setMode('hour')}
              className={`transition-all cursor-pointer px-2 py-0.5 rounded-lg ${
                mode === 'hour'
                  ? 'bg-[#444850] text-[#a8c7fa] font-normal shadow-xs'
                  : 'text-[#9ea2a9] hover:text-[#d3e3fd]'
              }`}
            >
              {String(hour).padStart(2, '0')}
            </button>
            <span className="text-[#9ea2a9] font-light px-0.5">:</span>
            <button
              type="button"
              onClick={() => setMode('minute')}
              className={`transition-all cursor-pointer px-2 py-0.5 rounded-lg ${
                mode === 'minute'
                  ? 'bg-[#444850] text-[#a8c7fa] font-normal shadow-xs'
                  : 'text-[#9ea2a9] hover:text-[#d3e3fd]'
              }`}
            >
              {String(minute).padStart(2, '0')}
            </button>
          </div>

          {/* Material 3 Segmented AM / PM Button */}
          <div className="flex flex-col rounded-xl overflow-hidden border border-white/10 bg-[#222428] shadow-sm">
            <button
              type="button"
              onClick={() => setPeriod('AM')}
              className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                period === 'AM'
                  ? 'bg-[#a8c7fa] text-[#041e49] shadow-xs'
                  : 'text-[#9ea2a9] hover:text-white'
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => setPeriod('PM')}
              className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border-t border-white/10 ${
                period === 'PM'
                  ? 'bg-[#a8c7fa] text-[#041e49] shadow-xs'
                  : 'text-[#9ea2a9] hover:text-white'
              }`}
            >
              PM
            </button>
          </div>
        </div>

        {/* Content Body: Dial or Keyboard mode */}
        <div className="pt-6 pb-4 px-6 flex flex-col items-center justify-center bg-[#222428]">
          {inputStyle === 'dial' ? (
            /* Dial Circle Plate */
            <div
              ref={dialRef}
              onPointerDown={onDialPointerDown}
              onPointerMove={onDialPointerMove}
              onPointerUp={onDialPointerUp}
              className="relative w-64 h-64 rounded-full bg-[#3c3e44] cursor-pointer touch-none select-none shadow-inner"
            >
              {/* Hand Line (from center to target) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <line
                  x1={dialRadius}
                  y1={dialRadius}
                  x2={targetX}
                  y2={targetY}
                  stroke="#a8c7fa"
                  strokeWidth="2.5"
                />
              </svg>

              {/* Exact Center Pivot Dot */}
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-[#a8c7fa] z-20 pointer-events-none"
                style={{
                  left: `${dialRadius}px`,
                  top: `${dialRadius}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              />

              {/* Selected Bubble Indicator */}
              <div
                className="absolute w-10 h-10 rounded-full bg-[#a8c7fa] flex items-center justify-center z-20 pointer-events-none shadow-md"
                style={{
                  left: `${targetX}px`,
                  top: `${targetY}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span className="font-sans font-bold text-sm text-[#041e49]">
                  {mode === 'hour' ? hour : String(minute).padStart(2, '0')}
                </span>
              </div>

              {/* Numbers on the Clock Face */}
              {(mode === 'hour' ? hoursList : minutesList).map(({ label, val, angle }) => {
                const radA = ((angle - 90) * Math.PI) / 180;
                const x = dialRadius + numRadius * Math.cos(radA);
                const y = dialRadius + numRadius * Math.sin(radA);
                const isSelected = mode === 'hour' ? hour === val : minute === val;

                return (
                  <button
                    key={`${mode}-${label}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (mode === 'hour') selectHour(val);
                      else selectMinute(val);
                    }}
                    className={`absolute w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-sans font-medium transition-all cursor-pointer z-10 active:scale-95 ${
                      isSelected ? 'opacity-0' : 'text-[#d2d4da] hover:text-white hover:bg-white/10'
                    }`}
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Manual Keyboard Numeric Entry Mode */
            <div className="w-64 h-64 flex flex-col items-center justify-center gap-4">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Type Time ({period})
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={manualHour}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, 2);
                    setManualHour(v);
                    const n = parseInt(v, 10);
                    if (!isNaN(n)) setHour(Math.max(1, Math.min(12, n)));
                  }}
                  className="w-20 h-16 rounded-xl bg-[#3c3e44] text-center font-mono text-3xl font-bold text-[#a8c7fa] border border-white/10 focus:border-[#a8c7fa] focus:outline-none"
                  placeholder="08"
                />
                <span className="text-3xl text-slate-400 font-bold">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={manualMinute}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, 2);
                    setManualMinute(v);
                    const n = parseInt(v, 10);
                    if (!isNaN(n)) setMinute(Math.max(0, Math.min(59, n)));
                  }}
                  className="w-20 h-16 rounded-xl bg-[#3c3e44] text-center font-mono text-3xl font-bold text-[#a8c7fa] border border-white/10 focus:border-[#a8c7fa] focus:outline-none"
                  placeholder="00"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="px-5 py-3.5 flex items-center justify-between bg-[#222428] border-t border-white/5">
          {/* Toggle Dial / Keyboard icon */}
          <button
            type="button"
            onClick={() => setInputStyle((prev) => (prev === 'dial' ? 'keyboard' : 'dial'))}
            className="p-1.5 rounded-full text-[#a8c7fa] hover:bg-white/10 transition-colors cursor-pointer active:scale-95"
            title={inputStyle === 'dial' ? 'Switch to text input' : 'Switch to clock dial'}
          >
            {inputStyle === 'dial' ? (
              <Keyboard className="w-5 h-5 text-[#a8c7fa]" />
            ) : (
              <Clock className="w-5 h-5 text-[#a8c7fa]" />
            )}
          </button>

          {/* Action text buttons */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleClear}
              className="text-sm font-medium text-[#a8c7fa] hover:text-[#d3e3fd] transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-[#a8c7fa] hover:text-[#d3e3fd] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-sm font-bold text-[#a8c7fa] hover:text-[#d3e3fd] transition-colors cursor-pointer"
            >
              Set
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
