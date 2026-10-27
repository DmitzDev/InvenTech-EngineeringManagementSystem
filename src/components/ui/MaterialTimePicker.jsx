import React, { useState, useEffect, useRef } from 'react';

/**
 * MaterialTimePicker
 * Material 3 style 12-hour clock dial dialog.
 * - Single pointer handler on the dial (tap or drag) for instant response
 * - Hour selection auto-advances to minutes on release
 * - AM / PM segmented toggle
 * - Clear / Cancel / Set actions
 */
const DIAL_RADIUS = 128; // dial is 256px
const NUM_RADIUS = 96;

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const polar = (angleDeg, r = NUM_RADIUS) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: DIAL_RADIUS + r * Math.cos(rad), y: DIAL_RADIUS + r * Math.sin(rad) };
};

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
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState('AM');

  const dialRef = useRef(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    let h = parseInt(initialHour, 10);
    if (isNaN(h) || h < 1 || h > 12) h = 8;
    let m = parseInt(initialMinute, 10);
    if (isNaN(m) || m < 0 || m > 59) m = 0;
    setHour(h);
    setMinute(m);
    setPeriod(initialPeriod === 'PM' ? 'PM' : 'AM');
    setMode('hour');
  }, [isOpen, initialHour, initialMinute, initialPeriod]);

  const pickAt = (clientX, clientY) => {
    const rect = dialRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;

    if (mode === 'hour') {
      const idx = Math.round(angle / 30) % 12;
      setHour(idx === 0 ? 12 : idx);
    } else {
      setMinute(Math.round(angle / 6) % 60);
    }
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pickAt(e.clientX, e.clientY);
  };

  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    pickAt(e.clientX, e.clientY);
  };

  const onPointerUp = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    pickAt(e.clientX, e.clientY);
    if (mode === 'hour') setMode('minute');
  };

  if (!isOpen) return null;

  const handAngle = mode === 'hour' ? (hour % 12) * 30 : minute * 6;
  const target = polar(handAngle);
  const list = mode === 'hour' ? HOURS : MINUTES;

  const handleSave = () => {
    const hStr = String(hour).padStart(2, '0');
    const mStr = String(minute).padStart(2, '0');
    let h24 = hour % 12;
    if (period === 'PM') h24 += 12;
    onSave?.({ hour12: hStr, minuteStr: mStr, period, hour24: h24, formattedTime: `${hStr}:${mStr} ${period}` });
    onClose?.();
  };

  const headerBtn = (active) =>
    `px-2 py-0.5 rounded-lg cursor-pointer ${
      active ? 'bg-[#444850] text-[#a8c7fa] font-normal' : 'text-[#9ea2a9] hover:text-[#d3e3fd]'
    }`;

  const periodBtn = (active) =>
    `px-3 py-1.5 text-xs font-bold cursor-pointer ${
      active ? 'bg-[#a8c7fa] text-[#041e49]' : 'text-[#9ea2a9] hover:text-white'
    }`;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[328px] bg-[#222428] rounded-[28px] border border-white/10 overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 24px 48px rgba(0,0,0,0.7)' }}
      >
        {/* Header */}
        <div className="bg-[#35373c] py-5 px-6 flex items-center justify-between">
          <div className="flex items-center font-sans text-5xl font-light tracking-tight">
            <button type="button" onClick={() => setMode('hour')} className={headerBtn(mode === 'hour')}>
              {String(hour).padStart(2, '0')}
            </button>
            <span className="text-[#9ea2a9] px-0.5">:</span>
            <button type="button" onClick={() => setMode('minute')} className={headerBtn(mode === 'minute')}>
              {String(minute).padStart(2, '0')}
            </button>
          </div>
          <div className="flex flex-col rounded-xl overflow-hidden border border-white/10 bg-[#222428]">
            <button type="button" onClick={() => setPeriod('AM')} className={periodBtn(period === 'AM')}>AM</button>
            <button type="button" onClick={() => setPeriod('PM')} className={`${periodBtn(period === 'PM')} border-t border-white/10`}>PM</button>
          </div>
        </div>

        {/* Dial */}
        <div className="pt-6 pb-4 flex justify-center">
          <div
            ref={dialRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (draggingRef.current = false)}
            className="relative shrink-0 rounded-full bg-[#3c3e44] cursor-pointer touch-none"
            style={{ width: DIAL_RADIUS * 2, height: DIAL_RADIUS * 2 }}
          >
            <svg className="absolute inset-0 pointer-events-none" width={DIAL_RADIUS * 2} height={DIAL_RADIUS * 2}>
              <line x1={DIAL_RADIUS} y1={DIAL_RADIUS} x2={target.x} y2={target.y} stroke="#a8c7fa" strokeWidth="2.5" />
              <circle cx={DIAL_RADIUS} cy={DIAL_RADIUS} r="4" fill="#a8c7fa" />
              <circle cx={target.x} cy={target.y} r="20" fill="#a8c7fa" />
            </svg>

            {list.map((val, i) => {
              const { x, y } = polar(i * 30);
              const selected = mode === 'hour' ? hour === val : minute === val;
              return (
                <span
                  key={`${mode}-${val}`}
                  className={`absolute pointer-events-none font-sans font-medium ${
                    selected ? 'text-[#041e49] font-bold text-sm' : 'text-[#d2d4da] text-[15px]'
                  }`}
                  style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
                >
                  {mode === 'hour' ? val : String(val).padStart(2, '0')}
                </span>
              );
            })}

            {/* Value label when minute isn't a multiple of 5 */}
            {mode === 'minute' && minute % 5 !== 0 && (
              <span
                className="absolute pointer-events-none font-sans font-bold text-sm text-[#041e49]"
                style={{ left: target.x, top: target.y, transform: 'translate(-50%, -50%)' }}
              >
                {String(minute).padStart(2, '0')}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-3.5 flex items-center justify-end gap-5 border-t border-white/5">
          <button type="button" onClick={() => { onClear?.(); onClose?.(); }} className="text-sm font-medium text-[#a8c7fa] hover:text-[#d3e3fd] cursor-pointer">
            Clear
          </button>
          <button type="button" onClick={onClose} className="text-sm font-medium text-[#a8c7fa] hover:text-[#d3e3fd] cursor-pointer">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="text-sm font-bold text-[#a8c7fa] hover:text-[#d3e3fd] cursor-pointer">
            Set
          </button>
        </div>
      </div>
    </div>
  );
}
