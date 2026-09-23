import React from 'react';
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
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from '../ui/TouchButton';

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
    theme,
  } = useTransaction();

  const isDark = theme === 'dark';

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const damagedItems = cart.filter((i) => i.isDamaged);

  // Print Slip manually triggered on button click
  const handleManualPrint = () => {
    if (!safetyAgreement) return;
    try {
      window.print();
    } catch (e) {
      console.error('Print error', e);
    }
  };

  return (
    <div className="flex-1 p-3 sm:p-6 lg:p-8 pb-10 max-w-6xl mx-auto w-full flex flex-col justify-between space-y-4 sm:space-y-5 select-none relative min-h-0">
      <div className="space-y-4 sm:space-y-5">
        {/* Neumorphic Review & Verification Banner */}
        <div className="neu-card rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border border-cyan-500/30 shadow-[0_0_24px_rgba(6,182,212,0.15)]">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-cyan-500/15 neu-inset flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-100">
                  Step 04: Verify & Finalize Slip
                </h2>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full neu-inset-sm text-cyan-400 font-bold">
                  UdD-FM-LM-01A-01
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Review borrower details and apparatus list. Certify the safety agreement to print your official slip.
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono neu-inset px-4 py-2 rounded-xl shrink-0">
            <div className="text-[10px] text-slate-400 font-medium">Transaction Reference</div>
            <div className="text-xs sm:text-sm font-bold text-cyan-400">{transactionId || 'UDD-TX-DRAFT'}</div>
          </div>
        </div>

        {/* Neumorphic Transaction Summary & Metadata Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Borrower summary */}
          <div className="neu-card-sm rounded-2xl p-4 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Student Credentials</span>
            </span>
            <div className="text-sm sm:text-base font-bold text-slate-100 uppercase truncate">
              {borrower.groupLeader || 'NO NAME PROVIDED'}
            </div>
            <div className="text-xs text-cyan-300 font-mono font-bold">
              ID: {borrower.studentId || 'N/A'}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Group {borrower.groupNo || '1'} • {borrower.program} ({borrower.courseCode || 'N/A'})
            </div>
          </div>

          {/* Academic course & schedule */}
          <div className="neu-card-sm rounded-2xl p-4 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Course & Instructor</span>
            </span>
            <div className="text-sm sm:text-base font-bold text-slate-100 truncate">
              {borrower.courseCode || 'General Lab'}
            </div>
            <div className="text-xs text-slate-300 truncate">
              Instructor: {borrower.instructor || 'Lab Custodian'}
            </div>
            <div className="text-xs text-slate-400 font-mono truncate">
              Sched: {borrower.labTime || 'Standard Period'}
            </div>
          </div>

          {/* Apparatus & Group summary */}
          <div className="neu-card-sm rounded-2xl p-4 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Apparatus Summary</span>
            </span>
            <div className="text-sm sm:text-base font-bold text-cyan-400">
              {cart.length} Distinct ({totalQty} Total Units)
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Group {borrower.groupNo || '1'} • Ready for print
            </div>
          </div>
        </div>

        {/* Flagged Damaged Items Warning Banner */}
        {damagedItems.length > 0 && (
          <div className="p-3 sm:p-4 rounded-2xl neu-inset-amber border border-amber-500/30 flex items-center justify-between gap-3 text-amber-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">{damagedItems.length} item(s) flagged for Pre-existing Condition:</span>
                <span className="text-amber-300/90 ml-1">
                  {damagedItems.map((i) => i.name).join(', ')}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/40">
              NOTED ON SLIP
            </span>
          </div>
        )}

        {/* Itemized Apparatus Verification Table */}
        <div className="neu-card rounded-2xl overflow-hidden">
          <div className="p-3 sm:p-4 bg-[#111a2c] border-b border-slate-800/80 flex items-center justify-between">
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

          <div className="overflow-x-auto max-h-56 sm:max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e1626] text-slate-400 border-b border-slate-800/80 sticky top-0">
                <tr>
                  <th className="p-2.5 sm:p-3 w-10 sm:w-12 text-center">#</th>
                  <th className="p-2.5 sm:p-3 w-20">Qty</th>
                  <th className="p-2.5 sm:p-3 w-28">Tag Code</th>
                  <th className="p-2.5 sm:p-3">Item Description</th>
                  <th className="p-2.5 sm:p-3 w-28">Category</th>
                  <th className="p-2.5 sm:p-3 w-36">Condition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cart.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-800/20">
                    <td className="p-2.5 sm:p-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-2.5 sm:p-3 font-mono font-bold text-cyan-400">{item.qty} {item.unit || 'pc'}</td>
                    <td className="p-2.5 sm:p-3 font-mono text-slate-300">{item.tagCode}</td>
                    <td className="p-2.5 sm:p-3 font-semibold text-slate-200">
                      <div>{item.name}</div>
                      <div className="text-[10px] font-mono text-cyan-400/90 font-medium">
                        {item.lab === 'DIGITAL' ? 'Digital & Microcontroller Lab' : item.lab === 'ECE' ? 'ECE & Communications Lab' : item.lab === 'CE' ? 'Civil Engineering Lab' : item.lab === 'CHEM' ? 'Chemistry Lab' : item.lab === 'PHYSICS' ? 'Physics & Mechanics Lab' : `${item.lab} Lab`}
                      </div>
                    </td>
                    <td className="p-2.5 sm:p-3">
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          item.isConsumable
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {item.isConsumable ? 'Consumable' : 'Returnable'}
                      </span>
                    </td>
                    <td className="p-2.5 sm:p-3">
                      {item.isDamaged ? (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full neu-inset-amber text-amber-300 font-bold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Pre-existing Damage</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Good Condition</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 1-Tap Safety & Lab Protocol Agreement Checkbox Card */}
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
                <span className="text-[9.5px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                  CHED & PACUCOA Compliant
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-relaxed">
                I hereby certify that all listed apparatus will be handled in strict accordance with Universidad de Dagupan Engineering Safety Rules & Guidelines. I accept institutional liability for damages or unreturned items.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col-reverse sm:flex-row pt-4 border-t border-slate-800/80 items-stretch sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
        {/* Left Side: Navigation / Session Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <TouchButton
            variant="secondary"
            size="md"
            icon={ArrowLeft}
            onClick={() => setStep(3)}
            className="flex-1 sm:flex-initial text-xs sm:text-sm font-bold"
          >
            Modify Cart
          </TouchButton>

          <TouchButton
            variant="danger"
            size="md"
            icon={RotateCcw}
            onClick={resetTransaction}
            className="flex-1 sm:flex-initial text-xs sm:text-sm font-bold"
          >
            New Transaction
          </TouchButton>
        </div>

        {/* Right Side: Print Slip Primary Action */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {!safetyAgreement && (
            <span className="text-[10.5px] text-amber-300 font-bold animate-pulse">
              * Please tap the safety protocol checkbox above to enable printing
            </span>
          )}
          <TouchButton
            variant="primary"
            size="lg"
            icon={Printer}
            onClick={handleManualPrint}
            disabled={!safetyAgreement}
            className={`w-full sm:w-auto shadow-lg shadow-cyan-950/50 text-sm sm:text-base font-extrabold px-8 ${
              !safetyAgreement ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Print Borrower Slip
          </TouchButton>
        </div>
      </div>
    </div>
  );
}
