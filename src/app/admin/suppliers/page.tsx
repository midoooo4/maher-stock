'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { stockService } from '@/lib/db/stock-service';
import { Supplier } from '@/lib/supabase/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Building2, Phone, Mail, MapPin, Plus, Edit2, Trash2, Search, CheckCircle2 } from 'lucide-react';

export default function AdminSuppliersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');

  // Add / Edit Modal state
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingSup, setEditingSup] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Casablanca',
    notes: '',
  });

  // Delete modal state
  const [deletingSup, setDeletingSup] = useState<Supplier | null>(null);

  const loadSuppliers = () => {
    setSuppliers(stockService.getSuppliers());
  };

  useEffect(() => {
    loadSuppliers();

    const handleUpdate = () => loadSuppliers();
    window.addEventListener('maher_stock_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('maher_stock_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingSup(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: 'Casablanca',
      notes: '',
    });
    setIsOpenModal(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSup(sup);
    setFormData({
      name: sup.name,
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      city: sup.city || 'Casablanca',
      notes: sup.notes || '',
    });
    setIsOpenModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    stockService.saveSupplier({
      id: editingSup ? editingSup.id : undefined,
      name: formData.name.trim(),
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      address: formData.address.trim() || undefined,
      city: formData.city.trim() || 'Casablanca',
      notes: formData.notes.trim() || undefined,
    }, user?.id, user?.full_name, 'ADMIN');

    setIsOpenModal(false);
    loadSuppliers();
  };

  const handleDelete = () => {
    if (!deletingSup) return;
    stockService.deleteSupplier(deletingSup.id, user?.id, user?.full_name, 'ADMIN');
    setDeletingSup(null);
    loadSuppliers();
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.city || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">
            {t('nav_suppliers')} & Distributeurs
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Gestion complète des fournisseurs agréés pour l&apos;approvisionnement de Complexe Maher
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Ajouter un fournisseur
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un fournisseur..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange shadow-sm"
        />
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <Card key={s.id} className="p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 text-brand-turquoise flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-navy text-sm">{s.name}</h3>
                    <p className="text-[11px] text-gray-400">{s.city || 'Casablanca'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-1.5 text-gray-400 hover:text-brand-orange rounded-lg hover:bg-slate-100 transition-colors"
                    title="Modifier"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingSup(s)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-600 bg-slate-50 p-2.5 rounded-xl border border-gray-100">
                {s.notes || 'Fournisseur régulier'}
              </p>

              <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t border-gray-100">
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{s.email}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{s.address}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        title={editingSup ? 'Modifier le fournisseur' : 'Ajouter un nouveau fournisseur'}
        subtitle="Renseignez les coordonnées pour la gestion des réceptions"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Raison sociale / Nom *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Ex: Maroc Distribution SARL"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Numéro de téléphone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+212 5 22..."
            />
            <Input
              label="Adresse email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@fournisseur.ma"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Ville"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Casablanca"
            />
            <Input
              label="Adresse postale"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Zone Industrielle..."
            />
          </div>

          <Textarea
            label="Notes / Conditions de livraison"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Ex: Délai livraison 24h, franco 1500 DH..."
            rows={2}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOpenModal(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingSup ? 'Enregistrer les modifications' : 'Créer le fournisseur'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deletingSup}
        onClose={() => setDeletingSup(null)}
        title="Supprimer le fournisseur"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Êtes-vous sûr de vouloir supprimer le fournisseur <strong>{deletingSup?.name}</strong> ?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeletingSup(null)}>
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
