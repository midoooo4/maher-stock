'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { stockService } from '@/lib/db/stock-service';
import { Product } from '@/lib/supabase/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ProductQRCode } from '@/components/qr/ProductQRCode';
import { exportToCSV, exportToPDF } from '@/lib/export/pdf-csv';
import {
  Package,
  Search,
  Plus,
  QrCode,
  Edit2,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

const SUGGESTED_IMAGES = [
  { label: 'Café Grains', url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80' },
  { label: 'Sucre', url: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&q=80' },
  { label: 'Huile', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80' },
  { label: 'Farine', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80' },
  { label: 'Chlore', url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&q=80' },
  { label: 'Serviettes', url: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=600&q=80' },
  { label: 'Détergent', url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&q=80' },
  { label: 'Eau Minérale', url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&q=80' },
  { label: 'Lait UHT', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80' },
  { label: 'Thé Vert', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=80' },
  { label: 'Riz Basmati', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80' },
  { label: 'Tomates Boîte', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80' },
  { label: 'Savon Mains', url: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=600&q=80' },
  { label: 'Emballage Kraft', url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&q=80' },
];

export default function AdminProductsPage() {
  const { t } = useTranslation();
  const { user, role } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const categories = stockService.getCategories();
  const suppliers = stockService.getSuppliers();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

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
    physical_stock: 0,
    min_stock: 5,
    purchase_price: 0,
    supplier_id: suppliers[0]?.id || '',
    location: '',
    image_url: '',
  });

  const refreshProducts = () => {
    setProducts(stockService.getProducts());
  };

  useEffect(() => {
    refreshProducts();

    stockService.syncWithSupabase().then(() => {
      refreshProducts();
    });

    const handleUpdate = () => refreshProducts();
    window.addEventListener('maher_stock_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('maher_stock_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      code: `PRD-${Date.now().toString().slice(-4)}`,
      name_fr: '',
      name_ar: '',
      description: '',
      category_id: categories[0]?.id || '',
      unit: 'kg',
      physical_stock: 0,
      min_stock: 5,
      purchase_price: 0,
      supplier_id: suppliers[0]?.id || '',
      location: '',
      image_url: '',
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
      physical_stock: prod.physical_stock,
      min_stock: prod.min_stock,
      purchase_price: prod.purchase_price,
      supplier_id: prod.supplier_id || '',
      location: prod.location || '',
      image_url: prod.image_url || '',
    });
    setIsAddEditOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await stockService.saveProduct(
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
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name_fr.toLowerCase().includes(search.toLowerCase()) ||
      p.name_ar.includes(search) ||
      p.code.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;

    let matchesStatus = true;
    if (selectedStatus === 'low_stock') {
      matchesStatus = p.physical_stock - p.reserved_stock <= p.min_stock;
    } else if (selectedStatus === 'active') {
      matchesStatus = p.is_active;
    } else if (selectedStatus === 'inactive') {
      matchesStatus = !p.is_active;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleExportCSV = () => {
    const exportData = filteredProducts.map((p) => ({
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
    const totalVal = filteredProducts.reduce((acc, p) => acc + p.physical_stock * p.purchase_price, 0);
    const rows = filteredProducts.map((p) => [
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
            {t('nav_products')} & Fiches Articles
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Catalogue visuel, photos des articles, codes QR, seuils d&apos;alerte et valorisation PMP
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
                  {c.name_fr} ({c.name_ar})
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
              <option value="low_stock">⚠️ Alerte Stock Faible / Rupture</option>
              <option value="active">Actif en commande</option>
              <option value="inactive">Désactivé / Archivé</option>
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
                <th className="py-3 px-4">Article (Photo & Nom)</th>
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
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name_fr}
                              className="w-12 h-12 rounded-xl object-cover border border-gray-200 flex-shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-gray-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-brand-navy">{p.name_fr}</p>
                            <p className="text-[11px] text-gray-400 font-arabic">{p.name_ar}</p>
                            {p.location && (
                              <span className="text-[10px] text-gray-400">Empl: {p.location}</span>
                            )}
                          </div>
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
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-3 h-3" />}
                          {available} {p.unit}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-gray-600">
                        {p.purchase_price.toFixed(2)} {t('currency')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-brand-navy">
                        {itemValuation.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        {t('currency')}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-gray-400 hover:text-brand-navy rounded-lg hover:bg-slate-100 transition-colors"
                            title="Modifier l'article"
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
        title={editingProduct ? `Modifier - ${editingProduct.name_fr}` : 'Nouveau Produit Économat'}
        subtitle="Renseignez les détails, l'image et les règles d'alerte"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Code Article (Unique)"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              disabled={!!editingProduct}
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
              label="Nom du produit (Français) *"
              value={formData.name_fr}
              onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
              required
              placeholder="Ex: Café Grains Torréfié"
            />

            <Input
              label="Nom du produit (Arabe) *"
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
              label={
                editingProduct
                  ? `Stock physique actuel (${formData.unit}) *`
                  : `Quantité initiale en stock (${formData.unit}) *`
              }
              type="number"
              step="any"
              min="0"
              value={formData.physical_stock}
              onChange={(e) => setFormData({ ...formData, physical_stock: Number(e.target.value) })}
              required
              helperText={
                editingProduct
                  ? `Stock physique en réserve (${formData.physical_stock} ${formData.unit})`
                  : `Quantité disponible immédiatement à la création (${formData.unit})`
              }
            />

            <Input
              label="Stock Minimum d'alerte *"
              type="number"
              step="any"
              value={formData.min_stock}
              onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
              required
            />

            <Input
              label="Prix d'achat unitaire (MAD) *"
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

          {/* Product Image Section */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-brand-navy flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brand-orange" />
                Photo du produit (Chaque produit possède son image)
              </label>
              {formData.image_url && (
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                  Image configurée
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {formData.image_url ? (
                <img
                  src={formData.image_url}
                  alt="Aperçu"
                  className="w-16 h-16 rounded-xl object-cover border border-gray-300 shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-200 border border-gray-300 flex items-center justify-center flex-shrink-0 text-slate-400">
                  <Package className="w-8 h-8" />
                </div>
              )}

              <div className="flex-1">
                <Input
                  placeholder="Collez l'URL de l'image (https://...)"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>
            </div>

            <div>
              <p className="text-[10px] text-gray-500 font-semibold mb-1.5 uppercase">Images suggérées :</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_IMAGES.map((img) => (
                  <button
                    key={img.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, image_url: img.url })}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${
                      formData.image_url === img.url
                        ? 'bg-brand-orange text-white border-brand-orange font-bold'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-brand-navy'
                    }`}
                  >
                    {img.label}
                  </button>
                ))}
              </div>
            </div>
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
