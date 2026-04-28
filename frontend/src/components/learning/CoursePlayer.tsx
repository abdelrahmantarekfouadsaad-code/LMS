"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, CheckCircle, Lock, ChevronDown, FileText } from 'lucide-react';

// Mock Data structure based on our Django Models
const MOCK_COURSE_DATA = {
  title: "Foundations of Fiqh",
  weeks: [
    {
      id: 1,
      week_number: 1,
      title: "Introduction to Purity (Taharah)",
      lessons: [
        { id: 101, title: "Types of Water", duration: "12:45", completed: true, locked: false },
        { id: 102, title: "Impure Substances", duration: "18:20", completed: false, locked: false, isCurrent: true },
        { id: 103, title: "How to perform Wudu", duration: "25:10", completed: false, locked: true },
      ]
    },
    {
      id: 2,
      week_number: 2,
      title: "The Rules of Prayer (Salah)",
      lessons: [
        { id: 201, title: "Prerequisites of Salah", duration: "15:00", completed: false, locked: true },
        { id: 202, title: "Pillars of Salah", duration: "20:00", completed: false, locked: true },
      ]
    }
  ]
};

export default function CoursePlayer() {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [activeLesson, setActiveLesson] = useState(MOCK_COURSE_DATA.weeks[0].lessons[1]);

  const toggleWeek = (weekId: number) => {
    setExpandedWeek(expandedWeek === weekId ? null : weekId);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 h-full max-h-screen overflow-hidden">
      
      {/* LEFT SIDE: Cinematic Video Player Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black group">
          {/* Mock Video Thumbnail / Placeholder */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 flex flex-col justify-end p-8">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{activeLesson.title}</h1>
            <p className="text-emerald-400 font-medium">{MOCK_COURSE_DATA.title}</p>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <button className="w-20 h-20 bg-white/20 hover:bg-primary/80 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110">
              <PlayCircle size={40} className="ms-2" />
            </button>
          </div>
          
          {/* Simulated Video Element */}
          <img 
            src="https://images.unsplash.com/photo-1590400874534-10657c91d848?q=80&w=2574&auto=format&fit=crop" 
            alt="Video Thumbnail" 
            className="w-full h-full object-cover opacity-60"
          />
        </div>

        {/* Video Controls / Progress Bar beneath video */}
        <div className="mt-6 glass-panel p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center text-sm font-medium text-slate-500 dark:text-slate-400">
            <span>04:15</span>
            <span>{activeLesson.duration}</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden cursor-pointer">
            <div className="h-full bg-primary w-1/3 rounded-full relative">
              <div className="absolute inset-inline-end-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md transform translate-x-1/2"></div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <button className="px-5 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Download Resources
            </button>
            <button className="px-6 py-2.5 rounded-xl font-semibold bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5">
              Mark as Complete
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Interactive Curriculum Accordion */}
      <div className="w-full lg:w-96 flex flex-col gap-4 overflow-y-auto pe-2 pb-20 lg:pb-0 hide-scrollbar">
        <h2 className="text-xl font-bold px-2 py-4 dark:text-white">Curriculum</h2>
        
        {MOCK_COURSE_DATA.weeks.map((week) => (
          <div key={week.id} className="glass-panel overflow-hidden">
            <button 
              onClick={() => toggleWeek(week.id)}
              className="w-full flex items-center justify-between p-5 bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex flex-col items-start">
                <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Week {week.week_number}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-start">{week.title}</span>
              </div>
              <motion.div animate={{ rotate: expandedWeek === week.id ? 180 : 0 }}>
                <ChevronDown className="text-slate-400" size={20} />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {expandedWeek === week.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="p-2 border-t border-white/10 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-900/30">
                    {week.lessons.map((lesson) => {
                      const isActive = activeLesson.id === lesson.id;
                      return (
                        <div 
                          key={lesson.id}
                          onClick={() => !lesson.locked && setActiveLesson(lesson)}
                          className={`
                            flex items-center gap-4 p-3 rounded-xl mb-1 cursor-pointer transition-all duration-200
                            ${isActive ? 'bg-white dark:bg-slate-800 shadow-sm border border-primary/20' : 'hover:bg-white/60 dark:hover:bg-slate-800/50'}
                            ${lesson.locked ? 'opacity-60 cursor-not-allowed grayscale' : ''}
                          `}
                        >
                          <div className="shrink-0">
                            {lesson.completed ? (
                              <CheckCircle className="text-primary" size={20} />
                            ) : lesson.locked ? (
                              <Lock className="text-slate-400" size={18} />
                            ) : (
                              <PlayCircle className={isActive ? 'text-primary' : 'text-slate-400'} size={20} />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate font-medium ${isActive ? 'text-primary dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                              {lesson.title}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <FileText size={12} /> Video • {lesson.duration}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
