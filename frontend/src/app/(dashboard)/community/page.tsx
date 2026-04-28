"use client"

import Sidebar from '@/components/layout/Sidebar';
import { motion } from 'framer-motion';
import { Hash, Users, Send, Paperclip, Smile, MoreVertical, Search, Globe, UserCircle, BookOpen, Lock } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { DICTIONARY } from '@/locales/dictionary';
import { useState } from 'react';
import useSWR from 'swr';
import { fetcher, sendMessage } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { useUserRole } from '@/hooks/useUserRole';

// Tier Config
const TIER_CONFIG = {
  COMMUNITY: { icon: Globe, label: 'Global Academy', labelAr: 'غرفة الأكاديمية', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  AGE_GROUP: { icon: UserCircle, label: 'Age Group', labelAr: 'الفئة العمرية', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  COURSE: { icon: BookOpen, label: 'Course Room', labelAr: 'غرفة الدورة', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

const AGE_GROUP_LABELS: Record<string, { en: string; ar: string }> = {
  CHILDREN: { en: 'Children (6-10)', ar: 'أطفال (٦-١٠)' },
  TWEENS: { en: 'Tweens (11-12)', ar: 'البراعم الناضجة (١١-١٢)' },
  TEENS: { en: 'Young Adults (13-20)', ar: 'البالغون (١٣-٢٠)' },
};

export default function CommunityPage() {
  const { data: session } = useSession();
  const { isGuest } = useUserRole();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const t = DICTIONARY[locale as 'en' | 'ar']?.community || DICTIONARY.en.community;

  const { data: roomsData, error: roomsError } = useSWR('/community/', fetcher);
  const rooms = roomsData?.results || roomsData || [];
  const isLoadingRooms = !roomsData && !roomsError;

  // Group rooms by tier
  const globalRooms = rooms.filter((r: any) => r.room_type === 'COMMUNITY');
  const ageRooms = rooms.filter((r: any) => r.room_type === 'AGE_GROUP');
  const courseRooms = rooms.filter((r: any) => r.room_type === 'COURSE');

  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const currentRoomId = activeRoomId || (rooms.length > 0 ? rooms[0].id : null);

  const { data: messagesData, error: messagesError, mutate: mutateMessages } = useSWR(
    currentRoomId ? `/messages/?room_id=${currentRoomId}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );
  const messages = messagesData?.results || messagesData || [];
  const isLoadingMessages = !messagesData && !messagesError && currentRoomId;

  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentRoomId) return;
    setIsSending(true);
    try {
      await sendMessage(currentRoomId, newMessage);
      setNewMessage('');
      mutateMessages();
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setIsSending(false);
    }
  };

  // Guest block
  if (isGuest) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="glass-panel p-12 text-center max-w-md">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">{isAr ? 'الوصول مقيّد' : 'Access Restricted'}</h2>
            <p className="text-slate-400">{isAr ? 'المجتمع متاح فقط للطلاب والمعلمين المسجلين.' : 'Community is only available to registered students and teachers.'}</p>
          </div>
        </main>
      </div>
    );
  }

  const getRoomDisplayName = (room: any) => {
    if (room.room_type === 'COMMUNITY') return isAr ? 'غرفة الأكاديمية العامة' : 'Global Academy Room';
    if (room.room_type === 'AGE_GROUP') return AGE_GROUP_LABELS[room.age_group]?.[isAr ? 'ar' : 'en'] || room.age_group;
    if (room.room_type === 'COURSE') return room.course_title || (isAr ? 'غرفة الدورة' : 'Course Room');
    return room.study_group?.name || 'Group Chat';
  };

  // Render a tier section
  const renderTierSection = (title: string, tierRooms: any[], tierKey: keyof typeof TIER_CONFIG) => {
    const config = TIER_CONFIG[tierKey];
    const Icon = config.icon;
    if (tierRooms.length === 0 && !isLoadingRooms) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 px-2 mb-2">
          <div className={`p-1 rounded-md ${config.bg}`}><Icon size={12} className={config.color} /></div>
          <h3 className={`text-[10px] font-bold uppercase tracking-widest ${config.color}`}>{title}</h3>
        </div>
        <div className="space-y-1">
          {tierRooms.map((room: any) => {
            const isActive = currentRoomId === room.id;
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-start ${
                  isActive ? 'bg-primary/20 text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-primary' : ''} />
                <span className={`text-sm truncate ${isActive ? 'font-bold' : 'font-medium'}`}>{getRoomDisplayName(room)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col">
        <header className="mb-6 shrink-0">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{t.title}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t.subtitle}</p>
        </header>

        <div className="flex-1 min-h-0 flex gap-6">
          {/* Channels Sidebar */}
          <div className="hidden lg:flex w-1/4 flex-col gap-4">
            <div className="glass-panel p-4 flex-1 flex flex-col">
              <div className="relative mb-6">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder={t.search} className="w-full bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2 ps-10 pe-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div className="flex-1 overflow-y-auto hide-scrollbar">
                {isLoadingRooms ? (
                  <div className="animate-pulse space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />)}</div>
                ) : rooms.length > 0 ? (
                  <>
                    {renderTierSection(isAr ? 'المستوى ١ — عام' : 'TIER 1 — GLOBAL', globalRooms, 'COMMUNITY')}
                    {renderTierSection(isAr ? 'المستوى ٢ — الفئة العمرية' : 'TIER 2 — AGE GROUP', ageRooms, 'AGE_GROUP')}
                    {renderTierSection(isAr ? 'المستوى ٣ — الدورات' : 'TIER 3 — COURSES', courseRooms, 'COURSE')}
                  </>
                ) : (
                  <div className="text-center p-4 text-slate-500 text-sm">{isAr ? 'لا توجد غرف دردشة مخصصة لك حالياً.' : 'No chat rooms assigned to you yet.'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          {rooms.length === 0 && !isLoadingRooms ? (
            <div className="flex-1 flex flex-col items-center justify-center glass-panel p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-slate-800/30 dark:to-transparent z-0" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/80 rounded-full flex items-center justify-center mb-6 shadow-inner"><Hash className="w-10 h-10 text-slate-400" /></div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{isAr ? 'لا توجد مناقشات' : 'No active discussions'}</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">{isAr ? 'سيتم إنشاء الغرف تلقائياً عند التسجيل في دورة.' : 'Rooms will be created automatically when you enroll in a course.'}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col glass-panel overflow-hidden relative">
              <div className="h-16 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-6 shrink-0 bg-slate-50/50 dark:bg-white/5 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Users size={20} /></div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{currentRoomId ? getRoomDisplayName(rooms.find((r: any) => r.id === currentRoomId) || {}) : ''}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{isAr ? 'متصل' : 'Connected'}</p>
                  </div>
                </div>
                <button className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><MoreVertical size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar flex flex-col">
                <div className="text-center my-4"><span className="text-xs font-medium text-slate-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-900/50 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">{t.today}</span></div>
                {isLoadingMessages ? (
                  <div className="flex-1 flex justify-center items-center"><div className="animate-pulse flex space-x-4"><div className="rounded-full bg-slate-200 dark:bg-slate-700 h-10 w-10" /><div className="flex-1 space-y-6 py-1"><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-48" /></div></div></div>
                ) : messages.length > 0 ? (
                  messages.map((msg: any) => {
                    const isMe = session?.user?.email === msg.sender_details?.email;
                    return (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                        <div className="flex items-baseline gap-2 mb-1 px-1">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{isMe ? (isAr ? 'أنت' : 'You') : msg.sender_details?.full_name}</span>
                          <span className="text-xs text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className={`px-5 py-3 shadow-md ${isMe ? 'bg-primary text-white rounded-2xl rounded-se-sm' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-ss-sm border border-slate-200 dark:border-slate-700/50'}`}>
                          <p className="text-sm leading-relaxed"><bdi>{msg.content}</bdi></p>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                    <div className="w-24 h-24 mb-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center"><Hash size={40} className="text-slate-400" /></div>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{isAr ? 'ابدأ المحادثة' : 'Start the conversation'}</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50/80 dark:bg-white/5 backdrop-blur-md border-t border-slate-200 dark:border-white/10 shrink-0">
                <div className="flex items-end gap-3 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/50 rounded-2xl p-2 focus-within:border-primary/50 transition-colors shadow-inner">
                  <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors shrink-0"><Paperclip size={20} /></button>
                  <textarea rows={1} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={t.message} className="flex-1 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none resize-none max-h-32 min-h-[40px] py-2.5 hide-scrollbar" />
                  <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors shrink-0"><Smile size={20} /></button>
                  <button onClick={handleSend} disabled={isSending || !newMessage.trim() || !currentRoomId} className="p-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl transition-all shadow-lg shadow-primary/30 shrink-0"><Send size={18} className="ms-0.5" /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
