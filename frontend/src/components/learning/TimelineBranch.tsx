import React from 'react';
import { motion } from 'framer-motion';
import { Award, FileText, GitBranch, MessageSquare, Video, CheckCircle } from 'lucide-react';

const MILESTONE_CONFIG: Record<string, { icon: React.ElementType; color: string; gradient: string }> = {
  ACHIEVEMENT: { icon: Award, color: 'text-amber-400', gradient: 'from-amber-500/10 to-orange-500/20' },
  ASSESSMENT: { icon: FileText, color: 'text-purple-400', gradient: 'from-purple-500/10 to-pink-500/20' },
  CHECKPOINT: { icon: GitBranch, color: 'text-emerald-400', gradient: 'from-emerald-500/10 to-teal-500/20' },
  NOTE: { icon: MessageSquare, color: 'text-blue-400', gradient: 'from-blue-500/10 to-indigo-500/20' },
  VIRTUAL_SESSION: { icon: Video, color: 'text-blue-400', gradient: 'from-blue-500/10 to-cyan-500/20' }
};

export default function TimelineBranch({ milestone, index, isAr, isTeacher, onStartSession }: { milestone: any; index: number; isAr: boolean; isTeacher?: boolean; onStartSession?: (id: string) => void }) {
  const isLeft = index % 2 === 0;
  const config = MILESTONE_CONFIG[milestone.milestone_type] || MILESTONE_CONFIG.CHECKPOINT;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.12, type: "spring", stiffness: 100 }}
      className={`flex items-center gap-0 ${isLeft ? 'flex-row' : 'flex-row-reverse'} relative`}
    >
      {/* Branch Card */}
      <div className={`w-[calc(50%-28px)] ${isLeft ? 'text-end' : 'text-start'}`}>
        <motion.div
          whileHover={{ scale: 1.03, y: -2 }}
          className={`glass-panel p-5 bg-gradient-to-br ${config.gradient} border border-white/10 relative overflow-hidden group cursor-default`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className={`flex items-center gap-2 mb-2 ${isLeft ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>
                {milestone.milestone_type === 'VIRTUAL_SESSION' ? (isAr ? 'جلسة افتراضية' : 'Virtual Session') : milestone.milestone_type}
              </span>
              {milestone.is_completed && (
                <CheckCircle size={14} className="text-emerald-400" />
              )}
            </div>
            <h4 className="text-base font-bold text-white mb-1">{milestone.title}</h4>
            {milestone.description && (
              <p className="text-sm text-slate-400 line-clamp-2">{milestone.description}</p>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span>{new Date(milestone.milestone_date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' })}</span>
              {milestone.created_by_name && <span>• {milestone.created_by_name}</span>}
            </div>
            
            {milestone.milestone_type === 'VIRTUAL_SESSION' && (
              <div className={`mt-4 flex ${isLeft ? 'justify-end' : 'justify-start'}`}>
                {isTeacher && onStartSession ? (
                  <button onClick={() => onStartSession(milestone.id.replace('virtual-', ''))} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-emerald-500/20">
                    <Video size={16} />
                    {isAr ? 'فتح الغرفة' : 'Start Room'}
                  </button>
                ) : milestone.meeting_link ? (
                  <a href={milestone.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-blue-500/20">
                    <Video size={16} />
                    {isAr ? 'انضمام' : 'Join Session'}
                  </a>
                ) : (
                  <div className="px-4 py-2 bg-slate-800 text-slate-500 rounded-lg text-center font-medium text-sm cursor-not-allowed">
                    {isAr ? 'الرابط غير متوفر بعد' : 'Link not available yet'}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Branch Connector */}
      <div className="relative flex items-center justify-center w-14 shrink-0 z-10">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.12 + 0.2 }}
          className={`absolute h-0.5 w-5 bg-gradient-to-e ${isLeft ? 'end-7 from-transparent to-white/30' : 'start-7 from-white/30 to-transparent'}`}
          style={{ originX: isLeft ? 1 : 0 }}
        />
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: index * 0.12 + 0.3, type: "spring", stiffness: 200 }}
          className={`w-10 h-10 rounded-full bg-slate-900/80 border-2 ${milestone.is_completed ? 'border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]' : 'border-white/20'} flex items-center justify-center backdrop-blur-md`}
        >
          <Icon size={18} className={config.color} />
        </motion.div>
      </div>

      {/* Spacer for the other side */}
      <div className="w-[calc(50%-28px)]" />
    </motion.div>
  );
}
