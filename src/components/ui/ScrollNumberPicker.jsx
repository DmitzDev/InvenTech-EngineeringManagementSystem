import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

/**
 * ScrollNumberPicker - Compact, Space-Efficient Touch Number Selector for Kiosk Displays.
 * 
 * Features:
 * - Slim and space-efficient (h-12 sm:h-13, w-10 sm:w-11)
 * - Up (▲) and Down (▼) arrow buttons with hold-to-repeat
 * - Direct in-place touch drag/swipe on the number box
 * - Mouse wheel scrolling
 * - Zero popups
 */
export default function ScrollNumberPicker({
  value,
  onChange,
  options = [],
  placeholder = '--',
  label = '',
  className = '',
}) {
  const [isPointerActive, setIsPointerActive] = useState(false);
  const startYRef = useRef(0);
  const accumulatedDeltaRef = useRef(0);
  const holdIntervalRef = useRef(null);
  const holdTimeoutRef = useRef(null);

  // Compute current index
  const currentIndex = options.indexOf(String(value));
  const effectiveIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentValue = currentIndex >= 0 ? options[effectiveIndex] : placeholder;

  // Step function (+1 = up/increase, -1 = down/decrease)
  const stepValue = useCallback(
    (stepCount) => {
      if (!options.length) return;
      const baseIndex = currentIndex >= 0 ? currentIndex : 0;
      let newIndex = (baseIndex + stepCount) % options.length;
      if (newIndex < 0) newIndex += options.length;
      onChange(options[newIndex]);
    },
    [currentIndex, options, onChange]
  );

  // Clear hold-to-repeat timers
  const stopHold = useCallback(() => {
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdTimeoutRef.current = null;
    holdIntervalRef.current = null;
  }, []);

  useEffect(() => {
    return () => stopHold();
  }, [stopHold]);

  // Start hold-to-repeat on arrow buttons
  const startHold = (stepDirection) => {
    stopHold();
    stepValue(stepDirection);
    holdTimeoutRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        stepValue(stepDirection);
      }, 110);
    }, 320);
  };

  // Center slot touch drag handling
  const handleSlotPointerDown = (e) => {
    setIsPointerActive(true);
    startYRef.current = e.clientY;
    accumulatedDeltaRef.current = 0;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleSlotPointerMove = (e) => {
    if (!isPointerActive) return;

    const deltaY = e.clientY - startYRef.current;
    startYRef.current = e.clientY;
    accumulatedDeltaRef.current += deltaY;

    // 12px displacement per number step
    const STEP_THRESHOLD = 12;

    if (accumulatedDeltaRef.current <= -STEP_THRESHOLD) {
      const steps = Math.floor(Math.abs(accumulatedDeltaRef.current) / STEP_THRESHOLD);
      stepValue(steps);
      accumulatedDeltaRef.current += steps * STEP_THRESHOLD;
    } else if (accumulatedDeltaRef.current >= STEP_THRESHOLD) {
      const steps = Math.floor(accumulatedDeltaRef.current / STEP_THRESHOLD);
      stepValue(-steps);
      accumulatedDeltaRef.current -= steps * STEP_THRESHOLD;
    }
  };

  const handleSlotPointerUp = (e) => {
    setIsPointerActive(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Mouse wheel scroll on the slot
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      stepValue(1);
    } else if (e.deltaY > 0) {
      stepValue(-1);
    }
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Optional Top Label */}
      {label && (
        <span className="text-[9px] font-mono font-black text-slate-400 uppercase mb-0.5 tracking-wider">
          {label}
        </span>
      )}

      {/* Compact, Space-Saving Column Controller (w-10 sm:w-11, h-12 sm:h-13) */}
      <div className="flex flex-col items-center rounded-xl bg-[#09101d] border border-slate-800/90 p-0.5 gap-0.5 shadow-sm w-10 sm:w-11 h-12 sm:h-13 justify-between">
        {/* COMPACT UP ARROW (▲) */}
        <button
          type="button"
          onPointerDown={() => startHold(1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          className="w-full h-3.5 sm:h-4 rounded-md neu-btn-raised bg-[#111a2c] hover:bg-cyan-950/60 active:bg-cyan-500 active:text-slate-950 text-cyan-400 flex items-center justify-center transition-all cursor-pointer border border-cyan-500/20 active:scale-95"
          title={`Increase ${label || 'value'}`}
        >
          <ChevronUp className="w-3 h-3" />
        </button>

        {/* DRAGGABLE & SCROLLABLE VALUE SLOT */}
        <div
          onPointerDown={handleSlotPointerDown}
          onPointerMove={handleSlotPointerMove}
          onPointerUp={handleSlotPointerUp}
          onPointerCancel={handleSlotPointerUp}
          onWheel={handleWheel}
          style={{ touchAction: 'none' }}
          className={`w-full flex-1 rounded-lg neu-inset flex items-center justify-center cursor-ns-resize transition-all border ${
            isPointerActive
              ? 'border-cyan-400 ring-1 ring-cyan-400/50 bg-[#061524]'
              : 'border-slate-800/80 hover:border-cyan-500/40 bg-[#0d1422]'
          }`}
          title="Drag up/down or tap arrows to adjust"
        >
          <span
            className={`font-mono font-black text-xs sm:text-sm tracking-tight pointer-events-none leading-none ${
              currentIndex >= 0
                ? 'text-cyan-300 drop-shadow-[0_0_6px_rgba(6,182,212,0.65)]'
                : 'text-slate-500'
            }`}
          >
            {currentValue}
          </span>
        </div>

        {/* COMPACT DOWN ARROW (▼) */}
        <button
          type="button"
          onPointerDown={() => startHold(-1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          className="w-full h-3.5 sm:h-4 rounded-md neu-btn-raised bg-[#111a2c] hover:bg-cyan-950/60 active:bg-cyan-500 active:text-slate-950 text-cyan-400 flex items-center justify-center transition-all cursor-pointer border border-cyan-500/20 active:scale-95"
          title={`Decrease ${label || 'value'}`}
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
