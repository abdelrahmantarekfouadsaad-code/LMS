"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Play, CheckCircle, Circle, Video, Lock, FileText, Download, ArrowLeft, BookOpen, GitBranch, Award, ClipboardCheck, MessageSquare, Star, Pause, Maximize, RotateCcw, Volume2, VolumeX, FastForward, Rewind } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import axios from '@/lib/axios';
import ReactPlayer from 'react-player';
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
  const [activeTab, setActiveTab] = useState<'content' | 'timeline'>('content');
  const [videoDurations, setVideoDurations] = useState<Record<number, string>>({});
  const [mounted, setMounted] = useState(false);

  // --- Premium Player States ---
  const playerRef = React.useRef<any>(null);
  const playerContainerRef = React.useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseMove = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
    if (isPlaying && !isBuffering) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 10000);
    }
  };

  const handleMouseLeave = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isBuffering) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 10000);
    }
  };

  useEffect(() => {
    if (!isPlaying || isBuffering) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      setShowControls(true);
    } else {
      handleMouseMove();
    }
  }, [isPlaying, isBuffering]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !seeking) {
      interval = setInterval(() => {
        if (playerRef.current && playerRef.current.duration > 0) {
          setPlayed(playerRef.current.currentTime / playerRef.current.duration);
        }
      }, 250); // Sync UI 4 times a second
    }
    return () => clearInterval(interval);
  }, [isPlaying, seeking]);

  const { data: course, error, isLoading } = useSWR(courseId ? `/courses/${courseId}/` : null, fetcher);
  const { data: milestonesData } = useSWR(courseId ? `/milestones/?course=${courseId}` : null, fetcher);
  const { data: progressData, mutate: mutateProgress } = useSWR('/progress/', fetcher, { shouldRetryOnError: false });
  
  const completedLessonIds = new Set(progressData?.results?.filter((p: any) => p.is_completed).map((p: any) => p.lesson) || []);

  const { locale, dict, t: translate } = useTranslation();

  const isAr = locale === 'ar';
  const t = dict.learning;

  const milestones = (milestonesData?.results || milestonesData || []);
  
  let displayMilestones = [...milestones];
  
  if (course?.groups?.length > 0) {
    course.groups.forEach((group: any) => {
      if (group.zoom_sessions?.length > 0) {
        group.zoom_sessions.forEach((session: any) => {
          displayMilestones.push({
            id: `virtual-${session.id}`,
            milestone_type: 'VIRTUAL_SESSION',
            title: session.title,
            description: group.name,
            milestone_date: session.scheduled_time || new Date().toISOString(),
            is_completed: false,
            meeting_link: session.meeting_link
          });
        });
      }
    });
  }
  
  // Sort them chronologically
  displayMilestones.sort((a, b) => new Date(a.milestone_date).getTime() - new Date(b.milestone_date).getTime());

  const allLessons = React.useMemo(() => {
    if (course?.course_structure === 'LONG_NESTED') {
        return course?.units?.flatMap((u: any) => u.lessons || []) || [];
    } else {
        return course?.flat_lessons || [];
    }
  }, [course]);

  const currentLesson = activeLesson
    ? allLessons.find((l: any) => l.id === activeLesson)
    : allLessons[0];

  useEffect(() => {
    if (!activeLesson && allLessons[0]) {
      setActiveLesson(allLessons[0].id);
    }
    // Reset player state on lesson change
    setIsPlaying(false);
    setPlayed(0);
    setHasEnded(false);
  }, [activeLesson, allLessons]);

  const videoUrl = currentLesson?.video_url;
  const isValidVideoUrl = !!videoUrl;

  const handleVideoEnded = async () => {
    setHasEnded(true);
    setIsPlaying(false);
    if (activeLesson && !completedLessonIds.has(activeLesson)) {
      try {
        await axios.post('/progress/mark_complete/', { lesson_id: activeLesson });
        mutateProgress();
      } catch (err) {
        console.error("Failed to mark lesson complete", err);
      }
    }
  };

  const handleProgress = (state: { played: number, playedSeconds: number, loaded: number, loadedSeconds: number }) => {
    if (!hasEnded && !seeking) {
      setPlayed(state.played);
    }
  };

  const togglePlay = () => {
    if (hasEnded) {
      setHasEnded(false);
      setPlayed(0);
      if (playerRef.current) {
        playerRef.current.currentTime = 0;
      }
    }
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = () => {
    if (screenfull.isEnabled && playerContainerRef.current) {
      screenfull.toggle(playerContainerRef.current);
    }
  };

  const handleSeekForward = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (playerRef.current) {
      playerRef.current.currentTime += 10;
      if (playerRef.current.duration > 0) {
        setPlayed(playerRef.current.currentTime / playerRef.current.duration);
      }
    }
  };

  const handleSeekBackward = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (playerRef.current) {
      playerRef.current.currentTime -= 10;
      if (playerRef.current.duration > 0) {
        setPlayed(playerRef.current.currentTime / playerRef.current.duration);
      }
    }
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setPlayed(val);
    if (playerRef.current && playerRef.current.duration) {
      playerRef.current.currentTime = val * playerRef.current.duration;
    }
  };

  const handleDuration = (e: any) => {
    const durationInSeconds = e.target?.duration;
    if (activeLesson && !videoDurations[activeLesson] && durationInSeconds) {
      const minutes = Math.floor(durationInSeconds / 60);
      const seconds = Math.floor(durationInSeconds % 60);
      const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setVideoDurations(prev => ({ ...prev, [activeLesson]: formatted }));
    }
  };

  const tabs = [
    { key: 'content' as const, label: isAr ? 'محتوى الدورة' : 'Course Content', icon: BookOpen },
    { key: 'timeline' as const, label: isAr ? 'الغصون (التقييم)' : 'Timeline (الغصون)', icon: GitBranch },
  ];

  if (error?.response?.status === 403 || error?.response?.data?.code === 'content_locked') {
    return (
      <div className="flex h-screen bg-background-light dark:bg-background-dark items-center justify-center p-4">
        <div className="glass-panel max-w-md w-full p-12 text-center flex flex-col items-center border border-red-500/20 bg-red-500/5 rounded-2xl shadow-2xl">
          <Lock className="w-16 h-16 text-red-500 mb-6" />
          <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">{isAr ? 'المحتوى مقفل' : 'Content Locked'}</h2>
          <p className="text-slate-400 mb-8 text-lg">{isAr ? 'يرجى الاشتراك في هذه الدورة للوصول إلى محتواها الكامل والبدء في التعلم.' : 'Please subscribe to this course to unlock its full content and start learning.'}</p>
          <Link href={`/payment?courseId=${courseId}`} className="px-8 py-4 bg-primary text-white rounded-xl font-bold w-full hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
            <Lock size={18} />
            {isAr ? 'فتح المحتوى الآن' : 'Unlock Content Now'}
          </Link>
          <Link href="/learning" className="mt-6 text-sm font-medium text-slate-500 hover:text-white transition-colors">
            {isAr ? 'العودة للكتالوج' : 'Back to Catalog'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col p-4 lg:p-8 overflow-y-auto hide-scrollbar">

        <header className="mb-6 flex flex-col gap-2">
          <Link href="/learning" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary transition-colors w-fit">
            <ArrowLeft size={16} className={`me-1 ${isAr ? 'rotate-180 ms-1 me-0' : ''}`} />
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
                  <div 
                    ref={playerContainerRef} 
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center group border border-slate-800"
                  >
                    {isLoading || !mounted ? (
                      <div className="w-full h-full animate-pulse bg-slate-800/50" />
                    ) : isValidVideoUrl ? (
                      <>
                        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                          <ReactPlayer
                            ref={playerRef}
                            src={videoUrl}
                            width="100%"
                            height="100%"
                            controls={false}
                            playing={isPlaying}
                            muted={muted}
                            onBuffer={() => setIsBuffering(true)}
                            onBufferEnd={() => setIsBuffering(false)}
                            onEnded={handleVideoEnded}
                            onProgress={handleProgress as any}
                            onDurationChange={handleDuration}
                            style={{ backgroundColor: '#0f172a' }}
                            config={{ 
                              youtube: { 
                                playerVars: { modestbranding: 1, rel: 0, showinfo: 0, iv_load_policy: 3, disablekb: 1 } 
                              } 
                            } as any}
                          />
                        </div>

                        <div className={`absolute inset-0 z-30 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                          {/* Top Mask for YouTube Title */}
                          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-slate-950 via-emerald-950/40 to-transparent backdrop-blur-md z-30 pointer-events-none transition-all duration-700">
                          </div>

                          {/* Custom Controls Overlay (Bottom Mask) */}
                          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-slate-950 via-emerald-950/40 to-transparent backdrop-blur-md z-30 pointer-events-none flex flex-col justify-end p-4 transition-all duration-700 hover:via-emerald-900/60">

                            {/* Progress Bar */}
                            <input 
                              type="range" 
                              min={0} 
                              max={0.999999} 
                              step="any" 
                              value={played} 
                              style={{ background: `linear-gradient(to right, #10b981 ${played * 100}%, rgba(75, 85, 99, 0.5) ${played * 100}%)` }}
                              onMouseDown={() => setSeeking(true)} 
                              onChange={handleTimelineChange} 
                              onMouseUp={() => setSeeking(false)} 
                              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-emerald-500 pointer-events-auto mb-4 bg-transparent" 
                            />
                            
                            {/* Controls Row */}
                            <div className="flex items-center justify-between text-white pointer-events-auto">
                              <div className="flex items-center gap-2">
                                <button onClick={togglePlay} className="hover:text-emerald-400 transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm cursor-pointer">
                                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="ms-1" />}
                                </button>
                                <button type="button" onClick={handleSeekBackward} className="hover:text-emerald-400 transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm cursor-pointer pointer-events-auto" title="-10s">
                                  <Rewind size={18} />
                                </button>
                                <button type="button" onClick={handleSeekForward} className="hover:text-emerald-400 transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm cursor-pointer pointer-events-auto" title="+10s">
                                  <FastForward size={18} />
                                </button>
                                <div className="h-4 w-px bg-white/20 mx-1"></div>
                                <button onClick={() => setMuted(!muted)} className="hover:text-emerald-400 transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm cursor-pointer">
                                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                </button>
                              </div>
                              <button onClick={toggleFullscreen} className="hover:text-emerald-400 transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm cursor-pointer">
                                <Maximize size={20} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Black Curtain Overlay on End */}
                        <AnimatePresence>
                          {hasEnded && (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center flex-col backdrop-blur-md"
                            >
                              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                <CheckCircle className="w-10 h-10 text-emerald-400" />
                              </div>
                              <h3 className="text-2xl font-bold text-white mb-6">
                                {dict.learning?.lessonCompleted || 'Lesson Completed'}
                              </h3>
                              <button 
                                onClick={togglePlay}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
                              >
                                <RotateCcw size={18} />
                                {dict.learning?.replayVideo || 'Replay Video'}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        {/* Play Overlay (when paused and not ended) */}
                        {!isPlaying && !hasEnded && (
                          <div 
                            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-auto cursor-pointer bg-black/40 backdrop-blur-[2px] transition-all"
                            onClick={togglePlay}
                          >
                            <div className="w-20 h-20 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl transition-transform hover:scale-110">
                              <Play size={32} className="text-white ms-2 opacity-100" fill="currentColor" />
                            </div>
                          </div>
                        )}
                      </>
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
