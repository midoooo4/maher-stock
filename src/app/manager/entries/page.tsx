'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { stockService } from '@/lib/db/stock-service';
import { Product, Supplier, StockEntry } from '@/lib/supabase/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ArrowDownToLine, Plus, CheckCircle2, ShieldAlert, Receipt } from 'lucide-react';

export default function ManagerEntriesPage() {
  const { t } = useTranslation();
  const { user, role } = useAuth();

  const [entries, setEntries] = useState<StockEntry[]>(stockService.getStockEntries());
  const [products, setProducts] = useState<Product[]>(stockService.getProducts());
  const [suppliers, setSuppliers] = useState<Supplier[]>(stockService.getSuppliers());

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    product_id: products[0]?.id || '',
    quantity: 10,
    unit_price: 50,
    supplier_id: suppliers[0]?.id || '',
    invoice_number: '',
    invoice_photo_url: '',
    notes: '',
  });

  const refreshAll = () => {
    setEntries(stockService.getStockEntries());
    setProducts(stockService.getProducts());
    setSuppliers(stockService.getSuppliers());
  };

  useEffect(() => {
    refreshAll();
    stockService.syncWithSupabase().then(() => refreshAll());

    const handleUpdate = () => refreshAll();
    window.addEventListener('maher_stock_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('maher_stock_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const selectedProduct = products.find((p) => p.id === formData.product_id);

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg(null);

    try {
      stockService.receiveStock({
        productId: formData.product_id,
        quantity: Number(formData.quantity),
        unitPrice: Number(formData.unit_price),
        supplierId: formData.supplier_id || undefined,
        invoiceNumber: formData.invoice_number || undefined,
        invoicePhotoUrl: formData.invoice_photo_url || undefined,
        notes: formData.notes || undefined,
        userId: user.id,
        userName: user.full_name,
        userRole: role || 'RESPONSABLE',
      });

      setIsAddOpen(false);
      setSuccessMsg(t('entry_success'));
      refreshAll();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t('error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-brand-orange" />
            <span>{t('entry_new')}</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Réception des livraisons, mise à jour instantanée du stock physique et calcul automatique du PMP
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {t('entry_new')}
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Receptions Table */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Journal des livraisons enregistrées</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">N° Réception</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Produit</th>
                <th className="py-3 px-4 text-center">Quantité Reçue</th>
                <th className="py-3 px-4 text-right">Prix Achat</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4">Fournisseur & Facture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Aucune livraison enregistrée pour le moment.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-navy">
                      {e.entry_number}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(e.received_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-brand-navy">{e.product?.name_fr}</p>
                      <span className="text-[10px] text-gray-400 font-mono">{e.product?.code}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                      +{e.quantity} {e.product?.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right">{e.unit_price.toFixed(2)} {t('currency')}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-brand-navy">
                      {e.total_price.toFixed(2)} {t('currency')}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-gray-800">{e.supplier?.name || 'Fournisseur'}</p>
                      {e.invoice_number && (
                        <span className="text-[10px] text-gray-500 font-mono">Facture: {e.invoice_number}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Reception Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Enregistrer une réception de marchandise"
        subtitle="Entrée en stock chambre économat Complexe Maher"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateEntry} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Produit réceptionné
            </label>
            <select
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name_fr} ({p.code}) — Stock actuel: {p.physical_stock} {p.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={`Quantité reçue (${selectedProduct?.unit || 'Unité'})`}
              type="number"
              step="any"
              min="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              required
            />

            <Input
              label="Prix d'achat unitaire H.T. (MAD)"
              type="number"
              step="0.01"
              min="0"
              value={formData.unit_price}
              onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Fournisseur
              </label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.city})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Numéro de bon de livraison / Facture"
              value={formData.invoice_number}
              onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
              placeholder="Ex: BL-2026-889"
              leftIcon={<Receipt className="w-4 h-4" />}
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
            <strong>Calcul du PMP :</strong> Ancien stock ({selectedProduct?.physical_stock} {selectedProduct?.unit} à {selectedProduct?.purchase_price} MAD) + Nouvelle entrée ({formData.quantity} {selectedProduct?.unit} à {formData.unit_price} MAD).
            Le nouveau coût moyen unitaire sera automatiquement recalculé et appliqué.
          </div>

          <Textarea
            label="Commentaire de réception (Facultatif)"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Qualité du produit, date d'expiration vérifiée, état de l'emballage..."
          />

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirmer l'entrée en stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
