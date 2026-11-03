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
import { Textarea } from '@/components/ui/Input';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  PackageCheck,
  ShieldAlert,
  Eye,
  Search,
} from 'lucide-react';

export default function ManagerRequestsPage() {
  const { t } = useTranslation();
  const { user, role } = useAuth();

  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');

  // Modal states
  const [selectedReq, setSelectedReq] = useState<StockRequest | null>(null);
  const [rejectModalReq, setRejectModalReq] = useState<StockRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [approvalModalReq, setApprovalModalReq] = useState<StockRequest | null>(null);
  const [approvedQuantities, setApprovedQuantities] = useState<Record<string, number>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refreshRequests = () => {
    setRequests(stockService.getStockRequests());
  };

  React.useEffect(() => {
    refreshRequests();

    stockService.syncWithSupabase().then(() => {
      refreshRequests();
    });

    const handleUpdate = () => refreshRequests();
    window.addEventListener('maher_stock_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('maher_stock_sync_channel');
        bc.onmessage = () => {
          refreshRequests();
        };
      } catch (_) {}
    }

    const interval = setInterval(async () => {
      await stockService.syncWithSupabase();
      refreshRequests();
    }, 2500);

    return () => {
      window.removeEventListener('maher_stock_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      if (bc) bc.close();
      clearInterval(interval);
    };
  }, []);

  const handleOpenApproval = (req: StockRequest) => {
    setErrorMsg(null);
    setApprovalModalReq(req);
    const initialMap: Record<string, number> = {};
    req.items?.forEach((it) => {
      initialMap[it.id] = it.requested_quantity;
    });
    setApprovedQuantities(initialMap);
  };

  const handleConfirmApproval = () => {
    if (!approvalModalReq || !user) return;
    setErrorMsg(null);

    try {
      const itemsPayload = Object.entries(approvedQuantities).map(([itemId, qty]) => ({
        itemId,
        approvedQuantity: Number(qty),
      }));

      stockService.approveStockRequest({
        requestId: approvalModalReq.id,
        itemsApproved: itemsPayload,
        userId: user.id,
        userName: user.full_name,
        userRole: role || 'RESPONSABLE',
      });

      setApprovalModalReq(null);
      refreshRequests();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t('error'));
    }
  };

  const handleOpenReject = (req: StockRequest) => {
    setErrorMsg(null);
    setRejectModalReq(req);
    setRejectionReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectModalReq || !user) return;
    setErrorMsg(null);

    try {
      stockService.rejectStockRequest({
        requestId: rejectModalReq.id,
        reason: rejectionReason,
        userId: user.id,
        userName: user.full_name,
        userRole: role || 'RESPONSABLE',
      });

      setRejectModalReq(null);
      refreshRequests();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t('error'));
    }
  };

  const handleMarkReady = (reqId: string) => {
    if (!user) return;
    try {
      stockService.prepareStockRequest({
        requestId: reqId,
        userId: user.id,
        userName: user.full_name,
        userRole: role || 'RESPONSABLE',
      });
      refreshRequests();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t('error'));
    }
  };

  const filtered = requests.filter((r) => {
    const matchesSearch =
      r.request_number.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-orange" />
            <span>Demandes de Sortie à Traiter</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Validation des bons de sortie émis par la cuisine, le café, le restaurant et la piscine
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'PENDING', label: 'En attente de décision' },
          { id: 'APPROVED', label: 'Approuvées (À préparer)' },
          { id: 'READY', label: 'Préparées (Prêt pour remise)' },
          { id: 'all', label: 'Toutes les demandes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === tab.id
                ? 'bg-brand-navy text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">N° Demande</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Motif & Heure</th>
                <th className="py-3 px-4">Articles demandés</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Décision / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Aucune demande dans cette vue.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-navy">
                      {req.request_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                        {req.department}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-brand-navy line-clamp-1">{req.reason}</p>
                      <span className="text-[10px] text-gray-400">
                        {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        {req.items?.map((it) => (
                          <div key={it.id} className="text-[11px] text-gray-700">
                            • {it.product?.name_fr} : <strong>{it.requested_quantity} {it.unit}</strong>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge status={req.status} />
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {req.status === 'PENDING' && (
                          <>
                            <Button
                              onClick={() => handleOpenApproval(req)}
                              variant="primary"
                              size="sm"
                              className="text-xs"
                            >
                              Accepter
                            </Button>
                            <Button
                              onClick={() => handleOpenReject(req)}
                              variant="outline"
                              size="sm"
                              className="text-xs text-rose-700 hover:bg-rose-50"
                            >
                              Refuser
                            </Button>
                          </>
                        )}

                        {req.status === 'APPROVED' && (
                          <Button
                            onClick={() => handleMarkReady(req.id)}
                            variant="turquoise"
                            size="sm"
                            className="text-xs"
                            leftIcon={<PackageCheck className="w-3.5 h-3.5" />}
                          >
                            Marquer prêt
                          </Button>
                        )}

                        <button
                          onClick={() => setSelectedReq(req)}
                          className="p-1.5 text-gray-400 hover:text-brand-navy rounded-lg hover:bg-slate-100"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Approval Modal with quantity check */}
      {approvalModalReq && (
        <Modal
          isOpen={!!approvalModalReq}
          onClose={() => setApprovalModalReq(null)}
          title={`Validation Bon ${approvalModalReq.request_number}`}
          subtitle="Ajustez les quantités accordées si nécessaire (Réservation de stock)"
          maxWidth="lg"
        >
          <div className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {approvalModalReq.items?.map((it) => {
                const prod = it.product;
                const availableStock = prod ? prod.physical_stock - prod.reserved_stock : 0;
                return (
                  <div key={it.id} className="p-3 bg-white flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-brand-navy text-xs">{prod?.name_fr}</p>
                      <p className="text-[11px] text-gray-500">
                        Demandé: <strong>{it.requested_quantity} {it.unit}</strong> | En rayon: <strong className="text-emerald-700">{availableStock} {it.unit}</strong>
                      </p>
                    </div>

                    <div className="w-32">
                      <label className="text-[10px] text-gray-400 block mb-0.5">Qté accordée</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max={availableStock}
                        value={approvedQuantities[it.id] ?? it.requested_quantity}
                        onChange={(e) =>
                          setApprovedQuantities({
                            ...approvedQuantities,
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

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setApprovalModalReq(null)}>
                Annuler
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmApproval}>
                Valider & Réserver les articles
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectModalReq && (
        <Modal
          isOpen={!!rejectModalReq}
          onClose={() => setRejectModalReq(null)}
          title={`Refus de la demande ${rejectModalReq.request_number}`}
          subtitle="Le motif est obligatoirement transmis à l'employé"
          maxWidth="md"
        >
          <div className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Textarea
              label="Motif du refus (Obligatoire)"
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Précisez pourquoi la demande est rejetée..."
            />

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectModalReq(null)}>
                Annuler
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmReject} disabled={!rejectionReason.trim()}>
                Confirmer le refus
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {selectedReq && (
        <Modal
          isOpen={!!selectedReq}
          onClose={() => setSelectedReq(null)}
          title={`Détails Demande ${selectedReq.request_number}`}
          subtitle={`Service ${selectedReq.department}`}
          maxWidth="md"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <p>Motif : <strong>{selectedReq.reason}</strong></p>
              <p>Date : {new Date(selectedReq.created_at).toLocaleString()}</p>
              <div className="pt-1">
                <Badge status={selectedReq.status} />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <p className="font-bold text-brand-navy uppercase tracking-wider text-[11px]">Articles :</p>
              {selectedReq.items?.map((it) => (
                <div key={it.id} className="p-2 border border-gray-100 rounded-lg flex justify-between">
                  <span>{it.product?.name_fr}</span>
                  <span className="font-bold">{it.requested_quantity} {it.unit}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedReq(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
