'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { useTranslation } from '@/lib/i18n/context';
import { stockService } from '@/lib/db/stock-service';
import { Notification } from '@/lib/supabase/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

function formatRelativeTime(iso: string) {
  const now = new Date();
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return d.toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' });
}

export default function EmployeeNotificationsPage() {
  const { user } = useAuth();
  const { isRTL } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = () => {
    if (!user) return;
    const notifs = stockService
      .getNotifications(user.role, user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setNotifications(notifs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const handleMarkAsRead = (id: string) => {
    stockService.markNotificationAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach((n) => {
      if (!n.is_read) {
        stockService.markNotificationAsRead(n.id);
      }
    });
    loadNotifications();
  };

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-navy flex items-center gap-2 tracking-tight">
            <Bell className="w-5 h-5 text-brand-orange" />
            Centre de Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[11px] font-bold rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Alertes en temps réel sur vos demandes de sortie et l&apos;état de l&apos;économat
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            leftIcon={<CheckCheck className="w-4 h-4 text-emerald-600" />}
          >
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center gap-2 text-xs px-4 py-2 rounded-xl border transition-colors ${
            filter === 'all'
              ? 'bg-brand-navy text-white border-brand-navy font-semibold shadow-sm'
              : 'border-gray-200 text-gray-600 hover:border-brand-navy bg-white'
          }`}
        >
          <span>Toutes</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${filter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100'}`}>
            {notifications.length}
          </span>
        </button>

        <button
          onClick={() => setFilter('unread')}
          className={`flex items-center gap-2 text-xs px-4 py-2 rounded-xl border transition-colors ${
            filter === 'unread'
              ? 'bg-brand-orange text-white border-brand-orange font-semibold shadow-sm'
              : 'border-gray-200 text-gray-600 hover:border-brand-orange bg-white'
          }`}
        >
          <span>Non lues</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${filter === 'unread' ? 'bg-white/20 text-white' : 'bg-slate-100'}`}>
            {unreadCount}
          </span>
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-gray-600">
            {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification reçue'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Vous serez notifié dès qu&apos;une action concerne vos demandes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notif) => (
            <Card
              key={notif.id}
              className={`transition-colors border ${
                notif.is_read ? 'bg-white border-gray-200/80' : 'bg-sky-50/50 border-sky-200 shadow-sm'
              }`}
            >
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      notif.is_read ? 'bg-slate-100 text-slate-500' : 'bg-brand-orange/10 text-brand-orange'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs sm:text-sm font-bold ${notif.is_read ? 'text-gray-700' : 'text-brand-navy'}`}>
                      {isRTL ? notif.title_ar : notif.title_fr}
                    </p>
                    <p className="text-xs text-gray-600 font-medium mt-0.5">
                      {isRTL ? notif.message_ar : notif.message_fr}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(notif.created_at)}</span>
                    </div>
                  </div>
                </div>

                {!notif.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="text-xs text-brand-orange hover:bg-brand-orange/10 flex-shrink-0"
                  >
                    Marquer lu
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
