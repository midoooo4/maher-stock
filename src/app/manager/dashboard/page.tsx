'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';
import { stockService } from '@/lib/db/stock-service';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { QRScannerModal } from '@/components/qr/QRScannerModal';
import {
  ClipboardList,
  CheckCircle2,
  ArrowDownToLine,
  AlertOctagon,
  QrCode,
  CheckSquare,
  Plus,
  ArrowRight,
  Package,
} from 'lucide-react';

export default function ManagerDashboardPage() {
  const { t } = useTranslation();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const requests = stockService.getStockRequests();
  const products = stockService.getProducts();
  const movements = stockService.getStockMovements();

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const readyRequests = requests.filter(r => r.status === 'APPROVED' || r.status === 'READY');
  const lowStockProducts = products.filter(p => (p.physical_stock - p.reserved_stock) <= p.min_stock);

  const todayStr = new Date().toISOString().split('T')[0];
  const entriesToday = movements.filter(m => m.movement_type === 'ENTRY' && m.created_at.startsWith(todayStr)).length;

  return (
    <div className="space-y-6">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">
            Chambre Économat – Gestion Quotidienne
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Réceptions, réservations, remises physiques et contrôle des stocks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setIsScannerOpen(true)}
            variant="turquoise"
            size="sm"
            leftIcon={<QrCode className="w-4 h-4" />}
          >
            Scanner un article
          </Button>

          <Link href="/manager/entries">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ArrowDownToLine className="w-4 h-4" />}
            >
              Enregistrer une réception
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Operations KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Demandes à valider"
          value={pendingRequests.length}
          subtitle="En attente d'approbation"
          icon={<ClipboardList className="w-5 h-5" />}
          colorScheme={pendingRequests.length > 0 ? 'orange' : 'navy'}
        />

        <StatCard
          title="Prêts à remettre"
          value={readyRequests.length}
          subtitle="À décrémenter à la remise"
          icon={<CheckCircle2 className="w-5 h-5" />}
          colorScheme="emerald"
        />

        <StatCard
          title="Livraisons aujourd'hui"
          value={entriesToday}
          subtitle="Entrées enregistrées"
          icon={<ArrowDownToLine className="w-5 h-5" />}
          colorScheme="turquoise"
        />

        <StatCard
          title="Alertes stock faible"
          value={lowStockProducts.length}
          subtitle="Sous le seuil minimal"
          icon={<AlertOctagon className="w-5 h-5" />}
          colorScheme={lowStockProducts.length > 0 ? 'red' : 'emerald'}
        />
      </div>

      {/* Primary Workflow Panels: 1. Demandes à approuver, 2. Remise physique en attente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 1: Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Demandes de sortie en attente ({pendingRequests.length})</CardTitle>
            <Link href="/manager/requests" className="text-xs font-semibold text-brand-orange hover:underline">
              Traiter tout
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Aucune demande en attente.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingRequests.slice(0, 4).map(req => (
                  <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand-navy">{req.request_number}</span>
                        <span className="text-[11px] bg-slate-100 font-semibold px-2 py-0.5 rounded-full text-slate-700">
                          {req.department}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-1">{req.reason}</p>
                      <span className="text-[10px] text-gray-400">
                        {req.items?.length || 0} article(s) demandé(s)
                      </span>
                    </div>

                    <Link href="/manager/requests">
                      <Button variant="outline" size="sm" className="text-xs">
                        Valider
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel 2: Pending Deliveries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between bg-emerald-50/40">
            <CardTitle className="text-emerald-950">Prêts pour remise physique ({readyRequests.length})</CardTitle>
            <Link href="/manager/deliveries" className="text-xs font-semibold text-emerald-800 hover:underline">
              Accéder à la remise
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {readyRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Aucune commande en attente de retrait par les employés.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {readyRequests.slice(0, 4).map(req => (
                  <div key={req.id} className="p-4 flex items-center justify-between hover:bg-emerald-50/20 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand-navy">{req.request_number}</span>
                        <Badge status={req.status} size="sm" />
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                          {req.department}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Stock réservé • En attente de remise physique</p>
                    </div>

                    <Link href="/manager/deliveries">
                      <Button variant="primary" size="sm" className="text-xs">
                        Confirmer Remise
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Low Stock Warning Section */}
      {lowStockProducts.length > 0 && (
        <Card className="border-rose-200">
          <CardHeader className="bg-rose-50/50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-600" />
              <CardTitle className="text-rose-950">Articles en alerte stock minimum ({lowStockProducts.length})</CardTitle>
            </div>
            <Link href="/manager/entries" className="text-xs font-bold text-rose-800 hover:underline">
              Commander & Réceptionner
            </Link>
          </CardHeader>
          <div className="divide-y divide-gray-100">
            {lowStockProducts.map(p => (
              <div key={p.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/70">
                <div>
                  <span className="font-mono font-bold text-brand-navy">{p.code}</span>
                  <span className="mx-2 font-bold text-gray-800">{p.name_fr}</span>
                  <span className="text-gray-400 font-arabic">({p.name_ar})</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">
                    Seuil min: <strong>{p.min_stock} {p.unit}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold">
                    Dispo: {p.physical_stock - p.reserved_stock} {p.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onProductScanned={(p) => {
          alert(`Article scanné : ${p.name_fr} (${p.code}) - Stock disponible: ${p.physical_stock - p.reserved_stock} ${p.unit}`);
        }}
      />
    </div>
  );
}
