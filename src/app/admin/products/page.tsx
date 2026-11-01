'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { stockService } from '@/lib/db/stock-service';
import { Product } from '@/lib/supabase/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ProductQRCode } from '@/components/qr/ProductQRCode';
import { exportToCSV, exportToPDF } from '@/lib/export/pdf-csv';
import {
  Package,
  Search,
  Plus,
  Filter,
  Download,
  QrCode,
  Edit2,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

export default function AdminProductsPage() {
  const { t, language } = useTranslation();
  const { user, role } = useAuth();

  const [products, setProducts] = useState<Product[]>(stockService.getProducts());
  const categories = stockService.getCategories();
  const suppliers = stockService.getSuppliers();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // all, low_stock, active, inactive

  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [qrModalProduct, setQrModalProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name_fr: '',
    name_ar: '',
    description: '',
    category_id: categories[0]?.id || '',
    unit: 'kg',
    min_stock: 5,
    purchase_price: 0,
    supplier_id: suppliers[0]?.id || '',
    location: '',
  });

  const refreshProducts = () => {
    setProducts(stockService.getProducts());
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      code: `PRD-${Date.now().toString().slice(-4)}`,
      name_fr: '',
      name_ar: '',
      description: '',
      category_id: categories[0]?.id || '',
      unit: 'kg',
      min_stock: 5,
      purchase_price: 0,
      supplier_id: suppliers[0]?.id || '',
      location: '',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      code: prod.code,
      name_fr: prod.name_fr,
      name_ar: prod.name_ar,
      description: prod.description || '',
      category_id: prod.category_id,
      unit: prod.unit,
      min_stock: prod.min_stock,
      purchase_price: prod.purchase_price,
      supplier_id: prod.supplier_id || '',
      location: prod.location || '',
    });
    setIsAddEditOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    stockService.saveProduct(
      {
        id: editingProduct?.id,
        ...formData,
      },
      user.id,
      user.full_name,
      role || 'ADMIN'
    );

    setIsAddEditOpen(false);
    refreshProducts();
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name_fr.toLowerCase().includes(search.toLowerCase()) ||
      p.name_ar.includes(search) ||
      p.code.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;

    let matchesStatus = true;
    if (selectedStatus === 'low_stock') {
      matchesStatus = (p.physical_stock - p.reserved_stock) <= p.min_stock;
    } else if (selectedStatus === 'active') {
      matchesStatus = p.is_active;
    } else if (selectedStatus === 'inactive') {
      matchesStatus = !p.is_active;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Export handlers
  const handleExportCSV = () => {
    const exportData = filteredProducts.map(p => ({
      code: p.code,
      name_fr: p.name_fr,
      name_ar: p.name_ar,
      category: p.category?.name_fr || '',
      physical_stock: p.physical_stock,
      reserved_stock: p.reserved_stock,
      available_stock: p.physical_stock - p.reserved_stock,
      unit: p.unit,
      purchase_price: p.purchase_price,
      total_valuation: Number((p.physical_stock * p.purchase_price).toFixed(2)),
      location: p.location || '',
    }));

    exportToCSV('complexe-maher-inventaire-produits', exportData, [
      { key: 'code', label: 'Code' },
      { key: 'name_fr', label: 'Nom Français' },
      { key: 'name_ar', label: 'Nom Arabe' },
      { key: 'category', label: 'Catégorie' },
      { key: 'physical_stock', label: 'Stock Physique' },
      { key: 'reserved_stock', label: 'Stock Réservé' },
      { key: 'available_stock', label: 'Stock Disponible' },
      { key: 'unit', label: 'Unité' },
      { key: 'purchase_price', label: 'Prix Achat (PMP)' },
      { key: 'total_valuation', label: 'Valeur Stock (MAD)' },
      { key: 'location', label: 'Emplacement' },
    ]);
  };

  const handleExportPDF = () => {
    const totalVal = filteredProducts.reduce((acc, p) => acc + (p.physical_stock * p.purchase_price), 0);
    const rows = filteredProducts.map(p => [
      p.code,
      p.name_fr,
      p.category?.name_fr || '',
      `${p.physical_stock} ${p.unit}`,
      `${p.physical_stock - p.reserved_stock} ${p.unit}`,
      `${p.purchase_price.toFixed(2)} MAD`,
      `${(p.physical_stock * p.purchase_price).toFixed(2)} MAD`,
    ]);

    exportToPDF({
      title: 'Catalogue Général des Stocks',
      subtitle: `Inventaire des stocks - ${filteredProducts.length} articles répertoriés`,
      headers: ['Code', 'Désignation', 'Catégorie', 'Stock Phys.', 'Stock Dispo', 'PMP', 'Valeur Totale'],
      rows,
      generatedBy: user?.full_name,
      totals: { label: 'Valeur Globale du Stock', value: `${totalVal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD` },
    });
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">
            {t('nav_products')}
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Fiches articles, codes QR, seuils d'alerte et valorisation PMP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Excel / CSV
          </Button>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            size="sm"
            leftIcon={<FileText className="w-3.5 h-3.5 text-rose-600" />}
          >
            PDF
          </Button>
          <Button
            onClick={handleOpenAdd}
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t('product_add_new')}
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, code ou référence..."
              className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange text-gray-700"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {language === 'ar' ? c.name_ar : c.name_fr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange text-gray-700"
            >
              <option value="all">Tous les statuts</option>
              <option value="low_stock">⚠️ Stock faible / Alerte</option>
              <option value="active">Actifs uniquement</option>
              <option value="inactive">Désactivés</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Code & QR</th>
                <th className="py-3 px-4">Désignation</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4 text-center">Stock Physique</th>
                <th className="py-3 px-4 text-center">Réservé</th>
                <th className="py-3 px-4 text-center">Disponible</th>
                <th className="py-3 px-4 text-right">Prix PMP</th>
                <th className="py-3 px-4 text-right">Valeur Stock</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    {t('product_empty')}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const available = p.physical_stock - p.reserved_stock;
                  const isLow = available <= p.min_stock;
                  const itemValuation = p.physical_stock * p.purchase_price;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setQrModalProduct(p)}
                          className="flex items-center gap-1.5 font-mono font-bold text-brand-navy hover:text-brand-orange group"
                          title="Voir & Imprimer QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5 text-brand-turquoise group-hover:scale-110 transition-transform" />
                          <span>{p.code}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-brand-navy">{p.name_fr}</p>
                          <p className="text-[11px] text-gray-400 font-arabic">{p.name_ar}</p>
                          {p.location && (
                            <span className="text-[10px] text-gray-400">Empl: {p.location}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {p.category?.name_fr || 'N/A'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-brand-navy">
                        {p.physical_stock} {p.unit}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={p.reserved_stock > 0 ? 'text-brand-orange font-bold' : 'text-gray-400'}>
                          {p.reserved_stock} {p.unit}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isLow && <AlertTriangle className="w-3 h-3" />}
                          {available} {p.unit}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-gray-600">
                        {p.purchase_price.toFixed(2)} {t('currency')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-brand-navy">
                        {itemValuation.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                        {t('currency')}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setQrModalProduct(p)}
                            className="p-1.5 text-gray-400 hover:text-brand-turquoise rounded-lg hover:bg-slate-100"
                            title="QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-gray-400 hover:text-brand-orange rounded-lg hover:bg-slate-100"
                            title="Modifier la fiche"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingProduct ? 'Modifier la fiche produit' : 'Ajouter un nouveau produit'}
        subtitle="Complexe Maher Stock"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Code Produit"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              disabled={!!editingProduct} // Code is immutable once created
            />

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Catégorie</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_fr} ({c.name_ar})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Nom du produit (Français)"
              value={formData.name_fr}
              onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
              required
              placeholder="Ex: Café Grains Torréfié"
            />

            <Input
              label="Nom du produit (Arabe)"
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              required
              placeholder="Ex: حبوب قهوة محمصة"
              className="font-arabic"
            />

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Unité de mesure</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange"
              >
                <option value="kg">Kilogramme (kg)</option>
                <option value="g">Gramme (g)</option>
                <option value="l">Litre (l)</option>
                <option value="ml">Millilitre (ml)</option>
                <option value="piece">Pièce / Unité</option>
                <option value="paquet">Paquet</option>
                <option value="carton">Carton</option>
                <option value="bouteille">Bouteille</option>
                <option value="sac">Sac</option>
              </select>
            </div>

            <Input
              label="Stock Minimum d'alerte"
              type="number"
              step="any"
              value={formData.min_stock}
              onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
              required
            />

            <Input
              label="Prix d'achat initial (MAD)"
              type="number"
              step="0.01"
              value={formData.purchase_price}
              onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
              required
            />

            <Input
              label="Emplacement chambre économat"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: Rayon C-1, Étagère haute"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fournisseur habituel</label>
            <select
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              <option value="">Aucun fournisseur associé</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description détaillée</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange"
              placeholder="Spécifications, dosage, marque..."
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddEditOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary">
              {editingProduct ? 'Mettre à jour' : 'Enregistrer le produit'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* QR Code Modal Preview & Print */}
      {qrModalProduct && (
        <Modal
          isOpen={!!qrModalProduct}
          onClose={() => setQrModalProduct(null)}
          title={`QR Code - ${qrModalProduct.name_fr}`}
          subtitle="Étiquette officielle Complexe Maher"
          maxWidth="sm"
        >
          <ProductQRCode product={qrModalProduct} size={180} />
        </Modal>
      )}
    </div>
  );
}
