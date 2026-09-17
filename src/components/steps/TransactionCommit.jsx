import React, { useState } from 'react';
import { Printer, Download, CheckCircle2, RotateCcw, ArrowLeft, Home, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from '../ui/TouchButton';
import html2pdf from 'html2pdf.js';

export default function TransactionCommit() {
  const {
    borrower,
    cart,
    transactionId,
    timestamp,
    selectedLab,
    resetTransaction,
    goToWelcome,
    setStep,
    theme,
  } = useTransaction();

  const isDark = theme === 'dark';

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const damagedItems = cart.filter((i) => i.isDamaged);

  // Print Slip manually triggered on button click
  const handleManualPrint = () => {
    setIsRadialMenuOpen(false);
    try {
      window.print();
    } catch (e) {
      console.error('Print error', e);
    }
  };

  // Download PDF manually triggered on button click
  const handleDownloadPdf = async () => {
    setIsRadialMenuOpen(false);
    setIsDownloadingPdf(true);

    try {
      const element = document.getElementById('printable-borrower-sheet');
      if (!element) {
        throw new Error('Printable document element not found');
      }

      const clone = element.cloneNode(true);
      clone.classList.remove('print-only');
      clone.style.display = 'block';
      clone.style.width = '794px';
      clone.style.padding = '24px';
      clone.style.backgroundColor = '#ffffff';
      clone.style.color = '#000000';

      const studentSlug = (borrower.groupLeader || 'Student').replace(/\s+/g, '_');
      const filename = `Borrower_Slip_${studentSlug}_${transactionId || 'UdD'}.pdf`;

      const opt = {
        margin: [5, 5, 5, 5],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(clone).save();
    } catch (error) {
      console.error('PDF Generation Failed:', error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-28 xl:pb-8 max-w-6xl mx-auto w-full flex flex-col justify-between space-y-5 select-none relative">
      <div className="space-y-5">
        {/* Neumorphic Review & Verification Banner */}
        <div className="neu-card rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-cyan-500/30 shadow-[0_0_24px_rgba(6,182,212,0.15)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 neu-inset flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
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
                Double-check your equipment list below. When satisfied, proceed to print or download your official borrower sheet.
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono neu-inset px-4 py-2 rounded-xl shrink-0">
            <div className="text-[10px] text-slate-400 font-medium">Transaction ID</div>
            <div className="text-xs sm:text-sm font-bold text-cyan-400">{transactionId || 'UDD-TX-DRAFT'}</div>
          </div>
        </div>

        {/* Neumorphic Transaction Summary & Metadata Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Borrower summary */}
          <div className="neu-card-sm rounded-2xl p-5 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Student / Group Leader
            </span>
            <div className="text-base font-bold text-slate-100 uppercase truncate">
              {borrower.groupLeader || 'NO NAME PROVIDED'}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Group {borrower.groupNo || '1'} • {borrower.program}
            </div>
          </div>

          {/* Academic course & schedule */}
          <div className="neu-card-sm rounded-2xl p-5 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Course & Instructor
            </span>
            <div className="text-base font-bold text-slate-100">
              {borrower.courseCode || 'N/A'}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {borrower.instructor}
            </div>
          </div>

          {/* Department & total count */}
          <div className="neu-card-sm rounded-2xl p-5 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Laboratory & Apparatus
            </span>
            <div className="text-base font-bold text-cyan-400">
              {selectedLab === 'DIGITAL_ECE' ? 'DIGITAL & ECE' : (selectedLab || 'ALL')} LAB • {cart.length} Distinct
            </div>
            <div className="text-xs text-slate-400">
              Total: <span className="font-bold text-slate-200">{totalQty} Units Requested</span>
            </div>
          </div>
        </div>

        {/* Flagged Damaged Items Warning Banner */}
        {damagedItems.length > 0 && (
          <div className="p-4 rounded-2xl neu-inset-amber border border-amber-500/30 flex items-center justify-between gap-3 text-amber-200">
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
          <div className="p-4 bg-[#111a2c] border-b border-slate-800/80 flex items-center justify-between">
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

          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e1626] text-slate-400 border-b border-slate-800/80 sticky top-0">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3 w-20">Qty</th>
                  <th className="p-3 w-28">Tag Code</th>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 w-36">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cart.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-800/20">
                    <td className="p-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-cyan-400">{item.qty} {item.unit}</td>
                    <td className="p-3 font-mono text-slate-300">{item.tagCode}</td>
                    <td className="p-3 font-semibold text-slate-200">
                      <div>{item.name}</div>
                      <div className="text-[10px] font-mono text-cyan-400/90 font-medium">
                        {item.lab === 'DIGITAL' ? 'Digital & Microcontroller Lab' : item.lab === 'ECE' ? 'ECE & Communications Lab' : item.lab === 'CE' ? 'Civil Engineering Lab' : item.lab === 'CHEM' ? 'Chemistry Lab' : item.lab === 'PHYSICS' ? 'Physics & Mechanics Lab' : `${item.lab} Lab`}
                      </div>
                    </td>
                    <td className="p-3">
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
      </div>

      {/* Action Toolbar */}
      <div className="flex pt-4 border-t border-slate-800/80 items-center justify-between gap-4 shrink-0">
        {/* Left Side: Navigation / Session Controls */}
        <div className="flex items-center gap-3">
          <TouchButton
            variant="secondary"
            size="md"
            icon={ArrowLeft}
            onClick={() => setStep(3)}
          >
            Modify Cart
          </TouchButton>

          <TouchButton
            variant="secondary"
            size="md"
            icon={Home}
            onClick={goToWelcome}
          >
            Home
          </TouchButton>

          <TouchButton
            variant="danger"
            size="md"
            icon={RotateCcw}
            onClick={resetTransaction}
          >
            New Transaction
          </TouchButton>
        </div>

        {/* Right Side: Primary Actions (Download PDF & Print Slip) */}
        <div className="flex items-center gap-3">
          {/* Download PDF Button */}
          <TouchButton
            variant="success"
            size="lg"
            icon={isDownloadingPdf ? Loader2 : Download}
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
          >
            {isDownloadingPdf ? 'Generating PDF...' : 'Download PDF Copy'}
          </TouchButton>

          {/* Print Slip Button (Primary Action) */}
          <TouchButton
            variant="primary"
            size="lg"
            icon={Printer}
            onClick={handleManualPrint}
            className="shadow-lg shadow-cyan-950/50"
          >
            Print Borrower Slip
          </TouchButton>
        </div>
      </div>
    </div>
  );
}
