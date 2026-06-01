"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useLocale } from '@/hooks/useLocale';
import { DICTIONARY } from '@/locales/dictionary';
import {
  LayoutDashboard, 
  BookOpen, 
  Video, 
  FileQuestion, 
  Users, 
  HelpCircle,
  CreditCard,
  Menu,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Calendar,
  FolderOpen,
  MessageSquare,
  Award,
  Briefcase,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserRole } from '@/hooks/useUserRole';

const NAV_ITEMS = [
  { nameKey: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { nameKey: 'schedule', href: '/schedule', icon: Calendar },
  { nameKey: 'learning', href: '/learning', icon: BookOpen },
  { nameKey: 'projects', href: '/projects', icon: Briefcase },
  { nameKey: 'certificates', href: '/certificates', icon: Award },
  { nameKey: 'sessions', href: '/sessions', icon: Video },
  { nameKey: 'resources', href: '/resources', icon: FolderOpen },
  { nameKey: 'quizzes', href: '/quizzes', icon: FileQuestion },
  { nameKey: 'payment', href: '/payment', icon: CreditCard },
  { nameKey: 'community', href: '/community', icon: Users },
  { nameKey: 'chat', href: '/chat', icon: MessageSquare },
  { nameKey: 'support', href: '/support', icon: HelpCircle },
];

  const GUEST_ALLOWED_ROUTES = ['/dashboard', '/learning'];
  const PARENT_ALLOWED_ROUTES = ['/parent-dashboard', '/learning', '/payment', '/community', '/resources', '/support', '/settings'];

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isGuest } = useUserRole();
  const isParent = session?.user?.role === 'PARENT';
  const locale = useLocale();
  const t = DICTIONARY[locale as 'en' | 'ar']?.sidebar || DICTIONARY.en.sidebar;
  const tGuest = (DICTIONARY[locale as 'en' | 'ar'] as any)?.guest || (DICTIONARY.en as any).guest;

  let filteredNavItems = NAV_ITEMS;
  if (isGuest) {
    filteredNavItems = NAV_ITEMS.filter(item => GUEST_ALLOWED_ROUTES.includes(item.href));
  } else if (isParent) {
    filteredNavItems = NAV_ITEMS.map(item => {
      if (item.href === '/dashboard') {
        return { ...item, href: '/parent-dashboard' };
      }
      return item;
    }).filter(item => PARENT_ALLOWED_ROUTES.includes(item.href));
  }

  const userName = session?.user?.name || session?.user?.email || 'Student';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isExpanded ? '16rem' : '5rem' }}
      className="h-screen sticky top-0 flex flex-col glass-panel border-r-0 rounded-l-none z-40 transition-all duration-300"
    >
      {/* Header / Logo Area */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-white/10 dark:border-slate-700/30">
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-400"
            >
              Noor LMS
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors text-slate-500 dark:text-slate-400"
        >
          {isExpanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link key={item.nameKey} href={item.href} passHref>
              <div 
                className={`
                  flex items-center px-3 py-3 gap-3 rounded-xl cursor-pointer transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-primary/10 text-primary dark:text-emerald-400 font-medium' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }
                `}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-nav-indicator"
                    className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                  />
                )}
                <Icon size={22} className={`shrink-0 ${isActive ? 'text-primary' : ''}`} />
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {t[item.nameKey as keyof typeof t]}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer / Profile Snippet */}
      <div className="p-4 border-t border-white/10 dark:border-slate-700/30">
        <div className="flex items-center justify-between gap-3">
          <Link href="/settings" className="flex items-center gap-3 flex-1 min-w-0 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md">
              {initial}
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col overflow-hidden whitespace-nowrap flex-1 text-start"
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-200 group-hover:text-primary transition-colors truncate">{userName}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isGuest ? (
                      <span className="inline-flex items-center gap-1 text-amber-500">
                        <Sparkles size={10} />
                        {tGuest.guestBadge}
                      </span>
                    ) : t.level}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
          {isExpanded && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/15 transition-all duration-200 shrink-0"
              title={t.logout}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
