import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Keyboard, Clock } from 'lucide-react';

/**
 * MaterialTimePicker
 * 1:1 Recreation of Android Material 3 Time Picker Dialog
 * Features:
 * - 24-hour dual-ring clock dial (Outer: 1-12, Inner: 00, 13-23)
 * - Auto-advances from Hour selection to Minute selection on release
 * - Interactive touch / drag / click tracking with accurate angles
 * - Mode toggle between Dial and Keyboard manual numeric entry
 * - "Clear", "Cancel", "Set" action buttons
 */
export default function MaterialTimePicker({
  isOpen,
  title = 'Select time',
  initialHour24 = 8,
  initialMinute = 0,
  onSave,
  onClose,
  onClear,
}) {
  const [mode, setMode] = useState('hour'); // 'hour' | 'minute'
  const [inputStyle, setInputStyle] = useState('dial'); // 'dial' | 'keyboard'
  const [selectedHour, setSelectedHour] = useState(initialHour24);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);
  const [isDragging, setIsDragging] = useState(false);

  // Manual keyboard input temp states
  const [manualHour, setManualHour] = useState('');
  const [manualMinute, setManualMinute] = useState('');

  const dialRef = useRef(null);

  // Sync state whenever modal opens or initial values change
  useEffect(() => {
    if (isOpen) {
      const h = Number.isInteger(initialHour24) ? Math.max(0, Math.min(23, initialHour24)) : 8;
      const m = Number.isInteger(initialMinute) ? Math.max(0, Math.min(59, initialMinute)) : 0;
      setSelectedHour(h);
      setSelectedMinute(m);
      setManualHour(String(h).padStart(2, '0'));
      setManualMinute(String(m).padStart(2, '0'));
      setMode('hour');
      setInputStyle('dial');
    }
  }, [isOpen, initialHour24, initialMinute]);

  // Update manual inputs when dial changes
  useEffect(() => {
    setManualHour(String(selectedHour).padStart(2, '0'));
    setManualMinute(String(selectedMinute).padStart(2, '0'));
  }, [selectedHour, selectedMinute]);

  // Calculate hour/minute from pointer event on dial
  const handleDialPointer = useCallback(
    (e, isRelease = false) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
      if (clientX === undefined || clientY === undefined) return;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      // Angle in degrees (0° = 12 o'clock, 90° = 3 o'clock, 180° = 6 o'clock, 270° = 9 o'clock)
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;

      if (mode === 'hour') {
        // Outer ring: radius ~92px, Inner ring: radius ~58px. Boundary at 75px
        const isInner = dist < 75;
        const index = Math.round(angle / 30) % 12; // 0..11

        let hourVal;
        if (isInner) {
          // Inner: 00 at 0°, 13 at 30°, 14 at 60° ... 23 at 330°
          hourVal = index === 0 ? 0 : index + 12;
        } else {
          // Outer: 12 at 0°, 1 at 30°, 2 at 60° ... 11 at 330°
          hourVal = index === 0 ? 12 : index;
        }
        setSelectedHour(hourVal);

        // Auto advance to minute when released
        if (isRelease) {
          setMode('minute');
        }
      } else {
        // Minute mode: 60 minutes around the circle
        const minuteVal = Math.round(angle / 6) % 60;
        setSelectedMinute(minuteVal);
      }
    },
    [mode]
  );

  const onPointerDown = (e) => {
    setIsDragging(true);
    handleDialPointer(e, false);
    window.addEventListener('pointermove', onGlobalPointerMove);
    window.addEventListener('pointerup', onGlobalPointerUp);
  };

  const onGlobalPointerMove = (e) => {
    handleDialPointer(e, false);
  };

  const onGlobalPointerUp = (e) => {
    setIsDragging(false);
    handleDialPointer(e, true);
    window.removeEventListener('pointermove', onGlobalPointerMove);
    window.removeEventListener('pointerup', onGlobalPointerUp);
  };

  // Clean up global listeners on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onGlobalPointerMove);
      window.removeEventListener('pointerup', onGlobalPointerUp);
    };
  }, []);

  if (!isOpen) return null;

  // Geometry calculations for selected indicator
  const dialRadius = 128; // dial is 256px diameter
  let handAngle = 0;
  let handRadius = 92; // default outer ring

  if (mode === 'hour') {
    const isInner = selectedHour === 0 || selectedHour >= 13;
    handRadius = isInner ? 58 : 92;
    if (isInner) {
      handAngle = (selectedHour === 0 ? 0 : selectedHour - 12) * 30;
    } else {
      handAngle = (selectedHour === 12 ? 0 : selectedHour) * 30;
    }
  } else {
    handRadius = 92;
    handAngle = selectedMinute * 6;
  }

  // Convert degrees to radians for hand position
  const rad = ((handAngle - 90) * Math.PI) / 180;
  const targetX = dialRadius + handRadius * Math.cos(rad);
  const targetY = dialRadius + handRadius * Math.sin(rad);

  // Outer and Inner hour definitions for dial display
  const outerHours = [
    { label: '12', hour: 12, angle: 0 },
    { label: '1', hour: 1, angle: 30 },
    { label: '2', hour: 2, angle: 60 },
    { label: '3', hour: 3, angle: 90 },
    { label: '4', hour: 4, angle: 120 },
    { label: '5', hour: 5, angle: 150 },
    { label: '6', hour: 6, angle: 180 },
    { label: '7', hour: 7, angle: 210 },
    { label: '8', hour: 8, angle: 240 },
    { label: '9', hour: 9, angle: 270 },
    { label: '10', hour: 10, angle: 300 },
    { label: '11', hour: 11, angle: 330 },
  ];

  const innerHours = [
    { label: '00', hour: 0, angle: 0 },
    { label: '13', hour: 13, angle: 30 },
    { label: '14', hour: 14, angle: 60 },
    { label: '15', hour: 15, angle: 90 },
    { label: '16', hour: 16, angle: 120 },
    { label: '17', hour: 17, angle: 150 },
    { label: '18', hour: 18, angle: 180 },
    { label: '19', hour: 19, angle: 210 },
    { label: '20', hour: 20, angle: 240 },
    { label: '21', hour: 21, angle: 270 },
    { label: '22', hour: 22, angle: 300 },
    { label: '23', hour: 23, angle: 330 },
  ];

  const minutesList = [
    { label: '00', min: 0, angle: 0 },
    { label: '05', min: 5, angle: 30 },
    { label: '10', min: 10, angle: 60 },
    { label: '15', min: 15, angle: 90 },
    { label: '20', min: 20, angle: 120 },
    { label: '25', min: 25, angle: 150 },
    { label: '30', min: 30, angle: 180 },
    { label: '35', min: 35, angle: 210 },
    { label: '40', min: 40, angle: 240 },
    { label: '45', min: 45, angle: 270 },
    { label: '50', min: 50, angle: 300 },
    { label: '55', min: 55, angle: 330 },
  ];

  const handleSave = () => {
    let finalH = selectedHour;
    let finalM = selectedMinute;

    if (inputStyle === 'keyboard') {
      const parsedH = parseInt(manualHour, 10);
      const parsedM = parseInt(manualMinute, 10);
      if (!isNaN(parsedH)) finalH = Math.max(0, Math.min(23, parsedH));
      if (!isNaN(parsedM)) finalM = Math.max(0, Math.min(59, parsedM));
    }

    // Convert to 12-hour format for system compatibility
    let h12 = finalH % 12;
    if (h12 === 0) h12 = 12;
    const period = finalH >= 12 ? 'PM' : 'AM';

    onSave?.({
      hour24: finalH,
      minute: finalM,
      hour12: String(h12).padStart(2, '0'),
      minuteStr: String(finalM).padStart(2, '0'),
      period,
      formattedTime: `${String(h12).padStart(2, '0')}:${String(finalM).padStart(2, '0')} ${period}`,
    });
    onClose?.();
  };

  const handleClear = () => {
    onClear?.();
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[328px] bg-[#212327] rounded-[28px] shadow-2xl border border-white/10 overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        {/* Top Header Card (Lighter charcoal with huge centered time) */}
        <div className="bg-[#34373c] pt-5 pb-4 px-6 rounded-t-[28px] flex flex-col items-center justify-center">
          {title && (
            <span className="text-[11px] font-medium tracking-wider uppercase text-slate-300 mb-1">
              {title}
            </span>
          )}

          {/* Time digits */}
          <div className="flex items-center justify-center gap-1 font-sans text-5xl font-light text-[#e2e3e5] tracking-tight">
            <button
              type="button"
              onClick={() => setMode('hour')}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                mode === 'hour'
                  ? 'bg-[#434850] text-[#a8c7fa] font-normal shadow-xs'
                  : 'hover:bg-white/5 text-[#e2e3e5]'
              }`}
            >
              {String(selectedHour).padStart(2, '0')}
            </button>
            <span className="text-[#a8c7fa] font-light -mt-1">:</span>
            <button
              type="button"
              onClick={() => setMode('minute')}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                mode === 'minute'
                  ? 'bg-[#434850] text-[#a8c7fa] font-normal shadow-xs'
                  : 'hover:bg-white/5 text-[#e2e3e5]'
              }`}
            >
              {String(selectedMinute).padStart(2, '0')}
            </button>
          </div>
        </div>

        {/* Content Body: Dial or Keyboard mode */}
        <div className="p-5 flex flex-col items-center justify-center bg-[#212327]">
          {inputStyle === 'dial' ? (
            /* Dial Circle Plate */
            <div
              ref={dialRef}
              onPointerDown={onPointerDown}
              className="relative w-64 h-64 rounded-full bg-[#3b3e44] cursor-pointer touch-none select-none flex items-center justify-center shadow-inner"
            >
              {/* Dial Center Pivot Dot */}
              <div className="absolute w-2 h-2 rounded-full bg-[#a8c7fa] z-10 pointer-events-none" />

              {/* Dial Hand Line (from center to target) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <line
                  x1={dialRadius}
                  y1={dialRadius}
                  x2={targetX}
                  y2={targetY}
                  stroke="#a8c7fa"
                  strokeWidth="2"
                />
              </svg>

              {/* Selected Value Indicator Circle (Material You light blue bubble) */}
              <div
                className="absolute w-[36px] h-[36px] rounded-full bg-[#a8c7fa] flex items-center justify-center z-20 pointer-events-none shadow-md"
                style={{
                  left: `${targetX - 18}px`,
                  top: `${targetY - 18}px`,
                }}
              >
                <span className="font-sans font-bold text-sm text-[#041e49]">
                  {mode === 'hour'
                    ? String(selectedHour).padStart(2, '0')
                    : String(selectedMinute).padStart(2, '0')}
                </span>
              </div>

              {/* Numbers Layout */}
              {mode === 'hour' ? (
                <>
                  {/* Outer Hours: 12, 1..11 */}
                  {outerHours.map(({ label, hour, angle }) => {
                    const r = 92;
                    const radA = ((angle - 90) * Math.PI) / 180;
                    const x = dialRadius + r * Math.cos(radA);
                    const y = dialRadius + r * Math.sin(radA);
                    const isSelected = selectedHour === hour;

                    return (
                      <div
                        key={`outer-${label}`}
                        className={`absolute w-7 h-7 -ml-3.5 -mt-3.5 flex items-center justify-center text-[13px] font-sans font-medium pointer-events-none ${
                          isSelected ? 'opacity-0' : 'text-[#c7c9cf]'
                        }`}
                        style={{ left: `${x}px`, top: `${y}px` }}
                      >
                        {label}
                      </div>
                    );
                  })}

                  {/* Inner Hours: 00, 13..23 */}
                  {innerHours.map(({ label, hour, angle }) => {
                    const r = 58;
                    const radA = ((angle - 90) * Math.PI) / 180;
                    const x = dialRadius + r * Math.cos(radA);
                    const y = dialRadius + r * Math.sin(radA);
                    const isSelected = selectedHour === hour;

                    return (
                      <div
                        key={`inner-${label}`}
                        className={`absolute w-6 h-6 -ml-3 -mt-3 flex items-center justify-center text-[11px] font-sans font-medium pointer-events-none ${
                          isSelected ? 'opacity-0' : 'text-[#9fa3a9]'
                        }`}
                        style={{ left: `${x}px`, top: `${y}px` }}
                      >
                        {label}
                      </div>
                    );
                  })}
                </>
              ) : (
                /* Minutes Dial: 00, 05, 10..55 */
                minutesList.map(({ label, min, angle }) => {
                  const r = 92;
                  const radA = ((angle - 90) * Math.PI) / 180;
                  const x = dialRadius + r * Math.cos(radA);
                  const y = dialRadius + r * Math.sin(radA);
                  const isSelected = selectedMinute === min;

                  return (
                    <div
                      key={`min-${label}`}
                      className={`absolute w-7 h-7 -ml-3.5 -mt-3.5 flex items-center justify-center text-[13px] font-sans font-medium pointer-events-none ${
                        isSelected ? 'opacity-0' : 'text-[#c7c9cf]'
                      }`}
                      style={{ left: `${x}px`, top: `${y}px` }}
                    >
                      {label}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Manual Keyboard Numeric Entry Mode */
            <div className="w-64 h-64 flex flex-col items-center justify-center gap-4">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Type Time (24-Hour)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={manualHour}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, 2);
                    setManualHour(v);
                    const n = parseInt(v, 10);
                    if (!isNaN(n)) setSelectedHour(Math.max(0, Math.min(23, n)));
                  }}
                  className="w-20 h-16 rounded-xl bg-[#3b3e44] text-center font-mono text-3xl font-bold text-[#a8c7fa] border border-white/10 focus:border-[#a8c7fa] focus:outline-none"
                  placeholder="00"
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
                    if (!isNaN(n)) setSelectedMinute(Math.max(0, Math.min(59, n)));
                  }}
                  className="w-20 h-16 rounded-xl bg-[#3b3e44] text-center font-mono text-3xl font-bold text-[#a8c7fa] border border-white/10 focus:border-[#a8c7fa] focus:outline-none"
                  placeholder="00"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="px-5 py-3.5 flex items-center justify-between border-t border-white/5 bg-[#212327]">
          {/* Toggle Dial / Keyboard icon */}
          <button
            type="button"
            onClick={() => setInputStyle((prev) => (prev === 'dial' ? 'keyboard' : 'dial'))}
            className="p-2 rounded-full text-[#a8c7fa] hover:bg-white/10 transition-colors cursor-pointer active:scale-95"
            title={inputStyle === 'dial' ? 'Switch to text input' : 'Switch to dial picker'}
          >
            {inputStyle === 'dial' ? (
              <Keyboard className="w-5 h-5 text-[#a8c7fa]" />
            ) : (
              <Clock className="w-5 h-5 text-[#a8c7fa]" />
            )}
          </button>

          {/* Action text buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-1.5 text-sm font-medium text-[#a8c7fa] hover:text-[#d3e3fd] hover:bg-white/5 rounded-md transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1.5 text-sm font-medium text-[#a8c7fa] hover:text-[#d3e3fd] hover:bg-white/5 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1.5 text-sm font-bold text-[#a8c7fa] hover:text-[#d3e3fd] hover:bg-white/5 rounded-md transition-colors cursor-pointer"
            >
              Set
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
