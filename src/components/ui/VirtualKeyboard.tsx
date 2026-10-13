import React from 'react';
import { Delete, CornerDownLeft, X, ArrowUp, Hash, Type } from 'lucide-react';
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
    clearInput,
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
    'relative select-none cursor-pointer flex items-center justify-center rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg font-bold transition-all duration-75 active:translate-y-0.5 active:shadow-none focus:outline-none';

  const themeKeycapClass =
    'bg-white text-slate-900 border-b-2 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-950 dark:hover:bg-[#1e293b] shadow-sm';

  const actionKeycapClass =
    'bg-slate-100 text-slate-800 border-b-2 border-slate-300 hover:bg-slate-200 dark:bg-slate-850 dark:text-slate-200 dark:border-slate-950 dark:hover:bg-slate-700 shadow-sm';

  const accentKeycapClass =
    'bg-cyan-600 text-white border-b-2 border-cyan-800 hover:bg-cyan-500 active:bg-cyan-700 shadow-sm';

  return (
    <aside
      ref={keyboardContainerRef}
      onMouseDown={(e) => {
        // Prevent clicking inside keyboard from stealing browser input focus
        e.preventDefault();
      }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-200/95 dark:bg-slate-900/95 backdrop-blur-md border-t-2 border-slate-300 dark:border-slate-800 p-2 sm:p-2.5 shadow-2xl animate-slide-up select-none"
      role="region"
      aria-label="Kiosk On-Screen Keyboard Terminal"
    >
      {/* 1. Monospace Industrial Telemetry Header Bar */}
      <div className="max-w-4xl mx-auto flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-300/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono tracking-wider text-slate-700 dark:text-slate-300 truncate">
          <span className="font-extrabold text-cyan-600 dark:text-cyan-400">
            [SYS.INPUT // {layout === 'numeric' ? 'NUMPAD-KEYPAD' : 'TOUCH-KEYPAD'}]
          </span>
          <span className="hidden sm:inline text-slate-400 dark:text-slate-600">•</span>
          <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-slate-300/60 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold truncate max-w-xs">
            FIELD: {activeInputLabel || 'GENERAL INPUT'}
          </span>
          <span className="text-slate-500 font-mono text-[9px] sm:text-[10px] uppercase">
            [{layout.toUpperCase()}]
          </span>
        </div>

        {/* Action Controls: Switch Layout & Close Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              triggerTactileFeedback();
              toggleLayout();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-cyan-500 cursor-pointer active:scale-95 transition-all"
            title="Switch input layout (123 / ABC)"
          >
            {layout === 'alphabetic' ? (
              <>
                <Hash className="w-3 h-3 text-cyan-500" />
                <span>NUMPAD</span>
              </>
            ) : (
              <>
                <Type className="w-3 h-3 text-cyan-500" />
                <span>QWERTY</span>
              </>
            )}
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              triggerTactileFeedback();
              clearInput();
            }}
            className="hidden sm:inline-block px-2 py-1 rounded-md text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 hover:text-rose-500 cursor-pointer"
            title="Clear all characters"
          >
            CLEAR
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              triggerTactileFeedback();
              handleClose();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-mono font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white cursor-pointer active:scale-95 transition-all"
            aria-label="Close On-Screen Keyboard"
          >
            <X className="w-3.5 h-3.5" />
            <span>CLOSE</span>
          </button>
        </div>
      </div>

      {/* 2. NUMERIC MODE: Tactile 3x4 / 4x4 Keypad */}
      {layout === 'numeric' && (
        <div className="max-w-xs sm:max-w-sm mx-auto py-0.5">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {/* Row 1 */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                insertChar('1');
              }}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              1
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                insertChar('2');
              }}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              2
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                insertChar('3');
              }}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              3
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                deleteChar();
              }}
              className={`${baseKeycapClass} ${actionKeycapClass} h-10 sm:h-11 text-rose-600 dark:text-rose-400`}
              title="Backspace"
              aria-label="Backspace"
            >
              <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Row 2 */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                insertChar('4');
              }}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              4
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                insertChar('5');
              }}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              5
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                insertChar('6');
              }}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              6
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                insertChar('-');
              }}
              className={`${baseKeycapClass} ${actionKeycapClass} h-10 sm:h-11 font-mono text-lg`}
              title="Hyphen (Student ID)"
            >
              -
            </button>

            {/* Row 3 */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                insertChar('7');
              }}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              7
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                insertChar('8');
              }}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              8
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                insertChar('9');
              }}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              9
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                toggleLayout();
              }}
              className={`${baseKeycapClass} ${actionKeycapClass} h-10 sm:h-11 font-mono text-[11px] sm:text-xs font-black`}
              title="Switch to Letters"
            >
              ABC
            </button>

            {/* Row 4 */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                insertChar('.');
              }}
              className={`${baseKeycapClass} ${actionKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              .
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                insertChar('0');
              }}
              className={`${baseKeycapClass} ${themeKeycapClass} h-10 sm:h-11 font-mono text-lg`}
            >
              0
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                insertChar(' ');
              }}
              className={`${baseKeycapClass} ${actionKeycapClass} h-10 sm:h-11 font-mono text-[10px]`}
              title="Space"
            >
              SPACE
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                submitDone();
              }}
              className={`${baseKeycapClass} ${accentKeycapClass} h-10 sm:h-11 font-mono text-xs sm:text-sm font-black`}
              title="Done / Enter"
            >
              <CornerDownLeft className="w-4 h-4" />
            </button>
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
                <button
                  key={key}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    triggerTactileFeedback();
                    insertChar(displayChar);
                  }}
                  className={`${baseKeycapClass} ${themeKeycapClass} flex-1 h-9 sm:h-11 min-w-0`}
                >
                  {displayChar}
                </button>
              );
            })}
          </div>

          {/* Row 2: A - L */}
          <div className="flex gap-1 sm:gap-1.5 justify-center px-2 sm:px-4">
            {QWERTY_ROW_2.map((key) => {
              const displayChar = isCaps ? key.toUpperCase() : key.toLowerCase();
              return (
                <button
                  key={key}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    triggerTactileFeedback();
                    insertChar(displayChar);
                  }}
                  className={`${baseKeycapClass} ${themeKeycapClass} flex-1 h-9 sm:h-11 min-w-0`}
                >
                  {displayChar}
                </button>
              );
            })}
          </div>

          {/* Row 3: Caps Lock, Z - M, Backspace */}
          <div className="flex gap-1 sm:gap-1.5 justify-center">
            {/* Shift / Caps Button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                toggleCaps();
              }}
              className={`${baseKeycapClass} ${actionKeycapClass} w-12 sm:w-16 h-9 sm:h-11 gap-1 ${
                isCaps ? 'ring-2 ring-cyan-500 text-cyan-600 dark:text-cyan-400' : ''
              }`}
              title="Caps Lock / Shift"
              aria-label="Caps Lock"
            >
              <ArrowUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isCaps ? 'text-cyan-500' : ''}`} />
              <span className="text-[9px] sm:text-[11px] font-mono hidden sm:inline">CAPS</span>
            </button>

            {QWERTY_ROW_3.map((key) => {
              const displayChar = isCaps ? key.toUpperCase() : key.toLowerCase();
              return (
                <button
                  key={key}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    triggerTactileFeedback();
                    insertChar(displayChar);
                  }}
                  className={`${baseKeycapClass} ${themeKeycapClass} flex-1 h-9 sm:h-11 min-w-0`}
                >
                  {displayChar}
                </button>
              );
            })}

            {/* Backspace Button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                deleteChar();
              }}
              className={`${baseKeycapClass} ${actionKeycapClass} w-12 sm:w-16 h-9 sm:h-11 text-rose-600 dark:text-rose-400`}
              title="Backspace"
              aria-label="Backspace"
            >
              <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Row 4: Mode Switch [123], Special Characters, Space, and Done/Enter */}
          <div className="flex gap-1 sm:gap-1.5 justify-center">
            {/* Switch to 123 / Numpad */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                toggleLayout();
              }}
              className={`${baseKeycapClass} ${actionKeycapClass} w-12 sm:w-16 h-9 sm:h-11 font-mono text-[11px] sm:text-xs font-extrabold`}
              title="Switch to Numbers"
            >
              123
            </button>

            {/* Punctuation quick keys */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                insertChar('-');
              }}
              className={`${baseKeycapClass} ${themeKeycapClass} w-8 sm:w-10 h-9 sm:h-11 font-mono text-sm`}
            >
              -
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                insertChar('.');
              }}
              className={`${baseKeycapClass} ${themeKeycapClass} w-8 sm:w-10 h-9 sm:h-11 font-mono text-sm`}
            >
              .
            </button>

            {/* Tactile Spacebar */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                insertChar(' ');
              }}
              className={`${baseKeycapClass} ${themeKeycapClass} flex-1 max-w-sm h-9 sm:h-11 font-mono text-[10px] sm:text-xs tracking-widest text-slate-400`}
              aria-label="Space"
            >
              SPACE
            </button>

            {/* Comma */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                insertChar(',');
              }}
              className={`${baseKeycapClass} ${themeKeycapClass} w-8 sm:w-10 h-9 sm:h-11 font-mono text-sm`}
            >
              ,
            </button>

            {/* Done / Enter Button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                triggerTactileFeedback();
                submitDone();
              }}
              className={`${baseKeycapClass} ${accentKeycapClass} w-16 sm:w-24 h-9 sm:h-11 gap-1 font-mono text-[11px] sm:text-xs font-black`}
              title="Done / Enter"
            >
              <CornerDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>DONE</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
