import { Inter, Vazirmatn } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })
const vazirmatn = Vazirmatn({ subsets: ['arabic'] })

export const metadata = {
  title: 'Aura Task App',
  description: 'A modern task management application',
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    messages = (await import(`../../messages/en.json`)).default;
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={locale === 'fa' ? vazirmatn.className : inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
} 