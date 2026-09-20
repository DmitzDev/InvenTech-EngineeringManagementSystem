import React from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from '../ui/TouchButton';

export default function ReturnClearanceModal({ isOpen, onClose }) {
  const { activeClearanceRecord } = useTransaction();

  if (!isOpen || !activeClearanceRecord) return null;

  const record = activeClearanceRecord;
  const isCleared = record.status === 'RETURNED_CLEARED';

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in select-none">
      <div className="neu-card rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#111a2c] shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl neu-inset flex items-center justify-center ${
                isCleared ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isCleared ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Official Return Clearance Certificate</span>
                <span
                  className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                    isCleared ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {isCleared ? 'CLEARED' : 'INCIDENT RECORDED'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Official proof of laboratory apparatus return for institutional accountability.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl neu-btn-raised text-slate-400 hover:text-white flex items-center justify-center active:scale-95 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Clearance Certificate Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Certificate Container: Clean High-Contrast Official Card */}
          <div className="p-5 sm:p-6 rounded-2xl neu-card-sm border border-cyan-500/20 shadow-xl space-y-4 bg-[#0d1524]">
            {/* Top ISO Heading */}
            <div className="text-center border-b border-slate-700/80 pb-3">
              <div className="flex items-center justify-center gap-3">
                <img src="/images/udd_logo.png" alt="UdD Logo" className="w-11 h-11 object-contain" />
                <div className="text-left">
                  <h4 className="text-sm font-extrabold uppercase tracking-wide text-slate-100">
                    Universidad de Dagupan
                  </h4>
                  <p className="text-[10.5px] text-slate-400 font-medium">
                    School of Engineering • Laboratory Department
                  </p>
                </div>
              </div>
              <div className="mt-3 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 py-1 px-4 rounded-full inline-block border border-emerald-500/40">
                ✓ Laboratory Equipment Return & Custodian Clearance Slip
              </div>
            </div>

            {/* Transaction Ref & Return Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-b border-slate-700/80 pb-3.5">
              <div>
                <span className="text-slate-400 font-medium text-[11px]">Transaction Ref:</span>
                <div className="font-mono font-bold text-cyan-400 text-xs sm:text-sm mt-0.5">
                  {record.txId}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium text-[11px]">Borrower Leader:</span>
                <div className="font-bold text-slate-100 text-xs sm:text-sm mt-0.5">
                  {record.borrower.groupLeader} ({record.borrower.program})
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium text-[11px]">Course & Instructor:</span>
                <div className="text-slate-200 font-semibold mt-0.5">
                  {record.borrower.courseCode} • {record.borrower.instructor}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium text-[11px]">Date & Time Returned:</span>
                <div className="font-bold text-emerald-400 font-mono text-xs sm:text-sm mt-0.5">
                  {record.returnedAt}
                </div>
              </div>
            </div>

            {/* Returned Items Table */}
            <div>
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Returned Apparatus Checklist:
              </div>
              <div className="rounded-xl neu-inset overflow-hidden border border-slate-800">
                <table className="w-full text-xs">
                  <thead className="bg-[#111a2c] text-slate-300 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5 text-left font-bold">Item Name</th>
                      <th className="p-2.5 text-center w-24 font-bold">Qty Ret</th>
                      <th className="p-2.5 text-center w-32 font-bold">Condition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {(record.returnedItems || record.items).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30">
                        <td className="p-2.5">
                          <div className="font-bold text-slate-100">{item.name}</div>
                          <div className="text-[10px] font-mono text-cyan-400">{item.tagCode}</div>
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-100">
                          {item.qtyReturned ?? item.qty} {item.unit}
                        </td>
                        <td className="p-2.5 text-center font-bold text-[11px]">
                          {item.returnCondition === 'damaged' ? (
                            <span className="text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                              ⚠️ Damaged
                            </span>
                          ) : item.returnCondition === 'lost' ? (
                            <span className="text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/40">
                              ❌ Missing
                            </span>
                          ) : (
                            <span className="text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                              ✓ Good Order
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Custodian Sign-off */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-slate-700/80">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Custodian Remarks:
                </span>
                <p className="text-slate-200 italic text-[11px] mt-0.5">
                  {record.custodianNotes || 'All apparatus verified complete and restored to laboratory inventory.'}
                </p>
              </div>

              <div className="text-center font-mono text-[11px] border border-emerald-500/50 bg-emerald-950/60 text-emerald-300 px-3.5 py-1.5 rounded-xl font-bold shadow-sm self-end sm:self-auto">
                ✓ CLEARED BY CUSTODIAN
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800/80 bg-[#111a2c] flex items-center justify-between gap-4 shrink-0">
          <TouchButton
            variant="outline"
            size="md"
            icon={Printer}
            onClick={handlePrint}
          >
            Print Clearance Slip
          </TouchButton>

          <TouchButton
            variant="primary"
            size="md"
            onClick={onClose}
          >
            Close & Finish
          </TouchButton>
        </div>
      </div>
    </div>,
    document.body
  );
}
