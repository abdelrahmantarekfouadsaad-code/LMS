"use client"

import React, { useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { Loader2 } from 'lucide-react';

interface ChatWindowProps {
  roomType: 'complaints' | 'homework' | 'community';
  roomId?: string; // used for homework/community specific routes
  currentUser: string; // e.g., "Ahmed Student"
}

export default function ChatWindow({ roomType, roomId, currentUser }: ChatWindowProps) {
  const wsUrl = `ws://127.0.0.1:8000/ws/chat/${roomType}/${roomId ? roomId + '/' : ''}`;
  const { messages, isConnected, sendMessage } = useWebSocket(wsUrl);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string, attachmentUrl?: string, voiceNoteUrl?: string) => {
    sendMessage({
      message: content,
      attachment_url: attachmentUrl,
      voice_note_url: voiceNoteUrl,
      sender: currentUser,
    });
  };

  return (
    <div className="flex flex-col h-full w-full glass-panel overflow-hidden border-0 rounded-2xl shadow-2xl">
      
      {/* Header */}
      <div className="glass-header px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white capitalize">
            {roomType} Chat
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-primary' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-primary' : 'bg-red-500'}`}></span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {isConnected ? 'Connected securely' : 'Reconnecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/30 hide-scrollbar">
        {!isConnected && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="animate-spin mb-4 text-primary" size={32} />
            <p>Connecting to {roomType} server...</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <MessageBubble 
            key={idx}
            message={msg.message || ''}
            sender={msg.sender || 'Unknown'}
            isOwnMessage={msg.sender === currentUser}
            attachmentUrl={msg.attachment_url}
            voiceNoteUrl={msg.voice_note_url}
          />
        ))}
        
        {/* Invisible anchor for scrolling */}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <ChatInput onSendMessage={handleSendMessage} />
      
    </div>
  );
}
