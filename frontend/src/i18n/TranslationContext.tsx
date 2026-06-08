"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import enDict from './dictionaries/en.json';
import arDict from './dictionaries/ar.json';

type Dictionary = typeof enDict;

interface TranslationContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
  dict: Dictionary;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({
  children,
  initialLocale
}: {
  children: React.ReactNode;
  initialLocale: string;
}) => {
  const [locale, setLocaleState] = useState(initialLocale);

  // When locale changes, update the cookie, HTML dir, and lang attributes
  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    
    if (newLocale === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
  };

  // Sync strictly on mount just to be sure
  useEffect(() => {
    if (locale === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
  }, [locale]);

  const t = (key: string): string => {
    const dict: any = locale === 'ar' ? arDict : enDict;
    const keys = key.split('.');
    let value = dict;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Fallback to the key itself if not found
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t, dict: locale === 'ar' ? arDict : enDict }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
