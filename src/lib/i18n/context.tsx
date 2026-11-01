'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { fr } from './fr';
import { ar } from './ar';

export type Language = 'fr' | 'ar';

export type TranslationKey = keyof typeof fr;

interface LanguageContextType {
  language: Language;
  direction: 'ltr' | 'rtl';
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = { fr, ar };

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');
  const [, startTransition] = useTransition();

  useEffect(() => {
    // Check saved language preference or browser preference
    const saved = localStorage.getItem('maher_stock_lang') as Language;
    if (saved && (saved === 'fr' || saved === 'ar')) {
      setLanguageState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
    } else {
      document.documentElement.lang = 'fr';
      document.documentElement.dir = 'ltr';
    }
  }, []);

  const setLanguage = (lang: Language) => {
    startTransition(() => {
      setLanguageState(lang);
      localStorage.setItem('maher_stock_lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
  };

  const toggleLanguage = () => {
    const next = language === 'fr' ? 'ar' : 'fr';
    setLanguage(next);
  };

  const t = (key: TranslationKey, fallback?: string): string => {
    const dict = translations[language] || translations.fr;
    return dict[key] || fallback || key;
  };

  const direction = language === 'ar' ? 'rtl' : 'ltr';
  const isRTL = direction === 'rtl';

  return (
    <LanguageContext.Provider value={{ language, direction, isRTL, setLanguage, toggleLanguage, t }}>
      <div dir={direction} className={language === 'ar' ? 'font-arabic' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
