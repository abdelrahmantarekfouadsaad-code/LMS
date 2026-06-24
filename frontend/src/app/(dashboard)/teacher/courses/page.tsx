"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import useSWR from 'swr';
import axios from '@/lib/axios';
import { useTranslation } from '@/i18n/TranslationContext';
import { Loader2, Search, UserPlus, UserMinus, AlertTriangle, CheckCircle2, X, BookOpen, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

// ═══════════════════════════════════════════════════════
// TEACHER COURSES PAGE — Scoped to assigned courses only
// ═══════════════════════════════════════════════════════

export default function TeacherCoursesPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  // Backend now scopes /courses/ to only teacher-assigned courses
  const { data: courses = [], mutate, isLoading } = useSWR('/courses/', fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false
  });

  const filteredCourses = courses.filter((c: any) => filter === 'ALL' || c.target_age === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 font-sans">
      {/* Header — NO "Add Course" button for teachers */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('admin.courses.title')}</h1>
          <p className="text-slate-400 mt-2">{t('admin.courses.subtitle')}</p>
        </div>
      </div>

      {/* Filter Slider */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        {['ALL', 'CHILDREN', 'TWEENS', 'TEENS'].map(age => (
          <button
            type="button"
            key={age}
            onClick={() => setFilter(age)}
            className={`px-6 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 text-sm font-medium ${
              filter === age
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            {age === 'ALL' ? t('admin.courses.all') : age === 'CHILDREN' ? t('admin.courses.children') : age === 'TWEENS' ? t('admin.courses.tweens') : t('admin.courses.teens')}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.map((course: any, idx: number) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.4 }}
            className="group bg-slate-900/50 rounded-2xl shadow-lg border border-slate-800/60 overflow-hidden hover:shadow-xl hover:border-emerald-500/30 hover:shadow-emerald-500/5 transition-all duration-300 cursor-pointer"
            onClick={() => { setEditingCourse(course); setIsModalOpen(true); }}
          >
            <div className="h-48 bg-slate-800 relative overflow-hidden">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2364748b">No Image</text></svg>';
                  }}
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${course.color || 'from-slate-800 to-slate-700'}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
              <div className="absolute top-4 end-4">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm backdrop-blur-md ${course.is_upload_completed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                  {course.is_upload_completed ? t('admin.courses.uploadComplete') : t('admin.courses.uploadIncomplete')}
                </span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{course.title}</h3>
              <p className="text-slate-400 text-sm mb-4 line-clamp-2">{course.description}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/60">
                <span className="text-white font-bold">{course.price > 0 ? `${course.price} KD` : t('admin.courses.free')}</span>
                <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-1 rounded">{course.course_format}</span>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredCourses.length === 0 && (
          <div className="col-span-full text-center py-16 bg-slate-900/40 border border-slate-800/40 rounded-2xl">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-700" />
            <p className="text-slate-500 text-lg">{t('admin.courses.noCourses')}</p>
          </div>
        )}
      </div>

      {/* Edit Modal (no create — teachers can only edit assigned courses) */}
      <AnimatePresence>
        {isModalOpen && editingCourse && (
          <CourseModal
            initialData={editingCourse}
            onClose={() => {
              setIsModalOpen(false);
              setEditingCourse(null);
            }}
            onSuccess={async () => {
              await mutate();
              setIsModalOpen(false);
              setEditingCourse(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// COURSE EDIT MODAL — 4-Tab Wizard
// Tab 1: Basic Info + Cohorts
// Tab 2: Course Format
// Tab 3: Course Content (Zoom sessions + Recorded lessons)
// Tab 4: Students Management (with age gating & live API)
// ═══════════════════════════════════════════════════════

type FormValues = {
  title: string;
  description: string;
  target_age_min: number;
  target_age_max: number;
  price: number;
  thumbnail: string;
  instructor_name: string;
  is_upload_completed: boolean;
  course_format: string;
  course_structure: string;
  groups: { id?: number; name: string; official_day: number; official_time: string; capacity: number; primary_teacher_email: string; zoom_sessions: { title: string; scheduled_time: string; meeting_link: string }[] }[];
  units: { title: string; lessons: { title: string; video_url: string; pdf_attachment: string; is_quiz: boolean; estimated_minutes: number }[] }[];
  flat_lessons: { title: string; video_url: string; pdf_attachment: string; is_quiz: boolean; estimated_minutes: number }[];
};

const STEP_LABELS = ['Basic Info', 'Format', 'Content', 'Students'];

function CourseModal({ onClose, onSuccess, initialData }: { onClose: () => void; onSuccess: () => Promise<void> | void; initialData: any }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
    defaultValues: initialData || {
      target_age_min: 0,
      target_age_max: 99,
      course_format: 'VIDEO_ONLY',
      course_structure: 'SHORT_FLAT',
      groups: [],
      units: [],
      flat_lessons: [],
      instructor_name: 'أكاديمية نور النبوة',
      is_upload_completed: false
    }
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const { fields: groupFields, append: appendGroup, remove: removeGroup } = useFieldArray({ control, name: "groups" });
  const { fields: unitFields, append: appendUnit, remove: removeUnit } = useFieldArray({ control, name: "units" });
  const { fields: flatLessonFields, append: appendFlatLesson, remove: removeFlatLesson } = useFieldArray({ control, name: "flat_lessons" });

  const courseFormat = watch('course_format');
  const courseStructure = watch('course_structure');

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (initialData?.id) {
        await axios.put(`/courses/${initialData.id}/`, data);
      }
      await onSuccess();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data || err.message;
      alert('Error saving: \n' + JSON.stringify(errorMsg, null, 2));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh] text-white rounded-2xl shadow-2xl"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur-xl shrink-0">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            {t('admin.courses.editCourse')}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4 pb-2 flex gap-2 shrink-0">
          {STEP_LABELS.map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(idx + 1)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                step === idx + 1
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/40 text-slate-500 border border-slate-800/60 hover:text-slate-300'
              }`}
            >
              {idx + 1}. {label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="course-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }} className="space-y-6">

            {/* ════════ STEP 1: Basic Info ════════ */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">{t('admin.courses.basicInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">{t('admin.courses.courseTitle')}</label>
                    <input {...register('title', { required: true })} className="w-full p-3 bg-slate-800/60 border border-slate-700/50 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none text-white rounded-xl transition-all" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Min Age</label>
                      <input type="number" {...register('target_age_min')} className="w-full p-3 bg-slate-800/60 border border-slate-700/50 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white rounded-xl" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Max Age</label>
                      <input type="number" {...register('target_age_max')} className="w-full p-3 bg-slate-800/60 border border-slate-700/50 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white rounded-xl" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">{t('admin.courses.description')}</label>
                    <textarea {...register('description', { required: true })} rows={3} className="w-full p-3 bg-slate-800/60 border border-slate-700/50 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white rounded-xl resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">{t('admin.courses.price')}</label>
                    <input type="number" step="0.01" {...register('price')} className="w-full p-3 bg-slate-800/60 border border-slate-700/50 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">{t('admin.courses.instructorName')}</label>
                    <input type="text" {...register('instructor_name')} className="w-full p-3 bg-slate-800/60 border border-slate-700/50 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white rounded-xl" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">{t('admin.courses.thumbnailUrl')}</label>
                    <input type="text" {...register('thumbnail')} placeholder="https://..." className="w-full p-3 bg-slate-800/60 border border-slate-700/50 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white rounded-xl" dir="ltr" />
                  </div>
                </div>

                {/* Cohorts Section */}
                <div className="mt-6">
                  <h4 className="text-base font-bold text-slate-200 mb-4">{t('admin.courses.cohorts')}</h4>
                  {groupFields.map((field, index) => (
                    <div key={field.id} className="mb-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/40">
                      <div className="flex items-center gap-3 mb-3">
                        <input {...register(`groups.${index}.name`)} placeholder={t('admin.courses.cohortPlaceholder')} className="flex-1 p-3 bg-slate-900/60 border border-slate-700/50 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white rounded-xl" />
                        {index > 0 && (
                          <button type="button" onClick={() => removeGroup(index)} className="text-red-400 hover:bg-red-500/20 px-4 py-3 rounded-xl transition-colors text-sm">{t('admin.courses.delete')}</button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Official Day</label>
                          <select {...register(`groups.${index}.official_day`)} className="w-full p-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-white text-sm focus:ring-emerald-500/50">
                            <option value={0}>Monday</option>
                            <option value={1}>Tuesday</option>
                            <option value={2}>Wednesday</option>
                            <option value={3}>Thursday</option>
                            <option value={4}>Friday</option>
                            <option value={5}>Saturday</option>
                            <option value={6}>Sunday</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Official Time</label>
                          <input type="time" {...register(`groups.${index}.official_time`)} className="w-full p-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-white text-sm [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Capacity</label>
                          <input type="number" {...register(`groups.${index}.capacity`)} className="w-full p-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-white text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Teacher Email</label>
                          <input type="email" {...register(`groups.${index}.primary_teacher_email`)} readOnly tabIndex={-1} className="w-full p-2 bg-slate-800 border border-slate-700/50 rounded-lg text-slate-400 text-sm opacity-50 cursor-not-allowed" dir="ltr" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => appendGroup({ name: '', official_day: 0, official_time: '18:00', capacity: 25, primary_teacher_email: '', zoom_sessions: [] })} className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors">{t('admin.courses.addCohort')}</button>
                </div>
              </div>
            )}

            {/* ════════ STEP 2: Format ════════ */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">{t('admin.courses.courseFormat')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { val: 'VIDEO_ONLY', label: t('admin.courses.formatVideoOnly'), desc: t('admin.courses.formatVideoOnlyDesc') },
                    { val: 'ZOOM_ONLY', label: t('admin.courses.formatZoomOnly'), desc: t('admin.courses.formatZoomOnlyDesc') },
                    { val: 'HYBRID', label: t('admin.courses.formatHybrid'), desc: t('admin.courses.formatHybridDesc') }
                  ].map(fmt => (
                    <div
                      key={fmt.val}
                      onClick={() => setValue('course_format', fmt.val)}
                      className={`cursor-pointer p-5 border-2 rounded-xl transition-all duration-200 ${
                        courseFormat === fmt.val
                          ? 'border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                          : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                      }`}
                    >
                      <div className={`font-bold text-lg mb-1 ${courseFormat === fmt.val ? 'text-emerald-400' : 'text-slate-300'}`}>{fmt.label}</div>
                      <div className="text-sm text-slate-500">{fmt.desc}</div>
                    </div>
                  ))}
                </div>

                {(courseFormat === 'VIDEO_ONLY' || courseFormat === 'HYBRID') && (
                  <div className="mt-6">
                    <h4 className="text-base font-bold text-slate-200 mb-4">{t('admin.courses.recordedStructure')}</h4>
                    <div className="flex gap-4">
                      {[
                        { val: 'SHORT_FLAT', label: t('admin.courses.structureShort'), desc: t('admin.courses.structureShortDesc') },
                        { val: 'LONG_NESTED', label: t('admin.courses.structureLong'), desc: t('admin.courses.structureLongDesc') }
                      ].map(str => (
                        <div
                          key={str.val}
                          onClick={() => setValue('course_structure', str.val)}
                          className={`flex-1 cursor-pointer p-4 border-2 rounded-xl transition-all duration-200 ${
                            courseStructure === str.val
                              ? 'border-emerald-500/60 bg-emerald-500/10'
                              : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                          }`}
                        >
                          <div className={`font-bold mb-1 ${courseStructure === str.val ? 'text-emerald-400' : 'text-slate-300'}`}>{str.label}</div>
                          <div className="text-sm text-slate-500">{str.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════ STEP 3: Content ════════ */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">{t('admin.courses.courseContent')}</h3>

                {/* Virtual Sessions */}
                {(courseFormat === 'ZOOM_ONLY' || courseFormat === 'HYBRID') && (
                  <div className="bg-slate-800/30 p-5 rounded-xl border border-indigo-500/20 mb-6">
                    <h4 className="font-bold text-indigo-400 text-base mb-4">{t('admin.courses.virtualSessions')}</h4>
                    {groupFields.map((group, gIndex) => (
                      <div key={group.id} className="mb-5 last:mb-0 bg-slate-900/40 p-4 rounded-xl border border-slate-800/40">
                        <div className="font-bold text-slate-300 mb-3 border-b border-slate-800/40 pb-2 text-sm">{t('admin.courses.cohort')} {watch(`groups.${gIndex}.name`) || `Group ${gIndex+1}`}</div>
                        <ZoomSessionsList control={control} register={register} gIndex={gIndex} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Recorded Content */}
                {(courseFormat === 'VIDEO_ONLY' || courseFormat === 'HYBRID') && (
                  <div className="bg-slate-800/30 p-5 rounded-xl border border-amber-500/20">
                    <h4 className="font-bold text-amber-400 text-base mb-4">{t('admin.courses.recordedContent')}</h4>

                    {courseStructure === 'SHORT_FLAT' ? (
                      <div className="space-y-3">
                        {flatLessonFields.map((field, lIndex) => (
                          <div key={field.id} className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/40 flex gap-3 items-start">
                            <div className="flex-1 space-y-2">
                              <input {...register(`flat_lessons.${lIndex}.title`, { required: true })} placeholder={t('admin.courses.lessonTitlePlaceholder')} className="w-full p-2.5 bg-slate-800/60 border border-slate-700/50 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white rounded-lg text-sm" />
                              <div className="flex gap-2">
                                <input {...register(`flat_lessons.${lIndex}.video_url`)} placeholder={t('admin.courses.videoUrlPlaceholder')} className="flex-1 p-2 text-xs bg-slate-800/60 border border-slate-700/50 outline-none text-white rounded-lg" dir="ltr" />
                                <input {...register(`flat_lessons.${lIndex}.pdf_attachment`)} placeholder={t('admin.courses.pdfUrlPlaceholder')} className="flex-1 p-2 text-xs bg-slate-800/60 border border-slate-700/50 outline-none text-white rounded-lg" dir="ltr" />
                                <label className="flex items-center text-xs gap-1.5 bg-slate-800/60 border border-slate-700/50 px-2.5 rounded-lg text-slate-300 whitespace-nowrap">
                                  <input type="checkbox" {...register(`flat_lessons.${lIndex}.is_quiz`)} className="rounded" />
                                  {t('admin.courses.isQuiz')}
                                </label>
                              </div>
                            </div>
                            <button type="button" onClick={() => removeFlatLesson(lIndex)} className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg transition-colors shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => appendFlatLesson({ title: '', video_url: '', pdf_attachment: '', is_quiz: false, estimated_minutes: 0 })} className="w-full py-3 bg-slate-800/30 border border-dashed border-slate-700/50 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors rounded-xl font-medium text-sm">
                          + Add Lesson
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {unitFields.map((field, uIndex) => (
                          <div key={field.id} className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/40">
                            <div className="flex justify-between mb-3">
                              <input {...register(`units.${uIndex}.title`, { required: true })} placeholder={t('admin.courses.unitTitlePlaceholder')} className="text-base font-bold p-2 border-b-2 border-slate-700/50 bg-transparent focus:border-emerald-500/50 outline-none text-white flex-1 me-4" />
                              <button type="button" onClick={() => removeUnit(uIndex)} className="text-red-400 text-sm hover:text-red-300 shrink-0">{t('admin.courses.deleteUnit')}</button>
                            </div>
                            <UnitLessonsList control={control} register={register} uIndex={uIndex} />
                          </div>
                        ))}
                        <button type="button" onClick={() => appendUnit({ title: '', lessons: [] })} className="w-full py-3 bg-slate-800/30 border border-dashed border-slate-700/50 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors rounded-xl font-bold text-sm">
                          + Add Unit
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <label className="flex items-center gap-3 cursor-pointer text-white">
                    <input type="checkbox" {...register('is_upload_completed')} className="w-5 h-5 rounded border-red-500/50 bg-slate-900 text-red-500 focus:ring-red-500" />
                    <span className="font-bold">{t('admin.courses.uploadConfirm')}</span>
                  </label>
                  <p className="text-red-400 text-sm mt-2 ms-8">{t('admin.courses.uploadWarning')}</p>
                </div>
              </div>
            )}

            {/* ════════ STEP 4: Students Management ════════ */}
            {step === 4 && (
              <StudentsTab
                courseId={initialData?.id}
                groups={groupFields}
                watchGroup={(idx: number) => watch(`groups.${idx}.name`)}
                minAge={watch('target_age_min')}
                maxAge={watch('target_age_max')}
              />
            )}
          </form>
        </div>

        {/* Footer Navigation */}
        <div className="p-5 border-t border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur-xl shrink-0">
          <div>
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors text-sm">
                {t('admin.courses.previous')}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {step < 4 && (
              <button type="button" disabled={isSubmitting} onClick={() => setStep(step + 1)} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors text-sm shadow-lg shadow-emerald-500/20">
                {t('admin.courses.next')}
              </button>
            )}
            {step === 4 && (
              <button type="submit" disabled={isSubmitting} form="course-form" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? t('admin.courses.saving') : t('admin.courses.saveCourse')}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}


// ═══════════════════════════════════════════════════════
// STUDENTS TAB — Fully wired with API integration
// ═══════════════════════════════════════════════════════

function StudentsTab({ courseId, groups, watchGroup, minAge, maxAge }: {
  courseId: number;
  groups: any[];
  watchGroup: (idx: number) => string;
  minAge: number;
  maxAge: number;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCohortId, setSelectedCohortId] = useState<number | ''>('');
  const [addStatus, setAddStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedGroupForView, setSelectedGroupForView] = useState<number | null>(null);

  // Fetch enrolled students for the selected group
  const { data: enrolledStudents = [], mutate: mutateStudents } = useSWR(
    selectedGroupForView ? `/course-groups/${selectedGroupForView}/students/` : null,
    fetcher
  );

  // Auto-select first group for enrollment display
  useEffect(() => {
    if (groups.length > 0 && !selectedGroupForView) {
      const firstGroup = groups[0] as any;
      if (firstGroup.id) setSelectedGroupForView(firstGroup.id);
    }
  }, [groups, selectedGroupForView]);

  // Debounced student search
  const searchStudents = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await axios.get(`/students/search/?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchStudents(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery, searchStudents]);

  const handleAddStudent = async (studentId: number, studentAge: number | null) => {
    setAddStatus(null);

    // Age gating validation
    if (studentAge !== null && studentAge !== undefined) {
      if (studentAge < minAge || studentAge > maxAge) {
        setAddStatus({
          type: 'error',
          message: `Age Gating Blocked: Student is ${studentAge} years old. Course requires ${minAge}–${maxAge} years.`
        });
        return;
      }
    }

    if (!selectedCohortId) {
      setAddStatus({ type: 'error', message: 'Please select a cohort first.' });
      return;
    }

    try {
      await axios.post(`/course-groups/${selectedCohortId}/add_student/`, { user_id: studentId });
      setAddStatus({ type: 'success', message: 'Student added successfully!' });
      mutateStudents();
      // Clear after 3 seconds
      setTimeout(() => setAddStatus(null), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to add student.';
      setAddStatus({ type: 'error', message: msg });
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!selectedGroupForView) return;
    try {
      await axios.post(`/course-groups/${selectedGroupForView}/remove_student/`, { user_id: studentId });
      mutateStudents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove student.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-lg font-bold text-emerald-400 border-b border-slate-800 pb-2">Student Management</h3>
      <p className="text-slate-400 text-sm">Manage enrollments for this course. Age requirements are enforced automatically.</p>

      {/* Add Student Section */}
      <div className="bg-slate-800/40 border border-slate-700/40 p-5 rounded-xl space-y-4">
        <h4 className="font-bold text-white flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-emerald-500" />
          Add Student to Cohort
        </h4>

        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student by name or ID..."
              className="w-full ps-10 pe-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none placeholder:text-slate-500"
            />
            {isSearching && <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />}
          </div>

          {/* Cohort Selector */}
          <select
            value={selectedCohortId}
            onChange={(e) => setSelectedCohortId(e.target.value ? Number(e.target.value) : '')}
            className="bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 px-4 text-white text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none min-w-[200px]"
          >
            <option value="">Select Cohort...</option>
            {groups.map((group: any, index: number) => (
              <option key={group.id || index} value={group.id || ''}>
                {watchGroup(index) || `Group ${index + 1}`}
              </option>
            ))}
          </select>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            {searchResults.map((student: any) => (
              <div
                key={student.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/60 transition-colors border-b border-slate-800/40 last:border-0"
              >
                <div>
                  <span className="text-white text-sm font-medium">{student.full_name}</span>
                  <span className="text-slate-500 text-xs ms-2">ID: {student.id}</span>
                  {student.exact_age && (
                    <span className={`text-xs ms-2 px-2 py-0.5 rounded-full ${
                      student.exact_age >= minAge && student.exact_age <= maxAge
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}>
                      Age: {student.exact_age}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleAddStudent(student.id, student.exact_age)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Age Gating Notice */}
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <p className="text-emerald-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span><strong>Age Gating Active:</strong> Only students between {minAge} and {maxAge} years old can be enrolled.</span>
          </p>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {addStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                addStatus.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {addStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              {addStatus.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Current Enrollments */}
      <div className="bg-slate-800/40 border border-slate-700/40 p-5 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-white">Current Enrollments</h4>
          <div className="flex gap-2">
            {groups.map((group: any, idx: number) => (
              <button
                key={group.id || idx}
                type="button"
                onClick={() => group.id && setSelectedGroupForView(group.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedGroupForView === group.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-white'
                }`}
              >
                {watchGroup(idx) || `Group ${idx + 1}`}
              </button>
            ))}
          </div>
        </div>

        {enrolledStudents.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-700" />
            <p className="text-sm">No students enrolled in this cohort yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 text-slate-400">
                  <th className="text-start py-2.5 px-3 font-medium">ID</th>
                  <th className="text-start py-2.5 px-3 font-medium">Name</th>
                  <th className="text-start py-2.5 px-3 font-medium">Age</th>
                  <th className="text-end py-2.5 px-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.map((student: any) => (
                  <tr key={student.id} className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-xs">{student.id}</td>
                    <td className="py-2.5 px-3 text-white font-medium">{student.full_name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{student.exact_age ?? '—'}</td>
                    <td className="py-2.5 px-3 text-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveStudent(student.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
                        title="Remove student"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ZOOM SESSIONS LIST — with Africa/Cairo timezone enforcement
// ═══════════════════════════════════════════════════════

function ZoomSessionsList({ control, register, gIndex }: any) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({ control, name: `groups.${gIndex}.zoom_sessions` });

  return (
    <div className="space-y-3 mt-3 ms-4">
      {fields.map((field: any, index: number) => (
        <div key={field.id} className="flex gap-2 items-start">
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                {...register(`groups.${gIndex}.zoom_sessions.${index}.title`, { required: true })}
                placeholder={t('admin.courses.zoomSessionTitle')}
                className="flex-1 p-2.5 text-sm bg-slate-800/60 border border-slate-700/50 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white rounded-lg"
              />
              <input
                type="datetime-local"
                {...register(`groups.${gIndex}.zoom_sessions.${index}.scheduled_time`)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const d = new Date(val);
                  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', weekday: 'long' });
                  const parts = formatter.formatToParts(d);
                  const dayName = parts.find((p: any) => p.type === 'weekday')?.value;
                  const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(dayName || '');
                  const officialDay = Number(control._formValues.groups[gIndex].official_day);
                  if (dayIndex !== officialDay) {
                    alert(`Timezone Error (Africa/Cairo): Session must be scheduled on the official cohort day!`);
                    e.target.value = '';
                  } else {
                    register(`groups.${gIndex}.zoom_sessions.${index}.scheduled_time`).onChange(e);
                  }
                }}
                className="p-2.5 text-sm bg-slate-800/60 border border-slate-700/50 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white rounded-lg [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]"
              />
            </div>
            <input
              type="text"
              {...register(`groups.${gIndex}.zoom_sessions.${index}.meeting_link`)}
              placeholder={t('admin.courses.zoomLink')}
              className="flex-1 p-2.5 text-sm bg-slate-800/60 border border-slate-700/50 focus:ring-2 focus:ring-emerald-500/50 outline-none text-white rounded-lg"
              dir="ltr"
            />
          </div>
          <button type="button" onClick={() => remove(index)} className="p-2 text-red-400 hover:text-red-300 bg-red-400/10 rounded-lg shrink-0 hover:bg-red-400/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ title: '', scheduled_time: '', meeting_link: '' })}
        className="text-sm text-indigo-400 hover:text-indigo-300 font-medium w-fit transition-colors"
      >
        {t('admin.courses.addZoomSession')}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// UNIT LESSONS LIST — for LONG_NESTED structure
// ═══════════════════════════════════════════════════════

function UnitLessonsList({ control, register, uIndex }: any) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({ control, name: `units.${uIndex}.lessons` });

  return (
    <div className="space-y-2 pe-4 border-e-2 border-slate-700/30">
      {fields.map((field: any, index: number) => (
        <div key={field.id} className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/40 flex gap-3 items-start">
          <div className="flex-1 space-y-2">
            <input {...register(`units.${uIndex}.lessons.${index}.title`, { required: true })} placeholder={t('admin.courses.lessonTitlePlaceholder')} className="w-full p-2 text-sm bg-slate-800/60 border border-slate-700/50 outline-none text-white rounded-lg" />
            <div className="flex gap-2">
              <input type="text" {...register(`units.${uIndex}.lessons.${index}.video_url`)} placeholder={t('admin.courses.videoUrlPlaceholder')} className="flex-1 p-2 text-xs bg-slate-800/60 border border-slate-700/50 outline-none text-white rounded-lg" dir="ltr" />
              <input type="text" {...register(`units.${uIndex}.lessons.${index}.pdf_attachment`)} placeholder={t('admin.courses.pdfUrlPlaceholder')} className="flex-1 p-2 text-xs bg-slate-800/60 border border-slate-700/50 outline-none text-white rounded-lg" dir="ltr" />
              <label className="flex items-center text-xs gap-1 bg-slate-800/60 border border-slate-700/50 px-2 rounded-lg text-slate-300">
                <input type="checkbox" {...register(`units.${uIndex}.lessons.${index}.is_quiz`)} /> {t('admin.courses.isQuiz')}
              </label>
            </div>
          </div>
          <button type="button" onClick={() => remove(index)} className="text-red-400 hover:bg-red-500/20 p-1.5 rounded-lg transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ title: '', video_url: '', pdf_attachment: '', is_quiz: false, estimated_minutes: 0 })}
        className="text-sm font-medium text-slate-400 hover:text-white mt-2 block w-full text-center py-2.5 bg-slate-800/30 border border-dashed border-slate-700/50 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors rounded-xl"
      >
        {t('admin.courses.addLesson')}
      </button>
    </div>
  );
}
