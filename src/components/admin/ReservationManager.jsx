import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Printer,
  User,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Cpu,
  Radio,
  FlaskConical,
  Atom,
  GraduationCap,
  XCircle,
  FileText,
  Filter,
} from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import { LAB_OPTIONS } from '../../data/equipmentData';
import BorrowerSheet from '../print/BorrowerSheet';

const STATUS_BADGES = {
  PENDING: { label: 'Pending Review', color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/40' },
  PREPARED: { label: 'Prepared in Lab', color: 'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/40' },
  COMPLETED: { label: 'Completed / Claimed', color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40' },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-300', bg: 'bg-rose-500/15', border: 'border-rose-500/40' },
};

const LAB_BADGES = {
  CE: { label: 'Civil', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  DIGITAL: { label: 'Digital', bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' },
  ECE: { label: 'ECE', bg: 'bg-violet-500/10 text-violet-300 border-violet-500/30' },
  CHEM: { label: 'Chem', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  PHYSICS: { label: 'Physics', bg: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
};

export default function ReservationManager() {
  const {
    reservations,
    updateReservationStatus,
    prepareReservationToSlip,
    cancelReservation,
    showToast,
  } = useTransaction();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [labFilter, setLabFilter] = useState('ALL');

  const filteredReservations = reservations.filter((r) => {
    const matchesSearch =
      (r.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.tagCode || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.program || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.courseCode || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.instructor || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || (r.status || 'PENDING') === statusFilter;
    
    // Check lab department if present in tagCode or item
    const itemLab = (r.tagCode || '').startsWith('CE-')
      ? 'CE'
      : (r.tagCode || '').startsWith('DIG-')
      ? 'DIGITAL'
      : (r.tagCode || '').startsWith('ECE-')
      ? 'ECE'
      : (r.tagCode || '').startsWith('CHEM-')
      ? 'CHEM'
      : (r.tagCode || '').startsWith('PHY-')
      ? 'PHYSICS'
      : '';

    const matchesLab = labFilter === 'ALL' || itemLab === labFilter || r.lab === labFilter;

    return matchesSearch && matchesStatus && matchesLab;
  });

  const totalCount = reservations.length;
  const pendingCount = reservations.filter((r) => (r.status || 'PENDING') === 'PENDING').length;
  const preparedCount = reservations.filter((r) => r.status === 'PREPARED').length;
  const completedCount = reservations.filter((r) => r.status === 'COMPLETED').length;

  // Direct A4 print — prepares state and opens native browser print dialog
  const handlePrepareAndPrint = (res) => {
    prepareReservationToSlip(res);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 overflow-y-auto h-full max-w-[1600px] mx-auto select-none">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
              Advance Bookings Dispatch
            </span>
            {pendingCount > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-pulse">
                {pendingCount} Pending Action
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">Equipment Advance Bookings</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage advance student bookings, check conflict schedules, and generate official borrowing slips
          </p>
        </div>

        {/* Print Summary Info */}
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#091120] border border-slate-800 px-3.5 py-2 rounded-xl shrink-0">
          <Printer className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Slips format: Official A4 Template</span>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#091120] border border-slate-800 space-y-0.5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bookings</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100">{totalCount}</p>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#091120] border border-amber-500/30 space-y-0.5 shadow-sm">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Pending Review</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-300">{pendingCount}</p>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#091120] border border-cyan-500/30 space-y-0.5 shadow-sm">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Prepared</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-300">{preparedCount}</p>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#091120] border border-emerald-500/30 space-y-0.5 shadow-sm">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Completed</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-300">{completedCount}</p>
        </div>
      </div>

      {/* Search & Multi-Filter Controls */}
      <div className="space-y-2.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, reference ID, apparatus, course code, instructor..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#091120] border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-inner"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
            {['ALL', 'PENDING', 'PREPARED', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  statusFilter === st
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'bg-[#091120] text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Lab Department Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 pr-1 shrink-0">
            <Filter className="w-3 h-3 text-cyan-400" />
            Lab:
          </span>
          <button
            type="button"
            onClick={() => setLabFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
              labFilter === 'ALL'
                ? 'bg-slate-700 text-white border border-slate-600'
                : 'bg-[#091120] text-slate-400 border border-slate-800 hover:text-slate-300'
            }`}
          >
            All Departments
          </button>
          {[
            { id: 'CE', label: 'Civil Engr' },
            { id: 'DIGITAL', label: 'Digital Logic' },
            { id: 'ECE', label: 'ECE Circuits' },
            { id: 'CHEM', label: 'Chemistry' },
            { id: 'PHYSICS', label: 'Physics' },
          ].map((lab) => (
            <button
              key={lab.id}
              type="button"
              onClick={() => setLabFilter(lab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                labFilter === lab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-[#091120] text-slate-400 border border-slate-800 hover:text-slate-300'
              }`}
            >
              {lab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reservations Card List */}
      <div className="space-y-3.5">
        {filteredReservations.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#091120] border border-slate-800 text-center space-y-3">
            <Calendar className="w-10 h-10 mx-auto text-slate-600" />
            <div>
              <p className="text-base font-bold text-slate-200">No Reservations Matching Filters</p>
              <p className="text-xs text-slate-500 mt-1">
                {search || statusFilter !== 'ALL' || labFilter !== 'ALL'
                  ? 'Try clearing your search query or selecting "All Status".'
                  : 'Student advance bookings submitted from the Kiosk or Kairo AI will appear here.'}
              </p>
            </div>
          </div>
        ) : (
          filteredReservations.map((res) => {
            const statusKey = res.status || 'PENDING';
            const statusInfo = STATUS_BADGES[statusKey] || STATUS_BADGES.PENDING;

            return (
              <div
                key={res.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#091120] border border-slate-800 space-y-4 hover:border-slate-700 transition-all duration-200 shadow-md"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/30">
                      {res.id}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Submitted: {res.createdAt || 'Recent'}
                  </span>
                </div>

                {/* 3-Column Info Cards (Responsive for Touch and Mobile) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Reserving Student & Group */}
                  <div className="p-3.5 rounded-xl bg-[#060b14] border border-slate-800/80 space-y-1.5">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      Student Details
                    </span>
                    <p className="text-sm sm:text-base font-bold text-slate-100 uppercase truncate">
                      {res.studentName}
                    </p>
                    <p className="text-xs text-slate-300">
                      <strong className="text-cyan-300">{res.program}</strong> • Course:{' '}
                      <strong className="text-white font-mono">{res.courseCode || 'N/A'}</strong> • Group{' '}
                      <strong className="text-white font-mono">{res.groupNo || '1'}</strong>
                    </p>
                    <p className="text-xs text-slate-400">
                      Faculty: <strong className="text-slate-300">{res.instructor || 'Engr. Jin Benir Macaranas'}</strong>
                    </p>
                  </div>

                  {/* Reserved Apparatus */}
                  <div className="p-3.5 rounded-xl bg-[#060b14] border border-slate-800/80 space-y-1.5">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      Requested Apparatus
                    </span>
                    <p className="text-sm sm:text-base font-bold text-cyan-300 line-clamp-1">{res.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
                      <span className="bg-cyan-500/15 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 font-mono font-bold">
                        {res.tagCode}
                      </span>
                      <span>
                        Qty: <strong className="text-white font-mono">{res.qty}</strong> {res.unit || 'unit'}s
                      </span>
                    </div>
                  </div>

                  {/* Schedule Details */}
                  <div className="p-3.5 rounded-xl bg-[#060b14] border border-slate-800/80 space-y-1.5">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Scheduled Time
                    </span>
                    <div className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-slate-100">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span className="font-mono">{res.reserveDate}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-cyan-300 font-mono bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-500/20 inline-block">
                      {res.timeSlot}
                    </p>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    {statusKey === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => updateReservationStatus(res.id, 'PREPARED')}
                        className="px-4 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Prepared</span>
                      </button>
                    )}
                    {statusKey === 'PREPARED' && (
                      <button
                        type="button"
                        onClick={() => updateReservationStatus(res.id, 'COMPLETED')}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Completed</span>
                      </button>
                    )}
                    {statusKey !== 'CANCELLED' && statusKey !== 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() => cancelReservation(res.id)}
                        className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel Booking</span>
                      </button>
                    )}
                  </div>

                  {/* Direct A4 Print Slip Trigger */}
                  <button
                    type="button"
                    onClick={() => handlePrepareAndPrint(res)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Official Slip (A4)</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Hidden Print Slip Template (BorrowerSheet remains untouched) */}
      <BorrowerSheet isScreenPreview={false} />
    </div>
  );
}
