"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { DICTIONARY } from '@/locales/dictionary';
import Image from 'next/image';

const SLIDES = [
  { image: '/images/carousel/slide1.png', titleKey: 'news1Title', descKey: 'news1Desc' },
  { image: '/images/carousel/slide2.png', titleKey: 'news2Title', descKey: 'news2Desc' },
  { image: '/images/carousel/slide3.png', titleKey: 'news3Title', descKey: 'news3Desc' },
];

const AUTO_PLAY_INTERVAL = 5000;

export default function NewsCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const locale = useLocale();
  const t = (DICTIONARY[locale as 'en' | 'ar'] as any)?.guest || (DICTIONARY.en as any).guest;

  const goTo = useCallback((index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(next, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [next]);

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

  const slide = SLIDES[current];
  const title = t[slide.titleKey as keyof typeof t] || '';
  const desc = t[slide.descKey as keyof typeof t] || '';

  return (
    <div className="relative w-full h-[250px] md:h-[350px] rounded-3xl overflow-hidden shadow-2xl group" id="news-carousel">
      {/* Slide container */}
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
            {/* Background image */}
            <Image
              src={slide.image}
              alt={title}
              fill
              className="object-cover"
              priority={current === 0}
            />

            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

            {/* Text content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold mb-3 border border-primary/30 backdrop-blur-sm">
                  {locale === 'ar' ? 'إعلان' : 'Announcement'}
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg max-w-2xl">
                  {title}
                </h3>
                <p className="text-white/70 text-sm md:text-base max-w-xl leading-relaxed drop-shadow">
                  {desc}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10"
        id="carousel-prev"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10"
        id="carousel-next"
      >
        <ChevronRight size={22} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 right-8 md:right-10 flex items-center gap-2 z-10">
        {SLIDES.map((_, i) => (
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
    </div>
  );
}
