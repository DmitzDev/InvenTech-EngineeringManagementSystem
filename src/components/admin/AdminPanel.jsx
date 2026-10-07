import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import DashboardOverview from './DashboardOverview';
import InventoryManager from './InventoryManager';
import ReservationManager from './ReservationManager';
import TransactionHistory from './TransactionHistory';
import AuditReports from './AuditReports';
import SecurityAuditViewer from './SecurityAuditViewer';
import AdminLogin from './AdminLogin';
import {
  isCustodianAuthenticated,
  touchCustodianSession,
  clearCustodianSession,
} from '../../utils/authSecurity';
import { useTransaction } from '../../context/TransactionContext';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { showToast } = useTransaction();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(() => isCustodianAuthenticated());

  // Session Inactivity Monitor: Enforce 30-minute auto-logout
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleUserInteraction = () => {
      touchCustodianSession();
    };

    const events = ['mousemove', 'keydown', 'touchstart', 'click'];
    events.forEach((evt) => window.addEventListener(evt, handleUserInteraction, { passive: true }));

    const interval = setInterval(() => {
      if (!isCustodianAuthenticated()) {
        setIsAuthenticated(false);
        showToast('Custodian session expired after 30 minutes of inactivity.', 'warning');
      }
    }, 15000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserInteraction));
      clearInterval(interval);
    };
  }, [isAuthenticated, showToast]);

  const handleExit = () => {
    clearCustodianSession();
    setIsAuthenticated(false);
    navigate('/');
  };

  // If unauthenticated, gate with the sleek Custodian Terminal (Zero Data Exposure)
  if (!isAuthenticated) {
    return <AdminLogin onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview onNavigateTab={setActiveTab} />;
      case 'inventory':
        return <InventoryManager />;
      case 'reservations':
        return <ReservationManager />;
      case 'transactions':
        return <TransactionHistory />;
      case 'reports':
        return <AuditReports />;
      case 'security':
        return <SecurityAuditViewer />;
      default:
        return <DashboardOverview onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="admin-shell min-h-screen h-screen h-[100dvh] w-full max-w-full overflow-x-hidden relative flex flex-col bg-[#e2e8f0] dark:bg-[#0a0e17] text-slate-900 dark:text-slate-100 select-none">
      {/* Top Navbar with Navigation Tabs & InvenTech Brand */}
      <AdminHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleExit}
      />

      {/* Main Full-Width Content Canvas */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full max-w-full bg-[#e2e8f0] dark:bg-[#0a0e17]">
        {renderContent()}
      </main>
    </div>
  );
}
