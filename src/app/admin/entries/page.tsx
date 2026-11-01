'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { stockService } from '@/lib/db/stock-service';
import { StockEntry } from '@/lib/supabase/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { exportToCSV, exportToPDF } from '@/lib/export/pdf-csv';
import { ArrowDownToLine, Search, FileSpreadsheet, FileText, Calendar } from 'lucide-react';

export default function AdminEntriesPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<StockEntry[]>(stockService.getStockEntries());
  const [search, setSearch] = useState('');

  const filteredEntries = entries.filter((e) => {
    return (
      e.entry_number.toLowerCase().includes(search.toLowerCase()) ||
      e.product?.name_fr.toLowerCase().includes(search.toLowerCase()) ||
      (e.invoice_number && e.invoice_number.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const totalSpent = filteredEntries.reduce((acc, e) => acc + e.total_price, 0);

  const handleExportCSV = () => {
    const exportData = filteredEntries.map((e) => ({
      entry_number: e.entry_number,
      date: new Date(e.received_at).toLocaleDateString('fr-FR'),
      product: e.product?.name_fr || '',
      quantity: e.quantity,
      unit: e.product?.unit || '',
      unit_price: e.unit_price,
      total_price: e.total_price,
      invoice_number: e.invoice_number || '',
      supplier: e.supplier?.name || '',
    }));

    exportToCSV('complexe-maher-receptions-stock', exportData, [
      { key: 'entry_number', label: 'N° Réception' },
      { key: 'date', label: 'Date' },
      { key: 'product', label: 'Produit' },
      { key: 'quantity', label: 'Quantité' },
      { key: 'unit', label: 'Unité' },
      { key: 'unit_price', label: 'Prix Unitaire (MAD)' },
      { key: 'total_price', label: 'Total (MAD)' },
      { key: 'invoice_number', label: 'N° Facture' },
      { key: 'supplier', label: 'Fournisseur' },
    ]);
  };

  const handleExportPDF = () => {
    const rows = filteredEntries.map((e) => [
      e.entry_number,
      new Date(e.received_at).toLocaleDateString('fr-FR'),
      e.product?.name_fr || '',
      `${e.quantity} ${e.product?.unit || ''}`,
      `${e.unit_price.toFixed(2)} MAD`,
      `${e.total_price.toFixed(2)} MAD`,
      e.invoice_number || 'N/A',
    ]);

    exportToPDF({
      title: 'Historique des Réceptions de Marchandises',
      subtitle: `Journal des livraisons fournisseurs - Total: ${totalSpent.toFixed(2)} MAD`,
      headers: ['N° Bon', 'Date', 'Produit', 'Quantité', 'P.U (MAD)', 'Total (MAD)', 'N° Facture'],
      rows,
      totals: { label: 'Montant Total Réceptionné', value: `${totalSpent.toFixed(2)} MAD` },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">
            {t('nav_entries')} (Livraisons Fournisseurs)
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Traçabilité des réceptions, factures d'achat et mise à jour du PMP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Export Excel
          </Button>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            size="sm"
            leftIcon={<FileText className="w-3.5 h-3.5 text-rose-600" />}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par n° de bon, produit ou numéro de facture..."
            className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>
      </Card>

      {/* Entries Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">N° Réception</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Produit</th>
                <th className="py-3 px-4 text-center">Quantité</th>
                <th className="py-3 px-4 text-right">Prix Unitaire</th>
                <th className="py-3 px-4 text-right">Total Achat</th>
                <th className="py-3 px-4">Fournisseur & Facture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Aucune réception enregistrée.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-navy">
                      {e.entry_number}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(e.received_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-brand-navy">{e.product?.name_fr || 'Produit'}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{e.product?.code}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                      +{e.quantity} {e.product?.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {e.unit_price.toFixed(2)} {t('currency')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-brand-navy">
                      {e.total_price.toFixed(2)} {t('currency')}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-gray-800">{e.supplier?.name || 'Fournisseur direct'}</p>
                        {e.invoice_number && (
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            Facture: {e.invoice_number}
                          </span>
                        )}
                      </div>
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
