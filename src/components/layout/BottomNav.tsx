'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useTranslation } from '@/lib/i18n/context';
import { LayoutDashboard, Package, PlusCircle, ClipboardList, CheckCircle2 } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  const { role } = useAuth();
  const { t } = useTranslation();

  if (role === 'ADMIN') return null; // Admin has rich dashboard on desktop/tablet

  // Specific buttons for employee vs manager
  const employeeItems = [
    { label: 'Accueil', href: '/employee/dashboard', icon: LayoutDashboard },
    { label: 'Produits', href: '/employee/products', icon: Package },
    { label: 'Demande', href: '/employee/new-request', icon: PlusCircle, highlight: true },
    { label: 'Mes Sorties', href: '/employee/my-requests', icon: ClipboardList },
  ];

  const managerItems = [
    { label: 'Accueil', href: '/manager/dashboard', icon: LayoutDashboard },
    { label: 'Produits', href: '/manager/products', icon: Package },
    { label: 'Demandes', href: '/manager/requests', icon: ClipboardList },
    { label: 'Remise', href: '/manager/deliveries', icon: CheckCircle2, highlight: true },
  ];

  const items = role === 'RESPONSABLE' ? managerItems : employeeItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1.5 shadow-lg safe-bottom">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                item.highlight
                  ? 'text-brand-orange font-bold'
                  : isActive
                  ? 'text-brand-navy font-bold'
                  : 'text-gray-500 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-full ${
                  item.highlight
                    ? 'bg-brand-orange text-white p-1.5 shadow-md -mt-3'
                    : isActive
                    ? 'bg-brand-navy/10 text-brand-navy'
                    : ''
                }`}
              >
                <Icon className={item.highlight ? 'w-5 h-5' : 'w-4 h-4'} />
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
