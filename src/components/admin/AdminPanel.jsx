import React, { useState } from 'react';
import AdminLogin from './AdminLogin';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import DashboardOverview from './DashboardOverview';
import InventoryManager from './InventoryManager';
import ReservationManager from './ReservationManager';
import TransactionHistory from './TransactionHistory';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const handleLock = () => {
    setIsAuthenticated(false);
    setActiveTab('dashboard');
    setIsMobileMenuOpen(false);
  };
  if (!isAuthenticated) {
    return <AdminLogin onAuthenticated={setIsAuthenticated} />;
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
      default:
        return <DashboardOverview onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="admin-shell h-screen w-screen bg-[#060b14] text-slate-100 flex overflow-hidden relative select-none">
      {/* Sidebar: Persistent on Desktop, Slide-over Drawer on Mobile */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLock={handleLock}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <main className="flex-1 overflow-y-auto min-w-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
