"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import axios from 'axios';
import Toast, { ToastType } from '@/components/ui/Toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  
  // Step 2 State
  const [token, setToken] = useState('');
  const [uid, setUid] = useState(''); // in real app, uid might be in url, here we just ask for it or receive it in email, but since it's a test flow we can just put it in the UI or fetch it.
  
  // Step 3 State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: ToastType, isVisible: boolean}>({message: '', type: 'success', isVisible: false});

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/auth/forgot-password/', { email });
      showToast(res.data.message || 'If an account exists, a reset link has been sent.', 'success');
      
      // For demonstration/testing, we automatically populate uid if the backend returns it in dev mode
      if (res.data.uid) {
        setUid(res.data.uid);
      }
      
      setStep(2);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to request reset.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      showToast('Please enter the reset token.', 'error');
      return;
    }
    setStep(3);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/auth/reset-password/', {
        uid,
        token,
        new_password: newPassword
      });
      showToast('Password has been reset successfully. Redirecting...', 'success');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Invalid or expired token.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      
      {/* Background blobs */}
      <div className="absolute top-1/4 start-1/4 w-[400px] h-[400px] bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-1/4 end-1/4 w-[400px] h-[400px] bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel backdrop-blur-xl p-8 sm:p-10 relative z-10 border border-white/10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <KeyRound className="text-primary" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-sm text-slate-400">
            {step === 1 && "Enter your email to receive a reset token."}
            {step === 2 && "Enter the token sent to your email."}
            {step === 3 && "Enter your new password to reset."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleRequestReset} 
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full ps-10 pe-3 py-2.5 border border-slate-700 rounded-xl bg-slate-800 text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all sm:text-sm"
                    placeholder="student@example.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Send OTP/Token'}
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleVerifyToken} 
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Reset Token (Sent to email)
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-slate-700 rounded-xl bg-slate-800 text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all sm:text-sm"
                  placeholder="Paste your token here"
                  required
                />
              </div>

              {/* Developer hidden uid field, populated automatically if generated */}
              <input type="hidden" value={uid} onChange={(e) => setUid(e.target.value)} />

              {/* If uid is not auto-populated, we can show it here. But for now we rely on the hidden field. */}

              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
              >
                Verify
              </button>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form 
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleResetPassword} 
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full ps-10 pe-3 py-2.5 border border-slate-700 rounded-xl bg-slate-800 text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all sm:text-sm"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full ps-10 pe-3 py-2.5 border border-slate-700 rounded-xl bg-slate-800 text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all sm:text-sm"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Reset Password'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center">
          <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Back to Sign In
          </Link>
        </div>
      </motion.div>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({...prev, isVisible: false}))} 
      />
    </div>
  );
}
