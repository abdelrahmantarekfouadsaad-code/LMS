"use client"

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, BookOpen, GraduationCap, Target, PlayCircle, ChevronRight, Loader2 } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/hooks/useLocale';
import { DICTIONARY } from '@/locales/dictionary';
import { useUserRole } from '@/hooks/useUserRole';
import GuestDashboard from '@/components/guest/GuestDashboard';
import NewsCarousel from '@/components/guest/NewsCarousel';
import useSWR from 'swr';
import EmptyState from '@/components/ui/EmptyState';

// SVG Circular Progress Component
const CircularProgress = ({ percentage, color, label }: { percentage: number, color: string, label: string }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setCurrent(percentage), 100);
    return () => clearTimeout(timeout);
  }, [percentage]);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (current / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90 drop-shadow-xl">
          <circle cx="56" cy="56" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/10" />
          {/* Animated Progress Circle */}
          <motion.circle
            cx="56"
            cy="56"
            r="40"
            stroke={color}
            strokeWidth="6"
            fill="transparent"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
            className="drop-shadow-[0_0_10px_rgba(var(--tw-colors-emerald-400),0.5)]"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tighter">{current}%</span>
        </div>
      </div>
      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  );
};

import { redirect } from 'next/navigation';

// Thin router
export default function DashboardHome() {
  const { isGuest } = useUserRole();
  const { data: session } = useSession();

  if (session?.user?.role === 'PARENT') {
    redirect('/parent-dashboard');
  }

  if (isGuest) return <GuestDashboard />;

  return <StudentDashboard />;
}

// Student Dashboard (Phase 1 Execution)
function StudentDashboard() {
  const { data: session } = useSession();
  const locale = useLocale();
  const t = DICTIONARY[locale as 'en' | 'ar']?.dashboard || DICTIONARY.en.dashboard;

  // Fetch courses from API
  const fetcher = (url: string) => fetch(url, {
    headers: { Authorization: `Bearer ${session?.accessToken}` }
  }).then(res => res.json());

  const { data: courses, isLoading } = useSWR(
    session?.accessToken ? 'http://localhost:8000/api/courses/' : null,
    fetcher
  );

  const { data: progressData } = useSWR(
    session?.accessToken ? 'http://localhost:8000/api/progress/' : null,
    fetcher
  );

  const enrolledCourses = courses || [];
  const progressItems = progressData || [];
  const completedLessons = Array.isArray(progressItems) ? progressItems.filter((p: any) => p.is_completed).length : 0;
  const totalLessons = Array.isArray(progressItems) ? progressItems.length : 0;
  const overallCompletion = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col p-6 lg:p-10 overflow-y-auto hide-scrollbar">
        {/* Header */}
        <header className="mb-8 text-start">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2"
          >
            {t.welcome}, {session?.user?.name || session?.user?.email || 'Student'} 👋
          </motion.h1>
          <p className="text-slate-500 dark:text-slate-400">{t.subtitle}</p>
        </header>

        {/* News & Announcements Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-10 rounded-2xl overflow-hidden shadow-2xl border border-white/5 min-h-[300px] w-full block bg-slate-800 relative"
        >
          <NewsCarousel />
        </motion.div>

        {/* General Evaluation (تقييم عام) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                <Target className="w-5 h-5 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {locale === 'ar' ? 'التقييم العام' : 'General Evaluation'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              
              {/* Circular Progress (Overall Completion) */}
              <div className="flex justify-center p-6 bg-white/5 dark:bg-slate-800/50 rounded-2xl border border-white/10 backdrop-blur-md">
                <CircularProgress 
                  percentage={overallCompletion} 
                  color="#10B981" 
                  label={locale === 'ar' ? 'نسبة الإنجاز الكلية' : 'Overall Completion'} 
                />
              </div>

              {/* Metric 1: Total Completed Topics */}
              <div className="flex flex-col justify-center p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl border border-white/10 backdrop-blur-md h-full relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl group-hover:bg-indigo-500/30 transition-all duration-500"></div>
                <BookOpen className="w-8 h-8 text-indigo-400 mb-3" />
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white mb-1">{completedLessons}</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {locale === 'ar' ? 'الموضوعات المكتملة' : 'Completed Topics'}
                </span>
              </div>

              {/* Metric 2: Active Courses */}
              <div className="flex flex-col justify-center p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-white/10 backdrop-blur-md h-full relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-amber-500/20 rounded-full blur-xl group-hover:bg-amber-500/30 transition-all duration-500"></div>
                <GraduationCap className="w-8 h-8 text-amber-400 mb-3" />
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white mb-1">{enrolledCourses.length}</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {locale === 'ar' ? 'الدورات النشطة' : 'Active Courses'}
                </span>
              </div>

            </div>
          </div>
        </motion.div>

        {/* NEW SECTION: Enrolled Courses (دوراتي / التعلم الذاتي) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-10 mb-10"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {locale === 'ar' ? 'دوراتي' : 'Enrolled Courses'}
              </h2>
            </div>
            <Link href="/learning" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors flex items-center gap-1">
              {locale === 'ar' ? 'عرض الكل' : 'View All'} <ChevronRight size={16} className={locale === 'ar' ? 'rotate-180' : ''} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-12"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
            ) : enrolledCourses.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  title={locale === 'ar' ? 'لا توجد دورات بعد' : 'No courses yet'}
                  description={locale === 'ar' ? 'اشترك في دورة للبدء في رحلتك التعليمية.' : 'Enroll in a course to start your learning journey.'}
                  icon="folder"
                />
              </div>
            ) : (
              enrolledCourses.map((course: any) => (
                <Link key={course.id} href={`/learning/${course.id}`} className="group block h-full">
                  <div className={`glass-panel p-6 h-full flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 bg-gradient-to-br ${course.color || 'from-blue-500/20 to-indigo-600/20'} border border-white/5`}>
                    
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-slate-900/40 backdrop-blur-md text-indigo-400">
                          <PlayCircle className="w-6 h-6" />
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {locale === 'ar' ? course.title_ar || course.title : course.title}
                      </h3>
                      <p className="text-sm text-slate-400 mb-6">
                        {course.instructor || 'Academy Instructor'}
                      </p>
                    </div>

                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>

      </main>
    </div>
  );
}
