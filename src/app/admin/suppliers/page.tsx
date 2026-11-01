'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { stockService } from '@/lib/db/stock-service';
import { Supplier } from '@/lib/supabase/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Building2, Phone, Mail, MapPin, Plus } from 'lucide-react';

export default function AdminSuppliersPage() {
  const { t } = useTranslation();
  const [suppliers] = useState<Supplier[]>(stockService.getSuppliers());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">
            {t('nav_suppliers')}
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Répertoire des fournisseurs et distributeurs agréés pour Complexe Maher
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <Card key={s.id} className="p-5 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-100 text-brand-turquoise flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-brand-navy text-sm">{s.name}</h3>
              </div>

              <p className="text-xs text-gray-500">{s.notes || 'Fournisseur régulier'}</p>

              <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t border-gray-100">
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>{s.email}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{s.address}, {s.city}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
