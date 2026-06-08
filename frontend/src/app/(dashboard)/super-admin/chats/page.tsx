"use client";

import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function SuperAdminChatsPage() {
  return (
    <div className="flex h-full bg-transparent overflow-hidden p-6 md:p-8">
      <div className="flex-1 flex overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-slate-900/50 backdrop-blur-xl items-center justify-center">
        
        <div className="text-center p-6 max-w-md">
          <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
            <MessageSquare className="w-10 h-10 text-indigo-500/50" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            المحادثات
          </h2>
          <p className="text-slate-400">
            واجهة المحادثات الخاصة بالمشرف العام قيد التطوير.
          </p>
        </div>

      </div>
    </div>
  );
}
