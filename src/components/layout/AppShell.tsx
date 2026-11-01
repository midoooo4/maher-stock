'use client';

import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-brand-navy">Chargement de MAHER STOCK...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, the pages handle login redirect or we show a clean shell
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col text-gray-900">
      <Header onMenuClick={() => setMobileMenuOpen(true)} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
