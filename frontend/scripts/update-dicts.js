const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/i18n/dictionaries/en.json');
const arPath = path.join(__dirname, '../src/i18n/dictionaries/ar.json');

const enDict = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arDict = JSON.parse(fs.readFileSync(arPath, 'utf8'));

enDict.settings = {
    title: 'Profile & Settings',
    subtitle: 'Manage your account details and personalization preferences.',
    personalDetails: 'Personal Details',
    fullName: 'Full Name',
    email: 'Email Address',
    role: 'Account Role',
    studentRole: 'Student',
    saveChanges: 'Save Changes',
    security: 'Security',
    currentPass: 'Current Password',
    newPass: 'New Password',
    confirmPass: 'Confirm Password',
    updatePass: 'Update Password',
    preferences: 'Preferences',
    appearance: 'Appearance',
    appearanceDesc: 'Toggle between dark and light mode.',
    language: 'Language',
    languageDesc: 'Select your preferred platform language.',
    parentAccount: 'Link Parent Account',
    parentAccountDesc: 'Enter your parent\'s email to link their account.',
    parentEmail: 'Parent Email',
    supportAndLogout: 'Support & Session',
    contactSupportBtn: 'Contact Technical Support',
    contactSupportDesc: 'Need help? Reach out to our technical support team.',
    logoutBtn: 'Log Out',
    logoutDesc: 'Sign out of your session securely.'
};

arDict.settings = {
    title: 'الملف الشخصي والإعدادات',
    subtitle: 'إدارة تفاصيل حسابك وتفضيلات التخصيص.',
    personalDetails: 'البيانات الشخصية',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    role: 'دور الحساب',
    studentRole: 'طالب',
    saveChanges: 'حفظ التغييرات',
    security: 'الأمان',
    currentPass: 'كلمة المرور الحالية',
    newPass: 'كلمة المرور الجديدة',
    confirmPass: 'تأكيد كلمة المرور',
    updatePass: 'تحديث كلمة المرور',
    preferences: 'التفضيلات',
    appearance: 'المظهر',
    appearanceDesc: 'التبديل بين الوضع الداكن والفاتح.',
    language: 'اللغة',
    languageDesc: 'اختر لغة المنصة المفضلة لديك.',
    parentAccount: 'حساب ولي الأمر',
    parentAccountDesc: 'أدخل البريد الإلكتروني لولي أمرك لربط حسابه.',
    parentEmail: 'البريد الإلكتروني لولي الأمر',
    supportAndLogout: 'الدعم الفني والجلسة',
    contactSupportBtn: 'التواصل مع الدعم الفني',
    contactSupportDesc: 'هل تحتاج إلى مساعدة؟ تواصل مع فريق الدعم الفني لدينا.',
    logoutBtn: 'تسجيل الخروج',
    logoutDesc: 'تسجيل الخروج من جلستك بشكل آمن.'
};

fs.writeFileSync(enPath, JSON.stringify(enDict, null, 2));
fs.writeFileSync(arPath, JSON.stringify(arDict, null, 2));

console.log('Added settings to dictionaries.');
