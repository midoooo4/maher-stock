'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { stockService } from '@/lib/db/stock-service';
import { Product } from '@/lib/supabase/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProductQRCode } from '@/components/qr/ProductQRCode';
import { QRScannerModal } from '@/components/qr/QRScannerModal';
import { Package, Search, QrCode, AlertTriangle, Camera } from 'lucide-react';

export default function ManagerProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [qrModalProduct, setQrModalProduct] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const refreshProducts = () => {
    setProducts(stockService.getProducts());
  };

  useEffect(() => {
    refreshProducts();

    stockService.syncWithSupabase().then(() => {
      refreshProducts();
    });

    const handleUpdate = () => refreshProducts();
    window.addEventListener('maher_stock_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('maher_stock_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

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
            <span>Articles de l&apos;Économat (Visualisation par Photo)</span>
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
                <th className="py-3 px-4">Photo & Article</th>
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
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name_fr}
                            className="w-10 h-10 rounded-xl object-cover border border-gray-200 flex-shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-gray-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-brand-navy">{p.name_fr}</p>
                          <p className="text-[11px] text-gray-400 font-arabic">{p.name_ar}</p>
                        </div>
                      </div>
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
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold ${
                          isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isLow && <AlertTriangle className="w-3 h-3" />}
                        {available} {p.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-medium">{p.location || 'Chambre Économat'}</td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        onClick={() => setQrModalProduct(p)}
                        variant="outline"
                        size="sm"
                        leftIcon={<QrCode className="w-3.5 h-3.5 text-brand-orange" />}
                      >
                        QR Code
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* QR Code Modal */}
      {qrModalProduct && (
        <Modal
          isOpen={!!qrModalProduct}
          onClose={() => setQrModalProduct(null)}
          title={`QR Code - ${qrModalProduct.name_fr}`}
          subtitle="Étiquette officielle d'identification économat"
          maxWidth="sm"
        >
          <ProductQRCode product={qrModalProduct} size={180} />
        </Modal>
      )}

      {/* Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onProductScanned={(p) => {
          setSearch(p.code);
          setIsScannerOpen(false);
        }}
      />
    </div>
  );
}
