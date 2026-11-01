'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Profile, RoleType } from '../supabase/types';
import { supabase } from '../supabase/client';

interface AuthContextType {
  user: Profile | null;
  role: RoleType | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (profile: Profile) => void;
  allUsers: Profile[];
  addUser: (profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => Promise<Profile>;
  updateUser: (id: string, updates: Partial<Profile>) => Promise<Profile>;
  deleteUser: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_PROFILES: Profile[] = [
  {
    id: '4467c93c-183f-40cf-80ca-01e852946bfe',
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
    id: '5c7f6379-0685-4d14-b487-d520f9bf499e',
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
    id: '7bff4c1e-58ae-4ed6-93be-076c5896009d',
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
    id: '1acf7b74-8300-49d6-abf7-a2c022322923',
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
    id: '659341f9-3b68-42db-948f-612c0050616a',
    email: 'piscine.karim@complexe-maher.ma',
    full_name: 'Karim - Responsable Piscine',
    role: 'EMPLOYEE',
    department: 'Piscine',
    phone: '+212 6 65 00 00 05',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '748b3bcb-f8c5-4e33-bce1-725678872ec9',
    email: 'salma.salle@complexe-maher.ma',
    full_name: 'Salma - Maître d Hôtel Salle',
    role: 'EMPLOYEE',
    department: 'Restaurant',
    phone: '+212 6 66 00 00 06',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2e61e79c-4980-4054-a59d-92aa147e0969',
    email: 'hassan.entretien@complexe-maher.ma',
    full_name: 'Hassan - Chef Entretien & Hygiène',
    role: 'EMPLOYEE',
    department: 'Entretien',
    phone: '+212 6 67 00 00 07',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const USERS_STORAGE_KEY = 'maher_all_users_list_v2';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [allUsers, setAllUsers] = useState<Profile[]>(DEMO_PROFILES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Load users and current active session
  useEffect(() => {
    const loadStored = () => {
      try {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) {
          const parsed = JSON.parse(storedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAllUsers(parsed);
          }
        }
      } catch (e) {
        console.warn('Error reading stored users', e);
      }

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
    };

    loadStored();

    // Also fetch latest profiles from Supabase in background
    Promise.resolve(supabase.from('profiles').select('*'))
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const merged = [...DEMO_PROFILES];
          data.forEach((p: Profile) => {
            const idx = merged.findIndex((m) => m.id === p.id || m.email.toLowerCase() === p.email.toLowerCase());
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...p };
            } else {
              merged.push(p);
            }
          });
          setAllUsers(merged);
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged));
        }
      })
      .catch((err) => console.warn('Supabase profiles fetch note:', err));
  }, []);

  const login = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    const found = allUsers.find((p) => p.email.toLowerCase() === normalizedEmail);
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

  const addUser = async (profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<Profile> => {
    const newProfile: Profile = {
      ...profileData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [...allUsers, newProfile];
    setAllUsers(updated);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));

    // Try sync with Supabase
    try {
      await supabase.from('profiles').insert([{
        id: newProfile.id,
        email: newProfile.email,
        full_name: newProfile.full_name,
        role: newProfile.role,
        department: newProfile.department || null,
        phone: newProfile.phone || null,
        is_active: newProfile.is_active ?? true,
      }]);
    } catch (e) {
      console.warn('Supabase profile sync note:', e);
    }

    return newProfile;
  };

  const updateUser = async (id: string, updates: Partial<Profile>): Promise<Profile> => {
    let updatedProfile: Profile | null = null;
    const updated = allUsers.map((u) => {
      if (u.id === id) {
        updatedProfile = {
          ...u,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        return updatedProfile;
      }
      return u;
    });

    if (!updatedProfile) throw new Error('Utilisateur non trouvé');

    setAllUsers(updated);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));

    // If active user was updated, refresh active user session
    if (user && user.id === id) {
      setUser(updatedProfile);
      localStorage.setItem('maher_active_user', JSON.stringify(updatedProfile));
    }

    // Try sync with Supabase
    try {
      await supabase.from('profiles').update({
        full_name: updates.full_name,
        email: updates.email,
        role: updates.role,
        department: updates.department,
        phone: updates.phone,
        is_active: updates.is_active,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
    } catch (e) {
      console.warn('Supabase profile update note:', e);
    }

    return updatedProfile;
  };

  const deleteUser = async (id: string): Promise<void> => {
    const updated = allUsers.filter((u) => u.id !== id);
    setAllUsers(updated);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));

    try {
      await supabase.from('profiles').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase profile delete note:', e);
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
        allUsers,
        addUser,
        updateUser,
        deleteUser,
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
