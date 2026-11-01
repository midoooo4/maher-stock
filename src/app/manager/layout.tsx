'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { AppShell } from '@/components/layout/AppShell';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (role !== 'RESPONSABLE' && role !== 'ADMIN') {
        router.replace('/employee/dashboard');
      }
    }
  }, [user, role, isLoading, router]);

  if (isLoading || !user || (role !== 'RESPONSABLE' && role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
