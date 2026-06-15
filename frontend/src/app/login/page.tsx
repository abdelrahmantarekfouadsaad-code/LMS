"use client"

import React, { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, Chrome, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslation } from '@/i18n/TranslationContext';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError(t('login.invalidCreds'));
      setIsLoading(false);
    } else {
      const session = await getSession();
      const role = session?.user?.role;
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
        router.push('/super-admin/courses');
      } else if (role === 'TEACHER') {
        router.push('/teacher');
      } else {
        router.push('/dashboard');
      }
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      
      {/* Left Side - Branding / Graphic */}
      <div className="hidden lg:flex w-1/2 relative bg-primary items-center justify-center overflow-hidden">
        {/* Dynamic Abstract Shapes */}
        <div className="absolute top-[-10%] start-[-10%] w-[500px] h-[500px] bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-[-10%] end-[-10%] w-[500px] h-[500px] bg-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 text-center text-white px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-5xl font-extrabold tracking-tight mb-6 text-white drop-shadow-lg">
              {t('login.title')}
            </h1>
            <p className="text-xl font-medium text-emerald-100 max-w-md mx-auto">
              {t('login.subtitle')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative">
        
        {/* Mobile Background Elements */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-primary/10 to-transparent"></div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md glass-panel backdrop-blur-md p-8 sm:p-10 relative z-10"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('login.welcomeBack')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('login.signInToAccount')}</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-100 text-red-700 text-sm border border-red-200 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleCredentialsLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t('login.emailOrId')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full ps-10 pe-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all sm:text-sm"
                  placeholder={t('login.emailPlaceholder')}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('login.password')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full ps-10 pe-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all sm:text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-slate-600 dark:text-slate-400">
                <input type="checkbox" className="me-2 rounded text-primary focus:ring-primary" />
                {t('login.rememberMe')}
              </label>
              <Link href="/forgot-password" className="text-primary font-medium hover:text-primary-hover">{t('login.forgotPassword')}</Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : t('login.signIn')}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 rounded-full">{t('login.orContinueWith')}</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Chrome size={20} className={isLoading ? "animate-spin text-slate-400" : "text-[#4285F4]"} />
                {t('login.continueWithGoogle')}
              </button>
            </div>
          </div>

          {/* Parent Setup & Registration Links */}
          <div className="mt-8 space-y-3 text-center text-sm">
            <Link 
              href="/parent-setup" 
              className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
            >
              <Users size={14} />
              <span>{t('login.parentSetup')}</span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400">
              {t('login.dontHaveAccount')}{' '}
              <Link href="/register" className="font-semibold text-primary hover:text-primary-hover transition-colors">
                {t('login.signUp')}
              </Link>
            </p>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
