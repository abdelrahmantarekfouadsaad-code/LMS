const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/i18n/dictionaries/en.json');
const arPath = path.join(__dirname, '../src/i18n/dictionaries/ar.json');

const enDict = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arDict = JSON.parse(fs.readFileSync(arPath, 'utf8'));

enDict.login = {
  invalidCreds: "Invalid credentials. Please verify your email and password.",
  title: "Noor Al-Nubuwwah",
  subtitle: "Empowering the next generation with authentic Islamic knowledge and modern technology.",
  welcomeBack: "Welcome Back",
  signInToAccount: "Please sign in to your account",
  emailOrId: "Email / National ID",
  emailPlaceholder: "student@example.com",
  password: "Password",
  rememberMe: "Remember me",
  forgotPassword: "Forgot password?",
  signIn: "Sign In",
  orContinueWith: "Or continue with",
  continueWithGoogle: "Continue with Google",
  parentSetup: "Parent Setup",
  dontHaveAccount: "Don't have an account?",
  signUp: "Sign up"
};

arDict.login = {
  invalidCreds: "بيانات الاعتماد غير صالحة. يرجى التحقق من بريدك الإلكتروني وكلمة المرور.",
  title: "نور النبوة",
  subtitle: "تمكين الجيل القادم بالمعرفة الإسلامية الأصيلة والتكنولوجيا الحديثة.",
  welcomeBack: "مرحباً بعودتك",
  signInToAccount: "يرجى تسجيل الدخول إلى حسابك",
  emailOrId: "البريد الإلكتروني / الرقم القومي",
  emailPlaceholder: "student@example.com",
  password: "كلمة المرور",
  rememberMe: "تذكرني",
  forgotPassword: "هل نسيت كلمة المرور؟",
  signIn: "تسجيل الدخول",
  orContinueWith: "أو المتابعة باستخدام",
  continueWithGoogle: "المتابعة باستخدام جوجل",
  parentSetup: "إعداد حساب ولي الأمر",
  dontHaveAccount: "ليس لديك حساب؟",
  signUp: "سجل الآن"
};

fs.writeFileSync(enPath, JSON.stringify(enDict, null, 2));
fs.writeFileSync(arPath, JSON.stringify(arDict, null, 2));

const loginPath = path.join(__dirname, '../src/app/login/page.tsx');
let content = fs.readFileSync(loginPath, 'utf8');

// Imports
content = content.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport { useTranslation } from '@/i18n/TranslationContext';");

// Hook
content = content.replace("const router = useRouter();", "const router = useRouter();\n  const { t } = useTranslation();");

// Replacements
content = content.replace("'Invalid credentials. Please verify your email and password.'", "t('login.invalidCreds')");
content = content.replace("Noor Al-Nubuwwah", "{t('login.title')}");
content = content.replace("Empowering the next generation with authentic Islamic knowledge and modern technology.", "{t('login.subtitle')}");
content = content.replace("Welcome Back", "{t('login.welcomeBack')}");
content = content.replace("Please sign in to your account", "{t('login.signInToAccount')}");
content = content.replace("Email / National ID", "{t('login.emailOrId')}");
content = content.replace('placeholder="student@example.com"', 'placeholder={t(\'login.emailPlaceholder\')}');
content = content.replace(/>\s*Password\s*<\/label>/g, ">{t('login.password')}</label>");
content = content.replace("Remember me", "{t('login.rememberMe')}");
content = content.replace("Forgot password?", "{t('login.forgotPassword')}");
content = content.replace("'Sign In'", "t('login.signIn')");
content = content.replace("Or continue with", "{t('login.orContinueWith')}");
content = content.replace("Continue with Google", "{t('login.continueWithGoogle')}");
content = content.replace("Parent Setup / إعداد حساب ولي الأمر", "{t('login.parentSetup')}");
content = content.replace("Don&apos;t have an account?", "{t('login.dontHaveAccount')}");
content = content.replace("Sign up (ليس لديك حساب؟ سجل الآن)", "{t('login.signUp')}");

fs.writeFileSync(loginPath, content, 'utf8');
console.log('Login page fully extracted and updated.');
