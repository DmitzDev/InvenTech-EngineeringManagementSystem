import React, { useState, useRef, useEffect } from 'react';
import { useTransaction } from '../../context/TransactionContext';

const PURPOSE_OPTIONS = [
  'Laboratory Class Experiment / Regular Activity',
  'Capstone Project / Thesis Research',
  'Design Laboratory & Prototyping Activity',
  'Make-up Laboratory / Practical Examination',
  'Departmental Engineering Project / Competition',
  'Special Institutional Faculty Request',
];

const formatLabName = (lab) => {
  switch (lab) {
    case 'DIGITAL':
      return 'Digital Lab';
    case 'ECE':
      return 'ECE Lab';
    case 'CE':
      return 'Civil Engr Lab';
    case 'CHEM':
      return 'Chemistry Lab';
    case 'PHYSICS':
      return 'Physics Lab';
    default:
      return `${lab || 'Engr'} Lab`;
  }
};

export default function TransactionCommit() {
  const {
    borrower,
    cart,
    transactionId,
    safetyAgreement,
    toggleSafetyAgreement,
    resetTransaction,
    setStep,
    setBorrowerField,
    theme,
    commitTransaction,
    isTransactionCommitted,
    goToWelcome,
    showToast,
  } = useTransaction();

  const isDark = theme === 'dark';
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const damagedItems = cart.filter((i) => i.isDamaged);

  const [isCustomPurpose, setIsCustomPurpose] = useState(
    Boolean(borrower.purpose && !PURPOSE_OPTIONS.includes(borrower.purpose))
  );

  // Digital Signature Canvas State & Refs
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(Boolean(borrower.signature));

  // Initialize and auto-scale canvas with high-DPI rendering (Pure Black Ink)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const updateCanvasScale = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = window.devicePixelRatio || 1;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (canvas.width > 0 && canvas.height > 0) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (tempCanvas.width > 0 && tempCanvas.height > 0) {
        ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
      } else if (borrower.signature) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.src = borrower.signature;
      }
    };

    updateCanvasScale();
    window.addEventListener('resize', updateCanvasScale);
    return () => window.removeEventListener('resize', updateCanvasScale);
  }, [borrower.signature]);

  const getCanvasPos = (canvas, clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    isDrawing.current = true;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const pos = getCanvasPos(canvas, clientX, clientY);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const pos = getCanvasPos(canvas, clientX, clientY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        setBorrowerField('signature', dataUrl);
      } catch (err) {
        console.warn('Canvas export failed', err);
      }
    }
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setBorrowerField('signature', null);
  };

  const handlePurposeChange = (e) => {
    const val = e.target.value;
    if (val === 'OTHER') {
      setIsCustomPurpose(true);
      setBorrowerField('purpose', '');
    } else {
      setIsCustomPurpose(false);
      setBorrowerField('purpose', val);
    }
  };

  const handleManualPrint = () => {
    if (!safetyAgreement) {
      showToast?.('Please check the Laboratory Safety & Accountability undertaking before printing.', 'error');
      return;
    }
    if (!hasSignature && !borrower.signature) {
      showToast?.('Please sign in the signature box before printing.', 'error');
      return;
    }
    try {
      if (!isTransactionCommitted) {
        commitTransaction();
      }
      window.print();
    } catch (e) {
      console.error('Print error', e);
    }
  };

  const activePurpose = borrower.purpose || PURPOSE_OPTIONS[0];
  const isReadyToPrint = Boolean(safetyAgreement && (hasSignature || borrower.signature));

  const cardSurface = isDark
    ? 'bg-[#0f172a] border-slate-800 text-slate-100'
    : 'bg-white border-slate-300 text-slate-900 shadow-xs';

  const sectionHeaderSurface = isDark
    ? 'bg-[#0b1120] border-slate-800 text-slate-300'
    : 'bg-slate-100 border-slate-300 text-slate-800';

  const labelMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="flex-1 p-3 sm:p-4 lg:p-5 max-w-[1600px] mx-auto w-full max-w-full overflow-x-hidden flex flex-col justify-between select-none relative min-h-0">
      <div className="space-y-3.5">
        {/* ========================================================= */}
        {/* 1. Top Document Header Strip                              */}
        {/* ========================================================= */}
        <div
          className={`rounded-xl px-4 py-3 border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${cardSurface}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
            <span
              className={`font-mono text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border w-fit ${
                isDark
                  ? 'bg-slate-900 text-slate-300 border-slate-700'
                  : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              Form UdD-FM-LM-01A
            </span>
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
              Step 4 — Requisition Review & Borrower&apos;s Slip
            </h2>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${labelMuted}`}>
                Ref No.
              </span>
              <span
                className={`font-mono text-xs sm:text-sm font-bold ${
                  isDark ? 'text-cyan-400' : 'text-slate-900'
                }`}
              >
                {transactionId || 'UDD-TX-PENDING'}
              </span>
            </div>

            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                isTransactionCommitted
                  ? isDark
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : isReadyToPrint
                  ? isDark
                    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-700'
                    : 'bg-blue-50 text-blue-900 border-blue-300'
                  : isDark
                  ? 'bg-slate-900 text-slate-400 border-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              {isTransactionCommitted
                ? 'Slip Printed'
                : isReadyToPrint
                ? 'Ready to Print'
                : 'Awaiting Authorization'}
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. Main Two-Column Requisition Grid                       */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* ======================================================= */}
          {/* Left Column (lg:col-span-7): Borrower Ledger & Manifest */}
          {/* ======================================================= */}
          <div className="lg:col-span-7 flex flex-col gap-3.5">
            {/* A. Borrower & Course Specification Ledger */}
            <div className={`rounded-xl border overflow-hidden ${cardSurface}`}>
              <div className={`px-4 py-2 border-b flex items-center justify-between ${sectionHeaderSurface}`}>
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Borrower & Class Details
                </span>
                <span className="font-mono text-[11px] font-bold">
                  Group {borrower.groupNo || '1'}
                </span>
              </div>

              <div
                className={`grid grid-cols-2 sm:grid-cols-3 divide-y sm:divide-y-0 gap-px ${
                  isDark ? 'bg-slate-800' : 'bg-slate-200'
                }`}
              >
                <div className={`p-3 ${isDark ? 'bg-[#0f172a]' : 'bg-white'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${labelMuted}`}>
                    Borrower / Group Leader
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold uppercase truncate block mt-0.5">
                    {borrower.groupLeader || 'NOT SPECIFIED'}
                  </span>
                </div>

                <div className={`p-3 ${isDark ? 'bg-[#0f172a]' : 'bg-white'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${labelMuted}`}>
                    Student ID Number
                  </span>
                  <span
                    className={`font-mono text-xs sm:text-sm font-bold block mt-0.5 ${
                      isDark ? 'text-cyan-400' : 'text-blue-700'
                    }`}
                  >
                    {borrower.studentId || '23-XXXX-XXX'}
                  </span>
                </div>

                <div className={`p-3 col-span-2 sm:col-span-1 ${isDark ? 'bg-[#0f172a]' : 'bg-white'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${labelMuted}`}>
                    Program, Year & Section
                  </span>
                  <span className="text-xs sm:text-sm font-bold truncate block mt-0.5">
                    {borrower.program || 'ENGR'}{' '}
                    {borrower.yearLevel ? `${borrower.yearLevel}-${borrower.section || '01'}` : ''}
                  </span>
                </div>

                <div
                  className={`p-3 border-t ${
                    isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${labelMuted}`}>
                    Instructor
                  </span>
                  <span className="text-xs font-bold truncate block mt-0.5">
                    {borrower.instructor || 'Faculty In-Charge'}
                  </span>
                </div>

                <div
                  className={`p-3 border-t ${
                    isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${labelMuted}`}>
                    Course Subject
                  </span>
                  <span className="font-mono text-xs font-bold truncate block mt-0.5">
                    {borrower.courseCode || 'LAB-ACT'}
                  </span>
                </div>

                <div
                  className={`p-3 col-span-2 sm:col-span-1 border-t ${
                    isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${labelMuted}`}>
                    Lab Time Schedule
                  </span>
                  <span className="font-mono text-xs font-bold truncate block mt-0.5">
                    {borrower.labTime || 'Scheduled Session'}
                  </span>
                </div>
              </div>
            </div>

            {/* B. Apparatus Manifest Table */}
            <div className={`rounded-xl border overflow-hidden ${cardSurface}`}>
              <div className={`px-4 py-2 border-b flex items-center justify-between ${sectionHeaderSurface}`}>
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Requested Apparatus Manifest
                </span>
                <span className="font-mono text-[11px] font-bold tabular-nums">
                  {cart.length} {cart.length === 1 ? 'Item' : 'Items'} • {totalQty}{' '}
                  {totalQty === 1 ? 'Unit' : 'Units'}
                </span>
              </div>

              <div className="overflow-x-auto max-h-64 sm:max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead
                    className={`border-b sticky top-0 uppercase tracking-wider text-[10px] font-bold ${
                      isDark
                        ? 'bg-[#090e1a] text-slate-400 border-slate-800'
                        : 'bg-slate-50 text-slate-600 border-slate-300'
                    }`}
                  >
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Apparatus Description</th>
                      <th className="py-2.5 px-3 w-36">Tag Code</th>
                      <th className="py-2.5 px-3 w-24 text-center">Type</th>
                      <th className="py-2.5 px-3 w-24 text-center">Condition</th>
                      <th className="py-2.5 px-3 w-20 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y tabular-nums ${
                      isDark ? 'divide-slate-800/80' : 'divide-slate-200'
                    }`}
                  >
                    {cart.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'}
                      >
                        <td className={`py-2.5 px-3 text-center font-mono font-bold ${labelMuted}`}>
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold leading-snug">{item.name}</div>
                          <div className={`text-[10px] font-medium ${labelMuted}`}>
                            {formatLabName(item.lab)}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] font-semibold">
                          {item.tagCode}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              item.isConsumable
                                ? isDark
                                  ? 'bg-amber-950/50 text-amber-300 border-amber-700/60'
                                  : 'bg-amber-50 text-amber-900 border-amber-300'
                                : isDark
                                ? 'bg-slate-800 text-slate-300 border-slate-700'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {item.isConsumable ? 'Consumable' : 'Returnable'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.isDamaged ? (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                                isDark
                                  ? 'bg-amber-950/60 text-amber-300 border-amber-700'
                                  : 'bg-amber-50 text-amber-900 border-amber-300'
                              }`}
                            >
                              Noted Defect
                            </span>
                          ) : (
                            <span className={`text-[11px] font-semibold ${labelMuted}`}>
                              Good
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold">
                          {item.qty} {item.unit || 'pc'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {damagedItems.length > 0 && (
                <div
                  className={`px-4 py-2 border-t text-[11px] flex items-center justify-between gap-2 ${
                    isDark
                      ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <span className="truncate">
                    <strong>Pre-existing condition noted:</strong>{' '}
                    {damagedItems.map((i) => i.name).join(', ')} (recorded on slip; not charged to borrower).
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ======================================================= */}
          {/* Right Column (lg:col-span-5): Purpose, Undertaking,     */}
          {/* Signature Pad & Print Dispatch                          */}
          {/* ======================================================= */}
          <div className="lg:col-span-5 flex flex-col gap-3.5">
            {/* A. Purpose & Accountability Undertaking */}
            <div className={`rounded-xl border overflow-hidden ${cardSurface}`}>
              <div className={`px-4 py-2 border-b flex items-center justify-between ${sectionHeaderSurface}`}>
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Purpose & Accountability Undertaking
                </span>
                <span className={`text-[10px] font-semibold ${labelMuted}`}>Required</span>
              </div>

              <div className="p-3.5 space-y-3">
                {/* Purpose Selector */}
                <div>
                  <label
                    className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${labelMuted}`}
                  >
                    Purpose of Requisition
                  </label>
                  <select
                    value={isCustomPurpose ? 'OTHER' : activePurpose}
                    onChange={handlePurposeChange}
                    className={`w-full h-10 px-3 rounded-lg text-xs font-semibold focus:outline-none transition-colors cursor-pointer border ${
                      isDark
                        ? 'bg-[#090d16] border-slate-700 text-slate-100 focus:border-cyan-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  >
                    {PURPOSE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    <option value="OTHER">Other (Specify purpose)...</option>
                  </select>

                  {isCustomPurpose && (
                    <input
                      type="text"
                      value={borrower.purpose || ''}
                      onChange={(e) => setBorrowerField('purpose', e.target.value)}
                      placeholder="Enter specific laboratory activity or project..."
                      className={`w-full h-9 px-3 mt-2 rounded-lg text-xs font-medium focus:outline-none border ${
                        isDark
                          ? 'bg-[#090d16] border-cyan-500 text-slate-100 placeholder-slate-500'
                          : 'bg-white border-blue-600 text-slate-900 placeholder-slate-400'
                      }`}
                      autoFocus
                    />
                  )}
                </div>

                {/* Safety & Custody Undertaking Checkbox */}
                <div
                  onClick={toggleSafetyAgreement}
                  role="checkbox"
                  aria-checked={safetyAgreement}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      toggleSafetyAgreement();
                    }
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start gap-3 ${
                    safetyAgreement
                      ? isDark
                        ? 'bg-cyan-950/25 border-cyan-500/60'
                        : 'bg-blue-50/60 border-blue-600'
                      : isDark
                      ? 'bg-[#090d16] border-slate-800 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(safetyAgreement)}
                    onChange={toggleSafetyAgreement}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5 w-4 h-4 rounded accent-blue-600 cursor-pointer shrink-0"
                  />
                  <div className="text-xs leading-relaxed">
                    <div className="font-bold">
                      Laboratory Safety & Equipment Custody Agreement
                    </div>
                    <p className={`text-[11px] mt-0.5 leading-normal ${labelMuted}`}>
                      I certify that all listed apparatus were received in the stated condition and will be
                      handled in accordance with laboratory safety standards. Our group assumes full
                      responsibility for returning all non-consumable items on time and reporting any damage.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* B. Borrower Signature Pad (Pure Black Ink on White Surface) */}
            <div className={`rounded-xl border overflow-hidden ${cardSurface}`}>
              <div className={`px-4 py-2 border-b flex items-center justify-between ${sectionHeaderSurface}`}>
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Borrower&apos;s Signature (Black Ink)
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      hasSignature
                        ? isDark
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : isDark
                        ? 'bg-slate-900 text-slate-400 border-slate-700'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    {hasSignature ? 'Signed' : 'Required'}
                  </span>

                  {hasSignature && (
                    <button
                      type="button"
                      onClick={handleClearSignature}
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded border bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-300 hover:border-rose-300 transition-colors cursor-pointer active:scale-95"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3">
                <div className="relative w-full rounded-lg border border-slate-300 bg-white overflow-hidden select-none">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      startDrawing(e);
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      draw(e);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      stopDrawing();
                    }}
                    className="h-28 sm:h-32 w-full touch-none cursor-crosshair block bg-white"
                    style={{ touchAction: 'none' }}
                  />

                  {/* Clean Institutional Signature Baseline */}
                  <div className="absolute inset-x-4 bottom-3 pointer-events-none border-b border-slate-300 flex items-center justify-between pb-1">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Sign Above Line
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 uppercase truncate max-w-[180px]">
                      {borrower.groupLeader || 'Borrower Signature'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* C. Action & Print Dispatch Panel */}
            <div className={`rounded-xl border p-3.5 space-y-2.5 ${cardSurface}`}>
              {!isReadyToPrint && (
                <div
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-between ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-300'
                      : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  <span>
                    {!safetyAgreement && !hasSignature
                      ? 'Required: Check the safety agreement and sign above to enable printing.'
                      : !safetyAgreement
                      ? 'Required: Check the safety & custody agreement box above.'
                      : 'Required: Provide borrower signature in the signature box above.'}
                  </span>
                </div>
              )}

              {isTransactionCommitted && (
                <div
                  className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    isDark
                      ? 'bg-emerald-950/30 border-emerald-700/60 text-emerald-200'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  }`}
                >
                  <div className="text-xs">
                    <div className="font-bold">Borrower&apos;s Slip Dispatched to Printer</div>
                    <div className="text-[11px] opacity-85 mt-0.5">
                      Submit the printed slip ({transactionId}) to the Laboratory Custodian.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={goToWelcome}
                    className="h-9 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shrink-0 cursor-pointer active:scale-[0.98]"
                  >
                    Finish & New Session
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={isTransactionCommitted}
                  className={`flex-1 h-10 px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  Edit Apparatus
                </button>

                <button
                  type="button"
                  onClick={resetTransaction}
                  className={`h-10 px-3.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer active:scale-[0.98] ${
                    isDark
                      ? 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border-rose-800/60'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  Reset Session
                </button>
              </div>

              <button
                type="button"
                onClick={handleManualPrint}
                disabled={!isReadyToPrint}
                className={`w-full h-11 rounded-lg text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all active:scale-[0.99] ${
                  !isReadyToPrint
                    ? isDark
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                    : isDark
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md cursor-pointer'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md cursor-pointer'
                }`}
              >
                {isTransactionCommitted
                  ? 'Reprint Official Borrower\x27s Slip'
                  : 'Confirm & Print Official Borrower\x27s Slip'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
