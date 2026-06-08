"use client";

import React from 'react';
import { DollarSign, Pickaxe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SuperAdminFinancePage() {
  return (
    <div className="p-6 md:p-10 space-y-8 bg-background-light dark:bg-background-dark min-h-full flex items-center justify-center">
      <div className="glass-panel p-10 bg-slate-900/50 border border-white/10 rounded-3xl shadow-2xl flex flex-col items-center max-w-2xl text-center relative overflow-hidden">
        
        {/* Animated Background Elements */}
        <div className="absolute top-0 start-0 w-full h-1 bg-gradient-to-e from-transparent via-amber-500 to-transparent opacity-50" />
        <div className="absolute -top-20 -start-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -end-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative mb-6"
        >
          <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
            <DollarSign className="w-12 h-12 text-amber-400" />
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-2 -end-2 w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shadow-lg"
          >
            <Pickaxe className="w-5 h-5 text-slate-400" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
            لوحة الإدارة المالية - تحت التطوير
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-lg mx-auto">
            نعمل حالياً على تطوير واجهة متقدمة لإدارة الموارد المالية، تتبع الإيرادات، وتحليل بيانات المبيعات بكل سهولة.
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Finance Management Dashboard - Under Construction
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 pt-8 border-t border-white/10 w-full"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-400 text-sm border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            قريباً (Coming Soon)
          </div>
        </motion.div>
      </div>
    </div>
  );
}
