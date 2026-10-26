import React from 'react';
import { Delete, CornerDownLeft, X, ArrowUp } from 'lucide-react';
import { useVirtualKeyboard } from '../../hooks/useVirtualKeyboard';

interface VirtualKeyboardProps {
  controller?: ReturnType<typeof useVirtualKeyboard>;
  onClose?: () => void;
}

// QWERTY Key Rows
const QWERTY_ROW_1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
const QWERTY_ROW_2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
const QWERTY_ROW_3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

/**
 * Soundless micro-haptic feedback for physical touchscreen feel
 */
function triggerTactileFeedback() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(8);
    } catch {
      // Ignore
    }
  }
}

/**
 * High-Speed Touch-Optimized Kiosk Key Button:
 * - 0ms response time on pointer contact (no hard-touch needed, zero missed clicks)
 * - Immune to long-press context menu / "Inspect"
 * - Supports smooth repeat deletion on hold for Backspace
 */
interface KioskKeyProps {
  onPress: () => void;
  className?: string;
  children: React.ReactNode;
  title?: string;
  ariaLabel?: string;
  isRepeatable?: boolean;
}

const KioskKey: React.FC<KioskKeyProps> = ({
  onPress,
  className = '',
  children,
  title,
  ariaLabel,
  isRepeatable = false,
}) => {
  const lastPressRef = React.useRef(0);
  const repeatTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanupTimers = () => {
    if (repeatTimerRef.current) {
      clearTimeout(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  };

  const handleFire = () => {
    const now = Date.now();
    lastPressRef.current = now;
    triggerTactileFeedback();
    onPress();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFire();

    if (isRepeatable) {
      cleanupTimers();
      // Start repeat after 350ms hold, repeating every 75ms
      repeatTimerRef.current = setTimeout(() => {
        repeatIntervalRef.current = setInterval(() => {
          handleFire();
        }, 75);
      }, 350);
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    cleanupTimers();
  };

  // Safe fallback for keyboard-accessible activation, debounced to avoid double firing
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastPressRef.current > 120) {
      handleFire();
    }
  };

  React.useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, []);

  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel || title}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUpOrCancel}
      onPointerLeave={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className={`touch-none select-none ${className}`}
      style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
    >
      {children}
    </button>
  );
};

export default function VirtualKeyboard({ controller, onClose }: VirtualKeyboardProps) {
  const internalController = useVirtualKeyboard();
  const osk = controller || internalController;

  const {
    isOpen,
    layout,
    activeInputLabel,
    isCaps,
    keyboardContainerRef,
    closeKeyboard,
    toggleLayout,
    toggleCaps,
    insertChar,
    deleteChar,
    submitDone,
  } = osk;

  const handleClose = () => {
    closeKeyboard();
    onClose?.();
  };

  // If closed or rendered on small screens, render nothing (strictly disabled < 1024px)
  if (!isOpen) {
    return null;
  }

  const baseKeycapClass =
    'relative select-none cursor-pointer flex items-center justify-center rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg font-bold transition-all duration-75 active:scale-95 active:shadow-none focus:outline-none';

  const themeKeycapClass =
    'bg-white text-slate-900 border-b-2 border-slate-300 hover:bg-slate-50 active:bg-blue-50 dark:bg-[#1a2333] dark:text-white dark:border-b-2 dark:border-slate-950 dark:hover:bg-[#223048] dark:active:bg-[#2b3c5a] shadow-sm';

  const actionKeycapClass =
    'bg-slate-200 text-slate-800 border-b-2 border-slate-300 hover:bg-slate-300 active:bg-slate-400 dark:bg-[#25334a] dark:text-slate-100 dark:border-b-2 dark:border-slate-950 dark:hover:bg-[#2e3e5a] dark:active:bg-[#384b6c] shadow-sm';

  const accentKeycapClass =
    'bg-cyan-600 text-white border-b-2 border-cyan-800 hover:bg-cyan-500 active:bg-cyan-700 dark:bg-cyan-500 dark:text-slate-950 dark:border-cyan-700 dark:hover:bg-cyan-400 font-black shadow-sm';

  return (
    <aside
      ref={keyboardContainerRef}
      onPointerDown={(e) => {
        // Prevent clicking inside keyboard from stealing browser input focus
        e.preventDefault();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-200/95 dark:bg-slate-900/95 backdrop-blur-md border-t-2 border-slate-300 dark:border-slate-800 p-2 sm:p-2.5 shadow-2xl animate-slide-up select-none touch-none"
      style={{ touchAction: 'none' }}
      role="region"
      aria-label="Kiosk On-Screen Keyboard Terminal"
    >
      {/* Minimalist Clean Header */}
      <div className="max-w-3xl mx-auto flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-300 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            {layout === 'numeric' ? 'Number Pad' : 'Keyboard'}
          </span>
          {activeInputLabel && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">
              • {activeInputLabel}
            </span>
          )}
        </div>

        <KioskKey
          onPress={handleClose}
          className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-slate-300/60 hover:bg-rose-500 hover:text-white dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 cursor-pointer active:scale-95 transition-all"
          ariaLabel="Close keyboard"
        >
          <X className="w-3.5 h-3.5" />
          <span>Close</span>
        </KioskKey>
      </div>

      {/* 2. NUMERIC MODE: Tactile 3x4 / 4x4 Keypad */}
      {layout === 'numeric' && (
        <div className="max-w-xs sm:max-w-sm mx-auto py-0.5">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {/* Row 1 */}
            <KioskKey
              onPress={() => insertChar('1')}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              1
            </KioskKey>
            <KioskKey
              onPress={() => insertChar('2')}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              2
            </KioskKey>
            <KioskKey
              onPress={() => insertChar('3')}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              3
            </KioskKey>
            <KioskKey
              onPress={deleteChar}
              isRepeatable
              className={`${baseKeycapClass} ${actionKeycapClass} h-10 sm:h-11 text-rose-600 dark:text-rose-400`}
              title="Backspace"
              ariaLabel="Backspace"
            >
              <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
            </KioskKey>

            {/* Row 2 */}
            <KioskKey
              onPress={() => insertChar('4')}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              4
            </KioskKey>
            <KioskKey
              onPress={() => insertChar('5')}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              5
            </KioskKey>
            <KioskKey
              onPress={() => insertChar('6')}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              6
            </KioskKey>
            <KioskKey
              onPress={() => insertChar('-')}
              className={`${baseKeycapClass} ${actionKeycapClass} h-10 sm:h-11 font-mono text-lg`}
              title="Hyphen (Student ID)"
            >
              -
            </KioskKey>

            {/* Row 3 */}
            <KioskKey
              onPress={() => insertChar('7')}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              7
            </KioskKey>
            <KioskKey
              onPress={() => insertChar('8')}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              8
            </KioskKey>
            <KioskKey
              onPress={() => insertChar('9')}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              9
            </KioskKey>
            <KioskKey
              onPress={toggleLayout}
              className={`${baseKeycapClass} ${actionKeycapClass} h-10 sm:h-11 font-mono text-[11px] sm:text-xs font-black`}
              title="Switch to Letters"
            >
              ABC
            </KioskKey>

            {/* Row 4 */}
            <KioskKey
              onPress={() => insertChar('.')}
              className={`${baseKeycapClass} ${actionKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              .
            </KioskKey>
            <KioskKey
              onPress={() => insertChar('0')}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              0
            </KioskKey>
            <KioskKey
              onPress={() => insertChar(' ')}
              className={`${baseKeycapClass} ${actionKeycapClass} h-10 sm:h-11 font-mono text-[10px]`}
              title="Space"
            >
              SPACE
            </KioskKey>
            <KioskKey
              onPress={submitDone}
              className={`${baseKeycapClass} ${accentKeycapClass} h-10 sm:h-11 font-mono text-xs sm:text-sm font-black`}
              title="Done / Enter"
            >
              <CornerDownLeft className="w-4 h-4" />
            </KioskKey>
          </div>
        </div>
      )}

      {/* 3. ALPHABETIC MODE: 3-row QWERTY Keyboard */}
      {layout === 'alphabetic' && (
        <div className="max-w-3xl mx-auto space-y-1 sm:space-y-1.5 py-0.5">
          {/* Row 1: Q - P */}
          <div className="flex gap-1 sm:gap-1.5 justify-center">
            {QWERTY_ROW_1.map((key) => {
              const displayChar = isCaps ? key.toUpperCase() : key.toLowerCase();
              return (
                <KioskKey
                  key={key}
                  onPress={() => insertChar(displayChar)}
                  className={`${baseKeycapClass} ${themeKeycapClass} flex-1 h-9 sm:h-11 min-w-0`}
                >
                  {displayChar}
                </KioskKey>
              );
            })}
          </div>

          {/* Row 2: A - L */}
          <div className="flex gap-1 sm:gap-1.5 justify-center px-2 sm:px-4">
            {QWERTY_ROW_2.map((key) => {
              const displayChar = isCaps ? key.toUpperCase() : key.toLowerCase();
              return (
                <KioskKey
                  key={key}
                  onPress={() => insertChar(displayChar)}
                  className={`${baseKeycapClass} ${themeKeycapClass} flex-1 h-9 sm:h-11 min-w-0`}
                >
                  {displayChar}
                </KioskKey>
              );
            })}
          </div>

          {/* Row 3: Caps Lock, Z - M, Backspace */}
          <div className="flex gap-1 sm:gap-1.5 justify-center">
            {/* Shift / Caps Button */}
            <KioskKey
              onPress={toggleCaps}
              className={`${baseKeycapClass} ${actionKeycapClass} w-12 sm:w-16 h-9 sm:h-11 gap-1 ${
                isCaps
                  ? 'ring-2 ring-cyan-400 bg-cyan-500/20 text-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-300 dark:ring-cyan-400 font-black'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
              title="Caps Lock / Shift"
              ariaLabel="Caps Lock"
            >
              <ArrowUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isCaps ? 'text-cyan-400 font-black' : ''}`} />
              <span className="text-[9px] sm:text-[11px] font-mono hidden sm:inline">CAPS</span>
            </KioskKey>

            {QWERTY_ROW_3.map((key) => {
              const displayChar = isCaps ? key.toUpperCase() : key.toLowerCase();
              return (
                <KioskKey
                  key={key}
                  onPress={() => insertChar(displayChar)}
                  className={`${baseKeycapClass} ${themeKeycapClass} flex-1 h-9 sm:h-11 min-w-0`}
                >
                  {displayChar}
                </KioskKey>
              );
            })}

            {/* Backspace Button */}
            <KioskKey
              onPress={deleteChar}
              isRepeatable
              className={`${baseKeycapClass} ${actionKeycapClass} w-12 sm:w-16 h-9 sm:h-11 text-rose-600 dark:text-rose-400`}
              title="Backspace"
              ariaLabel="Backspace"
            >
              <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
            </KioskKey>
          </div>

          {/* Row 4: Mode Switch [123], Special Characters, Space, and Done/Enter */}
          <div className="flex gap-1 sm:gap-1.5 justify-center">
            {/* Switch to 123 / Numpad */}
            <KioskKey
              onPress={toggleLayout}
              className={`${baseKeycapClass} ${actionKeycapClass} w-12 sm:w-16 h-9 sm:h-11 font-mono text-[11px] sm:text-xs font-extrabold text-cyan-600 dark:text-cyan-400`}
              title="Switch to Numbers"
            >
              123
            </KioskKey>

            {/* Punctuation quick keys */}
            <KioskKey
              onPress={() => insertChar('-')}
              className={`${baseKeycapClass} ${themeKeycapClass} w-8 sm:w-10 h-9 sm:h-11 font-mono text-sm`}
            >
              -
            </KioskKey>
            <KioskKey
              onPress={() => insertChar('.')}
              className={`${baseKeycapClass} ${themeKeycapClass} w-8 sm:w-10 h-9 sm:h-11 font-mono text-sm`}
            >
              .
            </KioskKey>

            {/* Tactile Spacebar */}
            <KioskKey
              onPress={() => insertChar(' ')}
              className={`${baseKeycapClass} ${themeKeycapClass} flex-1 max-w-sm h-9 sm:h-11 font-mono text-[10px] sm:text-xs tracking-widest text-slate-500 dark:text-slate-300`}
              ariaLabel="Space"
            >
              SPACE
            </KioskKey>

            {/* Comma */}
            <KioskKey
              onPress={() => insertChar(',')}
              className={`${baseKeycapClass} ${themeKeycapClass} w-8 sm:w-10 h-9 sm:h-11 font-mono text-sm`}
            >
              ,
            </KioskKey>

            {/* Done / Enter Button */}
            <KioskKey
              onPress={submitDone}
              className={`${baseKeycapClass} ${accentKeycapClass} w-16 sm:w-24 h-9 sm:h-11 gap-1 font-mono text-[11px] sm:text-xs font-black`}
              title="Done / Enter"
            >
              <CornerDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>DONE</span>
            </KioskKey>
          </div>
        </div>
      )}
    </aside>
  );
}
