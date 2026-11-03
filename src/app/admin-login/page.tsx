'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, KeyRound, Delete, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const { language } = useTranslation();
  const { login, allUsers } = useAuth();

  // Find admin account
  const adminUser = allUsers.find((u) => u.role === 'ADMIN');

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDigitClick = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setError(null);
    }
  };

  const handleDeleteDigit = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClearPin = () => {
    setPin('');
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminUser) {
      setError(language === 'ar' ? 'حساب المدير غير موجود' : 'Compte administrateur introuvable.');
      return;
    }
    if (!pin) {
      setError(language === 'ar' ? 'يرجى إدخال رمز PIN' : 'Veuillez saisir votre code PIN.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await login(adminUser.id, pin);
      if (!result.success) {
        setError(result.error || (language === 'ar' ? 'رمز PIN غير صحيح' : 'Code PIN incorrect.'));
        setPin('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col justify-center py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-orange/10 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-turquoise/10 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-sm px-4">

        {/* Logo & Title */}
        <div className="text-center space-y-3 mb-8">
          <div className="relative w-16 h-16 mx-auto rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
            <ShieldCheck className="w-8 h-8 text-brand-orange" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {language === 'ar' ? 'لوحة الإدارة' : 'Espace Administrateur'}
            </h2>
            <p className="text-xs font-medium text-white/50 mt-1">
              COMPLEXE MAHER — ACCÈS RESTREINT
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl py-6 px-5 shadow-2xl">
          <form className="space-y-4" onSubmit={handleSubmit}>

            {/* Admin badge */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 border border-white/20">
              <div className="w-9 h-9 rounded-full bg-brand-orange text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {adminUser?.full_name?.charAt(0) || 'A'}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {adminUser?.full_name || 'Administrateur'}
                </p>
                <p className="text-[11px] text-white/60 font-medium">
                  {language === 'ar' ? 'مدير النظام' : 'Administrateur système'}
                </p>
              </div>
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
                ADMIN
              </span>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-xl flex items-start gap-2 text-xs text-red-300">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* PIN label */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-brand-orange" />
                <span>{language === 'ar' ? 'رمز PIN السري' : 'Code PIN administrateur'}</span>
              </label>
              {pin.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearPin}
                  className="text-[11px] text-white/40 hover:text-red-400 font-medium"
                >
                  {language === 'ar' ? 'مسح' : 'Effacer'}
                </button>
              )}
            </div>

            {/* PIN dots */}
            <div className="flex items-center justify-center gap-3 py-3 bg-white/5 border border-white/10 rounded-2xl">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-150 ${
                    pin.length > index
                      ? 'bg-brand-orange scale-110 shadow-sm shadow-brand-orange/50'
                      : 'border-2 border-white/30 bg-white/5'
                  }`}
                />
              ))}
            </div>

            {/* Hidden input for physical keyboard */}
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setPin(val);
                setError(null);
              }}
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
            />

            {/* Virtual keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitClick(digit)}
                  className="h-11 rounded-xl bg-white/10 hover:bg-white/20 active:bg-brand-orange/30 text-base font-bold text-white border border-white/10 transition-colors"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearPin}
                className="h-11 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-semibold text-white/60 transition-colors"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handleDigitClick('0')}
                className="h-11 rounded-xl bg-white/10 hover:bg-white/20 active:bg-brand-orange/30 text-base font-bold text-white border border-white/10 transition-colors"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDeleteDigit}
                className="h-11 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/60 transition-colors"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              disabled={pin.length === 0}
            >
              <span className="flex items-center justify-center gap-2">
                <span>{language === 'ar' ? 'دخول الإدارة' : 'Accéder au panneau admin'}</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </form>
        </div>

        {/* Back to login */}
        <p className="text-center text-xs text-white/30 mt-6">
          <a href="/login" className="hover:text-white/60 transition-colors underline underline-offset-2">
            {language === 'ar' ? '← العودة لصفحة الدخول' : '← Retour à la connexion employés'}
          </a>
        </p>

        <p className="text-center text-xs text-white/20 mt-3">
          © {new Date().getFullYear()} COMPLEXE MAHER
        </p>
      </div>
    </div>
  );
}
