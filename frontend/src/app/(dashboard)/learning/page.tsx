"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Clock, User, BookOpen, Download, ShoppingCart, CheckCircle2, ChevronRight, Plus, X, Loader2 } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { DICTIONARY } from '@/locales/dictionary';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { useUserRole } from '@/hooks/useUserRole';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import EmptyState from '@/components/ui/EmptyState';



function GuestSubscribeModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900/90 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl" />

            <button
              onClick={onClose}
              className={`absolute top-4 ${isAr ? 'left-4' : 'right-4'} p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10`}
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.027 6.988 2.895a9.86 9.86 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                {isAr ? 'حساب زائر' : 'Guest Account'}
              </h2>
              
              <p className="text-slate-400 mb-8 leading-relaxed">
                {isAr 
                  ? 'للاشتراك في المنصة كطالب، يرجى التواصل مع الأكاديمية'
                  : 'To subscribe to the platform as a student, please contact the academy.'}
              </p>

              <a 
                href="https://wa.me/201062582736" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.027 6.988 2.895a9.86 9.86 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                {isAr ? 'تواصل عبر واتساب' : 'Contact via WhatsApp'}
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LearningPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();
  
  const { cartItems, addToCart, removeFromCart } = useCartStore();
  const { isGuest } = useUserRole();
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const { data: session } = useSession();

  const fetcher = (url: string) => fetch(url, {
    headers: { Authorization: `Bearer ${session?.accessToken}` }
  }).then(res => res.json());

  const { data: courses, error, isLoading } = useSWR(
    session?.accessToken ? 'http://localhost:8000/api/courses/' : null,
    fetcher
  );
  
  // Hydration fix for Zustand persist
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Ghost Cart Cleanup: prune stale cart items that reference non-existent courses
  useEffect(() => {
    if (!mounted || !courses) return;
    const validIds = new Set(courses.map((c: any) => String(c.id)));
    cartItems.forEach(item => {
      if (!validIds.has(String(item.id))) {
        removeFromCart(item.id);
      }
    });
  }, [mounted, courses]); // eslint-disable-line react-hooks/exhaustive-deps

  const itemCount = cartItems.length;
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = () => {
    if (itemCount > 0) {
      router.push('/payment');
    }
  };

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 flex flex-col p-4 lg:p-8 overflow-y-auto hide-scrollbar pb-32">
        
        <header className="mb-8 flex items-center justify-between">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2"
            >
              {isAr ? 'التعلم الذاتي' : 'Self Learning'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 dark:text-slate-400"
            >
              {isAr 
                ? (isGuest ? 'تصفح الدورات المتاحة للاشتراك' : 'اختر الدورات التي ترغب بالاشتراك بها.') 
                : (isGuest ? 'Browse available courses for subscription.' : 'Select the courses you want to subscribe to.')}
            </motion.p>
          </div>
        </header>

        {/* Courses Grid Layout */}
        <div className="flex-1 min-h-0">
          {isLoading ? (
             <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
          ) : error ? (
             <div className="text-red-500">Failed to load courses.</div>
          ) : !courses || courses.length === 0 ? (
             <EmptyState 
               title={isAr ? 'لا توجد دورات منشورة بعد' : 'No courses published yet'}
               description={isAr ? 'عد لاحقاً لرؤية الدورات الجديدة.' : 'Check back later for new courses.'}
               icon="folder"
             />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {courses.map((course: any, idx: number) => {
                const isSelected = mounted ? cartItems.some(item => item.id === course.id) : false;

                return (
                  <motion.div 
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      if (isGuest) {
                        setIsGuestModalOpen(true);
                      }
                    }}
                    className={`
                      group rounded-2xl overflow-hidden transition-all duration-300 relative flex flex-col
                      ${isGuest ? 'cursor-pointer shadow-xl hover:shadow-2xl border border-white/5 hover:border-white/20 hover:-translate-y-1' : 
                        isSelected 
                        ? 'shadow-[0_0_20px_rgba(var(--tw-colors-primary),0.15)] border border-primary/30' 
                        : 'shadow-xl hover:shadow-2xl border border-white/5 hover:border-white/20'
                      }
                    `}
                  >
                    <div className={`glass-panel h-full flex flex-col bg-gradient-to-br ${course.color || 'from-blue-500/20 to-indigo-600/20'} relative`}>
                      
                      <div className="p-6 pb-0 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10">
                            <BookOpen className={`w-6 h-6 ${!isGuest && isSelected ? 'text-primary' : 'text-white'}`} />
                          </div>
                          
                          {/* Course Price Tag */}
                          <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 text-white font-black text-lg shadow-inner z-10">
                            ${course.price}
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">
                          {isAr ? course.title_ar || course.title : course.title}
                        </h3>
                        <p className="text-slate-300 text-sm mb-6 flex items-center gap-2">
                          <User size={14} /> {course.instructor || 'Academy Instructor'}
                        </p>
                      </div>

                      <div className="p-6 pt-0 flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Clock size={16} />
                          {course.duration || 'Flexible'}
                        </div>
                        
                        {/* Add to Cart / Remove Button (STUDENT ONLY) */}
                        {!isGuest && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSelected) {
                                removeFromCart(course.id);
                              } else {
                                addToCart(course);
                              }
                            }}
                            className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                              isSelected 
                                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20' 
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:border-white/30'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <X size={18} />
                                {isAr ? 'إزالة من السلة' : 'Remove from Cart'}
                              </>
                            ) : (
                              <>
                                <ShoppingCart size={18} />
                                {isAr ? 'أضف إلى السلة' : 'Add to Cart'}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      
                      {/* Active Overlay when selected (STUDENT ONLY) */}
                      <AnimatePresence>
                        {!isGuest && isSelected && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-primary/5 pointer-events-none" 
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* Floating Checkout Bar (STUDENT ONLY) */}
      <AnimatePresence>
        {!isGuest && mounted && itemCount > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
            className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50"
          >
            <div className="backdrop-blur-md bg-slate-900/90 rounded-2xl shadow-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Bouncing Badge */}
                <motion.div 
                  key={itemCount}
                  initial={{ scale: 1.5, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', bounce: 0.6 }}
                  className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center text-primary font-black text-2xl border-2 border-primary shadow-[0_0_15px_rgba(var(--tw-colors-primary),0.3)]"
                >
                  {itemCount}
                </motion.div>
                <div>
                  <h4 className="text-white font-bold text-lg flex items-center gap-2">
                    <ShoppingCart size={18} className="text-primary" />
                    {isAr ? 'في السلة' : 'In Cart'}
                  </h4>
                  <p className="text-primary font-black text-3xl drop-shadow-md">
                    ${totalPrice}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleCheckout}
                className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-primary to-orange-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105 flex items-center justify-center gap-2 group"
              >
                {isAr ? 'الذهاب للدفع' : 'Proceed to Checkout'}
                <ChevronRight className={`group-hover:translate-x-1 transition-transform ${isAr ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Guest Subscription Request Modal */}
      <GuestSubscribeModal 
        isOpen={isGuestModalOpen} 
        onClose={() => setIsGuestModalOpen(false)} 
      />
    </div>
  );
}
