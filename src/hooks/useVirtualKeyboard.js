import { useState, useEffect, useRef, useCallback } from 'react';

export const KIOSK_MIN_VIEWPORT_WIDTH = 1024;

/**
 * Detects whether the current viewport is kiosk/tablet/desktop grade (>= 1024px).
 * Strictly returns false for smartphones (< 1024px) to let native mobile keyboards handle typing.
 */
export function isKioskTouchDevice() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= KIOSK_MIN_VIEWPORT_WIDTH;
}

/**
 * Context-aware dynamic layout detector.
 * Inspects field types, inputMode, patterns, and identifiers.
 */
export function detectInputLayoutMode(element) {
  if (!element) return 'alphabetic';

  const forcedMode = element.getAttribute('data-osk-mode') || element.getAttribute('data-osk-layout');
  if (forcedMode === 'numeric') return 'numeric';
  if (forcedMode === 'alphabetic') return 'alphabetic';

  const type = (element.getAttribute('type') || '').toLowerCase();
  const inputMode = (element.getAttribute('inputmode') || '').toLowerCase();
  const pattern = (element.getAttribute('pattern') || '').toLowerCase();
  const id = (element.id || '').toLowerCase();
  const name = (element.getAttribute('name') || '').toLowerCase();
  const placeholder = (element.getAttribute('placeholder') || '').toLowerCase();

  // 1. Direct numeric inputMode or type
  if (type === 'number' || type === 'tel') return 'numeric';
  if (inputMode === 'numeric' || inputMode === 'decimal' || inputMode === 'tel') return 'numeric';
  if (pattern.includes('0-9') || pattern === '\\d*') return 'numeric';

  // 2. Identifier keywords for numbers/codes/PINs
  const numericKeywords = ['pin', 'serial', 'qty', 'quantity', 'passcode', 'otp', 'counter', 'barcode'];
  if (numericKeywords.some((kw) => id.includes(kw) || name.includes(kw))) {
    return 'numeric';
  }

  // Check for Student ID specifically (e.g. "studentId", "student_id", or placeholder e.g. "23-1374-693")
  if (id.includes('studentid') || name.includes('studentid') || placeholder.includes('23-1374')) {
    return 'numeric';
  }

  // All other fields (student name, department, course code, notes, search) default to alphabetic
  return 'alphabetic';
}

/**
 * Extracts a concise human-readable telemetry label for the active input.
 */
export function getInputTelemetryLabel(element) {
  if (!element) return 'TERMINAL INPUT';

  const explicitLabel = element.getAttribute('data-osk-label');
  if (explicitLabel) return explicitLabel.toUpperCase();

  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel.toUpperCase();

  const placeholder = element.getAttribute('placeholder');
  if (placeholder && !placeholder.startsWith('e.g.')) {
    return placeholder.slice(0, 24).toUpperCase();
  }

  if (element.id) {
    const parentLabel = document.querySelector(`label[for="${element.id}"]`);
    if (parentLabel?.textContent) {
      return parentLabel.textContent.trim().slice(0, 24).toUpperCase();
    }
    return element.id.replace(/[-_]/g, ' ').toUpperCase();
  }

  if (element.name) {
    return element.name.replace(/[-_]/g, ' ').toUpperCase();
  }

  return 'TERMINAL INPUT';
}

/**
 * Dispatches standard and synthetic React input events so controlled components
 * update their state reliably without losing focus or selection range.
 */
export function injectSyntheticValue(target, newValue, newCursorPos) {
  if (!target) return;

  const isTextArea = target instanceof HTMLTextAreaElement;
  const prototype = isTextArea
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;

  const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  // Update React's internal value tracker if active
  const tracker = target._valueTracker;
  if (tracker) {
    tracker.setValue(target.value);
  }

  if (valueSetter) {
    valueSetter.call(target, newValue);
  } else {
    target.value = newValue;
  }

  // Dispatch standard bubbles: true events that React 16-19 listens to
  const inputEvent = new Event('input', { bubbles: true, cancelable: true });
  target.dispatchEvent(inputEvent);

  const changeEvent = new Event('change', { bubbles: true, cancelable: true });
  target.dispatchEvent(changeEvent);

  // Restore cursor selection when supported
  if (typeof newCursorPos === 'number') {
    try {
      target.setSelectionRange(newCursorPos, newCursorPos);
    } catch {
      // Ignored for input types that don't support setSelectionRange (e.g., type="number")
    }
  }
}

/**
 * Inserts a character into the currently focused input at current cursor position.
 */
export function handleCharInjection(target, char) {
  if (!target) return;

  let start = target.value.length;
  let end = target.value.length;

  try {
    if (target.selectionStart !== null && target.selectionStart !== undefined) {
      start = target.selectionStart;
      end = target.selectionEnd ?? start;
    }
  } catch {
    // Fallback for number inputs
  }

  const currentValue = target.value || '';
  const maxLength = target.maxLength;

  // Respect maxLength attribute
  if (maxLength > 0 && currentValue.length - (end - start) >= maxLength) {
    return;
  }

  const nextValue = currentValue.slice(0, start) + char + currentValue.slice(end);
  injectSyntheticValue(target, nextValue, start + char.length);
}

/**
 * Handles backspace deletion at cursor or across selected text range.
 */
export function handleBackspaceInjection(target) {
  if (!target) return;

  let start = target.value.length;
  let end = target.value.length;

  try {
    if (target.selectionStart !== null && target.selectionStart !== undefined) {
      start = target.selectionStart;
      end = target.selectionEnd ?? start;
    }
  } catch {
    // Fallback
  }

  const currentValue = target.value || '';
  if (start === end) {
    if (start > 0) {
      const nextValue = currentValue.slice(0, start - 1) + currentValue.slice(end);
      injectSyntheticValue(target, nextValue, start - 1);
    }
  } else {
    const nextValue = currentValue.slice(0, start) + currentValue.slice(end);
    injectSyntheticValue(target, nextValue, start);
  }
}

/**
 * Complete Kiosk Virtual Keyboard Integration Hook.
 */
export function useVirtualKeyboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [layout, setLayout] = useState('alphabetic'); // 'alphabetic' | 'numeric'
  const [activeInput, setActiveInput] = useState(null);
  const [activeInputLabel, setActiveInputLabel] = useState('TERMINAL INPUT');
  const [isCaps, setIsCaps] = useState(true); // Default to uppercase for laboratory forms
  const [isKioskViewport, setIsKioskViewport] = useState(isKioskTouchDevice);

  const keyboardContainerRef = useRef(null);

  // Close the keyboard cleanly and clear active input
  const closeKeyboard = useCallback(() => {
    setIsOpen(false);
    setActiveInput((prev) => {
      if (prev && typeof prev.blur === 'function') {
        try {
          prev.blur();
        } catch {
          // Safe fallback
        }
      }
      return null;
    });
  }, []);

  // Open the keyboard programmatically on a specific element
  const openKeyboard = useCallback((element, forcedLayout) => {
    if (!isKioskTouchDevice()) return;
    if (!element) return;

    const detected = forcedLayout || detectInputLayoutMode(element);
    setActiveInput(element);
    setActiveInputLabel(getInputTelemetryLabel(element));
    setLayout(detected);
    setIsOpen(true);
  }, []);

  const toggleLayout = useCallback(() => {
    setLayout((prev) => (prev === 'alphabetic' ? 'numeric' : 'alphabetic'));
  }, []);

  const toggleCaps = useCallback(() => {
    setIsCaps((prev) => !prev);
  }, []);

  const insertChar = useCallback(
    (char) => {
      if (!activeInput) return;
      handleCharInjection(activeInput, char);
      // Ensure cursor visibility and focus
      try {
        activeInput.focus({ preventScroll: true });
      } catch {
        // Safe fallback
      }
    },
    [activeInput]
  );

  const deleteChar = useCallback(() => {
    if (!activeInput) return;
    handleBackspaceInjection(activeInput);
    try {
      activeInput.focus({ preventScroll: true });
    } catch {
      // Safe fallback
    }
  }, [activeInput]);

  const clearInput = useCallback(() => {
    if (!activeInput) return;
    injectSyntheticValue(activeInput, '', 0);
    try {
      activeInput.focus({ preventScroll: true });
    } catch {
      // Safe fallback
    }
  }, [activeInput]);

  const submitDone = useCallback(() => {
    if (activeInput) {
      // Dispatch simulated Enter key
      try {
        const enterDown = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true });
        const enterUp = new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true });
        activeInput.dispatchEvent(enterDown);
        activeInput.dispatchEvent(enterUp);
      } catch {
        // Safe fallback
      }
      try {
        activeInput.blur();
      } catch {
        // Safe fallback
      }
    }
    closeKeyboard();
  }, [activeInput, closeKeyboard]);

  // Monitor viewport width changes
  useEffect(() => {
    const handleResize = () => {
      const isKiosk = isKioskTouchDevice();
      setIsKioskViewport(isKiosk);
      if (!isKiosk && isOpen) {
        closeKeyboard();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, closeKeyboard]);

  // Global focus, touch, and click interception for kiosk-grade viewports
  useEffect(() => {
    const handleInputActivation = (e) => {
      if (!isKioskTouchDevice()) return;

      const target = e.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
        return;
      }

      // Filter out non-textual input types
      const type = (target.getAttribute('type') || '').toLowerCase();
      const ignoredTypes = [
        'checkbox',
        'radio',
        'file',
        'button',
        'submit',
        'reset',
        'range',
        'color',
        'hidden',
        'time',
        'date',
        'datetime-local',
        'month',
        'week',
      ];
      if (ignoredTypes.includes(type)) return;

      if (target.readOnly || target.disabled || target.getAttribute('data-no-osk') === 'true') {
        return;
      }

      const detected = detectInputLayoutMode(target);
      setActiveInput(target);
      setActiveInputLabel(getInputTelemetryLabel(target));
      setLayout(detected);
      setIsOpen(true);
    };

    document.addEventListener('focusin', handleInputActivation);
    document.addEventListener('pointerdown', handleInputActivation);
    document.addEventListener('click', handleInputActivation);

    return () => {
      document.removeEventListener('focusin', handleInputActivation);
      document.removeEventListener('pointerdown', handleInputActivation);
      document.removeEventListener('click', handleInputActivation);
    };
  }, []);

  // Click-outside trigger to close virtual keyboard
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      const target = e.target;
      if (!target) return;

      // Click is inside keyboard
      if (keyboardContainerRef.current && keyboardContainerRef.current.contains(target)) {
        return;
      }

      // Click is on an input or textarea
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        return;
      }

      // Click is on an action button explicitly marked to preserve OSK
      if (target.closest?.('[data-keep-osk="true"]')) {
        return;
      }

      // Otherwise, outside click occurred
      closeKeyboard();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeKeyboard();
      }
    };

    // Close when system screensaver or inactivity warning triggers
    const handleSystemSleep = () => {
      closeKeyboard();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('kiosk-screensaver-activated', handleSystemSleep);
    window.addEventListener('kiosk-inactivity-warning', handleSystemSleep);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('kiosk-screensaver-activated', handleSystemSleep);
      window.removeEventListener('kiosk-inactivity-warning', handleSystemSleep);
    };
  }, [isOpen, closeKeyboard]);

  return {
    isOpen: isOpen && isKioskViewport,
    layout,
    setLayout,
    activeInput,
    activeInputLabel,
    isCaps,
    isKioskViewport,
    keyboardContainerRef,
    openKeyboard,
    closeKeyboard,
    toggleLayout,
    toggleCaps,
    insertChar,
    deleteChar,
    clearInput,
    submitDone,
  };
}
