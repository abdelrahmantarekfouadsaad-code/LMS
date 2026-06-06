import Link from 'next/link';
import { ReactNode } from 'react';
import { LayoutDashboard, Users, DollarSign, BookOpen, MessageSquare, Newspaper } from 'lucide-react';

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
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
          <Link href="/super-admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-gray-300 hover:text-white">
            <LayoutDashboard className="w-5 h-5" />
            <span>لوحة القيادة</span>
          </Link>
          <Link href="/super-admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>المستخدمين</span>
          </Link>
          <Link href="/super-admin/finance" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-gray-300 hover:text-white">
            <DollarSign className="w-5 h-5" />
            <span>المالية</span>
          </Link>
          <Link href="/super-admin/courses" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-gray-300 hover:text-white">
            <BookOpen className="w-5 h-5" />
            <span>الدورات</span>
          </Link>
          <Link href="/super-admin/chats" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-gray-300 hover:text-white">
            <MessageSquare className="w-5 h-5" />
            <span>المحادثات</span>
          </Link>
          <Link href="/super-admin/news" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-gray-300 hover:text-white">
            <Newspaper className="w-5 h-5" />
            <span>الأخبار</span>
          </Link>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0A0A0A] to-[#0A0A0A]">
        {children}
      </main>
    </div>
  );
}
