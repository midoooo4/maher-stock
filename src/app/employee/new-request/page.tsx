'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Trash2, Send, Search, X, ChevronDown, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { stockService } from '@/lib/db/stock-service';
import { Product } from '@/lib/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

const DEPARTMENTS = [
  'Cuisine',
  'Cafe',
  'Restaurant / Salle',
  'Piscine',
  'Entretien',
  'Autre',
];

const REASONS = [
  'Consommation quotidienne de service',
  'Réapprovisionnement préventif du poste',
  'Commande client spéciale / banquet',
  'Remplacement produit épuisé',
  'Entretien et hygiène des locaux / bassin',
  'Autre motif spécifique',
];

interface FormItem {
  id: string;
  product: Product | null;
  quantity: number;
}

function ProductSelector({
  products,
  selected,
  onSelect,
  onClear,
}: {
  products: Product[];
  selected: Product | null;
  onSelect: (p: Product) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = products.filter(
    (p) =>
      !search ||
      p.name_fr.toLowerCase().includes(search.toLowerCase()) ||
      p.name_ar.includes(search) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    return (
      <div className="flex items-center justify-between p-3 border border-emerald-300 bg-emerald-50/70 rounded-xl">
        <div className="min-w-0 pr-2">
          <p className="text-xs sm:text-sm font-bold text-emerald-900 truncate">{selected.name_fr}</p>
          <p className="text-[11px] text-emerald-700 font-medium">
            Réf: {selected.code} · Emplacement: {selected.location || 'Économat'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="p-1.5 text-emerald-700 hover:text-rose-600 rounded-lg hover:bg-white/80 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-500 hover:border-brand-orange transition-colors bg-white shadow-sm"
      >
        <span className="flex items-center gap-2">
          <Package className="h-4 w-4 text-brand-orange" />
          Sélectionner un produit dans l&apos;économat...
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrer par nom ou code..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-orange"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Aucun produit trouvé</p>
            ) : (
              filtered.map((p) => {
                const available = Math.max(0, p.physical_stock - p.reserved_stock);
                const isOut = available <= 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (!isOut) {
                        onSelect(p);
                        setOpen(false);
                        setSearch('');
                      }
                    }}
                    disabled={isOut}
                    className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors ${
                      isOut ? 'opacity-40 cursor-not-allowed bg-slate-50/50' : 'cursor-pointer'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-xs sm:text-sm text-brand-navy truncate">{p.name_fr}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{p.code}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isOut ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isOut ? 'Rupture' : `${available.toFixed(1)} ${p.unit}`}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NewRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [department, setDepartment] = useState(user?.department || 'Cuisine');
  const [reason, setReason] = useState(REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<FormItem[]>([
    { id: 'item-initial-1', product: null, quantity: 1 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const activeProducts = stockService.getProducts().filter((p) => p.is_active);
    setProducts(activeProducts);

    const queryProductId = searchParams.get('product');
    if (queryProductId) {
      const match = activeProducts.find((p) => p.id === queryProductId);
      if (match) {
        setItems([{ id: 'item-prefill-1', product: match, quantity: 1 }]);
      }
    }
  }, [searchParams]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { id: `item-${Date.now()}-${Math.random()}`, product: null, quantity: 1 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateProduct = (id: string, prod: Product | null) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, product: prod } : i))
    );
  };

  const handleUpdateQty = (id: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(0.1, qty) } : i))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) {
      setErrorMsg('Session expirée. Veuillez vous reconnecter.');
      return;
    }

    const selectedProducts = items.filter((i) => i.product !== null);
    if (selectedProducts.length === 0) {
      setErrorMsg('Veuillez sélectionner au moins un produit pour votre demande.');
      return;
    }

    // Check for duplicate products
    const productIds = selectedProducts.map((i) => i.product!.id);
    if (new Set(productIds).size !== productIds.length) {
      setErrorMsg('Vous avez sélectionné le même produit plusieurs fois. Regroupez la quantité sur une seule ligne.');
      return;
    }

    const finalReason = reason === 'Autre motif spécifique' ? customReason.trim() : reason;
    if (!finalReason) {
      setErrorMsg('Veuillez préciser le motif de sortie de stock.');
      return;
    }

    setIsSubmitting(true);
    try {
      stockService.createStockRequest({
        employeeId: user.id,
        employeeName: user.full_name,
        department,
        items: selectedProducts.map((it) => ({
          productId: it.product!.id,
          quantity: it.quantity,
        })),
        reason: finalReason,
        notes: notes.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/employee/my-requests');
      }, 1500);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la création de la demande.');
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
          <CheckCircle2 className="w-10 h-10 animate-bounce" />
        </div>
        <h2 className="text-xl font-bold text-brand-navy">Demande envoyée avec succès !</h2>
        <p className="text-xs text-gray-500 font-medium">
          Le responsable de l&apos;économat a été notifié. La réservation sera effectuée dès sa validation.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-navy tracking-tight">
          Nouvelle Demande de Sortie Économat
        </h1>
        <p className="text-xs text-gray-500 font-medium">
          Toute sortie physique de stock nécessite l&apos;autorisation formelle du responsable économat.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-700 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Destination & Reason */}
        <Card className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block uppercase tracking-wider">
                Service Demandeur *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-brand-orange"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block uppercase tracking-wider">
                Motif de Sortie *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-brand-orange"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {reason === 'Autre motif spécifique' && (
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block uppercase tracking-wider">
                Précisez le motif *
              </label>
              <Input
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Explication claire du besoin..."
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block uppercase tracking-wider">
              Commentaire / Instruction particulière (optionnel)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: besoin urgent pour service de midi..."
              rows={2}
            />
          </div>
        </Card>

        {/* Product Items */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-brand-navy flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-orange" />
              Articles demandés ({items.length})
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              leftIcon={<Plus className="w-3.5 h-3.5 text-brand-orange" />}
            >
              Ajouter une ligne
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-50/70 border border-gray-200 rounded-2xl space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-brand-navy uppercase tracking-wider">
                    Article #{idx + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-gray-400 hover:text-rose-600 p-1 transition-colors"
                      title="Supprimer la ligne"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <ProductSelector
                  products={products}
                  selected={item.product}
                  onSelect={(p) => handleUpdateProduct(item.id, p)}
                  onClear={() => handleUpdateProduct(item.id, null)}
                />

                {item.product && (
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex-1">
                      <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                        Quantité souhaitée :
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step={item.product.unit === 'kg' || item.product.unit === 'l' ? '0.5' : '1'}
                          min="0.1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQty(item.id, parseFloat(e.target.value) || 0)}
                          className="w-28 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-bold text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-orange text-center"
                        />
                        <span className="text-xs font-bold text-gray-500 uppercase">
                          {item.product.unit}
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-gray-500">
                      <p>Disponible en réserve :</p>
                      <p className="font-bold text-emerald-700">
                        {(item.product.physical_stock - item.product.reserved_stock).toFixed(1)}{' '}
                        {item.product.unit}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/employee/dashboard')}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Send className="w-4 h-4" />}
            className="px-6"
          >
            Transmettre la demande à l&apos;économat
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <NewRequestForm />
    </Suspense>
  );
}
