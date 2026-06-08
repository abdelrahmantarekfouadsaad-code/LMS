"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState, useEffect } from 'react';
import { LayoutDashboard, Users, DollarSign, BookOpen, MessageSquare, Newspaper, Settings, Globe } from 'lucide-react';

const DICTIONARY = {
  ar: {
    title: 'نور النبوة',
    subtitle: 'لوحة تحكم المشرف العام',
    users: 'المستخدمين',
    finance: 'المالية',
    courses: 'الدورات',
    chats: 'المحادثات',
    news: 'الأخبار',
    settings: 'الإعدادات'
  },
  en: {
    title: 'Noor Al-Nubuwwah',
    subtitle: 'Super Admin Panel',
    users: 'Users',
    finance: 'Finance',
    courses: 'Courses',
    chats: 'Chats',
    news: 'News',
    settings: 'Settings'
  }
};

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [locale, setLocale] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    const cookieLocale = document.cookie
      .split('; ')
      .find((row) => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1];
    if (cookieLocale === 'en' || cookieLocale === 'ar') {
      setLocale(cookieLocale);
    }
  }, []);

  const toggleLanguage = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    setLocale(newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLocale;
  };

  const t = DICTIONARY[locale];

  const navItems = [
    { href: '/super-admin/users', label: t.users, icon: Users },
    { href: '/super-admin/finance', label: t.finance, icon: DollarSign },
    { href: '/super-admin/courses', label: t.courses, icon: BookOpen },
    { href: '/super-admin/chats', label: t.chats, icon: MessageSquare },
    { href: '/super-admin/news', label: t.news, icon: Newspaper },
    { href: '/super-admin/settings', label: t.settings, icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white font-cairo" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Glassmorphism Sidebar */}
      <aside className={`w-64 bg-white/5 backdrop-blur-xl border-white/10 flex flex-col ${locale === 'ar' ? 'border-l' : 'border-r'}`}>
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold bg-gradient-to-l from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {t.title}
          </h2>
          <p className="text-xs text-gray-400 mt-1">{t.subtitle}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/super-admin' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                    : 'hover:bg-white/10 text-gray-300 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : ''}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0A0A0A] to-[#0A0A0A]">
        {/* Top Navbar for Language Toggle */}
        <header className="h-16 border-b border-white/5 flex items-center justify-end px-6 shrink-0">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10"
          >
            <Globe className="w-4 h-4" />
            {locale === 'ar' ? 'English' : 'العربية'}
          </button>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
