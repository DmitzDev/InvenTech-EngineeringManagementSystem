import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  // Auto-select first active transaction when modal opens or transactions update
  useEffect(() => {
    if (isOpen) {
      const isCurrentValid = activePendingTransactions.some((t) => t.txId === selectedTxId);
      if (!isCurrentValid && activePendingTransactions.length > 0) {
        setSelectedTxId(activePendingTransactions[0].txId);
      }
    }
  }, [isOpen, activeTransactions]);

  // Update inspection when transaction changes
  useEffect(() => {
    if (selectedTransaction) {
      const initial = {};
      selectedTransaction.items.forEach((item) => {
        initial[item.id] = {
          condition: item.isDamaged ? 'damaged' : 'good',
          qtyReturned: item.qty,
          damageNote: item.damageNote || '',
          damageSeverity: item.damageSeverity || 'Medium',
        };
      });
      setItemInspections(initial);
      setCustodianNotes('');
    }
  }, [selectedTxId, selectedTransaction]);

  if (!isOpen) return null;

  const handleSetCondition = (itemId, condition) => {
    setItemInspections((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        condition,
        // Set default issue description if switching to repair/damage
        damageNote: prev[itemId]?.damageNote || (condition === 'needs_repair' ? 'Needs recalibration / test' : condition === 'damaged' ? 'Physical damage reported' : ''),
        damageSeverity: prev[itemId]?.damageSeverity || (condition === 'needs_repair' ? 'Medium' : 'High'),
      },
    }));
  };

  const handleUpdateInspectionDetail = (itemId, field, value) => {
    setItemInspections((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  // Select Active Transaction
  const handleSelectTransaction = (tx) => {
    setSelectedTxId(tx.txId);
    showToast(`Selected Session: ${tx.txId} (${tx.borrower.groupLeader})`, 'info');
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
        damageNote: inspection.damageNote || '',
        damageSeverity: inspection.damageSeverity || 'Medium',
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

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in select-none">
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
                  ACTIVE SESSIONS
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Inspect physical item conditions, apply damages/losses if any, and issue clearance slip.
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
          {/* Quick Active Student Registry Bar */}
          <div className="p-3.5 rounded-2xl neu-inset bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <User className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-emerald-300">Active Student Return Registry</span>
                <p className="text-[11px] text-slate-400">Select an active student transaction to check in apparatus:</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {activePendingTransactions.map((tx) => (
                <button
                  key={tx.txId}
                  type="button"
                  onClick={() => handleSelectTransaction(tx)}
                  className="px-2.5 py-1 rounded-lg neu-btn-raised text-[10px] font-mono font-bold text-cyan-300 flex items-center gap-1 hover:text-white"
                  title="Select Transaction"
                >
                  <User className="w-3 h-3 text-emerald-400" />
                  <span>{tx.borrower.groupLeader.split(' ')[0]} ({tx.borrower.studentId || tx.txId.slice(-4)})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Transactions List or All Clear State */}
          {activePendingTransactions.length === 0 ? (
            <div className="py-10 px-4 text-center neu-card rounded-2xl border border-slate-800 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl neu-inset flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">All Laboratory Equipment Returned & Cleared</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  There are currently no outstanding borrowed apparatus checked out of the engineering laboratories.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Select Active Borrowing Slip:
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
          )}

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

                <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
                  {selectedTransaction.items.map((item, idx) => {
                    const inspection = itemInspections[item.id] || { condition: 'good', qtyReturned: item.qty };
                    const isFlagged = inspection.condition === 'needs_repair' || inspection.condition === 'damaged';

                    return (
                      <div key={item.id} className="p-3.5 space-y-2.5 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                              Borrowed: <strong className="text-slate-200 font-mono">{item.qty} {item.unit || 'pcs'}</strong>
                            </div>
                          </div>

                          {/* 3 Explicit Condition Check Chips */}
                          <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-center">
                            {/* Good / Working */}
                            <button
                              type="button"
                              onClick={() => handleSetCondition(item.id, 'good')}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${inspection.condition === 'good'
                                  ? 'neu-btn-primary bg-emerald-500 text-slate-950 font-black shadow-sm'
                                  : 'neu-btn-raised text-slate-400 hover:text-emerald-400'
                                }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Good / Working</span>
                            </button>

                            {/* Needs Calibration / Repair */}
                            <button
                              type="button"
                              onClick={() => handleSetCondition(item.id, 'needs_repair')}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${inspection.condition === 'needs_repair'
                                  ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                  : 'neu-btn-raised text-slate-400 hover:text-amber-300'
                                }`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Needs Calibration / Repair</span>
                            </button>

                            {/* Damaged / Missing Parts */}
                            <button
                              type="button"
                              onClick={() => handleSetCondition(item.id, 'damaged')}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${inspection.condition === 'damaged'
                                  ? 'bg-rose-600 text-white font-black shadow-[0_0_10px_rgba(225,29,72,0.5)]'
                                  : 'neu-btn-raised text-slate-400 hover:text-rose-400'
                                }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Damaged / Missing Parts</span>
                            </button>
                          </div>
                        </div>

                        {/* Expandable Incident Reporting & Maintenance Lockout Details */}
                        {isFlagged && (
                          <div className="ml-7 p-3 rounded-xl neu-inset bg-rose-950/20 border border-rose-500/30 space-y-2.5 animate-slide-down">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                <span>Automatic Incident Log & Maintenance Lockout</span>
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                                ITEM WILL BE FLAGGED FOR MAINTENANCE
                              </span>
                            </div>

                            {/* Quick Issue Preset Chips */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-slate-400 font-bold">Quick Tag:</span>
                              {[
                                'Burnt fuse',
                                'Broken probe / lead',
                                'Cracked casing / glass',
                                'Uncalibrated scale / needle',
                                'Missing parts / accessories',
                                'Power failure / shorted',
                              ].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => handleUpdateInspectionDetail(item.id, 'damageNote', preset)}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${inspection.damageNote === preset
                                      ? 'bg-rose-500 text-white border-rose-400 font-bold'
                                      : 'bg-[#0b1220] text-slate-300 border-slate-700 hover:text-white'
                                    }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>

                            {/* Custom Issue Notes & Severity Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                              <div className="sm:col-span-2">
                                <input
                                  type="text"
                                  value={inspection.damageNote || ''}
                                  onChange={(e) => handleUpdateInspectionDetail(item.id, 'damageNote', e.target.value)}
                                  placeholder="Describe specific defect (e.g. Probe wire snapped near connector pin)..."
                                  className="w-full h-8 px-2.5 rounded-lg bg-[#091120] border border-rose-500/30 text-xs text-rose-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-400"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-bold shrink-0">Severity:</span>
                                {['Low', 'Medium', 'High', 'Critical'].map((sev) => (
                                  <button
                                    key={sev}
                                    type="button"
                                    onClick={() => handleUpdateInspectionDetail(item.id, 'damageSeverity', sev)}
                                    className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${(inspection.damageSeverity || 'Medium') === sev
                                        ? 'bg-rose-500/30 text-rose-200 border-rose-400'
                                        : 'bg-[#091120] text-slate-500 border-slate-800 hover:text-slate-300'
                                      }`}
                                  >
                                    {sev}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
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
              <p className="text-xs text-slate-500 mt-1">Select an active student transaction above or use the search bar.</p>
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
    </div>,
    document.body
  );
}
