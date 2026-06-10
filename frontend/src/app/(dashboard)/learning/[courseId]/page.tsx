"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Play, CheckCircle, Circle, Video, Lock, FileText, Download, ArrowLeft, BookOpen, GitBranch, Award, ClipboardCheck, MessageSquare, Star, Pause, Maximize, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import axios from '@/lib/axios';
import dynamic from 'next/dynamic';
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });
import screenfull from 'screenfull';


import { useUserRole } from '@/hooks/useUserRole';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from '@/components/ui/EmptyState';
import { useTranslation } from '@/i18n/TranslationContext';

// --- Milestone Type Config ---
const MILESTONE_CONFIG: Record<string, { icon: React.ElementType; color: string; gradient: string }> = {
  ACHIEVEMENT: { icon: Award, color: 'text-amber-400', gradient: 'from-amber-500/10 to-orange-500/20' },
  ASSESSMENT: { icon: FileText, color: 'text-purple-400', gradient: 'from-purple-500/10 to-pink-500/20' },
  CHECKPOINT: { icon: GitBranch, color: 'text-emerald-400', gradient: 'from-emerald-500/10 to-teal-500/20' },
  NOTE: { icon: MessageSquare, color: 'text-blue-400', gradient: 'from-blue-500/10 to-indigo-500/20' },
  VIRTUAL_SESSION: { icon: Video, color: 'text-blue-400', gradient: 'from-blue-500/10 to-cyan-500/20' }
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
                {milestone.milestone_type === 'VIRTUAL_SESSION' ? (isAr ? 'جلسة افتراضية' : 'Virtual Session') : milestone.milestone_type}
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
              <span>{new Date(milestone.milestone_date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' })}</span>
              {milestone.created_by_name && <span>• {milestone.created_by_name}</span>}
            </div>
            
            {milestone.milestone_type === 'VIRTUAL_SESSION' && (
              <div className={`mt-4 flex ${isLeft ? 'justify-end' : 'justify-start'}`}>
                {milestone.meeting_link ? (
                  <a href={milestone.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-sm">
                    <Video size={16} />
                    {isAr ? 'انضمام للجلسة' : 'Join Session'}
                  </a>
                ) : (
                  <div className="px-4 py-2 bg-slate-800 text-slate-500 rounded-lg text-center font-medium text-sm cursor-not-allowed">
                    {isAr ? 'الرابط غير متوفر بعد' : 'Link not available yet'}
                  </div>
                )}
              </div>
            )}
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
          className={`absolute h-0.5 w-5 bg-gradient-to-e ${isLeft ? 'end-7 from-transparent to-white/30' : 'start-7 from-white/30 to-transparent'}`}
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
  const [videoDurations, setVideoDurations] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'content' | 'timeline'>('content');
  const [mounted, setMounted] = useState(false);

  // --- Premium Player States ---
  const playerRef = React.useRef<any>(null);
  const playerContainerRef = React.useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: course, error, isLoading } = useSWR(courseId ? `/courses/${courseId}/` : null, fetcher);
  const { data: milestonesData } = useSWR(courseId ? `/milestones/?course=${courseId}` : null, fetcher);
  const { data: progressData, mutate: mutateProgress } = useSWR('/progress/', fetcher, { shouldRetryOnError: false });
  
  const completedLessonIds = new Set(progressData?.results?.filter((p: any) => p.is_completed).map((p: any) => p.lesson) || []);

  const { locale, dict, t: translate } = useTranslation();
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
                        {allLessons.length} {isAr ? 'درس' : 'Lessons'}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-4 hide-scrollbar">
                      {isLoading ? (
                        <div className="animate-pulse space-y-4 p-2">
                          {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
                        </div>
                      ) : course?.course_structure === 'LONG_NESTED' && course?.units?.length > 0 ? (
                        course.units.map((unit: any, idx: number) => (
                          <div key={idx} className="mb-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-2">
                              {unit.title || (isAr ? `الوحدة ${idx + 1}` : `Unit ${idx + 1}`)}
                            </h4>
                            <div className="space-y-1">
                              {unit.lessons?.map((lesson: any) => {
                                const isActive = activeLesson === lesson.id;
                                return (
                                  <div
                                    key={lesson.id}
                                    onClick={() => setActiveLesson(lesson.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${isActive ? 'bg-primary/10 border border-primary/20 shadow-sm' : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border border-transparent'}`}
                                  >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="shrink-0">
                                    {completedLessonIds.has(lesson.id) ? (
                                      <CheckCircle size={18} className="text-emerald-500" fill="currentColor" />
                                    ) : isActive ? (
                                      <Play size={18} className="text-primary" fill="currentColor" />
                                    ) : (
                                      <Circle size={18} className="text-slate-400" />
                                    )}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className={`text-sm font-medium truncate ${isActive ? 'text-primary dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'} ${completedLessonIds.has(lesson.id) ? 'opacity-70' : ''}`}>{lesson.title}</span>
                                    <span className="text-xs text-slate-500">{videoDurations[lesson.id] || (lesson.estimated_minutes ? `${lesson.estimated_minutes} ${isAr ? 'دقيقة' : 'Mins'}` : '00:00')}</span>
                                  </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      ) : course?.course_structure !== 'LONG_NESTED' && course?.flat_lessons?.length > 0 ? (
                        <div className="space-y-1 mt-2">
                          {course.flat_lessons.map((lesson: any) => {
                            const isActive = activeLesson === lesson.id;
                            return (
                              <div
                                key={lesson.id}
                                onClick={() => setActiveLesson(lesson.id)}
                                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${isActive ? 'bg-primary/10 border border-primary/20 shadow-sm' : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border border-transparent'}`}
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="shrink-0">
                                    {completedLessonIds.has(lesson.id) ? (
                                      <CheckCircle size={18} className="text-emerald-500" fill="currentColor" />
                                    ) : isActive ? (
                                      <Play size={18} className="text-primary" fill="currentColor" />
                                    ) : (
                                      <Circle size={18} className="text-slate-400" />
                                    )}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className={`text-sm font-medium truncate ${isActive ? 'text-primary dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'} ${completedLessonIds.has(lesson.id) ? 'opacity-70' : ''}`}>{lesson.title}</span>
                                    <span className="text-xs text-slate-500">{videoDurations[lesson.id] || (lesson.estimated_minutes ? `${lesson.estimated_minutes} ${isAr ? 'دقيقة' : 'Mins'}` : '00:00')}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
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


                {/* Evaluation Header */}
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
                    className="absolute start-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-emerald-500/60 via-primary/40 to-transparent"
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
                    className="absolute bottom-0 start-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary/50 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                  />
                </div>

                {/* Empty state if truly no milestones */}
                {displayMilestones.length === 0 && (
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
