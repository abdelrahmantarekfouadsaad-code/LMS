"use client"

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { User, Shield, Moon, Sun, Globe, Save, Loader2, LogOut, LifeBuoy } from 'lucide-react';
import Toast, { ToastType } from '@/components/ui/Toast';
import axios from 'axios';
import { DJANGO_API } from '@/lib/api-config';
import { useTranslation } from '@/i18n/TranslationContext';
import SecurityToggle from '@/components/ui/SecurityToggle';

export default function SuperAdminSettingsPage() {
  const { t } = useTranslation();
  const { data: session, update } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [toast, setToast] = useState<{ message: string, type: ToastType, isVisible: boolean }>({ message: '', type: 'success', isVisible: false });

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session?.user) {
      setFullName(session.user.name || '');
      setEmail(session.user.email || '');
    }
  }, [session]);

  const userName = session?.user?.name || 'Super Admin';
  const initial = userName.charAt(0).toUpperCase();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    setIsSavingProfile(true);
    try {
      const res = await axios.patch(`${DJANGO_API}/accounts/update_profile/`, {
        full_name: fullName,
        email: email,
      }, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });

      // Sync client session
      await update({ name: res.data.full_name, email: res.data.email });
      router.refresh();
      showToast(t('admin.settings.profileUpdated'), 'success');
    } catch (error: any) {
      showToast(error.response?.data?.detail || t('admin.settings.profileUpdateFailed'), 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    if (newPassword !== confirmPassword) {
      showToast(t('admin.settings.passwordsMismatch'), 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast(t('admin.settings.passwordLength'), 'error');
      return;
    }

    setIsSavingPassword(true);
    try {
      await axios.post(`${DJANGO_API}/accounts/change_password/`, {
        current_password: currentPassword,
        new_password: newPassword
      }, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      showToast(t('admin.settings.passwordUpdated'), 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showToast(error.response?.data?.error || t('admin.settings.passwordUpdateFailed'), 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-10 overflow-y-auto hide-scrollbar bg-transparent">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-2">{t('admin.settings.title')}</h1>
        <p className="text-gray-400">{t('admin.settings.subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Personal Details (40%) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-8 bg-slate-900/50 border border-white/10 rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <User className="text-indigo-400" /> {t('admin.settings.personalDetails')}
            </h2>

            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-bl from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {initial}
              </div>
              <div>
                <button className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors mb-1 block">
                  تغيير الصورة
                </button>
                <p className="text-xs text-gray-500">{t('admin.settings.photoHint')}</p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleUpdateProfile}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.settings.fullName')}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.settings.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.settings.accountRole')}</label>
                <input
                  type="text"
                  value={t('admin.settings.roleSuperAdmin')}
                  disabled
                  className="w-full bg-slate-800/30 border border-white/5 rounded-xl px-4 py-3 text-gray-500 text-sm cursor-not-allowed"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSavingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} حفظ التغييرات
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Security & Preferences (60%) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Security Section */}
          <div className="glass-panel p-8 bg-slate-900/50 border border-white/10 rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Shield className="text-emerald-400" /> {t('admin.settings.security')}
            </h2>

            <form className="space-y-5 max-w-lg" onSubmit={handleUpdatePassword}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.settings.currentPassword')}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.settings.newPassword')}</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.settings.confirmPassword')}</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSavingPassword}
                className="py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSavingPassword ? <Loader2 size={18} className="animate-spin" /> : null} تحديث كلمة المرور
              </button>
            </form>

            <div className="mt-8 border-t border-white/10 pt-6">
              <SecurityToggle />
            </div>
          </div>

          {/* Support & Session Section */}
          <div className="glass-panel p-8 bg-slate-900/50 border border-white/10 rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <LifeBuoy className="text-indigo-400" /> {t('admin.settings.sessionAndSupport')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Secure Log Out Card */}
              <div className="flex flex-col justify-between p-5 bg-slate-800/30 rounded-2xl border border-white/5 transition-all hover:border-red-500/30 group">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <LogOut className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="font-bold text-white text-sm mb-1">{t('admin.settings.logout')}</h3>
                  <p className="text-xs text-gray-400 mb-4">{t('admin.settings.logoutDesc')}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full py-2.5 px-4 bg-gradient-to-l from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/15 text-xs flex items-center justify-center gap-2"
                >
                  <LogOut size={14} /> تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
