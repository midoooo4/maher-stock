'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { Profile, RoleType } from '@/lib/supabase/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { 
  Users, 
  Plus, 
  Building, 
  Edit2, 
  Trash2, 
  Key, 
  KeyRound, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Power 
} from 'lucide-react';

const DEPARTMENTS = [
  'Cuisine',
  'Cafe',
  'Restaurant',
  'Piscine',
  'Entretien',
];

export default function AdminEmployeesPage() {
  const { t, language } = useTranslation();
  const { allUsers, addUser, updateUser, toggleUserActive, updateUserPin, deleteUser, user: currentUser } = useAuth();

  // Add / Edit Modal state
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    pin_hash: '1234',
    role: 'EMPLOYEE' as RoleType,
    department: 'Cuisine',
    is_active: true,
  });

  // Quick Change PIN Modal
  const [pinChangeUser, setPinChangeUser] = useState<Profile | null>(null);
  const [newPin, setNewPin] = useState('');
  const [pinModalError, setPinModalError] = useState<string | null>(null);

  // Show/Hide PIN toggle state for each user id
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  // Permissions View Modal
  const [permUser, setPermUser] = useState<Profile | null>(null);

  // Delete Modal
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);

  // Feedback banner
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const togglePinVisibility = (userId: string) => {
    setVisiblePins((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      full_name: '',
      pin_hash: Math.floor(1000 + Math.random() * 9000).toString(),
      role: 'EMPLOYEE',
      department: 'Cuisine',
      is_active: true,
    });
    setIsOpenModal(true);
  };

  const handleOpenEdit = (u: Profile) => {
    setEditingUser(u);
    setFormData({
      full_name: u.full_name,
      pin_hash: u.pin_hash || '1234',
      role: u.role,
      department: u.department || 'Cuisine',
      is_active: u.is_active,
    });
    setIsOpenModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) return;

    const cleanPin = formData.pin_hash.trim() || '1234';

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          full_name: formData.full_name.trim(),
          pin_hash: cleanPin,
          role: formData.role,
          department: formData.role === 'ADMIN' ? undefined : formData.department,
          is_active: formData.is_active,
        });
        showFeedback(language === 'ar' ? 'تم تحديث بيانات الموظف بنجاح' : 'Utilisateur et permissions mis à jour avec succès.');
      } else {
        await addUser({
          full_name: formData.full_name.trim(),
          email: `emp_${Date.now().toString().slice(-6)}@complexe-maher.ma`,
          pin_hash: cleanPin,
          role: formData.role,
          department: formData.role === 'ADMIN' ? undefined : formData.department,
          is_active: formData.is_active,
        });
        showFeedback(language === 'ar' ? 'تم إنشاء الموظف بنجاح' : 'Nouvel utilisateur créé avec succès.');
      }
      setIsOpenModal(false);
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Erreur', 'error');
    }
  };

  const handleToggleActive = async (u: Profile) => {
    if (u.id === currentUser?.id) {
      alert(language === 'ar' ? 'لا يمكنك تعطيل حسابك الخاص' : 'Vous ne pouvez pas désactiver votre propre compte administrateur.');
      return;
    }

    try {
      const updated = await toggleUserActive(u.id);
      showFeedback(
        updated.is_active
          ? `${updated.full_name} est maintenant réactivé.`
          : `${updated.full_name} a été désactivé.`
      );
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Erreur', 'error');
    }
  };

  const handleOpenPinModal = (u: Profile) => {
    setPinChangeUser(u);
    setNewPin(u.pin_hash || '');
    setPinModalError(null);
  };

  const handleSaveQuickPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinChangeUser) return;
    if (!newPin.trim()) {
      setPinModalError('Le code PIN ne peut pas être vide.');
      return;
    }

    try {
      await updateUserPin(pinChangeUser.id, newPin.trim());
      showFeedback(`Code PIN de ${pinChangeUser.full_name} modifié avec succès (${newPin.trim()}).`);
      setPinChangeUser(null);
    } catch (err: unknown) {
      setPinModalError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    await deleteUser(deletingUser.id);
    showFeedback(`${deletingUser.full_name} supprimé avec succès.`);
    setDeletingUser(null);
  };

  const getRoleBadge = (role: RoleType) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">👑 Propriétaire</span>;
      case 'RESPONSABLE':
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">🔑 Responsable Économat</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">👤 Employé</span>;
    }
  };

  const getPermissionsList = (role: RoleType) => {
    if (role === 'ADMIN') {
      return [
        { label: 'Supervision & KPI Financiers', allowed: true },
        { label: 'Création / Modification Produits & PMP', allowed: true },
        { label: 'Arbitrage & Validation des Écarts d\'Inventaire', allowed: true },
        { label: 'Gestion des Utilisateurs & Rôles & PINs', allowed: true },
        { label: 'Activation / Désactivation des Comptes', allowed: true },
        { label: 'Consultation du Journal d\'Audit Légal', allowed: true },
        { label: 'Export Rapports Financiers PDF / Excel', allowed: true },
      ];
    }
    if (role === 'RESPONSABLE') {
      return [
        { label: 'Réception des Marchandises Fournisseurs', allowed: true },
        { label: 'Validation des Demandes (Réservation de stock)', allowed: true },
        { label: 'Remise Physique au Comptoir (Décrément stock)', allowed: true },
        { label: 'Comptage & Sessions d\'Inventaire', allowed: true },
        { label: 'Déclaration des Anomalies avec Justification', allowed: true },
        { label: 'Auto-validation de ses propres demandes', allowed: false },
        { label: 'Validation unilatérale des écarts d\'inventaire', allowed: false },
      ];
    }
    return [
      { label: 'Création de demandes multi-produits', allowed: true },
      { label: 'Suivi de ses demandes en direct', allowed: true },
      { label: 'Annulation d\'une demande en attente', allowed: true },
      { label: 'Consultation indicative des stocks', allowed: true },
      { label: 'Réception ou sortie physique directe de stock', allowed: false },
      { label: 'Validation de demandes', allowed: false },
      { label: 'Accès aux paramètres administrateur', allowed: false },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">
            {t('nav_employees')} & Gestion des Codes PIN
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Accès sécurisé par code PIN (sans email ni téléphone), permissions des services et désactivation des comptes
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Créer un employé
        </Button>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 animate-fadeIn ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          <span className="font-semibold">{feedbackMsg.text}</span>
        </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allUsers.map((u) => {
          const isPinVisible = !!visiblePins[u.id];
          const displayPin = u.pin_hash || '1234';

          return (
            <Card
              key={u.id}
              className={`p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all ${
                !u.is_active ? 'bg-slate-50/70 border-dashed border-red-200 opacity-80' : ''
              }`}
            >
              <div className="space-y-3">
                {/* Header card with Avatar and actions */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0 ${
                      u.is_active ? 'bg-brand-navy text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {u.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-brand-navy text-sm truncate">{u.full_name}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {getRoleBadge(u.role)}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.is_active ? 'Actif' : 'Désactivé'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-1.5 text-gray-400 hover:text-brand-orange rounded-lg hover:bg-slate-100 transition-colors"
                      title="Modifier nom, rôle, service et PIN"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => setDeletingUser(u)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Section: Service & PIN Security */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {/* Department */}
                  {u.department && (
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <Building className="w-3.5 h-3.5 text-brand-orange" />
                        Service affecté :
                      </span>
                      <strong className="text-brand-navy bg-slate-100 px-2 py-0.5 rounded-lg">
                        {u.department}
                      </strong>
                    </div>
                  )}

                  {/* PIN Display & Edit */}
                  <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-brand-orange" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 block leading-tight">
                          Code PIN d&apos;accès
                        </span>
                        <span className="font-mono font-bold text-sm text-brand-navy tracking-widest">
                          {isPinVisible ? displayPin : '••••'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => togglePinVisibility(u.id)}
                        className="p-1 text-gray-400 hover:text-brand-navy rounded-lg transition-colors"
                        title={isPinVisible ? 'Masquer le PIN' : 'Afficher le PIN'}
                      >
                        {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPinModal(u)}
                        className="text-[11px] font-bold text-brand-orange hover:bg-white px-2 py-1 rounded-lg border border-brand-orange/30 shadow-xs transition-colors"
                      >
                        Modifier PIN
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Card Actions: Permissions & Activation / Désactivation */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPermUser(u)}
                  className="text-[11px] font-semibold text-brand-turquoise hover:underline flex items-center gap-1"
                >
                  <Key className="w-3 h-3" /> Voir permissions
                </button>

                {u.id !== currentUser?.id && (
                  <button
                    onClick={() => handleToggleActive(u)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                      u.is_active
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{u.is_active ? 'Désactiver le compte' : 'Activer le compte'}</span>
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Modal (No phone, no email!) */}
      <Modal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        title={editingUser ? "Modifier l'utilisateur & permissions" : 'Créer un nouvel utilisateur'}
        subtitle="Accès nominatif par code PIN - Complexe Maher"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nom complet de l'employé *"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
            placeholder="Ex: Youssef Bennani"
          />

          {/* PIN Input with Random Generator Button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-700">
                Code PIN d&apos;accès (4 chiffres) *
              </label>
              <button
                type="button"
                onClick={() => {
                  const gen = Math.floor(1000 + Math.random() * 9000).toString();
                  setFormData({ ...formData, pin_hash: gen });
                }}
                className="text-[11px] font-semibold text-brand-orange hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Générer un PIN aléatoire
              </button>
            </div>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={formData.pin_hash}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, pin_hash: val });
              }}
              required
              leftIcon={<KeyRound className="w-4 h-4 text-brand-orange" />}
              placeholder="Ex: 1234"
              helperText="Ce code PIN servira pour la connexion et pour la validation des mouvements."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Rôle & Niveau d&apos;accès</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as RoleType })}
              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              <option value="EMPLOYEE">Employé (Demandes et consultation)</option>
              <option value="RESPONSABLE">Responsable Économat (Gestion des stocks et remises)</option>
              <option value="ADMIN">Administrateur (Propriétaire - Tous les droits)</option>
            </select>
          </div>

          {formData.role !== 'ADMIN' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Service d&apos;affectation</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Account status switch */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-brand-navy">État du compte</p>
              <p className="text-[11px] text-gray-500">
                {formData.is_active ? 'Compte actif et autorisé à se connecter' : 'Compte désactivé (accès bloqué)'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOpenModal(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingUser ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Change PIN Modal */}
      <Modal
        isOpen={!!pinChangeUser}
        onClose={() => setPinChangeUser(null)}
        title={`Modifier le code PIN de ${pinChangeUser?.full_name}`}
        subtitle="Définissez le nouveau code PIN de l'employé"
        maxWidth="sm"
      >
        <form onSubmit={handleSaveQuickPin} className="space-y-4">
          {pinModalError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{pinModalError}</span>
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
                  setNewPin(gen);
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
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
              className="text-center font-mono text-lg font-bold tracking-widest"
              placeholder="••••"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPinChangeUser(null)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Sauvegarder le code PIN
            </Button>
          </div>
        </form>
      </Modal>

      {/* Permissions Matrix Modal */}
      <Modal
        isOpen={!!permUser}
        onClose={() => setPermUser(null)}
        title={`Matrice des permissions - ${permUser?.full_name}`}
        subtitle={`Rôle attribué : ${permUser?.role}`}
        maxWidth="md"
      >
        <div className="space-y-3">
          {permUser && getPermissionsList(permUser.role).map((p, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-slate-50">
              <span className="text-xs font-medium text-gray-700">{p.label}</span>
              {p.allowed ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" /> Autorisé
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  <X className="w-3 h-3" /> Bloqué
                </span>
              )}
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setPermUser(null)}>
              Fermer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Supprimer l'utilisateur"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Êtes-vous sûr de vouloir supprimer définitivement le compte de <strong>{deletingUser?.full_name}</strong> ?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeletingUser(null)}>
              Annuler
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}