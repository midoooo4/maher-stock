'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { Profile, RoleType } from '@/lib/supabase/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Users, Plus, ShieldCheck, Mail, Phone, Building, Edit2, Trash2, Key, Check, X } from 'lucide-react';

const DEPARTMENTS = [
  'Cuisine',
  'Cafe',
  'Restaurant',
  'Piscine',
  'Entretien',
];

export default function AdminEmployeesPage() {
  const { t } = useTranslation();
  const { allUsers, addUser, updateUser, deleteUser, user: currentUser } = useAuth();

  // Add / Edit Modal state
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE' as RoleType,
    department: 'Cuisine',
  });

  // Permissions View Modal
  const [permUser, setPermUser] = useState<Profile | null>(null);

  // Delete Modal
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      role: 'EMPLOYEE',
      department: 'Cuisine',
    });
    setIsOpenModal(true);
  };

  const handleOpenEdit = (u: Profile) => {
    setEditingUser(u);
    setFormData({
      full_name: u.full_name,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      department: u.department || 'Cuisine',
    });
    setIsOpenModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim()) return;

    if (editingUser) {
      await updateUser(editingUser.id, {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        department: formData.role === 'ADMIN' ? undefined : formData.department,
      });
    } else {
      await addUser({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        department: formData.role === 'ADMIN' ? undefined : formData.department,
        is_active: true,
      });
    }

    setIsOpenModal(false);
  };

  const handleToggleActive = async (u: Profile) => {
    if (u.id === currentUser?.id) return;
    await updateUser(u.id, { is_active: !u.is_active });
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    await deleteUser(deletingUser.id);
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
        { label: 'Gestion des Utilisateurs & Rôles', allowed: true },
        { label: 'Consultation du Journal d\'Audit Légal', allowed: true },
        { label: 'Export Rapports Financiers PDF / Excel', allowed: true },
        { label: 'Création de demandes de sortie', allowed: true },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">
            {t('nav_employees')} & Contrôle des Permissions (RBAC)
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Gestion nominative des comptes, attribution des services et contrôle granulaire des droits d&apos;accès
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Créer un utilisateur
        </Button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allUsers.map((u) => (
          <Card key={u.id} className="p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-navy text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                    {u.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-brand-navy text-sm truncate">{u.full_name}</h3>
                    {getRoleBadge(u.role)}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="p-1.5 text-gray-400 hover:text-brand-orange rounded-lg hover:bg-slate-100 transition-colors"
                    title="Modifier utilisateur"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {u.id !== currentUser?.id && (
                    <button
                      onClick={() => setDeletingUser(u)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{u.email}</span>
                </div>
                {u.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{u.phone}</span>
                  </div>
                )}
                {u.department && (
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-brand-orange" />
                    <span>Service: <strong>{u.department}</strong></span>
                  </div>
                )}
              </div>
            </div>

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
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                    u.is_active
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {u.is_active ? 'Désactiver' : 'Activer'}
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        title={editingUser ? 'Modifier l\'utilisateur & permissions' : 'Créer un nouvel utilisateur'}
        subtitle="Accès nominatif sécurisé Complexe Maher"
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

          <Input
            label="Adresse email professionnelle *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="youssef@complexe-maher.ma"
          />

          <Input
            label="Numéro de téléphone portable"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+212 6..."
          />

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

      {/* Permissions Modal */}
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
