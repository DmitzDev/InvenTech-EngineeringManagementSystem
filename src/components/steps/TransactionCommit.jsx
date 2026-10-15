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
  GraduationCap,
  PenTool,
  Eraser,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Check,
  Clock,
  User,
  Hash,
  BookOpen
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

  // Mobile Collapsible State
  const [isMobileItemsOpen, setIsMobileItemsOpen] = useState(false);

  // Custom purpose input state if user selects "Other"
  const [isCustomPurpose, setIsCustomPurpose] = useState(
    borrower.purpose && !PURPOSE_OPTIONS.includes(borrower.purpose)
  );

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

      // Ink Color: Slate-900 in light mode, Cyan-400 in dark mode
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

  // Print Slip: commit transaction and trigger system print dialog
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

  const activePurpose = borrower.purpose || PURPOSE_OPTIONS[0];

  return (
    <div className="flex-1 p-3 sm:p-5 lg:p-7 max-w-7xl mx-auto w-full max-w-full overflow-x-hidden flex flex-col justify-between space-y-4 select-none relative min-h-0">
      <div className="space-y-4">
        {/* ========================================================= */}
        {/* Top Header: Verification & Audit Bar */}
        {/* ========================================================= */}
        <div className={`rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
          isDark
            ? 'bg-[#0f172a]/90 border-slate-800 shadow-md'
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-base sm:text-lg font-black tracking-tight ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  Step 04: Slip Verification & Issuance
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}>
                  UdD-FM-LM-01A
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Review apparatus manifest, verify student credentials, and print official clearance slip.
              </p>
            </div>
          </div>

          <div className={`flex items-center sm:flex-col sm:items-end justify-between sm:justify-center font-mono px-3.5 py-2 rounded-xl shrink-0 border ${
            isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Reference Code
            </span>
            <span className={`text-xs sm:text-sm font-bold tracking-tight ${isDark ? 'text-cyan-400' : 'text-slate-900'}`}>
              {transactionId || 'UDD-TX-PENDING'}
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* Main Grid: Apparatus Manifest (Left) vs Student Clearance (Right) */}
        {/* ========================================================= */}
        <div className="flex flex-col space-y-4 md:space-y-0 md:grid md:grid-cols-12 md:gap-5 items-start">
          
          {/* ========================================================= */}
          {/* Left Column (md:col-span-7): Equipment Manifest & Safety  */}
          {/* ========================================================= */}
          <div className="w-full md:col-span-7 flex flex-col space-y-3.5">
            
            {/* MOBILE ONLY: Collapsible Items View */}
            <div className={`md:hidden rounded-2xl overflow-hidden border ${
              isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <button
                type="button"
                onClick={() => setIsMobileItemsOpen(!isMobileItemsOpen)}
                className={`w-full p-3.5 flex items-center justify-between gap-2 active:bg-slate-800/20 transition-colors text-left ${
                  isDark ? 'bg-[#111c30]' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                  <div className="min-w-0">
                    <span className={`text-xs font-bold block truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      Apparatus Manifest
                    </span>
                    <span className="text-[11px] font-mono font-bold text-cyan-400">
                      {cart.length} {cart.length === 1 ? 'item' : 'items'} ({totalQty} total units)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {isMobileItemsOpen ? 'Hide' : 'Review'}
                  </span>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isMobileItemsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </button>

              {isMobileItemsOpen && (
                <div className={`p-3 divide-y border-t max-h-72 overflow-y-auto ${
                  isDark ? 'bg-[#0a0f1d] divide-slate-800/80 border-slate-800' : 'bg-white divide-slate-100 border-slate-200'
                }`}>
                  {cart.map((item, idx) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-2 first:pt-1 last:pb-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-slate-500 font-bold">#{idx + 1}</span>
                          <span className={`text-xs font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-400">
                          <span className="text-cyan-400 font-bold">{item.tagCode}</span>
                          <span>•</span>
                          <span>{item.isConsumable ? 'Consumable' : 'Returnable'}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xs font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-slate-900'}`}>
                          {item.qty} {item.unit || 'pc'}
                        </span>
                        {item.isDamaged && (
                          <div className="text-[9.5px] text-amber-400 font-bold flex items-center gap-0.5 justify-end mt-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Defect Noted</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DESKTOP/TABLET: Clean Itemized Apparatus Table */}
            <div className={`hidden md:block rounded-2xl overflow-hidden border ${
              isDark ? 'bg-[#0f172a] border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`p-3.5 px-4 border-b flex items-center justify-between ${
                isDark ? 'bg-[#111c30] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-700'}`} />
                  <span className={`text-xs font-extrabold uppercase tracking-wider ${
                    isDark ? 'text-slate-200' : 'text-slate-900'
                  }`}>
                    Itemized Apparatus Manifest ({cart.length} of 15 slots)
                  </span>
                </div>
                <span className={`text-xs font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-slate-900'}`}>
                  {totalQty} Units Total
                </span>
              </div>

              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b sticky top-0 uppercase tracking-wider text-[10px] font-bold ${
                    isDark
                      ? 'bg-[#0a0f1d] text-slate-400 border-slate-800'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    <tr>
                      <th className="p-2.5 px-3.5 w-12 text-center font-mono">#</th>
                      <th className="p-2.5 w-20 text-center">Qty</th>
                      <th className="p-2.5 w-28">Tag Code</th>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 w-28 text-center">Category</th>
                      <th className="p-2.5 w-28 text-center">Condition</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                    {cart.map((item, idx) => (
                      <tr key={item.id} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                        <td className={`p-2.5 px-3.5 text-center font-mono font-bold ${
                          isDark ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {idx + 1}
                        </td>
                        <td className={`p-2.5 text-center font-mono font-black ${
                          isDark ? 'text-cyan-400' : 'text-slate-900'
                        }`}>
                          {item.qty} {item.unit || 'pc'}
                        </td>
                        <td className={`p-2.5 font-mono font-bold ${
                          isDark ? 'text-slate-300' : 'text-slate-800'
                        }`}>
                          {item.tagCode}
                        </td>
                        <td className="p-2.5">
                          <div className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                            {item.name}
                          </div>
                          <div className={`text-[10px] font-mono mt-0.5 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {item.lab === 'DIGITAL' ? 'Digital Lab' : item.lab === 'ECE' ? 'ECE Lab' : item.lab === 'CE' ? 'CE Lab' : item.lab === 'CHEM' ? 'Chemistry Lab' : item.lab === 'PHYSICS' ? 'Physics Lab' : `${item.lab} Lab`}
                          </div>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                            item.isConsumable
                              ? isDark
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                              : isDark
                                ? 'bg-slate-800 text-slate-300 border-slate-700'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {item.isConsumable ? 'Consumable' : 'Returnable'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          {item.isDamaged ? (
                            <span className={`text-[9.5px] px-2 py-0.5 rounded font-bold inline-flex items-center gap-1 border ${
                              isDark
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              <AlertTriangle className="w-3 h-3" />
                              <span>Pre-damaged</span>
                            </span>
                          ) : (
                            <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-semibold inline-block border ${
                              isDark
                                ? 'bg-slate-800/70 text-slate-400 border-slate-700/60'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              Operational
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Flagged Pre-existing Damage Warning */}
            {damagedItems.length > 0 && (
              <div className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 border ${
                isDark
                  ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="text-xs truncate">
                    <span className="font-bold">Noted Pre-existing Issues:</span>
                    <span className="ml-1 opacity-90">
                      {damagedItems.map((i) => i.name).join(', ')}
                    </span>
                  </div>
                </div>
                <span className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${
                  isDark
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  DOC ON SLIP
                </span>
              </div>
            )}

            {/* Institutional Custody & Safety Protocol Card */}
            <div
              onClick={toggleSafetyAgreement}
              className={`p-4 rounded-2xl cursor-pointer transition-all border select-none ${
                safetyAgreement
                  ? isDark
                    ? 'bg-cyan-950/20 border-cyan-500/50 shadow-sm'
                    : 'bg-blue-50/60 border-2 border-blue-600 shadow-sm'
                  : isDark
                    ? 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    safetyAgreement
                      ? isDark
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-blue-600 text-white font-black'
                      : isDark
                        ? 'bg-slate-800 border border-slate-700 text-slate-500'
                        : 'bg-slate-100 border border-slate-300 text-slate-400'
                  }`}
                >
                  {safetyAgreement ? <Check className="w-4 h-4 stroke-[3]" /> : <Square className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ShieldCheck className={`w-4 h-4 shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                    <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      Institutional Custody & Safety Accountability Agreement
                    </span>
                  </div>
                  <p className={`text-[11px] sm:text-xs mt-1 leading-relaxed ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    I certify that all apparatus will be handled in accordance with Universidad de Dagupan School of Engineering safety protocols. The borrower assumes responsibility for custodial care, safe return, or reported damages.
                  </p>
                </div>
              </div>
            </div>

            {/* Official Confirmation Banner after Print */}
            {isTransactionCommitted && (
              <div className={`p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border animate-fade-in ${
                isDark
                  ? 'bg-[#0b1527] border-cyan-500/40 text-cyan-200 shadow-md'
                  : 'bg-slate-900 text-white border-slate-800 shadow-md'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-500 text-slate-950'
                  }`}>
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs sm:text-sm text-white">
                      Borrower Slip Printed & Transaction Officially Logged
                    </div>
                    <div className="text-[11px] sm:text-xs opacity-80 mt-0.5">
                      Ref: <span className="font-mono font-bold text-cyan-300">{transactionId}</span> • Please submit the signed printed slip to the Laboratory Custodian.
                    </div>
                  </div>
                </div>
                <TouchButton
                  variant="primary"
                  size="sm"
                  icon={RotateCcw}
                  onClick={goToWelcome}
                  className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold shrink-0 text-xs"
                >
                  Return to Welcome
                </TouchButton>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* Right Column (md:col-span-5): Borrower Credentials,       */}
          {/* Purpose, Signature & Action Dispatch                      */}
          {/* ========================================================= */}
          <div className="w-full md:col-span-5 flex flex-col space-y-3.5">
            
            {/* 1. Borrower Identification Summary */}
            <div className={`rounded-2xl p-4 space-y-3 border ${
              isDark ? 'bg-[#0f172a] border-slate-800 shadow-sm' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`flex items-center justify-between pb-2 border-b ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <span className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  <GraduationCap className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                  <span>Borrower Credentials</span>
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  Group {borrower.groupNo || '1'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Student Name
                  </span>
                  <span className={`text-sm font-black uppercase tracking-tight block truncate ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}>
                    {borrower.groupLeader || 'STUDENT NAME RECORDED'}
                  </span>
                </div>

                <div className={`grid grid-cols-2 gap-3 pt-2 border-t ${
                  isDark ? 'border-slate-800/80' : 'border-slate-100'
                }`}>
                  <div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      Student ID
                    </span>
                    <span className={`font-mono font-bold text-xs ${
                      isDark ? 'text-cyan-400' : 'text-slate-900'
                    }`}>
                      {borrower.studentId || '23-XXXX-XXX'}
                    </span>
                  </div>

                  <div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      Academic Program
                    </span>
                    <span className={`font-bold truncate block text-xs ${
                      isDark ? 'text-slate-200' : 'text-slate-900'
                    }`}>
                      {borrower.program} {borrower.yearLevel ? `(${borrower.yearLevel}-${borrower.section || '01'})` : ''}
                    </span>
                  </div>
                </div>

                <div className={`grid grid-cols-2 gap-3 pt-2 border-t ${
                  isDark ? 'border-slate-800/80' : 'border-slate-100'
                }`}>
                  <div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      Laboratory Instructor
                    </span>
                    <span className={`font-semibold truncate block text-xs ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      {borrower.instructor || 'Faculty In-Charge'}
                    </span>
                  </div>

                  <div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                      isDark ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      Course Code
                    </span>
                    <span className={`font-mono font-bold truncate block text-xs ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      {borrower.courseCode || 'LAB-ACT'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Purpose of Borrowing (Clean Professional Dropdown) */}
            <div className={`rounded-2xl p-4 space-y-2 border ${
              isDark ? 'bg-[#0f172a] border-slate-800 shadow-sm' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  <Briefcase className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                  <span>Purpose of Borrowing</span>
                </span>
                <span className={`text-[10px] font-mono font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Official Slip Field
                </span>
              </div>

              <div className="pt-1 space-y-2">
                <select
                  value={isCustomPurpose ? 'OTHER' : activePurpose}
                  onChange={handlePurposeChange}
                  className={`w-full h-10 px-3 rounded-xl text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#090d16] border border-slate-700 text-slate-100 focus:border-cyan-500'
                      : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                >
                  {PURPOSE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="OTHER">Other / Custom Purpose...</option>
                </select>

                {isCustomPurpose && (
                  <input
                    type="text"
                    value={borrower.purpose || ''}
                    onChange={(e) => setBorrowerField('purpose', e.target.value)}
                    placeholder="Specify project or laboratory purpose..."
                    className={`w-full h-9 px-3 rounded-xl text-xs font-medium focus:outline-none ${
                      isDark
                        ? 'bg-[#090d16] border border-cyan-500/60 text-slate-100 placeholder-slate-500'
                        : 'bg-white border border-blue-500 text-slate-900 placeholder-slate-400'
                    }`}
                    autoFocus
                  />
                )}
              </div>
            </div>

            {/* 3. Electronic Signature Pad */}
            <div className={`rounded-2xl p-4 space-y-2.5 border ${
              isDark ? 'bg-[#0f172a] border-slate-800 shadow-sm' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`flex items-center justify-between pb-1.5 border-b ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-1.5">
                  <PenTool className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                  <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                    isDark ? 'text-slate-300' : 'text-slate-800'
                  }`}>
                    Student Electronic Signature
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    hasSignature
                      ? isDark
                        ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                        : 'bg-slate-100 text-slate-800 border border-slate-300'
                      : isDark
                        ? 'bg-slate-800/80 text-slate-400 border border-slate-700'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {hasSignature ? 'Signed' : 'Touch to Sign'}
                  </span>

                  {hasSignature && (
                    <button
                      type="button"
                      onClick={handleClearSignature}
                      className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer font-bold ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-rose-600'
                      }`}
                      title="Clear Signature"
                    >
                      <Eraser className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Signature Canvas Box */}
              <div className={`relative w-full overflow-hidden rounded-xl border ${
                isDark
                  ? 'bg-[#090d16] border-slate-700'
                  : 'bg-slate-50 border-2 border-dashed border-slate-300'
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
                  className="h-28 w-full touch-none cursor-crosshair block"
                  style={{ touchAction: 'none' }}
                />

                {!hasSignature && (
                  <div className={`absolute inset-0 pointer-events-none flex flex-col items-center justify-center select-none ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    <PenTool className="w-5 h-5 stroke-1 mb-1 opacity-70" />
                    <span className="text-[11px] font-mono font-medium">
                      Sign above with finger or stylus
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Action Toolbar */}
            <div className={`hidden md:flex flex-col space-y-2.5 pt-2 ${
              isDark ? 'border-t border-slate-800' : 'border-t border-slate-200'
            }`}>
              <div className="flex items-center justify-between gap-2.5">
                <TouchButton
                  variant="secondary"
                  size="md"
                  icon={ArrowLeft}
                  onClick={() => setStep(3)}
                  disabled={isTransactionCommitted}
                  className={`flex-1 text-xs font-bold ${
                    isTransactionCommitted ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  Modify Equipment
                </TouchButton>

                <TouchButton
                  variant="danger"
                  size="md"
                  icon={RotateCcw}
                  onClick={resetTransaction}
                  className="flex-1 text-xs font-bold"
                >
                  New Session
                </TouchButton>
              </div>

              {!safetyAgreement && (
                <span className="text-[10.5px] text-amber-400 font-bold text-center block">
                  * Please acknowledge the safety agreement above to enable slip printing
                </span>
              )}

              <TouchButton
                variant="primary"
                size="lg"
                icon={Printer}
                onClick={handleManualPrint}
                disabled={!safetyAgreement}
                className={`w-full text-sm font-black py-3.5 tracking-wider uppercase transition-all shadow-md ${
                  !safetyAgreement
                    ? 'opacity-40 cursor-not-allowed'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer active:scale-[0.99]'
                }`}
              >
                {isTransactionCommitted ? 'Reprint Borrower Slip' : 'Print Official Borrower Slip'}
              </TouchButton>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE ONLY: Bottom Fixed Action Bar */}
      <div className={`md:hidden flex flex-col-reverse gap-2 pt-3 border-t ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      } pb-[max(1rem,env(safe-area-inset-bottom,16px))]`}>
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
            Back to Cart
          </TouchButton>

          <TouchButton
            variant="danger"
            size="md"
            icon={RotateCcw}
            onClick={resetTransaction}
            className="flex-1 text-xs font-bold py-2.5"
          >
            Reset
          </TouchButton>
        </div>

        {!safetyAgreement && (
          <span className="text-[10px] text-amber-400 font-bold text-center block">
            * Check safety protocol agreement to print slip
          </span>
        )}

        <TouchButton
          variant="primary"
          size="lg"
          icon={Printer}
          onClick={handleManualPrint}
          disabled={!safetyAgreement}
          className={`w-full text-sm font-black py-3 uppercase tracking-wider ${
            !safetyAgreement
              ? 'opacity-40 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer'
          }`}
        >
          {isTransactionCommitted ? 'Reprint Borrower Slip' : 'Print Official Borrower Slip'}
        </TouchButton>
      </div>
    </div>
  );
}
