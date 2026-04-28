"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Lock, CheckCircle2, Package, Layers, Building, Smartphone, X, ArrowLeft, Loader2 } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useCartStore } from '@/store/cartStore';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import EmptyState from '@/components/ui/EmptyState';



// Coming Soon Modal Component
function ComingSoonModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
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
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl" />

            <button
              onClick={onClose}
              className={`absolute top-4 ${isAr ? 'left-4' : 'right-4'} p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10`}
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <Lock className="w-8 h-8 text-amber-500" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                {isAr ? 'ستضاف هذه الخدمة قريباً' : 'Feature Coming Soon'}
              </h2>
              
              <p className="text-slate-400 mb-8 leading-relaxed">
                {isAr 
                  ? 'طرق الدفع قيد المراجعة والإعداد من قبل الإدارة. سيتم تفعيلها قريباً.'
                  : 'Payment methods are currently being configured by the administration. They will be activated soon.'}
              </p>

              <button 
                onClick={onClose}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-0.5"
              >
                {isAr ? 'حسناً، فهمت' : 'Okay, I understand'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function PaymentPortal() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();
  
  const { cartItems } = useCartStore();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  const fetcher = (url: string) => fetch(url, {
    headers: { Authorization: `Bearer ${session?.accessToken}` }
  }).then(res => res.json());

  const { data: methodsData } = useSWR(
    session?.accessToken ? 'http://localhost:8000/api/payments/methods/' : null,
    fetcher
  );
  const paymentMethods = methodsData?.results || methodsData || [];
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [subscriptionType, setSubscriptionType] = useState<'bundle' | 'specific'>('bundle');
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);

  const coursesCount = mounted ? cartItems.length : 0;
  const totalPrice = mounted ? cartItems.reduce((sum, item) => sum + item.price, 0) : 0;
  
  useEffect(() => {
    if (coursesCount > 0) {
      setSubscriptionType('specific');
    }
  }, [coursesCount]);

  const handleMethodClick = () => {
    setIsComingSoonOpen(true);
  };

  const getIcon = (type: string) => {
    if (type === 'smartphone') return <Smartphone className="w-8 h-8 text-white" />;
    return <Building className="w-8 h-8 text-white" />;
  };

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 lg:p-10 hide-scrollbar flex justify-center">
        
        <div className="w-full max-w-5xl">
          <header className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2"
              >
                {isAr ? 'بوابة الدفع' : 'Payment Portal'}
              </motion.h1>
              <p className="text-slate-500 dark:text-slate-400">
                {isAr ? 'اختر خطة الاشتراك وطريقة الدفع المناسبة' : 'Select your subscription plan and preferred payment method.'}
              </p>
            </div>
            
            {/* Back to Catalog Fallback */}
            <button 
              onClick={() => router.push('/learning')}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 transition-colors"
            >
              <ArrowLeft size={16} className={isAr ? 'rotate-180' : ''} />
              {isAr ? 'العودة للدورات' : 'Back to Catalog'}
            </button>
          </header>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            
            {/* Left Column: Plan & Method Selection */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Step 1: Subscription Type */}
              <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-black">1</span>
                  {isAr ? 'خطة الاشتراك' : 'Subscription Plan'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bundle Option */}
                  <button
                    onClick={() => setSubscriptionType('bundle')}
                    className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
                      subscriptionType === 'bundle' 
                        ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--tw-colors-primary),0.2)]' 
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {subscriptionType === 'bundle' && (
                      <div className="absolute top-4 right-4 text-primary">
                        <CheckCircle2 size={24} className="fill-primary/20" />
                      </div>
                    )}
                    <Package className={`w-10 h-10 mb-4 ${subscriptionType === 'bundle' ? 'text-primary' : 'text-slate-400'}`} />
                    <h4 className="text-lg font-bold text-white mb-1">
                      {isAr ? 'الباقة الشاملة' : 'Full Bundle'}
                    </h4>
                    <p className="text-sm text-slate-400">
                      {isAr ? 'الوصول لجميع الدورات الحالية والمستقبلية' : 'Access to all current and future courses'}
                    </p>
                  </button>

                  {/* Specific Courses Option */}
                  <button
                    onClick={() => {
                      setSubscriptionType('specific');
                      if (coursesCount === 0) router.push('/learning');
                    }}
                    className={`relative p-6 rounded-2xl border-2 text-left transition-all flex flex-col ${
                      subscriptionType === 'specific' 
                        ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {subscriptionType === 'specific' && (
                      <div className="absolute top-4 right-4 text-blue-500">
                        <CheckCircle2 size={24} className="fill-blue-500/20" />
                      </div>
                    )}
                    <Layers className={`w-10 h-10 mb-4 ${subscriptionType === 'specific' ? 'text-blue-500' : 'text-slate-400'}`} />
                    <h4 className="text-lg font-bold text-white mb-1">
                      {isAr ? 'دورات محددة' : 'Specific Courses'}
                    </h4>
                    <p className="text-sm text-slate-400 mb-4 flex-1">
                      {isAr ? 'اختر الدورات التي تناسبك فقط' : 'Select only the courses you need'}
                    </p>
                    
                    {coursesCount > 0 ? (
                      <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold w-fit">
                        {coursesCount} {isAr ? 'دورات في السلة' : 'in Cart'}
                      </span>
                    ) : (
                      <span className="inline-block text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                        {isAr ? 'الذهاب للاختيار ←' : 'Go select courses →'}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Step 2: Payment Method */}
              <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-black">2</span>
                  {isAr ? 'طريقة الدفع' : 'Payment Method'}
                </h3>

                <div className="flex flex-col gap-4">
                  {paymentMethods.length > 0 ? paymentMethods.map((method: any) => (
                    <button
                      key={method.id}
                      onClick={handleMethodClick}
                      className="flex items-center gap-4 p-4 rounded-2xl border-2 border-white/5 bg-slate-800/50 hover:bg-slate-800 transition-all cursor-pointer group"
                    >
                      <div className="p-3 rounded-xl bg-slate-700 group-hover:scale-105 transition-transform">
                        {getIcon(method.iconType || 'smartphone')}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="text-white font-bold text-lg">{isAr ? method.nameAr || method.name : method.name}</h4>
                        <p className="text-slate-400 text-sm">{method.description}</p>
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 border-slate-600 flex items-center justify-center">
                      </div>
                    </button>
                  )) : (
                    <div className="text-center p-8 text-slate-500">
                      <Lock className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                      <p className="font-medium">{isAr ? 'لم يتم تفعيل طرق الدفع بعد' : 'No payment methods configured yet'}</p>
                      <p className="text-sm mt-1">{isAr ? 'ستتم إضافتها قريباً من الإدارة' : 'They will be added by the administration soon.'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Invoice & Submission Form */}
            <div className="lg:col-span-5 relative space-y-6">
              
              {/* Dynamic Invoice Section */}
              <AnimatePresence>
                {subscriptionType === 'specific' && coursesCount > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-panel p-6 rounded-3xl border border-white/5 overflow-hidden"
                  >
                    <h3 className="text-xl font-bold text-white mb-4">
                      {isAr ? 'فاتورة المشتريات' : 'Invoice'}
                    </h3>
                    <div className="space-y-3 mb-6 max-h-60 overflow-y-auto hide-scrollbar pr-2">
                      {cartItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-sm">{isAr ? item.titleAr : item.title}</h4>
                          </div>
                          <div className="text-primary font-bold text-sm ml-4">
                            ${item.price}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                      <span className="text-slate-400 font-medium">{isAr ? 'الإجمالي' : 'Total Amount'}</span>
                      <span className="text-3xl font-black text-primary drop-shadow-md">${totalPrice}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submission Form (Blocked / Blurred Out) */}
              <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 opacity-40 select-none overflow-hidden relative min-h-[300px]">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-600 text-white text-sm font-black">3</span>
                  {isAr ? 'تأكيد الدفع' : 'Confirm Payment'}
                </h3>

                <div className="space-y-6 blur-[2px]">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">
                      {isAr ? 'رقم التحويل / العملية' : 'Transaction ID / Reference'}
                    </label>
                    <div className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 h-12"></div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">
                      {isAr ? 'إيصال الدفع (صورة)' : 'Payment Receipt (Screenshot)'}
                    </label>
                    <div className="w-full h-32 border-2 border-dashed border-white/20 bg-black/10 rounded-xl"></div>
                  </div>

                  <div className="w-full py-4 bg-slate-700 rounded-xl h-14"></div>
                </div>

                {/* Overlay covering the entire form */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[1px]">
                  <Lock className="w-12 h-12 text-slate-400 mb-3 drop-shadow-lg" />
                  <p className="text-slate-300 font-bold text-lg text-center px-4 drop-shadow-md">
                    {isAr ? 'مغلق مؤقتاً' : 'Temporarily Locked'}
                  </p>
                </div>
              </div>
            </div>

          </motion.div>
        </div>

      </main>

      {/* Feature Coming Soon Modal */}
      <ComingSoonModal 
        isOpen={isComingSoonOpen} 
        onClose={() => setIsComingSoonOpen(false)} 
      />
    </div>
  );
}
