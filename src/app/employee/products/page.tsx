'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Package, QrCode, Plus, Filter, X } from 'lucide-react';
import { stockService } from '@/lib/db/stock-service';
import { Product, Category } from '@/lib/supabase/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QRScannerModal } from '@/components/qr/QRScannerModal';

function getStockLevel(product: Product): 'ok' | 'low' | 'out' {
  const available = product.physical_stock - product.reserved_stock;
  if (available <= 0) return 'out';
  if (available <= product.min_stock) return 'low';
  return 'ok';
}

function StockLevelBadge({ level }: { level: 'ok' | 'low' | 'out' }) {
  const styles = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    low: 'bg-amber-50 text-amber-700 border-amber-200',
    out: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  const labels = { ok: 'Disponible', low: 'Stock faible', out: 'Rupture' };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

function EmployeeProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'low' | 'out'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    setProducts(stockService.getProducts().filter((p) => p.is_active));
    setCategories(stockService.getCategories().filter((c) => c.is_active));
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name_fr.toLowerCase().includes(search.toLowerCase()) ||
      p.name_ar.includes(search) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category_id === categoryFilter;
    const level = getStockLevel(p);
    const matchAvail =
      availabilityFilter === 'all' ||
      (availabilityFilter === 'available' && level !== 'out') ||
      level === availabilityFilter;
    return matchSearch && matchCat && matchAvail;
  });

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name_fr || '';

  const handleAddToRequest = (product: Product) => {
    router.push(`/employee/new-request?product=${product.id}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-navy">Catalogue Produits Économat</h1>
          <p className="text-xs text-gray-500 font-medium">{filtered.length} produit(s) affiché(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsScannerOpen(true)}
            leftIcon={<QrCode className="h-4 w-4 text-brand-orange" />}
          >
            Scanner QR
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="h-4 w-4 text-gray-500" />}
          >
            Filtres
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom français, arabe ou référence..."
          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange bg-white shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4 shadow-sm">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wider">Catégorie</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-brand-navy text-white border-brand-navy font-semibold'
                    : 'border-gray-200 text-gray-600 hover:border-brand-navy'
                }`}
              >
                Toutes
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    categoryFilter === cat.id
                      ? 'bg-brand-navy text-white border-brand-navy font-semibold'
                      : 'border-gray-200 text-gray-600 hover:border-brand-navy'
                  }`}
                >
                  {cat.name_fr}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wider">Disponibilité</label>
            <div className="flex gap-2">
              {[
                { val: 'all', label: 'Tous' },
                { val: 'available', label: 'Disponible' },
                { val: 'low', label: 'Stock faible' },
                { val: 'out', label: 'Rupture' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setAvailabilityFilter(opt.val as 'all' | 'available' | 'low' | 'out')}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    availabilityFilter === opt.val
                      ? 'bg-brand-orange text-white border-brand-orange font-semibold'
                      : 'border-gray-200 text-gray-600 hover:border-brand-orange'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Pills Slider */}
      {!showFilters && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
              categoryFilter === 'all'
                ? 'bg-brand-navy text-white border-brand-navy font-semibold'
                : 'border-gray-200 text-gray-600 hover:border-brand-navy bg-white'
            }`}
          >
            Toutes
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-brand-navy text-white border-brand-navy font-semibold'
                  : 'border-gray-200 text-gray-600 hover:border-brand-navy bg-white'
              }`}
            >
              {cat.name_fr}
            </button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-gray-600">Aucun produit trouvé</p>
          <p className="text-xs text-gray-400 mt-1">Essayez de modifier votre recherche ou vos filtres</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => {
            const level = getStockLevel(product);
            const available = Math.max(0, product.physical_stock - product.reserved_stock);
            return (
              <Card key={product.id} className="hover:shadow-md transition-shadow flex flex-col justify-between">
                <CardContent className="p-0 flex flex-col h-full justify-between">
                  <div>
                    {product.image_url && (
                      <div className="h-36 bg-slate-100 rounded-t-2xl overflow-hidden relative">
                        <img
                          src={product.image_url}
                          alt={product.name_fr}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <StockLevelBadge level={level} />
                        </div>
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-brand-navy text-sm leading-snug">{product.name_fr}</p>
                          <p className="text-xs text-gray-500 font-arabic mt-0.5" dir="rtl">
                            {product.name_ar}
                          </p>
                        </div>
                        {!product.image_url && <StockLevelBadge level={level} />}
                      </div>

                      <p className="text-[11px] text-gray-400 font-medium">
                        {getCategoryName(product.category_id)} · <span className="font-mono text-gray-500">{product.code}</span>
                      </p>

                      <div className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between text-xs mt-2">
                        <span className="text-gray-500 font-medium">Stock indicatif :</span>
                        <span
                          className={`font-bold ${
                            level === 'out'
                              ? 'text-rose-600'
                              : level === 'low'
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {level === 'out' ? 'Rupture' : `≈ ${available.toFixed(1)} ${product.unit}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <Button
                      onClick={() => handleAddToRequest(product)}
                      disabled={level === 'out'}
                      size="sm"
                      leftIcon={<Plus className="h-4 w-4" />}
                      className="w-full"
                    >
                      {level === 'out' ? 'Produit épuisé' : 'Demander ce produit'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onProductScanned={(p) => handleAddToRequest(p)}
      />
    </div>
  );
}

export default function EmployeeProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <EmployeeProductsContent />
    </Suspense>
  );
}
