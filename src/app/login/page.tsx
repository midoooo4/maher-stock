'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/Button';
import { Globe, Lock, ShieldAlert, User, KeyRound, CheckCircle2, Delete, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { t, language, toggleLanguage } = useTranslation();
  const { login, allUsers } = useAuth();

  // Selected employee — exclude ADMIN accounts from login screen
  const loginUsers = allUsers.filter((u) => u.role !== 'ADMIN');
  const activeLoginUsers = loginUsers.filter((u) => u.is_active);
  const [selectedUserId, setSelectedUserId] = useState<string>(
    activeLoginUsers[0]?.id || loginUsers[0]?.id || ''
  );
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedUser = allUsers.find((u) => u.id === selectedUserId);

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
    if (!selectedUserId) {
      setError(language === 'ar' ? 'يرجى اختيار الموظف أولاً' : 'Veuillez sélectionner un employé.');
      return;
    }
    if (!pin) {
      setError(language === 'ar' ? 'يرجى إدخال رمز PIN' : 'Veuillez saisir votre code PIN.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await login(selectedUserId, pin);
      if (!result.success) {
        setError(result.error || (language === 'ar' ? 'رمز PIN غير صحيح' : 'Code PIN incorrect.'));
        setPin('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('error'));
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-orange/5 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-turquoise/5 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Top right language switch */}
      <div className="absolute top-5 right-5 z-20">
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
        <div className="text-center space-y-2">
          <div className="relative w-20 h-20 mx-auto rounded-2xl bg-white p-2 shadow-card border border-amber-100 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Complexe Maher"
              width={72}
              height={72}
              priority
              className="object-contain"
            />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-brand-navy tracking-tight">
              {t('appName')}
            </h2>
            <p className="text-xs font-medium text-brand-orange tracking-wide uppercase">
              {t('appSubtitle')}
            </p>
            <p className="text-[11px] text-gray-500 font-medium">
              {t('establishment')}
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="mt-6 bg-white py-6 px-5 sm:px-8 shadow-dropdown rounded-3xl border border-gray-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 animate-shake">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Employee Selector (No email, no phone!) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {language === 'ar' ? 'اختر الموظف أو الحساب *' : 'Sélectionner l\'employé ou le compte *'}
              </label>
              <div className="relative">
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setPin('');
                    setError(null);
                  }}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
                >
                  {loginUsers.map((u) => (
                    <option key={u.id} value={u.id} disabled={!u.is_active}>
                      {u.role === 'ADMIN' ? '👑 ' : u.role === 'RESPONSABLE' ? '🔑 ' : '👤 '}
                      {u.full_name} {u.department ? `(${u.department})` : ''} {!u.is_active ? (language === 'ar' ? ' - [معطل]' : ' - [Désactivé]') : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected User Badge */}
            {selectedUser && (
              <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-colors ${
                selectedUser.is_active
                  ? 'bg-amber-50/50 border-amber-200/60'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {selectedUser.full_name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-brand-navy truncate">{selectedUser.full_name}</p>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {selectedUser.role === 'ADMIN'
                        ? 'Administrateur'
                        : selectedUser.role === 'RESPONSABLE'
                        ? 'Responsable Économat'
                        : `Employé ${selectedUser.department ? `• ${selectedUser.department}` : ''}`}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  selectedUser.is_active
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedUser.is_active
                    ? (language === 'ar' ? 'نشط' : 'Actif')
                    : (language === 'ar' ? 'معطل' : 'Désactivé')}
                </span>
              </div>
            )}

            {/* PIN Input Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-brand-orange" />
                  <span>{language === 'ar' ? 'رمز PIN السري (أرقام فقط)' : 'Code PIN de sécurité *'}</span>
                </label>
                {pin.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearPin}
                    className="text-[11px] text-gray-400 hover:text-red-500 font-medium"
                  >
                    {language === 'ar' ? 'مسح' : 'Effacer'}
                  </button>
                )}
              </div>

              {/* PIN Display Dots */}
              <div className="flex items-center justify-center gap-3 py-3 bg-slate-50 border border-gray-200 rounded-2xl">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      pin.length > index
                        ? 'bg-brand-orange scale-110 shadow-sm'
                        : 'border-2 border-gray-300 bg-white'
                    }`}
                  />
                ))}
              </div>

              {/* Hidden input for physical keyboard — invisible but functional */}
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
            </div>

            {/* Virtual Numeric Keypad for Touchscreens & Tablets */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitClick(digit)}
                  className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-amber-100 text-base font-bold text-brand-navy border border-gray-200 transition-colors shadow-sm"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearPin}
                className="h-11 rounded-xl bg-slate-100/70 hover:bg-slate-200 active:bg-slate-300 text-xs font-semibold text-gray-600 transition-colors"
              >
                {language === 'ar' ? 'مسح' : 'C'}
              </button>
              <button
                type="button"
                onClick={() => handleDigitClick('0')}
                className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-amber-100 text-base font-bold text-brand-navy border border-gray-200 transition-colors shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDeleteDigit}
                className="h-11 rounded-xl bg-slate-100/70 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center text-gray-600 transition-colors"
                title="Effacer dernier chiffre"
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
              disabled={!selectedUser?.is_active || pin.length === 0}
            >
              <span className="flex items-center justify-center gap-2">
                <span>{language === 'ar' ? 'تسجيل الدخول' : 'Connexion à l\'espace'}</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </form>


        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} COMPLEXE MAHER – Restaurant & Piscine
        </p>
      </div>
    </div>
  );
}