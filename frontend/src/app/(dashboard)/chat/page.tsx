"use client";

import React, { useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import Sidebar from '@/components/layout/Sidebar';
import { Search, MoreVertical, Phone, Video, Send, Paperclip, Smile } from 'lucide-react';

const DUMMY_CONTACTS = [
  { id: 1, name: 'Dr. Ahmed Khaled', avatar: 'https://i.pravatar.cc/150?u=1', status: 'online', lastMessage: 'See you in the next session!', time: '10:30 AM', unread: 2 },
  { id: 2, name: 'Support Team', avatar: 'https://i.pravatar.cc/150?u=2', status: 'offline', lastMessage: 'Your issue has been resolved.', time: 'Yesterday', unread: 0 },
  { id: 3, name: 'Study Group A', avatar: 'https://i.pravatar.cc/150?u=3', status: 'online', lastMessage: 'Has anyone finished the assignment?', time: 'Tuesday', unread: 5 },
];

const DUMMY_MESSAGES = [
  { id: 1, senderId: 1, text: 'Hello! How are you progressing with the course?', time: '10:00 AM', isMe: false },
  { id: 2, senderId: 'me', text: 'Hi Dr. Ahmed! Im doing well, just finished module 2.', time: '10:15 AM', isMe: true },
  { id: 3, senderId: 1, text: 'Excellent! See you in the next session!', time: '10:30 AM', isMe: false },
];

export default function ChatPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [activeContact, setActiveContact] = useState(DUMMY_CONTACTS[0]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(DUMMY_MESSAGES);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setMessages([...messages, {
      id: Date.now(),
      senderId: 'me',
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    }]);
    setMessage('');
  };

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden relative">
        <div className="flex-1 flex overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-slate-900/50 backdrop-blur-xl">
          
          {/* Left Sidebar - Contacts List */}
          <div className="w-full md:w-80 lg:w-96 border-r border-white/10 flex flex-col bg-slate-900/80">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">
                {isAr ? 'المحادثات' : 'Chats'}
              </h2>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={isAr ? 'البحث عن جهة اتصال...' : 'Search contacts...'}
                  className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 px-4 pl-10 text-white placeholder-slate-400 focus:outline-none focus:border-primary transition-colors"
                />
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-2">
              {DUMMY_CONTACTS.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setActiveContact(contact)}
                  className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${activeContact.id === contact.id ? 'bg-primary/20 border border-primary/30' : 'hover:bg-white/5 border border-transparent'}`}
                >
                  <div className="relative">
                    <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover" />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${contact.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                  </div>
                  <div className="flex-1 text-start overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-white truncate">{contact.name}</h3>
                      <span className="text-xs text-slate-400 whitespace-nowrap">{contact.time}</span>
                    </div>
                    <p className="text-sm text-slate-400 truncate">{contact.lastMessage}</p>
                  </div>
                  {contact.unread > 0 && (
                    <span className="w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">
                      {contact.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right Area - Messaging Pane */}
          <div className="flex-1 flex-col bg-slate-900/40 relative hidden md:flex">
            {/* Chat Header */}
            <div className="h-20 px-6 border-b border-white/10 flex items-center justify-between bg-slate-900/60 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <img src={activeContact.avatar} alt={activeContact.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h3 className="font-bold text-white">{activeContact.name}</h3>
                  <p className="text-xs text-emerald-400">{activeContact.status === 'online' ? (isAr ? 'متصل' : 'Online') : (isAr ? 'غير متصل' : 'Offline')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <button className="hover:text-white transition-colors"><Phone className="w-5 h-5" /></button>
                <button className="hover:text-white transition-colors"><Video className="w-5 h-5" /></button>
                <button className="hover:text-white transition-colors"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[70%] ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                    {!msg.isMe && (
                      <img src={activeContact.avatar} alt="avatar" className="w-8 h-8 rounded-full shrink-0" />
                    )}
                    <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`p-4 rounded-2xl ${msg.isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm'}`}>
                        <p>{msg.text}</p>
                      </div>
                      <span className="text-xs text-slate-500 mt-1">{msg.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900/80 border-t border-white/10 backdrop-blur-md">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <button type="button" className="p-3 text-slate-400 hover:text-white transition-colors">
                  <Smile className="w-6 h-6" />
                </button>
                <button type="button" className="p-3 text-slate-400 hover:text-white transition-colors">
                  <Paperclip className="w-6 h-6" />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isAr ? 'اكتب رسالة...' : 'Type a message...'}
                  className="flex-1 bg-slate-800 border border-white/10 rounded-full py-3 px-6 text-white focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="p-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary rounded-full text-white transition-colors flex items-center justify-center shrink-0"
                >
                  <Send className={`w-5 h-5 ${isAr ? 'rotate-180 -ml-1' : 'ml-1'}`} />
                </button>
              </form>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
