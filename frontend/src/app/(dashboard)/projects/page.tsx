"use client"

import React, { useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import EmptyState from '@/components/ui/EmptyState';
import { Loader2, FolderOpen, ExternalLink, Send, X, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import { useLocale } from '@/hooks/useLocale';

const fetcher = (url: string, token: string) => fetch(url, {
  headers: { Authorization: `Bearer ${token}` }
}).then(res => res.json());

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [driveLink, setDriveLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const { data: projects, error, isLoading } = useSWR(
    session?.accessToken ? ['http://localhost:8000/api/projects/', session.accessToken] : null,
    ([url, token]) => fetcher(url, token)
  );

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveLink || !selectedProject || !session?.accessToken) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/project-submissions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          project: selectedProject.id,
          drive_link: driveLink
        })
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setSelectedProject(null);
          setSubmitSuccess(false);
          setDriveLink('');
        }, 2000);
      } else {
        alert('Failed to submit project.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          Failed to load projects. Please try again later.
        </div>
      </div>
    );
  }

  const hasProjects = projects && projects.length > 0;

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 hide-scrollbar">
        <header className="mb-8">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-3"
          >
            <Briefcase className="text-indigo-500" /> Projects & Assignments
          </motion.h1>
          <p className="text-slate-500 dark:text-slate-400">Complete projects to practice your skills and build your portfolio.</p>
        </header>

      {!hasProjects ? (
        <EmptyState 
          title="No Active Projects"
          description="You don't have any pending projects at the moment. Take a break!"
          icon="folder"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any, idx: number) => (
            <motion.div 
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedProject(project)}
              className="glass-panel p-6 rounded-2xl flex flex-col group hover:border-primary/50 transition-all cursor-pointer overflow-hidden relative"
            >
              {project.image && (
                <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity">
                  <img src={project.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4">
                  <FolderOpen size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{project.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-3">{project.description}</p>
                
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm">
                  {project.due_date ? (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">Due: {new Date(project.due_date).toLocaleDateString()}</span>
                  ) : (
                    <span className="text-slate-400">No due date</span>
                  )}
                  <span className="text-primary font-medium flex items-center group-hover:translate-x-1 transition-transform">
                    View Details <ExternalLink size={16} className="ml-1" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Submission Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Submit Project</h2>
                <button onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-2">{selectedProject.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{selectedProject.description}</p>
                
                {submitSuccess ? (
                  <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl flex items-center border border-emerald-200">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                      <Send size={16} />
                    </div>
                    Project submitted successfully!
                  </div>
                ) : (
                  <form onSubmit={handleSubmitProject} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Google Drive Link
                      </label>
                      <input
                        type="url"
                        required
                        value={driveLink}
                        onChange={(e) => setDriveLink(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all sm:text-sm"
                      />
                      <p className="mt-2 text-xs text-slate-500">Make sure the link permissions are set to "Anyone with the link can view".</p>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting || !driveLink}
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />}
                      {isSubmitting ? 'Submitting...' : 'Submit Link'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}
