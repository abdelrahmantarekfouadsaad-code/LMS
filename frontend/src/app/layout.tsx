import './globals.css'
import type { Metadata } from 'next'
import { Cairo, Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import AuthProvider from '@/providers/AuthProvider'
import { cookies } from 'next/headers'
import { TranslationProvider } from '@/i18n/TranslationContext'

const cairo = Cairo({ 
  subsets: ['arabic', 'latin'], 
  variable: '--font-cairo',
  display: 'swap'
})

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Noor Al-Nubuwwah LMS',
  description: 'Premium Islamic Sciences and Educational Learning Management System',
}

export default function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode,
  params: { locale: string }
}) {
  // Read persistent cookie from server side to prevent page flicker on refresh
  const cookieStore = cookies();
  const activeLocale = cookieStore.get('NEXT_LOCALE')?.value || locale || 'en';
  const isArabic = activeLocale === 'ar';
  const direction = isArabic ? 'rtl' : 'ltr';
  const mainFont = isArabic ? cairo.variable : inter.variable;

  return (
    <html lang={activeLocale} dir={direction} suppressHydrationWarning>
      <body className={`${mainFont} font-sans bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-300`}>
        {/* ThemeProvider (next-themes) for dark/light switching */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <TranslationProvider initialLocale={activeLocale}>
            <AuthProvider>
              {/* The main glass header would go here or in a layout wrapper */}
              <main className="flex-grow">
                {children}
              </main>
            </AuthProvider>
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
