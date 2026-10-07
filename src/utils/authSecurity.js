/**
 * InvenTech Laboratory Management System - Cryptographic Auth & RBAC Guard
 * Module: [SYS.SEC // RBAC-GUARD-01]
 * 
 * Provides SHA-256 PIN digest verification, custodian session state management,
 * and 30-minute inactivity auto-logout protection.
 */

import { logSecurityEvent, SECURITY_EVENT_TYPES, SEVERITY_LEVELS } from '../services/securityAuditService';

const SALT = '_UDD_ENG_LAB_SECURE_SALT_v1_';
const AUTHORIZED_DIGESTS = [
  '4441213ae93407ef95b09c9f6d50c5b4faf2d8283955f908cf5850b6b63deed1', // '2026'
  '1d2b4d0d58bf5ff8764047cecbe16b66cf41c1b95529004504372cdcbcf548a8', // 'UDD2026'
];

const CUSTOM_HASH_STORAGE_KEY = 'udd_custodian_pin_digest';
const CUSTODIAN_SESSION_KEY = 'udd_custodian_session_v1';
export const CUSTODIAN_SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Compute SHA-256 digest of salted passcode
 */
export async function computePasscodeDigest(pin) {
  if (!pin || typeof pin !== 'string') return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(pin.trim() + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify custodian PIN against authorized cryptographic hashes
 */
export async function verifyCustodianPin(inputPin) {
  if (!inputPin || typeof inputPin !== 'string') return false;
  try {
    const inputDigest = await computePasscodeDigest(inputPin);
    const customDigest = localStorage.getItem(CUSTOM_HASH_STORAGE_KEY);
    if (customDigest && inputDigest === customDigest) {
      return true;
    }
    return AUTHORIZED_DIGESTS.includes(inputDigest);
  } catch (err) {
    console.error('[SYS.SEC // AUTH] Cryptographic evaluation error:', err);
    return false;
  }
}

/**
 * Issue new authenticated custodian session (stored in sessionStorage)
 */
export function setCustodianSession(actorId = 'CUSTODIAN') {
  const now = Date.now();
  const sessionData = {
    authenticated: true,
    actorId,
    loginAt: now,
    lastActivityAt: now,
    token: `UDD-CUST-${now}-${Math.floor(1000 + Math.random() * 9000)}`,
  };

  try {
    sessionStorage.setItem(CUSTODIAN_SESSION_KEY, JSON.stringify(sessionData));
    logSecurityEvent({
      eventType: SECURITY_EVENT_TYPES.AUTH_SUCCESS,
      actorId,
      severity: SEVERITY_LEVELS.INFO,
      details: 'Custodian administrative session granted.',
      metadata: { token: sessionData.token },
    });
  } catch (err) {
    console.error('[SYS.SEC // AUTH] Failed writing session:', err);
  }

  return sessionData;
}

/**
 * Refresh custodian session activity timestamp
 */
export function touchCustodianSession() {
  try {
    const raw = sessionStorage.getItem(CUSTODIAN_SESSION_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw);
    session.lastActivityAt = Date.now();
    sessionStorage.setItem(CUSTODIAN_SESSION_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get active custodian session with 30-minute expiration check
 */
export function getCustodianSession() {
  try {
    const raw = sessionStorage.getItem(CUSTODIAN_SESSION_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);
    const now = Date.now();
    const elapsed = now - (session.lastActivityAt || session.loginAt || 0);

    // Expired after 30 minutes of administrative inactivity
    if (elapsed > CUSTODIAN_SESSION_TIMEOUT_MS) {
      clearCustodianSession();
      logSecurityEvent({
        eventType: SECURITY_EVENT_TYPES.CUSTODIAN_SESSION_EXPIRED,
        actorId: session.actorId || 'CUSTODIAN',
        severity: SEVERITY_LEVELS.WARN,
        details: 'Custodian administrative session expired after 30 minutes of inactivity.',
      });
      return null;
    }

    return {
      ...session,
      remainingMinutes: Math.max(0, Math.ceil((CUSTODIAN_SESSION_TIMEOUT_MS - elapsed) / 60000)),
    };
  } catch {
    return null;
  }
}

/**
 * Check if custodian is currently authenticated and active
 */
export function isCustodianAuthenticated() {
  return getCustodianSession() !== null;
}

/**
 * Destroy active custodian session (Logout)
 */
export function clearCustodianSession() {
  try {
    sessionStorage.removeItem(CUSTODIAN_SESSION_KEY);
  } catch {
    // ignore
  }
}
