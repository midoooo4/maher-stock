'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { Profile } from '@/lib/supabase/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Users, Plus, ShieldCheck, Mail, Phone, Building } from 'lucide-react';

export default function AdminEmployeesPage() {
  const { t } = useTranslation();
  const { allUsers } = useAuth();
  const [usersList, setUsersList] = useState<Profile[]>(allUsers);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE',
    department: 'Cuisine',
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: Profile = {
      id: `u-emp-${Date.now()}`,
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role as Profile['role'],
      department: formData.department,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setUsersList([...usersList, newUser]);
    setIsAddOpen(false);
  };

  const toggleUserActive = (id: string) => {
    setUsersList(
      usersList.map((u) => {
        if (u.id === id) {
          return { ...u, is_active: !u.is_active };
        }
        return u;
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">
            {t('nav_employees')} & Rôles
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Création et gestion des comptes utilisateurs (Comptes individuels avec contrôle RBAC)
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Créer un compte employé
        </Button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {usersList.map((u) => (
          <Card key={u.id} className="p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-navy text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {u.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-navy text-sm">{u.full_name}</h3>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      u.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' :
                      u.role === 'RESPONSABLE' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role === 'ADMIN' ? '👑 Propriétaire' : u.role === 'RESPONSABLE' ? '🔑 Responsable Économat' : '👤 Employé'}
                    </span>
                  </div>
                </div>

                <span className={`w-2.5 h-2.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
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

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                Statut: <strong>{u.is_active ? 'Actif' : 'Désactivé'}</strong>
              </span>

              {u.role !== 'ADMIN' && (
                <button
                  onClick={() => toggleUserActive(u.id)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                    u.is_active
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {u.is_active ? 'Désactiver compte' : 'Réactiver compte'}
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Créer un compte employé"
        subtitle="Complexe Maher Stock - Accès nominatif sécurisé"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Nom complet de l'employé"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
            placeholder="Ex: Youssef Bennani"
          />

          <Input
            label="Adresse email professionnelle"
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
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Rôle attribué</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              <option value="EMPLOYEE">Employé (Demandes et consultation)</option>
              <option value="RESPONSABLE">Responsable Économat (Gestion et remises)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Service d'affectation</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              <option value="Cuisine">Cuisine</option>
              <option value="Cafe">Café</option>
              <option value="Restaurant">Restaurant / Salle</option>
              <option value="Piscine">Piscine</option>
              <option value="Entretien">Entretien & Nettoyage</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Créer le compte
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
