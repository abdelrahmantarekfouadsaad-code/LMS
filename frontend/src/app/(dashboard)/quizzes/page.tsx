"use client"

import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { motion } from 'framer-motion';
import { Target, CheckCircle, Clock, AlertCircle, Award, ArrowRight, ClipboardList } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { DICTIONARY } from '@/locales/dictionary';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import Link from 'next/link';

const CircularProgress = ({ percentage, color, label, subtext }: { percentage: number, color: string, label: string, subtext: string }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setCurrent(percentage), 100);
    return () => clearTimeout(timeout);
  }, [percentage]);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (current / 100) * circumference;

  return (
    <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
      <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="64" cy="64" r="45" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
          <motion.circle
            cx="64"
            cy="64"
            r="45"
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{current}%</span>
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{label}</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-xs">{subtext}</p>
      </div>
    </div>
  );
};

export default function QuizzesPage() {
  const locale = useLocale();
  const t = DICTIONARY[locale as 'en' | 'ar']?.quizzes || DICTIONARY.en.quizzes;

  const { data: quizzesData, error: quizzesError } = useSWR('/quizzes/', fetcher);
  const { data: resultsData, error: resultsError } = useSWR('/results/', fetcher);

  const isLoading = (!quizzesData && !quizzesError) || (!resultsData && !resultsError);
  const quizzes = quizzesData?.results || quizzesData || [];
  const results = resultsData?.results || resultsData || [];

  // Compute summary stats from live API data
  const avgScore = useMemo(() => {
    if (!Array.isArray(results) || results.length === 0) return 0;
    return Math.round(results.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / results.length);
  }, [results]);

  const completionRate = useMemo(() => {
    const totalQuizzes = (Array.isArray(quizzes) ? quizzes.length : 0) + (Array.isArray(results) ? results.length : 0);
    if (totalQuizzes === 0) return 0;
    return Math.round(((Array.isArray(results) ? results.length : 0) / totalQuizzes) * 100);
  }, [quizzes, results]);

  const avgSubtext = useMemo(() => {
    const count = Array.isArray(results) ? results.length : 0;
    return locale === 'ar' ? `${count} اختبارات مكتملة` : `${count} completed exams`;
  }, [results, locale]);

  const compSubtext = useMemo(() => {
    const done = Array.isArray(results) ? results.length : 0;
    const total = done + (Array.isArray(quizzes) ? quizzes.length : 0);
    return locale === 'ar' ? `${done} من ${total} اختبار` : `${done} of ${total} quizzes`;
  }, [results, quizzes, locale]);

  // Check if everything is empty (no quizzes and no results)
  const isEmpty = !isLoading && Array.isArray(quizzes) && quizzes.length === 0 && Array.isArray(results) && results.length === 0;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto hide-scrollbar">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{t.title}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t.subtitle}</p>
        </header>

        {isEmpty ? (
          /* Premium glassmorphic empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-xl p-12 text-center max-w-lg mx-auto mt-16"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-primary/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-primary/20 flex items-center justify-center">
                <ClipboardList className="w-10 h-10 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t.emptyTitle}</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">{t.emptySubtitle}</p>
              <Link
                href="/learning"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5"
              >
                {t.goToCourses} <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Top Section - Computed Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {isLoading ? (
                <>
                  <div className="glass-panel p-8 flex items-center justify-center">
                    <div className="animate-pulse flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="space-y-2">
                        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="glass-panel p-8 flex items-center justify-center">
                    <div className="animate-pulse flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="space-y-2">
                        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="glass-panel p-8 flex items-center justify-center">
                    <CircularProgress percentage={avgScore} color="#10B981" label={t.avgScore} subtext={avgSubtext} />
                  </div>
                  <div className="glass-panel p-8 flex items-center justify-center">
                    <CircularProgress percentage={completionRate} color="#3B82F6" label={t.completion} subtext={compSubtext} />
                  </div>
                </>
              )}
            </div>

            {/* Bottom Section - Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Available Exams */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <AlertCircle className="text-amber-500" /> {t.available}
                </h2>
                
                {isLoading ? (
                  <div className="animate-pulse space-y-4 w-full">
                    <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl w-full"></div>
                  </div>
                ) : quizzes.length > 0 ? (
                  quizzes.map((quiz: any, idx: number) => {
                    // Phase 3: Calculate attempt count from results
                    const quizResults = Array.isArray(results) ? results.filter((r: any) => r.quiz === quiz.id || r.quiz_id === quiz.id) : [];
                    const attemptCount = quizResults.length;
                    const maxAttempts = 2;
                    const isExhausted = attemptCount >= maxAttempts;
                    const bestScore = quizResults.length > 0 ? Math.max(...quizResults.map((r: any) => Number(r.score) || 0)) : null;

                    return (
                      <div key={quiz.id} className={`glass-panel p-5 border-s-4 ${isExhausted ? 'border-s-slate-400 opacity-60' : idx === 0 ? 'border-s-amber-500' : 'border-s-blue-500'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{quiz.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-2">
                              <span className="flex items-center gap-1"><Clock size={14} /> {quiz.time_limit} {locale === 'ar' ? 'دقيقة' : 'Mins'}</span>
                              <span className="flex items-center gap-1"><Target size={14} /> {quiz.questions_count} {locale === 'ar' ? 'سؤال' : 'Questions'}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            {idx === 0 && !isExhausted && <span className="bg-amber-500/10 text-amber-500 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">{t.dueToday}</span>}
                            {/* Attempt Counter Badge */}
                            <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${isExhausted ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                              {locale === 'ar' ? `محاولة ${attemptCount}/${maxAttempts}` : `Attempt ${attemptCount}/${maxAttempts}`}
                            </span>
                          </div>
                        </div>

                        {/* Show previous best score */}
                        {bestScore !== null && (
                          <div className="mb-3 p-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between">
                            <span className="text-sm text-slate-600 dark:text-slate-400">{locale === 'ar' ? 'أفضل درجة سابقة:' : 'Previous best score:'}</span>
                            <span className={`text-sm font-bold ${bestScore >= 60 ? 'text-emerald-500' : 'text-amber-500'}`}>{bestScore}%</span>
                          </div>
                        )}

                        <button 
                          disabled={isExhausted}
                          className={`w-full py-2.5 font-bold rounded-xl transition-colors flex justify-center items-center gap-2 ${
                            isExhausted 
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
                              : idx === 0 
                                ? 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20' 
                                : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-white border border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isExhausted 
                            ? (locale === 'ar' ? 'تم استنفاد المحاولات' : 'Attempts Exhausted') 
                            : <>{t.startExam} {idx === 0 && <ArrowRight size={16} />}</>
                          }
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-slate-500 text-sm py-4">
                    {locale === 'ar' ? 'لا يوجد اختبارات متاحة' : 'No available exams.'}
                  </div>
                )}
              </div>

              {/* Past Results */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <Award className="text-primary" /> {t.pastResults}
                </h2>
                
                <div className="glass-panel overflow-hidden">
                  <div className="divide-y divide-slate-200 dark:divide-white/10">
                    {isLoading ? (
                      <div className="p-4 animate-pulse">
                        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2"></div>
                      </div>
                    ) : results.length > 0 ? (
                      results.map((result: any, idx: number) => (
                        <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200">{result.quiz?.title || `Quiz ${result.quiz_id}`}</h4>
                            <p className="text-xs text-slate-500 mt-1">{t.submittedOn} {new Date(result.submitted_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center">
                            <span className="text-lg font-bold text-primary">{result.score}%</span>
                            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 sm:mt-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              <CheckCircle size={12} /> {t.passed}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-slate-500 text-sm py-4">
                        {locale === 'ar' ? 'لا يوجد نتائج سابقة' : 'No past results.'}
                      </div>
                    )}
                  </div>
                </div>
                
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
