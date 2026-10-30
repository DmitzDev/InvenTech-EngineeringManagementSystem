/**
 * InvenTech Laboratory Management System - Local Demo & Sandbox Testing Utility
 *
 * Provides a pre-configured Demo Student Profile and Sandbox Guard that works
 * strictly in local / development environments (localhost, 127.0.0.1, LAN IPs, or DEV mode)
 * and prevents demo test transactions from polluting the production Supabase cloud database.
 */

export const DEMO_STUDENT_PROFILE = {
  studentId: '00-0000-000',
  studentIdDigits: '000000000',
  groupLeader: 'DEMO TEST STUDENT',
  program: 'BSCPE',
  yearLevel: '3',
  semester: '1',
  section: '01',
  courseCode: '31-BSCPE-01',
  groupNo: '1',
  instructor: 'ENGR. DEMO CUSTODIAN',
  startHour: '08',
  startMinute: '00',
  startPeriod: 'AM',
  endHour: '11',
  endMinute: '00',
  endPeriod: 'AM',
  labTime: '08:00 AM - 11:00 AM',
};

/**
 * Checks whether the current browser session is running in a local/testing environment
 * (e.g., localhost, 127.0.0.1, private LAN IP 192.168.x.x / 10.x.x.x, or Vite DEV mode).
 */
export function isLocalTestingEnvironment() {
  if (import.meta.env.DEV) return true;
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname || '';
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    host.endsWith('.local')
  );
}

/**
 * Checks whether a Student ID, Borrower Name, or Transaction object belongs to the Demo Test Account.
 * When true, cloud database writes (Supabase) are bypassed so production records stay 100% clean.
 */
export function isDemoTransaction(recordOrId) {
  if (!recordOrId) return false;

  if (typeof recordOrId === 'string') {
    const cleanDigits = recordOrId.replace(/\D/g, '');
    return (
      cleanDigits === DEMO_STUDENT_PROFILE.studentIdDigits ||
      recordOrId.toUpperCase().includes('DEMO-TEST')
    );
  }

  const studentId =
    recordOrId.studentId ||
    recordOrId.student_id ||
    recordOrId.borrower?.studentId ||
    '';
  const studentName =
    recordOrId.studentName ||
    recordOrId.student_name ||
    recordOrId.borrower?.groupLeader ||
    '';
  const txId =
    recordOrId.txId ||
    recordOrId.transactionId ||
    recordOrId.id ||
    '';

  const cleanDigits = String(studentId).replace(/\D/g, '');
  if (cleanDigits === DEMO_STUDENT_PROFILE.studentIdDigits) return true;
  if (String(studentName).toUpperCase() === DEMO_STUDENT_PROFILE.groupLeader) return true;
  if (String(txId).toUpperCase().includes('DEMO')) return true;

  return false;
}
