"use client"

import React, { useState, useRef } from 'react';
import { Paperclip, Mic, Send, X, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string, attachmentUrl?: string, voiceNoteUrl?: string) => void;
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!text.trim() && !attachedFile) return;

    let attachmentUrl = undefined;

    // Simulate REST upload logic for files
    if (attachedFile) {
      setIsUploading(true);
      // In production, send formData to REST endpoint and get S3 URL back
      await new Promise(resolve => setTimeout(resolve, 1000));
      attachmentUrl = URL.createObjectURL(attachedFile); // Mock URL
      setIsUploading(false);
      setAttachedFile(null);
    }

    onSendMessage(text, attachmentUrl, undefined);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md relative">
      
      {/* File Attachment Preview */}
      {attachedFile && (
        <div className="absolute -top-12 start-4 bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 flex items-center gap-2">
          <Paperclip size={14} className="text-primary" />
          <span className="text-xs font-medium truncate max-w-[150px]">{attachedFile.name}</span>
          <button onClick={() => setAttachedFile(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
            <X size={14} className="text-slate-500" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-3">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors shrink-0"
        >
          <Paperclip size={22} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={(e) => e.target.files && setAttachedFile(e.target.files[0])}
        />

        <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm flex items-center px-4">
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 h-[48px] max-h-[120px] text-sm text-slate-800 dark:text-slate-200 hide-scrollbar"
            rows={1}
          />
        </div>

        <button 
          className="p-3 text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors shrink-0"
        >
          <Mic size={22} />
        </button>

        <button 
          onClick={handleSend}
          disabled={(!text.trim() && !attachedFile) || isUploading}
          className="p-3 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
        >
          {isUploading ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} className="ms-1" />}
        </button>
      </div>
    </div>
  );
}
