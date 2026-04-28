"use client"

import Sidebar from '@/components/layout/Sidebar';
import { motion } from 'framer-motion';
import { LifeBuoy, Send, Clock, CheckCircle, FileText, ChevronRight } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { DICTIONARY } from '@/locales/dictionary';
import { useState } from 'react';
import useSWR from 'swr';
import { fetcher, submitTicket } from '@/lib/api';

export default function SupportPage() {
  const locale = useLocale();
  const t = DICTIONARY[locale as 'en' | 'ar']?.support || DICTIONARY.en.support;

  const { data: ticketsData, error, mutate } = useSWR('/support/', fetcher);
  const isLoading = !ticketsData && !error;
  const tickets = ticketsData?.results || ticketsData || [];

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Platform Access / Login Issues');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;
    setIsSubmitting(true);
    try {
      await submitTicket({ subject, category, description });
      setSubject('');
      setDescription('');
      mutate(); // Refresh tickets
    } catch (err) {
      console.error('Failed to submit ticket', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto hide-scrollbar">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{t.title}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t.subtitle}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Submit Ticket Form */}
          <div className="space-y-6">
            <div className="glass-panel p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <LifeBuoy className="text-primary" /> {t.openTicket}
              </h2>
              
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.subject}</label>
                  <input 
                    type="text" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t.subjectPlaceholder}
                    className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.category}</label>
                  <div className="relative">
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm appearance-none focus:outline-none focus:border-primary transition-colors cursor-pointer"
                    >
                      <option>Platform Access / Login Issues</option>
                      <option>Course Content Missing</option>
                      <option>Live Session Zoom Error</option>
                      <option>Payment / Billing</option>
                      <option>Other Technical Issue</option>
                    </select>
                    <div className="absolute inset-y-0 inset-inline-end-0 flex items-center px-4 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.desc}</label>
                  <textarea 
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.descPlaceholder}
                    className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  <Send size={18} /> {isSubmitting ? (locale === 'ar' ? 'جاري الإرسال...' : 'Submitting...') : t.submit}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Recent Tickets */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2 px-2">
              <FileText className="text-slate-400" /> {t.recent}
            </h2>
            
            <div className="space-y-4">
              {isLoading ? (
                <div className="animate-pulse space-y-4 w-full">
                  <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl w-full"></div>
                  <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl w-full"></div>
                </div>
              ) : tickets.length > 0 ? (
                tickets.map((ticket: any) => (
                  <motion.div key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`glass-panel p-5 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors border-s-4 ${ticket.status === 'Pending' ? 'border-s-amber-500' : 'border-s-emerald-500'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-500">#TK-{ticket.id.toString().padStart(4, '0')}</span>
                          <span className={`${ticket.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1`}>
                            {ticket.status === 'Resolved' && <CheckCircle size={10} />} 
                            {ticket.status === 'Pending' ? t.pending : t.resolved}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">{ticket.subject}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">{ticket.description}</p>
                      </div>
                      <ChevronRight className="text-slate-600 mt-2" size={20} />
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        {ticket.status === 'Resolved' ? <CheckCircle size={14} /> : <Clock size={14} />} 
                        {ticket.status === 'Resolved' ? t.closedOn : t.updated} {new Date(ticket.updated_at).toLocaleDateString()}
                      </span>
                      <span>{ticket.category}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="w-full flex flex-col items-center justify-center glass-panel rounded-2xl border border-white/10 dark:border-slate-800/50 p-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-slate-800/30 dark:to-transparent z-0"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/80 rounded-full flex items-center justify-center mb-4 shadow-inner">
                      <LifeBuoy className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No active tickets</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm leading-relaxed">
                      You have no active support tickets.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
