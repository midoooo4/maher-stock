'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { stockService } from '@/lib/db/stock-service';
import { InventorySession } from '@/lib/supabase/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CheckSquare, AlertTriangle, Eye, Calendar, Plus } from 'lucide-react';

export default function AdminInventoryPage() {
  const { t } = useTranslation();
  const [sessions] = useState<InventorySession[]>(stockService.getInventorySessions());
  const [selectedSession, setSelectedSession] = useState<InventorySession | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">
            {t('nav_inventory')} (Historique des Contrôles Physiques)
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Sessions d'inventaires périodiques, comptage réel et détection des écarts
          </p>
        </div>
      </div>

      {/* Sessions Grid */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">N° Session</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Date de début</th>
                <th className="py-3 px-4 text-center">Articles comptés</th>
                <th className="py-3 px-4 text-center">Écarts détectés</th>
                <th className="py-3 px-4 text-right">Valeur Écart</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Aucune session d'inventaire clôturée. Les sessions sont démarrées par le responsable économat.
                  </td>
                </tr>
              ) : (
                sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-navy">
                      {sess.session_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">
                      {sess.session_type}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(sess.started_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      {sess.total_items_counted}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sess.total_anomalies > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {sess.total_anomalies} anomalie(s)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-700">
                      {sess.total_loss_value > 0 ? `-${sess.total_loss_value.toFixed(2)} ${t('currency')}` : `0.00 ${t('currency')}`}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {sess.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedSession(sess)}
                        className="p-1.5 text-gray-400 hover:text-brand-navy rounded-lg hover:bg-slate-100"
                        title="Consulter la feuille de comptage"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Session details modal */}
      {selectedSession && (
        <Modal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          title={`Feuille d'inventaire ${selectedSession.session_number}`}
          subtitle={`Type: ${selectedSession.session_type} • Clôturé le: ${selectedSession.completed_at ? new Date(selectedSession.completed_at).toLocaleString() : 'En cours'}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-2.5">Produit</th>
                    <th className="p-2.5 text-center">Théorique</th>
                    <th className="p-2.5 text-center">Compté</th>
                    <th className="p-2.5 text-center">Écart</th>
                    <th className="p-2.5">Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedSession.items?.map((it) => (
                    <tr key={it.id} className={it.has_anomaly ? 'bg-amber-50/40' : ''}>
                      <td className="p-2.5 font-bold text-brand-navy">{it.product_id}</td>
                      <td className="p-2.5 text-center font-medium">{it.theoretical_stock}</td>
                      <td className="p-2.5 text-center font-bold">{it.physical_count}</td>
                      <td className="p-2.5 text-center font-bold">
                        <span className={it.difference < 0 ? 'text-rose-700' : it.difference > 0 ? 'text-emerald-700' : 'text-gray-400'}>
                          {it.difference > 0 ? `+${it.difference}` : it.difference}
                        </span>
                      </td>
                      <td className="p-2.5 text-[11px] text-gray-500">{it.justification || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedSession(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
