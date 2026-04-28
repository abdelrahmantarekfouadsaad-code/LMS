"use client"

import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Smile, Search, MoreVertical, Phone, VideoIcon, ArrowLeft, MessageSquare, CheckCheck } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { DICTIONARY } from '@/locales/dictionary';
import useSWR from 'swr';
import { fetcher, sendMessage } from '@/lib/api';
import { useSession } from 'next-auth/react';



export default function PrivateChatPage() {
  const { data: session } = useSession();
  const locale = useLocale();
  const isAr = locale === 'ar';

  // Fetch private chat rooms
  const { data: roomsData, error: roomsError } = useSWR('/community/', fetcher);
  const allRooms = roomsData?.results || roomsData || [];
  const privateRooms = allRooms.filter((r: any) => r.room_type === 'PRIVATE');
  const isLoadingRooms = !roomsData && !roomsError;

  const conversations = privateRooms;

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentRoomId = selectedRoom || conversations[0]?.id;

  const { data: messagesData, mutate: mutateMessages } = useSWR(
    currentRoomId && privateRooms.length > 0 ? `/messages/?room_id=${currentRoomId}` : null,
    fetcher,
    { refreshInterval: 3000 }
  );

  const messages = (messagesData?.results || messagesData || []);
  const displayMessages = messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentRoomId) return;
    setIsSending(true);
    try {
      if (privateRooms.length > 0) {
        await sendMessage(currentRoomId, newMessage);
        mutateMessages();
      }
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send', err);
    } finally {
      setIsSending(false);
    }
  };

  const getOtherParticipant = (conv: any) => {
    const myName = session?.user?.name || session?.user?.email || '';
    const names = conv.participant_names || [];
    return names.find((n: string) => n !== myName) || names[0] || 'Teacher';
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const filteredConversations = conversations.filter((c: any) => {
    if (!searchQuery) return true;
    const otherName = getOtherParticipant(c);
    return otherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (c.course_title || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedConv = conversations.find((c: any) => c.id === currentRoomId);
  const otherName = selectedConv ? getOtherParticipant(selectedConv) : '';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
        <header className="mb-4 shrink-0">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">{isAr ? 'الشات الخاص' : 'Private Chat'}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{isAr ? 'تواصل مع معلميك مباشرة' : 'Connect directly with your teachers'}</p>
        </header>

        <div className="flex-1 min-h-0 flex gap-4">
          {/* === LEFT: Conversation List === */}
          <div className={`w-full lg:w-[340px] shrink-0 flex flex-col glass-panel overflow-hidden ${showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
            {/* Search */}
            <div className="p-4 border-b border-slate-200 dark:border-white/10">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث في المحادثات...' : 'Search conversations...'}
                  className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl py-2.5 ps-10 pe-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto hide-scrollbar">
              {isLoadingRooms ? (
                <div className="p-4 space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="flex-1 space-y-2"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" /><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" /></div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conv: any) => {
                  const name = getOtherParticipant(conv);
                  const isActive = conv.id === currentRoomId;
                  const colors = ['from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600'];
                  const colorIdx = (conv.id?.charCodeAt?.(0) || 0) % colors.length;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => { setSelectedRoom(conv.id); setShowMobileChat(true); }}
                      className={`w-full flex items-center gap-3 p-4 text-start transition-all duration-200 border-b border-slate-100 dark:border-white/5 ${
                        isActive ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md`}>
                        {getInitial(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">{name}</span>
                          <span className="text-[11px] text-slate-400 shrink-0 ms-2">{conv.lastTime || ''}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-500 truncate">{conv.course_title || conv.lastMessage || ''}</p>
                          {conv.unread > 0 && (
                            <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 ms-2">{conv.unread}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <MessageSquare size={40} className="text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-sm text-slate-500">{isAr ? 'لا توجد محادثات بعد' : 'No conversations yet'}</p>
                  <p className="text-xs text-slate-400 mt-1">{isAr ? 'سيتم إنشاء محادثة تلقائياً عند التسجيل في دورة' : 'A chat will be created automatically when you enroll in a course'}</p>
                </div>
              )}
            </div>
          </div>

          {/* === RIGHT: Chat Window === */}
          <div className={`flex-1 flex flex-col glass-panel overflow-hidden ${!showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
            {currentRoomId ? (
              <>
                {/* Chat Header */}
                <div className="h-16 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-5 shrink-0 bg-white/50 dark:bg-white/5 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowMobileChat(false)} className="lg:hidden p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                      <ArrowLeft size={20} />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-bold shadow-md">
                      {getInitial(otherName)}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">{otherName}</h2>
                      <p className="text-xs text-emerald-500 font-medium">{selectedConv?.course_title || (isAr ? 'معلم الدورة' : 'Course Teacher')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"><Phone size={18} /></button>
                    <button className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"><VideoIcon size={18} /></button>
                    <button className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"><MoreVertical size={18} /></button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar bg-gradient-to-b from-slate-50/50 to-white/0 dark:from-slate-900/20 dark:to-transparent">
                  <div className="text-center my-4">
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-900/50 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">{isAr ? 'اليوم' : 'Today'}</span>
                  </div>
                  {displayMessages.map((msg: any) => {
                    const isMe = session?.user?.email === msg.sender_details?.email;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] ${isMe ? 'order-1' : ''}`}>
                          <div className={`px-4 py-3 shadow-sm ${
                            isMe
                              ? 'bg-primary text-white rounded-2xl rounded-se-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-ss-sm border border-slate-200 dark:border-slate-700/50'
                          }`}>
                            <p className="text-sm leading-relaxed"><bdi>{msg.content}</bdi></p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] text-slate-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && <CheckCheck size={12} className="text-blue-400" />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white/80 dark:bg-white/5 backdrop-blur-md border-t border-slate-200 dark:border-white/10 shrink-0">
                  <div className="flex items-end gap-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-2 focus-within:border-primary/50 transition-colors shadow-inner">
                    <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors shrink-0"><Paperclip size={20} /></button>
                    <textarea
                      rows={1}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={isAr ? 'اكتب رسالة...' : 'Type a message...'}
                      className="flex-1 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none resize-none max-h-32 min-h-[40px] py-2.5 hide-scrollbar"
                    />
                    <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors shrink-0"><Smile size={20} /></button>
                    <button
                      onClick={handleSend}
                      disabled={isSending || !newMessage.trim()}
                      className="p-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl transition-all shadow-lg shadow-primary/30 shrink-0"
                    >
                      <Send size={18} className="ms-0.5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <MessageSquare size={32} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{isAr ? 'اختر محادثة' : 'Select a conversation'}</h3>
                <p className="text-sm text-slate-500">{isAr ? 'اختر محادثة من القائمة للبدء' : 'Choose a conversation from the list to start chatting'}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
