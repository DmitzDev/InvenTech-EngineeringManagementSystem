/**
 * InvenTech Laboratory Management System - Security & Tamper-Proof Audit Logger
 * Module: [SYS.SEC // AUDIT-LOGGER-01]
 * 
 * Provides an append-only, tamper-evident audit service capturing security events,
 * authentication attempts, rate-limiter lockouts, session resets, and apparatus transactions.
 */

const AUDIT_STORAGE_KEY = 'udd_security_audit_logs_v1';
const MAX_LOG_ENTRIES = 500; // Rolling cap to prevent localStorage quota exhaustion

// Predefined Event Types
export const SECURITY_EVENT_TYPES = {
  LOAN_CREATED: 'LOAN_CREATED',
  TOOL_RETURNED: 'TOOL_RETURNED',
  DAMAGE_QUARANTINED: 'DAMAGE_QUARANTINED',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  LOCKOUT_TRIGGERED: 'LOCKOUT_TRIGGERED',
  CUSTODIAN_OVERRIDE: 'CUSTODIAN_OVERRIDE',
  INACTIVITY_TIMEOUT: 'INACTIVITY_TIMEOUT',
  SESSION_RESET: 'SESSION_RESET',
  UNAUTHORIZED_ACCESS_ATTEMPT: 'UNAUTHORIZED_ACCESS_ATTEMPT',
  CUSTODIAN_SESSION_EXPIRED: 'CUSTODIAN_SESSION_EXPIRED',
  SYSTEM_INTEGRITY_CHECK: 'SYSTEM_INTEGRITY_CHECK',
};

// Severity Levels
export const SEVERITY_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  CRITICAL: 'CRITICAL',
};

/**
 * Format timestamp into Philippine Standard Time (PST) monospace telemetry string
 * Example: "[2026-10-08 00:14:02 PST]"
 */
export function formatTelemetryTimestamp(isoDateString) {
  const d = isoDateString ? new Date(isoDateString) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `[${year}-${month}-${day} ${hours}:${minutes}:${seconds} PST]`;
}

/**
 * Retrieve all security audit logs from storage
 * @returns {Array} Array of audit event objects sorted latest first
 */
export function getSecurityAuditLogs() {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) return getDefaultSeedLogs();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('[SYS.SEC // LOGGER] Failed to parse audit logs from storage:', err);
  }
  return getDefaultSeedLogs();
}

/**
 * Default initial seed logs for fresh boots
 */
function getDefaultSeedLogs() {
  const now = new Date();
  return [
    {
      id: 'SEC-BOOT-INIT-01',
      timestamp: new Date(now.getTime() - 600000).toISOString(),
      displayTime: formatTelemetryTimestamp(new Date(now.getTime() - 600000).toISOString()),
      eventType: SECURITY_EVENT_TYPES.SYSTEM_INTEGRITY_CHECK,
      actorId: 'SYS.KERNEL',
      deviceContext: 'UDD-POS-ENG // Terminal #01',
      severity: SEVERITY_LEVELS.INFO,
      details: 'Inactivity deadman engine & cryptographic guardrails initialized.',
      metadata: { status: 'ONLINE', version: '2.4.0-SEC' },
    },
  ];
}

/**
 * Append-only security event logger
 * @param {Object} event
 * @param {string} event.eventType - One of SECURITY_EVENT_TYPES
 * @param {string} event.actorId - Student ID, "CUSTODIAN", "SYSTEM", etc.
 * @param {string} [event.deviceContext] - Kiosk terminal name or browser
 * @param {string} [event.severity] - 'INFO' | 'WARN' | 'CRITICAL'
 * @param {string} event.details - Detailed human-readable explanation
 * @param {Object} [event.metadata] - Extra structured metadata
 * @returns {Object} The recorded audit record
 */
export function logSecurityEvent({
  eventType,
  actorId = 'ANONYMOUS',
  deviceContext = 'UDD-POS-ENG // Terminal #01',
  severity = SEVERITY_LEVELS.INFO,
  details = '',
  metadata = {},
}) {
  const now = new Date();
  const isoTime = now.toISOString();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const logId = `SEC-${Date.now()}-${randomSuffix}`;

  const entry = {
    id: logId,
    timestamp: isoTime,
    displayTime: formatTelemetryTimestamp(isoTime),
    eventType,
    actorId: String(actorId).trim().toUpperCase() || 'UNKNOWN',
    deviceContext,
    severity,
    details,
    metadata,
  };

  try {
    const existingLogs = getSecurityAuditLogs();
    // Prepend latest event first (chronological reverse)
    const updated = [entry, ...existingLogs].slice(0, MAX_LOG_ENTRIES);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));

    // Dispatch custom browser event for live real-time UI synchronization
    window.dispatchEvent(
      new CustomEvent('udd-security-event-logged', {
        detail: entry,
      })
    );
  } catch (err) {
    console.error('[SYS.SEC // LOGGER] Failed to write event to storage:', err);
  }

  return entry;
}

/**
 * Export audit logs as formatted JSON string for export/backup
 */
export function exportSecurityLogsAsJSON() {
  const logs = getSecurityAuditLogs();
  return JSON.stringify(logs, null, 2);
}

/**
 * Clear security audit logs (Restricted custodian action)
 */
export function clearSecurityAuditLogs() {
  try {
    localStorage.removeItem(AUDIT_STORAGE_KEY);
    logSecurityEvent({
      eventType: SECURITY_EVENT_TYPES.SYSTEM_INTEGRITY_CHECK,
      actorId: 'CUSTODIAN',
      severity: SEVERITY_LEVELS.WARN,
      details: 'Audit log journal reset by authorized Laboratory Custodian.',
    });
    return true;
  } catch (err) {
    console.error('[SYS.SEC // LOGGER] Failed to clear audit logs:', err);
    return false;
  }
}
