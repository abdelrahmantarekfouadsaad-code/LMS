"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Play, CheckCircle, Circle, Video, Lock, FileText, Download, ArrowLeft, BookOpen, GitBranch, Award, ClipboardCheck, MessageSquare, Star } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { useLocale } from '@/hooks/useLocale';
import { DICTIONARY } from '@/locales/dictionary';
import { useUserRole } from '@/hooks/useUserRole';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from '@/components/ui/EmptyState';

// --- Milestone Type Config ---
const MILESTONE_CONFIG: Record<string, { icon: React.ElementType; color: string; gradient: string }> = {
  ACHIEVEMENT: { icon: Award, color: 'text-amber-400', gradient: 'from-amber-500/20 to-orange-500/20' },
  ASSESSMENT: { icon: ClipboardCheck, color: 'text-blue-400', gradient: 'from-blue-500/20 to-indigo-500/20' },
  CHECKPOINT: { icon: Star, color: 'text-emerald-400', gradient: 'from-emerald-500/20 to-teal-500/20' },
  NOTE: { icon: MessageSquare, color: 'text-purple-400', gradient: 'from-purple-500/20 to-violet-500/20' },
};

// --- Timeline Branch Component ---
function TimelineBranch({ milestone, index, isAr }: { milestone: any; index: number; isAr: boolean }) {
  const isLeft = index % 2 === 0;
  const config = MILESTONE_CONFIG[milestone.milestone_type] || MILESTONE_CONFIG.CHECKPOINT;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.12, type: "spring", stiffness: 100 }}
      className={`flex items-center gap-0 ${isLeft ? 'flex-row' : 'flex-row-reverse'} relative`}
    >
      {/* Branch Card */}
      <div className={`w-[calc(50%-28px)] ${isLeft ? 'text-end' : 'text-start'}`}>
        <motion.div
          whileHover={{ scale: 1.03, y: -2 }}
          className={`glass-panel p-5 bg-gradient-to-br ${config.gradient} border border-white/10 relative overflow-hidden group cursor-default`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className={`flex items-center gap-2 mb-2 ${isLeft ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>
                {milestone.milestone_type}
              </span>
              {milestone.is_completed && (
                <CheckCircle size={14} className="text-emerald-400" />
              )}
            </div>
            <h4 className="text-base font-bold text-white mb-1">{milestone.title}</h4>
            {milestone.description && (
              <p className="text-sm text-slate-400 line-clamp-2">{milestone.description}</p>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span>{new Date(milestone.milestone_date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {milestone.created_by_name && <span>• {milestone.created_by_name}</span>}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Branch Connector */}
      <div className="relative flex items-center justify-center w-14 shrink-0 z-10">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.12 + 0.2 }}
          className={`absolute h-0.5 w-5 bg-gradient-to-r ${isLeft ? 'right-7 from-transparent to-white/30' : 'left-7 from-white/30 to-transparent'}`}
          style={{ originX: isLeft ? 1 : 0 }}
        />
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: index * 0.12 + 0.3, type: "spring", stiffness: 200 }}
          className={`w-10 h-10 rounded-full bg-slate-900/80 border-2 ${milestone.is_completed ? 'border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]' : 'border-white/20'} flex items-center justify-center backdrop-blur-md`}
        >
          <Icon size={18} className={config.color} />
        </motion.div>
      </div>

      {/* Spacer for the other side */}
      <div className="w-[calc(50%-28px)]" />
    </motion.div>
  );
}



export default function CoursePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { isGuest } = useUserRole();

  useEffect(() => {
    if (isGuest) router.push('/learning');
  }, [isGuest, router]);

  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'timeline'>('content');
  const { data: course, error, isLoading } = useSWR(courseId ? `/courses/${courseId}/` : null, fetcher);
  const { data: milestonesData } = useSWR(courseId ? `/milestones/?course=${courseId}` : null, fetcher);
  const locale = useLocale();
  const isAr = locale === 'ar';
  const t = DICTIONARY[locale as 'en' | 'ar']?.learning || DICTIONARY.en.learning;

  const milestones = (milestonesData?.results || milestonesData || []);
  const displayMilestones = milestones;

  const currentLesson = activeLesson
    ? course?.weeks?.flatMap((w: any) => w.lessons || [])?.find((l: any) => l.id === activeLesson)
    : course?.weeks?.[0]?.lessons?.[0];

  useEffect(() => {
    if (!activeLesson && course?.weeks?.[0]?.lessons?.[0]) {
      setActiveLesson(course.weeks[0].lessons[0].id);
    }
  }, [course, activeLesson]);

  const videoUrl = currentLesson?.video_url;
  const isValidVideoUrl = videoUrl && !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be');

  const tabs = [
    { key: 'content' as const, label: isAr ? 'محتوى الدورة' : 'Course Content', icon: BookOpen },
    { key: 'timeline' as const, label: isAr ? 'الغصون (التقييم)' : 'Timeline (الغصون)', icon: GitBranch },
  ];

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col p-4 lg:p-8 overflow-y-auto hide-scrollbar">

        <header className="mb-6 flex flex-col gap-2">
          <Link href="/learning" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary transition-colors w-fit">
            <ArrowLeft size={16} className={`mr-1 ${isAr ? 'rotate-180 ml-1 mr-0' : ''}`} />
            {isAr ? 'العودة إلى الكتالوج' : 'Back to Catalog'}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
                {course?.title || (isLoading ? 'Loading...' : t.title)}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                {course?.description || (isLoading ? '' : t.subtitle)}
              </p>
            </div>
          </div>
        </header>

        {/* Tab Switcher */}
        <div className="mb-6 flex">
          <div className="glass-panel p-1 rounded-xl flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                    activeTab === tab.key
                      ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'content' ? (
            <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              {/* ========= VIEW A: COURSE CONTENT ========= */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Left: Video Player (70%) */}
                <div className="lg:col-span-8 flex flex-col">
                  <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center group border border-slate-800">
                    {isLoading ? (
                      <div className="w-full h-full animate-pulse bg-slate-800/50" />
                    ) : isValidVideoUrl ? (
                      <video controls className="w-full h-full aspect-video rounded-xl bg-slate-900 object-cover" src={videoUrl} />
                    ) : (
                      <div className="w-full h-full aspect-video flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/20 to-slate-900/60 z-0" />
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                            <Video className="text-slate-400 w-8 h-8" />
                          </div>
                          <h3 className="text-xl font-medium text-white mb-2">{isAr ? 'الفيديو غير متاح' : 'Video Unavailable'}</h3>
                          <p className="text-slate-400 text-sm max-w-xs text-center">{isAr ? 'سيتوفر المحتوى قريباً.' : 'Video content will be available soon.'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 glass-panel p-6 rounded-2xl border border-white/10 dark:border-slate-800/50">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      {isLoading ? <div className="h-8 bg-slate-200 dark:bg-slate-700 w-1/3 animate-pulse rounded" /> : currentLesson?.title || (isAr ? 'اختر درساً للبدء' : 'Select a lesson')}
                    </h2>
                    <div className="text-slate-600 dark:text-slate-400 text-sm mt-4">
                      {isLoading ? <div className="h-4 bg-slate-200 dark:bg-slate-700 w-full animate-pulse rounded" /> : currentLesson?.description || (isAr ? 'لا يوجد وصف.' : 'No description available.')}
                    </div>
                  </div>
                </div>

                {/* Right: Curriculum Sidebar (30%) */}
                <div className="lg:col-span-4 flex flex-col min-h-0 h-[600px] lg:h-auto">
                  <div className="glass-panel flex flex-col h-full overflow-hidden rounded-2xl border border-white/10 dark:border-slate-800/50">
                    <div className="p-5 border-b border-white/10 dark:border-slate-700/50 flex justify-between items-center bg-white/40 dark:bg-slate-800/40">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t.courseContent || "Curriculum"}</h3>
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                        {course?.weeks?.reduce((acc: number, w: any) => acc + (w.lessons?.length || 0), 0) || 0} {isAr ? 'درس' : 'Lessons'}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-4 hide-scrollbar">
                      {isLoading ? (
                        <div className="animate-pulse space-y-4 p-2">
                          {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
                        </div>
                      ) : course?.weeks?.length > 0 ? (
                        course.weeks.map((week: any, idx: number) => (
                          <div key={idx} className="mb-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-2">
                              {week.title || (isAr ? `الأسبوع ${idx + 1}` : `Week ${idx + 1}`)}
                            </h4>
                            <div className="space-y-1">
                              {week.lessons?.map((lesson: any) => {
                                const isActive = activeLesson === lesson.id;
                                return (
                                  <div
                                    key={lesson.id}
                                    onClick={() => setActiveLesson(lesson.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${isActive ? 'bg-primary/10 border border-primary/20 shadow-sm' : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border border-transparent'}`}
                                  >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <div className="shrink-0">
                                        {isActive ? <Play size={18} className="text-primary" fill="currentColor" /> : <Circle size={18} className="text-slate-400" />}
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className={`text-sm font-medium truncate ${isActive ? 'text-primary dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{lesson.title}</span>
                                        <span className="text-xs text-slate-500">{lesson.estimated_minutes ? `${lesson.estimated_minutes} ${isAr ? 'دقيقة' : 'Mins'}` : '00:00'}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-slate-500 text-sm py-8">{isAr ? 'لا يوجد محتوى متاح' : 'No lessons available.'}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              {/* ========= VIEW B: EVALUATION TIMELINE (الغصون) ========= */}
              <div className="max-w-4xl mx-auto py-8 relative">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                    <GitBranch size={16} className="text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">{isAr ? 'مسار التقييم' : 'Evaluation Path'}</span>
                  </div>
                  <h2 className="text-3xl font-extrabold text-white mb-2">{isAr ? 'الغصون - خط الزمن' : 'The Branches — الغصون'}</h2>
                  <p className="text-slate-400 max-w-md mx-auto">{isAr ? 'مراحلك التعليمية المخصصة من المشرف' : 'Your personalized learning milestones from the Supervisor'}</p>
                </motion.div>

                {/* Vertical Spine */}
                <div className="relative">
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute left-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-emerald-500/60 via-primary/40 to-transparent"
                    style={{ transformOrigin: "top" }}
                  />

                  {/* Branches */}
                  <div className="space-y-8 relative">
                    {displayMilestones.map((milestone: any, index: number) => (
                      <TimelineBranch key={milestone.id} milestone={milestone} index={index} isAr={isAr} />
                    ))}
                  </div>

                  {/* Bottom fade */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary/50 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                  />
                </div>

                {/* Empty state if truly no milestones */}
                {milestones.length === 0 && (
                  <div className="mt-8">
                    <EmptyState
                      title={isAr ? 'لا توجد مراحل بعد' : 'No milestones yet'}
                      description={isAr ? 'سيقوم المشرف بتخصيص مساركم التعليمي قريباً.' : 'Your Supervisor will customize your evaluation path soon.'}
                      icon="award"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
