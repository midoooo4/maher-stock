'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { stockService } from '@/lib/db/stock-service';
import { StockRequest, RequestStatus } from '@/lib/supabase/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import {
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  ShieldAlert,
  ArrowRight,
  PackageCheck,
} from 'lucide-react';

export default function AdminRequestsPage() {
  const { t, language } = useTranslation();
  const { user, role } = useAuth();

  const [requests, setRequests] = useState<StockRequest[]>(stockService.getStockRequests());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Selected request for details modal
  const [selectedRequest, setSelectedRequest] = useState<StockRequest | null>(null);

  // Rejection modal
  const [rejectModalReq, setRejectModalReq] = useState<StockRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Approval with quantities state
  const [approvalModalReq, setApprovalModalReq] = useState<StockRequest | null>(null);
  const [approvedQuantities, setApprovedQuantities] = useState<Record<string, number>>({});

  const refreshRequests = () => {
    setRequests(stockService.getStockRequests());
  };

  const handleOpenApproval = (req: StockRequest) => {
    setErrorMsg(null);
    setApprovalModalReq(req);
    // prefill approved quantities with requested quantities
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
        userRole: role || 'ADMIN',
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
        userRole: role || 'ADMIN',
      });

      setRejectModalReq(null);
      refreshRequests();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t('error'));
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.request_number.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesDept = deptFilter === 'all' || r.department === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">
            {t('nav_requests')}
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Contrôle des demandes de sortie par service, validation et suivi des réservations
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par numéro de bon, motif..."
              className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange text-gray-700"
            >
              <option value="all">Tous les statuts</option>
              <option value="PENDING">⏳ En attente</option>
              <option value="APPROVED">✅ Approuvées (Réservé)</option>
              <option value="READY">📦 Préparées</option>
              <option value="DELIVERED">🚚 Remises</option>
              <option value="PARTIALLY_DELIVERED">⚠️ Partiellement remises</option>
              <option value="REJECTED">❌ Refusées</option>
              <option value="CANCELLED">⚪ Annulées</option>
            </select>
          </div>

          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange text-gray-700"
            >
              <option value="all">Tous les services</option>
              <option value="Cuisine">Cuisine</option>
              <option value="Cafe">Café</option>
              <option value="Restaurant">Restaurant / Salle</option>
              <option value="Piscine">Piscine</option>
              <option value="Entretien">Entretien</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Requests List Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">N° Demande</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Motif & Date</th>
                <th className="py-3 px-4">Articles</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Aucune demande de sortie ne correspond aux critères.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-navy">
                      {req.request_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {req.department}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-brand-navy line-clamp-1">{req.reason}</p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(req.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        {req.items?.slice(0, 2).map((it) => (
                          <div key={it.id} className="text-[11px] text-gray-600">
                            • {it.product?.name_fr || 'Produit'} : <span className="font-bold">{it.requested_quantity} {it.unit}</span>
                          </div>
                        ))}
                        {(req.items?.length || 0) > 2 && (
                          <span className="text-[10px] text-brand-orange font-semibold">
                            + {(req.items?.length || 0) - 2} autre(s)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge status={req.status} />
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="p-1.5 text-gray-400 hover:text-brand-navy rounded-lg hover:bg-slate-100"
                          title="Détails de la demande"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {req.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleOpenApproval(req)}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                              title="Valider"
                            >
                              Accepter
                            </button>
                            <button
                              onClick={() => handleOpenReject(req)}
                              className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors"
                              title="Refuser"
                            >
                              Refuser
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Approval Modal with Partial Quantities Check */}
      {approvalModalReq && (
        <Modal
          isOpen={!!approvalModalReq}
          onClose={() => setApprovalModalReq(null)}
          title={`Validation de la demande ${approvalModalReq.request_number}`}
          subtitle="Définir les quantités accordées (Réservation automatique du stock)"
          maxWidth="lg"
        >
          <div className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              ℹ️ <strong>Règle de stock :</strong> L'approbation réserve les quantités immédiatement pour éviter les doubles sorties, mais ne diminue pas le stock physique réel avant la remise effective.
            </div>

            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {approvalModalReq.items?.map((it) => {
                const prod = it.product;
                const availableStock = prod ? prod.physical_stock - prod.reserved_stock : 0;
                return (
                  <div key={it.id} className="p-3 bg-white flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="font-bold text-brand-navy text-xs">{prod?.name_fr || 'Produit'}</p>
                      <p className="text-[11px] text-gray-500">
                        Demandé: <span className="font-semibold">{it.requested_quantity} {it.unit}</span> | Dispo en stock: <span className="font-semibold text-emerald-700">{availableStock} {it.unit}</span>
                      </p>
                    </div>

                    <div className="w-32">
                      <label className="text-[10px] text-gray-400 font-semibold block mb-0.5">Qté accordée</label>
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

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setApprovalModalReq(null)}>
                Annuler
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmApproval}>
                Confirmer l'approbation & Réserver
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
          subtitle="Un motif explicite est obligatoirement requis"
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
              placeholder="Ex: Rupture fournisseur temporaire, quota journalier dépassé, service non autorisé..."
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
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title={`Détails Demande ${selectedRequest.request_number}`}
          subtitle={`Service : ${selectedRequest.department}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-gray-400 block text-[10px]">Statut actuel</span>
                <Badge status={selectedRequest.status} />
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Date création</span>
                <span className="font-semibold text-brand-navy">
                  {new Date(selectedRequest.created_at).toLocaleString()}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400 block text-[10px]">Motif formulé</span>
                <span className="font-semibold text-brand-navy">{selectedRequest.reason}</span>
              </div>
              {selectedRequest.rejection_reason && (
                <div className="col-span-2 p-2 bg-rose-50 text-rose-800 rounded-lg">
                  <span className="block font-bold text-[10px]">Motif du refus :</span>
                  <span>{selectedRequest.rejection_reason}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
                Articles demandés ({selectedRequest.items?.length || 0})
              </h4>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden text-xs">
                {selectedRequest.items?.map((it) => (
                  <div key={it.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-brand-navy">{it.product?.name_fr || 'Produit'}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{it.product?.code}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-brand-navy">
                        Demandé: {it.requested_quantity} {it.unit}
                      </span>
                      {it.approved_quantity !== null && it.approved_quantity !== undefined && (
                        <p className="text-[11px] text-indigo-700 font-semibold">
                          Approuvé: {it.approved_quantity} {it.unit}
                        </p>
                      )}
                      {it.delivered_quantity !== null && it.delivered_quantity !== undefined && (
                        <p className="text-[11px] text-emerald-700 font-bold">
                          Remis: {it.delivered_quantity} {it.unit}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
