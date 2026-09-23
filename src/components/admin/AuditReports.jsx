import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  TrendingUp,
  AlertTriangle,
  Users,
  Calendar,
  ShieldCheck,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  FileText,
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import { getInventory, getIncidentLogs, getStudentClearanceHolds } from '../../data/equipmentData';

export default function AuditReports() {
  const { activeTransactions, studentClearanceHolds } = useTransaction();
  const [activeReportTab, setActiveReportTab] = useState('MOST_BORROWED'); // 'MOST_BORROWED' | 'INCIDENTS' | 'STUDENT_FREQUENCY'
  const [selectedLabFilter, setSelectedLabFilter] = useState('ALL');

  const inventory = useMemo(() => getInventory(), []);
  const incidents = useMemo(() => getIncidentLogs(), []);

  // 1. Compute Most Borrowed Equipment Stats
  const mostBorrowedStats = useMemo(() => {
    const countsMap = {};
    (activeTransactions || []).forEach((tx) => {
      (tx.items || []).forEach((item) => {
        const key = item.tagCode || item.name;
        if (!countsMap[key]) {
          countsMap[key] = {
            id: item.id,
            tagCode: item.tagCode || 'N/A',
            name: item.name,
            lab: item.lab || 'GENERAL',
            category: item.category || 'Apparatus',
            isConsumable: item.isConsumable || false,
            borrowCount: 0,
            totalUnits: 0,
          };
        }
        countsMap[key].borrowCount += 1;
        countsMap[key].totalUnits += item.qty || 1;
      });
    });

    let list = Object.values(countsMap);
    if (selectedLabFilter !== 'ALL') {
      list = list.filter((i) => i.lab === selectedLabFilter);
    }
    return list.sort((a, b) => b.totalUnits - a.totalUnits);
  }, [activeTransactions, selectedLabFilter]);

  // 2. Compute Incident and Damage Logs
  const incidentLogsList = useMemo(() => {
    let list = [...(incidents || [])];
    if (selectedLabFilter !== 'ALL') {
      list = list.filter((inc) => inc.lab === selectedLabFilter || inc.room?.includes(selectedLabFilter));
    }
    return list;
  }, [incidents, selectedLabFilter]);

  // 3. Compute Student Borrowing Frequency & Clearance Record
  const studentFrequencyRecords = useMemo(() => {
    const studentMap = {};

    (activeTransactions || []).forEach((tx) => {
      const sName = (tx.borrower?.groupLeader || 'UNKNOWN').trim().toUpperCase();
      const sId = (tx.borrower?.studentId || 'N/A').trim().toUpperCase();
      const key = `${sName}__${sId}`;

      if (!studentMap[key]) {
        studentMap[key] = {
          studentName: sName,
          studentId: sId,
          program: tx.borrower?.program || 'ENGINEERING',
          courseCode: tx.borrower?.courseCode || 'N/A',
          totalTransactions: 0,
          totalItemsBorrowed: 0,
          lastBorrowedDate: tx.borrower?.date || tx.borrowedAt || 'N/A',
          hasUnreturnedItems: tx.status === 'BORROWED',
          unreturnedCount: tx.status === 'BORROWED' ? (tx.items || []).length : 0,
          isClearanceLocked: false,
        };
      }

      studentMap[key].totalTransactions += 1;
      studentMap[key].totalItemsBorrowed += (tx.items || []).reduce((s, i) => s + (i.qty || 1), 0);
      if (tx.status === 'BORROWED') {
        studentMap[key].hasUnreturnedItems = true;
        studentMap[key].unreturnedCount += (tx.items || []).length;
      }
    });

    // Cross reference with studentClearanceHolds
    (studentClearanceHolds || []).forEach((hold) => {
      const sName = (hold.studentName || '').trim().toUpperCase();
      const sId = (hold.studentId || '').trim().toUpperCase();
      const key = `${sName}__${sId}`;

      if (studentMap[key]) {
        studentMap[key].isClearanceLocked = true;
      } else {
        studentMap[key] = {
          studentName: sName,
          studentId: sId,
          program: 'ENGINEERING',
          courseCode: 'CLEARANCE-HOLD',
          totalTransactions: 1,
          totalItemsBorrowed: (hold.items || []).length || 1,
          lastBorrowedDate: hold.date || 'Active Term',
          hasUnreturnedItems: true,
          unreturnedCount: (hold.items || []).length || 1,
          isClearanceLocked: true,
        };
      }
    });

    return Object.values(studentMap).sort((a, b) => b.totalTransactions - a.totalTransactions);
  }, [activeTransactions, studentClearanceHolds]);

  // CSV Export Utility
  const handleExportCSV = () => {
    let csvContent = '';
    const now = new Date().toLocaleDateString('en-US');

    if (activeReportTab === 'MOST_BORROWED') {
      csvContent = 'Rank,Tag Code,Apparatus Name,Laboratory,Category,Type,Borrow Sessions,Total Units Issued\n';
      mostBorrowedStats.forEach((item, idx) => {
        csvContent += `"${idx + 1}","${item.tagCode}","${item.name}","${item.lab}","${item.category}","${item.isConsumable ? 'Consumable' : 'Returnable'}","${item.borrowCount}","${item.totalUnits}"\n`;
      });
    } else if (activeReportTab === 'INCIDENTS') {
      csvContent = 'Incident ID,Timestamp,Apparatus,Tag Code,Severity,Status,Custodian Findings,Resolution Notes\n';
      incidentLogsList.forEach((inc) => {
        csvContent += `"${inc.id}","${inc.timestamp}","${inc.itemName || inc.name || 'N/A'}","${inc.tagCode || 'N/A'}","${inc.severity || 'Medium'}","${inc.status}","${inc.description || ''}","${inc.resolutionNotes || 'Pending repair'}"\n`;
      });
    } else {
      csvContent = 'Student ID,Student Name,Program,Course Code,Total Borrow Sessions,Total Units Borrowed,Clearance Status,Unreturned Count,Last Transaction Date\n';
      studentFrequencyRecords.forEach((rec) => {
        const status = rec.isClearanceLocked || rec.hasUnreturnedItems ? 'CLEARANCE_HOLD' : 'CLEARED';
        csvContent += `"${rec.studentId}","${rec.studentName}","${rec.program}","${rec.courseCode}","${rec.totalTransactions}","${rec.totalItemsBorrowed}","${status}","${rec.unreturnedCount}","${rec.lastBorrowedDate}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `UdD_Engineering_${activeReportTab}_Report_${now.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 select-none">
      {/* 1. Header with Export & Print Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-extrabold text-cyan-400 uppercase tracking-wider bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-500/30">
              PACUCOA / PTC / CHED Accreditation Ready
            </span>
            <span className="text-xs text-slate-400">• Institutional Audit Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-100 mt-1">
            Exportable Audit Logs & Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time equipment utilization analytics, breakage/incident records, and student clearance logs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl neu-btn-raised text-cyan-300 hover:text-white font-bold text-xs sm:text-sm flex items-center gap-2 active:scale-95 cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export CSV (Excel)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintReport}
            className="px-4 py-2.5 rounded-xl neu-btn-primary text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 active:scale-95 cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Report</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Most Borrowed Metric */}
        <div
          onClick={() => setActiveReportTab('MOST_BORROWED')}
          className={`p-4 rounded-2xl cursor-pointer transition-all border ${
            activeReportTab === 'MOST_BORROWED'
              ? 'neu-inset border-cyan-500/80 bg-cyan-950/20 shadow-[0_0_16px_rgba(6,182,212,0.25)]'
              : 'neu-card border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Equipment Utilization
            </span>
            <div className="w-8 h-8 rounded-xl neu-inset flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2 font-mono">
            {mostBorrowedStats.length} Unique Items
          </div>
          <p className="text-[11px] text-cyan-300 font-bold mt-1">
            Top: {mostBorrowedStats[0]?.name || 'N/A'}
          </p>
        </div>

        {/* Damage & Incidents Metric */}
        <div
          onClick={() => setActiveReportTab('INCIDENTS')}
          className={`p-4 rounded-2xl cursor-pointer transition-all border ${
            activeReportTab === 'INCIDENTS'
              ? 'neu-inset border-amber-500/80 bg-amber-950/20 shadow-[0_0_16px_rgba(245,158,11,0.25)]'
              : 'neu-card border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Damage & Incident Logs
            </span>
            <div className="w-8 h-8 rounded-xl neu-inset flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300 mt-2 font-mono">
            {incidentLogsList.length} Recorded
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {incidentLogsList.filter((i) => i.status === 'RESOLVED_REPAIRED').length} Repaired & Restored
          </p>
        </div>

        {/* Student Records Metric */}
        <div
          onClick={() => setActiveReportTab('STUDENT_FREQUENCY')}
          className={`p-4 rounded-2xl cursor-pointer transition-all border ${
            activeReportTab === 'STUDENT_FREQUENCY'
              ? 'neu-inset border-emerald-500/80 bg-emerald-950/20 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
              : 'neu-card border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Student Clearance Records
            </span>
            <div className="w-8 h-8 rounded-xl neu-inset flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2 font-mono">
            {studentFrequencyRecords.length} Students
          </div>
          <p className="text-[11px] text-rose-400 font-bold mt-1">
            {studentFrequencyRecords.filter((s) => s.isClearanceLocked || s.hasUnreturnedItems).length} On Clearance Hold
          </p>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-[#111a2c] p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-bold text-slate-300">Filter by Laboratory:</span>
          <select
            value={selectedLabFilter}
            onChange={(e) => setSelectedLabFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg neu-inset text-xs font-bold text-slate-100 bg-[#0e1422] border border-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Engineering Labs</option>
            <option value="DIGITAL">Digital & Microcontroller Lab</option>
            <option value="ECE">ECE & Communications Lab</option>
            <option value="CE">Civil Engineering Lab</option>
            <option value="CHEM">Chemistry Lab</option>
            <option value="PHYSICS">Physics & Mechanics Lab</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          <span>Active Report:</span>
          <strong className="text-cyan-300">
            {activeReportTab === 'MOST_BORROWED'
              ? 'Ranked Apparatus Utilization'
              : activeReportTab === 'INCIDENTS'
              ? 'Breakage & Repair Audit'
              : 'Student Frequency & Clearance'}
          </strong>
        </div>
      </div>

      {/* 4. Report Table Views */}
      <div className="neu-card rounded-2xl overflow-hidden shadow-xl">
        {/* Table 1: Most Borrowed */}
        {activeReportTab === 'MOST_BORROWED' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111a2c] text-slate-400 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3.5 w-14 text-center">Rank</th>
                  <th className="p-3.5 w-32">Tag Code</th>
                  <th className="p-3.5">Apparatus Description</th>
                  <th className="p-3.5 w-24">Laboratory</th>
                  <th className="p-3.5 w-28">Classification</th>
                  <th className="p-3.5 w-28 text-center">Borrow Sessions</th>
                  <th className="p-3.5 w-28 text-center">Total Units Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {mostBorrowedStats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                      No borrowing sessions recorded yet. Completed transactions will appear ranked here.
                    </td>
                  </tr>
                ) : (
                  mostBorrowedStats.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 text-center font-mono font-extrabold text-cyan-400">
                        #{idx + 1}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-300">
                        {item.tagCode}
                      </td>
                      <td className="p-3.5 font-bold text-slate-100">
                        <div>{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{item.category}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                          {item.lab}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                            item.isConsumable
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {item.isConsumable ? 'Consumable' : 'Returnable'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-300">
                        {item.borrowCount}
                      </td>
                      <td className="p-3.5 text-center font-mono font-extrabold text-cyan-300 text-sm">
                        {item.totalUnits}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table 2: Damage & Incidents */}
        {activeReportTab === 'INCIDENTS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111a2c] text-slate-400 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3.5 w-28">Incident ID</th>
                  <th className="p-3.5 w-32">Timestamp</th>
                  <th className="p-3.5">Apparatus & Tag</th>
                  <th className="p-3.5 w-24">Severity</th>
                  <th className="p-3.5 w-32">Status</th>
                  <th className="p-3.5">Custodian Description & Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {incidentLogsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                      No damaged or incident equipment reports currently on record.
                    </td>
                  </tr>
                ) : (
                  incidentLogsList.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-300">
                        {inc.id}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        {inc.timestamp}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-100">{inc.itemName || inc.name}</div>
                        <div className="text-[10px] font-mono text-cyan-400">{inc.tagCode || 'N/A'}</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded uppercase ${
                            inc.severity === 'High'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {inc.severity || 'Medium'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            inc.status === 'RESOLVED_REPAIRED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-950 text-rose-300 border border-rose-500/40 animate-pulse'
                          }`}
                        >
                          {inc.status === 'RESOLVED_REPAIRED' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Repaired</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              <span>Open Issue</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">
                        <div>{inc.description || 'Apparatus flagged for custodian inspection'}</div>
                        {inc.resolutionNotes && (
                          <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                            Note: {inc.resolutionNotes}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table 3: Student Frequency & Clearance Records */}
        {activeReportTab === 'STUDENT_FREQUENCY' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111a2c] text-slate-400 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3.5 w-32">Student ID</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5 w-24">Program</th>
                  <th className="p-3.5 w-28">Course Code</th>
                  <th className="p-3.5 w-24 text-center">Sessions</th>
                  <th className="p-3.5 w-24 text-center">Total Units</th>
                  <th className="p-3.5 w-36">Clearance Status</th>
                  <th className="p-3.5 w-32">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {studentFrequencyRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                      No student borrowing profiles on record yet.
                    </td>
                  </tr>
                ) : (
                  studentFrequencyRecords.map((rec, idx) => {
                    const isLocked = rec.isClearanceLocked || rec.hasUnreturnedItems;
                    return (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-cyan-300">
                          {rec.studentId}
                        </td>
                        <td className="p-3.5 font-bold text-slate-100 uppercase">
                          {rec.studentName}
                        </td>
                        <td className="p-3.5 font-mono text-slate-300 font-bold">
                          {rec.program}
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">
                          {rec.courseCode}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-200">
                          {rec.totalTransactions}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-cyan-400">
                          {rec.totalItemsBorrowed}
                        </td>
                        <td className="p-3.5">
                          {isLocked ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/50 inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>Clearance Hold ({rec.unreturnedCount} unreturned)</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Cleared & Eligible</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-400">
                          {rec.lastBorrowedDate}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
