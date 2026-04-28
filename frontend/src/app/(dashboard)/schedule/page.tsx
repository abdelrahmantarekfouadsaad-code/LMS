"use client"

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, CheckCircle2, Circle, Clock, PlayCircle, BookOpen, Loader2 } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import EmptyState from '@/components/ui/EmptyState';



// The Progress Tube Component
const ProgressTube = ({ percentage }: { percentage: number }) => {
  return (
    <div className="relative h-full w-12 md:w-16 flex flex-col justify-end items-center py-4 bg-slate-900/50 rounded-[40px] border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden group">
      {/* 3D Glass Reflection Overlay */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/10 via-transparent to-black/20 rounded-[40px] pointer-events-none z-10" />
      <div className="absolute top-2 bottom-2 left-2 w-1.5 rounded-full bg-white/20 blur-[1px] z-10" />
      
      {/* Percentage Text overlay */}
      <div className="absolute top-8 z-20 text-white font-bold text-sm md:text-base drop-shadow-md">
        {Math.round(percentage)}%
      </div>

      {/* The filling liquid */}
      <motion.div
        className="w-full bg-gradient-to-t from-emerald-600 via-emerald-400 to-teal-300 rounded-[30px] relative shadow-[0_0_20px_rgba(52,211,153,0.6)]"
        initial={{ height: '0%' }}
        animate={{ height: `${percentage}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        {/* Liquid Surface Highlights */}
        <div className="absolute top-0 inset-x-0 h-3 bg-white/40 rounded-[50%] blur-[2px]" />
        
        {/* Bubbles / Sparkles inside the liquid */}
        <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_20%)] bg-[length:10px_10px]" />
      </motion.div>
    </div>
  );
};

export default function WeeklySchedule() {
  const { data: session } = useSession();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>('friday'); // Default to Friday

  // Calculate Progress
  const progressStats = useMemo(() => {
    let total = 0;
    let completed = 0;
    schedule.forEach(day => {
      day.tasks.forEach((task: any) => {
        total++;
        if (task.isCompleted) completed++;
      });
    });
    return { total, completed, percentage: total === 0 ? 0 : (completed / total) * 100 };
  }, [schedule]);

  const toggleTask = (dayId: string, taskId: string) => {
    setSchedule(prev => prev.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          tasks: day.tasks.map((t: any) => t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t)
        };
      }
      return day;
    }));
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayCircle className="w-5 h-5 text-indigo-400" />;
      case 'reading': return <BookOpen className="w-5 h-5 text-emerald-400" />;
      case 'live': return <Clock className="w-5 h-5 text-amber-400" />;
      default: return <BookOpen className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col p-6 lg:p-10 overflow-y-auto hide-scrollbar">
        {/* Header */}
        <header className="mb-8 text-start flex items-center justify-between">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-3"
            >
              <Calendar className="text-primary" /> Weekly Schedule
            </motion.h1>
            <p className="text-slate-500 dark:text-slate-400">Your tailored curriculum from Friday to Thursday.</p>
          </div>
        </header>

        {schedule.length === 0 ? (
          <EmptyState 
            title="No Schedule Yet"
            description="Your weekly schedule will appear here once your supervisor assigns your curriculum."
            icon="calendar"
          />
        ) : (
        <div className="flex flex-col lg:flex-row gap-8 h-full min-h-0">
          
          {/* Progress Tube Column */}
          <div className="hidden lg:flex flex-col items-center justify-center shrink-0 w-24 h-full pb-10">
             <div className="text-center mb-6">
                <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest block">Progress</span>
             </div>
             <div className="flex-1 max-h-[600px]">
               <ProgressTube percentage={progressStats.percentage} />
             </div>
          </div>

          {/* Accordion List Column */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-20">
            {schedule.map((day, idx) => {
              const isExpanded = expandedDay === day.id;
              const completedTasksCount = day.tasks.filter(t => t.isCompleted).length;
              const hasTasks = day.tasks.length > 0;
              const isAllDone = hasTasks && completedTasksCount === day.tasks.length;

              return (
                <motion.div
                  key={day.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-panel overflow-hidden transition-all duration-300"
                >
                  {/* Accordion Header */}
                  <button 
                    onClick={() => setExpandedDay(isExpanded ? null : day.id)}
                    className={`w-full flex items-center justify-between p-5 md:p-6 transition-colors hover:bg-white/5 ${isExpanded ? 'bg-white/5 border-b border-white/10' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border ${isAllDone ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-300 border-white/10'}`}>
                        {idx + 1}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-white">{day.dayEn} <span className="text-slate-500 font-normal">| {day.dayAr}</span></h3>
                          {isAllDone && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                        </div>
                        <p className="text-sm text-slate-400">{day.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {hasTasks ? (
                        <div className="hidden md:flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${(completedTasksCount / day.tasks.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 font-medium">{completedTasksCount}/{day.tasks.length}</span>
                        </div>
                      ) : (
                         <span className="text-xs text-slate-500 italic">Rest Day</span>
                      )}
                      <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Accordion Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-6 bg-black/20">
                          {hasTasks ? (
                            <div className="space-y-3">
                              {day.tasks.map((task, tIdx) => (
                                <motion.div 
                                  key={task.id}
                                  initial={{ x: -10, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: tIdx * 0.1 }}
                                  onClick={() => toggleTask(day.id, task.id)}
                                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5
                                    ${task.isCompleted 
                                      ? 'bg-emerald-500/10 border-emerald-500/20' 
                                      : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                                    }
                                  `}
                                >
                                  <div className="flex items-center gap-4">
                                    <button className="focus:outline-none shrink-0">
                                      {task.isCompleted ? (
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                      ) : (
                                        <Circle className="w-6 h-6 text-slate-500" />
                                      )}
                                    </button>
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 rounded-lg bg-slate-800">
                                        {getTaskIcon(task.type)}
                                      </div>
                                      <div>
                                        <h4 className={`font-semibold transition-colors ${task.isCompleted ? 'text-emerald-100 line-through opacity-70' : 'text-white'}`}>
                                          {task.title}
                                        </h4>
                                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                          <Clock className="w-3 h-3" /> {task.duration}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-slate-500 flex flex-col items-center">
                               <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                                 <Calendar className="w-8 h-8 text-slate-600" />
                               </div>
                               <p>No tasks scheduled for this day.</p>
                               <p className="text-sm">Take a rest or review past materials!</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
        )}
      </main>
    </div>
  );
}
