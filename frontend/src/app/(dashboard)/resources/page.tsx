"use client"

import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Download, FileText, Video, ChevronDown, Search, File } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';

const FILE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  pdf: { icon: FileText, color: 'text-red-400' },
  doc: { icon: FileText, color: 'text-blue-400' },
  mp4: { icon: Video, color: 'text-purple-400' },
  default: { icon: File, color: 'text-slate-400' },
};

function getFileType(url: string) {
  const ext = url?.split('.').pop()?.toLowerCase() || '';
  return FILE_ICONS[ext] || FILE_ICONS.default;
}

export default function ResourcesPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const { data: resourcesData, error, isLoading } = useSWR('/resources/', fetcher);
  const resources = resourcesData?.results || resourcesData || [];

  // Group by course
  const grouped = resources.reduce((acc: Record<string, any[]>, res: any) => {
    const key = res.course?.toString() || 'general';
    if (!acc[key]) acc[key] = [];
    acc[key].push(res);
    return acc;
  }, {});

  const courseKeys = Object.keys(grouped);
  const filteredKeys = courseKeys.filter(key =>
    !searchQuery || grouped[key].some((r: any) => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleCourse = (key: string) => {
    setExpandedCourse(expandedCourse === key ? null : key);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto hide-scrollbar">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{isAr ? 'المصادر والتسجيلات' : 'Resources & Recordings'}</h1>
          <p className="text-slate-500 dark:text-slate-400">{isAr ? 'الوصول إلى ملفات PDF والتسجيلات المرئية لدوراتك.' : 'Access PDFs and session recordings for your courses.'}</p>
        </header>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isAr ? 'بحث في المصادر...' : 'Search resources...'} className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl py-3 ps-12 pe-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-colors shadow-sm" />
        </div>

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />)}</div>
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center glass-panel p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6"><FolderOpen className="w-10 h-10 text-slate-400" /></div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{isAr ? 'لا توجد مصادر' : 'No Resources'}</h3>
            <p className="text-slate-500 max-w-md">{isAr ? 'لم يتم تحميل أي مصادر لدوراتك بعد.' : 'No resources have been uploaded for your courses yet.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredKeys.map((courseKey, idx) => {
              const courseResources = grouped[courseKey].filter((r: any) => !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()));
              const isOpen = expandedCourse === courseKey || filteredKeys.length === 1;
              const courseLabel = courseKey === 'general' ? (isAr ? 'مصادر عامة' : 'General Resources') : `${isAr ? 'الدورة' : 'Course'} #${courseKey}`;

              return (
                <motion.div key={courseKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <button onClick={() => toggleCourse(courseKey)} className="w-full glass-panel p-5 flex items-center justify-between hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl"><FolderOpen size={20} className="text-primary" /></div>
                      <div className="text-start">
                        <h3 className="font-bold text-slate-900 dark:text-white">{courseLabel}</h3>
                        <p className="text-xs text-slate-500">{courseResources.length} {isAr ? 'ملف' : 'files'}</p>
                      </div>
                    </div>
                    <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                        <div className="p-4 space-y-2 ms-4 border-s-2 border-primary/20">
                          {courseResources.map((resource: any) => {
                            const fileType = getFileType(resource.file_attachment);
                            const FileIcon = fileType.icon;
                            return (
                              <div key={resource.id} className="flex items-center justify-between p-4 glass-panel hover:bg-white/80 dark:hover:bg-white/10 transition-colors group">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 bg-slate-100 dark:bg-slate-800 rounded-lg ${fileType.color}`}><FileIcon size={20} /></div>
                                  <div>
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{resource.title}</h4>
                                    <p className="text-xs text-slate-500">{new Date(resource.created_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <a href={resource.file_attachment} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                  <Download size={18} />
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
