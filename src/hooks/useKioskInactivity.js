/**
 * InvenTech Laboratory Management System - Kiosk Inactivity Deadman Engine
 * Module: [SYS.SEC // DEADMAN-01]
 * 
 * Continuously monitors user interaction across touch, mouse, and keyboard.
 * Triggers a 45s warning followed by a 15s countdown hard reset on abandoned sessions.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { logSecurityEvent, SECURITY_EVENT_TYPES, SEVERITY_LEVELS } from '../services/securityAuditService';

const DEFAULT_INACTIVITY_MS = 45 * 1000; // 45 seconds idle window
const DEFAULT_COUNTDOWN_SEC = 15; // 15 seconds warning countdown

export function useKioskInactivity({
  isActive = false,
  onReset,
  inactivityMs = DEFAULT_INACTIVITY_MS,
  countdownSec = DEFAULT_COUNTDOWN_SEC,
}) {
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(countdownSec);

  const inactivityTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const onResetRef = useRef(onReset);
  const isWarningVisibleRef = useRef(false);

  // Keep latest references
  useEffect(() => {
    onResetRef.current = onReset;
  }, [onReset]);

  useEffect(() => {
    isWarningVisibleRef.current = isWarningVisible;
  }, [isWarningVisible]);

  // Clear inactivity timer
  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  // Clear countdown interval
  const clearCountdownInterval = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Clear all pending timers
  const clearAllTimers = useCallback(() => {
    clearInactivityTimer();
    clearCountdownInterval();
  }, [clearInactivityTimer, clearCountdownInterval]);

  // Execute hard reset
  const executeHardReset = useCallback(() => {
    clearAllTimers();
    setIsWarningVisible(false);
    setRemainingSeconds(countdownSec);

    // Log security event for audit telemetry
    logSecurityEvent({
      eventType: SECURITY_EVENT_TYPES.INACTIVITY_TIMEOUT,
      actorId: 'KIOSK.DEADMAN',
      severity: SEVERITY_LEVELS.WARN,
      details: `Kiosk deadman timeout triggered after ${inactivityMs / 1000}s inactivity + ${countdownSec}s countdown. Purging student credentials and resetting to standby.`,
    });

    if (onResetRef.current) {
      onResetRef.current();
    }
  }, [clearAllTimers, countdownSec, inactivityMs]);

  // Start the 15-second countdown modal
  const startCountdown = useCallback(() => {
    clearInactivityTimer();
    clearCountdownInterval();

    setIsWarningVisible(true);
    setRemainingSeconds(countdownSec);

    let currentSec = countdownSec;
    countdownIntervalRef.current = setInterval(() => {
      currentSec -= 1;
      setRemainingSeconds(currentSec);

      if (currentSec <= 0) {
        clearCountdownInterval();
        executeHardReset();
      }
    }, 1000);
  }, [countdownSec, clearInactivityTimer, clearCountdownInterval, executeHardReset]);

  // Continue session - dismissed by user tap/click
  const continueSession = useCallback(() => {
    clearAllTimers();
    setIsWarningVisible(false);
    setRemainingSeconds(countdownSec);

    // Restart the 45s timer if session is still active
    if (isActive) {
      inactivityTimerRef.current = setTimeout(() => {
        startCountdown();
      }, inactivityMs);
    }
  }, [clearAllTimers, countdownSec, isActive, inactivityMs, startCountdown]);

  // Main activity listener hook
  useEffect(() => {
    if (!isActive) {
      clearAllTimers();
      setIsWarningVisible(false);
      return;
    }

    // Reset inactivity timer on any detected interaction
    const handleActivity = () => {
      // Do not auto-dismiss modal with passive mouse moves if warning is already visible
      if (isWarningVisibleRef.current) return;

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = setTimeout(() => {
        startCountdown();
      }, inactivityMs);
    };

    const monitoredEvents = ['touchstart', 'mousemove', 'keydown', 'click'];
    monitoredEvents.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    // Start initial 45s timer
    inactivityTimerRef.current = setTimeout(() => {
      startCountdown();
    }, inactivityMs);

    return () => {
      monitoredEvents.forEach((evt) => {
        window.removeEventListener(evt, handleActivity);
      });
      clearAllTimers();
    };
  }, [isActive, inactivityMs, startCountdown, clearAllTimers]);

  return {
    isWarningVisible,
    remainingSeconds,
    continueSession,
    triggerResetNow: executeHardReset,
  };
}
