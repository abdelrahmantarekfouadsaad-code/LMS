"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import NewsCarousel from '@/components/guest/NewsCarousel';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/hooks/useLocale';
import { DICTIONARY } from '@/locales/dictionary';
import Link from 'next/link';

export default function GuestDashboard() {
  const { data: session } = useSession();
  const locale = useLocale();
  const t = (DICTIONARY[locale as 'en' | 'ar'] as any)?.guest || (DICTIONARY.en as any).guest;

  const userName = session?.user?.name || session?.user?.email || (locale === 'ar' ? 'زائر' : 'Guest');

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col p-6 lg:p-10 overflow-y-auto hide-scrollbar">
        {/* Header */}
        <header className="mb-8 text-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {t.welcome}, {userName} 👋
            </h1>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/20">
              <Sparkles size={12} />
              {t.guestBadge}
            </span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 dark:text-slate-400"
          >
            {t.subtitle}
          </motion.p>
        </header>

        {/* News Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-10"
        >
          <NewsCarousel />
        </motion.div>

        {/* Browse Courses CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Link href="/learning" id="guest-browse-courses">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-emerald-600 to-teal-700 p-8 md:p-12 group cursor-pointer hover:shadow-2xl hover:shadow-primary/30 transition-all duration-500 hover:-translate-y-1">
              {/* Animated background decorations */}
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 rounded-full bg-white/5 group-hover:scale-150 transition-transform duration-700 blur-2xl" />
              <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-48 h-48 rounded-full bg-white/5 group-hover:scale-125 transition-transform duration-700 blur-2xl" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
                    <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                      {t.browseCourses}
                    </h2>
                    <p className="text-white/60 text-sm md:text-base">
                      {t.browseCoursesDesc}
                    </p>
                  </div>
                </div>

                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300 shrink-0 hidden sm:flex">
                  <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Info Cards Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"
        >
          {/* WhatsApp Contact Card */}
          <a
            href="https://wa.me/201062582736"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-panel p-6 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group block"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 32 32" className="w-6 h-6 text-[#25D366]" fill="currentColor">
                  <path d="M16.004 0h-.008C7.174 0 .002 7.174.002 16c0 3.498 1.13 6.738 3.046 9.372L1.06 31.44l6.318-1.96A15.89 15.89 0 0 0 16.004 32C24.826 32 32 24.826 32 16S24.826 0 16.004 0zm9.292 22.602c-.39 1.1-1.932 2.014-3.168 2.28-.846.18-1.95.324-5.67-1.218-4.762-1.97-7.826-6.804-8.064-7.118-.23-.314-1.932-2.574-1.932-4.908s1.222-3.482 1.656-3.96c.434-.478.948-.598 1.264-.598.314 0 .632.004.906.016.292.014.682-.11.968.738.314.884 1.068 3.218 1.162 3.452.094.234.156.508.032.82-.126.314-.188.508-.374.786-.188.278-.394.62-.562.832-.188.234-.382.486-.164.954.218.468.968 1.598 2.078 2.59 1.43 1.274 2.634 1.668 3.01 1.856.374.188.594.156.812-.094.218-.25.934-1.086 1.184-1.46.25-.374.498-.314.838-.188.34.126 2.168 1.022 2.54 1.208.374.188.622.278.716.434.094.156.094.902-.296 2.002z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t.contactCard}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.contactCardDesc}</p>
              </div>
            </div>
          </a>

          {/* Support Card */}
          <Link href="/support" className="glass-panel p-6 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group block">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-blue-500">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <path d="M12 17h.01"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t.supportCard}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.supportCardDesc}</p>
              </div>
            </div>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
