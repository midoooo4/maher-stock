'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { stockService } from '@/lib/db/stock-service';
import { StockMovement } from '@/lib/supabase/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { exportToCSV } from '@/lib/export/pdf-csv';
import {
  Search,
  FileSpreadsheet,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
} from 'lucide-react';

export default function ManagerMovementsPage() {
  const { t } = useTranslation();
  const [movements] = useState<StockMovement[]>(stockService.getStockMovements());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = movements.filter((m) => {
    const matchesSearch =
      m.movement_number.toLowerCase().includes(search.toLowerCase()) ||
      (m.product?.name_fr || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.notes || '').toLowerCase().includes(search.toLowerCase());
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

    exportToCSV('complexe-maher-mouvements-economat', exportData, [
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

  const totalEntries = movements
    .filter((m) => m.movement_type === 'ENTRY' || m.movement_type === 'ADJUSTMENT_ADD')
    .reduce((s, m) => s + m.quantity, 0);

  const totalExits = movements
    .filter((m) => m.movement_type === 'EXIT' || m.movement_type === 'ADJUSTMENT_SUB')
    .reduce((s, m) => s + m.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">
            Registre des Mouvements de Stock
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Historique chronologique et immuable de chaque variation physique à l&apos;économat
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          variant="outline"
          size="sm"
          leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
        >
          Exporter en CSV
        </Button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
            <ArrowUpCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Cumul réceptions</p>
            <p className="text-lg font-bold text-emerald-700">+{totalEntries.toFixed(1)} unités</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 flex-shrink-0">
            <ArrowDownCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Cumul sorties</p>
            <p className="text-lg font-bold text-rose-700">-{totalExits.toFixed(1)} unités</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 flex-shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total opérations</p>
            <p className="text-lg font-bold text-brand-navy">{movements.length} lignes</p>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
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
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange text-gray-700 font-medium"
            >
              <option value="all">Tous les types de mouvement</option>
              <option value="ENTRY">📥 Entrée / Réception marchandise</option>
              <option value="EXIT">📤 Sortie / Remise confirmée</option>
              <option value="ADJUSTMENT_ADD">➕ Ajustement positif</option>
              <option value="ADJUSTMENT_SUB">➖ Ajustement négatif</option>
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
                        {m.total_cost.toFixed(2)} {t('currency')}
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
