import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import DashboardOverview from './DashboardOverview';
import InventoryManager from './InventoryManager';
import ReservationManager from './ReservationManager';
import TransactionHistory from './TransactionHistory';
import AuditReports from './AuditReports';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleExit = () => {
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
      default:
        return <DashboardOverview onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="admin-shell h-screen w-screen bg-[#e2e8f0] dark:bg-[#0a0e17] text-slate-900 dark:text-slate-100 flex overflow-hidden relative select-none">
      {/* Sidebar: Persistent on Desktop, Slide-over Drawer on Mobile */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLock={handleExit}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#e2e8f0] dark:bg-[#0a0e17]">
        <AdminHeader
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          isMobileMenuOpen={isMobileMenuOpen}
          onLogout={handleExit}
        />
        <main className="flex-1 overflow-y-auto min-w-0 bg-[#e2e8f0] dark:bg-[#0a0e17]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
