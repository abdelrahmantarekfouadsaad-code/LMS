"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import axios from '@/lib/axios';
import { useTranslation } from '@/i18n/TranslationContext';
import { Loader2, BookOpen, Video } from 'lucide-react';
import { motion } from 'framer-motion';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function TeacherSessionsGatewayPage() {
  const { t, locale } = useTranslation();
  const isAr = locale === 'ar';
  const router = useRouter();

  // Fetch teacher's assigned courses
  const { data: coursesData, isLoading } = useSWR('/courses/', fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false
  });
  
  const courses = coursesData?.results ?? (Array.isArray(coursesData) ? coursesData : []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 font-sans">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
          <Video className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {isAr ? 'الجلسات الافتراضية' : 'Virtual Sessions'}
          </h1>
          <p className="text-slate-400 mt-2">
            {isAr ? 'اختر مجموعة لبدء البث المباشر ومتابعة مسار التقييم.' : 'Select a cohort to manage your live timeline and start streaming.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {courses.map((course: any, idx: number) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.4 }}
            className="group bg-slate-900/50 rounded-2xl shadow-lg border border-slate-800/60 overflow-hidden hover:shadow-xl hover:border-blue-500/30 hover:shadow-blue-500/5 transition-all duration-300"
          >
            <div className="h-48 bg-slate-800 relative overflow-hidden">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2364748b">No Image</text></svg>';
                  }}
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${course.color || 'from-slate-800 to-slate-700'}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
              
              <div className="absolute bottom-4 start-4 end-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 backdrop-blur-md border border-blue-500/30 rounded-lg text-blue-300 text-xs font-bold">
                  <Video size={14} />
                  {isAr ? 'البث المباشر للغصون' : 'Live Timeline Branches'}
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{course.title}</h3>
              <p className="text-slate-400 text-sm mb-4 line-clamp-2">{course.description}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-800/60 text-sm flex flex-col gap-2">
                <span className="text-slate-500 font-medium">{isAr ? 'المجموعات:' : 'Cohorts:'}</span>
                <div className="flex flex-wrap gap-2">
                  {course.groups?.map((group: any) => (
                    <button
                      key={group.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/learning/${course.id}?tab=timeline&cohortId=${group.id}`);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition-colors text-xs font-bold border border-slate-700 hover:border-blue-500 cursor-pointer"
                    >
                      {group.name}
                    </button>
                  ))}
                  {(!course.groups || course.groups.length === 0) && (
                    <span className="text-slate-600 text-xs">{isAr ? 'لا توجد مجموعات' : 'No cohorts available'}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        
        {courses.length === 0 && (
          <div className="col-span-full text-center py-16 bg-slate-900/40 border border-slate-800/40 rounded-2xl">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-700" />
            <p className="text-slate-500 text-lg">{isAr ? 'لا توجد كورسات متاحة' : 'No courses available'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
