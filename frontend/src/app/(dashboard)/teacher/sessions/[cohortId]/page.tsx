"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import axios from '@/lib/axios';
import { useTranslation } from '@/i18n/TranslationContext';
import { Loader2, ArrowLeft } from 'lucide-react';
import TimelineBranch from '@/components/learning/TimelineBranch';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function TeacherCohortTimelinePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const cohortId = params.cohortId as string;
  const courseId = searchParams?.get('courseId');
  
  const { t, locale } = useTranslation();
  const isAr = locale === 'ar';

  // Fetch course and milestones
  const { data: course, isLoading: isLoadingCourse, mutate: mutateCourse } = useSWR(courseId ? `/courses/${courseId}/` : null, fetcher);
  const { data: milestonesData, isLoading: isLoadingMilestones } = useSWR(courseId ? `/milestones/?course=${courseId}` : null, fetcher);

  const handleStartSession = async (sessionId: string) => {
    try {
      const res = await axios.post(`/sessions/${sessionId}/start_jitsi/`);
      const url = res.data.meeting_link;
      window.open(url, '_blank');
      mutateCourse();
    } catch (err) {
      console.error(err);
      alert('Failed to start session');
    }
  };

  if (isLoadingCourse || isLoadingMilestones) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  const milestones = (milestonesData?.results || milestonesData || []);
  let displayMilestones = [...milestones];
  let cohortName = '';

  if (course?.groups?.length > 0) {
    course.groups.forEach((group: any) => {
      if (String(group.id) === cohortId) {
        cohortName = group.name;
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
      }
    });
  }

  // Sort them chronologically
  displayMilestones.sort((a, b) => new Date(a.milestone_date).getTime() - new Date(b.milestone_date).getTime());

  return (
    <div className="p-6 lg:p-10 font-sans max-w-5xl mx-auto">
      {/* Header section with back button */}
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => router.push('/teacher/sessions')}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 hover:border-slate-600"
        >
          <ArrowLeft size={20} className={isAr ? "rotate-180" : ""} />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {cohortName ? `${isAr ? 'مسار' : 'Timeline for'} ${cohortName}` : (isAr ? 'المسار التعليمي' : 'Learning Timeline')}
          </h1>
          <p className="text-slate-400 mt-1">
            {course?.title}
          </p>
        </div>
      </div>

      <div className="relative ps-7">
        {/* Timeline Line */}
        <div 
          className="absolute start-14 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-emerald-500 to-transparent opacity-30" 
          style={{ transformOrigin: "top" }}
        />

        {/* Branches */}
        <div className="space-y-8 relative">
          {displayMilestones.map((milestone: any, index: number) => (
            <TimelineBranch 
              key={milestone.id} 
              milestone={milestone} 
              index={index} 
              isAr={isAr} 
              isTeacher={true} 
              onStartSession={handleStartSession} 
            />
          ))}
          {displayMilestones.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              {isAr ? 'لا توجد بيانات متاحة لهذا المسار.' : 'No milestones available for this timeline.'}
            </div>
          )}
        </div>

        {/* Bottom fade */}
        <div className="h-32 bg-gradient-to-b from-transparent to-slate-950 absolute -bottom-10 start-0 end-0 pointer-events-none" />
      </div>
    </div>
  );
}
