"use client"

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, BookOpen, GraduationCap, Target, PlayCircle, ChevronRight, Loader2 } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/hooks/useLocale';
import { DICTIONARY } from '@/locales/dictionary';
import { useUserRole } from '@/hooks/useUserRole';
import GuestDashboard from '@/components/guest/GuestDashboard';
import NewsCarousel from '@/components/guest/NewsCarousel';
import RestrictionModal from '@/components/shared/RestrictionModal';
import useSWR from 'swr';
import api from '@/lib/axios';

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

// Thin router
export default function DashboardHome() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { isGuest } = useUserRole();

    useEffect(() => {
        if (session?.user?.role === 'SUPER_ADMIN') {
            router.push('/super-admin/users');
        }
    }, [session, router]);

    if (status === 'loading' || session?.user?.role === 'SUPER_ADMIN') {
        return (
            <div className="flex h-screen bg-background-light dark:bg-background-dark items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (isGuest) return <GuestDashboard />;

    return <StudentDashboard />;
}

// Student Dashboard (Phase 1 Execution)
function StudentDashboard() {
    const { data: session } = useSession();
    const locale = useLocale();
    const t = DICTIONARY[locale as 'en' | 'ar']?.dashboard || DICTIONARY.en.dashboard;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCourseTitle, setSelectedCourseTitle] = useState('');

    const handleCourseClick = (e: React.MouseEvent, title: string) => {
        e.preventDefault();
        setSelectedCourseTitle(title);
        setIsModalOpen(true);
    };

    const { data: courses, error: errorCourses, isLoading: isLoadingCourses } = useSWR(
        session?.accessToken ? '/courses/enrolled/' : null,
        (url) => api.get(url).then(res => res.data)
    );

    const { data: progressData, error: errorProgress, isLoading: isLoadingProgress } = useSWR(
        session?.accessToken ? '/progress/' : null,
        (url) => api.get(url).then(res => res.data)
    );

    if (errorCourses || errorProgress) {
        return null; // Return null so NextAuth/Axios middleware handles 401
    }

    if (isLoadingCourses || isLoadingProgress || !courses || !progressData) {
        return (
            <div className="flex h-screen bg-background-light dark:bg-background-dark items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    const enrolledCourses = Array.isArray(courses?.results || courses) ? (courses?.results || courses) : [];
    const progressItems = Array.isArray(progressData?.results || progressData) ? (progressData?.results || progressData) : [];
    
    const enrolledLessonIds = new Set();
    enrolledCourses.forEach((course: any) => {
        if (course.course_structure === 'LONG_NESTED') {
            course.units?.forEach((unit: any) => {
                unit.lessons?.forEach((lesson: any) => enrolledLessonIds.add(lesson.id));
            });
        } else {
            course.flat_lessons?.forEach((lesson: any) => enrolledLessonIds.add(lesson.id));
        }
    });

    const completedLessons = progressItems.filter((p: any) => p.is_completed && enrolledLessonIds.has(p.lesson)).length;
    const totalLessons = enrolledLessonIds.size;
    const overallCompletion = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const stats = {
        overallCompletion: overallCompletion,
        totalTopics: completedLessons,
        activeCourses: enrolledCourses.length,
    };

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
                            <div className="flex justify-center p-8 bg-gradient-to-br from-emerald-500/5 to-teal-500/10 rounded-3xl border border-white/10 backdrop-blur-xl shadow-lg relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <CircularProgress
                                    percentage={stats.overallCompletion}
                                    color="#10B981"
                                    label={locale === 'ar' ? 'نسبة الإنجاز الكلية' : 'Overall Completion'}
                                />
                            </div>

                            {/* Metric 1: Total Completed Topics */}
                            <div className="flex flex-col justify-center p-8 bg-gradient-to-br from-indigo-500/5 to-purple-500/10 rounded-3xl border border-white/10 backdrop-blur-xl h-full relative overflow-hidden shadow-lg group">
                                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all duration-500"></div>
                                <div className="p-3 bg-indigo-500/10 w-fit rounded-2xl mb-4">
                                    <BookOpen className="w-8 h-8 text-indigo-500" />
                                </div>
                                <span className="text-5xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">{stats.totalTopics}</span>
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    {locale === 'ar' ? 'الموضوعات المكتملة' : 'Completed Topics'}
                                </span>
                            </div>

                            {/* Metric 2: Active Courses */}
                            <div className="flex flex-col justify-center p-8 bg-gradient-to-br from-amber-500/5 to-orange-500/10 rounded-3xl border border-white/10 backdrop-blur-xl h-full relative overflow-hidden shadow-lg group">
                                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/30 transition-all duration-500"></div>
                                <div className="p-3 bg-amber-500/10 w-fit rounded-2xl mb-4">
                                    <GraduationCap className="w-8 h-8 text-amber-500" />
                                </div>
                                <span className="text-5xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">{stats.activeCourses}</span>
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
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
                        {enrolledCourses.length === 0 ? (
                            <div className="col-span-full py-10 text-center text-slate-500">
                                {locale === 'ar' ? 'لا توجد دورات مسجلة حالياً.' : 'No enrolled courses found.'}
                            </div>
                        ) : (
                            enrolledCourses.map((course: any) => {
                                const courseColor = course.color || 'from-blue-500/20 to-indigo-600/20';
                                const iconColor = 'text-indigo-400';
                                const courseProgress = 0; // Replace with actual course progress calculation if available

                                return (
                                    <button 
                                        key={course.id} 
                                        onClick={(e) => handleCourseClick(e, locale === 'ar' ? (course.title_ar || course.title) : course.title)} 
                                        className="group block h-full text-left w-full cursor-pointer focus:outline-none"
                                    >
                                        <div className={`glass-panel p-6 h-full flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 bg-gradient-to-br ${courseColor} border border-white/5`}>

                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`p-3 rounded-xl bg-slate-900/40 backdrop-blur-md ${iconColor}`}>
                                                        <PlayCircle className="w-6 h-6" />
                                                    </div>
                                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-black/20 text-white/80">
                                                        {courseProgress}%
                                                    </span>
                                                </div>

                                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                                    {locale === 'ar' ? (course.title_ar || course.title) : course.title}
                                                </h3>
                                                <p className="text-sm text-slate-400 mb-6">
                                                    {course.instructor || 'Academy Instructor'}
                                                </p>
                                            </div>

                                            {/* Mini Progress Bar */}
                                            <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                                                <motion.div
                                                    className={`h-full bg-gradient-to-r ${courseColor.replace('/20', '').replace('/20', '')}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${courseProgress}%` }}
                                                    transition={{ duration: 1, delay: 0.5 }}
                                                />
                                            </div>

                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </motion.div>

            </main>

            {/* Restriction Modal Overlay */}
            <RestrictionModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                courseTitle={selectedCourseTitle} 
            />
        </div>
    );
}
