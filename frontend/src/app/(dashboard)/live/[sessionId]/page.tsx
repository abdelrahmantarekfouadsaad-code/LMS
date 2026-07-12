"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeft, Loader2, Video, AlertCircle, Radio, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/i18n/TranslationContext';
import axios from '@/lib/axios';
import { useUserRole } from '@/hooks/useUserRole';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function LiveRoomPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const isAr = locale === 'ar';

  const { role: rawRole, isStaff, isStudent, isLoading: isRoleLoading } = useUserRole();
  const role = isStaff ? 'teacher' : 'student';

  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll session data every 3 seconds to detect when teacher starts the room
  const { data: session, isLoading: isSessionLoading } = useSWR(
    `/sessions/${params.sessionId}/`,
    fetcher,
    { refreshInterval: 3000 }
  );

  const isLoading = isRoleLoading || isSessionLoading;
  const teacherHasStarted = !!session?.meeting_link;

  const handleTeacherLaunch = async () => {
    try {
      setIsLaunching(true);
      setError(null);
      const res = await axios.post(`/sessions/${params.sessionId}/start_jitsi/`);
      window.open(
        res.data.meeting_link,
        'JitsiLive',
        'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no'
      );
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || (isAr ? 'فشل بدء الجلسة' : 'Failed to start session'));
    } finally {
      setIsLaunching(false);
    }
  };

  const handleStudentJoin = async () => {
    try {
      setIsLaunching(true);
      setError(null);
      const res = await axios.post(`/sessions/${params.sessionId}/join_jitsi/`);
      window.open(
        res.data.meeting_link,
        'JitsiLive',
        'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no'
      );
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || (isAr ? 'فشل الانضمام للجلسة' : 'Failed to join session'));
    } finally {
      setIsLaunching(false);
    }
  };

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
        <div className="w-full h-full max-w-4xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative flex flex-col items-center justify-center">

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin relative z-10" />
              </div>
              <p className="text-slate-400 font-medium animate-pulse">
                {isAr ? 'جاري التحميل...' : 'Loading...'}
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">{isAr ? 'خطأ' : 'Error'}</h2>
              <p className="text-slate-400 mb-6 max-w-md">{error}</p>
              <button
                onClick={() => setError(null)}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20"
              >
                {isAr ? 'حاول مرة أخرى' : 'Try Again'}
              </button>
            </div>
          ) : role === 'teacher' ? (
            /* ── Teacher View: Launch Broadcast ── */
            <div className="flex flex-col items-center justify-center p-8 text-center gap-6">
              {/* Glowing icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                <div className="relative z-10 w-24 h-24 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center">
                  <Video className="w-10 h-10 text-emerald-400" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isAr ? 'أنت مضيف هذه الجلسة' : 'You are hosting this session'}
                </h2>
                <p className="text-slate-400 max-w-md">
                  {isAr
                    ? 'اضغط على الزر أدناه لفتح غرفة البث المباشر في نافذة جديدة. سيتمكن الطلاب من الانضمام بعد ذلك.'
                    : 'Click the button below to open the live broadcast room in a new window. Students will be able to join after you start.'}
                </p>
              </div>

              <button
                onClick={handleTeacherLaunch}
                disabled={isLaunching}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold text-lg rounded-2xl transition-all shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLaunching ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <ExternalLink className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                )}
                {isAr ? 'فتح غرفة البث المباشر' : 'Launch Live Broadcast'}
              </button>

              {teacherHasStarted && (
                <p className="text-emerald-400/70 text-sm font-medium flex items-center gap-2">
                  <Radio className="w-4 h-4 animate-pulse" />
                  {isAr ? 'الغرفة مفتوحة حالياً — يمكن للطلاب الانضمام' : 'Room is live — students can now join'}
                </p>
              )}
            </div>
          ) : (
            /* ── Student View: Wait + Join ── */
            <div className="flex flex-col items-center justify-center p-8 text-center gap-6">
              {!teacherHasStarted ? (
                <>
                  {/* Radar / Scanning animation */}
                  <div className="relative w-32 h-32">
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
                    <div className="absolute inset-2 rounded-full border-2 border-blue-500/15 animate-ping" style={{ animationDelay: '0.3s' }} />
                    <div className="absolute inset-4 rounded-full border-2 border-blue-500/10 animate-ping" style={{ animationDelay: '0.6s' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-blue-500/10 border-2 border-blue-500/30 rounded-full flex items-center justify-center">
                        <Radio className="w-8 h-8 text-blue-400 animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {isAr ? 'في انتظار المعلم...' : 'Waiting for Instructor...'}
                    </h2>
                    <p className="text-slate-400 max-w-md">
                      {isAr
                        ? 'لم يقم المعلم ببدء الجلسة بعد. سيظهر زر الانضمام تلقائيًا عندما تكون الغرفة جاهزة.'
                        : 'The instructor has not started the session yet. The join button will appear automatically when the room is ready.'}
                    </p>
                  </div>

                  <button
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
                  >
                    {isAr ? 'العودة' : 'Go Back'}
                  </button>
                </>
              ) : (
                <>
                  {/* Room is ready */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
                    <div className="relative z-10 w-24 h-24 bg-blue-500/10 border-2 border-blue-500/30 rounded-full flex items-center justify-center">
                      <Video className="w-10 h-10 text-blue-400" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {isAr ? 'الغرفة جاهزة!' : 'Room is Ready!'}
                    </h2>
                    <p className="text-slate-400 max-w-md">
                      {isAr
                        ? 'المعلم قام بفتح الغرفة. اضغط أدناه للانضمام إلى الجلسة المباشرة.'
                        : 'The instructor has opened the room. Click below to join the live session.'}
                    </p>
                  </div>

                  <button
                    onClick={handleStudentJoin}
                    disabled={isLaunching}
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold text-lg rounded-2xl transition-all shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLaunching ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <ExternalLink className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    )}
                    {isAr ? 'انضمام للبث المباشر' : 'Join Live Broadcast'}
                  </button>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
