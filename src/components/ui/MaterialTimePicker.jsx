import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Keyboard, Clock } from 'lucide-react';

/**
 * MaterialTimePicker
 * 1:1 Pixel-Accurate Recreation of Android Material 3 Time Picker Dialog
 * Features:
 * - Clean matte header with thin time digits (00:27 style)
 * - True 24-hour dual-ring clock face (Outer: 1-12, Inner: 00, 13-23)
 * - Properly centered pivot dot and indicator hand line
 * - Seamless pointer tracking and auto-advance to minute on release
 * - Keyboard manual numeric entry toggle
 * - Clean "Clear", "Cancel", "Set" actions
 */
export default function MaterialTimePicker({
  isOpen,
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

  // Manual keyboard temp values
  const [manualHour, setManualHour] = useState('');
  const [manualMinute, setManualMinute] = useState('');

  const dialRef = useRef(null);

  // Sync state whenever modal opens
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

  useEffect(() => {
    setManualHour(String(selectedHour).padStart(2, '0'));
    setManualMinute(String(selectedMinute).padStart(2, '0'));
  }, [selectedHour, selectedMinute]);

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

      // Angle in degrees (0° = 12 o'clock / top, clockwise)
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;

      if (mode === 'hour') {
        // Outer ring radius: 96px, Inner ring radius: 56px. Boundary: 76px
        const isInner = dist < 76;
        const index = Math.round(angle / 30) % 12; // 0..11

        let hourVal;
        if (isInner) {
          hourVal = index === 0 ? 0 : index + 12;
        } else {
          hourVal = index === 0 ? 12 : index;
        }
        setSelectedHour(hourVal);

        if (isRelease) {
          setMode('minute');
        }
      } else {
        const minuteVal = Math.round(angle / 6) % 60;
        setSelectedMinute(minuteVal);
      }
    },
    [mode]
  );

  const onPointerDown = (e) => {
    handleDialPointer(e, false);
    window.addEventListener('pointermove', onGlobalPointerMove);
    window.addEventListener('pointerup', onGlobalPointerUp);
  };

  const onGlobalPointerMove = (e) => {
    handleDialPointer(e, false);
  };

  const onGlobalPointerUp = (e) => {
    handleDialPointer(e, true);
    window.removeEventListener('pointermove', onGlobalPointerMove);
    window.removeEventListener('pointerup', onGlobalPointerUp);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onGlobalPointerMove);
      window.removeEventListener('pointerup', onGlobalPointerUp);
    };
  }, []);

  if (!isOpen) return null;

  // Geometry calculations
  const dialRadius = 128; // 256px / 2
  let handAngle = 0;
  let handRadius = 96;

  if (mode === 'hour') {
    const isInner = selectedHour === 0 || selectedHour >= 13;
    handRadius = isInner ? 56 : 96;
    if (isInner) {
      handAngle = (selectedHour === 0 ? 0 : selectedHour - 12) * 30;
    } else {
      handAngle = (selectedHour === 12 ? 0 : selectedHour) * 30;
    }
  } else {
    handRadius = 96;
    handAngle = selectedMinute * 6;
  }

  const rad = ((handAngle - 90) * Math.PI) / 180;
  const targetX = dialRadius + handRadius * Math.cos(rad);
  const targetY = dialRadius + handRadius * Math.sin(rad);

  // Selected label inside bubble
  let selectedBubbleLabel = '';
  if (mode === 'hour') {
    if (selectedHour === 0) selectedBubbleLabel = '00';
    else selectedBubbleLabel = String(selectedHour);
  } else {
    selectedBubbleLabel = String(selectedMinute).padStart(2, '0');
  }

  // Hours definition
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
        className="w-full max-w-[320px] bg-[#222428] rounded-[28px] shadow-2xl border border-white/5 overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 24px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Top Header Card (Lighter charcoal with huge clean time display 00:27) */}
        <div className="bg-[#35373c] py-7 px-6 rounded-t-[28px] flex items-center justify-center">
          <div className="flex items-center justify-center font-sans text-5xl font-light tracking-tight select-none">
            <button
              type="button"
              onClick={() => setMode('hour')}
              className={`transition-colors cursor-pointer px-1 ${
                mode === 'hour' ? 'text-white font-normal' : 'text-[#8e9299] hover:text-[#c4c7cc]'
              }`}
            >
              {String(selectedHour).padStart(2, '0')}
            </button>
            <span className="text-[#8e9299] font-light pb-1">:</span>
            <button
              type="button"
              onClick={() => setMode('minute')}
              className={`transition-colors cursor-pointer px-1 ${
                mode === 'minute' ? 'text-white font-normal' : 'text-[#8e9299] hover:text-[#c4c7cc]'
              }`}
            >
              {String(selectedMinute).padStart(2, '0')}
            </button>
          </div>
        </div>

        {/* Content Body: Dial or Keyboard mode */}
        <div className="pt-6 pb-4 px-6 flex flex-col items-center justify-center bg-[#222428]">
          {inputStyle === 'dial' ? (
            /* Dial Circle Plate */
            <div
              ref={dialRef}
              onPointerDown={onPointerDown}
              className="relative w-64 h-64 rounded-full bg-[#3c3e44] cursor-pointer touch-none select-none shadow-inner"
            >
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

              {/* Exact Center Pivot Dot */}
              <div
                className="absolute w-2 h-2 rounded-full bg-[#a8c7fa] z-20 pointer-events-none"
                style={{
                  left: `${dialRadius}px`,
                  top: `${dialRadius}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              />

              {/* Selected Value Indicator Circle (Light blue bubble replacing the number) */}
              <div
                className="absolute w-[36px] h-[36px] rounded-full bg-[#a8c7fa] flex items-center justify-center z-20 pointer-events-none shadow-md"
                style={{
                  left: `${targetX}px`,
                  top: `${targetY}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span className="font-sans font-bold text-sm text-[#041e49]">
                  {selectedBubbleLabel}
                </span>
              </div>

              {/* Numbers Layout */}
              {mode === 'hour' ? (
                <>
                  {/* Outer Hours: 12, 1..11 */}
                  {outerHours.map(({ label, hour, angle }) => {
                    const r = 96;
                    const radA = ((angle - 90) * Math.PI) / 180;
                    const x = dialRadius + r * Math.cos(radA);
                    const y = dialRadius + r * Math.sin(radA);
                    const isSelected = selectedHour === hour;

                    return (
                      <div
                        key={`outer-${label}`}
                        className={`absolute w-7 h-7 flex items-center justify-center text-[14px] font-sans font-medium pointer-events-none transition-opacity duration-150 ${
                          isSelected ? 'opacity-0' : 'text-[#c5c7ce]'
                        }`}
                        style={{
                          left: `${x}px`,
                          top: `${y}px`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        {label}
                      </div>
                    );
                  })}

                  {/* Inner Hours: 00, 13..23 */}
                  {innerHours.map(({ label, hour, angle }) => {
                    const r = 56;
                    const radA = ((angle - 90) * Math.PI) / 180;
                    const x = dialRadius + r * Math.cos(radA);
                    const y = dialRadius + r * Math.sin(radA);
                    const isSelected = selectedHour === hour;

                    return (
                      <div
                        key={`inner-${label}`}
                        className={`absolute w-6 h-6 flex items-center justify-center text-[12px] font-sans font-medium pointer-events-none transition-opacity duration-150 ${
                          isSelected ? 'opacity-0' : 'text-[#8e9299]'
                        }`}
                        style={{
                          left: `${x}px`,
                          top: `${y}px`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        {label}
                      </div>
                    );
                  })}
                </>
              ) : (
                /* Minutes Dial: 00, 05, 10..55 */
                minutesList.map(({ label, min, angle }) => {
                  const r = 96;
                  const radA = ((angle - 90) * Math.PI) / 180;
                  const x = dialRadius + r * Math.cos(radA);
                  const y = dialRadius + r * Math.sin(radA);
                  const isSelected = selectedMinute === min;

                  return (
                    <div
                      key={`min-${label}`}
                      className={`absolute w-7 h-7 flex items-center justify-center text-[14px] font-sans font-medium pointer-events-none transition-opacity duration-150 ${
                        isSelected ? 'opacity-0' : 'text-[#c5c7ce]'
                      }`}
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
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
                  className="w-20 h-16 rounded-xl bg-[#3c3e44] text-center font-mono text-3xl font-bold text-[#a8c7fa] border border-white/10 focus:border-[#a8c7fa] focus:outline-none"
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
                  className="w-20 h-16 rounded-xl bg-[#3c3e44] text-center font-mono text-3xl font-bold text-[#a8c7fa] border border-white/10 focus:border-[#a8c7fa] focus:outline-none"
                  placeholder="00"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="px-5 py-4 flex items-center justify-between bg-[#222428]">
          {/* Toggle Dial / Keyboard icon */}
          <button
            type="button"
            onClick={() => setInputStyle((prev) => (prev === 'dial' ? 'keyboard' : 'dial'))}
            className="p-1 text-[#a8c7fa] hover:text-[#d3e3fd] transition-colors cursor-pointer active:scale-95"
            title={inputStyle === 'dial' ? 'Switch to text input' : 'Switch to dial picker'}
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
              className="text-sm font-medium text-[#a8c7fa] hover:text-[#d3e3fd] transition-colors cursor-pointer"
            >
              Set
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
