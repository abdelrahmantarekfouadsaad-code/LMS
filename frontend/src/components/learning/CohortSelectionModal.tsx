"use client";

import React, { useState } from 'react';
import axios from '@/lib/axios';

interface CourseGroup {
  id: number;
  name: string;
  official_day: number;
  official_time: string;
  capacity: number;
  primary_teacher: number | null;
  current_students?: number; // Optional if we fetch it or it comes from API
}

interface CohortSelectionModalProps {
  isOpen: boolean;
  studentName: string;
  courseTitle: string;
  availableGroups: CourseGroup[];
  onSelectGroup: (groupId: number) => Promise<void>;
}

const DAYS_MAP: Record<number, string> = {
  0: 'Monday',
  1: 'Tuesday',
  2: 'Wednesday',
  3: 'Thursday',
  4: 'Friday',
  5: 'Saturday',
  6: 'Sunday'
};

export default function CohortSelectionModal({ isOpen, studentName, courseTitle, availableGroups, onSelectGroup }: CohortSelectionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelect = async (groupId: number) => {
    setIsSubmitting(true);
    try {
      await onSelectGroup(groupId);
    } catch (err) {
      console.error(err);
      alert("Failed to join group.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-800 bg-slate-900/50 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome, {studentName}!</h2>
          <p className="text-slate-400 text-lg">
            Thank you for subscribing to <span className="text-emerald-400 font-semibold">{courseTitle}</span>. 
            Please select your preferred study group below to proceed.
          </p>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar max-h-[60vh] bg-slate-950/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableGroups.map((group) => {
              const isFull = (group.current_students ?? 0) >= group.capacity;
              
              return (
                <div 
                  key={group.id} 
                  className={`relative p-6 rounded-xl border transition-all duration-200 ${
                    isFull 
                      ? 'border-slate-800 bg-slate-900/50 opacity-50 grayscale pointer-events-none' 
                      : 'border-slate-700 bg-slate-800/50 hover:border-emerald-500/50 hover:bg-slate-800 cursor-pointer group'
                  }`}
                  onClick={() => !isFull && !isSubmitting && handleSelect(group.id)}
                >
                  {isFull && (
                    <div className="absolute top-4 right-4 bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded border border-red-500/30">
                      GROUP FULL
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors">
                    {group.name}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Every {DAYS_MAP[group.official_day] || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{group.official_time?.substring(0, 5) || 'TBA'} (Cairo Time)</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50 mt-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{group.current_students ?? 0} / {group.capacity} Enrolled</span>
                    </div>
                  </div>

                  {!isFull && (
                    <div className="mt-6">
                      <button className="w-full py-2 rounded bg-emerald-600/10 text-emerald-400 font-medium group-hover:bg-emerald-600 group-hover:text-white transition-all border border-emerald-600/20 group-hover:border-emerald-500">
                        Select Group
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {availableGroups.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500">
                No groups available for this course. Please contact support.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
