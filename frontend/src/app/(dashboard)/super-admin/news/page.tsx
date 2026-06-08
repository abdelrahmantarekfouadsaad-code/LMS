"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { fetcher as apiFetcher } from '@/lib/api';
import api from '@/lib/axios';
import { Loader2, Plus, Trash2, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';
import Toast, { ToastType } from '@/components/ui/Toast';

export default function SuperAdminNewsPage() {
  const { data: session } = useSession();
  const [newUrl, setNewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{message: string, type: ToastType, isVisible: boolean}>({
    message: '',
    type: 'success',
    isVisible: false
  });

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  };

  const { data: announcementsData, mutate, isLoading } = useSWR(
    session?.accessToken ? '/announcements/' : null,
    apiFetcher
  );

  const announcements = Array.isArray(announcementsData?.results) ? announcementsData.results : (Array.isArray(announcementsData) ? announcementsData : []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    try {
      setIsSubmitting(true);
      await api.post('/announcements/', { image_url: newUrl, is_active: true });
      showToast('Announcement added successfully', 'success');
      setNewUrl('');
      mutate();
    } catch (error) {
      showToast('Failed to add announcement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await api.patch(`/announcements/${id}/`, { is_active: !currentStatus });
      showToast('Status updated', 'success');
      mutate();
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}/`);
      showToast('Announcement deleted', 'success');
      mutate();
    } catch (error) {
      showToast('Failed to delete announcement', 'error');
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 bg-background-light dark:bg-background-dark min-h-full">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">News & Announcements</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage the dynamic hero slider images shown on the student dashboard.</p>
      </div>

      <div className="glass-panel p-6 bg-slate-900/50 border border-white/10 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          Add New Announcement
        </h2>
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Enter image URL (e.g. from Postimages)..."
            required
            className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newUrl}
            className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Add
          </button>
        </form>
      </div>

      <div className="glass-panel p-6 bg-slate-900/50 border border-white/10 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6">Current Announcements</h2>
        
        {isLoading ? (
          <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : announcements.length === 0 ? (
          <div className="text-center p-10 text-slate-500">No announcements found. Add one above.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {announcements.map((ann: any) => (
              <div key={ann.id} className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden group">
                <div className="h-48 relative bg-black/50">
                  <img
                    src={ann.image_url}
                    alt="Announcement"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2364748b">Invalid URL</text></svg>';
                    }}
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => handleToggleActive(ann.id, ann.is_active)}
                      title={ann.is_active ? "Deactivate" : "Activate"}
                      className={`p-2 rounded-lg backdrop-blur-md border border-white/10 shadow-lg transition-all ${
                        ann.is_active ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40' : 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/40'
                      }`}
                    >
                      {ann.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      title="Delete"
                      className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg backdrop-blur-md border border-white/10 shadow-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-slate-800/80 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono truncate max-w-[200px]" title={ann.image_url}>
                    {ann.image_url}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${ann.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                    {ann.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({...prev, isVisible: false}))} 
      />
    </div>
  );
}
