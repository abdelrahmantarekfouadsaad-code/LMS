"use client"

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { DICTIONARY } from '@/locales/dictionary';

interface GuestRestrictionPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

// Official WhatsApp SVG logo
const WhatsAppIcon = () => (
  <svg viewBox="0 0 32 32" className="w-6 h-6 shrink-0" fill="currentColor">
    <path d="M16.004 0h-.008C7.174 0 .002 7.174.002 16c0 3.498 1.13 6.738 3.046 9.372L1.06 31.44l6.318-1.96A15.89 15.89 0 0 0 16.004 32C24.826 32 32 24.826 32 16S24.826 0 16.004 0zm9.292 22.602c-.39 1.1-1.932 2.014-3.168 2.28-.846.18-1.95.324-5.67-1.218-4.762-1.97-7.826-6.804-8.064-7.118-.23-.314-1.932-2.574-1.932-4.908s1.222-3.482 1.656-3.96c.434-.478.948-.598 1.264-.598.314 0 .632.004.906.016.292.014.682-.11.968.738.314.884 1.068 3.218 1.162 3.452.094.234.156.508.032.82-.126.314-.188.508-.374.786-.188.278-.394.62-.562.832-.188.234-.382.486-.164.954.218.468.968 1.598 2.078 2.59 1.43 1.274 2.634 1.668 3.01 1.856.374.188.594.156.812-.094.218-.25.934-1.086 1.184-1.46.25-.374.498-.314.838-.188.34.126 2.168 1.022 2.54 1.208.374.188.622.278.716.434.094.156.094.902-.296 2.002z"/>
  </svg>
);

export default function GuestRestrictionPopup({ isOpen, onClose }: GuestRestrictionPopupProps) {
  const locale = useLocale();
  const t = (DICTIONARY[locale as 'en' | 'ar'] as any)?.guest || (DICTIONARY.en as any).guest;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-white/10 dark:bg-slate-900/60 backdrop-blur-2xl shadow-2xl shadow-black/30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative gradient orbs */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all duration-200"
                id="guest-popup-close"
              >
                <X size={18} />
              </button>

              {/* Content */}
              <div className="relative z-10 p-8 pt-10 text-center">
                {/* Lock Icon */}
                <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/20 flex items-center justify-center">
                  <Lock className="w-10 h-10 text-amber-400" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-3">
                  {t.restrictionTitle}
                </h3>

                {/* Message */}
                <p className="text-white/70 text-sm leading-relaxed mb-2 max-w-sm mx-auto">
                  {t.restrictionText}
                </p>
                {locale !== 'ar' && (
                  <p className="text-white/40 text-xs leading-relaxed mb-6 max-w-sm mx-auto" dir="rtl">
                    {t.restrictionTextAr}
                  </p>
                )}
                {locale === 'ar' && <div className="mb-6" />}

                {/* WhatsApp CTA */}
                <a
                  href="https://wa.me/201062582736"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="guest-whatsapp-btn"
                  className="group flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#1fb855] text-white font-bold text-base shadow-lg shadow-[#25D366]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#25D366]/40"
                >
                  <WhatsAppIcon />
                  <span>{t.contactWhatsApp}</span>
                </a>

                {/* Close text button */}
                <button
                  onClick={onClose}
                  className="mt-4 text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
