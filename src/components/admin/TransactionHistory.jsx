import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ScrollText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Layers,
  Filter,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';

const STATUS_BADGE = {
  BORROWED: {
    label: 'IN LAB / BORROWED',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-300',
    border: 'border-cyan-500/40',
  },
  RETURNED_CLEARED: {
    label: 'RETURNED & CLEARED',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
  },
  INCIDENT_REPORTED: {
    label: 'INCIDENT REPORTED',
    bg: 'bg-rose-500/15',
    text: 'text-rose-300',
    border: 'border-rose-500/40',
  },
};

export default function TransactionHistory() {
  const { activeTransactions, showToast, clearAllTransactions } = useTransaction();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [expandedTx, setExpandedTx] = useState(null);

  const filtered = activeTransactions.filter((tx) => {
    const matchesSearch =
      tx.txId.toLowerCase().includes(search.toLowerCase()) ||
      (tx.borrower?.groupLeader || '').toLowerCase().includes(search.toLowerCase()) ||
      (tx.borrower?.program || '').toLowerCase().includes(search.toLowerCase()) ||
      (tx.borrower?.courseCode || '').toLowerCase().includes(search.toLowerCase()) ||
      (tx.borrower?.instructor || '').toLowerCase().includes(search.toLowerCase()) ||
      (tx.items || []).some(
        (it) =>
          (it.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (it.tagCode || '').toLowerCase().includes(search.toLowerCase())
      );

    const matchesStatus = filterStatus === 'ALL' || tx.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const borrowedCount = activeTransactions.filter((t) => t.status === 'BORROWED').length;
  const returnedCount = activeTransactions.filter((t) => t.status === 'RETURNED_CLEARED').length;
  const incidentCount = activeTransactions.filter((t) => t.status === 'INCIDENT_REPORTED').length;

  const toggleExpand = (txId) => {
    setExpandedTx((prev) => (prev === txId ? null : txId));
  };

  // CSV Audit Log Export Functionality
  const handleExportCSV = () => {
    if (activeTransactions.length === 0) {
      if (showToast) showToast('No transactions to export', 'error');
      return;
    }

    const headers = [
      'Transaction ID',
      'Status',
      'Borrower Name',
      'Program',
      'Course Code',
      'Group No',
      'Instructor',
      'Borrowed Date/Time',
      'Returned Date/Time',
      'Total Items Count',
      'Items Breakdown',
      'Custodian Notes',
    ];

    const rows = activeTransactions.map((tx) => {
      const itemsBreakdown = (tx.items || [])
        .map((it) => `[${it.tagCode}] ${it.name} (x${it.qty || 1} ${it.unit || 'pc'}${it.isDamaged ? ' - DAMAGED' : ''})`)
        .join('; ');

      return [
        `"${tx.txId}"`,
        `"${tx.status}"`,
        `"${tx.borrower?.groupLeader || ''}"`,
        `"${tx.borrower?.program || ''}"`,
        `"${tx.borrower?.courseCode || ''}"`,
        `"${tx.borrower?.groupNo || ''}"`,
        `"${tx.borrower?.instructor || ''}"`,
        `"${tx.borrowedAt || ''}"`,
        `"${tx.returnedAt || 'N/A'}"`,
        (tx.items || []).reduce((s, it) => s + (it.qty || 1), 0),
        `"${itemsBreakdown}"`,
        `"${(tx.custodianNotes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kiosk_transactions_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showToast) showToast('Transaction audit log downloaded as CSV', 'success');
  };

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 overflow-y-auto h-full max-w-[1600px] mx-auto pb-10 select-none">
      {/* Header */}
      <div className="border-b-2 border-slate-300 dark:border-white/10 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Transaction History & Clearance Logs
          </h1>
          <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Audit trail of student borrowing slips, returns, apparatus inspection, and incidents
          </p>
        </div>

        {/* Actions: CSV Export & Clear Test Data */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="neu-btn-raised px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 transition-all flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Export Audit Log (CSV)</span>
          </button>

          {activeTransactions.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to permanently clear all test transaction history?')) {
                  clearAllTransactions();
                  showToast('All test transactions cleared.', 'info');
                }
              }}
              className="neu-btn-danger px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95"
              title="Reset all test debug logs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Reset Test Data</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 sm:p-3 rounded-xl neu-card space-y-0.5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total Transactions</span>
          <p className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 dark:text-white">{activeTransactions.length}</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl neu-card border-cyan-500/40 space-y-0.5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">In Laboratory</span>
          <p className="text-lg sm:text-xl font-extrabold font-mono text-cyan-600 dark:text-cyan-300">{borrowedCount}</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl neu-card border-emerald-500/40 space-y-0.5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Cleared / Returned</span>
          <p className="text-lg sm:text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-300">{returnedCount}</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl neu-card border-rose-500/40 space-y-0.5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Incidents Logged</span>
          <p className="text-lg sm:text-xl font-extrabold font-mono text-rose-600 dark:text-rose-300">{incidentCount}</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Tx ID, student name, instructor, course code, apparatus..."
            className="w-full h-9 pl-9 pr-3 rounded-lg neu-inset text-xs text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-inner"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          {[
            { id: 'ALL', label: 'All Records' },
            { id: 'BORROWED', label: 'In Lab' },
            { id: 'RETURNED_CLEARED', label: 'Cleared' },
            { id: 'INCIDENT_REPORTED', label: 'Incidents' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filterStatus === st.id
                  ? 'neu-btn-raised bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/40 shadow-xs'
                  : 'neu-btn-raised text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <div className="p-8 rounded-xl neu-card text-center space-y-2">
          <ScrollText className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600" />
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-200">No Transactions Found</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {search || filterStatus !== 'ALL'
                ? 'No records match your search filter.'
                : 'Borrowing slips generated from the Kiosk terminal will be logged here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((tx) => {
            const statusBadge = STATUS_BADGE[tx.status] || STATUS_BADGE.BORROWED;
            const isExpanded = expandedTx === tx.txId;
            const totalUnits = (tx.items || []).reduce((s, it) => s + (it.qty || 1), 0);

            return (
              <div
                key={tx.txId}
                className="rounded-2xl neu-card overflow-hidden transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-700 shadow-md"
              >
                {/* Clickable Transaction Summary Header */}
                <button
                  type="button"
                  onClick={() => toggleExpand(tx.txId)}
                  className="w-full p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30">
                        {tx.txId}
                      </span>
                      <span className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border} border font-bold`}>
                        {statusBadge.label}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        • {tx.items.length} apparatus ({totalUnits} units)
                      </span>
                    </div>

                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate uppercase">
                      {tx.borrower.groupLeader}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                      <strong className="text-cyan-700 dark:text-cyan-300">{tx.borrower.program}</strong> • Course:{' '}
                      <strong className="text-slate-900 dark:text-white font-mono">{tx.borrower.courseCode}</strong> • Group{' '}
                      <strong className="text-slate-900 dark:text-white font-mono">{tx.borrower.groupNo}</strong> • Faculty:{' '}
                      <strong className="text-slate-700 dark:text-slate-300">{tx.borrower.instructor}</strong>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end sm:text-right shrink-0 gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-white/10">
                    <div className="font-mono text-xs">
                      <p className="text-slate-700 dark:text-slate-300 font-semibold">{tx.borrowedAt}</p>
                      {tx.returnedAt && (
                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Cleared: {tx.returnedAt}</p>
                      )}
                    </div>
                    <div className="p-2 rounded-xl neu-inset text-slate-600 dark:text-slate-400 shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Item Breakdown Details */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/10 neu-inset-sm space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        <span>Itemized Apparatus Checklist</span>
                      </p>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {tx.items.length} Item types borrowed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {tx.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl neu-card flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex items-center gap-2.5">
                            <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 shrink-0">
                              {item.tagCode}
                            </span>
                            <span className="text-slate-900 dark:text-slate-100 font-semibold truncate">{item.name}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {item.qty} {item.unit || 'pc'}
                            </span>
                            {item.isDamaged ? (
                              <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/40 font-bold uppercase text-[10px]">
                                Damaged
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-bold uppercase text-[10px]">
                                Good
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Schedule & Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      <div className="p-3 rounded-xl neu-card text-xs space-y-1">
                        <span className="text-slate-500 dark:text-slate-400 block font-semibold">Laboratory Time Slot:</span>
                        <p className="text-cyan-700 dark:text-cyan-300 font-mono font-bold">{tx.borrower.labTime || 'Standard Laboratory Period'}</p>
                      </div>

                      {tx.custodianNotes ? (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-500/40 text-xs space-y-1">
                          <span className="text-amber-700 dark:text-amber-400 font-semibold block">Custodian Inspection Remarks:</span>
                          <p className="text-amber-900 dark:text-amber-200">{tx.custodianNotes}</p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl neu-card text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Standard return inspection completed without incidents.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
