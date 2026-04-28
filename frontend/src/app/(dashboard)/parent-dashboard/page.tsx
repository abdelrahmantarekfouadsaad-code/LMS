"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import EmptyState from '@/components/ui/EmptyState';

export default function ParentDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait until the session is loaded and available
    if (!session?.accessToken) return;

    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/parents/dashboard/', {
          headers: {
            Authorization: `Bearer ${session.accessToken}`
          }
        });
        setData(response.data);
      } catch (err: any) {
        console.error("Dashboard Fetch Error:", err);
        if (err.response?.status === 403) {
          setError('Unauthorized: Only parents can access this dashboard.');
        } else {
          setError('Failed to load dashboard data. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [session?.accessToken]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex justify-center items-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex justify-center items-center p-6">
          <div className="glass-panel p-8 text-center max-w-md w-full border border-red-500/20 bg-red-500/5">
            <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
            <p className="text-slate-400">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  const { student_info, enrolled_courses, overall_evaluation } = data || {};

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col p-6 lg:p-10 overflow-y-auto hide-scrollbar">
        {/* Header Section */}
        <header className="mb-8 text-start">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2"
          >
            Welcome back. Here is {student_info?.name || 'your student'}'s progress.
          </motion.h1>
          <p className="text-slate-500 dark:text-slate-400">
            Monitoring level: <span className="font-semibold text-emerald-500">{student_info?.level || 'Unassigned'}</span>
          </p>
        </header>

        {/* Mock Slider / Banner Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-10 rounded-2xl overflow-hidden shadow-2xl border border-white/5 h-[200px] w-full bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-center relative group"
        >
          {/* Subtle background effects for premium feel */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent"></div>
          <div className="relative z-10 text-center p-6">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Parent Supervisory Portal</h2>
            <p className="text-emerald-400 font-medium">Empowering you to guide their learning journey.</p>
          </div>
        </motion.div>

        {/* Middle Section: Overall Evaluation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="backdrop-blur-md bg-slate-900/80 rounded-2xl shadow-xl p-6 mt-6 border border-emerald-500/20 relative overflow-hidden">
            {/* Background glowing orb effect */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
            
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Overall Evaluation</h2>
            </div>
            
            <div className="relative z-10 pl-14">
              <p className="text-slate-300 leading-relaxed font-medium">
                {overall_evaluation || "Gathering AI insights on student performance..."}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bottom Section: Enrolled Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-10 mb-10"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Active Enrollments
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(!enrolled_courses || enrolled_courses.length === 0) ? (
              <div className="col-span-full">
                <EmptyState
                  title="No Active Enrollments"
                  description="Your student is not enrolled in any courses yet."
                  icon="folder"
                />
              </div>
            ) : (
              enrolled_courses.map((course: any) => (
                <div key={course.id} className="group flex flex-col justify-between backdrop-blur-md bg-slate-900/60 p-6 rounded-2xl border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 h-full relative overflow-hidden">
                  {/* Decorative top border based on course color */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${course.color || 'from-emerald-500 to-indigo-500'}`}></div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-6 line-clamp-2">
                      {course.description}
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-4">
                    <Link 
                      href={`/learning/${course.id}`} 
                      className="w-full py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      View Detailed Progress
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

      </main>
    </div>
  );
}
