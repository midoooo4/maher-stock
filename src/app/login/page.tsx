'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Globe, Eye, EyeOff, Lock, Mail, ShieldAlert, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { t, language, toggleLanguage } = useTranslation();
  const { login, allUsers } = useAuth();

  const [email, setEmail] = useState('admin@complexe-maher.ma');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || t('login_invalid_creds'));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('demo1234');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-orange/5 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-turquoise/5 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Top right language switch */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-brand-navy shadow-sm hover:bg-gray-50 transition-colors"
        >
          <Globe className="w-4 h-4 text-brand-turquoise" />
          <span>{language === 'fr' ? 'العربية' : 'Français'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Logo and title */}
        <div className="text-center space-y-3">
          <div className="relative w-24 h-24 mx-auto rounded-2xl bg-white p-2 shadow-card border border-amber-100 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Complexe Maher"
              width={88}
              height={88}
              priority
              className="object-contain"
            />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-brand-navy tracking-tight">
              {t('appName')}
            </h2>
            <p className="text-xs font-medium text-brand-orange tracking-wide uppercase mt-0.5">
              {t('appSubtitle')}
            </p>
            <p className="text-[11px] text-gray-500 font-medium mt-1">
              {t('establishment')}
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="mt-8 bg-white py-8 px-6 shadow-dropdown rounded-3xl border border-gray-100 sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <Input
                label={t('login_email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leftIcon={<Mail className="w-4 h-4" />}
                placeholder="nom@complexe-maher.ma"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-700">
                  {t('login_password')}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-brand-orange hover:underline"
                >
                  {t('login_forgot_password')}
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  leftIcon={<Lock className="w-4 h-4" />}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              {t('login_btn')}
            </Button>
          </form>

          {/* Quick Demo Login Picker */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
              <span>{t('login_demo_select')}</span>
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickSelect(u.email)}
                  className={`flex items-center justify-between p-2 text-left rounded-xl border text-xs transition-colors ${
                    email === u.email
                      ? 'border-brand-orange bg-amber-50/70 font-semibold'
                      : 'border-gray-100 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {u.role === 'ADMIN' ? '👑' : u.role === 'RESPONSABLE' ? '🔑' : '👤'}
                    </span>
                    <div>
                      <p className="font-semibold text-brand-navy leading-tight">{u.full_name}</p>
                      <p className="text-[10px] text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    u.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' :
                    u.role === 'RESPONSABLE' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} COMPLEXE MAHER – Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
