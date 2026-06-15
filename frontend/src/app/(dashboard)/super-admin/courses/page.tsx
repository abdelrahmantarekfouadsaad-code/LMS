"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import useSWR from 'swr';
import axios from '@/lib/axios';
import { useTranslation } from '@/i18n/TranslationContext';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

// --- Components ---

export default function CoursesPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const { data: courses = [], mutate } = useSWR('/courses/', fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false
  });

  const filteredCourses = courses.filter((c: any) => filter === 'ALL' || c.target_age === filter);

  return (
    <div className="p-8 font-cairo bg-background-light dark:bg-background-dark min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('admin.courses.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">{t('admin.courses.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingCourse(null);
            setIsModalOpen(true);
          }}
          className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm"
        >{t('admin.courses.addCourse')}</button>
      </div>

      {/* Filter Slider */}
      <div className="flex space-x-4 space-x-reverse mb-8 overflow-x-auto pb-2">
        {['ALL', 'CHILDREN', 'TWEENS', 'TEENS'].map(age => (
          <button
            type="button"
            key={age}
            onClick={() => setFilter(age)}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition-colors ${
              filter === age
                ? 'bg-primary text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            {age === 'ALL' ? t('admin.courses.all') : age === 'CHILDREN' ? t('admin.courses.children') : age === 'TWEENS' ? t('admin.courses.tweens') : t('admin.courses.teens')}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.map((course: any) => (
          <div key={course.id} className="glass-panel p-0 bg-slate-900/50 rounded-xl shadow-lg border border-white/10 overflow-hidden hover:shadow-xl hover:border-white/20 transition-all cursor-pointer" onClick={() => { setEditingCourse(course); setIsModalOpen(true); }}>
            <div className="h-48 bg-slate-800 relative">
              {course.thumbnail ? (
                <img 
                  src={course.thumbnail} 
                  alt={course.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2364748b">No Image</text></svg>';
                  }}
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${course.color || 'from-slate-800 to-slate-700'}`} />
              )}
              <div className="absolute top-4 end-4">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm backdrop-blur-md ${course.is_upload_completed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                  {course.is_upload_completed ? t('admin.courses.uploadComplete') : t('admin.courses.uploadIncomplete')}
                </span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
              <p className="text-slate-400 text-sm mb-4 line-clamp-2">{course.description}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <span className="text-white font-bold">{course.price > 0 ? `${course.price} KD` : t('admin.courses.free')}</span>
                <span className="text-xs text-slate-500">{course.course_format}</span>
              </div>
            </div>
          </div>
        ))}
        {filteredCourses.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            {t('admin.courses.noCourses')}
          </div>
        )}
      </div>

      {/* Dynamic Modal */}
      {isModalOpen && (
        <CourseModal
          initialData={editingCourse}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCourse(null);
          }}
          onSuccess={async () => {
            await mutate();
            alert(t('admin.courses.saveSuccess'));
            setIsModalOpen(false);
            setEditingCourse(null);
          }}
        />
      )}
    </div>
  );
}

// --- Dynamic Form Modal Component ---

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
  groups: { name: string; official_day: number; official_time: string; capacity: number; primary_teacher: number | null; zoom_sessions: { title: string; scheduled_time: string; meeting_link: string }[] }[];
  units: { title: string; lessons: { title: string; video_url: string; pdf_attachment: string; is_quiz: boolean; estimated_minutes: number }[] }[];
  flat_lessons: { title: string; video_url: string; pdf_attachment: string; is_quiz: boolean; estimated_minutes: number }[];
};

function CourseModal({ onClose, onSuccess, initialData }: { onClose: () => void, onSuccess: () => Promise<void> | void, initialData?: any }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
      defaultValues: initialData || {
      target_age_min: 0,
      target_age_max: 99,
      course_format: 'VIDEO_ONLY',
      course_structure: 'SHORT_FLAT',
      groups: [{ name: 'المجموعة 1', official_day: 0, official_time: '18:00', capacity: 25, primary_teacher: null, zoom_sessions: [] }],
      units: [],
      flat_lessons: [],
      instructor_name: 'أكاديمية نور النبوة',
      is_upload_completed: false
    }
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        target_age_min: 0,
        target_age_max: 99,
        course_format: 'VIDEO_ONLY',
        course_structure: 'SHORT_FLAT',
        groups: [{ name: 'المجموعة 1', official_day: 0, official_time: '18:00', capacity: 25, primary_teacher: null, zoom_sessions: [] }],
        units: [],
        flat_lessons: [],
        instructor_name: 'أكاديمية نور النبوة',
        is_upload_completed: false
      });
    }
  }, [initialData, reset]);

  const { fields: groupFields, append: appendGroup, remove: removeGroup } = useFieldArray({
    control,
    name: "groups"
  });

  const { fields: unitFields, append: appendUnit, remove: removeUnit } = useFieldArray({
    control,
    name: "units"
  });

  const { fields: flatLessonFields, append: appendFlatLesson, remove: removeFlatLesson } = useFieldArray({
    control,
    name: "flat_lessons"
  });

  const courseFormat = watch('course_format');
  const courseStructure = watch('course_structure');

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (initialData?.id) {
        await axios.put(`/courses/${initialData.id}/`, data);
      } else {
        await axios.post('/courses/', data);
      }
      await onSuccess();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data || err.message;
      console.log('Detailed Backend Error:', errorMsg);
      alert('حدث خطأ أثناء الحفظ: \n' + JSON.stringify(errorMsg, null, 2));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="glass-panel w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh] text-white">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-2xl font-bold bg-gradient-to-l from-indigo-400 to-purple-400 bg-clip-text text-transparent">{initialData ? t('admin.courses.editCourse') : t('admin.courses.addNewCourse')}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-red-400 transition-colors">
            ✕
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <form id="course-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }} className="space-y-8">
            
            {/* Step 1: Base Info */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-semibold mb-4 text-gray-200 border-b border-white/10 pb-2">{t('admin.courses.basicInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t('admin.courses.courseTitle')}</label>
                    <input {...register('title', { required: true })} className="w-full p-3 glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all rounded-xl border-none" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-400 mb-1">Min Age</label>
                      <input type="number" {...register('target_age_min')} className="w-full p-3 bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none text-white transition-all rounded-xl border border-slate-800" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-400 mb-1">Max Age</label>
                      <input type="number" {...register('target_age_max')} className="w-full p-3 bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none text-white transition-all rounded-xl border border-slate-800" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t('admin.courses.description')}</label>
                    <textarea {...register('description', { required: true })} rows={3} className="w-full p-3 glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all rounded-xl border-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t('admin.courses.price')}</label>
                    <input type="number" step="0.01" {...register('price')} className="w-full p-3 glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all rounded-xl border-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t('admin.courses.instructorName')}</label>
                    <input type="text" {...register('instructor_name')} className="w-full p-3 glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all rounded-xl border-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t('admin.courses.thumbnailUrl')}</label>
                    <input type="text" {...register('thumbnail')} placeholder="https://..." className="w-full p-3 glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all rounded-xl border-none" dir="ltr" />
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-lg font-medium text-slate-200 mb-4">{t('admin.courses.cohorts')}</h4>
                  {groupFields.map((field, index) => (
                    <div key={field.id} className="mb-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center space-x-4 space-x-reverse mb-3">
                        <input {...register(`groups.${index}.name`)} placeholder={t('admin.courses.cohortPlaceholder')} className="flex-1 p-3 bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none text-white transition-all rounded-xl border border-slate-800" />
                        {index > 0 && (
                          <button type="button" onClick={() => removeGroup(index)} className="text-red-400 hover:bg-red-500/20 px-4 py-3 rounded-xl transition-colors">{t('admin.courses.delete')}</button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Official Day</label>
                          <select {...register(`groups.${index}.official_day`)} className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-white text-sm focus:ring-emerald-500">
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
                          <label className="block text-xs text-slate-400 mb-1">Official Time</label>
                          <input type="time" {...register(`groups.${index}.official_time`)} className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-white text-sm focus:ring-emerald-500 [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Capacity</label>
                          <input type="number" {...register(`groups.${index}.capacity`)} className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-white text-sm focus:ring-emerald-500" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Teacher ID</label>
                          <input type="number" {...register(`groups.${index}.primary_teacher`)} placeholder="ID" className="w-full p-2 bg-slate-900 border border-slate-800 rounded text-white text-sm focus:ring-emerald-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => appendGroup({ name: '', official_day: 0, official_time: '18:00', capacity: 25, primary_teacher: null, zoom_sessions: [] })} className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors">{t('admin.courses.addCohort')}</button>
                </div>
              </div>
            )}

            {/* Step 2: Course Format */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">{t('admin.courses.courseFormat')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { val: 'VIDEO_ONLY', label: t('admin.courses.formatVideoOnly'), desc: t('admin.courses.formatVideoOnlyDesc') },
                    { val: 'ZOOM_ONLY', label: t('admin.courses.formatZoomOnly'), desc: t('admin.courses.formatZoomOnlyDesc') },
                    { val: 'HYBRID', label: t('admin.courses.formatHybrid'), desc: t('admin.courses.formatHybridDesc') }
                  ].map(fmt => (
                    <div key={fmt.val} onClick={() => setValue('course_format', fmt.val)} className={`cursor-pointer p-5 border-2 rounded-xl transition-all ${courseFormat === fmt.val ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="font-bold text-lg text-gray-900 mb-1">{fmt.label}</div>
                      <div className="text-sm text-gray-500">{fmt.desc}</div>
                    </div>
                  ))}
                </div>

                {(courseFormat === 'VIDEO_ONLY' || courseFormat === 'HYBRID') && (
                  <div className="mt-8">
                    <h4 className="text-lg font-medium text-gray-700 mb-4">{t('admin.courses.recordedStructure')}</h4>
                    <div className="flex space-x-4 space-x-reverse">
                      {[
                        { val: 'SHORT_FLAT', label: t('admin.courses.structureShort'), desc: t('admin.courses.structureShortDesc') },
                        { val: 'LONG_NESTED', label: t('admin.courses.structureLong'), desc: t('admin.courses.structureLongDesc') }
                      ].map(str => (
                        <div key={str.val} onClick={() => setValue('course_structure', str.val)} className={`flex-1 cursor-pointer p-4 border-2 rounded-xl transition-all ${courseStructure === str.val ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className="font-bold text-gray-900 mb-1">{str.label}</div>
                          <div className="text-sm text-gray-500">{str.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Dynamic Content */}
            {step === 3 && (
              <div className="space-y-8 animate-fade-in">
                <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">{t('admin.courses.courseContent')}</h3>

                {/* VIRTUAL SESSION CONTENT */}
                {(courseFormat === 'ZOOM_ONLY' || courseFormat === 'HYBRID') && (
                  <div className="glass-panel p-6 mb-8 border-indigo-500/30">
                    <h4 className="font-bold text-indigo-300 text-lg mb-4">{t('admin.courses.virtualSessions')}</h4>
                    {groupFields.map((group, gIndex) => (
                      <div key={group.id} className="mb-6 last:mb-0 glass-panel p-4 border-none bg-black/20">
                        <div className="font-bold text-gray-200 mb-3 border-b border-white/10 pb-2">{t('admin.courses.cohort')} {watch(`groups.${gIndex}.name`) || `مجموعة ${gIndex+1}`}</div>
                        <ZoomSessionsList control={control} register={register} gIndex={gIndex} />
                      </div>
                    ))}
                  </div>
                )}

                {/* RECORDED CONTENT */}
                {(courseFormat === 'VIDEO_ONLY' || courseFormat === 'HYBRID') && (
                  <div className="glass-panel p-6 border-amber-500/30">
                    <h4 className="font-bold text-amber-300 text-lg mb-4">{t('admin.courses.recordedContent')}</h4>
                    
                    {courseStructure === 'SHORT_FLAT' ? (
                      <div className="space-y-3">
                        {flatLessonFields.map((field, lIndex) => (
                          <div key={field.id} className="glass-panel p-4 border-none bg-black/20 flex gap-4 items-start">
                            <div className="flex-1 space-y-3">
                              <input {...register(`flat_lessons.${lIndex}.title`, { required: true })} placeholder={t('admin.courses.lessonTitlePlaceholder')} className="w-full p-2 glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white border-none rounded-lg" />
                              <div className="flex gap-3">
                                <input {...register(`flat_lessons.${lIndex}.video_url`)} placeholder={t('admin.courses.videoUrlPlaceholder')} className="flex-1 p-2 text-sm glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white border-none rounded-lg" dir="ltr" />
                                <input {...register(`flat_lessons.${lIndex}.pdf_attachment`)} placeholder={t('admin.courses.pdfUrlPlaceholder')} className="flex-1 p-2 text-sm glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white border-none rounded-lg" dir="ltr" />
                                <label className="flex items-center text-sm gap-2 whitespace-nowrap glass-panel px-3 border-none rounded-lg text-white">
                                  <input type="checkbox" {...register(`flat_lessons.${lIndex}.is_quiz`)} className="rounded" />
                                  {t('admin.courses.isQuiz')}
                                </label>
                              </div>
                            </div>
                            <button type="button" onClick={() => removeFlatLesson(lIndex)} className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg transition-colors">✕</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => appendFlatLesson({ title: '', video_url: '', pdf_attachment: '', is_quiz: false, estimated_minutes: 0 })} className="w-full py-3 glass-panel border-dashed border-white/20 text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition-colors font-medium">
                          + إضافة درس جديد
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {unitFields.map((field, uIndex) => (
                          <div key={field.id} className="glass-panel p-5 border-none bg-black/20">
                            <div className="flex justify-between mb-4">
                              <input {...register(`units.${uIndex}.title`, { required: true })} placeholder={t('admin.courses.unitTitlePlaceholder')} className="text-lg font-bold p-2 border-b-2 border-white/20 bg-transparent focus:border-indigo-400 outline-none text-white flex-1 ms-4" />
                              <button type="button" onClick={() => removeUnit(uIndex)} className="text-red-400 text-sm hover:text-red-300">{t('admin.courses.deleteUnit')}</button>
                            </div>
                            <UnitLessonsList control={control} register={register} uIndex={uIndex} />
                          </div>
                        ))}
                        <button type="button" onClick={() => appendUnit({ title: '', lessons: [] })} className="w-full py-4 glass-panel border-dashed border-white/20 text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition-colors font-bold text-lg">
                          + إضافة وحدة جديدة
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <label className="flex items-center gap-3 cursor-pointer text-white">
                    <input type="checkbox" {...register('is_upload_completed')} className="w-5 h-5 rounded border-red-500/50 bg-black/50 text-red-500 focus:ring-red-500 focus:ring-offset-gray-900" />
                    <span className="font-bold text-lg">{t('admin.courses.uploadConfirm')}</span>
                  </label>
                  <p className="text-red-400 text-sm mt-2 me-8">{t('admin.courses.uploadWarning')}</p>
                </div>
              </div>
            )}

            {/* Step 4: Students Management */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-semibold mb-4 text-emerald-500 border-b border-slate-800 pb-2">Student Management</h3>
                <p className="text-slate-400">Manage enrollments for this course. Ensure age requirements are met.</p>
                
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                  <h4 className="font-bold text-white mb-4">Add Student to Cohort</h4>
                  <div className="flex flex-col md:flex-row gap-4">
                    <input 
                      type="text" 
                      placeholder="Search Student by ID, Name or Email" 
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
                    />
                    <select className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-emerald-500 outline-none min-w-[200px]">
                      <option value="">Select Cohort...</option>
                      {groupFields.map((group, index) => (
                        <option key={index} value={index}>{watch(`groups.${index}.name`)}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => alert("Validation: Checking if student meets Min Age (" + watch('target_age_min') + ") and Max Age (" + watch('target_age_max') + ")...")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                      Add Student
                    </button>
                  </div>
                  <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <p className="text-emerald-400 text-sm">
                      <span className="font-bold">Age Gating Active:</span> Only students between {watch('target_age_min')} and {watch('target_age_max')} years old can be enrolled based on their Profile DOB.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl overflow-hidden">
                  <h4 className="font-bold text-white mb-4">Current Enrollments</h4>
                  <div className="text-center py-8 text-slate-500">
                    Students list will appear here after saving the course.
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-white/10 glass-panel flex justify-between bg-black/40 rounded-none border-x-0 border-b-0">
          <div className="flex gap-4">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-2 rounded-xl font-medium text-gray-300 hover:bg-white/10 transition-colors">{t('admin.courses.previous')}</button>
            ) : <div></div>}
            
            {initialData && (
              <button 
                type="button" 
                disabled={isSubmitting}
                onClick={async () => {
                  if (window.confirm(t('admin.courses.deleteConfirm'))) {
                    setIsSubmitting(true);
                    try {
                      await axios.delete(`/courses/${initialData.id}/`);
                      await onSuccess();
                    } catch (err) {
                      console.error(err);
                      alert('حدث خطأ أثناء الحذف');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }
                }} 
                className={`px-6 py-2 rounded-xl font-bold text-red-500 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-500/20'}`}
              >
                حذف الدورة
              </button>
            )}
          </div>
          
          {step < 4 && (
            <button key="next-btn" type="button" disabled={isSubmitting} onClick={(e) => { e.preventDefault(); setStep(step + 1); }} className={`px-8 py-2 bg-emerald-600 text-white rounded-xl font-medium transition-colors shadow-sm ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-700'}`}>{t('admin.courses.next')}</button>
          )}
          {step === 4 && (
            <button key="submit-btn" type="submit" disabled={isSubmitting} form="course-form" onClick={(e) => e.stopPropagation()} className={`px-8 py-2 bg-emerald-600 text-white rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(5,150,105,0.5)] ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-700'}`}>{isSubmitting ? t('admin.courses.saving') : t('admin.courses.saveCourse')}</button>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-component for deeply nested Virtual Session Field Array
function ZoomSessionsList({ control, register, gIndex }: any) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({ control, name: `groups.${gIndex}.zoom_sessions` });
  return (
    <div className="space-y-3 mt-3 ms-6">
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-start">
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex gap-2">
              <input {...register(`groups.${gIndex}.zoom_sessions.${index}.title`, { required: true })} placeholder={t('admin.courses.zoomSessionTitle')} className="flex-1 p-2 text-sm glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white border-none rounded-lg" />
              <input type="datetime-local" {...register(`groups.${gIndex}.zoom_sessions.${index}.scheduled_time`)} onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                const d = new Date(val);
                const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', weekday: 'long' });
                const parts = formatter.formatToParts(d);
                const dayName = parts.find(p => p.type === 'weekday')?.value;
                const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(dayName || '');
                const officialDay = Number(control._formValues.groups[gIndex].official_day);
                if (dayIndex !== officialDay) {
                  alert(`Timezone Error (Africa/Cairo): Session must be scheduled on the official cohort day!`);
                  e.target.value = '';
                } else {
                  // Manually trigger the register onChange so React Hook Form gets it
                  register(`groups.${gIndex}.zoom_sessions.${index}.scheduled_time`).onChange(e);
                }
              }} className="p-2 text-sm bg-slate-900 border border-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none text-white rounded-lg [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]" />
            </div>
            <div className="flex gap-2">
              <input type="text" {...register(`groups.${gIndex}.zoom_sessions.${index}.meeting_link`)} placeholder={t('admin.courses.zoomLink')} className="flex-1 p-2 text-sm glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white border-none rounded-lg" dir="ltr" />
            </div>
          </div>
          <button type="button" onClick={() => remove(index)} className="p-2 text-red-400 hover:text-red-300 bg-red-400/10 rounded-lg shrink-0">🗑️</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ title: '', scheduled_time: '', meeting_link: '' })} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium w-fit">{t('admin.courses.addZoomSession')}</button>
    </div>
  );
}

// Sub-component for deeply nested Unit Lessons Field Array
function UnitLessonsList({ control, register, uIndex }: any) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({ control, name: `units.${uIndex}.lessons` });
  return (
    <div className="space-y-2 pe-4 border-e-2 border-white/10">
      {fields.map((field, index) => (
        <div key={field.id} className="glass-panel p-3 border-none bg-black/40 flex gap-3 items-start">
          <div className="flex-1 space-y-2">
            <input {...register(`units.${uIndex}.lessons.${index}.title`, { required: true })} placeholder={t('admin.courses.lessonTitlePlaceholder')} className="w-full p-2 text-sm glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white border-none rounded-lg" />
            <div className="flex gap-2">
              <input type="text" {...register(`units.${uIndex}.lessons.${index}.video_url`)} placeholder={t('admin.courses.videoUrlPlaceholder')} className="flex-1 p-2 text-xs glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white border-none rounded-lg" dir="ltr" />
              <input type="text" {...register(`units.${uIndex}.lessons.${index}.pdf_attachment`)} placeholder={t('admin.courses.pdfUrlPlaceholder')} className="flex-1 p-2 text-xs glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white border-none rounded-lg" dir="ltr" />
              <label className="flex items-center text-xs gap-1 glass-panel px-2 border-none rounded-lg text-white">
                <input type="checkbox" {...register(`units.${uIndex}.lessons.${index}.is_quiz`)} /> {t('admin.courses.isQuiz')}
              </label>
            </div>
          </div>
          <button type="button" onClick={() => remove(index)} className="text-red-400 hover:bg-red-500/20 p-1 rounded-lg transition-colors">✕</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ title: '', video_url: '', pdf_attachment: '', is_quiz: false, estimated_minutes: 0 })} className="text-sm font-bold text-gray-400 hover:text-white mt-2 block w-full text-center py-2 glass-panel border-dashed border-white/20 hover:border-white/50 transition-colors">{t('admin.courses.addLesson')}</button>
    </div>
  );
}

