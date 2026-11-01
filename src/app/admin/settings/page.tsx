'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { stockService } from '@/lib/db/stock-service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Settings, ShieldCheck, Database, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const [requirePin, setRequirePin] = useState(false);
  const [currency, setCurrency] = useState('MAD');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetData = () => {
    if (confirm('Voulez-vous réinitialiser la base de données de test à l\'état d\'usine initial ?')) {
      stockService.resetToDefault();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">
            {t('nav_settings')}
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Paramètres généraux de Complexe Maher, devise officielle et règles de sécurité
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Paramètres enregistrés avec succès.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Establishment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Identité de l'Établissement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nom affiché de l'application"
                value="MAHER STOCK"
                disabled
              />
              <Input
                label="Sous-titre"
                value="Gestion intelligente de l'économat"
                disabled
              />
              <Input
                label="Établissement"
                value="COMPLEXE MAHER – RESTAURANT ET PISCINE"
                disabled
                className="col-span-full font-bold"
              />
              <Input
                label="Devise monétaire"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                helperText="Tous les rapports et mouvements utilisent cette devise (MAD - Dirham Marocain)"
              />
              <Input
                label="Ville & Pays"
                value="Casablanca, Maroc"
                disabled
              />
            </div>
          </CardContent>
        </Card>

        {/* Security & Anti-theft Policies */}
        <Card>
          <CardHeader>
            <CardTitle>Règles Métier & Contrôle Anti-Vol</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={requirePin}
                onChange={(e) => setRequirePin(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-brand-orange rounded border-gray-300 focus:ring-brand-orange"
              />
              <div>
                <span className="text-xs font-bold text-brand-navy block">
                  Confirmation par code PIN lors de la remise physique
                </span>
                <span className="text-[11px] text-gray-500">
                  Le responsable doit saisir son code PIN sécurisé pour décrémenter le stock physique.
                </span>
              </div>
            </label>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs text-gray-700">
              <div>
                <p className="font-bold text-brand-navy">Blocage strict des quantités négatives</p>
                <p className="text-[11px] text-gray-500">Empêche formellement tout stock inférieur à 0.00</p>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Actif (Verrouillé)
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs text-gray-700">
              <div>
                <p className="font-bold text-brand-navy">Réservation automatique à l'approbation</p>
                <p className="text-[11px] text-gray-500">Bloque les articles approuvés pour empêcher qu'un autre service les prenne</p>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Actif (Verrouillé)
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" size="md">
                Enregistrer les paramètres
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Database reset for testing scenarios */}
        <Card className="border-red-100">
          <CardHeader className="bg-red-50/40">
            <CardTitle className="text-red-900">Zone de Réinitialisation (Test & Démo)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-600">
              Permet de recharger le jeu de données d'origine (produits café, sucre, farine, chlore piscine, fournisseurs) pour recommencer une phase de test complète.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetData}
              className="text-red-600 hover:bg-red-50 border-red-200"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Réinitialiser les données de démonstration
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
