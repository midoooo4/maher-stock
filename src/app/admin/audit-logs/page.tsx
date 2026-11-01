'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { stockService } from '@/lib/db/stock-service';
import { AuditLog } from '@/lib/supabase/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { exportToCSV } from '@/lib/export/pdf-csv';
import { ShieldAlert, Search, Lock, User, FileSpreadsheet } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const { t } = useTranslation();
  const [logs] = useState<AuditLog[]>(stockService.getAuditLogs());
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter((l) => {
    return (
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.user_name && l.user_name.toLowerCase().includes(search.toLowerCase())) ||
      (l.notes && l.notes.toLowerCase().includes(search.toLowerCase()))
    );
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brand-orange" />
            <span>{t('nav_audit')}</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            {t('audit_subtitle')}
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          variant="outline"
          size="sm"
          leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
        >
          Export CSV Sécurisé
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par action, utilisateur ou mot-clé..."
            className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>
      </Card>

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
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    Aucune entrée dans le journal d'audit.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
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
                        <span className="text-[10px] font-bold text-brand-orange uppercase">
                          {l.user_role || 'Auto'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-navy">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-500">
                      {l.entity_type}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 font-medium">
                      {l.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
