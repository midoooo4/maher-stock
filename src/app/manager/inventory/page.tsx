'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { stockService } from '@/lib/db/stock-service';
import { InventorySession, Product } from '@/lib/supabase/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import {
  CheckSquare,
  AlertTriangle,
  Play,
  CheckCircle2,
  Coins,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export default function ManagerInventoryPage() {
  const { t } = useTranslation();
  const { user, role } = useAuth();

  const [sessions, setSessions] = useState<InventorySession[]>(stockService.getInventorySessions());
  const [products, setProducts] = useState<Product[]>(stockService.getProducts());

  // Active in-progress session
  const activeSession = sessions.find((s) => s.status === 'IN_PROGRESS');

  // New session modal
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);
  const [sessionType, setSessionType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPOT'>('WEEKLY');
  const [sessionNotes, setSessionNotes] = useState('');

  // Counts mapping: productId -> count number
  const [counts, setCounts] = useState<Record<string, number>>({});
  // Justifications mapping: productId -> text
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refreshData = () => {
    setSessions(stockService.getInventorySessions());
    setProducts(stockService.getProducts());
  };

  useEffect(() => {
    refreshData();
    stockService.syncWithSupabase().then(() => refreshData());

    const handleUpdate = () => refreshData();
    window.addEventListener('maher_stock_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('maher_stock_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newSession = stockService.createInventorySession({
      sessionType,
      userId: user.id,
      userName: user.full_name,
      userRole: role || 'RESPONSABLE',
      notes: sessionNotes,
    });

    // Initialize counts with theoretical stocks
    const initialCounts: Record<string, number> = {};
    products.forEach((p) => {
      initialCounts[p.id] = p.physical_stock;
    });
    setCounts(initialCounts);
    setJustifications({});

    setIsNewSessionOpen(false);
    refreshData();
  };

  const handleCompleteSession = () => {
    if (!activeSession || !user) return;
    setErrorMsg(null);

    // Validate that all discrepancies have a justification
    const payload = products.map((p) => {
      const physicalCount = counts[p.id] ?? p.physical_stock;
      const diff = physicalCount - p.physical_stock;
      const justification = justifications[p.id] || '';

      if (diff !== 0 && (!justification || justification.trim() === '')) {
        throw new Error(
          `Justification obligatoire manquante pour "${p.name_fr}" (Écart de ${diff > 0 ? '+' : ''}${diff} ${p.unit}).`
        );
      }

      return {
        productId: p.id,
        physicalCount,
        justification,
      };
    });

    try {
      stockService.completeInventorySession({
        sessionId: activeSession.id,
        counts: payload,
        userId: user.id,
        userName: user.full_name,
        userRole: role || 'RESPONSABLE',
      });

      refreshData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t('error'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Start Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-brand-orange" />
            <span>{t('nav_inventory')} (Chambre Économat)</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Comptage physique des marchandises en rayon et détection des écarts
          </p>
        </div>

        {!activeSession && (
          <Button
            onClick={() => setIsNewSessionOpen(true)}
            variant="primary"
            size="sm"
            leftIcon={<Play className="w-4 h-4" />}
          >
            {t('inv_new_session')}
          </Button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Active Counting Sheet */}
      {activeSession ? (
        <Card className="border-brand-orange">
          <CardHeader className="bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-orange bg-white px-2 py-0.5 rounded-full border border-amber-200">
                  {activeSession.session_number}
                </span>
                <span className="text-xs font-bold text-brand-navy">
                  Inventaire en cours ({activeSession.session_type})
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Saisissez le stock réel trouvé dans le magasin. Tout écart calculera automatiquement la perte et demandera une justification.
              </p>
            </div>

            <Button
              onClick={handleCompleteSession}
              variant="primary"
              size="sm"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              {t('inv_complete_btn')}
            </Button>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4 text-center">Stock Théorique</th>
                  <th className="py-3 px-4 text-center">Comptage Physique Réel</th>
                  <th className="py-3 px-4 text-center">Écart</th>
                  <th className="py-3 px-4">Justification de l'écart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {products.map((p) => {
                  const theoretical = p.physical_stock;
                  const physical = counts[p.id] ?? theoretical;
                  const diff = Number((physical - theoretical).toFixed(3));
                  const hasDiscrepancy = diff !== 0;

                  return (
                    <tr key={p.id} className={hasDiscrepancy ? 'bg-amber-50/50' : 'hover:bg-slate-50/50'}>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] text-gray-400 block">{p.code}</span>
                        <span className="font-bold text-brand-navy">{p.name_fr}</span>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-gray-600">
                        {theoretical} {p.unit}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={counts[p.id] ?? theoretical}
                          onChange={(e) =>
                            setCounts({
                              ...counts,
                              [p.id]: Number(e.target.value),
                            })
                          }
                          className="w-24 bg-white border border-gray-300 rounded-lg px-2 py-1 text-center font-bold text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-orange text-xs"
                        />
                      </td>

                      <td className="py-3 px-4 text-center font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] ${
                            diff < 0
                              ? 'bg-rose-100 text-rose-800'
                              : diff > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'text-gray-400'
                          }`}
                        >
                          {diff > 0 ? `+${diff}` : diff} {p.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {hasDiscrepancy ? (
                          <input
                            type="text"
                            value={justifications[p.id] || ''}
                            onChange={(e) =>
                              setJustifications({
                                ...justifications,
                                [p.id]: e.target.value,
                              })
                            }
                            placeholder="Motif obligatoire (Ex: Casse, évaporation, sac percé...)"
                            className="w-full bg-white border border-rose-300 rounded-lg px-2.5 py-1 text-xs text-rose-900 placeholder-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-500"
                          />
                        ) : (
                          <span className="text-[11px] text-gray-400">Conforme</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Previous Sessions List */
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Sessions d'inventaire clôturées</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">N° Session</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Date Réalisation</th>
                  <th className="py-3 px-4 text-center">Articles Vérifiés</th>
                  <th className="py-3 px-4 text-center">Écarts</th>
                  <th className="py-3 px-4 text-right">Impact Financier</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Aucun inventaire n'a encore été réalisé. Cliquez sur "Démarrer un inventaire" pour commencer le comptage.
                    </td>
                  </tr>
                ) : (
                  sessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-navy">
                        {sess.session_number}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-800">
                        {sess.session_type}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {new Date(sess.started_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        {sess.total_items_counted}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sess.total_anomalies > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {sess.total_anomalies}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-700">
                        {sess.total_loss_value > 0 ? `-${sess.total_loss_value.toFixed(2)} ${t('currency')}` : `0.00 ${t('currency')}`}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-emerald-700">
                        {sess.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Start Session Modal */}
      <Modal
        isOpen={isNewSessionOpen}
        onClose={() => setIsNewSessionOpen(false)}
        title="Démarrer une session d'inventaire"
        subtitle="Contrôle physique de la chambre économat Complexe Maher"
        maxWidth="md"
      >
        <form onSubmit={handleStartSession} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Type d'inventaire
            </label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPOT')}
              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              <option value="DAILY">Quotidien (Produits frais & café)</option>
              <option value="WEEKLY">Hebdomadaire (Complet)</option>
              <option value="MONTHLY">Mensuel (Clôture)</option>
              <option value="SPOT">Inopiné / Ponctuel (Contrôle anti-vol)</option>
            </select>
          </div>

          <Textarea
            label="Notes ou motifs de la session"
            rows={2}
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="Ex: Contrôle de fin de semaine avant réapprovisionnement..."
          />

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewSessionOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Commencer le comptage
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
