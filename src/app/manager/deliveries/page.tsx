'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { stockService } from '@/lib/db/stock-service';
import { StockRequest } from '@/lib/supabase/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  CheckCircle2,
  Package,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Lock,
} from 'lucide-react';

export default function ManagerDeliveriesPage() {
  const { t } = useTranslation();
  const { user, role } = useAuth();

  const [requests, setRequests] = useState<StockRequest[]>(stockService.getStockRequests());
  const [selectedReq, setSelectedReq] = useState<StockRequest | null>(null);

  // Delivered quantities form mapping: itemId -> deliveredQuantity
  const [deliveredQuantities, setDeliveredQuantities] = useState<Record<string, number>>({});
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [managerPin, setManagerPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const refreshRequests = () => {
    setRequests(stockService.getStockRequests());
  };

  const readyOrApprovedRequests = requests.filter(
    (r) => r.status === 'APPROVED' || r.status === 'READY'
  );

  const handleOpenDeliveryModal = (req: StockRequest) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSelectedReq(req);
    setDeliveryNotes('');
    setManagerPin('');

    const initialMap: Record<string, number> = {};
    req.items?.forEach((it) => {
      initialMap[it.id] = it.approved_quantity ?? it.requested_quantity;
    });
    setDeliveredQuantities(initialMap);
  };

  const handleConfirmPhysicalHandover = () => {
    if (!selectedReq || !user) return;
    setErrorMsg(null);

    try {
      const deliveredPayload = Object.entries(deliveredQuantities).map(([itemId, qty]) => ({
        itemId,
        deliveredQuantity: Number(qty),
      }));

      // Validate quantities not negative
      for (const item of deliveredPayload) {
        if (item.deliveredQuantity < 0) {
          throw new Error('La quantité remise ne peut pas être négative.');
        }
      }

      stockService.deliverStockRequest({
        requestId: selectedReq.id,
        deliveredItems: deliveredPayload,
        deliveryNotes,
        userId: user.id,
        userName: user.full_name,
        userRole: role || 'RESPONSABLE',
        pinCode: managerPin,
      });

      setSelectedReq(null);
      setSuccessMsg(`La remise de la demande ${selectedReq.request_number} a été confirmée. Le stock physique a été décrémenté.`);
      refreshRequests();

      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t('error'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Remise Physique des Produits (Sortie Définitive)</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Le stock physique en chambre économat n'est décrémenté qu'au moment précis où vous confirmez la remise réelle.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid of Ready Requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {readyOrApprovedRequests.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12 text-center text-xs text-gray-400 space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                <Package className="w-6 h-6" />
              </div>
              <p className="font-semibold text-brand-navy">Aucune demande en attente de remise physique</p>
              <p className="text-gray-400">Les demandes approuvées s'afficheront ici dès leur validation.</p>
            </Card>
          </div>
        ) : (
          readyOrApprovedRequests.map((req) => (
            <Card key={req.id} className="p-5 flex flex-col justify-between space-y-4 hover:border-emerald-200 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-brand-navy">{req.request_number}</span>
                  <Badge status={req.status} size="sm" />
                </div>

                <div>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 mb-1">
                    Service: {req.department}
                  </span>
                  <p className="text-xs text-gray-700 font-semibold">{req.reason}</p>
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-1">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Articles réservés :</p>
                  {req.items?.map((it) => (
                    <div key={it.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 truncate max-w-[150px]">{it.product?.name_fr}</span>
                      <span className="font-bold text-brand-navy">
                        {it.approved_quantity ?? it.requested_quantity} {it.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <Button
                  onClick={() => handleOpenDeliveryModal(req)}
                  variant="primary"
                  size="sm"
                  className="w-full text-xs"
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Confirmer la remise réelle
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Handover Modal */}
      {selectedReq && (
        <Modal
          isOpen={!!selectedReq}
          onClose={() => setSelectedReq(null)}
          title={`Remise physique - Bon N° ${selectedReq.request_number}`}
          subtitle={`Service ${selectedReq.department} • Indiquez les quantités réellement remises`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              ⚠️ <strong>Action irréversible :</strong> La validation va décrémenter définitivement le stock physique de la chambre économat et générer les mouvements de sortie (EXIT).
            </div>

            {/* Items review & real delivered quantities */}
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {selectedReq.items?.map((it) => {
                const prod = it.product;
                const approvedQty = it.approved_quantity ?? it.requested_quantity;
                return (
                  <div key={it.id} className="p-3 bg-white flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-brand-navy text-xs">{prod?.name_fr || 'Produit'}</p>
                      <p className="text-[11px] text-gray-400">
                        Approuvé: <strong className="text-gray-700">{approvedQty} {it.unit}</strong> | En stock physique: <strong>{prod?.physical_stock} {it.unit}</strong>
                      </p>
                    </div>

                    <div className="w-36">
                      <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                        Qté réellement remise
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max={prod?.physical_stock}
                        value={deliveredQuantities[it.id] ?? approvedQty}
                        onChange={(e) =>
                          setDeliveredQuantities({
                            ...deliveredQuantities,
                            [it.id]: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-orange"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <Input
              label="Observations / Remarques de remise"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Ex: Emballage légèrement abîmé vérifié ensemble, lot n°..."
            />

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedReq(null)}>
                Annuler
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmPhysicalHandover}>
                Valider la remise & Décrémenter le stock
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
