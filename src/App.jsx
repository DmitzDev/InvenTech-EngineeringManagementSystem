import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { TransactionProvider, useTransaction } from './context/TransactionContext';
import Header from './components/ui/Header';
import ChevronProgressBar from './components/ui/ChevronProgressBar';
import FloatingCpexBot from './components/ui/FloatingCpexBot';
import KioskScreensaver from './components/ui/KioskScreensaver';
import InactivityWarningModal from './components/ui/InactivityWarningModal';
import VirtualKeyboard from './components/ui/VirtualKeyboard';
import WelcomeScreen from './components/steps/WelcomeScreen';
import BorrowerForm from './components/steps/BorrowerForm';
import LabSelector from './components/steps/LabSelector';
import EquipmentCatalog from './components/steps/EquipmentCatalog';
import TransactionCommit from './components/steps/TransactionCommit';
import BorrowerSheet from './components/print/BorrowerSheet';
import ReturnReceiptDownload from './components/receipt/ReturnReceiptDownload';
import AdminPanel from './components/admin/AdminPanel';
import AdminLogin from './components/admin/AdminLogin';
import { useKioskInactivity } from './hooks/useKioskInactivity';
import { useVirtualKeyboard } from './hooks/useVirtualKeyboard';

function KioskContent() {
  const { currentStep, theme, goToWelcome, showToast } = useTransaction();
  const isDark = theme === 'dark';

  // Kiosk Inactivity Deadman Safeguard:
  // Active when in the middle of any non-idle transaction (currentStep > 0)
  const isSessionActive = currentStep > 0;

  const handleDeadmanReset = () => {
    goToWelcome();
    showToast('Session auto-reset due to inactivity. Student entries purged.', 'info');
  };

  const {
    isWarningVisible,
    remainingSeconds,
    continueSession,
    triggerResetNow,
  } = useKioskInactivity({
    isActive: isSessionActive,
    onReset: handleDeadmanReset,
    inactivityMs: 45 * 1000, // 45 seconds idle trigger
    countdownSec: 15, // 15 seconds warning countdown
  });

  const osk = useVirtualKeyboard();

  // Close virtual keyboard if inactivity warning modal appears or session resets
  React.useEffect(() => {
    if (isWarningVisible) {
      osk.closeKeyboard();
    }
  }, [isWarningVisible, osk.closeKeyboard]);

  // Kiosk Lockdown: Disable right-click, long-press contextmenu, and DevTools inspection shortcuts
  React.useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handleKeyDown = (e) => {
      // F12 DevTools
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I / J / C (Inspect / Console / Element Picker)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeScreen key="step-0" />;
      case 1:
        return <BorrowerForm key="step-1" />;
      case 2:
        return <LabSelector key="step-2" />;
      case 3:
        return <EquipmentCatalog key="step-3" />;
      case 4:
        return <TransactionCommit key="step-4" />;
      default:
        return <WelcomeScreen key="step-default" />;
    }
  };

  return (
    <div className={`min-h-screen h-auto md:h-screen w-full max-w-full flex flex-col overflow-x-hidden overflow-y-auto md:overflow-hidden relative select-none ${
      isDark ? 'bg-[#0a0e17] text-slate-100' : 'bg-slate-100/80 text-slate-900'
    }`}>
      {/* On-screen Kiosk Interactive Shell */}
      <div className="no-print min-h-screen h-auto md:h-full w-full max-w-full flex flex-col overflow-x-hidden overflow-y-auto md:overflow-hidden max-w-[1920px] mx-auto relative">
        {/* Top Header Bar (renders on steps 1-4) */}
        <Header />

        {/* Universal Chevron Ribbon Process Bar (Directly below Top Header on all devices) */}
        <ChevronProgressBar />

        {/* Dynamic Step Viewport: Natural Mobile Scroll vs Kiosk Locked Height */}
        <main className={`flex-1 flex flex-col animate-fade-in relative min-h-0 w-full max-w-full overflow-x-hidden overflow-y-auto md:overflow-y-auto ${
          isDark ? 'bg-[#0a0e17]' : 'bg-slate-100/80'
        }`}>
          {renderCurrentStep()}
        </main>

        {/* Global Floating CPEX Copilot Assistant */}
        <FloatingCpexBot />

        {/* Global Inactivity Sleep Mode Screensaver */}
        <KioskScreensaver />

        {/* Dynamic 15-inch Touchscreen Virtual Keyboard (OSK) */}
        <VirtualKeyboard controller={osk} />

        {/* Kiosk Tamper Protection & Inactivity Deadman Warning Modal */}
        <InactivityWarningModal
          isOpen={isWarningVisible}
          remainingSeconds={remainingSeconds}
          onContinue={continueSession}
          onResetNow={triggerResetNow}
        />
      </div>

      {/* Official Printable Borrower's Sheet (Automated / Print Only) */}
      <BorrowerSheet />
    </div>
  );
}

export default function App() {
  return (
    <TransactionProvider>
      <Routes>
        <Route path="/" element={<KioskContent />} />
        <Route path="/receipt/:txId" element={<ReturnReceiptDownload />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/login" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TransactionProvider>
  );
}
