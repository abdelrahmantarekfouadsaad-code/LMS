"use client"

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { User, Shield, Moon, Sun, Globe, Save, Loader2 } from 'lucide-react';
import Toast, { ToastType } from '@/components/ui/Toast';
import axios from 'axios';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [locale, setLocale] = useState('en');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [parentEmail, setParentEmail] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [toast, setToast] = useState<{ message: string, type: ToastType, isVisible: boolean }>({ message: '', type: 'success', isVisible: false });

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  };

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Initialize locale from document if it was previously set
    setLocale(document.documentElement.lang === 'ar' ? 'ar' : 'en');
  }, []);

  useEffect(() => {
    if (session?.user) {
      setFullName(session.user.name || '');
      setEmail(session.user.email || '');
      // Fetch profile to get the latest parent_email
      if (session.accessToken) {
        axios.get('http://127.0.0.1:8000/api/accounts/me/', {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }).then(res => {
          if (res.data.parent_email) {
            setParentEmail(res.data.parent_email);
          }
        }).catch(err => console.error("Failed to fetch profile", err));
      }
    }
  }, [session]);

  // Sync RTL and lang tags physically to the DOM
  useEffect(() => {
    if (locale === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
  }, [locale]);

  const userName = session?.user?.name || 'Student';
  const initial = userName.charAt(0).toUpperCase();

  // Simple Translation Dictionary
  const t = {
    title: locale === 'ar' ? 'الملف الشخصي والإعدادات' : 'Profile & Settings',
    subtitle: locale === 'ar' ? 'إدارة تفاصيل حسابك وتفضيلات التخصيص.' : 'Manage your account details and personalization preferences.',
    personalDetails: locale === 'ar' ? 'البيانات الشخصية' : 'Personal Details',
    fullName: locale === 'ar' ? 'الاسم الكامل' : 'Full Name',
    email: locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address',
    role: locale === 'ar' ? 'دور الحساب' : 'Account Role',
    studentRole: locale === 'ar' ? 'طالب' : 'Student',
    saveChanges: locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes',
    security: locale === 'ar' ? 'الأمان' : 'Security',
    currentPass: locale === 'ar' ? 'كلمة المرور الحالية' : 'Current Password',
    newPass: locale === 'ar' ? 'كلمة المرور الجديدة' : 'New Password',
    confirmPass: locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password',
    updatePass: locale === 'ar' ? 'تحديث كلمة المرور' : 'Update Password',
    preferences: locale === 'ar' ? 'التفضيلات' : 'Preferences',
    appearance: locale === 'ar' ? 'المظهر' : 'Appearance',
    appearanceDesc: locale === 'ar' ? 'التبديل بين الوضع الداكن والفاتح.' : 'Toggle between dark and light mode.',
    language: locale === 'ar' ? 'اللغة' : 'Language',
    languageDesc: locale === 'ar' ? 'اختر لغة المنصة المفضلة لديك.' : 'Select your preferred platform language.',
    parentAccount: locale === 'ar' ? 'حساب ولي الأمر' : 'Link Parent Account',
    parentAccountDesc: locale === 'ar' ? 'أدخل البريد الإلكتروني لولي أمرك لربط حسابه.' : 'Enter your parent\'s email to link their account.',
    parentEmail: locale === 'ar' ? 'البريد الإلكتروني لولي الأمر' : 'Parent Email',
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    setIsSavingProfile(true);
    try {
      const res = await axios.patch('http://127.0.0.1:8000/api/accounts/update_profile/', {
        full_name: fullName,
        email: email,
      }, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });

      // Sync client session
      await update({ name: res.data.full_name, email: res.data.email });
      router.refresh();
      showToast('Profile updated successfully!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to update profile.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLinkParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    setIsSavingProfile(true);
    try {
      await axios.patch('http://127.0.0.1:8000/api/accounts/update_profile/', {
        parent_email: parentEmail
      }, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });

      showToast('Parent email updated successfully!', 'success');
      router.refresh();
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to update parent email.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters long.', 'error');
      return;
    }

    setIsSavingPassword(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/accounts/change_password/', {
        current_password: currentPassword,
        new_password: newPassword
      }, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      showToast('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to update password.', 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto hide-scrollbar">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{t.title}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t.subtitle}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column - Personal Details (40%) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <User className="text-primary" /> {t.personalDetails}
              </h2>

              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {initial}
                </div>
                <div>
                  <button className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors mb-1 block">
                    Change Avatar
                  </button>
                  <p className="text-xs text-slate-500">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleUpdateProfile}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.fullName}</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.email}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.role}</label>
                  <input
                    type="text"
                    value={session?.user?.role || t.studentRole}
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-500 text-sm cursor-not-allowed"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="py-2.5 px-6 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSavingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} {t.saveChanges}
                </button>
              </form>
            </div>

            {/* Parent Account Section */}
            <div className="glass-panel p-8 mt-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <User className="text-indigo-500" /> {t.parentAccount}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t.parentAccountDesc}</p>

              <form className="space-y-5" onSubmit={handleLinkParent}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.parentEmail}</label>
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSavingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} {t.saveChanges}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Security & Preferences (60%) */}
          <div className="lg:col-span-7 space-y-6">

            {/* Security Section */}
            <div className="glass-panel p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Shield className="text-emerald-500" /> {t.security}
              </h2>

              <form className="space-y-5 max-w-lg" onSubmit={handleUpdatePassword}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.currentPass}</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.newPass}</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.confirmPass}</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSavingPassword ? <Loader2 size={18} className="animate-spin" /> : null} {t.updatePass}
                </button>
              </form>
            </div>

            {/* Preferences Section */}
            <div className="glass-panel p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Globe className="text-blue-500" /> {t.preferences}
              </h2>

              <div className="space-y-6 max-w-lg">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">{t.appearance}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.appearanceDesc}</p>
                  </div>
                  {mounted && (
                    <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                      <button
                        onClick={() => setTheme('light')}
                        className={`p-2 rounded-md flex items-center justify-center transition-colors ${theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}
                      >
                        <Sun size={18} />
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`p-2 rounded-md flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-slate-950 text-white shadow-sm border border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}
                      >
                        <Moon size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Language Select */}
                <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">{t.language}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.languageDesc}</p>
                  </div>
                  <div className="relative">
                    <select
                      value={locale}
                      onChange={(e) => setLocale(e.target.value)}
                      className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white text-sm appearance-none focus:outline-none focus:border-primary transition-colors cursor-pointer min-w-[120px]"
                    >
                      <option value="en">English</option>
                      <option value="ar">العربية (Arabic)</option>
                    </select>
                    <div className="absolute inset-y-0 inset-inline-end-0 flex items-center px-3 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </main>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
