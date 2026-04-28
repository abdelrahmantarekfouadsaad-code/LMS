"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowLeft, CheckCircle2, Users, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const API = 'http://127.0.0.1:8000/api';

type Step = 'email' | 'create-password' | 'success';

export default function ParentSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentName, setStudentName] = useState('');

  // Step 1: Verify parent email against StudentProfile.parent_email
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/auth/parent-verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.status === 'needs_password') {
        setStudentName(data.student_name || '');
        setStep('create-password');
      } else if (res.ok && data.status === 'already_registered') {
        setError('This parent account is already registered. Please sign in directly from the login page.');
      } else {
        setError(data.error || 'This email is not linked to any student account. Please ask your child\'s teacher to add your email.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Create password for the parent account
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API}/auth/parent-create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep('success');
      } else {
        setError(data.error || 'Failed to create account. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      
      {/* Left Side - Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-indigo-600 to-violet-700 items-center justify-center overflow-hidden">
        <div className="absolute top-[-10%] start-[-10%] w-[500px] h-[500px] bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute bottom-[-10%] end-[-10%] w-[500px] h-[500px] bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 text-center text-white px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/20">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white drop-shadow-lg">
              Parent Account Setup
            </h1>
            <p className="text-lg font-medium text-indigo-100 max-w-md mx-auto leading-relaxed">
              Link your account to monitor your child&apos;s progress, view grades, and stay connected with their teachers.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Wizard Steps */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative">
        <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-indigo-500/10 to-transparent"></div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Back to Login */}
          <Link 
            href="/login" 
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={16} /> Back to Login
          </Link>

          {/* Step Progress */}
          <div className="flex items-center gap-2 mb-8">
            {(['email', 'create-password', 'success'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step === s ? 'bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/30' :
                  (['email', 'create-password', 'success'].indexOf(step) > i) ? 'bg-emerald-500 text-white' :
                  'bg-slate-800 text-slate-500'
                }`}>
                  {(['email', 'create-password', 'success'].indexOf(step) > i) ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                {i < 2 && <div className={`w-8 h-0.5 rounded-full transition-colors ${(['email', 'create-password', 'success'].indexOf(step) > i) ? 'bg-emerald-500' : 'bg-slate-800'}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* =================== STEP 1: Email Verification =================== */}
            {step === 'email' && (
              <motion.div key="email" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="glass-panel backdrop-blur-md p-8 sm:p-10">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
                    <p className="text-sm text-slate-400">
                      Enter the email address that your child&apos;s teacher linked to their student profile.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20 text-center">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleVerifyEmail} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Parent Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                          <Mail size={18} className="text-slate-500" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full ps-10 pe-3 py-2.5 border border-slate-700 rounded-xl bg-slate-800/80 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm"
                          placeholder="parent@example.com"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Verify Email'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* =================== STEP 2: Create Password =================== */}
            {step === 'create-password' && (
              <motion.div key="password" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="glass-panel backdrop-blur-md p-8 sm:p-10">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Create Your Password</h2>
                    {studentName && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-3">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <p className="text-sm text-emerald-300">
                          Linked to student: <span className="font-bold">{studentName}</span>
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-slate-400">
                      Set a secure password to finalize your parent account.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20 text-center">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleCreatePassword} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                          <Lock size={18} className="text-slate-500" />
                        </div>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full ps-10 pe-3 py-2.5 border border-slate-700 rounded-xl bg-slate-800/80 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm"
                          placeholder="Min. 8 characters"
                          required
                          minLength={8}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                          <ShieldCheck size={18} className="text-slate-500" />
                        </div>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="block w-full ps-10 pe-3 py-2.5 border border-slate-700 rounded-xl bg-slate-800/80 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm"
                          placeholder="Repeat password"
                          required
                          minLength={8}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Create Account'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* =================== STEP 3: Success =================== */}
            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="glass-panel backdrop-blur-md p-8 sm:p-10 text-center">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">Account Created!</h2>
                  <p className="text-slate-400 mb-8 leading-relaxed">
                    Your parent account has been successfully created. You can now sign in using your email and the password you just set.
                  </p>
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full py-3 px-4 rounded-xl shadow-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all"
                  >
                    Go to Login
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
