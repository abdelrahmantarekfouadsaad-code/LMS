"use client"

import React from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import EmptyState from '@/components/ui/EmptyState';
import { Loader2, Download, Award, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import { useLocale } from '@/hooks/useLocale';

const fetcher = (url: string, token: string) => fetch(url, {
  headers: { Authorization: `Bearer ${token}` }
}).then(res => res.json());

export default function CertificatesPage() {
  const { data: session } = useSession();
  const locale = useLocale();
  const isAr = locale === 'ar';
  
  const { data: certificates, error, isLoading } = useSWR(
    session?.accessToken ? ['http://localhost:8000/api/certificates/', session.accessToken] : null,
    ([url, token]) => fetcher(url, token)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          Failed to load certificates. Please try again later.
        </div>
      </div>
    );
  }

  const hasCertificates = certificates && certificates.length > 0;

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 hide-scrollbar">
        
        <header className="mb-8">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-3"
          >
            <Award className="text-amber-500" /> {isAr ? 'شهاداتي' : 'My Certificates'}
          </motion.h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isAr ? 'الشهادات الممنوحة لك من المشرفين والمعلمين.' : 'Certificates awarded to you by supervisors and teachers.'}
          </p>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary w-12 h-12" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800">
            {isAr ? 'فشل تحميل الشهادات.' : 'Failed to load certificates. Please try again later.'}
          </div>
        ) : !hasCertificates ? (
          <EmptyState 
            title={isAr ? 'لا توجد شهادات بعد' : 'No Certificates Yet'}
            description={isAr ? 'أكمل الدورات لتحصل على شهاداتك!' : 'Complete courses to earn your certificates!'}
            icon="award"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert: any, idx: number) => (
              <motion.div 
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-panel rounded-2xl overflow-hidden group hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 border border-white/5 hover:border-amber-500/20"
              >
                <div className="h-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />
                <div className="p-6">
                  <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Award className="w-7 h-7 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">{cert.title}</h3>
                  {cert.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{cert.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                    <Calendar size={14} />
                    <span>{isAr ? 'تاريخ الإصدار: ' : 'Issued: '}{cert.issued_at ? new Date(cert.issued_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
                  </div>
                  {cert.certificate_image && (
                    <a 
                      href={cert.certificate_image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
                    >
                      <Download size={16} />
                      {isAr ? 'تحميل الشهادة' : 'Download Certificate'}
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
