'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';
import { stockService } from '@/lib/db/stock-service';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Package,
  Layers,
  Coins,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  ShieldCheck,
  AlertOctagon,
  Calendar,
  Eye,
  PlusCircle,
  FileBarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function AdminDashboardPage() {
  const { t, language } = useTranslation();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');

  const [products, setProducts] = useState(stockService.getProducts());
  const [categories, setCategories] = useState(stockService.getCategories());
  const [requests, setRequests] = useState(stockService.getStockRequests());
  const [movements, setMovements] = useState(stockService.getStockMovements());
  const [adjustments, setAdjustments] = useState(stockService.getStockAdjustments());

  const refreshData = () => {
    setProducts(stockService.getProducts());
    setCategories(stockService.getCategories());
    setRequests(stockService.getStockRequests());
    setMovements(stockService.getStockMovements());
    setAdjustments(stockService.getStockAdjustments());
  };

  React.useEffect(() => {
    refreshData();
    stockService.syncWithSupabase().then(() => {
      refreshData();
    });

    const handleUpdate = () => refreshData();
    window.addEventListener('maher_stock_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    const interval = setInterval(() => {
      refreshData();
    }, 4000);

    return () => {
      window.removeEventListener('maher_stock_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  // 8 KPIs
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const totalStockValue = products.reduce((acc, p) => acc + (p.physical_stock * p.purchase_price), 0);
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const exitsToday = movements.filter(m => m.movement_type === 'EXIT' && m.created_at.startsWith(todayStr)).length;
  const entriesToday = movements.filter(m => m.movement_type === 'ENTRY' && m.created_at.startsWith(todayStr)).length;
  const lowStockCount = products.filter(p => (p.physical_stock - p.reserved_stock) <= p.min_stock).length;
  const pendingAnomaliesCount = adjustments.filter(a => a.status === 'PENDING_APPROVAL').length;

  // Chart data 1: Category breakdown
  const categoryChartData = categories.map(cat => {
    const count = products.filter(p => p.category_id === cat.id).length;
    const value = products
      .filter(p => p.category_id === cat.id)
      .reduce((acc, p) => acc + (p.physical_stock * p.purchase_price), 0);
    return {
      name: language === 'ar' ? cat.name_ar : cat.name_fr,
      count,
      value: Math.round(value),
      color: cat.color || '#E99B39',
    };
  }).filter(c => c.count > 0);

  // Chart data 2: Movements In vs Out (Daily simulated or real)
  const movementChartData = [
    { day: 'Lun', entree: 450, sortie: 320 },
    { day: 'Mar', entree: 200, sortie: 480 },
    { day: 'Mer', entree: 600, sortie: 510 },
    { day: 'Jeu', entree: 310, sortie: 390 },
    { day: 'Ven', entree: 750, sortie: 680 },
    { day: 'Sam', entree: 900, sortie: 850 },
    { day: 'Dim', entree: 120, sortie: 720 },
  ];

  // Colors for charts
  const PIE_COLORS = ['#E99B39', '#151936', '#43A9B7', '#DC2626', '#0284C7', '#854D0E', '#6B7280'];

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">
            {t('nav_dashboard')} – Propriétaire
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Supervision globale de l'économat et contrôle des mouvements de stock
          </p>
        </div>

        {/* Time filters */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              period === 'today' ? 'bg-brand-navy text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('filter_today')}
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              period === 'week' ? 'bg-brand-navy text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('filter_week')}
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              period === 'month' ? 'bg-brand-navy text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('filter_month')}
          </button>
        </div>
      </div>

      {/* Critical Alerts Banner (Anti-theft & Discrepancies) */}
      {(pendingAnomaliesCount > 0 || lowStockCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pendingAnomaliesCount > 0 && (
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    {pendingAnomaliesCount} écart(s) d'inventaire en attente de décision
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Des écarts constatés nécessitent votre autorisation pour ajuster le stock.
                  </p>
                </div>
              </div>
              <Link href="/admin/anomalies">
                <Button variant="primary" size="sm" className="text-xs">
                  Examiner
                </Button>
              </Link>
            </div>
          )}

          {lowStockCount > 0 && (
            <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-rose-900">
                    {lowStockCount} produit(s) en alerte stock faible
                  </p>
                  <p className="text-[11px] text-rose-700">
                    Le stock disponible est sous le seuil d'alerte défini.
                  </p>
                </div>
              </div>
              <Link href="/admin/products?filter=low_stock">
                <Button variant="danger" size="sm" className="text-xs">
                  Voir articles
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 8 Primary KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title={t('stat_total_products')}
          value={totalProducts}
          subtitle={`${products.filter(p => p.is_active).length} actifs`}
          icon={<Package className="w-5 h-5" />}
          colorScheme="orange"
        />
        <StatCard
          title={t('stat_total_categories')}
          value={totalCategories}
          subtitle="Catégories restaurant & piscine"
          icon={<Layers className="w-5 h-5" />}
          colorScheme="navy"
        />
        <StatCard
          title={t('stat_stock_value')}
          value={`${totalStockValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t('currency')}`}
          subtitle="Valorisation globale au PMP"
          icon={<Coins className="w-5 h-5" />}
          colorScheme="turquoise"
        />
        <StatCard
          title={t('stat_pending_requests')}
          value={pendingRequests}
          subtitle="À valider par économat"
          icon={<ClipboardList className="w-5 h-5" />}
          colorScheme={pendingRequests > 0 ? 'orange' : 'navy'}
        />

        <StatCard
          title={t('stat_entries_today')}
          value={entriesToday}
          subtitle="Réceptions enregistrées"
          icon={<ArrowDownRight className="w-5 h-5" />}
          colorScheme="emerald"
        />
        <StatCard
          title={t('stat_exits_today')}
          value={exitsToday}
          subtitle="Sorties physiques confirmées"
          icon={<ArrowUpRight className="w-5 h-5" />}
          colorScheme="navy"
        />
        <Link href="/admin/products?filter=low_stock" className="block cursor-pointer">
          <StatCard
            title={t('stat_low_stock')}
            value={lowStockCount}
            subtitle="Seuil minimum atteint"
            icon={<AlertOctagon className="w-5 h-5" />}
            colorScheme={lowStockCount > 0 ? 'red' : 'emerald'}
          />
        </Link>
        <Link href="/admin/anomalies" className="block cursor-pointer">
          <StatCard
            title={t('stat_anomalies')}
            value={pendingAnomaliesCount}
            subtitle="Écarts à régulariser"
            icon={<AlertTriangle className="w-5 h-5" />}
            colorScheme={pendingAnomaliesCount > 0 ? 'red' : 'emerald'}
          />
        </Link>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Movements Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Flux hebdomadaire des entrées et sorties (MAD)</CardTitle>
            <span className="text-xs text-gray-400 font-medium">Complexe Maher</span>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movementChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151936', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="entree" name="Entrées (MAD)" fill="#43A9B7" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="sortie" name="Sorties (MAD)" fill="#E99B39" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Value Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition de la valeur du stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => `${val.toLocaleString()} ${t('currency')}`}
                    contentStyle={{ backgroundColor: '#151936', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Section: Demandes en attente & Dernières Opérations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Requests Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Demandes de sortie en attente</CardTitle>
            <Link href="/admin/requests" className="text-xs font-semibold text-brand-orange hover:underline">
              Voir tout
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {requests.filter(r => r.status === 'PENDING').length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Aucune demande en attente actuellement.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {requests.filter(r => r.status === 'PENDING').slice(0, 5).map(req => (
                  <div key={req.id} className="p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand-navy">{req.request_number}</span>
                        <Badge status={req.status} size="sm" />
                        <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                          {req.department}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-1">{req.reason}</p>
                      <span className="text-[10px] text-gray-400">
                        {req.items?.length || 0} article(s) demandé(s)
                      </span>
                    </div>

                    <Link href="/admin/requests">
                      <Button variant="outline" size="sm" className="text-xs">
                        Gérer
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Stock Movements Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Derniers mouvements de stock</CardTitle>
            <Link href="/admin/movements" className="text-xs font-semibold text-brand-navy hover:underline">
              Journal complet
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {movements.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Aucun mouvement de stock enregistré.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {movements.slice(0, 5).map(m => {
                  const isEntry = m.movement_type === 'ENTRY';
                  const isExit = m.movement_type === 'EXIT';
                  return (
                    <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isEntry ? 'bg-emerald-100 text-emerald-700' :
                          isExit ? 'bg-amber-100 text-amber-800' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {isEntry ? 'IN' : isExit ? 'OUT' : 'ADJ'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-brand-navy">{m.product?.name_fr || 'Produit'}</p>
                          <p className="text-[11px] text-gray-500 font-mono">
                            {m.movement_number} • Stock : {m.stock_before} → {m.stock_after}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-xs font-bold ${isEntry ? 'text-emerald-600' : 'text-brand-navy'}`}>
                          {isEntry ? `+${m.quantity}` : `-${m.quantity}`} {m.product?.unit}
                        </span>
                        <p className="text-[10px] text-gray-400">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
