import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import DashboardOverview from './DashboardOverview';
import InventoryManager from './InventoryManager';
import ReservationManager from './ReservationManager';
import TransactionHistory from './TransactionHistory';
import AuditReports from './AuditReports';
import SecurityAuditViewer from './SecurityAuditViewer';
import {
  isCustodianAuthenticated,
  touchCustodianSession,
  clearCustodianSession,
} from '../../utils/authSecurity';
import {
  logSecurityEvent,
  SECURITY_EVENT_TYPES,
  SEVERITY_LEVELS,
} from '../../services/securityAuditService';
import { useTransaction } from '../../context/TransactionContext';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { showToast } = useTransaction();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(() => isCustodianAuthenticated());

  // Immediate Route Shield: Reject unauthenticated visits
  useEffect(() => {
    if (!isCustodianAuthenticated()) {
      logSecurityEvent({
        eventType: SECURITY_EVENT_TYPES.UNAUTHORIZED_ACCESS_ATTEMPT,
        actorId: 'ANONYMOUS',
        severity: SEVERITY_LEVELS.CRITICAL,
        details: 'Unauthorized visit to /admin rejected. Redirected to root terminal with zero data exposure.',
      });
      showToast('Unauthorized access. Redirected to kiosk terminal.', 'error');
      navigate('/', { replace: true });
    }
  }, [navigate, showToast]);

  // Session Inactivity Monitor: Enforce 30-minute timeout & touch on activity
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleUserInteraction = () => {
      touchCustodianSession();
    };

    const events = ['mousemove', 'keydown', 'touchstart', 'click'];
    events.forEach((evt) => window.addEventListener(evt, handleUserInteraction, { passive: true }));

    // Check expiration every 15 seconds
    const interval = setInterval(() => {
      if (!isCustodianAuthenticated()) {
        setIsAuthenticated(false);
        showToast('Custodian session expired after 30 minutes of inactivity.', 'warning');
        navigate('/', { replace: true });
      }
    }, 15000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserInteraction));
      clearInterval(interval);
    };
  }, [isAuthenticated, navigate, showToast]);

  // If not authenticated, return null to ensure ZERO data exposure before redirection
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleExit = () => {
    clearCustodianSession();
    showToast('Logged out of Admin Console.', 'info');
    navigate('/');
  };

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
