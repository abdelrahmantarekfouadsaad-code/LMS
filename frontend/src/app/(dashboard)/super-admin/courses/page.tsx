"use client";

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import useSWR from 'swr';
import axios from '@/lib/axios';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

// --- Components ---

export default function CoursesPage() {
  const [filter, setFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: courses = [], mutate } = useSWR('/courses/', fetcher);

  const filteredCourses = courses.filter((c: any) => filter === 'ALL' || c.target_age === filter);

  return (
    <div className="p-8 font-cairo bg-gray-50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الدورات</h1>
          <p className="text-gray-500 mt-2">قم بإنشاء وإدارة دورات النظام</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm"
        >
          + إضافة دورة
        </button>
      </div>

      {/* Filter Slider */}
      <div className="flex space-x-4 space-x-reverse mb-8 overflow-x-auto pb-2">
        {['ALL', 'CHILDREN', 'TWEENS', 'TEENS'].map(age => (
          <button
            key={age}
            onClick={() => setFilter(age)}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition-colors ${
              filter === age
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {age === 'ALL' ? 'الكل' : age === 'CHILDREN' ? 'أطفال' : age === 'TWEENS' ? 'يافعين' : 'شباب'}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.map((course: any) => (
          <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gray-200 relative">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${course.color || 'from-gray-100 to-gray-200'}`} />
              )}
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${course.is_upload_completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {course.is_upload_completed ? 'مكتمل الرفع' : 'غير مكتمل الرفع'}
                </span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{course.description}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                <span className="text-black font-bold">{course.price > 0 ? `${course.price} د.ك` : 'مجاني'}</span>
                <span className="text-xs text-gray-400">{course.course_format}</span>
              </div>
            </div>
          </div>
        ))}
        {filteredCourses.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            لا توجد دورات مطابقة
          </div>
        )}
      </div>

      {/* Dynamic Modal */}
      {isModalOpen && (
        <CourseModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            mutate();
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
  target_age: string;
  price: number;
  thumbnail: string;
  course_format: string;
  course_structure: string;
  groups: { name: string; zoom_sessions: { title: string; scheduled_time: string; meeting_link: string }[] }[];
  units: { title: string; lessons: { title: string; video_url: string; pdf_attachment: string; is_quiz: boolean; estimated_minutes: number }[] }[];
  flat_lessons: { title: string; video_url: string; pdf_attachment: string; is_quiz: boolean; estimated_minutes: number }[];
};

function CourseModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [step, setStep] = useState(1);

  const { register, control, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      target_age: 'ALL',
      course_format: 'VIDEO_ONLY',
      course_structure: 'SHORT_FLAT',
      groups: [{ name: 'المجموعة 1', zoom_sessions: [] }],
      units: [],
      flat_lessons: []
    }
  });

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
    try {
      await axios.post('/courses/', data);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data || err.message;
      console.log('Detailed Backend Error:', errorMsg);
      alert('حدث خطأ أثناء الحفظ: \n' + JSON.stringify(errorMsg, null, 2));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="glass-panel w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh] text-white">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-2xl font-bold bg-gradient-to-l from-indigo-400 to-purple-400 bg-clip-text text-transparent">إضافة دورة جديدة</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-400 transition-colors">
            ✕
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <form id="course-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Step 1: Base Info */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-semibold mb-4 text-gray-200 border-b border-white/10 pb-2">البيانات الأساسية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">عنوان الدورة</label>
                    <input {...register('title', { required: true })} className="w-full p-3 glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all rounded-xl border-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">الفئة العمرية المستهدفة</label>
                    <select {...register('target_age')} className="w-full p-3 glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all [&>option]:bg-[#111] rounded-xl border-none">
                      <option value="ALL">الكل</option>
                      <option value="CHILDREN">أطفال</option>
                      <option value="TWEENS">يافعين</option>
                      <option value="TEENS">شباب</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">الوصف</label>
                    <textarea {...register('description', { required: true })} rows={3} className="w-full p-3 glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all rounded-xl border-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">السعر (د.ك)</label>
                    <input type="number" step="0.01" {...register('price')} className="w-full p-3 glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all rounded-xl border-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">رابط الصورة المصغرة (Thumbnail URL)</label>
                    <input type="url" {...register('thumbnail')} placeholder="https://..." className="w-full p-3 glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all rounded-xl border-none" dir="ltr" />
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-lg font-medium text-gray-200 mb-4">المجموعات (Cohorts)</h4>
                  {groupFields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-4 space-x-reverse mb-3">
                      <input {...register(`groups.${index}.name`)} placeholder="اسم المجموعة (مثال: الدفعة الأولى)" className="flex-1 p-3 glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all rounded-xl border-none" />
                      {index > 0 && (
                        <button type="button" onClick={() => removeGroup(index)} className="text-red-400 hover:bg-red-500/20 px-4 py-3 rounded-xl transition-colors">حذف</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => appendGroup({ name: '', zoom_sessions: [] })} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">+ إضافة مجموعة أخرى</button>
                </div>
              </div>
            )}

            {/* Step 2: Course Format */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">نظام الدورة</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { val: 'VIDEO_ONLY', label: 'فيديوهات مسجلة فقط', desc: 'لا يوجد لقاءات زووم' },
                    { val: 'ZOOM_ONLY', label: 'لقاءات زووم فقط', desc: 'لا يوجد محتوى مسجل' },
                    { val: 'HYBRID', label: 'مدمج (مسجل + زووم)', desc: 'محتوى مسجل مع لقاءات تفاعلية' }
                  ].map(fmt => (
                    <div key={fmt.val} onClick={() => setValue('course_format', fmt.val)} className={`cursor-pointer p-5 border-2 rounded-xl transition-all ${courseFormat === fmt.val ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="font-bold text-lg text-gray-900 mb-1">{fmt.label}</div>
                      <div className="text-sm text-gray-500">{fmt.desc}</div>
                    </div>
                  ))}
                </div>

                {(courseFormat === 'VIDEO_ONLY' || courseFormat === 'HYBRID') && (
                  <div className="mt-8">
                    <h4 className="text-lg font-medium text-gray-700 mb-4">هيكلة المحتوى المسجل</h4>
                    <div className="flex space-x-4 space-x-reverse">
                      {[
                        { val: 'SHORT_FLAT', label: 'دورة قصيرة', desc: 'قائمة دروس مباشرة (بدون وحدات)' },
                        { val: 'LONG_NESTED', label: 'دورة طويلة', desc: 'مقسمة إلى وحدات وكل وحدة تحتوي دروس' }
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
                <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">محتوى الدورة</h3>

                {/* ZOOM CONTENT */}
                {(courseFormat === 'ZOOM_ONLY' || courseFormat === 'HYBRID') && (
                  <div className="glass-panel p-6 mb-8 border-indigo-500/30">
                    <h4 className="font-bold text-indigo-300 text-lg mb-4">لقاءات الزووم التفاعلية</h4>
                    {groupFields.map((group, gIndex) => (
                      <div key={group.id} className="mb-6 last:mb-0 glass-panel p-4 border-none bg-black/20">
                        <div className="font-bold text-gray-200 mb-3 border-b border-white/10 pb-2">مجموعة: {watch(`groups.${gIndex}.name`) || `مجموعة ${gIndex+1}`}</div>
                        <ZoomSessionsList control={control} register={register} gIndex={gIndex} />
                      </div>
                    ))}
                  </div>
                )}

                {/* RECORDED CONTENT */}
                {(courseFormat === 'VIDEO_ONLY' || courseFormat === 'HYBRID') && (
                  <div className="glass-panel p-6 border-amber-500/30">
                    <h4 className="font-bold text-amber-300 text-lg mb-4">المحتوى المسجل (الدروس)</h4>
                    
                    {courseStructure === 'SHORT_FLAT' ? (
                      <div className="space-y-3">
                        {flatLessonFields.map((field, lIndex) => (
                          <div key={field.id} className="glass-panel p-4 border-none bg-black/20 flex gap-4 items-start">
                            <div className="flex-1 space-y-3">
                              <input {...register(`flat_lessons.${lIndex}.title`, { required: true })} placeholder="عنوان الدرس" className="w-full p-2 glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white border-none rounded-lg" />
                              <div className="flex gap-3">
                                <input {...register(`flat_lessons.${lIndex}.video_url`)} placeholder="رابط الفيديو (اختياري)" className="flex-1 p-2 text-sm glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white border-none rounded-lg" dir="ltr" />
                                <input {...register(`flat_lessons.${lIndex}.pdf_attachment`)} placeholder="رابط PDF (اختياري)" className="flex-1 p-2 text-sm glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white border-none rounded-lg" dir="ltr" />
                                <label className="flex items-center text-sm gap-2 whitespace-nowrap glass-panel px-3 border-none rounded-lg text-white">
                                  <input type="checkbox" {...register(`flat_lessons.${lIndex}.is_quiz`)} className="rounded" />
                                  هل هذا اختبار؟
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
                              <input {...register(`units.${uIndex}.title`, { required: true })} placeholder={`عنوان الوحدة ${uIndex+1}`} className="text-lg font-bold p-2 border-b-2 border-white/20 bg-transparent focus:border-indigo-400 outline-none text-white flex-1 ml-4" />
                              <button type="button" onClick={() => removeUnit(uIndex)} className="text-red-400 text-sm hover:text-red-300">حذف الوحدة</button>
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
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-white/10 glass-panel flex justify-between bg-black/40 rounded-none border-x-0 border-b-0">
          {step > 1 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-2 rounded-xl font-medium text-gray-300 hover:bg-white/10 transition-colors">السابق</button>
          ) : <div></div>}
          
          {step < 3 ? (
            <button type="button" onClick={() => setStep(step + 1)} className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">التالي</button>
          ) : (
            <button type="submit" form="course-form" className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.5)]">حفظ الدورة</button>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-component for deeply nested Zoom Sessions Field Array
function ZoomSessionsList({ control, register, gIndex }: any) {
  const { fields, append, remove } = useFieldArray({ control, name: `groups.${gIndex}.zoom_sessions` });
  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-3 items-center">
          <input {...register(`groups.${gIndex}.zoom_sessions.${index}.title`, { required: true })} placeholder="عنوان اللقاء" className="flex-1 p-2 text-sm glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white border-none rounded-lg" />
          <input type="datetime-local" {...register(`groups.${gIndex}.zoom_sessions.${index}.scheduled_time`)} className="p-2 text-sm glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white border-none rounded-lg [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]" />
          <input type="url" {...register(`groups.${gIndex}.zoom_sessions.${index}.meeting_link`)} placeholder="رابط الزووم" className="flex-1 p-2 text-sm glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white border-none rounded-lg" dir="ltr" />
          <button type="button" onClick={() => remove(index)} className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg transition-colors">✕</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ title: '', scheduled_time: '', meeting_link: '' })} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 mt-2 block">+ إضافة لقاء</button>
    </div>
  );
}

// Sub-component for deeply nested Unit Lessons Field Array
function UnitLessonsList({ control, register, uIndex }: any) {
  const { fields, append, remove } = useFieldArray({ control, name: `units.${uIndex}.lessons` });
  return (
    <div className="space-y-2 pr-4 border-r-2 border-white/10">
      {fields.map((field, index) => (
        <div key={field.id} className="glass-panel p-3 border-none bg-black/40 flex gap-3 items-start">
          <div className="flex-1 space-y-2">
            <input {...register(`units.${uIndex}.lessons.${index}.title`, { required: true })} placeholder="عنوان الدرس" className="w-full p-2 text-sm glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white border-none rounded-lg" />
            <div className="flex gap-2">
              <input type="url" {...register(`units.${uIndex}.lessons.${index}.video_url`)} placeholder="رابط الفيديو" className="flex-1 p-2 text-xs glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white border-none rounded-lg" dir="ltr" />
              <input type="url" {...register(`units.${uIndex}.lessons.${index}.pdf_attachment`)} placeholder="رابط PDF" className="flex-1 p-2 text-xs glass-panel focus:ring-2 focus:ring-indigo-500 outline-none text-white border-none rounded-lg" dir="ltr" />
              <label className="flex items-center text-xs gap-1 glass-panel px-2 border-none rounded-lg text-white">
                <input type="checkbox" {...register(`units.${uIndex}.lessons.${index}.is_quiz`)} />
                اختبار؟
              </label>
            </div>
          </div>
          <button type="button" onClick={() => remove(index)} className="text-red-400 hover:bg-red-500/20 p-1 rounded-lg transition-colors">✕</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ title: '', video_url: '', pdf_attachment: '', is_quiz: false, estimated_minutes: 0 })} className="text-sm font-bold text-gray-400 hover:text-white mt-2 block w-full text-center py-2 glass-panel border-dashed border-white/20 hover:border-white/50 transition-colors">+ إضافة درس</button>
    </div>
  );
}
