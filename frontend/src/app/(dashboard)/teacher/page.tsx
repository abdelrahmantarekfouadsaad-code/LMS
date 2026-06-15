"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import axios from '@/lib/axios';
import { Star, Users, Calendar, Clock, MessageSquare, Loader2, BookOpen, ChevronRight, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const { data: userProfile, isLoading: profileLoading } = useSWR('/accounts/me/', fetcher);
  const { data: assignedGroups = [], isLoading: groupsLoading } = useSWR('/course-groups/', fetcher);
  const { data: feedbacks = [] } = useSWR('/feedbacks/', fetcher);

  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  if (profileLoading || groupsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  const teacherProfile = userProfile?.teacher_profile;
  const overallRating = teacherProfile?.overall_rating || 0;
  const firstName = userProfile?.full_name?.split(' ')[0] || session?.user?.name?.split(' ')[0] || '';
  const fullName = userProfile?.full_name || session?.user?.name || 'Teacher';

  const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="p-6 lg:p-10 font-sans">
      {/* ═══════════════ HEADER & RATING ═══════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800/60 rounded-2xl p-8 relative overflow-hidden"
      >
        {/* Decorative glow */}
        <div className="absolute top-0 end-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl -mt-20 -me-20 pointer-events-none" />
        <div className="absolute bottom-0 start-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -mb-16 -ms-16 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-slate-400 text-lg">
              Here&apos;s an overview of your assigned cohorts and feedback.
            </p>
          </div>

          {/* Star Rating Display */}
          <div className="flex flex-col items-center md:items-end bg-slate-950/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/50 shadow-lg min-w-[200px]">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Overall Rating</span>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black text-white tabular-nums">{overallRating.toFixed(1)}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= Math.floor(overallRating);
                  const partial = star === Math.ceil(overallRating) && overallRating % 1 !== 0;
                  return (
                    <Star
                      key={star}
                      className={`w-6 h-6 transition-all duration-300 ${
                        filled
                          ? 'fill-emerald-400 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                          : partial
                          ? 'fill-emerald-400/50 text-emerald-400/50'
                          : 'text-slate-700'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════ COHORTS GRID ═══════════════ */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl">
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Your Assigned Cohorts</h2>
          <span className="text-sm text-slate-500 bg-slate-800/60 px-3 py-1 rounded-full">
            {assignedGroups.length} group{assignedGroups.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedGroups.map((group: any, idx: number) => {
            const groupFeedbacks = feedbacks.filter((f: any) => f.session_detail?.course_group === group.id || f.session === group.id);
            const gradientColors = [
              'from-emerald-500/10 to-teal-500/5',
              'from-indigo-500/10 to-blue-500/5',
              'from-amber-500/10 to-orange-500/5',
              'from-purple-500/10 to-pink-500/5',
              'from-cyan-500/10 to-sky-500/5',
              'from-rose-500/10 to-red-500/5',
            ];
            const gradient = gradientColors[idx % gradientColors.length];

            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
                onClick={() => setSelectedGroup(group)}
                className={`group bg-gradient-to-br ${gradient} bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 cursor-pointer relative overflow-hidden`}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {group.name}
                    </h3>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0 mt-0.5" />
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-slate-400">
                      <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{DAY_NAMES[group.official_day] || `Day ${group.official_day}`}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{group.official_time?.substring(0, 5) || 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-800/60">
                      <Users className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-slate-300 font-medium">Capacity: {group.capacity}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {assignedGroups.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-16 text-center bg-slate-900/40 border border-slate-800/40 rounded-2xl"
            >
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-700" />
              <p className="text-slate-500 text-lg">You have no assigned cohorts at the moment.</p>
              <p className="text-slate-600 text-sm mt-1">Contact your Super Admin to be assigned to a course group.</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* ═══════════════ FEEDBACK MODAL ═══════════════ */}
      <AnimatePresence>
        {selectedGroup && (
          <FeedbackModal
            group={selectedGroup}
            feedbacks={feedbacks}
            onClose={() => setSelectedGroup(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   FEEDBACK MODAL — Shows student ratings & comments
   for a specific CourseGroup
   ════════════════════════════════════════════════════ */
function FeedbackModal({ group, feedbacks, onClose }: { group: any; feedbacks: any[]; onClose: () => void }) {
  // Filter feedbacks by session's course_group matching this group's ID
  const groupFeedbacks = feedbacks.filter((f: any) => {
    // The session field is either an object with course_group or just an ID
    if (typeof f.session === 'object' && f.session?.course_group) {
      return f.session.course_group === group.id;
    }
    return false;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur-xl shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">{group.name}</h2>
            <p className="text-slate-400 mt-1 text-sm">Student reviews and ratings for sessions in this cohort.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4 flex-1">
          {groupFeedbacks.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-14 h-14 mx-auto mb-4 text-slate-700" />
              <p className="text-slate-500 text-lg">No feedback submitted for this cohort yet.</p>
              <p className="text-slate-600 text-sm mt-1">Feedback will appear here after students rate sessions.</p>
            </div>
          ) : (
            groupFeedbacks.map((fb: any) => {
              const ratings = [fb.q1_rating, fb.q2_rating, fb.q3_rating, fb.q4_rating, fb.q5_rating, fb.q6_rating, fb.q7_rating, fb.q8_rating, fb.q9_rating].filter(Boolean);
              const avgScore = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;

              return (
                <motion.div
                  key={fb.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/50 hover:border-slate-700/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-emerald-400 font-medium text-sm bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      Session #{typeof fb.session === 'object' ? fb.session.id : fb.session}
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                      <span className="font-bold text-white text-sm">{avgScore.toFixed(1)}</span>
                      <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                    </div>
                  </div>

                  {/* Rating bars */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {ratings.slice(0, 9).map((r: number, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-5 shrink-0">Q{i + 1}</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                            style={{ width: `${(r / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 w-3">{r}</span>
                      </div>
                    ))}
                  </div>

                  {fb.text_comment ? (
                    <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800/50 text-slate-300 text-sm italic">
                      &ldquo;{fb.text_comment}&rdquo;
                    </div>
                  ) : (
                    <p className="text-slate-600 italic text-xs">No written comment provided.</p>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
