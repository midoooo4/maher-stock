'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardList,
  CheckCircle,
  Package,
  Bell,
  Plus,
  ArrowRight,
  Clock,
  ChefHat,
  Coffee,
  Waves,
  Sparkles,
  Building2,
  MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { useTranslation } from '@/lib/i18n/context';
import { stockService } from '@/lib/db/stock-service';
import { StockRequest, Notification } from '@/lib/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const DEPT_ICONS: Record<string, React.ElementType> = {
  Cuisine: ChefHat,
  Cafe: Coffee,
  Piscine: Waves,
  Entretien: Sparkles,
  Salle: Building2,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { isRTL } = useTranslation();
  const router = useRouter();
  const [myRequests, setMyRequests] = useState<StockRequest[]>([]);
  const [myNotifications, setMyNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const reqs = stockService
      .getStockRequests()
      .filter((r) => r.employee_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setMyRequests(reqs);

    const notifs = stockService
      .getNotifications(user.role, user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
    setMyNotifications(notifs);
    setIsLoading(false);
  }, [user]);

  if (!user) return null;

  const pending = myRequests.filter((r) => r.status === 'PENDING').length;
  const approved = myRequests.filter((r) =>
    ['APPROVED', 'READY'].includes(r.status)
  ).length;
  const deliveredThisWeek = myRequests.filter((r) => {
    if (r.status !== 'DELIVERED') return false;
    const d = new Date(r.updated_at || r.created_at);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;
  const unreadNotifs = myNotifications.filter((n) => !n.is_read).length;

  const DeptIcon = DEPT_ICONS[user.department || ''] || MoreHorizontal;
  const recentRequests = myRequests.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-navy to-brand-navy/90 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-turquoise text-xs font-semibold uppercase tracking-wider mb-1">
              {isRTL ? 'مرحباً بك' : 'Bienvenue'} 👋
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{user.full_name}</h1>
            <div className="flex items-center gap-2 mt-2 text-white/80 text-sm">
              <DeptIcon className="h-4 w-4 text-brand-orange" />
              <span>Service : {user.department || 'Complexe Maher'}</span>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-center gap-1">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
              <DeptIcon className="h-8 w-8 text-brand-orange" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Demandes en attente', value: pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Prêtes / Approuvées', value: approved, icon: CheckCircle, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Livrées (7j)', value: deliveredThisWeek, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Notifications non lues', value: unreadNotifs, icon: Bell, color: 'text-brand-turquoise', bg: 'bg-teal-50' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-navy">{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* CTA Button */}
      <div className="flex justify-center py-2">
        <Button
          onClick={() => router.push('/employee/new-request')}
          size="lg"
          leftIcon={<Plus className="h-5 w-5" />}
          className="shadow-lg shadow-brand-orange/20 px-8"
        >
          Créer une nouvelle demande de sortie
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-brand-orange" />
              Mes demandes récentes
            </CardTitle>
            <Link
              href="/employee/my-requests"
              className="text-xs text-brand-turquoise hover:underline flex items-center gap-1 font-medium"
            >
              Tout voir <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Aucune demande pour l&apos;instant</p>
                <p className="text-xs mt-1">Créez votre première demande de sortie de stock ci-dessus</p>
              </div>
            ) : (
              recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-sm text-brand-navy truncate">{req.request_number}</p>
                    <p className="text-xs text-gray-500 truncate">{req.reason} · {formatDate(req.created_at)}</p>
                  </div>
                  <Badge status={req.status} size="sm" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand-orange" />
              Dernières notifications
              {unreadNotifs > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                  {unreadNotifs}
                </span>
              )}
            </CardTitle>
            <Link
              href="/employee/notifications"
              className="text-xs text-brand-turquoise hover:underline flex items-center gap-1 font-medium"
            >
              Tout voir <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {myNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Aucune notification reçue</p>
              </div>
            ) : (
              myNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                    notif.is_read ? 'bg-slate-50' : 'bg-sky-50/70 border border-sky-100'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      notif.is_read ? 'bg-gray-300' : 'bg-sky-500'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold ${notif.is_read ? 'text-gray-700' : 'text-brand-navy'}`}>
                      {isRTL ? notif.title_ar : notif.title_fr}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {isRTL ? notif.message_ar : notif.message_fr}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatDate(notif.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/employee/new-request', icon: Plus, label: 'Nouvelle demande', color: 'bg-brand-orange text-white' },
          { href: '/employee/my-requests', icon: ClipboardList, label: 'Mes demandes', color: 'bg-brand-navy text-white' },
          { href: '/employee/products', icon: Package, label: 'Catalogue produits', color: 'bg-brand-turquoise text-white' },
          { href: '/employee/notifications', icon: Bell, label: 'Centre notifications', color: 'bg-slate-700 text-white' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${link.color} rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:opacity-90 transition-opacity shadow-sm`}
          >
            <link.icon className="h-6 w-6" />
            <span className="text-xs font-bold">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
