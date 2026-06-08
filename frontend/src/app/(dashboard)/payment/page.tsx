"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft, WalletCards } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import Sidebar from '@/components/layout/Sidebar';

export default function PaymentUnderConstructionPage() {
  const router = useRouter();
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[100px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="relative z-10 max-w-xl w-full"
        >
          <div className="glass-panel p-10 md:p-14 text-center rounded-3xl border border-white/10 shadow-2xl bg-slate-900/60 backdrop-blur-xl relative overflow-hidden">
            
            {/* Caution tape decoration top */}
            <div className="absolute top-0 left-0 w-full h-2 bg-[repeating-linear-gradient(45deg,#fbbf24,#fbbf24_10px,#000_10px,#000_20px)] opacity-80" />

            <div className="flex justify-center mb-8 relative">
              <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20 relative">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                >
                  <Construction className="w-12 h-12 text-amber-500" />
                </motion.div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 backdrop-blur-sm">
                  <WalletCards className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
              {isAr ? 'بوابة الدفع تحت التطوير' : 'Checkout Under Construction'}
            </h1>
            
            <p className="text-slate-400 text-lg mb-10 leading-relaxed max-w-md mx-auto">
              {isAr 
                ? 'عذراً، هذا الجزء ما زال تحت التطوير. نحن نعمل بجد لإضافة طرق دفع آمنة وسهلة قريباً.' 
                : 'Sorry, this section is still under development. We are working hard to bring you secure and easy payment methods soon.'}
            </p>

            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <ArrowLeft className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
              {isAr ? 'العودة للخلف' : 'Go Back'}
            </button>
            
            {/* Caution tape decoration bottom */}
            <div className="absolute bottom-0 left-0 w-full h-2 bg-[repeating-linear-gradient(-45deg,#fbbf24,#fbbf24_10px,#000_10px,#000_20px)] opacity-80" />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
