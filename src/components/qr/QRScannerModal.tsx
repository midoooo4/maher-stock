'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { stockService } from '@/lib/db/stock-service';
import { Product } from '@/lib/supabase/types';
import { Camera, Search, AlertCircle } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductScanned: (product: Product) => void;
}

export function QRScannerModal({ isOpen, onClose, onProductScanned }: QRScannerModalProps) {
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setManualCode('');
      setError(null);
      setIsScanning(false);
    }
  }, [isOpen]);

  const handleManualSearch = (codeToSearch?: string) => {
    const code = (codeToSearch || manualCode).trim();
    if (!code) {
      setError('Veuillez entrer un code produit ou scanner');
      return;
    }

    // Try matching code, qr_code_data, or ID
    const product = stockService.getProductById(code);
    if (product) {
      setError(null);
      onProductScanned(product);
      onClose();
    } else {
      setError(`Aucun produit trouvé pour le code "${code}".`);
    }
  };

  const startCamera = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('qr-reader');
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          html5QrCode.stop().catch(() => {});
          handleManualSearch(decodedText);
        },
        () => {
          // parse error, ignore frame
        }
      );
    } catch (err) {
      console.warn('Camera scan not available or permission denied', err);
      setIsScanning(false);
      setError('Caméra non disponible ou autorisation refusée. Utilisez la saisie manuelle.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scanner un QR Code / Code-barres"
      subtitle="Pointez la caméra ou entrez le code de l'article"
    >
      <div className="space-y-4">
        {/* Camera viewfinder box */}
        <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video flex flex-col items-center justify-center p-4 border border-slate-700 text-white">
          <div id="qr-reader" className="w-full h-full" />
          {!isScanning && (
            <div className="text-center space-y-3 z-10">
              <div className="w-12 h-12 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-300">
                Utilisez la caméra de votre smartphone pour scanner les étiquettes en rayon.
              </p>
              <Button
                variant="turquoise"
                size="sm"
                onClick={startCamera}
                leftIcon={<Camera className="w-3.5 h-3.5" />}
              >
                Activer la Caméra
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Manual Code input fallback */}
        <div className="pt-2 border-t border-gray-100 space-y-3">
          <p className="text-xs font-semibold text-brand-navy">Ou saisir le code produit :</p>
          <div className="flex gap-2">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ex: PRD-CAF-001 ou MAHER-PRD-CAF-001"
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
            />
            <Button
              onClick={() => handleManualSearch()}
              variant="primary"
              size="md"
              leftIcon={<Search className="w-4 h-4" />}
            >
              Valider
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-gray-400">Exemples rapides :</span>
            {['PRD-CAF-001', 'PRD-SUC-002', 'PRD-HUI-003', 'PRD-CHL-005'].map((code) => (
              <button
                key={code}
                onClick={() => {
                  setManualCode(code);
                  handleManualSearch(code);
                }}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-mono"
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
