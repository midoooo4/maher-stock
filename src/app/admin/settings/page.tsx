'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { stockService } from '@/lib/db/stock-service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { 
  Settings, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  KeyRound, 
  Users, 
  Power, 
  Eye, 
  EyeOff, 
  Edit2, 
  Sparkles,
  ShieldAlert 
} from 'lucide-react';
import { Profile } from '@/lib/supabase/types';

export default function AdminSettingsPage() {
  const { t, language } = useTranslation();
  const { allUsers, toggleUserActive, updateUserPin, user: currentUser } = useAuth();

  const [requirePin, setRequirePin] = useState(false);
  const [currency, setCurrency] = useState('MAD');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Quick PIN modal inside settings
  const [pinModalUser, setPinModalUser] = useState<Profile | null>(null);
  const [modalPin, setModalPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Visible PIN state
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('maher_admin_settings_v1');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        if (parsed.requirePin !== undefined) setRequirePin(parsed.requirePin);
        if (parsed.currency) setCurrency(parsed.currency);
      }
    } catch (e) {
      console.warn('Error reading stored settings', e);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('maher_admin_settings_v1', JSON.stringify({
        requirePin,
        currency,
        updatedAt: new Date().toISOString(),
      }));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Error saving settings', e);
    }
  };

  const handleToggleActive = async (u: Profile) => {
    if (u.id === currentUser?.id) {
      alert('Vous ne pouvez pas désactiver votre propre compte administrateur.');
      return;
    }
    await toggleUserActive(u.id);
  };

  const handleOpenPinModal = (u: Profile) => {
    setPinModalUser(u);
    setModalPin(u.pin_hash || '');
    setPinError(null);
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModalUser) return;
    if (!modalPin.trim()) {
      setPinError('Le code PIN ne peut pas être vide.');
      return;
    }

    try {
      await updateUserPin(pinModalUser.id, modalPin.trim());
      setPinModalUser(null);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      setPinError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const togglePinVisibility = (userId: string) => {
    setVisiblePins((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleResetData = () => {
    if (confirm('Voulez-vous réinitialiser la base de données de test à l\'état d\'usine initial ?')) {
      stockService.resetToDefault();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">
            {t('nav_settings')} Général & Gestion des Comptes
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Activation / désactivation immédiate des comptes, codes PIN des employés et règles de sécurité
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">Paramètres enregistrés avec succès.</span>
        </div>
      )}

      {/* 1. ACCOUNTS & USER STATUS MANAGEMENT (Directly functional!) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-orange" />
            <div>
              <CardTitle>Comptes Employés & État d&apos;Activation</CardTitle>
              <p className="text-[11px] text-gray-500 font-medium">
                Désactivez un compte en 1 clic pour bloquer son accès, ou modifiez son code PIN
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Employé</th>
                  <th className="py-3 px-4">Rôle & Service</th>
                  <th className="py-3 px-4 text-center">Code PIN</th>
                  <th className="py-3 px-4 text-center">État du Compte</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {allUsers.map((u) => {
                  const isVisible = !!visiblePins[u.id];
                  const pinVal = u.pin_hash || '1234';

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !u.is_active ? 'bg-red-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            u.is_active ? 'bg-brand-navy text-white' : 'bg-gray-300 text-gray-600'
                          }`}>
                            {u.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-brand-navy">{u.full_name}</p>
                            {!u.is_active && (
                              <span className="text-[10px] text-rose-600 font-bold">Accès désactivé</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' :
                            u.role === 'RESPONSABLE' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {u.role}
                          </span>
                          {u.department && (
                            <p className="text-[11px] text-gray-500">Service: {u.department}</p>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-gray-200">
                          <KeyRound className="w-3.5 h-3.5 text-brand-orange" />
                          <span className="font-mono font-bold tracking-widest text-xs">
                            {isVisible ? pinVal : '••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePinVisibility(u.id)}
                            className="text-gray-400 hover:text-gray-600 ml-0.5"
                            title={isVisible ? 'Masquer' : 'Afficher'}
                          >
                            {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.is_active ? 'Actif' : 'Désactivé'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPinModal(u)}
                            className="px-2.5 py-1 text-[11px] font-bold text-brand-orange hover:bg-amber-50 rounded-lg border border-brand-orange/30 transition-colors"
                          >
                            Modifier PIN
                          </button>

                          {u.id !== currentUser?.id && (
                            <button
                              type="button"
                              onClick={() => handleToggleActive(u)}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors border ${
                                u.is_active
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                              }`}
                            >
                              {u.is_active ? 'Désactiver' : 'Activer'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Establishment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Identité de l&apos;Établissement</CardTitle>
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
                <p className="font-bold text-brand-navy">Réservation automatique à l&apos;approbation</p>
                <p className="text-[11px] text-gray-500">Bloque les articles approuvés pour empêcher qu&apos;un autre service les prenne</p>
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
              Permet de recharger le jeu de données d&apos;origine (produits café, sucre, farine, chlore piscine, fournisseurs) pour recommencer une phase de test complète.
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

      {/* Modal Quick PIN change */}
      <Modal
        isOpen={!!pinModalUser}
        onClose={() => setPinModalUser(null)}
        title={`Modifier le code PIN de ${pinModalUser?.full_name}`}
        subtitle="Sécurité & Accès Complexe Maher"
        maxWidth="sm"
      >
        <form onSubmit={handleSavePin} className="space-y-4">
          {pinError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700">
                Nouveau code PIN (4 chiffres) *
              </label>
              <button
                type="button"
                onClick={() => {
                  const gen = Math.floor(1000 + Math.random() * 9000).toString();
                  setModalPin(gen);
                }}
                className="text-[11px] font-semibold text-brand-orange hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Générer un PIN
              </button>
            </div>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={modalPin}
              onChange={(e) => setModalPin(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
              className="text-center font-mono text-lg font-bold tracking-widest"
              placeholder="••••"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPinModalUser(null)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Sauvegarder le code PIN
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}