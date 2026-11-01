'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';

export default function HomePage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else if (role === 'RESPONSABLE') {
        router.replace('/manager/dashboard');
      } else {
        router.replace('/employee/dashboard');
      }
    }
  }, [user, role, isLoading, router]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-brand-navy">Redirection vers votre espace Complexe Maher...</p>
      </div>
    </div>
  );
}
