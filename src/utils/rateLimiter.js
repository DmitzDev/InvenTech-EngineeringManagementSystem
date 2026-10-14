/**
 * InvenTech Laboratory Management System - Anti-Brute-Force Rate Limiter
 * Module: [SYS.SEC // RATE-LIMITER-01]
 * 
 * Enforces consecutive attempt quotas (Max 4 failed attempts) and strict
 * 60-second cooldown lockouts for Student ID Return Lookups and Custodian Admin Auth.
 */

import { useState, useEffect, useCallback } from 'react';
import { logSecurityEvent, SECURITY_EVENT_TYPES, SEVERITY_LEVELS } from '../services/securityAuditService';

const RATE_LIMIT_STORAGE_PREFIX = 'udd_rate_limit_';
export const MAX_ALLOWED_ATTEMPTS = 4;
export const LOCKOUT_DURATION_SECONDS = 60;
export const LOCKOUT_DURATION_MS = LOCKOUT_DURATION_SECONDS * 1000;

/**
 * Read current rate limit state for a given key
 * @param {string} contextKey - e.g. 'admin_login' | 'return_lookup'
 * @returns {Object} { isLocked: boolean, remainingSeconds: number, failedAttempts: number }
 */
export function getRateLimitState(contextKey) {
  try {
    const raw = localStorage.getItem(`${RATE_LIMIT_STORAGE_PREFIX}${contextKey}`);
    if (!raw) {
      return { isLocked: false, remainingSeconds: 0, failedAttempts: 0 };
    }

    const data = JSON.parse(raw);
    const now = Date.now();

    if (data.lockoutUntil && data.lockoutUntil > now) {
      const remainingSeconds = Math.max(1, Math.ceil((data.lockoutUntil - now) / 1000));
      return {
        isLocked: true,
        remainingSeconds,
        failedAttempts: data.failedAttempts || MAX_ALLOWED_ATTEMPTS,
      };
    }

    // Cooldown expired
    if (data.lockoutUntil && data.lockoutUntil <= now) {
      resetRateLimit(contextKey);
      return { isLocked: false, remainingSeconds: 0, failedAttempts: 0 };
    }

    return {
      isLocked: false,
      remainingSeconds: 0,
      failedAttempts: data.failedAttempts || 0,
    };
  } catch (err) {
    console.error('[SYS.SEC // RATE-LIMIT] Failed reading state:', err);
    return { isLocked: false, remainingSeconds: 0, failedAttempts: 0 };
  }
}

/**
 * Record a failed attempt
 * @param {string} contextKey - e.g. 'admin_login' | 'return_lookup'
 * @param {string} [actorId] - User or Student ID involved
 * @param {string} [description] - Context details
 * @returns {Object} Updated rate limit state
 */
export function recordFailedAttempt(contextKey, actorId = 'UNKNOWN', description = '') {
  const current = getRateLimitState(contextKey);
  const now = Date.now();
  const newAttempts = current.failedAttempts + 1;

  let lockoutUntil = null;
  let isLocked = false;
  let remainingSeconds = 0;

  if (newAttempts >= MAX_ALLOWED_ATTEMPTS) {
    lockoutUntil = now + LOCKOUT_DURATION_MS;
    isLocked = true;
    remainingSeconds = LOCKOUT_DURATION_SECONDS;

    // Trigger Audit Log for threshold breach
    logSecurityEvent({
      eventType: SECURITY_EVENT_TYPES.LOCKOUT_TRIGGERED,
      actorId,
      severity: SEVERITY_LEVELS.CRITICAL,
      details: `Rate limit threshold breached for [${contextKey}]. 60-second cooldown active. ${description}`.trim(),
      metadata: { contextKey, attempts: newAttempts, cooldownSeconds: LOCKOUT_DURATION_SECONDS },
    });
  } else {
    // Log individual failure
    logSecurityEvent({
      eventType: SECURITY_EVENT_TYPES.AUTH_FAILURE,
      actorId,
      severity: SEVERITY_LEVELS.WARN,
      details: `Failed attempt (${newAttempts}/${MAX_ALLOWED_ATTEMPTS}) on [${contextKey}]. ${description}`.trim(),
      metadata: { contextKey, attempts: newAttempts },
    });
  }

  const payload = {
    failedAttempts: newAttempts,
    lockoutUntil,
    lastAttemptAt: now,
  };

  try {
    localStorage.setItem(`${RATE_LIMIT_STORAGE_PREFIX}${contextKey}`, JSON.stringify(payload));
  } catch {
    // ignore
  }

  return {
    isLocked,
    remainingSeconds,
    failedAttempts: newAttempts,
  };
}

/**
 * Record a successful attempt - resets the counter
 * @param {string} contextKey
 */
export function recordSuccessfulAttempt(contextKey) {
  resetRateLimit(contextKey);
}

/**
 * Reset rate limit state for context
 * @param {string} contextKey
 */
export function resetRateLimit(contextKey) {
  try {
    localStorage.removeItem(`${RATE_LIMIT_STORAGE_PREFIX}${contextKey}`);
  } catch {
    // ignore
  }
}

/**
 * React Hook for real-time cooldown countdown & attempt monitoring
 * @param {string} contextKey - e.g. 'admin_login' | 'return_lookup'
 */
export function useRateLimiter(contextKey) {
  const [state, setState] = useState(() => getRateLimitState(contextKey));

  // Sync and countdown timer
  useEffect(() => {
    // Initial sync
    const current = getRateLimitState(contextKey);
    setState(current);

    if (!current.isLocked) return;

    const interval = setInterval(() => {
      const updated = getRateLimitState(contextKey);
      setState(updated);
      if (!updated.isLocked) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [contextKey, state.isLocked]);

  const handleRecordFailure = useCallback(
    (actorId, description) => {
      const res = recordFailedAttempt(contextKey, actorId, description);
      setState(res);
      return res;
    },
    [contextKey]
  );

  const handleRecordSuccess = useCallback(() => {
    recordSuccessfulAttempt(contextKey);
    setState({ isLocked: false, remainingSeconds: 0, failedAttempts: 0 });
  }, [contextKey]);

  const handleReset = useCallback(() => {
    resetRateLimit(contextKey);
    setState({ isLocked: false, remainingSeconds: 0, failedAttempts: 0 });
  }, [contextKey]);

  return {
    isLocked: state.isLocked,
    remainingSeconds: state.remainingSeconds,
    failedAttempts: state.failedAttempts,
    maxAttempts: MAX_ALLOWED_ATTEMPTS,
    recordFailure: handleRecordFailure,
    recordSuccess: handleRecordSuccess,
    resetLimiter: handleReset,
  };
}
