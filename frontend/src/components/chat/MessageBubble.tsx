"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { File, Mic } from 'lucide-react';

interface MessageBubbleProps {
  message: string;
  sender: string;
  isOwnMessage: boolean;
  attachmentUrl?: string;
  voiceNoteUrl?: string;
}

export default function MessageBubble({ message, sender, isOwnMessage, attachmentUrl, voiceNoteUrl }: MessageBubbleProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex flex-col mb-4 ${isOwnMessage ? 'items-end' : 'items-start'}`}
    >
      <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 px-1">
        {isOwnMessage ? 'You' : sender}
      </span>
      
      <div className={`
        ${isOwnMessage ? 'chat-bubble-sent' : 'chat-bubble-received'}
        flex flex-col gap-2 shadow-md backdrop-blur-sm
      `}>
        
        {/* Render text content if available */}
        {message && <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>}

        {/* Render Audio Player for Voice Notes */}
        {voiceNoteUrl && (
          <div className="flex items-center gap-2 mt-1 bg-white/20 dark:bg-black/20 p-2 rounded-lg">
            <Mic size={18} className={isOwnMessage ? 'text-white' : 'text-primary'} />
            <audio controls className="h-8 w-48 custom-audio-player">
              <source src={voiceNoteUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Render File Attachment Link */}
        {attachmentUrl && (
          <a 
            href={attachmentUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 mt-1 bg-white/20 dark:bg-black/20 p-2 rounded-lg hover:bg-white/30 transition-colors"
          >
            <File size={18} className={isOwnMessage ? 'text-white' : 'text-primary'} />
            <span className="text-sm underline underline-offset-2">Attached File</span>
          </a>
        )}
      </div>
    </motion.div>
  );
}
