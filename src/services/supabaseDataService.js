import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * =============================================================================
 * INVENTECH KIOSK • SUPABASE CLOUD DATA & SYNC SERVICE
 * Provides hybrid cloud persistence with seamless offline fallback.
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// 1. EQUIPMENT INVENTORY
// -----------------------------------------------------------------------------

export async function fetchEquipmentFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('[SUPABASE] Failed to fetch equipment:', error.message);
      return null;
    }

    if (!Array.isArray(data) || data.length === 0) return null;

    // Map database snake_case to frontend camelCase
    return data.map((row) => ({
      id: row.id,
      tagCode: row.tag_code,
      name: row.name,
      category: row.category,
      lab: row.lab,
      stock: Number(row.stock),
      status: row.status,
      condition: row.condition,
      unit: row.unit,
      description: row.description,
      chedReq: row.ched_req,
      room: row.room,
      safetyClearance: row.safety_clearance,
      image: row.image,
      isDamaged: Boolean(row.is_damaged),
    }));
  } catch (err) {
    console.warn('[SUPABASE] Network/fetch error on equipment:', err);
    return null;
  }
}

export async function updateEquipmentStockInSupabase(itemId, newStock) {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase
      .from('equipment')
      .update({ stock: Math.max(0, Number(newStock)), updated_at: new Date().toISOString() })
      .eq('id', itemId);

    if (error) {
      console.warn('[SUPABASE] Stock update failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[SUPABASE] Stock update exception:', err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// 2. BORROW TRANSACTIONS
// -----------------------------------------------------------------------------

export async function saveTransactionToSupabase(tx) {
  if (!isSupabaseConfigured || !supabase || !tx) return null;
  try {
    const payload = {
      transaction_id: tx.id || tx.transactionId,
      student_id: tx.studentId || tx.borrower?.studentId || 'N/A',
      student_name: tx.studentName || tx.borrower?.groupLeader || 'N/A',
      program: tx.program || tx.borrower?.program || 'N/A',
      year_level: String(tx.yearLevel || tx.borrower?.yearLevel || '1'),
      semester: String(tx.semester || tx.borrower?.semester || '1'),
      section: tx.section || tx.borrower?.section || '01',
      course_code: tx.courseCode || tx.borrower?.courseCode || 'N/A',
      group_no: String(tx.groupNo || tx.borrower?.groupNo || '1'),
      instructor: tx.instructor || tx.borrower?.instructor || 'N/A',
      purpose: tx.purpose || tx.borrower?.purpose || 'Laboratory Experiment',
      lab: tx.lab || tx.selectedLab || 'GENERAL',
      items: tx.items || tx.cart || [],
      total_units: Number(tx.totalUnits || tx.totalQty || 1),
      status: tx.status || 'BORROWED',
      signature: tx.signature || tx.borrower?.signature || null,
      timestamp: tx.timestamp || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('transactions')
      .upsert(payload, { onConflict: 'transaction_id' })
      .select();

    if (error) {
      console.warn('[SUPABASE] Failed to save transaction:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[SUPABASE] Exception saving transaction:', err);
    return null;
  }
}

export async function fetchTransactionsFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.warn('[SUPABASE] Failed to fetch transactions:', error.message);
      return null;
    }

    if (!Array.isArray(data)) return null;

    return data.map((row) => ({
      id: row.transaction_id,
      transactionId: row.transaction_id,
      studentId: row.student_id,
      studentName: row.student_name,
      program: row.program,
      yearLevel: row.year_level,
      semester: row.semester,
      section: row.section,
      courseCode: row.course_code,
      groupNo: row.group_no,
      instructor: row.instructor,
      purpose: row.purpose,
      lab: row.lab,
      items: row.items,
      totalUnits: row.total_units,
      status: row.status,
      signature: row.signature,
      timestamp: row.timestamp,
      returnedAt: row.returned_at,
    }));
  } catch (err) {
    console.warn('[SUPABASE] Fetch transactions error:', err);
    return null;
  }
}

export async function markTransactionReturnedInSupabase(txId, returnNotes) {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase
      .from('transactions')
      .update({
        status: 'RETURNED',
        returned_at: new Date().toISOString(),
      })
      .eq('transaction_id', txId);

    if (error) {
      console.warn('[SUPABASE] Return update failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[SUPABASE] Return exception:', err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// 3. ADVANCE RESERVATIONS
// -----------------------------------------------------------------------------

export async function saveReservationToSupabase(reservation) {
  if (!isSupabaseConfigured || !supabase || !reservation) return null;
  try {
    const payload = {
      id: reservation.id || `RES-${Date.now()}`,
      item_id: reservation.itemId || reservation.item_id || 'N/A',
      item_name: reservation.name || reservation.itemName || reservation.item_name || 'Apparatus',
      tag_code: reservation.tagCode || reservation.tag_code || '',
      category: reservation.category || 'Equipment & Apparatus',
      lab: reservation.lab || 'GENERAL',
      qty: Number(reservation.qty) || 1,
      student_id: reservation.studentId || reservation.student_id || 'N/A',
      student_name: reservation.studentName || reservation.student_name || 'N/A',
      program: reservation.program || 'N/A',
      year_level: String(reservation.yearLevel || reservation.year_level || '1'),
      semester: String(reservation.semester || '1'),
      section: reservation.section || '01',
      course_code: reservation.courseCode || reservation.course_code || '',
      group_no: String(reservation.groupNo || reservation.group_no || '1'),
      instructor: reservation.instructor || '',
      purpose: reservation.purpose || 'Laboratory Class Activity',
      reserve_date: reservation.reserveDate || reservation.reserve_date || new Date().toISOString().split('T')[0],
      time_slot: reservation.timeSlot || reservation.time_slot || '08:00 AM - 10:00 AM',
      status: reservation.status || 'PENDING',
    };

    const { data, error } = await supabase
      .from('reservations')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('[SUPABASE] Failed to save reservation:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[SUPABASE] Save reservation exception:', err);
    return null;
  }
}

export async function fetchReservationsFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[SUPABASE] Fetch reservations failed:', error.message);
      return null;
    }

    if (!Array.isArray(data)) return null;

    return data.map((row) => ({
      id: row.id,
      itemId: row.item_id,
      name: row.item_name,
      itemName: row.item_name,
      tagCode: row.tag_code,
      category: row.category,
      lab: row.lab,
      qty: row.qty,
      studentId: row.student_id,
      studentName: row.student_name,
      program: row.program,
      yearLevel: row.year_level,
      semester: row.semester,
      section: row.section,
      courseCode: row.course_code,
      groupNo: row.group_no,
      instructor: row.instructor,
      purpose: row.purpose,
      reserveDate: row.reserve_date,
      timeSlot: row.time_slot,
      status: row.status,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('[SUPABASE] Fetch reservations exception:', err);
    return null;
  }
}

export async function updateReservationStatusInSupabase(resId, nextStatus) {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase
      .from('reservations')
      .update({ status: nextStatus })
      .eq('id', resId);

    if (error) {
      console.warn('[SUPABASE] Update reservation status failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[SUPABASE] Exception updating reservation:', err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// 4. INCIDENT & DAMAGE LOGS
// -----------------------------------------------------------------------------

export async function saveIncidentLogToSupabase(log) {
  if (!isSupabaseConfigured || !supabase || !log) return null;
  try {
    const payload = {
      item_id: log.itemId || log.id || null,
      item_name: log.itemName || log.name || 'Equipment',
      tag_code: log.tagCode || '',
      lab: log.lab || 'GENERAL',
      student_id: log.studentId || 'N/A',
      student_name: log.studentName || 'N/A',
      type: log.type || 'DAMAGED',
      details: log.details || log.notes || '',
      status: log.status || 'UNDER_INVESTIGATION',
    };

    const { data, error } = await supabase.from('incident_logs').insert(payload).select();
    if (error) {
      console.warn('[SUPABASE] Failed to save incident log:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[SUPABASE] Exception saving incident:', err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// 5. REALTIME SUBSCRIPTION HELPER
// -----------------------------------------------------------------------------

export function subscribeToTable(table, onPayload) {
  if (!isSupabaseConfigured || !supabase) return () => {};
  try {
    const channel = supabase
      .channel(`realtime_${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          if (typeof onPayload === 'function') {
            onPayload(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn(`[SUPABASE] Subscription to ${table} failed:`, err);
    return () => {};
  }
}
