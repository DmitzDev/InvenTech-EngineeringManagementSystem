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

      // Ink Color: Solid dark slate-900 (#0f172a) in light mode, Sky Blue (#38bdf8) in dark mode
      ctx.strokeStyle = isDark ? '#38bdf8' : '#0f172a';
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
  }, [isDark]);

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
    ctx.strokeStyle = isDark ? '#38bdf8' : '#0f172a';
    ctx.lineWidth = 2.5;
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
        <div className={`rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border ${
          isDark
            ? 'neu-card border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.12)]'
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${
              isDark
                ? 'bg-cyan-500/15 neu-inset text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-blue-50 text-blue-800 border border-blue-200/60 shadow-xs'
            }`}>
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-sm sm:text-lg font-black tracking-tight ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  Step 04: Verify & Finalize Slip
                </h2>
                <span className={`text-[9.5px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  isDark
                    ? 'neu-inset-sm text-cyan-400'
                    : 'bg-blue-50 text-blue-800 border border-blue-200/60 font-semibold'
                }`}>
                  UdD-FM-LM-01A-01
                </span>
              </div>
              <p className={`text-[11px] sm:text-xs mt-0.5 leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Review borrower information, certify the institutional safety protocol, and print the official slip.
              </p>
            </div>
          </div>

          <div className={`text-left sm:text-right font-mono px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shrink-0 border ${
            isDark ? 'neu-inset border-slate-800/80' : 'bg-slate-50 border-slate-200 shadow-xs'
          }`}>
            <div className={`text-[9px] sm:text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Transaction Reference</div>
            <div className={`text-xs sm:text-sm font-bold ${isDark ? 'text-cyan-400' : 'text-slate-900 font-black'}`}>{transactionId || 'UDD-TX-DRAFT'}</div>
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
              <div className={`p-3.5 ${isDark ? 'bg-[#111a2c] border-slate-800/80' : 'bg-white border-slate-300'} border-b flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-slate-900'}`} />
                  <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>
                    Itemized Laboratory Slip Preview ({cart.length} of 15 slots)
                  </span>
                </div>
                <span className={`text-xs font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-slate-950'}`}>
                  {totalQty} Total Units
                </span>
              </div>

              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`${isDark ? 'bg-[#0e1626] text-slate-400 border-slate-800/80' : 'bg-slate-100 text-slate-950 border-slate-300 font-black'} border-b sticky top-0`}>
                    <tr>
                      <th className="p-2.5 w-10 text-center font-mono">#</th>
                      <th className="p-2.5 w-16">Qty</th>
                      <th className="p-2.5 w-24">Tag Code</th>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 w-24">Category</th>
                      <th className="p-2.5 w-28">Condition</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                    {cart.map((item, idx) => (
                      <tr key={item.id} className={isDark ? 'hover:bg-slate-800/20' : 'hover:bg-slate-100/60'}>
                        <td className={`p-2.5 text-center font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>{idx + 1}</td>
                        <td className={`p-2.5 font-mono font-black ${isDark ? 'text-cyan-400' : 'text-slate-950'}`}>{item.qty} {item.unit || 'pc'}</td>
                        <td className={`p-2.5 font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>{item.tagCode}</td>
                        <td className={`p-2.5 font-semibold ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>
                          <div className="font-bold">{item.name}</div>
                          <div className={`text-[10px] font-mono font-bold ${isDark ? 'text-cyan-400/90' : 'text-slate-600'}`}>
                            {item.lab === 'DIGITAL' ? 'Digital Lab' : item.lab === 'ECE' ? 'ECE Lab' : item.lab === 'CE' ? 'CE Lab' : item.lab === 'CHEM' ? 'Chemistry Lab' : item.lab === 'PHYSICS' ? 'Physics Lab' : `${item.lab} Lab`}
                          </div>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border ${
                              item.isConsumable
                                ? isDark
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-amber-100 text-amber-950 border-amber-300 font-bold'
                                : isDark
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                : 'bg-slate-100 text-slate-900 border-slate-300 font-bold'
                            }`}
                          >
                            {item.isConsumable ? 'Consumable' : 'Returnable'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          {item.isDamaged ? (
                            <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                              isDark ? 'neu-inset-amber text-amber-300' : 'bg-rose-50 text-rose-800 border border-rose-200/60'
                            }`}>
                              <AlertTriangle className="w-3 h-3" />
                              <span>Pre-damaged</span>
                            </span>
                          ) : (
                            <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold inline-block ${
                              isDark ? 'text-slate-400' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                            }`}>Good</span>
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
              <div className={`p-3 sm:p-3.5 rounded-2xl flex items-center justify-between gap-3 ${
                isDark
                  ? 'neu-inset-amber border border-amber-500/30 text-amber-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200/60 shadow-sm'
              }`}>
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                  <div className="text-xs">
                    <span className="font-bold">{damagedItems.length} item(s) flagged for Pre-existing Condition:</span>
                    <span className={`ml-1 ${isDark ? 'text-amber-300/90' : 'text-amber-900 font-semibold'}`}>
                      {damagedItems.map((i) => i.name).join(', ')}
                    </span>
                  </div>
                </div>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                  isDark
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  NOTED ON SLIP
                </span>
              </div>
            )}

            {/* Institutional Safety & Lab Protocol Agreement Card */}
            <div
              onClick={toggleSafetyAgreement}
              className={`p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all border select-none ${
                safetyAgreement
                  ? isDark
                    ? 'neu-inset border-cyan-500/60 bg-cyan-950/20 shadow-[0_0_18px_rgba(6,182,212,0.2)]'
                    : 'bg-blue-50/70 border-2 border-blue-500 shadow-sm'
                  : isDark
                    ? 'neu-card border-slate-700 hover:border-slate-600 bg-[#111a2c]'
                    : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    safetyAgreement
                      ? isDark
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-blue-600 text-white shadow-sm'
                      : isDark
                        ? 'neu-inset text-slate-500'
                        : 'bg-slate-100 border border-slate-300 text-slate-400'
                  }`}
                >
                  {safetyAgreement ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <ShieldCheck className={`w-4 h-4 shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                    <span className={`text-xs sm:text-sm font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      Institutional Safety & Laboratory Protocol Agreement
                    </span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold ${
                      isDark
                        ? 'text-cyan-300 bg-cyan-950/80 border-cyan-500/30'
                        : 'bg-blue-50 text-blue-800 border-blue-200/60 font-semibold'
                    }`}>
                      CHED Compliant
                    </span>
                  </div>
                  <p className={`text-[11px] sm:text-xs mt-1 leading-relaxed ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    I certify that all apparatus will be handled in accordance with Universidad de Dagupan Safety Rules. I accept liability for damages or unreturned items.
                  </p>
                </div>
              </div>
            </div>

            {/* Official Commit & Printed Status Confirmation Banner */}
            {isTransactionCommitted && (
              <div className={`p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in ${
                isDark
                  ? 'neu-inset bg-emerald-950/40 border border-emerald-500/60 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.2)]'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-sm'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                    isDark
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className={`font-extrabold text-xs sm:text-sm ${isDark ? 'text-emerald-200' : 'text-emerald-950'}`}>
                      Borrower Slip Printed & Transaction Officially Recorded!
                    </div>
                    <div className={`text-[11px] sm:text-xs ${isDark ? 'text-emerald-300/80' : 'text-emerald-800'}`}>
                      Ref Code: <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-emerald-950'}`}>{transactionId}</span> • Please submit the signed printed slip to the Laboratory Custodian.
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
            <div className={`rounded-2xl p-4 space-y-3 ${
              isDark ? 'neu-card' : 'bg-white border border-slate-200 shadow-sm'
            }`}>
              <div className={`flex items-center justify-between pb-2 border-b ${
                isDark ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-700'
                }`}>
                  <GraduationCap className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-slate-900'}`} />
                  <span>Borrower Credentials</span>
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isDark
                    ? 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30'
                    : 'bg-blue-50 text-blue-800 border-blue-200/60 font-semibold'
                }`}>
                  Group {borrower.groupNo || '1'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className={`text-[10px] uppercase font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Student Name
                  </span>
                  <span className={`text-sm font-black uppercase tracking-tight block truncate ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}>
                    {borrower.groupLeader || 'NO NAME PROVIDED'}
                  </span>
                </div>

                <div className={`grid grid-cols-2 gap-2 pt-1 border-t ${
                  isDark ? 'border-slate-800/60' : 'border-slate-200'
                }`}>
                  <div>
                    <span className={`text-[10px] uppercase font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Student ID
                    </span>
                    <span className={`font-mono font-bold ${isDark ? 'text-cyan-300' : 'text-slate-900'}`}>
                      {borrower.studentId || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Program & Code
                    </span>
                    <span className={`font-mono font-bold truncate block ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      {borrower.program} ({borrower.courseCode || 'N/A'})
                    </span>
                  </div>
                </div>

                <div className={`grid grid-cols-2 gap-2 pt-1 border-t ${
                  isDark ? 'border-slate-800/60' : 'border-slate-200'
                }`}>
                  <div>
                    <span className={`text-[10px] uppercase font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Instructor
                    </span>
                    <span className={`font-medium truncate block ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      {borrower.instructor || 'Lab Custodian'}
                    </span>
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Schedule
                    </span>
                    <span className={`font-mono text-[11px] truncate block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {borrower.labTime || 'Standard'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Purpose of Borrowing Quick-Select Chips */}
            <div className={`neu-card rounded-2xl p-4 space-y-2.5 ${
              isDark ? '' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`flex items-center justify-between pb-1.5 border-b ${
                isDark ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-700'
                }`}>
                  <Briefcase className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-slate-900'}`} />
                  <span>Purpose of Borrowing</span>
                </span>
                <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-bold ${
                  isDark ? 'text-cyan-300 bg-cyan-950/70 border border-cyan-500/30' : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}>
                  Official Record
                </span>
              </div>

              {/* Quick-Select Purpose Chips (Exact UI Spec) */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PURPOSE_OPTIONS.map((opt) => {
                  const isSelected = (borrower.purpose || PURPOSE_OPTIONS[0]) === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setBorrowerField('purpose', opt)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-700 font-bold'
                          : isDark
                          ? 'bg-[#0e1626] text-slate-300 border border-slate-800 hover:bg-[#131f35]'
                          : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Digital Signature Canvas (Exact UI Spec: bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg) */}
            <div className={`neu-card rounded-2xl p-4 space-y-2.5 ${
              isDark ? '' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`flex items-center justify-between pb-1.5 border-b ${
                isDark ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-1.5">
                  <PenTool className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-slate-900'}`} />
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    isDark ? 'text-slate-300' : 'text-slate-900'
                  }`}>
                    Student Digital Signature
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      hasSignature
                        ? isDark
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold'
                        : isDark
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-amber-50 text-amber-800 border border-amber-200/60 font-semibold'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${hasSignature ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    {hasSignature ? 'Signed' : 'Awaiting Sign'}
                  </span>

                  {hasSignature && (
                    <button
                      type="button"
                      onClick={handleClearSignature}
                      className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded transition-colors active:scale-95 cursor-pointer font-bold ${
                        isDark ? 'text-slate-400 hover:text-rose-400 neu-btn-raised' : 'text-slate-600 hover:text-rose-600 bg-slate-100 border border-slate-200'
                      }`}
                      title="Clear Signature"
                    >
                      <Eraser className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Canvas Container (Exact Specification: bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg) */}
              <div className={`relative w-full overflow-hidden ${
                isDark
                  ? 'rounded-xl neu-inset bg-[#080d18] border border-slate-800'
                  : 'bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg'
              }`}>
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
                  className={`h-32 w-full touch-none cursor-crosshair block ${
                    isDark ? 'bg-[#080d18]' : 'bg-transparent'
                  }`}
                  style={{ touchAction: 'none' }}
                />

                {!hasSignature && (
                  <div className={`absolute inset-0 pointer-events-none flex flex-col items-center justify-center select-none ${
                    isDark ? 'text-slate-500/60' : 'text-slate-400'
                  }`}>
                    <PenTool className={`w-6 h-6 stroke-1 mb-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                    <span className={`text-[11px] font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>
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
