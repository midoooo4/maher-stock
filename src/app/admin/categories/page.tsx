'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { stockService } from '@/lib/db/stock-service';
import { Category, Product } from '@/lib/supabase/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  List,
  Coffee,
  Sparkles,
  Package,
  FileText,
  Utensils,
  Tag,
  Check,
  X,
  FolderTree
} from 'lucide-react';

// Preset color options suited for Complexe Maher Restaurant & Pool
const PRESET_COLORS = [
  { label: 'Or / Ambre', value: '#E99B39' },
  { label: 'Bleu Marine', value: '#151936' },
  { label: 'Turquoise Piscine', value: '#43A9B7' },
  { label: 'Rouge Cuisine', value: '#DC2626' },
  { label: 'Brun Café', value: '#78350F' },
  { label: 'Vert Émeraude', value: '#059669' },
  { label: 'Bleu Ciel', value: '#0284C7' },
  { label: 'Pourpre', value: '#7C3AED' },
  { label: 'Gris Ardoise', value: '#6B7280' },
];

// Preset icons with friendly labels
const PRESET_ICONS = [
  { id: 'Wheat', label: 'Alimentaire / Épicerie', icon: Utensils },
  { id: 'Coffee', label: 'Café & Boissons', icon: Coffee },
  { id: 'ChefHat', label: 'Cuisine & Fourneaux', icon: Utensils },
  { id: 'FileText', label: 'Papier & Consommables', icon: FileText },
  { id: 'Sparkles', label: 'Entretien & Piscine', icon: Sparkles },
  { id: 'Package', label: 'Emballages & Cartons', icon: Package },
  { id: 'Layers', label: 'Divers & Autres', icon: Layers },
  { id: 'Tag', label: 'Spécial & Promo', icon: Tag },
];

function getCategoryIconComponent(iconName?: string) {
  switch (iconName) {
    case 'Coffee':
      return Coffee;
    case 'FileText':
      return FileText;
    case 'Sparkles':
      return Sparkles;
    case 'Package':
      return Package;
    case 'Tag':
      return Tag;
    case 'Wheat':
    case 'ChefHat':
    case 'Utensils':
      return Utensils;
    case 'Layers':
    default:
      return Layers;
  }
}

export default function AdminCategoriesPage() {
  const { t, language } = useTranslation();
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name_fr: '',
    name_ar: '',
    description: '',
    color: '#E99B39',
    icon: 'Package',
    is_active: true,
  });

  // Delete modal state
  const [deleteCategoryItem, setDeleteCategoryItem] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Success alert
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setCategories(stockService.getCategories());
    setProducts(stockService.getProducts());
  }, []);

  useEffect(() => {
    loadData();
    stockService.syncWithSupabase().then(() => loadData()).catch(() => {});

    const handleUpdate = () => loadData();
    window.addEventListener('maher_stock_updated', handleUpdate);
    const interval = setInterval(() => {
      stockService.syncWithSupabase().then(() => loadData()).catch(() => {});
    }, 4000);

    return () => {
      window.removeEventListener('maher_stock_updated', handleUpdate);
      clearInterval(interval);
    };
  }, [loadData]);

  // Handle open add modal
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      code: `CAT_${Date.now().toString().slice(-4)}`,
      name_fr: '',
      name_ar: '',
      description: '',
      color: '#E99B39',
      icon: 'Package',
      is_active: true,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      code: cat.code,
      name_fr: cat.name_fr,
      name_ar: cat.name_ar || '',
      description: cat.description || '',
      color: cat.color || '#E99B39',
      icon: cat.icon || 'Package',
      is_active: cat.is_active,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Handle save (create or update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_fr.trim()) {
      setErrorMessage('Le nom en français est requis.');
      return;
    }
    if (!formData.code.trim()) {
      setErrorMessage('Le code de catégorie est requis.');
      return;
    }

    try {
      if (editingCategory) {
        stockService.saveCategory({
          id: editingCategory.id,
          code: formData.code.trim().toUpperCase(),
          name_fr: formData.name_fr.trim(),
          name_ar: formData.name_ar.trim() || formData.name_fr.trim(),
          description: formData.description.trim(),
          color: formData.color,
          icon: formData.icon,
          is_active: formData.is_active,
        }, user?.id, user?.full_name, user?.role);
        setSuccessMessage(`La catégorie "${formData.name_fr}" a été modifiée avec succès.`);
      } else {
        stockService.saveCategory({
          code: formData.code.trim().toUpperCase(),
          name_fr: formData.name_fr.trim(),
          name_ar: formData.name_ar.trim() || formData.name_fr.trim(),
          description: formData.description.trim(),
          color: formData.color,
          icon: formData.icon,
          is_active: formData.is_active,
        }, user?.id, user?.full_name, user?.role);
        setSuccessMessage(`La catégorie "${formData.name_fr}" a été créée avec succès.`);
      }

      setIsModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur est survenue lors de l\'enregistrement.');
    }
  };

  // Handle delete
  const handleDeleteConfirm = () => {
    if (!deleteCategoryItem) return;
    try {
      stockService.deleteCategory(deleteCategoryItem.id, user?.id, user?.full_name, user?.role);
      setSuccessMessage(`La catégorie "${deleteCategoryItem.name_fr}" a été supprimée.`);
      setDeleteCategoryItem(null);
      setDeleteError(null);
      loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setDeleteError(err.message || 'Impossible de supprimer cette catégorie.');
    }
  };

  // Filter categories
  const filteredCategories = categories.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.name_fr.toLowerCase().includes(q) ||
      (c.name_ar && c.name_ar.toLowerCase().includes(q)) ||
      c.code.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q));

    const matchStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? c.is_active
        : !c.is_active;

    return matchSearch && matchStatus;
  });

  // Calculate statistics
  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.is_active).length;
  const totalProducts = products.length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-brand-orange">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-brand-navy tracking-tight">
                {language === 'ar' ? 'تصنيفات المخزون' : 'Catégories de Stock'}
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                {language === 'ar'
                  ? 'إدارة وتنظيم أقسام وأصناف منتجات المطعم والمسبح'
                  : 'Classification, codes et organisation des rayons pour le restaurant et la piscine'}
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="bg-brand-orange hover:bg-amber-600 text-white font-bold text-sm shadow-sm gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? 'إضافة تصنيف' : 'Nouvelle Catégorie'}</span>
        </Button>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between animate-in fade-in duration-200 shadow-sm text-sm font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {language === 'ar' ? 'مجموع التصنيفات' : 'Total Catégories'}
            </p>
            <h3 className="text-2xl font-black text-brand-navy mt-1">{totalCategories}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-navy/5 flex items-center justify-center text-brand-navy">
            <Layers className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {language === 'ar' ? 'التصنيفات النشطة' : 'Catégories Actives'}
            </p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{activeCategories}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {language === 'ar' ? 'إجمالي المنتجات' : 'Articles Classés'}
            </p>
            <h3 className="text-2xl font-black text-brand-orange mt-1">{totalProducts}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
            <Package className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <Card className="p-4 bg-white border border-gray-100 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder={language === 'ar' ? 'البحث بالاسم أو الرمز...' : 'Rechercher par nom, code...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9 bg-gray-50 border-gray-200 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {/* Status Filter */}
            <div className="flex items-center bg-gray-100 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-brand-navy shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {language === 'ar' ? 'الكل' : 'Toutes'}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {language === 'ar' ? 'نشطة' : 'Actives'}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('INACTIVE')}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === 'INACTIVE'
                    ? 'bg-white text-gray-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {language === 'ar' ? 'غير نشطة' : 'Inactives'}
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-lg text-gray-500">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid' ? 'bg-white text-brand-navy shadow-xs' : 'hover:text-gray-900'
                }`}
                title="Vue Grille"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'table' ? 'bg-white text-brand-navy shadow-xs' : 'hover:text-gray-900'
                }`}
                title="Vue Tableau"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((c) => {
            const productCount = products.filter(
              (p) => p.category_id === c.id || p.category_id === c.code
            ).length;
            const IconComponent = getCategoryIconComponent(c.icon);

            return (
              <Card
                key={c.id}
                className="p-5 border border-gray-100 hover:border-amber-200 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group bg-white"
              >
                <div className="space-y-3">
                  {/* Card Header: Color, Icon, Code, Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: c.color || '#E99B39' }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-black tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {c.code}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                    >
                      {c.is_active
                        ? language === 'ar' ? 'نشط' : 'Actif'
                        : language === 'ar' ? 'معطل' : 'Inactif'}
                    </span>
                  </div>

                  {/* Names */}
                  <div>
                    <h3 className="font-black text-brand-navy text-base leading-snug group-hover:text-brand-orange transition-colors">
                      {c.name_fr}
                    </h3>
                    <p className="font-arabic text-xs font-semibold text-gray-400 mt-0.5">
                      {c.name_ar}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 line-clamp-2 min-h-[32px]">
                    {c.description || 'Classification officielle des produits de stock du Complexe Maher.'}
                  </p>
                </div>

                {/* Card Footer: Product count & Action Buttons */}
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-orange bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    <span>{productCount} {language === 'ar' ? 'منتج' : 'articles'}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(c)}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-brand-navy hover:bg-gray-100"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteCategoryItem(c);
                        setDeleteError(null);
                      }}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card className="bg-white border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                  <th className="py-3 px-4">Code & Couleur</th>
                  <th className="py-3 px-4">Nom Français</th>
                  <th className="py-3 px-4">Nom Arabe</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Articles</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium">
                {filteredCategories.map((c) => {
                  const productCount = products.filter(
                    (p) => p.category_id === c.id || p.category_id === c.code
                  ).length;
                  const IconComponent = getCategoryIconComponent(c.icon);

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: c.color || '#E99B39' }}
                          >
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                            {c.code}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-brand-navy">{c.name_fr}</td>
                      <td className="py-3 px-4 font-arabic text-gray-500">{c.name_ar}</td>
                      <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                        {c.description || '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-brand-orange bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                          {productCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}
                        >
                          {c.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(c)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-brand-navy hover:bg-gray-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteCategoryItem(c);
                              setDeleteError(null);
                            }}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <Card className="p-12 text-center bg-white border border-gray-100">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-brand-orange flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-brand-navy text-sm">
            {language === 'ar' ? 'لا توجد تصنيفات مطابقة' : 'Aucune catégorie trouvée'}
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            {language === 'ar'
              ? 'جرّب تعديل معايير البحث أو أضف تصنيفاً جديداً للمخزون.'
              : 'Modifiez vos filtres de recherche ou créez une nouvelle catégorie pour organiser le stock.'}
          </p>
          <Button
            onClick={handleOpenAdd}
            className="mt-4 bg-brand-orange hover:bg-amber-600 text-white font-bold text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>{language === 'ar' ? 'إضافة تصنيف' : 'Ajouter une Catégorie'}</span>
          </Button>
        </Card>
      )}

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Modifier la Catégorie' : 'Nouvelle Catégorie de Stock'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Code Unique <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Ex: ALIM, CAFE, PISCINE"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                className="font-mono text-xs"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">Identifiant unique majuscule</span>
            </div>

            {/* Statut Actif */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-brand-orange rounded border-gray-300 focus:ring-brand-orange"
                />
                <span className="text-xs font-bold text-gray-700">Catégorie active dans le catalogue</span>
              </label>
            </div>

            {/* Nom FR */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nom en Français <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Ex: Produits Alimentaires & Épicerie"
                value={formData.name_fr}
                onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                required
                className="text-xs font-medium"
              />
            </div>

            {/* Nom AR */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nom en Arabe (الاسم بالعربية)
              </label>
              <Input
                type="text"
                placeholder="Ex: المواد الغذائية والبقالة"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                className="text-xs font-arabic text-right"
                dir="rtl"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Description & Rayon de rangement
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Farines, huiles, sucres, conserves pour les préparations de la cuisine..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-gray-200 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-hidden transition-all bg-white"
            />
          </div>

          {/* Color Chooser */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Couleur d'identification visuelle
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((col) => (
                <button
                  key={col.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: col.value })}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    formData.color === col.value
                      ? 'ring-2 ring-offset-2 ring-brand-navy scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: col.value }}
                  title={col.label}
                >
                  {formData.color === col.value && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
              <div className="flex items-center gap-1.5 ml-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer border border-gray-200 p-0"
                />
                <span className="font-mono text-[11px] text-gray-500">{formData.color}</span>
              </div>
            </div>
          </div>

          {/* Icon Chooser */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Icône représentative
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_ICONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = formData.icon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: item.id })}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-brand-orange bg-amber-50/60 text-brand-navy font-bold'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{
                        backgroundColor: isSelected ? formData.color : '#F3F4F6',
                        color: isSelected ? '#FFFFFF' : '#4B5563',
                      }}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-xs"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-brand-orange hover:bg-amber-600 text-white font-bold text-xs"
            >
              {editingCategory ? 'Enregistrer les modifications' : 'Créer la catégorie'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deleteCategoryItem}
        onClose={() => {
          setDeleteCategoryItem(null);
          setDeleteError(null);
        }}
        title="Supprimer la Catégorie"
        maxWidth="md"
      >
        {deleteCategoryItem && (
          <div className="space-y-4">
            {deleteError ? (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span>Action impossible</span>
                </div>
                <p className="text-xs leading-relaxed">{deleteError}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Êtes-vous sûr de vouloir supprimer la catégorie{' '}
                  <span className="font-bold text-brand-navy">
                    &quot;{deleteCategoryItem.name_fr}&quot; ({deleteCategoryItem.code})
                  </span>{' '}
                  ?
                </p>
                {(() => {
                  const linkedCount = products.filter(
                    (p) =>
                      p.category_id === deleteCategoryItem.id ||
                      p.category_id === deleteCategoryItem.code
                  ).length;
                  if (linkedCount > 0) {
                    return (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Attention : {linkedCount} produit(s) rattaché(s)</p>
                          <p className="mt-0.5 text-amber-700">
                            La suppression sera bloquée tant que des articles appartiennent à cette catégorie.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <p className="text-xs text-gray-400">
                      Cette catégorie ne contient aucun produit rattaché et peut être supprimée en toute sécurité.
                    </p>
                  );
                })()}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDeleteCategoryItem(null);
                  setDeleteError(null);
                }}
                className="text-xs"
              >
                Annuler
              </Button>
              {!deleteError && (
                <Button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirmer la suppression</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
