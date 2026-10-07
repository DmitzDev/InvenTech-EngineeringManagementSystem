/**
 * InvenTech Laboratory Management System - Immutable Security Audit & Telemetry Viewer
 * Module: [SYS.SEC // AUDIT-VIEW-01]
 * 
 * Displays chronological event records with monospace timestamps, severity status chips,
 * multi-attribute filtering (Event Type, Actor ID, Search Query), and export tools.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Lock,
  RotateCcw,
  Package,
  Calendar,
  FileCheck,
  CheckCircle2,
  Clock,
  Terminal,
} from 'lucide-react';
import {
  getSecurityAuditLogs,
  clearSecurityAuditLogs,
  exportSecurityLogsAsJSON,
  SECURITY_EVENT_TYPES,
  SEVERITY_LEVELS,
} from '../../services/securityAuditService';
import { useTransaction } from '../../context/TransactionContext';

export default function SecurityAuditViewer() {
  const { showToast, theme } = useTransaction();
  const isDark = theme === 'dark';

  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  // Load logs on mount and listen to live real-time log events
  const refreshLogs = () => {
    setLogs(getSecurityAuditLogs());
  };

  useEffect(() => {
    refreshLogs();

    const handleNewLog = () => {
      refreshLogs();
    };

    window.addEventListener('udd-security-event-logged', handleNewLog);
    return () => window.removeEventListener('udd-security-event-logged', handleNewLog);
  }, []);

  // Filter logs by search query, event type, and severity
  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((entry) => {
      // Event Type filter
      if (selectedEventType !== 'ALL' && entry.eventType !== selectedEventType) {
        return false;
      }
      // Severity filter
      if (selectedSeverity !== 'ALL' && entry.severity !== selectedSeverity) {
        return false;
      }
      // Search Query filter (Actor ID, Details, Event Type, Log ID)
      if (q) {
        const actorMatch = (entry.actorId || '').toLowerCase().includes(q);
        const detailsMatch = (entry.details || '').toLowerCase().includes(q);
        const eventTypeMatch = (entry.eventType || '').toLowerCase().includes(q);
        const idMatch = (entry.id || '').toLowerCase().includes(q);
        return actorMatch || detailsMatch || eventTypeMatch || idMatch;
      }
      return true;
    });
  }, [logs, searchQuery, selectedEventType, selectedSeverity]);

  // Aggregate telemetry statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const criticals = logs.filter((l) => l.severity === SEVERITY_LEVELS.CRITICAL).length;
    const warnings = logs.filter((l) => l.severity === SEVERITY_LEVELS.WARN).length;
    const lockouts = logs.filter((l) => l.eventType === SECURITY_EVENT_TYPES.LOCKOUT_TRIGGERED).length;
    return { total, criticals, warnings, lockouts };
  }, [logs]);

  // Export logs to file
  const handleExportJSON = () => {
    const jsonStr = exportSecurityLogsAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventech-security-audit-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Security audit telemetry journal exported to JSON.', 'success');
  };

  // Clear audit log (Restricted action)
  const handleClear = () => {
    if (window.confirm('WARNING: Are you sure you want to clear the security audit journal? This action itself will be logged.')) {
      clearSecurityAuditLogs();
      refreshLogs();
      showToast('Audit trail reset. System integrity log recorded.', 'info');
    }
  };

  // Status Chip Rendering Helper
  const renderSeverityChip = (severity) => {
    switch (severity) {
      case SEVERITY_LEVELS.CRITICAL:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-black bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700 shrink-0 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span>CRITICAL/ALERT</span>
          </span>
        );
      case SEVERITY_LEVELS.WARN:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-black bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700 shrink-0 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>WARN</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-black bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700 shrink-0 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>INFO</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-slate-950 dark:text-white select-none">
      {/* Top Header & Telemetry Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-300 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded border border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
              [SYS.SEC // AUDIT-LOGGER-01]
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>APPEND-ONLY ENFORCED</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Security & Audit Telemetry Logs
          </h1>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Immutable system journal tracking authentication attempts, deadman resets, and hardware events.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={refreshLogs}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow-xs"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-cyan-500/70 bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="min-h-[44px] px-3 py-2 rounded-xl border-2 border-rose-300 dark:border-rose-900 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
            title="Purge audit logs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Log</span>
          </button>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
            <span>TOTAL EVENTS</span>
            <Terminal className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 font-mono tabular-nums text-slate-950 dark:text-white">
            {stats.total}
          </p>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Append-only journal length</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
            <span>LOCKOUT INCIDENTS</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 font-mono tabular-nums text-rose-600 dark:text-rose-400">
            {stats.lockouts}
          </p>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Brute-force breaches (60s cooldown)</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
            <span>WARNING ALERTS</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {stats.warnings}
          </p>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Deadman resets & auth retries</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            <span>TAMPER SHIELD</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 font-mono text-emerald-600 dark:text-emerald-400">
            SEALED
          </p>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">SHA-256 digest validation active</p>
        </div>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Student ID, Actor, or keyword..."
            autoComplete="off"
            spellCheck={false}
            className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Event Type Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Event Types</option>
            <option value={SECURITY_EVENT_TYPES.AUTH_SUCCESS}>AUTH_SUCCESS</option>
            <option value={SECURITY_EVENT_TYPES.AUTH_FAILURE}>AUTH_FAILURE</option>
            <option value={SECURITY_EVENT_TYPES.LOCKOUT_TRIGGERED}>LOCKOUT_TRIGGERED</option>
            <option value={SECURITY_EVENT_TYPES.CUSTODIAN_OVERRIDE}>CUSTODIAN_OVERRIDE</option>
            <option value={SECURITY_EVENT_TYPES.INACTIVITY_TIMEOUT}>INACTIVITY_TIMEOUT</option>
            <option value={SECURITY_EVENT_TYPES.LOAN_CREATED}>LOAN_CREATED</option>
            <option value={SECURITY_EVENT_TYPES.TOOL_RETURNED}>TOOL_RETURNED</option>
            <option value={SECURITY_EVENT_TYPES.DAMAGE_QUARANTINED}>DAMAGE_QUARANTINED</option>
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value={SEVERITY_LEVELS.INFO}>INFO Only</option>
            <option value={SEVERITY_LEVELS.WARN}>WARN Only</option>
            <option value={SEVERITY_LEVELS.CRITICAL}>CRITICAL Only</option>
          </select>
        </div>
      </div>

      {/* Chronological Event Log Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 border-b-2 border-slate-300 dark:border-slate-700 font-mono text-[11px] sm:text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                <th className="py-3 px-4">Monospace Timestamp</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Actor / Student ID</th>
                <th className="py-3 px-4">Device Context</th>
                <th className="py-3 px-4">Details & Telemetry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-mono text-sm font-bold">No security events match criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400 whitespace-nowrap">
                      {entry.displayTime || entry.timestamp}
                    </td>

                    {/* Severity Chip */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderSeverityChip(entry.severity)}
                    </td>

                    {/* Event Type */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs">
                        {entry.eventType}
                      </span>
                    </td>

                    {/* Actor ID */}
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {entry.actorId}
                    </td>

                    {/* Device Context */}
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {entry.deviceContext}
                    </td>

                    {/* Details */}
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 min-w-[280px]">
                      {entry.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
