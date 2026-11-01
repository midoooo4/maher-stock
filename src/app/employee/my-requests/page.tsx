'use client';

import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  X,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  PackageCheck,
  Truck,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { stockService } from '@/lib/db/stock-service';
import { StockRequest } from '@/lib/supabase/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MyRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Cancellation state
  const [cancellingReq, setCancellingReq] = useState<StockRequest | null>(null);
  const [cancelReason, setCancelReason] = useState('Erreur de saisie ou besoin obsolète');
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadRequests = () => {
    if (!user) return;
    const reqs = stockService
      .getStockRequests()
      .filter((r) => r.employee_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRequests(reqs);
  };

  useEffect(() => {
    loadRequests();
  }, [user]);

  const handleConfirmCancel = () => {
    if (!cancellingReq || !user) return;
    setIsCancelling(true);
    setErrorMsg(null);

    try {
      stockService.cancelStockRequest({
        requestId: cancellingReq.id,
        userId: user.id,
        userName: user.full_name,
        userRole: user.role,
        reason: cancelReason,
      });
      setCancellingReq(null);
      loadRequests();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de l\'annulation');
    } finally {
      setIsCancelling(false);
    }
  };

  const filtered = requests.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch =
      r.request_number.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      (r.items || []).some((it) => it.product?.name_fr.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const countByStatus = (status: string) => requests.filter((r) => r.status === status).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-brand-navy tracking-tight">Mes Demandes de Sortie</h1>
        <p className="text-xs text-gray-500 font-medium">
          Suivez en direct le traitement de vos demandes par le responsable économat
        </p>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { key: 'all', label: 'Toutes', count: requests.length },
          { key: 'PENDING', label: 'En attente', count: countByStatus('PENDING') },
          { key: 'APPROVED', label: 'Approuvées', count: countByStatus('APPROVED') },
          { key: 'READY', label: 'Prêtes', count: countByStatus('READY') },
          { key: 'DELIVERED', label: 'Livrées', count: countByStatus('DELIVERED') },
          { key: 'REJECTED', label: 'Refusées', count: countByStatus('REJECTED') },
          { key: 'CANCELLED', label: 'Annulées', count: countByStatus('CANCELLED') },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl border whitespace-nowrap transition-colors ${
              statusFilter === tab.key
                ? 'bg-brand-navy text-white border-brand-navy font-semibold shadow-sm'
                : 'border-gray-200 text-gray-600 hover:border-brand-navy bg-white'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-gray-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par numéro de demande, produit ou motif..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange shadow-sm"
        />
      </div>

      {/* Requests List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-gray-600">Aucune demande trouvée</p>
          <p className="text-xs text-gray-400 mt-1">
            {statusFilter !== 'all' ? 'Aucun résultat dans cette catégorie' : 'Vous n\'avez pas encore créé de demande'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const isExpanded = expandedId === req.id;
            return (
              <Card key={req.id} className="overflow-hidden hover:shadow-sm transition-shadow">
                <CardContent className="p-0">
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    className="p-4 cursor-pointer hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-brand-navy">{req.request_number}</span>
                        <Badge status={req.status} size="sm" />
                        <span className="text-xs font-semibold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-md">
                          {req.department}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium">Motif : {req.reason}</p>
                      <p className="text-[11px] text-gray-400">
                        Créée le {formatDateTime(req.created_at)} · {req.items?.length || 0} article(s)
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {req.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setErrorMsg(null);
                            setCancellingReq(req);
                          }}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs"
                        >
                          Annuler
                        </Button>
                      )}
                      <div className="text-gray-400 hover:text-brand-navy">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-slate-50/50 p-4 space-y-4">
                      {/* Refusal notice if rejected */}
                      {req.status === 'REJECTED' && req.rejection_reason && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Motif du refus par l&apos;économat :</p>
                            <p className="mt-0.5 font-medium">{req.rejection_reason}</p>
                          </div>
                        </div>
                      )}

                      {/* Notes if present */}
                      {req.notes && (
                        <p className="text-xs text-gray-600 bg-white p-2.5 rounded-xl border border-gray-100">
                          <strong>Note jointe :</strong> {req.notes}
                        </p>
                      )}

                      {/* Items details table */}
                      <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 border-b border-gray-100">
                            <tr>
                              <th className="text-left px-3.5 py-2 font-bold text-gray-600 uppercase">Produit</th>
                              <th className="text-right px-3.5 py-2 font-bold text-gray-600 uppercase">Demandé</th>
                              <th className="text-right px-3.5 py-2 font-bold text-gray-600 uppercase">Approuvé</th>
                              <th className="text-right px-3.5 py-2 font-bold text-gray-600 uppercase">Livré</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {req.items?.map((it) => (
                              <tr key={it.id}>
                                <td className="px-3.5 py-2.5">
                                  <p className="font-bold text-brand-navy">{it.product?.name_fr || 'Produit'}</p>
                                  <p className="text-[10px] text-gray-400 font-mono">{it.product?.code || '—'}</p>
                                </td>
                                <td className="px-3.5 py-2.5 text-right font-medium text-gray-700">
                                  {it.requested_quantity} {it.unit}
                                </td>
                                <td className="px-3.5 py-2.5 text-right font-bold text-sky-700">
                                  {it.approved_quantity !== null && it.approved_quantity !== undefined
                                    ? `${it.approved_quantity} ${it.unit}`
                                    : '—'}
                                </td>
                                <td className="px-3.5 py-2.5 text-right font-bold text-emerald-700">
                                  {it.delivered_quantity !== null && it.delivered_quantity !== undefined
                                    ? `${it.delivered_quantity} ${it.unit}`
                                    : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Handover & Delivery info */}
                      {req.delivered_at && (
                        <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" />
                          Remise physique effectuée à l&apos;économat le {formatDateTime(req.delivered_at)}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancellingReq}
        onClose={() => setCancellingReq(null)}
        title="Annuler ma demande de sortie"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Voulez-vous vraiment annuler la demande <strong>{cancellingReq?.request_number}</strong> ?
            Cette action est irréversible et libérera les réservations éventuelles.
          </p>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Motif de l&apos;annulation :</label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setCancellingReq(null)}>
              Retour
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isCancelling}
              onClick={handleConfirmCancel}
            >
              Confirmer l&apos;annulation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
