"use client"


import { motion } from 'framer-motion';
import { Video, Clock, User, Timer, CheckCircle, CalendarClock } from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { useState, useEffect } from 'react';

function getSessionStatus(scheduledTime: string) {
  const now = new Date();
  const start = new Date(scheduledTime);
  const diffMin = (start.getTime() - now.getTime()) / 60000;
  // Assume 60 min duration
  const endTime = new Date(start.getTime() + 60 * 60000);

  if (now >= start && now <= endTime) return 'live';
  if (diffMin > 0 && diffMin <= 15) return 'starting';
  if (diffMin > 15) return 'upcoming';
  return 'ended';
}

const STATUS_CONFIG = {
  live: { label: 'Live Now', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', dot: true },
  starting: { label: 'Starting Soon', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: false },
  upcoming: { label: 'Upcoming', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', dot: false },
  ended: { label: 'Completed', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', dot: false },
};

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft(''); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);
  if (!timeLeft) return null;
  return <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Timer size={10} />{timeLeft}</span>;
}

export default function TeacherSessionsPage() {
  const { data: sessionsData, error, isLoading } = useSWR('/sessions/', fetcher, { errorRetryCount: 2, shouldRetryOnError: false });
  const sessions = Array.isArray(sessionsData?.results) ? sessionsData.results : (Array.isArray(sessionsData) ? sessionsData : []);

  return (
    <div className="p-6 h-full overflow-y-auto">
        <header className="mb-8 text-start">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Virtual Sessions</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage and start your live sessions</p>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>
        ) : sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(sessions || []).map((session: any, idx: number) => {
              const status = getSessionStatus(session.scheduled_time);
              const config = STATUS_CONFIG[status];
              
              // We consider teacher can start slightly earlier, but we just use meeting_link
              const meetingLink = session.meeting_link || session.zoom_join_url || '#';

              return (
                <motion.div key={session.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className={`glass-panel p-6 relative overflow-hidden group border ${config.border}`}>
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${config.bg} ${config.color} flex items-center gap-1.5`}>
                      {config.dot && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                      {config.label}
                    </span>
                    {status === 'upcoming' && <CountdownTimer targetDate={session.scheduled_time} />}
                    {status === 'ended' && <CheckCircle size={16} className="text-slate-400" />}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{session.title}</h3>
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 font-medium mb-6">
                    <div className="flex items-center gap-2"><CalendarClock size={16} className="text-slate-400" /> {new Date(session.scheduled_time).toLocaleString()}</div>
                  </div>

                  {status !== 'ended' ? (
                    <a href={meetingLink} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-primary hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:shadow-[0_0_25px_rgba(16,185,129,0.7)]">
                      <Video size={18} /> Start / Join Session
                    </a>
                  ) : (
                    <button disabled className="w-full py-3 bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                      <CheckCircle size={18} /> Session Ended
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="w-full h-[60vh] flex flex-col items-center justify-center glass-panel p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-slate-800/30 dark:to-transparent z-0" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/80 rounded-full flex items-center justify-center mb-6 shadow-inner"><Video className="w-10 h-10 text-slate-400" /></div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No Sessions</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">You have no upcoming virtual sessions scheduled.</p>
            </div>
          </div>
        )}
    </div>
  );
}
