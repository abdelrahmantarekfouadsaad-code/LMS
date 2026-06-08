const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/i18n/dictionaries/en.json');
const arPath = path.join(__dirname, '../src/i18n/dictionaries/ar.json');

const enDict = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arDict = JSON.parse(fs.readFileSync(arPath, 'utf8'));

enDict.admin = {
  courses: {
    title: "Course Management",
    subtitle: "Create and manage system courses",
    addCourse: "+ Add Course",
    all: "All",
    children: "Children",
    tweens: "Tweens",
    teens: "Teens",
    uploadComplete: "Upload Complete",
    uploadIncomplete: "Upload Incomplete",
    free: "Free",
    noCourses: "No matching courses found",
    saveSuccess: "Saved successfully",
    editCourse: "Edit Course",
    addNewCourse: "Add New Course",
    basicInfo: "Basic Information",
    courseTitle: "Course Title",
    targetAge: "Target Age Group",
    description: "Description",
    price: "Price (KWD)",
    instructorName: "Instructor Name",
    thumbnailUrl: "Thumbnail URL",
    cohorts: "Cohorts",
    cohortPlaceholder: "Cohort Name (e.g. First Batch)",
    delete: "Delete",
    addCohort: "+ Add another cohort",
    courseFormat: "Course Format",
    formatVideoOnly: "Recorded Videos Only",
    formatVideoOnlyDesc: "No live sessions",
    formatZoomOnly: "Virtual Sessions Only",
    formatZoomOnlyDesc: "No recorded content",
    formatHybrid: "Hybrid (Recorded + Live)",
    formatHybridDesc: "Recorded content with interactive sessions",
    recordedStructure: "Recorded Content Structure",
    structureShort: "Short Course",
    structureShortDesc: "Direct list of lessons",
    structureLong: "Long Course",
    structureLongDesc: "Divided into units",
    courseContent: "Course Content",
    virtualSessions: "Virtual Sessions",
    cohort: "Cohort:",
    recordedContent: "Recorded Content (Lessons)",
    lessonTitlePlaceholder: "Lesson Title",
    videoUrlPlaceholder: "Video URL (optional)",
    pdfUrlPlaceholder: "PDF Link (optional)",
    isQuiz: "Is this a quiz?",
    addLesson: "+ Add new lesson",
    unitTitlePlaceholder: "Unit Title",
    deleteUnit: "Delete Unit",
    addUnit: "+ Add new unit",
    uploadConfirm: "I confirm all course content is uploaded",
    uploadWarning: "Enabling this changes course status to 'Upload Complete'. Do not enable until you are sure.",
    previous: "Previous",
    deleteConfirm: "Are you sure you want to permanently delete this course?",
    deleteCourse: "Delete Course",
    next: "Next",
    saving: "Saving...",
    saveCourse: "Save Course",
    zoomSessionTitle: "Virtual Session Title",
    zoomLink: "Session Link (optional)",
    addZoomSession: "+ Add virtual session"
  },
  chats: {
    title: "Chats",
    subtitle: "The super admin chat interface is under development."
  },
  settings: {
    title: "Super Admin Settings",
    subtitle: "Manage super admin account details and system preferences.",
    personalDetails: "Personal Details",
    changePhoto: "Change Photo",
    photoHint: "JPG, GIF, PNG. Max 800K",
    fullName: "Full Name",
    email: "Email",
    accountRole: "Account Role",
    roleSuperAdmin: "Super Admin",
    saveChanges: "Save Changes",
    saving: "Saving...",
    security: "Security",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    updatePassword: "Update Password",
    sessionAndSupport: "Session & Support",
    logout: "Log Out",
    logoutDesc: "Securely log out of your session.",
    profileUpdated: "Profile updated successfully!",
    profileUpdateFailed: "Failed to update profile.",
    passwordsMismatch: "New passwords do not match.",
    passwordLength: "Password must be at least 8 characters.",
    passwordUpdated: "Password updated successfully!",
    passwordUpdateFailed: "Failed to update password."
  },
  news: {
    title: "News & Announcements",
    subtitle: "Manage the dynamic hero slider images shown on the student dashboard.",
    addNew: "Add New Announcement",
    urlPlaceholder: "Enter image URL (e.g. from Postimages)...",
    add: "Add",
    currentAnnouncements: "Current Announcements",
    noAnnouncements: "No announcements found. Add one above.",
    invalidUrl: "Invalid URL",
    active: "ACTIVE",
    inactive: "INACTIVE",
    addedSuccess: "Announcement added successfully",
    addFailed: "Failed to add announcement",
    statusUpdated: "Status updated",
    statusFailed: "Failed to update status",
    deleteConfirm: "Are you sure you want to delete this announcement?",
    deletedSuccess: "Announcement deleted",
    deleteFailed: "Failed to delete announcement"
  }
};

arDict.admin = {
  courses: {
    title: "إدارة الدورات",
    subtitle: "قم بإنشاء وإدارة دورات النظام",
    addCourse: "+ إضافة دورة",
    all: "الكل",
    children: "أطفال",
    tweens: "يافعين",
    teens: "شباب",
    uploadComplete: "مكتمل الرفع",
    uploadIncomplete: "غير مكتمل الرفع",
    free: "مجاني",
    noCourses: "لا توجد دورات مطابقة",
    saveSuccess: "تم الحفظ بنجاح",
    editCourse: "تعديل الدورة",
    addNewCourse: "إضافة دورة جديدة",
    basicInfo: "البيانات الأساسية",
    courseTitle: "عنوان الدورة",
    targetAge: "الفئة العمرية المستهدفة",
    description: "الوصف",
    price: "السعر (د.ك)",
    instructorName: "اسم المعلم",
    thumbnailUrl: "رابط الصورة المصغرة (Thumbnail URL)",
    cohorts: "المجموعات (Cohorts)",
    cohortPlaceholder: "اسم المجموعة (مثال: الدفعة الأولى)",
    delete: "حذف",
    addCohort: "+ إضافة مجموعة أخرى",
    courseFormat: "نظام الدورة",
    formatVideoOnly: "فيديوهات مسجلة فقط",
    formatVideoOnlyDesc: "لا يوجد لقاءات مباشرة",
    formatZoomOnly: "جلسات افتراضية فقط",
    formatZoomOnlyDesc: "لا يوجد محتوى مسجل",
    formatHybrid: "مدمج (مسجل + جلسات)",
    formatHybridDesc: "محتوى مسجل مع لقاءات تفاعلية",
    recordedStructure: "هيكلة المحتوى المسجل",
    structureShort: "دورة قصيرة",
    structureShortDesc: "قائمة دروس مباشرة (بدون وحدات)",
    structureLong: "دورة طويلة",
    structureLongDesc: "مقسمة إلى وحدات وكل وحدة تحتوي دروس",
    courseContent: "محتوى الدورة",
    virtualSessions: "الجلسات الافتراضية",
    cohort: "مجموعة:",
    recordedContent: "المحتوى المسجل (الدروس)",
    lessonTitlePlaceholder: "عنوان الدرس",
    videoUrlPlaceholder: "رابط الفيديو (اختياري)",
    pdfUrlPlaceholder: "رابط PDF (اختياري)",
    isQuiz: "هل هذا اختبار؟",
    addLesson: "+ إضافة درس جديد",
    unitTitlePlaceholder: "عنوان الوحدة",
    deleteUnit: "حذف الوحدة",
    addUnit: "+ إضافة وحدة جديدة",
    uploadConfirm: "أؤكد اكتمال رفع جميع محتويات الدورة",
    uploadWarning: "تفعيل هذا الخيار سيغير حالة الدورة إلى \"مكتمل الرفع\". لا تقم بتفعيله حتى تتأكد من رفع جميع الدروس وملحقاتها.",
    previous: "السابق",
    deleteConfirm: "هل أنت متأكد من حذف هذه الدورة نهائياً؟",
    deleteCourse: "حذف الدورة",
    next: "التالي",
    saving: "جاري الحفظ...",
    saveCourse: "حفظ الدورة",
    zoomSessionTitle: "عنوان الجلسة الافتراضية",
    zoomLink: "رابط الجلسة (اختياري)",
    addZoomSession: "+ إضافة جلسة افتراضية"
  },
  chats: {
    title: "المحادثات",
    subtitle: "واجهة المحادثات الخاصة بالمشرف العام قيد التطوير."
  },
  settings: {
    title: "إعدادات المشرف العام",
    subtitle: "إدارة تفاصيل حساب المشرف العام وتفضيلات النظام.",
    personalDetails: "البيانات الشخصية",
    changePhoto: "تغيير الصورة",
    photoHint: "JPG, GIF, PNG. كحد أقصى 800K",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    accountRole: "دور الحساب",
    roleSuperAdmin: "مشرف عام (Super Admin)",
    saveChanges: "حفظ التغييرات",
    saving: "جاري الحفظ...",
    security: "الأمان",
    currentPassword: "كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    updatePassword: "تحديث كلمة المرور",
    sessionAndSupport: "الجلسة والدعم",
    logout: "تسجيل الخروج",
    logoutDesc: "تسجيل الخروج من جلستك بشكل آمن.",
    profileUpdated: "تم تحديث الملف الشخصي بنجاح!",
    profileUpdateFailed: "فشل تحديث الملف الشخصي.",
    passwordsMismatch: "كلمات المرور الجديدة غير متطابقة.",
    passwordLength: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
    passwordUpdated: "تم تحديث كلمة المرور بنجاح!",
    passwordUpdateFailed: "فشل تحديث كلمة المرور."
  },
  news: {
    title: "الأخبار والإعلانات",
    subtitle: "إدارة صور الإعلانات الديناميكية المعروضة في لوحة تحكم الطالب.",
    addNew: "إضافة إعلان جديد",
    urlPlaceholder: "أدخل رابط الصورة (مثال: من Postimages)...",
    add: "إضافة",
    currentAnnouncements: "الإعلانات الحالية",
    noAnnouncements: "لا توجد إعلانات. أضف إعلاناً جديداً أعلاه.",
    invalidUrl: "رابط غير صالح",
    active: "نشط",
    inactive: "غير نشط",
    addedSuccess: "تمت إضافة الإعلان بنجاح",
    addFailed: "فشل في إضافة الإعلان",
    statusUpdated: "تم تحديث الحالة",
    statusFailed: "فشل تحديث الحالة",
    deleteConfirm: "هل أنت متأكد أنك تريد حذف هذا الإعلان؟",
    deletedSuccess: "تم حذف الإعلان",
    deleteFailed: "فشل حذف الإعلان"
  }
};

fs.writeFileSync(enPath, JSON.stringify(enDict, null, 2));
fs.writeFileSync(arPath, JSON.stringify(arDict, null, 2));
console.log('Dictionaries updated.');

// helper
function replaceAll(str, mapObj){
    var re = new RegExp(Object.keys(mapObj).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|"),"gi");
    return str.replace(re, function(matched){
        return mapObj[matched.toLowerCase()] || mapObj[matched];
    });
}

// 1. super-admin/courses/page.tsx
const coursesPath = path.join(__dirname, '../src/app/(dashboard)/super-admin/courses/page.tsx');
let coursesStr = fs.readFileSync(coursesPath, 'utf8');
if(!coursesStr.includes('useTranslation')) {
    coursesStr = coursesStr.replace("import axios from '@/lib/axios';", "import axios from '@/lib/axios';\nimport { useTranslation } from '@/i18n/TranslationContext';");
    coursesStr = coursesStr.replace("export default function CoursesPage() {", "export default function CoursesPage() {\n  const { t } = useTranslation();");
    coursesStr = coursesStr.replace("function CourseModal({ onClose, onSuccess, initialData }: { onClose: () => void, onSuccess: () => Promise<void> | void, initialData?: any }) {", "function CourseModal({ onClose, onSuccess, initialData }: { onClose: () => void, onSuccess: () => Promise<void> | void, initialData?: any }) {\n  const { t } = useTranslation();");
    coursesStr = coursesStr.replace("function ZoomSessionsList({ control, register, gIndex }: any) {", "function ZoomSessionsList({ control, register, gIndex }: any) {\n  const { t } = useTranslation();");
    coursesStr = coursesStr.replace("function UnitLessonsList({ control, register, uIndex }: any) {", "function UnitLessonsList({ control, register, uIndex }: any) {\n  const { t } = useTranslation();");
    
    // Replace text
    coursesStr = coursesStr.replace(/>إدارة الدورات<\/h1>/, ">{t('admin.courses.title')}</h1>");
    coursesStr = coursesStr.replace(/>قم بإنشاء وإدارة دورات النظام<\/p>/, ">{t('admin.courses.subtitle')}</p>");
    coursesStr = coursesStr.replace(/>\s*\+ إضافة دورة\s*<\/button>/, ">{t('admin.courses.addCourse')}</button>");
    
    coursesStr = coursesStr.replace(/age === 'ALL' \? 'الكل' : age === 'CHILDREN' \? 'أطفال' : age === 'TWEENS' \? 'يافعين' : 'شباب'/g, "age === 'ALL' ? t('admin.courses.all') : age === 'CHILDREN' ? t('admin.courses.children') : age === 'TWEENS' ? t('admin.courses.tweens') : t('admin.courses.teens')");
    coursesStr = coursesStr.replace(/>مكتمل الرفع</g, ">{t('admin.courses.uploadComplete')}<");
    coursesStr = coursesStr.replace(/>غير مكتمل الرفع</g, ">{t('admin.courses.uploadIncomplete')}<");
    coursesStr = coursesStr.replace(/course\.is_upload_completed \? 'مكتمل الرفع' : 'غير مكتمل الرفع'/g, "course.is_upload_completed ? t('admin.courses.uploadComplete') : t('admin.courses.uploadIncomplete')");
    coursesStr = coursesStr.replace(/`\$\{course.price\} د.ك` : 'مجاني'/g, "`\${course.price} KD` : t('admin.courses.free')");
    coursesStr = coursesStr.replace(/لا توجد دورات مطابقة/g, "{t('admin.courses.noCourses')}");
    coursesStr = coursesStr.replace(/alert\("تم الحفظ بنجاح"\)/g, "alert(t('admin.courses.saveSuccess'))");
    coursesStr = coursesStr.replace(/'تعديل الدورة' : 'إضافة دورة جديدة'/g, "t('admin.courses.editCourse') : t('admin.courses.addNewCourse')");
    
    // Modal
    coursesStr = coursesStr.replace(/>البيانات الأساسية</g, ">{t('admin.courses.basicInfo')}<");
    coursesStr = coursesStr.replace(/>عنوان الدورة</g, ">{t('admin.courses.courseTitle')}<");
    coursesStr = coursesStr.replace(/>الفئة العمرية المستهدفة</g, ">{t('admin.courses.targetAge')}<");
    coursesStr = coursesStr.replace(/>الكل</g, ">{t('admin.courses.all')}<");
    coursesStr = coursesStr.replace(/>أطفال</g, ">{t('admin.courses.children')}<");
    coursesStr = coursesStr.replace(/>يافعين</g, ">{t('admin.courses.tweens')}<");
    coursesStr = coursesStr.replace(/>شباب</g, ">{t('admin.courses.teens')}<");
    coursesStr = coursesStr.replace(/>الوصف</g, ">{t('admin.courses.description')}<");
    coursesStr = coursesStr.replace(/>السعر \(د\.ك\)</g, ">{t('admin.courses.price')}<");
    coursesStr = coursesStr.replace(/>اسم المعلم</g, ">{t('admin.courses.instructorName')}<");
    coursesStr = coursesStr.replace(/>رابط الصورة المصغرة \(Thumbnail URL\)</g, ">{t('admin.courses.thumbnailUrl')}<");
    coursesStr = coursesStr.replace(/>المجموعات \(Cohorts\)</g, ">{t('admin.courses.cohorts')}<");
    coursesStr = coursesStr.replace(/placeholder="اسم المجموعة \(مثال: الدفعة الأولى\)"/g, "placeholder={t('admin.courses.cohortPlaceholder')}");
    coursesStr = coursesStr.replace(/>حذف</g, ">{t('admin.courses.delete')}<");
    coursesStr = coursesStr.replace(/>\+ إضافة مجموعة أخرى</g, ">{t('admin.courses.addCohort')}<");
    
    // Format
    coursesStr = coursesStr.replace(/>نظام الدورة</g, ">{t('admin.courses.courseFormat')}<");
    coursesStr = coursesStr.replace(/'فيديوهات مسجلة فقط'/g, "t('admin.courses.formatVideoOnly')");
    coursesStr = coursesStr.replace(/'لا يوجد لقاءات مباشرة'/g, "t('admin.courses.formatVideoOnlyDesc')");
    coursesStr = coursesStr.replace(/'جلسات افتراضية فقط'/g, "t('admin.courses.formatZoomOnly')");
    coursesStr = coursesStr.replace(/'لا يوجد محتوى مسجل'/g, "t('admin.courses.formatZoomOnlyDesc')");
    coursesStr = coursesStr.replace(/'مدمج \(مسجل \+ جلسات\)'/g, "t('admin.courses.formatHybrid')");
    coursesStr = coursesStr.replace(/'محتوى مسجل مع لقاءات تفاعلية'/g, "t('admin.courses.formatHybridDesc')");
    
    coursesStr = coursesStr.replace(/>هيكلة المحتوى المسجل</g, ">{t('admin.courses.recordedStructure')}<");
    coursesStr = coursesStr.replace(/'دورة قصيرة'/g, "t('admin.courses.structureShort')");
    coursesStr = coursesStr.replace(/'قائمة دروس مباشرة \(بدون وحدات\)'/g, "t('admin.courses.structureShortDesc')");
    coursesStr = coursesStr.replace(/'دورة طويلة'/g, "t('admin.courses.structureLong')");
    coursesStr = coursesStr.replace(/'مقسمة إلى وحدات وكل وحدة تحتوي دروس'/g, "t('admin.courses.structureLongDesc')");
    
    coursesStr = coursesStr.replace(/>محتوى الدورة</g, ">{t('admin.courses.courseContent')}<");
    coursesStr = coursesStr.replace(/>الجلسات الافتراضية</g, ">{t('admin.courses.virtualSessions')}<");
    coursesStr = coursesStr.replace(/مجموعة: /g, "{t('admin.courses.cohort')} ");
    coursesStr = coursesStr.replace(/>المحتوى المسجل \(الدروس\)</g, ">{t('admin.courses.recordedContent')}<");
    
    coursesStr = coursesStr.replace(/placeholder="عنوان الدرس"/g, "placeholder={t('admin.courses.lessonTitlePlaceholder')}");
    coursesStr = coursesStr.replace(/placeholder="رابط الفيديو \(اختياري\)"/g, "placeholder={t('admin.courses.videoUrlPlaceholder')}");
    coursesStr = coursesStr.replace(/placeholder="رابط PDF \(اختياري\)"/g, "placeholder={t('admin.courses.pdfUrlPlaceholder')}");
    coursesStr = coursesStr.replace(/هل هذا اختبار؟/g, "{t('admin.courses.isQuiz')}");
    coursesStr = coursesStr.replace(/>\+ إضافة درس جديد</g, ">{t('admin.courses.addLesson')}<");
    coursesStr = coursesStr.replace(/placeholder={`عنوان الوحدة \$\{uIndex\+1\}`}/g, "placeholder={t('admin.courses.unitTitlePlaceholder')}");
    coursesStr = coursesStr.replace(/>حذف الوحدة</g, ">{t('admin.courses.deleteUnit')}<");
    coursesStr = coursesStr.replace(/>\+ إضافة وحدة جديدة</g, ">{t('admin.courses.addUnit')}<");
    
    coursesStr = coursesStr.replace(/>أؤكد اكتمال رفع جميع محتويات الدورة</g, ">{t('admin.courses.uploadConfirm')}<");
    coursesStr = coursesStr.replace(/>تفعيل هذا الخيار سيغير حالة الدورة إلى "مكتمل الرفع"\. لا تقم بتفعيله حتى تتأكد من رفع جميع الدروس وملحقاتها\.</g, ">{t('admin.courses.uploadWarning')}<");
    
    coursesStr = coursesStr.replace(/>السابق</g, ">{t('admin.courses.previous')}<");
    coursesStr = coursesStr.replace(/confirm\('هل أنت متأكد من حذف هذه الدورة نهائياً؟'\)/g, "confirm(t('admin.courses.deleteConfirm'))");
    coursesStr = coursesStr.replace(/>حذف الدورة</g, ">{t('admin.courses.deleteCourse')}<");
    coursesStr = coursesStr.replace(/>التالي</g, ">{t('admin.courses.next')}<");
    coursesStr = coursesStr.replace(/'جاري الحفظ\.\.\.' : 'حفظ الدورة'/g, "t('admin.courses.saving') : t('admin.courses.saveCourse')");
    
    coursesStr = coursesStr.replace(/placeholder="عنوان الجلسة الافتراضية"/g, "placeholder={t('admin.courses.zoomSessionTitle')}");
    coursesStr = coursesStr.replace(/placeholder="رابط الجلسة \(اختياري\)"/g, "placeholder={t('admin.courses.zoomLink')}");
    coursesStr = coursesStr.replace(/>\+ إضافة جلسة افتراضية</g, ">{t('admin.courses.addZoomSession')}<");
    coursesStr = coursesStr.replace(/>\+ إضافة درس</g, ">{t('admin.courses.addLesson')}<");
    coursesStr = coursesStr.replace(/placeholder="رابط الفيديو"/g, "placeholder={t('admin.courses.videoUrlPlaceholder')}");
    coursesStr = coursesStr.replace(/placeholder="رابط PDF"/g, "placeholder={t('admin.courses.pdfUrlPlaceholder')}");
    coursesStr = coursesStr.replace(/\s*اختبار؟/g, " {t('admin.courses.isQuiz')}");
    
    fs.writeFileSync(coursesPath, coursesStr);
}

// 2. super-admin/chats/page.tsx
const chatsPath = path.join(__dirname, '../src/app/(dashboard)/super-admin/chats/page.tsx');
let chatsStr = fs.readFileSync(chatsPath, 'utf8');
if(!chatsStr.includes('useTranslation')) {
    chatsStr = chatsStr.replace("import { MessageSquare } from 'lucide-react';", "import { MessageSquare } from 'lucide-react';\nimport { useTranslation } from '@/i18n/TranslationContext';");
    chatsStr = chatsStr.replace("export default function SuperAdminChatsPage() {", "export default function SuperAdminChatsPage() {\n  const { t } = useTranslation();");
    chatsStr = chatsStr.replace("المحادثات", "{t('admin.chats.title')}");
    chatsStr = chatsStr.replace("واجهة المحادثات الخاصة بالمشرف العام قيد التطوير.", "{t('admin.chats.subtitle')}");
    fs.writeFileSync(chatsPath, chatsStr);
}

// 3. super-admin/settings/page.tsx
const settingsPath = path.join(__dirname, '../src/app/(dashboard)/super-admin/settings/page.tsx');
let settingsStr = fs.readFileSync(settingsPath, 'utf8');
if(!settingsStr.includes('useTranslation')) {
    settingsStr = settingsStr.replace("import { DJANGO_API } from '@/lib/api-config';", "import { DJANGO_API } from '@/lib/api-config';\nimport { useTranslation } from '@/i18n/TranslationContext';");
    settingsStr = settingsStr.replace("export default function SuperAdminSettingsPage() {", "export default function SuperAdminSettingsPage() {\n  const { t } = useTranslation();");
    
    settingsStr = settingsStr.replace("'تم تحديث الملف الشخصي بنجاح!'", "t('admin.settings.profileUpdated')");
    settingsStr = settingsStr.replace("'فشل تحديث الملف الشخصي.'", "t('admin.settings.profileUpdateFailed')");
    settingsStr = settingsStr.replace("'كلمات المرور الجديدة غير متطابقة.'", "t('admin.settings.passwordsMismatch')");
    settingsStr = settingsStr.replace("'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.'", "t('admin.settings.passwordLength')");
    settingsStr = settingsStr.replace("'تم تحديث كلمة المرور بنجاح!'", "t('admin.settings.passwordUpdated')");
    settingsStr = settingsStr.replace("'فشل تحديث كلمة المرور.'", "t('admin.settings.passwordUpdateFailed')");
    
    settingsStr = settingsStr.replace(/>إعدادات المشرف العام<\/h1>/, ">{t('admin.settings.title')}</h1>");
    settingsStr = settingsStr.replace(/>إدارة تفاصيل حساب المشرف العام وتفضيلات النظام\.<\/p>/, ">{t('admin.settings.subtitle')}</p>");
    
    settingsStr = settingsStr.replace(/البيانات الشخصية/g, "{t('admin.settings.personalDetails')}");
    settingsStr = settingsStr.replace(/>تغيير الصورة<\/button>/, ">{t('admin.settings.changePhoto')}</button>");
    settingsStr = settingsStr.replace(/>JPG, GIF, PNG\. كحد أقصى 800K<\/p>/, ">{t('admin.settings.photoHint')}</p>");
    
    settingsStr = settingsStr.replace(/>الاسم الكامل<\/label>/, ">{t('admin.settings.fullName')}</label>");
    settingsStr = settingsStr.replace(/>البريد الإلكتروني<\/label>/, ">{t('admin.settings.email')}</label>");
    settingsStr = settingsStr.replace(/>دور الحساب<\/label>/, ">{t('admin.settings.accountRole')}</label>");
    settingsStr = settingsStr.replace(/value="مشرف عام \(Super Admin\)"/, "value={t('admin.settings.roleSuperAdmin')}");
    settingsStr = settingsStr.replace(/> حفظ التغييرات<\/button>/, "> {t('admin.settings.saveChanges')}</button>");
    
    settingsStr = settingsStr.replace(/الأمان/g, "{t('admin.settings.security')}");
    settingsStr = settingsStr.replace(/>كلمة المرور الحالية<\/label>/, ">{t('admin.settings.currentPassword')}</label>");
    settingsStr = settingsStr.replace(/>كلمة المرور الجديدة<\/label>/, ">{t('admin.settings.newPassword')}</label>");
    settingsStr = settingsStr.replace(/>تأكيد كلمة المرور<\/label>/, ">{t('admin.settings.confirmPassword')}</label>");
    settingsStr = settingsStr.replace(/> تحديث كلمة المرور<\/button>/, "> {t('admin.settings.updatePassword')}</button>");
    
    settingsStr = settingsStr.replace(/الجلسة والدعم/g, "{t('admin.settings.sessionAndSupport')}");
    settingsStr = settingsStr.replace(/>تسجيل الخروج<\/h3>/, ">{t('admin.settings.logout')}</h3>");
    settingsStr = settingsStr.replace(/>تسجيل الخروج من جلستك بشكل آمن\.<\/p>/, ">{t('admin.settings.logoutDesc')}</p>");
    settingsStr = settingsStr.replace(/> تسجيل الخروج<\/button>/, "> {t('admin.settings.logout')}</button>");
    
    fs.writeFileSync(settingsPath, settingsStr);
}

// 4. super-admin/news/page.tsx
const newsPath = path.join(__dirname, '../src/app/(dashboard)/super-admin/news/page.tsx');
let newsStr = fs.readFileSync(newsPath, 'utf8');
if(!newsStr.includes('useTranslation')) {
    newsStr = newsStr.replace("import Toast, { ToastType } from '@/components/ui/Toast';", "import Toast, { ToastType } from '@/components/ui/Toast';\nimport { useTranslation } from '@/i18n/TranslationContext';");
    newsStr = newsStr.replace("export default function SuperAdminNewsPage() {", "export default function SuperAdminNewsPage() {\n  const { t } = useTranslation();");
    
    newsStr = newsStr.replace("'Announcement added successfully'", "t('admin.news.addedSuccess')");
    newsStr = newsStr.replace("'Failed to add announcement'", "t('admin.news.addFailed')");
    newsStr = newsStr.replace("'Status updated'", "t('admin.news.statusUpdated')");
    newsStr = newsStr.replace("'Failed to update status'", "t('admin.news.statusFailed')");
    newsStr = newsStr.replace(/confirm\('Are you sure you want to delete this announcement\?'\)/, "confirm(t('admin.news.deleteConfirm'))");
    newsStr = newsStr.replace("'Announcement deleted'", "t('admin.news.deletedSuccess')");
    newsStr = newsStr.replace("'Failed to delete announcement'", "t('admin.news.deleteFailed')");
    
    newsStr = newsStr.replace(/>News & Announcements<\/h1>/, ">{t('admin.news.title')}</h1>");
    newsStr = newsStr.replace(/>Manage the dynamic hero slider images shown on the student dashboard\.<\/p>/, ">{t('admin.news.subtitle')}</p>");
    newsStr = newsStr.replace(/Add New Announcement/g, "{t('admin.news.addNew')}");
    newsStr = newsStr.replace(/placeholder="Enter image URL \(e\.g\. from Postimages\)\.\.\."/, "placeholder={t('admin.news.urlPlaceholder')}");
    newsStr = newsStr.replace(/>\s*Add\s*<\/button>/, "> {t('admin.news.add')}</button>");
    
    newsStr = newsStr.replace(/>Current Announcements<\/h2>/, ">{t('admin.news.currentAnnouncements')}</h2>");
    newsStr = newsStr.replace(/>No announcements found\. Add one above\.<\/div>/, ">{t('admin.news.noAnnouncements')}</div>");
    newsStr = newsStr.replace(/>Invalid URL<\/text>/, ">{t('admin.news.invalidUrl')}</text>");
    
    newsStr = newsStr.replace(/'ACTIVE' : 'INACTIVE'/g, "t('admin.news.active') : t('admin.news.inactive')");
    
    fs.writeFileSync(newsPath, newsStr);
}

console.log('Pages updated successfully.');
