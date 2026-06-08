"use client";

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { MessageSquare } from 'lucide-react';
import { useTranslation } from '@/i18n/TranslationContext';

export default function ChatPage() {
  const { locale, dict, t: translate } = useTranslation();
  const isAr = locale === 'ar';

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden relative">
        <div className="flex-1 flex overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-slate-900/50 backdrop-blur-xl items-center justify-center">
          
          <div className="text-center p-6 max-w-md">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
              <MessageSquare className="w-10 h-10 text-slate-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              {isAr ? 'لا توجد محادثات' : 'No Conversations'}
            </h2>
            <p className="text-slate-400">
              {isAr 
                ? 'واجهة المحادثة قيد التطوير. سيتم إتاحة إمكانية التواصل مع المعلمين قريباً.' 
                : 'Chat interface is under development. Direct communication with instructors will be available soon.'}
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
