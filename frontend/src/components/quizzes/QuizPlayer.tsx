"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, ChevronRight, ChevronLeft, Flag } from 'lucide-react';

const MOCK_QUIZ = {
  title: "Week 1 Assessment: Purity Rules",
  timeLimitSeconds: 600, // 10 minutes
  questions: [
    {
      id: 1,
      text: "Which of the following is considered 'Absolute Water' (Ma' Mutlaq)?",
      choices: [
        { id: 'a', text: "Rose Water" },
        { id: 'b', text: "Rainwater" },
        { id: 'c', text: "Water mixed with soap changing its color" },
        { id: 'd', text: "Fruit Juice" }
      ]
    },
    {
      id: 2,
      text: "If a small amount of impurity falls into a large body of water (like a lake), and does not change its color, taste, or smell, the water is considered:",
      choices: [
        { id: 'a', text: "Impure (Najis)" },
        { id: 'b', text: "Pure but unusable for Wudu" },
        { id: 'c', text: "Pure and purifying (Tahir/Mutahhir)" },
        { id: 'd', text: "Doubtful (Makruh)" }
      ]
    }
  ]
};

export default function QuizPlayer() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(MOCK_QUIZ.timeLimitSeconds);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Timer Logic
  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSelect = (choiceId: string) => {
    setAnswers({ ...answers, [MOCK_QUIZ.questions[currentIdx].id]: choiceId });
  };

  const handleSubmit = () => {
    // In production, send `answers` object to backend API
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-8">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Assessment Submitted!</h2>
          <p className="text-slate-500 mb-8">Your answers have been securely transmitted to the server for auto-grading.</p>
          <button className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/30">
            Return to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  const question = MOCK_QUIZ.questions[currentIdx];
  const isLastQuestion = currentIdx === MOCK_QUIZ.questions.length - 1;
  const progressPercentage = ((currentIdx + 1) / MOCK_QUIZ.questions.length) * 100;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 min-h-screen">
      
      {/* Quiz Header */}
      <header className="glass-header px-8 py-5 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{MOCK_QUIZ.title}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
            <span>Question {currentIdx + 1} of {MOCK_QUIZ.questions.length}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="flex items-center gap-1 font-mono text-secondary font-bold">
              <Clock size={14} /> {formatTime(timeLeft)}
            </span>
          </div>
        </div>
        <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
          <Flag size={18} /> <span className="text-sm font-medium">Flag for review</span>
        </button>
      </header>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-200 dark:bg-slate-800">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main Question Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-3xl"
          >
            <h2 className="text-2xl md:text-3xl font-medium text-slate-900 dark:text-white mb-10 leading-relaxed">
              {question.text}
            </h2>

            <div className="space-y-4">
              {question.choices.map((choice) => {
                const isSelected = answers[question.id] === choice.id;
                return (
                  <label 
                    key={choice.id}
                    className={`
                      relative flex items-center p-5 rounded-2xl cursor-pointer border-2 transition-all duration-200
                      ${isSelected 
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md shadow-primary/10' 
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 me-4 shrink-0">
                      {isSelected && <motion.div layoutId="radio-fill" className="w-3 h-3 bg-primary rounded-full" />}
                    </div>
                    <input 
                      type="radio" 
                      name={`question-${question.id}`} 
                      value={choice.id} 
                      className="hidden"
                      onChange={() => handleSelect(choice.id)}
                    />
                    <span className={`text-lg ${isSelected ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                      {choice.text}
                    </span>
                  </label>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <footer className="glass-panel rounded-none border-x-0 border-b-0 px-8 py-5 flex items-center justify-between z-20">
        <button 
          onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <ChevronLeft size={20} /> Previous
        </button>

        {!isLastQuestion ? (
          <button 
            onClick={() => setCurrentIdx(prev => prev + 1)}
            disabled={!answers[question.id]}
            className="flex items-center gap-2 px-8 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={20} />
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            disabled={!answers[question.id]}
            className="flex items-center gap-2 px-10 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Assessment <CheckCircle2 size={20} />
          </button>
        )}
      </footer>

    </div>
  );
}
