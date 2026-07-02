"use client";

import React, { useState } from 'react';
import axios from '@/lib/axios';
import { Star } from 'lucide-react';

interface PostSessionFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
  teacherId: number;
}

const QUESTIONS = [
  "How clear was the teacher's explanation?",
  "How engaging was the session?",
  "How well did the teacher answer your questions?",
  "How was the pace of the lesson?",
  "How organized was the session?",
  "How helpful were the visual aids/materials?",
  "How comfortable did you feel participating?",
  "How relevant was the content to your goals?",
  "Overall satisfaction with this session?"
];

export default function PostSessionFeedbackModal({ isOpen, onClose, sessionId, teacherId }: PostSessionFeedbackModalProps) {
  const [ratings, setRatings] = useState<number[]>(Array(9).fill(0));
  const [hoveredRatings, setHoveredRatings] = useState<number[]>(Array(9).fill(0));
  const [textComment, setTextComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStarClick = (questionIndex: number, rating: number) => {
    const newRatings = [...ratings];
    newRatings[questionIndex] = rating;
    setRatings(newRatings);
  };

  const handleStarHover = (questionIndex: number, rating: number) => {
    const newHovered = [...hoveredRatings];
    newHovered[questionIndex] = rating;
    setHoveredRatings(newHovered);
  };

  const handleStarLeave = (questionIndex: number) => {
    const newHovered = [...hoveredRatings];
    newHovered[questionIndex] = 0;
    setHoveredRatings(newHovered);
  };

  const handleSubmit = async () => {
    if (ratings.includes(0)) {
      alert("Please provide a rating for all questions.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        session: sessionId,
        teacher: teacherId,
        text_comment: textComment
      };
      
      // Dynamically map ratings to qX_rating fields
      ratings.forEach((rating, index) => {
        payload[`q${index + 1}_rating`] = rating;
      });
      
      await axios.post('/feedbacks/', payload);
      alert("Thank you for your feedback!");
      onClose();
    } catch (err: any) {
      console.error(err);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-white">Session Feedback</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
          <p className="text-slate-300">
            Please rate your experience in today's session. Your feedback helps us improve!
          </p>

          <div className="space-y-6">
            {QUESTIONS.map((question, qIndex) => (
              <div key={qIndex} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                <p className="text-white mb-3 text-sm md:text-base">{qIndex + 1}. {question}</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoveredRatings[qIndex] || ratings[qIndex]) >= star;
                    return (
                      <Star
                        key={star}
                        className={`w-8 h-8 cursor-pointer transition-all ${
                          isFilled ? 'fill-emerald-500 text-emerald-500 scale-110' : 'text-slate-600 hover:text-emerald-400/50'
                        }`}
                        onMouseEnter={() => handleStarHover(qIndex, star)}
                        onMouseLeave={() => handleStarLeave(qIndex)}
                        onClick={() => handleStarClick(qIndex, star)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
            <label className="block text-white mb-3 text-sm md:text-base">Additional Comments (Optional)</label>
            <textarea
              value={textComment}
              onChange={(e) => setTextComment(e.target.value)}
              placeholder="Tell us what you loved or what could be better..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-h-[100px]"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-4 sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-8 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(5,150,105,0.4)] ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
