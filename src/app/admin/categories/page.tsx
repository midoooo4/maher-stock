'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { stockService } from '@/lib/db/stock-service';
import { Category } from '@/lib/supabase/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Layers, Plus } from 'lucide-react';

export default function AdminCategoriesPage() {
  const { t, language } = useTranslation();
  const [categories] = useState<Category[]>(stockService.getCategories());
  const products = stockService.getProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">
            {t('nav_categories')}
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Classification des produits de l'économat du complexe restaurant et piscine
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => {
          const productCount = products.filter(p => p.category_id === c.id).length;
          return (
            <Card key={c.id} className="p-5 flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: c.color || '#E99B39' }}
                  />
                  <span className="font-mono text-xs font-bold text-gray-400">{c.code}</span>
                </div>
                <div>
                  <h3 className="font-bold text-brand-navy text-sm">{c.name_fr}</h3>
                  <p className="font-arabic text-xs text-gray-400 mt-0.5">{c.name_ar}</p>
                </div>
                <p className="text-xs text-gray-500">{c.description || 'Articles de stock'}</p>
                <div className="pt-2">
                  <span className="text-xs font-bold text-brand-orange bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {productCount} articles associés
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
