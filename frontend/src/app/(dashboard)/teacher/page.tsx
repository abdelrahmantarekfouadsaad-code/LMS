"use client";

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import axios from '@/lib/axios';
import { Star, Users, Calendar, Clock, MessageSquare } from 'lucide-react';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function TeacherDashboard() {
  const { data: userProfile, error: profileError } = useSWR('/auth/me/', fetcher);
  // Assuming a custom endpoint or filtering via /course-groups/?primary_teacher=me
  // For now, let's fetch all groups and filter, or assume an endpoint exists.
  const { data: allGroups = [] } = useSWR('/course-groups/', fetcher);
  const { data: allFeedbacks = [] } = useSWR('/feedbacks/', fetcher);

  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  if (!userProfile && !profileError) {
    return <div className="p-8 text-slate-400">Loading dashboard...</div>;
  }

  const teacherProfile = userProfile?.teacher_profile;
  const overallRating = teacherProfile?.overall_rating || 0;

  // Filter groups where this teacher is the primary teacher
  const assignedGroups = allGroups.filter((g: any) => g.primary_teacher === userProfile?.id);

  return (
    <div className="min-h-screen bg-slate-950 p-8 font-sans">
      {/* Header & Rating */}
      <div className="mb-10 bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Teacher Dashboard</h1>
          <p className="text-slate-400 text-lg">Welcome back, {userProfile?.first_name} {userProfile?.last_name}</p>
        </div>
        
        <div className="mt-6 md:mt-0 flex flex-col items-center md:items-end bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Overall Rating</span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-white">{overallRating.toFixed(1)}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-6 h-6 ${star <= Math.round(overallRating) ? 'fill-emerald-500 text-emerald-500' : 'text-slate-700'}`} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cohorts Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Your Assigned Cohorts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedGroups.map((group: any) => (
            <div 
              key={group.id} 
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-emerald-500/50 transition-colors cursor-pointer group"
              onClick={() => setSelectedGroup(group)}
            >
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors">{group.name}</h3>
              <div className="space-y-3 text-slate-400">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <span>Day {group.official_day}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-500" />
                  <span>{group.official_time?.substring(0, 5)}</span>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                  <Users className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-300 font-medium">Capacity: {group.capacity}</span>
                </div>
              </div>
            </div>
          ))}
          {assignedGroups.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
              You have no assigned cohorts at the moment.
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {selectedGroup && (
        <FeedbackModal 
          group={selectedGroup} 
          feedbacks={allFeedbacks.filter((f: any) => f.session?.course_group === selectedGroup.id)} 
          onClose={() => setSelectedGroup(null)} 
        />
      )}
    </div>
  );
}

function FeedbackModal({ group, feedbacks, onClose }: { group: any, feedbacks: any[], onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-bold text-white">{group.name} Feedbacks</h2>
            <p className="text-slate-400 mt-1">Student reviews and ratings for sessions in this cohort.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {feedbacks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No feedback submitted for this cohort yet.</p>
            </div>
          ) : (
            feedbacks.map((fb: any) => {
              const avgScore = (fb.q1_rating + fb.q2_rating + fb.q3_rating + fb.q4_rating + fb.q5_rating + fb.q6_rating + fb.q7_rating + fb.q8_rating + fb.q9_rating) / 9;
              return (
                <div key={fb.id} className="bg-slate-950 p-6 rounded-xl border border-slate-800/50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-emerald-400 font-medium text-sm bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        Session #{fb.session}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                      <span className="font-bold text-white mr-1">{avgScore.toFixed(1)}</span>
                      <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                    </div>
                  </div>
                  
                  {fb.text_comment ? (
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-slate-300">
                      "{fb.text_comment}"
                    </div>
                  ) : (
                    <p className="text-slate-500 italic text-sm">No written comment provided.</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
