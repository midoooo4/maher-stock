'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import {
  LayoutDashboard,
  Package,
  Layers,
  ArrowDownToLine,
  ClipboardList,
  ArrowLeftRight,
  CheckSquare,
  AlertTriangle,
  Users,
  Building2,
  FileBarChart2,
  ShieldAlert,
  Settings,
  CheckCircle2,
  AlertOctagon,
  PlusCircle,
  Bell,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { role, user } = useAuth();

  // Navigation configurations based on role
  const adminNav = [
    { label: t('nav_dashboard'), href: '/admin/dashboard', icon: LayoutDashboard },
    { label: t('nav_products'), href: '/admin/products', icon: Package },
    { label: t('nav_categories'), href: '/admin/categories', icon: Layers },
    { label: t('nav_entries'), href: '/admin/entries', icon: ArrowDownToLine },
    { label: t('nav_requests'), href: '/admin/requests', icon: ClipboardList },
    { label: t('nav_movements'), href: '/admin/movements', icon: ArrowLeftRight },
    { label: t('nav_inventory'), href: '/admin/inventory', icon: CheckSquare },
    { label: t('nav_anomalies'), href: '/admin/anomalies', icon: AlertTriangle },
    { label: t('nav_employees'), href: '/admin/employees', icon: Users },
    { label: t('nav_suppliers'), href: '/admin/suppliers', icon: Building2 },
    { label: t('nav_reports'), href: '/admin/reports', icon: FileBarChart2 },
    { label: t('nav_audit'), href: '/admin/audit-logs', icon: ShieldAlert },
    { label: t('nav_settings'), href: '/admin/settings', icon: Settings },
  ];

  const managerNav = [
    { label: t('nav_dashboard'), href: '/manager/dashboard', icon: LayoutDashboard },
    { label: t('nav_products'), href: '/manager/products', icon: Package },
    { label: t('nav_entries'), href: '/manager/entries', icon: ArrowDownToLine },
    { label: t('nav_requests'), href: '/manager/requests', icon: ClipboardList },
    { label: t('nav_deliveries'), href: '/manager/deliveries', icon: CheckCircle2 },
    { label: t('nav_inventory'), href: '/manager/inventory', icon: CheckSquare },
    { label: t('nav_movements'), href: '/manager/movements', icon: ArrowLeftRight },
    { label: t('nav_alerts'), href: '/manager/alerts', icon: AlertOctagon },
  ];

  const employeeNav = [
    { label: t('nav_dashboard'), href: '/employee/dashboard', icon: LayoutDashboard },
    { label: t('nav_products'), href: '/employee/products', icon: Package },
    { label: t('nav_new_request'), href: '/employee/new-request', icon: PlusCircle },
    { label: t('nav_my_requests'), href: '/employee/my-requests', icon: ClipboardList },
    { label: t('nav_notifications'), href: '/employee/notifications', icon: Bell },
  ];

  const currentNav = role === 'ADMIN' ? adminNav : role === 'RESPONSABLE' ? managerNav : employeeNav;

  const content = (
    <div className="flex flex-col h-full bg-brand-navy text-white">
      {/* Sidebar Header */}
      <div className="p-5 flex items-center justify-between border-b border-brand-navy-light/60">
        <div className="space-y-0.5">
          <span className="text-[10px] tracking-wider font-bold text-brand-orange uppercase">
            Espace {role === 'ADMIN' ? 'Propriétaire' : role === 'RESPONSABLE' ? 'Économat' : 'Employé'}
          </span>
          <p className="text-xs text-slate-300 font-medium truncate max-w-[190px]">
            {user?.full_name || 'Utilisateur'}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-brand-orange text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:bg-brand-navy-light/80 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer info Complexe Maher */}
      <div className="p-4 border-t border-brand-navy-light/60 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">Système Actif</span>
        </div>
        <p className="text-[10px] text-slate-500">Complexe Maher Stock v1.0</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-[calc(100vh-4rem)] sticky top-16 flex-shrink-0 z-20">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm" onClick={onClose} />
          <div className="relative w-64 max-w-[80vw] h-full z-10 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
