'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Product } from '@/lib/supabase/types';
import { Button } from '../ui/Button';
import { Printer } from 'lucide-react';

interface ProductQRCodeProps {
  product: Product;
  size?: number;
  showPrintButton?: boolean;
}

export function ProductQRCode({ product, size = 160, showPrintButton = true }: ProductQRCodeProps) {
  const labelRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!labelRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Étiquette Économat - ${product.code}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fff; }
            .card { border: 2px solid #151936; border-radius: 12px; padding: 16px; width: 320px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .brand { font-size: 11px; font-weight: 800; color: #E99B39; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 2px; }
            .subtitle { font-size: 9px; color: #151936; margin-bottom: 12px; font-weight: 600; }
            .code { font-family: monospace; font-size: 14px; font-weight: 700; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; display: inline-block; margin-bottom: 12px; }
            .name { font-size: 15px; font-weight: 700; color: #151936; margin-bottom: 4px; }
            .name-ar { font-size: 14px; color: #475569; margin-bottom: 8px; direction: rtl; }
            .meta { font-size: 11px; color: #64748b; margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 8px; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">COMPLEXE MAHER</div>
            <div class="subtitle">CHAMBRE ÉCONOMAT & STOCKS</div>
            <div class="code">${product.code}</div>
            ${labelRef.current.innerHTML}
            <div class="name">${product.name_fr}</div>
            <div class="name-ar">${product.name_ar}</div>
            <div class="meta">
              <span>Emplacement: ${product.location || 'N/A'}</span>
              <span>Unité: ${product.unit}</span>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
      <div ref={labelRef} className="p-3 bg-white border border-gray-100 rounded-xl shadow-inner flex justify-center">
        <QRCodeSVG
          value={product.qr_code_data || `MAHER-${product.code}`}
          size={size}
          level="H"
          includeMargin={true}
        />
      </div>

      <div className="text-center space-y-0.5">
        <p className="font-mono text-xs font-bold text-brand-navy">{product.code}</p>
        <p className="text-xs font-semibold text-gray-800 line-clamp-1">{product.name_fr}</p>
        <p className="text-[11px] text-gray-500 font-arabic line-clamp-1">{product.name_ar}</p>
      </div>

      {showPrintButton && (
        <Button
          onClick={handlePrint}
          variant="outline"
          size="sm"
          leftIcon={<Printer className="w-3.5 h-3.5" />}
          className="w-full text-xs"
        >
          Imprimer étiquette
        </Button>
      )}
    </div>
  );
}
