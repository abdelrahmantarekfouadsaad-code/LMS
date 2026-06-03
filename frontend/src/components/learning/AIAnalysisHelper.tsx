"use client";

import React, { useState } from 'react';
import { Bot, Copy, ExternalLink, CheckCircle2, X } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { DICTIONARY } from '@/locales/dictionary';
import { motion, AnimatePresence } from 'framer-motion';

interface AIAnalysisHelperProps {
  courseTitle: string;
  stats: {
    overallProgress: number;
    attendanceRatio: number;
  };
  exams: any[];
}

export default function AIAnalysisHelper({ courseTitle, stats, exams }: AIAnalysisHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const locale = useLocale();
  const isAr = locale === 'ar';
  const t = DICTIONARY[locale as 'en' | 'ar']?.parent || DICTIONARY.en.parent;

  const getPrompt = () => {
    const examsSummary = exams && exams.length > 0 
      ? exams.map(e => `${e.name}: ${e.score}%`).join(', ')
      : 'No exams taken yet';

    if (isAr) {
      return `أنت مرشد أكاديمي في منصة "نور النبوة" الإسلامية. يرجى تحليل مقاييس الطالب التالية وتقديم نقاط القوة، ومجالات التحسين، وخطة عمل أسبوعية تدمج بين الأكاديميات والقيم الإسلامية.
      
الدورة: ${courseTitle}
نسبة التقدم العام: ${stats.overallProgress}%
نسبة الحضور: ${stats.attendanceRatio}%
نتائج الاختبارات: ${examsSummary}

بناءً على هذه البيانات، قدم تحليلك الأكاديمي والتربوي.`;
    }

    return `You are an academic advisor at Nour Al-Nubuwwah Islamic LMS. Analyze the student's metrics below and provide strengths, areas for improvement, and a weekly action plan blending academics with Islamic values.

Course: ${courseTitle}
Overall Progress: ${stats.overallProgress}%
Attendance Ratio: ${stats.attendanceRatio}%
Exam Scores: ${examsSummary}

Based on this data, please provide your academic and moral analysis.`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getPrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="glass-panel p-6 bg-slate-900/60 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="p-3 bg-primary/15 rounded-xl border border-primary/20 shrink-0">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{(t as any).aiHelperTitle}</h3>
              <p className="text-sm text-slate-400">{(t as any).aiHelperSubtitle}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all w-full md:w-auto justify-center shrink-0"
          >
            <Bot size={18} />
            {(t as any).aiHelperButton}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass-panel bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              dir={isAr ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/15 rounded-lg">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-white">{(t as any).aiModalTitle}</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex flex-col gap-2 text-sm text-slate-300">
                  <p>{(t as any).aiModalStep1}</p>
                  <p>{(t as any).aiModalStep2}</p>
                  <p>{(t as any).aiModalStep3}</p>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-xl blur"></div>
                  <div className="relative bg-slate-950 border border-white/10 rounded-xl p-4 font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto hide-scrollbar">
                    {getPrompt()}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-end pt-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all w-full sm:w-auto"
                  >
                    {copied ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Copy size={18} />}
                    {copied ? (t as any).copied : (t as any).copyPrompt}
                  </button>
                  <a
                    href="https://gemini.google.com/app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all w-full sm:w-auto"
                  >
                    <ExternalLink size={18} />
                    {(t as any).openGemini}
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
