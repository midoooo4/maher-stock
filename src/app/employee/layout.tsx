'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { AppShell } from '@/components/layout/AppShell';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      }
      // Employees, Managers, and Admins can all access employee routes
    }
  }, [user, role, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
