import React from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, FileText, Calendar, MessageSquare, Award, CreditCard, LayoutDashboard } from 'lucide-react';

type IconType = 'folder' | 'file' | 'calendar' | 'message' | 'award' | 'payment' | 'dashboard';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: IconType;
}

const getIcon = (type: IconType) => {
  switch (type) {
    case 'folder': return <FolderOpen size={48} className="text-primary opacity-80" />;
    case 'file': return <FileText size={48} className="text-primary opacity-80" />;
    case 'calendar': return <Calendar size={48} className="text-primary opacity-80" />;
    case 'message': return <MessageSquare size={48} className="text-primary opacity-80" />;
    case 'award': return <Award size={48} className="text-primary opacity-80" />;
    case 'payment': return <CreditCard size={48} className="text-primary opacity-80" />;
    case 'dashboard':
    default:
      return <LayoutDashboard size={48} className="text-primary opacity-80" />;
  }
};

export default function EmptyState({ title, description, icon = 'dashboard' }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 text-center w-full h-full min-h-[400px] glass-panel rounded-2xl"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
        <div className="relative bg-white/10 dark:bg-slate-800/50 p-6 rounded-full ring-1 ring-white/20 dark:ring-slate-700 backdrop-blur-sm">
          {getIcon(icon)}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
