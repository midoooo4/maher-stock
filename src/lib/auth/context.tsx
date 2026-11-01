'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Profile, RoleType } from '../supabase/types';

interface AuthContextType {
  user: Profile | null;
  role: RoleType | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (profile: Profile) => void;
  allUsers: Profile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial known profiles for Complexe Maher
export const DEMO_PROFILES: Profile[] = [
  {
    id: 'u-admin-01',
    email: 'admin@complexe-maher.ma',
    full_name: 'M. Maher (Propriétaire)',
    role: 'ADMIN',
    department: undefined,
    phone: '+212 6 61 00 00 01',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'u-resp-01',
    email: 'economat@complexe-maher.ma',
    full_name: 'Rachid - Responsable Économat',
    role: 'RESPONSABLE',
    department: undefined,
    phone: '+212 6 62 00 00 02',
    is_active: true,
    pin_hash: '1234',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'u-emp-cuisine',
    email: 'chef.ahmed@complexe-maher.ma',
    full_name: 'Ahmed - Chef de Cuisine',
    role: 'EMPLOYEE',
    department: 'Cuisine',
    phone: '+212 6 63 00 00 03',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'u-emp-cafe',
    email: 'barista.omar@complexe-maher.ma',
    full_name: 'Omar - Chef Barista & Café',
    role: 'EMPLOYEE',
    department: 'Cafe',
    phone: '+212 6 64 00 00 04',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'u-emp-piscine',
    email: 'piscine.karim@complexe-maher.ma',
    full_name: 'Karim - Responsable Piscine',
    role: 'EMPLOYEE',
    department: 'Piscine',
    phone: '+212 6 65 00 00 05',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Check saved session in localStorage
    const savedUser = localStorage.getItem('maher_active_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch (e) {
        console.error('Error loading saved session', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    
    // Find matching profile
    const found = DEMO_PROFILES.find(p => p.email.toLowerCase() === normalizedEmail);
    if (!found) {
      setIsLoading(false);
      return { success: false, error: 'Identifiant ou email non reconnu pour Complexe Maher.' };
    }

    if (!found.is_active) {
      setIsLoading(false);
      return { success: false, error: 'Ce compte utilisateur a été désactivé par l\'administrateur.' };
    }

    setUser(found);
    localStorage.setItem('maher_active_user', JSON.stringify(found));
    setIsLoading(false);

    // Redirect based on role
    if (found.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (found.role === 'RESPONSABLE') {
      router.push('/manager/dashboard');
    } else {
      router.push('/employee/dashboard');
    }

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('maher_active_user');
    router.push('/login');
  };

  const switchUser = (profile: Profile) => {
    setUser(profile);
    localStorage.setItem('maher_active_user', JSON.stringify(profile));
    if (profile.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (profile.role === 'RESPONSABLE') {
      router.push('/manager/dashboard');
    } else {
      router.push('/employee/dashboard');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        login,
        logout,
        switchUser,
        allUsers: DEMO_PROFILES,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
