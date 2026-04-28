import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CreditCard, X } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';

interface RestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle?: string;
}

export default function RestrictionModal({ isOpen, onClose, courseTitle }: RestrictionModalProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
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
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />

              <button
                onClick={onClose}
                className={`absolute top-4 ${isAr ? 'left-4' : 'right-4'} p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10`}
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                  <Lock className="w-8 h-8 text-red-500" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                  {isAr ? 'عذراً، هذا المحتوى مقفل' : 'Content Locked'}
                </h2>
                
                <p className="text-slate-400 mb-8 leading-relaxed">
                  {isAr 
                    ? `يرجى الاشتراك في الدورة ${courseTitle ? `"${courseTitle}"` : ''} أولاً للوصول إلى هذا المحتوى.`
                    : `Please subscribe to ${courseTitle ? `the course "${courseTitle}"` : 'this course'} first to access the content.`}
                </p>

                <div className="flex flex-col gap-3 w-full">
                  <Link 
                    href="/learning" 
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:-translate-y-0.5"
                    onClick={onClose}
                  >
                    <CreditCard size={18} />
                    {isAr ? 'الذهاب للاشتراك (التعلم الذاتي)' : 'Go to Subscribe (Self Learning)'}
                  </Link>
                  
                  <button 
                    onClick={onClose}
                    className="w-full py-3.5 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all border border-white/5"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
