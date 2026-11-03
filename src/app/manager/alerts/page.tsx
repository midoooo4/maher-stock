'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';
import { stockService } from '@/lib/db/stock-service';
import { Product } from '@/lib/supabase/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertOctagon, AlertTriangle, ArrowDownToLine, Package } from 'lucide-react';

export default function ManagerAlertsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>(stockService.getProducts());
  const [filter, setFilter] = useState<'low' | 'out' | 'all'>('low');

  const refreshProducts = () => {
    setProducts(stockService.getProducts());
  };

  React.useEffect(() => {
    refreshProducts();
    stockService.syncWithSupabase().then(() => refreshProducts());

    const handleUpdate = () => refreshProducts();
    window.addEventListener('maher_stock_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('maher_stock_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const lowStockProducts = products.filter(
    (p) => (p.physical_stock - p.reserved_stock) <= p.min_stock && (p.physical_stock - p.reserved_stock) > 0
  );
  const outOfStockProducts = products.filter(
    (p) => (p.physical_stock - p.reserved_stock) <= 0
  );

  const displayed =
    filter === 'out'
      ? outOfStockProducts
      : filter === 'low'
      ? lowStockProducts
      : [...outOfStockProducts, ...lowStockProducts];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-600" />
            <span>{t('nav_alerts')}</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Surveillance des seuils critiques de réapprovisionnement pour le restaurant et la piscine
          </p>
        </div>

        <Link href="/manager/entries">
          <Button variant="primary" size="sm" leftIcon={<ArrowDownToLine className="w-4 h-4" />}>
            Commander / Réceptionner
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('low')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'low' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white border text-gray-700'
          }`}
        >
          Stock Faible ({lowStockProducts.length})
        </button>
        <button
          onClick={() => setFilter('out')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'out' ? 'bg-rose-600 text-white shadow-sm' : 'bg-white border text-gray-700'
          }`}
        >
          Rupture Totale ({outOfStockProducts.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayed.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center text-xs text-gray-400">
              Aucun article dans cette catégorie d'alerte. Les niveaux de stock sont optimaux.
            </Card>
          </div>
        ) : (
          displayed.map((p) => {
            const available = p.physical_stock - p.reserved_stock;
            const isOut = available <= 0;
            return (
              <Card key={p.id} className={`p-4 border-l-4 ${isOut ? 'border-l-rose-500' : 'border-l-amber-500'}`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold text-gray-400">{p.code}</span>
                    <h3 className="font-bold text-brand-navy text-sm">{p.name_fr}</h3>
                    <p className="font-arabic text-xs text-gray-500">{p.name_ar}</p>
                    <p className="text-xs text-gray-400">Emplacement: {p.location || 'Chambre économat'}</p>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    isOut ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isOut ? 'RUPTURE' : 'STOCK FAIBLE'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500">Seuil alerte: </span>
                    <strong>{p.min_stock} {p.unit}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Disponible: </span>
                    <strong className={isOut ? 'text-rose-600 font-extrabold' : 'text-amber-700'}>
                      {available} {p.unit}
                    </strong>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
