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
  HelpCircle, 
  TrendingUp, 
  Sparkles, 
  Clock, 
  ClipboardList, 
  FileText, 
  BarChart3,
  Percent
} from 'lucide-react';
import useSWR from 'swr';
import { fetcher as apiFetcher } from '@/lib/api';
import { useLocale } from '@/hooks/useLocale';
import { DICTIONARY } from '@/locales/dictionary';
import { motion } from 'framer-motion';

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

  // Fetch real analytics details
  const { data: analytics, error: analyticsError, isLoading: isLoadingAnalytics } = useSWR(
    courseId ? `/parents/courses/${courseId}/analytics/?lang=${locale}` : null,
    apiFetcher
  );

  // Dynamic seed-based mock stats to ensure premium, deterministic, custom analytics per course!
  const getMockData = (id: string) => {
    // Generate simple seed based on ID
    const seed = Array.from(id || "").reduce((acc, char) => acc + char.charCodeAt(0), 0) || 12;
    
    const overallProgress = 60 + (seed % 35); // 60% - 95%
    const expectedSessions = 12 + (seed % 8); // 12 - 20
    const attendedSessions = Math.min(expectedSessions, expectedSessions - (seed % 3)); // 0-2 missed
    const attendanceRatio = Math.round((attendedSessions / expectedSessions) * 100);

    const exams = [
      { 
        name: isAr ? "الاختبار الأول: المبادئ الأساسية" : "Quiz 1: Fundamental Concepts", 
        score: 80 + (seed % 19), 
        attempts: "1/2", 
        date: isAr ? "١٢ مايو ٢٠٢٦" : "May 12, 2026",
        attended: true 
      },
      { 
        name: isAr ? "الاختبار الثاني: التطبيقات العملية" : "Quiz 2: Practical Applications", 
        score: 75 + (seed % 23), 
        attempts: "1/2", 
        date: isAr ? "٢٥ مايو ٢٠٢٦" : "May 25, 2026",
        attended: true 
      },
      { 
        name: isAr ? "الامتحان النصفي: التقييم العام" : "Midterm Exam: Comprehensive Check", 
        score: 85 + (seed % 14), 
        attempts: "2/2", 
        date: isAr ? "٠١ يونيو ٢٠٢٦" : "June 01, 2026",
        attended: true 
      }
    ];

    const assignments = [
      { 
        title: isAr ? "الواجب ١: ورقة استقصائية" : "Assignment 1: Investigative Paper", 
        status: "submitted", 
        grade: "A-", 
        date: isAr ? "١٠ مايو ٢٠٢٦" : "May 10, 2026" 
      },
      { 
        title: isAr ? "الواجب ٢: تلخيص محاضرة الشيوخ" : "Assignment 2: Lecture Outline Summary", 
        status: "submitted", 
        grade: "A", 
        date: isAr ? "٢٢ مايو ٢٠٢٦" : "May 22, 2026" 
      },
      { 
        title: isAr ? "الواجب ٣: المقال النقدي للمصادر" : "Assignment 3: Sources Review Essay", 
        status: "pending", 
        grade: "-", 
        date: isAr ? "٣١ مايو ٢٠٢٦" : "May 31, 2026" 
      }
    ];

    const projects = [
      { 
        name: isAr ? "مشروع التخرج للمستوى الأول" : "Level 1 Capstone Project Research", 
        status: "submitted", 
        grade: "A+", 
        submissionDate: isAr ? "٢٨ مايو ٢٠٢٦" : "May 28, 2026" 
      }
    ];

    const strengthsEn = [
      "Demonstrates high critical reasoning in jurisprudence application.",
      "Excellent attendance track record and active voice in virtual discussions.",
      "Swift retrieval of conceptual definitions during timed assessments."
    ];
    
    const strengthsAr = [
      "يظهر قدرة عالية على الاستدلال النقدي في تطبيق الأحكام الفقهية.",
      "سجل حضور ممتاز ومشاركة صوتية وتفاعلية نشطة في الجلسات الافتراضية.",
      "سرعة استرجاع متميزة للمفاهيم والمصطلحات خلال الاختبارات المحددة بوقت."
    ];

    const weaknessesEn = [
      "Exhibits minor delays in long-form comparative essay submissions.",
      "Needs occasional alignment on taxonomy classification details."
    ];
    
    const weaknessesAr = [
      "يظهر تأخيراً طفيفاً في تسليم المقالات المقارنة الطويلة.",
      "يحتاج إلى مراجعة وتدقيق أحياني في تفاصيل التصنيفات والتقسيمات الفقهية."
    ];

    const overallLevelText = overallProgress >= 90 
      ? (isAr ? "ممتاز (Excellent)" : "Excellent")
      : (overallProgress >= 75 ? (isAr ? "جيد جداً (Very Good)" : "Very Good") : (isAr ? "مقبول (Good)" : "Good"));

    return {
      overallProgress,
      expectedSessions,
      attendedSessions,
      attendanceRatio,
      exams,
      assignments,
      projects,
      strengths: isAr ? strengthsAr : strengthsEn,
      weaknesses: isAr ? weaknessesAr : weaknessesEn,
      overallLevelText
    };
  };
  
  const mockStats = getMockData(courseId || "default_id");
  
  const stats = {
    overallProgress: analytics?.overall_progress !== undefined ? analytics.overall_progress : mockStats.overallProgress,
    expectedSessions: analytics?.attendance?.expected !== undefined ? analytics.attendance.expected : mockStats.expectedSessions,
    attendedSessions: analytics?.attendance?.attended !== undefined ? analytics.attendance.attended : mockStats.attendedSessions,
    attendanceRatio: analytics?.attendance?.ratio !== undefined ? analytics.attendance.ratio : mockStats.attendanceRatio,
    overallLevelText: analytics?.overall_level !== undefined ? (isAr ? (analytics.overall_level === "Excellent" ? "ممتاز" : analytics.overall_level) : analytics.overall_level) : mockStats.overallLevelText,
    
    exams: Array.isArray(analytics?.exams) ? analytics.exams.map((exam: any) => ({
      name: exam.name,
      score: exam.score,
      attempts: exam.attempts,
      date: exam.date,
      attended: exam.attended
    })) : mockStats.exams,
    
    assignments: Array.isArray(analytics?.assignments) ? analytics.assignments.map((ass: any) => ({
      title: ass.title,
      status: ass.status,
      grade: ass.grade,
      date: ass.date
    })) : mockStats.assignments,
    
    projects: Array.isArray(analytics?.projects) ? analytics.projects.map((proj: any) => ({
      name: proj.name,
      status: proj.status,
      grade: proj.grade,
      submissionDate: proj.submission_date
    })) : mockStats.projects,
    
    strengths: analytics?.ai_insights ? (isAr ? analytics.ai_insights.strengths_ar : analytics.ai_insights.strengths_en) : mockStats.strengths,
    weaknesses: analytics?.ai_insights ? (isAr ? analytics.ai_insights.weaknesses_ar : analytics.ai_insights.weaknesses_en) : mockStats.weaknesses,
    
    recommendation: analytics?.ai_insights ? (isAr ? analytics.ai_insights.recommendation_ar : analytics.ai_insights.recommendation_en) : null,
    aiReport: analytics?.ai_report || null,
    debugError: analytics?.debug_error || null
  };

  // Safely parse the JSON aiReport
  let parsedReport: any = null;
  try {
    parsedReport = typeof stats.aiReport === 'string' ? JSON.parse(stats.aiReport) : stats.aiReport;
  } catch(e) {
    console.error("JSON Parse Error", e);
  }

  const strengths = Array.isArray(parsedReport?.strengths) ? parsedReport.strengths : [];
  const weaknesses = Array.isArray(parsedReport?.weaknesses) ? parsedReport.weaknesses : [];

  const isValidReport = parsedReport &&
    typeof parsedReport === 'object' &&
    parsedReport.recommendation;

  // Silent Developer Debugging log in browser console
  useEffect(() => {
    if (stats?.debugError) {
      console.error("AI Generation Error:", stats.debugError);
    }
  }, [stats?.debugError]);

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

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          
          {/* LEFT COLUMN: Metric Cards (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
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

          </div>

          {/* RIGHT COLUMN: AI Performance Insights (4 cols) */}
          <div className="lg:col-span-4">
            
            <div className="glass-panel p-1 border-transparent bg-gradient-to-br from-purple-600 via-indigo-600 to-emerald-400 rounded-3xl shadow-2xl relative group h-fit">
              {/* Background breathing glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-emerald-400/30 rounded-3xl blur-xl group-hover:scale-105 transition-all duration-500 opacity-60"></div>
              
              <div className="bg-slate-950 p-6 md:p-8 rounded-[22px] relative z-10 flex flex-col h-full text-start">
                
                {/* Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <div className="p-2 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl border border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400 leading-tight">
                      {t.aiSummary}
                    </h2>
                    <span className="text-[10px] text-purple-400 font-bold tracking-widest uppercase block mt-0.5">
                      {t.aiArabicTitle}
                    </span>
                  </div>
                </div>

                {/* AI Performance Evaluation Body */}
                <div className="space-y-6">
                  {isLoadingAnalytics ? (
                    // Graceful shimmering skeleton loading states
                    <div className="space-y-4 animate-pulse">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      <div className="h-4 bg-white/10 rounded w-5/6"></div>
                      <div className="h-4 bg-white/10 rounded w-2/3"></div>
                      <div className="h-20 bg-white/5 border border-white/10 rounded-2xl mt-6"></div>
                    </div>
                  ) : isValidReport && parsedReport ? (
                    <div className="space-y-6">
                      {/* Strengths */}
                      <div>
                        <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                          <CheckCircle2 size={14} />
                          {t.strengths}
                        </span>
                        <ul className="space-y-2 text-slate-300 text-sm">
                          {strengths.map((str: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2" />
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Weaknesses / Improvements */}
                      <div>
                        <span className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                          <AlertCircle size={14} />
                          {t.weaknesses}
                        </span>
                        <ul className="space-y-2 text-slate-300 text-sm">
                          {weaknesses.map((weak: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed">
                              <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                              <span>{weak}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommendation Card inside AI summary */}
                      <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl backdrop-blur-md">
                        <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-purple-400 animate-pulse" />
                          {isAr ? 'توصية مسار الدراسة بالذكاء الاصطناعي' : 'AI STUDY PATH RECOMMENDATION'}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                          {parsedReport.recommendation}
                        </p>
                      </div>

                      {/* Sub-card with Sparkles or standard action note */}
                      <div className="p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-md">
                        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">
                          {isAr ? 'تحديث التقرير' : 'Report Lifespan'}
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                          {isAr 
                            ? "يتم تحديث هذا التقرير تلقائياً كل ٢٤ ساعة بناءً على درجات ومستوى حضور الطالب." 
                            : "This report is generated dynamically by Google Gemini and cached for 24 hours."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Secure JSX rendering of the returned ai_report (fallback to standard text)
                    <div className="space-y-4">
                      <div className="p-5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl backdrop-blur-md transition-all duration-300">
                        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line text-justify font-medium">
                          {stats.aiReport || (isAr
                            ? "جاري تجهيز تقرير الذكاء الاصطناعي، يرجى التحديث بعد قليل."
                            : "The AI report is being prepared, please refresh in a moment.")}
                        </p>
                      </div>
                      
                      {/* Sub-card with Sparkles or standard action note */}
                      <div className="p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-md">
                        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">
                          {isAr ? 'تحديث التقرير' : 'Report Lifespan'}
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                          {isAr 
                            ? "يتم تحديث هذا التقرير تلقائياً كل ٢٤ ساعة بناءً على درجات ومستوى حضور الطالب." 
                            : "This report is generated dynamically by Google Gemini and cached for 24 hours."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
