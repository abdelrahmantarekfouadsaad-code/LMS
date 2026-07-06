"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Video, AlertCircle, Clock } from 'lucide-react';
import { useTranslation } from '@/i18n/TranslationContext';
import axios from '@/lib/axios';
import { useUserRole } from '@/hooks/useUserRole';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function LiveRoomPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const isAr = locale === 'ar';
  
  const { role: rawRole, isStaff, isStudent, isLoading: isRoleLoading } = useUserRole();
  const role = isStaff ? 'teacher' : 'student';
  
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [sessionPassword, setSessionPassword] = useState<string | null>(null);
  const [isWaitingForTeacher, setIsWaitingForTeacher] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      if (isRoleLoading) return;
      
      try {
        setIsLoading(true);
        // Call the correct endpoint based on the role to fetch the dynamic meeting link
        const endpoint = role === 'teacher' ? `/sessions/${params.sessionId}/start_jitsi/` : `/sessions/${params.sessionId}/join_jitsi/`;
        const res = await axios.post(endpoint);
        
        if (isMounted) {
          setRoomUrl(res.data.meeting_link);
          if (res.data.password) setSessionPassword(res.data.password);
        }
      } catch (err: any) {
        console.error(err);
        if (isMounted) {
          const errMsg = err.response?.data?.error;
          if (errMsg === "Session has not been started by the teacher yet." || err.response?.status === 400) {
            setIsWaitingForTeacher(true);
          } else {
            setError(errMsg || (isAr ? 'فشل الانضمام للجلسة' : 'Failed to join session'));
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initSession();

    return () => {
      isMounted = false;
    };
  }, [params.sessionId, role, isRoleLoading, isAr]);

  useEffect(() => {
    if (!roomUrl || !containerRef.current) return;

    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Failed to load Jitsi API'));
        document.body.appendChild(script);
      });
    };

    const initJitsi = async () => {
      try {
        await loadJitsiScript();

        // Extract room name from the URL
        const parsedUrl = new URL(roomUrl);
        const roomName = parsedUrl.pathname.substring(1); // removes the leading slash

        const configOverwrite: any = {};

        // Apply strict student configurations based on the prompt instructions
        if (role === 'student') {
          configOverwrite.prejoinPageEnabled = false;
          configOverwrite.disableRemoteMute = true;
          configOverwrite.remoteVideoMenu = { disableKick: true };
          // Disable screen sharing and other moderator features for students if needed
          configOverwrite.enableUserRolesBasedOnToken = false;
        }

        const options = {
          roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          configOverwrite,
          iframeAttributes: {
            allow: "camera; microphone; display-capture; autoplay"
          }
        };

        if (jitsiApiRef.current) {
          jitsiApiRef.current.dispose();
        }

        jitsiApiRef.current = new window.JitsiMeetExternalAPI(parsedUrl.hostname, options);
        
        jitsiApiRef.current.addEventListener('videoConferenceJoined', () => {
          if (role === 'teacher' && sessionPassword) {
            jitsiApiRef.current.executeCommand('password', sessionPassword);
          }
        });

        jitsiApiRef.current.addEventListener('passwordRequired', () => {
          if (role === 'student' && sessionPassword) {
            jitsiApiRef.current.executeCommand('password', sessionPassword);
          }
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing Jitsi:', err);
        setError(isAr ? 'تعذر تحميل بيئة الفيديو' : 'Could not load video environment');
        setIsLoading(false);
      }
    };

    initJitsi();

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [roomUrl, role, isAr]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-900/80 backdrop-blur-md z-10 shadow-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 hover:border-slate-600 shadow-sm"
          >
            <ArrowLeft size={20} className={isAr ? "rotate-180" : ""} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
              <Video size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              {isAr ? 'الجلسة الافتراضية المباشرة' : 'Live Virtual Session'}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {role === 'teacher' && (
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">
              {isAr ? 'المعلم (مضيف)' : 'Teacher (Host)'}
            </span>
          )}
          {role === 'student' && (
            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">
              {isAr ? 'طالب (مشارك)' : 'Student (Participant)'}
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-6 overflow-hidden relative">
        <div className="w-full h-full max-w-7xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative flex flex-col">
          
          {isRoleLoading ? (
            <div className="flex-1 flex items-center justify-center bg-slate-900 z-10">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
          ) : isWaitingForTeacher ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900/50">
              <Clock className="w-16 h-16 text-blue-500 mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold text-white mb-2">{isAr ? 'في الانتظار' : 'Waiting...'}</h2>
              <p className="text-slate-400 mb-6 max-w-md">
                {isAr 
                  ? 'لم يقم المعلم ببدء هذه الجلسة بعد. يرجى الانتظار والمحاولة مرة أخرى قريباً.' 
                  : 'Waiting for the instructor to start the session. Please check back shortly.'}
              </p>
              <button 
                onClick={() => router.back()}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
              >
                {isAr ? 'العودة' : 'Go Back'}
              </button>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900/50">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">{isAr ? 'خطأ' : 'Error'}</h2>
              <p className="text-slate-400 mb-6 max-w-md">{error}</p>
              <button 
                onClick={() => router.back()}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20"
              >
                {isAr ? 'العودة' : 'Go Back'}
              </button>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin relative z-10" />
                  </div>
                  <p className="text-slate-400 mt-4 font-medium animate-pulse">
                    {isAr ? 'جاري الاتصال بالغرفة...' : 'Connecting to the room...'}
                  </p>
                </div>
              )}
              
              <div 
                ref={containerRef} 
                className={`w-full h-full transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              />
            </>
          )}

        </div>
      </div>
    </div>
  );
}
