import React, { useState } from 'react';
import { Calendar, Clock, X, Search, User, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';

export default function ActiveReservationsModal({ isOpen, onClose }) {
  const { reservations, cancelReservation, showToast } = useTransaction();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredReservations = reservations.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.studentName.toLowerCase().includes(q) ||
      r.tagCode.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });

  const handleCancel = (id, name) => {
    cancelReservation(id);
    showToast(`Cancelled reservation ${id} for ${name}`, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in select-none">
      <div className="neu-card rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#111a2c] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-inset flex items-center justify-center text-cyan-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Active Equipment Reservations</span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full neu-inset-sm text-cyan-400 font-bold">
                  {reservations.length} BOOKED
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Log of all upcoming equipment bookings for University Engineering Laboratories.
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

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800/80 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reservations by student name, apparatus, ref ID..."
              className="w-full min-h-[44px] pl-10 pr-4 rounded-xl neu-inset text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Reservation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredReservations.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-600 mb-1" />
              <p className="text-sm font-bold text-slate-300">No matching reservations</p>
              <p className="text-xs text-slate-500">
                Tap "Reserve" on any equipment in the catalog to schedule an advance booking.
              </p>
            </div>
          ) : (
            filteredReservations.map((res) => (
              <div
                key={res.id}
                className="neu-card-sm rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded neu-inset-sm text-cyan-400 font-bold">
                      {res.id}
                    </span>
                    <span className="text-xs font-bold text-slate-100">{res.name}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <strong className="text-slate-200">{res.studentName}</strong> ({res.program})
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-cyan-400 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {res.reserveDate} ({res.timeSlot})
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Reserved: <span className="font-bold text-slate-300 font-mono">{res.qty} {res.unit || 'units'}</span> • Instructor: {res.instructor}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleCancel(res.id, res.name)}
                    className="p-2 rounded-xl neu-btn-raised text-slate-400 hover:text-rose-400 transition-colors"
                    title="Cancel Reservation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#111a2c] flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Total active bookings: <strong className="text-cyan-400 font-mono">{reservations.length}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-6 py-2.5 rounded-xl neu-btn-raised text-slate-200 font-bold text-xs active:scale-95 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
