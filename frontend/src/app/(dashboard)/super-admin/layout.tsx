"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { LayoutDashboard, Users, DollarSign, BookOpen, MessageSquare, Newspaper } from 'lucide-react';

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/super-admin', label: 'لوحة القيادة', icon: LayoutDashboard },
    { href: '/super-admin/users', label: 'المستخدمين', icon: Users },
    { href: '/super-admin/finance', label: 'المالية', icon: DollarSign },
    { href: '/super-admin/courses', label: 'الدورات', icon: BookOpen },
    { href: '/super-admin/chats', label: 'المحادثات', icon: MessageSquare },
    { href: '/super-admin/news', label: 'الأخبار', icon: Newspaper },
  ];

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white font-cairo" dir="rtl">
      {/* Glassmorphism Sidebar */}
      <aside className="w-64 bg-white/5 backdrop-blur-xl border-l border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold bg-gradient-to-l from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            نور النبوة
          </h2>
          <p className="text-xs text-gray-400 mt-1">Super Admin Panel</p>
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
      <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0A0A0A] to-[#0A0A0A]">
        {children}
      </main>
    </div>
  );
}
