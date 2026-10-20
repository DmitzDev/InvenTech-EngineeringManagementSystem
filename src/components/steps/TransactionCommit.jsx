import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  CheckCircle2,
  RotateCcw,
  ArrowLeft,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Square,
  GraduationCap,
  PenTool,
  Eraser,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Check,
  Building2,
  User,
  Clock
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
    showToast,
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
      if (rect.width === 0 || rect.height === 0) return;
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

      // ALWAYS pure black ink for official school documents and printing
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

    // Strict black ink - no color/blue
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

  // Print Slip: validation + commit transaction and trigger system print dialog
  const handleManualPrint = () => {
    if (!safetyAgreement) {
      showToast?.('Please check the Laboratory Safety Agreement checkbox before printing.', 'error');
      return;
    }
    if (!hasSignature && !borrower.signature) {
      showToast?.('Please sign in the signature pad below before printing.', 'error');
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

  return (
    <div className="flex-1 p-3.5 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full max-w-full overflow-x-hidden flex flex-col justify-between space-y-4 select-none relative min-h-0">
      <div className="space-y-4">
        {/* ========================================================= */}
        {/* Top Header: Clear & Friendly Guidance                     */}
        {/* ========================================================= */}
        <div
          className={`rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border shadow-sm ${
            isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className={`text-base sm:text-lg font-bold tracking-tight ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  Step 4: Final Review & Print Slip
                </h2>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isDark
                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  Official Form UdD-FM-LM-01A
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Suriin ang mga kagamitan, pirmahan gamit ang black ink pad, at i-print ang borrower slip.
              </p>
            </div>
          </div>

          <div
            className={`flex items-center sm:flex-col sm:items-end justify-between sm:justify-center px-3.5 py-2 rounded-xl shrink-0 border ${
              isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Reference Number
            </span>
            <span
              className={`text-xs sm:text-sm font-mono font-bold tracking-tight ${
                isDark ? 'text-blue-400' : 'text-blue-700'
              }`}
            >
              {transactionId || 'UDD-TX-PENDING'}
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* Main Grid: Equipment Manifest (Left) vs Borrower Details & Signature (Right) */}
        {/* ========================================================= */}
        <div className="flex flex-col space-y-4 md:space-y-0 md:grid md:grid-cols-12 md:gap-5 items-start">
          {/* ========================================================= */}
          {/* Left Column (md:col-span-7): Equipment Manifest & Safety  */}
          {/* ========================================================= */}
          <div className="w-full md:col-span-7 flex flex-col space-y-3.5">
            {/* MOBILE ONLY: Collapsible Items View */}
            <div
              className={`md:hidden rounded-2xl overflow-hidden border shadow-sm ${
                isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsMobileItemsOpen(!isMobileItemsOpen)}
                className={`w-full p-3.5 flex items-center justify-between gap-2 active:bg-slate-800/10 transition-colors text-left ${
                  isDark ? 'bg-[#111c30]' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div className="min-w-0">
                    <span
                      className={`text-xs font-bold block truncate ${
                        isDark ? 'text-slate-200' : 'text-slate-900'
                      }`}
                    >
                      Mga Hiniram na Gamit
                    </span>
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      {cart.length} {cart.length === 1 ? 'item' : 'items'} ({totalQty} total units)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {isMobileItemsOpen ? 'Itago' : 'Tingnan'}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isMobileItemsOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              </button>

              {isMobileItemsOpen && (
                <div
                  className={`p-3 divide-y border-t max-h-72 overflow-y-auto ${
                    isDark
                      ? 'bg-[#0a0f1d] divide-slate-800 border-slate-800'
                      : 'bg-white divide-slate-100 border-slate-200'
                  }`}
                >
                  {cart.map((item, idx) => (
                    <div
                      key={item.id}
                      className="py-2.5 flex items-center justify-between gap-2 first:pt-1 last:pb-1"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-bold">#{idx + 1}</span>
                          <span
                            className={`text-xs font-bold truncate ${
                              isDark ? 'text-slate-200' : 'text-slate-900'
                            }`}
                          >
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                            {item.tagCode}
                          </span>
                          <span>•</span>
                          <span>{item.isConsumable ? 'Consumable' : 'Returnable'}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-bold ${
                            isDark ? 'text-blue-400' : 'text-slate-900'
                          }`}
                        >
                          {item.qty} {item.unit || 'pc'}
                        </span>
                        {item.isDamaged && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5 justify-end mt-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            <span>May sira</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DESKTOP/TABLET: Clean Itemized Table */}
            <div
              className={`hidden md:block rounded-2xl overflow-hidden border shadow-sm ${
                isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div
                className={`p-3.5 px-4 border-b flex items-center justify-between ${
                  isDark ? 'bg-[#111c30] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-700'}`} />
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Talaan ng mga Hiniram ({cart.length} kagamitan)
                  </span>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    isDark ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-800'
                  }`}
                >
                  Kabuuan: {totalQty} Units
                </span>
              </div>

              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead
                    className={`border-b sticky top-0 uppercase tracking-wider text-[11px] font-bold ${
                      isDark
                        ? 'bg-[#0a0f1d] text-slate-400 border-slate-800'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    <tr>
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3 w-20 text-center">Dami</th>
                      <th className="p-3 w-28">Tag Code</th>
                      <th className="p-3">Pangalan ng Kagamitan</th>
                      <th className="p-3 w-28 text-center">Uri</th>
                      <th className="p-3 w-28 text-center">Kondisyon</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {cart.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}
                      >
                        <td
                          className={`p-3 text-center font-bold ${
                            isDark ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </td>
                        <td
                          className={`p-3 text-center font-bold ${
                            isDark ? 'text-blue-400' : 'text-slate-900'
                          }`}
                        >
                          {item.qty} {item.unit || 'pc'}
                        </td>
                        <td
                          className={`p-3 font-mono font-semibold ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}
                        >
                          {item.tagCode}
                        </td>
                        <td className="p-3">
                          <div className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                            {item.name}
                          </div>
                          <div
                            className={`text-[11px] mt-0.5 ${
                              isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {item.lab === 'DIGITAL'
                              ? 'Digital Lab'
                              : item.lab === 'ECE'
                              ? 'ECE Lab'
                              : item.lab === 'CE'
                              ? 'CE Lab'
                              : item.lab === 'CHEM'
                              ? 'Chemistry Lab'
                              : item.lab === 'PHYSICS'
                              ? 'Physics Lab'
                              : `${item.lab} Lab`}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              item.isConsumable
                                ? isDark
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                                : isDark
                                ? 'bg-slate-800 text-slate-300 border-slate-700'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {item.isConsumable ? 'Consumable' : 'Returnable'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {item.isDamaged ? (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold inline-flex items-center gap-1 border ${
                                isDark
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>May defect</span>
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-medium inline-block border ${
                                isDark
                                  ? 'bg-slate-800/70 text-slate-400 border-slate-700'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              Maayos / Good
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
              <div
                className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 border ${
                  isDark
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="text-xs truncate">
                    <span className="font-bold">Paunang Paalala:</span>
                    <span className="ml-1 opacity-90">
                      May naitalang gasgas o pre-existing defect sa:{' '}
                      {damagedItems.map((i) => i.name).join(', ')}. Hindi ito sisingilin sa inyo.
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                    isDark
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  Nakasulat sa Slip
                </span>
              </div>
            )}

            {/* Institutional Custody & Safety Protocol Card */}
            <div
              onClick={toggleSafetyAgreement}
              className={`p-4 rounded-2xl cursor-pointer transition-all border select-none ${
                safetyAgreement
                  ? isDark
                    ? 'bg-blue-950/20 border-blue-500/50 shadow-sm'
                    : 'bg-blue-50/70 border-2 border-blue-600 shadow-sm'
                  : isDark
                  ? 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <button
                  type="button"
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    safetyAgreement
                      ? 'bg-blue-600 text-white font-bold'
                      : isDark
                      ? 'bg-slate-800 border border-slate-700 text-slate-500'
                      : 'bg-slate-100 border border-slate-300 text-slate-400'
                  }`}
                >
                  {safetyAgreement ? <Check className="w-4 h-4 stroke-[3]" /> : <Square className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ShieldCheck
                      className={`w-4 h-4 shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                    />
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}
                    >
                      Kasunduan sa Kaligtasan at Pangangalaga sa Gamit
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                      (Kailangang lagyan ng tsek)
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    Pinatutunayan ko na ang lahat ng kagamitang ito ay gagamitin nang maingat ayon sa
                    alituntunin ng laboratoryo. Ang aming grupo ay may buong pananagutan sa pag-iingat,
                    tamang pagsasauli, o pag-uulat ng anumang pinsala.
                  </p>
                </div>
              </div>
            </div>

            {/* Official Confirmation Banner after Print */}
            {isTransactionCommitted && (
              <div
                className={`p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border animate-fade-in ${
                  isDark
                    ? 'bg-[#0b1527] border-blue-500/40 text-blue-200 shadow-md'
                    : 'bg-slate-900 text-white border-slate-800 shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-600 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-white">
                      Matagumpay na Na-print ang Borrower Slip!
                    </div>
                    <div className="text-[11px] sm:text-xs opacity-80 mt-0.5">
                      Ref: <span className="font-mono font-bold text-blue-300">{transactionId}</span> • Ibigay
                      ang napirmahang papel sa Laboratory Custodian bago kunin ang kagamitan.
                    </div>
                  </div>
                </div>
                <TouchButton
                  variant="primary"
                  size="sm"
                  icon={RotateCcw}
                  onClick={goToWelcome}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold shrink-0 text-xs active:scale-[0.97]"
                >
                  Tapusin at Bumalik sa Simula
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
            <div
              className={`rounded-2xl p-4 space-y-3 border shadow-sm ${
                isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div
                className={`flex items-center justify-between pb-2 border-b ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <span
                  className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  <GraduationCap
                    className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                  />
                  <span>Impormasyon ng Estudyante</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    isDark
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  Grupo {borrower.groupNo || '1'}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span
                    className={`text-[11px] font-medium block ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Pangalan ng Estudyante / Group Leader
                  </span>
                  <span
                    className={`text-sm font-bold uppercase tracking-tight block truncate mt-0.5 ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}
                  >
                    {borrower.groupLeader || 'HINDI NAITALA'}
                  </span>
                </div>

                <div
                  className={`grid grid-cols-2 gap-3 pt-2 border-t ${
                    isDark ? 'border-slate-800' : 'border-slate-100'
                  }`}
                >
                  <div>
                    <span
                      className={`text-[11px] font-medium block ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      Student ID Number
                    </span>
                    <span
                      className={`font-mono font-bold text-xs mt-0.5 block ${
                        isDark ? 'text-blue-400' : 'text-blue-700'
                      }`}
                    >
                      {borrower.studentId || '23-XXXX-XXX'}
                    </span>
                  </div>

                  <div>
                    <span
                      className={`text-[11px] font-medium block ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      Kurso at Section
                    </span>
                    <span
                      className={`font-bold truncate block text-xs mt-0.5 ${
                        isDark ? 'text-slate-200' : 'text-slate-900'
                      }`}
                    >
                      {borrower.program}{' '}
                      {borrower.yearLevel ? `(${borrower.yearLevel}-${borrower.section || '01'})` : ''}
                    </span>
                  </div>
                </div>

                <div
                  className={`grid grid-cols-2 gap-3 pt-2 border-t ${
                    isDark ? 'border-slate-800' : 'border-slate-100'
                  }`}
                >
                  <div>
                    <span
                      className={`text-[11px] font-medium block ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      Guro / Instructor
                    </span>
                    <span
                      className={`font-semibold truncate block text-xs mt-0.5 ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {borrower.instructor || 'Faculty In-Charge'}
                    </span>
                  </div>

                  <div>
                    <span
                      className={`text-[11px] font-medium block ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      Course Code
                    </span>
                    <span
                      className={`font-mono font-bold truncate block text-xs mt-0.5 ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {borrower.courseCode || 'LAB-ACT'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Purpose of Borrowing (Clean Dropdown) */}
            <div
              className={`rounded-2xl p-4 space-y-2 border shadow-sm ${
                isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60">
                <span
                  className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  <Briefcase className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span>Layunin ng Paghiram (Purpose)</span>
                </span>
                <span
                  className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                >
                  Para sa opisyal na slip
                </span>
              </div>

              <div className="pt-1 space-y-2">
                <select
                  value={isCustomPurpose ? 'OTHER' : activePurpose}
                  onChange={handlePurposeChange}
                  className={`w-full h-10 px-3 rounded-xl text-xs font-medium focus:outline-none transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#090d16] border border-slate-700 text-slate-100 focus:border-blue-500'
                      : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                >
                  {PURPOSE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="OTHER">Iba pa (Mag-type ng sariling dahilan)...</option>
                </select>

                {isCustomPurpose && (
                  <input
                    type="text"
                    value={borrower.purpose || ''}
                    onChange={(e) => setBorrowerField('purpose', e.target.value)}
                    placeholder="Ilagay ang espesipikong layunin o proyekto..."
                    className={`w-full h-9 px-3 rounded-xl text-xs font-medium focus:outline-none ${
                      isDark
                        ? 'bg-[#090d16] border border-blue-500 text-slate-100 placeholder-slate-500'
                        : 'bg-white border border-blue-500 text-slate-900 placeholder-slate-400'
                    }`}
                    autoFocus
                  />
                )}
              </div>
            </div>

            {/* 3. Electronic Signature Pad (Clean White Pad, Pure Black Ink) */}
            <div
              className={`rounded-2xl p-4 space-y-2.5 border shadow-sm ${
                isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div
                className={`flex items-center justify-between pb-1.5 border-b ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <PenTool className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Pirma ng Estudyante (Black Ink Pad)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      hasSignature
                        ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border border-slate-700'
                        : 'bg-slate-100 text-slate-600 border border-slate-300'
                    }`}
                  >
                    {hasSignature ? '✓ May Pirma Na' : 'Kailangang Pirmahan'}
                  </span>

                  {hasSignature && (
                    <button
                      type="button"
                      onClick={handleClearSignature}
                      className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer font-bold bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-300 hover:border-rose-300 active:scale-95"
                      title="Burahin ang Pirma"
                    >
                      <Eraser className="w-3 h-3" />
                      <span>Burahin (Clear)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dedicated Signature Canvas: Always Crisp White Background so Black Ink is clearly seen */}
              <div className="relative w-full rounded-xl border-2 border-slate-300 bg-white shadow-inner overflow-hidden select-none">
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
                  className="h-32 w-full touch-none cursor-crosshair block bg-white"
                  style={{ touchAction: 'none' }}
                />

                {/* Paper Baseline Guide */}
                <div className="absolute left-3.5 bottom-4 pointer-events-none flex items-center gap-2 select-none opacity-40">
                  <span className="text-xs font-bold text-slate-400 font-mono">✕</span>
                  <div className="w-56 sm:w-80 border-b border-dashed border-slate-400" />
                </div>

                {!hasSignature && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center select-none text-slate-400">
                    <PenTool className="w-5 h-5 mb-1 opacity-70 text-slate-500" />
                    <span className="text-xs font-bold text-slate-600">
                      Pumirma rito gamit ang daliri o stylus
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      (Naka-set sa solid black ink para sa official slip)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Action Toolbar */}
            <div
              className={`hidden md:flex flex-col space-y-2.5 pt-2 ${
                isDark ? 'border-t border-slate-800' : 'border-t border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2.5">
                <TouchButton
                  variant="secondary"
                  size="md"
                  icon={ArrowLeft}
                  onClick={() => setStep(3)}
                  disabled={isTransactionCommitted}
                  className={`flex-1 text-xs font-bold active:scale-[0.98] ${
                    isTransactionCommitted ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  Baguhin ang Kagamitan
                </TouchButton>

                <TouchButton
                  variant="danger"
                  size="md"
                  icon={RotateCcw}
                  onClick={resetTransaction}
                  className="flex-1 text-xs font-bold active:scale-[0.98]"
                >
                  Bagong Sesyon (Reset)
                </TouchButton>
              </div>

              {!safetyAgreement && (
                <span className="text-xs text-amber-500 font-semibold text-center block">
                  * Paki-check ang kasunduan sa kaligtasan sa kaliwa para makapag-print
                </span>
              )}

              {safetyAgreement && !hasSignature && (
                <span className="text-xs text-amber-500 font-semibold text-center block">
                  * Pakipirmahan ang kahon sa itaas gamit ang iyong daliri
                </span>
              )}

              <TouchButton
                variant="primary"
                size="lg"
                icon={Printer}
                onClick={handleManualPrint}
                disabled={!safetyAgreement || !hasSignature}
                className={`w-full text-sm font-extrabold py-3.5 tracking-wider uppercase transition-all shadow-md active:scale-[0.98] ${
                  !safetyAgreement || !hasSignature
                    ? 'opacity-40 cursor-not-allowed bg-slate-400'
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                }`}
              >
                {isTransactionCommitted ? 'I-print Muli ang Slip' : 'I-print ang Opisyal na Borrower Slip'}
              </TouchButton>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE ONLY: Bottom Fixed Action Bar */}
      <div
        className={`md:hidden flex flex-col-reverse gap-2 pt-3 border-t ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        } pb-[max(1rem,env(safe-area-inset-bottom,16px))]`}
      >
        <div className="flex items-center gap-2">
          <TouchButton
            variant="secondary"
            size="md"
            icon={ArrowLeft}
            onClick={() => setStep(3)}
            disabled={isTransactionCommitted}
            className={`flex-1 text-xs font-bold py-2.5 active:scale-[0.98] ${
              isTransactionCommitted ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            Bumalik sa Gamit
          </TouchButton>

          <TouchButton
            variant="danger"
            size="md"
            icon={RotateCcw}
            onClick={resetTransaction}
            className="flex-1 text-xs font-bold py-2.5 active:scale-[0.98]"
          >
            Reset
          </TouchButton>
        </div>

        {!safetyAgreement && (
          <span className="text-xs text-amber-500 font-semibold text-center block">
            * I-check ang kasunduan sa kaligtasan bago mag-print
          </span>
        )}

        {safetyAgreement && !hasSignature && (
          <span className="text-xs text-amber-500 font-semibold text-center block">
            * Pumirma sa kahon sa itaas bago mag-print
          </span>
        )}

        <TouchButton
          variant="primary"
          size="lg"
          icon={Printer}
          onClick={handleManualPrint}
          disabled={!safetyAgreement || !hasSignature}
          className={`w-full text-sm font-extrabold py-3 uppercase tracking-wider active:scale-[0.98] ${
            !safetyAgreement || !hasSignature
              ? 'opacity-40 cursor-not-allowed bg-slate-400'
              : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
          }`}
        >
          {isTransactionCommitted ? 'I-print Muli ang Slip' : 'I-print ang Opisyal na Borrower Slip'}
        </TouchButton>
      </div>
    </div>
  );
}
