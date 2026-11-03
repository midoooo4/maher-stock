'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { stockService } from '@/lib/db/stock-service';
import { AuditLog } from '@/lib/supabase/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { exportToCSV } from '@/lib/export/pdf-csv';
import {
  ShieldAlert,
  Search,
  FileSpreadsheet,
  RefreshCw,
  Users,
  UserCheck,
  Crown,
  User,
} from 'lucide-react';

type RoleFilter = 'ALL' | 'EMPLOYEE' | 'RESPONSABLE' | 'ADMIN';

const ACTION_COLORS: Record<string, string> = {
  REQUEST_CREATE:   'bg-blue-100 text-blue-700 border-blue-200',
  REQUEST_APPROVE:  'bg-green-100 text-green-700 border-green-200',
  REQUEST_REJECT:   'bg-red-100 text-red-700 border-red-200',
  REQUEST_DELIVER:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  REQUEST_CANCEL:   'bg-gray-100 text-gray-600 border-gray-200',
  PRODUCT_CREATE:   'bg-purple-100 text-purple-700 border-purple-200',
  PRODUCT_UPDATE:   'bg-indigo-100 text-indigo-700 border-indigo-200',
  STOCK_ENTRY:      'bg-teal-100 text-teal-700 border-teal-200',
  CATEGORY_CREATE:  'bg-orange-100 text-orange-700 border-orange-200',
  CATEGORY_UPDATE:  'bg-orange-100 text-orange-700 border-orange-200',
  CATEGORY_DELETE:  'bg-red-100 text-red-700 border-red-200',
  SUPPLIER_CREATE:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  SUPPLIER_UPDATE:  'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  EMPLOYEE:    <User className="w-3 h-3" />,
  RESPONSABLE: <UserCheck className="w-3 h-3" />,
  ADMIN:       <Crown className="w-3 h-3" />,
};

const ROLE_COLORS: Record<string, string> = {
  EMPLOYEE:    'text-blue-600',
  RESPONSABLE: 'text-emerald-600',
  ADMIN:       'text-brand-orange',
};

export default function AdminAuditLogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      await stockService.syncWithSupabase();
    } catch (_) { /* ignore */ }
    setLogs([...stockService.getAuditLogs()]);
    setLastSync(new Date());
    setSyncing(false);
  }, []);

  // Initial load + sync
  useEffect(() => {
    setLogs([...stockService.getAuditLogs()]);
    refresh();
  }, [refresh]);

  // Listen for realtime updates from stockService
  useEffect(() => {
    const handler = () => {
      setLogs([...stockService.getAuditLogs()]);
      setLastSync(new Date());
    };
    window.addEventListener('maher_stock_updated', handler);
    return () => window.removeEventListener('maher_stock_updated', handler);
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => { refresh(); }, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const filteredLogs = logs.filter((l) => {
    const matchesRole =
      roleFilter === 'ALL' ||
      (l.user_role && l.user_role.toUpperCase() === roleFilter);
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      l.action.toLowerCase().includes(q) ||
      (l.user_name && l.user_name.toLowerCase().includes(q)) ||
      (l.notes && l.notes.toLowerCase().includes(q)) ||
      (l.entity_type && l.entity_type.toLowerCase().includes(q));
    return matchesRole && matchesSearch;
  });

  const handleExportCSV = () => {
    const exportData = filteredLogs.map((l) => ({
      date: new Date(l.created_at).toLocaleString('fr-FR'),
      user: l.user_name || 'Système',
      role: l.user_role || '',
      action: l.action,
      entity: l.entity_type,
      notes: l.notes || '',
    }));
    exportToCSV('complexe-maher-journal-securite-audit', exportData, [
      { key: 'date', label: 'Horodatage' },
      { key: 'user', label: 'Utilisateur' },
      { key: 'role', label: 'Rôle' },
      { key: 'action', label: 'Action' },
      { key: 'entity', label: 'Entité' },
      { key: 'notes', label: 'Détails & Modifications' },
    ]);
  };

  const ROLE_BUTTONS: { key: RoleFilter; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'ALL',        label: 'Tous',        icon: <Users className="w-3.5 h-3.5" />, count: logs.length },
    { key: 'EMPLOYEE',   label: 'Employés',    icon: <User className="w-3.5 h-3.5" />,  count: logs.filter(l => l.user_role?.toUpperCase() === 'EMPLOYEE').length },
    { key: 'RESPONSABLE',label: 'Responsable', icon: <UserCheck className="w-3.5 h-3.5" />, count: logs.filter(l => l.user_role?.toUpperCase() === 'RESPONSABLE').length },
    { key: 'ADMIN',      label: 'Admin',       icon: <Crown className="w-3.5 h-3.5" />, count: logs.filter(l => l.user_role?.toUpperCase() === 'ADMIN').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brand-orange" />
            <span>{t('nav_audit')}</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium flex items-center gap-2 mt-0.5">
            {t('audit_subtitle')}
            {lastSync && (
              <span className="text-emerald-600">
                · Sync {lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={refresh}
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />}
            disabled={syncing}
          >
            {syncing ? 'Sync...' : 'Actualiser'}
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Role Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {ROLE_BUTTONS.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setRoleFilter(btn.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              roleFilter === btn.key
                ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-navy hover:text-brand-navy'
            }`}
          >
            {btn.icon}
            {btn.label}
            <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              roleFilter === btn.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {btn.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par action, utilisateur, entité ou mot-clé..."
            className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>
      </Card>

      {/* Stats bar */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <ShieldAlert className="w-3.5 h-3.5 text-brand-orange" />
        <span>
          <span className="font-bold text-brand-navy">{filteredLogs.length}</span> entrée(s) affichée(s)
          {roleFilter !== 'ALL' && <span> · Filtre : <span className="font-bold">{roleFilter}</span></span>}
        </span>
      </div>

      {/* Logs Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Horodatage</th>
                <th className="py-3 px-4">Utilisateur & Rôle</th>
                <th className="py-3 px-4">Action Sécurisée</th>
                <th className="py-3 px-4">Entité / Cible</th>
                <th className="py-3 px-4">Description de l'opération</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <ShieldAlert className="w-8 h-8 opacity-30" />
                      <p className="text-sm font-medium">Aucune entrée dans le journal d&apos;audit</p>
                      <p className="text-xs">Les actions de tous les utilisateurs apparaîtront ici en temps réel.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => {
                  const actionColor = ACTION_COLORS[l.action] || 'bg-slate-100 text-slate-600 border-slate-200';
                  const roleColor = ROLE_COLORS[l.user_role?.toUpperCase() || ''] || 'text-gray-500';
                  const roleIcon = ROLE_ICONS[l.user_role?.toUpperCase() || ''];
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                        {new Date(l.created_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-brand-navy">{l.user_name || 'Système'}</p>
                          <span className={`flex items-center gap-1 text-[10px] font-bold uppercase mt-0.5 ${roleColor}`}>
                            {roleIcon}
                            {l.user_role || 'Auto'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${actionColor}`}>
                          {l.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-500">
                        {l.entity_type || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-medium max-w-xs truncate">
                        {l.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
