import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  CheckCircle2,
  RotateCcw,
  ArrowLeft,
  FileText,
  AlertTriangle,
  ShieldCheck,
  CheckSquare,
  Square,
  Users,
  BookOpen,
  GraduationCap,
  PenTool,
  Eraser,
  ChevronDown,
  ChevronUp,
  Tag,
  Clock,
  Briefcase
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from '../ui/TouchButton';

const PURPOSE_OPTIONS = [
  'Laboratory Class Experiment / Regular Activity',
  'Capstone Project / Thesis Research',
  'Design Laboratory & Prototyping Activity',
  'Make-up Laboratory / Practical Examination',
  'Departmental Engineering Project / Competition',
  'Special Institutional Faculty Request',
];

export default function TransactionCommit() {
  const {
    borrower,
    cart,
    transactionId,
    timestamp,
    selectedLab,
    safetyAgreement,
    toggleSafetyAgreement,
    resetTransaction,
    setStep,
    setBorrowerField,
    theme,
    commitTransaction,
    isTransactionCommitted,
    goToWelcome,
  } = useTransaction();

  const isDark = theme === 'dark';
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const damagedItems = cart.filter((i) => i.isDamaged);

  // Mobile Collapsible Accordion State
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // Digital Signature Canvas State & Refs
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(Boolean(borrower.signature));

  // Initialize and auto-scale canvas with high-DPI crisp rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const updateCanvasScale = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      const dpr = window.devicePixelRatio || 1;

      // Keep existing drawing data if any
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

      ctx.strokeStyle = '#38bdf8'; // Sky Blue digital pen ink
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (tempCanvas.width > 0 && tempCanvas.height > 0) {
        ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
      }
    };

    updateCanvasScale();
    window.addEventListener('resize', updateCanvasScale);
    return () => window.removeEventListener('resize', updateCanvasScale);
  }, []);

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

  // Print Slip manually triggered on button click - commits transaction ONLY upon print!
  const handleManualPrint = () => {
    if (!safetyAgreement) return;
    try {
      if (!isTransactionCommitted) {
        commitTransaction();
      }
      window.print();
    } catch (e) {
      console.error('Print error', e);
    }
  };

  return (
    <div className="flex-1 p-3 sm:p-5 lg:p-8 pb-16 md:pb-10 max-w-7xl mx-auto w-full flex flex-col justify-between space-y-4 sm:space-y-5 select-none relative min-h-0">
      <div className="space-y-4 sm:space-y-5">
        {/* Top Header: Verification & Audit Bar */}
        <div className="neu-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.12)]">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-cyan-500/15 neu-inset flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-lg font-black text-slate-100 tracking-tight">
                  Step 04: Verify & Finalize Slip
                </h2>
                <span className="text-[9.5px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full neu-inset-sm text-cyan-400 font-bold">
                  UdD-FM-LM-01A-01
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
                Review borrower information, certify the institutional safety protocol, and print the official slip.
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono neu-inset px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shrink-0">
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Transaction Reference</div>
            <div className="text-xs sm:text-sm font-bold text-cyan-400">{transactionId || 'UDD-TX-DRAFT'}</div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Responsive Content: Two-Column Grid on Desktop / Vertical Stack on Mobile */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-col space-y-4 md:space-y-0 md:grid md:grid-cols-12 md:gap-6 items-start">
          
          {/* ========================================================= */}
          {/* Left Column on 15" Kiosk (md:col-span-7) / Items on Mobile */}
          {/* ========================================================= */}
          <div className="w-full md:col-span-7 flex flex-col space-y-4">
            
            {/* MOBILE ONLY: Collapsible Accordion for Borrower Slip (< md:) */}
            <div className="md:hidden neu-card rounded-2xl overflow-hidden border border-slate-800/80 shadow-md">
              <button
                type="button"
                onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                className="w-full p-3 bg-[#111a2c] flex items-center justify-between gap-2 active:bg-slate-800/40 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="min-w-0 truncate">
                    <span className="text-xs font-bold text-slate-200 block truncate">
                      Borrower Slip Apparatus
                    </span>
                    <span className="text-[10.5px] font-mono text-cyan-400 font-bold">
                      {cart.length} items ({totalQty} total units)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                    {isAccordionOpen ? 'Hide' : 'View'}
                  </span>
                  <div className="w-6 h-6 rounded-lg neu-inset flex items-center justify-center text-slate-300">
                    {isAccordionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </button>

              {/* Accordion Expandable Content */}
              {isAccordionOpen && (
                <div className="p-2.5 bg-[#0b1220] border-t border-slate-800/80 animate-fade-in space-y-2 max-h-72 overflow-y-auto">
                  {cart.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl neu-inset bg-[#0e1626] border border-slate-800/70 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-500">#{idx + 1}</span>
                          <span className="text-xs font-bold text-slate-100 truncate block">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-400">
                          <span className="text-cyan-400 font-bold">{item.tagCode}</span>
                          <span>•</span>
                          <span>{item.isConsumable ? 'Consumable' : 'Returnable'}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {item.qty} {item.unit || 'pc'}
                        </span>
                        {item.isDamaged && (
                          <div className="text-[9px] text-amber-400 font-bold flex items-center gap-0.5 justify-end mt-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Damage Flagged</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DESKTOP/KIOSK ONLY: Full Itemized Apparatus Verification Table (hidden md:block) */}
            <div className="hidden md:block neu-card rounded-2xl overflow-hidden">
              <div className="p-3.5 bg-[#111a2c] border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs sm:text-sm font-bold text-slate-200">
                    Itemized Laboratory Slip Preview ({cart.length} of 15 slots)
                  </span>
                </div>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  {totalQty} Total Units
                </span>
              </div>

              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0e1626] text-slate-400 border-b border-slate-800/80 sticky top-0">
                    <tr>
                      <th className="p-2.5 w-10 text-center font-mono">#</th>
                      <th className="p-2.5 w-16">Qty</th>
                      <th className="p-2.5 w-24">Tag Code</th>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 w-24">Category</th>
                      <th className="p-2.5 w-28">Condition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {cart.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-800/20">
                        <td className="p-2.5 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-2.5 font-mono font-bold text-cyan-400">{item.qty} {item.unit || 'pc'}</td>
                        <td className="p-2.5 font-mono text-slate-300">{item.tagCode}</td>
                        <td className="p-2.5 font-semibold text-slate-200">
                          <div>{item.name}</div>
                          <div className="text-[10px] font-mono text-cyan-400/90 font-medium">
                            {item.lab === 'DIGITAL' ? 'Digital Lab' : item.lab === 'ECE' ? 'ECE Lab' : item.lab === 'CE' ? 'CE Lab' : item.lab === 'CHEM' ? 'Chemistry Lab' : item.lab === 'PHYSICS' ? 'Physics Lab' : `${item.lab} Lab`}
                          </div>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                              item.isConsumable
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            }`}
                          >
                            {item.isConsumable ? 'Consumable' : 'Returnable'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          {item.isDamaged ? (
                            <span className="text-[9.5px] px-2 py-0.5 rounded-full neu-inset-amber text-amber-300 font-bold inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Pre-damaged</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Good</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Flagged Damaged Items Warning Banner */}
            {damagedItems.length > 0 && (
              <div className="p-3 sm:p-3.5 rounded-2xl neu-inset-amber border border-amber-500/30 flex items-center justify-between gap-3 text-amber-200">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold">{damagedItems.length} item(s) flagged for Pre-existing Condition:</span>
                    <span className="text-amber-300/90 ml-1">
                      {damagedItems.map((i) => i.name).join(', ')}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 shrink-0">
                  NOTED ON SLIP
                </span>
              </div>
            )}

            {/* Institutional Safety & Lab Protocol Agreement Card */}
            <div
              onClick={toggleSafetyAgreement}
              className={`p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all border select-none ${
                safetyAgreement
                  ? 'neu-inset border-cyan-500/60 bg-cyan-950/20 shadow-[0_0_18px_rgba(6,182,212,0.2)]'
                  : 'neu-card border-slate-700 hover:border-slate-600 bg-[#111a2c]'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    safetyAgreement ? 'bg-cyan-500 text-slate-950 shadow-md' : 'neu-inset text-slate-500'
                  }`}
                >
                  {safetyAgreement ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-extrabold text-slate-100">
                      Institutional Safety & Laboratory Protocol Agreement
                    </span>
                    <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                      CHED Compliant
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-relaxed">
                    I certify that all apparatus will be handled in accordance with Universidad de Dagupan Safety Rules. I accept liability for damages or unreturned items.
                  </p>
                </div>
              </div>
            </div>

            {/* Official Commit & Printed Status Confirmation Banner */}
            {isTransactionCommitted && (
              <div className="p-3.5 sm:p-4 rounded-2xl neu-inset bg-emerald-950/40 border border-emerald-500/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-300 animate-fade-in shadow-[0_0_24px_rgba(16,185,129,0.2)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/40 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs sm:text-sm text-emerald-200">
                      Borrower Slip Printed & Transaction Officially Recorded!
                    </div>
                    <div className="text-[11px] sm:text-xs text-emerald-300/80">
                      Ref Code: <span className="font-mono font-bold text-white">{transactionId}</span> • Please submit the signed printed slip to the Laboratory Custodian.
                    </div>
                  </div>
                </div>
                <TouchButton
                  variant="primary"
                  size="sm"
                  icon={RotateCcw}
                  onClick={goToWelcome}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold shrink-0 text-xs sm:text-sm"
                >
                  Finish & Return Home
                </TouchButton>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* Right Column on Desktop (md:col-span-5) / Vertical Scroll on Mobile */}
          {/* ========================================================= */}
          <div className="w-full md:col-span-5 flex flex-col space-y-4">
            
            {/* 1. Student Credentials & Schedule Card */}
            <div className="neu-card rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-cyan-400" />
                  <span>Borrower Credentials</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                  Group {borrower.groupNo || '1'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Student Name</span>
                  <span className="text-sm font-black text-slate-100 uppercase tracking-tight block truncate">
                    {borrower.groupLeader || 'NO NAME PROVIDED'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Student ID</span>
                    <span className="font-mono text-cyan-300 font-bold">{borrower.studentId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Program & Code</span>
                    <span className="font-mono text-slate-200 font-bold truncate block">
                      {borrower.program} ({borrower.courseCode || 'N/A'})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Instructor</span>
                    <span className="text-slate-200 font-medium truncate block">{borrower.instructor || 'Lab Custodian'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Schedule</span>
                    <span className="font-mono text-slate-300 text-[11px] truncate block">{borrower.labTime || 'Standard'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Purpose of Borrowing Selector Dropdown */}
            <div className="neu-card rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Purpose of Borrowing</span>
                </span>
                <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                  Official Record
                </span>
              </div>

              <select
                value={borrower.purpose || PURPOSE_OPTIONS[0]}
                onChange={(e) => setBorrowerField('purpose', e.target.value)}
                className="w-full h-10 px-3 rounded-xl neu-inset text-xs font-bold text-slate-100 bg-[#0e1422] border border-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                {PURPOSE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#0e1422] text-slate-100 font-medium">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Digital Signature Canvas (100% Mobile Width, ~16:9 Aspect Ratio) */}
            <div className="neu-card rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Student Digital Signature
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      hasSignature
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${hasSignature ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                    {hasSignature ? 'Signed' : 'Awaiting Sign'}
                  </span>

                  {hasSignature && (
                    <button
                      type="button"
                      onClick={handleClearSignature}
                      className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 px-1.5 py-0.5 rounded neu-btn-raised transition-colors active:scale-95 cursor-pointer font-bold"
                      title="Clear Signature"
                    >
                      <Eraser className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Canvas Container with ~16:9 aspect ratio scaling */}
              <div className="relative w-full overflow-hidden rounded-xl">
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
                  className="h-32 w-full touch-none rounded-xl neu-inset bg-[#080d18] border border-slate-800 cursor-crosshair block"
                  style={{ touchAction: 'none' }}
                />

                {!hasSignature && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-500/60 select-none">
                    <PenTool className="w-6 h-6 stroke-1 mb-1 text-slate-600" />
                    <span className="text-[11px] font-mono font-medium">
                      Sign above with finger or stylus
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Action Toolbar (hidden md:flex) */}
            <div className="hidden md:flex flex-col space-y-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between gap-3">
                <TouchButton
                  variant="secondary"
                  size="md"
                  icon={ArrowLeft}
                  onClick={() => setStep(3)}
                  disabled={isTransactionCommitted}
                  className={`flex-1 text-xs sm:text-sm font-bold ${
                    isTransactionCommitted ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  Modify Cart
                </TouchButton>

                <TouchButton
                  variant="danger"
                  size="md"
                  icon={RotateCcw}
                  onClick={resetTransaction}
                  className="flex-1 text-xs sm:text-sm font-bold"
                >
                  New Session
                </TouchButton>
              </div>

              {!safetyAgreement && (
                <span className="text-[10px] text-amber-300 font-bold text-center animate-pulse">
                  * Please tap the safety protocol checkbox to enable printing
                </span>
              )}

              <TouchButton
                variant="primary"
                size="lg"
                icon={Printer}
                onClick={handleManualPrint}
                disabled={!safetyAgreement}
                className={`w-full shadow-lg shadow-cyan-950/50 text-sm font-black py-3.5 ${
                  !safetyAgreement ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isTransactionCommitted ? 'Reprint Borrower Slip' : 'Print Borrower Slip'}
              </TouchButton>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE ONLY: Fixed/Docked Bottom Action Toolbar (< md:) */}
      <div className="md:hidden flex flex-col-reverse gap-2 pt-3 border-t border-slate-800/80 pb-[max(1rem,env(safe-area-inset-bottom,16px))]">
        <div className="flex items-center gap-2">
          <TouchButton
            variant="secondary"
            size="md"
            icon={ArrowLeft}
            onClick={() => setStep(3)}
            disabled={isTransactionCommitted}
            className={`flex-1 text-xs font-bold py-2.5 ${
              isTransactionCommitted ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            Modify Cart
          </TouchButton>

          <TouchButton
            variant="danger"
            size="md"
            icon={RotateCcw}
            onClick={resetTransaction}
            className="flex-1 text-xs font-bold py-2.5"
          >
            New Session
          </TouchButton>
        </div>

        {!safetyAgreement && (
          <span className="text-[10.5px] text-amber-300 font-bold text-center animate-pulse py-0.5">
            * Tap safety protocol checkbox above to print
          </span>
        )}

        <TouchButton
          variant="primary"
          size="lg"
          icon={Printer}
          onClick={handleManualPrint}
          disabled={!safetyAgreement}
          className={`w-full shadow-lg shadow-cyan-950/50 text-sm font-black py-3 ${
            !safetyAgreement ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isTransactionCommitted ? 'Reprint Borrower Slip' : 'Print Borrower Slip'}
        </TouchButton>
      </div>
    </div>
  );
}
