"use client"

import { useState, useEffect } from 'react';

export function useLocale() {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    // Initial load
    setLocale(document.documentElement.lang === 'ar' ? 'ar' : 'en');

    // Observe changes to the <html> lang attribute
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'lang') {
          setLocale(document.documentElement.lang === 'ar' ? 'ar' : 'en');
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    return () => observer.disconnect();
  }, []);

  return locale;
}
