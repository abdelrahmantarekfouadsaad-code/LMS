"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, UserX, ChevronRight, ArrowLeft, Baby, Sprout, BookOpen, Loader2, ShieldAlert, CheckCircle } from 'lucide-react';
import { submitOnboarding } from '@/lib/api';
import { useLocale } from '@/hooks/useLocale';
import { DICTIONARY } from '@/locales/dictionary';

// Age group config
const AGE_GROUPS = [
  { key: 'CHILDREN', min: 6, max: 10, icon: Baby, gradient: 'from-sky-400 to-blue-500' },
  { key: 'TWEENS', min: 11, max: 12, icon: Sprout, gradient: 'from-emerald-400 to-teal-500' },
  { key: 'TEENS', min: 13, max: 20, icon: BookOpen, gradient: 'from-violet-400 to-purple-500' },
];

// Slide animation variants
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.95,
  }),
};

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const locale = useLocale();
  const t = DICTIONARY[locale as 'en' | 'ar']?.onboarding || DICTIONARY.en.onboarding;
  const isAr = locale === 'ar';

  // Flow state
  const [step, setStep] = useState<'question' | 'guestWarning' | 'ageGroup' | 'ageInput'>('question');
  const [direction, setDirection] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [exactAge, setExactAge] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Guest warning countdown
  const [countdown, setCountdown] = useState(5);
  const [countdownActive, setCountdownActive] = useState(false);

  // Countdown timer for guest warning
  useEffect(() => {
    if (!countdownActive || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdownActive, countdown]);

  const goToStep = useCallback((newStep: typeof step, dir: number = 1) => {
    setDirection(dir);
    setError('');
    setStep(newStep);
  }, []);

  // Handle "No" — show guest warning
  const handleNo = () => {
    setCountdown(5);
    setCountdownActive(true);
    goToStep('guestWarning');
  };

  // Handle Guest confirmation
  const handleGuestConfirm = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await submitOnboarding({ role: 'GUEST' });
      await updateSession({ isOnboarded: true, role: 'GUEST' });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle Student submit (final step)
  const handleStudentSubmit = async () => {
    const age = parseInt(exactAge);
    if (!selectedGroup) return;

    const group = AGE_GROUPS.find(g => g.key === selectedGroup);
    if (!group || isNaN(age) || age < group.min || age > group.max) {
      setError(
        isAr
          ? `العمر يجب أن يكون بين ${group?.min} و ${group?.max}`
          : `Age must be between ${group?.min} and ${group?.max}`
      );
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await submitOnboarding({
        role: 'STUDENT',
        age_group: selectedGroup,
        exact_age: age,
      });
      await updateSession({ isOnboarded: true, role: 'STUDENT' });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Circular countdown SVG for the guest button
  const CountdownRing = ({ seconds }: { seconds: number }) => {
    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    const progress = (seconds / 5) * circumference;
    return (
      <svg width="28" height="28" className="shrink-0">
        <circle cx="14" cy="14" r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" fill="none" />
        <circle
          cx="14" cy="14" r={radius}
          stroke="white" strokeWidth="2.5" fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-linear"
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
        <text x="14" y="14" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="10" fontWeight="bold">
          {seconds}
        </text>
      </svg>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-500/15 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        {/* Logo / Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">Noor Al-Nubuwwah</h1>
          <p className="text-sm text-white/40 mt-1">{isAr ? t.welcomeSubtitleAr : t.welcomeSubtitle}</p>
        </motion.div>

        {/* Step Container */}
        <div className="relative min-h-[360px]">
          <AnimatePresence mode="wait" custom={direction}>

            {/* STEP 1: Are you a student? */}
            {step === 'question' && (
              <motion.div
                key="question"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/20"
              >
                {/* Question */}
                <div className="text-center mb-10">
                  <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-emerald-500/30 flex items-center justify-center border border-white/10">
                    <GraduationCap className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{t.question}</h2>
                  {!isAr && <p className="text-white/40 text-lg">{t.questionAr}</p>}
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  {/* YES */}
                  <button
                    id="onboard-yes"
                    onClick={() => goToStep('ageGroup')}
                    className="group relative flex flex-col items-center gap-3 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12] hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GraduationCap className="w-6 h-6 text-emerald-400" />
                    </div>
                    <span className="text-lg font-semibold text-emerald-400">{isAr ? t.yesAr : t.yes}</span>
                    <span className="text-xs text-white/40">{t.iAmStudent}</span>
                  </button>

                  {/* NO */}
                  <button
                    id="onboard-no"
                    onClick={handleNo}
                    className="group relative flex flex-col items-center gap-3 p-6 rounded-2xl border border-red-500/20 bg-red-500/[0.04] hover:bg-red-500/[0.10] hover:border-red-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/10"
                  >
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserX className="w-6 h-6 text-red-400" />
                    </div>
                    <span className="text-lg font-semibold text-red-400">{isAr ? t.noAr : t.no}</span>
                    <span className="text-xs text-white/40">{t.iAmNotStudent}</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2a: Guest Warning */}
            {step === 'guestWarning' && (
              <motion.div
                key="guestWarning"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="bg-white/[0.06] backdrop-blur-2xl border border-red-500/20 rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/20"
              >
                {/* Warning Icon */}
                <div className="text-center mb-6">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30 animate-pulse">
                    <ShieldAlert className="w-8 h-8 text-red-400" />
                  </div>
                  <h2 className="text-xl font-bold text-red-400 mb-1">{t.guestWarningTitle}</h2>
                </div>

                {/* Warning Text */}
                <div className="mb-8 p-4 rounded-xl bg-red-500/[0.06] border border-red-500/10">
                  <p className="text-white/80 text-sm leading-relaxed text-center">
                    {isAr ? t.guestWarningTextAr : t.guestWarningText}
                  </p>
                  {!isAr && (
                    <p className="text-white/40 text-xs leading-relaxed text-center mt-3" dir="rtl">
                      {t.guestWarningTextAr}
                    </p>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Agree button with countdown */}
                  <button
                    id="onboard-guest-confirm"
                    onClick={handleGuestConfirm}
                    disabled={countdown > 0 || isSubmitting}
                    className={`
                      w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-300
                      ${countdown > 0
                        ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600 text-white border border-red-400/50 shadow-lg shadow-red-500/20 hover:-translate-y-0.5'
                      }
                      disabled:opacity-70 disabled:cursor-not-allowed
                    `}
                  >
                    {isSubmitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : countdown > 0 ? (
                      <>
                        <CountdownRing seconds={countdown} />
                        <span>{(isAr ? t.waitSeconds : t.waitSeconds).replace('{s}', String(countdown))}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        <span>{isAr ? t.agreeGuestAr : t.agreeGuest}</span>
                      </>
                    )}
                  </button>

                  {/* Go Back */}
                  <button
                    id="onboard-guest-back"
                    onClick={() => goToStep('question', -1)}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm text-white/60 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300"
                  >
                    <ArrowLeft size={16} />
                    {isAr ? t.goBackAr : t.goBack}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2b: Age Group Selection */}
            {step === 'ageGroup' && (
              <motion.div
                key="ageGroup"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/20"
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-1">{isAr ? t.ageGroupTitleAr : t.ageGroupTitle}</h2>
                  {!isAr && <p className="text-white/40">{t.ageGroupTitleAr}</p>}
                </div>

                {/* Age Group Cards */}
                <div className="space-y-3 mb-6">
                  {AGE_GROUPS.map((group, idx) => {
                    const Icon = group.icon;
                    const isSelected = selectedGroup === group.key;
                    const label = group.key === 'CHILDREN' ? t.children : group.key === 'TWEENS' ? t.tweens : t.teens;
                    const labelAr = group.key === 'CHILDREN' ? t.childrenAr : group.key === 'TWEENS' ? t.tweensAr : t.teensAr;
                    const desc = group.key === 'CHILDREN' ? t.childrenDesc : group.key === 'TWEENS' ? t.tweensDesc : t.teensDesc;

                    return (
                      <motion.button
                        id={`onboard-age-${group.key.toLowerCase()}`}
                        key={group.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 + 0.2 }}
                        onClick={() => {
                          setSelectedGroup(group.key);
                          setExactAge('');
                          setError('');
                        }}
                        className={`
                          w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-start
                          ${isSelected
                            ? `border-white/20 bg-gradient-to-r ${group.gradient} bg-opacity-10 shadow-lg -translate-y-0.5`
                            : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10'
                          }
                        `}
                      >
                        <div className={`
                          w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all
                          ${isSelected ? 'bg-white/20' : `bg-gradient-to-br ${group.gradient} opacity-60`}
                        `}>
                          <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-white/80'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white">{label}</div>
                          <div className="text-xs text-white/50">{isAr ? desc : `${labelAr} — ${desc}`}</div>
                        </div>
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="shrink-0">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => goToStep('question', -1)}
                    className="flex items-center gap-1.5 py-3 px-4 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    id="onboard-age-continue"
                    onClick={() => selectedGroup && goToStep('ageInput')}
                    disabled={!selectedGroup}
                    className={`
                      flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-300
                      ${selectedGroup
                        ? 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5'
                        : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                      }
                    `}
                  >
                    {isAr ? t.submitAr : t.submit}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Exact Age Input */}
            {step === 'ageInput' && (
              <motion.div
                key="ageInput"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/20"
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-1">{isAr ? t.ageInputTitleAr : t.ageInputTitle}</h2>
                  {!isAr && <p className="text-white/40">{t.ageInputTitleAr}</p>}
                  {selectedGroup && (
                    <p className="text-xs text-white/30 mt-2">
                      {(() => {
                        const group = AGE_GROUPS.find(g => g.key === selectedGroup);
                        return group ? `${isAr ? 'المدى المسموح' : 'Allowed range'}: ${group.min} — ${group.max}` : '';
                      })()}
                    </p>
                  )}
                </div>

                {/* Age Input */}
                <div className="mb-6">
                  <input
                    id="onboard-age-input"
                    type="number"
                    value={exactAge}
                    onChange={(e) => { setExactAge(e.target.value); setError(''); }}
                    placeholder={isAr ? t.ageInputPlaceholderAr : t.ageInputPlaceholder}
                    min={AGE_GROUPS.find(g => g.key === selectedGroup)?.min}
                    max={AGE_GROUPS.find(g => g.key === selectedGroup)?.max}
                    className="w-full text-center text-4xl font-bold py-6 px-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => goToStep('ageGroup', -1)}
                    className="flex items-center gap-1.5 py-3 px-4 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    id="onboard-submit"
                    onClick={handleStudentSubmit}
                    disabled={!exactAge || isSubmitting}
                    className={`
                      flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-300
                      ${exactAge && !isSubmitting
                        ? 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5'
                        : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                      }
                    `}
                  >
                    {isSubmitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        {isAr ? t.submitAr : t.submit}
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Step indicator dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {['question', 'ageGroup', 'ageInput'].map((s, i) => (
            <div
              key={s}
              className={`
                h-1.5 rounded-full transition-all duration-500
                ${step === s || (step === 'guestWarning' && s === 'question')
                  ? 'w-8 bg-primary'
                  : 'w-1.5 bg-white/20'
                }
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
