'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { stockService } from '@/lib/db/stock-service';
import { StockAdjustment } from '@/lib/supabase/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Coins,
  ArrowRight,
} from 'lucide-react';

export default function AdminAnomaliesPage() {
  const { t } = useTranslation();
  const { user, role } = useAuth();

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(stockService.getStockAdjustments());
  const [selectedAdj, setSelectedAdj] = useState<StockAdjustment | null>(null);
  const [decisionModal, setDecisionModal] = useState<{ adj: StockAdjustment; isApprove: boolean } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refreshData = () => {
    setAdjustments(stockService.getStockAdjustments());
  };

  const handleOpenDecision = (adj: StockAdjustment, isApprove: boolean) => {
    setDecisionModal({ adj, isApprove });
    setAdminNotes('');
    setErrorMsg(null);
  };

  const handleConfirmDecision = () => {
    if (!decisionModal || !user) return;
    setErrorMsg(null);

    try {
      stockService.authorizeAdjustment({
        adjustmentId: decisionModal.adj.id,
        approved: decisionModal.isApprove,
        adminNotes,
        userId: user.id,
        userName: user.full_name,
        userRole: role || 'ADMIN',
      });

      setDecisionModal(null);
      refreshData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t('error'));
    }
  };

  const pendingAdjustments = adjustments.filter(a => a.status === 'PENDING_APPROVAL');
  const pastAdjustments = adjustments.filter(a => a.status !== 'PENDING_APPROVAL');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">
            {t('nav_anomalies')} & Écarts d'inventaire
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Seul le propriétaire peut autoriser l'alignement du stock théorique sur le stock physique
          </p>
        </div>
      </div>

      {/* Pending Anomalies requiring Owner Action */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <CardTitle className="text-amber-950">
              Anomalies en attente d'arbitrage ({pendingAdjustments.length})
            </CardTitle>
          </div>
          <span className="text-xs font-bold text-amber-800">Décision requise</span>
        </CardHeader>
        <CardContent className="p-0">
          {pendingAdjustments.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              ✅ Aucune anomalie en attente. Tous les inventaires sont conformes ou régularisés.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingAdjustments.map((adj) => {
                const p = adj.product;
                const isLoss = adj.adjusted_quantity < 0;
                const valueLoss = Math.abs(adj.adjusted_quantity * (p?.purchase_price || 0));

                return (
                  <div key={adj.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand-navy">{adj.adjustment_number}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isLoss ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isLoss ? 'DÉFICIT / PERTE' : 'EXCÉDENT'}
                        </span>
                        <span className="text-xs font-bold text-brand-navy">{p?.name_fr || 'Produit'}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span>Stock théorique: <strong>{adj.previous_stock} {p?.unit}</strong></span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        <span>Compté en magasin: <strong className={isLoss ? 'text-rose-600' : 'text-emerald-600'}>{adj.new_stock} {p?.unit}</strong></span>
                        <span>(Écart: <strong>{adj.adjusted_quantity > 0 ? `+${adj.adjusted_quantity}` : adj.adjusted_quantity} {p?.unit}</strong>)</span>
                      </div>

                      <p className="text-xs text-gray-700 bg-slate-100 p-2 rounded-lg">
                        <strong>Justification fournie :</strong> {adj.reason}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                        <Coins className="w-3.5 h-3.5" />
                        <span>Impact financier estimé : {valueLoss.toFixed(2)} {t('currency')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <Button
                        onClick={() => handleOpenDecision(adj, false)}
                        variant="outline"
                        size="sm"
                        className="text-xs text-rose-700 hover:bg-rose-50"
                      >
                        Rejeter correction
                      </Button>
                      <Button
                        onClick={() => handleOpenDecision(adj, true)}
                        variant="primary"
                        size="sm"
                        className="text-xs"
                      >
                        Autoriser régularisation
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History of Past Adjustments */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des décisions d'anomalies</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pastAdjustments.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              Aucun historique d'ajustement.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pastAdjustments.map((adj) => (
                <div key={adj.id} className="p-4 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-brand-navy">{adj.adjustment_number}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        adj.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {adj.status === 'APPROVED' ? 'RÉGULARISÉ' : 'REJETÉ'}
                      </span>
                      <span className="font-semibold text-brand-navy">{adj.product?.name_fr}</span>
                    </div>
                    <p className="text-gray-500">
                      Écart {adj.adjusted_quantity > 0 ? `+${adj.adjusted_quantity}` : adj.adjusted_quantity} {adj.product?.unit} • {adj.reason}
                    </p>
                    {adj.admin_notes && (
                      <p className="text-[11px] text-brand-navy italic">Note propriétaire : {adj.admin_notes}</p>
                    )}
                  </div>

                  <div className="text-right text-[11px] text-gray-400">
                    {new Date(adj.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decision Modal */}
      {decisionModal && (
        <Modal
          isOpen={!!decisionModal}
          onClose={() => setDecisionModal(null)}
          title={decisionModal.isApprove ? 'Autoriser la régularisation du stock' : 'Rejeter la demande d\'ajustement'}
          subtitle={`Anomalie ${decisionModal.adj.adjustment_number}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p>Produit : <strong>{decisionModal.adj.product?.name_fr}</strong></p>
              <p>Ancien stock : {decisionModal.adj.previous_stock} → Nouveau stock après validation : <strong>{decisionModal.adj.new_stock}</strong></p>
              <p>Écart : <strong>{decisionModal.adj.adjusted_quantity}</strong></p>
            </div>

            <Textarea
              label="Commentaire de décision du propriétaire"
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Ex: Écart validé suite à casse exceptionnelle constatée en cuisine..."
            />

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDecisionModal(null)}>
                Annuler
              </Button>
              <Button
                variant={decisionModal.isApprove ? 'primary' : 'danger'}
                size="sm"
                onClick={handleConfirmDecision}
              >
                {decisionModal.isApprove ? 'Confirmer l\'ajustement' : 'Confirmer le rejet'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
