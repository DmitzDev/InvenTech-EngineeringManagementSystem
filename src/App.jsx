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
    <div className="min-h-screen lg:h-screen w-full lg:w-screen bg-[#0b111e] text-slate-100 flex flex-col overflow-x-hidden overflow-y-auto lg:overflow-hidden relative select-none">
      {/* On-screen Kiosk Interactive Shell */}
      <div className="no-print min-h-screen lg:h-full w-full flex flex-col overflow-x-hidden lg:overflow-hidden max-w-[1920px] mx-auto">
        {/* Top Header Bar (renders on steps 1-4) */}
        <Header />

        {/* Universal Chevron Ribbon Process Bar (Directly below Top Header on all devices) */}
        <ChevronProgressBar />

        {/* Dynamic Step Viewport */}
        <main className="flex-1 flex flex-col animate-fade-in relative bg-[#0b111e] overflow-visible lg:overflow-hidden">
          {renderCurrentStep()}
        </main>

        {/* Global Floating Kairo AI Chatbot Assistant */}
        <FloatingKairoBot />

        {/* Global Inactivity Sleep Mode Screensaver */}
        <KioskScreensaver />

        {/* Clean Neumorphic Kiosk Footer Bar (renders on steps 1-4) */}
        {currentStep > 0 && (
          <footer className="min-h-8 py-1.5 sm:py-0 px-3 sm:px-6 bg-[#0e1422] shadow-[0_-2px_8px_#060a12] border-t border-slate-800/80 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 shrink-0 font-medium">
            <div className="flex items-center gap-1.5 sm:gap-3 truncate">
              <span className="font-bold text-slate-300">UdD</span>
              <span className="hidden sm:inline font-bold text-slate-300">Universidad de Dagupan</span>
              <span>•</span>
              <span className="hidden md:inline">School of Engineering</span>
              <span className="hidden md:inline">•</span>
              <span className="font-mono text-cyan-400 font-bold">UdD-FM-LM-01A-01</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-400 font-mono text-[9px] sm:text-xs">
                Neomorphic Touch POS v3.0
              </span>
            </div>
          </footer>
        )}
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
