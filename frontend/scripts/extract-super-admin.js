const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/i18n/dictionaries/en.json');
const arPath = path.join(__dirname, '../src/i18n/dictionaries/ar.json');

const enDict = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arDict = JSON.parse(fs.readFileSync(arPath, 'utf8'));

enDict.finance = {
  title: "Finance Management Dashboard - Under Construction",
  subtitle: "We are currently developing an advanced interface to manage financial resources, track revenue, and analyze sales data easily.",
  comingSoon: "Coming Soon"
};

arDict.finance = {
  title: "لوحة الإدارة المالية - تحت التطوير",
  subtitle: "نعمل حالياً على تطوير واجهة متقدمة لإدارة الموارد المالية، تتبع الإيرادات، وتحليل بيانات المبيعات بكل سهولة.",
  comingSoon: "قريباً (Coming Soon)"
};

enDict.users = {
  title: "User Management",
  subtitle: "Manage all users, roles, and platform access.",
  searchPlaceholder: "Search users by name or email...",
  loading: "Loading users...",
  noUsers: "No users found.",
  changeRole: "Change Role",
  updateRole: "Update Role",
  modifyAccess: "Modify access level for",
  newRole: "New Role",
  studentEmail: "Student Email",
  newParentPassword: "New Parent Password",
  cancel: "Cancel",
  saveChanges: "Save Changes",
  saving: "Saving...",
  user: "User",
  ageGroup: "Age / Group",
  role: "Role",
  actions: "Actions",
  strictParentVerification: "Strict Parent Verification Required",
  failedToLoadStats: "Failed to load statistics",
  attendance: "Attendance",
  avgExamScore: "Avg Exam Score",
  overallProgress: "Overall Progress",
  projectsDone: "Projects Done",
  enrolledCourses: "Enrolled Courses",
  noActiveEnrollments: "No active enrollments."
};

arDict.users = {
  title: "إدارة المستخدمين",
  subtitle: "إدارة جميع المستخدمين، الأدوار، وصلاحيات المنصة.",
  searchPlaceholder: "ابحث بالاسم أو البريد...",
  loading: "جاري تحميل المستخدمين...",
  noUsers: "لم يتم العثور على مستخدمين.",
  changeRole: "تغيير الدور",
  updateRole: "تحديث الدور",
  modifyAccess: "تعديل مستوى الوصول لـ",
  newRole: "الدور الجديد",
  studentEmail: "البريد الإلكتروني للطالب",
  newParentPassword: "كلمة مرور ولي الأمر الجديدة",
  cancel: "إلغاء",
  saveChanges: "حفظ التغييرات",
  saving: "جاري الحفظ...",
  user: "المستخدم",
  ageGroup: "العمر / الفئة",
  role: "الدور",
  actions: "الإجراءات",
  strictParentVerification: "مطلوب تحقق صارم لولي الأمر",
  failedToLoadStats: "فشل في تحميل الإحصائيات",
  attendance: "الحضور",
  avgExamScore: "متوسط درجات الامتحان",
  overallProgress: "التقدم العام",
  projectsDone: "المشاريع المنجزة",
  enrolledCourses: "الدورات المسجلة",
  noActiveEnrollments: "لا توجد اشتراكات نشطة."
};

fs.writeFileSync(enPath, JSON.stringify(enDict, null, 2));
fs.writeFileSync(arPath, JSON.stringify(arDict, null, 2));

console.log('Dictionaries updated.');

// Update finance page
const financePath = path.join(__dirname, '../src/app/(dashboard)/super-admin/finance/page.tsx');
let financeContent = fs.readFileSync(financePath, 'utf8');

if (!financeContent.includes('useTranslation')) {
  financeContent = financeContent.replace("import { motion } from 'framer-motion';", "import { motion } from 'framer-motion';\nimport { useTranslation } from '@/i18n/TranslationContext';");
  financeContent = financeContent.replace("export default function SuperAdminFinancePage() {", "export default function SuperAdminFinancePage() {\n  const { t } = useTranslation();");
  
  financeContent = financeContent.replace(/<h1[^>]*>\s*لوحة الإدارة المالية - تحت التطوير\s*<\/h1>/g, '<h1 className="text-3xl font-extrabold text-white mb-4 tracking-tight">{t(\'finance.title\')}</h1>');
  financeContent = financeContent.replace(/<p className="text-slate-400[^>]*>\s*نعمل حالياً على تطوير واجهة متقدمة لإدارة الموارد المالية، تتبع الإيرادات، وتحليل بيانات المبيعات بكل سهولة\.\s*<\/p>/g, '<p className="text-slate-400 text-lg leading-relaxed max-w-lg mx-auto">{t(\'finance.subtitle\')}</p>');
  financeContent = financeContent.replace(/<p className="text-slate-500[^>]*>\s*Finance Management Dashboard - Under Construction\s*<\/p>/g, '');
  financeContent = financeContent.replace(/قريباً \(Coming Soon\)/g, "{t('finance.comingSoon')}");
  
  fs.writeFileSync(financePath, financeContent);
  console.log('Finance page updated.');
}

// Update users page
const usersPath = path.join(__dirname, '../src/app/(dashboard)/super-admin/users/page.tsx');
let usersContent = fs.readFileSync(usersPath, 'utf8');

if (!usersContent.includes('useTranslation')) {
  usersContent = usersContent.replace("import { Search", "import { useTranslation } from '@/i18n/TranslationContext';\nimport { Search");
  usersContent = usersContent.replace("export default function SuperAdminUsersPage() {", "export default function SuperAdminUsersPage() {\n  const { t } = useTranslation();");
  
  usersContent = usersContent.replace("إدارة المستخدمين", "{t('users.title')}");
  usersContent = usersContent.replace("Manage all users, roles, and platform access.", "{t('users.subtitle')}");
  usersContent = usersContent.replace('placeholder="ابحث بالاسم أو البريد..."', 'placeholder={t(\'users.searchPlaceholder\')}');
  usersContent = usersContent.replace(/>User<\/th>/g, ">{t('users.user')}</th>");
  usersContent = usersContent.replace(/>Age \/ Group<\/th>/g, ">{t('users.ageGroup')}</th>");
  usersContent = usersContent.replace(/>Role<\/th>/g, ">{t('users.role')}</th>");
  usersContent = usersContent.replace(/>Actions<\/th>/g, ">{t('users.actions')}</th>");
  usersContent = usersContent.replace("Loading users...", "{t('users.loading')}");
  usersContent = usersContent.replace("No users found.", "{t('users.noUsers')}");
  usersContent = usersContent.replace(/>Change Role<\/span>/g, ">{t('users.changeRole')}</span>");
  usersContent = usersContent.replace(/>Update Role<\/h3>/g, ">{t('users.updateRole')}</h3>");
  usersContent = usersContent.replace(/Modify access level for/g, "{t('users.modifyAccess')}");
  usersContent = usersContent.replace(/>New Role<\/label>/g, ">{t('users.newRole')}</label>");
  usersContent = usersContent.replace(/>Student Email<\/label>/g, ">{t('users.studentEmail')}</label>");
  usersContent = usersContent.replace(/>New Parent Password<\/label>/g, ">{t('users.newParentPassword')}</label>");
  usersContent = usersContent.replace(/>Cancel<\/button>/g, ">{t('users.cancel')}</button>");
  usersContent = usersContent.replace(/\{roleChangeLoading \? 'Saving\.\.\.' : 'Save Changes'\}/g, "{roleChangeLoading ? t('users.saving') : t('users.saveChanges')}");
  
  usersContent = usersContent.replace("Strict Parent Verification Required", "{t('users.strictParentVerification')}");
  usersContent = usersContent.replace("Failed to load statistics", "{t('users.failedToLoadStats')}");
  usersContent = usersContent.replace(">Attendance</p>", ">{t('users.attendance')}</p>");
  usersContent = usersContent.replace(">Avg Exam Score</p>", ">{t('users.avgExamScore')}</p>");
  usersContent = usersContent.replace(">Overall Progress</p>", ">{t('users.overallProgress')}</p>");
  usersContent = usersContent.replace(">Projects Done</p>", ">{t('users.projectsDone')}</p>");
  usersContent = usersContent.replace(">Enrolled Courses\n", ">{t('users.enrolledCourses')}\n");
  usersContent = usersContent.replace("No active enrollments.", "{t('users.noActiveEnrollments')}");
  
  fs.writeFileSync(usersPath, usersContent);
  console.log('Users page updated.');
}
