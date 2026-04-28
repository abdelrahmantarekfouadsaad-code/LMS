import './globals.css'
import type { Metadata } from 'next'
import { Cairo, Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import AuthProvider from '@/providers/AuthProvider'
// Assuming next-intl setup will wrap this layout or inner components
// import { NextIntlClientProvider } from 'next-intl';

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
  // Dynamic RTL logic. In a real next-intl app, locale comes from params.
  // Defaulting to 'en' LTR if not specified dynamically yet.
  const isArabic = locale === 'ar';
  const direction = isArabic ? 'rtl' : 'ltr';
  const mainFont = isArabic ? cairo.variable : inter.variable;

  return (
    <html lang={locale || 'en'} dir={direction} suppressHydrationWarning>
      <body className={`${mainFont} font-sans bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-300`}>
        {/* ThemeProvider (next-themes) for dark/light switching */}
        <ThemeProvider attribute="class" defaultTheme="dark">
          <AuthProvider>
            {/* The main glass header would go here or in a layout wrapper */}
            <main className="flex-grow">
              {children}
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
