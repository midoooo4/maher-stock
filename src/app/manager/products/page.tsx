'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { stockService } from '@/lib/db/stock-service';
import { Product } from '@/lib/supabase/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProductQRCode } from '@/components/qr/ProductQRCode';
import { QRScannerModal } from '@/components/qr/QRScannerModal';
import { Package, Search, QrCode, AlertTriangle, Camera } from 'lucide-react';

export default function ManagerProductsPage() {
  const { t } = useTranslation();
  const [products] = useState<Product[]>(stockService.getProducts());
  const [search, setSearch] = useState('');
  const [qrModalProduct, setQrModalProduct] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const filtered = products.filter(
    (p) =>
      p.name_fr.toLowerCase().includes(search.toLowerCase()) ||
      p.name_ar.includes(search) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-orange" />
            <span>Articles de l'Économat</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Consultation des stocks physiques réels, stocks réservés et impression des étiquettes QR
          </p>
        </div>

        <Button
          onClick={() => setIsScannerOpen(true)}
          variant="turquoise"
          size="sm"
          leftIcon={<Camera className="w-4 h-4" />}
        >
          Scanner un article en rayon
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit par nom ou code..."
            className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Désignation</th>
                <th className="py-3 px-4 text-center">Stock Physique</th>
                <th className="py-3 px-4 text-center">Stock Réservé</th>
                <th className="py-3 px-4 text-center">Stock Disponible</th>
                <th className="py-3 px-4">Emplacement</th>
                <th className="py-3 px-4 text-center">Étiquette</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filtered.map((p) => {
                const available = p.physical_stock - p.reserved_stock;
                const isLow = available <= p.min_stock;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-brand-navy">{p.code}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-brand-navy">{p.name_fr}</p>
                      <p className="text-[11px] text-gray-400 font-arabic">{p.name_ar}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-brand-navy">
                      {p.physical_stock} {p.unit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={p.reserved_stock > 0 ? 'text-brand-orange font-bold' : 'text-gray-400'}>
                        {p.reserved_stock} {p.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold ${
                        isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isLow && <AlertTriangle className="w-3 h-3" />}
                        {available} {p.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{p.location || 'Chambre économat'}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setQrModalProduct(p)}
                        className="p-1.5 text-gray-400 hover:text-brand-turquoise rounded-lg hover:bg-slate-100"
                        title="Imprimer QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {qrModalProduct && (
        <Modal
          isOpen={!!qrModalProduct}
          onClose={() => setQrModalProduct(null)}
          title={`Étiquette QR - ${qrModalProduct.name_fr}`}
          subtitle="Complexe Maher Stock"
          maxWidth="sm"
        >
          <ProductQRCode product={qrModalProduct} size={180} />
        </Modal>
      )}

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onProductScanned={(p) => setQrModalProduct(p)}
      />
    </div>
  );
}
