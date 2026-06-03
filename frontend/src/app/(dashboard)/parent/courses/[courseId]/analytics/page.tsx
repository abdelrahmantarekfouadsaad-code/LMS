"use client"

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  Award, 
  BookOpen, 
  Clock, 
  ClipboardList, 
  FileText, 
  BarChart3,
  Percent,
  Sparkles
} from 'lucide-react';
import useSWR from 'swr';
import { fetcher as apiFetcher } from '@/lib/api';
import { useLocale } from '@/hooks/useLocale';
import { DICTIONARY } from '@/locales/dictionary';
import { motion } from 'framer-motion';
import AIAnalysisHelper from '@/components/learning/AIAnalysisHelper';

export default function CourseAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const locale = useLocale();
  const isAr = locale === 'ar';
  const t = DICTIONARY[locale as 'en' | 'ar']?.parent || DICTIONARY.en.parent;

  // Fetch course details
  const { data: course, error: courseError, isLoading: isLoadingCourse } = useSWR(
    courseId ? `/courses/${courseId}/` : null,
    apiFetcher
  );

  const swrConfig = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 10000,
    errorRetryCount: 1,
    keepPreviousData: true,
  };

  // Fetch real analytics details
  const { data: analytics, error: analyticsError, isLoading: isLoadingAnalytics } = useSWR(
    courseId ? `/parents/courses/${courseId}/analytics/?lang=${locale}` : null,
    apiFetcher,
    swrConfig
  );

  const stats = {
    overallProgress: analytics?.overall_progress || 0,
    expectedSessions: analytics?.attendance?.expected || 0,
    attendedSessions: analytics?.attendance?.attended || 0,
    attendanceRatio: analytics?.attendance?.ratio || 0,
    overallLevelText: analytics?.overall_level ? (isAr ? (analytics.overall_level === "Excellent" ? "ممتاز" : analytics.overall_level) : analytics.overall_level) : "-",
    
    exams: Array.isArray(analytics?.exams) ? analytics.exams.map((exam: any) => ({
      name: exam.name,
      score: exam.score,
      attempts: exam.attempts,
      date: exam.date,
      attended: exam.attended
    })) : [],
    
    assignments: Array.isArray(analytics?.assignments) ? analytics.assignments.map((ass: any) => ({
      title: ass.title,
      status: ass.status,
      grade: ass.grade,
      date: ass.date
    })) : [],
    
    projects: Array.isArray(analytics?.projects) ? analytics.projects.map((proj: any) => ({
      name: proj.name,
      status: proj.status,
      grade: proj.grade,
      submissionDate: proj.submission_date
    })) : [],
  };

  // Calculate average exam score safely
  const averageExamScore = Array.isArray(stats.exams) && stats.exams.length > 0 
    ? stats.exams.reduce((sum: number, exam: any) => sum + (exam.score || 0), 0) / stats.exams.length 
    : 0;

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col p-4 lg:p-8 overflow-y-auto hide-scrollbar text-start">
        
        {/* Header Section */}
        <header className="mb-8 flex flex-col gap-2">
          <button 
            onClick={() => router.push('/parent-dashboard')} 
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary dark:hover:text-emerald-400 transition-colors w-fit"
          >
            <ArrowLeft size={16} className={`mr-1 ${isAr ? 'rotate-180 ml-1 mr-0' : ''}`} />
            {t.backToDashboard}
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
                {isLoadingCourse ? (isAr ? 'جاري التحميل...' : 'Loading Course...') : course?.title}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                {t.analyticsSubtitle}
              </p>
            </div>
            
            <div className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-bold text-sm">
              <Sparkles size={16} className="animate-pulse" />
              {t.overallLevel}: {stats.overallLevelText}
            </div>
          </div>
        </header>

        {/* Dashboard Layout */}
        <div className="space-y-6 mb-12">
          
          {/* Row 1: Evaluation Score & Attendance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Overall Course Evaluation */}
            <div className="glass-panel p-6 bg-slate-900/60 border border-white/5 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">{t.overallProgress}</span>
                  <Percent className="text-primary w-5 h-5" />
                </div>
                <h3 className="text-3xl font-black text-white">{stats.overallProgress}%</h3>
              </div>
              <div className="mt-6">
                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full" style={{ width: `${stats.overallProgress}%` }}></div>
                </div>
                <p className="text-slate-500 text-xs">{t.evaluationScore}</p>
              </div>
            </div>

            {/* Attendance Ratio */}
            <div className="glass-panel p-6 bg-slate-900/60 border border-white/5 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">{t.attendance}</span>
                  <Calendar className="text-blue-400 w-5 h-5" />
                </div>
                <h3 className="text-3xl font-black text-white">{stats.attendanceRatio}%</h3>
              </div>
              <div className="mt-6 flex justify-between items-center text-xs">
                <span className="text-slate-500">{t.attendedSessions}: <strong className="text-slate-200">{stats.attendedSessions}/{stats.expectedSessions}</strong></span>
                <span className="text-blue-400 font-bold">{t.attendanceRatio}</span>
              </div>
            </div>

          </div>

          {/* Exam Stats Table */}
          <div className="glass-panel p-6 bg-slate-900/60 border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-500/15 rounded-xl border border-indigo-500/20">
                <Award className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold text-white">{t.examStats}</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3 text-start">{isAr ? 'الامتحان / الاختبار' : 'Exam Name'}</th>
                    <th className="pb-3 text-center">{isAr ? 'الدرجة' : 'Score'}</th>
                    <th className="pb-3 text-center">{isAr ? 'المحاولات' : 'Attempts'}</th>
                    <th className="pb-3 text-end">{isAr ? 'التاريخ' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {Array.isArray(stats.exams) && stats.exams.map((exam, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 text-start text-white flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span className="line-clamp-1">{exam.name}</span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${exam.score >= 85 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {exam.score}%
                        </span>
                      </td>
                      <td className="py-4 text-center text-slate-400">{exam.attempts}</td>
                      <td className="py-4 text-end text-slate-500 text-xs">{exam.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assignments & Forum Engagement */}
          <div className="glass-panel p-6 bg-slate-900/60 border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/15 rounded-xl border border-purple-500/20">
                <ClipboardList className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-bold text-white">{t.assignments}</h2>
            </div>

            <div className="space-y-4">
              {Array.isArray(stats.assignments) && stats.assignments.map((assignment, idx) => {
                const isSubmitted = assignment.status === "submitted";
                const isPending = assignment.status === "pending";
                
                return (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 hover:bg-white/[0.08] border border-white/5 rounded-2xl transition-all">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <div className={`p-2 rounded-xl bg-slate-800 ${isSubmitted ? 'text-emerald-400' : 'text-amber-400'}`}>
                        <FileText size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{assignment.title}</h4>
                        <span className="text-xs text-slate-500">{assignment.date}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-4 text-xs font-bold">
                      <span className="text-slate-400">
                        {t.grades}: <strong className="text-white text-sm">{assignment.grade}</strong>
                      </span>
                      
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                        isSubmitted 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : isPending 
                          ? 'bg-amber-500/10 text-amber-400' 
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {isSubmitted ? <CheckCircle2 size={12} /> : isPending ? <Clock size={12} /> : <XCircle size={12} />}
                        {isSubmitted ? t.submitted : isPending ? t.pending : t.notSubmitted}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Course Project */}
          <div className="glass-panel p-6 bg-slate-900/60 border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/15 rounded-xl border border-amber-500/20">
                <BarChart3 className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-white">{t.projects}</h2>
            </div>

            {Array.isArray(stats.projects) && stats.projects.map((project, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider mb-2 inline-block">Final Capstone</span>
                  <h3 className="text-base font-extrabold text-white mb-1">{project.name}</h3>
                  <p className="text-xs text-slate-500">{isAr ? `تاريخ التسليم: ${project.submissionDate}` : `Submitted on: ${project.submissionDate}`}</p>
                </div>
                
                <div className="flex items-center gap-6 self-start md:self-auto justify-between md:justify-end w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                  <div className="text-start md:text-end">
                    <span className="text-xs text-slate-500 block mb-0.5">{t.projectGrade}</span>
                    <strong className="text-2xl font-black text-emerald-400">{project.grade}</strong>
                  </div>
                  
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 size={12} />
                    {t.submitted}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <AIAnalysisHelper 
            courseTitle={course?.title || (isAr ? 'دورة غير معروفة' : 'Unknown Course')} 
            stats={{
              overallProgress: stats.overallProgress,
              attendanceRatio: stats.attendanceRatio
            }}
            exams={stats.exams}
          />
        </div>

      </main>
    </div>
  );
}
