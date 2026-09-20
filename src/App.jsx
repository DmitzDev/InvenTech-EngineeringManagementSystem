import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { TransactionProvider, useTransaction } from './context/TransactionContext';
import Header from './components/ui/Header';
import ChevronProgressBar from './components/ui/ChevronProgressBar';
import FloatingKairoBot from './components/ui/FloatingKairoBot';
import KioskScreensaver from './components/ui/KioskScreensaver';
import WelcomeScreen from './components/steps/WelcomeScreen';
import BorrowerForm from './components/steps/BorrowerForm';
import LabSelector from './components/steps/LabSelector';
import EquipmentCatalog from './components/steps/EquipmentCatalog';
import TransactionCommit from './components/steps/TransactionCommit';
import BorrowerSheet from './components/print/BorrowerSheet';
import AdminPanel from './components/admin/AdminPanel';

function KioskContent() {
  const { currentStep } = useTransaction();

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
    <div className="min-h-screen lg:h-screen w-full bg-[#0b111e] text-slate-100 flex flex-col overflow-x-hidden relative select-none">
      {/* On-screen Kiosk Interactive Shell */}
      <div className="no-print min-h-screen lg:min-h-0 lg:h-full w-full flex flex-col overflow-x-hidden max-w-[1920px] mx-auto">
        {/* Top Header Bar (renders on steps 1-4) */}
        <Header />

        {/* Universal Chevron Ribbon Process Bar (Directly below Top Header on all devices) */}
        <ChevronProgressBar />

        {/* Dynamic Step Viewport */}
        <main className="flex-1 flex flex-col animate-fade-in relative bg-[#0b111e] min-h-0 overflow-y-auto">
          {renderCurrentStep()}
        </main>

        {/* Global Floating Kairo AI Chatbot Assistant */}
        <FloatingKairoBot />

        {/* Global Inactivity Sleep Mode Screensaver */}
        <KioskScreensaver />
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
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TransactionProvider>
  );
}
