'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { stockService } from '@/lib/db/stock-service';
import { StockMovement } from '@/lib/supabase/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { exportToCSV, exportToPDF } from '@/lib/export/pdf-csv';
import {
  ArrowLeftRight,
  Search,
  FileSpreadsheet,
  FileText,
  RefreshCw,
} from 'lucide-react';

export default function AdminMovementsPage() {
  const { t } = useTranslation();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      await stockService.syncWithSupabase();
    } catch (_) { /* ignore */ }
    setMovements(stockService.getStockMovements());
    setLastSync(new Date());
    setSyncing(false);
  }, []);

  useEffect(() => {
    setMovements(stockService.getStockMovements());
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleUpdate = () => {
      setMovements(stockService.getStockMovements());
      setLastSync(new Date());
    };
    window.addEventListener('maher_stock_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    const interval = setInterval(() => {
      refresh();
    }, 20000);

    return () => {
      window.removeEventListener('maher_stock_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [refresh]);

  const filtered = movements.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      m.movement_number.toLowerCase().includes(q) ||
      (m.product?.name_fr && m.product.name_fr.toLowerCase().includes(q)) ||
      (m.product?.code && m.product.code.toLowerCase().includes(q)) ||
      (m.notes && m.notes.toLowerCase().includes(q));
    const matchesType = typeFilter === 'all' || m.movement_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleExportCSV = () => {
    const exportData = filtered.map((m) => ({
      movement_number: m.movement_number,
      date: new Date(m.created_at).toLocaleString('fr-FR'),
      product: m.product?.name_fr || '',
      type: m.movement_type,
      quantity: m.quantity,
      unit: m.product?.unit || '',
      stock_before: m.stock_before,
      stock_after: m.stock_after,
      total_cost: m.total_cost,
      notes: m.notes || '',
    }));

    exportToCSV('complexe-maher-mouvements-stock', exportData, [
      { key: 'movement_number', label: 'N° Mouvement' },
      { key: 'date', label: 'Horodatage' },
      { key: 'product', label: 'Produit' },
      { key: 'type', label: 'Type' },
      { key: 'quantity', label: 'Quantité' },
      { key: 'unit', label: 'Unité' },
      { key: 'stock_before', label: 'Stock Avant' },
      { key: 'stock_after', label: 'Stock Après' },
      { key: 'total_cost', label: 'Valeur (MAD)' },
      { key: 'notes', label: 'Référence / Notes' },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-brand-orange" />
            <span>{t('nav_movements')} (Grand Livre de Stock)</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium flex items-center gap-2 mt-0.5">
            <span>Registre chronologique et immuable de chaque variation physique de stock</span>
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
            Export CSV / Excel
          </Button>
        </div>
      </div>

      {/* Filter */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par numéro de mouvement ou produit..."
              className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange text-gray-700"
            >
              <option value="all">Tous les types de mouvement</option>
              <option value="ENTRY">📥 Entrée / Réception marchandise</option>
              <option value="EXIT">📤 Sortie / Remise validée</option>
              <option value="ADJUSTMENT_ADD">➕ Ajustement inventaire positif</option>
              <option value="ADJUSTMENT_SUB">➖ Ajustement inventaire négatif</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Movements Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">N° Mouvement</th>
                <th className="py-3 px-4">Horodatage</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-4 text-center">Quantité</th>
                <th className="py-3 px-4 text-center">Stock Avant → Après</th>
                <th className="py-3 px-4 text-right">Valeur Estimée</th>
                <th className="py-3 px-4">Détails / Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Aucun mouvement enregistré.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const isEntry = m.movement_type === 'ENTRY' || m.movement_type === 'ADJUSTMENT_ADD';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-brand-navy">
                        {m.movement_number}
                      </td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.movement_type === 'ENTRY'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.movement_type === 'EXIT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {m.movement_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-brand-navy">
                        {m.product?.name_fr || 'Produit'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={isEntry ? 'text-emerald-700' : 'text-rose-700'}>
                          {isEntry ? `+${m.quantity}` : `-${m.quantity}`} {m.product?.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-gray-600">
                        {m.stock_before} → <span className="font-bold text-brand-navy">{m.stock_after}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-brand-navy">
                        {Number(m.total_cost || 0).toFixed(2)} {t('currency')}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-[11px] max-w-xs truncate">
                        {m.notes || 'Opération système'}
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
