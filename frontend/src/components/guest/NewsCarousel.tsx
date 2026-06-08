"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import useSWR from 'swr';
import { fetcher as apiFetcher } from '@/lib/api';

const AUTO_PLAY_INTERVAL = 5000;
const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2364748b">No Image</text></svg>';

export default function NewsCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const locale = useLocale();

  const { data, isLoading, error } = useSWR('/announcements/', apiFetcher);
  
  const slides = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);

  const goTo = useCallback((index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current]);

  const next = useCallback(() => {
    if (slides.length === 0) return;
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    if (slides.length === 0) return;
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-[250px] md:h-[350px] rounded-3xl bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || slides.length === 0) {
    return (
      <div className="relative w-full h-[250px] md:h-[350px] rounded-3xl overflow-hidden bg-slate-900 flex items-center justify-center border border-white/5 shadow-2xl">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-300 mb-2">
            {locale === 'ar' ? 'أكاديمية نور النبوة' : 'Noor Al Nubuwwah Academy'}
          </h3>
          <p className="text-slate-500">
            {locale === 'ar' ? 'مرحباً بك في منصتنا التعليمية' : 'Welcome to our learning platform'}
          </p>
        </div>
      </div>
    );
  }

  const slide = slides[current] || slides[0];

  return (
    <div className="relative w-full h-[250px] md:h-[350px] rounded-3xl overflow-hidden shadow-2xl group" id="news-carousel">
      <div className="relative w-full h-full bg-slate-900">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0"
          >
            <img
              src={slide.image_url}
              alt="Announcement"
              className="object-cover w-full h-full"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
            
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 pointer-events-none">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <span className="inline-block px-3 py-1 rounded-full bg-primary/80 text-white text-xs font-bold mb-3 border border-primary/30 backdrop-blur-md shadow-lg shadow-black/20">
                  {locale === 'ar' ? 'إعلان' : 'Announcement'}
                </span>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10"
          >
            <ChevronRight size={22} />
          </button>

          <div className="absolute bottom-4 right-8 md:right-10 flex items-center gap-2 z-10">
            {slides.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`
                  h-2 rounded-full transition-all duration-500
                  ${i === current
                    ? 'w-8 bg-primary shadow-lg shadow-primary/40'
                    : 'w-2 bg-white/30 hover:bg-white/50'
                  }
                `}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
