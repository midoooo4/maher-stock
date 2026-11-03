'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { stockService } from '@/lib/db/stock-service';
import { StockEntry } from '@/lib/supabase/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { exportToCSV, exportToPDF } from '@/lib/export/pdf-csv';
import {
  ArrowDownToLine,
  Search,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Receipt,
  ExternalLink,
  Package,
} from 'lucide-react';

export default function AdminEntriesPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [selectedInvoicePhoto, setSelectedInvoicePhoto] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      await stockService.syncWithSupabase();
    } catch (_) { /* ignore */ }
    setEntries(stockService.getStockEntries());
    setLastSync(new Date());
    setSyncing(false);
  }, []);

  // Initial load + immediate Supabase sync
  useEffect(() => {
    setEntries(stockService.getStockEntries());
    refresh();
  }, [refresh]);

  // Listen for realtime updates from Supabase and local storage
  useEffect(() => {
    const handleUpdate = () => {
      setEntries(stockService.getStockEntries());
      setLastSync(new Date());
    };
    window.addEventListener('maher_stock_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Auto sync every 20 seconds
    const interval = setInterval(() => {
      refresh();
    }, 20000);

    return () => {
      window.removeEventListener('maher_stock_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [refresh]);

  const filteredEntries = entries.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.entry_number.toLowerCase().includes(q) ||
      (e.product?.name_fr && e.product.name_fr.toLowerCase().includes(q)) ||
      (e.product?.code && e.product.code.toLowerCase().includes(q)) ||
      (e.invoice_number && e.invoice_number.toLowerCase().includes(q)) ||
      (e.supplier?.name && e.supplier.name.toLowerCase().includes(q)) ||
      (e.notes && e.notes.toLowerCase().includes(q))
    );
  });

  const totalSpent = filteredEntries.reduce((acc, e) => acc + (Number(e.total_price) || 0), 0);
  const totalItems = filteredEntries.reduce((acc, e) => acc + (Number(e.quantity) || 0), 0);

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
      `${Number(e.unit_price).toFixed(2)} MAD`,
      `${Number(e.total_price).toFixed(2)} MAD`,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-brand-orange" />
            <span>{t('nav_entries')} (Livraisons Fournisseurs)</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium flex items-center gap-2 mt-0.5">
            <span>Traçabilité des réceptions, factures d&apos;achat et mise à jour du PMP</span>
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 bg-gradient-to-br from-white to-amber-50/40 border-amber-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Réceptions</p>
          <p className="text-2xl font-black text-brand-navy mt-1">{filteredEntries.length}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Bons de livraison enregistrés</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-white to-emerald-50/40 border-emerald-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Volume Reçu</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{totalItems.toFixed(1)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Unités physiques ajoutées au stock</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-white to-blue-50/40 border-blue-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Valeur Totale Achetée</p>
          <p className="text-2xl font-black text-brand-orange mt-1">
            {totalSpent.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Valorisation PMP cumulée</p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par n° de bon, nom ou code produit, facture, fournisseur..."
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
                <th className="py-3 px-4">Produit Réceptionné</th>
                <th className="py-3 px-4 text-center">Quantité Reçue</th>
                <th className="py-3 px-4 text-right">Prix Unitaire</th>
                <th className="py-3 px-4 text-right">Total Achat</th>
                <th className="py-3 px-4">Fournisseur & Facture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <ArrowDownToLine className="w-8 h-8 opacity-30 text-brand-orange" />
                      <p className="text-sm font-semibold text-gray-600">Aucune réception de stock enregistrée</p>
                      <p className="text-xs">Les livraisons enregistrées par le responsable ou l&apos;admin apparaîtront ici automatiquement.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-navy whitespace-nowrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                        {e.entry_number}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(e.received_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-brand-navy">{e.product?.name_fr || 'Produit'}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{e.product?.code || '—'}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                        +{e.quantity} {e.product?.unit || 'u'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-gray-600">
                      {Number(e.unit_price).toFixed(2)} MAD
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-brand-navy">
                      {Number(e.total_price).toFixed(2)} MAD
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <p className="font-semibold text-gray-800">{e.supplier?.name || 'Fournisseur direct'}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {e.invoice_number && (
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                              Facture: {e.invoice_number}
                            </span>
                          )}
                          {e.invoice_photo_url && (
                            <button
                              type="button"
                              onClick={() => setSelectedInvoicePhoto(e.invoice_photo_url || null)}
                              className="text-[10px] text-brand-orange hover:underline flex items-center gap-0.5 font-semibold"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>Voir photo</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoice Photo Modal */}
      {selectedInvoicePhoto && (
        <Modal
          isOpen={!!selectedInvoicePhoto}
          onClose={() => setSelectedInvoicePhoto(null)}
          title="Photo de Facture / Bon de Livraison"
          maxWidth="md"
        >
          <div className="p-2 flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedInvoicePhoto}
              alt="Facture"
              className="max-h-[70vh] w-auto rounded-xl object-contain shadow-md"
            />
            <div className="mt-4 flex justify-end w-full">
              <Button variant="outline" size="sm" onClick={() => setSelectedInvoicePhoto(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
