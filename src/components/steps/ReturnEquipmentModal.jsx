import React, { useState, useEffect } from 'react';
import { RotateCcw, Search, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, X, User, Clock, FileText, Check, QrCode, ScanLine } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import TouchButton from '../ui/TouchButton';

export default function ReturnEquipmentModal({ isOpen, onClose, onOpenClearance }) {
  const { activeTransactions, returnEquipmentTransaction, showToast } = useTransaction();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxId, setSelectedTxId] = useState(
    activeTransactions.find((t) => t.status === 'BORROWED')?.txId || null
  );

  const activePendingTransactions = activeTransactions.filter(
    (t) => t.status === 'BORROWED'
  );

  const selectedTransaction = activeTransactions.find((t) => t.txId === selectedTxId);

  // Inspection states for each item in the selected transaction
  const [itemInspections, setItemInspections] = useState({});
  const [custodianNotes, setCustodianNotes] = useState('');

  // Update inspection when transaction changes
  useEffect(() => {
    if (selectedTransaction) {
      const initial = {};
      selectedTransaction.items.forEach((item) => {
        initial[item.id] = {
          condition: item.isDamaged ? 'damaged' : 'good',
          qtyReturned: item.qty,
        };
      });
      setItemInspections(initial);
      setCustodianNotes('');
    }
  }, [selectedTxId]);

  if (!isOpen) return null;

  const handleSetCondition = (itemId, condition) => {
    setItemInspections((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        condition,
      },
    }));
  };

  // Simulate USB Barcode Gun Scan
  const handleSimulateBarcodeScan = (tx) => {
    setSelectedTxId(tx.txId);
    showToast(`*BEEP!* Barcode Scanned: ${tx.txId} (${tx.borrower.groupLeader})`, 'success');
  };

  const handleConfirmReturn = (e) => {
    e.preventDefault();
    if (!selectedTransaction) {
      showToast('Please select an active transaction to return', 'error');
      return;
    }

    const formattedReturnedItems = selectedTransaction.items.map((item) => {
      const inspection = itemInspections[item.id] || { condition: 'good', qtyReturned: item.qty };
      return {
        ...item,
        returnCondition: inspection.condition,
        qtyReturned: inspection.qtyReturned,
      };
    });

    returnEquipmentTransaction({
      txId: selectedTransaction.txId,
      returnedItems: formattedReturnedItems,
      custodianNotes,
    });

    onClose();
    if (onOpenClearance) {
      onOpenClearance();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in select-none">
      <div className="neu-card rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#111a2c] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-inset flex items-center justify-center text-emerald-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Equipment Return & Clearance Station</span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full neu-inset-sm text-emerald-400 font-bold">
                  BARCODE READY
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Scan borrower slip barcode or select an active transaction for return inspection.
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Barcode Scanner Gun Simulation Bar */}
          <div className="p-3.5 rounded-2xl neu-inset bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ScanLine className="w-5 h-5 text-emerald-400 animate-pulse" />
              <div>
                <span className="text-xs font-bold text-emerald-300">USB Barcode Scanner Auto-Listener Active</span>
                <p className="text-[11px] text-slate-400">Scan paper barcode or tap a simulated barcode card below:</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {activePendingTransactions.map((tx) => (
                <button
                  key={tx.txId}
                  type="button"
                  onClick={() => handleSimulateBarcodeScan(tx)}
                  className="px-2.5 py-1 rounded-lg neu-btn-raised text-[10px] font-mono font-bold text-cyan-300 flex items-center gap-1 hover:text-white"
                  title="Simulate Barcode Gun Scan"
                >
                  <ScanLine className="w-3 h-3 text-emerald-400" />
                  <span>Scan {tx.borrower.groupLeader.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Active Borrower Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Or Select Active Borrowing Slip:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activePendingTransactions.map((tx) => {
                const isSelected = selectedTxId === tx.txId;
                return (
                  <button
                    key={tx.txId}
                    type="button"
                    onClick={() => setSelectedTxId(tx.txId)}
                    className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between ${isSelected
                        ? 'neu-card ring-2 ring-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'neu-card-sm neu-card-hover'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-cyan-400 neu-inset-sm px-2 py-0.5 rounded">
                        {tx.txId}
                      </span>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        {tx.items.length} Items Borrowed
                      </span>
                    </div>

                    <div className="mt-2">
                      <div className="text-xs font-bold text-slate-100">{tx.borrower.groupLeader}</div>
                      <div className="text-[11px] text-slate-400">
                        {tx.borrower.program} • {tx.borrower.courseCode} • Grp {tx.borrower.groupNo}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedTransaction ? (
            <div className="space-y-4 pt-2 border-t border-slate-800/80">
              {/* Selected Transaction Summary Card */}
              <div className="neu-inset rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Borrower Details</span>
                  <div className="font-bold text-slate-100 text-sm mt-0.5">
                    {selectedTransaction.borrower.groupLeader}
                  </div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    {selectedTransaction.borrower.program} | {selectedTransaction.borrower.courseCode} | {selectedTransaction.borrower.instructor}
                  </div>
                </div>

                <div className="text-right font-mono text-[11px]">
                  <span className="text-slate-400">Borrowed On: </span>
                  <span className="text-cyan-400 font-bold">{selectedTransaction.borrowedAt}</span>
                </div>
              </div>

              {/* Custodian Inspection Checklist Table */}
              <div className="neu-card rounded-2xl overflow-hidden">
                <div className="p-3 bg-[#111a2c] border-b border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Custodian Apparatus Return Inspection</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">Mark condition of each item</span>
                </div>

                <div className="divide-y divide-slate-800/60 max-h-60 overflow-y-auto">
                  {selectedTransaction.items.map((item, idx) => {
                    const inspection = itemInspections[item.id] || { condition: 'good', qtyReturned: item.qty };

                    return (
                      <div key={item.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded neu-inset text-cyan-400 font-mono text-[11px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-100">{item.name}</span>
                            <span className="text-[10px] font-mono text-cyan-400 neu-inset-sm px-1.5 py-0.5 rounded">
                              {item.tagCode}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 pl-7">
                            Borrowed: <strong className="text-slate-200 font-mono">{item.qty} {item.unit}</strong>
                          </div>
                        </div>

                        {/* Condition Check Chips */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          {/* Good Condition */}
                          <button
                            type="button"
                            onClick={() => handleSetCondition(item.id, 'good')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${inspection.condition === 'good'
                                ? 'neu-btn-primary bg-emerald-500 text-slate-950 shadow-sm'
                                : 'neu-btn-raised text-slate-400 hover:text-emerald-400'
                              }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Good</span>
                          </button>

                          {/* Damaged Condition */}
                          <button
                            type="button"
                            onClick={() => handleSetCondition(item.id, 'damaged')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${inspection.condition === 'damaged'
                                ? 'neu-inset-amber text-amber-300 shadow-sm'
                                : 'neu-btn-raised text-slate-400 hover:text-amber-400'
                              }`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Damaged</span>
                          </button>

                          {/* Missing / Lost */}
                          <button
                            type="button"
                            onClick={() => handleSetCondition(item.id, 'lost')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${inspection.condition === 'lost'
                                ? 'neu-btn-danger bg-rose-950 text-rose-300 shadow-sm'
                                : 'neu-btn-raised text-slate-400 hover:text-rose-400'
                              }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Lost</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custodian Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Custodian Remarks / Incident Notes (Optional):
                </label>
                <input
                  type="text"
                  value={custodianNotes}
                  onChange={(e) => setCustodianNotes(e.target.value)}
                  placeholder="e.g. All items verified complete and returned in good working order."
                  className="w-full min-h-[44px] px-3.5 rounded-xl neu-inset text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500">
              <p className="text-sm font-bold text-slate-300">No Active Borrowing Session Selected</p>
              <p className="text-xs text-slate-500 mt-1">Scan a paper slip barcode or tap one of the active student slips above.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#111a2c] flex items-center justify-between gap-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-5 py-2.5 rounded-xl neu-btn-raised text-xs text-slate-300 font-bold active:scale-95 cursor-pointer"
          >
            Cancel
          </button>

          <TouchButton
            variant="success"
            size="md"
            icon={Check}
            disabled={!selectedTransaction}
            onClick={handleConfirmReturn}
          >
            Confirm Return & Clear Student
          </TouchButton>
        </div>
      </div>
    </div>
  );
}
